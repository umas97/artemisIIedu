<script>
  import { math } from '../actions/math.js';
  import PanelHeader from './ui/PanelHeader.svelte';
  import RealityNote from './ui/RealityNote.svelte';

  let { onStartAnalysis } = $props();
</script>

<div class="mc-panel mc-enter w-full max-w-5xl p-6 md:p-8">
  <PanelHeader step={5} kicker="Briefing · Trans-Earth Injection (TEI)" title="Ritorno a casa" />

  <p class="text-base leading-relaxed mb-5">
    Ottimo lavoro, Comandante. Orion percorre un'orbita circolare a <strong class="text-white">100 km</strong> di quota
    sopra la Luna. Per tornare verso la Terra dobbiamo uscire dal "pozzo gravitazionale" della Luna: un'accensione del
    motore deve aumentare la nostra velocità quanto basta per sfuggire alla sua attrazione.
  </p>

  <div class="grid gap-4 md:grid-cols-2 mb-4">
    <section class="mc-card">
      <h3 class="mc-label mb-2">L'obiettivo</h3>
      <p class="text-sm leading-relaxed">
        Accendiamo il motore in modo <strong class="text-white">progrado</strong>, cioè nella stessa direzione del moto:
        così aumentano la velocità e l'energia cinetica. Dobbiamo passare dalla velocità circolare
        <span use:math={{ expression: 'v_{circ}' }}></span> alla
        <strong class="text-white">velocità di fuga</strong> <span use:math={{ expression: 'v_{fuga}' }}></span>.
        La differenza è il <strong class="text-white">Δv minimo</strong> della manovra, cioè la variazione di velocità
        che il motore deve produrre.
      </p>
    </section>

    <section class="mc-card">
      <h3 class="mc-label mb-2">Principio fisico</h3>
      <ul class="text-sm leading-relaxed list-disc pl-5 space-y-1.5">
        <li>
          Un corpo sfugge alla gravità quando la sua energia meccanica totale (cinetica + potenziale gravitazionale)
          diventa maggiore o uguale a zero.
        </li>
        <li>
          La velocità di fuga dipende dalla massa del corpo celeste (qui la Luna, il satellite naturale della Terra) e
          dalla distanza dal suo centro.
        </li>
        <li>
          Con un Δv più piccolo del minimo Orion resta legata alla Luna: la sua orbita diventa un'ellisse più allungata,
          ma non se ne va.
        </li>
      </ul>
    </section>
  </div>

  <div class="grid gap-4 md:grid-cols-3 mb-4">
    <div class="mc-card flex flex-col items-center justify-center text-center">
      <div class="mc-label mb-1">Velocità circolare</div>
      <div use:math={{ expression: 'v_{circ} = \\sqrt{\\frac{GM_{Luna}}{r}}', displayMode: true }}></div>
    </div>
    <div class="mc-card flex flex-col items-center justify-center text-center">
      <div class="mc-label mb-1">Velocità di fuga</div>
      <div use:math={{ expression: 'v_{fuga} = \\sqrt{\\frac{2GM_{Luna}}{r}}', displayMode: true }}></div>
    </div>
    <div class="mc-card flex flex-col items-center justify-center text-center">
      <div class="mc-label mb-1">Δv minimo per la fuga</div>
      <div use:math={{ expression: '\\Delta v_{min} = v_{fuga} - v_{circ}', displayMode: true }}></div>
    </div>
  </div>

  <p class="text-sm leading-relaxed text-muted mb-4">
    Con esattamente il Δv minimo Orion si allontanerebbe dalla Luna rallentando sempre di più, senza mai fermarsi del
    tutto: è il limite tra restare legati e sfuggire. Per tornare davvero verso la Terra in pochi giorni serve
    <strong class="text-lunar-gray">un po' più del minimo</strong> (le missioni Apollo usavano circa 1 km/s). Attenzione
    però a non esagerare: ogni m/s in più consuma propellente prezioso.
  </p>

  <RealityNote>
    Artemis II non entra in orbita attorno alla Luna e quindi non esegue questa accensione: compie un sorvolo su una
    traiettoria di <strong class="text-lunar-gray">libero ritorno</strong> (free-return), in cui è la gravità della Luna a
    curvare la rotta di Orion di nuovo verso la Terra. Qui l'orbita lunare è un esercizio, come nelle missioni Apollo e
    nelle future Artemis III e successive.
  </RealityNote>

  <div class="flex justify-end mt-6">
    <button type="button" class="mc-btn mc-btn-primary" onclick={onStartAnalysis}>
      Apri il terminale di calcolo
      <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2.5"><path stroke-linecap="round" stroke-linejoin="round" d="M13 7l5 5m0 0l-5 5m5-5H6" /></svg>
    </button>
  </div>
</div>
