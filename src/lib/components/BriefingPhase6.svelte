<script>
  import katex from "katex";
  import "katex/dist/katex.min.css";
  export let onStartAnalysis;
</script>

<div
  class="max-w-5xl text-white p-6 bg-black/80 backdrop-blur-md rounded-2xl border border-nasa-blue/40 shadow-2xl relative overflow-hidden"
>
  <!-- Sfondo animato -->
  <div class="absolute inset-0 opacity-20 pointer-events-none">
    <div
      class="absolute top-0 right-0 w-96 h-96 bg-red-600/30 rounded-full blur-3xl animate-pulse mix-blend-screen"
    ></div>
    <div
      class="absolute bottom-0 left-0 w-96 h-96 bg-nasa-blue/30 rounded-full blur-3xl animate-pulse mix-blend-screen"
      style="animation-delay: 2s;"
    ></div>
  </div>

  <!-- Header -->
  <div
    class="flex items-center gap-4 mb-8 border-b border-white/10 pb-6 relative z-10"
  >
    <div
      class="bg-nasa-blue p-3 rounded-xl shadow-[0_0_20px_rgba(11,61,145,0.5)]"
    >
      <svg
        class="w-8 h-8 text-white"
        fill="none"
        viewBox="0 0 24 24"
        stroke="currentColor"
      >
        <path
          stroke-linecap="round"
          stroke-linejoin="round"
          stroke-width="1.5"
          d="M12 2L3 10l3 12h12l3-12-9-8z"
        />
        <path
          stroke-linecap="round"
          stroke-linejoin="round"
          stroke-width="1.5"
          d="M12 2v20"
        />
      </svg>
    </div>
    <div>
      <h2
        class="text-3xl font-black tracking-tight text-transparent bg-clip-text bg-gradient-to-r from-white to-gray-400"
      >
        FASE 6: RIENTRO E AMMARAGGIO
      </h2>
      <p
        class="text-nasa-blue font-mono text-sm tracking-widest uppercase mt-1"
      >
        Analisi Dati Fisici di Rientro
      </p>
    </div>
  </div>

  <div class="space-y-4 text-gray-300 leading-relaxed text-base relative z-10">
    <p>
      Bentornato, Comandante. Il viaggio spaziale è quasi concluso, ma stiamo
      per affrontare la fase più critica: il <strong
        >rientro in atmosfera terrestre</strong
      >. La navicella Orion viaggia a una velocità di
      <strong>11000 m/s</strong>. Tutta la sua incredibile Energia Cinetica ({@html katex.renderToString(
        "E_k = \\frac{1}{2}mv^2",
        { throwOnError: false },
      )}) deve essere smaltita sotto forma di calore tramite l'attrito
      atmosferico.
    </p>

    <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
      <!-- Colonna Sinistra -->
      <div class="flex flex-col">
        <!-- Deduzione Angolo -->
        <div
          class="bg-red-900/20 border border-red-500/30 p-4 rounded-xl shadow-inner h-full"
        >
          <h3
            class="text-lg font-bold text-red-400 flex items-center gap-2 mb-2"
          >
            <svg
              class="w-5 h-5"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              ><path
                stroke-linecap="round"
                stroke-linejoin="round"
                stroke-width="2"
                d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"
              /></svg
            >
            1. Il Corridoio di Rientro: Analisi Dati NASA
          </h3>
          <p class="text-sm mb-3">
            Non possiamo inserire un angolo a caso. Troppo piatto e rimbalzeremo
            nello spazio (Skip-off). Troppo ripido e bruceremo (Burn-up).
            Analizza i dati degli stress test della NASA, individua i casi di
            successo e <strong>calcolane la media</strong> per trovare l'angolo di
            rientro ottimale:
          </p>

          <div class="overflow-x-auto">
            <table
              class="min-w-full bg-black/40 text-sm border border-white/10 rounded-lg"
            >
              <thead>
                <tr class="bg-white/5">
                  <th class="py-2 px-3 text-left border-b border-white/10"
                    >Test</th
                  >
                  <th class="py-2 px-3 text-left border-b border-white/10"
                    >Angolo</th
                  >
                  <th class="py-2 px-3 text-left border-b border-white/10"
                    >G-Force (Max 8G)</th
                  >
                  <th class="py-2 px-3 text-left border-b border-white/10"
                    >Temp (Max 2800°C)</th
                  >
                  <th class="py-2 px-3 text-left border-b border-white/10"
                    >Esito</th
                  >
                </tr>
              </thead>
              <tbody>
                <tr class="bg-white/5"
                  ><td class="py-2 px-3 border-b border-white/5">Sim-1</td><td
                    class="py-2 px-3 border-b border-white/5">-4,5°</td
                  ><td class="py-2 px-3 border-b border-white/5 text-green-400"
                    >1,5 G</td
                  ><td class="py-2 px-3 border-b border-white/5 text-green-400"
                    >1400 °C</td
                  ><td
                    class="py-2 px-3 border-b border-white/5 font-bold text-red-400"
                    >Skip-off</td
                  ></tr
                >
                <tr
                  ><td class="py-2 px-3 border-b border-white/5">Sim-2</td><td
                    class="py-2 px-3 border-b border-white/5">-5,0°</td
                  ><td class="py-2 px-3 border-b border-white/5 text-green-400"
                    >2,5 G</td
                  ><td class="py-2 px-3 border-b border-white/5 text-green-400"
                    >1800 °C</td
                  ><td
                    class="py-2 px-3 border-b border-white/5 font-bold text-red-400"
                    >Skip-off</td
                  ></tr
                >
                <tr class="bg-white/5"
                  ><td class="py-2 px-3 border-b border-white/5">Sim-3</td><td
                    class="py-2 px-3 border-b border-white/5">-5,5°</td
                  ><td class="py-2 px-3 border-b border-white/5 text-green-400"
                    >3,2 G</td
                  ><td class="py-2 px-3 border-b border-white/5 text-green-400"
                    >2100 °C</td
                  ><td
                    class="py-2 px-3 border-b border-white/5 font-bold text-red-400"
                    >Skip-off</td
                  ></tr
                >
                <tr
                  ><td class="py-2 px-3 border-b border-white/5">Sim-4</td><td
                    class="py-2 px-3 border-b border-white/5">-6,0°</td
                  ><td class="py-2 px-3 border-b border-white/5 text-yellow-400"
                    >4,5 G</td
                  ><td class="py-2 px-3 border-b border-white/5 text-yellow-400"
                    >2350 °C</td
                  ><td
                    class="py-2 px-3 border-b border-white/5 font-bold text-green-400"
                    >Successo</td
                  ></tr
                >
                <tr class="bg-white/5"
                  ><td class="py-2 px-3 border-b border-white/5">Sim-5</td><td
                    class="py-2 px-3 border-b border-white/5">-6,5°</td
                  ><td class="py-2 px-3 border-b border-white/5 text-yellow-400"
                    >5,5 G</td
                  ><td class="py-2 px-3 border-b border-white/5 text-yellow-400"
                    >2500 °C</td
                  ><td
                    class="py-2 px-3 border-b border-white/5 font-bold text-green-400"
                    >Successo</td
                  ></tr
                >
                <tr
                  ><td class="py-2 px-3 border-b border-white/5">Sim-6</td><td
                    class="py-2 px-3 border-b border-white/5">-7,0°</td
                  ><td class="py-2 px-3 border-b border-white/5 text-yellow-400"
                    >7,5 G</td
                  ><td class="py-2 px-3 border-b border-white/5 text-yellow-400"
                    >2750 °C</td
                  ><td
                    class="py-2 px-3 border-b border-white/5 font-bold text-green-400"
                    >Successo</td
                  ></tr
                >
                <tr class="bg-white/5"
                  ><td class="py-2 px-3 border-b border-white/5">Sim-7</td><td
                    class="py-2 px-3 border-b border-white/5">-7,5°</td
                  ><td class="py-2 px-3 border-b border-white/5 text-red-400"
                    >10,2 G</td
                  ><td class="py-2 px-3 border-b border-white/5 text-red-400"
                    >3150 °C</td
                  ><td
                    class="py-2 px-3 border-b border-white/5 font-bold text-red-400"
                    >Burn-up</td
                  ></tr
                >
                <tr
                  ><td class="py-2 px-3 border-b border-white/5">Sim-8</td><td
                    class="py-2 px-3 border-b border-white/5">-8,0°</td
                  ><td class="py-2 px-3 border-b border-white/5 text-red-400"
                    >15,0 G</td
                  ><td class="py-2 px-3 border-b border-white/5 text-red-400"
                    >4200 °C</td
                  ><td
                    class="py-2 px-3 border-b border-white/5 font-bold text-red-400"
                    >Burn-up</td
                  ></tr
                >
              </tbody>
            </table>
          </div>
        </div>
      </div>

      <!-- Colonna Destra -->
      <div class="flex flex-col space-y-4">
        <!-- Cinematica Drogue -->
        <div
          class="bg-gray-800/50 border border-gray-600/30 p-4 rounded-xl shadow-inner"
        >
          <h3 class="text-lg font-bold text-white flex items-center gap-2 mb-2">
            <svg
              class="w-5 h-5"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              ><path
                stroke-linecap="round"
                stroke-linejoin="round"
                stroke-width="2"
                d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
              /></svg
            >
            2. Altitudine Paracadute Freno (Cinematica)
          </h3>
          <p class="text-sm">
            A un'altitudine di 10000 metri, la capsula ha decelerato fino a una
            velocità costante di {@html katex.renderToString(
              "v = 150 \\text{ m/s}",
              { throwOnError: false },
            )}. Per motivi di stabilità atmosferica, l'apertura dei paracadute
            di frenata (Drogue Chutes) deve avvenire esattamente
            <strong>20 secondi</strong> dopo aver passato questa quota. Calcola a
            quale altitudine avverrà l'apertura.
          </p>
        </div>

        <!-- Forza Attrito Viscoso -->
        <div
          class="bg-nasa-blue/10 border border-nasa-blue/30 p-4 rounded-xl shadow-inner"
        >
          <h3
            class="text-lg font-bold text-nasa-blue flex items-center gap-2 mb-2"
          >
            <svg
              class="w-5 h-5"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              ><path
                stroke-linecap="round"
                stroke-linejoin="round"
                stroke-width="2"
                d="M19 14l-7 7m0 0l-7-7m7 7V3"
              /></svg
            >
            3. Dimensionamento Paracadute (Dinamica)
          </h3>
          <p class="text-sm mb-3">
            Per un ammaraggio sicuro, la velocità finale deve essere <strong
              >{@html katex.renderToString("v = 10 \\text{ m/s}", {
                throwOnError: false,
              })}</strong
            >. Alla velocità terminale, la forza di gravità uguaglia la forza di
            resistenza aerodinamica ({@html katex.renderToString(
              "m \\cdot g = F_{\\text{drag}}",
              { throwOnError: false },
            )}). La formula della resistenza aerodinamica è:
          </p>
          <div
            class="bg-black/50 p-3 rounded text-center text-xl text-white mb-3 flex justify-center"
          >
            {@html katex.renderToString(
              "F_{\\text{drag}} = \\frac{1}{2} \\cdot \\rho \\cdot v^2 \\cdot C_d \\cdot A",
              { throwOnError: false, displayMode: true },
            )}
          </div>
          <p class="text-sm">
            Inverti la formula per trovare l'Area ({@html katex.renderToString(
              "A",
              { throwOnError: false },
            )}) necessaria ai paracadute principali. Ecco i dati:
          </p>
          <ul class="list-disc pl-5 text-sm space-y-1 mt-2 text-gray-300">
            <li>
              Massa Orion ({@html katex.renderToString("m", {
                throwOnError: false,
              })}): 10400 kg
            </li>
            <li>
              Accelerazione di gravità ({@html katex.renderToString("g", {
                throwOnError: false,
              })}): 9,81 m/s²
            </li>
            <li>
              Densità dell'aria ({@html katex.renderToString("\\rho", {
                throwOnError: false,
              })}): 1,225 kg/m³
            </li>
            <li>
              Coefficiente di forma paracadute ({@html katex.renderToString(
                "C_d",
                { throwOnError: false },
              )}): 2,0
            </li>
          </ul>
        </div>
      </div>
    </div>

    <!-- Bottone di inizio -->
    <div class="mt-6 flex justify-center">
      <button
        onclick={onStartAnalysis}
        class="group relative px-8 py-4 bg-nasa-blue text-white font-bold rounded-xl overflow-hidden transition-all hover:scale-105 hover:shadow-[0_0_30px_rgba(11,61,145,0.6)] focus:outline-none focus:ring-2 focus:ring-white/50"
      >
        <span
          class="relative z-10 flex items-center gap-2 text-lg tracking-wider"
        >
          VAI AL PANNELLO DI CALCOLO
          <svg
            class="w-5 h-5 group-hover:translate-x-1 transition-transform"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            ><path
              stroke-linecap="round"
              stroke-linejoin="round"
              stroke-width="2"
              d="M13 7l5 5m0 0l-5 5m5-5H6"
            /></svg
          >
        </span>
        <div
          class="absolute inset-0 bg-gradient-to-r from-blue-600 to-nasa-blue opacity-0 group-hover:opacity-100 transition-opacity"
        ></div>
      </button>
    </div>
  </div>
</div>
