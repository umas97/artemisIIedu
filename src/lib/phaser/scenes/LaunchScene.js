import * as Phaser from 'phaser';
import { get } from 'svelte/store';
import { missionState } from '../../stores/missionStore.js';
import { EARTH, HEO, CORE_STAGE, propellantFromDryMass } from '../../physics/constants.js';
import { addStarfield, ensureGlowTexture, PALETTE, LABEL_STYLE } from '../art.js';

// ---- Parametri della simulazione (tempo "di schermo", non reale) ----
const BURN_MS = 40000; // durata del volo del core stage fino al MECO (reale ≈ 8 min)
const BURN_FRACTION = 0.98; // al MECO resta ~2% di propellente come riserva
const BOOSTER_SEP = 0.26; // separazione booster (reale ≈ 2 min su 8)
const MAX_Q = 0.15; // massima pressione dinamica (reale ≈ 1 min 10 s)
const SAMPLES = 1000;

// Colori del cielo (alto / orizzonte) in funzione della quota in km
const SKY_KEYS = [
  { h: 0, top: 0x3f7fd0, bottom: 0xa9cdee },
  { h: 12, top: 0x1f4f9a, bottom: 0x6a9fdc },
  { h: 35, top: 0x0b2150, bottom: 0x2a5596 },
  { h: 70, top: 0x050c22, bottom: 0x10295a },
  { h: 130, top: 0x04060b, bottom: 0x081428 },
];

const lerpColor = (c1, c2, t) => {
  const r = ((c1 >> 16) & 255) + (((c2 >> 16) & 255) - ((c1 >> 16) & 255)) * t;
  const g = ((c1 >> 8) & 255) + (((c2 >> 8) & 255) - ((c1 >> 8) & 255)) * t;
  const b = (c1 & 255) + ((c2 & 255) - (c1 & 255)) * t;
  return (Math.round(r) << 16) | (Math.round(g) << 8) | Math.round(b);
};

function skyColorsAt(h) {
  for (let i = 1; i < SKY_KEYS.length; i++) {
    const k0 = SKY_KEYS[i - 1];
    const k1 = SKY_KEYS[i];
    if (h <= k1.h) {
      const t = (h - k0.h) / (k1.h - k0.h);
      return { top: lerpColor(k0.top, k1.top, t), bottom: lerpColor(k0.bottom, k1.bottom, t) };
    }
  }
  const last = SKY_KEYS[SKY_KEYS.length - 1];
  return { top: last.top, bottom: last.bottom };
}

// ---- Sagoma SLS Block 1 (coordinate locali: base dei motori in y = 0, verso l'alto y < 0) ----
function drawCoreStage(g) {
  // Ugelli dei 4 RS-25
  g.fillStyle(0x6b7280, 1);
  for (const x of [-7.5, -2.5, 2.5, 7.5]) g.fillTriangle(x - 2.6, 0, x + 2.6, 0, x, -8);
  // Sezione motori
  g.fillStyle(0x7a4a26, 1);
  g.fillRect(-11, -16, 22, 8);
  // Serbatoio arancione (schiuma isolante) con ombreggiatura cilindrica
  g.fillStyle(0xd9782a, 1);
  g.fillRect(-11, -170, 22, 154);
  g.fillStyle(0xeb9a4f, 1);
  g.fillRect(-8, -170, 6, 154);
  g.fillStyle(0xb35f1f, 1);
  g.fillRect(5, -170, 6, 154);
  // Giunzioni tra serbatoio LH2 e LOX
  g.fillStyle(0x9a5220, 0.9);
  g.fillRect(-11, -122, 22, 2);
  g.fillRect(-11, -128, 22, 1);
  // Adattatore (LVSA) e stadio superiore ICPS: cono bianco
  g.fillStyle(0xe8eaee, 1);
  g.fillPoints([{ x: -11, y: -170 }, { x: 11, y: -170 }, { x: 7.5, y: -188 }, { x: -7.5, y: -188 }], true);
  g.fillStyle(0xc5c9d1, 1);
  g.fillPoints([{ x: 4, y: -170 }, { x: 11, y: -170 }, { x: 7.5, y: -188 }, { x: 2.5, y: -188 }], true);
  // Adattatore di Orion e carenature del modulo di servizio
  g.fillStyle(0xf2f4f8, 1);
  g.fillRect(-7.5, -202, 15, 14);
  g.fillStyle(0xd0d4dc, 1);
  g.fillRect(2.5, -202, 5, 14);
  g.fillRect(-7.5, -196, 15, 1);
  // Capsula Orion coperta dalla carenatura del sistema di fuga (LAS)
  g.fillStyle(0xf4f5f7, 1);
  g.fillPoints([{ x: -7.5, y: -202 }, { x: 7.5, y: -202 }, { x: 3, y: -222 }, { x: -3, y: -222 }], true);
  g.fillStyle(0xcfd3da, 1);
  g.fillPoints([{ x: 2.5, y: -202 }, { x: 7.5, y: -202 }, { x: 3, y: -222 }, { x: 1, y: -222 }], true);
  // Torre di fuga (LAS): asta, motore di fuga con ugelli, punta
  g.fillStyle(0xe2e5ea, 1);
  g.fillRect(-1.6, -246, 3.2, 24);
  g.fillStyle(0xb8bec8, 1);
  g.fillRect(-2.6, -234, 5.2, 6);
  g.fillStyle(0x4b5563, 1);
  g.fillTriangle(-2.6, -228, -5, -224, -2.6, -230);
  g.fillTriangle(2.6, -228, 5, -224, 2.6, -230);
  g.fillStyle(0xe2e5ea, 1);
  g.fillTriangle(-1.6, -246, 1.6, -246, 0, -254);
  // Logo "bandiera": piccolo rettangolo scuro sul serbatoio
  g.fillStyle(0x1e3a8a, 0.9);
  g.fillRect(-5, -150, 4, 3);
}

function drawBooster(g) {
  // Booster a propellente solido: bianco, ugello, gonna posteriore e ogiva
  g.fillStyle(0x6b7280, 1);
  g.fillTriangle(-3.5, 0, 3.5, 0, 0, -7);
  g.fillStyle(0xd7dbe2, 1);
  g.fillPoints([{ x: -7, y: -4 }, { x: 7, y: -4 }, { x: 5.5, y: -16 }, { x: -5.5, y: -16 }], true);
  g.fillStyle(0xf3f4f6, 1);
  g.fillRect(-5.5, -150, 11, 134);
  g.fillStyle(0xc9ced6, 1);
  g.fillRect(2, -150, 3.5, 134);
  g.fillStyle(0x9ca3af, 1);
  for (const y of [-42, -70, -98, -126]) g.fillRect(-5.5, y, 11, 1.5);
  g.fillStyle(0xf3f4f6, 1);
  g.fillTriangle(-5.5, -150, 5.5, -150, 0, -168);
  g.fillStyle(0xc9ced6, 1);
  g.fillTriangle(2, -150, 5.5, -150, 0, -168);
}

/** Fiamma a goccia con tre strati di colore. */
function drawFlame(g, x, w, len, colors, alpha = 1) {
  const layers = [
    { c: colors[0], w: 1, l: 1, a: 0.85 },
    { c: colors[1], w: 0.65, l: 0.72, a: 0.9 },
    { c: colors[2], w: 0.35, l: 0.45, a: 0.95 },
  ];
  for (const L of layers) {
    const hw = (w / 2) * L.w;
    const ll = len * L.l;
    g.fillStyle(L.c, L.a * alpha);
    g.fillPoints(
      [
        { x: x - hw, y: 0 },
        { x: x + hw, y: 0 },
        { x: x + hw * 1.15, y: ll * 0.25 },
        { x: x + hw * 0.5, y: ll * 0.7 },
        { x, y: ll },
        { x: x - hw * 0.5, y: ll * 0.7 },
        { x: x - hw * 1.15, y: ll * 0.25 },
      ],
      true,
    );
  }
}

export class LaunchScene extends Phaser.Scene {
  constructor() {
    super('LaunchScene');
  }

  create() {
    // ---- Stato (sempre reinizializzato: la scena può essere riavviata) ----
    this.countdownStarted = false;
    this.coreIgnited = false;
    this.isLaunching = false;
    this.boostersAttached = true;
    this.meco = false;
    this.elapsed = 0;
    this.progress = 0;
    this.altitude = 0;
    this.events_ = { maxQ: false, sep: false };
    this.fallingBoosters = [];
    this.stars = null;
    this.starAlpha = 0;

    const { height } = this.scale;
    this.s = Phaser.Math.Clamp((height * 0.42) / 256, 0.8, 2.4);
    this.padH = 26 * this.s;
    this.climbPx = 3400 * this.s;
    this.downrangePx = 1100 * this.s;

    ensureGlowTexture(this);
    this.buildProfile();

    // ---- Sfondo fisso sullo schermo: cielo, stelle, orizzonte curvo ----
    this.sky = this.add.graphics().setScrollFactor(0).setDepth(-200);
    this.buildStars();
    this.limb = this.add.graphics().setScrollFactor(0).setDepth(-90);

    // ---- Mondo: nuvole, terreno, rampa, torre ----
    this.buildClouds();
    this.buildGround();
    this.buildPad();

    // ---- Razzo ----
    this.buildRocket();

    // ---- Particelle di fumo ----
    this.smoke = this.add
      .particles(0, 0, 'mc-glow', {
        speed: { min: 15, max: 70 },
        angle: { min: 70, max: 110 },
        scale: { start: 0.35 * this.s, end: 2.2 * this.s },
        alpha: { start: 0.5, end: 0 },
        tint: [0xe5e7eb, 0xd1d5db, 0xf3f4f6, 0xc4c8cf],
        lifespan: 4200,
        frequency: 22,
        quantity: 2,
        emitting: false,
      })
      .setDepth(3);
    const padCloud = (angle) =>
      this.add
        .particles(0, -this.padH * 0.5, 'mc-glow', {
          speed: { min: 60, max: 260 * this.s },
          angle,
          scale: { start: 0.5 * this.s, end: 2.4 * this.s },
          alpha: { start: 0.5, end: 0 },
          tint: [0xf3f4f6, 0xe5e7eb, 0xd1d5db],
          lifespan: 3200,
          gravityY: -8,
          frequency: 55,
          quantity: 1,
          emitting: false,
        })
        .setDepth(6);
    this.padClouds = [padCloud({ min: 172, max: 192 }), padCloud({ min: -12, max: 8 })];

    // ---- Testi fissi sullo schermo ----
    this.statusText = this.add
      .text(0, 0, '', { ...LABEL_STYLE, fontSize: `${Math.round(Phaser.Math.Clamp(height * 0.065, 32, 72))}px`, strokeThickness: 6 })
      .setOrigin(0.5)
      .setScrollFactor(0)
      .setDepth(50)
      .setAlpha(0);
    this.eventText = this.add
      .text(0, 0, '', { ...LABEL_STYLE, fontSize: '18px', color: PALETTE.orionCss })
      .setOrigin(0.5)
      .setScrollFactor(0)
      .setDepth(50)
      .setAlpha(0);

    // ---- Camera: segue il razzo dal primo istante (niente scatto al decollo) ----
    const cam = this.cameras.main;
    this.followOffset = height * 0.2;
    cam.startFollow(this.rocket, false, 1, 1, 0, this.followOffset);
    this.layoutScreen();

    // ---- Resize ----
    this.onResize = () => {
      if (!this.countdownStarted) {
        this.scene.restart();
        return;
      }
      this.buildStars();
      this.layoutScreen();
    };
    this.scale.on('resize', this.onResize);

    // ---- Store: avvio del countdown ----
    this.unsubscribe = missionState.subscribe((state) => {
      if (
        state.currentPhase === 2 &&
        state.studentCalculations.isValid &&
        !state.isAnalyzing &&
        !state.showBriefing &&
        !this.countdownStarted
      ) {
        // Rimandato al prossimo tick: non si aggiorna lo store dentro una sua subscribe
        this.time.delayedCall(0, () => this.startCountdown());
        this.countdownStarted = true;
      }
    });

    this.events.once('shutdown', () => {
      this.unsubscribe?.();
      this.unsubscribe = null;
      this.scale.off('resize', this.onResize);
      this.tweens.killAll();
    });

    this.drawSky();
  }

  // ---------- Profilo di volo (precalcolato) ----------
  buildProfile() {
    const s = get(missionState);
    const answer = propellantFromDryMass(CORE_STAGE.dryMass, CORE_STAGE.targetDeltaV, CORE_STAGE.isp);
    const fuel = s.studentCalculations?.requiredFuel > 0 ? s.studentCalculations.requiredFuel : answer;
    const m0 = CORE_STAGE.dryMass + fuel;
    const mEnd = m0 - BURN_FRACTION * fuel;
    const lnEnd = Math.log(m0 / mEnd);
    this.vEnd = Math.sqrt(EARTH.GM / (EARTH.R + HEO.hp)) / 1000; // km/s, velocità circolare a 192 km
    this.targetAltitude = HEO.hp / 1000; // km

    // Velocità con la forma dell'equazione di Tsiolkovsky (cresce sempre più in fretta
    // perché il razzo si alleggerisce), scalata per arrivare alla velocità orbitale al MECO.
    const vAt = (p) => (this.vEnd * Math.log(m0 / (m0 - BURN_FRACTION * fuel * p))) / lnEnd;
    // Angolo di volo: verticale per superare la torre, poi virata progressiva verso l'orizzontale
    this.gammaAt = (p) => (p < 0.03 ? 90 : 90 - 82 * Math.pow((p - 0.03) / 0.97, 0.55));

    this.prof = { v: new Float32Array(SAMPLES + 1), h: new Float32Array(SAMPLES + 1), x: new Float32Array(SAMPLES + 1) };
    let h = 0;
    let x = 0;
    for (let i = 0; i <= SAMPLES; i++) {
      const p = i / SAMPLES;
      const v = vAt(p);
      const gm = Phaser.Math.DegToRad(this.gammaAt(p));
      if (i > 0) {
        h += v * Math.sin(gm);
        x += v * Math.cos(gm);
      }
      this.prof.v[i] = v;
      this.prof.h[i] = h;
      this.prof.x[i] = x;
    }
    this.prof.hMax = h;
    this.prof.xMax = x;
  }

  sample(arr, p) {
    const f = Phaser.Math.Clamp(p, 0, 1) * SAMPLES;
    const i = Math.floor(f);
    const j = Math.min(i + 1, SAMPLES);
    return arr[i] + (arr[j] - arr[i]) * (f - i);
  }

  // Quota (km) → posizione verticale nel mondo: compressione logaritmica, così si vedono
  // bene sia la rampa sia le nuvole sia la salita fino allo spazio.
  altToY(km) {
    const k = Math.log(1 + km / 2) / Math.log(1 + this.targetAltitude / 2);
    return -this.padH - k * this.climbPx;
  }

  // ---------- Costruzione della scena ----------
  buildStars() {
    if (this.stars) this.stars.forEach((g) => g.destroy());
    this.stars = addStarfield(this, { spread: 1.2, scrollFactor: false });
    this.stars.forEach((g) => g.setScrollFactor(0).setDepth(-150).setAlpha(this.starAlpha ?? 0));
  }

  buildClouds() {
    const g = this.add.graphics().setDepth(-20);
    const rand = new Phaser.Math.RandomDataGenerator(['artemis']);
    for (let i = 0; i < 26; i++) {
      const y = this.altToY(rand.realInRange(2.5, 11));
      const x = rand.realInRange(-1800, 2200) * this.s;
      const w = rand.realInRange(120, 340) * this.s;
      for (let j = 0; j < 6; j++) {
        g.fillStyle(0xffffff, rand.realInRange(0.12, 0.3));
        g.fillEllipse(x + rand.realInRange(-w / 2, w / 2), y + rand.realInRange(-10, 10) * this.s, w * rand.realInRange(0.4, 0.8), w * 0.16);
      }
    }
  }

  buildGround() {
    const g = this.add.graphics().setDepth(-30);
    const s = this.s;
    // Edificio di assemblaggio (VAB) in lontananza
    g.fillStyle(0x7c8594, 1);
    g.fillRect(-620 * s, -150 * s, 130 * s, 150 * s);
    g.fillStyle(0x5f6877, 1);
    g.fillRect(-500 * s, -110 * s, 40 * s, 110 * s);
    g.fillStyle(0x1e3a8a, 1);
    g.fillRect(-600 * s, -120 * s, 22 * s, 14 * s);
    // Oceano all'orizzonte e terreno
    g.fillStyle(0x24507a, 1);
    g.fillRect(-6000, -6 * s, 12000, 6 * s);
    g.fillStyle(0x2c3b2a, 1);
    g.fillRect(-6000, 0, 12000, 4000);
    g.fillStyle(0x3a4a33, 1);
    g.fillRect(-6000, 0, 12000, 10 * s);
    // Rampa 39B: terrapieno
    g.fillStyle(0x6b6457, 1);
    g.fillPoints([{ x: -230 * s, y: 0 }, { x: 230 * s, y: 0 }, { x: 170 * s, y: -10 * s }, { x: -170 * s, y: -10 * s }], true);
  }

  buildPad() {
    const g = this.add.graphics().setDepth(-10);
    const s = this.s;
    const padTop = -this.padH;
    // Piattaforma mobile di lancio (Mobile Launcher) con il foro per i gas di scarico
    g.fillStyle(0x3f444e, 1);
    g.fillRect(-120 * s, padTop, 240 * s, this.padH - 10 * s);
    g.fillStyle(0x2a2e36, 1);
    g.fillRect(-30 * s, padTop, 60 * s, this.padH - 10 * s);
    g.fillStyle(0x555b67, 1);
    g.fillRect(-120 * s, padTop, 240 * s, 3 * s);

    // Torre ombelicale a traliccio (a sinistra del razzo)
    const tx0 = -64 * s;
    const tx1 = -40 * s;
    const top = padTop - 290 * s;
    g.fillStyle(0x4b5260, 0.35);
    g.fillRect(tx0, top, tx1 - tx0, padTop - top);
    g.lineStyle(Math.max(1, 1.2 * s), 0x8a93a3, 1);
    g.strokeRect(tx0, top, tx1 - tx0, padTop - top);
    const step = 20 * s;
    for (let y = top; y < padTop - 1; y += step) {
      g.lineBetween(tx0, y, tx1, Math.min(y + step, padTop));
      g.lineBetween(tx1, y, tx0, Math.min(y + step, padTop));
      g.lineBetween(tx0, y, tx1, y);
    }
    // Bracci ombelicali e braccio di accesso dell'equipaggio (verso Orion)
    g.fillStyle(0x8a93a3, 1);
    for (const y of [-80, -140]) g.fillRect(tx1, padTop + y * s, 24 * s, 3 * s);
    g.fillRect(tx1, padTop - 214 * s, 30 * s, 4 * s);
    g.fillStyle(0xe5e7eb, 1);
    g.fillRect(tx1 + 24 * s, padTop - 220 * s, 8 * s, 10 * s);

    // Torri parafulmine con i cavi
    g.lineStyle(Math.max(1, 1.5 * s), 0x9aa3b2, 1);
    const masts = [-190 * s, 200 * s];
    for (const mx of masts) g.lineBetween(mx, 0, mx, padTop - 330 * s);
    g.lineStyle(1, 0x9aa3b2, 0.6);
    g.lineBetween(masts[0], padTop - 330 * s, -300 * s, 0);
    g.lineBetween(masts[1], padTop - 330 * s, 320 * s, 0);

    // Luce di segnalazione in cima alla torre
    const beacon = this.add.circle((tx0 + tx1) / 2, top - 3 * s, 3 * s, 0xff3b30).setDepth(-9);
    this.tweens.add({ targets: beacon, alpha: 0.15, duration: 600, yoyo: true, repeat: -1 });
  }

  buildRocket() {
    const s = this.s;
    this.rocket = this.add.container(0, -this.padH).setDepth(10);
    // Fiamme e bagliore dietro al razzo (stesso container: ruotano con lui)
    this.glow = this.add.image(0, 10 * s, 'mc-glow').setTint(0xffa040).setAlpha(0).setScale(0.6 * s);
    this.flames = this.add.graphics();
    this.rocket.add([this.glow, this.flames]);

    // Booster: oggetti propri, così possono staccarsi
    this.boosters = [-17.5, 17.5].map((bx) => {
      const g = this.add.graphics();
      drawBooster(g);
      g.setPosition(bx * s, 0).setScale(s);
      this.rocket.add(g);
      return g;
    });
    const core = this.add.graphics();
    drawCoreStage(core);
    core.setScale(s);
    this.rocket.add(core);
  }

  // ---------- Elementi fissi sullo schermo ----------
  layoutScreen() {
    const { width, height } = this.scale;
    this.statusText.setPosition(width / 2, height * 0.3);
    this.eventText.setPosition(width / 2, height * 0.3 + Math.max(48, height * 0.07));
    this.followOffset = this.isLaunching ? Phaser.Math.Linear(height * 0.2, height * 0.08, Math.min(1, this.progress * 8)) : height * 0.2;
    this.cameras.main.setFollowOffset(0, this.followOffset);
    this.drawSky();
  }

  drawSky() {
    const { width, height } = this.scale;
    const { top, bottom } = skyColorsAt(this.altitude);
    const g = this.sky;
    g.clear();
    const bands = 24;
    for (let i = 0; i < bands; i++) {
      g.fillStyle(lerpColor(top, bottom, i / (bands - 1)), 1);
      g.fillRect(0, Math.floor((i * height) / bands), width, Math.ceil(height / bands) + 1);
    }

    // Stelle visibili sopra i ~30 km
    this.starAlpha = Phaser.Math.Clamp((this.altitude - 30) / 60, 0, 1);
    this.stars?.forEach((s) => s.setAlpha(this.starAlpha));

    // Curvatura terrestre che compare in basso salendo
    const l = this.limb;
    l.clear();
    const t = Phaser.Math.Clamp((this.altitude - 50) / 100, 0, 1);
    if (t > 0) {
      const R = width * Phaser.Math.Linear(3, 1.4, t);
      const cy = height + R - height * 0.16 * t;
      l.fillStyle(0x0f2f5c, t);
      l.fillCircle(width / 2, cy, R);
      l.lineStyle(6, 0x8ab8ff, 0.35 * t);
      l.strokeCircle(width / 2, cy, R + 3);
      l.lineStyle(2, 0xcfe3ff, 0.7 * t);
      l.strokeCircle(width / 2, cy, R);
    }
  }

  flash(text, color = PALETTE.orionCss) {
    this.eventText.setText(text).setColor(color).setAlpha(1);
    this.tweens.add({ targets: this.eventText, alpha: 0, delay: 2200, duration: 800 });
  }

  // ---------- Sequenza di lancio ----------
  startCountdown() {
    let n = 10;
    this.statusText.setAlpha(1).setText('T-10');
    missionState.update((s) => ({ ...s, status: 'T-10' }));
    this.time.addEvent({
      delay: 1000,
      repeat: 10,
      callback: () => {
        n--;
        if (n > 0) {
          this.statusText.setText(`T-${n}`);
          missionState.update((s) => ({ ...s, status: `T-${n}` }));
          if (n === 6) {
            // Accensione dei quattro RS-25 qualche secondo prima del decollo
            this.coreIgnited = true;
            this.padClouds.forEach((e) => e.start());
            this.flash('Accensione motori RS-25');
          }
        } else if (n === 0) {
          this.launch();
        }
      },
    });
  }

  launch() {
    this.statusText.setText('DECOLLO!').setColor(PALETTE.orionCss);
    this.tweens.add({ targets: this.statusText, alpha: 0, delay: 1800, duration: 1200 });
    this.flash('Accensione booster · Decollo');
    this.smoke.start();
    this.isLaunching = true;
    this.elapsed = 0;
    missionState.update((s) => ({
      ...s,
      status: 'Decollo',
      telemetry: { ...s.telemetry, stage: 'Core Stage + booster' },
    }));
  }

  separateBoosters() {
    this.boostersAttached = false;
    const s = this.s;
    const rot = this.rocket.rotation;
    this.boosters.forEach((b, i) => {
      const side = i === 0 ? -1 : 1;
      // Il booster passa dal container al mondo, mantenendo posizione e inclinazione
      const local = new Phaser.Math.Vector2(b.x, b.y);
      Phaser.Math.Rotate(local, rot);
      this.rocket.remove(b); // torna nella display list della scena
      b.setPosition(this.rocket.x + local.x, this.rocket.y + local.y).setRotation(rot).setDepth(9);
      this.fallingBoosters.push({ g: b, vx: side * 40 * s, vy: 20 * s, spin: side * 0.6 });
    });
    this.flash('Separazione dei booster');
    missionState.update((st) => ({ ...st, status: 'Separazione booster', telemetry: { ...st.telemetry, stage: 'Core Stage' } }));
  }

  drawFlames() {
    const g = this.flames;
    g.clear();
    if (this.meco || !this.coreIgnited) {
      this.glow.setAlpha(0);
      return;
    }
    const s = this.s;
    const flick = () => 1 + (Math.random() - 0.5) * 0.25;
    const vac = Phaser.Math.Clamp(this.altitude / 60, 0, 1); // nel vuoto il getto si allarga
    // RS-25: getto chiaro e quasi trasparente (idrogeno + ossigeno)
    for (const x of [-7.5, -2.5, 2.5, 7.5]) {
      const len = (this.isLaunching ? 34 : 20) * s * (1 + vac * 0.8) * flick();
      drawFlame(g, x * s, 5 * s * (1 + vac * 1.2), len, [0x9cc4ff, 0xdbe9ff, 0xffffff], 0.55 + 0.2 * (1 - vac));
    }
    // Booster: fiamma lunga e brillante
    if (this.boostersAttached && this.isLaunching) {
      for (const x of [-17.5, 17.5]) {
        drawFlame(g, x * s, 9 * s, 95 * s * flick(), [0xff6a1a, 0xffb347, 0xfff3c4]);
      }
    }
    const big = this.boostersAttached && this.isLaunching;
    this.glow
      .setAlpha((big ? 0.85 : 0.5) * (0.85 + Math.random() * 0.15))
      .setScale((big ? 1.3 : 0.7) * s * flick())
      .setY((big ? 30 : 16) * s);
  }

  update(_time, delta) {
    const dt = Math.min(delta, 100);
    this.drawFlames();

    // Booster in caduta
    for (const b of this.fallingBoosters) {
      b.vy += 0.12 * dt * this.s;
      b.g.x += (b.vx * dt) / 1000;
      b.g.y += (b.vy * dt) / 1000;
      b.g.rotation += (b.spin * dt) / 1000;
      b.g.alpha = Math.max(0, b.g.alpha - dt / 6000);
    }

    if (!this.isLaunching || this.meco) return;

    this.elapsed = Math.min(this.elapsed + dt, BURN_MS);
    const p = this.elapsed / BURN_MS;
    this.progress = p;

    const v = this.sample(this.prof.v, p);
    this.altitude = (this.sample(this.prof.h, p) / this.prof.hMax) * this.targetAltitude;
    const xNorm = this.sample(this.prof.x, p) / this.prof.xMax;
    const fuelRemaining = 100 * (1 - BURN_FRACTION * p);

    this.rocket.setPosition(xNorm * this.downrangePx, this.altToY(this.altitude));
    this.rocket.setRotation(Phaser.Math.DegToRad(90 - this.gammaAt(p)));

    // Ugelli in coordinate mondo: il fumo resta indietro lungo la traiettoria
    const nozzle = new Phaser.Math.Vector2(0, 6 * this.s);
    Phaser.Math.Rotate(nozzle, this.rocket.rotation);
    // Si sposta solo il punto di emissione: le particelle già emesse restano ferme nel mondo
    this.smoke.particleX = this.rocket.x + nozzle.x;
    this.smoke.particleY = this.rocket.y + nozzle.y;

    if (p > 0.08) this.padClouds.forEach((e) => e.emitting && e.stop());
    if (!this.boostersAttached && this.smoke.emitting && this.altitude > 45) this.smoke.stop();
    this.smoke.setAlpha(this.boostersAttached ? 1 : 0.45);

    if (!this.events_.maxQ && p >= MAX_Q) {
      this.events_.maxQ = true;
      this.flash('Max-Q: massima pressione aerodinamica', '#e4e9f2');
    }
    if (!this.events_.sep && p >= BOOSTER_SEP) {
      this.events_.sep = true;
      this.separateBoosters();
    }

    this.layoutScreen();

    missionState.update((s) => ({
      ...s,
      telemetry: { ...s.telemetry, altitude: this.altitude, velocity: v, fuelRemaining },
    }));

    if (p >= 1) {
      this.meco = true;
      this.smoke.stop();
      this.flash('MECO · Spegnimento motori: orbita raggiunta', '#34d399');
      missionState.update((s) => ({
        ...s,
        status: 'MECO: orbita raggiunta',
        phase2Complete: true,
      }));
    }
  }
}
