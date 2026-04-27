import * as Phaser from 'phaser';
import { missionState } from '../../stores/missionStore.js';

export class LOIScene extends Phaser.Scene {
  constructor() {
    super('LOIScene');
  }

  create() {
    this.isIgnited = false;
    this.orbitData = null;
    this.isComplete = false;
    this.children.removeAll();
    this.trajectory = this.add.graphics();

    const { width, height } = this.scale;
    this.centerX = width / 2;
    this.centerY = height / 2;

    // COSTANTI FISICHE (Luna)
    this.c = { RM: 1737000, GM: 4.9048e12 };
    
    // Altitudine target: 100km
    this.h_target = 100000;
    this.r_target = this.c.RM + this.h_target;

    // SCALA DINAMICA: La Luna deve essere al centro e grande
    // Impostiamo che il raggio della luna occupi circa il 15% dell'altezza dello schermo
    this.renderScale = (height * 0.15) / this.c.RM;

    // Stelle di sfondo
    for (let i = 0; i < 400; i++) {
      this.add.circle(Phaser.Math.Between(0, width), Phaser.Math.Between(0, height), 0.7, 0xffffff, Phaser.Math.Between(0.1, 0.5));
    }

    // Luna
    this.add.circle(this.centerX, this.centerY, this.c.RM * this.renderScale, 0xcccccc);
    this.add.text(this.centerX, this.centerY + (this.c.RM * this.renderScale) + 20, 'LUNA', { fontSize: '14px', fontStyle: 'bold', color: '#aaaaaa' }).setOrigin(0.5);

    // Orbita di Parcheggio Target (fainter)
    const parkingGraphics = this.add.graphics();
    parkingGraphics.lineStyle(2, 0x1a73e8, 0.4);
    parkingGraphics.strokeCircle(this.centerX, this.centerY, this.r_target * this.renderScale);

    // Orion - Partenza
    // Orion arriva dall'alto a destra (iperbole)
    // Ma per semplicità, la facciamo partire dal perilunio e simulare il burn istantaneo.
    // Altrimenti, per un effetto migliore, facciamo l'animazione di avvicinamento e poi il burn al perilunio.
    this.startTheta = -Math.PI / 4; 
    
    // Per semplicità della simulazione e far vedere subito l'effetto, facciamo che il burn avviene al perilunio (asse X, a destra)
    this.perilunioXPx = this.centerX + (this.r_target * this.renderScale);
    
    // Orion viene posizionato al perilunio
    this.orion = this.add.circle(this.perilunioXPx, this.centerY, 6, 0xff3e00).setStrokeStyle(2, 0xffffff);
    this.theta = 0; // Angolo iniziale (0 = asse x positivo)

    // Velocità di arrivo iperbolica (dal pannello calcoli) = 2515 m/s
    this.v_arrival = 2515;

    const unsubscribe = missionState.subscribe(state => {
      if (state.currentPhase === 4 && state.studentCalculations.isValid && !state.isAnalyzing && !this.isIgnited) {
        this.setupPhysics(state.studentCalculations.loiDeltaV);
      }
    });
    this.events.once('shutdown', unsubscribe);

    // Zoom con rotella del mouse
    this.input.on('wheel', (pointer, gameObjects, deltaX, deltaY, deltaZ) => {
      const zoomModifier = 1 - Math.sign(deltaY) * 0.1;
      const newZoom = Phaser.Math.Clamp(this.cameras.main.zoom * zoomModifier, 0.2, 5);
      this.cameras.main.zoomTo(newZoom, 100);
    });

    // Panning
    this.input.on('pointermove', (pointer) => {
      if (!pointer.isDown) return;
      this.cameras.main.scrollX -= (pointer.x - pointer.prevPosition.x) / this.cameras.main.zoom;
      this.cameras.main.scrollY -= (pointer.y - pointer.prevPosition.y) / this.cameras.main.zoom;
    });
  }

  setupPhysics(deltaV) {
    this.isIgnited = true;
    this.isComplete = false;
    this.theta = 0;
    this.trajectory.clear();

    // Il deltaV in ingresso è positivo, ma è una decelerazione.
    // v_new = v_arrival - deltaV
    const v_new = this.v_arrival - deltaV;
    
    // r al perilunio è r_target
    const r_p = this.r_target;

    // Vis-viva: v^2 = GM * (2/r - 1/a) => 1/a = 2/r - v^2/GM
    const invA = (2 / r_p) - (Math.pow(v_new, 2) / this.c.GM);
    
    let a, e, isHyperbolic;
    if (invA <= 0) {
      isHyperbolic = true;
      a = (invA === 0) ? -Infinity : 1 / invA;
      // Per un'iperbole: r_p = a * (1 - e) non vale, r_p = a * (e - 1) dove a > 0 in alcune convenzioni.
      // Usiamo la convenzione standard: e = 1 - r_p/a
      e = Math.abs(1 - (r_p / a));
    } else {
      isHyperbolic = false;
      a = 1 / invA;
      e = Math.abs(1 - (r_p / a));
    }

    this.orbitData = { a, e, v_new, isHyperbolic };

    missionState.update(s => ({ 
      ...s, 
      didacticFeedback: "Accensione retrograda in corso. Monitoraggio parametri orbitali lunari..." 
    }));
  }

  update(time, delta) {
    if (!this.isIgnited || !this.orbitData || this.isComplete) return;

    // Time scale per la simulazione attorno alla luna
    const timeScale = 1000; 
    const dt = (delta / 1000) * timeScale;

    const { a, e, isHyperbolic } = this.orbitData;
    let r;
    
    if (isHyperbolic) {
      // Iperbole
      const semiLatusRectum = Math.abs(a) * (e * e - 1);
      r = semiLatusRectum / (1 + e * Math.cos(this.theta));
    } else {
      // Ellisse o circonferenza
      r = a * (1 - e * e) / (1 + e * Math.cos(this.theta));
    }

    const h_momentum = Math.sqrt(this.c.GM * Math.abs(a > 0 ? a*(1-e*e) : Math.abs(a)*(e*e-1)));
    const dTheta = (h_momentum / (r * r)) * dt;
    this.theta += dTheta; // Aumentiamo l'angolo per muoverci lungo l'orbita

    const px = this.centerX + (r * Math.cos(this.theta) * this.renderScale);
    const py = this.centerY + (r * Math.sin(this.theta) * this.renderScale);

    this.trajectory.lineStyle(2, 0xff3e00, 0.4);
    this.trajectory.beginPath();
    this.trajectory.moveTo(this.orion.x, this.orion.y);
    this.trajectory.lineTo(px, py);
    this.trajectory.strokePath();

    this.orion.setPosition(px, py);

    // Aggiorna telemetria
    const currentAltitude = (r - this.c.RM) / 1000;
    let currentVelocity = 0;
    if (a !== 0 && !isNaN(a)) {
      currentVelocity = Math.sqrt(this.c.GM * Math.abs(2/r - (a > 0 ? 1/a : -1/Math.abs(a)))) / 1000;
    }

    missionState.update(s => ({
      ...s,
      telemetry: { 
        ...s.telemetry, 
        altitude: currentAltitude,
        velocity: currentVelocity 
      }
    }));

    // CRASH (Altitudine < 0)
    if (r <= this.c.RM && !this.isComplete) {
      this.isComplete = true;
      // Esplosione visiva
      this.add.circle(px, py, 20, 0xff0000, 0.8);
      missionState.update(s => ({
        ...s,
        status: "IMPATTO LUNARE",
        didacticFeedback: "Hai frenato troppo! L'orbita è diventata così ellittica che il suo perigeo si trova all'interno della Luna. Orion si è schiantata sulla superficie."
      }));
      return;
    }

    // FUGA (Iperbole o ellisse troppo grande)
    // Se ha superato una certa distanza (es. 20000 km) senza richiudersi
    if (r > this.c.RM + 20000000 && !this.isComplete) {
      this.isComplete = true;
      missionState.update(s => ({
        ...s,
        status: "FUGA LUNARE",
        didacticFeedback: "Frenata insufficiente! La velocità è rimasta troppo alta e Orion ha superato la velocità di fuga lunare. Si è persa nello spazio profondo."
      }));
      return;
    }

    // SUCCESSO (ha completato un giro intero (2 PI) senza schiantarsi né fuggire)
    if (!isHyperbolic && this.theta >= Math.PI * 1.9 && !this.isComplete) {
      this.isComplete = true;
      
      // Controllo sull'eccentricità per il successo "perfetto"
      if (e < 0.1) {
        missionState.update(s => ({ 
          ...s, 
          status: "ORBITA LUNARE STABILE", 
          phase4Complete: true,
          didacticFeedback: "Perfetto! Hai rallentato esattamente quanto basta per farti catturare dalla gravità lunare. Orion è in un'orbita di parcheggio stabile."
        }));
      } else {
        // Se e >= 0.1 ma non ha toccato la superficie
        missionState.update(s => ({ 
          ...s, 
          status: "ORBITA ELLITTICA", 
          phase4Complete: true, // Lo consideriamo completato ma avvisiamo
          didacticFeedback: "Orion è stata catturata, ma l'orbita è molto ellittica. La frenata non è stata perfetta, tuttavia la missione può proseguire."
        }));
      }
      return;
    }
  }
}
