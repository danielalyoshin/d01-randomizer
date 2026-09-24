import { FISH_COLORS } from './fishing.js';

const INK = '#111111', STOCK = '#f2ede2', RED = '#d7261e';
const BODY = 'M36 34C49 31 55 20 76 18C103 14 126 21 143 31L151 35Q154 37 150 40L143 43C126 56 101 59 78 52C56 46 49 40 36 39Z';
const TAIL = 'M39 34C28 28 22 17 9 12C10 24 15 31 21 36C15 42 10 51 9 61C23 55 30 45 39 39Z';
const FINS = 'M59 23C65 16 68 8 81 5C84 11 92 12 98 19ZM62 47Q68 57 82 61L80 51ZM92 52Q102 63 118 59L112 52Z';
const FIN_RAYS = 'M64 22 79 10M72 20 83 13M80 19 88 16M68 50 78 57M98 54 111 58';
const TAIL_RAYS = 'M34 35 15 20M32 36 19 29M32 38 18 45M34 39 15 54';
const GILL = 'M119 24C111 30 111 42 120 49';
const PECTORAL = 'M111 40Q99 38 91 48Q102 48 111 43';
const EYE = 'M141.5 31.5a4.2 4.2 0 1 1-8.4 0a4.2 4.2 0 1 1 8.4 0';
const PUPIL = 'M139.8 31.3a1.9 1.9 0 1 1-3.8 0a1.9 1.9 0 1 1 3.8 0';
const MARKINGS = [
  '',
  'M55 23Q62 34 57 47L64 50Q70 35 63 19ZM74 17Q83 34 76 53L83 55Q90 34 82 16ZM94 17Q103 34 96 56L102 55Q110 35 101 18Z',
  'M62 32a2.8 2.8 0 1 0 5.6 0a2.8 2.8 0 1 0-5.6 0M77 26a3 3 0 1 0 6 0a3 3 0 1 0-6 0M76 41a2.6 2.6 0 1 0 5.2 0a2.6 2.6 0 1 0-5.2 0M92 31a3 3 0 1 0 6 0a3 3 0 1 0-6 0M95 46a2.5 2.5 0 1 0 5 0a2.5 2.5 0 1 0-5 0',
  'M59 28q8 5 0 10m8-17q9 5 0 10m0 4q9 5 0 10m9-19q9 5 0 10m0 4q9 5 0 10m9-29q9 5 0 10m0 4q9 5 0 10m9-19q9 5 0 10m0 4q9 5 0 10m9-29q9 5 0 10',
  'M32 12H156V32Q126 27 104 34T61 34L32 38Z',
  'M49 44 64 20M60 49 79 18M73 54 94 18M87 56 108 21M100 55 112 29',
];

// One engraving supplies the canvas school, the verdict and the measuring bars.
// Keep the mouth at (152, 36): the canvas transform aligns it with the hook.
export function fishStyle(color) { return Math.max(0, FISH_COLORS.indexOf(color)); }

const artwork = new Map();
function layersFor(style, red, hooked) {
  const key = `${style}:${red}:${hooked}`;
  if (artwork.has(key)) return artwork.get(key);
  const dark = style === 0 || style === 2;
  const bodyInk = red ? RED : INK;
  const body = red || dark ? bodyInk : STOCK;
  const cut = dark || red ? STOCK : INK;
  const layers = [
    { d: TAIL, fill: bodyInk, stroke: INK, width: 1.8, tail: true },
    { d: TAIL_RAYS, stroke: STOCK, width: 1.25, tail: true, fine: true },
    { d: FINS, fill: bodyInk, stroke: INK, width: 1.8 },
    { d: FIN_RAYS, stroke: STOCK, width: 1.25, fine: true },
    { d: BODY, fill: body },
  ];
  if (MARKINGS[style]) layers.push({
    d: MARKINGS[style], clip: true,
    ...(style === 3 || style === 5
      ? { stroke: red ? INK : bodyInk, width: style === 3 ? 1.6 : 2 }
      : { fill: style === 2 ? STOCK : INK }),
  });
  layers.push(
    { d: 'M58 28Q78 17 105 23', stroke: dark || red || style === 4 ? STOCK : INK, width: 1.2, fine: true },
    { d: 'M60 42Q82 52 108 49', stroke: cut, width: 1.2, fine: true },
    { d: BODY, stroke: hooked ? RED : INK, width: hooked ? 4 : 2.2 },
    // A paper keyline lets the gill read across both halves of the split fish.
    ...(style === 4 && !red ? [{ d: GILL, stroke: STOCK, width: 4 }] : []),
    { d: GILL, stroke: cut, width: 2.2 },
    { d: PECTORAL, fill: body, stroke: cut, width: 1.5, fine: true },
    { d: 'M143 38 151 37', stroke: dark || red ? STOCK : INK, width: 1.4, fine: true },
    { d: EYE, fill: STOCK, stroke: INK, width: 1.5 },
    { d: PUPIL, fill: INK },
  );
  artwork.set(key, layers);
  return layers;
}

let artId = 0;
export function fishArt(color, { red = false, detail = false } = {}) {
  const id = `fish-clip-${++artId}`;
  const paths = layersFor(fishStyle(color), red, false)
    .filter(layer => detail || !layer.fine)
    .map(layer => `<path d="${layer.d}" fill="${layer.fill || 'none'}"${layer.stroke ? ` stroke="${layer.stroke}" stroke-width="${layer.width}"` : ''}${layer.clip ? ` clip-path="url(#${id})"` : ''}/>`).join('');
  return `<svg viewBox="6 0 150 72" preserveAspectRatio="xMidYMid meet" fill="none" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><defs><clipPath id="${id}"><path d="${BODY}"/></clipPath></defs>${paths}</svg>`;
}

// Cache the paths once; swimming only transforms the drawing, never rebuilds it.
const paths = new Map();
function pathFor(d) {
  if (!paths.has(d)) paths.set(d, new Path2D(d));
  return paths.get(d);
}

function poseTail(c, phase) {
  const beat = Math.sin(phase * 5);
  c.translate(38, 36);
  c.rotate(beat * 0.065);
  c.scale(1 + beat * 0.045, 1);
  c.translate(-38, -36);
}

export function drawFish(c, x, y, size, style, direction, phase, hooked = false) {
  const scale = size / 90;
  c.save();
  c.translate(x, y);
  c.scale(direction * scale, scale);
  c.translate(-96, -36);
  c.lineCap = 'round'; c.lineJoin = 'round';
  // A narrow paper reserve keeps the sea's engraving off swimmers. A hooked fish
  // skips it: its red outline already stands clear, and the hook must meet its mouth.
  c.fillStyle = STOCK; c.strokeStyle = STOCK; c.lineWidth = 2.2 + 4 / scale;
  for (const d of hooked ? [] : [TAIL, FINS, BODY]) {
    c.save();
    if (d === TAIL) poseTail(c, phase);
    const path = pathFor(d);
    c.fill(path); c.stroke(path);
    c.restore();
  }
  for (const layer of layersFor(style, false, hooked)) {
    if (layer.fine && size < 28) continue;
    c.save();
    if (layer.tail) poseTail(c, phase);
    if (layer.clip) c.clip(pathFor(BODY));
    const path = pathFor(layer.d);
    if (layer.fill) { c.fillStyle = layer.fill; c.fill(path); }
    if (layer.stroke) {
      c.strokeStyle = layer.stroke;
      c.lineWidth = Math.max(layer.width, (layer.fine ? 0.45 : layer.d === BODY ? 1 : 0.6) / scale);
      c.stroke(path);
    }
    c.restore();
  }
  c.restore();
}
