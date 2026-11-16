import * as Phaser from 'phaser';
import { missionState } from '../../stores/missionStore.js';
import { EARTH, MOON } from '../../physics/constants.js';
import {
  addStarfield,
  addEarth,
  addMoon,
  addOrion,
  faceMotion,
  createTrail,
  strokeDashedCircle,
  enableCameraControls,
  ensureGlowTexture,
  LABEL_STYLE,
  PALETTE,
} from '../art.js';

/*
 * FASE 5 — Trans-Earth Injection (TEI).
 *
 * Modello semplificato: problema dei due corpi Orion–Luna (la gravità della Terra e il moto
 * della Luna sono trascurati). Orion parte da un'orbita circolare a 100 km di quota e accende
 * il motore in direzione del moto (accensione prograda, impulsiva): v = v_circ + Δv.
 *  - v < v_fuga  → orbita ellittica: Orion resta legata alla Luna;
 *  - v ≥ v_fuga  → traiettoria aperta (parabola/iperbole): Orion si allontana dalla Luna.
 * Il punto di accensione è scelto in modo che la traiettoria di fuga passi per la posizione
 * della Terra (nella realtà lo si ottiene scegliendo il momento giusto dell'accensione).
 *
 * Soglie (Δv_min = v_fuga − v_circ ≈ 677 m/s):
 *  - Δv < 0,99·Δv_min (≈ 670 m/s)         → MANCATA FUGA (orbita ellittica lunare)
 *  - 0,99·Δv_min ≤ Δv ≤ 1,60·Δv_min       → SUCCESSO (≈ 670–1.083 m/s)
 *  - Δv > 1,60·Δv_min (≈ 1.083 m/s)       → spreco eccessivo di propellente
 * Tra 670 e 677 m/s la differenza è solo di arrotondamento: in quel caso la scena simula il
 * minimo più qualche m/s (altrimenti Orion impiegherebbe un tempo infinito ad allontanarsi).
 */

const GM = MOON.GM;
const R0 = MOON.R + MOON.orbitAltitude; // raggio dell'orbita di partenza
const D = MOON.distance; // distanza Terra–Luna
const V_CIRC = Math.sqrt(GM / R0);
const V_ESC = Math.sqrt((2 * GM) / R0);
export const TEI_DV_MIN = V_ESC - V_CIRC; // ≈ 676,8 m/s
export const TEI_DV_RANGE = [0.99 * TEI_DV_MIN, 1.6 * TEI_DV_MIN];

const fmt = (n, d = 0) =>
  Number(n).toLocaleString('it-IT', { minimumFractionDigits: d, maximumFractionDigits: d, useGrouping: 'always' });

function formatDuration(seconds) {
  const h = Math.floor(seconds / 3600);
  const d = Math.floor(h / 24);
  const m = Math.floor((seconds % 3600) / 60);
  return d > 0 ? `${d} g ${h % 24} h` : `${h} h ${String(m).padStart(2, '0')} min`;
}

export class TEIScene extends Phaser.Scene {
  constructor() {
    super('TEIScene');
  }

  create() {
    const { width, height } = this.scale;
    ensureGlowTexture(this);

    // --- stato (inizializzato qui: la scena viene riavviata) ---
    this.phase = 'parking'; // parking | coast | burn | transfer | done
    this.phi = Math.PI * 0.75; // angolo di Orion sull'orbita di parcheggio
    this.missionTime = 0;
    this.warp = 600;
    this.orbit = null;
    this.path = []; // punti della traiettoria in metri (centro = Luna)
    this.burnTimer = 0;
    this.view = null;

    // --- grafica ---
    addStarfield(this, { spread: 3 });
    this.earth = addEarth(this, 0, 0, 20);
    this.moon = addMoon(this, 0, 0, 20);
    this.refG = this.add.graphics().setDepth(2);
    this.predG = this.add.graphics().setDepth(3);
    this.trail = createTrail(this, { max: 100000 });
    this.burnGlow = this.add.image(0, 0, 'mc-glow').setTint(PALETTE.orion).setAlpha(0).setDepth(9);
    this.orion = addOrion(this, 0, 0, { size: 24 });

    this.warpText = this.add.text(0, 0, '', { ...LABEL_STYLE, color: '#fbbf24' }).setOrigin(1, 0).setScrollFactor(0).setDepth(200);
    this.infoText = this.add.text(0, 0, '', { ...LABEL_STYLE }).setOrigin(1, 0).setScrollFactor(0).setDepth(200);
    this.layoutHud();

    enableCameraControls(this, { min: 0.5, max: 4 });

    const unsubscribe = missionState.subscribe((state) => {
      if (
        this.phase === 'parking' &&
        state.currentPhase === 5 &&
        state.studentCalculations.isValid &&
        !state.isAnalyzing &&
        !state.showBriefing
      ) {
        this.prepareBurn(Number(state.studentCalculations.teiDeltaV));
      }
    });

    const onResize = () => {
      if (this.phase === 'parking') this.scene.restart();
      else this.layoutHud();
    };
    this.scale.on('resize', onResize);

    this.events.once('shutdown', () => {
      unsubscribe();
      this.scale.off('resize', onResize);
    });

    this.renderFrame(0);
  }

  layoutHud() {
    const { width, height } = this.scale;
    const y0 = Math.max(110, height * 0.2);
    this.warpText.setPosition(width - 24, y0);
    this.infoText.setPosition(width - 24, y0 + 24);
  }

  // ---------------------------------------------------------------------------
  // Fisica
  // ---------------------------------------------------------------------------

  prepareBurn(dv) {
    if (!Number.isFinite(dv) || dv <= 0) return;
    this.dv = dv;
    // Tolleranza di arrotondamento (−1%): simuliamo almeno il minimo + 8 m/s
    const dvSim = dv >= TEI_DV_RANGE[0] && dv < TEI_DV_MIN + 8 ? TEI_DV_MIN + 8 : dv;
    const v1 = V_CIRC + dvSim;
    const energy = (v1 * v1) / 2 - GM / R0;
    const hAng = R0 * v1; // momento angolare specifico
    const e = Math.sqrt(Math.max(0, 1 + (2 * energy * hAng * hAng) / (GM * GM)));
    const p = (hAng * hAng) / GM; // semilato retto
    const bound = energy < 0;
    const a = bound ? -GM / (2 * energy) : Infinity;

    // Orientazione della traiettoria: il pericentro è il punto di accensione
    let omega;
    if (bound) {
      omega = 0; // apocentro verso la Terra (a sinistra)
    } else {
      const cosNu = (p / D - 1) / e; // anomalia vera alla distanza della Terra
      omega = Math.PI - Math.acos(Math.max(-1, Math.min(1, cosNu)));
    }

    this.orbit = { v1, energy, e, p, a, hAng, bound, omega, theta: 0 };
    this.phase = 'coast';
    missionState.update((s) => ({
      ...s,
      status: 'Attesa del punto di accensione',
      didacticFeedback: '',
    }));
  }

  radiusAt(theta) {
    const { p, e } = this.orbit;
    return p / (1 + e * Math.cos(theta));
  }

  stepSim(dtReal) {
    // Accelerazione del tempo crescente con la distanza dalla Luna
    const r = this.phase === 'transfer' ? this.radiusAt(this.orbit.theta) : R0;
    this.warp = Math.min(4e6, 600 * Math.pow(r / R0, 1.5));
    let dtSim = dtReal * this.warp;

    if (this.phase === 'parking' || this.phase === 'coast') {
      const dphi = (V_CIRC / R0) * dtSim;
      if (this.phase === 'coast') {
        const remaining = Phaser.Math.Angle.Wrap(this.orbit.omega - this.phi);
        const ahead = remaining < 0 ? remaining + Math.PI * 2 : remaining;
        if (ahead <= dphi) {
          this.phi = this.orbit.omega;
          this.missionTime += ahead / (V_CIRC / R0);
          this.phase = 'burn';
          this.burnTimer = 1.2;
          this.path = [{ x: R0 * Math.cos(this.phi), y: R0 * Math.sin(this.phi) }];
          missionState.update((s) => ({
            ...s,
            status: 'Accensione TEI',
            didacticFeedback: `Motore acceso in direzione del moto: Δv = ${fmt(this.dv)} m/s.`,
          }));
          return;
        }
      }
      this.phi += dphi;
      this.missionTime += dtSim;
      return;
    }

    if (this.phase === 'burn') {
      this.burnTimer -= dtReal;
      if (this.burnTimer <= 0) {
        this.phase = 'transfer';
        missionState.update((s) => ({ ...s, status: 'Esecuzione manovra TEI' }));
      }
      return;
    }

    if (this.phase !== 'transfer') return;

    // Propagazione sulla conica in anomalia vera (sotto-passi piccoli)
    const o = this.orbit;
    while (dtSim > 0) {
      const rr = this.radiusAt(o.theta);
      const thetaDot = o.hAng / (rr * rr);
      const vNow = Math.sqrt(Math.max(0, 2 * (o.energy + GM / rr)));
      const dt = Math.min(dtSim, 0.004 / thetaDot, D / 3000 / Math.max(vNow, 1));
      o.theta += thetaDot * dt;
      dtSim -= dt;
      this.missionTime += dt;

      const ang = o.theta + o.omega;
      const r2 = this.radiusAt(o.theta);
      const x = r2 * Math.cos(ang);
      const y = r2 * Math.sin(ang);
      this.path.push({ x, y });

      if (o.bound && o.theta >= Math.PI * 2) {
        this.finish('bound');
        return;
      }
      if (!o.bound) {
        const dEarth = Math.hypot(x + D, y);
        if (dEarth <= EARTH.R + 120000 || r2 >= D) {
          this.finish(this.dv > TEI_DV_RANGE[1] ? 'excess' : 'ok');
          return;
        }
      }
    }
  }

  position() {
    if (this.phase === 'transfer' || this.phase === 'done') {
      const o = this.orbit;
      const r = this.radiusAt(o.theta);
      const ang = o.theta + o.omega;
      return { x: r * Math.cos(ang), y: r * Math.sin(ang), r };
    }
    return { x: R0 * Math.cos(this.phi), y: R0 * Math.sin(this.phi), r: R0 };
  }

  finish(kind) {
    this.phase = 'done';
    const o = this.orbit;
    const dv = fmt(this.dv);
    const pos = this.position();
    const speed = Math.sqrt(Math.max(0, 2 * (o.energy + GM / pos.r)));
    missionState.update((s) => ({
      ...s,
      telemetry: { ...s.telemetry, altitude: Math.hypot(pos.x + D, pos.y) / 1000, velocity: speed / 1000 },
    }));
    const vMin = fmt(TEI_DV_MIN);
    if (kind === 'bound') {
      const apo = o.a * (1 + o.e) - MOON.R;
      missionState.update((s) => ({
        ...s,
        status: 'MANCATA FUGA',
        didacticFeedback: `Orion è rimasta legata alla Luna. Con Δv = ${dv} m/s la velocità raggiunta (${fmt(o.v1)} m/s) è minore della velocità di fuga (${fmt(V_ESC)} m/s): l'energia totale è ancora negativa. L'accensione ha solo allungato l'orbita, che ora è un'ellisse con il punto più lontano a ${fmt(apo / 1000)} km di quota. Ricalcola il Δv minimo per la fuga.`,
      }));
    } else if (kind === 'excess') {
      const extra = Math.round((this.dv / TEI_DV_MIN - 1) * 100);
      missionState.update((s) => ({
        ...s,
        status: 'ALLARME PROPELLENTE',
        didacticFeedback: `Orion è sfuggita alla Luna, ma con Δv = ${dv} m/s: il ${extra}% in più del minimo (${vMin} m/s). Ogni m/s in più costa propellente (formula di Tsiolkovsky): abbiamo bruciato le riserve che servono per le correzioni di rotta e per le emergenze. Un piccolo margine sopra il minimo va bene, un eccesso così no: ricalcola.`,
      }));
    } else {
      const vInf = Math.sqrt(Math.max(0, 2 * o.energy));
      missionState.update((s) => ({
        ...s,
        status: 'ROTTA VERSO LA TERRA',
        phase5Complete: true,
        didacticFeedback: `TEI riuscita! Con Δv = ${dv} m/s (minimo ${vMin} m/s) Orion ha superato la velocità di fuga e si allontana dalla Luna a ${fmt(vInf)} m/s. Tempo di volo simulato: ${formatDuration(this.missionTime)}. Prepariamoci al rientro in atmosfera.`,
      }));
    }
  }

  // ---------------------------------------------------------------------------
  // Disegno: coordinate fisiche (metri, Luna al centro) → schermo con zoom automatico
  // ---------------------------------------------------------------------------

  targetView(pos) {
    const { width, height } = this.scale;
    let minX = -R0 * 1.6;
    let maxX = R0 * 1.6;
    let minY = -R0 * 1.6;
    let maxY = R0 * 1.6;
    const include = (x, y, m) => {
      minX = Math.min(minX, x - m);
      maxX = Math.max(maxX, x + m);
      minY = Math.min(minY, y - m);
      maxY = Math.max(maxY, y + m);
    };
    include(pos.x, pos.y, pos.r * 0.15);
    if (this.orbit && !this.orbit.bound && (this.phase === 'transfer' || this.phase === 'done') && pos.r > D * 0.08) {
      include(-D, 0, EARTH.R * 4); // quando Orion è lontana mostriamo anche la Terra
    }
    if (this.orbit && this.orbit.bound && (this.phase === 'transfer' || this.phase === 'done')) {
      const apo = this.orbit.a * (1 + this.orbit.e);
      include(-apo, 0, R0); // l'ellisse intera
      include(this.orbit.a * (1 - this.orbit.e), 0, R0);
      const b = this.orbit.a * Math.sqrt(1 - this.orbit.e ** 2);
      include(-this.orbit.a * this.orbit.e, b, R0);
      include(-this.orbit.a * this.orbit.e, -b, R0);
    }
    const usableH = height * 0.62;
    const s = Math.min((width * 0.8) / (maxX - minX), usableH / (maxY - minY));
    return { cx: (minX + maxX) / 2, cy: (minY + maxY) / 2, s };
  }

  update(_time, delta) {
    const dtReal = Math.min(delta, 50) / 1000;
    if (this.phase !== 'done') this.stepSim(dtReal);
    this.renderFrame(dtReal);
  }

  renderFrame(dtReal) {
    const { width, height } = this.scale;
    const pos = this.position();
    const tv = this.targetView(pos);
    if (!this.view) this.view = { ...tv };
    else {
      const k = 1 - Math.exp(-dtReal * 2.5);
      this.view.s = Math.exp(Math.log(this.view.s) + (Math.log(tv.s) - Math.log(this.view.s)) * k);
      this.view.cx += (tv.cx - this.view.cx) * k;
      this.view.cy += (tv.cy - this.view.cy) * k;
    }
    const v = this.view;
    const ox = width / 2;
    const oy = height * 0.47;
    const toScreen = (x, y) => ({ x: ox + (x - v.cx) * v.s, y: oy + (y - v.cy) * v.s });

    // Corpi celesti (dimensione minima per restare visibili quando lo zoom è lontano)
    const moonR = Math.max(MOON.R * v.s, 7);
    const earthR = Math.max(EARTH.R * v.s, 12);
    const m = toScreen(0, 0);
    const e = toScreen(-D, 0);
    this.placeBody(this.moon, m, moonR, 2.8);
    this.placeBody(this.earth, e, earthR, 3.2);

    // Orbita di parcheggio e traiettoria prevista
    this.refG.clear();
    strokeDashedCircle(this.refG, m.x, m.y, R0 * v.s, { color: PALETTE.orbit, alpha: 0.45 });

    this.predG.clear();
    if (this.orbit && this.phase !== 'parking') {
      const o = this.orbit;
      this.predG.lineStyle(1.5, PALETTE.orbitFaint, 0.55);
      this.predG.beginPath();
      const maxTheta = o.bound ? Math.PI * 2 : Math.acos(Math.max(-1, Math.min(1, (o.p / D - 1) / o.e)));
      const n = 180;
      for (let i = 0; i <= n; i++) {
        const th = (i / n) * maxTheta;
        const r = this.radiusAt(th);
        const q = toScreen(r * Math.cos(th + o.omega), r * Math.sin(th + o.omega));
        if (i === 0) this.predG.moveTo(q.x, q.y);
        else this.predG.lineTo(q.x, q.y);
      }
      this.predG.strokePath();
    }

    // Scia (punti fisici trasformati a ogni frame)
    const pts = this.trail.points;
    pts.length = 0;
    const step = Math.max(1, Math.floor(this.path.length / 1500));
    for (let i = 0; i < this.path.length; i += step) pts.push(toScreen(this.path[i].x, this.path[i].y));
    if (this.path.length) pts.push(toScreen(pos.x, pos.y));
    this.trail.draw();

    // Orion
    const prevX = this.orion.x;
    const prevY = this.orion.y;
    const o = toScreen(pos.x, pos.y);
    this.orion.setPosition(o.x, o.y);
    faceMotion(this.orion, prevX, prevY);

    if (this.phase === 'burn') {
      const a = 0.6 + 0.4 * Math.sin(this.time.now / 60);
      this.burnGlow.setPosition(o.x, o.y).setDisplaySize(70, 70).setAlpha(a);
    } else {
      this.burnGlow.setAlpha(0);
    }

    // HUD
    this.warpText.setText(this.phase === 'done' ? '' : `TIME WARP ×${fmt(Math.round(this.warp))}`);
    this.infoText.setText(`T+ ${formatDuration(this.missionTime)}`);

    // Telemetria: distanza dal centro della Terra e velocità rispetto alla Luna
    if (this.phase === 'transfer' || this.phase === 'coast' || this.phase === 'burn') {
      const dEarth = Math.hypot(pos.x + D, pos.y);
      const speed =
        this.phase === 'transfer'
          ? Math.sqrt(Math.max(0, 2 * (this.orbit.energy + GM / pos.r)))
          : V_CIRC;
      missionState.update((s) => ({
        ...s,
        telemetry: { ...s.telemetry, altitude: dEarth / 1000, velocity: speed / 1000 },
      }));
    }
  }

  placeBody(body, p, r, glowFactor) {
    body.img.setPosition(p.x, p.y).setDisplaySize(r * 2, r * 2);
    body.glow.setPosition(p.x, p.y).setDisplaySize(r * glowFactor, r * glowFactor);
    if (body.text) body.text.setPosition(p.x, p.y + r + 10);
  }
}
