<script>
  import { onMount } from "svelte";
  import PhaserGame from "./lib/phaser/PhaserGame.svelte";
  import { missionState } from "./lib/stores/missionStore";
  import { teacherMode } from "./lib/stores/teacherMode";
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

  // Configurazione di ogni fase: scena Phaser, componenti e testi della barra "Dossier".
  const PHASES = [
    {
      n: 1, short: "HEO", name: "Checkout orbitale", scene: "EarthOrbitScene",
      briefing: BriefingPhase1, panel: CalculationPanel, status: "Checkout sistemi",
      briefTitle: "Briefing: analisi orbitale", briefText: "Calcola semiasse maggiore e periodo dell'orbita alta (HEO).",
      runTitle: "Orbita in verifica", runText: "Orion percorre l'orbita alta: osserva come cambia la velocità tra perigeo e apogeo.",
      doneTitle: "Orbita verificata", doneText: "Parametri orbitali corretti. Prossimo passo: il lancio dello SLS.",
      next: "Vai al lancio SLS",
    },
    {
      n: 2, short: "LANCIO", name: "Lancio SLS", scene: "LaunchScene",
      briefing: BriefingPhase2, panel: CalculationPanelPhase2, status: "Configurazione SLS",
      briefTitle: "Briefing: calcolo del propellente", briefText: "Usa l'equazione di Tsiolkovsky per caricare il core stage.",
      runTitle: "Lancio SLS in corso", runText: "I quattro motori RS-25 sono a pieno regime. Orion lascia la rampa 39B del Kennedy Space Center.",
      doneTitle: "Lancio completato: orbita raggiunta", doneText: "Ottimo lavoro, Comandante. L'SLS ci ha portati in orbita. Ora calcoliamo il salto verso la Luna.",
      next: "Pianifica la TLI",
    },
    {
      n: 3, short: "TLI", name: "Rotta cislunare", scene: "TLIScene",
      briefing: BriefingPhase3, panel: CalculationPanelPhase3, status: "Pianificazione TLI",
      briefTitle: "Briefing: iniezione trans-lunare", briefText: "Calcola il Δv necessario per raggiungere la Luna.",
      runTitle: "Esecuzione manovra TLI", runText: "Il motore dell'ICPS ha terminato la spinta. Inizia la crociera verso la Luna.",
      doneTitle: "Arrivo nei pressi della Luna", doneText: "Siamo vicini alla Luna. È ora di frenare per farci catturare.",
      next: "Vai alla fase 4: LOI", retry: "Ricalcola la TLI",
    },
    {
      n: 4, short: "LOI", name: "Orbita lunare", scene: "LOIScene",
      briefing: BriefingPhase4, panel: CalculationPanelPhase4, status: "Pianificazione LOI",
      briefTitle: "Briefing: inserimento in orbita lunare", briefText: "Calcola il Δv di frenata (LOI).",
      runTitle: "Esecuzione manovra LOI", runText: "Motori accesi in direzione retrograda. Controllo dell'inserimento orbitale in corso.",
      doneTitle: "Pronti per il rientro", doneText: "Abbiamo raccolto i dati. È ora di lasciare l'orbita lunare.",
      next: "Vai alla fase 5: TEI", retry: "Ricalcola la frenata",
    },
    {
      n: 5, short: "TEI", name: "Ritorno verso la Terra", scene: "TEIScene",
      briefing: BriefingPhase5, panel: CalculationPanelPhase5, status: "Pianificazione TEI",
      briefTitle: "Briefing: ritorno a casa", briefText: "Calcola il Δv minimo per sfuggire alla Luna (TEI).",
      runTitle: "Esecuzione manovra TEI", runText: "Accensione in direzione prograda completata. Monitoraggio della traiettoria di fuga.",
      doneTitle: "In rotta verso la Terra", doneText: "Ora prepariamoci all'ingresso in atmosfera.",
      next: "Vai alla fase 6: rientro", retry: "Ricalcola la spinta di fuga",
    },
    {
      n: 6, short: "RIENTRO", name: "Discesa e ammaraggio", scene: "ReentryScene",
      briefing: BriefingPhase6, panel: CalculationPanelPhase6, status: "Pianificazione rientro",
      briefTitle: "Briefing: discesa finale", briefText: "Calcola angolo di rientro e paracadute.",
      runTitle: "Rientro atmosferico in corso", runText: "Capsula in ingresso atmosferico. Monitoraggio di temperatura e decelerazione.",
      doneTitle: "Ammaraggio riuscito! Missione completata", doneText: "Congratulazioni, Comandante! L'equipaggio di Artemis II è tornato a casa sano e salvo.",
      next: "Genera il Flight Plan", retry: "Ricalcola il rientro",
    },
  ];

  const EMPTY_CALCS = {
    semiMajorAxis: 0, orbitalPeriod: 0, requiredFuel: 0,
    tliDeltaV: 0, loiDeltaV: 0, teiDeltaV: 0,
    reentryAngle: 0, parachuteDrogueAltitude: 0, parachuteArea: 0,
    isValid: false,
  };
  const EMPTY_TELEMETRY = { velocity: 0, altitude: 0, fuelRemaining: 100, stage: "Core Stage" };

  let phase = $derived(PHASES[$missionState.currentPhase - 1]);
  let isComplete = $derived(Boolean($missionState[`phase${phase.n}Complete`]));
  let isRunning = $derived(
    $missionState.studentCalculations.isValid && !$missionState.isAnalyzing && !$missionState.showBriefing,
  );

  const restartScene = (key) => {
    const game = window.game;
    if (!game) return;
    for (const p of PHASES) game.scene.stop(p.scene);
    game.scene.start(key);
  };

  const startAnalysis = () => missionState.update((s) => ({ ...s, showBriefing: false, isAnalyzing: true }));

  // Tornare al briefing annulla anche un calcolo già confermato:
  // altrimenti la scena partirebbe dietro il briefing.
  const backToBriefing = () =>
    missionState.update((s) => ({
      ...s,
      showBriefing: true,
      isAnalyzing: false,
      studentCalculations: { ...s.studentCalculations, isValid: false },
    }));

  // I flag "phaseNComplete" delle fasi precedenti restano: servono al Flight Plan.
  const startPhase = (n) => {
    const p = PHASES[n - 1];
    missionState.update((s) => ({
      ...s,
      currentPhase: n,
      showBriefing: true,
      isAnalyzing: false,
      [`phase${n}Complete`]: false,
      status: p.status,
      didacticFeedback: "",
      studentCalculations: { ...s.studentCalculations, isValid: false },
      ...(n <= 2 ? { telemetry: { ...EMPTY_TELEMETRY } } : {}),
    }));
    restartScene(p.scene);
  };

  const retryPhase = () => {
    missionState.update((s) => ({
      ...s,
      showBriefing: false,
      isAnalyzing: true,
      status: "In attesa di nuovi calcoli",
      didacticFeedback: "",
      studentCalculations: { ...s.studentCalculations, isValid: false },
    }));
    restartScene(phase.scene);
  };

  const nextStep = () => {
    if (phase.n === 6) missionState.update((s) => ({ ...s, showFlightPlan: true }));
    else startPhase(phase.n + 1);
  };

  const closeFlightPlan = () => missionState.update((s) => ({ ...s, showFlightPlan: false }));

  const restartMission = () => {
    missionState.update((s) => ({
      ...s,
      showFlightPlan: false,
      phase1Complete: false, phase2Complete: false, phase3Complete: false,
      phase4Complete: false, phase5Complete: false, phase6Complete: false,
      studentCalculations: { ...EMPTY_CALCS },
    }));
    startPhase(1);
  };

  let dossierTitle = $derived(
    $missionState.didacticFeedback ? $missionState.status
      : isRunning && !isComplete ? phase.runTitle
      : isComplete ? phase.doneTitle
      : phase.briefTitle,
  );
  let dossierText = $derived(
    $missionState.didacticFeedback ? $missionState.didacticFeedback
      : isRunning && !isComplete ? phase.runText
      : isComplete ? phase.doneText
      : phase.briefText,
  );

  const fmt = (v, d = 0) =>
    Number(v || 0).toLocaleString("it-IT", { minimumFractionDigits: d, maximumFractionDigits: d });

  onMount(() => {
    const onKey = (e) => {
      // Modalità Docente: Ctrl+Shift+D
      if (e.ctrlKey && e.shiftKey && e.code === "KeyD") {
        e.preventDefault();
        teacherMode.update((v) => !v);
        return;
      }
      // Salto diretto a una fase (per il docente): Ctrl+1 … Ctrl+6
      if (e.ctrlKey && !e.shiftKey && /^Digit[1-6]$/.test(e.code)) {
        e.preventDefault();
        startPhase(Number(e.code.slice(5)));
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  });
</script>

<main class="relative w-full h-screen overflow-hidden bg-space-black">
  <PhaserGame />

  <!-- HUD -->
  <div class="relative z-10 w-full h-full pointer-events-none flex flex-col justify-between p-4 gap-4">
    <!-- Barra superiore -->
    <header class="flex items-start justify-between gap-4">
      <div class="hud-box pointer-events-auto">
        <div class="mc-label">Missione Artemis II</div>
        <div class="text-lg font-bold text-white leading-tight">
          Fase {phase.n} · {phase.name}
        </div>
      </div>

      <ol class="hud-box pointer-events-auto hidden md:flex items-center gap-1 !py-2" aria-label="Avanzamento missione">
        {#each PHASES as p (p.n)}
          {@const done = $missionState[`phase${p.n}Complete`]}
          {@const current = p.n === phase.n}
          <li class="flex items-center gap-1">
            {#if p.n > 1}<span class="w-4 h-px {done || current ? 'bg-signal' : 'bg-line'}"></span>{/if}
            <span
              class="step {current ? 'step-current' : done ? 'step-done' : ''}"
              title="Fase {p.n}: {p.name}"
            >
              <span class="font-mono">{p.n}</span>
              <span class="hidden lg:inline">{p.short}</span>
            </span>
          </li>
        {/each}
      </ol>

      <div class="hud-box pointer-events-auto text-right min-w-48">
        <div class="mc-label">Stato</div>
        <div class="font-mono text-base font-bold text-orion-orange uppercase">{$missionState.status}</div>
        {#if $teacherMode}
          <div class="mt-1 text-xs font-mono font-bold text-warn uppercase tracking-wider">● Modalità docente</div>
        {/if}
      </div>
    </header>

    <!-- Telemetria -->
    <div class="flex-1 flex items-end">
      <section class="hud-box pointer-events-auto w-60" aria-label="Telemetria">
        <div class="mc-label border-b border-line pb-1.5 mb-2">Telemetria Orion</div>
        <dl class="space-y-2">
          <div class="flex justify-between items-baseline">
            <dt class="text-xs text-muted uppercase">Velocità</dt>
            <dd class="mc-data text-lg">{fmt($missionState.telemetry?.velocity, 2)} <span class="text-xs text-signal">km/s</span></dd>
          </div>
          <div class="flex justify-between items-baseline">
            <dt class="text-xs text-muted uppercase">{phase.n < 3 || phase.n === 6 ? "Quota" : "Distanza"}</dt>
            <dd class="mc-data text-lg">{fmt($missionState.telemetry?.altitude)} <span class="text-xs text-signal">km</span></dd>
          </div>
          <div>
            <div class="flex justify-between text-xs text-muted uppercase mb-1">
              <span>Propellente</span>
              <span class="mc-data">{Math.round($missionState.telemetry?.fuelRemaining || 0)}%</span>
            </div>
            <div class="w-full bg-line h-1.5 rounded-full overflow-hidden">
              <div
                class="bg-orion-orange h-full transition-[width] duration-500"
                style="width: {Math.max(0, Math.min(100, $missionState.telemetry?.fuelRemaining || 0))}%"
              ></div>
            </div>
          </div>
        </dl>
      </section>
    </div>

    <!-- Barra "Dossier" con l'azione principale -->
    <footer class="w-full flex justify-center pointer-events-auto">
      <div class="hud-box w-full max-w-5xl !p-4 flex items-center gap-6">
        <div class="flex-1 min-w-0 border-l-2 border-signal/50 pl-4">
          <div class="flex items-center gap-3 mb-1 flex-wrap">
            <span class="mc-label !text-[0.68rem] px-2 py-0.5 rounded border border-signal/30 bg-nasa-blue/15">
              {isComplete ? "Obiettivo raggiunto" : `Dossier fase ${phase.n}`}
            </span>
            <h2 class="text-base font-bold text-white">{dossierTitle}</h2>
          </div>
          <p class="text-sm text-lunar-gray/80 leading-relaxed">{dossierText}</p>
        </div>

        {#if isComplete}
          <button type="button" onclick={nextStep} class="mc-btn {phase.n === 6 ? 'mc-btn-ok' : 'mc-btn-go'} flex-none">
            {phase.next}
            <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2.5"><path stroke-linecap="round" stroke-linejoin="round" d="M13 7l5 5m0 0l-5 5m5-5H6" /></svg>
          </button>
        {:else if $missionState.studentCalculations.isValid && phase.retry && !$missionState.isAnalyzing}
          <button type="button" onclick={retryPhase} class="mc-btn mc-btn-fail flex-none">{phase.retry}</button>
        {:else if !$missionState.studentCalculations.isValid && !$missionState.showBriefing && !$missionState.isAnalyzing}
          <button type="button" onclick={startAnalysis} class="mc-btn mc-btn-primary flex-none">Apri il terminale</button>
        {/if}
      </div>
    </footer>
  </div>

  <!-- Briefing e terminali di calcolo -->
  {#if $missionState.showBriefing || $missionState.isAnalyzing}
    {@const View = $missionState.showBriefing ? phase.briefing : phase.panel}
    <div class="absolute inset-0 z-50 bg-space-black/70 backdrop-blur-[2px] flex items-center justify-center p-4">
      {#key `${phase.n}-${$missionState.showBriefing}`}
        <div class="w-full flex justify-center mc-enter">
          {#if $missionState.showBriefing}
            <View onStartAnalysis={startAnalysis} />
          {:else}
            <View onBack={backToBriefing} />
          {/if}
        </div>
      {/key}
    </div>
  {/if}

  {#if $missionState.showFlightPlan}
    <FlightPlan onClose={closeFlightPlan} onRestart={restartMission} />
  {/if}
</main>

<style>
  .hud-box {
    background: color-mix(in srgb, var(--color-panel) 82%, transparent);
    border: 1px solid var(--color-line);
    border-radius: 0.6rem;
    padding: 0.75rem 1rem;
    backdrop-filter: blur(6px);
  }
  .step {
    display: inline-flex;
    align-items: center;
    gap: 0.35rem;
    padding: 0.2rem 0.55rem;
    border-radius: 999px;
    border: 1px solid var(--color-line);
    font-size: 0.72rem;
    font-weight: 700;
    letter-spacing: 0.08em;
    color: var(--color-muted);
  }
  .step-done {
    border-color: color-mix(in srgb, var(--color-signal) 50%, transparent);
    color: var(--color-signal);
  }
  .step-current {
    background: var(--color-nasa-blue);
    border-color: var(--color-nasa-blue);
    color: #fff;
  }
</style>
