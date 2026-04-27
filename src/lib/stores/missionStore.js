import { writable } from 'svelte/store';

export const missionState = writable({
  currentPhase: 1, // 1: Preparazione, 2: Lancio, 3: TLI, 4: Iniezione Lunare
  status: "In attesa di calcoli",
  
  // Parametri SLS Block 1 (Semplificati per scopi didattici)
  rocket: {
    dryMass: 150000,     // kg (Massa senza carburante)
    fuelMass: 2000000,   // kg (Capacità massima carburante)
    isp: 363,            // s (Impulso specifico motori RS-25)
    g0: 9.80665,         // m/s^2
    targetDeltaV: 9500,  // m/s (Delta-v necessario per orbita HEO)
  },

  constants: {
    RE: 6371000, // m
    GM: 3.986e14, // m^3/s^2 (Terra)
    hp: 192000, // m (Altitudine parcheggio)
    ha: 70174000, // m
    distanceEarthMoon: 384400000, // m
    moonRadius: 1737000, // m
    GMMoon: 4.9048e12 // m^3/s^2 (Luna)
  },
  
  studentCalculations: {
    semiMajorAxis: 0,
    orbitalPeriod: 0,
    requiredFuel: 0,
    isValid: false,
  },

  telemetry: {
    velocity: 0,
    altitude: 0,
    fuelRemaining: 100,
    stage: "Core Stage"
  },
  
  showBriefing: true,
  isAnalyzing: false,
  phase1Complete: false,
  phase2Complete: false,
  phase3Complete: false,
  didacticFeedback: ""
});

export const updateTelemetry = (data) => {
  missionState.update(state => ({
    ...state,
    telemetry: { ...state.telemetry, ...data }
  }));
};

export const nextPhase = () => {
  missionState.update(state => ({
    ...state,
    currentPhase: state.currentPhase + 1,
    showBriefing: true,
    isAnalyzing: false
  }));
};
