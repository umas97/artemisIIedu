import { writable } from 'svelte/store';
import { EARTH, MOON, HEO, CORE_STAGE, G0 } from '../physics/constants.js';

export const missionState = writable({
  currentPhase: 1, // 1 HEO, 2 Lancio, 3 TLI, 4 LOI, 5 TEI, 6 Rientro
  status: "In attesa di calcoli",
  
  // Modello semplificato del core stage SLS (vedi physics/constants.js)
  rocket: {
    dryMass: CORE_STAGE.dryMass,
    fuelMass: CORE_STAGE.tankCapacity,
    isp: CORE_STAGE.isp,
    g0: G0,
    targetDeltaV: CORE_STAGE.targetDeltaV,
  },

  constants: {
    RE: EARTH.R,
    GM: EARTH.GM,
    hp: HEO.hp,
    ha: HEO.ha,
    distanceEarthMoon: MOON.distance,
    moonRadius: MOON.R,
    GMMoon: MOON.GM,
    h_moon_orbit: MOON.orbitAltitude,
  },

  studentCalculations: {
    semiMajorAxis: 0,
    orbitalPeriod: 0,
    requiredFuel: 0,
    tliDeltaV: 0,
    loiDeltaV: 0,
    teiDeltaV: 0,
    reentryAngle: 0,
    parachuteDrogueAltitude: 0,
    parachuteArea: 0,
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
  phase4Complete: false,
  phase5Complete: false,
  phase6Complete: false,
  showFlightPlan: false,
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
