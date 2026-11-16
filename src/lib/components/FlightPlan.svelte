<script>
  // Flight Plan: relazione tecnica di fine missione da stampare e consegnare al docente.
  import { missionState } from "../stores/missionStore";
  import { ORION, ICPS, CORE_STAGE, G0, MOON, HEO, propellantFromInitialMass } from "../physics/constants.js";
  import { math } from "../actions/math.js";
  import RealityNote from "./ui/RealityNote.svelte";

  let { onClose, onRestart } = $props();

  // --- Costanti locali usate solo in questo report (valori arrotondati, a scopo didattico) ---
  // Spinta del motore principale dell'ESM di Orion (OMS-E, derivato dall'AJ10): ≈ 26,7 kN
  const THRUST_ESM = 26700; // N
  // Spinta del motore RL10B-2 dell'ICPS: ≈ 110 kN
  const THRUST_ICPS = 110000; // N
  // Massa stimata dell'ICPS con i serbatoi pieni (ordine di grandezza)
  const ICPS_WET_MASS = 32000; // kg
  // Massa iniziale per la TLI: Orion (CM + ESM) + ICPS
  const TLI_INITIAL_MASS = ORION.initialMass + ICPS_WET_MASS; // kg

  // --- Dati dello studente ---
  let studentName = $state("");
  let studentClass = $state("");
  let reportDate = $state(new Date().toLocaleDateString("sv-SE")); // AAAA-MM-GG, ora locale
  /** @type {"restart" | "quit" | null} */
  let confirmAction = $state(null);

  const calc = $derived($missionState.studentCalculations);

  const phases = [
    { n: 1, name: "Orbita alta (HEO)" },
    { n: 2, name: "Lancio (core stage)" },
    { n: 3, name: "Iniezione trans-lunare (TLI)" },
    { n: 4, name: "Inserimento in orbita lunare (LOI)" },
    { n: 5, name: "Iniezione trans-terrestre (TEI)" },
    { n: 6, name: "Rientro e paracadute" },
  ];
  const completed = $derived(
    phases.map((p) => !!(/** @type {Record<string, any>} */ ($missionState))[`phase${p.n}Complete`]),
  );
  const completedCount = $derived(completed.filter(Boolean).length);

  // --- Utilità di formattazione (numeri all'italiana) ---
  /** @param {any} v */
  const isNum = (v) => typeof v === "number" && Number.isFinite(v) && v !== 0;
  /** @param {number} v @param {number} [digits] */
  const fmt = (v, digits = 0) =>
    Number.isFinite(v)
      ? v.toLocaleString("it-IT", { minimumFractionDigits: digits, maximumFractionDigits: digits })
      : "—";
  /** @param {any} v @param {number} [digits] */
  const fmtOr = (v, digits = 0) => (isNum(v) ? fmt(v, digits) : "—");
  const dateText = $derived(
    reportDate ? new Date(reportDate + "T12:00:00").toLocaleDateString("it-IT") : "",
  );

  // --- Velocità di scarico ---
  const veESM = ORION.ispESM * G0; // m/s
  const veICPS = ICPS.isp * G0; // m/s

  // Durata di un'accensione a spinta costante: portata ṁ = F / ve, quindi t = m_p · ve / F
  /** @param {number} mProp @param {number} ve @param {number} thrust */
  const burnTime = (mProp, ve, thrust) => (mProp * ve) / thrust;

  // --- Bilancio propellente ---
  const tliDv = $derived(Math.abs(calc.tliDeltaV || 0));
  const loiDv = $derived(Math.abs(calc.loiDeltaV || 0));
  const teiDv = $derived(Math.abs(calc.teiDeltaV || 0));

  // TLI: ICPS (Orion + ICPS)
  const tliProp = $derived(tliDv > 0 ? propellantFromInitialMass(TLI_INITIAL_MASS, tliDv, ICPS.isp) : 0);
  const tliTime = $derived(burnTime(tliProp, veICPS, THRUST_ICPS));

  // LOI e TEI: ESM di Orion, in sequenza (la TEI parte dalla massa rimasta dopo la LOI)
  const loiM0 = ORION.initialMass;
  const loiProp = $derived(loiDv > 0 ? propellantFromInitialMass(loiM0, loiDv, ORION.ispESM) : 0);
  const teiM0 = $derived(loiM0 - loiProp);
  const teiProp = $derived(teiDv > 0 ? propellantFromInitialMass(teiM0, teiDv, ORION.ispESM) : 0);
  const finalMass = $derived(teiM0 - teiProp);
  const loiTime = $derived(burnTime(loiProp, veESM, THRUST_ESM));
  const teiTime = $derived(burnTime(teiProp, veESM, THRUST_ESM));

  const esmTotal = $derived(loiProp + teiProp);
  const esmRatio = $derived(esmTotal / ORION.propellantCapacity);
  const esmExceeds = $derived(esmTotal > ORION.propellantCapacity);
  const totalDv = $derived(tliDv + loiDv + teiDv);

  const nodes = $derived([
    {
      id: "TLI",
      name: "Iniezione trans-lunare",
      where: `Perigeo dell'orbita HEO (quota ${fmt(HEO.hp / 1000)} km)`,
      dir: "Progrado",
      by: "Stadio ICPS (modello)",
      dv: tliDv,
      dur: tliTime,
    },
    {
      id: "LOI",
      name: "Inserimento in orbita lunare",
      where: `Periselenio, quota ${fmt(MOON.orbitAltitude / 1000)} km sulla Luna`,
      dir: "Retrogrado (frenata)",
      by: "Orion · ESM",
      dv: loiDv,
      dur: loiTime,
    },
    {
      id: "TEI",
      name: "Iniezione trans-terrestre",
      where: `Orbita lunare circolare a ${fmt(MOON.orbitAltitude / 1000)} km`,
      dir: "Progrado",
      by: "Orion · ESM",
      dv: teiDv,
      dur: teiTime,
    },
    {
      id: "EI",
      name: "Interfaccia di rientro",
      where: "Ingresso in atmosfera (≈ 122 km di quota)",
      dir: "Nessuna accensione",
      by: "Capsula (CM)",
      dv: 0,
      dur: 0,
    },
  ]);

  // Valore del modello di Fase 2 (per confronto con quello dello studente)
  const coreStageModel = CORE_STAGE.dryMass * (Math.exp(CORE_STAGE.targetDeltaV / (CORE_STAGE.isp * G0)) - 1);

  // Sposta il report direttamente sotto <body>: in stampa si nasconde tutto il resto dell'app
  /** @param {HTMLElement} node */
  function portal(node) {
    document.body.appendChild(node);
    return {
      destroy() {
        node.remove();
      },
    };
  }

  const handleConfirm = async () => {
    const action = confirmAction;
    confirmAction = null;
    if (action === "restart") {
      onRestart();
    } else if (action === "quit") {
      try {
        const { getCurrentWindow } = await import("@tauri-apps/api/window");
        await getCurrentWindow().close();
      } catch {
        window.close();
      }
    }
  };
</script>

<div class="fp-root fixed inset-0 z-[100] bg-space-black/95 flex items-start justify-center p-4" use:portal>
  <div class="fp-paper mc-panel mc-enter w-full max-w-5xl p-0">
    <!-- Barra comandi (solo schermo) -->
    <div class="fp-toolbar sticky top-0 z-10 flex flex-wrap items-center justify-between gap-3 border-b border-line bg-panel px-6 py-3 print:hidden">
      <div class="mc-label">Flight Plan · Relazione di fine missione</div>
      <div class="flex flex-wrap gap-2">
        <button type="button" class="mc-btn mc-btn-primary !py-2 !px-4" onclick={() => window.print()}>
          <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2"><path stroke-linecap="round" stroke-linejoin="round" d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" /></svg>
          Stampa
        </button>
        <button type="button" class="mc-btn mc-btn-go !py-2 !px-4" onclick={() => (confirmAction = "restart")}>
          Nuova missione
        </button>
        <button type="button" class="mc-btn mc-btn-ghost !py-2 !px-4" onclick={onClose}>
          Chiudi
        </button>
      </div>
    </div>

    <article class="fp-body px-6 py-6 md:px-8 space-y-6">
      <!-- Intestazione del documento -->
      <header class="fp-section border-b border-line pb-5">
        <div class="mc-label">Missione Artemis II · Esercitazione di Fisica</div>
        <h1 class="mc-title mt-1">Flight Plan — Relazione tecnica di fine missione</h1>

        <div class="mt-5 grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div>
            <label class="mc-label block mb-1" for="fp-name">Studente/ssa</label>
            <input id="fp-name" class="mc-input !text-base print:hidden" type="text" placeholder="Nome e cognome" bind:value={studentName} />
            <div class="fp-print-field hidden print:block">{studentName || "______________________"}</div>
          </div>
          <div>
            <label class="mc-label block mb-1" for="fp-class">Classe</label>
            <input id="fp-class" class="mc-input !text-base print:hidden" type="text" placeholder="es. 2A" bind:value={studentClass} />
            <div class="fp-print-field hidden print:block">{studentClass || "__________"}</div>
          </div>
          <div>
            <label class="mc-label block mb-1" for="fp-date">Data</label>
            <input id="fp-date" class="mc-input !text-base print:hidden" type="date" bind:value={reportDate} />
            <div class="fp-print-field hidden print:block">{dateText || "____/____/______"}</div>
          </div>
        </div>
      </header>

      <!-- Stato delle fasi -->
      <section class="fp-section mc-card">
        <h2 class="fp-h2">
          Stato della missione:
          {#if completedCount === phases.length}
            tutte le {phases.length} fasi completate
          {:else}
            {completedCount} fasi su {phases.length} completate
          {/if}
        </h2>
        <ul class="mt-3 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2 text-sm">
          {#each phases as p, i}
            <li class="flex items-center gap-2">
              <span class="fp-check font-mono font-bold {completed[i] ? 'text-ok' : 'text-muted'}">{completed[i] ? "✓" : "○"}</span>
              <span class={completed[i] ? "text-lunar-gray" : "text-muted"}>Fase {p.n} · {p.name}</span>
            </li>
          {/each}
        </ul>
        <p class="mt-3 text-sm text-muted">
          Profilo dell'esercizio: orbita alta terrestre (HEO) → iniezione trans-lunare → orbita lunare a
          {fmt(MOON.orbitAltitude / 1000)} km → iniezione trans-terrestre → rientro in atmosfera e ammaraggio.
        </p>
      </section>

      <!-- Sezione 1: nodi di manovra -->
      <section class="fp-section">
        <div class="mc-label">Sezione 1</div>
        <h2 class="fp-h2 mb-3">Tabella dei nodi di manovra</h2>
        <div class="overflow-x-auto">
          <table class="fp-table w-full text-sm">
            <thead>
              <tr>
                <th class="text-left">Nodo</th>
                <th class="text-left">Manovra</th>
                <th class="text-left">Quando / dove</th>
                <th class="text-left">Direzione della spinta</th>
                <th class="text-left">Eseguita da</th>
                <th class="text-right">Δv (m/s)</th>
                <th class="text-right">Durata (s)</th>
              </tr>
            </thead>
            <tbody>
              {#each nodes as node}
                <tr>
                  <td class="font-mono font-bold text-signal">{node.id}</td>
                  <td>{node.name}</td>
                  <td class="text-muted">{node.where}</td>
                  <td>{node.dir}</td>
                  <td>{node.by}</td>
                  <td class="text-right mc-data">{node.id === "EI" ? "—" : fmtOr(node.dv)}</td>
                  <td class="text-right mc-data">{node.id === "EI" || !node.dv ? "—" : fmt(node.dur)}</td>
                </tr>
              {/each}
            </tbody>
            <tfoot>
              <tr>
                <td colspan="5" class="font-bold">Δv totale delle manovre (TLI + LOI + TEI)</td>
                <td class="text-right mc-data font-bold">{fmtOr(totalDv)}</td>
                <td></td>
              </tr>
            </tfoot>
          </table>
        </div>
        <div class="mt-3 grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
          <div class="mc-card">
            <div class="mc-label mb-2">Durata di un'accensione</div>
            <div class="text-center" use:math={{ expression: "t \\approx \\frac{m_p \\, v_e}{F} \\qquad v_e = I_{sp}\\, g_0", displayMode: true }}></div>
            <p class="mt-2 text-muted">
              Con spinta F costante il motore espelle propellente a ritmo costante
              (ṁ = F / v<sub>e</sub>): la durata è la massa di propellente m<sub>p</sub> divisa per questo ritmo.
            </p>
          </div>
          <div class="mc-card">
            <div class="mc-label mb-2">Dati dei motori</div>
            <ul class="space-y-1">
              <li>ICPS (RL10B-2): F ≈ <span class="mc-data">{fmt(THRUST_ICPS / 1000)} kN</span>, I<sub>sp</sub> = <span class="mc-data">{fmt(ICPS.isp, 1)} s</span>, v<sub>e</sub> ≈ <span class="mc-data">{fmt(veICPS)} m/s</span></li>
              <li>Orion ESM: F ≈ <span class="mc-data">{fmt(THRUST_ESM / 1000, 1)} kN</span>, I<sub>sp</sub> = <span class="mc-data">{fmt(ORION.ispESM)} s</span>, v<sub>e</sub> ≈ <span class="mc-data">{fmt(veESM)} m/s</span></li>
              <li>g<sub>0</sub> = <span class="mc-data">{fmt(G0, 2)} m/s²</span></li>
            </ul>
          </div>
        </div>
      </section>

      <!-- Sezione 2: propellente -->
      <section class="fp-section">
        <div class="mc-label">Sezione 2</div>
        <h2 class="fp-h2 mb-3">Consumo di propellente (equazione di Tsiolkovsky)</h2>
        <div class="mc-card text-center mb-4" use:math={{ expression: "m_p = m_0 \\left(1 - e^{-\\Delta v / v_e}\\right)", displayMode: true }}></div>

        <div class="overflow-x-auto">
          <table class="fp-table w-full text-sm">
            <thead>
              <tr>
                <th class="text-left">Voce</th>
                <th class="text-left">Motore</th>
                <th class="text-right">Δv (m/s)</th>
                <th class="text-right">m<sub>0</sub> (kg)</th>
                <th class="text-right">Propellente (kg)</th>
                <th class="text-right">Durata (s)</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td>Fase 2 · lancio (il tuo calcolo)</td>
                <td>Core stage SLS, I<sub>sp</sub> {CORE_STAGE.isp} s</td>
                <td class="text-right mc-data">{fmt(CORE_STAGE.targetDeltaV)}</td>
                <td class="text-right mc-data">—</td>
                <td class="text-right mc-data">{fmtOr(calc.requiredFuel)}</td>
                <td class="text-right mc-data">—</td>
              </tr>
              <tr>
                <td>TLI <span class="text-muted">(m<sub>0</sub> = Orion + ICPS, stimata)</span></td>
                <td>Stadio ICPS (modello)</td>
                <td class="text-right mc-data">{fmtOr(tliDv)}</td>
                <td class="text-right mc-data">{fmt(TLI_INITIAL_MASS)}</td>
                <td class="text-right mc-data">{fmtOr(tliProp)}</td>
                <td class="text-right mc-data">{tliDv ? fmt(tliTime) : "—"}</td>
              </tr>
              <tr>
                <td>LOI</td>
                <td>Orion · ESM</td>
                <td class="text-right mc-data">{fmtOr(loiDv)}</td>
                <td class="text-right mc-data">{fmt(loiM0)}</td>
                <td class="text-right mc-data">{fmtOr(loiProp)}</td>
                <td class="text-right mc-data">{loiDv ? fmt(loiTime) : "—"}</td>
              </tr>
              <tr>
                <td>TEI <span class="text-muted">(parte dalla massa rimasta dopo la LOI)</span></td>
                <td>Orion · ESM</td>
                <td class="text-right mc-data">{fmtOr(teiDv)}</td>
                <td class="text-right mc-data">{fmt(teiM0)}</td>
                <td class="text-right mc-data">{fmtOr(teiProp)}</td>
                <td class="text-right mc-data">{teiDv ? fmt(teiTime) : "—"}</td>
              </tr>
            </tbody>
            <tfoot>
              <tr>
                <td colspan="4" class="font-bold">Propellente totale Orion (LOI + TEI)</td>
                <td class="text-right mc-data font-bold {esmExceeds ? 'text-fail' : 'text-ok'}">{fmtOr(esmTotal)}</td>
                <td></td>
              </tr>
              <tr>
                <td colspan="4">Propellente utilizzabile nell'ESM di Orion</td>
                <td class="text-right mc-data">{fmt(ORION.propellantCapacity)}</td>
                <td></td>
              </tr>
            </tfoot>
          </table>
        </div>

        <p class="mt-2 text-sm text-muted">
          Riferimento del modello di Fase 2 (un solo stadio, booster ignorati): m<sub>dry</sub> = {fmt(CORE_STAGE.dryMass)} kg,
          Δv = {fmt(CORE_STAGE.targetDeltaV)} m/s → m<sub>p</sub> ≈ {fmt(coreStageModel)} kg.
          Massa di Orion dopo la TEI: {loiDv || teiDv ? `${fmt(finalMass)} kg` : "—"}.
        </p>

        {#if esmTotal > 0}
          <!-- Indicatore propellente usato / disponibile -->
          <div class="mt-4">
            <div class="flex justify-between text-sm mb-1">
              <span class="mc-label">Propellente ESM richiesto / disponibile</span>
              <span class="mc-data">{fmt(esmRatio * 100)} %</span>
            </div>
            <div class="fp-meter h-3 rounded-full bg-panel-2 border border-line overflow-hidden">
              <div class="h-full {esmExceeds ? 'bg-fail' : 'bg-ok'}" style="width: {Math.min(esmRatio, 1) * 100}%"></div>
            </div>
          </div>
        {/if}

        {#if esmExceeds}
          <div class="fp-note mt-4 rounded-lg border border-warn/50 bg-warn/10 p-4 text-sm leading-relaxed">
            <div class="mc-label !text-warn mb-1">Nota didattica</div>
            Per LOI + TEI servirebbero circa <strong>{fmt(esmTotal / 1000, 1)} t</strong> di propellente, ma l'ESM ne contiene
            solo <strong>{fmt(ORION.propellantCapacity / 1000, 1)} t</strong>. Orion reale non avrebbe abbastanza propellente
            per entrare e uscire da un'orbita bassa lunare: ecco perché Artemis II usa una traiettoria di libero ritorno.
            Le missioni che scendono in orbita lunare usano strategie diverse (Apollo aveva un modulo di servizio con molto più
            propellente; Artemis III+ useranno un'orbita lunare molto ellittica, più economica da raggiungere).
          </div>
        {/if}
      </section>

      <!-- Sezione 3: traiettoria -->
      <section class="fp-section">
        <div class="mc-label">Sezione 3</div>
        <h2 class="fp-h2 mb-1">Profilo della traiettoria dell'esercizio</h2>
        <p class="text-sm text-muted mb-3">
          Schema non in scala: la Luna dista circa 60 raggi terrestri ({fmt(MOON.distance / 1000)} km).
        </p>

        <div class="fp-chart mc-card !p-3">
          <svg viewBox="0 0 800 400" class="w-full h-auto" role="img" aria-label="Schema della traiettoria: orbita HEO, TLI, orbita lunare, TEI e rientro">
            <defs>
              <marker id="fp-arrow-out" viewBox="0 0 10 10" refX="5" refY="5" markerWidth="7" markerHeight="7" orient="auto-start-reverse">
                <path d="M0,0 L10,5 L0,10 z" class="fp-fill-out" />
              </marker>
              <marker id="fp-arrow-ret" viewBox="0 0 10 10" refX="5" refY="5" markerWidth="7" markerHeight="7" orient="auto-start-reverse">
                <path d="M0,0 L10,5 L0,10 z" class="fp-fill-ret" />
              </marker>
            </defs>

            <!-- Orbita HEO: ellisse con la Terra in un fuoco -->
            <ellipse cx="232" cy="200" rx="98" ry="76" class="fp-orbit" />
            <text x="290" y="112" class="fp-svg-small">Orbita HEO</text>

            <!-- Terra -->
            <circle cx="170" cy="200" r="28" class="fp-earth" />
            <text x="170" y="205" text-anchor="middle" class="fp-svg-body">Terra</text>

            <!-- Luna e orbita lunare -->
            <circle cx="650" cy="200" r="34" class="fp-orbit-moon" />
            <circle cx="650" cy="200" r="16" class="fp-moon" />
            <text x="650" y="258" text-anchor="middle" class="fp-svg-label">Luna</text>
            <text x="650" y="280" text-anchor="middle" class="fp-svg-small">orbita a {fmt(MOON.orbitAltitude / 1000)} km</text>

            <!-- Andata: dal perigeo HEO (lato opposto alla Luna) fino alla Luna -->
            <path d="M 134 200 C 140 30, 560 30, 626 176" class="fp-path-out" />
            <path d="M 357 70 l 0.1 0" class="fp-path-out" marker-end="url(#fp-arrow-out)" />

            <!-- Ritorno: dall'orbita lunare verso la Terra -->
            <path d="M 626 224 C 560 370, 240 370, 192 226" class="fp-path-ret" />
            <path d="M 402 334 l -0.1 0" class="fp-path-ret" marker-end="url(#fp-arrow-ret)" />

            <!-- Nodi di manovra -->
            <circle cx="134" cy="200" r="7" class="fp-node" />
            <text x="22" y="172" class="fp-svg-label">TLI</text>
            <text x="22" y="192" class="fp-svg-small">{tliDv ? `${fmt(tliDv)} m/s` : "Δv —"}</text>

            <circle cx="626" cy="176" r="7" class="fp-node" />
            <text x="606" y="166" text-anchor="end" class="fp-svg-label">LOI</text>
            <text x="606" y="186" text-anchor="end" class="fp-svg-small">{loiDv ? `${fmt(loiDv)} m/s` : "Δv —"}</text>

            <circle cx="626" cy="224" r="7" class="fp-node" />
            <text x="606" y="224" text-anchor="end" class="fp-svg-label">TEI</text>
            <text x="606" y="244" text-anchor="end" class="fp-svg-small">{teiDv ? `${fmt(teiDv)} m/s` : "Δv —"}</text>

            <circle cx="192" cy="226" r="7" class="fp-node" />
            <text x="185" y="300" text-anchor="end" class="fp-svg-label">EI</text>
            <text x="185" y="320" text-anchor="end" class="fp-svg-small">rientro{isNum(calc.reentryAngle) ? ` ${fmt(calc.reentryAngle, 1)}°` : ""}</text>

            <text x="357" y="50" text-anchor="middle" class="fp-svg-small">andata (dopo la TLI)</text>
            <text x="402" y="362" text-anchor="middle" class="fp-svg-small">ritorno (dopo la TEI)</text>
          </svg>
        </div>

        <ul class="fp-legend mt-3 flex flex-wrap gap-x-6 gap-y-2 text-sm text-muted">
          <li class="flex items-center gap-2"><svg width="32" height="8" aria-hidden="true"><line x1="0" y1="4" x2="32" y2="4" class="fp-path-out" /></svg> Andata</li>
          <li class="flex items-center gap-2"><svg width="32" height="8" aria-hidden="true"><line x1="0" y1="4" x2="32" y2="4" class="fp-path-ret" /></svg> Ritorno</li>
          <li class="flex items-center gap-2"><svg width="32" height="8" aria-hidden="true"><line x1="0" y1="4" x2="32" y2="4" class="fp-orbit" /></svg> Orbite</li>
          <li class="flex items-center gap-2"><svg width="14" height="14" aria-hidden="true"><circle cx="7" cy="7" r="5" class="fp-node" /></svg> Nodo di manovra</li>
        </ul>

        <div class="mt-4">
          <RealityNote>
            In questo esercizio Orion entra in orbita lunare (LOI) e poi ne esce (TEI), come facevano le missioni Apollo e
            come faranno le future Artemis III e successive. Artemis II reale invece non entra in orbita lunare: compie un
            sorvolo della Luna su una traiettoria di libero ritorno, in cui è la gravità della Luna a curvare la traiettoria
            e a rimandare la capsula verso la Terra, senza grandi accensioni vicino alla Luna.
            Anche la TLI è diversa: nell'esercizio parte da un'orbita circolare bassa con lo stadio superiore (come
            nelle missioni Apollo). Nella missione reale l'ICPS ha portato Orion sull'orbita alta (HEO) e la TLI l'ha
            eseguita il motore del modulo di servizio di Orion, con un'accensione di circa 6 minuti: partendo dall'HEO
            serve un Δv molto più piccolo.
          </RealityNote>
        </div>
      </section>

      <!-- Sezione 4: altri risultati -->
      <section class="fp-section">
        <div class="mc-label">Sezione 4</div>
        <h2 class="fp-h2 mb-3">Altri risultati calcolati</h2>
        <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          <div class="mc-card">
            <div class="mc-label mb-1">Fase 1 · semiasse maggiore HEO</div>
            <div class="mc-data text-xl">{isNum(calc.semiMajorAxis) ? `${fmt(calc.semiMajorAxis / 1000)} km` : "—"}</div>
          </div>
          <div class="mc-card">
            <div class="mc-label mb-1">Fase 1 · periodo orbitale HEO</div>
            <div class="mc-data text-xl">{isNum(calc.orbitalPeriod) ? `${fmt(calc.orbitalPeriod / 3600, 1)} h` : "—"}</div>
            {#if isNum(calc.orbitalPeriod)}<div class="text-sm text-muted">{fmt(calc.orbitalPeriod)} s</div>{/if}
          </div>
          <div class="mc-card">
            <div class="mc-label mb-1">Fase 6 · angolo di rientro</div>
            <div class="mc-data text-xl">{isNum(calc.reentryAngle) ? `${fmt(calc.reentryAngle, 1)}°` : "—"}</div>
          </div>
          <div class="mc-card">
            <div class="mc-label mb-1">Fase 6 · quota apertura drogue</div>
            <div class="mc-data text-xl">{isNum(calc.parachuteDrogueAltitude) ? `${fmt(calc.parachuteDrogueAltitude)} m` : "—"}</div>
          </div>
          <div class="mc-card">
            <div class="mc-label mb-1">Fase 6 · area paracadute principali</div>
            <div class="mc-data text-xl">{isNum(calc.parachuteArea) ? `${fmt(calc.parachuteArea)} m²` : "—"}</div>
          </div>
        </div>
      </section>

      <!-- Spazio per il docente (solo stampa) -->
      <section class="fp-section hidden print:block">
        <h2 class="fp-h2 mb-2">Osservazioni del docente</h2>
        <div class="fp-teacher-box"></div>
      </section>

      <footer class="flex flex-wrap justify-end gap-2 border-t border-line pt-4 print:hidden">
        <button type="button" class="mc-btn mc-btn-fail !py-2 !px-4" onclick={() => (confirmAction = "quit")}>
          Chiudi applicazione
        </button>
      </footer>
    </article>
  </div>

  {#if confirmAction}
    <div class="fixed inset-0 z-[110] bg-space-black/85 flex items-center justify-center p-4 print:hidden" role="dialog" aria-modal="true" aria-labelledby="fp-confirm-title">
      <div class="mc-panel mc-enter w-full max-w-md p-6">
        <h3 id="fp-confirm-title" class="text-xl font-bold text-white mb-3">
          {confirmAction === "restart" ? "Iniziare una nuova missione?" : "Chiudere l'applicazione?"}
        </h3>
        <p class="text-sm text-muted mb-6 leading-relaxed">
          {confirmAction === "restart"
            ? "Tutti i calcoli della missione corrente verranno azzerati e si ripartirà dalla Fase 1. Se ti serve, stampa prima il Flight Plan."
            : "Stai per chiudere l'applicazione. Se ti serve, stampa prima il Flight Plan."}
        </p>
        <div class="flex gap-3 justify-end">
          <button type="button" class="mc-btn mc-btn-ghost" onclick={() => (confirmAction = null)}>Annulla</button>
          <button type="button" class="mc-btn {confirmAction === 'restart' ? 'mc-btn-go' : 'mc-btn-fail'}" onclick={handleConfirm}>
            {confirmAction === "restart" ? "Sì, ricomincia" : "Sì, chiudi"}
          </button>
        </div>
      </div>
    </div>
  {/if}
</div>

<style>
  /* Colori dello schema (schermo: tema scuro Mission Control) */
  .fp-root {
    --fp-out: var(--color-orion-orange);
    --fp-ret: var(--color-ok);
    --fp-orbit: var(--color-muted);
    --fp-earth: #1d4f9a;
    --fp-earth-stroke: var(--color-signal);
    --fp-moon: #8b93a3;
    --fp-node: var(--color-warn);
    --fp-node-stroke: #fff;
    --fp-text: var(--color-lunar-gray);
    --fp-text-muted: var(--color-muted);
    --fp-earth-text: #fff;
  }

  .fp-paper {
    max-height: calc(100vh - 2rem);
  }

  .fp-h2 {
    font-size: 1.2rem;
    font-weight: 800;
    color: #fff;
  }

  .fp-table {
    border-collapse: collapse;
  }
  .fp-table th {
    font-family: var(--font-mono);
    font-size: 0.72rem;
    letter-spacing: 0.1em;
    text-transform: uppercase;
    color: var(--color-signal);
    padding: 0.6rem 0.75rem;
    border-bottom: 1px solid var(--color-line);
    background: var(--color-panel-2);
    white-space: nowrap;
  }
  .fp-table td {
    padding: 0.6rem 0.75rem;
    border-bottom: 1px solid var(--color-line);
    vertical-align: top;
  }
  .fp-table tfoot td {
    background: color-mix(in srgb, var(--color-nasa-blue) 10%, transparent);
  }

  /* Elementi SVG */
  .fp-orbit {
    fill: none;
    stroke: var(--fp-orbit);
    stroke-width: 1.5;
    stroke-dasharray: 5 5;
  }
  .fp-orbit-moon {
    fill: none;
    stroke: var(--fp-orbit);
    stroke-width: 1.5;
  }
  .fp-earth {
    fill: var(--fp-earth);
    stroke: var(--fp-earth-stroke);
    stroke-width: 1.5;
  }
  .fp-moon {
    fill: var(--fp-moon);
    stroke: var(--fp-text-muted);
    stroke-width: 1;
  }
  .fp-path-out {
    fill: none;
    stroke: var(--fp-out);
    stroke-width: 3;
  }
  .fp-path-ret {
    fill: none;
    stroke: var(--fp-ret);
    stroke-width: 3;
    stroke-dasharray: 12 6;
  }
  .fp-fill-out {
    fill: var(--fp-out);
  }
  .fp-fill-ret {
    fill: var(--fp-ret);
  }
  .fp-node {
    fill: var(--fp-node);
    stroke: var(--fp-node-stroke);
    stroke-width: 2;
  }
  .fp-svg-label {
    font-family: var(--font-mono);
    font-size: 17px;
    font-weight: 700;
    fill: var(--fp-text);
  }
  .fp-svg-small {
    font-family: var(--font-sans);
    font-size: 14px;
    fill: var(--fp-text-muted);
  }
  .fp-svg-body {
    font-family: var(--font-sans);
    font-size: 13px;
    font-weight: 700;
    fill: var(--fp-earth-text);
  }

  /* ------------------------- Stampa (A4, tema chiaro) ------------------------- */
  @media print {
    @page {
      size: A4;
      margin: 14mm;
    }

    /* Il report è figlio diretto di <body>: tutto il resto dell'app sparisce */
    :global(body > *:not(.fp-root)) {
      display: none !important;
    }
    :global(html),
    :global(body) {
      height: auto !important;
      overflow: visible !important;
      background: #fff !important;
      color: #000 !important;
      color-scheme: light;
      font-size: 11pt !important;
    }

    .fp-root {
      position: static !important;
      display: block !important;
      padding: 0 !important;
      background: #fff !important;
      --fp-out: #000;
      --fp-ret: #444;
      --fp-orbit: #777;
      --fp-earth: #dfe7f3;
      --fp-earth-stroke: #000;
      --fp-moon: #d4d4d4;
      --fp-node: #fff;
      --fp-node-stroke: #000;
      --fp-text: #000;
      --fp-text-muted: #333;
      --fp-earth-text: #000;
    }
    .fp-root :global(*) {
      color: #000 !important;
      background-color: transparent !important;
      box-shadow: none !important;
      text-shadow: none !important;
      animation: none !important;
    }
    .fp-root :global(.border-line),
    .fp-root :global(.mc-card),
    .fp-root :global(aside),
    .fp-note,
    .fp-meter {
      border-color: #999 !important;
    }
    .fp-paper {
      max-height: none !important;
      overflow: visible !important;
      border: none !important;
      border-radius: 0 !important;
      max-width: none !important;
    }
    .fp-paper::before {
      display: none !important;
    }
    .fp-body {
      padding: 0 !important;
    }
    .fp-h2,
    .fp-root :global(.mc-title) {
      color: #000 !important;
    }
    .fp-root :global(.mc-title) {
      font-size: 1.5rem;
    }
    .fp-root :global(.mc-label) {
      color: #333 !important;
    }
    .fp-root :global(.text-ok) {
      color: #000 !important;
    }
    .fp-root :global(.text-fail) {
      color: #000 !important;
      text-decoration: underline;
    }
    .fp-meter > div {
      background-color: #555 !important;
      print-color-adjust: exact;
      -webkit-print-color-adjust: exact;
    }
    .fp-print-field {
      border-bottom: 1px solid #000;
      padding: 0.2rem 0;
      font-size: 1.05rem;
    }
    .fp-table th,
    .fp-table td {
      border: 1px solid #999 !important;
      padding: 0.35rem 0.5rem;
    }
    .fp-table th {
      color: #000 !important;
      background: #eee !important;
      print-color-adjust: exact;
      -webkit-print-color-adjust: exact;
    }
    .fp-table tfoot td {
      font-weight: 700;
    }
    .fp-table,
    .fp-table tr,
    .fp-chart,
    .fp-root :global(.mc-card),
    .fp-root :global(aside),
    .fp-note {
      break-inside: avoid;
      page-break-inside: avoid;
    }
    .fp-section {
      break-inside: avoid-page;
    }
    .fp-h2 {
      break-after: avoid;
      page-break-after: avoid;
    }
    .fp-chart svg {
      max-height: 85mm;
    }
    .fp-chart,
    .fp-chart svg,
    .fp-legend svg {
      print-color-adjust: exact;
      -webkit-print-color-adjust: exact;
    }
    .fp-teacher-box {
      height: 35mm;
      border: 1px solid #999;
    }
  }
</style>
