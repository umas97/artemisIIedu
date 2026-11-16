<script>
  import { math } from '../actions/math.js';
  import PanelHeader from './ui/PanelHeader.svelte';
  import RealityNote from './ui/RealityNote.svelte';
  import TeacherBox from './ui/TeacherBox.svelte';
  import { MOON } from '../physics/constants.js';

  let { onStartAnalysis } = $props();

  const V_ARR = 2515; // m/s, velocità di arrivo al perilunio (stessa della scena LOIScene)
  const fmt = (v, d = 0) => v.toLocaleString('it-IT', { minimumFractionDigits: d, maximumFractionDigits: d });
  const r = MOON.R + MOON.orbitAltitude;
  const vCirc = Math.sqrt(MOON.GM / r);
  const vEsc = Math.sqrt((2 * MOON.GM) / r);
</script>

<div class="mc-panel w-full max-w-5xl p-6 md:p-8">
  <PanelHeader step={4} kicker="Briefing · Inserimento in orbita lunare (LOI)" title="Farsi catturare dalla Luna" />

  <div class="space-y-5 text-base leading-relaxed">
    <p>
      Comandante, la crociera verso la Luna è terminata. Mentre ci avviciniamo, la gravità lunare ci accelera: arriveremo al punto
      più vicino alla Luna (<strong class="text-white">perilunio</strong>, a {fmt(MOON.orbitAltitude / 1000)} km di quota) a circa
      {fmt(V_ARR)} m/s. È più della velocità di fuga lunare a quella quota: se non facciamo nulla, la Luna devia la nostra rotta ma
      non riesce a trattenerci, e Orion si allontana di nuovo.
    </p>

    <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
      <div class="mc-card space-y-2">
        <div class="mc-label">Il problema</div>
        <p class="text-sm">
          Per entrare in un'orbita attorno alla Luna dobbiamo <strong class="text-white">frenare</strong>: al perilunio giriamo
          Orion e accendiamo il motore nel verso opposto al moto. È la manovra di
          <strong class="text-white">Lunar Orbit Insertion</strong> (LOI). Vogliamo un'orbita circolare a
          {fmt(MOON.orbitAltitude / 1000)} km di quota, quindi dopo la frenata la velocità deve essere esattamente quella circolare.
        </p>
      </div>

      <div class="mc-card space-y-2">
        <div class="mc-label">Domande guida</div>
        <ul class="text-sm list-disc pl-5 space-y-2">
          <li>Qual è il raggio dell'orbita obiettivo, misurato dal centro della Luna?</li>
          <li>Qual è la velocità di un'orbita circolare a quella distanza?</li>
          <li>Di quanto dobbiamo ridurre la velocità di arrivo? Cosa succede se freniamo troppo o troppo poco?</li>
        </ul>
      </div>
    </div>

    <div class="mc-card space-y-3">
      <div class="mc-label">Strumenti di analisi</div>
      <p class="text-sm">
        La velocità di un'orbita circolare di raggio <span use:math={{ expression: 'r = R_{Luna} + h' }}></span> si ottiene
        uguagliando la forza di gravità alla forza centripeta:
      </p>
      <div class="flex justify-center text-white" use:math={{ expression: 'v_{circ} = \\sqrt{\\frac{GM_{Luna}}{r}}', displayMode: true }}></div>
      <p class="text-sm text-muted">
        Il Δv della frenata è la differenza tra la velocità di arrivo al perilunio e <span use:math={{ expression: 'v_{circ}' }}></span>.
        Se freniamo poco, l'orbita resta ellittica e allungata (o Orion sfugge alla Luna); se freniamo troppo, l'orbita si abbassa
        sul lato opposto e può finire contro la superficie.
      </p>
    </div>

    <RealityNote>
      Artemis II reale <strong class="text-white">non è entrata in orbita lunare</strong>: ha fatto un sorvolo della Luna lungo una
      traiettoria di <strong class="text-white">libero ritorno</strong> (free-return), cioè una traiettoria che, grazie alla sola
      gravità della Luna, riporta la navicella verso la Terra senza grandi accensioni. Qui l'orbita lunare è un esercizio, come
      facevano le missioni Apollo e come faranno le future missioni Artemis III e successive.
    </RealityNote>

    <TeacherBox>
      <div class="space-y-1 text-lunar-gray">
        <div>
          r = {fmt(r / 1000)} km · v<sub>circ</sub> ≈ {fmt(vCirc)} m/s · v<sub>fuga</sub> ≈ {fmt(vEsc)} m/s · v<sub>arr</sub> =
          {fmt(V_ARR)} m/s
        </div>
        <div>Δv = v<sub>arr</sub> − v<sub>circ</sub> ≈ <span class="mc-data font-bold">{fmt(V_ARR - vCirc)} m/s</span></div>
      </div>
    </TeacherBox>

    <div class="flex justify-end pt-1">
      <button type="button" class="mc-btn mc-btn-primary" onclick={onStartAnalysis}>
        Apri il terminale di calcolo
        <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2.5"><path stroke-linecap="round" stroke-linejoin="round" d="M13 7l5 5m0 0l-5 5m5-5H6" /></svg>
      </button>
    </div>
  </div>
</div>
