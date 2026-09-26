import '@fontsource-variable/big-shoulders/opsz.css';
import '@fontsource-variable/archivo/wdth.css';
import './style.css';
import { COLORS, MIN_GROUPS, MAX_GROUPS, STORAGE_KEY, defaultGroups, restoreState, createExpedition, smallestCatch, formatLength } from './randomizer.js';
import { MAX_NAME, cleanName, nameKey, readNameList, crewFromList } from './crew-list.js';
import { LEDGER_KEY, emptyLedger, readLedger, openCast, landCast, cutOpenCasts, heldCast, syncPresented, ledgerLines, foldLines } from './ledger.js';
import { icon } from './icons.js';
import { fishArt } from './fish-art.js';
import { Ocean } from './ocean.js';

const $ = (selector) => document.querySelector(selector);
const bolt = () => '<span class="bolt" aria-hidden="true"></span>';
const escapeHtml = (value) => String(value).replace(/[&<>"']/g, (char) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[char]);
// A boat travels as its number and name together: "05 · Rebase Rangers".
const boatNumber = (index) => String(index + 1).padStart(2, '0');
// No-break spaces keep the number with the first word, so a long name wraps after it, not before.
const boatLabel = (index, name) => `${boatNumber(index)}\u00a0·\u00a0${name}`;
// Chrome reports "macOS", older browsers "MacIntel".
const MOD_KEY = /mac|iphone|ipad/i.test(navigator.userAgentData?.platform || navigator.platform || '') ? '⌘' : 'Ctrl';
const FIRST_RUN_KEY = 'daily-catch-first-run';
let saved = null;
try { saved = restoreState(localStorage.getItem(STORAGE_KEY)); } catch { /* Storage is optional. */ }
// The dock note greets a browser that has never run the game, and stays until the first cast
// or "Got it". A browser that already has boats saved isn't new here.
let firstRun = !saved;
try {
  const seen = localStorage.getItem(FIRST_RUN_KEY);
  firstRun = seen === 'open' || (!seen && !saved);
  if (firstRun) localStorage.setItem(FIRST_RUN_KEY, 'open');
} catch { /* Without storage, every visit is a first one. */ }
let groups = saved?.groups || defaultGroups();
let lastCatch = saved?.lastCatch || null;
// Today's catch: every cast, written down as the lines go in (see ledger.js). A round still in
// the water when the page loads was cut short by a reload; its catch is held until the next cast.
let ledger = emptyLedger();
try { ledger = cutOpenCasts(readLedger(localStorage.getItem(LEDGER_KEY))); } catch { /* Storage is optional. */ }
let catches = [];
let phase = 'idle';
let caughtCount = 0;
let muted = true;
let audioContext;
let toastTimer;
let resultIsPrevious = false;
// The toast's one step back: { before, ledger?, done, refocus } for a reset, a removal or a mark.
let undoStep = null;
// Or the one way on it offers instead: { label, run }, for a round a reload cut short.
let toastOffer = null;
// Mark presented works once the room has seen the name; the verdict is spoken as focus lands.
let verdictIn = false;
let pendingVerdict = null;
let spaceTaken = false;
// The crew as a pasted list: a draft in the Options panel until it's used or cancelled.
let listing = false;
// The ledger's printed lines. A line slams in when its cast is new or its outcome changes, but
// only once the room is back at the dock: behind a reveal it waits (`ledgerQuiet`).
let ledgerQuiet = false;
let ledgerPrimed = false;
let ledgerPrint = [];
let ledgerFresh = new Set();
let ledgerHtml = '';
const ledgerSeen = new Map();

$('#app').innerHTML = `
  <main class="app-shell">
    <div class="spine" aria-hidden="true">${bolt()}<span class="spine-text"><b>CSCD01</b> Tutorial</span>${bolt()}</div>
    <section class="game-card" aria-label="Fishing game">
      <div class="scene-head">
        <h1 class="masthead"><span>The Daily</span> Catch</h1>
        <div class="scene-status"><span class="status-dot"></span><span id="scene-label">AT THE DOCK</span></div>
      </div>
      <div class="scene-tools">
        <button type="button" class="plate-button help-tag" id="help-tag" aria-label="How to play" aria-keyshortcuts="Shift+?" title="How to play (?)"><span class="label" aria-hidden="true">?</span></button>
        <details class="game-options" id="game-options">
          <summary id="options-toggle">${bolt()}<span class="label">Options</span>${icon('chevron', 18)}</summary>
          <div class="options-panel" id="options-panel">
            <div class="crew-heading"><h2 id="crew-title">Boats</h2><button type="button" class="text-button list-open" id="list-open">${icon('list', 18)} Paste a list</button><span class="count-badge" id="group-count">08</span></div>
            <div class="crew-list" id="crew-list" role="group" aria-labelledby="crew-title"></div>
            <div class="list-editor" id="list-editor" hidden>
              <label class="sr-only" for="list-names">Group names, one per line</label>
              <div class="list-sheet"><ol class="list-gutter" id="list-gutter" aria-hidden="true"></ol><textarea id="list-names" wrap="off" spellcheck="false" autocomplete="off" autocapitalize="words" placeholder="Paste your group names here, one per line" aria-describedby="list-status list-help"></textarea></div>
              <p class="list-status" id="list-status"></p>
              <p class="list-help" id="list-help">${MIN_GROUPS} to ${MAX_GROUPS} groups, one per line, up to ${MAX_NAME} characters each. <kbd>${MOD_KEY}</kbd> <kbd>Enter</kbd> uses the list.</p>
              <div class="list-actions"><button type="button" class="plate-button" id="list-apply" aria-keyshortcuts="${MOD_KEY === '⌘' ? 'Meta+Enter' : 'Control+Enter'}">${bolt()}<span class="label">Use these names</span></button><button type="button" class="text-button" id="list-cancel">Cancel</button></div>
            </div>
            <p class="crew-error" id="crew-error" hidden></p>
            <button class="add-button" id="add-group">${icon('plus', 18)} Add a boat <span id="capacity-label">8 / 12</span></button>
            <p class="crew-tip">Tick a boat here, or click its name tag on the board, to mark it presented.</p>
            <div class="crew-footer"><span><span class="ready-dot"></span><span id="ready-count">8</span> ready to cast</span><button class="text-button" id="reset-presented" title="Put every boat back in play and clear today’s catch">Reset presented</button></div>
            <button class="last-catch-button text-button" id="last-catch-button" aria-keyshortcuts="L" ${lastCatch ? '' : 'hidden'}>${icon('fish', 20)} <span id="last-catch-label">View last catch</span> ${icon('arrow', 18)}</button>
            <div class="options-tools">
              <span class="options-tools-label" aria-hidden="true">Sound · Fullscreen</span>
              <div class="scene-actions"><button class="icon-button" id="sound-toggle" aria-label="Turn sound on" aria-pressed="false" title="Turn sound on">${icon('muted', 19)}</button><button class="icon-button" id="fullscreen" aria-label="Enter fullscreen" title="Fullscreen">${icon('expand', 19)}</button></div>
            </div>
          </div>
        </details>
      </div>
      <div class="ocean-viewport" id="ocean-viewport">
        <div class="ocean-world" id="ocean-world">
          <canvas id="ocean" role="img" aria-label="Fishing boats above a fast-moving school of fish. Staggered hooks catch whichever fish they meet."></canvas>
          <div class="boat-labels" id="boat-labels" role="group" aria-label="Boats at the dock. Select a name tag to mark it presented."></div>
        </div>
      </div>
      <div class="cast-callout" aria-hidden="true"><strong>Lines in!</strong><span>Every boat for itself</span></div>
      <div class="hold-stamp" aria-hidden="true"><strong>Lines held</strong><span>Paused<span class="hold-key"> · Space to resume</span></span></div>
      <div class="scene-bottom">
        <span class="depth-gauge"><span class="gauge-key">Depth</span><span class="gauge-value"><span id="depth">0.0</span><small>m</small></span><span id="depth-label">SEA LEVEL</span></span>
        <div class="catch-feed" id="catch-feed" hidden><div class="catch-feed-heading"><span class="catch-feed-label">NO BITES YET</span><span class="catch-feed-count" id="catch-feed-count">0 / 8 HOOKED</span></div><strong id="catch-feed-title">Who’s getting a bite?</strong></div>
        <aside class="dock-note" id="dock-note" aria-labelledby="dock-note-title" ${firstRun ? '' : 'hidden'}>
          <div class="dock-note-head"><p class="eyebrow">First time at the dock?</p><button type="button" class="text-button" id="dock-note-done">Got it</button></div>
          <h2 id="dock-note-title">Every group gets a boat.</h2>
          <p>Cast right away with these, or paste your group names first, one per line. When a group has presented, click its name tag.</p>
          <div class="dock-note-actions"><button type="button" class="plate-button" id="dock-note-paste">${bolt()}<span class="label">Paste group names</span></button><button type="button" class="text-button" id="dock-note-help"><kbd aria-hidden="true">?</kbd> How to play</button></div>
        </aside>
        <section class="ledger" id="ledger" aria-label="Today’s catch" hidden><div class="ledger-lines" id="ledger-lines"></div><div class="ledger-column ledger-probe" id="ledger-probe" aria-hidden="true"></div></section>
      </div>
      <div class="boat-scroll-hint"><span>←</span> Scroll to see every boat <span>→</span></div>
      <div class="game-controls">
        <div class="control-message"><strong id="control-title">Smallest fish presents next.</strong><span id="control-subtitle">8 boats ready to cast.</span></div>
        <div class="cast-actions" id="cast-actions"><button class="lever" id="cast-button" aria-keyshortcuts="Space">${bolt()}<span class="label">Cast the lines</span>${icon('arrow', 26)}</button></div>
        <div class="fishing-actions" id="fishing-actions" hidden><button class="icon-button pause-button" id="pause-button" aria-label="Pause fishing" aria-keyshortcuts="Space">${icon('pause', 24)}</button><button class="plate-button skip-button" id="skip-button" aria-keyshortcuts="R">${bolt()}<span class="label">Reveal catch</span>${icon('skip', 20)}</button></div>
      </div>
    </section>
  </main>

  <dialog id="help-dialog" class="help-dialog" aria-label="How to play"><button class="dialog-close icon-button" data-close="help-dialog" aria-label="Close instructions">${icon('close', 22)}</button><p class="eyebrow">A quick field guide</p><h2>Hook, line <span>&amp; presenter.</span></h2><ol><li><strong>Get your boats ready.</strong> Each group fishes from its own numbered boat. In Options, rename, add or remove boats (2–12), or paste your whole list at once.</li><li><strong>Check off past presenters.</strong> Click a boat’s name tag to mark it presented, or tick it in Options. It stays moored at the dock.</li><li><strong>Cast the lines.</strong> Fish dart through the current while hooks descend at different depths. Any boat can hook any passing fish. Watch them put up a fight!</li><li><strong>Compare the catch.</strong> Smallest fish presents next. Mark that boat presented, then cast again for the next presentation. Every cast is written into today’s catch at the dock, even one thrown back or cut short.</li></ol><div class="fairness-note">${icon('fish', 30)}<p><strong>A fair catch, every time.</strong> Every fish gets a random, unique length before the cast. Hooks catch on contact, regardless of fish size or markings. Every boat in the round has an equal chance of the smallest catch. Reveal catch finishes the same round instantly.</p></div><section class="help-keys" aria-labelledby="keys-title"><h3 id="keys-title">Skipper’s keys</h3><dl><div><dt><kbd>Space</kbd></dt><dd>Cast, pause or resume, from anywhere but a name field.</dd></div><div><dt><kbd>R</kbd></dt><dd>Reveal the catch mid-round, or one a reload cut short.</dd></div><div><dt><kbd>Enter</kbd></dt><dd>Mark the winner presented from the results. Ticks a focused box.</dd></div><div><dt><kbd>L</kbd></dt><dd>Open the last catch at the dock.</dd></div><div><dt><kbd>${MOD_KEY}</kbd><kbd>Z</kbd></dt><dd>Undo a reset, a removed boat, a list or a mark.</dd></div><div><dt><kbd>?</kbd></dt><dd>Open this guide from the board.</dd></div><div><dt><kbd>Esc</kbd></dt><dd>Close a page, a list or Options.</dd></div></dl></section><p class="help-footnote">Boat names, who has presented and today’s catch are saved in this browser, until Reset presented. Sound is optional. With reduced motion, the catch is revealed at once.</p><button class="lever full-width" data-close="help-dialog">${bolt()}<span class="label">Let's go fishing</span>${icon('arrow', 24)}</button><p class="sr-only" role="status" aria-live="polite" aria-atomic="true"></p></dialog>

  <dialog id="results-dialog" class="results-dialog" aria-label="Catch comparison and next presenter" tabindex="-1"><button class="dialog-close icon-button" data-close="results-dialog" aria-label="Close" title="Close">${icon('close', 22)}</button><div class="result-heading" id="result-heading"></div><div class="catch-comparison" id="catch-comparison" role="table" aria-label="Every catch, in boat order"></div><div class="results-actions"><button class="lever" id="mark-presented" aria-keyshortcuts="Enter">${bolt()}<span class="label">Mark presented & return</span>${icon('check', 22)}</button><button class="plate-button" id="results-back" data-close="results-dialog">${bolt()}<span class="label">Back to the boats</span>${icon('arrow', 20)}</button></div><p class="results-footnote">One presenter per round. A fresh catch next time.</p><p class="sr-only" id="results-status" role="status" aria-live="polite" aria-atomic="true"></p></dialog>
  <div class="toast" id="toast"><span id="toast-message" role="status" aria-live="polite" aria-atomic="true"></span><button type="button" class="plate-button toast-undo" id="toast-undo" aria-keyshortcuts="${MOD_KEY === '⌘' ? 'Meta+Z' : 'Control+Z'}" hidden><span class="label">Undo</span></button><button type="button" class="plate-button toast-undo" id="toast-offer" aria-keyshortcuts="R" hidden><span class="label"></span></button></div>
  <span class="sr-only" id="live-status" role="status" aria-live="polite" aria-atomic="true"></span>
`;

function persist() {
  // Any later change to the crew retires the undo on offer.
  if (undoStep) dismissToast();
  // However the latest catch's boat was marked (or unmarked), the ledger follows.
  ledger = syncPresented(ledger, groups);
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify({ groups, lastCatch }));
    localStorage.setItem(LEDGER_KEY, JSON.stringify(ledger));
  } catch { /* The game works without local storage. */ }
}

// A toast that can take the action back, or offers a way on, stays up longer, and holds while
// the TA points at or focuses its plate.
function toast(message, undo = null, offer = null) {
  undoStep = undo;
  toastOffer = offer;
  $('#toast-message').textContent = message;
  $('#toast-undo').hidden = !undo;
  $('#toast-offer').hidden = !offer;
  if (offer) $('#toast-offer .label').textContent = offer.label;
  $('#toast').classList.add('visible');
  armToast(offer ? 12000 : undo ? 8000 : 3500);
}
function armToast(ms) { clearTimeout(toastTimer); toastTimer = setTimeout(dismissToast, ms); }
function dismissToast() {
  clearTimeout(toastTimer);
  undoStep = null;
  toastOffer = null;
  $('#toast').classList.remove('visible');
  // The plates stay printed while the toast fades, but they are already spent.
  toastTimer = setTimeout(() => { $('#toast-undo').hidden = true; $('#toast-offer').hidden = true; }, 250);
}
const snapshot = () => groups.map(group => ({ ...group }));
function runUndo() {
  if (!undoStep || phase !== 'idle') return;
  const { before, ledger: logged, done, refocus } = undoStep;
  const fromButton = document.activeElement === $('#toast-undo');
  groups = before;
  if (logged) ledger = logged;
  persist(); renderCrew();
  toast(done);
  if (fromButton) {
    const target = refocus?.();
    (target?.checkVisibility() && !target.disabled ? target : $('#cast-button')).focus({ preventScroll: true });
  }
}
$('#toast-undo').addEventListener('click', runUndo);
$('#toast-offer').addEventListener('click', () => toastOffer?.run());
for (const plate of [$('#toast-undo'), $('#toast-offer')]) {
  for (const type of ['pointerenter', 'focus', 'pointerleave', 'blur']) {
    plate.addEventListener(type, () => {
      if (!undoStep && !toastOffer) return;
      if (plate.matches(':hover, :focus')) clearTimeout(toastTimer); else armToast(4000);
    });
  }
}

// A modal dialog makes the rest of the page inert, so speak from inside the open one.
function announce(message) { ($('dialog[open] [role="status"]') || $('#live-status')).textContent = message; }
function activeGroups() { return groups.filter(group => !group.excluded); }

const ocean = new Ocean($('#ocean'), {
  onCatch(fish) {
    caughtCount++;
    // The boat's tag turns red for the fight, like its pennant and hook plate.
    document.querySelector(`[data-boat="${CSS.escape(fish.id)}"]`)?.classList.add('is-fighting');
    $('#control-title').textContent = caughtCount === catches.length ? 'All hooked. Bring them home!' : `${boatLabel(fish.lane, fish.name)} — fish on!`;
    $('#control-subtitle').textContent = `${caughtCount} of ${catches.length} fish caught${caughtCount < catches.length ? ' · Following the remaining hooks…' : ' · Reeling in the last catch…'}`;
    $('#catch-feed-title').textContent = boatLabel(fish.lane, fish.name);
    $('#catch-feed-count').textContent = `${caughtCount} / ${catches.length} HOOKED`;
    $('.catch-feed-label').textContent = caughtCount === catches.length ? 'REEL THEM IN' : 'FISH ON!';
    $('.game-card').style.setProperty('--catch-progress', `${caughtCount / catches.length * 100}%`);
    $('.game-card').classList.toggle('is-hauling', caughtCount === catches.length);
    announce(`Boat ${boatNumber(fish.lane)}, ${fish.name}, caught a fish. ${caughtCount} of ${catches.length} caught.`);
    playTone('catch');
  },
  onLand(fish) {
    document.querySelector(`[data-boat="${CSS.escape(fish.id)}"]`)?.classList.remove('is-fighting');
  },
  onLanded() {
    $('#scene-label').textContent = 'AT THE DOCK';
    $('#control-title').textContent = 'All ashore. Measuring up…';
    $('#control-subtitle').textContent = `${catches.length} of ${catches.length} fish landed · Smallest fish presents next.`;
    $('.catch-feed-label').textContent = 'ALL ASHORE';
    announce(`All ${catches.length} fish landed. Measuring the catch.`);
  },
  onFinish() { finishRound(); },
  onDepth(depth) {
    $('#depth').textContent = depth.toFixed(1);
    $('#depth-label').textContent = depth < 0.5 ? 'SEA LEVEL' : depth < 7 ? 'INTO THE BLUE' : 'THE DEEP BLUE';
    // Once the boats slip up out of view, the name tags stay pinned as the dock strip.
    $('.game-card').classList.toggle('is-diving', ocean.camera > 24);
  },
});

const sceneObserver = new ResizeObserver(() => {
  const viewport = $('#ocean-viewport');
  $('.game-card').classList.toggle('has-overflow', viewport.scrollWidth > viewport.clientWidth + 1);
  fitLedger();
});
sceneObserver.observe($('#ocean-viewport'));
sceneObserver.observe($('#ocean-world'));
// The dock drops just far enough for the tallest name tag (see Ocean.setDock).
new ResizeObserver(() => { ocean.setDock($('#boat-labels').offsetTop + $('#boat-labels').offsetHeight); fitLedger(); }).observe($('#boat-labels'));

function renderCrew() {
  const fishing = phase === 'fishing';
  $('#crew-list').innerHTML = groups.map((group, i) => `<div class="crew-row ${group.excluded ? 'excluded' : ''}" data-group-row="${escapeHtml(group.id)}"><span class="boat-number">${String(i + 1).padStart(2, '0')}</span><label class="sr-only" for="name-${escapeHtml(group.id)}">Name for boat ${i + 1}</label><input id="name-${escapeHtml(group.id)}" data-name="${escapeHtml(group.id)}" value="${escapeHtml(group.name)}" maxlength="32" autocomplete="off" spellcheck="false" ${fishing ? 'disabled' : ''}/><label class="presented-hit"><input type="checkbox" class="presented-box" data-present="${escapeHtml(group.id)}" aria-label="${escapeHtml(group.name)} presented" title="Presented" ${group.excluded ? 'checked' : ''} ${fishing ? 'disabled' : ''}/></label><button class="remove-group icon-button" data-remove="${escapeHtml(group.id)}" aria-label="Remove ${escapeHtml(group.name)}" ${fishing || groups.length <= MIN_GROUPS ? 'disabled' : ''}>${icon('close', 18)}</button></div>`).join('');
  // The board prints who has presented and carries no controls of its own: the name tag
  // itself is the toggle, and a presented boat's tag is stamped PRESENTED.
  $('#boat-labels').innerHTML = groups.map((group, i) => `<div class="boat-label ${group.excluded ? 'excluded' : ''}" data-boat="${escapeHtml(group.id)}"><button type="button" class="boat-tag" role="checkbox" aria-checked="${group.excluded}" aria-label="${escapeHtml(group.name)} already presented" data-exclude="${escapeHtml(group.id)}" title="${escapeHtml(boatLabel(i, group.name))}" ${fishing ? 'disabled' : ''}><span class="boat-tag-text"><b class="boat-tag-number">${boatNumber(i)}</b> <span class="boat-name">${escapeHtml(group.name)}</span></span></button><span class="presented-stamp" aria-hidden="true">Presented</span></div>`).join('');
  $('#crew-error').hidden = true;
  $('#ocean-world').style.minWidth = `${Math.max(640, groups.length * 110)}px`;
  $('#boat-labels').style.setProperty('--boats', groups.length);
  $('#group-count').textContent = String(groups.length).padStart(2, '0');
  $('#capacity-label').textContent = `${groups.length} / ${MAX_GROUPS}`;
  $('#ready-count').textContent = activeGroups().length;
  $('#add-group').disabled = fishing || groups.length >= MAX_GROUPS;
  $('#list-open').disabled = fishing;
  if (listing) renderList();
  // Reset presented also clears today's catch, so it stays in reach while the ledger has a line.
  $('#reset-presented').disabled = fishing || (!groups.some(group => group.excluded) && !ledger.casts.length);
  // A round a reload cut short is the latest catch: this is the way to reveal it.
  const held = heldCast(ledger);
  $('#last-catch-button').hidden = !lastCatch && !held;
  $('#last-catch-label').textContent = held ? `Reveal cast ${held.n}` : 'View last catch';
  $('#last-catch-button').disabled = fishing;
  $('#cast-button').disabled = !activeGroups().length;
  if (!fishing) {
    $('#control-title').textContent = activeGroups().length ? 'Smallest fish presents next.' : 'Everyone has presented.';
    $('#control-subtitle').textContent = activeGroups().length ? `${activeGroups().length} ${activeGroups().length === 1 ? 'boat' : 'boats'} ready to cast.` : 'Reset presented in Options to go again.';
  }
  ocean.setGroups(groups);
  renderLedger();
}

// Today's catch, printed on the slip at the dock. Cast numbers are plain figures, so they never
// read as a boat's two-digit number. A struck line is a winner who didn't present; its stamp says why.
const DAY_NAME = new Intl.DateTimeFormat('en', { weekday: 'short' });
const MONTH_NAME = new Intl.DateTimeFormat('en', { month: 'short' });
// The weekday drops away in a narrow column; the date stays.
const dayLabel = (at) => { const date = new Date(at); return `<span class="ledger-weekday">${DAY_NAME.format(date)} </span>${date.getDate()} ${MONTH_NAME.format(date)}`; };
const STAMPS = { 'on-deck': 'On deck', 'thrown-back': 'Thrown back', cut: 'Line cut', held: 'Line cut' };
// What a screen reader hears around the line's boat, name and length.
const SAID = {
  presented: ['', ', presented'],
  'on-deck': ['', ', on deck: not yet marked presented'],
  'thrown-back': ['Thrown back, cast again before it was marked: ', ''],
  cut: ['Line cut by a reload, then cast again. It would have landed ', ''],
};

function ledgerLine(line) {
  if (line.kind === 'day') {
    return `<h2 class="ledger-day${line.today ? ' is-today' : ''}"><span>${line.today ? 'Today’s catch' : 'Earlier catch'}</span> <time datetime="${line.day}">${dayLabel(line.at)}</time></h2>`;
  }
  if (line.kind === 'fold') {
    const { from, to, tally } = line;
    const counts = [[tally.presented, 'presented'], [tally['on-deck'], 'on deck'], [tally['thrown-back'], 'thrown back'], [tally.cut + tally.held, 'line cut']]
      .filter(([count]) => count).map(([count, what], i) => `${i ? '<span aria-hidden="true">·</span> ' : ''}<span${what === 'presented' ? '' : ' class="is-flagged"'}>${count} ${what}</span>`);
    return `<p class="ledger-fold"><span>Casts ${from}–${to}<span class="sr-only">:</span></span> ${counts.join(' ')}</p>`;
  }
  const { cast, outcome } = line;
  const no = `<span class="ledger-no"><span class="sr-only">Cast </span>${cast.n}<span class="sr-only">. </span></span>`;
  const fresh = ledgerFresh.has(cast.n) ? ' is-fresh' : '';
  // A catch the room hasn't seen never prints its winner: not while the lines are in, nor while
  // a round a reload cut short can still be revealed.
  if (outcome === 'held' || outcome === 'open') {
    const out = `${cast.boats} ${cast.boats === 1 ? 'boat' : 'boats'} out`;
    return outcome === 'open'
      ? `<p class="ledger-cast is-held">${no}<span class="ledger-boat" aria-hidden="true"></span><span class="ledger-name">Lines in · ${out}</span></p>`
      : `<p class="ledger-cast is-held${fresh}">${no}<span class="ledger-boat" aria-hidden="true"></span><span class="ledger-name">Catch held · ${out}</span><span class="ledger-stamp" aria-hidden="true">Line cut</span><span class="sr-only">. A reload cut the round short. Reveal it, or cast again.</span></p>`;
  }
  const [before, after] = SAID[outcome];
  // The boat's number as the board prints it now; the number it sailed under if it has left the dock.
  const index = groups.findIndex(group => group.id === cast.winner.id);
  const stamp = STAMPS[outcome] ? `<span class="ledger-stamp" aria-hidden="true">${STAMPS[outcome]}</span>` : '';
  const struck = outcome === 'thrown-back' || outcome === 'cut' ? ' is-struck' : '';
  return `<p class="ledger-cast is-${outcome}${struck}${fresh}">${no}${before ? `<span class="sr-only">${before}</span>` : ''}<b class="ledger-boat">${index >= 0 ? boatNumber(index) : cast.winner.number}</b><span class="ledger-name">${escapeHtml(cast.winner.name)}</span><span class="ledger-length">${formatLength(cast.winner.length)}<small> cm</small></span>${stamp}${after ? `<span class="sr-only">${after}</span>` : ''}</p>`;
}

function renderLedger() {
  ledgerPrint = ledgerLines(ledger);
  $('#ledger').hidden = !ledgerPrint.length;
  const casts = ledgerPrint.filter(line => line.kind === 'cast');
  const loud = ledgerPrimed && !ledgerQuiet && phase === 'idle' && !$('dialog[open]');
  if (loud) {
    // A fresh line slams in once; after that, a refit reprints it still.
    const fresh = ledgerFresh = new Set(casts.filter(line => ledgerSeen.get(line.cast.n) !== line.outcome).map(line => line.cast.n));
    if (fresh.size) setTimeout(() => { if (ledgerFresh === fresh) ledgerFresh = new Set(); }, 1000);
  }
  if (loud || !ledgerPrimed) {
    ledgerSeen.clear();
    casts.forEach(line => ledgerSeen.set(line.cast.n, line.outcome));
    ledgerPrimed = true;
  }
  fitLedger();
}

// The slip keeps under the hooks hanging at the dock and beside the depth gauge (above it on a
// phone). Its lines flow into as many newspaper columns as it takes; when even those can't hold
// them, the oldest casts fold into one line that still counts what they were. It never scrolls.
const LEDGER_COL = { min: 290, max: 360, gap: 18 };
function fitLedger() {
  const slip = $('#ledger'), list = $('#ledger-lines');
  // While the lines are in, the catch feed has the corner.
  if (slip.hidden || phase === 'fishing' || !slip.checkVisibility()) return;
  const area = $('.scene-bottom').getBoundingClientRect(), gauge = $('.depth-gauge');
  const phone = matchMedia('(max-width: 600px)').matches;
  const frame = slip.offsetWidth - list.clientWidth;
  const margin = phone ? 0 : parseFloat(getComputedStyle(slip).marginRight);
  const room = { width: area.width - margin - (phone ? 0 : gauge.offsetWidth + 14) - frame,
    height: Math.max(130, area.bottom - $('#ocean').getBoundingClientRect().top - ocean.openWater - (phone ? gauge.offsetHeight + 10 : 0)) };
  const most = Math.max(1, Math.floor((room.width + LEDGER_COL.gap) / (LEDGER_COL.min + LEDGER_COL.gap)));
  const casts = ledgerPrint.filter(line => line.kind === 'cast').length;
  // Folding a single cast would save nothing, so folds start at two.
  // Lines are measured in a hidden column beside the slip's own, so the printed lines are only
  // rewritten when what they say or where they fall changes.
  const probe = $('#ledger-probe');
  const limit = room.height - (slip.offsetHeight - list.offsetHeight);
  for (let fold = 0; fold <= casts; fold = fold ? fold + 1 : 2) {
    const lines = foldLines(ledgerPrint, fold).map(ledgerLine);
    probe.innerHTML = lines.join('');
    for (let cols = 1; cols <= Math.min(most, lines.length); cols++) {
      // Columns stand on their own, like a newspaper's: a stamped line never stretches its neighbour.
      slip.style.setProperty('--col', `${Math.min(LEDGER_COL.max, Math.floor((room.width - (cols - 1) * LEDGER_COL.gap) / cols))}px`);
      const heights = [...probe.children].map(line => line.offsetHeight);
      const columns = [[]];
      let filled = 0;
      heights.forEach((height, i) => {
        // A day rule never ends a column: it goes over with the line it heads.
        const needs = probe.children[i].matches('.ledger-day') ? height + (heights[i + 1] || 0) : height;
        if (filled + needs > limit && columns.at(-1).length) { columns.push([]); filled = 0; }
        columns.at(-1).push(lines[i]);
        filled += height;
      });
      if (columns.length > cols || filled > limit) continue;
      const html = columns.map(column => `<div class="ledger-column">${column.join('')}</div>`).join('');
      if (html !== ledgerHtml) { list.innerHTML = html; ledgerHtml = html; }
      probe.innerHTML = '';
      return;
    }
  }
  probe.innerHTML = '';
}

$('#crew-list').addEventListener('change', (event) => {
  const box = event.target.closest('[data-present]');
  if (box) { setPresented(box.dataset.present, box.checked, 'data-present'); return; }
  const input = event.target.closest('[data-name]');
  if (!input || phase !== 'idle') return;
  const group = groups.find(group => group.id === input.dataset.name);
  let name = cleanName(input.value);
  if (!name) {
    let number = groups.indexOf(group) + 1;
    while (nameClash(`Group ${String(number).padStart(2, '0')}`, group.id)) number++;
    name = `Group ${String(number).padStart(2, '0')}`;
  }
  // Two boats never share a name: the room couldn't tell whose fish it was. Keep the saved one.
  const clash = nameClash(name, group.id);
  if (clash) {
    input.value = group.name;
    const message = `Kept “${group.name}”. Boat ${boatNumber(groups.indexOf(clash))} already sails as “${clash.name}”.`;
    flagName(input, message, false);
    announce(message);
    return;
  }
  flagName(input, '');
  group.name = name;
  input.value = group.name;
  const tag = $(`[data-exclude="${CSS.escape(group.id)}"]`);
  tag.querySelector('.boat-name').textContent = group.name;
  tag.title = boatLabel(groups.indexOf(group), group.name);
  tag.setAttribute('aria-label', `${group.name} already presented`);
  $(`[data-present="${CSS.escape(group.id)}"]`).setAttribute('aria-label', `${group.name} presented`);
  $(`[data-remove="${CSS.escape(group.id)}"]`).setAttribute('aria-label', `Remove ${group.name}`);
  persist();
});

function nameClash(name, id) {
  const key = nameKey(name);
  return key ? groups.find(group => group.id !== id && nameKey(group.name) === key) : undefined;
}
// The message under the crew list; `invalid` marks the field while the typed name is still a clash.
function flagName(input, message, invalid = Boolean(message)) {
  $('#crew-error').textContent = message;
  $('#crew-error').hidden = !message;
  if (invalid) { input.setAttribute('aria-invalid', 'true'); input.setAttribute('aria-describedby', 'crew-error'); }
  else { input.removeAttribute('aria-invalid'); input.removeAttribute('aria-describedby'); }
}

$('#crew-list').addEventListener('input', (event) => {
  const input = event.target.closest('[data-name]');
  if (!input) return;
  const clash = nameClash(input.value, input.dataset.name);
  const wasClash = input.getAttribute('aria-invalid') === 'true';
  const message = clash ? `Boat ${boatNumber(groups.indexOf(clash))} already sails as “${clash.name}”. Pick another name.` : '';
  flagName(input, message);
  if (clash && !wasClash) announce(message);
});

$('#crew-list').addEventListener('click', (event) => {
  const remove = event.target.closest('[data-remove]');
  if (!remove || phase !== 'idle' || groups.length <= MIN_GROUPS) return;
  const before = snapshot();
  const index = groups.findIndex(group => group.id === remove.dataset.remove);
  const [removed] = groups.splice(index, 1);
  persist(); renderCrew();
  $(`[data-name="${CSS.escape(groups[Math.min(index, groups.length - 1)].id)}"]`).focus();
  const label = boatLabel(index, removed.name);
  toast(`${label} removed.`, { before, done: `${label} is back at the dock.`, refocus: () => $(`[data-name="${CSS.escape(removed.id)}"]`) });
});

// Presented is one action from either place: a boat's name tag on the board, or its tick box in Options.
function setPresented(id, excluded, control) {
  const group = groups.find(group => group.id === id);
  if (!group || phase !== 'idle') return;
  group.excluded = excluded;
  persist(); renderCrew();
  $(`[${control}="${CSS.escape(group.id)}"]`).focus();
  announce(`${group.name} ${group.excluded ? 'will sit this round out' : 'is back on board'}. ${activeGroups().length} boats ready.`);
}

$('#boat-labels').addEventListener('click', (event) => {
  const tag = event.target.closest('[data-exclude]');
  const group = tag && groups.find(group => group.id === tag.dataset.exclude);
  if (group) setPresented(group.id, !group.excluded, 'data-exclude');
});

$('#add-group').addEventListener('click', () => {
  if (phase !== 'idle' || groups.length >= MAX_GROUPS) return;
  let number = groups.length + 1;
  while (groups.some(group => group.name === `Group ${String(number).padStart(2, '0')}`)) number++;
  const color = COLORS.find(color => !groups.some(group => group.color === color)) || COLORS[groups.length];
  const group = { id: crypto.randomUUID(), name: `Group ${String(number).padStart(2, '0')}`, color, excluded: false };
  groups.push(group); persist(); renderCrew();
  const input = $(`[data-name="${CSS.escape(group.id)}"]`); input.focus(); input.select();
});

// Reset presented starts the day's record over too: every boat back in play, today's catch
// cleared. One Undo brings both back.
$('#reset-presented').addEventListener('click', () => {
  if (phase !== 'idle') return;
  const before = snapshot(), logged = ledger.casts.length ? ledger : null;
  groups.forEach(group => { group.excluded = false; });
  ledger = emptyLedger();
  persist(); renderCrew();
  toast(logged ? 'Everyone’s back on board. Today’s catch is cleared.' : 'Everyone’s back on board.',
    { before, ledger: logged, done: logged ? 'Presented list and today’s catch restored.' : 'Presented list restored.', refocus: () => $('#reset-presented') });
});

// Paste a list: the crew as lines of text, one boat per line, numbered in the gutter as the
// board will number them. It stays a draft until it's used or cancelled, so a stray click
// that folds Options away never loses a paste.
function renderList() {
  const area = $('#list-names');
  const list = readNameList(area.value);
  const count = list.names.length;
  $('#list-gutter').innerHTML = list.lines.map(line => line.blank ? '<li></li>'
    : `<li class="${line.number > MAX_GROUPS ? 'is-over' : line.cut || line.duplicate ? 'is-flagged' : ''}">${boatNumber(line.number - 1)}</li>`).join('');
  $('.list-sheet').style.setProperty('--lines', Math.max(4, list.lines.length));
  let message, error = false;
  if (count < MIN_GROUPS) message = count ? 'One name so far. The dock needs at least 2 boats.' : 'Paste or type your group names, one per line.';
  else if (count > MAX_GROUPS) { error = true; message = `${count} names, but the dock holds ${MAX_GROUPS} boats. Take out\u00a0${count - MAX_GROUPS}.`; }
  else if (list.duplicate) { error = true; message = `“${list.duplicate}” is on the list twice. Every boat needs its own name.`; }
  else {
    const change = count - groups.length;
    message = `${count} names, one boat each${change ? ` (${Math.abs(change)} ${change > 0 ? 'more' : 'fewer'} than now)` : ''}.`;
    if (list.cut.length === 1) message += ` Boat ${boatNumber(list.cut[0].number - 1)} runs past ${MAX_NAME} characters and will sail as “${list.cut[0].name}”.`;
    else if (list.cut.length) message += ` ${list.cut.length} names run past ${MAX_NAME} characters and will be cut at a word; their numbers are marked.`;
  }
  $('#list-status').textContent = message;
  $('#list-status').classList.toggle('is-error', error);
  $('#list-status').classList.toggle('is-warning', list.ok && list.cut.length > 0);
  area.setAttribute('aria-invalid', String(error));
  area.disabled = phase === 'fishing';
  $('#list-apply').disabled = phase === 'fishing' || !list.ok;
  return list;
}

// Opens the list on the crew as it stands, selected so one paste replaces it, or on a pasted
// list with the caret at its end. A draft already open is picked up where it was left.
function openList(text) {
  if (phase !== 'idle') return;
  const area = $('#list-names');
  const fresh = !listing;
  if (fresh) {
    listing = true;
    area.value = text ?? groups.map(group => group.name).join('\n');
    $('#options-panel').classList.add('is-listing');
    $('#list-editor').hidden = false;
    $('#crew-error').hidden = true;
  }
  $('#game-options').open = true;
  renderList();
  area.focus();
  if (fresh && text === undefined) area.select();
  else if (fresh) area.setSelectionRange(area.value.length, area.value.length);
  // The sheet scrolls, not the field: bring the caret's end of the list into view.
  if (fresh) $('.list-sheet').scrollTop = text === undefined ? 0 : $('.list-sheet').scrollHeight;
}

function closeList() {
  if (!listing) return;
  const hadFocus = $('#list-editor').contains(document.activeElement);
  listing = false;
  $('#options-panel').classList.remove('is-listing');
  $('#list-editor').hidden = true;
  $('#list-names').value = '';
  if (hadFocus) $('#list-open').focus({ preventScroll: true });
}

// Uses the list as the crew. Returns false while it can't be used; the editor stays open and says why.
function useList({ casting = false } = {}) {
  if (!listing || phase !== 'idle') return true;
  const list = renderList();
  if (!list.ok) {
    $('#game-options').open = true;
    $('#list-names').focus();
    if (!casting) announce($('#list-status').textContent);
    return false;
  }
  closeList();
  if (list.names.length === groups.length && list.names.every((name, i) => name === groups[i].name)) return true;
  const before = snapshot();
  groups = crewFromList(groups, list.names);
  persist(); renderCrew();
  // A cast ends any undo offer, and the band already says how many boats are fishing.
  if (!casting) toast(`${list.names.length} boats named from your list.`, { before, done: 'Boats back as they were.', refocus: () => $('#list-open') });
  return true;
}

$('#list-open').addEventListener('click', () => openList());
$('#list-names').addEventListener('input', renderList);
$('#list-names').addEventListener('keydown', (event) => {
  if (event.key === 'Enter' && (event.ctrlKey || event.metaKey)) { event.preventDefault(); useList(); }
});
$('#list-apply').addEventListener('click', () => useList());
$('#list-cancel').addEventListener('click', closeList);

// A list pasted into a name field opens as a list: the boats above that field stay, and the
// pasted lines take the rest, the way a paste fills down a spreadsheet column.
$('#crew-list').addEventListener('paste', (event) => {
  const input = event.target.closest('[data-name]');
  const text = event.clipboardData?.getData('text/plain') || '';
  if (!input || phase !== 'idle' || readNameList(text).names.length < MIN_GROUPS) return;
  event.preventDefault();
  const index = groups.findIndex(group => group.id === input.dataset.name);
  openList([...groups.slice(0, index).map(group => group.name), text.replace(/\s+$/, '')].join('\n'));
});

// The dock note: the first run's one hint. Casting, or "Got it", retires it for good.
function dismissNote() {
  const note = $('#dock-note');
  if (note.hidden) return;
  const hadFocus = note.contains(document.activeElement);
  note.hidden = true;
  try { localStorage.setItem(FIRST_RUN_KEY, 'done'); } catch { /* It just greets again next time. */ }
  if (hadFocus) $('#cast-button').focus({ preventScroll: true });
}
$('#dock-note-done').addEventListener('click', dismissNote);
$('#dock-note-paste').addEventListener('click', () => openList());
$('#dock-note-help').addEventListener('click', () => openHelp());

function startRound() {
  if (phase !== 'idle') return;
  // A list left open is used as it stands, as an edited name field is. One that can't be used
  // holds the cast, so a round never sails with names the TA meant to replace.
  if (listing && !useList({ casting: true })) { toast('The name list isn’t ready. Fix it or cancel it, then cast.'); return; }
  if (!activeGroups().length) return;
  dismissNote();
  // Commit an edited name before taking a snapshot of the participating crew.
  document.activeElement?.blur();
  $('#game-options').open = false;
  // A round changes who can be undone; the offer ends with the cast, as does a held round's.
  if (undoStep || toastOffer) dismissToast();
  let round;
  try { round = createExpedition(groups, undefined, ocean.width || $('#ocean').clientWidth); }
  catch { toast('No bites this time. Try casting again.'); return; }
  catches = round.catches;
  // The cast is written down before a line moves, with the result it has already fixed, so a
  // reload mid-round can't make it disappear.
  const winner = smallestCatch(catches);
  ledger = openCast(ledger, {
    at: Date.now(), boats: catches.length,
    winner: { id: winner.id, name: winner.name, number: boatNumber(winner.lane), length: winner.length },
    catches: catches.map(({ id, name, color, fishColor, length }) => ({ id, name, color, fishColor, length })),
  });
  persist();
  caughtCount = 0;
  phase = 'fishing';
  resultIsPrevious = false;
  renderCrew();
  $('#cast-actions').hidden = true;
  $('#fishing-actions').hidden = false;
  $('#scene-label').textContent = 'THE CHASE IS ON';
  $('#control-title').textContent = 'Lines in. Hold on tight.';
  $('#control-subtitle').textContent = `0 of ${catches.length} fish caught · Any fish. Any hook.`;
  $('#catch-feed').hidden = false;
  $('#catch-feed-title').textContent = 'Who’s getting a bite?';
  $('#catch-feed-count').textContent = `0 / ${catches.length} HOOKED`;
  $('.catch-feed-label').textContent = 'NO BITES YET';
  $('.game-card').style.setProperty('--catch-progress', '0%');
  $('.game-card').style.setProperty('--hooks', catches.length);
  $('.game-card').classList.add('is-fishing');
  $('#pause-button').innerHTML = icon('pause', 24);
  $('#pause-button').setAttribute('aria-label', 'Pause fishing');
  playTone('cast');
  announce(`${catches.length} boats cast their lines. Smallest fish presents next.`);
  ocean.start(round);
  if (ocean.reducedMotion.matches) finishRound();
  else $('#pause-button').focus({ preventScroll: true });
}

function finishRound() {
  if (phase !== 'fishing') return;
  lastCatch = catches.map(({id, name, color, fishColor, length}) => ({id, name, color, fishColor, length}));
  ledger = landCast(ledger);
  // The ledger takes its new line when the room is back at the dock, never behind the reveal.
  ledgerQuiet = true;
  persist();
  returnToDock();
  showResults(false);
}

// A reload cut this round short, but its catch was fixed at the cast: reveal it just as it
// would have landed. Casting again instead leaves it in the ledger as cut.
function revealCut() {
  const held = heldCast(ledger);
  if (!held || phase !== 'idle' || $('dialog[open]')) return;
  closeOptions();
  if (toastOffer) dismissToast();
  lastCatch = held.catches;
  ledger = landCast(ledger);
  ledgerQuiet = true;
  persist(); renderCrew();
  showResults(false);
}

function returnToDock() {
  phase = 'idle';
  ocean.reset();
  $('#cast-actions').hidden = false;
  $('#fishing-actions').hidden = true;
  $('#scene-label').textContent = 'AT THE DOCK';
  $('.game-card').classList.remove('is-fishing', 'is-paused', 'is-hauling', 'is-diving');
  $('#catch-feed').hidden = true;
  renderCrew();
}

function togglePause() {
  if (phase !== 'fishing') return;
  ocean.paused = !ocean.paused;
  $('.game-card').classList.toggle('is-paused', ocean.paused);
  $('#pause-button').innerHTML = icon(ocean.paused ? 'play' : 'pause', 24);
  $('#pause-button').setAttribute('aria-label', ocean.paused ? 'Resume fishing' : 'Pause fishing');
  $('#scene-label').textContent = ocean.paused ? 'TAKING A BREATHER' : 'THE CHASE IS ON';
  announce(ocean.paused ? 'Fishing paused.' : 'Fishing resumed.');
}

// A fresh result is staged evidence first (see "Evidence first" in style.css): the verdict is
// announced and sounded when the name lands. A replayed result, or reduced motion, opens finished.
function showResults(previous = false) {
  if (!lastCatch || phase === 'fishing') return;
  resultIsPrevious = previous;
  const winner = smallestCatch(lastCatch);
  const largest = Math.max(...lastCatch.map(fish => fish.length));
  // Number the rows by the boats as they stand now, or by row order if a boat has since been removed.
  const rowNumber = (id, i) => { const index = groups.findIndex(group => group.id === id); return boatNumber(index >= 0 ? index : i); };
  $('#result-heading').innerHTML = `<p class="eyebrow">${previous ? 'The last catch' : 'The catch is in'}</p><div class="winner-stage"><div class="winner-art">${fishArt(winner.fishColor, { red: true, detail: true })}</div><div class="winner-copy"><span class="next-presenter-tag">${icon('fish', 18)} Next to present <b class="verdict-number">${rowNumber(winner.id, lastCatch.indexOf(winner))}</b></span><h2 style="--word-em:${Math.max(3, ...winner.name.split(/\s+/).map(nameEm))};--name-em:${Math.max(3, nameEm(winner.name))}">${escapeHtml(winner.name)}</h2><p>At <strong>${formatLength(winner.length)} cm</strong>, the smallest catch takes the floor.</p></div></div>`;
  // Every row prints alike; the winner's second fish is its red proof, held back until the stamp.
  $('#catch-comparison').style.setProperty('--rows', lastCatch.length);
  // A table to assistive tech (roles, so the grid layout can't strip the semantics): each row is
  // headed by its boat, then the to-scale catch and its length. The ruler's key is visual only.
  $('#catch-comparison').innerHTML = `<div class="comparison-heading" role="row"><span role="columnheader">The day’s haul</span><span class="sr-only" role="columnheader">Catch drawn to scale</span><span role="columnheader">Fish length</span></div>${lastCatch.map((fish, i) => `<div class="catch-row ${fish.id === winner.id ? 'winning-catch' : ''}" role="row" style="--i:${i};--scale:${fish.length / largest}"><div class="catch-group" role="rowheader"><span class="catch-number">${rowNumber(fish.id, i)}</span><span>${escapeHtml(fish.name)}</span></div><div class="fish-comparison-track" role="cell"><div class="comparison-fish">${fishArt(fish.fishColor)}${fish.id === winner.id ? fishArt(fish.fishColor, { red: true }) : ''}</div>${fish.id === winner.id ? '<span class="smallest-badge">SMALLEST</span>' : ''}</div><span class="fish-length" role="cell">${formatLength(fish.length)} <small>cm</small></span></div>`).join('')}<div class="comparison-scale" aria-hidden="true"><span>0</span><span>Lengths drawn to scale</span><span>${formatLength(largest)} cm</span></div>`;
  const group = groups.find(group => group.id === winner.id);
  $('#mark-presented').disabled = !group || group.excluded;
  $('#mark-presented').innerHTML = `${bolt()}<span class="label">${group?.excluded ? 'Already marked presented' : 'Mark presented & return'}</span>${icon('check', 22)}`;
  const dialog = $('#results-dialog');
  const staged = !previous && !ocean.reducedMotion.matches;
  dialog.classList.toggle('is-revealing', staged);
  $('#results-status').textContent = '';
  verdictIn = !staged;
  pendingVerdict = null;
  dialog.showModal();
  placeStamp();
  const line = `${previous ? 'Last round: ' : ''}Boat ${rowNumber(winner.id, lastCatch.indexOf(winner))}, ${winner.name}, presents next with the smallest fish at ${formatLength(winner.length)} centimetres.`;
  // The verdict is spoken just after focus lands on Mark presented, so announcing the
  // focused button never cuts the verdict short.
  const land = (sound) => {
    focusResultAction();
    setTimeout(() => {
      $('#results-status').textContent = line;
      if (sound) playTone('finish');
    }, 150);
  };
  if (staged) {
    // While the evidence prints, focus rests on the page itself: an early Enter neither
    // dismisses the reveal nor marks a winner the room hasn't seen.
    dialog.focus({ preventScroll: true });
    $('.result-heading h2').addEventListener('animationstart', (event) => {
      if (event.animationName === 'shout') { verdictIn = true; playTone('finish'); }
    });
    pendingVerdict = () => land(false);
  } else land(!previous);
}

// Focus moves to the way on: Mark presented, or back to the boats when the winner is already marked.
// A staged reveal hands it over only if the TA hasn't moved focus themselves.
function focusResultAction() {
  const dialog = $('#results-dialog');
  if (dialog.classList.contains('is-revealing') && ![dialog, document.body].includes(document.activeElement)) return;
  const mark = $('#mark-presented');
  (mark.disabled ? $('#results-back') : mark).focus({ preventScroll: true });
}

// The actions print last (see "Evidence first" in style.css); that is when focus and the verdict land.
$('.results-actions').addEventListener('animationstart', (event) => {
  if (event.target !== event.currentTarget || !pendingVerdict) return;
  const land = pendingVerdict;
  pendingVerdict = null;
  land();
});
// The last beat prints the footnote; the finished page is the same styles without the staging.
$('.results-footnote').addEventListener('animationend', () => $('#results-dialog').classList.remove('is-revealing'));

// Width of a name set in the verdict's wood type, in ems, so CSS can size it to its column.
const nameProbe = document.body.appendChild(Object.assign(document.createElement('span'), { className: 'name-probe' }));
function nameEm(text) {
  nameProbe.textContent = text;
  return nameProbe.getBoundingClientRect().width / 100;
}

// SMALLEST stamps onto the empty ruler past the winner's fish, or over its bar when the
// catch runs nearly the full length, and never past the ruler's end. It is positioned out
// of flow, so the winning row is laid out exactly like every other row until the stamp lands.
function placeStamp() {
  const row = $('.winning-catch'), stamp = row?.querySelector('.smallest-badge');
  if (!stamp || !row.offsetWidth) return;
  const width = row.querySelector('.fish-comparison-track').clientWidth, tip = width * parseFloat(row.style.getPropertyValue('--scale'));
  const fish = parseFloat(getComputedStyle(row.querySelector('.comparison-fish svg')).width), gap = Math.min(18, width * 0.06);
  const after = tip + gap, before = tip - fish - gap - stamp.offsetWidth;
  const left = after + stamp.offsetWidth <= width ? after : before >= 0 ? before : Math.max(0, width - stamp.offsetWidth);
  stamp.style.left = `${left}px`;
}
new ResizeObserver(placeStamp).observe($('#catch-comparison'));

function markPresented() {
  if (!lastCatch || !verdictIn || $('#mark-presented').disabled) return;
  const winner = smallestCatch(lastCatch);
  const index = groups.findIndex(group => group.id === winner.id), group = groups[index];
  const before = snapshot();
  if (group) { group.excluded = true; persist(); renderCrew(); }
  $('#results-dialog').close();
  // The band already counts the boats still to cast; the toast says only who was marked.
  const label = group ? boatLabel(index, group.name) : winner.name;
  toast(`${label} marked presented.`, group && { before, done: `${label} is back on board.`, refocus: () => $('#cast-button') });
}
$('#mark-presented').addEventListener('click', markPresented);

$('#cast-button').addEventListener('click', startRound);
$('#pause-button').addEventListener('click', togglePause);
$('#skip-button').addEventListener('click', finishRound);
// Fold Options first, so the panel isn't left over the board behind the dialog, and so
// closing the dialog hands focus back to the Options tag when that's where it came from.
$('#last-catch-button').addEventListener('click', () => { closeOptions(); if (heldCast(ledger)) revealCut(); else showResults(true); });
// How to play opens from the ? plate beside Options, the ? key, or the dock note.
function openHelp() {
  if ($('dialog[open]')) return;
  closeOptions();
  $('#help-dialog').showModal();
  // Paused after opening, so "Fishing paused." is spoken from inside the guide.
  if (phase === 'fishing' && !ocean.paused) { togglePause(); $('#help-dialog').dataset.resume = 'true'; }
}
$('#help-tag').addEventListener('click', openHelp);
document.querySelectorAll('[data-close]').forEach(button => button.addEventListener('click', () => $(`#${button.dataset.close}`).close()));
document.querySelectorAll('dialog').forEach(dialog => dialog.addEventListener('click', (event) => {
  if (event.target === dialog) {
    const rect = dialog.getBoundingClientRect();
    if (event.clientX < rect.left || event.clientX > rect.right || event.clientY < rect.top || event.clientY > rect.bottom) dialog.close();
  }
}));
$('#help-dialog').addEventListener('close', () => {
  if ($('#help-dialog').dataset.resume === 'true') { if (phase === 'fishing' && ocean.paused) togglePause(); delete $('#help-dialog').dataset.resume; }
});
$('#results-dialog').addEventListener('close', () => {
  pendingVerdict = null;
  verdictIn = false;
  ledgerQuiet = false;
  renderLedger();
  if (!resultIsPrevious) $('#cast-button').focus({ preventScroll: true });
});

function playTone(type) {
  if (muted) return;
  try {
    audioContext ||= new (window.AudioContext || window.webkitAudioContext)();
    void audioContext.resume().catch(() => {});
    const notes = type === 'finish' ? [523.25, 659.25, 783.99, 1046.5] : type === 'catch' ? [659.25, 880] : [392, 523.25];
    notes.forEach((frequency, i) => {
      const oscillator = audioContext.createOscillator(), gain = audioContext.createGain();
      oscillator.type = 'sine'; oscillator.frequency.value = frequency;
      const start = audioContext.currentTime + i * 0.13;
      gain.gain.setValueAtTime(0, start); gain.gain.linearRampToValueAtTime(0.07, start + 0.015); gain.gain.exponentialRampToValueAtTime(0.001, start + 0.45);
      oscillator.connect(gain); gain.connect(audioContext.destination); oscillator.start(start); oscillator.stop(start + 0.5);
      oscillator.onended = () => { oscillator.disconnect(); gain.disconnect(); };
    });
  } catch { /* Audio is decorative; unsupported browsers can still play. */ }
}

$('#sound-toggle').addEventListener('click', () => {
  muted = !muted;
  $('#sound-toggle').innerHTML = icon(muted ? 'muted' : 'sound', 17);
  $('#sound-toggle').setAttribute('aria-label', muted ? 'Turn sound on' : 'Turn sound off');
  $('#sound-toggle').setAttribute('aria-pressed', String(!muted));
  $('#sound-toggle').title = muted ? 'Turn sound on' : 'Turn sound off';
  if (!muted) playTone('cast');
});

$('#fullscreen').addEventListener('click', async () => {
  try {
    if (document.fullscreenElement) await document.exitFullscreen();
    else if (document.documentElement.requestFullscreen) await document.documentElement.requestFullscreen();
    else toast('Use your browser’s fullscreen option for the big screen.');
  } catch { toast('Use your browser’s fullscreen option for the big screen.'); }
});
document.addEventListener('fullscreenchange', () => $('#fullscreen').setAttribute('aria-label', document.fullscreenElement ? 'Exit fullscreen' : 'Enter fullscreen'));

function closeOptions() {
  const options = $('#game-options');
  if (options.contains(document.activeElement)) $('#options-toggle').focus({ preventScroll: true });
  options.open = false;
}

document.addEventListener('click', (event) => {
  const options = $('#game-options');
  // Crew edits can replace the clicked row before this event reaches the document.
  // Undo in the toast belongs to the panel's edits, so reaching for it keeps Options open,
  // and the dock note's "Paste group names" is what opened it. The lever folds Options itself
  // when it casts, and leaves it open when a name list holds the cast.
  const insidePanel = event.composedPath().some(node => [options, $('#toast'), $('#dock-note'), $('#cast-actions')].includes(node) || node instanceof HTMLDialogElement);
  if (options.open && !insidePanel) closeOptions();
});
// A message about a name belongs to the open panel.
$('#game-options').addEventListener('toggle', () => { if (!$('#game-options').open) $('#crew-error').hidden = true; });

const isTextField = (el) => el instanceof Element && el.matches('textarea, [contenteditable]:not([contenteditable="false"]), input:not([type="checkbox"], [type="radio"], [type="button"], [type="submit"], [type="reset"], [type="range"], [type="color"], [type="file"])');

// The TA's keys. Space belongs to the game everywhere but a name field, so focus the room can't
// see (the Options tag after Esc, a name tag or tick box after a click) never turns a cast into
// a control opening on the projector. Enter presses what's focused, and ticks a Presented box.
// ? opens How to play and L the last catch; Esc steps back one layer: a list, then Options.
document.addEventListener('keydown', (event) => {
  const openDialog = $('dialog[open]');
  const typing = isTextField(event.target);
  // Autofill can send keydowns without a key.
  const key = (event.key || '').toLowerCase();
  if (event.key === 'Escape' && listing && $('#game-options').open && !openDialog) {
    event.preventDefault();
    closeList();
    return;
  }
  if (event.key === 'Escape' && $('#game-options').open && !openDialog) {
    closeOptions();
    return;
  }
  // A held key never fires a control twice in front of the room.
  if (event.repeat && !typing && (event.code === 'Space' || event.key === 'Enter')) { event.preventDefault(); return; }
  if ((event.ctrlKey || event.metaKey) && !event.altKey && !event.shiftKey && key === 'z') {
    if (!typing && !openDialog && undoStep) { event.preventDefault(); runUndo(); }
    return;
  }
  if (event.altKey || event.ctrlKey || event.metaKey || typing) return;
  if (openDialog) {
    // In the results, Enter marks the winner presented unless another control has focus.
    if (openDialog.id === 'results-dialog' && event.key === 'Enter' && !event.target.closest('button, a, input, select, summary')) {
      event.preventDefault();
      markPresented();
    }
    return;
  }
  if (event.code === 'Space') {
    event.preventDefault();
    spaceTaken = true;
    if (phase === 'idle') startRound(); else togglePause();
  } else if (event.key === 'Enter' && event.target.matches('input[type="checkbox"]')) {
    event.preventDefault();
    event.target.click();
  } else if (key === 'r' && phase === 'fishing') {
    event.preventDefault();
    finishRound();
  } else if (key === 'r' && phase === 'idle' && heldCast(ledger)) {
    event.preventDefault();
    revealCut();
  } else if (event.key === '?') {
    event.preventDefault();
    openHelp();
  } else if (key === 'l' && phase === 'idle' && (lastCatch || heldCast(ledger))) {
    event.preventDefault();
    closeOptions();
    if (heldCast(ledger)) revealCut(); else showResults(true);
  }
});
// The Space that cast or paused must not also press whatever holds focus when it comes up.
document.addEventListener('keyup', (event) => {
  if (event.code === 'Space' && spaceTaken) { spaceTaken = false; event.preventDefault(); }
});

renderCrew();
persist();
document.fonts?.ready.then(fitLedger);
// A reload cut the last round short: say so, and offer its catch before anyone casts again.
{
  const held = heldCast(ledger);
  if (held) toast(`Cast ${held.n} was cut short.`, null, { label: 'Reveal its catch', run: revealCut });
}
