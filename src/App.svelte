<script>
  import { onMount } from "svelte";
  import PhaserGame from "./lib/phaser/PhaserGame.svelte";
  import { missionState } from "./lib/stores/missionStore";
  import BriefingPhase1 from "./lib/components/BriefingPhase1.svelte";
  import BriefingPhase2 from "./lib/components/BriefingPhase2.svelte";
  import BriefingPhase3 from "./lib/components/BriefingPhase3.svelte";
  import BriefingPhase4 from "./lib/components/BriefingPhase4.svelte";
  import BriefingPhase5 from "./lib/components/BriefingPhase5.svelte";
  import BriefingPhase6 from "./lib/components/BriefingPhase6.svelte";
  import CalculationPanel from "./lib/components/CalculationPanel.svelte";
  import CalculationPanelPhase2 from "./lib/components/CalculationPanelPhase2.svelte";
  import CalculationPanelPhase3 from "./lib/components/CalculationPanelPhase3.svelte";
  import CalculationPanelPhase4 from "./lib/components/CalculationPanelPhase4.svelte";
  import CalculationPanelPhase5 from "./lib/components/CalculationPanelPhase5.svelte";
  import CalculationPanelPhase6 from "./lib/components/CalculationPanelPhase6.svelte";
  import FlightPlan from "./lib/components/FlightPlan.svelte";
  import "./app.css";

  const startAnalysis = () => {
    missionState.update((s) => ({
      ...s,
      showBriefing: false,
      isAnalyzing: true,
    }));
  };

  const backToBriefing = () => {
    missionState.update((s) => ({
      ...s,
      showBriefing: true,
      isAnalyzing: false,
    }));
  };

  const stopAllScenes = () => {
    if (window.game) {
      window.game.scene.stop("EarthOrbitScene");
      window.game.scene.stop("LaunchScene");
      window.game.scene.stop("TLIScene");
      window.game.scene.stop("LOIScene");
      window.game.scene.stop("TEIScene");
      window.game.scene.stop("ReentryScene");
    }
  };

  const goToPhase1 = () => {
    missionState.update((s) => ({
      ...s,
      currentPhase: 1,
      showBriefing: true,
      isAnalyzing: false,
      phase1Complete: false,
      phase2Complete: false,
      phase3Complete: false,
      phase4Complete: false,
      status: "Checkout Sistemi",
    }));
    if (window.game) {
      stopAllScenes();
      window.game.scene.start("EarthOrbitScene");
    }
  };

  const startPhase2 = () => {
    missionState.update((s) => ({
      ...s,
      currentPhase: 2,
      showBriefing: true,
      isAnalyzing: false,
      phase1Complete: false,
      phase2Complete: false,
      status: "Configurazione SLS",
      studentCalculations: { ...s.studentCalculations, isValid: false },
      telemetry: {
        velocity: 0,
        altitude: 0,
        fuelRemaining: 100,
        stage: "Core Stage",
      },
    }));

    setTimeout(() => {
      if (window.game) {
        stopAllScenes();
        window.game.scene.start("LaunchScene");
      }
    }, 50);
  };

  const startPhase3 = () => {
    missionState.update((s) => ({
      ...s,
      currentPhase: 3,
      showBriefing: true,
      isAnalyzing: false,
      phase2Complete: false,
      phase3Complete: false,
      status: "Pianificazione TLI",
      studentCalculations: { ...s.studentCalculations, isValid: false },
    }));

    setTimeout(() => {
      if (window.game) {
        stopAllScenes();
        window.game.scene.start("TLIScene");
      }
    }, 50);
  };

  const retryPhase3 = () => {
    missionState.update((s) => ({
      ...s,
      showBriefing: false,
      isAnalyzing: true,
      status: "In attesa di nuovi calcoli",
      didacticFeedback: "",
      studentCalculations: { ...s.studentCalculations, isValid: false },
    }));
    // Reset della scena per permettere un nuovo tentativo pulito
    if (window.game) {
      window.game.scene.stop("TLIScene");
      window.game.scene.start("TLIScene");
    }
  };

  const startPhase4 = () => {
    try {
      missionState.update((s) => ({
        ...s,
        currentPhase: 4,
        showBriefing: true,
        isAnalyzing: false,
        phase3Complete: false,
        phase4Complete: false,
        status: "Pianificazione LOI",
        studentCalculations: { ...s.studentCalculations, isValid: false },
        didacticFeedback: "",
      }));

      setTimeout(() => {
        try {
          if (window.game) {
            stopAllScenes();
            window.game.scene.start("LOIScene");
          }
        } catch (e) {
          alert("Errore Phaser: " + e.message);
        }
      }, 50);
    } catch (e) {
      alert("Errore startPhase4: " + e.message);
    }
  };

  const retryPhase4 = () => {
    missionState.update((s) => ({
      ...s,
      showBriefing: false,
      isAnalyzing: true,
      status: "In attesa di nuovi calcoli",
      didacticFeedback: "",
      studentCalculations: { ...s.studentCalculations, isValid: false },
    }));
    if (window.game) {
      window.game.scene.stop("LOIScene");
      window.game.scene.start("LOIScene");
    }
  };

  const startPhase5 = () => {
    try {
      missionState.update((s) => ({
        ...s,
        currentPhase: 5,
        showBriefing: true,
        isAnalyzing: false,
        phase4Complete: false,
        phase5Complete: false,
        status: "Pianificazione Rientro (TEI)",
        studentCalculations: { ...s.studentCalculations, isValid: false },
        didacticFeedback: "",
      }));

      setTimeout(() => {
        try {
          if (window.game) {
            stopAllScenes();
            window.game.scene.start("TEIScene");
          }
        } catch (e) {
          alert("Errore Phaser: " + e.message);
        }
      }, 50);
    } catch (e) {
      alert("Errore startPhase5: " + e.message);
    }
  };

  const retryPhase5 = () => {
    missionState.update((s) => ({
      ...s,
      showBriefing: false,
      isAnalyzing: true,
      status: "In attesa di nuovi calcoli",
      didacticFeedback: "",
      studentCalculations: { ...s.studentCalculations, isValid: false },
    }));
    if (window.game) {
      window.game.scene.stop("TEIScene");
      window.game.scene.start("TEIScene");
    }
  };

  const startPhase6 = () => {
    try {
      missionState.update((s) => ({
        ...s,
        currentPhase: 6,
        showBriefing: true,
        isAnalyzing: false,
        phase5Complete: false,
        phase6Complete: false,
        status: "Pianificazione Discesa (Reentry)",
        studentCalculations: { ...s.studentCalculations, isValid: false },
        didacticFeedback: "",
      }));

      setTimeout(() => {
        try {
          if (window.game) {
            stopAllScenes();
            window.game.scene.start("ReentryScene");
          }
        } catch (e) {
          alert("Errore Phaser: " + e.message);
        }
      }, 50);
    } catch (e) {
      alert("Errore startPhase6: " + e.message);
    }
  };

  const retryPhase6 = () => {
    missionState.update((s) => ({
      ...s,
      showBriefing: false,
      isAnalyzing: true,
      status: "In attesa di nuovi calcoli",
      didacticFeedback: "",
      studentCalculations: { ...s.studentCalculations, isValid: false },
    }));
    if (window.game) {
      window.game.scene.stop("ReentryScene");
      window.game.scene.start("ReentryScene");
    }
  };

  const openFlightPlan = () => {
    missionState.update((s) => ({ ...s, showFlightPlan: true }));
  };

  const closeFlightPlan = () => {
    missionState.update((s) => ({ ...s, showFlightPlan: false }));
  };

  const restartMission = () => {
    missionState.update((s) => ({
      ...s,
      currentPhase: 1,
      showBriefing: true,
      isAnalyzing: false,
      showFlightPlan: false,
      phase1Complete: false,
      phase2Complete: false,
      phase3Complete: false,
      phase4Complete: false,
      phase5Complete: false,
      phase6Complete: false,
      didacticFeedback: "",
      status: "Checkout Sistemi",
      studentCalculations: {
        ...s.studentCalculations,
        isValid: false,
        semiMajorAxis: 0,
        orbitalPeriod: 0,
        requiredFuel: 0,
        tliDeltaV: 0,
        loiDeltaV: 0,
        teiDeltaV: 0,
        reentryAngle: 0,
        parachuteDrogueAltitude: 0,
        parachuteArea: 0,
      },
      telemetry: {
        velocity: 0,
        altitude: 0,
        fuelRemaining: 100,
        stage: "Core Stage",
      },
    }));
    if (window.game) {
      stopAllScenes();
      window.game.scene.start("EarthOrbitScene");
    }
  };

  onMount(() => {
    window.addEventListener("error", (e) => {
      alert(
        "GLOBAL ERROR: " + e.message + " at " + e.filename + ":" + e.lineno,
      );
    });

    const origError = console.error;
    console.error = function (...args) {
      alert("CONSOLE ERROR: " + args.join(" "));
      origError.apply(console, args);
    };

    const handleKeyDown = (e) => {
      if (e.ctrlKey && !e.shiftKey) {
        if (e.key === "1") {
          e.preventDefault();
          goToPhase1();
        }
        if (e.key === "2") {
          e.preventDefault();
          startPhase2();
        }
        if (e.key === "3") {
          e.preventDefault();
          startPhase3();
        }
        if (e.key === "4") {
          e.preventDefault();
          startPhase4();
        }
        if (e.key === "5") {
          e.preventDefault();
          startPhase5();
        }
        if (e.key === "6") {
          e.preventDefault();
          startPhase6();
        }
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  });
</script>

<main class="relative w-full h-screen overflow-hidden bg-space-black">
  <PhaserGame />

  <div
    class="relative z-10 w-full h-full pointer-events-none flex flex-col justify-between p-8"
  >
    <div
      class="absolute inset-0 pointer-events-none flex items-center justify-center z-50"
    >
      {#if $missionState.showBriefing}
        <div
          class="pointer-events-auto bg-black/40 backdrop-blur-sm w-full h-full flex items-center justify-center"
        >
          {#if $missionState.currentPhase === 1}
            <BriefingPhase1 onStartAnalysis={startAnalysis} />
          {:else if $missionState.currentPhase === 2}
            <BriefingPhase2 onStartAnalysis={startAnalysis} />
          {:else if $missionState.currentPhase === 3}
            <BriefingPhase3 onStartAnalysis={startAnalysis} />
          {:else if $missionState.currentPhase === 4}
            <BriefingPhase4 onStartAnalysis={startAnalysis} />
          {:else if $missionState.currentPhase === 5}
            <BriefingPhase5 onStartAnalysis={startAnalysis} />
          {:else if $missionState.currentPhase === 6}
            <BriefingPhase6 onStartAnalysis={startAnalysis} />
          {/if}
        </div>
      {:else if $missionState.isAnalyzing}
        <div
          class="pointer-events-auto bg-black/40 backdrop-blur-sm w-full h-full flex items-center justify-center"
        >
          {#if $missionState.currentPhase === 1}
            <CalculationPanel onBack={backToBriefing} />
          {:else if $missionState.currentPhase === 2}
            <CalculationPanelPhase2 onBack={backToBriefing} />
          {:else if $missionState.currentPhase === 3}
            <CalculationPanelPhase3 onBack={backToBriefing} />
          {:else if $missionState.currentPhase === 4}
            <CalculationPanelPhase4 onBack={backToBriefing} />
          {:else if $missionState.currentPhase === 5}
            <CalculationPanelPhase5 onBack={backToBriefing} />
          {:else if $missionState.currentPhase === 6}
            <CalculationPanelPhase6 onBack={backToBriefing} />
          {/if}
        </div>
      {/if}
    </div>

    <div class="flex justify-between items-start pointer-events-auto">
      <div
        class="bg-black/60 backdrop-blur-md border border-nasa-blue/30 p-4 rounded-lg shadow-lg"
      >
        <h1 class="text-2xl font-bold text-white tracking-wider uppercase">
          Missione Artemis II
        </h1>
        <p class="text-nasa-blue font-mono text-xs italic">
          Fase {$missionState.currentPhase}:
          {$missionState.currentPhase === 1
            ? "Checkout Orbitale"
            : $missionState.currentPhase === 2
              ? "Iniezione Orbitale"
              : $missionState.currentPhase === 3
                ? "Rotta Cis-Lunare"
                : $missionState.currentPhase === 4
                  ? "Orbitazione Lunare"
                  : $missionState.currentPhase === 5
                    ? "Rientro sulla Terra"
                    : "Discesa e Ammaraggio"}
        </p>
      </div>

      <div
        class="bg-black/60 backdrop-blur-md border border-nasa-blue/30 p-4 rounded-lg shadow-lg text-right min-w-[200px]"
      >
        <div
          class="text-[10px] text-nasa-blue uppercase tracking-widest font-bold mb-1"
        >
          Status
        </div>
        <div
          class="text-xl font-mono text-orion-orange animate-pulse uppercase tracking-tighter"
        >
          {$missionState.status}
        </div>
      </div>
    </div>

    <div class="flex justify-between items-end pointer-events-none">
      <div class="space-y-4">
        <div
          class="bg-black/60 backdrop-blur-md border border-nasa-blue/20 p-4 rounded-lg w-56 pointer-events-auto shadow-xl"
        >
          <div
            class="text-[10px] text-nasa-blue uppercase tracking-widest font-bold mb-2 border-b border-nasa-blue/20 pb-1"
          >
            Telemetria Orion
          </div>

          <div class="grid grid-cols-1 gap-3">
            <div class="flex justify-between items-end">
              <div class="text-[9px] text-white/50 uppercase">Velocità</div>
              <div
                class="text-lg font-mono text-white leading-none tracking-tighter"
              >
                {($missionState.telemetry?.velocity || 0).toFixed(2)}
                <span class="text-[9px] text-nasa-blue">km/s</span>
              </div>
            </div>
            <div class="flex justify-between items-end">
              <div class="text-[9px] text-white/50 uppercase">
                {$missionState.currentPhase < 3
                  ? "Altitudine"
                  : "Distanza Terra"}
              </div>
              <div
                class="text-lg font-mono text-white leading-none tracking-tighter"
              >
                {($missionState.telemetry?.altitude || 0).toFixed(0)}
                <span class="text-[9px] text-nasa-blue">km</span>
              </div>
            </div>
            <div>
              <div
                class="flex justify-between text-[9px] text-white/50 uppercase mb-1"
              >
                <span>Propellente</span>
                <span
                  >{Math.round(
                    $missionState.telemetry?.fuelRemaining || 0,
                  )}%</span
                >
              </div>
              <div
                class="w-full bg-white/10 h-1.5 rounded-full overflow-hidden border border-white/5"
              >
                <div
                  class="bg-orion-orange h-full transition-all duration-500 shadow-[0_0_10px_rgba(255,62,0,0.5)]"
                  style="width: {$missionState.telemetry?.fuelRemaining || 0}%"
                ></div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <div class="w-full flex justify-center pointer-events-auto">
      <div
        class="bg-black/90 backdrop-blur-xl border-t border-nasa-blue/40 w-full max-w-4xl p-5 rounded-t-2xl shadow-[0_-15px_40px_rgba(0,50,160,0.4)]"
      >
        <div class="flex items-center gap-8">
          <div class="flex-1 border-l-2 border-nasa-blue/30 pl-6">
            <div class="flex items-center gap-2 mb-1">
              <span
                class="px-2 py-0.5 bg-nasa-blue/20 text-nasa-blue text-[9px] font-bold rounded uppercase tracking-widest border border-nasa-blue/30"
              >
                {$missionState.phase3Complete &&
                $missionState.currentPhase === 3
                  ? "Obiettivo Raggiunto"
                  : `Dossier Fase ${$missionState.currentPhase}`}
              </span>
              <h2 class="text-md font-bold text-white uppercase tracking-tight">
                {#if $missionState.didacticFeedback}
                  {$missionState.status}
                {:else if $missionState.studentCalculations.isValid && !$missionState.isAnalyzing && !$missionState.showBriefing}
                  {$missionState.currentPhase === 2
                    ? "Lancio SLS in corso"
                    : $missionState.currentPhase === 3
                      ? "Esecuzione Manovra TLI"
                      : $missionState.currentPhase === 4
                        ? "Esecuzione Manovra LOI"
                        : $missionState.currentPhase === 5
                          ? "Esecuzione Manovra TEI"
                          : "Rientro Atmosferico in corso"}
                {:else if $missionState.phase2Complete && $missionState.currentPhase === 2}
                  Lancio Completato: Orbita Stabilizzata
                {:else if $missionState.phase3Complete && $missionState.currentPhase === 3}
                  Arrivo nell'orbita lunare
                {:else if $missionState.phase4Complete && $missionState.currentPhase === 4}
                  Pronti per il rientro
                {:else if $missionState.phase5Complete && $missionState.currentPhase === 5}
                  Pronti per la discesa atmosferica
                {:else if $missionState.phase6Complete && $missionState.currentPhase === 6}
                  Ammaraggio Riuscito! Missione Completata
                {:else}
                  {$missionState.currentPhase === 1
                    ? "Briefing: Analisi Orbitale"
                    : $missionState.currentPhase === 2
                      ? "Briefing: Calcolo Propulsione"
                      : $missionState.currentPhase === 3
                        ? "Briefing: Iniezione Trans-Lunare"
                        : $missionState.currentPhase === 4
                          ? "Briefing: Iniezione Orbitale Lunare"
                          : $missionState.currentPhase === 5
                            ? "Briefing: Ritorno a Casa"
                            : "Briefing: Discesa Finale"}
                {/if}
              </h2>
            </div>
            <p
              class="text-[13px] text-gray-400 leading-relaxed max-w-2xl italic"
            >
              {#if $missionState.didacticFeedback}
                {$missionState.didacticFeedback}
              {:else if $missionState.studentCalculations.isValid && !$missionState.isAnalyzing && !$missionState.showBriefing}
                {#if $missionState.currentPhase === 2}
                  I motori RS-25 sono a pieno regime. Orion sta lasciando la
                  rampa 39B del Kennedy Space Center.
                {:else if $missionState.currentPhase === 3}
                  Il motore ICPS ha terminato la spinta. Inizia la fase di
                  crociera cis-lunare verso l'obiettivo.
                {:else if $missionState.currentPhase === 4}
                  Motori di manovra accesi in modo retrogrado. Controllo
                  telemetria e inserimento orbitale in corso.
                {:else if $missionState.currentPhase === 5}
                  Accensione prograda completata. Monitoraggio traiettoria di
                  fuga in corso.
                {:else if $missionState.currentPhase === 6}
                  Capsula in ingresso atmosferico. Monitoraggio temperature e
                  assetto in corso.
                {/if}
              {:else if $missionState.phase2Complete && $missionState.currentPhase === 2}
                Ottimo lavoro, Comandante. L'SLS ci ha portati in orbita. Ora
                dobbiamo calcolare il salto verso la Luna.
              {:else if $missionState.phase3Complete && $missionState.currentPhase === 3}
                Siamo nei pressi della Luna. È ora di frenare per farci
                catturare.
              {:else if $missionState.phase4Complete && $missionState.currentPhase === 4}
                Abbiamo raccolto i dati. È ora di lasciare l'orbita lunare.
              {:else if $missionState.phase5Complete && $missionState.currentPhase === 5}
                Siamo in rotta verso la Terra. Ora prepariamoci all'impatto con
                l'atmosfera.
              {:else if $missionState.phase6Complete && $missionState.currentPhase === 6}
                Congratulazioni Comandante! L'equipaggio di Artemis II è tornato
                a casa sano e salvo.
              {:else}
                {$missionState.currentPhase === 1
                  ? "Analizza i parametri dell'orbita di parcheggio..."
                  : $missionState.currentPhase === 2
                    ? "Pianifica il decollo dell'SLS..."
                    : $missionState.currentPhase === 3
                      ? "Calcola il Delta-v necessario per la Luna..."
                      : $missionState.currentPhase === 4
                        ? "Calcola il Delta-v per la frenata (LOI)..."
                        : $missionState.currentPhase === 5
                          ? "Calcola la velocità di fuga (TEI)..."
                          : "Calcola i parametri di rientro..."}
              {/if}
            </p>
          </div>

          {#if $missionState.phase1Complete && $missionState.currentPhase === 1}
            <button
              onclick={startPhase2}
              class="bg-orion-orange hover:bg-orange-600 text-white px-10 py-4 rounded-xl font-black transition-all transform hover:scale-105 active:scale-95 shadow-lg shadow-orange-900/40 uppercase tracking-widest text-[11px] border border-white/10 animate-pulse"
              >Vai al Lancio SLS</button
            >
          {:else if $missionState.phase2Complete && $missionState.currentPhase === 2}
            <button
              onclick={startPhase3}
              class="bg-orion-orange hover:bg-orange-600 text-white px-10 py-4 rounded-xl font-black transition-all transform hover:scale-105 active:scale-95 shadow-lg shadow-orange-900/40 uppercase tracking-widest text-[11px] border border-white/10 animate-pulse"
              >Pianifica TLI</button
            >
          {:else if $missionState.phase3Complete && $missionState.currentPhase === 3}
            <button
              onclick={startPhase4}
              class="bg-orion-orange hover:bg-orange-600 text-white px-10 py-4 rounded-xl font-black transition-all transform hover:scale-105 active:scale-95 shadow-lg shadow-orange-900/40 uppercase tracking-widest text-[11px] border border-white/10 animate-pulse"
              >Vai alla Fase 4: LOI</button
            >
          {:else if $missionState.phase4Complete && $missionState.currentPhase === 4}
            <button
              onclick={startPhase5}
              class="bg-orion-orange hover:bg-orange-600 text-white px-10 py-4 rounded-xl font-black transition-all transform hover:scale-105 active:scale-95 shadow-lg shadow-orange-900/40 uppercase tracking-widest text-[11px] border border-white/10 animate-pulse"
              >Vai alla Fase 5: Rientro</button
            >
          {:else if $missionState.phase5Complete && $missionState.currentPhase === 5}
            <button
              onclick={startPhase6}
              class="bg-orion-orange hover:bg-orange-600 text-white px-10 py-4 rounded-xl font-black transition-all transform hover:scale-105 active:scale-95 shadow-lg shadow-orange-900/40 uppercase tracking-widest text-[11px] border border-white/10 animate-pulse"
              >Vai alla Fase 6: Discesa</button
            >
          {:else if $missionState.phase6Complete && $missionState.currentPhase === 6}
            <button
              onclick={openFlightPlan}
              class="bg-green-600 hover:bg-green-500 text-white px-10 py-4 rounded-xl font-black transition-all transform hover:scale-105 active:scale-95 shadow-lg shadow-green-900/40 uppercase tracking-widest text-[11px] border border-white/10 animate-pulse"
              >Genera Flight Plan</button
            >
          {:else if $missionState.studentCalculations.isValid && $missionState.currentPhase === 3 && !$missionState.phase3Complete}
            <button
              onclick={retryPhase3}
              class="bg-red-600 hover:bg-red-500 text-white px-10 py-4 rounded-xl font-black transition-all transform hover:scale-105 active:scale-95 shadow-lg shadow-red-900/40 uppercase tracking-widest text-[11px] border border-white/10"
              >Ricalcola Manovra TLI</button
            >
          {:else if $missionState.studentCalculations.isValid && $missionState.currentPhase === 4 && !$missionState.phase4Complete}
            <button
              onclick={retryPhase4}
              class="bg-red-600 hover:bg-red-500 text-white px-10 py-4 rounded-xl font-black transition-all transform hover:scale-105 active:scale-95 shadow-lg shadow-red-900/40 uppercase tracking-widest text-[11px] border border-white/10"
              >Ricalcola Frenata</button
            >
          {:else if $missionState.studentCalculations.isValid && $missionState.currentPhase === 5 && !$missionState.phase5Complete}
            <button
              onclick={retryPhase5}
              class="bg-red-600 hover:bg-red-500 text-white px-10 py-4 rounded-xl font-black transition-all transform hover:scale-105 active:scale-95 shadow-lg shadow-red-900/40 uppercase tracking-widest text-[11px] border border-white/10"
              >Ricalcola Spinta di Fuga</button
            >
          {:else if $missionState.studentCalculations.isValid && $missionState.currentPhase === 6 && !$missionState.phase6Complete}
            <button
              onclick={retryPhase6}
              class="bg-red-600 hover:bg-red-500 text-white px-10 py-4 rounded-xl font-black transition-all transform hover:scale-105 active:scale-95 shadow-lg shadow-red-900/40 uppercase tracking-widest text-[11px] border border-white/10"
              >Ricalcola Rientro</button
            >
          {:else if !$missionState.studentCalculations.isValid && !$missionState.showBriefing}
            <button
              onclick={startAnalysis}
              class="bg-nasa-blue hover:bg-blue-600 text-white px-10 py-4 rounded-xl font-black transition-all transform hover:scale-105 active:scale-95 shadow-lg shadow-blue-900/40 uppercase tracking-widest text-[11px] border border-white/10"
              >Inizia Analisi</button
            >
          {/if}
        </div>
      </div>
    </div>
  </div>

  {#if $missionState.showFlightPlan}
    <FlightPlan onClose={closeFlightPlan} onRestart={restartMission} />
  {/if}
</main>

<style>
  :global(body) {
    background-color: #050505;
    color: white;
  }
</style>
