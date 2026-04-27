<script>
  import { missionState } from '../stores/missionStore';
  import { onMount } from 'svelte';
  import { math } from '../actions/math.js';
  export let onBack;

  let deltaVInput = "";
  let isConfirmed = false;
  let isValidating = false;
  let teacherMode = false;
  let showHints = false;

  const confirmCalculation = () => {
    if (!deltaVInput) return;
    isValidating = true;
    
    setTimeout(() => {
      const val = parseFloat(deltaVInput);
      missionState.update(s => ({
        ...s,
        studentCalculations: { ...s.studentCalculations, isValid: true, teiDeltaV: val }
      }));
      isConfirmed = true;
      isValidating = false;
    }, 1000);
  };

  const startSimulation = () => {
    missionState.update(s => ({ ...s, isAnalyzing: false, showBriefing: false, status: "Esecuzione Manovra TEI" }));
  };

  // Shortcut Docente: Ctrl + Shift + D
  onMount(() => {
    const handleKeyDown = (e) => {
      if (e.ctrlKey && e.shiftKey && e.key.toLowerCase() === 'd') {
        e.preventDefault();
        teacherMode = !teacherMode;
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  });
</script>

<div class="w-full max-w-4xl bg-black/90 backdrop-blur-2xl border border-nasa-blue/40 rounded-3xl overflow-hidden shadow-2xl flex h-[600px] text-white animate-in zoom-in-95 duration-300 relative">
  
  {#if showHints}
    <div class="absolute inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-12">
      <div class="bg-nasa-blue/20 border border-nasa-blue/40 p-8 rounded-3xl max-w-lg shadow-2xl animate-in fade-in zoom-in-95">
        <div class="flex justify-between items-start mb-6">
          <h3 class="text-xl font-black uppercase tracking-tighter italic text-nasa-blue">Guida al Ragionamento</h3>
          <button onclick={() => showHints = false} class="text-gray-500 hover:text-white">&times;</button>
        </div>
        <ul class="space-y-4 text-sm text-gray-300 leading-relaxed italic">
          <li class="flex gap-3">
            <span class="text-nasa-blue font-bold">1.</span>
            <p>La navicella si trova attualmente in un'orbita circolare lunare a <span class="text-white font-bold">100 km</span> di altezza (r = 1.837.000 m).</p>
          </li>
          <li class="flex gap-3">
            <span class="text-nasa-blue font-bold">2.</span>
            <div class="flex-1">
              <p>Calcola o ricorda la velocità circolare (v_circ) per questa quota.</p>
            </div>
          </li>
          <li class="flex gap-3">
            <span class="text-nasa-blue font-bold">3.</span>
            <div class="flex-1">
              <p>Per fuggire alla gravità, la velocità deve raggiungere la <span class="text-white font-bold">velocità di fuga</span> (v_esc = v_circ &times; 1,414).</p>
            </div>
          </li>
          <li class="flex gap-3">
            <span class="text-nasa-blue font-bold">4.</span>
            <p>Il <span class="text-white font-bold">Δv</span> è l'accelerazione necessaria: la differenza tra la v_esc calcolata e la tua v_circ attuale.</p>
          </li>
        </ul>
        <button 
          onclick={() => showHints = false}
          class="mt-8 w-full py-3 bg-nasa-blue/30 border border-nasa-blue/50 rounded-xl uppercase text-[10px] font-black tracking-widest hover:bg-nasa-blue transition-all"
        >
          Ricevuto, torniamo ai calcoli
        </button>
      </div>
    </div>
  {/if}

  <!-- Sidebar Dati -->
  <div class="w-1/3 bg-nasa-blue/5 border-r border-white/10 p-8">
    <div class="flex items-center justify-between mb-6">
      <h3 class="text-nasa-blue font-black uppercase text-xs tracking-widest">Dati di Missione</h3>
      <button 
        onclick={() => showHints = true}
        class="w-6 h-6 rounded-full border border-nasa-blue/40 flex items-center justify-center text-[10px] text-nasa-blue hover:bg-nasa-blue hover:text-white transition-all shadow-lg shadow-blue-900/20 font-serif italic"
        title="Ottieni Suggerimenti"
      >
        i
      </button>
    </div>
    
    <div class="space-y-4 font-mono text-[11px]">
      <div class="p-3 bg-white/5 rounded-lg border border-white/5">
        <p class="text-gray-500 mb-1">Raggio Luna (RM)</p>
        <p class="text-white">1.737.000 m</p>
      </div>
      <div class="p-3 bg-white/5 rounded-lg border border-white/5">
        <p class="text-gray-500 mb-1">Quota Attuale (h)</p>
        <p class="text-white">100.000 m</p>
      </div>
      <div class="p-3 bg-white/5 rounded-lg border border-white/5">
        <p class="text-gray-500 mb-1">GM Lunare</p>
        <p class="text-white">4,9048e12 m³/s²</p>
      </div>
      <div class="p-3 bg-white/5 rounded-lg border border-white/5">
        <p class="text-gray-500 mb-1">Velocità Attuale (v_circ)</p>
        <p class="text-white">1.634 m/s</p>
      </div>

      {#if teacherMode}
        <div class="mt-8 p-4 bg-yellow-500/10 border border-yellow-500/40 rounded-xl animate-pulse">
          <p class="text-yellow-500 font-black text-[9px] uppercase mb-2">Modalità Docente</p>
          <p class="text-white text-[10px]">Δv Target (spinta TEI): <span class="text-yellow-400">~676 m/s</span></p>
          <p class="text-gray-400 text-[9px] mt-1 italic">V_esc = 2310 m/s | V_circ = 1634 m/s</p>
        </div>
      {/if}
    </div>
  </div>

  <!-- Terminale di Calcolo -->
  <div class="flex-1 p-8 flex flex-col justify-between">
    <div>
      <div class="flex justify-between items-center mb-8">
        <h2 class="text-xl font-black uppercase tracking-tighter italic text-white/90">Terminale Calcolo TEI</h2>
        <button onclick={onBack} class="text-[10px] uppercase tracking-widest text-gray-500 hover:text-white transition-colors">Indietro</button>
      </div>

      <div class="space-y-6">
        <div class="bg-black border border-white/10 p-6 rounded-2xl shadow-inner relative overflow-hidden group">
          <div class="absolute inset-0 bg-nasa-blue/5 opacity-0 group-focus-within:opacity-100 transition-opacity"></div>
          
          <label for="deltaV" class="block text-[10px] uppercase tracking-widest text-nasa-blue font-bold mb-4 relative z-10">
            Delta-v per uscita dall'orbita lunare (m/s)
          </label>
          <div class="flex gap-4 relative z-10">
            <input 
              id="deltaV"
              type="number" 
              bind:value={deltaVInput}
              placeholder="Inserisci Delta-v (es. 676)"
              class="flex-1 bg-white/5 border border-white/10 rounded-xl px-4 py-3 font-mono text-xl focus:outline-none focus:border-nasa-blue transition-all"
            />
            <button 
              onclick={confirmCalculation}
              disabled={isValidating || !deltaVInput}
              class="bg-nasa-blue px-6 py-3 rounded-xl font-bold uppercase text-xs tracking-widest hover:bg-blue-600 transition-all disabled:opacity-50 shadow-lg shadow-blue-900/40"
            >
              {isValidating ? 'Registrazione...' : 'Conferma'}
            </button>
          </div>
        </div>

        {#if isConfirmed}
          <div class="p-4 rounded-xl border border-green-500/30 bg-green-500/10 text-green-400 animate-in fade-in slide-in-from-top-2 flex items-center gap-3">
            <div class="w-2 h-2 bg-green-500 rounded-full animate-ping"></div>
            <p class="text-xs font-mono uppercase tracking-widest">Sequenza TEI Validata. Rotta di fuga impostata.</p>
          </div>
        {/if}
      </div>
    </div>

    {#if isConfirmed}
      <button 
        onclick={startSimulation}
        class="w-full bg-orion-orange text-white py-5 rounded-2xl font-black uppercase tracking-[0.2em] text-sm transition-all transform hover:scale-[1.02] active:scale-95 shadow-xl shadow-orange-900/40 flex items-center justify-center gap-3"
      >
        <span>Esegui Accensione (Prograde Burn)</span>
        <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="3" d="M14 5l7 7m0 0l-7 7m7-7H3" />
        </svg>
      </button>
    {/if}
  </div>
</div>
