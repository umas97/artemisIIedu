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

<div class="max-w-4xl w-full bg-nasa-blue/10 backdrop-blur-md border border-white/10 rounded-2xl p-8 shadow-2xl animate-in fade-in zoom-in duration-500">
  <div class="flex justify-between items-start mb-6">
    <div>
      <h2 class="text-3xl font-black text-white tracking-tighter uppercase italic">Fase 2: Lancio e Propulsione</h2>
      <p class="text-nasa-blue font-mono text-sm">Obiettivo: Calcolo del Carburante Necessario (Equazione di Tsiolkovsky)</p>
    </div>
    <div class="px-3 py-1 bg-orion-orange/20 border border-orion-orange/30 rounded text-orion-orange text-[10px] font-bold uppercase tracking-widest">
      Priorità Alta
    </div>
  </div>

  <div class="grid grid-cols-1 md:grid-cols-2 gap-8 text-white/80 text-sm leading-relaxed">
    <div class="space-y-4">
      <section>
        <h3 class="text-nasa-blue font-bold uppercase mb-2 text-xs tracking-widest">Contesto Missione</h3>
        <p>
          I parametri orbitali della Fase 1 sono stati confermati. Ora dobbiamo determinare la quantità di propellente necessaria per il razzo <strong>SLS Block 1</strong>. Il lancio richiede un <span use:math={{expression: '\\Delta v'}}></span> totale di circa <strong>9.500 m/s</strong> per raggiungere l'orbita di parcheggio terrestre.
        </p>
      </section>

      <section>
        <h3 class="text-nasa-blue font-bold uppercase mb-2 text-xs tracking-widest">La Fisica della Propulsione</h3>
        <p>
          Il moto di un razzo è governato dalla conservazione della quantità di moto. Espellendo massa ad alta velocità, il razzo riceve una spinta in direzione opposta. L'equazione fondamentale di <strong>Konstantin Tsiolkovsky</strong> mette in relazione la variazione di velocità con la massa consumata:
        </p>
        <div class="my-4 p-4 bg-white/5 rounded-xl border border-white/10 flex justify-center">
          <span use:math={{expression: '\\Delta v = I_{sp} \\cdot g_0 \\cdot \\ln\\left(\\frac{m_{iniziale}}{m_{finale}}\\right)'}}></span>
        </div>
      </section>
    </div>

    <div class="space-y-4">
      <section>
        <h3 class="text-orion-orange font-bold uppercase mb-1 text-xs tracking-widest">Specifiche SLS Block 1</h3>
        <ul class="space-y-1 font-mono text-[11px] bg-black/20 p-3 rounded-lg border border-white/5">
          <li>Massa a vuoto (Dry Mass): <span use:math={{expression: 'm_{dry} = 150.000\\text{ kg}'}}></span></li>
          <li>Impulso Specifico: <span use:math={{expression: 'I_{sp} = 363\\text{ s}'}}></span></li>
          <li>Acc. Gravità: <span use:math={{expression: 'g_0 = 9,80665\\text{ m/s}^2'}}></span></li>
          <li>Delta-v Richiesto: <span use:math={{expression: '\\Delta v_{target} = 9.500\\text{ m/s}'}}></span></li>
        </ul>
      </section>

      <section>
        <h3 class="text-nasa-blue font-bold uppercase mb-2 text-xs tracking-widest">Esercizio Analitico</h3>
        <p>
          Sapendo che <span use:math={{expression: 'm_{iniziale} = m_{dry} + m_{fuel}'}}></span> e <span use:math={{expression: 'm_{finale} = m_{dry}'}}></span>, ricava la formula inversa per determinare la massa di carburante <span use:math={{expression: 'm_{fuel}'}}></span> necessaria per ottenere il <span use:math={{expression: '\\Delta v'}}></span> richiesto.
        </p>
      </section>

      {#if showTeacherMode}
        <div class="p-4 bg-orion-orange/10 border border-orion-orange/30 rounded-xl animate-pulse">
          <p class="text-orion-orange font-bold text-xs mb-2 uppercase tracking-tighter">[MODALITÀ DOCENTE]</p>
          <div class="space-y-2 font-mono text-[10px] text-orion-orange/90">
            <p>Formula Inversa: <span use:math={{expression: 'm_{fuel} = m_{dry} \\cdot (e^{\\frac{\\Delta v}{I_{sp} \\cdot g_0}} - 1)'}}></span></p>
            <p>Risultato Esatto: <span class="font-bold underline text-xs">2.015.420 kg</span></p>
          </div>
        </div>
      {/if}

      <button 
        onclick={() => missionState.update(s => ({ ...s, showBriefing: false, isAnalyzing: true }))}
        class="w-full mt-4 bg-nasa-blue hover:bg-nasa-blue/80 text-white font-bold py-4 rounded-xl transition-all shadow-lg hover:shadow-nasa-blue/20 flex items-center justify-center gap-3 group"
      >
        <span>CONFIGURA SERBATOI</span>
        <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5 group-hover:translate-x-1 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 7l5 5m0 0l-5 5m5-5H6" />
        </svg>
      </button>
    </div>
  </div>
</div>
