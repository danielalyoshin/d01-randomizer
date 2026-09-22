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
          <div class="crew-heading"><h2 id="crew-title">Groups</h2><span class="count-badge" id="group-count">08</span></div>
          <div class="crew-list" id="crew-list" role="group" aria-labelledby="crew-title"></div>
          <button class="add-button" id="add-group">${icon('plus', 18)} Add a group <span id="capacity-label">8 / 12</span></button>
          <p class="crew-tip">Check “Presented” above a boat to skip its turn.</p>
          <div class="crew-footer"><span><span class="ready-dot"></span><span id="ready-count">8</span> ready to cast</span><button class="text-button" id="reset-presented" title="Uncheck all Presented boxes">Reset crew</button></div>
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
          <div class="boat-labels" id="boat-labels" aria-label="Mark groups that have already presented"></div>
        </div>
      </div>
      <div class="cast-callout" aria-hidden="true"><strong>Lines in!</strong><span>Every boat for itself</span></div>
      <div class="scene-bottom">
        <span class="depth-gauge"><span class="gauge-key">Depth</span><span class="gauge-value"><span id="depth">0.0</span><small>m</small></span><span id="depth-label">SEA LEVEL</span></span>
        <div class="catch-feed" id="catch-feed" hidden><div class="catch-feed-heading"><span class="catch-feed-label">THE CHASE IS ON</span><span class="catch-feed-count" id="catch-feed-count">0 / 8 HOOKED</span></div><strong id="catch-feed-title">Who’s getting a bite?</strong></div>
      </div>
      <div class="boat-scroll-hint"><span>←</span> Scroll to see every boat <span>→</span></div>
      <div class="game-controls">
        <div class="control-message"><strong id="control-title">Smallest fish presents next.</strong><span id="control-subtitle">8 boats ready to cast.</span></div>
        <div class="cast-actions" id="cast-actions"><button class="lever" id="cast-button">${bolt()}<span class="label">Cast the lines</span>${icon('arrow', 26)}</button></div>
        <div class="fishing-actions" id="fishing-actions" hidden><button class="icon-button pause-button" id="pause-button" aria-label="Pause fishing">${icon('pause', 24)}</button><button class="plate-button skip-button" id="skip-button">${bolt()}<span class="label">Reveal catch</span>${icon('skip', 20)}</button></div>
      </div>
    </section>
  </main>

  <dialog id="help-dialog" class="help-dialog" aria-label="How to play"><button class="dialog-close icon-button" data-close="help-dialog" aria-label="Close instructions">${icon('close', 22)}</button><p class="eyebrow">A quick field guide</p><h2>Hook, line <span>&amp; presenter.</span></h2><ol><li><strong>Get your boats ready.</strong> Open Options to rename, add, or remove groups. You can have 2–12 boats.</li><li><strong>Check off past presenters.</strong> Use the “Presented” checkbox above a boat to exclude it. The boat stays at the dock.</li><li><strong>Cast the lines.</strong> Fish dart through the current while hooks descend at different depths. Any boat can hook any passing fish. Watch them put up a fight!</li><li><strong>Compare the catch.</strong> The group with the smallest fish presents next. Mark them presented, then run a fresh round for the next presentation.</li></ol><div class="fairness-note">${icon('fish', 30)}<p><strong>A fair catch, every time.</strong> Every fish gets a random, unique length before the cast. Hooks catch on contact, regardless of fish size or markings. Each participating group has an equal chance of the smallest catch. Reveal catch finishes the same round instantly.</p></div><p class="help-footnote">Your crew and presented checkboxes are saved in this browser. Sound is optional. <kbd>Space</kbd> casts or pauses; <kbd>Esc</kbd> closes this guide. Reduced-motion settings reveal the catch immediately.</p><button class="lever full-width" data-close="help-dialog">${bolt()}<span class="label">Let's go fishing</span>${icon('arrow', 24)}</button></dialog>

  <dialog id="results-dialog" class="results-dialog" aria-label="Catch comparison and next presenter"><button class="dialog-close icon-button" data-close="results-dialog" aria-label="Back to the boats">${icon('close', 22)}</button><div id="results-content"></div><div class="results-actions"><button class="lever" id="mark-presented">${bolt()}<span class="label">Mark presented & return</span>${icon('check', 22)}</button><button class="plate-button" data-close="results-dialog">${bolt()}<span class="label">Back to the boats</span>${icon('arrow', 20)}</button></div><p class="results-footnote">One presenter per round. A fresh catch next time.</p></dialog>
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
    $('#control-title').textContent = caughtCount === catches.length ? 'All hooked. Bring them home!' : `${fish.name} — fish on!`;
    $('#control-subtitle').textContent = `${caughtCount} of ${catches.length} fish caught${caughtCount < catches.length ? ' · Following the remaining hooks…' : ' · Reeling in the last catch…'}`;
    $('#catch-feed-title').textContent = `${fish.name} hooked one!`;
    $('#catch-feed-count').textContent = `${caughtCount} / ${catches.length} HOOKED`;
    $('.catch-feed-label').textContent = caughtCount === catches.length ? 'REEL THEM IN' : 'FISH ON!';
    $('.game-card').style.setProperty('--catch-progress', `${caughtCount / catches.length * 100}%`);
    announce(`${fish.name} caught a fish. ${caughtCount} of ${catches.length} caught.`);
    playTone('catch');
  },
  onFinish() { finishRound(); },
  onDepth(depth) {
    $('#depth').textContent = depth.toFixed(1);
    $('#depth-label').textContent = depth < 0.5 ? 'SEA LEVEL' : depth < 7 ? 'INTO THE BLUE' : 'THE DEEP BLUE';
    $('#boat-labels').style.transform = `translateY(${-ocean.camera}px)`;
    $('#boat-labels').style.opacity = String(Math.max(0, 1 - ocean.camera / 80));
  },
});

const sceneObserver = new ResizeObserver(() => {
  const viewport = $('#ocean-viewport');
  $('.game-card').classList.toggle('has-overflow', viewport.scrollWidth > viewport.clientWidth + 1);
});
sceneObserver.observe($('#ocean-viewport'));
sceneObserver.observe($('#ocean-world'));

function renderCrew() {
  const fishing = phase === 'fishing';
  $('#crew-list').innerHTML = groups.map((group, i) => `<div class="crew-row ${group.excluded ? 'excluded' : ''}" data-group-row="${escapeHtml(group.id)}"><span class="boat-number">${String(i + 1).padStart(2, '0')}</span><label class="sr-only" for="name-${escapeHtml(group.id)}">Name for boat ${i + 1}</label><input id="name-${escapeHtml(group.id)}" data-name="${escapeHtml(group.id)}" value="${escapeHtml(group.name)}" maxlength="32" autocomplete="off" spellcheck="false" ${fishing ? 'disabled' : ''}/><span class="row-state" aria-label="${group.excluded ? 'Already presented' : 'Ready'}">${group.excluded ? icon('check', 18) : '<span class="row-dot"></span>'}</span><button class="remove-group icon-button" data-remove="${escapeHtml(group.id)}" aria-label="Remove ${escapeHtml(group.name)}" ${fishing || groups.length <= MIN_GROUPS ? 'disabled' : ''}>${icon('close', 18)}</button></div>`).join('');
  $('#boat-labels').innerHTML = groups.map((group, i) => `<div class="boat-label ${group.excluded ? 'excluded' : ''}" style="left:${(i + 0.5) / groups.length * 100}%"><span class="boat-name" title="${escapeHtml(group.name)}">${escapeHtml(group.name)}</span><label class="presented-label"><input type="checkbox" data-exclude="${escapeHtml(group.id)}" aria-label="${escapeHtml(group.name)} already presented" ${group.excluded ? 'checked' : ''} ${fishing ? 'disabled' : ''}/><span>Presented</span></label></div>`).join('');
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
    $('#control-subtitle').textContent = activeGroups().length ? `${activeGroups().length} ${activeGroups().length === 1 ? 'boat' : 'boats'} ready to cast.` : 'Open Options to reset the crew.';
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
  const boatName = checkbox.closest('.boat-label').querySelector('.boat-name');
  boatName.textContent = group.name;
  boatName.title = group.name;
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
  $('.catch-feed-label').textContent = 'THE CHASE IS ON';
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
  playTone('finish');
  showResults(false);
}

function returnToDock() {
  phase = 'idle';
  ocean.reset();
  $('#cast-actions').hidden = false;
  $('#fishing-actions').hidden = true;
  $('#scene-label').textContent = 'AT THE DOCK';
  $('.game-card').classList.remove('is-fishing', 'is-paused');
  $('#catch-feed').hidden = true;
  $('#boat-labels').style.transform = '';
  $('#boat-labels').style.opacity = '';
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

function showResults(previous = false) {
  if (!lastCatch || phase === 'fishing') return;
  resultIsPrevious = previous;
  const winner = smallestCatch(lastCatch);
  const largest = Math.max(...lastCatch.map(fish => fish.length));
  const boatNumber = (id, i) => String((groups.findIndex(group => group.id === id) + 1 || i + 1)).padStart(2, '0');
  $('#results-content').innerHTML = `<div class="result-heading"><p class="eyebrow">${previous ? 'The last catch' : 'The catch is in'}</p><div class="winner-art">${fishArt(winner.fishColor, { red: true, detail: true })}</div><div class="winner-copy"><span class="next-presenter-tag">${icon('fish', 18)} Next to present</span><h2>${escapeHtml(winner.name)}</h2><p>At <strong>${formatLength(winner.length)} cm</strong>, the smallest catch takes the floor.</p></div></div><div class="catch-comparison"><div class="comparison-heading"><span>The day’s haul</span><span>Fish length</span></div>${lastCatch.map((fish, i) => `<div class="catch-row ${fish.id === winner.id ? 'winning-catch' : ''}" style="--i:${i}"><div class="catch-group"><span class="catch-number">${boatNumber(fish.id, i)}</span><span>${escapeHtml(fish.name)}</span>${fish.id === winner.id ? '<span class="smallest-badge">SMALLEST</span>' : ''}</div><div class="fish-comparison-track"><div class="comparison-fish" style="--scale:${fish.length / largest}">${fishArt(fish.fishColor, { red: fish.id === winner.id })}</div></div><span class="fish-length">${formatLength(fish.length)} <small>cm</small></span></div>`).join('')}<div class="comparison-scale"><span>0</span><span>Lengths drawn to scale</span><span>${formatLength(largest)} cm</span></div></div>`;
  const group = groups.find(group => group.id === winner.id);
  $('#mark-presented').disabled = !group || group.excluded;
  $('#mark-presented').innerHTML = `${bolt()}<span class="label">${group?.excluded ? 'Already marked presented' : 'Mark presented & return'}</span>${icon('check', 22)}`;
  $('#results-dialog').showModal();
  announce(`${previous ? 'Last round: ' : ''}${winner.name} presents next with the smallest fish at ${formatLength(winner.length)} centimetres.`);
}

$('#mark-presented').addEventListener('click', () => {
  if (!lastCatch) return;
  const winner = smallestCatch(lastCatch);
  const group = groups.find(group => group.id === winner.id);
  if (group) { group.excluded = true; persist(); renderCrew(); }
  $('#results-dialog').close();
  toast(`${group?.name || winner.name} marked presented. ${activeGroups().length} boats remaining.`);
});

$('#cast-button').addEventListener('click', startRound);
$('#pause-button').addEventListener('click', togglePause);
$('#skip-button').addEventListener('click', finishRound);
$('#last-catch-button').addEventListener('click', () => showResults(true));
$('#how-to').addEventListener('click', () => {
  if (phase === 'fishing' && !ocean.paused) { togglePause(); $('#help-dialog').dataset.resume = 'true'; }
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
