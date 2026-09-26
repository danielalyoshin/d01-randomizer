import { COLORS, MAX_GROUPS } from './randomizer.js';

// Today's catch: every cast, in order, as the room saw it land. A cast is written down the
// moment the lines go in, so a reload can't make one disappear, and its result was fixed then.
// It is kept apart from the crew's saved state, and only Reset presented clears it.
export const LEDGER_KEY = 'daily-catch-ledger-v1';
const MAX_CASTS = 99;
const STATES = ['open', 'landed', 'cut'];

// A cast: { n, at, boats, state, winner: { id, name, number, length }, presented, catches? }
//   open     the lines are in (only ever seen on a reload: the round never finished)
//   landed   the catch came in and was shown to the room
//   cut      the page reloaded mid-round; `catches` is kept while the round can still be revealed
export const emptyLedger = () => ({ casts: [] });

const validCatch = (fish) => fish && typeof fish.id === 'string' && fish.id.length > 0 && fish.id.length <= 100
  && typeof fish.name === 'string' && fish.name.trim().length > 0 && fish.name.length <= 32 && COLORS.includes(fish.color)
  && Number.isInteger(fish.length) && fish.length >= 140 && fish.length <= 960
  && (fish.fishColor === undefined || /^#[0-9a-f]{6}$/i.test(fish.fishColor));

function validCast(cast) {
  if (!cast || !Number.isInteger(cast.n) || cast.n < 1 || !Number.isFinite(cast.at) || !STATES.includes(cast.state)) return false;
  if (!Number.isInteger(cast.boats) || cast.boats < 1 || cast.boats > MAX_GROUPS) return false;
  const { winner } = cast;
  return Boolean(winner) && typeof winner.id === 'string' && typeof winner.name === 'string' && winner.name.length > 0 && winner.name.length <= 32
    && /^\d{2}$/.test(winner.number) && Number.isInteger(winner.length) && winner.length >= 140 && winner.length <= 960;
}

export function readLedger(raw) {
  try {
    const saved = JSON.parse(raw);
    if (!saved || !Array.isArray(saved.casts)) return emptyLedger();
    const casts = saved.casts.filter(validCast).slice(-MAX_CASTS).map(({ n, at, boats, state, winner, presented, catches }) => ({
      n, at, boats, state,
      winner: { id: winner.id, name: winner.name, number: winner.number, length: winner.length },
      presented: state === 'landed' && presented === true,
      ...(Array.isArray(catches) && catches.length && catches.length <= MAX_GROUPS && catches.every(validCatch)
        ? { catches: catches.map(({ id, name, color, fishColor, length }) => ({ id, name, color, ...(fishColor ? { fishColor } : {}), length })) } : {}),
    }));
    // Numbers only ever count up, so a missing or repeated number can't hide a cast.
    return { casts: casts.filter((cast, i) => i === 0 || cast.n > casts[i - 1].n) };
  } catch { return emptyLedger(); }
}

const latest = (ledger) => ledger.casts.at(-1);

// The lines go in. Anything earlier is settled: a cut round can no longer be revealed.
export function openCast(ledger, { at, boats, winner, catches }) {
  const casts = ledger.casts.map(({ catches: _, ...cast }) => cast);
  return { casts: [...casts, { n: (latest(ledger)?.n || 0) + 1, at, boats, state: 'open', winner, presented: false, catches }].slice(-MAX_CASTS) };
}

// The catch came in (by the lines, by Reveal catch, or by revealing a round a reload cut short).
export function landCast(ledger) {
  const cast = latest(ledger);
  if (!cast || cast.state === 'landed') return ledger;
  const { catches: _, ...landed } = cast;
  return { casts: [...ledger.casts.slice(0, -1), { ...landed, state: 'landed', presented: false }] };
}

// On load, a round still in the water was cut short by the reload.
export function cutOpenCasts(ledger) {
  return { casts: ledger.casts.map(cast => cast.state === 'open' ? { ...cast, state: 'cut' } : cast) };
}

// The round a reload cut short, while it can still be revealed: the latest cast, its catch held.
export function heldCast(ledger) {
  const cast = latest(ledger);
  return cast?.state === 'cut' && cast.catches ? cast : null;
}

// The latest catch counts as presented while its boat is marked presented, however it was marked.
// Once another cast goes in, it is settled. A boat no longer at the dock keeps what it had.
export function syncPresented(ledger, groups) {
  const cast = latest(ledger);
  if (cast?.state !== 'landed') return ledger;
  const group = groups.find(group => group.id === cast.winner.id);
  if (!group || group.excluded === cast.presented) return ledger;
  return { casts: [...ledger.casts.slice(0, -1), { ...cast, presented: group.excluded }] };
}

// presented · on-deck (in, not yet marked) · thrown-back (cast again before it was marked)
// held (cut by a reload, can still be revealed) · cut (cut by a reload, then cast again)
// open (the lines are in right now)
export function castOutcome(ledger, cast) {
  const last = cast === latest(ledger);
  if (cast.state === 'open') return 'open';
  if (cast.state === 'landed') return cast.presented ? 'presented' : last ? 'on-deck' : 'thrown-back';
  return cast.catches && last ? 'held' : 'cut';
}

export const dayKey = (at) => { const d = new Date(at); return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`; };

// The ledger as printed: a rule at the head of each day, then that day's casts in order.
export function ledgerLines(ledger, now = Date.now()) {
  const today = dayKey(now);
  const lines = [];
  for (const cast of ledger.casts) {
    const day = dayKey(cast.at);
    if (lines.findLast(line => line.kind === 'day')?.day !== day) lines.push({ kind: 'day', day, at: cast.at, today: day === today });
    lines.push({ kind: 'cast', cast, outcome: castOutcome(ledger, cast) });
  }
  return lines;
}

// When the slip can't hold every line, the oldest casts fold into one line that still counts
// what they were, so a thrown-back or cut cast is never folded out of sight. The fold heads the
// slip under the rule of the day it starts on, so an earlier day's casts never read as today's;
// any other day rule goes with its casts.
export function foldLines(lines, count) {
  const casts = lines.filter(line => line.kind === 'cast');
  if (count <= 0 || !casts.length) return lines;
  const folded = casts.slice(0, Math.min(count, casts.length));
  const gone = new Set(folded);
  const kept = lines.filter(line => !gone.has(line));
  const tally = { presented: 0, 'on-deck': 0, 'thrown-back': 0, held: 0, cut: 0, open: 0 };
  folded.forEach(line => { tally[line.outcome]++; });
  const fold = { kind: 'fold', from: folded[0].cast.n, to: folded.at(-1).cast.n, tally };
  const head = lines.find(line => line.kind === 'day' && line.day === dayKey(folded[0].cast.at));
  const rest = kept.filter((line, i) => line !== head && (line.kind !== 'day' || kept[i + 1]?.kind === 'cast'));
  return [head, fold, ...rest];
}
