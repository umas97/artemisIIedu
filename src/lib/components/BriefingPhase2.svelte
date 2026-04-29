<script>
  import { math } from '../actions/math.js';
  import { missionState } from '../stores/missionStore.js';
  import { onMount } from 'svelte';

  let { onStartAnalysis } = $props();
  let showTeacherMode = $state(false);

  const rocket = $missionState.rocket;

  onMount(() => {
    const handleKeydown = (e) => {
      if (e.ctrlKey && e.shiftKey && e.code === 'KeyD') {
        showTeacherMode = !showTeacherMode;
      }
    };
    window.addEventListener('keydown', handleKeydown);
    return () => window.removeEventListener('keydown', handleKeydown);
  });
</script>

<div class="max-w-5xl text-white p-6 bg-black/80 backdrop-blur-md rounded-2xl border border-nasa-blue/40 shadow-2xl relative overflow-hidden">
  <!-- Sfondo animato -->
  <div class="absolute inset-0 opacity-20 pointer-events-none">
    <div class="absolute top-0 left-0 w-96 h-96 bg-orion-orange/30 rounded-full blur-3xl animate-pulse mix-blend-screen"></div>
    <div class="absolute bottom-0 right-0 w-96 h-96 bg-nasa-blue/30 rounded-full blur-3xl animate-pulse mix-blend-screen" style="animation-delay: 2s;"></div>
  </div>

  <!-- Header -->
  <div class="flex items-center gap-4 mb-8 border-b border-white/10 pb-6 relative z-10">
    <div class="bg-orion-orange p-3 rounded-xl shadow-[0_0_20px_rgba(255,62,0,0.5)]">
      <svg class="w-8 h-8 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M13 10V3L4 14h7v7l9-11h-7z" />
      </svg>
    </div>
    <div>
      <h2 class="text-3xl font-black tracking-tight text-transparent bg-clip-text bg-gradient-to-r from-white to-gray-400">FASE 2: LANCIO E PROPULSIONE</h2>
      <p class="text-orion-orange font-mono text-sm tracking-widest uppercase mt-1">Equazione di Tsiolkovsky — Calcolo Propellente SLS</p>
    </div>
    <div class="ml-auto px-3 py-1 bg-orion-orange/20 border border-orion-orange/30 rounded text-orion-orange text-[10px] font-bold uppercase tracking-widest">
      Priorità Alta
    </div>
  </div>

  <div class="space-y-4 text-gray-300 leading-relaxed text-base relative z-10">
    <p>
      Ottimo lavoro, Comandante. I parametri orbitali della Fase 1 sono confermati. Ora dobbiamo determinare la quantità di <strong>propellente</strong> necessaria per il razzo <strong>SLS Block 1</strong>. 
      Il lancio richiede un <span use:math={{expression: '\\Delta v'}}></span> totale di circa <strong>9.500 m/s</strong> per raggiungere l'orbita di parcheggio terrestre.
    </p>

    <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
      <!-- Colonna Sinistra: Fisica -->
      <div class="flex flex-col space-y-4">
        <div class="bg-nasa-blue/10 border border-nasa-blue/30 p-4 rounded-xl shadow-inner">
          <h3 class="text-lg font-bold text-nasa-blue flex items-center gap-2 mb-2">
            <svg class="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z" /></svg>
            La Fisica della Propulsione
          </h3>
          <p class="text-sm mb-3">
            Il moto di un razzo è governato dalla <strong>conservazione della quantità di moto</strong>. Espellendo massa ad alta velocità, il razzo riceve una spinta in direzione opposta. L'equazione fondamentale di <strong>Konstantin Tsiolkovsky</strong> lega la variazione di velocità alla massa consumata:
          </p>
          <div class="bg-black/50 p-3 rounded text-center text-xl text-white flex justify-center">
            <span use:math={{expression: '\\Delta v = I_{sp} \\cdot g_0 \\cdot \\ln\\left(\\frac{m_{iniziale}}{m_{finale}}\\right)'}}></span>
          </div>
        </div>

        <div class="bg-gray-800/50 border border-gray-600/30 p-4 rounded-xl shadow-inner">
          <h3 class="text-lg font-bold text-white flex items-center gap-2 mb-2">
            <svg class="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" /></svg>
            Esercizio Analitico
          </h3>
          <p class="text-sm">
            Sapendo che <span use:math={{expression: 'm_{iniziale} = m_{dry} + m_{fuel}'}}></span> e <span use:math={{expression: 'm_{finale} = m_{dry}'}}></span>, <strong>ricava la formula inversa</strong> per determinare la massa di carburante <span use:math={{expression: 'm_{fuel}'}}></span> necessaria per ottenere il <span use:math={{expression: '\\Delta v'}}></span> richiesto.
          </p>
        </div>
      </div>

      <!-- Colonna Destra: Specifiche + Docente -->
      <div class="flex flex-col space-y-4">
        <div class="bg-orion-orange/10 border border-orion-orange/30 p-4 rounded-xl shadow-inner">
          <h3 class="text-lg font-bold text-orion-orange flex items-center gap-2 mb-2">
            <svg class="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>
            Specifiche SLS Block 1
          </h3>
          <ul class="space-y-2 font-mono text-sm bg-black/30 p-3 rounded-lg border border-white/5">
            <li>Massa a vuoto: <span use:math={{expression: 'm_{dry} = 150.000\\text{ kg}'}}></span></li>
            <li>Impulso Specifico: <span use:math={{expression: 'I_{sp} = 363\\text{ s}'}}></span></li>
            <li>Accelerazione Gravità: <span use:math={{expression: 'g_0 = 9,80665\\text{ m/s}^2'}}></span></li>
            <li>Delta-v Richiesto: <span use:math={{expression: '\\Delta v_{target} = 9.500\\text{ m/s}'}}></span></li>
          </ul>
        </div>

        {#if showTeacherMode}
          <div class="bg-yellow-900/20 border border-yellow-500/30 p-4 rounded-xl">
            <h3 class="text-yellow-400 font-bold text-xs mb-2 uppercase tracking-widest flex items-center gap-2">
              <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" /></svg>
              Modalità Docente (Ctrl+Shift+D)
            </h3>
            <div class="space-y-2 font-mono text-sm text-yellow-300/90">
              <p>Formula Inversa: <span use:math={{expression: 'm_{fuel} = m_{dry} \\cdot (e^{\\frac{\\Delta v}{I_{sp} \\cdot g_0}} - 1)'}}></span></p>
              <p>Risultato Esatto: <span class="font-bold underline">2.015.420 kg</span></p>
            </div>
          </div>
        {/if}
      </div>
    </div>

    <!-- Bottone -->
    <div class="mt-6 flex justify-center">
      <button 
        onclick={onStartAnalysis}
        class="group relative px-8 py-4 bg-orion-orange text-white font-bold rounded-xl overflow-hidden transition-all hover:scale-105 hover:shadow-[0_0_30px_rgba(255,62,0,0.6)] focus:outline-none focus:ring-2 focus:ring-white/50"
      >
        <span class="relative z-10 flex items-center gap-2 text-lg tracking-wider">
          CONFIGURA SERBATOI
          <svg class="w-5 h-5 group-hover:translate-x-1 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 7l5 5m0 0l-5 5m5-5H6" /></svg>
        </span>
        <div class="absolute inset-0 bg-gradient-to-r from-orange-600 to-orion-orange opacity-0 group-hover:opacity-100 transition-opacity"></div>
      </button>
    </div>
  </div>
</div>
