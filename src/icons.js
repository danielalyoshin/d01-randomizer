import { FISH_COLORS } from './fishing.js';

export function icon(name, size = 20) {
  const paths = {
    fish: '<path d="M5 12c5-8 12-8 16 0-4 8-11 8-16 0Z"/><path d="m5 12-4-5v10Z"/><circle cx="16.5" cy="10.5" r=".7" fill="currentColor" stroke="none"/>',
    arrow: '<path d="M4 12h15m-6-6 6 6-6 6"/>',
    plus: '<path d="M12 5v14M5 12h14"/>',
    sliders: '<path d="M4 7h6m4 0h6M4 17h10m4 0h2"/><circle cx="12" cy="7" r="2"/><circle cx="16" cy="17" r="2"/>',
    chevron: '<path d="m6 9 6 6 6-6"/>',
    close: '<path d="m6 6 12 12M6 18 18 6"/>',
    check: '<path d="m5 12 4 4L19 6"/>',
    sound: '<path d="m11 4-6 5H2v6h3l6 5V4Z"/><path d="M15 8a6 6 0 0 1 0 8m3-11a10 10 0 0 1 0 14"/>',
    muted: '<path d="m11 4-6 5H2v6h3l6 5V4Z"/><path d="m16 9 6 6m-6 0 6-6"/>',
    expand: '<path d="M8 3H3v5m13-5h5v5M3 16v5h5m13-5v5h-5"/>',
    pause: '<path d="M8 5v14M16 5v14"/>',
    play: '<path d="m8 4 12 8-12 8V4Z"/>',
    skip: '<path d="m4 5 11 7-11 7V5Zm15 0v14"/>',
    anchor: '<circle cx="12" cy="5" r="2"/><path d="M12 7v14M8 10h8M3 13v2a9 9 0 0 0 18 0v-2M1 15l2-2 2 2m14 0 2-2 2 2"/>',
    reset: '<path d="M3 10a9 9 0 1 1 1 7M3 4v6h6"/>',
    help: '<circle cx="12" cy="12" r="9"/><path d="M9 9a3 3 0 0 1 6 0c0 2-3 2-3 4m0 3v.1"/>',
    ruler: '<path d="M3 7h18v10H3zM7 7v4m5-4v6m5-6v4"/>',
    copy: '<rect x="8" y="8" width="12" height="13" rx="2"/><path d="M16 8V5a2 2 0 0 0-2-2H5a2 2 0 0 0-2 2v9a2 2 0 0 0 2 2h3"/>',
  };
  return `<svg width="${size}" height="${size}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${paths[name] || paths.fish}</svg>`;
}

const INK = '#111111', STOCK = '#f2ede2', RED = '#d7261e';
const BODY = 'M35 36c27-36 83-39 113 0-30 39-86 36-113 0Z';
let artId = 0;

// Fish colors are decorative identities; the print renders each one as an ink marking.
export function fishStyle(color) { return Math.max(0, FISH_COLORS.indexOf(color)); }

export function fishArt(color, { red = false } = {}) {
  const id = `fish-clip-${++artId}`;
  const style = fishStyle(color);
  const dark = !red && (style === 0 || style === 2);
  const body = red ? RED : dark ? INK : STOCK;
  const fins = red ? RED : INK;
  const clip = (content) => `<g clip-path="url(#${id})">${content}</g>`;
  const markings = red ? clip(`<path d="M50 58 76 10M64 62 90 14" stroke="${INK}" stroke-opacity=".35" stroke-width="5"/>`)
    : style === 1 ? clip(`<g fill="${INK}"><rect x="58" width="11" height="72"/><rect x="80" width="11" height="72"/><rect x="102" width="8" height="72"/></g>`)
    : style === 2 ? `<g fill="${STOCK}"><circle cx="60" cy="31" r="4.2"/><circle cx="75" cy="43" r="3.6"/><circle cx="90" cy="27" r="4.2"/><circle cx="103" cy="42" r="3.2"/></g>`
    : style === 3 ? clip(`<path d="M58 20q9 16 0 32M76 16q10 20 0 40M94 17q10 19 0 38" stroke="${INK}" stroke-width="3"/>`)
    : style === 4 ? clip(`<rect width="160" height="35" fill="${INK}"/>`)
    : style === 5 ? clip(`<path d="M34 66 66 6M48 68 80 8M62 68 94 8M76 68l32-60M90 68l32-60" stroke="${INK}" stroke-width="3"/>`)
    : '';
  const line = { stroke: INK, 'stroke-width': 2.4, 'stroke-linejoin': 'round', 'vector-effect': 'non-scaling-stroke' };
  const attrs = Object.entries(line).map(([key, value]) => `${key}="${value}"`).join(' ');
  return `<svg viewBox="0 0 160 72" preserveAspectRatio="xMidYMid meet" fill="none" aria-hidden="true"><defs><clipPath id="${id}"><path d="${BODY}"/></clipPath></defs><path d="M44 36Q29 27 12 15l8 21-8 21q18-12 32-21Z" fill="${fins}" ${attrs}/><path d="M62 21Q69 5 85 7l14 14ZM72 50l12 13 15-14Z" fill="${fins}" ${attrs}/><path d="${BODY}" fill="${body}"/>${markings}<path d="${BODY}" ${attrs}/><path d="M108 20q-12 16 0 32" stroke="${dark || red ? STOCK : INK}" stroke-width="3" stroke-linecap="round"/><circle cx="123" cy="30" r="6.5" fill="${STOCK}" ${attrs}/><circle cx="124.6" cy="30" r="3.1" fill="${INK}"/></svg>`;
}
