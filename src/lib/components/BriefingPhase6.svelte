<script>
  import { math } from '../actions/math.js';
  import PanelHeader from './ui/PanelHeader.svelte';

  let { onStartAnalysis } = $props();

  // Risultati del simulatore di rientro (stessi valori della scena ReentryScene):
  // entrata a 120 km di quota e 11 km/s.
  const tests = [
    { id: 'Sim-1', angle: '−5,0°', g: '1,6 g', temp: '2.170 °C', result: 'skip' },
    { id: 'Sim-2', angle: '−5,5°', g: '2,8 g', temp: '2.320 °C', result: 'skip' },
    { id: 'Sim-3', angle: '−6,0°', g: '4,2 g', temp: '2.430 °C', result: 'ok' },
    { id: 'Sim-4', angle: '−6,5°', g: '5,9 g', temp: '2.520 °C', result: 'ok' },
    { id: 'Sim-5', angle: '−7,0°', g: '7,8 g', temp: '2.590 °C', result: 'ok' },
    { id: 'Sim-6', angle: '−7,5°', g: '9,8 g', temp: '2.650 °C', result: 'steep' },
    { id: 'Sim-7', angle: '−8,0°', g: '11,9 g', temp: '2.700 °C', result: 'steep' },
  ];
  const resultLabel = { skip: 'Rimbalzo (skip-off)', ok: 'Successo', steep: 'Troppo ripido' };
  const resultClass = { skip: 'text-fail', ok: 'text-ok', steep: 'text-fail' };
</script>

<div class="mc-panel mc-enter w-full max-w-5xl p-6 md:p-8">
  <PanelHeader step={6} kicker="Briefing · Rientro e ammaraggio" title="Discesa finale" />

  <div class="grid gap-5 md:grid-cols-2">
    <!-- Colonna sinistra: angolo di rientro -->
    <div class="space-y-4">
      <p class="text-sm leading-relaxed">
        Orion arriva sull'atmosfera a circa <strong class="text-white">11.000 m/s</strong>. Tutta la sua energia cinetica
        (<span use:math={{ expression: 'E_k = \\tfrac{1}{2} m v^2' }}></span>, oltre 600 miliardi di joule) va smaltita: l'aria
        davanti allo scudo termico viene compressa e si scalda fino a diventare plasma, mentre la resistenza
        aerodinamica frena la capsula.
      </p>

      <section class="mc-card !p-4">
        <h3 class="mc-label mb-2">1 · Il corridoio di rientro</h3>
        <p class="text-sm leading-relaxed mb-3">
          Troppo radente e la capsula rimbalza fuori dall'atmosfera (skip-off); troppo ripida e la decelerazione supera
          il limite di <strong class="text-white">8 g</strong> per l'equipaggio (1 g = 9,81 m/s²). Individua i test
          riusciti e <strong class="text-white">calcolane la media</strong>: è l'angolo di rientro da usare.
        </p>
        <div class="overflow-x-auto">
          <table class="w-full text-sm font-mono">
            <thead>
              <tr class="text-left text-xs text-muted uppercase">
                <th class="py-1 pr-2 font-semibold">Test</th>
                <th class="py-1 pr-2 font-semibold">Angolo</th>
                <th class="py-1 pr-2 font-semibold">Decel. max</th>
                <th class="py-1 pr-2 font-semibold">Temp. scudo</th>
                <th class="py-1 font-semibold">Esito</th>
              </tr>
            </thead>
            <tbody>
              {#each tests as t (t.id)}
                <tr class="border-t border-line">
                  <td class="py-1 pr-2 text-muted">{t.id}</td>
                  <td class="py-1 pr-2 text-white">{t.angle}</td>
                  <td class="py-1 pr-2" class:text-fail={t.result === 'steep'}>{t.g}</td>
                  <td class="py-1 pr-2">{t.temp}</td>
                  <td class="py-1 font-sans font-semibold {resultClass[t.result]}">{resultLabel[t.result]}</td>
                </tr>
              {/each}
            </tbody>
          </table>
        </div>
      </section>
    </div>

    <!-- Colonna destra: paracadute -->
    <div class="space-y-4">
      <section class="mc-card !p-4">
        <h3 class="mc-label mb-2">2 · Paracadute freno (cinematica)</h3>
        <p class="text-sm leading-relaxed">
          A <strong class="text-white">10.000 m</strong> di quota la capsula ha perso quasi tutta la velocità e scende
          (supponiamo in verticale) a velocità costante <span use:math={{ expression: 'v = 150\\ \\text{m/s}' }}></span>:
          è un moto rettilineo uniforme. I paracadute freno (drogue) devono aprirsi
          <strong class="text-white">20 secondi</strong> dopo il passaggio a quella quota. A quale altitudine si aprono?
        </p>
      </section>

      <section class="mc-card !p-4">
        <h3 class="mc-label mb-2">3 · Paracadute principali (dinamica)</h3>
        <p class="text-sm leading-relaxed mb-2">
          I paracadute principali si aprono a 3.000 m. Per un ammaraggio sicuro la velocità finale deve essere
          <span use:math={{ expression: 'v = 10\\ \\text{m/s}' }}></span>. A questa velocità costante (velocità limite) il
          peso è bilanciato dalla resistenza aerodinamica:
        </p>
        <div class="text-center my-2" use:math={{ expression: 'm g = F_{res} = \\tfrac{1}{2}\\, \\rho\\, v^2\\, C_d\\, A', displayMode: true }}></div>
        <p class="text-sm leading-relaxed mb-2">Ricava dalla formula inversa l'area <span use:math={{ expression: 'A' }}></span> dei paracadute.</p>
        <dl class="grid grid-cols-2 gap-x-4 gap-y-1 text-sm">
          <dt class="text-muted">Massa di Orion (<span use:math={{ expression: 'm' }}></span>)</dt>
          <dd class="mc-data text-right">10.400 kg</dd>
          <dt class="text-muted">Gravità (<span use:math={{ expression: 'g' }}></span>)</dt>
          <dd class="mc-data text-right">9,81 m/s²</dd>
          <dt class="text-muted">Densità dell'aria (<span use:math={{ expression: '\\rho' }}></span>)</dt>
          <dd class="mc-data text-right">1,225 kg/m³</dd>
          <dt class="text-muted">Coeff. di resistenza (<span use:math={{ expression: 'C_d' }}></span>)</dt>
          <dd class="mc-data text-right">2,0</dd>
        </dl>
      </section>
    </div>
  </div>

  <div class="flex justify-end mt-5">
    <button type="button" class="mc-btn mc-btn-primary" onclick={onStartAnalysis}>
      Apri il terminale di calcolo
      <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2.5"><path stroke-linecap="round" stroke-linejoin="round" d="M13 7l5 5m0 0l-5 5m5-5H6" /></svg>
    </button>
  </div>
</div>
