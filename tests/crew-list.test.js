import test from 'node:test';
import assert from 'node:assert/strict';
import { readNameList, fitName, crewFromList, MAX_NAME } from '../src/crew-list.js';
import { COLORS, defaultGroups, MAX_GROUPS } from '../src/randomizer.js';

test('a pasted list takes one name per line, skipping blanks and list markers', () => {
  const list = readNameList('1. Rebase Rangers\r\n\n  • Null   Pointers \n(3) Merge Conflicts\n05 · Stack Smashers\n7 Wonders\n- \t Off By One\n');
  assert.deepEqual(list.names, ['Rebase Rangers', 'Null Pointers', 'Merge Conflicts', 'Stack Smashers', '7 Wonders', 'Off By One']);
  assert.equal(list.lines.length, 8);
  assert.deepEqual(list.lines.map(line => line.number), [1, 0, 2, 3, 4, 5, 6, 0]);
  assert.equal(list.ok, true);
});

test('the list needs 2 to 12 names, each its own', () => {
  assert.equal(readNameList('Solo').ok, false);
  assert.equal(readNameList('\n\n').names.length, 0);
  const thirteen = Array.from({ length: MAX_GROUPS + 1 }, (_, i) => `Team ${i + 1}`).join('\n');
  assert.equal(readNameList(thirteen).names.length, 13);
  assert.equal(readNameList(thirteen).ok, false);
  const twin = readNameList('Rebase Rangers\nNull Pointers\n rebase  RANGERS');
  assert.equal(twin.ok, false);
  assert.equal(twin.duplicate, 'Rebase Rangers');
  assert.deepEqual(twin.lines.map(line => line.duplicate), [true, false, true]);
});

test('names past 32 characters are cut at a word, never mid-pair or on a comma', () => {
  assert.equal(fitName('Team 3: Alice Wong, Bob Li, Carol Chen'), 'Team 3: Alice Wong, Bob Li');
  assert.equal(fitName('Supercalifragilisticexpialidocious!!'), 'Supercalifragilisticexpialidocio');
  assert.equal(fitName(`${'a'.repeat(31)}🐟tail`).length, 31);
  for (const name of ['Team 3: Alice Wong, Bob Li, Carol Chen', 'x'.repeat(80), 'The Quick Brown Fox Jumps Over The Lazy Dog']) {
    assert.ok(fitName(name).length <= MAX_NAME);
  }
  const list = readNameList('Team 3: Alice Wong, Bob Li, Carol Chen\nShort');
  assert.equal(list.cut.length, 1);
  assert.equal(list.ok, true);
  // Two names that only differ past the cut would sail under one name.
  assert.equal(readNameList('The Longest Group Name In The Class A\nThe Longest Group Name In The Class B').ok, false);
});

test('the list becomes the crew and keeps each boat that is still named on it', () => {
  let n = 0;
  const makeId = () => `new-${++n}`;
  const groups = defaultGroups();
  groups[2].excluded = true;
  // A first list replaces the default names line for line, colours and all.
  const named = crewFromList(groups, ['Alpha', 'Bravo', 'Charlie', 'Delta', 'Echo', 'Foxtrot'], makeId);
  assert.deepEqual(named.map(group => group.id), groups.slice(0, 6).map(group => group.id));
  assert.equal(named[2].excluded, true);
  // Reordering keeps each boat with its name; a typo fix keeps the boat and its stamp.
  const reordered = crewFromList(named, ['Charlie', 'Alpha', 'Bravo', 'Delta', 'Echo', 'Foxtrott'], makeId);
  assert.deepEqual(reordered.map(group => group.id), [named[2].id, named[0].id, named[1].id, named[3].id, named[4].id, named[5].id]);
  assert.equal(reordered[0].excluded, true);
  assert.equal(reordered[5].name, 'Foxtrott');
  // An inserted line is a fresh boat that hasn't presented, in a colour no other boat wears.
  const grown = crewFromList(named, ['Alpha', 'Zulu', 'Bravo', 'Charlie', 'Delta', 'Echo', 'Foxtrot'], makeId);
  assert.equal(grown[1].id, 'new-1');
  assert.equal(grown[1].excluded, false);
  assert.equal(new Set(grown.map(group => group.color)).size, 7);
  assert.ok(grown.every(group => COLORS.includes(group.color)));
  // Twelve boats always find twelve colours.
  const full = crewFromList(grown, Array.from({ length: 12 }, (_, i) => `Crew ${i + 1}`), makeId);
  assert.equal(new Set(full.map(group => group.color)).size, 12);
});
