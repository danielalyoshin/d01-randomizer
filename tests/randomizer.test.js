import test from 'node:test';
import assert from 'node:assert/strict';
import { createExpedition, smallestCatch, randomInt, shuffle, restoreState, defaultGroups } from '../src/randomizer.js';

test('each supported crew produces unique fish and exactly one result per group', () => {
  for (let count = 2; count <= 12; count++) {
    const groups = Array.from({length: count}, (_, i) => ({id: String(i), name: `Group ${i}`, color: '#e88a58'}));
    for (let run = 0; run < 40; run++) {
      const { catches } = createExpedition(groups);
      assert.equal(catches.length, count);
      assert.equal(new Set(catches.map(item => item.length)).size, count);
      assert.deepEqual(catches.map(item => item.id), groups.map(group => group.id));
      assert.ok(catches.every(item => item.length >= 140 && item.length <= 960 && item.catchAt > 1.6));
      assert.equal(smallestCatch(catches).length, Math.min(...catches.map(item => item.length)));
    }
  }
});

test('presented groups never take part, including when only one group remains', () => {
  const groups = defaultGroups();
  groups[0].excluded = true;
  assert.equal(createExpedition(groups).catches.length, 7);
  assert.ok(createExpedition(groups).catches.every(item => item.id !== groups[0].id));
  groups.forEach((group, index) => { group.excluded = index !== 7; });
  assert.equal(smallestCatch(createExpedition(groups).catches).id, groups[7].id);
  groups[7].excluded = true;
  assert.throws(() => createExpedition(groups), RangeError);
});

test('Fisher–Yates reaches each permutation once for all possible three-item draws', () => {
  const permutations = new Set();
  for (let a = 0; a < 3; a++) for (let b = 0; b < 2; b++) {
    const choices = [a, b];
    permutations.add(shuffle(['A', 'B', 'C'], () => choices.shift()).join(''));
  }
  assert.equal(permutations.size, 6);
});

test('randomInt discards biased values and respects boundaries', () => {
  const values = [4294967295, 4294967294, 5];
  assert.equal(randomInt(10, (array) => { array[0] = values.shift(); }), 5);
  assert.equal(values.length, 0);
  for (const max of [0, -1, 1.5, 2 ** 32 + 1]) assert.throws(() => randomInt(max), RangeError);
});

test('invalid crews are rejected', () => {
  for (const groups of [null, [], [{}], Array(13).fill({})]) assert.throws(() => createExpedition(groups), RangeError);
});

test('saved state validates data and keeps results independent of later crew edits', () => {
  const groups = defaultGroups();
  const { catches: lastCatch } = createExpedition(groups);
  assert.equal(restoreState(JSON.stringify({groups, lastCatch})).lastCatch.length, 8);
  assert.equal(restoreState('{broken'), null);
  assert.equal(restoreState(JSON.stringify({groups: [{id: 'a'}]})), null);
  const duplicate = [...groups];
  duplicate[1] = groups[0];
  assert.equal(restoreState(JSON.stringify({groups: duplicate})), null);
  assert.equal(restoreState(JSON.stringify({groups, lastCatch: [{...lastCatch[0], length: -2}, ...lastCatch.slice(1)]})).lastCatch, null);
  const edited = groups.map(group => ({...group, name: 'Renamed'}));
  assert.equal(restoreState(JSON.stringify({groups: edited, lastCatch})).lastCatch[0].name, 'Group 01');
  const singleCatch = restoreState(JSON.stringify({groups, lastCatch: [lastCatch[0]]}));
  assert.equal(singleCatch.lastCatch.length, 1);
  assert.equal(singleCatch.lastCatch[0].fishColor, lastCatch[0].fishColor);
  assert.equal(restoreState(JSON.stringify({groups, lastCatch: [{...lastCatch[0], fishColor: '<script>'}]})).lastCatch, null);
});
