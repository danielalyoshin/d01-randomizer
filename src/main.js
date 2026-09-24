import '@fontsource-variable/big-shoulders/opsz.css';
import '@fontsource-variable/archivo/wdth.css';
import './style.css';
import { COLORS, MIN_GROUPS, MAX_GROUPS, STORAGE_KEY, defaultGroups, restoreState, createExpedition, smallestCatch, formatLength } from './randomizer.js';
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
let saved = null;
try { saved = restoreState(localStorage.getItem(STORAGE_KEY)); } catch { /* Storage is optional. */ }
let groups = saved?.groups || defaultGroups();
let lastCatch = saved?.lastCatch || null;
let catches = [];
let phase = 'idle';
let caughtCount = 0;
let muted = true;
let audioContext;
let toastTimer;
let resultIsPrevious = false;

$('#app').innerHTML = `
  <main class="app-shell">
    <div class="spine" aria-hidden="true">${bolt()}<span class="spine-text"><b>CSCD01</b> Tutorial</span>${bolt()}</div>
    <section class="game-card" aria-label="Fishing game">
      <div class="scene-head">
        <h1 class="masthead"><span>The Daily</span> Catch</h1>
        <div class="scene-status"><span class="status-dot"></span><span id="scene-label">AT THE DOCK</span></div>
      </div>
      <details class="game-options" id="game-options">
        <summary id="options-toggle">${bolt()}<span class="label">Options</span>${icon('chevron', 18)}</summary>
        <div class="options-panel">
          <div class="crew-heading"><h2 id="crew-title">Boats</h2><span class="count-badge" id="group-count">08</span></div>
          <div class="crew-list" id="crew-list" role="group" aria-labelledby="crew-title"></div>
          <button class="add-button" id="add-group">${icon('plus', 18)} Add a boat <span id="capacity-label">8 / 12</span></button>
          <p class="crew-tip">Tick “Presented” above a boat to sit it out.</p>
          <div class="crew-footer"><span><span class="ready-dot"></span><span id="ready-count">8</span> ready to cast</span><button class="text-button" id="reset-presented" title="Untick every Presented box">Reset presented</button></div>
          <button class="last-catch-button text-button" id="last-catch-button" ${lastCatch ? '' : 'hidden'}>${icon('fish', 20)} View last catch ${icon('arrow', 18)}</button>
          <div class="options-tools">
            <button class="text-button" id="how-to">${icon('help', 20)} How to play</button>
            <div class="scene-actions"><button class="icon-button" id="sound-toggle" aria-label="Turn sound on" aria-pressed="false" title="Turn sound on">${icon('muted', 19)}</button><button class="icon-button" id="fullscreen" aria-label="Enter fullscreen" title="Fullscreen">${icon('expand', 19)}</button></div>
          </div>
        </div>
      </details>
      <div class="ocean-viewport" id="ocean-viewport">
        <div class="ocean-world" id="ocean-world">
          <canvas id="ocean" aria-label="Fishing boats above a fast-moving school of fish. Staggered hooks catch whichever fish they meet."></canvas>
          <div class="boat-labels" id="boat-labels" role="group" aria-label="Mark boats that have already presented"></div>
        </div>
      </div>
      <div class="cast-callout" aria-hidden="true"><strong>Lines in!</strong><span>Every boat for itself</span></div>
      <div class="scene-bottom">
        <span class="depth-gauge"><span class="gauge-key">Depth</span><span class="gauge-value"><span id="depth">0.0</span><small>m</small></span><span id="depth-label">SEA LEVEL</span></span>
        <div class="catch-feed" id="catch-feed" hidden><div class="catch-feed-heading"><span class="catch-feed-label">NO BITES YET</span><span class="catch-feed-count" id="catch-feed-count">0 / 8 HOOKED</span></div><strong id="catch-feed-title">Who’s getting a bite?</strong></div>
      </div>
      <div class="boat-scroll-hint"><span>←</span> Scroll to see every boat <span>→</span></div>
      <div class="game-controls">
        <div class="control-message"><strong id="control-title">Smallest fish presents next.</strong><span id="control-subtitle">8 boats ready to cast.</span></div>
        <div class="cast-actions" id="cast-actions"><button class="lever" id="cast-button">${bolt()}<span class="label">Cast the lines</span>${icon('arrow', 26)}</button></div>
        <div class="fishing-actions" id="fishing-actions" hidden><button class="icon-button pause-button" id="pause-button" aria-label="Pause fishing">${icon('pause', 24)}</button><button class="plate-button skip-button" id="skip-button">${bolt()}<span class="label">Reveal catch</span>${icon('skip', 20)}</button></div>
      </div>
    </section>
  </main>

  <dialog id="help-dialog" class="help-dialog" aria-label="How to play"><button class="dialog-close icon-button" data-close="help-dialog" aria-label="Close instructions">${icon('close', 22)}</button><p class="eyebrow">A quick field guide</p><h2>Hook, line <span>&amp; presenter.</span></h2><ol><li><strong>Get your boats ready.</strong> Each group fishes from its own numbered boat. Open Options to rename, add or remove boats (2–12).</li><li><strong>Check off past presenters.</strong> Tick “Presented” above a boat to sit it out. It stays moored at the dock.</li><li><strong>Cast the lines.</strong> Fish dart through the current while hooks descend at different depths. Any boat can hook any passing fish. Watch them put up a fight!</li><li><strong>Compare the catch.</strong> Smallest fish presents next. Mark that boat presented, then cast again for the next presentation.</li></ol><div class="fairness-note">${icon('fish', 30)}<p><strong>A fair catch, every time.</strong> Every fish gets a random, unique length before the cast. Hooks catch on contact, regardless of fish size or markings. Every boat in the round has an equal chance of the smallest catch. Reveal catch finishes the same round instantly.</p></div><p class="help-footnote">Boat names and Presented ticks are saved in this browser. Sound is optional. <kbd>Space</kbd> casts or pauses; <kbd>Esc</kbd> closes this guide. With reduced motion, the catch is revealed at once.</p><button class="lever full-width" data-close="help-dialog">${bolt()}<span class="label">Let's go fishing</span>${icon('arrow', 24)}</button></dialog>

  <dialog id="results-dialog" class="results-dialog" aria-label="Catch comparison and next presenter"><button class="dialog-close icon-button" data-close="results-dialog" aria-label="Back to the boats">${icon('close', 22)}</button><div class="result-heading" id="result-heading"></div><div class="catch-comparison" id="catch-comparison"></div><div class="results-actions"><button class="lever" id="mark-presented">${bolt()}<span class="label">Mark presented & return</span>${icon('check', 22)}</button><button class="plate-button" data-close="results-dialog">${bolt()}<span class="label">Back to the boats</span>${icon('arrow', 20)}</button></div><p class="results-footnote">One presenter per round. A fresh catch next time.</p><p class="sr-only" id="results-status" role="status" aria-live="polite" aria-atomic="true"></p></dialog>
  <div class="toast" id="toast" role="status"></div>
  <span class="sr-only" id="live-status" role="status" aria-live="polite" aria-atomic="true"></span>
`;

function persist() {
  try { localStorage.setItem(STORAGE_KEY, JSON.stringify({ groups, lastCatch })); } catch { /* The game works without local storage. */ }
}

function toast(message) {
  clearTimeout(toastTimer);
  $('#toast').textContent = message;
  $('#toast').classList.add('visible');
  toastTimer = setTimeout(() => $('#toast').classList.remove('visible'), 3500);
}

function announce(message) { $('#live-status').textContent = message; }
function activeGroups() { return groups.filter(group => !group.excluded); }

const ocean = new Ocean($('#ocean'), {
  onCatch(fish) {
    caughtCount++;
    const row = document.querySelector(`[data-group-row="${CSS.escape(fish.id)}"]`);
    row?.classList.add('has-catch');
    if (row) row.querySelector('.row-state').innerHTML = icon('fish', 18);
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
});
sceneObserver.observe($('#ocean-viewport'));
sceneObserver.observe($('#ocean-world'));
// The dock drops just far enough for the tallest name tag (see Ocean.setDock).
new ResizeObserver(() => ocean.setDock($('#boat-labels').offsetTop + $('#boat-labels').offsetHeight)).observe($('#boat-labels'));

function renderCrew() {
  const fishing = phase === 'fishing';
  $('#crew-list').innerHTML = groups.map((group, i) => `<div class="crew-row ${group.excluded ? 'excluded' : ''}" data-group-row="${escapeHtml(group.id)}"><span class="boat-number">${String(i + 1).padStart(2, '0')}</span><label class="sr-only" for="name-${escapeHtml(group.id)}">Name for boat ${i + 1}</label><input id="name-${escapeHtml(group.id)}" data-name="${escapeHtml(group.id)}" value="${escapeHtml(group.name)}" maxlength="32" autocomplete="off" spellcheck="false" ${fishing ? 'disabled' : ''}/><span class="row-state" aria-label="${group.excluded ? 'Already presented' : 'Ready'}">${group.excluded ? icon('check', 18) : '<span class="row-dot"></span>'}</span><button class="remove-group icon-button" data-remove="${escapeHtml(group.id)}" aria-label="Remove ${escapeHtml(group.name)}" ${fishing || groups.length <= MIN_GROUPS ? 'disabled' : ''}>${icon('close', 18)}</button></div>`).join('');
  $('#boat-labels').innerHTML = groups.map((group, i) => `<div class="boat-label ${group.excluded ? 'excluded' : ''}" data-boat="${escapeHtml(group.id)}"><span class="boat-tag" title="${escapeHtml(boatLabel(i, group.name))}"><b class="boat-tag-number">${boatNumber(i)}</b> <span class="boat-name">${escapeHtml(group.name)}</span></span><label class="presented-label"><input type="checkbox" data-exclude="${escapeHtml(group.id)}" aria-label="${escapeHtml(group.name)} already presented" ${group.excluded ? 'checked' : ''} ${fishing ? 'disabled' : ''}/><span>Presented</span></label></div>`).join('');
  $('#ocean-world').style.minWidth = `${Math.max(640, groups.length * 110)}px`;
  $('#boat-labels').style.setProperty('--boats', groups.length);
  $('#group-count').textContent = String(groups.length).padStart(2, '0');
  $('#capacity-label').textContent = `${groups.length} / ${MAX_GROUPS}`;
  $('#ready-count').textContent = activeGroups().length;
  $('#add-group').disabled = fishing || groups.length >= MAX_GROUPS;
  $('#reset-presented').disabled = fishing || !groups.some(group => group.excluded);
  $('#last-catch-button').hidden = !lastCatch;
  $('#last-catch-button').disabled = fishing;
  $('#cast-button').disabled = !activeGroups().length;
  if (!fishing) {
    $('#control-title').textContent = activeGroups().length ? 'Smallest fish presents next.' : 'Everyone has presented.';
    $('#control-subtitle').textContent = activeGroups().length ? `${activeGroups().length} ${activeGroups().length === 1 ? 'boat' : 'boats'} ready to cast.` : 'Reset presented in Options to go again.';
  }
  ocean.setGroups(groups);
}

$('#crew-list').addEventListener('change', (event) => {
  const input = event.target.closest('[data-name]');
  if (!input || phase !== 'idle') return;
  const group = groups.find(group => group.id === input.dataset.name);
  group.name = input.value.trim() || `Group ${String(groups.indexOf(group) + 1).padStart(2, '0')}`;
  input.value = group.name;
  const checkbox = $(`[data-exclude="${CSS.escape(group.id)}"]`);
  const tag = checkbox.closest('.boat-label').querySelector('.boat-tag');
  tag.querySelector('.boat-name').textContent = group.name;
  tag.title = boatLabel(groups.indexOf(group), group.name);
  checkbox.setAttribute('aria-label', `${group.name} already presented`);
  $(`[data-remove="${CSS.escape(group.id)}"]`).setAttribute('aria-label', `Remove ${group.name}`);
  persist();
});

$('#crew-list').addEventListener('click', (event) => {
  const remove = event.target.closest('[data-remove]');
  if (!remove || phase !== 'idle' || groups.length <= MIN_GROUPS) return;
  const index = groups.findIndex(group => group.id === remove.dataset.remove);
  const [removed] = groups.splice(index, 1);
  persist(); renderCrew();
  $(`[data-name="${CSS.escape(groups[Math.min(index, groups.length - 1)].id)}"]`).focus();
  announce(`${removed.name} removed. ${groups.length} boats on board.`);
});

$('#boat-labels').addEventListener('change', (event) => {
  const checkbox = event.target.closest('[data-exclude]');
  if (!checkbox || phase !== 'idle') return;
  const group = groups.find(group => group.id === checkbox.dataset.exclude);
  group.excluded = checkbox.checked;
  persist(); renderCrew();
  $(`[data-exclude="${CSS.escape(group.id)}"]`).focus();
  announce(`${group.name} ${group.excluded ? 'will sit this round out' : 'is back on board'}. ${activeGroups().length} boats ready.`);
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

$('#reset-presented').addEventListener('click', () => {
  if (phase !== 'idle') return;
  groups.forEach(group => { group.excluded = false; });
  persist(); renderCrew(); toast('Everyone’s back on board.');
});

function startRound() {
  if (phase !== 'idle' || !activeGroups().length) return;
  // Commit an edited name before taking a snapshot of the participating crew.
  document.activeElement?.blur();
  $('#game-options').open = false;
  let round;
  try { round = createExpedition(groups, undefined, ocean.width || $('#ocean').clientWidth); }
  catch { toast('No bites this time. Try casting again.'); return; }
  catches = round.catches;
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
  persist();
  returnToDock();
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
  $('#catch-comparison').innerHTML = `<div class="comparison-heading"><span>The day’s haul</span><span>Fish length</span></div>${lastCatch.map((fish, i) => `<div class="catch-row ${fish.id === winner.id ? 'winning-catch' : ''}" style="--i:${i};--scale:${fish.length / largest}"><div class="catch-group"><span class="catch-number">${rowNumber(fish.id, i)}</span><span>${escapeHtml(fish.name)}</span></div><div class="fish-comparison-track"><div class="comparison-fish">${fishArt(fish.fishColor)}${fish.id === winner.id ? fishArt(fish.fishColor, { red: true }) : ''}</div>${fish.id === winner.id ? '<span class="smallest-badge">SMALLEST</span>' : ''}</div><span class="fish-length">${formatLength(fish.length)} <small>cm</small></span></div>`).join('')}<div class="comparison-scale"><span>0</span><span>Lengths drawn to scale</span><span>${formatLength(largest)} cm</span></div>`;
  const group = groups.find(group => group.id === winner.id);
  $('#mark-presented').disabled = !group || group.excluded;
  $('#mark-presented').innerHTML = `${bolt()}<span class="label">${group?.excluded ? 'Already marked presented' : 'Mark presented & return'}</span>${icon('check', 22)}`;
  const dialog = $('#results-dialog');
  const staged = !previous && !ocean.reducedMotion.matches;
  dialog.classList.toggle('is-revealing', staged);
  $('#results-status').textContent = '';
  dialog.showModal();
  placeStamp();
  const verdict = () => {
    $('#results-status').textContent = `${previous ? 'Last round: ' : ''}Boat ${rowNumber(winner.id, lastCatch.indexOf(winner))}, ${winner.name}, presents next with the smallest fish at ${formatLength(winner.length)} centimetres.`;
    if (!previous) playTone('finish');
  };
  if (staged) $('.result-heading h2').addEventListener('animationstart', (event) => { if (event.animationName === 'shout') verdict(); });
  else setTimeout(verdict, 150);
}

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

$('#mark-presented').addEventListener('click', () => {
  if (!lastCatch) return;
  const winner = smallestCatch(lastCatch);
  const index = groups.findIndex(group => group.id === winner.id), group = groups[index];
  if (group) { group.excluded = true; persist(); renderCrew(); }
  $('#results-dialog').close();
  // The band already counts the boats still to cast; the toast says only who was marked.
  toast(`${group ? boatLabel(index, group.name) : winner.name} marked presented.`);
});

$('#cast-button').addEventListener('click', startRound);
$('#pause-button').addEventListener('click', togglePause);
$('#skip-button').addEventListener('click', finishRound);
// Both open from inside Options; fold the panel first so it isn't left over the board
// behind the dialog, and so closing the dialog hands focus back to the Options tag.
$('#last-catch-button').addEventListener('click', () => { closeOptions(); showResults(true); });
$('#how-to').addEventListener('click', () => {
  if (phase === 'fishing' && !ocean.paused) { togglePause(); $('#help-dialog').dataset.resume = 'true'; }
  closeOptions();
  $('#help-dialog').showModal();
});
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
  const insidePanel = event.composedPath().some(node => node === options || node instanceof HTMLDialogElement);
  if (options.open && !insidePanel) closeOptions();
});

document.addEventListener('keydown', (event) => {
  if (event.key === 'Escape' && $('#game-options').open && !document.querySelector('dialog[open]')) {
    closeOptions();
    return;
  }
  if (event.code !== 'Space' || event.repeat || event.altKey || event.ctrlKey || event.metaKey || document.querySelector('dialog[open]') || event.target.closest('input, button, summary, a, textarea, select, [contenteditable]')) return;
  event.preventDefault();
  if (phase === 'idle') startRound(); else togglePause();
});

renderCrew();
persist();
