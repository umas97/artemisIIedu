import * as Phaser from 'phaser';
import { missionState } from '../../stores/missionStore.js';

export class TLIScene extends Phaser.Scene {
  constructor() {
    super('TLIScene');
  }

  create() {
    this.isIgnited = false;
    this.isCaptured = false;
    this.orbitData = null;
    this.children.removeAll();
    this.trajectory = this.add.graphics();

    const { width, height } = this.scale;
    this.centerY = height / 2;

    // COSTANTI FISICHE
    this.c = { RE: 6371000, GM: 3.986e14, distMoon: 384400000, RM: 1737000 };

    // SCALA DINAMICA: La distanza Terra-Luna deve occupare l'80% dello schermo
    const targetDistancePx = width * 0.8;
    this.renderScale = targetDistancePx / this.c.distMoon;

    // CENTRATURA: Il punto medio tra Terra e Luna deve essere width/2
    // TerraX + distMoonPx = LunaX
    // (TerraX + LunaX) / 2 = width/2  => TerraX = (width - distMoonPx) / 2
    this.centerX = (width - targetDistancePx) / 2;
    this.moonXPx = this.centerX + targetDistancePx;

    // Stelle di sfondo (più dense per l'effetto full screen)
    for (let i = 0; i < 600; i++) {
      this.add.circle(Phaser.Math.Between(0, width), Phaser.Math.Between(0, height), 0.7, 0xffffff, Phaser.Math.Between(0.1, 0.4));
    }

    // Orbita di Parcheggio (fainter)
    const r_p = this.c.RE + 192000;
    const parkingGraphics = this.add.graphics();
    parkingGraphics.lineStyle(1, 0x1a73e8, 0.2);
    parkingGraphics.strokeCircle(this.centerX, this.centerY, r_p * this.renderScale);

    // Terra
    this.add.circle(this.centerX, this.centerY, this.c.RE * this.renderScale, 0x1a73e8);
    this.add.text(this.centerX, this.centerY + (this.c.RE * this.renderScale) + 15, 'TERRA', { fontSize: '10px', fontStyle: 'bold', color: '#4488ff' }).setOrigin(0.5);
    
    // Luna
    this.add.circle(this.moonXPx, this.centerY, this.c.RM * this.renderScale, 0xcccccc);
    this.add.text(this.moonXPx, this.centerY + (this.c.RM * this.renderScale) + 15, 'LUNA', { fontSize: '10px', fontStyle: 'bold', color: '#aaaaaa' }).setOrigin(0.5);

    // Orion - Partenza dal lato sinistro della Terra
    const startXPx = this.centerX - (r_p * this.renderScale);
    this.orion = this.add.circle(startXPx, this.centerY, 6, 0xff3e00).setStrokeStyle(2, 0xffffff);

    const unsubscribe = missionState.subscribe(state => {
      if (state.currentPhase === 3 && state.studentCalculations.isValid && !state.isAnalyzing && !this.isIgnited) {
        this.setupPhysics(state.studentCalculations.tliDeltaV);
      }
    });
    this.events.once('shutdown', unsubscribe);

    // Ripristina e abilita lo zoom con rotella del mouse
    this.input.on('wheel', (pointer, gameObjects, deltaX, deltaY, deltaZ) => {
      const zoomModifier = 1 - Math.sign(deltaY) * 0.1;
      const newZoom = Phaser.Math.Clamp(this.cameras.main.zoom * zoomModifier, 0.1, 5);
      this.cameras.main.zoomTo(newZoom, 100);
    });

    // Abilita il panning trascinando con il mouse
    this.input.on('pointermove', (pointer) => {
      if (!pointer.isDown) return;
      this.cameras.main.scrollX -= (pointer.x - pointer.prevPosition.x) / this.cameras.main.zoom;
      this.cameras.main.scrollY -= (pointer.y - pointer.prevPosition.y) / this.cameras.main.zoom;
    });
  }

  setupPhysics(deltaV) {
    this.isIgnited = true;
    this.isCaptured = false;
    const r_p = this.c.RE + 192000;
    const v_circ = Math.sqrt(this.c.GM / r_p);
    const v_new = v_circ + deltaV;
    
    const invA = (2 / r_p) - (Math.pow(v_new, 2) / this.c.GM);
    const a = 1 / invA;
    const e = Math.abs(1 - (r_p / a));

    this.orbitData = { a, e, v_new, isHyperbolic: (a < 0 || e >= 1) };
    this.theta = Math.PI; 
    this.trajectory.clear();

    missionState.update(s => ({ ...s, didacticFeedback: "Iniezione Trans-Lunare avviata. Orion sta percorrendo l'ellisse di trasferimento..." }));
  }

  update(time, delta) {
    if (!this.isIgnited || !this.orbitData) return;

    if (this.isCaptured) {
      const lunarOrbitSpeed = 0.015;
      this.lunarTheta += lunarOrbitSpeed;
      const orbitRadius = (this.c.RM + 2000000) * this.renderScale;
      this.orion.x = this.moonXPx + Math.cos(this.lunarTheta) * orbitRadius;
      this.orion.y = this.centerY + Math.sin(this.lunarTheta) * orbitRadius;
      return;
    }

    // Velocità adattata alla nuova scala per fluidità
    const timeScale = 20000; 
    const dt = (delta / 1000) * timeScale;

    const { a, e, isHyperbolic } = this.orbitData;
    let r;
    if (isHyperbolic) {
      const semiLatusRectum = Math.abs(a) * (e * e - 1);
      r = semiLatusRectum / (1 + e * Math.cos(this.theta + Math.PI));
    } else {
      r = a * (1 - e * e) / (1 + e * Math.cos(this.theta + Math.PI));
    }

    const h = Math.sqrt(this.c.GM * Math.abs(a > 0 ? a*(1-e*e) : Math.abs(a)*(e*e-1)));
    const dTheta = (h / (r * r)) * dt;
    this.theta += dTheta;

    const px = this.centerX + (r * Math.cos(this.theta) * this.renderScale);
    const py = this.centerY + (r * Math.sin(this.theta) * this.renderScale);

    this.trajectory.lineStyle(2, 0xff3e00, 0.2);
    this.trajectory.beginPath();
    this.trajectory.moveTo(this.orion.x, this.orion.y);
    this.trajectory.lineTo(px, py);
    this.trajectory.strokePath();

    this.orion.setPosition(px, py);

    missionState.update(s => ({
      ...s,
      telemetry: { 
        ...s.telemetry, 
        altitude: (r - this.c.RE) / 1000,
        velocity: Math.sqrt(this.c.GM * Math.abs(2/r - (a > 0 ? 1/a : -1/Math.abs(a)))) / 1000 
      }
    }));

    const distToMoon = Phaser.Math.Distance.Between(px, py, this.moonXPx, this.centerY) / this.renderScale;
    
    // Successo: Cattura Lunare
    if (distToMoon < 15000000 && !this.isCaptured) {
       this.isCaptured = true;
       this.lunarTheta = Math.PI;
       missionState.update(s => ({ 
         ...s, 
         status: "CATTURA LUNARE", 
         phase3Complete: true,
         didacticFeedback: "Orbita agganciata! Orion ha raggiunto l'obiettivo ed è entrata in orbita lunare. Ottimo lavoro, Comandante."
       }));
       return;
    }

    // Fallimento 1: Troppo Basso (Ricade sulla Terra) o Mancato Aggancio per un soffio
    if (!isHyperbolic && this.theta >= Math.PI * 2 && !this.isCaptured) {
       this.isCaptured = true; 
       
       const r_a = Math.abs(a * (1 + e));
       if (r_a < this.c.distMoon - 15000000) {
         missionState.update(s => ({
           ...s,
           status: "MANCATA CATTURA",
           didacticFeedback: "Spinta insufficiente. L'apogeo dell'orbita non ha raggiunto la Luna e Orion sta ricadendo verso la Terra. Ricalcola fornendo maggiore energia."
         }));
       } else {
         missionState.update(s => ({
           ...s,
           status: "MANCATA CATTURA",
           didacticFeedback: "Mancata cattura. La traiettoria aveva energia sufficiente ma l'angolazione non ha permesso l'inserimento orbitale. Controlla accuratamente il Delta-v."
         }));
       }
       return;
    }

    // Fallimento 2: Troppa Energia (Supera la Luna e si perde)
    if (r > this.c.distMoon + 20000000 && !this.isCaptured) {
       this.isCaptured = true;
       missionState.update(s => ({
         ...s,
         status: "MANCATA CATTURA",
         didacticFeedback: "Spinta eccessiva. Orion ha superato l'orbita lunare con troppa velocità e si sta disperdendo nello spazio profondo. Ricalcola riducendo l'energia fornita."
       }));
       return;
    }
  }
}
