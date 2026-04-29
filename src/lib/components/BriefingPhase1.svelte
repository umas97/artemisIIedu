<script>
  import { math } from '../actions/math.js';

  let { onStartAnalysis } = $props();
</script>

<div class="max-w-5xl text-white p-6 bg-black/80 backdrop-blur-md rounded-2xl border border-nasa-blue/40 shadow-2xl relative overflow-hidden">
  <!-- Sfondo animato -->
  <div class="absolute inset-0 opacity-20 pointer-events-none">
    <div class="absolute top-0 right-0 w-96 h-96 bg-nasa-blue/30 rounded-full blur-3xl animate-pulse mix-blend-screen"></div>
    <div class="absolute bottom-0 left-0 w-96 h-96 bg-orion-orange/20 rounded-full blur-3xl animate-pulse mix-blend-screen" style="animation-delay: 2s;"></div>
  </div>

  <!-- Header -->
  <div class="flex items-center gap-4 mb-8 border-b border-white/10 pb-6 relative z-10">
    <div class="bg-nasa-blue p-3 rounded-xl shadow-[0_0_20px_rgba(11,61,145,0.5)]">
      <svg class="w-8 h-8 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M21 12a9 9 0 01-9 9m9-9a9 9 0 00-9-9m9 9H3m9 9a9 9 0 01-9-9m9 9c1.657 0 3-4.03 3-9s-1.343-9-3-9m0 18c-1.657 0-3-4.03-3-9s1.343-9 3-9" />
      </svg>
    </div>
    <div>
      <h2 class="text-3xl font-black tracking-tight text-transparent bg-clip-text bg-gradient-to-r from-white to-gray-400">FASE 1: CHECKOUT ORBITALE</h2>
      <p class="text-nasa-blue font-mono text-sm tracking-widest uppercase mt-1">Calcolo Parametri HEO — Leggi di Keplero</p>
    </div>
  </div>

  <div class="space-y-4 text-gray-300 leading-relaxed text-base relative z-10">
    <p>
      Comandante, benvenuto al centro di controllo della missione <strong>Artemis II</strong>. 
      Prima del lancio, dobbiamo analizzare l'orbita ad alta ellitticità (<strong>High Earth Orbit — HEO</strong>) in cui la capsula Orion verrà immessa. 
      Il tuo compito è calcolare i <strong>parametri geometrici e temporali</strong> fondamentali di questa traiettoria.
    </p>

    <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
      <!-- Colonna Sinistra: Contesto e Dati -->
      <div class="flex flex-col space-y-4">
        <div class="bg-nasa-blue/10 border border-nasa-blue/30 p-4 rounded-xl shadow-inner h-full">
          <h3 class="text-lg font-bold text-nasa-blue flex items-center gap-2 mb-2">
            <svg class="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" /></svg>
            Dati Telemetrici della Missione
          </h3>
          <ul class="space-y-2 font-mono text-sm bg-black/30 p-3 rounded-lg border border-white/5">
            <li>Raggio Terrestre: <span use:math={{expression: 'R_e = 6.371\\text{ km}'}}></span></li>
            <li>Altezza Perigeo: <span use:math={{expression: 'h_p = 192\\text{ km}'}}></span></li>
            <li>Altezza Apogeo: <span use:math={{expression: 'h_a = 70.174\\text{ km}'}}></span></li>
            <li>Costante Gravitazionale: <span use:math={{expression: 'GM = 3,986 \\times 10^{14}\\text{ m}^3/\\text{s}^2'}}></span></li>
          </ul>
          <div class="mt-3 bg-white/5 p-3 rounded-lg border-l-2 border-nasa-blue/50 italic text-xs text-gray-400">
            "L'Asse Maggiore è la distanza massima tra Apogeo e Perigeo, passante per il centro della Terra."
          </div>
        </div>
      </div>

      <!-- Colonna Destra: Sfida -->
      <div class="flex flex-col space-y-4">
        <div class="bg-gray-800/50 border border-gray-600/30 p-4 rounded-xl shadow-inner">
          <h3 class="text-lg font-bold text-white flex items-center gap-2 mb-2">
            <svg class="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" /></svg>
            1. Il Semiasse Maggiore (<span use:math={{expression: 'a'}}></span>)
          </h3>
          <p class="text-sm">
            L'altezza (<span use:math={{expression: 'h'}}></span>) è misurata dalla superficie terrestre, non dal centro. Calcola l'<strong>Asse Maggiore</strong> sommando i raggi dal centro della Terra (Perigeo + Apogeo) e ricavane la metà.
          </p>
        </div>

        <div class="bg-orion-orange/10 border border-orion-orange/30 p-4 rounded-xl shadow-inner">
          <h3 class="text-lg font-bold text-orion-orange flex items-center gap-2 mb-2">
            <svg class="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
            2. Il Periodo Orbitale (<span use:math={{expression: 'T'}}></span>)
          </h3>
          <p class="text-sm mb-3">
            La terza legge di Keplero lega geometria e tempo. Usa il semiasse maggiore appena calcolato per determinare il <strong>periodo orbitale</strong>:
          </p>
          <div class="bg-black/50 p-3 rounded text-center text-xl text-white mb-1 flex justify-center">
            <div use:math={{expression: '\\frac{T^2}{a^3} = \\frac{4\\pi^2}{GM}', displayMode: true}}></div>
          </div>
        </div>
      </div>
    </div>

    <!-- Bottone -->
    <div class="mt-6 flex justify-center">
      <button 
        onclick={onStartAnalysis}
        class="group relative px-8 py-4 bg-nasa-blue text-white font-bold rounded-xl overflow-hidden transition-all hover:scale-105 hover:shadow-[0_0_30px_rgba(11,61,145,0.6)] focus:outline-none focus:ring-2 focus:ring-white/50"
      >
        <span class="relative z-10 flex items-center gap-2 text-lg tracking-wider">
          ACCEDI AL COMPUTER DI BORDO
          <svg class="w-5 h-5 group-hover:translate-x-1 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 7l5 5m0 0l-5 5m5-5H6" /></svg>
        </span>
        <div class="absolute inset-0 bg-gradient-to-r from-blue-600 to-nasa-blue opacity-0 group-hover:opacity-100 transition-opacity"></div>
      </button>
    </div>
  </div>
</div>
