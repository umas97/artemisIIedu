import * as Phaser from 'phaser';
import { missionState, updateTelemetry } from '../../stores/missionStore';
import { get } from 'svelte/store';

export class ReentryScene extends Phaser.Scene {
  constructor() {
    super({ key: 'ReentryScene' });
    this.targetAltitude = 0; // Surface
  }

  preload() {
    // Generiamo asset procedurali se non esistono
    if (!this.textures.exists('orion_capsule')) {
      const graphics = this.add.graphics();
      graphics.fillStyle(0xcccccc, 1);
      graphics.fillTriangle(0, 20, 10, 0, 20, 20); // Forma a cono
      graphics.fillStyle(0x884400, 1);
      graphics.fillRect(0, 20, 20, 4); // Scudo termico
      graphics.generateTexture('orion_capsule', 20, 24);
      graphics.destroy();
    }
    if (!this.textures.exists('parachute_drogue')) {
      const graphics = this.add.graphics();
      graphics.lineStyle(1, 0xffffff);
      graphics.strokeCircle(10, 10, 10);
      graphics.beginPath();
      graphics.moveTo(0, 10);
      graphics.lineTo(10, 30);
      graphics.lineTo(20, 10);
      graphics.strokePath();
      graphics.generateTexture('parachute_drogue', 20, 30);
      graphics.destroy();
    }
    if (!this.textures.exists('parachute_main')) {
      const graphics = this.add.graphics();
      graphics.fillStyle(0xff8800, 1);
      graphics.fillCircle(20, 20, 20);
      graphics.fillStyle(0xffffff, 1);
      graphics.fillCircle(20, 20, 18);
      graphics.lineStyle(1, 0xffffff);
      graphics.beginPath();
      graphics.moveTo(5, 30);
      graphics.lineTo(20, 60);
      graphics.lineTo(35, 30);
      graphics.strokePath();
      graphics.generateTexture('parachute_main', 40, 60);
      graphics.destroy();
    }
  }

  create() {
    const width = this.scale.width;
    const height = this.scale.height;

    this.state = get(missionState);
    this.studentCalculations = this.state.studentCalculations;

    // Sfondo e Atmosfera
    this.add.rectangle(0, 0, width, height, 0x000000).setOrigin(0, 0);
    
    // Gradiente atmosferico
    const atmosGraphics = this.add.graphics();
    atmosGraphics.fillGradientStyle(0x000000, 0x000000, 0x001133, 0x0055ff, 1);
    atmosGraphics.fillRect(0, height * 0.2, width, height * 0.8);
    
    // Oceano
    this.add.rectangle(0, height - 50, width, 50, 0x0033aa).setOrigin(0, 0);

    // Parametri iniziali (es. 120km altitudine, 11 km/s velocità)
    this.altitude = 120000; 
    this.velocity = 11000;
    this.temperature = 20;
    this.parachuteState = 'none'; // 'none', 'drogue', 'main'
    this.simulationState = 'running'; // 'running', 'skip', 'burn', 'crash', 'success'

    // Limiti Reali Artemis II
    this.angleMin = -7.2; // Troppo ripido
    this.angleMax = -5.8; // Troppo piatto
    
    this.reentryAngle = this.studentCalculations.reentryAngle || -6.5;
    this.drogueAlt = this.studentCalculations.parachuteDrogueAltitude || 7000;
    this.mainArea = this.studentCalculations.parachuteArea || 832;

    // Aggiungi capsula
    this.capsule = this.add.sprite(width / 2, 50, 'orion_capsule');
    this.capsule.setScale(2);
    this.capsule.setRotation(this.reentryAngle * Math.PI / 180);

    // Effetti grafici
    this.plasmaEffect = this.add.graphics();
    this.parachuteSprite = null;

    updateTelemetry({
      velocity: this.velocity / 1000, // km/s
      altitude: this.altitude / 1000, // km
      fuelRemaining: 0,
      stage: "Orion Crew Module"
    });

    this.timer = this.time.addEvent({
      delay: 50,
      callback: this.updateSimulation,
      callbackScope: this,
      loop: true
    });
  }

  updateSimulation() {
    if (this.simulationState !== 'running') return;

    const width = this.scale.width;
    const height = this.scale.height;

    // Modello di discesa semplificato
    // La capsula scende in base all'angolo e perde velocità
    const dt = 0.5; // step temporale simulato
    const descentRate = Math.abs(Math.sin(this.reentryAngle * Math.PI / 180)) * this.velocity;
    
    this.altitude -= descentRate * dt;
    
    // Densità atmosferica (modello esponenziale)
    const rho0 = 1.225; // kg/m^3 a livello del mare
    const scaleHeight = 8500; // m
    const density = rho0 * Math.exp(-this.altitude / scaleHeight);

    // Calcolo del Drag (resistenza aerodinamica)
    let cd = 1.2; // coefficiente di resistenza capsula base
    let area = 20; // m^2 base
    
    if (this.parachuteState === 'drogue') {
      cd = 1.5;
      area = 100;
    } else if (this.parachuteState === 'main') {
      cd = 2.0; // Coefficiente di forma tipico dei paracadute a calotta emisferica
      area = this.mainArea; // L'area calcolata dallo studente
    }

    const dragForce = 0.5 * density * Math.pow(this.velocity, 2) * cd * area;
    const mass = 10400; // kg Orion
    const deceleration = dragForce / mass;

    this.velocity -= deceleration * dt;
    
    // Gravità
    this.velocity += 9.81 * Math.sin(Math.abs(this.reentryAngle) * Math.PI / 180) * dt;

    if (this.velocity < 0) this.velocity = 0;

    // Calcolo Calore (Heating rate semplificato: proporzionale a densità * v^3)
    const heatingRate = density * Math.pow(this.velocity / 1000, 3);
    if (this.parachuteState === 'none') {
      this.temperature = 20 + heatingRate * 5; // Scala arbitraria
    } else {
      this.temperature = Math.max(20, this.temperature - 50); // Si raffredda
    }

    // --- CONTROLLO CONDIZIONI DI FALLIMENTO/SUCCESSO ---

    // 1. Skip-off (Angolo troppo superficiale, rimbalza in quota)
    if (this.reentryAngle > this.angleMax && this.altitude < 100000 && this.altitude > 80000 && this.velocity > 9000) {
      this.simulationState = 'skip';
      this.endSimulation("L'angolo di rientro è troppo superficiale (" + this.reentryAngle + "°). La capsula non riesce ad affondare nell'atmosfera ed è rimbalzata nello spazio profondo (Skip-off).", false);
      return;
    }

    // 2. Burn-up (Angolo troppo ripido, temperatura eccessiva)
    if (this.reentryAngle < this.angleMin && this.temperature > 2800) {
      this.simulationState = 'burn';
      this.endSimulation("L'angolo di rientro è troppo ripido (" + this.reentryAngle + "°). La decelerazione è letale e la temperatura (" + Math.round(this.temperature) + "°C) ha superato i limiti dello scudo termico, incenerendo la capsula.", false);
      return;
    }

    // 3. Apertura Paracadute
    if (this.parachuteState === 'none' && this.altitude <= this.drogueAlt) {
      if (this.velocity > 300) { // Troppo veloce per i drogue
        this.simulationState = 'crash';
        this.endSimulation("Hai aperto i drogue chutes a una velocità troppo alta (" + Math.round(this.velocity) + " m/s). I paracadute si sono strappati per le forze aerodinamiche.", false);
        return;
      } else {
        this.parachuteState = 'drogue';
        this.parachuteSprite = this.add.sprite(this.capsule.x, this.capsule.y - 40, 'parachute_drogue');
      }
    }

    // I main chutes si aprono a 2500m (valore fisso nella simulazione ora, o potremmo usare una quota hardcoded di 2500m visto che non lo chiediamo più all'utente)
    if (this.parachuteState === 'drogue' && this.altitude <= 2500) {
      if (this.velocity > 150) { // Troppo veloce per i main
        this.simulationState = 'crash';
        this.endSimulation("Hai aperto i main chutes a una velocità troppo elevata (forse i drogue si sono aperti troppo tardi?). Le cinghie hanno ceduto.", false);
        return;
      } else {
        this.parachuteState = 'main';
        this.parachuteSprite.destroy();
        this.parachuteSprite = this.add.sprite(this.capsule.x, this.capsule.y - 70, 'parachute_main');
        
        // Riscaliamo lo sprite del main parachute in base all'area calcolata (effetto visivo)
        // Area attesa = ~832. 
        const visualScale = Math.sqrt(this.mainArea / 832);
        this.parachuteSprite.setScale(visualScale);
      }
    }

    // 4. Splashdown
    if (this.altitude <= 0) {
      this.altitude = 0;
      if (this.velocity > 15) { // Oltre 15 m/s (54 km/h) è un impatto fatale
        this.simulationState = 'crash';
        this.endSimulation("Ammaraggio troppo violento! Velocità d'impatto: " + Math.round(this.velocity) + " m/s. La superficie dei paracadute che hai calcolato (" + this.mainArea + " m²) è insufficiente per rallentare a sufficienza il modulo Orion.", false);
      } else if (this.velocity < 5) { // Area troppo grande
        this.simulationState = 'crash';
        this.endSimulation("La superficie dei paracadute calcolata (" + this.mainArea + " m²) è troppo elevata! Il modulo è stato trascinato via dalle correnti ad alta quota e disperso.", false);
      } else {
        this.simulationState = 'success';
        this.endSimulation("Ammaraggio perfetto! Velocità: " + Math.round(this.velocity) + " m/s. Benvenuti a casa, Artemis II.", true);
      }
      return;
    }

    // Aggiornamento Visivo
    // Mappiamo l'altitudine 120km -> 0km sull'asse y (50px -> height - 50px)
    const altRatio = 1 - (this.altitude / 120000);
    this.capsule.y = 50 + altRatio * (height - 100);
    
    if (this.parachuteSprite) {
      this.parachuteSprite.x = this.capsule.x;
      this.parachuteSprite.y = this.parachuteState === 'drogue' ? this.capsule.y - 40 : this.capsule.y - 70;
    }

    // Effetto Plasma
    this.plasmaEffect.clear();
    if (this.temperature > 1000 && this.parachuteState === 'none') {
      const plasmaIntensity = Math.min((this.temperature - 1000) / 1800, 1);
      this.plasmaEffect.fillStyle(0xffaa00, plasmaIntensity * 0.8);
      this.plasmaEffect.fillCircle(this.capsule.x, this.capsule.y + 15, 20 + Math.random() * 5);
      
      // Shake
      this.capsule.x = (width / 2) + (Math.random() - 0.5) * plasmaIntensity * 5;
    } else {
      this.capsule.x = width / 2; // Ritorna al centro se non c'è plasma
    }

    // Aggiorna Store
    updateTelemetry({
      velocity: this.velocity / 1000,
      altitude: this.altitude / 1000,
      temperature: Math.round(this.temperature) // Aggiungiamo temp alla UI virtualmente
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
      // Se fallisce, facciamo sparire la capsula (es. esplode o vola via)
      if (this.simulationState === 'burn' || this.simulationState === 'crash') {
        const boom = this.add.circle(this.capsule.x, this.capsule.y, 40, 0xff5500);
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
