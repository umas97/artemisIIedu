// Unica fonte delle costanti fisiche e dei dati di missione.
// Valori semplificati a scopo didattico (seconda superiore): vedi le note accanto.

export const EARTH = {
  R: 6371000, // m, raggio medio
  GM: 3.986e14, // m^3/s^2
};

export const MOON = {
  R: 1737000, // m
  GM: 4.9048e12, // m^3/s^2
  distance: 384400000, // m, distanza media Terra-Luna (centro-centro)
  orbitAltitude: 100000, // m, quota dell'orbita lunare dell'esercizio (fase 4)
  // m, raggio della sfera d'influenza lunare: r_SOI = D·(M_Luna/M_Terra)^(2/5) ≈ 66.200 km
  soiRadius: 384400000 * Math.pow(4.9048e12 / EARTH.GM, 0.4),
};

export const G0 = 9.80665; // m/s^2, accelerazione di gravità standard

// Fase 1: orbita alta (HEO) di Artemis II
export const HEO = {
  hp: 192000, // m, quota del perigeo
  ha: 70174000, // m, quota dell'apogeo
};

// Fase 2: modello a un solo stadio = core stage SLS con 4 motori RS-25.
// I booster laterali sono ignorati per poter usare la formula di Tsiolkovsky una sola volta.
export const CORE_STAGE = {
  dryMass: 150000, // kg, massa finale (stadio vuoto + carico) semplificata
  isp: 452, // s, Isp nel vuoto dell'RS-25
  targetDeltaV: 9500, // m/s, Δv per l'orbita (incluse perdite gravitazionali e aerodinamiche)
  tankCapacity: 1200000, // kg, capacità semplificata (reale ≈ 987 t)
};

// Flight Plan: manovre effettuate da Orion con il modulo di servizio europeo (ESM)
export const ORION = {
  initialMass: 26500, // kg, Orion (CM + ESM) a inizio missione
  ispESM: 316, // s, motore principale OMS-E (AJ10)
  propellantCapacity: 8600, // kg, propellente utilizzabile dell'ESM
};

// Nell'esercizio (fase 3) la TLI parte da un'orbita circolare bassa ed è eseguita dallo stadio superiore,
// come nelle missioni Apollo. Nella missione reale l'ICPS porta Orion in HEO e la TLI la esegue il motore dell'ESM.
export const ICPS = {
  isp: 465.5, // s, motore RL10B-2
};

// Massa di propellente per un dato Δv (Tsiolkovsky), partendo dalla massa iniziale m0
export const propellantFromInitialMass = (m0, deltaV, isp) => m0 * (1 - Math.exp(-Math.abs(deltaV) / (isp * G0)));

// Massa di propellente per un dato Δv, partendo dalla massa finale (a vuoto)
export const propellantFromDryMass = (mDry, deltaV, isp) => mDry * (Math.exp(Math.abs(deltaV) / (isp * G0)) - 1);
