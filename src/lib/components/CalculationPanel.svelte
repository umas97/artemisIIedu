<script>
  import { missionState } from '../stores/missionStore.js';
  import { math } from '../actions/math.js';
  import { EARTH, HEO } from '../physics/constants.js';
  import PanelHeader from './ui/PanelHeader.svelte';
  import HintsModal from './ui/HintsModal.svelte';
  import TeacherBox from './ui/TeacherBox.svelte';

  let { onBack } = $props();

  // Tolleranza accettata sulle risposte (2%)
  const TOL = 0.02;

  // Valori di riferimento (dalle costanti condivise)
  const R = EARTH.R;
  const GM = EARTH.GM;
  const rp = R + HEO.hp;
  const ra = R + HEO.ha;
  const A = (rp + ra) / 2;
  const T = 2 * Math.PI * Math.sqrt(A ** 3 / GM);

  let studentA = $state(null);
  let studentT = $state(null);
  let aMsg = $state(''); // esito del semiasse
  let tMsg = $state(''); // esito del periodo
  let aOk = $state(false);
  let tOk = $state(false);
  let checked = $state(false);
  let showHints = $state(false);

  let success = $derived(checked && aOk && tOk);

  const fmt = (v, d = 0) => v.toLocaleString('it-IT', { minimumFractionDigits: d, maximumFractionDigits: d });
  const fmtKm = (m) => fmt(Math.round(m / 1000));
  const toNumber = (v) => (typeof v === 'number' ? v : parseFloat(String(v ?? '').replace(',', '.')));
  const near = (x, ref, tol = TOL) => Math.abs(x - ref) / Math.abs(ref) <= tol;

  function diagnoseA(x) {
    if (near(x, A / 1000)) return 'Sembra un valore in chilometri: il terminale vuole il semiasse in metri (1 km = 1000 m).';
    if (near(x, (HEO.hp + HEO.ha) / 2) || near(x, (HEO.hp + HEO.ha) / 2000))
      return "Hai usato le quote, che sono misurate dalla superficie. Keplero vuole le distanze dal centro della Terra: aggiungi il raggio terrestre sia al perigeo sia all'apogeo.";
    if (near(x, A - R / 2) || near(x, (A - R / 2) / 1000))
      return "Hai aggiunto il raggio terrestre una sola volta: va aggiunto sia alla quota del perigeo sia a quella dell'apogeo.";
    if (near(x, 2 * A) || near(x, (2 * A) / 1000))
      return "Questo è l'asse maggiore intero (r_p + r_a): il semiasse è la sua metà.";

    if (x < A) {
      // Stesso apogeo, ellisse più piccola: il perigeo si abbassa
      const hp2 = 2 * x - ra - R;
      let where;
      if (hp2 < 0) where = "sotto la superficie: un'orbita così colpirebbe la Terra";
      else if (hp2 < 100000) where = `a circa ${fmtKm(hp2)} km di quota, cioè dentro l'atmosfera`;
      else where = `a circa ${fmtKm(hp2)} km di quota invece di ${fmtKm(HEO.hp)} km`;
      return `Semiasse troppo piccolo. Un'ellisse con questo a è più corta di quella di Artemis II: mantenendo lo stesso apogeo, il perigeo cadrebbe ${where}. Ricontrolla le distanze dal centro e le unità.`;
    }
    const ha2 = 2 * x - rp - R;
    return `Semiasse troppo grande. Un'ellisse con questo a è più lunga di quella di Artemis II: mantenendo lo stesso perigeo, l'apogeo finirebbe a circa ${fmtKm(ha2)} km di quota invece di ${fmtKm(HEO.ha)} km. Ricontrolla somme e unità di misura.`;
  }

  function diagnoseT(t, x, aCorrect) {
    if (!aCorrect) {
      if (Number.isFinite(x) && x > 0 && near(t, 2 * Math.PI * Math.sqrt(x ** 3 / GM)))
        return 'Il periodo è coerente con il tuo valore di a, ma a è sbagliato: per la terza legge di Keplero T dipende da a. Correggi prima a, poi ricalcola T.';
      return 'Il periodo si ricava dal semiasse con la terza legge di Keplero: correggi prima a, poi ricalcola T.';
    }
    if (near(t, T / 3600)) return 'Sembra un valore in ore: il terminale vuole i secondi (1 h = 3600 s).';
    if (near(t, T / 60)) return 'Sembra un valore in minuti: il terminale vuole i secondi (1 min = 60 s).';
    if (near(t, T * T)) return 'Hai calcolato T²: manca la radice quadrata.';
    if (near(t, T / (2 * Math.PI))) return 'Manca il fattore 2π: dalla legge si ottiene T = 2π·√(a³/GM).';
    if (near(t, T / Math.sqrt(1e9)))
      return 'Hai usato a in chilometri insieme a GM in m³/s²: le unità non sono coerenti. Usa a in metri.';
    return t < T
      ? 'Periodo troppo breve per questo semiasse. Per la terza legge di Keplero un periodo più breve corrisponde a un\'orbita più piccola: ricontrolla il cubo di a, la radice quadrata e il valore di GM.'
      : 'Periodo troppo lungo per questo semiasse. Per la terza legge di Keplero un periodo più lungo corrisponde a un\'orbita più grande: ricontrolla il cubo di a, la radice quadrata e il valore di GM.';
  }

  function checkCalculations() {
    const x = toNumber(studentA);
    const t = toNumber(studentT);
    const aValid = Number.isFinite(x) && x > 0;
    const tValid = Number.isFinite(t) && t > 0;

    aOk = aValid && near(x, A);
    tOk = tValid && near(t, T);
    aMsg = !aValid ? 'Inserisci un numero valido per il semiasse (maggiore di zero).' : aOk ? 'Semiasse corretto.' : diagnoseA(x);
    tMsg = !tValid ? 'Inserisci un numero valido per il periodo (maggiore di zero).' : tOk ? 'Periodo corretto.' : diagnoseT(t, x, aOk);
    checked = true;

    if (aOk && tOk) {
      missionState.update((s) => ({
        ...s,
        studentCalculations: { ...s.studentCalculations, semiMajorAxis: x, orbitalPeriod: t, isValid: true },
        status: 'Orbita verificata',
      }));
    } else {
      missionState.update((s) => ({
        ...s,
        studentCalculations: { ...s.studentCalculations, isValid: false },
      }));
    }
  }

  // Si chiude solo dopo una verifica riuscita
  function confirm() {
    if (!success) return;
    missionState.update((s) => ({
      ...s,
      isAnalyzing: false,
      phase1Complete: true,
      status: 'Orbita confermata',
    }));
  }
</script>

<div class="mc-panel w-full max-w-4xl p-0 overflow-hidden">
  <div class="px-6 pt-6">
    <PanelHeader
      step={1}
      kicker="Terminale di calcolo · HEO"
      title="Parametri dell'orbita alta"
      {onBack}
      onInfo={() => (showHints = true)}
    />
  </div>

  <div class="grid md:grid-cols-[minmax(0,2fr)_minmax(0,3fr)]">
    <!-- Dati di missione -->
    <aside class="bg-panel-2 border-t md:border-t-0 md:border-r border-line p-6 space-y-4">
      <div class="mc-label">Dati di missione</div>
      <dl class="space-y-3">
        <div>
          <dt class="text-xs text-muted uppercase">Raggio terrestre R<sub>T</sub></dt>
          <dd class="mc-data text-lg">{fmt(R)} m</dd>
        </div>
        <div>
          <dt class="text-xs text-muted uppercase">Quota perigeo h<sub>p</sub></dt>
          <dd class="mc-data text-lg">{fmt(HEO.hp)} m</dd>
        </div>
        <div>
          <dt class="text-xs text-muted uppercase">Quota apogeo h<sub>a</sub></dt>
          <dd class="mc-data text-lg">{fmt(HEO.ha)} m</dd>
        </div>
        <div>
          <dt class="text-xs text-muted uppercase">GM della Terra</dt>
          <dd class="mc-data text-lg"><span use:math={{ expression: `${String(GM / 1e14).replace('.', '{,}')} \\times 10^{14}\\ \\text{m}^3/\\text{s}^2` }}></span></dd>
        </div>
      </dl>
      <div class="mc-card text-sm space-y-2">
        <div class="flex justify-center" use:math={{ expression: 'a = \\frac{r_p + r_a}{2}', displayMode: true }}></div>
        <div class="flex justify-center" use:math={{ expression: '\\frac{T^2}{a^3} = \\frac{4\\pi^2}{GM}', displayMode: true }}></div>
      </div>
    </aside>

    <!-- Input e verifica -->
    <section class="p-6 space-y-5">
      <div class="space-y-2">
        <label for="semiMajorAxis" class="mc-label block">Semiasse maggiore a</label>
        <div class="flex items-center gap-3">
          <input id="semiMajorAxis" class="mc-input" type="number" step="any" bind:value={studentA} placeholder="es. 12345678.9" />
          <span class="mc-data text-signal w-8">m</span>
        </div>
        {#if checked && aMsg}
          <p class="text-sm {aOk ? 'text-ok' : 'text-fail'}">{aMsg}</p>
        {/if}
      </div>

      <div class="space-y-2">
        <label for="orbitalPeriod" class="mc-label block">Periodo orbitale T</label>
        <div class="flex items-center gap-3">
          <input id="orbitalPeriod" class="mc-input" type="number" step="any" bind:value={studentT} placeholder="es. 12345.6" />
          <span class="mc-data text-signal w-8">s</span>
        </div>
        {#if checked && tMsg}
          <p class="text-sm {tOk ? 'text-ok' : 'text-fail'}">{tMsg}</p>
        {/if}
      </div>

      <p class="text-xs text-muted">
        Scrivi i numeri con il punto per i decimali (es. 1234.5). Tolleranza accettata: ±2% rispetto al valore esatto.
      </p>

      {#if checked}
        <div class="{success ? 'mc-feedback-ok' : 'mc-feedback-fail'} text-sm" role="status">
          {#if success}
            Parametri orbitali corretti. Il periodo vale circa {fmt(T / 3600, 1)} ore: Orion impiega quasi un giorno per percorrere
            l'ellisse, veloce vicino al perigeo e lenta vicino all'apogeo.
          {:else}
            Qualcosa non torna: leggi i messaggi sotto ciascun campo, correggi e verifica di nuovo.
          {/if}
        </div>
      {/if}

      <div class="flex flex-col sm:flex-row gap-3">
        <button type="button" class="mc-btn mc-btn-primary flex-1" onclick={checkCalculations}>Verifica orbita</button>
        {#if success}
          <button type="button" class="mc-btn mc-btn-go flex-1" onclick={confirm}>Avvia la simulazione</button>
        {/if}
      </div>

      <TeacherBox>
        <div class="space-y-2 text-lunar-gray">
          <div use:math={{ expression: `a = \\frac{(R_T + h_p) + (R_T + h_a)}{2} = ${fmt(A).replace(/\./g, '{.}')}\\ \\text{m}` }}></div>
          <div use:math={{ expression: `T = 2\\pi\\sqrt{\\frac{a^3}{GM}} \\approx ${fmt(T).replace(/\./g, '{.}')}\\ \\text{s} \\approx ${fmt(T / 3600, 1).replace(',', '{,}')}\\ \\text{h}` }}></div>
          <p class="text-xs text-muted">Accettati valori entro ±2% (a: {fmt(A * 0.98)}–{fmt(A * 1.02)} m; T: {fmt(T * 0.98)}–{fmt(T * 1.02)} s).</p>
        </div>
      </TeacherBox>
    </section>
  </div>
</div>

<HintsModal open={showHints} onClose={() => (showHints = false)}>
  <p>
    <strong class="text-white">1. Dal centro, non dalla superficie.</strong> Le quote h<sub>p</sub> e h<sub>a</sub> partono dal suolo.
    Per ottenere le distanze dal centro della Terra aggiungi a ciascuna il raggio terrestre: r<sub>p</sub> = R<sub>T</sub> + h<sub>p</sub>,
    r<sub>a</sub> = R<sub>T</sub> + h<sub>a</sub>.
  </p>
  <p>
    <strong class="text-white">2. L'asse maggiore.</strong> Perigeo e apogeo stanno da parti opposte della Terra: il segmento che li unisce
    passando per il centro è lungo r<sub>p</sub> + r<sub>a</sub>. Il semiasse a è la metà.
  </p>
  <p>
    <strong class="text-white">3. Il periodo.</strong> Isola T nella terza legge di Keplero: T² = 4π²·a³/GM, poi fai la radice quadrata.
    Usa a in metri, così con GM in m³/s² ottieni T in secondi.
  </p>
  <p class="text-muted">Controllo di buon senso: il risultato dovrebbe essere di circa un giorno. Dividi per 3600 per averlo in ore.</p>
</HintsModal>
