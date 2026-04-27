<script>
  import { missionState } from '../stores/missionStore';
  import { math } from '../actions/math.js';
  export let onStartAnalysis;
</script>

<div class="max-w-3xl bg-black/85 backdrop-blur-2xl border border-nasa-blue/40 rounded-3xl p-10 shadow-2xl text-white">
  <div class="flex items-center gap-5 mb-8">
    <div class="w-14 h-14 bg-nasa-blue/20 rounded-2xl flex items-center justify-center border border-nasa-blue/40 rotate-3">
      <span class="text-nasa-blue font-black text-2xl">04</span>
    </div>
    <div>
      <h2 class="text-3xl font-black uppercase tracking-tighter italic">Fase 4: Orbitazione Lunare</h2>
      <p class="text-nasa-blue font-mono text-[10px] uppercase tracking-[0.3em]">Protocollo Lunar Orbit Insertion (LOI)</p>
    </div>
  </div>

  <div class="space-y-6 text-[13px] leading-relaxed text-gray-300">
    <p>
      Comandante, la crociera cis-lunare è terminata. Ci stiamo avvicinando alla Luna lungo una traiettoria iperbolica con un'alta velocità residua.
      Se non interveniamo, la gravità lunare devierà la nostra rotta ma non sarà sufficiente per trattenerci: verremmo scagliati di nuovo nello spazio profondo.
    </p>

    <div class="grid grid-cols-2 gap-6 my-8">
      <div class="bg-white/5 p-5 rounded-2xl border border-white/5">
        <h4 class="text-nasa-blue font-black text-[10px] uppercase mb-3 tracking-widest">Il Problema</h4>
        <p class="text-xs italic leading-snug">
          Per entrare in un'orbita stabile attorno alla Luna, dobbiamo effettuare una manovra di "Lunar Orbit Insertion" (LOI). 
          Al momento del massimo avvicinamento (perilunio), dobbiamo ruotare la navicella e accendere i motori in senso contrario per frenare (retro-burn).
        </p>
      </div>
      <div class="bg-white/5 p-5 rounded-2xl border border-white/5">
        <h4 class="text-orion-orange font-black text-[10px] uppercase mb-3 tracking-widest">Domande Guida</h4>
        <ul class="text-[11px] list-disc list-inside space-y-2 text-gray-400">
          <li>Qual è la velocità dell'orbita circolare che vogliamo raggiungere?</li>
          <li>Quanto dobbiamo frenare (Delta-v) rispetto alla nostra velocità di arrivo?</li>
          <li>Cosa succede se freniamo troppo o troppo poco?</li>
        </ul>
      </div>
    </div>

    <div class="space-y-4">
      <h3 class="text-white font-bold uppercase text-xs tracking-widest flex items-center gap-2">
        <span class="w-2 h-2 bg-nasa-blue rounded-full"></span> Strumenti di Analisi
      </h3>
      <p>
        Calcola la velocità necessaria per mantenere un'orbita circolare stabile di parcheggio lunare (v_circ), usando la massa della Luna e il raggio dell'orbita (r = R_Luna + h). 
        Il tuo obiettivo sarà determinare il Δv (la differenza tra la velocità con cui stiamo arrivando e la v_circ).
      </p>
      <div class="bg-black/50 p-4 rounded-xl text-center border border-nasa-blue/20 shadow-inner my-4 overflow-x-auto text-[16px]">
        <div use:math={{expression: 'v_{circ} = \\sqrt{\\frac{GM_{Luna}}{r}}', displayMode: true}}></div>
      </div>
    </div>

    <div class="flex gap-4 pt-6">
      <button 
        onclick={onStartAnalysis}
        class="flex-1 bg-nasa-blue hover:bg-blue-600 text-white font-black py-5 rounded-2xl uppercase tracking-widest text-xs transition-all transform hover:scale-[1.02] active:scale-95 shadow-xl shadow-blue-900/40 border border-white/10"
      >
        Inizia Analisi del LOI
      </button>
    </div>
  </div>
</div>
