<script>
  import { missionState } from '../stores/missionStore.js';
  import { math } from '../actions/math.js';
  import { onMount } from 'svelte';

  let { onBack } = $props();
  let studentFuel = $state('');
  let feedback = $state('');
  let success = $state(false);
  let showInfo = $state(false);
  let showTeacherMode = $state(false);

  const constants = $missionState.rocket;

  onMount(() => {
    const handleKeydown = (e) => {
      if (e.ctrlKey && e.shiftKey && e.code === 'KeyD') {
        showTeacherMode = !showTeacherMode;
      }
    };
    window.addEventListener('keydown', handleKeydown);
    return () => window.removeEventListener('keydown', handleKeydown);
  });

  const checkCalculations = () => {
    const { dryMass, isp, g0, targetDeltaV } = constants;
    const realFuel = dryMass * (Math.exp(targetDeltaV / (isp * g0)) - 1);
    
    const inputFuel = parseFloat(studentFuel);
    const margin = 0.05; 

    const fuelOk = Math.abs(inputFuel - realFuel) / realFuel < margin;

    if (fuelOk) {
      feedback = "Caricamento propellente completato! Il Delta-v è sufficiente per l'iniezione orbitale.";
      success = true;
      missionState.update(state => ({
        ...state,
        studentCalculations: { ...state.studentCalculations, requiredFuel: inputFuel, isValid: true },
        status: "Pronto al Lancio"
      }));
    } else {
      success = false;
      feedback = inputFuel < realFuel 
        ? "Carburante insufficiente! Il razzo ricadrebbe a terra prima di raggiungere la velocità orbitale." 
        : "Carico eccessivo! Il razzo è troppo pesante per sollevarsi dalla rampa con la spinta disponibile.";
    }
  };
</script>

<div class="max-w-md w-full bg-black/80 backdrop-blur-xl border border-white/10 rounded-2xl p-6 shadow-2xl animate-in slide-in-from-right-8 duration-500">
  <div class="flex items-center gap-4 mb-8">
    <button 
      onclick={() => missionState.update(s => ({ ...s, showBriefing: true, isAnalyzing: false }))}
      class="p-2 hover:bg-white/10 rounded-full transition-colors text-nasa-blue"
      title="Torna alla teoria"
    >
      <svg xmlns="http://www.w3.org/2000/svg" class="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 19l-7-7m0 0l7-7m-7 7h18" />
      </svg>
    </button>
    <h2 class="text-xl font-bold text-white uppercase tracking-tighter">Computer di Bordo</h2>
    <div class="ml-auto">
      <button 
        onclick={() => showInfo = !showInfo}
        class="p-2 hover:bg-nasa-blue/20 rounded-full transition-colors text-nasa-blue border border-nasa-blue/30"
      >
        <span class="font-bold">i</span>
      </button>
    </div>
  </div>

  {#if showInfo}
    <div class="mb-8 p-6 bg-nasa-blue/10 border border-nasa-blue/30 rounded-xl text-xs space-y-4 animate-in fade-in slide-in-from-top-4">
      <div>
        <span class="text-nasa-blue font-bold uppercase tracking-wider">Parametri Tecnici:</span>
        <ul class="font-mono mt-2 space-y-1 opacity-90 border-l border-nasa-blue/30 pl-3">
          <li>m_dry = {constants.dryMass} kg</li>
          <li>Isp = {constants.isp} s</li>
          <li>g0 = {constants.g0} m/s²</li>
          <li>Δv_target = {constants.targetDeltaV} m/s</li>
        </ul>
      </div>
      <div>
        <span class="text-nasa-blue font-bold uppercase tracking-wider">Suggerimenti:</span>
        <ul class="mt-2 space-y-2 opacity-80 italic">
          <li>1. m_iniziale = m_dry + m_fuel</li>
          <li>2. m_finale = m_dry</li>
          <li>3. Usa la funzione inversa dell'esponenziale (e^x).</li>
        </ul>
      </div>
    </div>
  {/if}

  {#if showTeacherMode}
    <div class="mb-8 p-6 bg-orion-orange/10 border border-orion-orange/30 rounded-xl animate-in slide-in-from-left-4">
      <p class="text-orion-orange font-bold text-[10px] uppercase mb-4 tracking-widest">[MODALITÀ DOCENTE]</p>
      <div class="grid grid-cols-1 gap-4">
        <div class="p-3 bg-black/40 rounded-lg border border-orion-orange/20">
          <p class="text-[10px] text-orion-orange/70 mb-1">Massa Carburante Calcolata (kg):</p>
          <span class="text-orion-orange text-xs font-bold font-mono">
            {(constants.dryMass * (Math.exp(constants.targetDeltaV / (constants.isp * constants.g0)) - 1)).toFixed(0)} kg
          </span>
        </div>
      </div>
    </div>
  {/if}

  <div class="space-y-6">
    <div class="space-y-2">
      <label for="fuelMass" class="block text-xs text-nasa-blue font-bold tracking-widest pl-1 uppercase">Massa Propellente (m_fuel) [kg]</label>
      <input 
        id="fuelMass"
        type="number" 
        bind:value={studentFuel}
        placeholder="Valore in kg..."
        class="w-full bg-white/5 border border-white/10 rounded-xl p-4 text-white font-mono focus:border-nasa-blue focus:bg-nasa-blue/5 outline-none transition-all"
      />
    </div>

    <button 
      onclick={checkCalculations}
      class="w-full bg-nasa-blue hover:bg-nasa-blue/80 text-white font-bold py-4 rounded-xl transition-all shadow-lg shadow-nasa-blue/20 uppercase tracking-widest text-sm"
    >
      Verifica Sistemi
    </button>

    {#if feedback}
      <div class="p-4 rounded-xl border text-xs font-medium animate-in zoom-in duration-300 {success ? 'bg-green-500/10 border-green-500/50 text-green-400' : 'bg-red-500/10 border-red-500/50 text-red-400'}">
        <div class="flex gap-3">
          {#if success}
            <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7" />
            </svg>
          {:else}
            <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
          {/if}
          <p>{feedback}</p>
        </div>
      </div>
    {/if}

    {#if success}
      <button 
        onclick={() => missionState.update(s => ({ ...s, isAnalyzing: false, status: "T-Minus 10: Countdown avviato" }))}
        class="w-full bg-orion-orange hover:bg-orange-600 text-white py-4 rounded-xl font-black transition-all transform hover:scale-[1.02] active:scale-95 uppercase tracking-widest text-xs shadow-xl animate-pulse"
      >
        Conferma e Procedi al Lancio
      </button>
    {/if}
  </div>
</div>
