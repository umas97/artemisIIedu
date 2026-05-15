# Artemis II - Simulatore Didattico

![Versione](https://img.shields.io/badge/versione-1.0.1-blue)
![Tauri](https://img.shields.io/badge/Tauri-Desktop-orange)
![Svelte](https://img.shields.io/badge/Svelte-5-ff3e00)

Un simulatore interattivo cross-platform (Windows, macOS, Linux) dedicato alla missione spaziale **Artemis II**, sviluppato per esplorare le fasi del volo spaziale verso la Luna.

## 🎯 Focus Didattico

Il cuore di questo progetto è il suo **valore educativo**. Non si tratta solo di un'animazione, ma di uno strumento progettato per le scuole e l'apprendimento delle materie STEM (Fisica, Matematica, Scienze).

- **Fisica e Meccanica Orbitale:** Il programma permette di comprendere concretamente i calcoli e le grandezze dietro alle manovre spaziali, come l'Iniezione Trans-Lunare (TLI - Trans-Lunar Injection).
- **Modalità Docente (Teacher Mode):** Una speciale modalità dedicata che mostra in tempo reale le formule fisiche e matematiche che governano la simulazione (ad es. calcolo del $\Delta v$, raggio terrestre, altitudine del perigeo, parametro gravitazionale). Le formule sono renderizzate in formato accademico per essere facilmente spiegate in classe.
- **Apprendimento Interattivo:** Gli studenti possono osservare l'impatto dei parametri fisici sull'andamento della missione, collegando in modo diretto la teoria studiata sui libri a una simulazione visiva in tempo reale.

## 🌕 Le Fasi della simulazione (Artemis II)

Il simulatore riproduce l'intero viaggio della navicella Orion, guidando l'utente attraverso **fasi distinte e interattive**, ognuna utile per spiegare un diverso concetto scientifico:

- **Fase 1 (Lancio e Ascesa):** Il decollo del razzo dalla Terra. Serve a introdurre i parametri base della missione e far percepire l'inizio dell'esplorazione spaziale.
- **Fase 2 (Orbita di Parcheggio Terrestre):** La navicella si inserisce in un'orbita temporanea attorno al nostro pianeta. Qui gli studenti possono familiarizzare con concetti geometrici come l'altitudine del perigeo e il moto circolare/ellittico.
- **Fase 3 (Iniezione Trans-Lunare - TLI):** Il momento in cui i motori si accendono per sfuggire all'orbita terrestre. Dal punto di vista didattico è la fase più importante: attivando la Modalità Docente si osserva in tempo reale il calcolo del _Delta-v_ ($\Delta v$), la grande variazione di velocità necessaria per la manovra.
- **Fase 4 (Viaggio verso la Luna):** Il transito nello spazio profondo. Questa visualizzazione aiuta gli studenti a percepire e comprendere concretamente l'immensa distanza tra la Terra e la Luna (circa 384.400 km).
- **Fase 5 (Sorvolo Lunare - Flyby):** La navicella aggira la Luna senza atterrare. Sfrutta l'attrazione gravitazionale lunare per invertire la rotta e farsi "spingere" indietro verso casa. È l'occasione perfetta per spiegare in classe l'effetto fionda gravitazionale (_gravity assist_).
- **Fase 6 (Rientro e Ammaraggio):** La missione si conclude con il ritorno sicuro sulla Terra. Al termine, la simulazione può essere ripetuta o chiusa.
- **Flight plan (Piano di Volo):** Alla fine del viaggio, il software genera un report riassuntivo stampabile. È pensato appositamente per le scuole: documenta tutti i passaggi svolti e può essere usato dai docenti come scheda di laboratorio per assegnare esercizi sui dati raccolti dagli studenti.

## ✨ Caratteristiche Principali

- **Simulazione a Fasi:** Suddivisione rigorosa della missione Artemis II in diverse fasi sequenziali e interattive.
- **Rappresentazione Visiva:** Utilizza il motore **Phaser** per le simulazioni spaziali e le dinamiche orbitali.
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
Progetto realizzato in *vibe coding* da [umas97](https://github.com/umas97). Tutti i conti e l'intera interfaccia sono stati controllati e corretti manualmente per garantirne l'accuratezza.
