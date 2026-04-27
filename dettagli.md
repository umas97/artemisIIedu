# Progetto didattico: simulazione di lancio di un razzo diretto sulla Luna

## CONTESTO:

Vorrei creare una web app, facilmente distribuibile alle classi di seconda superiore in cui insegno Fisica. Questa web app deve spiegare interattivamente (con un sistema di gamification) il processo di calcolo, progettazione ed esecuzione di un lancio spaziale di una navicella diretta sulla Luna (prendiamo come esempio reale Artemis II). Quindi gestiamo i calcoli perchè siano adatti alle conoscenze di quella fascia d'età.

## DETTAGLI DI IMPLEMENTAZIONE:

Vorrei quindi gestire il tutto tramite missioni, ognuna incentrata su una fase della preparazione, del lancio e del volo. Ecco lo schema:

1. Preparazione a Terra: calcoli per velocità orbitale terrestre, raggio dell'orbita attorno alla terra, raggio dell'orbita di trasferimento, uso delle leggi di Keplero per stimare i tempi
2. Lancio e messa in orbita terrestre della capsula, con calcolo dei nodi per il passaggio alla fase sucessiva
3. Passaggio al Trans Lunar Injection, con calcolo e l'aggiunta di piccole correzioni di traiettoria per permettere alla capsula di raggiungere la Luna
4. Intercettazione della Luna e orbitazione lunare
5. Manovre di rientro verso la Terra
6. Discesa e ammaraggio

Per ognuna di queste fasi deve essere presente:

- una prima parte teorica, in cui viene spiegato il problema e i metodi per risolverlo (non vogliamo dare già la soluzione pronta, ma dare gli strumenti perchè l'alunno construisca un processo per arrivare alla soluzione)
- la seconda parte invece deve essere puramente pratica (e qui entra in gioco la parte di gamification), ogni studente deve, attraverso il processo di ragionamento effettuato nella parte teorica, mettere in pratica con calcoli e test quanto ha imparato su quella fase del progetto

La simualzione poi deve avvenire tramite i calcoli effettuati dagli studenti, sia che questi portino ad una simulazione corretta, sia che questa non lo sia.

In ognuno di questi due casi deve essere presente alla fine della simualzione una parte di analisi delle procedure. L´app deve mettere in risalto i punti di forza e di fallimento della simulazione eseguita, permettendo all'allievo di analizzare i propri errori e correggerli per le simulazioni successive. Ti faccio un esempio: Cosa succede se l'accensione dura 2 secondi di troppo? Scenario A: La capsula manca la Luna e si disperde nello spazio profondo. Scenario B: La traiettoria è troppo ripida e l'impatto con la Luna è inevitabile (mancata cattura).

Al raggiungimento del termine della simulazione, procediamo con la parte in cui l'allievo deve produrre il "Flight Plan":
deve consegnare un documento tecnico che includa:

- Tabella dei Nodi di Manovra: tempio dell'accensione, durata della spinta (in secondi) e direzione.
- Consumo di Carburante: Calcolo della massa di propellente consumata basato sulla formula di Tsiolkovsky studiata nella fese 1.
- Grafico della Traiettoria: Uno screenshot o un grafico che mostri la traiettoria che la simulazione ha eseguito.

Se ti servono informazioni tecniche su Artemis II, procedi liberamente con una ricerca. Non fermarti ai dati che trovi su Wikipedia ma approfondisci fino a quando non ti senti sicuro di voler procedere. In questo modo sarai sicuro di fornirmi i dati corretti e coerenti per il progetto.
Inoltre trovi dettagli anche a questo link: https://www.nasa.gov/image-article/artemis-ii-map-2/
Anche a questo link: https://www.geopop.it/cosa-vedremo-con-artemis-ii-il-piano-di-volo-e-le-fasi-della-missione-lunare-nasa-con-equipaggio/
Per quanto riguarda il "Flight Plan", ti lascio questo link per capire cosa dovrebbe contenere: https://www.astronomy.com/space-exploration/how-artemis-2-will-fly-around-the-moon/

## SCOPO:

L'obiettivo non è replicare perfettamente i calcoli NASA (spesso troppo complessi o proprietari), ma creare un'esperienza di **apprendimento simulato**. L'app deve essere didattica e stimolante, non uno strumento di navigazione aerospaziale certificato.

## STRUTTURA TECNICA DA UTILIZZARE:

- Motore 2D: Phaser.js (integrato in Svelte).
- Frontend & UI: Svelte + Vite + Tailwind CSS.
- Gestione Stato: Svelte Stores (nativi).
- Backend & Dati: Supabase.
- Distribuzione: GitHub Actions + Tauri (per l'eseguibile)

Ecco i dettagli su come farli dialogare:

1. Il connubio Svelte + Phaser 2D
   Svelte e Phaser sono una coppia formidabile. La strategia migliore è questa: usa Phaser.js esclusivamente per la "finestra spaziale" (il canvas HTML5 dove la navicella Orion si muove, la fisica orbitale, le collisioni). Usa Svelte e Tailwind CSS per tutto l'HUD (Head-Up Display): menu, bottoni, indicatori di carburante, altimetro e telemetria.
   Svelte è così veloce ad aggiornare il DOM che puoi passargli i dati da Phaser in tempo reale (a 60 frame al secondo) senza alcun calo di prestazioni.

2. Svelte + Vite + Tailwind CSS (Niente Zustand)
   Visto che hai scelto Svelte, faccio un'ottimizzazione rispetto al mio consiglio precedente: dimentica librerie esterne per lo stato. Svelte ha gli stores (es. writable, derived) integrati nativamente. Sono leggerissimi e perfetti per tenere traccia del punteggio, dell'ossigeno o della fase di volo, condividendo questi dati istantaneamente tra l'interfaccia utente e il motore di gioco.

3. Backend: Supabase
   Confermo Supabase come scelta migliore. Essendo un Backend-as-a-Service, non devi gestire server. Offre un'API semplicissima da integrare in Svelte per:

Salvare i progressi degli studenti (anche in modo anonimo).

Creare una classifica globale (Leaderboard) delle missioni completate con meno consumo di carburante.

Archiviare i dati su un database PostgreSQL robusto.

4. Distribuzione via GitHub: L'Eseguibile "Zero Admin"
   Questa è la parte cruciale per le scuole. I computer dei laboratori bloccano le installazioni classiche. Hai due strade ottimali, entrambe gestibili da GitHub:

L'opzione Nativa (L'eseguibile .exe leggero): Tauri
Se vuoi fornire un vero file da scaricare, dimentica Electron (crea file enormi e avidi di RAM). Usa Tauri.

Come funziona: Tauri impacchetta la tua app Svelte usando il motore web già presente nel sistema operativo (Edge/WebView2 su Windows). Il risultato è un .exe minuscolo (spesso sotto i 10 MB).

Il trucco "Zero Admin": Puoi configurare il file di installazione di Tauri per fare una "User-level installation" (installazione nello spazio utente, di solito nella cartella AppData), oppure generare una versione "Portable" (un singolo file .exe che clicchi e si apre, senza installare nulla). Nessuna delle due opzioni farà scattare la richiesta della password di amministratore.

Automazione: Puoi usare GitHub Actions. Ogni volta che fai un push del codice su GitHub, un server automatico compila il gioco e pubblica il file .exe finito nella sezione "Releases" della tua repository, pronto per il download.

## VINCOLI:

- procedi sempre con piani di implementazione prima di eseguire modifiche nei file
- crea, modifica direttamente i file del progetto in seguito all'approvazione del piano di implementazione
- mantieni context window piccole per evitare errori di generazione
- non creare file con troppe righie di codice poichè potrebbe portare ad errori in fase di modifica
- segui quello scritto nella seguente guida, se ci sono cose non definite NON DEVI INVENTARE, chiedi come procedere fornendo le possibilità migliori per il progetto
