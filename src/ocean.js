import { STEP, hookPosition, swimmerPosition } from './fishing.js';
import { fishStyle, drawFish } from './fish-art.js';

const TAU = Math.PI * 2;
const SURFACE = 206;
const INK = '#111111', STOCK = '#f2ede2', RED = '#d7261e';
const DISPLAY = '"Big Shoulders Variable", "Arial Narrow", Impact, sans-serif';
// Shouts are chosen by fish id, which is shuffled independently of length, so they never hint at size.
const SHOUTS = ['BITE!', 'FISH ON!', 'SNAP!', 'WHAM!', 'CHOMP!', 'SPLASH!'];
const lerp = (a, b, t) => a + (b - a) * t;
const ease = (t) => 1 - (1 - Math.min(1, Math.max(0, t))) ** 3;
const clamp = (value, min, max) => Math.min(max, Math.max(min, value));

// Where a line drawn by `at(t)` crosses the waterline, if it does.
function surfaceCrossing(at) {
  let previous = at(0);
  for (let i = 1; i <= 30; i++) {
    const point = at(i / 30);
    if ((previous.y - SURFACE) * (point.y - SURFACE) <= 0 && point.y !== previous.y) {
      const k = (SURFACE - previous.y) / (point.y - previous.y);
      return { x: lerp(previous.x, point.x, k), y: SURFACE };
    }
    previous = point;
  }
  return null;
}

export class Ocean {
  constructor(canvas, { onCatch, onFinish, onDepth }) {
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d');
    this.onCatch = onCatch;
    this.onFinish = onFinish;
    this.onDepth = onDepth;
    this.groups = [];
    this.simulation = null;
    this.particles = [];
    this.bursts = [];
    this.impact = 0;
    this.time = 0;
    this.ambientTime = 0;
    this.camera = 0;
    this.running = false;
    this.paused = false;
    this.reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
    this.school = Array.from({ length: 22 }, (_, i) => ({
      x: Math.random(), y: 325 + (i + Math.random()) / 22 * 850,
      size: 15 + Math.random() * 22, speed: 65 + Math.random() * 95,
      direction: i % 2 ? 1 : -1, phase: Math.random() * TAU, style: i % 6,
    }));
    this.observer = new ResizeObserver(() => this.resize());
    this.observer.observe(canvas);
    this.lastFrame = performance.now();
    this.frame = this.frame.bind(this);
    requestAnimationFrame(this.frame);
  }

  setGroups(groups) { this.groups = groups; }

  resize() {
    const rect = this.canvas.getBoundingClientRect();
    this.width = rect.width;
    this.height = rect.height;
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    this.canvas.width = Math.round(rect.width * dpr);
    this.canvas.height = Math.round(rect.height * dpr);
    this.ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    this.hatch = this.makeHatch(dpr);
    this.draw();
  }

  // Diagonal engraving used for headlands and the seabed, drawn at device resolution.
  makeHatch(dpr) {
    const tile = document.createElement('canvas');
    const size = Math.round(7 * dpr);
    tile.width = tile.height = size;
    const c = tile.getContext('2d');
    c.strokeStyle = INK; c.lineWidth = 1.4 * dpr;
    c.beginPath(); c.moveTo(-1, size + 1); c.lineTo(size + 1, -1);
    c.moveTo(-1, 1); c.lineTo(1, -1); c.moveTo(size - 1, size + 1); c.lineTo(size + 1, size - 1); c.stroke();
    const pattern = this.ctx.createPattern(tile, 'repeat');
    pattern.setTransform(new DOMMatrix().scale(1 / dpr));
    return pattern;
  }

  start(round) {
    this.simulation = round.simulation;
    this.playbackRate = round.playbackRate;
    this.accumulator = 0;
    this.particles = [];
    this.bursts = [];
    this.impact = 0;
    this.time = 0;
    this.camera = 0;
    this.running = true;
    this.paused = false;
  }

  reset() {
    this.running = false;
    this.paused = false;
    this.time = 0;
    this.camera = 0;
    this.simulation = null;
    this.particles = [];
    this.bursts = [];
    this.impact = 0;
    this.onDepth(0);
    this.draw();
  }

  frame(now) {
    const dt = Math.min((now - this.lastFrame) / 1000, 0.05);
    this.lastFrame = now;
    if (!document.hidden) {
      if (!this.reducedMotion.matches && !this.paused) this.ambientTime += dt;
      if (this.running && !this.paused) this.update(dt);
      this.draw();
    }
    requestAnimationFrame(this.frame);
  }

  laneX(lane) { return this.width * ((lane + 0.5) / this.groups.length); }
  boatScale() { return Math.min(1.05, this.width / this.groups.length / 92); }
  fishSize(fish) { return 16 + (fish.length - 140) / 820 * 25; }
  screenX(x) { return x * this.width / this.simulation.width; }

  update(dt) {
    this.time += dt;
    this.impact = Math.max(0, this.impact - dt * 3);
    this.accumulator += dt * this.playbackRate;
    while (this.accumulator >= STEP) {
      const previousTime = this.simulation.time;
      for (const fish of this.simulation.step()) {
        fish.catchTime = this.time;
        this.impact = 1;
        // Loudness follows catch order (the last catch shouts loudest), never fish length.
        const order = this.simulation.hooks.length > 1 ? (this.simulation.catches.length - 1) / (this.simulation.hooks.length - 1) : 1;
        this.bursts.push({ x: fish.x, y: fish.y, time: this.time, lane: fish.lane, loud: lerp(0.8, 1.2, order),
          word: SHOUTS[fish.fishId % SHOUTS.length], tilt: (fish.lane % 2 ? 1 : -1) * (0.3 + (fish.fishId * 0.618) % 1 * 0.35) });
        this.spray(fish.x, fish.y, INK, 10);
        this.spray(fish.x, fish.y, RED, 7);
        this.onCatch(fish);
      }
      if (previousTime < 1.2 && this.simulation.time >= 1.2) {
        for (const hook of this.simulation.hooks) this.spray(this.simulation.width * hook.fraction + 14, 207, INK, 12);
      }
      this.accumulator -= STEP;
    }
    const searching = this.simulation.hooks.filter(hook => !hook.fish);
    const depth = searching.length ? Math.max(...searching.map(hook => hookPosition(hook, this.simulation.time, this.simulation.width).y)) : SURFACE;
    const target = Math.max(0, depth - Math.max(240, this.height * 0.55));
    this.camera = lerp(this.camera, target, 1 - Math.exp(-dt * (searching.length ? 2.5 : 1.6)));
    this.onDepth(Math.max(0, (searching.length ? depth - SURFACE : this.camera) / 50));
    for (const particle of this.particles) {
      particle.life -= dt;
      particle.x += particle.vx * dt;
      particle.y += particle.vy * dt;
      particle.vy += (particle.surface ? 160 : -35) * dt;
      particle.vx *= Math.exp(-dt * 1.4);
    }
    this.particles = this.particles.filter(particle => particle.life > 0);
    this.bursts = this.bursts.filter(burst => this.time - burst.time < 1.3);
    if (this.simulation.complete && this.simulation.catches.every(fish => this.time - fish.catchTime > this.reelDuration(fish) + 0.6)) {
      this.running = false;
      this.onFinish();
    }
  }

  reelDuration(fish) { return 2.3 + (fish.y - SURFACE) / 310; }

  spray(x, y, color, count) {
    for (let i = 0; i < count; i++) {
      const angle = Math.random() * TAU, speed = 30 + Math.random() * 115;
      this.particles.push({ x, y, vx: Math.cos(angle) * speed, vy: Math.sin(angle) * speed - 35,
        life: 0.5 + Math.random() * 0.7, size: 1.2 + Math.random() * 2.6, color, surface: y < 220 });
    }
  }

  draw() {
    if (!this.width || !this.height) return;
    const c = this.ctx, w = this.width, h = this.height, t = this.ambientTime;
    c.fillStyle = STOCK;
    c.fillRect(0, 0, w, h);
    c.save();
    const shake = this.reducedMotion.matches ? 0 : this.impact * 4.5;
    c.translate(Math.sin(this.time * 63) * shake, -this.camera + Math.cos(this.time * 51) * shake);
    c.lineCap = 'round'; c.lineJoin = 'round';
    this.drawSky(w, t);
    this.drawWater(w, h, t);
    this.drawLandscape(w, t);
    this.drawDepthScale(w, h);
    for (const fish of this.simulation ? [] : this.school) {
      const x = ((fish.x * (w + 100) + t * fish.speed * fish.direction) % (w + 100) + w + 100) % (w + 100) - 50;
      if (fish.y > this.camera + h + 40 || fish.y < this.camera - 40) continue;
      const y = fish.y + Math.sin(t * 1.8 + fish.phase) * 19;
      this.drawSpeedLines(x - fish.direction * fish.size * 0.95, y, fish.size, fish.direction, 8 + fish.speed / 16);
      this.drawFish(x, y, fish.size, fish.style, fish.direction, t * 2 + fish.phase);
    }
    this.drawBubbles(w, h, t);
    for (let i = 0; i < this.groups.length; i++) {
      c.globalAlpha = this.groups[i].excluded ? 0.28 : 1;
      this.drawBoat(this.laneX(i), 199 + Math.sin(t * 2 + i) * 4, i, t);
      c.globalAlpha = 1;
    }
    if (this.simulation) this.drawFishing();
    else this.drawIdleHooks(t);
    c.restore();
  }

  drawSky(w, t) {
    const c = this.ctx;
    // A red sun with a misregistered ink ring.
    const sunX = w * 0.75;
    c.fillStyle = RED; c.beginPath(); c.arc(sunX, 66, 33, 0, TAU); c.fill();
    c.strokeStyle = INK; c.lineWidth = 2.5; c.beginPath(); c.arc(sunX + 5, 70, 33, 0, TAU); c.stroke();
    // Lines of force in place of clouds.
    c.lineWidth = 3;
    for (const [x, y, width] of [[0.37, 32, 58], [0.4, 43, 30], [0.53, 28, 50], [0.55, 39, 92]]) {
      const drift = w * x + Math.sin(t * 0.3 + x * 10) * 14;
      c.beginPath(); c.moveTo(drift, y); c.lineTo(drift + width, y); c.stroke();
    }
    c.lineWidth = 2;
    for (const [x, y, size] of [[0.33, 72, 8], [0.37, 56, 6], [0.395, 80, 7]]) {
      const flap = Math.sin(t * 5 + x * 40) * 2.5;
      c.beginPath(); c.moveTo(w * x - size, y - flap); c.lineTo(w * x, y + 3); c.lineTo(w * x + size, y - flap); c.stroke();
    }
    // Engraved headlands.
    const left = new Path2D();
    left.moveTo(0, 150); left.bezierCurveTo(w * 0.07, 136, w * 0.11, 166, w * 0.2, 173);
    left.bezierCurveTo(w * 0.27, 180, w * 0.32, 171, w * 0.36, 186); left.lineTo(w * 0.37, SURFACE + 1); left.lineTo(0, SURFACE + 1); left.closePath();
    const right = new Path2D();
    right.moveTo(w, 144); right.bezierCurveTo(w * 0.9, 134, w * 0.86, 181, w * 0.77, 181);
    right.lineTo(w * 0.71, SURFACE + 1); right.lineTo(w, SURFACE + 1); right.closePath();
    for (const hill of [left, right]) {
      c.fillStyle = STOCK; c.fill(hill);
      c.fillStyle = this.hatch; c.globalAlpha = 0.55; c.fill(hill); c.globalAlpha = 1;
      c.strokeStyle = INK; c.lineWidth = 2.2; c.stroke(hill);
    }
    const lane = w / Math.max(1, this.groups.length);
    if (lane - Math.min(118, lane - 6) > 26) this.drawLighthouse(w - lane, 162);
  }

  drawLighthouse(x, y) {
    const c = this.ctx;
    const tower = new Path2D();
    tower.moveTo(x - 8, y); tower.lineTo(x - 5, y - 46); tower.lineTo(x + 5, y - 46); tower.lineTo(x + 8, y); tower.closePath();
    c.fillStyle = STOCK; c.fill(tower);
    c.save(); c.clip(tower); c.fillStyle = RED;
    for (let band = 0; band < 3; band++) c.fillRect(x - 10, y - 12 - band * 14, 20, 7);
    c.restore();
    c.strokeStyle = INK; c.lineWidth = 2; c.stroke(tower);
    c.fillStyle = INK; c.fillRect(x - 6, y - 55, 12, 9);
    c.fillStyle = STOCK; c.fillRect(x - 3, y - 53, 6, 5);
    c.fillStyle = INK; c.beginPath(); c.moveTo(x - 8, y - 55); c.lineTo(x, y - 62); c.lineTo(x + 8, y - 55); c.fill();
  }

  // The sea is engraved: horizontal lines of force that thicken with depth.
  drawWater(w, h, t) {
    const c = this.ctx;
    const bottom = this.camera + h + 12;
    c.strokeStyle = INK;
    const first = SURFACE + 12 + Math.max(0, Math.floor((this.camera - SURFACE - 24) / 12) * 12);
    for (let y = first; y < bottom; y += 12) {
      const k = clamp((y - SURFACE) / 1300, 0, 1);
      const row = Math.round((y - SURFACE) / 12);
      c.lineWidth = 1.3 + k * 1.3 + (row % 6 === 0 ? 0.7 : 0);
      c.globalAlpha = 0.72 + k * 0.23;
      const amp = 2.4 * (1 - k * 0.75), phase = row * 0.37;
      c.beginPath();
      for (let x = -12; x <= w + 24; x += 24) {
        const yy = y + Math.sin(x / 70 + t * 1.3 + phase) * amp;
        if (x === -12) c.moveTo(x, yy); else c.lineTo(x, yy);
      }
      c.stroke();
    }
    c.globalAlpha = 1;
    // Sun glitter, below the horizon band.
    c.strokeStyle = RED; c.lineWidth = 3;
    for (let i = 0; i < 6; i++) {
      const half = 30 - i * 4.5, x = w * 0.75 + Math.sin(t * 2 + i * 1.7) * 6;
      c.beginPath(); c.moveTo(x - half, 224 + i * 9); c.lineTo(x + half, 224 + i * 9); c.stroke();
    }
    // The waterline itself.
    c.fillStyle = INK;
    c.beginPath(); c.moveTo(0, SURFACE + 9);
    for (let x = 0; x <= w + 6; x += 6) c.lineTo(x, SURFACE - 1 + Math.sin(x / 27 + t * 2.8) * 2.6 + Math.sin(x / 13 - t * 2) * 1.2);
    c.lineTo(w + 6, SURFACE + 9); c.closePath(); c.fill();
  }

  // Depth marks printed in the right margin, every five metres.
  drawDepthScale(w, h) {
    const c = this.ctx;
    c.textAlign = 'right'; c.textBaseline = 'alphabetic';
    for (let metres = 5; metres <= 30; metres += 5) {
      const y = SURFACE + metres * 50;
      if (y < this.camera - 40 || y > this.camera + h + 10) continue;
      c.strokeStyle = INK; c.lineWidth = 2.5;
      c.beginPath(); c.moveTo(w - 78, y); c.lineTo(w, y); c.stroke();
      c.lineWidth = 1.5;
      for (let tick = 1; tick < 5; tick++) {
        c.beginPath(); c.moveTo(w - 14, y - tick * 50); c.lineTo(w, y - tick * 50); c.stroke();
      }
      c.font = `900 30px ${DISPLAY}`;
      const label = c.measureText(`${metres} M`).width;
      c.fillStyle = STOCK; c.fillRect(w - label - 20, y - 34, label + 14, 30);
      c.fillStyle = INK; c.fillText(`${metres} M`, w - 12, y - 8);
      c.fillStyle = RED; c.fillText(`${metres} M`, w - 14, y - 10);
    }
  }

  drawBoat(x, y, index, t) {
    const c = this.ctx, scale = this.boatScale();
    const hooked = this.simulation?.hooks.find(hook => hook.lane === index)?.fish;
    const fighting = hooked && this.time - hooked.catchTime < this.reelDuration(hooked);
    c.save(); c.translate(x, y); c.scale(scale, scale); c.rotate(Math.sin(t * 2 + index) * 0.055 + (fighting ? Math.sin(t * 16) * 0.035 : 0));
    // Wake.
    c.strokeStyle = INK; c.lineWidth = 1.6;
    c.beginPath(); c.ellipse(-4, 13, 42 + Math.sin(t * 3) * 3, 3, 0, 0.2, Math.PI - 0.2); c.stroke();
    c.setLineDash([5, 6]); c.beginPath(); c.ellipse(-6, 18, 50, 3, 0, 0.25, Math.PI - 0.25); c.stroke(); c.setLineDash([]);
    // Mast and pennant: red while this boat fights a fish.
    c.lineWidth = 2.6; c.beginPath(); c.moveTo(-4, -30); c.lineTo(-4, -54); c.stroke();
    c.fillStyle = fighting ? RED : INK;
    c.beginPath(); c.moveTo(-3, -53); c.quadraticCurveTo(6, -50 + Math.sin(t * 5 + index) * 2, 16, -47); c.lineTo(-3, -40); c.closePath(); c.fill();
    c.lineWidth = 1.5; c.stroke();
    // Cabin.
    c.fillStyle = STOCK; c.lineWidth = 2.2;
    c.fillRect(-17, -28, 27, 22); c.strokeRect(-17, -28, 27, 22);
    c.fillStyle = INK; c.fillRect(-12, -23, 7, 8); c.fillRect(0, -23, 6, 8); c.fillRect(-21, -32, 35, 5);
    // Hull, printed solid with its wood-type number.
    c.beginPath(); c.moveTo(-38, -8); c.lineTo(38, -8); c.lineTo(28, 8); c.quadraticCurveTo(1, 17, -26, 9); c.closePath(); c.fill();
    c.strokeStyle = STOCK; c.lineWidth = 1.4; c.beginPath(); c.moveTo(-33, -4.5); c.lineTo(-14, -4.5); c.moveTo(20, -4.5); c.lineTo(33, -4.5); c.stroke();
    c.fillStyle = STOCK; c.font = `900 15px ${DISPLAY}`; c.textAlign = 'center'; c.textBaseline = 'middle';
    c.fillText(String(index + 1).padStart(2, '0'), 3, 1.5);
    // Rod bends out over the right side.
    c.strokeStyle = INK; c.lineWidth = 2.2;
    c.beginPath(); c.moveTo(17, -10); c.quadraticCurveTo(39, fighting ? -32 : -53, 47, -22); c.stroke();
    c.fillStyle = STOCK; c.beginPath(); c.arc(20, -14, 3.6, 0, TAU); c.fill(); c.lineWidth = 1.8; c.stroke();
    c.restore();
  }

  drawBobber(x, y, dip, hot) {
    const c = this.ctx;
    y += dip;
    c.save();
    c.beginPath(); c.arc(x, y, 7, 0, TAU); c.fillStyle = STOCK; c.fill();
    c.beginPath(); c.arc(x, y, 7, Math.PI, TAU); c.fillStyle = hot ? INK : RED; c.fill();
    c.beginPath(); c.arc(x, y, 7, 0, TAU); c.strokeStyle = INK; c.lineWidth = 2.2; c.stroke();
    c.beginPath(); c.moveTo(x, y - 7); c.lineTo(x, y - 13); c.stroke();
    if (dip > 2) {
      c.lineWidth = 1.4;
      for (let ring = 0; ring < 2; ring++) {
        const r = 9 + ring * 6 + (this.time * 18) % 6;
        c.beginPath(); c.ellipse(x, SURFACE + 1, r, r * 0.22, 0, 0, TAU); c.stroke();
      }
    }
    c.restore();
  }

  drawIdleHooks(t) {
    const c = this.ctx, scale = this.boatScale();
    this.groups.forEach((group, i) => {
      if (group.excluded) return;
      const x = this.laneX(i);
      const y = 254 + (i * 37 % 83) - 26 + Math.sin(t * 2 + i) * 7;
      const sway = Math.sin(t * 1.7 + i) * 10;
      const from = { x: x + 47 * scale, y: 199 - 22 * scale }, control = { x: x + 43 * scale + sway, y: 233 }, to = { x: x + 14 + sway, y };
      c.strokeStyle = INK; c.lineWidth = 2.4;
      c.beginPath(); c.moveTo(from.x, from.y); c.quadraticCurveTo(control.x, control.y, to.x, to.y); c.stroke();
      const bobber = surfaceCrossing(k => ({
        x: (1 - k) ** 2 * from.x + 2 * (1 - k) * k * control.x + k * k * to.x,
        y: (1 - k) ** 2 * from.y + 2 * (1 - k) * k * control.y + k * k * to.y,
      }));
      if (bobber) this.drawBobber(bobber.x, bobber.y, Math.sin(t * 3 + i) * 1.2, false);
      this.drawHook(to.x, to.y, false);
    });
  }

  drawSpeedLines(x, y, size, direction, length) {
    const c = this.ctx;
    c.strokeStyle = INK; c.lineWidth = 1.3; c.globalAlpha = 0.5;
    c.beginPath();
    c.moveTo(x, y - size * 0.16); c.lineTo(x - direction * length, y - size * 0.16);
    c.moveTo(x - direction * 4, y + size * 0.14); c.lineTo(x - direction * (length * 0.7 + 4), y + size * 0.14);
    c.stroke();
    c.globalAlpha = 1;
  }

  drawFishing() {
    const c = this.ctx, simulation = this.simulation, scale = this.boatScale();
    for (const fish of simulation.fish) {
      if (fish.caught) continue;
      const position = swimmerPosition(fish, simulation.time, simulation.width);
      if (position.y < this.camera - 45 || position.y > this.camera + this.height + 45) continue;
      const size = this.fishSize(fish), x = this.screenX(position.x);
      const bodyX = x - position.direction * size * 0.62;
      this.drawSpeedLines(bodyX - position.direction * (size + 3), position.y, size, position.direction, 10 + fish.speed / 16);
      this.drawFish(bodyX, position.y, size, fishStyle(fish.color), position.direction, this.ambientTime * 2.5 + fish.phase);
    }
    for (const hook of simulation.hooks) {
      const fish = hook.fish;
      const position = hookPosition(hook, simulation.time, simulation.width);
      let x = this.screenX(position.x), y = position.y, reelProgress = 0, struggle = 0;
      if (fish) {
        const elapsed = this.time - fish.catchTime;
        reelProgress = Math.min(1, Math.max(0, elapsed - 0.6) / (this.reelDuration(fish) - 0.6));
        struggle = (1 - reelProgress) * Math.sin(elapsed * 25 + fish.lane);
        x = lerp(this.screenX(fish.x), this.laneX(hook.lane) + 35 * scale, ease(reelProgress)) + struggle * 10;
        y = lerp(fish.y, 176, ease(reelProgress)) + Math.sin(elapsed * 19) * (1 - reelProgress) * 6;
      }
      if (reelProgress >= 1) {
        if (!fish.landed) {
          fish.landed = true;
          this.spray(simulation.width * hook.fraction + 14, 207, INK, 10);
        }
        continue;
      }
      const rodX = this.laneX(hook.lane) + 47 * scale;
      const rodY = 199 + Math.sin(this.ambientTime * 2 + hook.lane) * 4 - 22 * scale;
      let at;
      c.strokeStyle = fish ? RED : INK;
      c.lineWidth = fish ? 3.6 : 2.6;
      c.beginPath(); c.moveTo(rodX, rodY);
      if (fish) {
        const vibrate = (progress) => Math.sin(progress * Math.PI) * Math.sin(progress * 30 + this.time * 40) * (1 - reelProgress) * 2.8;
        for (let i = 1; i <= 18; i++) {
          const progress = i / 18;
          c.lineTo(lerp(rodX, x, progress) + vibrate(progress), lerp(rodY, y, progress));
        }
        at = (k) => ({ x: lerp(rodX, x, k), y: lerp(rodY, y, k) });
      } else {
        const c1 = { x: rodX + 18, y: lerp(rodY, y, 0.35) }, c2 = { x: x - 15, y: lerp(rodY, y, 0.7) };
        c.bezierCurveTo(c1.x, c1.y, c2.x, c2.y, x, y);
        at = (k) => ({
          x: (1 - k) ** 3 * rodX + 3 * (1 - k) ** 2 * k * c1.x + 3 * (1 - k) * k * k * c2.x + k ** 3 * x,
          y: (1 - k) ** 3 * rodY + 3 * (1 - k) ** 2 * k * c1.y + 3 * (1 - k) * k * k * c2.y + k ** 3 * y,
        });
      }
      c.stroke();
      const bobber = surfaceCrossing(at);
      if (bobber) this.drawBobber(bobber.x, bobber.y, fish ? 7 + Math.sin(this.time * 30) * 2 * (1 - reelProgress) : Math.sin(this.ambientTime * 3 + hook.lane) * 1.2, !!fish);
      // A numbered plate keeps boat identity on the line, not the fish.
      if (y > 260) {
        c.fillStyle = fish ? RED : INK;
        c.beginPath(); c.moveTo(x - 23, y - 68); c.lineTo(x + 23, y - 68); c.lineTo(x + 23, y - 38); c.lineTo(x + 6, y - 38); c.lineTo(x, y - 30); c.lineTo(x - 6, y - 38); c.lineTo(x - 23, y - 38); c.closePath(); c.fill();
        c.fillStyle = STOCK; c.font = `900 25px ${DISPLAY}`; c.textAlign = 'center'; c.textBaseline = 'middle';
        c.fillText(String(hook.lane + 1).padStart(2, '0'), x, y - 52);
      }
      this.drawHook(x, y, !!fish);
      if (fish) {
        const size = this.fishSize(fish);
        c.save(); c.translate(x, y); c.rotate(struggle * 0.24);
        this.drawFish(-fish.direction * size * 0.62, 0, size, fishStyle(fish.fishColor), fish.direction, this.ambientTime * 5, true);
        c.restore();
      } else {
        c.save();
        c.strokeStyle = INK; c.lineWidth = 1.4; c.globalAlpha = 0.6;
        c.setLineDash([3, 5]); c.lineDashOffset = -this.ambientTime * 16;
        c.beginPath(); c.arc(x - 3, y + 1, 17, 0, TAU); c.stroke();
        c.restore();
      }
    }
    for (const particle of this.particles) {
      c.globalAlpha = Math.min(1, particle.life * 1.6);
      c.fillStyle = particle.color;
      c.beginPath(); c.arc(this.screenX(particle.x), particle.y, particle.size, 0, TAU); c.fill();
    }
    c.globalAlpha = 1;
    for (const burst of this.bursts) this.drawBurst(burst);
  }

  // Each catch: a printed shockwave, radiating lines of force, and a slammed shout.
  drawBurst(burst) {
    const c = this.ctx;
    const age = this.time - burst.time, x = this.screenX(burst.x);
    const fade = age > 0.9 ? Math.max(0, 1 - (age - 0.9) / 0.4) : 1;
    c.save();
    c.globalAlpha = Math.max(0, 1 - age / 1.1);
    c.strokeStyle = INK; c.lineWidth = Math.max(0.6, 3.5 * (1 - age));
    c.beginPath(); c.arc(x, burst.y, 14 + ease(age / 1.1) * 62, 0, TAU); c.stroke();
    if (age < 0.6) {
      c.lineWidth = 3;
      for (let i = 0; i < 10; i++) {
        const angle = i / 10 * TAU + 0.2, inner = 20 + age * 50, outer = 32 + age * 90;
        c.strokeStyle = i % 2 ? RED : INK;
        c.beginPath(); c.moveTo(x + Math.cos(angle) * inner, burst.y + Math.sin(angle) * inner);
        c.lineTo(x + Math.cos(angle) * outer, burst.y + Math.sin(angle) * outer); c.stroke();
      }
    }
    const slam = ease(age / 0.16);
    const size = lerp(2.2, 1, slam) + Math.sin(Math.min(1, age / 0.3) * Math.PI) * 0.06;
    const px = clamp(this.width * 0.055, 52, 96) * burst.loud;
    c.globalAlpha = fade;
    c.translate(clamp(x + (x < this.width / 2 ? 1 : -1) * px * 0.9, px * 2, this.width - px * 2), burst.y - 96 - px * 0.35 - age * 12);
    c.rotate(burst.tilt);
    c.scale(size, size);
    c.font = `${Math.round(lerp(300, 900, slam))} ${Math.round(px)}px ${DISPLAY}`;
    c.textAlign = 'center'; c.textBaseline = 'middle';
    c.fillStyle = INK; c.fillText(burst.word, px * 0.07, px * 0.07);
    c.fillStyle = RED; c.fillText(burst.word, 0, 0);
    c.restore();
  }

  drawHook(x, y, hot) {
    const c = this.ctx;
    c.strokeStyle = INK; c.lineWidth = 3.2; c.lineCap = 'round';
    c.beginPath(); c.moveTo(x, y - 8); c.lineTo(x, y + 4); c.bezierCurveTo(x, y + 12, x - 9, y + 12, x - 9, y + 4); c.lineTo(x - 6.5, y + 6.8); c.stroke();
    c.fillStyle = hot ? RED : INK;
    c.beginPath(); c.ellipse(x, y - 11, 3, 4.6, 0, 0, TAU); c.fill();
  }

  drawFish(x, y, size, style, direction, phase, hooked = false) {
    drawFish(this.ctx, x, y, size, style, direction, phase, hooked);
  }

  drawBubbles(w, h, t) {
    const c = this.ctx;
    c.strokeStyle = INK; c.lineWidth = 1.3; c.fillStyle = STOCK;
    for (let i = 0; i < 20; i++) {
      const y = 250 + ((i * 59 - t * (18 + i % 4 * 7) + 1800) % 1500);
      if (y < this.camera || y > this.camera + h) continue;
      const x = (i * 131.3 % w) + Math.sin(t * 0.6 + i) * 8;
      c.beginPath(); c.arc(x, y, 1.8 + i % 3, 0, TAU); c.fill(); c.stroke();
    }
  }

  drawLandscape(w, t) {
    const c = this.ctx;
    for (const base of [this.height + 18, 1120, 1620]) {
      if (base < this.camera - 20 || base - 150 > this.camera + this.height) continue;
      const bed = new Path2D();
      bed.moveTo(0, base - 25); bed.bezierCurveTo(w * 0.25, base - 105, w * 0.35, base + 20, w * 0.65, base - 40);
      bed.quadraticCurveTo(w * 0.9, base - 90, w, base - 50); bed.lineTo(w, base + 80); bed.lineTo(0, base + 80); bed.closePath();
      c.fillStyle = STOCK; c.fill(bed);
      c.fillStyle = this.hatch; c.globalAlpha = 0.45; c.fill(bed); c.globalAlpha = 1;
      c.strokeStyle = INK; c.lineWidth = 2.2; c.stroke(bed);
      for (let i = 0; i < 16; i++) {
        const x = i < 8 ? i * 13 - 25 : w - (i - 8) * 14 + 25;
        const height = 50 + (i * 31 % 86);
        const sway = Math.sin(t * 0.8 + i) * 10;
        c.strokeStyle = INK; c.lineWidth = 3 + i % 3;
        c.beginPath(); c.moveTo(x, base); c.bezierCurveTo(x - 16, base - height * 0.35, x + 19 + sway, base - height * 0.7, x + sway, base - height); c.stroke();
        c.lineWidth = 2.2;
        for (let leaf = 1; leaf <= 3; leaf++) {
          const y = base - height * (leaf / 4), sign = leaf % 2 ? 1 : -1;
          c.beginPath(); c.moveTo(x + 3, y); c.quadraticCurveTo(x + sign * 20, y - 9, x + sign * 15, y - 22); c.stroke();
        }
      }
      c.fillStyle = INK;
      c.beginPath(); c.ellipse(12, base - 6, 57, 27, -0.15, Math.PI, TAU); c.fill();
      c.beginPath(); c.ellipse(w - 5, base - 12, 70, 26, 0.1, Math.PI, TAU); c.fill();
      c.strokeStyle = STOCK; c.lineWidth = 1.6;
      c.beginPath(); c.arc(4, base - 8, 30, Math.PI * 1.15, Math.PI * 1.45); c.stroke();
      c.beginPath(); c.arc(w - 18, base - 14, 38, Math.PI * 1.2, Math.PI * 1.45); c.stroke();
    }
  }
}
