import { createFishingRound } from './fishing.js';

export const MIN_GROUPS = 2;
export const MAX_GROUPS = 12;
export const COLORS = ['#e88a58', '#e7bd58', '#8baa8c', '#789eae', '#b68fa5', '#ce715f', '#a4b56c', '#8f94bd', '#b58a5a', '#73b8ad', '#d69bb0', '#b7a56b'];
export const STORAGE_KEY = 'daily-catch-v1';

// Rejection sampling avoids the modulo bias of randomUint32 % max.
export function randomInt(max, randomValues = (array) => crypto.getRandomValues(array)) {
  if (!Number.isInteger(max) || max < 1 || max > 2 ** 32) throw new RangeError('Invalid random range');
  const limit = Math.floor(2 ** 32 / max) * max;
  const buffer = new Uint32Array(1);
  do { randomValues(buffer); } while (buffer[0] >= limit);
  return buffer[0] % max;
}

export function shuffle(items, random = randomInt) {
  const result = [...items];
  for (let i = result.length - 1; i > 0; i--) {
    const j = random(i + 1);
    [result[i], result[j]] = [result[j], result[i]];
  }
  return result;
}

export function createExpedition(groups, random = randomInt, width = 1400) {
  if (!Array.isArray(groups) || groups.length < MIN_GROUPS || groups.length > MAX_GROUPS) {
    throw new RangeError(`Choose ${MIN_GROUPS}–${MAX_GROUPS} groups`);
  }
  const activeGroups = groups.filter(group => !group.excluded);
  if (!activeGroups.length) throw new RangeError('Choose at least one boat that has not presented');
  // Every roaming fish has a unique length before any hook is cast. Length is
  // shuffled independently of movement; contact geometry never uses fish size.
  const schoolSize = Math.min(36, Math.max(20, activeGroups.length * 2 + 6, Math.ceil(width / 50)));
  const lengths = shuffle(Array.from({ length: 821 }, (_, i) => i + 140), random).slice(0, schoolSize);
  return createFishingRound(groups, lengths, random, width);
}

export function smallestCatch(catches) {
  return catches.reduce((smallest, fish) => !smallest || fish.length < smallest.length ? fish : smallest, null);
}

export function formatLength(length) {
  return (length / 10).toFixed(1);
}

export function defaultGroups() {
  return Array.from({ length: 8 }, (_, i) => ({ id: crypto.randomUUID(), name: `Group ${String(i + 1).padStart(2, '0')}`, color: COLORS[i], excluded: false }));
}

export function restoreState(raw) {
  try {
    const state = JSON.parse(raw);
    if (!state || !Array.isArray(state.groups) || state.groups.length < MIN_GROUPS || state.groups.length > MAX_GROUPS) return null;
    const validGroup = (group) => group && typeof group.id === 'string' && group.id.length > 0 && group.id.length <= 100 && typeof group.name === 'string' && group.name.trim().length > 0 && group.name.length <= 32 && COLORS.includes(group.color);
    if (!state.groups.every(validGroup) || new Set(state.groups.map((group) => group.id)).size !== state.groups.length) return null;
    const groups = state.groups.map(({id, name, color, excluded}) => ({id, name: name.trim(), color, excluded: excluded === true}));
    let lastCatch = null;
    if (Array.isArray(state.lastCatch) && state.lastCatch.length >= 1 && state.lastCatch.length <= MAX_GROUPS && state.lastCatch.every((item) => validGroup(item) && Number.isInteger(item.length) && item.length >= 140 && item.length <= 960 && (item.fishColor === undefined || /^#[0-9a-f]{6}$/i.test(item.fishColor))) && new Set(state.lastCatch.map(item => item.id)).size === state.lastCatch.length && new Set(state.lastCatch.map(item => item.length)).size === state.lastCatch.length) {
      lastCatch = state.lastCatch.map(({id, name, color, fishColor, length}) => ({id, name, color, ...(fishColor ? {fishColor} : {}), length}));
    }
    return { groups, lastCatch };
  } catch { return null; }
}
