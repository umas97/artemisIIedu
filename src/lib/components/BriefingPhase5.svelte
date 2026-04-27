<script>
  import { math } from '../actions/math.js';
  export let onStartAnalysis;
</script>

<div class="max-w-3xl bg-black/85 backdrop-blur-2xl border border-nasa-blue/40 rounded-3xl p-10 shadow-2xl text-white">
  <div class="flex items-center gap-5 mb-8">
    <div class="w-14 h-14 bg-nasa-blue/20 rounded-2xl flex items-center justify-center border border-nasa-blue/40 rotate-3">
      <span class="text-nasa-blue font-black text-2xl">05</span>
    </div>
    <div>
      <h2 class="text-3xl font-black uppercase tracking-tighter italic">Fase 5: Ritorno a Casa</h2>
      <p class="text-nasa-blue font-mono text-[10px] uppercase tracking-[0.3em]">Protocollo Trans-Earth Injection (TEI)</p>
    </div>
  </div>

  <div class="space-y-6 text-[13px] leading-relaxed text-gray-300">
    <p>
      Ottimo lavoro finora, Comandante. Abbiamo esplorato l'orbita lunare e raccolto i dati necessari. Ora è il momento di tornare sulla Terra.
      Attualmente siamo intrappolati nel "pozzo gravitazionale" della Luna. Per tornare a casa, dobbiamo vincere questa attrazione.
    </p>

    <div class="grid grid-cols-2 gap-6 my-8">
      <div class="bg-white/5 p-5 rounded-2xl border border-white/5">
        <h4 class="text-nasa-blue font-black text-[10px] uppercase mb-3 tracking-widest">L'Obiettivo</h4>
        <p class="text-xs italic leading-snug">
          Dobbiamo eseguire un'accensione dei motori "prograda" (nella stessa direzione del nostro moto) per aumentare la nostra energia cinetica.
          L'obiettivo è raggiungere e superare la <span class="text-white font-bold">velocità di fuga</span> lunare, necessaria per liberarci definitivamente dalla sua orbita.
        </p>
      </div>
      <div class="bg-white/5 p-5 rounded-2xl border border-white/5">
        <h4 class="text-orion-orange font-black text-[10px] uppercase mb-3 tracking-widest">Principio Fisico</h4>
        <ul class="text-[11px] list-disc list-inside space-y-2 text-gray-400">
          <li>Un corpo sfugge alla gravità quando la sua energia totale (cinetica + potenziale) diventa maggiore o uguale a zero.</li>
          <li>La velocità di fuga (v_esc) dipende dalla massa del pianeta e dalla distanza dal suo centro.</li>
          <li>Senza spinta sufficiente, ricadremo in orbita ellittica attorno alla Luna.</li>
        </ul>
      </div>
    </div>

    <div class="space-y-4">
      <h3 class="text-white font-bold uppercase text-xs tracking-widest flex items-center gap-2">
        <span class="w-2 h-2 bg-nasa-blue rounded-full"></span> Formula di Fuga
      </h3>
      <p>
        La velocità di fuga da un'orbita circolare può essere ricavata facilmente. Ricordi la velocità circolare (v_circ) della Fase 4? 
        Per la conservazione dell'energia meccanica, la velocità di fuga è esattamente uguale alla velocità circolare moltiplicata per la radice quadrata di due (circa 1,414).
      </p>
      <div class="bg-black/50 p-4 rounded-xl text-center border border-nasa-blue/20 shadow-inner my-4 overflow-x-auto text-[16px]">
        <div use:math={{expression: 'v_{esc} = \\sqrt{\\frac{2GM_{Luna}}{r}} = \\sqrt{2} \\cdot v_{circ}', displayMode: true}}></div>
      </div>
    </div>

    <div class="flex gap-4 pt-6">
      <button 
        onclick={onStartAnalysis}
        class="flex-1 bg-nasa-blue hover:bg-blue-600 text-white font-black py-5 rounded-2xl uppercase tracking-widest text-xs transition-all transform hover:scale-[1.02] active:scale-95 shadow-xl shadow-blue-900/40 border border-white/10"
      >
        Inizia Analisi per il Rientro
      </button>
    </div>
  </div>
</div>
