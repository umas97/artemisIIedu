import * as Phaser from 'phaser';
import { missionState } from '../../stores/missionStore.js';
import { EARTH, HEO } from '../../physics/constants.js';
import {
  addStarfield,
  addEarth,
  addOrion,
  faceMotion,
  createTrail,
  enableCameraControls,
  PALETTE,
  LABEL_STYLE,
} from '../art.js';

// Durata di un'orbita completa sullo schermo (secondi reali)
const ORBIT_SECONDS = 24;

/** Ellisse tratteggiata (Graphics non ha il tratteggio nativo). Centro (cx, cy), semiassi a, b in px. */
function strokeDashedEllipse(g, cx, cy, a, b, { color = PALETTE.orbit, alpha = 0.7, width = 2, dash = 8, gap = 7 } = {}) {
  // Campiona il perimetro e accende/spegne il tratto in base alla lunghezza percorsa
  const n = 720;
  let len = 0;
  let px = cx + a;
  let py = cy;
  g.lineStyle(width, color, alpha);
  for (let i = 1; i <= n; i++) {
    const t = (i / n) * Math.PI * 2;
    const x = cx + a * Math.cos(t);
    const y = cy + b * Math.sin(t);
    const step = Math.hypot(x - px, y - py);
    if (len % (dash + gap) < dash) g.lineBetween(px, py, x, y);
    len += step;
    px = x;
    py = y;
  }
}

/**
 * Equazione di Keplero M = E − e·sinE, risolta con Newton.
 * M va normalizzata in [0, 2π): con e alto (≈0,84 qui) e M vicina a −π,
 * partire da E = π fa divergere Newton e Orion salta in punti a caso.
 */
function solveKepler(M, e) {
  const TWO_PI = 2 * Math.PI;
  M = ((M % TWO_PI) + TWO_PI) % TWO_PI;
  let E = e < 0.8 ? M : Math.PI;
  for (let i = 0; i < 30; i++) {
    const d = (E - e * Math.sin(E) - M) / (1 - e * Math.cos(E));
    E -= d;
    if (Math.abs(d) < 1e-10) break;
  }
  return E;
}

export class EarthOrbitScene extends Phaser.Scene {
  constructor() {
    super('EarthOrbitScene');
  }

  init(data) {
    // Anomalia media conservata tra un restart e l'altro (resize)
    this.meanAnomaly = data?.meanAnomaly ?? 0;
  }

  create() {
    const { width, height } = this.scale;

    // Geometria reale dell'orbita (metri)
    this.rp = EARTH.R + HEO.hp;
    this.ra = EARTH.R + HEO.ha;
    this.a = (this.rp + this.ra) / 2;
    this.e = (this.ra - this.rp) / (this.ra + this.rp);
    this.b = this.a * Math.sqrt(1 - this.e * this.e);
    this.period = 2 * Math.PI * Math.sqrt(this.a ** 3 / EARTH.GM);
    this.isValid = false;
    this.wasValid = null;

    // Scala: l'ellisse occupa la parte centrale lasciando spazio all'HUD
    const usableW = width * 0.8;
    const usableH = height * 0.55;
    this.k = Math.min(usableW / (2 * this.a), usableH / (2 * this.b));
    const cx = width / 2;
    const cy = height / 2;
    // La Terra sta nel fuoco di destra: il perigeo è a destra, l'apogeo a sinistra
    this.earthX = cx + this.a * this.e * this.k;
    this.earthY = cy;
    this.ellipseCx = cx;

    addStarfield(this);
    const earthR = Math.max(EARTH.R * this.k, 6);
    addEarth(this, this.earthX, this.earthY, earthR, { label: '' });

    this.orbitGfx = this.add.graphics().setDepth(2);
    this.axisGfx = this.add.graphics().setDepth(1);
    this.drawAxis();
    this.addLabels(earthR);

    this.trail = createTrail(this, { max: 600 });
    const start = this.positionAt(this.meanAnomaly);
    this.orion = addOrion(this, start.x, start.y, { size: Phaser.Math.Clamp(height * 0.04, 22, 40) });
    const ahead = this.positionAt(this.meanAnomaly + 0.01);
    this.orion.getData('body').rotation = Math.atan2(ahead.y - start.y, ahead.x - start.x);

    enableCameraControls(this, { min: 0.5, max: 8 });

    this.unsubscribe = missionState.subscribe((s) => {
      this.isValid = Boolean(s.studentCalculations?.isValid);
    });

    const onResize = () => this.scene.restart({ meanAnomaly: this.meanAnomaly });
    this.scale.on('resize', onResize);

    this.events.once('shutdown', () => {
      this.unsubscribe?.();
      this.unsubscribe = null;
      this.scale.off('resize', onResize);
    });
  }

  /** Posizione sullo schermo per una data anomalia media (Terra nel fuoco). */
  positionAt(M) {
    const E = solveKepler(M, this.e);
    const xm = this.a * (Math.cos(E) - this.e); // dal fuoco, verso il perigeo
    const ym = this.b * Math.sin(E);
    const r = this.a * (1 - this.e * Math.cos(E));
    return { x: this.earthX + xm * this.k, y: this.earthY - ym * this.k, r };
  }

  drawOrbit(valid) {
    const g = this.orbitGfx;
    g.clear();
    const aPx = this.a * this.k;
    const bPx = this.b * this.k;
    if (valid) {
      g.lineStyle(2.5, PALETTE.orbit, 0.9);
      g.strokeEllipse(this.ellipseCx, this.earthY, aPx * 2, bPx * 2, 256);
    } else {
      strokeDashedEllipse(g, this.ellipseCx, this.earthY, aPx, bPx, { color: PALETTE.orbit, alpha: 0.55 });
    }
  }

  drawAxis() {
    // Asse maggiore: da perigeo ad apogeo passando per il centro della Terra
    const g = this.axisGfx;
    const aPx = this.a * this.k;
    const x0 = this.ellipseCx - aPx;
    const x1 = this.ellipseCx + aPx;
    const n = Math.floor((x1 - x0) / 10);
    g.lineStyle(1, PALETTE.orbitFaint, 0.6);
    for (let i = 0; i < n; i += 2) g.lineBetween(x0 + i * 10, this.earthY, x0 + (i + 1) * 10, this.earthY);
    g.fillStyle(PALETTE.orbit, 1);
    g.fillCircle(x0, this.earthY, 4);
    g.fillCircle(x1, this.earthY, 4);
  }

  addLabels(earthR) {
    const aPx = this.a * this.k;
    const bPx = this.b * this.k;
    const km = (m) => Math.round(m / 1000).toLocaleString('it-IT');
    const style = { ...LABEL_STYLE, fontSize: '14px' };

    this.add
      .text(this.ellipseCx + aPx + 12, this.earthY - 6, `PERIGEO\nquota ${km(HEO.hp)} km`, style)
      .setOrigin(0, 1)
      .setDepth(20);
    this.add
      .text(this.ellipseCx - aPx - 12, this.earthY - 6, `APOGEO\nquota ${km(HEO.ha)} km`, style)
      .setOrigin(1, 1)
      .setDepth(20);
    this.add
      .text(this.earthX, this.earthY + earthR + 10, 'TERRA', { ...LABEL_STYLE, color: PALETTE.earthLabel })
      .setOrigin(0.5, 0)
      .setDepth(20);
    this.add
      .text(this.ellipseCx, this.earthY + bPx + 14, 'asse maggiore 2a = r(perigeo) + r(apogeo)  ·  Terra in un fuoco', {
        ...LABEL_STYLE,
        color: '#94a3bb',
        fontStyle: 'normal',
      })
      .setOrigin(0.5, 0)
      .setDepth(20);
  }

  update(_time, delta) {
    if (this.wasValid !== this.isValid) {
      this.wasValid = this.isValid;
      this.drawOrbit(this.isValid);
      if (!this.isValid) this.trail.clear();
    }
    if (!this.isValid) return;

    const dt = Math.min(delta, 100) / 1000;
    const prevX = this.orion.x;
    const prevY = this.orion.y;
    // Il tempo scorre uniformemente nell'anomalia media (seconda legge di Keplero)
    this.meanAnomaly = (this.meanAnomaly + (2 * Math.PI * dt) / ORBIT_SECONDS) % (2 * Math.PI);
    const p = this.positionAt(this.meanAnomaly);
    this.orion.setPosition(p.x, p.y);
    faceMotion(this.orion, prevX, prevY);
    this.trail.push(p.x, p.y);

    // Vis-viva: v² = GM(2/r − 1/a)
    const v = Math.sqrt(EARTH.GM * (2 / p.r - 1 / this.a));
    missionState.update((s) => ({
      ...s,
      telemetry: { ...s.telemetry, altitude: (p.r - EARTH.R) / 1000, velocity: v / 1000 },
    }));
  }
}
