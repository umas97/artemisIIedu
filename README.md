# Artemis II - Simulatore Didattico

![Versione](https://img.shields.io/badge/versione-1.0.1-blue)
![Tauri](https://img.shields.io/badge/Tauri-Desktop-orange)
![Svelte](https://img.shields.io/badge/Svelte-5-ff3e00)

Un simulatore interattivo cross-platform (Windows, macOS, Linux) dedicato alla missione spaziale **Artemis II**, sviluppato per esplorare le fasi del volo spaziale verso la Luna.

## 🎯 Focus Didattico

Il cuore di questo progetto è il suo **valore educativo**. Non si tratta solo di un'animazione, ma di uno strumento progettato per le scuole e l'apprendimento delle materie STEM (Fisica, Matematica, Scienze).

- **Fisica e Meccanica Orbitale:** Il programma permette di comprendere concretamente i calcoli e le grandezze dietro alle manovre spaziali, come l'Iniezione Trans-Lunare (TLI - Trans-Lunar Injection).
- **Modalità Docente (Ctrl + Shift + D):** Una speciale modalità dedicata che mostra in tempo reale le formule fisiche e matematiche che governano la simulazione (ad es. calcolo del $\Delta v$, raggio terrestre, altitudine del perigeo, parametro gravitazionale). Le formule sono renderizzate in formato accademico per essere facilmente spiegate in classe.
- **Apprendimento Interattivo:** Gli studenti possono osservare l'impatto dei parametri fisici sull'andamento della missione, collegando in modo diretto la teoria studiata sui libri a una simulazione visiva in tempo reale.

## 🌕 Le Fasi della simulazione

Il simulatore guida lo studente attraverso **sei fasi**. Ognuna ha un briefing teorico (il problema e gli strumenti per risolverlo, senza la soluzione) e un terminale di calcolo: la simulazione usa i valori inseriti dallo studente, giusti o sbagliati che siano, e mostra le conseguenze.

| Fase | Manovra | Concetti di fisica |
|---|---|---|
| 1 · Checkout orbitale | Analisi dell'orbita alta (HEO) di Artemis II | Ellisse, perigeo/apogeo, semiasse maggiore, terza legge di Keplero |
| 2 · Lancio SLS | Calcolo del propellente del core stage | Equazione del razzo di Tsiolkovsky, impulso specifico |
| 3 · Iniezione trans-lunare (TLI) | Δv per raggiungere la distanza della Luna | Equazione vis-viva, orbita di trasferimento |
| 4 · Inserimento in orbita lunare (LOI) | Frenata per farsi catturare dalla Luna | Velocità circolare, energia orbitale |
| 5 · Ritorno (TEI) | Δv minimo per sfuggire alla Luna | Velocità di fuga |
| 6 · Rientro e ammaraggio | Angolo di rientro e paracadute | Resistenza aerodinamica, decelerazione, velocità limite |

> **Nota:** la missione Artemis II reale non entra in orbita lunare: compie un sorvolo con traiettoria di **libero ritorno** (*free-return*). Le fasi 4 e 5 sono un esercizio sull'orbita lunare, come nelle missioni Apollo e nelle future Artemis III+. L'app lo segnala agli studenti.

Al termine il software genera il **Flight Plan**, un report stampabile con la tabella dei nodi di manovra, il consumo di propellente (Tsiolkovsky) e lo schema della traiettoria: si può usare come scheda di laboratorio.

### Modalità Docente

Premi **Ctrl + Shift + D** in qualsiasi momento per mostrare formule e soluzioni attese nei terminali di calcolo. Con **Ctrl + 1 … 6** si salta direttamente a una fase (utile per le dimostrazioni in classe).

## ✨ Caratteristiche Principali

- **Simulazione a Fasi:** Sei fasi sequenziali e interattive, dal lancio all'ammaraggio.
- **Rappresentazione Visiva:** Scene **Phaser** con grafica procedurale (nessun file immagine), zoom con la rotella e trascinamento della vista.
- **Pensato per l'aula:** Interfaccia ad alto contrasto che si adatta allo schermo, leggibile su LIM e proiettore.
- **Report di Volo (Flight Plan):** Generazione, consultazione e stampa di un "Flight Plan" dettagliato che riassume i progressi della missione, perfetto per attività di laboratorio.
- **Esperienza Nativa:** Progettato come un software desktop leggero e performante, utilizzabile anche offline nelle aule scolastiche.

## 🚀 Tecnologie Utilizzate

Questo progetto combina tecnologie web moderne con un framework per la creazione di applicazioni desktop native:

- **[Svelte 5](https://svelte.dev/)** + **[Vite](https://vitejs.dev/)**: Per un'interfaccia utente fluida, reattiva (basata sul nuovo sistema a _runes_) e moderna.
- **[Tauri](https://tauri.app/)**: Per impacchettare l'applicazione web come eseguibile nativo e sicuro per Windows, Linux e macOS (sfruttando Rust sotto il cofano).
- **[Phaser](https://phaser.io/)**: Per il rendering visivo e la gestione della scena spaziale.
- **[KaTeX](https://katex.org/)**: Per la formattazione tipografica professionale delle formule matematiche all'interno della UI.
- **[Tailwind CSS](https://tailwindcss.com/)**: Per un design rapido, reattivo e coerente.

---

## 🛠️ Sviluppo

```bash
npm install
npm run dev          # versione web su http://localhost:5173
npm run tauri dev    # app desktop
npm run tauri build  # eseguibili
```

---

## ⚠️ Avviso per gli utenti Windows (SmartScreen)

Poiché questo è un progetto open source, l'eseguibile non possiede una firma digitale commerciale. Di conseguenza, Windows Defender SmartScreen potrebbe bloccare l'avvio dell'app mostrando il messaggio "PC protetto da Windows".
Per eseguire il programma:
- Clicca su Ulteriori informazioni (More info).
- Clicca sul pulsante Esegui comunque (Run anyway).

*Tutto il codice sorgente è pubblico e verificabile in questa repository.*

---

Progetto realizzato in *vibe coding* da [umas97](https://github.com/umas97). Tutti i conti e l'intera interfaccia sono stati controllati e corretti manualmente per garantirne l'accuratezza.
