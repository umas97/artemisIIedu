<script>
  import { math } from '../actions/math.js';
  import PanelHeader from './ui/PanelHeader.svelte';
  import RealityNote from './ui/RealityNote.svelte';
  import { EARTH, HEO } from '../physics/constants.js';

  let { onStartAnalysis } = $props();

  const km = (m) => (m / 1000).toLocaleString('it-IT');
</script>

<div class="mc-panel w-full max-w-5xl p-6 md:p-8">
  <PanelHeader step={1} kicker="Briefing · Orbita alta (HEO) · Leggi di Keplero" title="Checkout orbitale" />

  <div class="space-y-5 text-base leading-relaxed">
    <p>
      Comandante, benvenuto al centro di controllo della missione <strong class="text-white">Artemis II</strong>.
      Dopo il lancio, Orion viene portata su un'<strong class="text-white">orbita terrestre alta</strong> (High Earth Orbit,
      HEO), un'ellisse molto allungata su cui l'equipaggio controlla tutti i sistemi prima di partire verso la Luna.
      Il tuo compito è calcolarne i parametri fondamentali: <strong class="text-white">semiasse maggiore</strong> e
      <strong class="text-white">periodo</strong>.
    </p>

    <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
      <div class="mc-card space-y-3">
        <div class="mc-label">Dati di missione</div>
        <dl class="space-y-2 text-sm">
          <div class="flex justify-between gap-4">
            <dt class="text-muted">Raggio terrestre</dt>
            <dd class="mc-data"><span use:math={{ expression: `R_T = ${km(EARTH.R)}\\text{ km}` }}></span></dd>
          </div>
          <div class="flex justify-between gap-4">
            <dt class="text-muted">Quota del perigeo</dt>
            <dd class="mc-data"><span use:math={{ expression: `h_p = ${km(HEO.hp)}\\text{ km}` }}></span></dd>
          </div>
          <div class="flex justify-between gap-4">
            <dt class="text-muted">Quota dell'apogeo</dt>
            <dd class="mc-data"><span use:math={{ expression: `h_a = ${km(HEO.ha)}\\text{ km}` }}></span></dd>
          </div>
          <div class="flex justify-between gap-4">
            <dt class="text-muted">Costante di gravitazione</dt>
            <dd class="mc-data"><span use:math={{ expression: 'G = 6{,}674 \\times 10^{-11}\\ \\text{N·m}^2/\\text{kg}^2' }}></span></dd>
          </div>
          <div class="flex justify-between gap-4">
            <dt class="text-muted">Massa della Terra</dt>
            <dd class="mc-data"><span use:math={{ expression: 'M = 5{,}972 \\times 10^{24}\\text{ kg}' }}></span></dd>
          </div>
          <div class="flex justify-between gap-4">
            <dt class="text-muted">Prodotto</dt>
            <dd class="mc-data"><span use:math={{ expression: `GM \\approx ${String(EARTH.GM / 1e14).replace('.', '{,}')} \\times 10^{14}\\ \\text{m}^3/\\text{s}^2` }}></span></dd>
          </div>
        </dl>
        <p class="text-sm text-muted border-l-2 border-signal/50 pl-3">
          Le quote <span use:math={{ expression: 'h' }}></span> sono misurate dalla <strong class="text-lunar-gray">superficie</strong>
          della Terra; le leggi di Keplero usano invece le distanze dal <strong class="text-lunar-gray">centro</strong> della Terra
          (che si trova in uno dei due fuochi dell'ellisse).
        </p>
      </div>

      <div class="space-y-4">
        <div class="mc-card">
          <div class="mc-label mb-2">1 · Semiasse maggiore <span use:math={{ expression: 'a' }}></span></div>
          <p class="text-sm mb-3">
            L'<strong class="text-white">asse maggiore</strong> è il segmento che unisce perigeo e apogeo passando per il centro
            della Terra: la sua lunghezza è la somma delle due distanze dal centro,
            <span use:math={{ expression: 'r_p + r_a' }}></span>. Il semiasse maggiore ne è la metà.
          </p>
          <div class="flex justify-center text-white" use:math={{ expression: 'r_p = R_T + h_p \\qquad r_a = R_T + h_a', displayMode: true }}></div>
        </div>

        <div class="mc-card">
          <div class="mc-label mb-2">2 · Periodo orbitale <span use:math={{ expression: 'T' }}></span></div>
          <p class="text-sm mb-3">
            La terza legge di Keplero lega la dimensione dell'orbita al tempo impiegato a percorrerla. Usa il semiasse maggiore
            appena calcolato (in metri) per trovare il periodo:
          </p>
          <div class="flex justify-center text-white" use:math={{ expression: '\\frac{T^2}{a^3} = \\frac{4\\pi^2}{GM}', displayMode: true }}></div>
        </div>
      </div>
    </div>

    <RealityNote>
      Nella missione reale l'orbita alta viene raggiunta in due passi: il lancio porta Orion su un'orbita più bassa e lo stadio
      superiore ICPS accende poi il motore per sollevare l'apogeo a circa 70.000 km. Su quest'orbita, che dura circa un giorno,
      l'equipaggio verifica i sistemi di Orion restando ancora vicino a casa.
    </RealityNote>

    <div class="flex justify-end pt-1">
      <button type="button" class="mc-btn mc-btn-primary" onclick={onStartAnalysis}>
        Apri il terminale di calcolo
        <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2.5"><path stroke-linecap="round" stroke-linejoin="round" d="M13 7l5 5m0 0l-5 5m5-5H6" /></svg>
      </button>
    </div>
  </div>
</div>
