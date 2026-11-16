<script>
  import { missionState } from '../stores/missionStore';
  import { math } from '../actions/math.js';
  import PanelHeader from './ui/PanelHeader.svelte';
  import HintsModal from './ui/HintsModal.svelte';
  import TeacherBox from './ui/TeacherBox.svelte';

  let { onBack } = $props();

  // Valori corretti (coerenti con ReentryScene.js)
  const idealArea = (2 * 10400 * 9.81) / (1.225 * 10 ** 2 * 2.0); // ≈ 832,8 m²
  const fmt = (n, d = 0) =>
    n.toLocaleString('it-IT', { minimumFractionDigits: d, maximumFractionDigits: d, useGrouping: 'always' });

  let inputAngle = $state('');
  let inputDrogueAlt = $state('');
  let inputArea = $state('');
  let errors = $state({ angle: '', drogue: '', area: '' });
  /** @type {{ angle: number, drogue: number, area: number } | null} */
  let confirmed = $state(null);
  let showHints = $state(false);

  const parse = (v) => (v === '' || v === null || v === undefined ? NaN : Number.parseFloat(v));

  const confirmData = () => {
    const angle = parse(inputAngle);
    const drogue = parse(inputDrogueAlt);
    const area = parse(inputArea);
    const e = { angle: '', drogue: '', area: '' };

    if (!Number.isFinite(angle)) e.angle = 'Inserisci un numero valido.';
    else if (angle >= 0 || angle <= -90)
      e.angle = "L'angolo deve essere negativo (la traiettoria scende sotto l'orizzonte) e maggiore di −90°.";

    if (!Number.isFinite(drogue)) e.drogue = 'Inserisci un numero valido.';
    else if (drogue <= 0) e.drogue = "L'altitudine deve essere un numero positivo.";

    if (!Number.isFinite(area)) e.area = 'Inserisci un numero valido.';
    else if (area <= 0) e.area = "L'area deve essere un numero positivo.";

    errors = e;
    confirmed = e.angle || e.drogue || e.area ? null : { angle, drogue, area };
  };

  const invalidate = () => (confirmed = null);

  const startSimulation = () => {
    if (!confirmed) return;
    missionState.update((s) => ({
      ...s,
      studentCalculations: {
        ...s.studentCalculations,
        reentryAngle: confirmed.angle,
        parachuteDrogueAltitude: confirmed.drogue,
        parachuteArea: confirmed.area,
        isValid: true,
      },
      showBriefing: false,
      isAnalyzing: false,
      status: 'Rientro atmosferico',
    }));
  };
</script>

{#snippet field(id, label, help, unit, placeholder, error)}
  <div>
    <label for={id} class="mc-label block mb-1">{label}</label>
    <p class="text-sm text-muted mb-2">{help}</p>
    <div class="relative">
      {#if id === 'angle'}
        <input {id} type="number" step="any" class="mc-input pr-14" {placeholder} bind:value={inputAngle} oninput={invalidate} />
      {:else if id === 'drogue'}
        <input {id} type="number" step="any" class="mc-input pr-14" {placeholder} bind:value={inputDrogueAlt} oninput={invalidate} />
      {:else}
        <input {id} type="number" step="any" class="mc-input pr-14" {placeholder} bind:value={inputArea} oninput={invalidate} />
      {/if}
      <span class="absolute right-4 top-1/2 -translate-y-1/2 font-mono text-signal">{unit}</span>
    </div>
    {#if error}
      <div class="mc-feedback-fail text-sm mt-2" role="alert">{error}</div>
    {/if}
  </div>
{/snippet}

<div class="mc-panel mc-enter w-full max-w-4xl p-0 overflow-hidden">
  <div class="px-6 pt-6 md:px-8 md:pt-7">
    <PanelHeader
      step={6}
      kicker="Terminale di calcolo · Rientro"
      title="Parametri di discesa"
      {onBack}
      onInfo={() => (showHints = true)}
    />
  </div>

  <div class="grid md:grid-cols-[minmax(0,1fr)_minmax(0,1.6fr)]">
    <aside class="bg-panel-2 border-t md:border-t-0 md:border-r border-line p-6 md:p-7 space-y-4">
      <h3 class="mc-label">Dati di missione</h3>
      <dl class="space-y-3">
        <div>
          <dt class="text-xs text-muted uppercase tracking-wide">Velocità a 10.000 m</dt>
          <dd class="mc-data text-lg">150 m/s (costante)</dd>
        </div>
        <div>
          <dt class="text-xs text-muted uppercase tracking-wide">Ritardo apertura drogue</dt>
          <dd class="mc-data text-lg">20 s</dd>
        </div>
        <div>
          <dt class="text-xs text-muted uppercase tracking-wide">Massa di Orion</dt>
          <dd class="mc-data text-lg">10.400 kg</dd>
        </div>
        <div>
          <dt class="text-xs text-muted uppercase tracking-wide">Gravità · densità aria</dt>
          <dd class="mc-data text-lg">9,81 m/s² · 1,225 kg/m³</dd>
        </div>
        <div>
          <dt class="text-xs text-muted uppercase tracking-wide">Coeff. di resistenza · v finale</dt>
          <dd class="mc-data text-lg">2,0 · 10 m/s</dd>
        </div>
      </dl>
    </aside>

    <section class="p-6 md:p-7 space-y-5">
      {@render field('angle', '1 · Angolo di rientro', 'Media degli angoli dei test riusciti (tabella del briefing).', '°', 'es. -12.3', errors.angle)}
      {@render field('drogue', '2 · Altitudine di apertura dei drogue', 'Risultato del calcolo cinematico.', 'm', 'es. 1234.5', errors.drogue)}
      {@render field('area', '3 · Area dei paracadute principali', 'Risultato del calcolo con la resistenza aerodinamica, per v = 10 m/s.', 'm²', 'es. 1234.5', errors.area)}

      {#if confirmed}
        <div class="mc-feedback-ok text-sm">
          Dati caricati nel computer di bordo: angolo {fmt(confirmed.angle, 1)}°, drogue a {fmt(confirmed.drogue)} m,
          paracadute principali da {fmt(confirmed.area, 1)} m².
        </div>
        <button type="button" class="mc-btn mc-btn-go w-full" onclick={startSimulation}>
          Avvia il rientro
          <svg class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2.5"><path stroke-linecap="round" stroke-linejoin="round" d="M14 5l7 7m0 0l-7 7m7-7H3" /></svg>
        </button>
      {:else}
        <button type="button" class="mc-btn mc-btn-primary w-full" onclick={confirmData}>Conferma i dati</button>
      {/if}

      <TeacherBox>
        <ul class="space-y-1 font-mono">
          <li>Angolo: media di −6,0°, −6,5°, −7,0° = <strong>−6,5°</strong> (riesce da −5,9° a −7,0°)</li>
          <li>Drogue: 10.000 − 150 · 20 = <strong>7.000 m</strong> (accettato ±10%: 6.300–7.700 m)</li>
          <li>
            Area: 2 · 10.400 · 9,81 / (1,225 · 10² · 2,0) ≈ <strong>{fmt(idealArea, 1)} m²</strong> (accettato ±10%:
            {fmt(idealArea * 0.9)}–{fmt(idealArea * 1.1)} m²)
          </li>
        </ul>
      </TeacherBox>
    </section>
  </div>
</div>

<HintsModal open={showHints} onClose={() => (showHints = false)}>
  <ol class="space-y-3 list-decimal pl-5">
    <li>
      <strong class="text-white">Angolo:</strong> nella tabella del briefing scegli solo le righe con esito "Successo" e
      fai la media aritmetica dei loro angoli (sono negativi: la capsula scende).
    </li>
    <li>
      <strong class="text-white">Drogue:</strong> sotto i 10.000 m la capsula scende a velocità costante, quindi è un moto
      rettilineo uniforme: in 20 s percorre <span use:math={{ expression: 's = v \\cdot t' }}></span>. Sottrai questo
      spazio dalla quota di partenza.
    </li>
    <li>
      <strong class="text-white">Area:</strong> alla velocità limite il peso uguaglia la resistenza aerodinamica,
      <span use:math={{ expression: 'mg = \\tfrac{1}{2}\\rho v^2 C_d A' }}></span>. Isola
      <span use:math={{ expression: 'A' }}></span>: moltiplica entrambi i membri per 2 e dividi per
      <span use:math={{ expression: '\\rho v^2 C_d' }}></span>. Attenzione: la velocità va al quadrato.
    </li>
  </ol>
</HintsModal>
