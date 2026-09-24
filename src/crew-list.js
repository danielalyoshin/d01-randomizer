import { COLORS, MIN_GROUPS, MAX_GROUPS } from './randomizer.js';

export const MAX_NAME = 32;

// Names are compared as the room reads them: case and spacing don't make a new name.
export const cleanName = (name) => name.trim().replace(/\s+/g, ' ');
export const nameKey = (name) => cleanName(name).toLocaleLowerCase();

// A list copied from a doc or a numbered list keeps its markers ("1.", "(2)", "•", "05 ·").
// They are not part of the name. A bare number ("7 Wonders") is.
const MARKER = /^(?:[-*•·◦▪▸►–—]|\(?\d{1,2}[.):]|\d{1,2} ?·)\s+/u;

// A name past 32 characters is cut at the last word that fits, if that keeps most of it.
export function fitName(name) {
  if (name.length <= MAX_NAME) return name;
  let fitted = name.slice(0, MAX_NAME);
  if (!/\s/.test(name[MAX_NAME])) {
    const space = fitted.lastIndexOf(' ');
    if (space >= 20) fitted = fitted.slice(0, space);
  }
  // Never leave half of a surrogate pair, or a dangling comma or dash.
  return fitted.replace(/[\uD800-\uDBFF]$/, '').replace(/[\s,;:·–—-]+$/u, '');
}

// Reads a pasted list, one group per line. Every line keeps its place, so the editor can
// number and flag it: blank lines take no boat, lines past the twelfth have no boat to take.
export function readNameList(text) {
  const lines = String(text).split(/\r\n?|\n/).map((raw) => {
    const typed = cleanName(cleanName(raw).replace(MARKER, ''));
    return { name: fitName(typed), blank: !typed, cut: typed.length > MAX_NAME, duplicate: false, number: 0 };
  });
  const named = lines.filter(line => !line.blank);
  const seen = new Map();
  named.forEach((line, i) => {
    line.number = i + 1;
    const first = seen.get(nameKey(line.name));
    if (first) { first.duplicate = true; line.duplicate = true; } else seen.set(nameKey(line.name), line);
  });
  const duplicate = named.find(line => line.duplicate);
  return {
    lines,
    names: named.map(line => line.name),
    cut: named.filter(line => line.cut),
    duplicate: duplicate?.name,
    ok: named.length >= MIN_GROUPS && named.length <= MAX_GROUPS && !duplicate,
  };
}

// The list becomes the crew, in its order. A name already at the dock keeps its boat; a
// changed line takes over the boat that stood on it, as retyping that name field would, so
// fixing a typo never lifts a Presented stamp. Anything else is a fresh boat.
export function crewFromList(groups, names, makeId = () => crypto.randomUUID()) {
  const kept = new Array(names.length);
  const free = new Set(groups);
  names.forEach((name, i) => {
    const boat = [...free].find(group => nameKey(group.name) === nameKey(name));
    if (boat) { kept[i] = boat; free.delete(boat); }
  });
  names.forEach((name, i) => {
    if (!kept[i] && free.has(groups[i])) { kept[i] = groups[i]; free.delete(groups[i]); }
  });
  const used = new Set(kept.filter(Boolean).map(group => group.color));
  return names.map((name, i) => {
    if (kept[i]) return { ...kept[i], name };
    const color = COLORS.find(color => !used.has(color));
    used.add(color);
    return { id: makeId(), name, color, excluded: false };
  });
}
