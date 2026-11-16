import * as Phaser from 'phaser';
import { missionState } from '../../stores/missionStore.js';
import { EARTH, MOON, HEO } from '../../physics/constants.js';
import {
  addStarfield,
  addEarth,
  addMoon,
  addOrion,
  faceMotion,
  createTrail,
  strokeDashedCircle,
  enableCameraControls,
  PALETTE,
  LABEL_STYLE,
} from '../art.js';

// Modello semplificato della TLI:
// - solo la gravità terrestre (la Luna non attrae Orion);
// - la Luna è ferma nel punto in cui Orion arriva all'apogeo dell'ellisse ideale
//   (l'istante di accensione è fisso, quindi conta solo il Δv);
// - successo = Orion entra nella sfera d'influenza lunare (≈ 66.200 km dal centro della Luna),
//   la regione in cui la gravità della Luna domina su quella della Terra.
const CAPTURE_RADIUS = MOON.soiRadius; // m
const TIME_SCALE = 20000; // secondi simulati per secondo reale

export class TLIScene extends Phaser.Scene {
  constructor() {
    super('TLIScene');
  }

  create() {
    // Stato (sempre reinizializzato: la scena viene riavviata)
    this.isIgnited = false;
    this.isDone = false;
    this.orbit = null;
    this.nu = 0; // anomalia vera (0 = perigeo, cioè il punto di accensione)
    this.minDist = Infinity;
    this.pathM = []; // traiettoria in metri, per ridisegnarla dopo un resize
    this.staticObjs = [];

    this.rp = EARTH.R + HEO.hp; // raggio dell'orbita di parcheggio (192 km di quota)
    this.D = MOON.distance;

    this.cameras.main.setZoom(1).setScroll(0, 0);
    this.layout();
    this.drawStatic();

    this.trail = createTrail(this, { max: 100000 });
    const start = this.toScreen(-this.rp, 0);
    this.orion = addOrion(this, start.x, start.y, { size: 24 });
    this.orion.getData('body').rotation = -Math.PI / 2; // in partenza si muove verso l'alto

    enableCameraControls(this, { min: 0.1, max: 8 });

    const unsubscribe = missionState.subscribe((state) => {
      if (state.currentPhase === 3 && state.studentCalculations.isValid && !state.isAnalyzing && !this.isIgnited) {
        this.setupPhysics(state.studentCalculations.tliDeltaV);
      }
    });

    const onResize = () => {
      if (!this.isIgnited) {
        this.scene.restart();
        return;
      }
      this.layout();
      this.drawStatic();
      this.trail.clear();
      for (const p of this.pathM) {
        const s = this.toScreen(p.x, p.y);
        this.trail.push(s.x, s.y);
      }
      const last = this.pathM[this.pathM.length - 1];
      if (last) {
        const s = this.toScreen(last.x, last.y);
        this.orion.setPosition(s.x, s.y);
      }
    };
    this.scale.on('resize', onResize);

    this.events.once('shutdown', () => {
      unsubscribe();
      this.scale.off('resize', onResize);
    });
  }

  // Scala: la distanza Terra-Luna occupa l'80% della larghezza
  layout() {
    const { width, height } = this.scale;
    const distPx = width * 0.8;
    this.s = distPx / this.D; // px per metro
    this.earthX = (width - distPx) / 2;
    this.cy = height / 2;
    this.moonX = this.earthX + distPx;
  }

  // Coordinate fisiche (m, origine al centro della Terra, Luna sull'asse +x) → schermo
  toScreen(x, y) {
    return { x: this.earthX + x * this.s, y: this.cy + y * this.s };
  }

  drawStatic() {
    for (const o of this.staticObjs) o.destroy();
    this.staticObjs = [];
    const keep = (...objs) => objs.forEach((o) => o && this.staticObjs.push(o));

    keep(...addStarfield(this));

    const g = this.add.graphics().setDepth(1);
    keep(g);

    // Orbita di parcheggio (tratteggiata)
    strokeDashedCircle(g, this.earthX, this.cy, this.rp * this.s, { color: PALETTE.orbit, alpha: 0.5, dash: 3, gap: 3 });

    // Anteprima tenue dell'ellisse di trasferimento ideale: perigeo = parcheggio, apogeo = Luna
    const a = (this.rp + this.D) / 2;
    const b = Math.sqrt(this.rp * this.D);
    const cx = this.earthX + ((this.D - this.rp) / 2) * this.s;
    this.strokeDashedEllipse(g, cx, this.cy, a * this.s, b * this.s);
    keep(
      this.add
        .text(cx, this.cy - b * this.s - 10, 'Orbita di trasferimento ideale', { ...LABEL_STYLE, color: PALETTE.earthLabel })
        .setOrigin(0.5, 1)
        .setAlpha(0.85)
    );

    // Terra e Luna in scala reale (la Luna ha un raggio minimo per restare visibile)
    const earth = addEarth(this, this.earthX, this.cy, Math.max(EARTH.R * this.s, 8));
    keep(earth.glow, earth.img, earth.text);
    const moon = addMoon(this, this.moonX, this.cy, Math.max(MOON.R * this.s, 6));
    keep(moon.glow, moon.img, moon.text);

    // Sfera d'influenza lunare
    this.captureG = this.add.graphics().setDepth(2);
    keep(this.captureG);
    this.drawCaptureZone(PALETTE.orbit);
    keep(
      this.add
        .text(this.moonX, this.cy - CAPTURE_RADIUS * this.s - 8, `Sfera d'influenza lunare (${Math.round(CAPTURE_RADIUS / 1000).toLocaleString('it-IT')} km)`, { ...LABEL_STYLE, color: PALETTE.moonLabel })
        .setOrigin(0.5, 1)
    );
  }

  drawCaptureZone(color) {
    this.captureG.clear();
    strokeDashedCircle(this.captureG, this.moonX, this.cy, CAPTURE_RADIUS * this.s, { color, alpha: 0.8, dash: 4, gap: 4 });
  }

  strokeDashedEllipse(g, cx, cy, ax, by) {
    const n = 220;
    g.lineStyle(1.5, PALETTE.orbitFaint, 0.45);
    for (let i = 0; i < n; i += 2) {
      const t0 = (i / n) * Math.PI * 2;
      const t1 = ((i + 1) / n) * Math.PI * 2;
      g.lineBetween(cx + ax * Math.cos(t0), cy + by * Math.sin(t0), cx + ax * Math.cos(t1), cy + by * Math.sin(t1));
    }
  }

  setupPhysics(deltaV) {
    this.isIgnited = true;
    this.isDone = false;
    this.nu = 0;
    this.minDist = Infinity;
    this.pathM = [];
    this.trail.clear();

    const GM = EARTH.GM;
    const v0 = Math.sqrt(GM / this.rp) + deltaV; // accensione tangente: si somma alla velocità circolare
    const e = (this.rp * v0 * v0) / GM - 1; // eccentricità (perigeo nel punto di accensione)
    const p = this.rp * (1 + e); // semi-latus rectum
    const h = this.rp * v0; // momento angolare specifico
    const invA = 2 / this.rp - (v0 * v0) / GM; // 1/a (negativo per un'iperbole)
    const ra = e < 1 ? p / (1 - e) : Infinity; // apogeo (raggio)

    this.orbit = { v0, e, p, h, invA, ra, deltaV };

    missionState.update((s) => ({
      ...s,
      didacticFeedback: "Accensione TLI completata. Orion percorre la traiettoria di trasferimento: verifica se entra nella sfera d'influenza della Luna.",
    }));
  }

  update(_time, delta) {
    if (!this.isIgnited || !this.orbit || this.isDone) return;

    const dt = (Math.min(delta, 50) / 1000) * TIME_SCALE;
    const { e, p, h, invA } = this.orbit;

    // Passi piccoli per seguire bene il tratto veloce vicino al perigeo
    let remaining = dt;
    let r = p / (1 + e * Math.cos(this.nu));
    while (remaining > 0) {
      const step = Math.min(remaining, 20);
      this.nu += (h / (r * r)) * step;
      remaining -= step;
      const den = 1 + e * Math.cos(this.nu);
      if (den <= 1e-6) break; // asintoto dell'iperbole: non dovrebbe accadere prima della fine
      r = p / den;
    }

    // Perigeo nel punto di partenza (lato opposto alla Luna)
    const phi = Math.PI + this.nu;
    const x = r * Math.cos(phi);
    const y = r * Math.sin(phi);
    this.pathM.push({ x, y });

    const scr = this.toScreen(x, y);
    const prevX = this.orion.x;
    const prevY = this.orion.y;
    this.orion.setPosition(scr.x, scr.y);
    faceMotion(this.orion, prevX, prevY);
    this.trail.push(scr.x, scr.y);

    const v = Math.sqrt(Math.max(0, EARTH.GM * (2 / r - invA)));
    missionState.update((s) => ({
      ...s,
      telemetry: { ...s.telemetry, altitude: (r - EARTH.R) / 1000, velocity: v / 1000 },
    }));

    const dMoon = Math.hypot(x - this.D, y);
    this.minDist = Math.min(this.minDist, dMoon);

    if (dMoon < CAPTURE_RADIUS) {
      this.finishSuccess();
      return;
    }

    // Fine del tentativo: Orion ha superato la direzione della Luna (apogeo) o si è allontanata troppo
    if (this.nu > Math.PI + 0.05 || r > this.D * 1.3) {
      this.finishFailure();
    }
  }

  finishSuccess() {
    this.isDone = true;
    this.drawCaptureZone(PALETTE.ok);
    missionState.update((s) => ({
      ...s,
      status: 'ARRIVO ALLA LUNA',
      phase3Complete: true,
      didacticFeedback:
        `Bersaglio raggiunto! L'apogeo dell'ellisse arriva alla distanza della Luna e Orion è entrata nella sfera d'influenza lunare (entro ${Math.round(CAPTURE_RADIUS / 1000).toLocaleString('it-IT')} km dalla Luna): da qui in poi il suo moto è dominato dalla gravità della Luna. Nella prossima fase dovrai frenare per entrare in orbita lunare.`,
    }));
  }

  finishFailure() {
    this.isDone = true;
    this.drawCaptureZone(PALETTE.fail);
    const { e, ra } = this.orbit;
    const km = (m) => Math.round(m / 1000).toLocaleString('it-IT');
    const moonKm = km(this.D);
    const soiKm = km(CAPTURE_RADIUS);
    let msg;

    if (e >= 1) {
      msg = `Δv troppo alto. Orion ha superato la velocità di fuga dalla Terra: la traiettoria non è più un'ellisse chiusa ma un'iperbole. È passata a ${km(this.minDist)} km dalla Luna, fuori dalla sfera d'influenza lunare, e si allontana senza tornare. Riduci il Δv.`;
    } else if (ra < this.D - CAPTURE_RADIUS) {
      msg = `Δv insufficiente. L'apogeo dell'ellisse è a ${km(ra)} km dal centro della Terra, ma la Luna è a ${moonKm} km: Orion non arriva fino all'orbita lunare e ricade verso la Terra. Aumenta il Δv.`;
    } else {
      msg = `Δv un po' troppo alto. L'apogeo (${km(ra)} km) è oltre la distanza della Luna (${moonKm} km): Orion ha attraversato l'orbita lunare prima del punto d'incontro ed è passata a ${km(this.minDist)} km dalla Luna, fuori dalla sfera d'influenza lunare (${soiKm} km). In questo modello l'istante di accensione è fisso, quindi conta solo il Δv: riducilo leggermente. (Nella realtà la Luna si muove e si sceglie anche il momento giusto per accendere il motore.)`;
    }

    missionState.update((s) => ({ ...s, status: 'MANCATO INCONTRO CON LA LUNA', didacticFeedback: msg }));
  }
}
