<script>
  import { missionState } from '../stores/missionStore.js';
  import { math } from '../actions/math.js';
  import { MOON } from '../physics/constants.js';
  import PanelHeader from './ui/PanelHeader.svelte';
  import HintsModal from './ui/HintsModal.svelte';
  import TeacherBox from './ui/TeacherBox.svelte';
  import RealityNote from './ui/RealityNote.svelte';

  let { onBack } = $props();

  const V_ARR = 2515; // m/s, velocità di arrivo al perilunio (stessa della scena LOIScene)
  const r = MOON.R + MOON.orbitAltitude;
  const vCirc = Math.sqrt(MOON.GM / r);
  const answer = V_ARR - vCirc;

  let deltaVInput = $state(null);
  let confirmed = $state(false);
  let error = $state('');
  let showHints = $state(false);

  const fmt = (v, d = 0) => v.toLocaleString('it-IT', { minimumFractionDigits: d, maximumFractionDigits: d });
  const toNumber = (v) => (typeof v === 'number' ? v : parseFloat(String(v ?? '').replace(',', '.')));

  // Ogni Δv positivo viene accettato: è la simulazione a mostrare l'esito della frenata.
  function confirmCalculation() {
    const x = toNumber(deltaVInput);
    if (!Number.isFinite(x) || x <= 0) {
      confirmed = false;
      error = 'Inserisci un numero valido (il modulo della frenata, maggiore di zero, in m/s).';
      return;
    }
    error = '';
    confirmed = true;
    missionState.update((s) => ({
      ...s,
      studentCalculations: { ...s.studentCalculations, loiDeltaV: x, isValid: false },
      status: 'LOI pronta',
    }));
  }

  function startSimulation() {
    if (!confirmed) return;
    missionState.update((s) => ({
      ...s,
      isAnalyzing: false,
      showBriefing: false,
      studentCalculations: { ...s.studentCalculations, isValid: true },
      status: 'Esecuzione manovra LOI',
    }));
  }
</script>

<div class="mc-panel w-full max-w-4xl p-0 overflow-hidden">
  <div class="px-6 pt-6">
    <PanelHeader
      step={4}
      kicker="Terminale di calcolo · Inserimento in orbita lunare"
      title="Δv della frenata (LOI)"
      {onBack}
      onInfo={() => (showHints = true)}
    />
  </div>

  <div class="grid md:grid-cols-[minmax(0,2fr)_minmax(0,3fr)]">
    <aside class="bg-panel-2 border-t md:border-t-0 md:border-r border-line p-6 space-y-4">
      <div class="mc-label">Dati di missione</div>
      <dl class="space-y-3">
        <div>
          <dt class="text-xs text-muted uppercase">Raggio della Luna R<sub>Luna</sub></dt>
          <dd class="mc-data text-lg">{fmt(MOON.R / 1000)} km</dd>
        </div>
        <div>
          <dt class="text-xs text-muted uppercase">Quota dell'orbita obiettivo h</dt>
          <dd class="mc-data text-lg">{fmt(MOON.orbitAltitude / 1000)} km</dd>
        </div>
        <div>
          <dt class="text-xs text-muted uppercase">GM della Luna</dt>
          <dd class="mc-data text-lg">4,9048 · 10<sup>12</sup> m³/s²</dd>
        </div>
        <div>
          <dt class="text-xs text-muted uppercase">Velocità di arrivo al perilunio v<sub>arr</sub></dt>
          <dd class="mc-data text-lg">{fmt(V_ARR)} m/s</dd>
        </div>
      </dl>
      <div class="mc-card flex justify-center text-sm">
        <div use:math={{ expression: 'v_{circ} = \\sqrt{\\frac{GM_{Luna}}{r}}', displayMode: true }}></div>
      </div>
      <p class="text-xs text-muted">Il perilunio della traiettoria di arrivo è già alla quota h dell'orbita obiettivo.</p>
    </aside>

    <section class="p-6 space-y-5">
      <div class="space-y-2">
        <label for="loiDeltaV" class="mc-label block">Δv della frenata (valore positivo)</label>
        <div class="flex items-center gap-3">
          <input
            id="loiDeltaV"
            class="mc-input"
            type="number"
            step="any"
            min="0"
            bind:value={deltaVInput}
            oninput={() => (confirmed = false)}
            placeholder="es. 1234.5"
          />
          <span class="mc-data text-signal w-10">m/s</span>
        </div>
      </div>

      <p class="text-xs text-muted">
        Scrivi il numero con il punto per i decimali (es. 1234.5). Il motore spinge contro il moto: inserisci di quanto deve
        diminuire la velocità. Sarà la simulazione a mostrarti l'orbita che ottieni.
      </p>

      {#if error}
        <div class="mc-feedback-fail text-sm" role="status">{error}</div>
      {:else if confirmed}
        <div class="mc-feedback-ok text-sm" role="status">
          Δv registrato: {fmt(toNumber(deltaVInput), 1)} m/s di frenata. Motore pronto.
        </div>
      {/if}

      <div class="flex flex-col sm:flex-row gap-3">
        <button type="button" class="mc-btn mc-btn-primary flex-1" onclick={confirmCalculation}>Registra il Δv</button>
        {#if confirmed}
          <button type="button" class="mc-btn mc-btn-go flex-1" onclick={startSimulation}>Esegui la frenata</button>
        {/if}
      </div>

      <RealityNote>
        Artemis II reale non entra in orbita lunare: sorvola la Luna su una traiettoria di libero ritorno (free-return). Qui
        l'orbita lunare è un esercizio, come per le missioni Apollo e le future Artemis III e successive.
      </RealityNote>

      <TeacherBox>
        <div class="space-y-1 text-lunar-gray">
          <div>r = {fmt(r / 1000)} km · v<sub>circ</sub> ≈ {fmt(vCirc)} m/s</div>
          <div>Δv = v<sub>arr</sub> − v<sub>circ</sub> ≈ <span class="mc-data font-bold">{fmt(answer)} m/s</span></div>
          <p class="text-xs text-muted">
            Esiti della simulazione: successo (orbita tra 30 e 300 km di quota) con Δv ≈ 840–896 m/s; 897–904 perilunio troppo
            basso; ≥ 905 impatto; 367–839 orbita ellittica; 205–366 orbita troppo allungata (apolunio &gt; 10.000 km); ≤ 204 fuga.
          </p>
        </div>
      </TeacherBox>
    </section>
  </div>
</div>

<HintsModal open={showHints} onClose={() => (showHints = false)}>
  <p>
    <strong class="text-white">1. Il raggio dell'orbita.</strong> L'orbita obiettivo è a {fmt(MOON.orbitAltitude / 1000)} km
    dalla superficie: il raggio va misurato dal centro della Luna, r = R<sub>Luna</sub> + h (in metri).
  </p>
  <div>
    <p>
      <strong class="text-white">2. La velocità circolare.</strong> Calcola la velocità di un'orbita circolare a quella distanza:
    </p>
    <div class="mc-card mt-2 flex justify-center">
      <div use:math={{ expression: 'v_{circ} = \\sqrt{\\frac{GM_{Luna}}{r}}', displayMode: true }}></div>
    </div>
  </div>
  <p>
    <strong class="text-white">3. La frenata.</strong> Il Δv è la differenza tra la velocità di arrivo al perilunio
    (v<sub>arr</sub>) e v<sub>circ</sub>. Poiché il motore spinge contro il moto, Orion rallenta: inserisci il valore positivo.
  </p>
  <p class="text-muted">Controllo di buon senso: dopo la frenata Orion deve andare più piano di quando è arrivata, ma non ferma.</p>
</HintsModal>
