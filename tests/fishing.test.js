import test from 'node:test';
import assert from 'node:assert/strict';
import { FishingSimulation, STEP, hookPosition, swimmerPosition } from '../src/fishing.js';
import { COLORS, createExpedition } from '../src/randomizer.js';

function seededRandom(seed) {
  return max => {
    seed = (Math.imul(seed, 1664525) + 1013904223) >>> 0;
    return Math.floor(seed / 2 ** 32 * max);
  };
}
function crew(count) {
  return Array.from({ length: count }, (_, i) => ({ id: `boat-${i}`, name: `Boat ${i}`, color: COLORS[i], excluded: false }));
}
function finish(simulation) {
  for (let i = 0; i < 60 * 180 && !simulation.complete; i++) simulation.step();
  assert.equal(simulation.complete, true);
  return [...simulation.catches].sort((a, b) => a.lane - b.lane);
}

test('live contact simulation matches instant reveal for each crew size and viewport', () => {
  for (const width of [688, 1398]) {
    for (const count of [2, 8, 12]) {
      const groups = crew(count);
      groups[0].excluded = true;
      for (let seed = 1; seed <= 8; seed++) {
        const round = createExpedition(groups, seededRandom(seed), width);
        assert.ok(round.simulation.fish.length <= 36);
        assert.ok(round.simulation.fish.length > count);
        assert.ok(round.playbackRate <= 2.001);
        const actual = finish(round.simulation);
        assert.deepEqual(actual, round.catches);
        assert.equal(actual.length, count - 1);
        assert.equal(new Set(actual.map(fish => fish.fishId)).size, actual.length);
        assert.ok(actual.every(fish => fish.id !== 'boat-0'));
        for (const caught of actual) {
          const swimmer = round.simulation.fish.find(fish => fish.id === caught.fishId);
          assert.equal(caught.length, swimmer.length);
          assert.equal(caught.fishColor, swimmer.color);
          const mouth = swimmerPosition(swimmer, caught.catchAt, width);
          // Swept contact can finish a tick just beyond the 11px catch radius.
          assert.ok(Math.hypot(mouth.x - caught.x, mouth.y - caught.y) < 17);
        }
      }
    }
  }
});

test('changing fish lengths and colors cannot change which fish a boat hooks', () => {
  const { simulation } = createExpedition(crew(8), seededRandom(93), 1398);
  const alternate = new FishingSimulation({
    width: simulation.width, hooks: simulation.hooks,
    fish: simulation.fish.map((fish, index, all) => ({ ...fish, length: all[all.length - index - 1].length, color: '#ff0000' })),
  });
  const original = finish(simulation);
  const changed = finish(alternate);
  assert.deepEqual(changed.map(fish => [fish.id, fish.fishId, fish.catchAt]), original.map(fish => [fish.id, fish.fishId, fish.catchAt]));
  assert.ok(changed.every(fish => fish.fishColor === '#ff0000'));
  assert.notDeepEqual(changed.map(fish => fish.length), original.map(fish => fish.length));
});

test('hooks catch a passing fish of any color only on contact', () => {
  const width = 1000;
  const hook = { id: 'boat', lane: 0, fraction: 0.5, offset: 0, phase: 0, sway: 0, color: '#ff0000' };
  const fish = { id: 1, startX: 0, depth: 400, speed: 150, heading: 1, phase: 0, length: 400, color: '#0000ff' };
  const at = 4 + STEP;
  const position = hookPosition(hook, at, width);
  const initial = swimmerPosition(fish, at, width);
  fish.startX += position.x - initial.x;
  fish.depth += position.y - initial.y;
  const simulation = new FishingSimulation({ width, hooks: [hook], fish: [fish] });
  simulation.time = 4;
  assert.equal(simulation.step().length, 1);
  assert.equal(simulation.catches[0].fishColor, '#0000ff');
  assert.equal(simulation.catches[0].color, '#ff0000');
  assert.equal(simulation.step().length, 0);
  const miss = new FishingSimulation({ width, hooks: [hook], fish: [{ ...fish, depth: fish.depth + 60 }] });
  miss.time = 4;
  assert.equal(miss.step().length, 0);
});

test('lines have different depths and fish continue swimming without active hooks', () => {
  const { simulation } = createExpedition(crew(8), seededRandom(31), 1398);
  const depths = simulation.hooks.map(hook => hookPosition(hook, 5, simulation.width).y);
  assert.ok(Math.max(...depths) - Math.min(...depths) > 50);
  const fish = simulation.fish[0];
  const before = swimmerPosition(fish, 0, simulation.width);
  const after = swimmerPosition(fish, 1, simulation.width);
  assert.ok(Math.abs(after.x - before.x) > 70);
  const hook = simulation.hooks[0];
  // Sparse schools still get another pass if a hook misses on its descent.
  assert.ok(hookPosition(hook, 15, simulation.width).y - hookPosition(hook, 30, simulation.width).y > 400);
});
