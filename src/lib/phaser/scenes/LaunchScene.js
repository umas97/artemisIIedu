import * as Phaser from 'phaser';
import { missionState } from '../../stores/missionStore.js';

export class LaunchScene extends Phaser.Scene {
  constructor() {
    super('LaunchScene');
    this.rocketContainer = null;
    this.smoke = null;
    this.isLaunching = false;
    this.altitude = 0; 
    this.velocity = 0; 
    this.fuel = 100;
    this.elapsedTime = 0; 
    this.totalDuration = 35000; 
    this.targetAltitude = 192; // km
    this.targetVelocity = 7.8; // km/s
  }

  create() {
    const { width, height } = this.scale;
    const centerX = width / 2;

    missionState.subscribe(s => {
      this.targetAltitude = s.constants.hp / 1000;
    })();

    // Cielo dinamico (Riferimento per resize)
    const skyHeight = 25000;
    this.sky = this.add.graphics();
    this.drawSky(width, height, skyHeight);

    // Stelle (disegnate in un'area molto vasta per coprire il resize)
    for (let i = 0; i < 500; i++) {
      const x = Phaser.Math.Between(-2000, 4000);
      const y = Phaser.Math.Between(-skyHeight, height);
      this.add.circle(x, y, Phaser.Math.FloatBetween(0.4, 1.2), 0xffffff, Phaser.Math.FloatBetween(0.2, 0.8));
    }

    this.ground = this.add.rectangle(centerX, height - 20, width, 40, 0x222222);
    this.pad = this.add.rectangle(centerX, height - 40, 240, 12, 0x444444);

    const smokeGfx = this.add.graphics({ x: 0, y: 0 }).setVisible(false);
    smokeGfx.fillStyle(0xffffff, 1);
    smokeGfx.fillCircle(5, 5, 5);
    smokeGfx.generateTexture('smoke', 10, 10);

    this.rocketContainer = this.add.container(centerX, height - 100);
    const rocketGfx = this.add.graphics();
    rocketGfx.fillStyle(0xffffff, 1);
    rocketGfx.fillRect(-10, -50, 20, 100);
    rocketGfx.fillTriangle(-10, -50, 10, -50, 0, -80);
    rocketGfx.fillStyle(0xdddddd, 1);
    rocketGfx.fillRect(-22, 10, 12, 70);
    rocketGfx.fillRect(10, 10, 12, 70);
    rocketGfx.fillTriangle(-22, 10, -10, 10, -16, 0);
    rocketGfx.fillTriangle(10, 10, 22, 10, 16, 0);
    this.rocketContainer.add(rocketGfx);

    this.smoke = this.add.particles(0, 50, 'smoke', {
      speed: { min: 120, max: 400 },
      scale: { start: 2, end: 8 },
      alpha: { start: 0.8, end: 0 },
      lifespan: 3000,
      frequency: -1, 
      gravityY: 500,
      blendMode: 'ADD'
    });
    this.rocketContainer.add(this.smoke);

    const unsubscribe = missionState.subscribe(state => {
      if (state.currentPhase === 2 && state.studentCalculations.isValid && !state.isAnalyzing && !this.isLaunching) {
        this.startCountdown();
      }
    });
    this.events.once('shutdown', unsubscribe);

    this.statusText = this.add.text(centerX, height / 2, '', {
      fontSize: '48px', color: '#ffffff', fontStyle: 'bold', fontFamily: 'monospace'
    }).setOrigin(0.5).setAlpha(0);

    this.cameras.main.setBounds(-1000, -skyHeight + height, width + 2000, skyHeight);
    
    // Telecamera pre-allineata per evitare lo scatto al decollo
    this.cameras.main.startFollow(this.rocketContainer, false, 1, 1, 0, 200);

    // RESIZE LOGIC DEFINITIVA
    this.scale.on('resize', (gameSize) => {
      const { width: nw, height: nh } = gameSize;
      this.cameras.main.setViewport(0, 0, nw, nh);
      this.cameras.main.setSize(nw, nh);
      
      this.sky.clear();
      this.drawSky(nw, nh, skyHeight);
      
      this.ground.setPosition(nw / 2, nh - 20);
      this.ground.width = nw;
      this.pad.setPosition(nw / 2, nh - 40);
      
      if (!this.isLaunching) {
        this.rocketContainer.setPosition(nw / 2, nh - 100);
        this.statusText.setPosition(nw / 2, nh / 2);
      }
      this.cameras.main.setBounds(-1000, -skyHeight + nh, nw + 2000, skyHeight);
    });
  }

  drawSky(width, height, skyHeight) {
    this.sky.fillGradientStyle(0x000000, 0x000000, 0x001133, 0x001133, 1);
    this.sky.fillRect(-1000, -skyHeight + height, width + 2000, skyHeight);
  }

  startCountdown() {
    this.isLaunching = true;
    this.countdown = 10;
    this.statusText.setAlpha(1);
    
    this.time.addEvent({
      delay: 1000,
      callback: () => {
        if (this.countdown > 0) {
          this.statusText.setText(`T-MINUS ${this.countdown}`);
          missionState.update(s => ({ ...s, status: `T-Minus ${this.countdown}` }));
          this.countdown--;
        } else {
          this.statusText.setText('LIFTOFF!');
          this.statusText.setColor('#ff3e00');
          this.launch();
        }
      },
      repeat: 10
    });
  }

  launch() {
    this.smoke.start();
    missionState.update(s => ({ ...s, status: "DECOLLO AVVENUTO" }));
    
    // Rendiamo il follow fluido solo DOPO il decollo
    this.cameras.main.setLerp(0, 0.05);
    
    this.elapsedTime = 0;
    this.isLaunchingActual = true; // Nuovo flag per controllo update
  }

  update(time, delta) {
    if (!this.isLaunchingActual) return;
    if (this.elapsedTime >= this.totalDuration) return;

    // Cap del delta per evitare salti fisici se il browser rallenta (es. durante resize)
    const cappedDelta = Math.min(delta, 100);
    this.elapsedTime = Math.min(this.elapsedTime + cappedDelta, this.totalDuration);
    
    const progress = this.elapsedTime / this.totalDuration;
    const t = this.elapsedTime / 1000; 
    const T = this.totalDuration / 1000; 

    // Modello fisico calibrato
    const a0 = 2; 
    const aFinal = 45; 
    const k = (aFinal - a0) / T;
    
    // Integrazione fisica
    const currentVelocity = a0 * t + 0.5 * k * Math.pow(t, 2); 
    const currentAltitude = 0.5 * a0 * Math.pow(t, 2) + (1/6) * k * Math.pow(t, 3);
    
    // Valori massimi teorici per normalizzazione
    const maxPhysVelocity = a0 * T + 0.5 * k * Math.pow(T, 2);
    const maxPhysAltitude = 0.5 * a0 * Math.pow(T, 2) + (1/6) * k * Math.pow(T, 3);

    // Telemetria normalizzata sui target Artemis II
    this.velocity = (currentVelocity / maxPhysVelocity) * this.targetVelocity;
    this.altitude = (currentAltitude / maxPhysAltitude) * this.targetAltitude;
    this.fuel = 100 - (progress * 42.5); 

    // Visualizzazione razzo (sale fino a 1500px sopra il punto di partenza)
    this.rocketContainer.y = (this.scale.height - 100) - (progress * 2500);

    missionState.update(s => ({
      ...s,
      telemetry: {
        ...s.telemetry,
        altitude: this.altitude,
        velocity: this.velocity,
        fuelRemaining: Math.max(0, this.fuel)
      }
    }));

    if (t > 2) {
      this.statusText.setAlpha(Math.max(0, 1 - (t - 2) / 3));
    }

    if (this.elapsedTime >= this.totalDuration) {
      missionState.update(s => ({ ...s, status: "Iniezione Orbitale Completata", phase2Complete: true }));
    }
  }
}
