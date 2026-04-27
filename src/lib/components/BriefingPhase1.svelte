<script>
  import { missionState } from '../stores/missionStore';
  import { math } from '../actions/math.js';
  
  const startAnalysis = () => {
    missionState.update(state => ({ ...state, showBriefing: false, isAnalyzing: true }));
  };
</script>

<div class="max-w-4xl bg-black/90 backdrop-blur-md border border-nasa-blue/40 p-6 rounded-2xl shadow-2xl text-lunar-gray overflow-hidden">
  <h2 class="text-2xl font-bold text-white mb-4 border-b border-nasa-blue pb-2 uppercase tracking-tighter text-center">Briefing Missione: Fase 1</h2>
  
  <div class="grid grid-cols-1 md:grid-cols-2 gap-6 text-[13px] leading-relaxed">
    <!-- Left Column -->
    <div class="space-y-4">
      <section>
        <h3 class="text-orion-orange font-bold uppercase mb-1 text-xs tracking-widest">Contesto e Obiettivo</h3>
        <p class="text-justify italic opacity-90">
          Si consideri la capsula Orion nel corso della missione Artemis II. Al fine di validare i sistemi di supporto vitale e le capacità di comunicazione in ambiente di spazio profondo, il veicolo deve essere immesso in un'orbita terrestre ad alta ellitticità (High Earth Orbit - HEO). 
          Lo studente è chiamato a determinare i parametri geometrici e temporali fondamentali di tale traiettoria, basandosi sui dati telemetrici forniti e applicando i principi della meccanica celeste.
        </p>
      </section>

      <section class="bg-nasa-blue/10 border-l-4 border-nasa-blue p-3 italic text-xs">
        "L'Asse Maggiore è la distanza massima tra Apogeo e Perigeo, passante per il centro della Terra."
      </section>

      <section>
        <h3 class="text-orion-orange font-bold uppercase mb-1 text-xs tracking-widest">I Dati della Missione</h3>
        <ul class="space-y-1 font-mono text-[11px] bg-black/20 p-3 rounded-lg border border-white/5">
          <li>Raggio Terrestre: <span use:math={{expression: 'R_e = 6.371\\text{ km}'}}></span></li>
          <li>Altezza Perigeo: <span use:math={{expression: 'h_p = 192\\text{ km}'}}></span></li>
          <li>Altezza Apogeo: <span use:math={{expression: 'h_a = 70.174\\text{ km}'}}></span></li>
          <li>Costante Gravitazionale: <span use:math={{expression: 'GM = 3,986 \\times 10^{14}\\text{ m}^3/\\text{s}^2'}}></span></li>
        </ul>
      </section>
    </div>

    <!-- Right Column -->
    <div class="space-y-4">
      <section>
        <h3 class="text-orion-orange font-bold uppercase mb-1 text-xs tracking-widest">Sfida Logica</h3>
        <div class="space-y-3">
          <div class="bg-white/5 p-3 rounded-lg border border-white/5">
            <p class="font-bold text-nasa-blue mb-1 text-[12px]">1. Il Semiasse Maggiore (<span use:math={{expression: 'a'}}></span>)</p>
            <p class="text-[11px] opacity-80">
              L'altezza (<span use:math={{expression: 'h'}}></span>) è dalla superficie. Calcola l'Asse Maggiore dal centro della Terra e ricavane la metà.
            </p>
          </div>
          <div class="bg-white/5 p-3 rounded-lg border border-white/5">
            <p class="font-bold text-nasa-blue mb-1 text-[12px]">2. Il Periodo Orbitale (<span use:math={{expression: 'T'}}></span>)</p>
            <p class="text-[11px] opacity-80 mb-2">
              Usa la terza legge di Keplero per legare spazio e tempo:
            </p>
            <div class="bg-black/40 py-2 rounded border border-nasa-blue/20 scale-90 origin-center">
              <div use:math={{expression: '\\frac{T^2}{a^3} = \\frac{4\\pi^2}{GM}', displayMode: true}}></div>
            </div>
          </div>
        </div>
      </section>
    </div>
  </div>

  <div class="flex justify-center mt-6">
    <button 
      on:click={startAnalysis}
      class="bg-nasa-blue hover:bg-blue-600 text-white px-8 py-3 rounded-full font-bold transition-all transform hover:scale-105 active:scale-95 shadow-lg shadow-blue-900/40 uppercase tracking-widest text-xs"
    >
      Accedi al Computer di Bordo
    </button>
  </div>
</div>
