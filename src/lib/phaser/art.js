// Grafica procedurale condivisa tra le scene Phaser.
// Tutte le texture sono disegnate via Canvas 2D al primo uso: nessun file immagine,
// quindi l'app resta leggera e funziona offline.

export const PALETTE = {
  orion: 0xff6a2b,
  orionCss: '#ff6a2b',
  trail: 0xffa36b,
  orbit: 0x8ab8ff,
  orbitFaint: 0x4a6fa8,
  earthLabel: '#9cc4ff',
  moonLabel: '#d6dbe4',
  label: '#e4e9f2',
  ok: 0x34d399,
  fail: 0xf87171,
};

export const LABEL_STYLE = {
  fontFamily: '"JetBrains Mono", Consolas, monospace',
  fontSize: '13px',
  fontStyle: 'bold',
  color: PALETTE.label,
  stroke: '#04060b',
  strokeThickness: 4,
};

// Generatore pseudo-casuale deterministico: la Terra ha sempre gli stessi continenti
function rng(seed) {
  let s = seed >>> 0;
  return () => {
    s = (s * 1664525 + 1013904223) >>> 0;
    return s / 4294967296;
  };
}

function makeCanvasTexture(scene, key, size, draw) {
  if (scene.textures.exists(key)) return key;
  const tex = scene.textures.createCanvas(key, size, size);
  const ctx = tex.getContext();
  draw(ctx, size);
  tex.refresh();
  return key;
}

// Ombreggiatura sferica: luce da sinistra (il Sole), lato notte a destra
function shadeSphere(ctx, size, nightAlpha = 0.85) {
  const r = size / 2;
  const g = ctx.createRadialGradient(r * 0.6, r * 0.75, r * 0.1, r, r, r * 1.05);
  g.addColorStop(0, 'rgba(255,255,255,0.10)');
  g.addColorStop(0.55, 'rgba(0,0,0,0)');
  g.addColorStop(1, 'rgba(0,0,0,0.45)');
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, size, size);

  const t = ctx.createLinearGradient(r * 0.9, 0, size, 0);
  t.addColorStop(0, 'rgba(2,4,12,0)');
  t.addColorStop(0.45, `rgba(2,4,12,${nightAlpha * 0.7})`);
  t.addColorStop(1, `rgba(2,4,12,${nightAlpha})`);
  ctx.fillStyle = t;
  ctx.fillRect(0, 0, size, size);
}

function clipCircle(ctx, size) {
  const r = size / 2;
  ctx.save();
  ctx.beginPath();
  ctx.arc(r, r, r - 1, 0, Math.PI * 2);
  ctx.clip();
}

export function ensureEarthTexture(scene) {
  return makeCanvasTexture(scene, 'mc-earth', 512, (ctx, size) => {
    const r = size / 2;
    const rand = rng(42);
    clipCircle(ctx, size);

    const ocean = ctx.createRadialGradient(r * 0.7, r * 0.7, r * 0.1, r, r, r);
    ocean.addColorStop(0, '#2f7fd6');
    ocean.addColorStop(1, '#0d3570');
    ctx.fillStyle = ocean;
    ctx.fillRect(0, 0, size, size);

    // Continenti: grappoli di cerchi sovrapposti
    const land = ['#3e7f4c', '#4f8a45', '#8a7b4e', '#6b8a4a'];
    for (let c = 0; c < 7; c++) {
      const cx = rand() * size;
      const cy = size * 0.15 + rand() * size * 0.7;
      const blobs = 14 + Math.floor(rand() * 18);
      ctx.fillStyle = land[c % land.length];
      for (let i = 0; i < blobs; i++) {
        ctx.beginPath();
        ctx.arc(cx + (rand() - 0.5) * 120, cy + (rand() - 0.5) * 90, 8 + rand() * 26, 0, Math.PI * 2);
        ctx.fill();
      }
    }
    // Calotte polari
    ctx.fillStyle = 'rgba(240,248,255,0.9)';
    ctx.beginPath();
    ctx.ellipse(r, 6, r * 0.55, 30, 0, 0, Math.PI * 2);
    ctx.ellipse(r, size - 6, r * 0.6, 34, 0, 0, Math.PI * 2);
    ctx.fill();
    // Nuvole
    for (let i = 0; i < 60; i++) {
      ctx.fillStyle = `rgba(255,255,255,${0.15 + rand() * 0.35})`;
      ctx.beginPath();
      ctx.ellipse(rand() * size, rand() * size, 14 + rand() * 40, 4 + rand() * 9, rand() * 0.6 - 0.3, 0, Math.PI * 2);
      ctx.fill();
    }
    shadeSphere(ctx, size, 0.88);
    ctx.restore();

    // Bordo atmosferico
    ctx.strokeStyle = 'rgba(140,200,255,0.75)';
    ctx.lineWidth = 6;
    ctx.beginPath();
    ctx.arc(r, r, r - 4, Math.PI * 0.45, Math.PI * 1.55);
    ctx.stroke();
  });
}

export function ensureMoonTexture(scene) {
  return makeCanvasTexture(scene, 'mc-moon', 512, (ctx, size) => {
    const r = size / 2;
    const rand = rng(7);
    clipCircle(ctx, size);

    const base = ctx.createRadialGradient(r * 0.7, r * 0.7, r * 0.1, r, r, r);
    base.addColorStop(0, '#d9dbe0');
    base.addColorStop(1, '#8d9099');
    ctx.fillStyle = base;
    ctx.fillRect(0, 0, size, size);

    // Mari lunari
    ctx.fillStyle = 'rgba(90,94,104,0.55)';
    for (let i = 0; i < 9; i++) {
      ctx.beginPath();
      ctx.ellipse(size * 0.2 + rand() * size * 0.6, size * 0.2 + rand() * size * 0.6, 30 + rand() * 70, 25 + rand() * 50, rand() * Math.PI, 0, Math.PI * 2);
      ctx.fill();
    }
    // Crateri con bordo illuminato
    for (let i = 0; i < 70; i++) {
      const x = rand() * size;
      const y = rand() * size;
      const cr = 3 + Math.pow(rand(), 2) * 30;
      ctx.fillStyle = 'rgba(70,72,80,0.45)';
      ctx.beginPath();
      ctx.arc(x, y, cr, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = 'rgba(245,246,250,0.35)';
      ctx.lineWidth = Math.max(1, cr * 0.15);
      ctx.beginPath();
      ctx.arc(x, y, cr, Math.PI * 0.6, Math.PI * 1.4);
      ctx.stroke();
    }
    shadeSphere(ctx, size, 0.9);
    ctx.restore();
  });
}

// Orion vista di lato: capsula conica + modulo di servizio + pannelli solari a X
export function ensureOrionTexture(scene) {
  return makeCanvasTexture(scene, 'mc-orion', 128, (ctx, size) => {
    const c = size / 2;
    ctx.translate(c, c);
    // Pannelli solari
    ctx.fillStyle = '#2b4f8f';
    ctx.strokeStyle = '#9cc4ff';
    ctx.lineWidth = 2;
    for (const a of [Math.PI / 4, -Math.PI / 4, (3 * Math.PI) / 4, (-3 * Math.PI) / 4]) {
      ctx.save();
      ctx.translate(-14, 0);
      ctx.rotate(a);
      ctx.fillRect(10, -6, 40, 12);
      ctx.strokeRect(10, -6, 40, 12);
      ctx.restore();
    }
    // Modulo di servizio
    ctx.fillStyle = '#d7dbe3';
    ctx.fillRect(-30, -13, 30, 26);
    ctx.fillStyle = '#9aa3b2';
    ctx.fillRect(-36, -8, 6, 16);
    // Capsula (punta verso destra = direzione di moto)
    ctx.fillStyle = '#f2f4f8';
    ctx.beginPath();
    ctx.moveTo(0, -17);
    ctx.lineTo(30, -6);
    ctx.lineTo(30, 6);
    ctx.lineTo(0, 17);
    ctx.closePath();
    ctx.fill();
    ctx.fillStyle = '#ff6a2b';
    ctx.fillRect(-2, -17, 4, 34);
  });
}

// Alone circolare morbido (bagliore di atmosfera, marker, scarico motori)
export function ensureGlowTexture(scene) {
  return makeCanvasTexture(scene, 'mc-glow', 128, (ctx, size) => {
    const r = size / 2;
    const g = ctx.createRadialGradient(r, r, 0, r, r, r);
    g.addColorStop(0, 'rgba(255,255,255,1)');
    g.addColorStop(0.35, 'rgba(255,255,255,0.45)');
    g.addColorStop(1, 'rgba(255,255,255,0)');
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, size, size);
  });
}

/**
 * Campo stellare a tre livelli. Le stelle coprono un'area più grande dello schermo
 * così restano visibili anche con zoom out e trascinamento della camera.
 */
export function addStarfield(scene, { spread = 2.5, density = 1, scrollFactor = true } = {}) {
  const { width, height } = scene.scale;
  const w = width * spread;
  const h = height * spread;
  const x0 = (width - w) / 2;
  const y0 = (height - h) / 2;
  const area = (w * h) / (1920 * 1080);
  const layers = [
    { n: 700, size: [0.5, 0.9], alpha: [0.15, 0.45], sf: 0.2 },
    { n: 260, size: [0.8, 1.3], alpha: [0.35, 0.75], sf: 0.5 },
    { n: 50, size: [1.2, 1.9], alpha: [0.7, 1], sf: 0.8 },
  ];
  const tints = [0xffffff, 0xffffff, 0xcfe0ff, 0xfff1d6];
  const out = [];
  for (const l of layers) {
    const g = scene.add.graphics();
    const n = Math.round(l.n * area * density);
    for (let i = 0; i < n; i++) {
      const a = l.alpha[0] + Math.random() * (l.alpha[1] - l.alpha[0]);
      g.fillStyle(tints[i % tints.length], a);
      g.fillCircle(x0 + Math.random() * w, y0 + Math.random() * h, l.size[0] + Math.random() * (l.size[1] - l.size[0]));
    }
    if (scrollFactor) g.setScrollFactor(l.sf);
    g.setDepth(-100);
    out.push(g);
  }
  return out;
}

/** Terra con alone atmosferico. Restituisce l'immagine principale. */
export function addEarth(scene, x, y, radius, { label = 'TERRA' } = {}) {
  ensureEarthTexture(scene);
  ensureGlowTexture(scene);
  const glow = scene.add.image(x, y, 'mc-glow').setTint(0x4aa3ff).setAlpha(0.45).setDisplaySize(radius * 3.2, radius * 3.2);
  const img = scene.add.image(x, y, 'mc-earth').setDisplaySize(radius * 2, radius * 2);
  let text = null;
  if (label) text = scene.add.text(x, y + radius + 14, label, { ...LABEL_STYLE, color: PALETTE.earthLabel }).setOrigin(0.5, 0);
  return { img, glow, text };
}

export function addMoon(scene, x, y, radius, { label = 'LUNA' } = {}) {
  ensureMoonTexture(scene);
  ensureGlowTexture(scene);
  const glow = scene.add.image(x, y, 'mc-glow').setTint(0xdfe6f5).setAlpha(0.18).setDisplaySize(radius * 2.8, radius * 2.8);
  const img = scene.add.image(x, y, 'mc-moon').setDisplaySize(radius * 2, radius * 2);
  let text = null;
  if (label) text = scene.add.text(x, y + radius + 14, label, { ...LABEL_STYLE, color: PALETTE.moonLabel }).setOrigin(0.5, 0);
  return { img, glow, text };
}

/**
 * Orion: sprite + alone arancione pulsante, così resta visibile anche sul proiettore.
 * L'oggetto restituito si usa come un normale game object (x, y, setPosition, rotation).
 */
export function addOrion(scene, x, y, { size = 26 } = {}) {
  ensureOrionTexture(scene);
  ensureGlowTexture(scene);
  const halo = scene.add.image(0, 0, 'mc-glow').setTint(PALETTE.orion).setAlpha(0.55).setDisplaySize(size * 1.6, size * 1.6);
  const body = scene.add.image(0, 0, 'mc-orion').setDisplaySize(size, size);
  const container = scene.add.container(x, y, [halo, body]).setDepth(10);
  scene.tweens.add({ targets: halo, alpha: 0.2, duration: 900, yoyo: true, repeat: -1, ease: 'Sine.easeInOut' });
  container.setData('body', body);
  return container;
}

/** Orienta Orion lungo la direzione di moto (da prev a curr). */
export function faceMotion(orion, prevX, prevY) {
  const dx = orion.x - prevX;
  const dy = orion.y - prevY;
  if (dx * dx + dy * dy > 0.01) orion.getData('body').rotation = Math.atan2(dy, dx);
}

/**
 * Scia che sfuma: memorizza gli ultimi punti e li ridisegna con alpha crescente.
 * Chiamare trail.push(x, y) a ogni frame. trail.keep = true per non perdere mai i punti
 * (utile per mostrare l'intera traiettoria a fine simulazione).
 */
export function createTrail(scene, { color = PALETTE.trail, width = 2.5, max = 900 } = {}) {
  const g = scene.add.graphics().setDepth(5);
  const pts = [];
  return {
    graphics: g,
    points: pts,
    push(x, y) {
      const last = pts[pts.length - 1];
      if (last && Math.abs(last.x - x) + Math.abs(last.y - y) < 1.5) return;
      pts.push({ x, y });
      if (pts.length > max) pts.shift();
      this.draw();
    },
    draw() {
      g.clear();
      const n = pts.length;
      for (let i = 1; i < n; i++) {
        const t = i / n;
        g.lineStyle(width, color, 0.12 + 0.75 * t);
        g.lineBetween(pts[i - 1].x, pts[i - 1].y, pts[i].x, pts[i].y);
      }
    },
    clear() {
      pts.length = 0;
      g.clear();
    },
  };
}

/** Linea tratteggiata per orbite di riferimento (Graphics non ha il tratteggio nativo). */
export function strokeDashedCircle(g, x, y, r, { color = PALETTE.orbitFaint, alpha = 0.6, width = 1.5, dash = 6, gap = 6 } = {}) {
  const circumference = 2 * Math.PI * r;
  const steps = Math.max(12, Math.floor(circumference / (dash + gap)));
  const da = (Math.PI * 2) / steps;
  const on = da * (dash / (dash + gap));
  g.lineStyle(width, color, alpha);
  for (let i = 0; i < steps; i++) {
    const a0 = i * da;
    g.beginPath();
    g.arc(x, y, r, a0, a0 + on);
    g.strokePath();
  }
}

/** Abilita zoom con rotella e trascinamento della camera (stesso comportamento in tutte le scene). */
export function enableCameraControls(scene, { min = 0.1, max = 6 } = {}) {
  const cam = scene.cameras.main;
  scene.input.on('wheel', (pointer, _objs, _dx, dy) => {
    const z = Math.min(max, Math.max(min, cam.zoom * (1 - Math.sign(dy) * 0.12)));
    cam.zoomTo(z, 120);
  });
  scene.input.on('pointermove', (pointer) => {
    if (!pointer.isDown) return;
    cam.scrollX -= (pointer.x - pointer.prevPosition.x) / cam.zoom;
    cam.scrollY -= (pointer.y - pointer.prevPosition.y) / cam.zoom;
  });
}
