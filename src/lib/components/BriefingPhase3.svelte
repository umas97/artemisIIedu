<script>
  import { math } from '../actions/math.js';
  import PanelHeader from './ui/PanelHeader.svelte';
  import TeacherBox from './ui/TeacherBox.svelte';
  import RealityNote from './ui/RealityNote.svelte';
  import { EARTH, MOON, HEO } from '../physics/constants.js';

  let { onStartAnalysis } = $props();

  const fmt = (v, d = 0) => v.toLocaleString('it-IT', { minimumFractionDigits: d, maximumFractionDigits: d });

  const rp = EARTH.R + HEO.hp;
  const ra = MOON.distance;
  const a = (rp + ra) / 2;
  const vCirc = Math.sqrt(EARTH.GM / rp);
  const vP = Math.sqrt(EARTH.GM * (2 / rp - 1 / a));
  const soiKm = fmt(MOON.soiRadius / 1000, 0);
  // Variazione dell'apogeo per 1 m/s di Δv in più (attorno alla soluzione)
  const apogeeFor = (v) => {
    const e = (rp * v * v) / EARTH.GM - 1;
    return (rp * (1 + e)) / (1 - e);
  };
  const kmPerMs = (apogeeFor(vP + 0.5) - apogeeFor(vP - 0.5)) / 1000;
</script>

<div class="mc-panel w-full max-w-5xl p-6 md:p-8">
  <PanelHeader step={3} kicker="Briefing · Iniezione Trans-Lunare (TLI)" title="Il salto verso la Luna" />

  <div class="space-y-5 text-base leading-relaxed">
    <p>
      Comandante, Orion è in un'orbita circolare di parcheggio a {fmt(HEO.hp / 1000)} km di quota. Ora serve la manovra più
      energetica del viaggio: un'accensione che allunghi l'orbita fino a raggiungere la distanza della Luna. È la
      <strong class="text-white">Trans-Lunar Injection</strong> (TLI).
    </p>

    <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
      <div class="mc-card space-y-2">
        <div class="mc-label">Il problema</div>
        <p class="text-sm">
          In orbita circolare la velocità è proprio quella giusta per restare sempre alla stessa distanza dalla Terra. Se nel punto
          in cui ci troviamo acceleriamo nella direzione del moto, l'orbita diventa un'<strong class="text-white">ellisse</strong>:
          il punto dell'accensione resta il punto più vicino alla Terra (<strong class="text-white">perigeo</strong>), mentre il punto
          opposto (<strong class="text-white">apogeo</strong>) si allontana. Più acceleriamo, più l'apogeo è lontano.
        </p>
        <p class="text-sm">
          Se acceleriamo troppo poco, l'apogeo non arriva alla Luna e Orion ricade verso la Terra. Se acceleriamo troppo, Orion
          attraversa l'orbita della Luna prima del punto d'incontro e la manca; con un'accelerazione molto grande supererebbe
          addirittura la velocità di fuga dalla Terra.
        </p>
      </div>

      <div class="mc-card space-y-2">
        <div class="mc-label">Domande guida</div>
        <ul class="text-sm list-disc pl-5 space-y-2">
          <li>A quale distanza dal centro della Terra deve trovarsi l'apogeo?</li>
          <li>Quanto vale il semiasse maggiore <span use:math={{ expression: 'a' }}></span> di un'ellisse con perigeo e apogeo noti?</li>
          <li>Quale velocità serve al perigeo di questa ellisse? Di quanto è maggiore della velocità attuale?</li>
        </ul>
      </div>
    </div>

    <div class="mc-card space-y-3">
      <div class="mc-label">Strumenti di analisi</div>
      <p class="text-sm">
        L'ellisse di trasferimento ha il perigeo alla nostra distanza attuale dal centro della Terra
        (<span use:math={{ expression: 'r_p = R_T + h' }}></span>) e l'apogeo alla distanza della Luna
        (<span use:math={{ expression: 'r_a' }}></span>). La sua lunghezza è <span use:math={{ expression: '2a = r_p + r_a' }}></span>.
        L'equazione <strong class="text-white">vis-viva</strong>, che deriva dalla conservazione dell'energia, dà la velocità in un
        punto qualsiasi dell'orbita a distanza <span use:math={{ expression: 'r' }}></span> dal centro della Terra:
      </p>
      <div class="flex justify-center text-white" use:math={{ expression: 'v = \\sqrt{GM \\left( \\frac{2}{r} - \\frac{1}{a} \\right)}', displayMode: true }}></div>
      <p class="text-sm text-muted">
        Per un'orbita circolare <span use:math={{ expression: 'a = r' }}></span> e la formula diventa
        <span use:math={{ expression: 'v_{circ} = \\sqrt{GM/r}' }}></span>. Il Δv della TLI è la differenza tra la velocità al
        perigeo dell'ellisse e la velocità circolare attuale.
      </p>
    </div>

    <div class="mc-card text-sm space-y-2">
      <div class="mc-label">Il nostro modello semplificato</div>
      <p>
        Consideriamo solo la gravità della Terra e un'accensione istantanea. La Luna è ferma nel punto in cui arriverebbe l'apogeo
        dell'ellisse ideale: l'istante dell'accensione è già deciso, quindi l'esito dipende solo dal Δv che calcoli.
      </p>
      <p>
        Il bersaglio è la <strong class="text-white">sfera d'influenza lunare</strong>: la regione attorno alla Luna (raggio di circa
        {soiKm} km) in cui, per il moto della navicella, la gravità della Luna conta più di quella della Terra. Se Orion ci entra,
        da lì in poi è la Luna a "guidarla" e nella fase successiva potrà frenare per entrare in orbita lunare. Il raggio si stima con
        <span use:math={{ expression: 'r_{SOI} = D\,(M_{Luna}/M_{Terra})^{2/5}' }}></span>.
      </p>
      <p>
        Attenzione: vicino a questa velocità l'apogeo è sensibilissimo. Ogni m/s in più o in meno di Δv sposta l'apogeo di circa
        {fmt(Math.round(kmPerMs / 100) * 100)} km! Per questo le missioni reali eseguono piccole
        <strong class="text-white">correzioni di rotta</strong> durante il viaggio verso la Luna.
      </p>
    </div>

    <RealityNote>
      Qui partiamo da un'orbita circolare bassa, come facevano le missioni Apollo. Artemis II ha fatto diversamente: lo stadio
      superiore ICPS ha portato Orion nell'orbita terrestre alta e molto ellittica della fase 1 (apogeo a circa 70.000 km). Dopo
      circa 25 ore Orion si è separata e il motore del suo modulo di servizio europeo ha acceso per circa 6 minuti al perigeo,
      eseguendo la TLI. Partendo da un'orbita così allungata serve un Δv molto più piccolo (qualche centinaio di m/s), perché
      gran parte dell'energia era già stata fornita dall'ICPS.
    </RealityNote>

    <TeacherBox>
      <div class="space-y-1 text-lunar-gray">
        <div>
          r<sub>p</sub> = {fmt(rp / 1000)} km · a = {fmt(a / 1000, 1)} km · v<sub>circ</sub> ≈ {fmt(vCirc)} m/s · v<sub>p</sub> ≈
          {fmt(vP)} m/s
        </div>
        <div>Δv ≈ <span class="mc-data font-bold">{fmt(vP - vCirc)} m/s</span></div>
        <div class="text-xs text-muted">
          La simulazione riesce (Orion entra nella sfera d'influenza, r<sub>SOI</sub> ≈ {soiKm} km) con Δv tra circa 3.117 e
          3.175 m/s. Sensibilità: ≈ {fmt(kmPerMs)} km di apogeo per ogni m/s.
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
