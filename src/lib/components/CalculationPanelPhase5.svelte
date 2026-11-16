<script>
  import { missionState } from '../stores/missionStore';
  import { math } from '../actions/math.js';
  import PanelHeader from './ui/PanelHeader.svelte';
  import HintsModal from './ui/HintsModal.svelte';
  import TeacherBox from './ui/TeacherBox.svelte';
  import { MOON } from '../physics/constants.js';

  let { onBack } = $props();

  const r = MOON.R + MOON.orbitAltitude;
  const vCirc = Math.sqrt(MOON.GM / r);
  const vEsc = Math.sqrt((2 * MOON.GM) / r);
  const dvMin = vEsc - vCirc;
  const fmt = (n, d = 0) =>
    n.toLocaleString('it-IT', { minimumFractionDigits: d, maximumFractionDigits: d, useGrouping: 'always' });

  let deltaVInput = $state('');
  let error = $state('');
  /** @type {number | null} */
  let confirmedValue = $state(null);
  let showHints = $state(false);

  const confirmCalculation = () => {
    const val = Number.parseFloat(deltaVInput);
    confirmedValue = null;
    if (deltaVInput === '' || deltaVInput === null || !Number.isFinite(val)) {
      error = 'Inserisci un numero valido.';
      return;
    }
    if (val <= 0) {
      error = 'Il Δv deve essere un numero positivo: è l\'aumento di velocità prodotto dal motore.';
      return;
    }
    error = '';
    confirmedValue = val;
  };

  const startSimulation = () => {
    if (confirmedValue === null) return;
    missionState.update((s) => ({
      ...s,
      studentCalculations: { ...s.studentCalculations, teiDeltaV: confirmedValue, isValid: true },
      isAnalyzing: false,
      showBriefing: false,
      status: 'Esecuzione manovra TEI',
    }));
  };
</script>

<div class="mc-panel mc-enter w-full max-w-4xl p-0 overflow-hidden">
  <div class="px-6 pt-6 md:px-8 md:pt-7">
    <PanelHeader
      step={5}
      kicker="Terminale di calcolo · TEI"
      title="Δv per lasciare la Luna"
      {onBack}
      onInfo={() => (showHints = true)}
    />
  </div>

  <div class="grid md:grid-cols-[minmax(0,1fr)_minmax(0,1.6fr)]">
    <aside class="bg-panel-2 border-t md:border-t-0 md:border-r border-line p-6 md:p-7 space-y-4">
      <h3 class="mc-label">Dati di missione</h3>
      <dl class="space-y-3">
        <div>
          <dt class="text-xs text-muted uppercase tracking-wide">Raggio della Luna</dt>
          <dd class="mc-data text-lg">1.737 km</dd>
        </div>
        <div>
          <dt class="text-xs text-muted uppercase tracking-wide">Quota dell'orbita</dt>
          <dd class="mc-data text-lg">100 km</dd>
        </div>
        <div>
          <dt class="text-xs text-muted uppercase tracking-wide">GM della Luna</dt>
          <dd class="mc-data text-lg"><span use:math={{ expression: '4{,}9048 \\cdot 10^{12}\\ \\text{m}^3/\\text{s}^2' }}></span></dd>
        </div>
        <div>
          <dt class="text-xs text-muted uppercase tracking-wide">Velocità attuale (v<sub>circ</sub>, Fase 4)</dt>
          <dd class="mc-data text-lg">≈ {fmt(vCirc)} m/s</dd>
        </div>
      </dl>
    </aside>

    <section class="p-6 md:p-7 space-y-5">
      <div>
        <label for="tei-dv" class="mc-label block mb-2">Δv minimo per sfuggire alla Luna</label>
        <p class="text-sm text-muted mb-3">
          Calcola la velocità di fuga alla quota dell'orbita e sottrai la velocità circolare attuale.
        </p>
        <div class="flex gap-3 items-stretch">
          <div class="relative flex-1">
            <input
              id="tei-dv"
              type="number"
              step="any"
              class="mc-input pr-16"
              placeholder="es. 1234.5"
              bind:value={deltaVInput}
              oninput={() => (confirmedValue = null)}
              onkeydown={(e) => e.key === 'Enter' && confirmCalculation()}
            />
            <span class="absolute right-4 top-1/2 -translate-y-1/2 font-mono text-signal">m/s</span>
          </div>
          <button type="button" class="mc-btn mc-btn-primary" onclick={confirmCalculation}>Conferma</button>
        </div>
      </div>

      {#if error}
        <div class="mc-feedback-fail text-sm" role="alert">{error}</div>
      {/if}

      {#if confirmedValue !== null}
        <div class="mc-feedback-ok text-sm">
          Valore registrato: <span class="mc-data">Δv = {fmt(confirmedValue, confirmedValue % 1 ? 1 : 0)} m/s</span>.
          Il computer di bordo eseguirà un'accensione prograda di questa entità.
        </div>
        <button type="button" class="mc-btn mc-btn-go w-full" onclick={startSimulation}>
          Esegui l'accensione (TEI)
          <svg class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2.5"><path stroke-linecap="round" stroke-linejoin="round" d="M14 5l7 7m0 0l-7 7m7-7H3" /></svg>
        </button>
      {/if}

      <TeacherBox>
        <ul class="space-y-1 font-mono">
          <li>r = 1.737 km + 100 km = 1.837.000 m</li>
          <li>v<sub>circ</sub> ≈ {fmt(vCirc)} m/s · v<sub>fuga</sub> ≈ {fmt(vEsc)} m/s</li>
          <li>Δv minimo ≈ <strong>{fmt(dvMin)} m/s</strong></li>
          <li>Accettato: da {fmt(dvMin * 0.99)} a {fmt(dvMin * 1.6)} m/s (−1% / +60%)</li>
          <li>Sotto: orbita ellittica lunare. Sopra: spreco di propellente.</li>
        </ul>
      </TeacherBox>
    </section>
  </div>
</div>

<HintsModal open={showHints} onClose={() => (showHints = false)}>
  <ol class="space-y-3 list-decimal pl-5">
    <li>
      Orion è in orbita circolare a <strong class="text-white">100 km</strong> di quota: la distanza dal centro della
      Luna è <span use:math={{ expression: 'r = R_{Luna} + h = 1.837.000\\ \\text{m}' }}></span>.
    </li>
    <li>
      Calcola (o ricorda dalla Fase 4) la velocità circolare
      <span use:math={{ expression: 'v_{circ} = \\sqrt{GM/r}' }}></span>.
    </li>
    <li>
      Per sfuggire alla gravità della Luna la velocità deve arrivare alla velocità di fuga
      <span use:math={{ expression: 'v_{fuga} = \\sqrt{2GM/r}' }}></span>.
    </li>
    <li>
      Il <strong class="text-white">Δv</strong> è la variazione di velocità che il motore deve produrre: la differenza
      tra <span use:math={{ expression: 'v_{fuga}' }}></span> e la tua
      <span use:math={{ expression: 'v_{circ}' }}></span> attuale.
    </li>
    <li class="text-muted">
      Curiosità: <span use:math={{ expression: 'v_{fuga} = \\sqrt{2}\\, v_{circ}' }}></span>, quindi basta un aumento
      di circa il 41%.
    </li>
  </ol>
</HintsModal>
