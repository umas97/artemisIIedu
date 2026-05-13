<script>
  import katex from "katex";
  import "katex/dist/katex.min.css";
  import { missionState } from "../stores/missionStore";
  import { onMount } from "svelte";
  export let onBack;

  let inputAngle = "";
  let inputDrogueAlt = "";
  let inputParachuteArea = "";

  let errors = {
    angle: "",
    drogue: "",
    area: "",
  };

  let showHints = false;
  let teacherMode = false;

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

  const validateAndSubmit = () => {
    let isValid = true;
    errors = { angle: "", drogue: "", area: "" };

    const parsedAngle = parseFloat(inputAngle);
    if (isNaN(parsedAngle)) {
      errors.angle = "Inserisci un valore numerico valido (es. -6.5).";
      isValid = false;
    } else if (parsedAngle > 0) {
      errors.angle = "L'angolo deve essere negativo (rivolto verso il basso).";
      isValid = false;
    }

    const parsedDrogue = parseFloat(inputDrogueAlt);
    if (isNaN(parsedDrogue) || parsedDrogue < 0) {
      errors.drogue = "Inserisci un'altitudine numerica positiva.";
      isValid = false;
    }

    const parsedArea = parseFloat(inputParachuteArea);
    if (isNaN(parsedArea) || parsedArea <= 0) {
      errors.area = "Inserisci una superficie numerica positiva.";
      isValid = false;
    }

    if (isValid) {
      missionState.update((s) => ({
        ...s,
        studentCalculations: {
          ...s.studentCalculations,
          reentryAngle: parsedAngle,
          parachuteDrogueAltitude: parsedDrogue,
          parachuteArea: parsedArea,
          isValid: true,
        },
        showBriefing: false,
        isAnalyzing: false,
      }));
    }
  };
</script>

<div
  class="max-w-2xl w-full text-white p-6 bg-black/80 backdrop-blur-md rounded-2xl border border-nasa-blue/40 shadow-2xl relative overflow-hidden"
>
  {#if showHints}
    <div
      class="absolute inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-6"
    >
      <div
        class="bg-nasa-blue/20 border border-nasa-blue/40 p-8 rounded-3xl max-w-lg shadow-2xl animate-in fade-in zoom-in-95"
      >
        <div class="flex justify-between items-start mb-6">
          <h3
            class="text-xl font-black uppercase tracking-tighter italic text-nasa-blue"
          >
            Guida e Dati Fisici
          </h3>
          <button
            onclick={() => (showHints = false)}
            class="text-gray-500 hover:text-white">&times;</button
          >
        </div>

        <p class="text-gray-300 text-sm italic mb-6 leading-relaxed">
          Usa i seguenti dati fisici per calcolare lo spazio di decelerazione
          nel moto rettilineo uniforme e per ricavare l'area necessaria dalla
          formula inversa della resistenza aerodinamica.
        </p>

        <ul class="space-y-4 text-sm text-gray-300 leading-relaxed italic">
          <li class="flex justify-between border-b border-white/10 pb-2">
            <span class="text-nasa-blue font-bold"
              >Massa Orion ({@html katex.renderToString("m", {
                throwOnError: false,
              })})</span
            >
            <span class="text-white font-bold">10400 kg</span>
          </li>
          <li class="flex justify-between border-b border-white/10 pb-2">
            <span class="text-nasa-blue font-bold"
              >Accelerazione gravità ({@html katex.renderToString("g", {
                throwOnError: false,
              })})</span
            >
            <span class="text-white font-bold">9,81 m/s²</span>
          </li>
          <li class="flex justify-between border-b border-white/10 pb-2">
            <span class="text-nasa-blue font-bold"
              >Densità aria ({@html katex.renderToString("\\rho", {
                throwOnError: false,
              })})</span
            >
            <span class="text-white font-bold">1,225 kg/m³</span>
          </li>
          <li class="flex justify-between border-b border-white/10 pb-2">
            <span class="text-nasa-blue font-bold"
              >Coefficiente forma ({@html katex.renderToString("C_d", {
                throwOnError: false,
              })})</span
            >
            <span class="text-white font-bold">2,0</span>
          </li>
          <li class="flex justify-between border-b border-white/10 pb-2">
            <span class="text-nasa-blue font-bold"
              >Vel. iniziale Drogue ({@html katex.renderToString("v", {
                throwOnError: false,
              })})</span
            >
            <span class="text-white font-bold">150 m/s</span>
          </li>
          <li
            class="flex border-b border-white/10 pb-2 items-center justify-between"
          >
            <span class="text-nasa-blue font-bold"
              >Velocità ammaraggio ({@html katex.renderToString("v", {
                throwOnError: false,
              })})</span
            >
            <span class="text-white font-bold">10 m/s</span>
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

  <div class="absolute inset-0 opacity-10 pointer-events-none">
    <div
      class="w-full h-full bg-[linear-gradient(rgba(255,255,255,0.05)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.05)_1px,transparent_1px)] bg-[size:20px_20px]"
    ></div>
  </div>

  <div
    class="flex justify-between items-center mb-6 relative z-10 border-b border-white/10 pb-4"
  >
    <div class="flex items-center gap-4">
      <div>
        <h2
          class="text-2xl font-black tracking-tight text-transparent bg-clip-text bg-gradient-to-r from-orion-orange to-red-500"
        >
          CONSOLE CALCOLI FISICI
        </h2>
        <p
          class="text-xs text-gray-400 uppercase tracking-widest font-mono mt-1"
        >
          Immissione Risultati Equazioni
        </p>
      </div>
      <button
        onclick={() => (showHints = true)}
        class="w-8 h-8 rounded-full border border-nasa-blue/40 flex items-center justify-center text-sm text-nasa-blue hover:bg-nasa-blue hover:text-white transition-all shadow-lg shadow-blue-900/20 font-serif italic"
        title="Riepilogo Dati"
      >
        i
      </button>
    </div>
    <button
      onclick={onBack}
      class="text-gray-400 hover:text-white transition-colors bg-white/5 hover:bg-white/10 p-2 rounded-lg border border-white/10"
    >
      <svg class="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"
        ><path
          stroke-linecap="round"
          stroke-linejoin="round"
          stroke-width="2"
          d="M11 17l-5-5m0 0l5-5m-5 5h12"
        /></svg
      >
    </button>
  </div>

  <div class="space-y-6 relative z-10">
    {#if teacherMode}
      <div
        class="bg-yellow-500/10 border border-yellow-500/40 p-5 rounded-xl shadow-inner animate-pulse"
      >
        <p
          class="text-yellow-500 font-black text-sm uppercase mb-2 flex items-center gap-2"
        >
          <svg
            class="w-5 h-5"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            ><path
              stroke-linecap="round"
              stroke-linejoin="round"
              stroke-width="2"
              d="M12 14l9-5-9-5-9 5 9 5z"
            /><path
              stroke-linecap="round"
              stroke-linejoin="round"
              stroke-width="2"
              d="M12 14l6.16-3.422a12.083 12.083 0 01.665 6.479A11.952 11.952 0 0012 20.055a11.952 11.952 0 00-6.824-2.998 12.078 12.078 0 01.665-6.479L12 14z"
            /><path
              stroke-linecap="round"
              stroke-linejoin="round"
              stroke-width="2"
              d="M12 14l9-5-9-5-9 5 9 5zm0 0l6.16-3.422a12.083 12.083 0 01.665 6.479A11.952 11.952 0 0012 20.055a11.952 11.952 0 00-6.824-2.998 12.078 12.078 0 01.665-6.479L12 14zm-4 6v-7.5l4-2.222"
            /></svg
          >
          Modalità Docente Attiva
        </p>
        <ul
          class="text-yellow-400 text-[11px] space-y-1 font-mono uppercase tracking-wider"
        >
          <li>Angolo Corretto: <span class="text-white">-6.5°</span></li>
          <li>
            Altitudine Drogue: <span class="text-white">7000 m</span> (10000 - 150*20)
          </li>
          <li>
            Superficie Main: <span class="text-white">~832 m²</span> (204048 / 245)
          </li>
        </ul>
      </div>
    {/if}

    <div class="bg-black/50 border border-white/10 p-5 rounded-xl shadow-inner">
      <label
        class="block text-sm font-bold text-nasa-blue mb-2 uppercase tracking-widest"
        for="angle">1. Angolo Dedotto (Gradi)</label
      >
      <p class="text-xs text-gray-400 mb-3 font-mono">
        Basandoti sulla tabella NASA del Briefing, calcola l'angolo ottimale di
        ingresso in atmosfera.
      </p>
      <div class="flex items-center gap-3">
        <input
          id="angle"
          type="number"
          step="0.1"
          bind:value={inputAngle}
          placeholder="Inserisci angolo"
          class="w-full bg-black/60 border border-nasa-blue/40 rounded-lg p-3 text-white font-mono text-xl focus:outline-none focus:border-orion-orange focus:ring-1 focus:ring-orion-orange transition-all"
        />
        <span class="text-gray-500 font-mono text-xl">°</span>
      </div>
      {#if errors.angle}
        <p class="text-red-400 text-xs mt-2 flex items-center gap-1">
          <svg
            class="w-4 h-4"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            ><path
              stroke-linecap="round"
              stroke-linejoin="round"
              stroke-width="2"
              d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
            /></svg
          >
          {errors.angle}
        </p>
      {/if}
    </div>

    <div class="bg-black/50 border border-white/10 p-5 rounded-xl shadow-inner">
      <label
        class="block text-sm font-bold text-nasa-blue mb-2 uppercase tracking-widest"
        for="drogue">2. Altitudine Drogue Chutes (m)</label
      >
      <p class="text-xs text-gray-400 mb-3 flex items-center gap-2">
        Inserisci il risultato del tuo calcolo cinematico.
      </p>
      <div class="flex items-center gap-3">
        <input
          id="drogue"
          type="number"
          bind:value={inputDrogueAlt}
          placeholder="Inserisci altitudine"
          class="w-full bg-black/60 border border-nasa-blue/40 rounded-lg p-3 text-white font-mono text-xl focus:outline-none focus:border-orion-orange focus:ring-1 focus:ring-orion-orange transition-all"
        />
        <span class="text-gray-500 font-mono text-xl">m</span>
      </div>
      {#if errors.drogue}
        <p class="text-red-400 text-xs mt-2 flex items-center gap-1">
          <svg
            class="w-4 h-4"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            ><path
              stroke-linecap="round"
              stroke-linejoin="round"
              stroke-width="2"
              d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
            /></svg
          >
          {errors.drogue}
        </p>
      {/if}
    </div>

    <div class="bg-black/50 border border-white/10 p-5 rounded-xl shadow-inner">
      <label
        class="block text-sm font-bold text-nasa-blue mb-2 uppercase tracking-widest"
        for="area">3. Superficie Paracadute (m²)</label
      >
      <p class="text-xs text-gray-400 mb-3 flex items-center flex-wrap gap-2">
        Risultato del calcolo di attrito dinamico per {@html katex.renderToString(
          "v = 10 \\text{ m/s}",
          { throwOnError: false },
        )}.
      </p>
      <div class="flex items-center gap-3">
        <input
          id="area"
          type="number"
          bind:value={inputParachuteArea}
          placeholder="Inserisci area calcolata"
          class="w-full bg-black/60 border border-nasa-blue/40 rounded-lg p-3 text-white font-mono text-xl focus:outline-none focus:border-orion-orange focus:ring-1 focus:ring-orion-orange transition-all"
        />
        <span class="text-gray-500 font-mono text-xl">m²</span>
      </div>
      {#if errors.area}
        <p class="text-red-400 text-xs mt-2 flex items-center gap-1">
          <svg
            class="w-4 h-4"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            ><path
              stroke-linecap="round"
              stroke-linejoin="round"
              stroke-width="2"
              d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
            /></svg
          >
          {errors.area}
        </p>
      {/if}
    </div>

    <button
      onclick={validateAndSubmit}
      class="w-full mt-4 bg-orion-orange hover:bg-orange-600 text-white font-bold py-4 rounded-xl transition-all shadow-[0_0_15px_rgba(255,62,0,0.4)] hover:shadow-[0_0_25px_rgba(255,62,0,0.6)] flex items-center justify-center gap-2"
    >
      <svg class="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"
        ><path
          stroke-linecap="round"
          stroke-linejoin="round"
          stroke-width="2"
          d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
        /></svg
      >
      CARICA DATI ED ESEGUI SIMULAZIONE
    </button>
  </div>
</div>
