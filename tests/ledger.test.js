import test from 'node:test';
import assert from 'node:assert/strict';
import { emptyLedger, readLedger, openCast, landCast, cutOpenCasts, heldCast, syncPresented, castOutcome, ledgerLines, foldLines } from '../src/ledger.js';
import { COLORS } from '../src/randomizer.js';
import { FISH_COLORS } from '../src/fishing.js';

const DAY = 24 * 60 * 60 * 1000;
const NOW = new Date(2026, 8, 25, 14, 30).getTime();
const boat = (i, excluded = false) => ({ id: `g${i}`, name: `Group 0${i}`, color: COLORS[i], excluded });
const catchOf = (i, length) => ({ id: `g${i}`, name: `Group 0${i}`, color: COLORS[i], fishColor: FISH_COLORS[0], length });
const cast = (winner, length, at = NOW) => ({
  at, boats: 3,
  winner: { id: `g${winner}`, name: `Group 0${winner}`, number: `0${winner}`, length },
  catches: [catchOf(1, 400), catchOf(winner, length), catchOf(3, 700)],
});
const outcomes = (ledger) => ledger.casts.map(each => castOutcome(ledger, each));

test('every cast takes the next number and is written open, holding its fixed result', () => {
  let ledger = openCast(emptyLedger(), cast(2, 210));
  assert.equal(ledger.casts[0].n, 1);
  assert.equal(ledger.casts[0].state, 'open');
  assert.equal(ledger.casts[0].catches.length, 3);
  ledger = openCast(landCast(ledger), cast(3, 180));
  assert.deepEqual(ledger.casts.map(each => each.n), [1, 2]);
  // Once another cast goes in, the earlier one keeps only its winner.
  assert.equal(ledger.casts[0].catches, undefined);
});

test('a landed catch is on deck until its boat is marked, and thrown back if the lines go in first', () => {
  const crew = [boat(1), boat(2), boat(3)];
  let ledger = landCast(openCast(emptyLedger(), cast(2, 210)));
  assert.deepEqual(outcomes(ledger), ['on-deck']);
  ledger = syncPresented(ledger, crew.map(group => group.id === 'g2' ? { ...group, excluded: true } : group));
  assert.deepEqual(outcomes(ledger), ['presented']);
  // Unmarking it (an Undo, or a second click on the tag) puts it back on deck.
  ledger = syncPresented(ledger, crew);
  assert.deepEqual(outcomes(ledger), ['on-deck']);
  ledger = landCast(openCast(ledger, cast(3, 180)));
  assert.deepEqual(outcomes(ledger), ['thrown-back', 'on-deck']);
  // A settled cast no longer follows the crew.
  ledger = syncPresented(ledger, crew.map(group => ({ ...group, excluded: true })));
  assert.deepEqual(outcomes(ledger), ['thrown-back', 'presented']);
});

test('a removed boat keeps its mark, and marks never reach a cast that has not landed', () => {
  let ledger = syncPresented(landCast(openCast(emptyLedger(), cast(2, 210))), [boat(2, true)]);
  ledger = syncPresented(ledger, [boat(1), boat(3)]);
  assert.deepEqual(outcomes(ledger), ['presented']);
  const open = openCast(ledger, cast(1, 300));
  assert.equal(syncPresented(open, [boat(1, true)]), open);
});

test('a reload cuts an open round; it can be revealed until the lines go in again', () => {
  let ledger = cutOpenCasts(openCast(emptyLedger(), cast(2, 210)));
  assert.deepEqual(outcomes(ledger), ['held']);
  assert.equal(heldCast(ledger).n, 1);
  // Revealing it lands the same round.
  const revealed = landCast(ledger);
  assert.deepEqual(outcomes(revealed), ['on-deck']);
  assert.equal(revealed.casts[0].winner.length, 210);
  assert.equal(heldCast(revealed), null);
  // Casting again settles it as cut, with the winner it would have landed.
  ledger = openCast(ledger, cast(3, 180));
  assert.deepEqual(outcomes(ledger), ['cut', 'open']);
  assert.equal(ledger.casts[0].winner.name, 'Group 02');
  assert.equal(heldCast(ledger), null);
});

test('the saved ledger is read back only as a ledger, numbers always counting up', () => {
  const ledger = syncPresented(landCast(openCast(openCast(emptyLedger(), cast(1, 300)), cast(2, 210))), [boat(2, true)]);
  assert.deepEqual(readLedger(JSON.stringify(ledger)), ledger);
  assert.deepEqual(readLedger('not json'), emptyLedger());
  assert.deepEqual(readLedger(null), emptyLedger());
  assert.deepEqual(readLedger(JSON.stringify({ casts: 'nope' })), emptyLedger());
  const tampered = { casts: [
    ...ledger.casts,
    { ...ledger.casts[1], n: 2 },
    { ...ledger.casts[1], n: 3, winner: { ...ledger.casts[1].winner, name: '<img src=x>'.repeat(5) } },
    { ...ledger.casts[1], n: 4, state: 'won' },
    { ...ledger.casts[1], n: 5, catches: [{ ...catchOf(2, 210), color: 'red' }] },
  ] };
  const read = readLedger(JSON.stringify(tampered));
  assert.deepEqual(read.casts.map(each => each.n), [1, 2, 5]);
  assert.equal(read.casts[2].catches, undefined);
});

test('lines print a rule at the head of each day, today’s marked as today', () => {
  let ledger = landCast(openCast(emptyLedger(), cast(1, 300, NOW - 7 * DAY)));
  ledger = landCast(openCast(ledger, cast(2, 210, NOW - 7 * DAY + 60000)));
  ledger = landCast(openCast(ledger, cast(3, 180, NOW)));
  const lines = ledgerLines(ledger, NOW);
  assert.deepEqual(lines.map(line => line.kind), ['day', 'cast', 'cast', 'day', 'cast']);
  assert.deepEqual(lines.filter(line => line.kind === 'day').map(line => line.today), [false, true]);
  assert.deepEqual(lines.filter(line => line.kind === 'cast').map(line => line.outcome), ['thrown-back', 'thrown-back', 'on-deck']);
});

test('folding keeps a count of every outcome it hides, under the date it starts on', () => {
  const crew = [boat(1), boat(2), boat(3)];
  let ledger = emptyLedger();
  for (const [winner, at] of [[1, NOW - DAY], [2, NOW], [3, NOW], [1, NOW]]) {
    ledger = syncPresented(landCast(openCast(ledger, cast(winner, 200 + winner, at))), crew.map(group => ({ ...group, excluded: group.id === `g${winner}` && winner !== 2 })));
  }
  const lines = ledgerLines(ledger, NOW);
  assert.deepEqual(foldLines(lines, 0), lines);
  // Yesterday's cast keeps yesterday's rule, so it never reads as today's.
  const one = foldLines(lines, 1);
  assert.deepEqual(one.map(line => line.kind), ['day', 'fold', 'day', 'cast', 'cast', 'cast']);
  assert.deepEqual(one.filter(line => line.kind === 'day').map(line => line.today), [false, true]);
  const three = foldLines(lines, 3);
  assert.deepEqual(three.map(line => line.kind), ['day', 'fold', 'day', 'cast']);
  assert.deepEqual([three[1].from, three[1].to], [1, 3]);
  assert.equal(three[1].tally.presented, 2);
  assert.equal(three[1].tally['thrown-back'], 1);
  const all = foldLines(lines, 99);
  assert.deepEqual(all.map(line => line.kind), ['day', 'fold']);
  assert.equal(all[1].to, 4);
  // Folding only today's casts heads the fold with today's rule.
  const today = foldLines(ledgerLines({ casts: ledger.casts.slice(1) }, NOW), 2);
  assert.deepEqual(today.map(line => line.kind), ['day', 'fold', 'cast']);
  assert.equal(today[0].today, true);
});
