import * as Phaser from 'phaser';
import { missionState } from '../../stores/missionStore.js';

export class EarthOrbitScene extends Phaser.Scene {
  constructor() {
    super('EarthOrbitScene');
    this.earth = null;
    this.orion = null;
    this.orbitPath = null;
    this.isValid = false;
  }

  create() {
    missionState.subscribe(state => {
      this.isValid = state.studentCalculations.isValid;
    });

    this.setupLayout();

    this.scale.on('resize', () => {
      this.setupLayout();
    });
  }

  setupLayout() {
    const { width, height } = this.scale;
    
    // Pulisci tutto per ripartire da zero in modo pulito
    if (this.orbitPath) this.orbitPath.clear();
    if (this.earth) this.earth.destroy();
    if (this.earthGlow) this.earthGlow.destroy();
    if (this.earthLabel) this.earthLabel.destroy();
    if (this.orion) this.orion.destroy();
    if (this.statusText) this.statusText.destroy();

    this.orion = null; // Forza la ricreazione

    const RE_VAL = 6371000;
    const hp = 192000;
    const ha = 70174000;
    const real_rp = hp + RE_VAL;
    const real_ra = ha + RE_VAL;
    const real_a = (real_rp + real_ra) / 2;
    const real_e = (real_ra - real_rp) / (real_ra + real_rp);

    // Scala responsiva migliorata
    const margin = 100;
    const renderScale = Math.min((width - margin) / (real_a * 2.2), (height - margin) / (real_a * 1.2)) * 0.7;

    const ellipseCenterX = width / 2;
    const ellipseCenterY = height / 2;
    const a = real_a * renderScale;
    const focusDist = (real_a * real_e) * renderScale;
    const earthX = ellipseCenterX + focusDist;
    const earthY = ellipseCenterY;

    // Terra
    const earthRadiusPx = RE_VAL * renderScale;
    this.earth = this.add.circle(earthX, earthY, earthRadiusPx, 0x1a73e8);
    this.earthGlow = this.add.circle(earthX, earthY, earthRadiusPx + 5, 0x4488ff, 0.2);
    this.earthLabel = this.add.text(earthX, earthY + earthRadiusPx + 15, 'TERRA', { 
      fontSize: '12px', color: '#ffffff', fontStyle: 'bold'
    }).setOrigin(0.5);

    // Orbita
    this.orbitPath = this.add.graphics();
    this.orbitPath.lineStyle(2, 0x0032a0, 0.6);
    this.orbitPath.strokeEllipse(ellipseCenterX, ellipseCenterY, a * 2, a * 2 * Math.sqrt(1 - real_e * real_e));

    // Orion
    this.orion = this.add.circle(ellipseCenterX + a, earthY, 6, 0xff3e00);
    this.orion.setStrokeStyle(2, 0xffffff);
    this.orion.setData('pathAngle', 0);
    this.orion.setData('currentA', a);
    this.orion.setData('currentE', real_e);
    this.orion.setData('centerX', ellipseCenterX);
    this.orion.setData('centerY', ellipseCenterY);

    this.statusText = this.add.text(20, height - 40, 'STATO: ATTESA CALCOLI', {
      fontSize: '14px', color: '#ff3e00', fontStyle: 'bold'
    });

    if (this.animationEvent) this.animationEvent.destroy();
    this.startAnimation(real_a, real_e);
  }

  startAnimation(real_a_m, e) {
    let GM = 3.986e14;
    let RE = 6371000;
    const h_momentum = Math.sqrt(GM * real_a_m * (1 - e * e));

    this.animationEvent = this.time.addEvent({
      delay: 16,
      callback: () => {
        if (!this.isValid || !this.orion) return; 

        let angle = this.orion.getData('pathAngle');
        const r_m = real_a_m * (1 - e * e) / (1 + e * Math.cos(angle));
        
        const physicalDAngle = (h_momentum / (r_m * r_m)) * 0.016;
        const timeScale = 1500; 
        angle += physicalDAngle * timeScale;
        
        this.orion.setData('pathAngle', angle);
        
        const a = this.orion.getData('currentA');
        const cx = this.orion.getData('centerX');
        const cy = this.orion.getData('centerY');
        const b = a * Math.sqrt(1 - e * e);

        this.orion.x = cx + a * Math.cos(angle);
        this.orion.y = cy + b * Math.sin(angle);

        missionState.update(s => ({
          ...s,
          telemetry: {
            ...s.telemetry,
            altitude: (r_m - RE) / 1000,
            velocity: Math.sqrt(GM * (2/r_m - 1/real_a_m)) / 1000
          }
        }));
      },
      loop: true
    });
  }

  update() {
    if (this.isValid && this.statusText) {
      this.statusText.setText('STATO: TRAIETTORIA STABILE');
      this.statusText.setColor('#00ff00');
    }
  }
}
