import * as Phaser from 'phaser';

export class BootScene extends Phaser.Scene {
  constructor() {
    super('BootScene');
  }

  preload() {
    // Add loading text
    const width = this.cameras.main.width;
    const height = this.cameras.main.height;
    const loadingText = this.make.text({
      x: width / 2,
      y: height / 2,
      text: 'Loading...',
      style: {
        font: '20px monospace',
        color: '#ffffff'
      }
    });
    loadingText.setOrigin(0.5, 0.5);

    // TODO: Load assets here
  }

  create() {
    this.add.text(100, 100, 'Artemis II Simulator', { color: '#00ff00' });
    this.add.text(100, 130, 'Engine Initialized', { color: '#00ff00' });
  }
}
