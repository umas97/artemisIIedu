<script>
  import { onMount } from 'svelte';
  import PhaserGame from './lib/phaser/PhaserGame.svelte';
  import { missionState } from './lib/stores/missionStore';
  import BriefingPhase1 from './lib/components/BriefingPhase1.svelte';
  import BriefingPhase2 from './lib/components/BriefingPhase2.svelte';
  import BriefingPhase3 from './lib/components/BriefingPhase3.svelte';
  import CalculationPanel from './lib/components/CalculationPanel.svelte';
  import CalculationPanelPhase2 from './lib/components/CalculationPanelPhase2.svelte';
  import CalculationPanelPhase3 from './lib/components/CalculationPanelPhase3.svelte';
  import './app.css';

  const startAnalysis = () => {
    missionState.update(s => ({ ...s, showBriefing: false, isAnalyzing: true }));
  };

  const backToBriefing = () => {
    missionState.update(s => ({ ...s, showBriefing: true, isAnalyzing: false }));
  };

  const goToPhase1 = () => {
    missionState.update(s => ({
      ...s,
      currentPhase: 1,
      showBriefing: true,
      isAnalyzing: false,
      phase1Complete: false,
      phase2Complete: false,
      phase3Complete: false,
      status: "Checkout Sistemi"
    }));
    if (window.game) {
      window.game.scene.stop('LaunchScene');
      window.game.scene.stop('TLIScene');
      window.game.scene.start('EarthOrbitScene');
    }
  };

  const startPhase2 = () => {
    missionState.update(s => ({ 
      ...s, 
      currentPhase: 2, 
      showBriefing: true, 
      isAnalyzing: false,
      phase1Complete: false,
      phase2Complete: false,
      status: "Configurazione SLS",
      studentCalculations: { ...s.studentCalculations, isValid: false },
      telemetry: { velocity: 0, altitude: 0, fuelRemaining: 100, stage: "Core Stage" }
    }));

    setTimeout(() => {
      if (window.game) {
        window.game.scene.stop('EarthOrbitScene');
        window.game.scene.stop('TLIScene');
        window.game.scene.start('LaunchScene');
      }
    }, 50);
  };

  const startPhase3 = () => {
    missionState.update(s => ({
      ...s,
      currentPhase: 3,
      showBriefing: true,
      isAnalyzing: false,
      phase2Complete: false,
      phase3Complete: false,
      status: "Pianificazione TLI",
      studentCalculations: { ...s.studentCalculations, isValid: false }
    }));

    setTimeout(() => {
      if (window.game) {
        window.game.scene.stop('LaunchScene');
        window.game.scene.stop('EarthOrbitScene');
        window.game.scene.start('TLIScene');
      }
    }, 50);
  };

  const retryPhase3 = () => {
    missionState.update(s => ({ 
      ...s, 
      showBriefing: false, 
      isAnalyzing: true, 
      status: "In attesa di nuovi calcoli",
      didacticFeedback: "",
      studentCalculations: { ...s.studentCalculations, isValid: false } 
    }));
    // Reset della scena per permettere un nuovo tentativo pulito
    if (window.game) {
      window.game.scene.stop('TLIScene');
      window.game.scene.start('TLIScene');
    }
  };

  onMount(() => {
    const handleKeyDown = (e) => {
      if (e.ctrlKey && !e.shiftKey) {
        if (e.key === '1') { e.preventDefault(); goToPhase1(); }
        if (e.key === '2') { e.preventDefault(); startPhase2(); }
        if (e.key === '3') { e.preventDefault(); startPhase3(); }
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  });
</script>

<main class="relative w-full h-screen overflow-hidden bg-space-black">
  <PhaserGame />

  <div class="relative z-10 w-full h-full pointer-events-none flex flex-col justify-between p-8">
    <div class="absolute inset-0 pointer-events-none flex items-center justify-center z-50">
      {#if $missionState.showBriefing}
        <div class="pointer-events-auto bg-black/40 backdrop-blur-sm w-full h-full flex items-center justify-center">
          {#if $missionState.currentPhase === 1}
            <BriefingPhase1 onStartAnalysis={startAnalysis} />
          {:else if $missionState.currentPhase === 2}
            <BriefingPhase2 onStartAnalysis={startAnalysis} />
          {:else if $missionState.currentPhase === 3}
            <BriefingPhase3 onStartAnalysis={startAnalysis} />
          {/if}
        </div>
      {:else if $missionState.isAnalyzing}
        <div class="pointer-events-auto bg-black/40 backdrop-blur-sm w-full h-full flex items-center justify-center">
          {#if $missionState.currentPhase === 1}
            <CalculationPanel onBack={backToBriefing} />
          {:else if $missionState.currentPhase === 2}
            <CalculationPanelPhase2 onBack={backToBriefing} />
          {:else if $missionState.currentPhase === 3}
            <CalculationPanelPhase3 onBack={backToBriefing} />
          {/if}
        </div>
      {/if}
    </div>

    <div class="flex justify-between items-start pointer-events-auto">
      <div class="bg-black/60 backdrop-blur-md border border-nasa-blue/30 p-4 rounded-lg shadow-lg">
        <h1 class="text-2xl font-bold text-white tracking-wider uppercase">Missione Artemis II</h1>
        <p class="text-nasa-blue font-mono text-xs italic">Fase {$missionState.currentPhase}: 
          {$missionState.currentPhase === 1 ? 'Checkout Orbitale' : 
           $missionState.currentPhase === 2 ? 'Iniezione Orbitale' : 'Rotta Cis-Lunare'}
        </p>
      </div>

      <div class="bg-black/60 backdrop-blur-md border border-nasa-blue/30 p-4 rounded-lg shadow-lg text-right min-w-[200px]">
        <div class="text-[10px] text-nasa-blue uppercase tracking-widest font-bold mb-1">Status</div>
        <div class="text-xl font-mono text-orion-orange animate-pulse uppercase tracking-tighter">{$missionState.status}</div>
      </div>
    </div>

    <div class="flex justify-between items-end pointer-events-none">
      <div class="space-y-4">
        <div class="bg-black/60 backdrop-blur-md border border-nasa-blue/20 p-4 rounded-lg w-56 pointer-events-auto shadow-xl">
          <div class="text-[10px] text-nasa-blue uppercase tracking-widest font-bold mb-2 border-b border-nasa-blue/20 pb-1">Telemetria Orion</div>
          
          <div class="grid grid-cols-1 gap-3">
            <div class="flex justify-between items-end">
              <div class="text-[9px] text-white/50 uppercase">Velocità</div>
              <div class="text-lg font-mono text-white leading-none tracking-tighter">
                {($missionState.telemetry?.velocity || 0).toFixed(2)} <span class="text-[9px] text-nasa-blue">km/s</span>
              </div>
            </div>
            <div class="flex justify-between items-end">
              <div class="text-[9px] text-white/50 uppercase">
                {$missionState.currentPhase < 3 ? 'Altitudine' : 'Distanza Terra'}
              </div>
              <div class="text-lg font-mono text-white leading-none tracking-tighter">
                {($missionState.telemetry?.altitude || 0).toFixed(0)} <span class="text-[9px] text-nasa-blue">km</span>
              </div>
            </div>
            <div>
              <div class="flex justify-between text-[9px] text-white/50 uppercase mb-1">
                <span>Propellente</span>
                <span>{Math.round($missionState.telemetry?.fuelRemaining || 0)}%</span>
              </div>
              <div class="w-full bg-white/10 h-1.5 rounded-full overflow-hidden border border-white/5">
                <div class="bg-orion-orange h-full transition-all duration-500 shadow-[0_0_10px_rgba(255,62,0,0.5)]" style="width: {$missionState.telemetry?.fuelRemaining || 0}%"></div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <div class="w-full flex justify-center pointer-events-auto">
      <div class="bg-black/90 backdrop-blur-xl border-t border-nasa-blue/40 w-full max-w-4xl p-5 rounded-t-2xl shadow-[0_-15px_40px_rgba(0,50,160,0.4)]">
        <div class="flex items-center gap-8">
          <div class="flex-1 border-l-2 border-nasa-blue/30 pl-6">
            <div class="flex items-center gap-2 mb-1">
              <span class="px-2 py-0.5 bg-nasa-blue/20 text-nasa-blue text-[9px] font-bold rounded uppercase tracking-widest border border-nasa-blue/30">
                {$missionState.phase3Complete && $missionState.currentPhase === 3 ? 'Obiettivo Raggiunto' : `Dossier Fase ${$missionState.currentPhase}`}
              </span>
              <h2 class="text-md font-bold text-white uppercase tracking-tight">
                {#if $missionState.didacticFeedback}
                  {$missionState.status}
                {:else if $missionState.studentCalculations.isValid && !$missionState.isAnalyzing && !$missionState.showBriefing}
                  {$missionState.currentPhase === 2 ? 'Lancio SLS in corso' : 'Esecuzione Manovra TLI'}
                {:else if $missionState.phase2Complete && $missionState.currentPhase === 2}
                  Lancio Completato: Orbita Stabilizzata
                {:else}
                  {$missionState.currentPhase === 1 ? 'Briefing: Analisi Orbitale' : 
                   $missionState.currentPhase === 2 ? 'Briefing: Calcolo Propulsione' : 'Briefing: Iniezione Trans-Lunare'}
                {/if}
              </h2>
            </div>
            <p class="text-[13px] text-gray-400 leading-relaxed max-w-2xl italic">
              {#if $missionState.didacticFeedback}
                {$missionState.didacticFeedback}
              {:else if $missionState.studentCalculations.isValid && !$missionState.isAnalyzing && !$missionState.showBriefing}
                {#if $missionState.currentPhase === 2}
                  I motori RS-25 sono a pieno regime. Orion sta lasciando la rampa 39B del Kennedy Space Center.
                {:else}
                  Il motore ICPS ha terminato la spinta. Inizia la fase di crociera cis-lunare verso l'obiettivo.
                {/if}
              {:else if $missionState.phase2Complete && $missionState.currentPhase === 2}
                Ottimo lavoro, Comandante. L'SLS ci ha portati in orbita. Ora dobbiamo calcolare il salto verso la Luna.
              {:else}
                {$missionState.currentPhase === 1 ? 'Analizza i parametri dell\'orbita di parcheggio...' : 
                 $missionState.currentPhase === 2 ? 'Pianifica il decollo dell\'SLS...' : 'Calcola il Delta-v necessario per la Luna...'}
              {/if}
            </p>
          </div>
          
          {#if $missionState.phase1Complete && $missionState.currentPhase === 1}
            <button onclick={startPhase2} class="bg-orion-orange hover:bg-orange-600 text-white px-10 py-4 rounded-xl font-black transition-all transform hover:scale-105 active:scale-95 shadow-lg shadow-orange-900/40 uppercase tracking-widest text-[11px] border border-white/10 animate-pulse">Vai al Lancio SLS</button>
          {:else if $missionState.phase2Complete && $missionState.currentPhase === 2}
            <button onclick={startPhase3} class="bg-orion-orange hover:bg-orange-600 text-white px-10 py-4 rounded-xl font-black transition-all transform hover:scale-105 active:scale-95 shadow-lg shadow-orange-900/40 uppercase tracking-widest text-[11px] border border-white/10 animate-pulse">Pianifica TLI</button>
          {:else if $missionState.phase3Complete && $missionState.currentPhase === 3}
            <button onclick={() => alert("Fase 4: Iniezione Orbitale Lunare - Prossimamente")} class="bg-green-600 hover:bg-green-500 text-white px-10 py-4 rounded-xl font-black transition-all transform hover:scale-105 active:scale-95 shadow-lg shadow-green-900/40 uppercase tracking-widest text-[11px] border border-white/10 animate-pulse">Vai alla Fase 4: LOI</button>
          {:else if $missionState.studentCalculations.isValid && $missionState.currentPhase === 3 && !$missionState.phase3Complete}
            <button onclick={retryPhase3} class="bg-red-600 hover:bg-red-500 text-white px-10 py-4 rounded-xl font-black transition-all transform hover:scale-105 active:scale-95 shadow-lg shadow-red-900/40 uppercase tracking-widest text-[11px] border border-white/10">Ricalcola Manovra</button>
          {:else if !$missionState.studentCalculations.isValid && !$missionState.showBriefing}
            <button onclick={startAnalysis} class="bg-nasa-blue hover:bg-blue-600 text-white px-10 py-4 rounded-xl font-black transition-all transform hover:scale-105 active:scale-95 shadow-lg shadow-blue-900/40 uppercase tracking-widest text-[11px] border border-white/10">Inizia Analisi</button>
          {/if}
        </div>
      </div>
    </div>
  </div>
</main>

<style>
  :global(body) { background-color: #050505; color: white; }
</style>
