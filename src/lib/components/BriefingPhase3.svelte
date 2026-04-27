<script>
  import { missionState } from '../stores/missionStore';
  import { math } from '../actions/math.js';
  export let onStartAnalysis;
</script>

<div class="max-w-3xl bg-black/85 backdrop-blur-2xl border border-nasa-blue/40 rounded-3xl p-10 shadow-2xl text-white">
  <div class="flex items-center gap-5 mb-8">
    <div class="w-14 h-14 bg-nasa-blue/20 rounded-2xl flex items-center justify-center border border-nasa-blue/40 rotate-3">
      <span class="text-nasa-blue font-black text-2xl">03</span>
    </div>
    <div>
      <h2 class="text-3xl font-black uppercase tracking-tighter italic">Fase 3: Il Salto Cis-Lunare</h2>
      <p class="text-nasa-blue font-mono text-[10px] uppercase tracking-[0.3em]">Protocollo Trans-Lunar Injection</p>
    </div>
  </div>

  <div class="space-y-6 text-[13px] leading-relaxed text-gray-300">
    <p>
      Comandante, Orion ha completato con successo i checkout in orbita bassa. Ora ci troviamo di fronte alla manovra più energetica della missione: dobbiamo vincere la morsa della gravità terrestre per raggiungere la Luna.
    </p>

    <div class="grid grid-cols-2 gap-6 my-8">
      <div class="bg-white/5 p-5 rounded-2xl border border-white/5">
        <h4 class="text-nasa-blue font-black text-[10px] uppercase mb-3 tracking-widest">Il Problema</h4>
        <p class="text-xs italic leading-snug">
          Un'orbita circolare è un equilibrio perfetto. Per uscirne, dobbiamo aggiungere energia cinetica. Ma quanta? Se spingiamo troppo poco, l'ellisse non toccherà la Luna. Se spingiamo troppo, Orion non verrà catturata e si perderà nello spazio profondo.
        </p>
      </div>
      <div class="bg-white/5 p-5 rounded-2xl border border-white/5">
        <h4 class="text-orion-orange font-black text-[10px] uppercase mb-3 tracking-widest">Domande Guida</h4>
        <ul class="text-[11px] list-disc list-inside space-y-2 text-gray-400">
          <li>Qual è la distanza massima (apogeo) che vogliamo raggiungere?</li>
          <li>Come influisce la velocità iniziale sulla forma dell'ellisse?</li>
          <li>Qual è la differenza tra la nostra velocità attuale e quella necessaria?</li>
        </ul>
      </div>
    </div>

    <div class="space-y-4">
      <h3 class="text-white font-bold uppercase text-xs tracking-widest flex items-center gap-2">
        <span class="w-2 h-2 bg-nasa-blue rounded-full"></span> Strumenti di Analisi
      </h3>
      <p>
        Dobbiamo pianificare un'orbita di trasferimento. Immagina un'ellisse il cui <span class="text-white font-bold italic">perigeo</span> è la nostra posizione attuale e il cui <span class="text-white font-bold italic">apogeo</span> è la posizione della Luna. 
      </p>
      <p>
        Utilizza i dati di telemetria per determinare il <span class="text-nasa-blue">Semiasse Maggiore (a)</span> di questa nuova orbita e applica l'equazione dell'energia orbitale (Vis-Viva) per trovare la velocità necessaria al momento dell'accensione.
      </p>
      <div class="bg-black/50 p-4 rounded-xl text-center border border-nasa-blue/20 shadow-inner my-4 overflow-x-auto text-[16px]">
        <div use:math={{expression: 'v = \\sqrt{GM \\left( \\frac{2}{r} - \\frac{1}{a} \\right)}', displayMode: true}}></div>
      </div>
    </div>

    <div class="flex gap-4 pt-6">
      <button 
        onclick={onStartAnalysis}
        class="flex-1 bg-nasa-blue hover:bg-blue-600 text-white font-black py-5 rounded-2xl uppercase tracking-widest text-xs transition-all transform hover:scale-[1.02] active:scale-95 shadow-xl shadow-blue-900/40 border border-white/10"
      >
        Inizia Analisi delle Traiettorie
      </button>
    </div>
  </div>
</div>
