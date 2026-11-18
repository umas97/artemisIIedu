# Artemis II Simulator - Versione 1.1.0 🚀

Una versione rinnovata nella grafica e rivista nella fisica, pensata per l'uso in classe sulla LIM e nei laboratori.

## Novità

### Nuova interfaccia "Mission Control"
- Grafica ridisegnata: colori ad alto contrasto, ben leggibili anche al proiettore.
- Barra in alto con l'avanzamento della missione (fasi 1–6) e lo stato del volo.
- Riquadro "Dossier" in basso che spiega cosa sta succedendo in ogni momento.
- I font sono inclusi nel programma: funziona anche senza connessione a Internet.
- Terra, Luna, Orion e scie sono disegnati dal programma e restano nitidi a ogni risoluzione. Si può ingrandire con la rotella e spostare la vista trascinando.

### Fisica e didattica riviste
- **Fase 1 (orbita alta):** Orion si muove davvero secondo la seconda legge di Keplero, veloce al perigeo e lento all'apogeo, e la telemetria segue la formula vis-viva.
- **Fase 2 (lancio SLS):** il core stage usa l'impulso specifico nel vuoto. Il lancio mostra countdown, accensione dei motori RS-25, Max-Q, separazione dei booster e MECO.
- **Fase 3 (TLI):** introdotta la sfera d'influenza lunare.
- **Fasi 4 e 5 (LOI e TEI):** l'esito della manovra dipende dall'energia dell'orbita risultante (cattura, orbita instabile, fuga…). Ci sono note sulla missione reale, che usa una traiettoria di ritorno libero (free-return).
- **Fase 6 (rientro):** modello ricalibrato su decelerazione e temperatura dello scudo termico.
- Testi didattici corretti. Gli errori più comuni (unità di misura, quote al posto delle distanze dal centro, fattori dimenticati) ricevono un suggerimento mirato.

### Flight Plan
- Il report finale ora include i dati reali di Orion, e la stampa su sfondo chiaro risparmia inchiostro.

### Per i docenti
- **Modalità Docente** (Ctrl + Shift + D): mostra formule e soluzioni attese in tutte le fasi.
- **Salto di fase** (Ctrl + 1 … 6): si passa direttamente a una fase, utile per le dimostrazioni.
- Nel repository, in `docs/guida-docenti/`, c'è una **guida per il docente** in PDF con formulario e procedimento risolto per ogni fase.

## Correzioni
- Fase 1: Orion non "salta" più dopo l'apogeo e la scia non disegna più linee dritte attraverso l'orbita.
- Il passaggio da una fase all'altra non lascia più attiva la scena precedente sotto quella nuova.
- Rimossi i messaggi di debug e sistemati alcuni problemi di ridimensionamento della finestra.

## Download
Scarica tra gli *Assets* qui sotto il file per il tuo sistema:
- **Windows:** installer `.exe` (si installa nella cartella dell'utente, senza bisogno di permessi di amministratore) o `.msi`
- **macOS (Mac con chip Apple M1 o successivi):** `.dmg`
- **Linux:** `.AppImage`, `.deb` o `.rpm`

---
*Software didattico: i parametri orbitali sono semplificati a scopo educativo.*


# Artemis II Simulator - Versione 1.0.0 🚀

Siamo orgogliosi di annunciare il rilascio della versione **1.0.0** ufficiale di **Artemis II Simulator**, il software didattico interattivo progettato per simulare le fasi cruciali del prossimo volo cis-lunare con equipaggio della NASA.

## Novità della Versione 1.0.0

Questa release segna il completamento dell'intero profilo di missione, dall'orbita terrestre (LEO) fino allo splashdown nell'Oceano Pacifico.

### ✨ Funzionalità Principali
- **Simulazione a 6 Fasi:** Guida l'equipaggio attraverso l'orbita di parcheggio, l'accensione TLI, l'inserimento in orbita lunare (LOI), la spinta di fuga (TEI) e il rientro atmosferico.
- **Calcolatore Fisico Integrato:** Verifica in tempo reale i delta-v ($\Delta v$) calcolati dagli studenti utilizzando parametri astrodinamici reali (massa terrestre, distanza lunare, costanti gravitazionali).
- **Gamification Didattica:** Feedback visivo immersivo, formule renderizzate in alta qualità e layout in stile "Dashboard NASA" con transizioni fluide.
- **Flight Plan Completo:** Al termine della Fase 6 è ora possibile esportare (e stampare su più pagine in alta qualità) l'intero report della missione, contenente il grafico ibrido della traiettoria e le misurazioni di propellente basate sull'equazione di Tsiolkovsky.

### 📦 Eseguibili Cross-Platform
Questa release introduce per la prima volta la disponibilità pubblica di eseguibili "portable" stand-alone generati automaticamente tramite GitHub Actions:
- **Windows:** Eseguibile `.exe` autoconfigurato che si installa nella directory utente (non richiede privilegi di Amministratore).
- **macOS:** File immagine `.dmg` compatibile con le architetture Apple.
- **Linux:** File `.AppImage` universale e pacchetti nativi.

## Download
Scarica l'eseguibile corrispondente al tuo sistema operativo tra gli *Assets* qui sotto. Non è richiesta l'installazione di dipendenze esterne.

---
*Progettato per uso didattico. I parametri orbitali sono semplificati per scopo educativo e non destinati alla vera navigazione aerospaziale.*
