<script>
  import { onMount } from 'svelte';
  import { missionState } from '../stores/missionStore';
  
  let studentA = "";
  let studentT = "";
  let feedback = "";
  let success = false;
  let showInfo = false;
  let showSecretFormulas = false;

  $: ({ constants } = $missionState);

  const checkCalculations = () => {
    const realA = ((constants.hp + constants.RE) + (constants.ha + constants.RE)) / 2;
    const realT = 2 * Math.PI * Math.sqrt(Math.pow(realA, 3) / constants.GM);
    
    const inputA = parseFloat(studentA);
    const inputT = parseFloat(studentT);
    const margin = 0.05; 
    const aOk = Math.abs(inputA - realA) / realA < margin;
    const tOk = Math.abs(inputT - realT) / realT < margin;

    if (aOk && tOk) {
      feedback = "Ottimo lavoro! I parametri orbitali sono corretti. La traiettoria è stabile.";
      success = true;
      missionState.update(state => ({
        ...state,
        studentCalculations: { semiMajorAxis: inputA, orbitalPeriod: inputT, requiredFuel: 0, isValid: true },
        status: "Orbita Verificata"
      }));
    } else {
      success = false;
      let messages = [];
      
      if (!aOk) {
        messages.push(inputA < realA 
          ? "Il semiasse inserito è troppo piccolo: l'energia meccanica totale non sarebbe sufficiente a mantenere la quota. Orion incontrerebbe gli strati densi dell'atmosfera al perigeo, bruciando per l'attrito cinetico." 
          : "Il semiasse è eccessivo: l'energia orbitale supererebbe quella di legame gravitazionale. La capsula non rimarrebbe in orbita e verrebbe scagliata nello spazio profondo come un proiettile interplanetario.");
      }
      
      if (!tOk) {
        messages.push(inputT < realT 
          ? "Il periodo è troppo breve: questo implicherebbe una velocità orbitale eccessiva per questa quota. Secondo la fisica di Keplero, la forza centrifuga supererebbe l'attrazione terrestre, rendendo la traiettoria instabile." 
          : "Il periodo è troppo lungo: la velocità orbitale calcolata è insufficiente. Senza una spinta adeguata per contrastare la gravità, la Terra attirerebbe inesorabilmente la capsula verso un impatto al suolo.");
      }
      
      feedback = messages.join(" Inoltre, ");
    }
  };

  const closePanel = () => {
    missionState.update(state => ({ 
      ...state, 
      isAnalyzing: false,
      phase1Complete: true,
      status: "Orbita Confermata"
    }));
  };

  const goBack = () => {
    missionState.update(state => ({ ...state, isAnalyzing: false, showBriefing: true }));
  };

  const handleKeyDown = (event) => {
    if (event.ctrlKey && event.shiftKey && event.key.toLowerCase() === 'd') {
      event.preventDefault();
      showSecretFormulas = !showSecretFormulas;
    }
  };

  onMount(() => {
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  });
</script>

<div class="max-w-md bg-black/95 backdrop-blur-xl border border-nasa-blue/40 p-10 rounded-3xl shadow-[0_0_50px_rgba(0,50,160,0.3)] text-lunar-gray">
  <div class="flex items-center gap-4 mb-8">
    <button 
      on:click={goBack}
      class="w-10 h-10 rounded-full border border-gray-600 flex items-center justify-center text-gray-400 hover:border-white hover:text-white transition-all hover:bg-white/5"
      title="Torna al Briefing"
    >
      ←
    </button>
    
    <h3 class="text-xl font-extrabold text-white uppercase tracking-widest flex-1">
      Terminal Analisi 
    </h3>

    <div class="flex gap-3">
      <button 
        on:click={() => showInfo = !showInfo}
        class="w-10 h-10 rounded-full border border-nasa-blue flex items-center justify-center text-nasa-blue hover:bg-nasa-blue hover:text-white transition-all shadow-[0_0_15px_rgba(0,50,160,0.2)]"
        title="Suggerimenti per il ragionamento"
      >
        i
      </button>
      <button 
        on:click={closePanel} 
        class="w-10 h-10 flex items-center justify-center text-gray-500 hover:text-white text-3xl transition-colors"
      >
        &times;
      </button>
    </div>
  </div>

  {#if showInfo}
    <div class="mb-8 p-6 bg-nasa-blue/10 border border-nasa-blue/30 rounded-xl text-xs space-y-4 animate-in fade-in slide-in-from-top-4">
      <div>
        <span class="text-nasa-blue font-bold uppercase tracking-wider">Costanti Fisiche:</span>
        <ul class="font-mono mt-2 space-y-1 opacity-90 border-l border-nasa-blue/30 pl-3">
          <li>Re = {constants.RE / 1000} km</li>
          <li>GM = {constants.GM.toExponential(3)} m³/s²</li>
          <li>hp = {constants.hp / 1000} km</li>
          <li>ha = {constants.ha / 1000} km</li>
        </ul>
      </div>
      <div>
        <span class="text-nasa-blue font-bold uppercase tracking-wider">Suggerimenti:</span>
        <p class="mt-2 opacity-90 leading-relaxed italic">
          1. L'asse maggiore attraversa l'intera Terra. Somma le distanze dal centro per entrambi i punti estremi.<br>
          2. Il semiasse (a) è esattamente la metà dell'asse maggiore.<br>
          3. Per il periodo, ricorda che GM è il legame tra spazio (a³) e tempo (T²).
        </p>
      </div>
    </div>
  {/if}

  {#if showSecretFormulas}
    <div class="mb-8 p-6 bg-orion-orange/20 border border-orion-orange/40 rounded-xl text-[11px] space-y-3 animate-pulse shadow-[0_0_20px_rgba(255,62,0,0.1)]">
      <span class="text-orion-orange font-bold uppercase tracking-widest block">[MODALITÀ DOCENTE]</span>
      <div class="space-y-4">
        <p class="font-mono text-white leading-loose bg-black/40 p-3 rounded border border-orion-orange/20">
          a = ((hp + Re) + (ha + Re)) / 2 [m]<br>
          T = 2 * PI * sqrt(a³ / GM) [s]
        </p>
        <div class="grid grid-cols-2 gap-2 text-white/70 font-mono text-[10px]">
          <div class="bg-black/60 p-2 rounded">
            RISULTATO a:<br>
            <span class="text-orion-orange text-xs font-bold">
              {(((constants.hp + constants.RE) + (constants.ha + constants.RE)) / 2).toFixed(0)} m
            </span>
          </div>
          <div class="bg-black/60 p-2 rounded">
            RISULTATO T:<br>
            <span class="text-orion-orange text-xs font-bold">
              {(2 * Math.PI * Math.sqrt(Math.pow(((constants.hp + constants.RE) + (constants.ha + constants.RE)) / 2, 3) / constants.GM)).toFixed(0)} s
            </span>
          </div>
        </div>
      </div>
    </div>
  {/if}

  <div class="space-y-6">
    <div class="space-y-2">
      <label for="semiMajorAxis" class="block text-xs text-nasa-blue font-bold tracking-widest pl-1">SEMIASSE MAGGIORE (a) [m]</label>
      <input 
        id="semiMajorAxis"
        type="number" 
        bind:value={studentA}
        placeholder="Valore in m..."
        class="w-full bg-white/5 border border-white/10 rounded-xl p-4 text-white font-mono focus:border-nasa-blue focus:bg-nasa-blue/5 outline-none transition-all"
      />
    </div>

    <div class="space-y-2">
      <label for="orbitalPeriod" class="block text-xs text-nasa-blue font-bold tracking-widest pl-1">PERIODO ORBITALE (T) [s]</label>
      <input 
        id="orbitalPeriod"
        type="number" 
        bind:value={studentT}
        placeholder="Valore in s..."
        class="w-full bg-white/5 border border-white/10 rounded-xl p-4 text-white font-mono focus:border-nasa-blue focus:bg-nasa-blue/5 outline-none transition-all"
      />
    </div>

    {#if feedback}
      <div class="p-4 rounded-xl text-xs font-bold {success ? 'bg-green-500/10 text-green-400 border border-green-500/20' : 'bg-red-500/10 text-red-400 border border-red-500/20'} animate-in zoom-in-95">
        {feedback}
      </div>
    {/if}

    <button 
      on:click={checkCalculations}
      class="w-full bg-nasa-blue hover:bg-blue-600 text-white py-4 rounded-xl font-bold transition-all transform hover:scale-[1.02] active:scale-95 uppercase tracking-widest text-xs shadow-lg shadow-blue-900/20"
    >
      Verifica Orbita
    </button>

    {#if success}
      <button 
        on:click={closePanel}
        class="w-full border border-white/20 hover:bg-white/10 text-white py-4 rounded-xl font-bold transition-all uppercase tracking-widest text-xs"
      >
        Conferma e Prosegui
      </button>
    {/if}
  </div>
</div>
