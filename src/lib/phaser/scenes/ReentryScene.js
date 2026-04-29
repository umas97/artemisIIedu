import * as Phaser from 'phaser';
import { missionState, updateTelemetry } from '../../stores/missionStore';
import { get } from 'svelte/store';

export class ReentryScene extends Phaser.Scene {
  constructor() {
    super({ key: 'ReentryScene' });
    this.targetAltitude = 0;
  }

  preload() {
    if (!this.textures.exists('orion_capsule')) {
      const graphics = this.add.graphics();
      graphics.fillStyle(0xcccccc, 1);
      graphics.fillTriangle(0, 20, 10, 0, 20, 20); 
      graphics.fillStyle(0x884400, 1);
      graphics.fillRect(0, 20, 20, 4); 
      graphics.generateTexture('orion_capsule', 20, 24);
      graphics.destroy();
    }
    if (!this.textures.exists('parachute_drogue')) {
      const graphics = this.add.graphics();
      graphics.lineStyle(1, 0xffffff);
      graphics.strokeCircle(10, 10, 10);
      graphics.beginPath();
      graphics.moveTo(10, 20); graphics.lineTo(20, 40);
      graphics.strokePath();
      
      graphics.strokeCircle(30, 10, 10);
      graphics.beginPath();
      graphics.moveTo(30, 20); graphics.lineTo(20, 40);
      graphics.strokePath();
      
      graphics.generateTexture('parachute_drogue', 40, 40);
      graphics.destroy();
    }
    if (!this.textures.exists('parachute_main')) {
      const graphics = this.add.graphics();
      graphics.fillStyle(0xff8800, 1);
      graphics.fillCircle(20, 20, 20);
      graphics.fillStyle(0xffffff, 1);
      graphics.fillCircle(20, 20, 18);
      
      graphics.fillStyle(0xffaa00, 1);
      graphics.fillCircle(50, 15, 20);
      graphics.fillStyle(0xffffff, 1);
      graphics.fillCircle(50, 15, 18);
      
      graphics.fillStyle(0xff8800, 1);
      graphics.fillCircle(80, 20, 20);
      graphics.fillStyle(0xffffff, 1);
      graphics.fillCircle(80, 20, 18);
      
      graphics.lineStyle(1, 0xffffff);
      graphics.beginPath();
      graphics.moveTo(10, 30); graphics.lineTo(50, 80);
      graphics.moveTo(50, 30); graphics.lineTo(50, 80);
      graphics.moveTo(90, 30); graphics.lineTo(50, 80);
      graphics.strokePath();
      
      graphics.generateTexture('parachute_main', 100, 80);
      graphics.destroy();
    }
  }

  create() {
    const width = this.scale.width;
    const height = this.scale.height;

    this.state = get(missionState);
    this.studentCalculations = this.state.studentCalculations;

    this.skyBackground = this.add.rectangle(0, 0, width, height, 0x000000).setOrigin(0, 0);
    this.ocean = this.add.rectangle(0, height, width, height, 0x0033aa).setOrigin(0, 0);

    this.altitude = 120000; 
    this.velocity = 11000;
    this.temperature = 20;
    this.parachuteState = 'none'; 
    this.simulationState = 'waiting'; 

    this.angleMin = -7.2; 
    this.angleMax = -5.8; 

    this.capsule = this.add.sprite(width / 2, height / 2, 'orion_capsule');
    this.capsule.setScale(2);
    this.capsule.setDepth(10); 

    this.plasmaEffect = this.add.graphics();
    this.plasmaEffect.setDepth(15);
    this.parachuteSprite = null;

    updateTelemetry({
      velocity: this.velocity / 1000, 
      altitude: this.altitude / 1000, 
      fuelRemaining: 0,
      stage: "Orion Crew Module"
    });

    const unsubscribe = missionState.subscribe(state => {
      if (state.currentPhase === 6 && state.studentCalculations.isValid && !state.isAnalyzing && this.simulationState === 'waiting') {
        this.reentryAngle = state.studentCalculations.reentryAngle;
        this.drogueAlt = state.studentCalculations.parachuteDrogueAltitude;
        this.mainArea = state.studentCalculations.parachuteArea;
        
        this.capsule.setRotation(this.reentryAngle * Math.PI / 180);
        this.simulationState = 'running';
      }
    });
    this.events.once('shutdown', unsubscribe);

    this.timer = this.time.addEvent({
      delay: 16,
      callback: this.updateSimulation,
      callbackScope: this,
      loop: true
    });
  }

  updateSimulation() {
    if (this.simulationState !== 'running') return;

    const width = this.scale.width;
    const height = this.scale.height;

    const dt = 0.5; 
    const physicsSteps = this.altitude > 15000 ? 5 : 1;

    for (let i = 0; i < physicsSteps; i++) {
      let currentAngle = this.reentryAngle;
      if (this.parachuteState !== 'none') {
          currentAngle = -90;
      } else if (this.velocity < 5000) {
          const t = Math.max(0, (5000 - this.velocity) / 5000);
          currentAngle = this.reentryAngle * (1 - t) + (-90) * t;
      }

      const descentRate = Math.abs(Math.sin(currentAngle * Math.PI / 180)) * this.velocity;
      this.altitude -= descentRate * dt;
      
      if (this.parachuteState !== 'none') {
        this.capsule.setRotation(0);
      } else {
        this.capsule.setRotation(currentAngle * Math.PI / 180);
      }
      
      const rho0 = 1.225;
      const scaleHeight = 8500;
      const density = rho0 * Math.exp(-this.altitude / scaleHeight);

      let cd = 1.2;
      let area = 20;
      
      if (this.parachuteState === 'drogue') {
        cd = 1.5;
        area = 100;
      } else if (this.parachuteState === 'main') {
        cd = 2.0; 
        area = this.mainArea;
      }

      const dragForce = 0.5 * density * Math.pow(this.velocity, 2) * cd * area;
      const mass = 10400; 
      const deceleration = dragForce / mass;

      this.velocity -= deceleration * dt;
      this.velocity += 9.81 * Math.abs(Math.sin(currentAngle * Math.PI / 180)) * dt;

      if (this.velocity < 0) this.velocity = 0;

      const heatingRate = density * Math.pow(this.velocity / 1000, 3);
      
      let tempMultiplier = 400; // Picco di circa 2000-2500°C per un rientro normale
      if (this.reentryAngle < this.angleMin) {
        tempMultiplier = 2000; // L'angolo troppo ripido genera un attrito estremo
      }

      if (this.parachuteState === 'none') {
        const targetTemp = 20 + heatingRate * tempMultiplier;
        // Interpolazione per una salita o discesa fluida della temperatura
        this.temperature += (targetTemp - this.temperature) * 0.1;
      } else {
        this.temperature = Math.max(20, this.temperature - 50);
      }

      if (this.reentryAngle > this.angleMax && this.altitude < 100000 && this.altitude > 80000 && this.velocity > 9000) {
        this.simulationState = 'skip';
        this.endSimulation("L'angolo di rientro è troppo superficiale (" + this.reentryAngle + "°). La capsula non riesce ad affondare nell'atmosfera ed è rimbalzata nello spazio profondo (Skip-off).", false);
        break;
      }

      if (this.reentryAngle < this.angleMin && this.temperature > 2800) {
        this.simulationState = 'burn';
        this.endSimulation("L'angolo di rientro è troppo ripido (" + this.reentryAngle + "°). La decelerazione è letale e la temperatura (" + Math.round(this.temperature) + "°C) ha superato i limiti dello scudo termico, incenerendo la capsula.", false);
        break;
      }

      if (this.parachuteState === 'none' && this.altitude <= this.drogueAlt) {
        if (this.velocity > 300) {
          this.simulationState = 'crash';
          this.endSimulation("Hai aperto i drogue chutes a una velocità troppo alta (" + Math.round(this.velocity) + " m/s). I paracadute si sono strappati per le forze aerodinamiche.", false);
          break;
        } else if (this.drogueAlt > 8500) {
          this.simulationState = 'crash';
          this.endSimulation("Hai aperto i drogue chutes troppo in alto (" + this.drogueAlt + " m). L'aria rarefatta non ha garantito un gonfiaggio corretto e la capsula ha perso stabilità.", false);
          break;
        } else if (this.drogueAlt < 5500) {
          this.simulationState = 'crash';
          this.endSimulation("Hai aperto i drogue chutes troppo in basso (" + this.drogueAlt + " m). La densità dell'aria eccessiva a questa quota ha causato uno strappo fatale sui tessuti.", false);
          break;
        } else {
          this.parachuteState = 'drogue';
          this.parachuteSprite = this.add.sprite(this.capsule.x, this.capsule.y - 40, 'parachute_drogue');
          this.parachuteSprite.setDepth(5);
          this.parachuteSprite.setScale(0);
          this.tweens.add({
            targets: this.parachuteSprite,
            scale: 1.5,
            duration: 1500,
            ease: 'Back.easeOut'
          });
        }
      }

      if (this.parachuteState === 'drogue' && this.altitude <= 2500) {
        if (this.velocity > 80) { // Abbassato da 150 a 80 per rendere letale un'apertura ritardata
          this.simulationState = 'crash';
          this.endSimulation("Hai aperto i main chutes a una velocità troppo elevata (" + Math.round(this.velocity) + " m/s). Le cinghie hanno ceduto per la decelerazione.", false);
          break;
        } else {
          this.parachuteState = 'main';
          this.parachuteSprite.destroy();
          this.parachuteSprite = this.add.sprite(this.capsule.x, this.capsule.y - 80, 'parachute_main');
          this.parachuteSprite.setDepth(5);
          this.parachuteSprite.setScale(0);
          
          const visualScale = Math.sqrt(this.mainArea / 832) * 1.5;
          this.tweens.add({
            targets: this.parachuteSprite,
            scale: visualScale,
            duration: 3000,
            ease: 'Power2'
          });
        }
      }

      if (this.altitude <= 0) {
        this.altitude = 0;
        if (this.velocity > 11.5) { // Tolleranza più stringente (circa Area < 650)
          this.simulationState = 'crash';
          this.endSimulation("Ammaraggio troppo violento! Velocità d'impatto: " + Math.round(this.velocity) + " m/s. La superficie dei paracadute che hai calcolato (" + this.mainArea + " m²) è insufficiente.", false);
        } else if (this.velocity < 8.5) { // Tolleranza più stringente (circa Area > 1100)
          this.simulationState = 'crash';
          this.endSimulation("La superficie dei paracadute (" + this.mainArea + " m²) è eccessiva! La capsula è scesa troppo lentamente (" + Math.round(this.velocity) + " m/s) ed è stata dispersa dalle correnti.", false);
        } else {
          this.simulationState = 'success';
          this.tweens.add({
            targets: this.capsule,
            y: this.capsule.y + 10,
            angle: 5,
            yoyo: true,
            repeat: -1,
            duration: 2000,
            ease: 'Sine.easeInOut'
          });
          if (this.parachuteSprite) {
             this.tweens.add({
                targets: this.parachuteSprite,
                y: this.parachuteSprite.y + 30,
                scale: 0.5,
                alpha: 0,
                duration: 4000,
                ease: 'Power1'
             });
          }
          this.endSimulation("Ammaraggio perfetto! Velocità: " + Math.round(this.velocity) + " m/s. Benvenuti a casa, Artemis II.", true);
        }
        break;
      }
    }

    if (this.simulationState !== 'running' && this.simulationState !== 'success') return;

    const skyFactor = Phaser.Math.Clamp(1 - (this.altitude / 40000), 0, 1);
    const skyColor = Phaser.Display.Color.Interpolate.ColorWithColor(
        Phaser.Display.Color.ValueToColor(0x000000),
        Phaser.Display.Color.ValueToColor(0x55aaff),
        100, skyFactor * 100
    );
    this.skyBackground.fillColor = Phaser.Display.Color.GetColor(skyColor.r, skyColor.g, skyColor.b);

    const renderScale = 0.2; 
    this.ocean.y = (height / 2) + 10 + (this.altitude * renderScale);

    if (this.parachuteSprite && this.simulationState === 'running') {
      this.parachuteSprite.x = this.capsule.x;
      const targetYOffset = this.parachuteState === 'drogue' ? -40 : -80;
      this.parachuteSprite.y = this.capsule.y + targetYOffset;
    }

    this.plasmaEffect.clear();
    if (this.temperature > 1000 && this.parachuteState === 'none') {
      const plasmaIntensity = Math.min((this.temperature - 1000) / 1800, 1);
      this.plasmaEffect.fillStyle(0xffaa00, plasmaIntensity * 0.8);
      this.plasmaEffect.fillCircle(this.capsule.x, this.capsule.y + 15, 20 + Math.random() * 5);
      this.capsule.x = (width / 2) + (Math.random() - 0.5) * plasmaIntensity * 5;
    } else {
      if (this.simulationState === 'running') this.capsule.x = width / 2;
    }

    updateTelemetry({
      velocity: this.velocity / 1000,
      altitude: this.altitude / 1000,
      temperature: Math.round(this.temperature)
    });
  }

  endSimulation(message, success) {
    this.timer.remove();
    this.plasmaEffect.clear();

    if (success) {
      missionState.update(s => ({
        ...s,
        phase6Complete: true,
        didacticFeedback: message,
        status: "Ammaraggio Riuscito"
      }));
    } else {
      missionState.update(s => ({
        ...s,
        didacticFeedback: message,
        status: "Fallimento Rientro"
      }));
      if (this.simulationState === 'burn' || this.simulationState === 'crash') {
        const boom = this.add.circle(this.capsule.x, this.capsule.y, 40, 0xff5500);
        boom.setDepth(20);
        this.tweens.add({
          targets: boom,
          scale: 3,
          alpha: 0,
          duration: 500,
          onComplete: () => boom.destroy()
        });
        this.capsule.setVisible(false);
        if (this.parachuteSprite) this.parachuteSprite.setVisible(false);
      } else if (this.simulationState === 'skip') {
        this.tweens.add({
          targets: this.capsule,
          y: -100,
          duration: 1000
        });
      }
    }
  }
}
