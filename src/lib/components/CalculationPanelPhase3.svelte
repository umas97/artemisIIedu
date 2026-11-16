<script>
  import { missionState } from '../stores/missionStore.js';
  import { math } from '../actions/math.js';
  import { EARTH, MOON, HEO } from '../physics/constants.js';
  import PanelHeader from './ui/PanelHeader.svelte';
  import HintsModal from './ui/HintsModal.svelte';
  import TeacherBox from './ui/TeacherBox.svelte';
  import RealityNote from './ui/RealityNote.svelte';

  let { onBack } = $props();

  const rp = EARTH.R + HEO.hp;
  const ra = MOON.distance;
  const a = (rp + ra) / 2;
  const vCirc = Math.sqrt(EARTH.GM / rp);
  const vP = Math.sqrt(EARTH.GM * (2 / rp - 1 / a));
  const answer = vP - vCirc;

  let deltaVInput = $state(null);
  let confirmed = $state(false);
  let error = $state('');
  let showHints = $state(false);

  const fmt = (v, d = 0) => v.toLocaleString('it-IT', { minimumFractionDigits: d, maximumFractionDigits: d });
  const toNumber = (v) => (typeof v === 'number' ? v : parseFloat(String(v ?? '').replace(',', '.')));

  // Ogni Δv positivo viene accettato: è la simulazione a mostrare l'esito della manovra.
  function confirmCalculation() {
    const x = toNumber(deltaVInput);
    if (!Number.isFinite(x) || x <= 0) {
      confirmed = false;
      error = 'Inserisci un numero valido (un Δv maggiore di zero, in m/s).';
      return;
    }
    error = '';
    confirmed = true;
    missionState.update((s) => ({
      ...s,
      studentCalculations: { ...s.studentCalculations, tliDeltaV: x, isValid: false },
      status: 'TLI pronta',
    }));
  }

  function startSimulation() {
    if (!confirmed) return;
    missionState.update((s) => ({
      ...s,
      isAnalyzing: false,
      showBriefing: false,
      studentCalculations: { ...s.studentCalculations, isValid: true },
      status: 'Esecuzione manovra TLI',
    }));
  }
</script>

<div class="mc-panel w-full max-w-4xl p-0 overflow-hidden">
  <div class="px-6 pt-6">
    <PanelHeader
      step={3}
      kicker="Terminale di calcolo · Iniezione Trans-Lunare"
      title="Δv della TLI"
      {onBack}
      onInfo={() => (showHints = true)}
    />
  </div>

  <div class="grid md:grid-cols-[minmax(0,2fr)_minmax(0,3fr)]">
    <aside class="bg-panel-2 border-t md:border-t-0 md:border-r border-line p-6 space-y-4">
      <div class="mc-label">Dati di missione</div>
      <dl class="space-y-3">
        <div>
          <dt class="text-xs text-muted uppercase">Raggio della Terra R<sub>T</sub></dt>
          <dd class="mc-data text-lg">{fmt(EARTH.R / 1000)} km</dd>
        </div>
        <div>
          <dt class="text-xs text-muted uppercase">Quota attuale h (orbita circolare)</dt>
          <dd class="mc-data text-lg">{fmt(HEO.hp / 1000)} km</dd>
        </div>
        <div>
          <dt class="text-xs text-muted uppercase">Distanza Terra-Luna r<sub>a</sub> (centro-centro)</dt>
          <dd class="mc-data text-lg">{fmt(ra / 1000)} km</dd>
        </div>
        <div>
          <dt class="text-xs text-muted uppercase">Velocità attuale v<sub>circ</sub></dt>
          <dd class="mc-data text-lg">{fmt(vCirc)} m/s</dd>
        </div>
        <div>
          <dt class="text-xs text-muted uppercase">GM della Terra</dt>
          <dd class="mc-data text-lg">3,986 · 10<sup>14</sup> m³/s²</dd>
        </div>
      </dl>
      <div class="mc-card flex justify-center text-sm">
        <div use:math={{ expression: 'v = \\sqrt{GM \\left( \\frac{2}{r} - \\frac{1}{a} \\right)}', displayMode: true }}></div>
      </div>
      <p class="text-xs text-muted">Attenzione alle unità: nella formula le distanze vanno in metri.</p>
    </aside>

    <section class="p-6 space-y-5">
      <div class="space-y-2">
        <label for="tliDeltaV" class="mc-label block">Δv pianificato per l'iniezione</label>
        <div class="flex items-center gap-3">
          <input
            id="tliDeltaV"
            class="mc-input"
            type="number"
            step="any"
            bind:value={deltaVInput}
            oninput={() => (confirmed = false)}
            placeholder="es. 1234.5"
          />
          <span class="mc-data text-signal w-10">m/s</span>
        </div>
      </div>

      <p class="text-xs text-muted">
        Scrivi il numero con il punto per i decimali (es. 1234.5). Il terminale accetta qualsiasi Δv positivo: sarà la simulazione
        a mostrarti dove porta la traiettoria.
      </p>

      {#if error}
        <div class="mc-feedback-fail text-sm" role="status">{error}</div>
      {:else if confirmed}
        <div class="mc-feedback-ok text-sm" role="status">
          Δv registrato: {fmt(toNumber(deltaVInput), 1)} m/s. Sistemi pronti per l'accensione.
        </div>
      {/if}

      <div class="flex flex-col sm:flex-row gap-3">
        <button type="button" class="mc-btn mc-btn-primary flex-1" onclick={confirmCalculation}>Registra il Δv</button>
        {#if confirmed}
          <button type="button" class="mc-btn mc-btn-go flex-1" onclick={startSimulation}>Esegui l'accensione TLI</button>
        {/if}
      </div>

      <RealityNote>
        Artemis II non è partita da un'orbita circolare bassa: la TLI l'ha eseguita il motore del modulo di servizio di Orion
        partendo dall'orbita alta ed ellittica della fase 1, dove bastava un Δv di qualche centinaio di m/s.
      </RealityNote>

      <TeacherBox>
        <div class="space-y-1 text-lunar-gray">
          <div>
            r<sub>p</sub> = {fmt(rp / 1000)} km · a = (r<sub>p</sub> + r<sub>a</sub>)/2 = {fmt(a / 1000, 1)} km
          </div>
          <div>v<sub>circ</sub> ≈ {fmt(vCirc)} m/s · v<sub>p</sub> ≈ {fmt(vP)} m/s</div>
          <div>Δv = v<sub>p</sub> − v<sub>circ</sub> ≈ <span class="mc-data font-bold">{fmt(answer)} m/s</span></div>
          <p class="text-xs text-muted">
            Nella simulazione Orion entra nella sfera d'influenza lunare (r<sub>SOI</sub> ≈ {fmt(MOON.soiRadius / 1000)} km) con Δv tra
            circa 3.117 e 3.175 m/s. Ogni m/s di errore sposta l'apogeo di circa 4.000 km: per questo le missioni reali fanno
            correzioni di rotta durante il viaggio.
          </p>
        </div>
      </TeacherBox>
    </section>
  </div>
</div>

<HintsModal open={showHints} onClose={() => (showHints = false)}>
  <p>
    <strong class="text-white">1. L'ellisse di trasferimento.</strong> Il perigeo è la tua distanza attuale dal centro della Terra,
    r<sub>p</sub> = R<sub>T</sub> + h; l'apogeo deve coincidere con la distanza della Luna, r<sub>a</sub>. Il semiasse maggiore è
    a = (r<sub>p</sub> + r<sub>a</sub>)/2.
  </p>
  <div>
    <p>
      <strong class="text-white">2. Velocità al perigeo.</strong> Usa la vis-viva con r = r<sub>p</sub> e il semiasse a dell'ellisse
      per trovare v<sub>p</sub>:
    </p>
    <div class="mc-card mt-2 flex justify-center">
      <div use:math={{ expression: 'v_p = \\sqrt{GM \\left( \\frac{2}{r_p} - \\frac{1}{a} \\right)}', displayMode: true }}></div>
    </div>
  </div>
  <p>
    <strong class="text-white">3. Il Δv.</strong> È la differenza tra v<sub>p</sub> e la velocità che hai già in orbita circolare,
    v<sub>circ</sub>. L'accensione è nella direzione del moto, quindi v<sub>p</sub> &gt; v<sub>circ</sub>.
  </p>
  <p class="text-muted">Controllo di buon senso: il risultato è di qualche km/s, molto meno della velocità orbitale.</p>
</HintsModal>
