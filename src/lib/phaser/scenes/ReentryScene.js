import * as Phaser from 'phaser';
import { missionState, updateTelemetry } from '../../stores/missionStore.js';
import { EARTH, G0 } from '../../physics/constants.js';
import { addStarfield, ensureGlowTexture, LABEL_STYLE, PALETTE } from '../art.js';

/*
 * FASE 6 — Rientro atmosferico e ammaraggio.
 *
 * Modello fisico (semplificato, 2D, Terra sferica):
 *  - stato: quota h, velocità v, angolo di volo γ (negativo = verso il basso);
 *  - forze: gravità GM/r², resistenza aerodinamica D = ½ ρ v² (Cd·A), portanza L = (L/D)·D;
 *  - atmosfera esponenziale ρ = ρ0 · e^(−h/H).
 *  - Durante la fase ipersonica Orion usa la portanza: punta la portanza verso l'alto mentre
 *    scende e la ruota verso il basso se la traiettoria comincia a risalire (guida semplificata).
 *    Il rapporto L/D = 0,6 è un valore EFFETTIVO, calibrato perché il modello riproduca il
 *    corridoio di rientro della tabella del briefing (Orion reale: L/D ≈ 0,3 con una guida
 *    molto più raffinata). Risultati del modello (entrata a 120 km, 11 km/s):
 *      γ ≥ −5,8°  → rimbalzo (skip-off);
 *      γ = −6,0°  → 4,2 g, 2.430 °C;   γ = −6,5° → 5,9 g, 2.520 °C;   γ = −7,0° → 7,8 g, 2.590 °C;
 *      γ ≤ −7,1°  → oltre 8 g → fallimento.
 *  - Temperatura mostrata = temperatura superficiale dello scudo, stimata con il flusso termico
 *    di Sutton–Graves (q ∝ √ρ · v³) e l'equilibrio radiativo (T ∝ q^¼), con un fattore di
 *    calibrazione (HEAT_K) e un'inerzia termica di qualche secondo. È una stima didattica:
 *    serve a mostrare l'ordine di grandezza (≈ 2.500 °C per un rientro nominale).
 *  - Paracadute: freno (drogue) all'altitudine scelta dallo studente, principali a 3.000 m.
 *    Sotto i principali conta solo la loro resistenza (quella della capsula è trascurabile),
 *    come nella formula del briefing: m·g = ½ ρ v² Cd A.
 */

export const RE_MODEL = {
  mass: 10400, // kg, massa della capsula (dato del briefing)
  entryAltitude: 120000, // m, interfaccia di rientro
  entrySpeed: 11000, // m/s
  rho0: 1.225, // kg/m³, densità al livello del mare
  H: 8000, // m, altezza di scala dell'atmosfera
  capsuleCdA: 30.6, // m², Cd·A della capsula (scudo da 5 m): a 10 km la capsula scende a ≈ 150 m/s
  liftToDrag: 0.6, // L/D effettivo (calibrato, vedi sopra)
  liftGuardDeg: 0.5, // se γ supera questo valore la portanza viene puntata verso il basso
  gLimit: 8, // g, limite di decelerazione per l'equipaggio
  tempLimit: 2800, // °C, limite dello scudo termico
  heatK: 7.59, // calibrazione: T[K] = HEAT_K · (√ρ · v³)^¼
  thermalTau: 6, // s, inerzia termica della superficie dello scudo
  drogueCdA: 45, // m², due paracadute freno
  drogueInflate: 2, // s, tempo di gonfiaggio
  drogueAltitude: 7000, // m, valore corretto (10.000 m − 150 m/s · 20 s)
  drogueTolerance: 0.1, // ±10%
  drogueMaxSpeed: 250, // m/s, oltre questa velocità i drogue si strappano
  mainAltitude: 3000, // m, apertura dei paracadute principali
  mainMaxSpeed: 70, // m/s, velocità massima di apertura dei principali
  mainCd: 2.0,
  mainInflate: 8, // s, apertura graduale (reefing): niente strappi né salti di velocità
  splashSpeed: 10, // m/s, velocità di ammaraggio di progetto
  areaTolerance: 0.1, // ±10% sull'area dei principali
  gBriefing: 9.81, // m/s², g usata nel briefing
};

// Area corretta dei paracadute principali: m·g = ½ ρ v² Cd A  →  A = 2mg / (ρ v² Cd) ≈ 832,8 m²
export const IDEAL_MAIN_AREA =
  (2 * RE_MODEL.mass * RE_MODEL.gBriefing) / (RE_MODEL.rho0 * RE_MODEL.splashSpeed ** 2 * RE_MODEL.mainCd);

export const DROGUE_WINDOW = [
  RE_MODEL.drogueAltitude * (1 - RE_MODEL.drogueTolerance),
  RE_MODEL.drogueAltitude * (1 + RE_MODEL.drogueTolerance),
];
export const AREA_WINDOW = [IDEAL_MAIN_AREA * (1 - RE_MODEL.areaTolerance), IDEAL_MAIN_AREA * (1 + RE_MODEL.areaTolerance)];

/** Un passo di integrazione (Eulero semi-implicito, dt piccolo). Modifica lo stato s. */
export function stepReentry(s, dt, mainArea, p = RE_MODEL) {
  const r = EARTH.R + s.h;
  const g = EARTH.GM / (r * r);
  const rho = p.rho0 * Math.exp(-Math.max(0, s.h) / p.H);

  let cdA = p.capsuleCdA;
  let LD = 0;
  if (s.chute === 'none') {
    // La portanza conta solo a velocità ipersoniche; sotto 1 km/s la capsula cade in modo balistico
    LD = p.liftToDrag * Math.min(1, Math.max(0, (s.v - 1000) / 1000));
  } else if (s.chute === 'drogue') {
    s.chuteT += dt;
    cdA += p.drogueCdA * Math.min(1, s.chuteT / p.drogueInflate);
  } else if (s.chute === 'main') {
    s.chuteT += dt;
    cdA = p.mainCd * mainArea * Math.min(1, s.chuteT / p.mainInflate);
  }

  const D = 0.5 * rho * s.v * s.v * cdA;
  const Lv = (s.gam < (p.liftGuardDeg * Math.PI) / 180 ? 1 : -1) * LD * D;
  const dv = -D / p.mass - g * Math.sin(s.gam);
  const dgam = s.v > 1 ? Lv / (p.mass * s.v) - (g / s.v - s.v / r) * Math.cos(s.gam) : 0;

  s.v = Math.max(0, s.v + dv * dt);
  s.gam += dgam * dt;
  s.h += s.v * Math.sin(s.gam) * dt;
  s.t += dt;

  s.load = Math.hypot(D, LD * D) / (p.mass * G0);
  s.maxG = Math.max(s.maxG, s.load);

  const tEq = Math.max(15, p.heatK * Math.pow(Math.sqrt(rho) * s.v ** 3, 0.25) - 273.15);
  s.T += (tEq - s.T) * (1 - Math.exp(-dt / p.thermalTau));
  s.maxT = Math.max(s.maxT, s.T);
}

const fmt = (n, d = 0) =>
  Number(n).toLocaleString('it-IT', { minimumFractionDigits: d, maximumFractionDigits: d, useGrouping: 'always' });

const lerp = (a, b, t) => a + (b - a) * t;
const clamp01 = (x) => Math.max(0, Math.min(1, x));

function lerpColor(c1, c2, t) {
  const r = Math.round(lerp((c1 >> 16) & 255, (c2 >> 16) & 255, t));
  const g = Math.round(lerp((c1 >> 8) & 255, (c2 >> 8) & 255, t));
  const b = Math.round(lerp(c1 & 255, c2 & 255, t));
  return (r << 16) | (g << 8) | b;
}

// Colori del cielo (alto, orizzonte) in funzione della quota
const SKY_STOPS = [
  { h: 0, top: 0x3a72c0, bot: 0xb5d8f5 },
  { h: 5000, top: 0x2b5fa8, bot: 0x8cbbe8 },
  { h: 15000, top: 0x16376e, bot: 0x5d93d1 },
  { h: 35000, top: 0x081430, bot: 0x2a5596 },
  { h: 60000, top: 0x04060b, bot: 0x16305e },
  { h: 90000, top: 0x04060b, bot: 0x0a1830 },
];

function skyAt(h) {
  if (h <= 0) return SKY_STOPS[0];
  for (let i = 1; i < SKY_STOPS.length; i++) {
    const a = SKY_STOPS[i - 1];
    const b = SKY_STOPS[i];
    if (h <= b.h) {
      const t = (h - a.h) / (b.h - a.h);
      return { top: lerpColor(a.top, b.top, t), bot: lerpColor(a.bot, b.bot, t) };
    }
  }
  return SKY_STOPS[SKY_STOPS.length - 1];
}

// Capsula Orion vista di lato: scudo termico in basso, punta in alto
function ensureCapsuleTexture(scene) {
  const key = 'mc-capsule';
  if (scene.textures.exists(key)) return key;
  const size = 128;
  const tex = scene.textures.createCanvas(key, size, size);
  const ctx = tex.getContext();
  const c = size / 2;
  // Corpo conico
  const body = ctx.createLinearGradient(c - 46, 0, c + 46, 0);
  body.addColorStop(0, '#f4f6fa');
  body.addColorStop(0.6, '#c9ced8');
  body.addColorStop(1, '#8b93a3');
  ctx.fillStyle = body;
  ctx.beginPath();
  ctx.moveTo(c - 17, 26);
  ctx.lineTo(c + 17, 26);
  ctx.lineTo(c + 46, 92);
  ctx.lineTo(c - 46, 92);
  ctx.closePath();
  ctx.fill();
  // Vano paracadute (punta)
  ctx.fillStyle = '#9aa3b2';
  ctx.fillRect(c - 15, 18, 30, 9);
  ctx.fillStyle = '#6b7383';
  ctx.fillRect(c - 9, 13, 18, 6);
  // Finestrini
  ctx.fillStyle = '#1b2a44';
  ctx.beginPath();
  ctx.moveTo(c - 20, 46);
  ctx.lineTo(c - 10, 46);
  ctx.lineTo(c - 12, 56);
  ctx.lineTo(c - 24, 56);
  ctx.closePath();
  ctx.fill();
  ctx.beginPath();
  ctx.moveTo(c + 2, 46);
  ctx.lineTo(c + 12, 46);
  ctx.lineTo(c + 14, 56);
  ctx.lineTo(c + 2, 56);
  ctx.closePath();
  ctx.fill();
  // Fascia arancione
  ctx.fillStyle = '#ff6a2b';
  ctx.fillRect(c - 42, 84, 84, 4);
  // Scudo termico
  ctx.fillStyle = '#5a3418';
  ctx.beginPath();
  ctx.moveTo(c - 48, 91);
  ctx.quadraticCurveTo(c, 112, c + 48, 91);
  ctx.closePath();
  ctx.fill();
  ctx.strokeStyle = '#2e1a0c';
  ctx.lineWidth = 2;
  ctx.stroke();
  tex.refresh();
  return key;
}

export class ReentryScene extends Phaser.Scene {
  constructor() {
    super({ key: 'ReentryScene' });
  }

  create() {
    const { width, height } = this.scale;
    ensureGlowTexture(this);
    ensureCapsuleTexture(this);

    // --- stato (tutto qui: la scena viene riavviata) ---
    this.sim = {
      h: RE_MODEL.entryAltitude,
      v: RE_MODEL.entrySpeed,
      gam: (-6.5 * Math.PI) / 180,
      t: 0,
      chute: 'none',
      chuteT: 0,
      load: 0,
      maxG: 0,
      T: 15,
      maxT: 15,
    };
    this.phase = 'waiting'; // waiting | running | done
    this.outcome = null;
    this.mainArea = IDEAL_MAIN_AREA;
    this.drogueAlt = RE_MODEL.drogueAltitude;
    this.angle = -6.5;
    this.warp = 1;
    this.capY = height * 0.45;
    this.chuteFx = { detached: false, offset: 0, alpha: 1, collapse: 0 };
    this.splash = null;
    this.elapsed = 0;

    // --- grafica ---
    this.skyG = this.add.graphics().setDepth(-200);
    this.stars = addStarfield(this, { spread: 1.2, scrollFactor: false });
    this.horizonG = this.add.graphics().setDepth(-90);
    this.cloudG = this.add.graphics().setDepth(-80);
    this.clouds = Array.from({ length: 9 }, (_, i) => ({
      alt: [1800, 2400, 4500, 5200, 6800, 8500, 9500, 11000, 1200][i],
      x: Math.random(),
      w: 90 + Math.random() * 140,
    }));
    this.streakG = this.add.graphics().setDepth(-10);
    this.streaks = Array.from({ length: 28 }, () => ({ u: Math.random(), w: Math.random() * 2 - 1, len: 30 + Math.random() * 70 }));

    this.chuteG = this.add.graphics().setDepth(8);

    this.plasmaOuter = this.add.image(0, 0, 'mc-glow').setTint(0xff4a2b).setDepth(9).setAlpha(0);
    this.plasmaInner = this.add.image(0, 0, 'mc-glow').setTint(0xffc078).setDepth(11).setAlpha(0);
    this.wake = Array.from({ length: 5 }, (_, i) =>
      this.add.image(0, 0, 'mc-glow').setTint(i < 2 ? 0xff8a3a : 0xff4f7a).setDepth(9).setAlpha(0),
    );
    this.capsule = this.add.image(width / 2, this.capY, 'mc-capsule').setDisplaySize(72, 72).setDepth(10);

    this.oceanG = this.add.graphics().setDepth(12);
    this.splashG = this.add.graphics().setDepth(13);

    // HUD della scena (decelerazione, temperatura, paracadute, tempo)
    const hudStyle = { ...LABEL_STYLE, fontSize: '15px' };
    this.hud = ['g', 'temp', 'chute', 'warp'].map((k) =>
      this.add.text(0, 0, '', { ...hudStyle }).setOrigin(1, 0).setDepth(200).setData('k', k),
    );
    this.layoutHud();
    this.updateHud();
    this.drawWorld(0);

    updateTelemetry({
      velocity: this.sim.v / 1000,
      altitude: this.sim.h / 1000,
      fuelRemaining: 0,
      stage: 'Orion Crew Module',
    });

    const unsubscribe = missionState.subscribe((state) => {
      if (
        this.phase === 'waiting' &&
        state.currentPhase === 6 &&
        state.studentCalculations.isValid &&
        !state.isAnalyzing &&
        !state.showBriefing
      ) {
        this.start(state.studentCalculations);
      }
    });

    const onResize = () => {
      if (this.phase === 'waiting') {
        this.scene.restart();
      } else {
        this.layoutHud();
      }
    };
    this.scale.on('resize', onResize);

    this.events.once('shutdown', () => {
      unsubscribe();
      this.scale.off('resize', onResize);
    });
  }

  start(calc) {
    this.angle = Number(calc.reentryAngle);
    this.drogueAlt = Number(calc.parachuteDrogueAltitude);
    this.mainArea = Number(calc.parachuteArea);
    this.sim.gam = (this.angle * Math.PI) / 180;
    this.phase = 'running';
    missionState.update((s) => ({ ...s, status: 'Rientro atmosferico' }));
  }

  layoutHud() {
    const { width, height } = this.scale;
    const y0 = Math.max(110, height * 0.22);
    this.hud.forEach((t, i) => t.setPosition(width - 24, y0 + i * 26));
  }

  updateHud() {
    const s = this.sim;
    const [gT, tT, cT, wT] = this.hud;
    const g = this.phase === 'waiting' ? 0 : s.load;
    gT.setText(`DECELERAZIONE  ${fmt(g, 1)} g  (max ${fmt(s.maxG, 1)})`);
    gT.setColor(g > RE_MODEL.gLimit ? '#f87171' : g > 6 ? '#fbbf24' : PALETTE.label);
    tT.setText(`TEMP. SCUDO  ${fmt(Math.round(s.T / 10) * 10)} °C`);
    tT.setColor(s.T > 2000 ? '#ffb070' : PALETTE.label);
    const chuteLabel = { none: '—', drogue: 'FRENO (DROGUE)', main: 'PRINCIPALI' }[s.chute];
    cT.setText(`PARACADUTE  ${chuteLabel}`);
    wT.setText(this.phase === 'running' ? `TEMPO ×${fmt(this.warp)}` : '');
    wT.setColor('#fbbf24');
  }

  update(_time, delta) {
    const dtReal = Math.min(delta, 50) / 1000;
    this.elapsed += dtReal;

    if (this.phase === 'running') {
      const s = this.sim;
      // Accelerazione del tempo: veloce dove non succede nulla, lenta ai paracadute
      // (rientro nominale ≈ 45 s reali; il picco di decelerazione resta ben visibile)
      if (s.chute === 'main') this.warp = 40;
      else if (s.chute === 'drogue' || s.h < 15000) this.warp = 15;
      else if (s.v > 6000) this.warp = s.load > 1 ? 10 : 40;
      else this.warp = 100;

      let remaining = dtReal * this.warp;
      const dtMax = s.chute === 'none' && s.h > 15000 ? 0.05 : 0.02;
      while (remaining > 0 && this.phase === 'running') {
        const dt = Math.min(dtMax, remaining);
        remaining -= dt;
        stepReentry(s, dt, this.mainArea);
        this.checkEvents();
      }

      updateTelemetry({ velocity: s.v / 1000, altitude: Math.max(0, s.h) / 1000 });
    }

    this.drawWorld(dtReal);
    this.updateHud();
  }

  checkEvents() {
    const s = this.sim;
    const P = RE_MODEL;
    const a = fmt(this.angle, 1);

    if (s.chute === 'none' && s.h > P.entryAltitude + 1000 && s.gam > 0) {
      return this.end('skip', false, 'RIMBALZO (SKIP-OFF)',
        `Con un angolo di ${a}° la traiettoria è troppo radente: la capsula attraversa solo gli strati più rarefatti, frena poco (picco di ${fmt(s.maxG, 1)} g) e torna fuori dall'atmosfera. Serve un angolo più ripido, cioè più negativo.`);
    }
    if (s.chute === 'none' && s.load > P.gLimit) {
      return this.end('overg', false, 'RIENTRO TROPPO RIPIDO',
        `Con un angolo di ${a}° la capsula si tuffa troppo in fretta negli strati densi dell'atmosfera: la decelerazione ha superato il limite di ${P.gLimit} g sopportabile dall'equipaggio. Serve un angolo meno ripido.`);
    }
    if (s.T > P.tempLimit) {
      return this.end('heat', false, 'SCUDO TERMICO OLTRE IL LIMITE',
        `Con un angolo di ${a}° lo scudo termico ha superato i ${fmt(P.tempLimit)} °C, il massimo che può sopportare. Serve un angolo meno ripido.`);
    }

    // Paracadute freno (drogue)
    if (s.chute === 'none' && s.h <= this.drogueAlt && this.drogueAlt > P.mainAltitude) {
      const alt = fmt(this.drogueAlt);
      s.chute = 'drogue';
      s.chuteT = 0;
      if (s.v > P.drogueMaxSpeed) {
        return this.end('drogue', false, 'PARACADUTE FRENO STRAPPATI',
          `Hai programmato i paracadute freno a ${alt} m: lì la capsula viaggia ancora a ${fmt(s.v)} m/s, troppo veloce, e i paracadute si strappano. Ricontrolla il calcolo cinematico della quota di apertura.`);
      }
      if (this.drogueAlt > DROGUE_WINDOW[1]) {
        return this.end('drogue', false, 'APERTURA DROGUE TROPPO ALTA',
          `Paracadute freno aperti a ${alt} m, sopra la finestra prevista dal piano di volo. Più in alto l'aria è più rarefatta e la capsula più veloce: i drogue si gonfiano male e non la stabilizzano. Ricontrolla il calcolo cinematico della quota di apertura.`);
      }
      if (this.drogueAlt < DROGUE_WINDOW[0]) {
        return this.end('drogue', false, 'APERTURA DROGUE TROPPO BASSA',
          `Paracadute freno aperti a ${alt} m, sotto la finestra prevista dal piano di volo: prima dell'apertura dei paracadute principali (a ${fmt(P.mainAltitude)} m) non resta abbastanza quota per stabilizzare e rallentare la capsula. Ricontrolla il calcolo cinematico della quota di apertura.`);
      }
    }

    // Paracadute principali, sempre a quota fissa
    if (s.chute !== 'main' && s.h <= P.mainAltitude) {
      if (s.chute === 'none' || s.v > P.mainMaxSpeed) {
        s.chute = 'main';
        s.chuteT = 0;
        return this.end('main', false, 'PARACADUTE PRINCIPALI STRAPPATI',
          `A ${fmt(P.mainAltitude)} m si aprono i paracadute principali, ma i paracadute freno non avevano ancora rallentato la capsula (li hai programmati a ${fmt(this.drogueAlt)} m): a ${fmt(s.v)} m/s i principali si strappano. Ricontrolla il calcolo cinematico della quota di apertura.`);
      }
      s.chute = 'main';
      s.chuteT = 0;
    }

    // Ammaraggio
    if (s.h <= 0) {
      s.h = 0;
      const v = fmt(s.v, 1);
      const A = fmt(this.mainArea, 1);
      if (this.mainArea < AREA_WINDOW[0]) {
        return this.end('splash-fast', false, 'AMMARAGGIO TROPPO VIOLENTO',
          `La capsula tocca l'acqua a ${v} m/s, oltre i ${fmt(P.splashSpeed)} m/s di progetto: con ${A} m² i paracadute principali non producono abbastanza resistenza aerodinamica. Ricontrolla il calcolo dell'area.`);
      }
      if (this.mainArea > AREA_WINDOW[1]) {
        return this.end('splash-big', false, 'PARACADUTE SOVRADIMENSIONATI',
          `La capsula tocca l'acqua a ${v} m/s, ma ${A} m² di paracadute sono molto più del necessario: pesano e occupano troppo spazio nel vano di Orion, e scendendo così lentamente la capsula viene trascinata a lungo dal vento. Ricontrolla il calcolo dell'area.`);
      }
      return this.end('splash', true, 'AMMARAGGIO RIUSCITO',
        `Ammaraggio riuscito a ${v} m/s! Picco di decelerazione ${fmt(s.maxG, 1)} g, temperatura massima dello scudo ≈ ${fmt(Math.round(s.maxT / 10) * 10)} °C. Bentornato a casa, equipaggio di Artemis II.`);
    }
  }

  end(kind, success, status, message) {
    this.phase = 'done';
    this.outcome = kind;
    this.endTime = this.elapsed;
    if (kind === 'drogue' || kind === 'main') this.chuteFx.detached = true;
    if (kind === 'splash' || kind === 'splash-fast' || kind === 'splash-big') this.startSplash();

    updateTelemetry({ velocity: this.sim.v / 1000, altitude: Math.max(0, this.sim.h) / 1000 });
    missionState.update((s) => ({
      ...s,
      ...(success ? { phase6Complete: true } : {}),
      status,
      didacticFeedback: message,
    }));
  }

  startSplash() {
    const n = this.outcome === 'splash-fast' ? 60 : 36;
    const power = this.outcome === 'splash-fast' ? 1.6 : 1;
    this.splash = {
      t0: this.elapsed,
      drops: Array.from({ length: n }, () => {
        const a = -Math.PI / 2 + (Math.random() - 0.5) * 2.2;
        const sp = (120 + Math.random() * 220) * power;
        return { x: (Math.random() - 0.5) * 50, y: 0, vx: Math.cos(a) * sp, vy: Math.sin(a) * sp, r: 1.5 + Math.random() * 2.5 };
      }),
    };
  }

  // ---------------------------------------------------------------------------
  // Disegno
  // ---------------------------------------------------------------------------

  drawWorld(dtReal) {
    const { width: W, height: H } = this.scale;
    const s = this.sim;
    const h = Math.max(0, s.h);
    const t = this.elapsed;

    // Posizione della capsula sullo schermo: più in basso quando i paracadute sono aperti
    const targetCapY = s.chute === 'main' ? H * 0.58 : s.chute === 'drogue' ? H * 0.52 : H * 0.45;
    this.capY = lerp(this.capY, targetCapY, 1 - Math.exp(-dtReal * 1.5));
    const cx = W / 2;
    const k = 0.12; // px per metro per nuvole e superficie del mare
    const surfaceY = this.capY + 30 + h * k;

    // --- cielo a gradiente ---
    const sky = skyAt(h);
    const f = Math.sqrt(h / RE_MODEL.entryAltitude);
    const horizonY = lerp(this.capY + 22, H * 0.95, Math.min(1, f));
    this.skyG.clear();
    this.skyG.fillGradientStyle(sky.top, sky.top, sky.bot, sky.bot, 1);
    this.skyG.fillRect(0, 0, W, H);

    const starAlpha = clamp01((h - 40000) / 40000);
    this.stars.forEach((g) => g.setAlpha(starAlpha));

    // --- Terra / orizzonte (curvo in quota, piatto vicino al mare) ---
    const R = W * (1.2 + 40 * (1 - f) ** 2);
    const pts = [];
    for (let i = 0; i <= 32; i++) {
      const x = (i / 32) * W;
      const dx = x - W / 2;
      pts.push({ x, y: horizonY + R - Math.sqrt(Math.max(0, R * R - dx * dx)) });
    }
    this.horizonG.clear();
    const seaFar = lerpColor(0x1f5f99, 0x0b2f5e, clamp01(h / 40000));
    this.horizonG.fillStyle(seaFar, 1);
    this.horizonG.fillPoints([...pts, { x: W, y: H + 10 }, { x: 0, y: H + 10 }], true);
    if (h > 20000) {
      const a = clamp01((h - 20000) / 40000);
      this.horizonG.lineStyle(14, 0x6fb6ff, 0.18 * a);
      this.horizonG.strokePoints(pts);
      this.horizonG.lineStyle(4, 0xbfe0ff, 0.55 * a);
      this.horizonG.strokePoints(pts);
    } else {
      this.horizonG.lineStyle(2, 0xdcefff, 0.35);
      this.horizonG.strokePoints(pts);
    }

    // --- nuvole (si muovono verso l'alto mentre la capsula scende) ---
    this.cloudG.clear();
    for (const c of this.clouds) {
      const y = this.capY + (h - c.alt) * k;
      if (y < -60 || y > H + 60) continue;
      const x = c.x * W;
      this.cloudG.fillStyle(0xf2f6fb, 1);
      this.cloudG.fillEllipse(x, y, c.w, c.w * 0.28);
      this.cloudG.fillEllipse(x - c.w * 0.25, y - c.w * 0.08, c.w * 0.5, c.w * 0.3);
      this.cloudG.fillEllipse(x + c.w * 0.2, y - c.w * 0.1, c.w * 0.55, c.w * 0.34);
    }

    // --- capsula: lo scudo termico guarda nella direzione del moto ---
    const dirX = Math.cos(s.gam);
    const dirY = -Math.sin(s.gam);
    let rot = Math.atan2(-dirX, dirY);
    if (s.chute === 'main' || this.outcome === 'splash' || this.outcome === 'splash-big' || this.outcome === 'splash-fast') {
      rot = 0; // appesa ai paracadute: punta in alto
    }

    let capX = cx;
    let capY = this.capY;
    const plasma = s.chute === 'none' && this.outcome !== 'skip' ? clamp01((s.T - 900) / 1600) : 0;
    if (this.phase === 'running' && plasma > 0) {
      capX += (Math.random() - 0.5) * plasma * 3;
      capY += (Math.random() - 0.5) * plasma * 3;
    }

    if (this.outcome === 'skip') {
      // La capsula esce dall'atmosfera verso l'alto
      const dt = t - this.endTime;
      capX = cx + dt * 220;
      capY = this.capY - dt * 120;
      rot = Math.atan2(-1, -0.4);
    }
    if (this.splash) {
      capY = surfaceY - 22 + Math.sin(t * 2) * 3;
      rot = Math.sin(t * 1.6) * 0.06;
    }
    this.capsule.setPosition(capX, capY).setRotation(rot);
    if (this.outcome === 'overg' || this.outcome === 'heat') {
      this.capsule.setTint(Math.floor(t * 4) % 2 ? 0xff9a9a : 0xffffff);
    }

    // --- plasma attorno allo scudo e scia ---
    const shieldX = capX + Math.cos(rot + Math.PI / 2) * 26;
    const shieldY = capY + Math.sin(rot + Math.PI / 2) * 26;
    const flick = 0.9 + Math.random() * 0.2;
    this.plasmaInner.setPosition(shieldX, shieldY).setDisplaySize(90 + 70 * plasma, 90 + 70 * plasma).setAlpha(0.85 * plasma * flick);
    this.plasmaOuter.setPosition(shieldX, shieldY).setDisplaySize(160 + 120 * plasma, 160 + 120 * plasma).setAlpha(0.55 * plasma * flick);
    this.wake.forEach((img, i) => {
      const d = 30 + i * 34;
      const size = (110 - i * 14) * (0.6 + 0.4 * plasma);
      img
        .setPosition(capX - dirX * d, capY - dirY * d)
        .setDisplaySize(size * 1.5, size * 0.7)
        .setRotation(Math.atan2(dirY, dirX))
        .setAlpha(plasma * (0.5 - i * 0.08) * flick);
    });

    // --- strisce di velocità ---
    this.streakG.clear();
    const showStreaks = this.phase === 'running' && s.chute === 'none';
    if (showStreaks) {
      const spd = 200 + 900 * clamp01(s.v / 11000);
      const alpha = 0.15 + 0.35 * clamp01(s.v / 8000);
      const nx = -dirY;
      const ny = dirX;
      const span = Math.hypot(W, H);
      for (const st of this.streaks) {
        st.u -= (spd * dtReal) / span;
        if (st.u < -0.5) st.u += 1;
        const px = cx + dirX * st.u * span + nx * st.w * span * 0.5;
        const py = this.capY + dirY * st.u * span + ny * st.w * span * 0.5;
        this.streakG.lineStyle(1.5, 0xffffff, alpha);
        this.streakG.lineBetween(px, py, px - dirX * st.len, py - dirY * st.len);
      }
    }

    // --- paracadute ---
    this.drawChutes(capX, capY, rot, dtReal);

    // --- mare vicino con onde ---
    this.oceanG.clear();
    if (surfaceY < H + 40) {
      this.oceanG.fillGradientStyle(0x2a6fb0, 0x2a6fb0, 0x0b3360, 0x0b3360, 1);
      this.oceanG.fillRect(0, surfaceY, W, H - surfaceY + 40);
      for (let j = 0; j < 7; j++) {
        const y0 = surfaceY + 6 + j * (10 + j * 6);
        if (y0 > H) break;
        const amp = 2 + j * 0.8;
        const wl = 60 + j * 20;
        this.oceanG.lineStyle(2, 0xcfe8ff, 0.35 - j * 0.04);
        this.oceanG.beginPath();
        for (let x = 0; x <= W; x += 12) {
          const y = y0 + Math.sin(x / wl + t * (1.2 + j * 0.2) + j) * amp;
          if (x === 0) this.oceanG.moveTo(x, y);
          else this.oceanG.lineTo(x, y);
        }
        this.oceanG.strokePath();
      }
    }

    // --- spruzzi dell'ammaraggio ---
    this.splashG.clear();
    if (this.splash) {
      const age = t - this.splash.t0;
      if (age < 2.5) {
        for (const d of this.splash.drops) {
          const x = capX + d.x + d.vx * age;
          const y = surfaceY - 4 + d.vy * age + 300 * age * age;
          if (y > surfaceY + 4) continue;
          this.splashG.fillStyle(0xeaf6ff, Math.max(0, 0.9 - age * 0.4));
          this.splashG.fillCircle(x, y, d.r);
        }
      }
      for (let i = 0; i < 3; i++) {
        const a = ((age * 0.6 + i / 3) % 1);
        this.splashG.lineStyle(2, 0xffffff, 0.5 * (1 - a));
        this.splashG.strokeEllipse(capX, surfaceY + 2, 60 + a * 260, 10 + a * 30);
      }
    }
  }

  drawCanopy(g, x, y, r, colors, gores = 8) {
    // Cupola: mezza ellisse con spicchi alternati
    const ry = r * 0.7;
    for (let i = 0; i < gores; i++) {
      const a0 = Math.PI + (i / gores) * Math.PI;
      const a1 = Math.PI + ((i + 1) / gores) * Math.PI;
      g.fillStyle(colors[i % colors.length], 1);
      g.beginPath();
      g.moveTo(x, y + ry * 0.15);
      for (let k = 0; k <= 4; k++) {
        const a = a0 + ((a1 - a0) * k) / 4;
        g.lineTo(x + Math.cos(a) * r, y + Math.sin(a) * ry);
      }
      g.closePath();
      g.fillPath();
    }
    g.lineStyle(1.5, 0x3b2a20, 0.35);
    g.beginPath();
    for (let k = 0; k <= 24; k++) {
      const a = Math.PI + (k / 24) * Math.PI;
      const px = x + Math.cos(a) * r;
      const py = y + Math.sin(a) * ry;
      if (k === 0) g.moveTo(px, py);
      else g.lineTo(px, py);
    }
    g.strokePath();
  }

  drawChutes(capX, capY, rot, dtReal) {
    const g = this.chuteG;
    g.clear();
    const s = this.sim;
    if (s.chute === 'none') return;

    const fx = this.chuteFx;
    if (fx.detached) {
      fx.offset += dtReal * 160;
      fx.alpha = Math.max(0, fx.alpha - dtReal * 0.6);
      if (fx.alpha <= 0) return;
    }
    if (this.splash) fx.collapse = Math.min(1, fx.collapse + dtReal * 0.35);

    const apexX = capX + Math.sin(rot) * 34;
    const apexY = capY - Math.cos(rot) * 34;
    const sway = Math.sin(this.elapsed * 1.3) * 4;
    g.setAlpha(fx.alpha);

    if (s.chute === 'drogue') {
      const inf = Math.min(1, s.chuteT / RE_MODEL.drogueInflate);
      const r = 6 + 9 * inf;
      for (const side of [-1, 1]) {
        const x = apexX + side * 14 + sway;
        const y = apexY - 78 - fx.offset;
        g.lineStyle(1, 0xe4e9f2, 0.8);
        g.lineBetween(apexX, apexY, x - r, y);
        g.lineBetween(apexX, apexY, x + r, y);
        this.drawCanopy(g, x, y, r, [0xffffff, 0xff6a2b], 6);
      }
      return;
    }

    // Principali: tre cupole arancio/bianche, grandezza proporzionale a √A
    const inf = Math.min(1, s.chuteT / RE_MODEL.mainInflate) * (1 - 0.7 * fx.collapse);
    const scale = Math.min(1.6, Math.max(0.35, Math.sqrt(this.mainArea / IDEAL_MAIN_AREA)));
    const R = 46 * scale;
    const r = R * (0.25 + 0.75 * inf);
    const L = 150 * (0.6 + 0.4 * scale);
    const drop = this.splash ? fx.collapse * (L * 0.9) : 0;
    const canopies = [
      { dx: -1.25 * R, dy: 0.18 * R },
      { dx: 0, dy: 0 },
      { dx: 1.25 * R, dy: 0.18 * R },
    ];
    for (const c of canopies) {
      const x = apexX + c.dx * (0.4 + 0.6 * inf) + sway;
      const y = apexY - L + c.dy + drop - fx.offset;
      g.lineStyle(1, 0xe4e9f2, 0.7);
      g.lineBetween(apexX, apexY, x - r, y);
      g.lineBetween(apexX, apexY, x - r * 0.35, y);
      g.lineBetween(apexX, apexY, x + r * 0.35, y);
      g.lineBetween(apexX, apexY, x + r, y);
      this.drawCanopy(g, x, y, r, [0xff6a2b, 0xffffff], 10);
    }
  }
}
