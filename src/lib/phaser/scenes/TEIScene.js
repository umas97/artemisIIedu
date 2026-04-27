import * as Phaser from 'phaser';
import { missionState } from '../../stores/missionStore.js';

export class TEIScene extends Phaser.Scene {
  constructor() {
    super('TEIScene');
  }

  create() {
    this.isIgnited = false;
    this.isComplete = false;
    this.orbitData = null;
    this.children.removeAll();
    this.trajectory = this.add.graphics();

    const { width, height } = this.scale;
    this.centerY = height / 2;

    // COSTANTI FISICHE
    this.c = { RM: 1737000, GM: 4.9048e12, RE: 6371000, distMoon: 384400000 };
    
    // Altitudine di parcheggio (100km)
    this.h_target = 100000;
    this.r_target = this.c.RM + this.h_target;

    // SCALA DINAMICA: 80% dello schermo (come nella Fase 3)
    const targetDistancePx = width * 0.8;
    this.renderScale = targetDistancePx / this.c.distMoon;

    // CENTRATURA: La Terra a sinistra, la Luna a destra
    const earthX = (width - targetDistancePx) / 2;
    this.centerX = earthX + targetDistancePx; // La Luna (centro dell'orbita iniziale)

    // Stelle di sfondo
    for (let i = 0; i < 800; i++) {
      this.add.circle(Phaser.Math.Between(earthX - 2000, this.centerX + 1000), Phaser.Math.Between(-1000, height + 1000), 1, 0xffffff, Phaser.Math.Between(0.1, 0.8));
    }

    // Indicatore velocità di simulazione
    this.timeScale = 50000; 
    this.add.text(width - 20, height - 20, `TIME WARP: ${this.timeScale}x`, { 
      fontSize: '16px', fontStyle: 'bold', color: '#ffcc00', 
      backgroundColor: '#00000088', padding: { x: 8, y: 4 }
    }).setOrigin(1, 1).setScrollFactor(0).setDepth(200);

    // Terra
    this.earthX = earthX;
    this.add.circle(earthX, this.centerY, this.c.RE * this.renderScale, 0x1a73e8);
    this.add.text(earthX, this.centerY + (this.c.RE * this.renderScale) + 15, 'TERRA', { fontSize: '10px', fontStyle: 'bold', color: '#4488ff' }).setOrigin(0.5);

    // Luna
    this.add.circle(this.centerX, this.centerY, this.c.RM * this.renderScale, 0xcccccc);
    this.add.text(this.centerX, this.centerY + (this.c.RM * this.renderScale) + 15, 'LUNA', { fontSize: '10px', fontStyle: 'bold', color: '#aaaaaa' }).setOrigin(0.5);

    // Orbita di Parcheggio
    const parkingGraphics = this.add.graphics();
    parkingGraphics.lineStyle(1, 0x1a73e8, 0.2);
    parkingGraphics.strokeCircle(this.centerX, this.centerY, this.r_target * this.renderScale);

    // Posizione iniziale: verrà aggiornata al burn point
    this.perilunioXPx = this.centerX + (this.r_target * this.renderScale);
    
    // Orion
    this.orion = this.add.circle(this.perilunioXPx, this.centerY, 3, 0xff3e00).setStrokeStyle(1, 0xffffff);
    
    this.theta = 0;

    const unsubscribe = missionState.subscribe(state => {
      if (state.currentPhase === 5 && state.studentCalculations.isValid && !state.isAnalyzing && !this.isIgnited) {
        this.setupPhysics(state.studentCalculations.teiDeltaV);
      }
    });
    this.events.once('shutdown', unsubscribe);

    // Zoom e Pan
    this.input.on('wheel', (pointer, gameObjects, deltaX, deltaY, deltaZ) => {
      const zoomModifier = 1 - Math.sign(deltaY) * 0.1;
      const newZoom = Phaser.Math.Clamp(this.cameras.main.zoom * zoomModifier, 0.1, 5);
      this.cameras.main.zoomTo(newZoom, 100);
    });

    this.input.on('pointermove', (pointer) => {
      if (!pointer.isDown) return;
      this.cameras.main.scrollX -= (pointer.x - pointer.prevPosition.x) / this.cameras.main.zoom;
      this.cameras.main.scrollY -= (pointer.y - pointer.prevPosition.y) / this.cameras.main.zoom;
    });
  }

  setupPhysics(deltaV) {
    this.isIgnited = true;
    const v_circ = Math.sqrt(this.c.GM / this.r_target);
    const v_new = v_circ + deltaV; 
    
    // Vis-Viva
    const invA = (2 / this.r_target) - (Math.pow(v_new, 2) / this.c.GM);
    const a = 1 / invA;
    let e;

    if (a < 0) {
      // Iperbole
      e = 1 - (this.r_target / a);
    } else {
      // Ellisse
      e = Math.abs(1 - (this.r_target / a));
    }

    this.orbitData = { a, e, v_new, isHyperbolic: (a < 0 || e >= 1) };
    
    // Calcolo dell'angolo del perilunio (omega) per colpire esattamente la Terra.
    // L'equazione polare è r(nu) = p / (1 + e*cos(nu)).
    // Vogliamo che r(nu) = distMoon quando l'angolo assoluto è Math.PI (cioè verso la Terra).
    // Angolo assoluto = nu + omega. Quindi vogliamo nu + omega = Math.PI, da cui omega = Math.PI - nu.
    // Calcoliamo nu per cui r(nu) = distMoon:
    const p = this.orbitData.isHyperbolic ? Math.abs(a) * (e * e - 1) : a * (1 - e * e);
    
    // Tolleranza didattica: se l'ellisse/iperbole non arriva alla Terra (DeltaV troppo basso), 
    // puntiamo comunque l'apoapside verso la Terra (omega = 0) per simulare il tentativo.
    const cosNu = (p / this.c.distMoon - 1) / e;
    
    if (cosNu >= -1 && cosNu <= 1) {
       const nu_hit = Math.acos(cosNu);
       this.omega = Math.PI - nu_hit;
    } else {
       this.omega = 0;
    }

    this.theta = 0; // Anomalia vera (nu)
    this.trajectory.clear();

    // Sposta Orion istantaneamente al punto di accensione corretto (TEI Burn Point)
    const startX = this.centerX + (this.r_target * Math.cos(this.omega) * this.renderScale);
    const startY = this.centerY + (this.r_target * Math.sin(this.omega) * this.renderScale);
    this.orion.setPosition(startX, startY);

    missionState.update(s => ({ ...s, didacticFeedback: "Motori accesi (TEI Burn). Incremento di velocità in corso..." }));
  }

  update(time, delta) {
    if (!this.isIgnited || !this.orbitData || this.isComplete) return;

    const dt = (delta / 1000) * this.timeScale;

    const { a, e, isHyperbolic, v_new } = this.orbitData;
    let r;
    
    const p = isHyperbolic ? Math.abs(a) * (e * e - 1) : a * (1 - e * e);
    const denominator = 1 + e * Math.cos(this.theta);
    
    // Abbassiamo la soglia per l'asintoto, altrimenti si fermava a metà strada
    if (denominator <= 0.001) {
      // Raggiunto l'asintoto
      this.evaluateEscape(v_new);
      return;
    }
    
    r = p / denominator;

    const h_ang = Math.sqrt(this.c.GM * p);
    const dTheta = (h_ang / (r * r)) * dt;
    
    // Anomalia vera
    this.theta += dTheta;

    // Angolo assoluto nel canvas = anomalia vera + angolo del perilunio
    // Utilizziamo +(this.theta + this.omega) per far curvare la traiettoria verso il basso (y crescente)
    // in modo che passi "sotto" l'asse Terra-Luna, coerentemente con la rappresentazione orbitale.
    const canvasAngle = this.theta + this.omega;

    const px = this.centerX + (r * Math.cos(canvasAngle) * this.renderScale);
    const py = this.centerY + (r * Math.sin(canvasAngle) * this.renderScale);

    this.trajectory.lineStyle(2, 0xff3e00, 0.2);
    this.trajectory.beginPath();
    this.trajectory.moveTo(this.orion.x, this.orion.y);
    this.trajectory.lineTo(px, py);
    this.trajectory.strokePath();

    this.orion.setPosition(px, py);

    // Calcolo distanza reale dalla Terra per la telemetria
    const dx = (this.orion.x - this.earthX) / this.renderScale;
    const dy = (this.orion.y - this.centerY) / this.renderScale;
    const distToEarth = Math.sqrt(dx * dx + dy * dy);

    missionState.update(s => ({
      ...s,
      telemetry: { 
        ...s.telemetry, 
        altitude: distToEarth / 1000, 
        velocity: Math.sqrt(this.c.GM * Math.abs(2/r - (a > 0 ? 1/a : -1/Math.abs(a)))) / 1000 
      }
    }));

    // Gestione esiti
    if (distToEarth <= this.c.RE + 120000) {
       this.evaluateEscape(v_new); // Intercettata l'atmosfera
       return;
    }
    
    if (!isHyperbolic) {
      if (this.theta >= Math.PI * 1.5) { // Quasi un'orbita completa attorno alla Luna
        this.isComplete = true;
        missionState.update(s => ({
          ...s,
          status: "MANCATA FUGA",
          didacticFeedback: "Energia insufficiente. La velocità non ha raggiunto quella di fuga. Orion è ricaduta in un'orbita ellittica attorno alla Luna. Ricalcola fornendo un Delta-v maggiore."
        }));
      }
    } else {
      // Se si allontana troppo senza colpire la Terra (mira errata)
      if (r > this.c.distMoon + 20000000) {
        this.evaluateEscape(v_new);
      }
    }
  }

  evaluateEscape(v_new) {
    this.isComplete = true;
    
    // Calcola v_esc necessaria teorica
    const v_esc = Math.sqrt(2 * this.c.GM / this.r_target);
    
    if (v_new < v_esc - 5) {
       missionState.update(s => ({
         ...s,
         status: "MANCATA FUGA",
         didacticFeedback: "Energia insufficiente. La velocità non ha raggiunto quella di fuga. Ricalcola fornendo un Delta-v maggiore."
       }));
    } else if (v_new > v_esc + 150) {
       missionState.update(s => ({
         ...s,
         status: "ALLARME CARBURANTE",
         didacticFeedback: "Siamo sfuggiti alla Luna, ma con troppa energia. Abbiamo sprecato carburante vitale che ci servirà per le manovre correttive di rientro sulla Terra. Ricalcola la spinta riducendo l'eccesso di velocità."
       }));
    } else {
       missionState.update(s => ({ 
         ...s, 
         status: "ROTTA VERSO LA TERRA", 
         phase5Complete: true,
         didacticFeedback: "Trans-Earth Injection completata con successo! Abbiamo abbandonato la gravità lunare e intercettato l'atmosfera terrestre. Prepararsi per il rientro."
       }));
    }
  }
}
