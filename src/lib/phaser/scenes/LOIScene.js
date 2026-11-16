import * as Phaser from 'phaser';
import { missionState } from '../../stores/missionStore.js';
import { MOON } from '../../physics/constants.js';
import {
  addStarfield,
  addMoon,
  addOrion,
  faceMotion,
  createTrail,
  strokeDashedCircle,
  enableCameraControls,
  PALETTE,
  LABEL_STYLE,
} from '../art.js';

// Modello semplificato della LOI: solo la gravità lunare, accensione istantanea al perilunio
// della traiettoria di arrivo, nel verso opposto al moto (frenata).
const V_ARRIVAL = 2515; // m/s, velocità di arrivo al perilunio (stessa del terminale di calcolo)
const TIME_SCALE = 700; // secondi simulati per secondo reale (un giro a 100 km dura ~10 s)

// Soglie di esito (quote sopra la superficie lunare)
const SUCCESS_MAX_ALT = 300000; // m: apolunio massimo per considerare l'orbita "quasi circolare"
const SUCCESS_MIN_ALT = 30000; // m: perilunio minimo di sicurezza
const ELONGATED_ALT = 10000000; // m: oltre questo apolunio la Terra perturba troppo l'orbita
const END_DIST = MOON.R + 12000000; // m: oltre questa distanza si interrompe la simulazione

export class LOIScene extends Phaser.Scene {
  constructor() {
    super('LOIScene');
  }

  create() {
    this.phase = 'idle'; // idle → approach → orbit → done
    this.isIgnited = false;
    this.pathM = [];
    this.staticObjs = [];
    this.outcome = null;
    this.sweep = 0;

    this.GM = MOON.GM;
    this.rTarget = MOON.R + MOON.orbitAltitude;

    // Traiettoria di arrivo (iperbole) con perilunio alla quota obiettivo, sull'asse +x
    this.hypE = (this.rTarget * V_ARRIVAL * V_ARRIVAL) / this.GM - 1;
    this.hypP = this.rTarget * (1 + this.hypE);
    this.hypH = this.rTarget * V_ARRIVAL;

    this.cameras.main.setZoom(1).setScroll(0, 0);
    this.layout();
    this.drawStatic();

    this.trail = createTrail(this, { max: 100000 });
    this.nu = this.approachStartNu();
    const r0 = this.hypP / (1 + this.hypE * Math.cos(this.nu));
    const p0 = this.toScreen(r0 * Math.cos(this.nu), r0 * Math.sin(this.nu));
    this.orion = addOrion(this, p0.x, p0.y, { size: 24 });
    const pNext = this.toScreen(Math.cos(this.nu + 0.01) * r0, Math.sin(this.nu + 0.01) * r0);
    this.orion.getData('body').rotation = Math.atan2(pNext.y - p0.y, pNext.x - p0.x);

    enableCameraControls(this, { min: 0.05, max: 6 });

    const unsubscribe = missionState.subscribe((state) => {
      if (state.currentPhase === 4 && state.studentCalculations.isValid && !state.isAnalyzing && !this.isIgnited) {
        this.isIgnited = true;
        this.deltaV = state.studentCalculations.loiDeltaV;
        this.phase = 'approach';
        missionState.update((s) => ({ ...s, didacticFeedback: 'Avvicinamento al perilunio: accensione retrograda (frenata) al punto più vicino alla Luna...' }));
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
      if (this.burnPoint) this.drawBurnMarker();
    };
    this.scale.on('resize', onResize);

    this.events.once('shutdown', () => {
      unsubscribe();
      this.scale.off('resize', onResize);
    });
  }

  // La Luna al centro, con raggio pari al 15% dell'altezza
  layout() {
    const { width, height } = this.scale;
    this.cx = width / 2;
    this.cy = height / 2;
    this.s = (height * 0.15) / MOON.R;
  }

  toScreen(x, y) {
    return { x: this.cx + x * this.s, y: this.cy + y * this.s };
  }

  // Anomalia vera da cui parte l'avvicinamento: circa al bordo dello schermo
  approachStartNu() {
    const { width, height } = this.scale;
    const rStart = (0.48 * Math.min(width, height)) / this.s;
    const c = (this.hypP / rStart - 1) / this.hypE;
    return -Math.acos(Math.max(-1, Math.min(1, c)));
  }

  drawStatic() {
    for (const o of this.staticObjs) o.destroy();
    this.staticObjs = [];
    const keep = (...objs) => objs.forEach((o) => o && this.staticObjs.push(o));

    keep(...addStarfield(this));

    const moon = addMoon(this, this.cx, this.cy, MOON.R * this.s);
    keep(moon.glow, moon.img, moon.text);

    const g = this.add.graphics().setDepth(1);
    keep(g);

    // Orbita obiettivo: circolare a 100 km di quota
    strokeDashedCircle(g, this.cx, this.cy, this.rTarget * this.s, { color: PALETTE.orbit, alpha: 0.7, dash: 5, gap: 5 });
    keep(
      this.add
        .text(this.cx, this.cy - this.rTarget * this.s - 8, 'orbita obiettivo: circolare a 100 km', { ...LABEL_STYLE, color: PALETTE.earthLabel })
        .setOrigin(0.5, 1)
    );

    // Traiettoria di arrivo senza frenata (iperbole): tratteggio tenue
    const nuMax = Math.acos(-1 / this.hypE) * 0.97;
    const n = 160;
    g.lineStyle(1.5, PALETTE.orbitFaint, 0.5);
    for (let i = 0; i < n; i += 2) {
      const a0 = -nuMax + (2 * nuMax * i) / n;
      const a1 = -nuMax + (2 * nuMax * (i + 1)) / n;
      const r0 = this.hypP / (1 + this.hypE * Math.cos(a0));
      const r1 = this.hypP / (1 + this.hypE * Math.cos(a1));
      const p0 = this.toScreen(r0 * Math.cos(a0), r0 * Math.sin(a0));
      const p1 = this.toScreen(r1 * Math.cos(a1), r1 * Math.sin(a1));
      g.lineBetween(p0.x, p0.y, p1.x, p1.y);
    }
    const nuL = this.approachStartNu() * 0.75;
    const rL = this.hypP / (1 + this.hypE * Math.cos(nuL));
    const pL = this.toScreen(rL * Math.cos(nuL), rL * Math.sin(nuL));
    keep(this.add.text(pL.x + 12, pL.y, 'traiettoria di arrivo', { ...LABEL_STYLE, color: PALETTE.moonLabel }).setOrigin(0, 0.5).setAlpha(0.85));

    this.burnG = this.add.graphics().setDepth(6);
    keep(this.burnG);
    this.burnLabel = null;
  }

  drawBurnMarker() {
    const p = this.toScreen(this.burnPoint.x, this.burnPoint.y);
    this.burnG.clear();
    this.burnG.fillStyle(PALETTE.orion, 1);
    this.burnG.fillCircle(p.x, p.y, 4);
    if (this.burnLabel) this.burnLabel.destroy();
    this.burnLabel = this.add
      .text(p.x + 12, p.y, 'accensione LOI', { ...LABEL_STYLE, color: PALETTE.orionCss })
      .setOrigin(0, 0.5)
      .setDepth(6);
    this.staticObjs.push(this.burnLabel);
  }

  // Accensione al perilunio: la velocità resta tangente, cambia solo il modulo
  burn() {
    const r = this.rTarget;
    const v = V_ARRIVAL - this.deltaV; // se negativa, Orion inverte il verso del moto
    this.state = { x: r, y: 0, vx: 0, vy: v };
    this.burnPoint = { x: r, y: 0 };
    this.drawBurnMarker();

    // Classificazione con l'energia specifica e le apsidi
    const eps = (v * v) / 2 - this.GM / r;
    let outcome;
    let hMin = 0;
    let hMax = Infinity;
    if (eps >= 0) {
      outcome = 'escape';
    } else {
      const k = (r * v * v) / this.GM;
      const rOther = (r * k) / (2 - k); // l'altra apside (apolunio se v > v_circ, perilunio se v < v_circ)
      hMin = Math.min(r, rOther) - MOON.R;
      hMax = Math.max(r, rOther) - MOON.R;
      if (hMin < 0) outcome = 'impact';
      else if (hMax > ELONGATED_ALT) outcome = 'elongated';
      else if (hMin < SUCCESS_MIN_ALT) outcome = 'tooLow';
      else if (hMax > SUCCESS_MAX_ALT) outcome = 'elliptic';
      else outcome = 'success';
    }
    // Δv maggiore della velocità di arrivo: Orion si ferma e riparte all'indietro (mai accettabile)
    this.outcome = { type: outcome, v, hMin, hMax, reversed: v <= 0 };

    // Durata: un giro circa 10-12 s anche per le orbite più grandi
    let timeScale = TIME_SCALE;
    if (eps < 0) {
      const a = -this.GM / (2 * eps);
      const T = 2 * Math.PI * Math.sqrt((a * a * a) / this.GM);
      timeScale = Math.max(TIME_SCALE, T / 12);
    }
    this.timeScale = timeScale;
    this.sweep = 0;

    // Zoom automatico per vedere l'orbita intera (o il tratto fino al limite della simulazione)
    const extent = Math.min(MOON.R + hMax, END_DIST);
    const { width, height } = this.scale;
    const fit = (0.45 * Math.min(width, height)) / (extent * this.s);
    if (fit < 1) this.cameras.main.zoomTo(Math.max(0.05, fit), 1500);

    // Lampo dell'accensione
    const p = this.toScreen(this.burnPoint.x, this.burnPoint.y);
    const flash = this.add.image(p.x, p.y, 'mc-glow').setTint(PALETTE.orion).setDisplaySize(60, 60).setDepth(9);
    this.tweens.add({ targets: flash, alpha: 0, scale: flash.scale * 2, duration: 900, onComplete: () => flash.destroy() });

    missionState.update((s) => ({
      ...s,
      didacticFeedback: 'Accensione retrograda eseguita. Monitoraggio della nuova orbita attorno alla Luna...',
    }));
  }

  update(_time, delta) {
    if (this.phase === 'idle' || this.phase === 'done') return;
    const realDt = Math.min(delta, 50) / 1000;

    let x;
    let y;
    let speed;

    if (this.phase === 'approach') {
      let remaining = realDt * TIME_SCALE;
      while (remaining > 0 && this.nu < 0) {
        const step = Math.min(remaining, 2);
        const r = this.hypP / (1 + this.hypE * Math.cos(this.nu));
        this.nu = Math.min(0, this.nu + (this.hypH / (r * r)) * step);
        remaining -= step;
      }
      const r = this.hypP / (1 + this.hypE * Math.cos(this.nu));
      x = r * Math.cos(this.nu);
      y = r * Math.sin(this.nu);
      speed = Math.sqrt(this.GM * (2 / r + (V_ARRIVAL * V_ARRIVAL) / this.GM - 2 / this.rTarget));
      if (this.nu >= 0) {
        this.burn();
        this.phase = 'orbit';
      }
    } else {
      // Integrazione numerica (Verlet) a passi piccoli: il punto di accensione resta dov'è Orion
      let remaining = realDt * this.timeScale;
      const st = this.state;
      while (remaining > 0) {
        const step = Math.min(remaining, 2);
        const r0 = Math.hypot(st.x, st.y);
        const ax0 = (-this.GM * st.x) / (r0 * r0 * r0);
        const ay0 = (-this.GM * st.y) / (r0 * r0 * r0);
        const prevAngle = Math.atan2(st.y, st.x);
        st.x += st.vx * step + 0.5 * ax0 * step * step;
        st.y += st.vy * step + 0.5 * ay0 * step * step;
        const r1 = Math.hypot(st.x, st.y);
        const ax1 = (-this.GM * st.x) / (r1 * r1 * r1);
        const ay1 = (-this.GM * st.y) / (r1 * r1 * r1);
        st.vx += 0.5 * (ax0 + ax1) * step;
        st.vy += 0.5 * (ay0 + ay1) * step;
        let dAng = Math.atan2(st.y, st.x) - prevAngle;
        if (dAng > Math.PI) dAng -= 2 * Math.PI;
        if (dAng < -Math.PI) dAng += 2 * Math.PI;
        this.sweep += Math.abs(dAng);
        remaining -= step;
        if (r1 <= MOON.R) break;
      }
      x = st.x;
      y = st.y;
      speed = Math.hypot(st.vx, st.vy);
    }

    this.pathM.push({ x, y });
    const scr = this.toScreen(x, y);
    const prevX = this.orion.x;
    const prevY = this.orion.y;
    this.orion.setPosition(scr.x, scr.y);
    faceMotion(this.orion, prevX, prevY);
    this.trail.push(scr.x, scr.y);

    const r = Math.hypot(x, y);
    missionState.update((s) => ({
      ...s,
      telemetry: { ...s.telemetry, altitude: Math.max(0, r - MOON.R) / 1000, velocity: speed / 1000 },
    }));

    if (this.phase !== 'orbit') return;

    if (r <= MOON.R) {
      const flash = this.add.image(scr.x, scr.y, 'mc-glow').setTint(PALETTE.fail).setDisplaySize(70, 70).setDepth(11);
      this.tweens.add({ targets: flash, alpha: 0.3, duration: 600, yoyo: true, repeat: 2 });
      this.orion.setVisible(false);
      this.finish();
    } else if (r > END_DIST || this.sweep >= Math.PI * 2) {
      this.finish();
    }
  }

  finish() {
    this.phase = 'done';
    const { type, v, hMin, hMax, reversed } = this.outcome;
    const km = (m) => Math.round(m / 1000).toLocaleString('it-IT');
    const ms = (val) => Math.round(Math.abs(val)).toLocaleString('it-IT');
    const vEsc = Math.sqrt((2 * this.GM) / this.rTarget);

    const texts = {
      escape: `Frenata insufficiente. Dopo l'accensione Orion viaggia ancora a ${ms(v)} m/s, non meno della velocità di fuga lunare a questa quota (circa ${ms(vEsc)} m/s): la sua energia totale non è negativa e la Luna non riesce a trattenerla. Orion si allontana. Aumenta il Δv.`,
      elongated: `Frenata insufficiente. Orion è stata catturata dalla Luna (energia negativa), ma l'orbita è molto allungata: l'apolunio è a ${km(hMax)} km di quota invece di 100 km. Così lontano dalla Luna la gravità della Terra perturba fortemente l'orbita, che diventa instabile. Aumenta il Δv.`,
      elliptic: `Orbita ellittica. Orion è in orbita lunare, ma la frenata è stata un po' scarsa: l'orbita va da ${km(hMin)} km a ${km(hMax)} km di quota invece di essere circolare a 100 km. Aumenta leggermente il Δv.`,
      tooLow: `Frenata un po' eccessiva. Dopo l'accensione Orion è più lenta della velocità circolare: il punto di accensione diventa l'apolunio e sul lato opposto l'orbita scende fino a ${km(hMin)} km di quota, troppo vicino ai rilievi lunari. Riduci leggermente il Δv.`,
      impact: `Frenata eccessiva! Dopo l'accensione Orion è troppo lenta per restare in orbita: il perilunio (il punto più basso dell'orbita) finisce sotto la superficie e Orion si schianta sulla Luna. Riduci il Δv.`,
      success: `Orbita lunare quasi circolare raggiunta: la quota resta tra ${km(hMin)} km e ${km(hMax)} km (obiettivo 100 km). Hai frenato quanto basta per passare dalla velocità di arrivo alla velocità circolare. Ottimo lavoro, Comandante.`,
    };
    const statuses = {
      escape: 'FUGA DALLA LUNA',
      elongated: 'ORBITA TROPPO ALLUNGATA',
      elliptic: 'ORBITA ELLITTICA',
      tooLow: 'PERILUNIO TROPPO BASSO',
      impact: 'IMPATTO LUNARE',
      success: 'ORBITA LUNARE STABILE',
    };

    if (reversed) {
      const end = {
        impact: 'e finisce per schiantarsi sulla Luna.',
        escape: 'e si allontana dalla Luna.',
      }[type] || 'e si ritrova in orbita nel verso sbagliato.';
      missionState.update((s) => ({
        ...s,
        status: 'FRENATA ECCESSIVA',
        phase4Complete: false,
        didacticFeedback: `Il Δv (${ms(this.deltaV)} m/s) è maggiore della velocità di arrivo (${ms(V_ARRIVAL)} m/s): Orion non solo si ferma, ma riparte nel verso opposto ${end} Uno spreco enorme di propellente: ricontrolla il calcolo.`,
      }));
      return;
    }

    missionState.update((s) => ({
      ...s,
      status: statuses[type],
      phase4Complete: type === 'success',
      didacticFeedback: texts[type],
    }));
  }
}
