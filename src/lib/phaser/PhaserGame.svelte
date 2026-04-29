<script>
  import { onMount, onDestroy } from 'svelte';
  import * as Phaser from 'phaser';
  import { BootScene } from './scenes/BootScene.js';
  import { EarthOrbitScene } from './scenes/EarthOrbitScene.js';
  import { LaunchScene } from './scenes/LaunchScene.js';
  import { TLIScene } from './scenes/TLIScene.js';
  import { LOIScene } from './scenes/LOIScene.js';
  import { TEIScene } from './scenes/TEIScene.js';
  import { ReentryScene } from './scenes/ReentryScene.js';

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
      scene: [EarthOrbitScene, LaunchScene, TLIScene, LOIScene, TEIScene, ReentryScene, BootScene],
      backgroundColor: '#050505',
      fps: {
        target: 60,
        forceSetTimeOut: true
      },
      callbacks: {
        postBoot: (gameInstance) => {
          gameInstance.events.off('blur');
          window.game = gameInstance;
        }
      }
    };

    game = new Phaser.Game(config);

    const handleResize = () => {
      if (game && game.scale) {
        game.scale.resize(window.innerWidth, window.innerHeight);
      }
    };

    window.addEventListener('resize', handleResize);

    const loader = document.getElementById('initial-loader');
    if (loader) {
      loader.style.opacity = '0';
      setTimeout(() => loader.remove(), 500);
    }

    return () => {
      window.removeEventListener('resize', handleResize);
    };
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
    background-color: #000;
  }

  :global(canvas) {
    display: block;
    width: 100% !important;
    height: 100% !important;
  }
</style>
