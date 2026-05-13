<script>
  import { missionState } from "../stores/missionStore";
  import { onMount } from "svelte";
  import { math } from "../actions/math.js";
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
      missionState.update((s) => ({
        ...s,
        studentCalculations: {
          ...s.studentCalculations,
          isValid: true,
          tliDeltaV: val,
        },
      }));
      isConfirmed = true;
      isValidating = false;
    }, 1000);
  };

  const startSimulation = () => {
    missionState.update((s) => ({
      ...s,
      isAnalyzing: false,
      showBriefing: false,
      status: "Esecuzione Manovra TLI",
    }));
  };

  // Shortcut Docente: Ctrl + Shift + D
  onMount(() => {
    const handleKeyDown = (e) => {
      if (e.ctrlKey && e.shiftKey && e.key.toLowerCase() === "d") {
        e.preventDefault();
        teacherMode = !teacherMode;
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  });
</script>

<div
  class="w-full max-w-4xl bg-black/90 backdrop-blur-2xl border border-nasa-blue/40 rounded-3xl overflow-hidden shadow-2xl flex h-[600px] text-white animate-in zoom-in-95 duration-300 relative"
>
  {#if showHints}
    <div
      class="absolute inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-12"
    >
      <div
        class="bg-nasa-blue/20 border border-nasa-blue/40 p-8 rounded-3xl max-w-lg shadow-2xl animate-in fade-in zoom-in-95"
      >
        <div class="flex justify-between items-start mb-6">
          <h3
            class="text-xl font-black uppercase tracking-tighter italic text-nasa-blue"
          >
            Guida al Ragionamento
          </h3>
          <button
            onclick={() => (showHints = false)}
            class="text-gray-500 hover:text-white">&times;</button
          >
        </div>
        <ul class="space-y-4 text-sm text-gray-300 leading-relaxed italic">
          <li class="flex gap-3">
            <span class="text-nasa-blue font-bold">1.</span>
            <p>
              Per raggiungere la Luna, il tuo nuovo <span
                class="text-white font-bold">apogeo (ra)</span
              > deve coincidere con la distanza Terra-Luna.
            </p>
          </li>
          <li class="flex gap-3">
            <span class="text-nasa-blue font-bold">2.</span>
            <div class="flex-1">
              <p>
                Usa l'equazione di Vis-Viva per trovare la velocità necessaria
                al perigeo <span class="text-white font-bold">(vp)</span> di questa
                ellisse.
              </p>
              <div
                class="mt-3 bg-black/40 p-2 rounded-xl text-center border border-nasa-blue/20 overflow-x-auto text-[14px]"
              >
                <div
                  use:math={{
                    expression:
                      "v = \\sqrt{GM \\left( \\frac{2}{r} - \\frac{1}{a} \\right)}",
                    displayMode: true,
                  }}
                ></div>
              </div>
            </div>
          </li>
          <li class="flex gap-3">
            <span class="text-nasa-blue font-bold">3.</span>
            <p>
              Il <span class="text-white font-bold">Δv</span> è la differenza tra
              questa velocità e quella che hai attualmente in orbita circolare.
            </p>
          </li>
        </ul>
        <button
          onclick={() => (showHints = false)}
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
      <h3 class="text-nasa-blue font-black uppercase text-xs tracking-widest">
        Dati di Missione
      </h3>
      <button
        onclick={() => (showHints = true)}
        class="w-6 h-6 rounded-full border border-nasa-blue/40 flex items-center justify-center text-[10px] text-nasa-blue hover:bg-nasa-blue hover:text-white transition-all shadow-lg shadow-blue-900/20 font-serif italic"
        title="Ottieni Suggerimenti"
      >
        i
      </button>
    </div>

    <div class="space-y-4 font-mono text-[11px]">
      <div class="p-3 bg-white/5 rounded-lg border border-white/5">
        <p class="text-gray-500 mb-1">Raggio Terra (RE)</p>
        <p class="text-white">6371 km</p>
      </div>
      <div class="p-3 bg-white/5 rounded-lg border border-white/5">
        <p class="text-gray-500 mb-1">Quota Attuale (hp)</p>
        <p class="text-white">192 km</p>
      </div>
      <div class="p-3 bg-white/5 rounded-lg border border-white/5">
        <p class="text-gray-500 mb-1">Distanza Terra-Luna (ra)</p>
        <p class="text-white">384400 km</p>
      </div>
      <div class="p-3 bg-white/5 rounded-lg border border-white/5">
        <p class="text-gray-500 mb-1">Velocità Attuale (v_circ)</p>
        <p class="text-white">7793 m/s</p>
      </div>
      <div class="p-3 bg-white/5 rounded-lg border border-white/5">
        <p class="text-gray-500 mb-1">GM Terrestre</p>
        <p class="text-white">3,986e14 m³/s²</p>
      </div>

      {#if teacherMode}
        <div
          class="mt-8 p-4 bg-yellow-500/10 border border-yellow-500/40 rounded-xl animate-pulse"
        >
          <p class="text-yellow-500 font-black text-[9px] uppercase mb-2">
            Modalità Docente
          </p>
          <p class="text-white text-[10px]">
            Δv Target: <span class="text-yellow-400">~3134 m/s</span>
          </p>
          <p class="text-gray-400 text-[9px] mt-1 italic">
            V_circ = 7793 m/s | V_tli = 10927 m/s
          </p>
        </div>
      {/if}
    </div>
  </div>

  <!-- Terminale di Calcolo -->
  <div class="flex-1 p-8 flex flex-col justify-between">
    <div>
      <div class="flex justify-between items-center mb-8">
        <h2
          class="text-xl font-black uppercase tracking-tighter italic text-white/90"
        >
          Terminale Calcolo TLI
        </h2>
        <button
          onclick={onBack}
          class="text-[10px] uppercase tracking-widest text-gray-500 hover:text-white transition-colors"
          >Indietro</button
        >
      </div>

      <div class="space-y-6">
        <div
          class="bg-black border border-white/10 p-6 rounded-2xl shadow-inner relative overflow-hidden group"
        >
          <div
            class="absolute inset-0 bg-nasa-blue/5 opacity-0 group-focus-within:opacity-100 transition-opacity"
          ></div>

          <label
            for="deltaV"
            class="block text-[10px] uppercase tracking-widest text-nasa-blue font-bold mb-4 relative z-10"
          >
            Delta-v pianificato per l'iniezione (m/s)
          </label>
          <div class="flex gap-4 relative z-10">
            <input
              id="deltaV"
              type="number"
              bind:value={deltaVInput}
              placeholder="Inserisci valore"
              class="flex-1 bg-white/5 border border-white/10 rounded-xl px-4 py-3 font-mono text-xl focus:outline-none focus:border-nasa-blue transition-all"
            />
            <button
              onclick={confirmCalculation}
              disabled={isValidating || !deltaVInput}
              class="bg-nasa-blue px-6 py-3 rounded-xl font-bold uppercase text-xs tracking-widest hover:bg-blue-600 transition-all disabled:opacity-50 shadow-lg shadow-blue-900/40"
            >
              {isValidating ? "Registrazione..." : "Conferma"}
            </button>
          </div>
        </div>

        {#if isConfirmed}
          <div
            class="p-4 rounded-xl border border-green-500/30 bg-green-500/10 text-green-400 animate-in fade-in slide-in-from-top-2 flex items-center gap-3"
          >
            <div class="w-2 h-2 bg-green-500 rounded-full animate-ping"></div>
            <p class="text-xs font-mono uppercase tracking-widest">
              Traiettoria Validata. Sistemi pronti.
            </p>
          </div>
        {/if}
      </div>
    </div>

    {#if isConfirmed}
      <button
        onclick={startSimulation}
        class="w-full bg-orion-orange text-white py-5 rounded-2xl font-black uppercase tracking-[0.2em] text-sm transition-all transform hover:scale-[1.02] active:scale-95 shadow-xl shadow-orange-900/40 flex items-center justify-center gap-3"
      >
        <span>Esegui Accensione ICPS</span>
        <svg
          xmlns="http://www.w3.org/2000/svg"
          class="h-4 w-4"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path
            stroke-linecap="round"
            stroke-linejoin="round"
            stroke-width="3"
            d="M14 5l7 7m0 0l-7 7m7-7H3"
          />
        </svg>
      </button>
    {/if}
  </div>
</div>
