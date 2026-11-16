<script>
  import { missionState } from '../stores/missionStore.js';
  import { math } from '../actions/math.js';
  import { CORE_STAGE, G0, propellantFromDryMass } from '../physics/constants.js';
  import PanelHeader from './ui/PanelHeader.svelte';
  import HintsModal from './ui/HintsModal.svelte';
  import TeacherBox from './ui/TeacherBox.svelte';

  let { onBack } = $props();

  const TOL = 0.02; // tolleranza accettata: ±2%
  const { dryMass, isp, targetDeltaV, tankCapacity } = CORE_STAGE;
  const ve = isp * G0; // velocità di scarico efficace
  const realFuel = propellantFromDryMass(dryMass, targetDeltaV, isp);

  let studentFuel = $state(null);
  let feedback = $state('');
  let success = $state(false);
  let checked = $state(false);
  let showHints = $state(false);

  const fmt = (v, d = 0) => v.toLocaleString('it-IT', { minimumFractionDigits: d, maximumFractionDigits: d });
  const tex = (s) => s.replace(/\./g, '{.}').replace(/,/g, '{,}');
  const toNumber = (v) => (typeof v === 'number' ? v : parseFloat(String(v ?? '').replace(',', '.')));
  const near = (x, ref) => Math.abs(x - ref) / Math.abs(ref) <= TOL;
  // Δv che si otterrebbe con la massa di propellente inserita
  const deltaVFor = (m) => ve * Math.log((dryMass + m) / dryMass);

  function diagnose(x) {
    if (near(x, realFuel + dryMass))
      return "Questa è la massa iniziale totale (m_dry + m_fuel): per avere solo il propellente devi sottrarre la massa a vuoto.";
    if (near(x, realFuel / 1000))
      return 'Sembra un valore in tonnellate: il terminale vuole i chilogrammi (1 t = 1000 kg).';
    if (near(x, dryMass * (Math.exp(targetDeltaV / isp) - 1)))
      return "Valore enorme: nell'esponente manca g₀. L'impulso specifico è in secondi; moltiplicato per g₀ diventa la velocità dei gas di scarico in m/s.";
    if (near(x, dryMass * (1 - Math.exp(-targetDeltaV / ve))))
      return "Hai invertito il rapporto tra le masse: nell'equazione m_iniziale (razzo pieno) sta al numeratore, quindi l'esponenziale ha esponente positivo.";

    const dv = deltaVFor(x);
    if (x < realFuel) {
      return `Propellente insufficiente. Con ${fmt(x)} kg il razzo otterrebbe Δv ≈ ${fmt(dv)} m/s, meno dei ${fmt(targetDeltaV)} m/s richiesti: allo spegnimento dei motori non avrebbe raggiunto la velocità orbitale e ricadrebbe verso la Terra.`;
    }
    let msg = `Propellente in eccesso. Con ${fmt(x)} kg otterresti Δv ≈ ${fmt(dv)} m/s, più del necessario. Il propellente in più è massa sprecata: richiede serbatoi più grandi e pesanti e rende il razzo più pesante al decollo, senza servire alla missione.`;
    if (x > tankCapacity) msg += ` Inoltre supera la capacità dei serbatoi del modello (${fmt(tankCapacity)} kg).`;
    return msg;
  }

  function checkCalculations() {
    const x = toNumber(studentFuel);
    checked = true;
    if (!Number.isFinite(x) || x <= 0) {
      success = false;
      feedback = 'Inserisci un numero valido (una massa maggiore di zero, in kg).';
    } else if (near(x, realFuel)) {
      success = true;
      feedback = `Calcolo corretto. Con ${fmt(x)} kg di propellente il core stage fornisce Δv ≈ ${fmt(deltaVFor(x))} m/s: abbastanza per raggiungere l'orbita.`;
    } else {
      success = false;
      feedback = diagnose(x);
    }

    missionState.update((s) => ({
      ...s,
      studentCalculations: {
        ...s.studentCalculations,
        ...(success ? { requiredFuel: x } : {}),
        isValid: false, // la simulazione parte solo con "Avvia il countdown"
      },
      ...(success ? { status: 'Pronto al lancio' } : {}),
    }));
  }

  function launch() {
    if (!success) return;
    missionState.update((s) => ({
      ...s,
      isAnalyzing: false,
      studentCalculations: { ...s.studentCalculations, isValid: true },
      status: 'Countdown avviato',
    }));
  }
</script>

<div class="mc-panel w-full max-w-4xl p-0 overflow-hidden">
  <div class="px-6 pt-6">
    <PanelHeader
      step={2}
      kicker="Terminale di calcolo · Core stage SLS"
      title="Carico del propellente"
      {onBack}
      onInfo={() => (showHints = true)}
    />
  </div>

  <div class="grid md:grid-cols-[minmax(0,2fr)_minmax(0,3fr)]">
    <aside class="bg-panel-2 border-t md:border-t-0 md:border-r border-line p-6 space-y-4">
      <div class="mc-label">Dati di missione</div>
      <dl class="space-y-3">
        <div>
          <dt class="text-xs text-muted uppercase">Massa a vuoto m<sub>dry</sub></dt>
          <dd class="mc-data text-lg">{fmt(dryMass)} kg</dd>
        </div>
        <div>
          <dt class="text-xs text-muted uppercase">Impulso specifico I<sub>sp</sub> (vuoto)</dt>
          <dd class="mc-data text-lg">{fmt(isp)} s</dd>
        </div>
        <div>
          <dt class="text-xs text-muted uppercase">Gravità standard g<sub>0</sub></dt>
          <dd class="mc-data text-lg">{fmt(G0, 5)} m/s²</dd>
        </div>
        <div>
          <dt class="text-xs text-muted uppercase">Δv richiesto</dt>
          <dd class="mc-data text-lg">{fmt(targetDeltaV)} m/s</dd>
        </div>
      </dl>
      <div class="mc-card flex justify-center text-sm">
        <div use:math={{ expression: '\\Delta v = I_{sp}\\, g_0 \\ln\\frac{m_{dry} + m_{fuel}}{m_{dry}}', displayMode: true }}></div>
      </div>
      <p class="text-xs text-muted">Modello a un solo stadio: booster laterali ignorati.</p>
    </aside>

    <section class="p-6 space-y-5">
      <div class="space-y-2">
        <label for="fuelMass" class="mc-label block">Massa di propellente m<sub>fuel</sub></label>
        <div class="flex items-center gap-3">
          <input id="fuelMass" class="mc-input" type="number" step="any" bind:value={studentFuel} placeholder="es. 1234567.8" />
          <span class="mc-data text-signal w-8">kg</span>
        </div>
      </div>

      <p class="text-xs text-muted">
        Scrivi il numero con il punto per i decimali e senza separatori delle migliaia (es. 1234.5). Tolleranza accettata: ±2%.
      </p>

      {#if checked && feedback}
        <div class="{success ? 'mc-feedback-ok' : 'mc-feedback-fail'} text-sm" role="status">{feedback}</div>
      {/if}

      <div class="flex flex-col sm:flex-row gap-3">
        <button type="button" class="mc-btn mc-btn-primary flex-1" onclick={checkCalculations}>Verifica il carico</button>
        {#if success}
          <button type="button" class="mc-btn mc-btn-go flex-1" onclick={launch}>Avvia il countdown</button>
        {/if}
      </div>

      <TeacherBox>
        <div class="space-y-2 text-lunar-gray">
          <div use:math={{ expression: `m_{fuel} = m_{dry}\\left(e^{\\frac{\\Delta v}{I_{sp} g_0}} - 1\\right) \\approx ${tex(fmt(Math.round(realFuel)))}\\ \\text{kg}` }}></div>
          <p class="text-xs text-muted">
            Esponente Δv/(I<sub>sp</sub>g<sub>0</sub>) ≈ {fmt(targetDeltaV / ve, 3)}; rapporto di massa ≈ {fmt(Math.exp(targetDeltaV / ve), 2)}.
            Accettati {fmt(realFuel * (1 - TOL))}–{fmt(realFuel * (1 + TOL))} kg.
          </p>
        </div>
      </TeacherBox>
    </section>
  </div>
</div>

<HintsModal open={showHints} onClose={() => (showHints = false)}>
  <p>
    <strong class="text-white">1. Isola il logaritmo.</strong> Dividi entrambi i membri per I<sub>sp</sub>·g<sub>0</sub>: a sinistra
    ottieni un numero puro (senza unità di misura).
  </p>
  <p>
    <strong class="text-white">2. Togli il logaritmo.</strong> La funzione inversa del logaritmo naturale è l'esponenziale: se
    ln(x) = k, allora x = e<sup>k</sup>. Così trovi il rapporto tra massa iniziale e massa finale.
  </p>
  <p>
    <strong class="text-white">3. Ricava il propellente.</strong> Ricorda che m<sub>iniziale</sub> = m<sub>dry</sub> + m<sub>fuel</sub>:
    moltiplica il rapporto per m<sub>dry</sub> e poi sottrai la massa a vuoto.
  </p>
  <p class="text-muted">Controllo di buon senso: il razzo pieno pesa diverse volte più del razzo vuoto.</p>
</HintsModal>
