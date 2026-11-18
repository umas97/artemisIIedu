<script>
  import { onMount, onDestroy } from 'svelte';
  import * as Phaser from 'phaser';
  import { EarthOrbitScene } from './scenes/EarthOrbitScene.js';
  import { LaunchScene } from './scenes/LaunchScene.js';
  import { TLIScene } from './scenes/TLIScene.js';
  import { LOIScene } from './scenes/LOIScene.js';
  import { TEIScene } from './scenes/TEIScene.js';
  import { ReentryScene } from './scenes/ReentryScene.js';
  import { get } from 'svelte/store';
  import { missionState } from '../stores/missionStore.js';

  // Una scena per fase, nello stesso ordine di currentPhase (1…6)
  const SCENES = [EarthOrbitScene, LaunchScene, TLIScene, LOIScene, TEIScene, ReentryScene];
  const SCENE_KEYS = ['EarthOrbitScene', 'LaunchScene', 'TLIScene', 'LOIScene', 'TEIScene', 'ReentryScene'];

  let gameContainer;
  let game;

  onMount(() => {
    const config = {
      type: Phaser.AUTO,
      parent: gameContainer,
      width: window.innerWidth,
      height: window.innerHeight,
      scale: {
        mode: Phaser.Scale.RESIZE,
        autoCenter: Phaser.Scale.CENTER_BOTH
      },
      physics: {
        default: 'arcade',
        arcade: {
          gravity: { x: 0, y: 0 },
          debug: false
        }
      },
      scene: [],
      backgroundColor: '#04060b',
      fps: {
        target: 60,
        forceSetTimeOut: true
      },
      callbacks: {
        postBoot: (gameInstance) => {
          gameInstance.events.off('blur');
          window.game = gameInstance;
          // Si avvia solo la scena della fase corrente: se il gioco viene ricreato a
          // fase già avanzata (ricaricamento a caldo in sviluppo) non deve ripartire
          // l'orbita della fase 1 sotto le altre scene.
          const current = SCENE_KEYS[get(missionState).currentPhase - 1] ?? SCENE_KEYS[0];
          SCENES.forEach((cls, i) => gameInstance.scene.add(SCENE_KEYS[i], cls, SCENE_KEYS[i] === current));
        }
      }
    };

    game = new Phaser.Game(config);


    const loader = document.getElementById('initial-loader');
    if (loader) {
      loader.style.opacity = '0';
      setTimeout(() => loader.remove(), 500);
    }

  });

  onDestroy(() => {
    if (game) {
      game.destroy(true);
    }
  });
</script>

<div bind:this={gameContainer} id="phaser-game-container"></div>

<style>
  #phaser-game-container {
    position: fixed;
    top: 0;
    left: 0;
    width: 100vw;
    height: 100vh;
    z-index: 0;
    overflow: hidden;
    background-color: #04060b;
  }

  :global(canvas) {
    display: block;
    width: 100% !important;
    height: 100% !important;
  }
</style>
