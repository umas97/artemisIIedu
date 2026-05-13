
const GM = 3.986e14;
const RE = 6371000;
const hp = 192000;
const ra = 384400000;

const rp = RE + hp;
const a = (rp + ra) / 2;

console.log("--- Standard Calculation (at orbit) ---");
const v_circ = Math.sqrt(GM / rp);
const v_tli = Math.sqrt(GM * (2/rp - 1/a));
const delta_v = v_tli - v_circ;
console.log(`rp: ${rp}`);
console.log(`a: ${a}`);
console.log(`v_circ: ${v_circ.toFixed(2)}`);
console.log(`v_tli: ${v_tli.toFixed(2)}`);
console.log(`delta_v: ${delta_v.toFixed(2)}`);

console.log("\n--- Incorrect Calculation (using r=RE in Vis-Viva) ---");
const v_tli_err = Math.sqrt(GM * (2/RE - 1/a));
const delta_v_err = v_tli_err - v_circ;
console.log(`v_tli_err: ${v_tli_err.toFixed(2)}`);
console.log(`delta_v_err: ${delta_v_err.toFixed(2)}`);

console.log("\n--- Incorrect Calculation (using rp but different a?) ---");
// What if they use a = ra/2? (Starting from center)
const a_err2 = ra / 2;
const v_tli_err2 = Math.sqrt(GM * (2/rp - 1/a_err2));
const delta_v_err2 = v_tli_err2 - v_circ;
console.log(`delta_v_err2: ${delta_v_err2.toFixed(2)}`);
