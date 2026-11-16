<script>
  import { math } from '../actions/math.js';
  import PanelHeader from './ui/PanelHeader.svelte';
  import RealityNote from './ui/RealityNote.svelte';
  import TeacherBox from './ui/TeacherBox.svelte';
  import { CORE_STAGE, G0, propellantFromDryMass } from '../physics/constants.js';

  let { onStartAnalysis } = $props();

  const fmt = (v, d = 0) => v.toLocaleString('it-IT', { minimumFractionDigits: d, maximumFractionDigits: d });
  // Separatori italiani dentro KaTeX (le graffe evitano gli spazi dopo punto e virgola)
  const tex = (s) => s.replace(/\./g, '{.}').replace(/,/g, '{,}');

  const answer = propellantFromDryMass(CORE_STAGE.dryMass, CORE_STAGE.targetDeltaV, CORE_STAGE.isp);
  const ve = CORE_STAGE.isp * G0;
</script>

<div class="mc-panel w-full max-w-5xl p-6 md:p-8">
  <PanelHeader step={2} kicker="Briefing · Lancio SLS · Equazione di Tsiolkovsky" title="Lancio e propulsione" />

  <div class="space-y-5 text-base leading-relaxed">
    <p>
      Comandante, è il momento di preparare il lancio. Il razzo <strong class="text-white">SLS Block 1</strong> deve portare Orion
      in orbita attorno alla Terra, e noi dobbiamo decidere quanta <strong class="text-white">massa di propellente</strong>
      caricare nel suo stadio centrale (il <em>core stage</em>, con quattro motori RS-25).
    </p>

    <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
      <div class="mc-card space-y-3">
        <div class="mc-label">La fisica del razzo</div>
        <p class="text-sm">
          Un razzo spinge "all'indietro" i gas di scarico a grande velocità e, per la
          <strong class="text-white">conservazione della quantità di moto</strong>, riceve una spinta in avanti. Mentre brucia,
          diventa sempre più leggero. L'equazione di <strong class="text-white">Konstantin Tsiolkovsky</strong> dice di quanto
          cambia la velocità del razzo (<span use:math={{ expression: '\\Delta v' }}></span>) quando la sua massa passa da quella
          iniziale (pieno) a quella finale (serbatoi vuoti):
        </p>
        <div class="flex justify-center text-white" use:math={{ expression: '\\Delta v = I_{sp}\\, g_0 \\ln\\left(\\frac{m_{iniziale}}{m_{finale}}\\right)', displayMode: true }}></div>
        <p class="text-sm text-muted">
          <span use:math={{ expression: 'I_{sp}' }}></span> (impulso specifico, in secondi) misura l'efficienza del motore: il
          prodotto <span use:math={{ expression: 'I_{sp}\\, g_0' }}></span> è la velocità dei gas di scarico, circa
          {fmt(ve / 1000, 1)} km/s per l'RS-25. Qui <span use:math={{ expression: 'm_{iniziale} = m_{dry} + m_{fuel}' }}></span>
          e <span use:math={{ expression: 'm_{finale} = m_{dry}' }}></span>.
        </p>
      </div>

      <div class="space-y-4">
        <div class="mc-card">
          <div class="mc-label mb-2">Dati del modello</div>
          <dl class="space-y-2 text-sm">
            <div class="flex justify-between gap-4">
              <dt class="text-muted">Massa finale (a serbatoi vuoti)</dt>
              <dd class="mc-data"><span use:math={{ expression: `m_{dry} = ${tex(fmt(CORE_STAGE.dryMass))}\\text{ kg}` }}></span></dd>
            </div>
            <div class="flex justify-between gap-4">
              <dt class="text-muted">Impulso specifico (nel vuoto)</dt>
              <dd class="mc-data"><span use:math={{ expression: `I_{sp} = ${CORE_STAGE.isp}\\text{ s}` }}></span></dd>
            </div>
            <div class="flex justify-between gap-4">
              <dt class="text-muted">Accelerazione di gravità standard</dt>
              <dd class="mc-data"><span use:math={{ expression: `g_0 = ${tex(fmt(G0, 5))}\\text{ m/s}^2` }}></span></dd>
            </div>
            <div class="flex justify-between gap-4">
              <dt class="text-muted">Δv richiesto</dt>
              <dd class="mc-data"><span use:math={{ expression: `\\Delta v = ${tex(fmt(CORE_STAGE.targetDeltaV))}\\text{ m/s}` }}></span></dd>
            </div>
          </dl>
          <p class="text-sm text-muted mt-3">
            La massa finale comprende lo stadio vuoto e tutto ciò che sta sopra (stadio superiore e Orion), in valori arrotondati.
          </p>
        </div>

        <div class="mc-card text-sm space-y-2">
          <div class="mc-label">Perché 9.500 m/s?</div>
          <p>
            In orbita bassa Orion deve viaggiare a circa 7,8 km/s. Il Δv richiesto è maggiore perché, durante la salita, una parte
            della spinta serve a contrastare la gravità (il razzo sale in verticale per un tratto) e un'altra a vincere la
            resistenza dell'aria.
          </p>
        </div>
      </div>
    </div>

    <div class="mc-card text-sm space-y-2">
      <div class="mc-label">Il nostro modello semplificato</div>
      <p>
        Trattiamo l'SLS come un razzo a <strong class="text-white">un solo stadio</strong>: consideriamo solo il core stage e
        <strong class="text-white">ignoriamo i due booster laterali</strong>, così possiamo usare l'equazione di Tsiolkovsky una sola
        volta. Usiamo inoltre l'impulso specifico <strong class="text-white">nel vuoto</strong> (452 s) per tutta la salita. Il tuo
        compito: ricavare dalla formula la massa di propellente <span use:math={{ expression: 'm_{fuel}' }}></span> che fornisce
        esattamente il Δv richiesto.
      </p>
    </div>

    <RealityNote>
      Al decollo i due booster a propellente solido forniscono più del 75% della spinta e si staccano dopo circa 2 minuti; il core
      stage continua a spingere per circa 8 minuti. Al livello del mare l'RS-25 ha un impulso specifico più basso (circa 366 s),
      perché l'aria ostacola l'uscita dei gas: per questo il nostro modello è ottimistico. Il core stage reale contiene circa
      987 tonnellate di idrogeno e ossigeno liquidi: il risultato del modello sarà dello stesso ordine di grandezza.
    </RealityNote>

    <TeacherBox>
      <div class="space-y-2 text-lunar-gray">
        <div use:math={{ expression: 'm_{fuel} = m_{dry}\\left(e^{\\frac{\\Delta v}{I_{sp}\\, g_0}} - 1\\right)' }}></div>
        <div>
          Risultato: <span class="mc-data font-bold">{fmt(Math.round(answer))} kg</span>
          <span class="text-muted">(accettato ±2%: {fmt(answer * 0.98)}–{fmt(answer * 1.02)} kg)</span>
        </div>
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
