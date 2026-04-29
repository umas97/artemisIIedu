<script>
  import { missionState } from '../stores/missionStore';
  import katex from 'katex';
  import 'katex/dist/katex.min.css';

  const { onClose, onRestart } = $props();

  let confirmAction = $state(null);

  const missionData = $missionState;
  const calc = missionData.studentCalculations;
  const consts = missionData.constants;

  const totalDeltaV = Math.abs(calc.tliDeltaV || 0) + Math.abs(calc.loiDeltaV || 0) + Math.abs(calc.teiDeltaV || 0);
  
  const accel = 1.0;
  const tliDuration = Math.abs(calc.tliDeltaV || 0) / accel;
  const loiDuration = Math.abs(calc.loiDeltaV || 0) / accel;
  const teiDuration = Math.abs(calc.teiDeltaV || 0) / accel;

  const isp = missionData.rocket.isp;
  const g0 = missionData.rocket.g0;
  const m0 = missionData.rocket.dryMass + missionData.rocket.fuelMass;
  const ve = isp * g0;
  const mf_total = m0 * (1 - Math.exp(-totalDeltaV / ve));

  const nodes = [
    { id: 'TLI', name: 'Trans-Lunar Injection', dir: 'Prograde', dv: calc.tliDeltaV, dur: tliDuration, phase: 3 },
    { id: 'LOI', name: 'Lunar Orbit Insertion', dir: 'Retrogrado', dv: calc.loiDeltaV, dur: loiDuration, phase: 4 },
    { id: 'TEI', name: 'Trans-Earth Injection', dir: 'Prograde', dv: calc.teiDeltaV, dur: teiDuration, phase: 5 },
    { id: 'EI', name: 'Entry Interface', dir: 'N/A', dv: 0, dur: 0, phase: 6, angle: calc.reentryAngle }
  ];

  const handleConfirm = async () => {
    if (confirmAction === 'restart') {
      onRestart();
    } else if (confirmAction === 'quit') {
      try {
        const { getCurrentWindow } = await import('@tauri-apps/api/window');
        await getCurrentWindow().close();
      } catch {
        window.close();
      }
    }
    confirmAction = null;
  };
</script>

<div class="fixed inset-0 z-[100] bg-black/95 backdrop-blur-xl overflow-y-auto">
  <div class="max-w-5xl mx-auto p-8">
    
    <!-- Header -->
    <div class="flex items-center justify-between mb-8 border-b border-nasa-blue/40 pb-6">
      <div class="flex items-center gap-4">
        <div class="bg-nasa-blue p-3 rounded-xl shadow-[0_0_20px_rgba(0,50,160,0.5)]">
          <svg class="w-8 h-8 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
          </svg>
        </div>
        <div>
          <h1 class="text-3xl font-black tracking-tight text-transparent bg-clip-text bg-gradient-to-r from-white to-gray-400">
            ARTEMIS II — POST-FLIGHT REPORT
          </h1>
          <p class="text-nasa-blue font-mono text-sm tracking-widest uppercase mt-1">Mission Flight Plan Document</p>
        </div>
      </div>
      <button onclick={onClose} class="text-white/50 hover:text-white transition-colors text-3xl px-3 py-1 rounded-lg hover:bg-white/10">&times;</button>
    </div>

    <!-- Mission Summary -->
    <div class="bg-green-900/20 border border-green-500/30 p-5 rounded-xl mb-8">
      <div class="flex items-center gap-3 mb-2">
        <div class="w-3 h-3 bg-green-400 rounded-full animate-pulse"></div>
        <h2 class="text-lg font-bold text-green-400 uppercase tracking-wider">Stato Missione: Completata con Successo</h2>
      </div>
      <p class="text-gray-300 text-sm">L'equipaggio di Artemis II ha completato il profilo di volo cis-lunare ed è ammarato nell'Oceano Pacifico. Durata missione stimata: ~10 giorni. Tutti i parametri entro i limiti operativi.</p>
    </div>

    <!-- Sezione 1: Tabella Nodi di Manovra -->
    <div class="bg-black/60 border border-nasa-blue/30 rounded-xl p-6 mb-8">
      <h2 class="text-xl font-bold text-white mb-4 flex items-center gap-3">
        <span class="px-3 py-1 bg-nasa-blue/20 text-nasa-blue text-[10px] font-bold rounded uppercase tracking-widest border border-nasa-blue/30">Sezione 1</span>
        Tabella dei Nodi di Manovra
      </h2>
      <div class="overflow-x-auto">
        <table class="min-w-full bg-black/40 text-sm border border-white/10 rounded-lg">
          <thead>
            <tr class="bg-white/5">
              <th class="py-3 px-4 text-left border-b border-white/10 text-nasa-blue uppercase text-[10px] tracking-widest">Nodo</th>
              <th class="py-3 px-4 text-left border-b border-white/10 text-nasa-blue uppercase text-[10px] tracking-widest">Manovra</th>
              <th class="py-3 px-4 text-left border-b border-white/10 text-nasa-blue uppercase text-[10px] tracking-widest">Direzione</th>
              <th class="py-3 px-4 text-right border-b border-white/10 text-nasa-blue uppercase text-[10px] tracking-widest">Δv (m/s)</th>
              <th class="py-3 px-4 text-right border-b border-white/10 text-nasa-blue uppercase text-[10px] tracking-widest">Durata (s)</th>
            </tr>
          </thead>
          <tbody>
            {#each nodes as node, i}
              <tr class="{i % 2 === 0 ? 'bg-white/5' : ''}">
                <td class="py-3 px-4 border-b border-white/5 font-mono font-bold text-orion-orange">{node.id}</td>
                <td class="py-3 px-4 border-b border-white/5 text-gray-300">{node.name}</td>
                <td class="py-3 px-4 border-b border-white/5">
                  <span class="px-2 py-0.5 rounded text-[10px] font-bold uppercase {node.dir === 'Prograde' ? 'bg-green-900/40 text-green-400 border border-green-500/30' : node.dir === 'Retrogrado' ? 'bg-red-900/40 text-red-400 border border-red-500/30' : 'bg-gray-800 text-gray-400 border border-gray-600/30'}">
                    {node.dir}
                  </span>
                </td>
                <td class="py-3 px-4 border-b border-white/5 text-right font-mono text-white">
                  {node.id === 'EI' ? `${node.angle}°` : Math.round(node.dv)}
                </td>
                <td class="py-3 px-4 border-b border-white/5 text-right font-mono text-white">
                  {node.id === 'EI' ? '—' : Math.round(node.dur)}
                </td>
              </tr>
            {/each}
            <tr class="bg-nasa-blue/10">
              <td colspan="3" class="py-3 px-4 font-bold text-nasa-blue uppercase text-[11px] tracking-wider">Totale Δv Missione</td>
              <td class="py-3 px-4 text-right font-mono font-bold text-white text-lg">{Math.round(totalDeltaV)}</td>
              <td class="py-3 px-4 text-right font-mono text-white/50 text-xs">m/s</td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>

    <!-- Sezione 2: Consumo Carburante -->
    <div class="bg-black/60 border border-orion-orange/30 rounded-xl p-6 mb-8">
      <h2 class="text-xl font-bold text-white mb-4 flex items-center gap-3">
        <span class="px-3 py-1 bg-orion-orange/20 text-orion-orange text-[10px] font-bold rounded uppercase tracking-widest border border-orion-orange/30">Sezione 2</span>
        Consumo di Propellente (Tsiolkovsky)
      </h2>
      <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div class="space-y-3">
          <div class="bg-black/50 p-4 rounded-lg text-center">
            {@html katex.renderToString("\\Delta v_{\\text{tot}} = " + Math.round(totalDeltaV) + " \\text{ m/s}", { throwOnError: false, displayMode: true })}
          </div>
          <div class="bg-black/50 p-4 rounded-lg text-center">
            {@html katex.renderToString("m_{\\text{fuel}} = m_0 \\left(1 - e^{-\\Delta v / v_e}\\right)", { throwOnError: false, displayMode: true })}
          </div>
        </div>
        <div class="space-y-3">
          <div class="flex justify-between items-end bg-white/5 p-3 rounded-lg">
            <span class="text-[10px] text-white/50 uppercase">Massa iniziale (m₀)</span>
            <span class="font-mono text-white text-lg">{(m0 / 1000).toFixed(0)} <span class="text-[10px] text-nasa-blue">ton</span></span>
          </div>
          <div class="flex justify-between items-end bg-white/5 p-3 rounded-lg">
            <span class="text-[10px] text-white/50 uppercase">Velocità di scarico (vₑ)</span>
            <span class="font-mono text-white text-lg">{Math.round(ve)} <span class="text-[10px] text-nasa-blue">m/s</span></span>
          </div>
          <div class="flex justify-between items-end bg-orion-orange/10 border border-orion-orange/30 p-3 rounded-lg">
            <span class="text-[10px] text-orion-orange uppercase font-bold">Propellente Consumato</span>
            <span class="font-mono text-orion-orange text-xl font-bold">{(mf_total / 1000).toFixed(1)} <span class="text-[10px]">ton</span></span>
          </div>
        </div>
      </div>
    </div>

    <!-- Sezione 3: Grafico della Traiettoria SVG -->
    <div class="bg-black/60 border border-nasa-blue/30 rounded-xl p-6 mb-8">
      <h2 class="text-xl font-bold text-white mb-4 flex items-center gap-3">
        <span class="px-3 py-1 bg-nasa-blue/20 text-nasa-blue text-[10px] font-bold rounded uppercase tracking-widest border border-nasa-blue/30">Sezione 3</span>
        Profilo di Traiettoria Artemis II
      </h2>
      <p class="text-gray-400 text-xs mb-4 italic">Traiettoria ibrida a ritorno libero (Free Return Trajectory) — Schema basato su dati NASA/JSC</p>
      
      <div class="bg-black rounded-xl border border-white/10 p-4 flex justify-center">
        <svg viewBox="0 0 800 500" class="w-full max-w-3xl" xmlns="http://www.w3.org/2000/svg">
          <!-- Sfondo spazio -->
          <defs>
            <radialGradient id="earthGlow" cx="50%" cy="50%" r="50%">
              <stop offset="0%" stop-color="#4488ff" stop-opacity="0.3"/>
              <stop offset="100%" stop-color="#4488ff" stop-opacity="0"/>
            </radialGradient>
            <radialGradient id="moonGlow" cx="50%" cy="50%" r="50%">
              <stop offset="0%" stop-color="#cccccc" stop-opacity="0.2"/>
              <stop offset="100%" stop-color="#cccccc" stop-opacity="0"/>
            </radialGradient>
            <filter id="glow">
              <feGaussianBlur stdDeviation="2" result="blur"/>
              <feMerge><feMergeNode in="blur"/><feMergeNode in="SourceGraphic"/></feMerge>
            </filter>
          </defs>

          <!-- Terra -->
          <circle cx="130" cy="250" r="60" fill="url(#earthGlow)"/>
          <circle cx="130" cy="250" r="35" fill="#1a4a8a" stroke="#4488ff" stroke-width="1.5"/>
          <circle cx="130" cy="250" r="35" fill="none" stroke="#66aaff" stroke-width="0.5" stroke-dasharray="3,3"/>
          <text x="130" y="305" text-anchor="middle" fill="#4488ff" font-size="11" font-family="monospace" font-weight="bold">TERRA</text>

          <!-- Luna -->
          <circle cx="670" cy="250" r="40" fill="url(#moonGlow)"/>
          <circle cx="670" cy="250" r="20" fill="#888888" stroke="#aaaaaa" stroke-width="1.5"/>
          <text x="670" y="290" text-anchor="middle" fill="#aaaaaa" font-size="11" font-family="monospace" font-weight="bold">LUNA</text>

          <!-- Orbita di parcheggio terrestre -->
          <circle cx="130" cy="250" r="50" fill="none" stroke="#4488ff" stroke-width="0.8" stroke-dasharray="4,4" opacity="0.5"/>
          <text x="130" y="192" text-anchor="middle" fill="#4488ff" font-size="8" opacity="0.6">LEO 192 km</text>

          <!-- Orbita lunare -->
          <circle cx="670" cy="250" r="32" fill="none" stroke="#aaaaaa" stroke-width="0.8" stroke-dasharray="4,4" opacity="0.5"/>

          <!-- Traiettoria di andata (TLI → LOI) - curva superiore -->
          <path d="M 175 225 C 300 80, 550 80, 645 230" fill="none" stroke="#ff3e00" stroke-width="2.5" filter="url(#glow)">
            <animate attributeName="stroke-dashoffset" from="600" to="0" dur="3s" fill="freeze"/>
          </path>
          <!-- Frecce direzionali andata -->
          <polygon points="400,108 395,118 405,118" fill="#ff3e00" opacity="0.8"/>

          <!-- Traiettoria di ritorno (TEI → EI) - curva inferiore -->
          <path d="M 645 270 C 550 420, 300 420, 175 275" fill="none" stroke="#00cc66" stroke-width="2.5" filter="url(#glow)">
            <animate attributeName="stroke-dashoffset" from="600" to="0" dur="3s" begin="1.5s" fill="freeze"/>
          </path>
          <!-- Frecce direzionali ritorno -->
          <polygon points="400,395 405,385 395,385" fill="#00cc66" opacity="0.8"/>

          <!-- Nodo 1: TLI -->
          <circle cx="180" cy="220" r="6" fill="#ff3e00" stroke="white" stroke-width="1.5" filter="url(#glow)"/>
          <text x="195" y="210" fill="#ff3e00" font-size="10" font-weight="bold" font-family="monospace">TLI</text>
          <text x="195" y="222" fill="#ff8855" font-size="8" font-family="monospace">{Math.round(calc.tliDeltaV || 0)} m/s</text>

          <!-- Nodo 2: LOI -->
          <circle cx="645" cy="228" r="6" fill="#ff6644" stroke="white" stroke-width="1.5" filter="url(#glow)"/>
          <text x="600" y="218" fill="#ff6644" font-size="10" font-weight="bold" font-family="monospace" text-anchor="end">LOI</text>
          <text x="600" y="230" fill="#ff8855" font-size="8" font-family="monospace" text-anchor="end">{Math.round(calc.loiDeltaV || 0)} m/s</text>

          <!-- Nodo 3: TEI -->
          <circle cx="645" cy="272" r="6" fill="#00cc66" stroke="white" stroke-width="1.5" filter="url(#glow)"/>
          <text x="600" y="280" fill="#00cc66" font-size="10" font-weight="bold" font-family="monospace" text-anchor="end">TEI</text>
          <text x="600" y="292" fill="#44dd88" font-size="8" font-family="monospace" text-anchor="end">{Math.round(calc.teiDeltaV || 0)} m/s</text>

          <!-- Nodo 4: Entry Interface -->
          <circle cx="175" cy="278" r="6" fill="#ffaa00" stroke="white" stroke-width="1.5" filter="url(#glow)"/>
          <text x="195" y="285" fill="#ffaa00" font-size="10" font-weight="bold" font-family="monospace">EI ({calc.reentryAngle}°)</text>
          <text x="195" y="297" fill="#ffcc44" font-size="8" font-family="monospace">Splashdown</text>

          <!-- Legenda -->
          <rect x="20" y="430" width="760" height="55" rx="8" fill="black" fill-opacity="0.6" stroke="white" stroke-opacity="0.1"/>
          <line x1="40" y1="455" x2="70" y2="455" stroke="#ff3e00" stroke-width="2"/>
          <text x="78" y="459" fill="white" font-size="9" font-family="monospace">Traiettoria Cis-Lunare (Andata)</text>
          <line x1="310" y1="455" x2="340" y2="455" stroke="#00cc66" stroke-width="2"/>
          <text x="348" y="459" fill="white" font-size="9" font-family="monospace">Traiettoria di Ritorno</text>
          <circle cx="580" cy="455" r="4" fill="#ffaa00"/>
          <text x="590" y="459" fill="white" font-size="9" font-family="monospace">Nodo di Manovra</text>
        </svg>
      </div>
    </div>

    <!-- Sezione 4: Dati Rientro -->
    <div class="bg-black/60 border border-yellow-500/30 rounded-xl p-6 mb-8">
      <h2 class="text-xl font-bold text-white mb-4 flex items-center gap-3">
        <span class="px-3 py-1 bg-yellow-500/20 text-yellow-400 text-[10px] font-bold rounded uppercase tracking-widest border border-yellow-500/30">Sezione 4</span>
        Parametri di Rientro Atmosferico
      </h2>
      <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div class="bg-white/5 p-4 rounded-lg text-center">
          <div class="text-[10px] text-white/50 uppercase tracking-wider mb-2">Angolo di Rientro</div>
          <div class="text-3xl font-mono font-bold text-yellow-400">{calc.reentryAngle}°</div>
          <div class="text-[10px] text-white/30 mt-1">Corridoio: -5.8° / -7.2°</div>
        </div>
        <div class="bg-white/5 p-4 rounded-lg text-center">
          <div class="text-[10px] text-white/50 uppercase tracking-wider mb-2">Apertura Drogue Chutes</div>
          <div class="text-3xl font-mono font-bold text-white">{calc.parachuteDrogueAltitude} <span class="text-sm text-nasa-blue">m</span></div>
          <div class="text-[10px] text-white/30 mt-1">Target: ~7000 m</div>
        </div>
        <div class="bg-white/5 p-4 rounded-lg text-center">
          <div class="text-[10px] text-white/50 uppercase tracking-wider mb-2">Area Main Chutes</div>
          <div class="text-3xl font-mono font-bold text-white">{Math.round(calc.parachuteArea)} <span class="text-sm text-nasa-blue">m²</span></div>
          <div class="text-[10px] text-white/30 mt-1">Target: ~832 m²</div>
        </div>
      </div>
    </div>

    <!-- Bottoni finali -->
    <div class="flex flex-wrap justify-center gap-4 mt-8 pb-8">
      <button 
        onclick={onClose}
        class="group relative px-8 py-4 bg-nasa-blue text-white font-bold rounded-xl overflow-hidden transition-all hover:scale-105 hover:shadow-[0_0_30px_rgba(0,50,160,0.6)] uppercase tracking-widest text-[11px] border border-white/10"
      >
        <span class="relative z-10 flex items-center gap-2">
          <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" /></svg>
          Chiudi Report
        </span>
        <div class="absolute inset-0 bg-gradient-to-r from-blue-600 to-nasa-blue opacity-0 group-hover:opacity-100 transition-opacity"></div>
      </button>
      <button 
        onclick={() => window.print()}
        class="group relative px-8 py-4 bg-white/10 text-white font-bold rounded-xl overflow-hidden transition-all hover:scale-105 hover:bg-white/20 uppercase tracking-widest text-[11px] border border-white/10"
      >
        <span class="relative z-10 flex items-center gap-2">
          <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" /></svg>
          Stampa / PDF
        </span>
      </button>
      <button 
        onclick={() => confirmAction = 'restart'}
        class="group relative px-8 py-4 bg-orion-orange text-white font-bold rounded-xl overflow-hidden transition-all hover:scale-105 hover:shadow-[0_0_30px_rgba(255,62,0,0.5)] uppercase tracking-widest text-[11px] border border-white/10"
      >
        <span class="relative z-10 flex items-center gap-2">
          <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" /></svg>
          Nuova Missione
        </span>
        <div class="absolute inset-0 bg-gradient-to-r from-orange-600 to-orion-orange opacity-0 group-hover:opacity-100 transition-opacity"></div>
      </button>
      <button 
        onclick={() => confirmAction = 'quit'}
        class="group relative px-8 py-4 bg-red-800/80 text-white font-bold rounded-xl overflow-hidden transition-all hover:scale-105 hover:shadow-[0_0_30px_rgba(220,38,38,0.4)] uppercase tracking-widest text-[11px] border border-red-500/30"
      >
        <span class="relative z-10 flex items-center gap-2">
          <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" /></svg>
          Chiudi App
        </span>
        <div class="absolute inset-0 bg-gradient-to-r from-red-700 to-red-900 opacity-0 group-hover:opacity-100 transition-opacity"></div>
      </button>
    </div>

  </div>
</div>

{#if confirmAction}
  <div style="position:fixed; top:0; left:0; right:0; bottom:0; z-index:9999; background:rgba(0,0,0,0.85); display:flex; align-items:center; justify-content:center;">
    <div class="bg-gray-900 border border-white/20 rounded-2xl p-8 shadow-2xl" style="max-width:450px; width:90%;">
      <div class="flex items-center gap-3 mb-4">
        <div class="w-10 h-10 rounded-full flex items-center justify-center {confirmAction === 'restart' ? 'bg-orion-orange/20' : 'bg-red-600/20'}">
          <svg class="w-5 h-5 {confirmAction === 'restart' ? 'text-orion-orange' : 'text-red-400'}" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            {#if confirmAction === 'restart'}
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            {:else}
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z" />
            {/if}
          </svg>
        </div>
        <h3 class="text-xl font-bold text-white">
          {confirmAction === 'restart' ? 'Nuova Missione?' : 'Chiudere l\'applicazione?'}
        </h3>
      </div>
      <p class="text-gray-400 text-sm mb-6 leading-relaxed">
        {confirmAction === 'restart' 
          ? 'Tutti i calcoli e i progressi della missione corrente verranno azzerati. Tornerai alla Fase 1 per iniziare una nuova simulazione Artemis II.'
          : 'Stai per chiudere l\'applicazione. Assicurati di aver stampato o salvato il Flight Plan se ne hai bisogno.'}
      </p>
      <div class="flex gap-3 justify-end">
        <button 
          onclick={() => confirmAction = null}
          class="px-6 py-3 bg-white/10 text-white font-bold rounded-lg hover:bg-white/20 transition-all uppercase tracking-wider text-[11px] border border-white/10"
        >
          Annulla
        </button>
        <button 
          onclick={handleConfirm}
          class="px-6 py-3 font-bold rounded-lg transition-all uppercase tracking-wider text-[11px] border {confirmAction === 'restart' ? 'bg-orion-orange text-white hover:bg-orange-600 border-white/10' : 'bg-red-600 text-white hover:bg-red-500 border-red-400/30'}"
        >
          {confirmAction === 'restart' ? 'Sì, Ricomincia' : 'Sì, Chiudi'}
        </button>
      </div>
    </div>
  </div>
{/if}
