const TAU = Math.PI * 2;
export const STEP = 1 / 60;
export const FISH_COLORS = ['#ddb775', '#84c6b7', '#df9681', '#99b8cc', '#bbca93', '#c1a4bc'];

// Mouth positions drive collisions. Body size, color, and boat identity have no
// influence on swimming or contact, so larger fish are no easier to catch.
export function swimmerPosition(fish, time, width) {
  const travel = fish.startX + fish.heading * (time * fish.speed + Math.sin(time * 1.8 + fish.phase) * 22);
  const span = width - 36;
  const wrapped = ((travel % (span * 2)) + span * 2) % (span * 2);
  return {
    x: 18 + (wrapped < span ? wrapped : span * 2 - wrapped),
    y: fish.depth + Math.sin(time * 1.7 + fish.phase) * 17 + Math.sin(time * 0.63 + fish.phase) * 24,
    direction: fish.heading * (wrapped < span ? 1 : -1),
  };
}

export function hookPosition(hook, time, width) {
  const x = width * hook.fraction + 14;
  const bob = Math.sin(time * 2.4 + hook.phase) * 7;
  if (time < 1.2) {
    const progress = time / 1.2;
    const landingY = 238 + hook.offset + Math.sin(1.2 * 2.4 + hook.phase) * 7;
    return {
      x: x + Math.sin(progress * Math.PI) * 26 + Math.sin(1.2 * 1.7 + hook.phase) * hook.sway * progress,
      y: (254 + hook.offset) * (1 - progress) + landingY * progress - Math.sin(progress * Math.PI) * 94,
    };
  }
  // With a smaller school, keep searching through the water column after the
  // first descent. This motion is independent of the fish and their sizes.
  const descent = (time - 1.2) * 48;
  const depth = descent < 650 ? descent : 370 + Math.cos((descent - 650) / 280) * 280;
  return {
    x: x + Math.sin(time * 1.7 + hook.phase) * hook.sway,
    y: 238 + hook.offset + depth + bob,
  };
}

function contactDistance(a, b) {
  const dx = b.x - a.x, dy = b.y - a.y;
  const length = dx * dx + dy * dy;
  const t = length ? Math.max(0, Math.min(1, -(a.x * dx + a.y * dy) / length)) : 0;
  return Math.hypot(a.x + t * dx, a.y + t * dy);
}

export class FishingSimulation {
  constructor({ width, fish, hooks }) {
    this.width = width;
    this.fish = fish.map(fish => ({ ...fish, caught: false }));
    this.hooks = hooks.map(hook => ({ ...hook, fish: null }));
    this.time = 0;
    this.catches = [];
  }

  get complete() { return this.catches.length === this.hooks.length; }

  step() {
    const previous = this.time;
    this.time += STEP;
    const contacts = [];
    const swimmers = this.fish.filter(fish => !fish.caught).map(fish => ({ fish,
      a: swimmerPosition(fish, previous, this.width), b: swimmerPosition(fish, this.time, this.width),
    }));
    for (const hook of this.hooks) {
      if (hook.fish || this.time < 1.6) continue;
      const from = hookPosition(hook, previous, this.width);
      const to = hookPosition(hook, this.time, this.width);
      for (const { fish, a, b } of swimmers) {
        if (Math.abs(b.y - to.y) > 20) continue;
        const distance = contactDistance({ x: a.x - from.x, y: a.y - from.y }, { x: b.x - to.x, y: b.y - to.y });
        if (distance <= 11) contacts.push({ hook, fish, distance, position: to, direction: b.direction });
      }
    }
    // Resolve simultaneous contacts by proximity, not by boat iteration order.
    contacts.sort((a, b) => a.distance - b.distance);
    const caught = [];
    for (const { hook, fish, position, direction } of contacts) {
      if (hook.fish || fish.caught) continue;
      fish.caught = true;
      const result = {
        id: hook.id, name: hook.name, color: hook.color, lane: hook.lane,
        fishId: fish.id, fishColor: fish.color, length: fish.length,
        direction, catchAt: this.time, x: position.x, y: position.y,
      };
      hook.fish = result;
      this.catches.push(result);
      caught.push(result);
    }
    return caught;
  }
}

export function createFishingRound(groups, lengths, random, width) {
  const hooks = groups.flatMap((group, lane) => group.excluded ? [] : [{
    ...group, lane, fraction: (lane + 0.5) / groups.length,
    offset: (lane * 37 % 83) - 26, phase: random(1000) / 1000 * TAU, sway: 10 + random(14),
  }]);
  // Preview the exact same fixed-step simulation for instant reveal. No fish is
  // assigned to a boat. Retry unusually slow swimming layouts before the cast
  // so a sparse school never needs to race through playback at excessive speed.
  // This decision uses geometry only and cannot favor any fish length.
  const targetDuration = hooks.length === 1 ? 7 : 19;
  for (let attempt = 0; attempt < 12; attempt++) {
    const fish = lengths.map((length, i) => ({
      id: i, length, color: FISH_COLORS[random(FISH_COLORS.length)],
      startX: random(Math.ceil(width - 36)), depth: 310 + (i + random(100) / 100) / lengths.length * 620,
      heading: random(2) ? 1 : -1, speed: 105 + random(115), phase: random(1000) / 1000 * TAU,
    }));
    const config = { width, fish, hooks };
    const preview = new FishingSimulation(config);
    for (let i = 0; i < 60 * targetDuration * 2 && !preview.complete; i++) preview.step();
    if (preview.complete) return {
      catches: [...preview.catches].sort((a, b) => a.lane - b.lane),
      simulation: new FishingSimulation(config),
      playbackRate: Math.max(1, preview.time / targetDuration),
    };
  }
  throw new Error('No bites this time. Try casting again.');
}
