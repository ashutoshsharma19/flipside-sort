// Generates levels.json: seeded, shuffled boards that the solver has proven solvable.
const L = require('./logic');
const fs = require('fs');

function rng(seed) {
  return () => {
    seed |= 0; seed = (seed + 0x6d2b79f5) | 0;
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function config(n) {
  if (n <= 2) return { colors: 3, flip: 0, lock: false };
  if (n <= 5) return { colors: 4, flip: 0, lock: false };
  if (n <= 10) return { colors: 5, flip: 6, lock: false };
  if (n <= 15) return { colors: 5, flip: 5, lock: true };
  if (n <= 25) return { colors: 6, flip: 5, lock: n % 2 === 0 };
  if (n <= 40) return { colors: 7, flip: n % 3 === 0 ? 4 : 5, lock: n % 2 === 1 };
  return { colors: 8, flip: 4, lock: n % 2 === 0 };
}

const CAP = 4, TOTAL = 60, levels = [];
for (let n = 1; n <= TOTAL; n++) {
  const c = config(n);
  for (let attempt = 0; ; attempt++) {
    const r = rng(n * 1000 + attempt);
    const balls = [];
    for (let col = 0; col < c.colors; col++) for (let k = 0; k < CAP; k++) balls.push(col);
    for (let i = balls.length - 1; i > 0; i--) { const j = Math.floor(r() * (i + 1)); [balls[i], balls[j]] = [balls[j], balls[i]]; }
    const tubes = [];
    for (let t = 0; t < c.colors; t++) tubes.push(balls.slice(t * CAP, t * CAP + CAP));
    tubes.push([], []);
    if (tubes.some((t) => L.isComplete(t, CAP))) continue;
    // too easy if a tube is 3-of-a-kind on top
    const locked = c.lock ? Math.floor(r() * c.colors) : -1;
    const level = { tubes, cap: CAP, flipEvery: c.flip, locked };
    const start = L.newState(level);
    let best = null;
    for (const weight of [1.5, 3]) {
      const sol = L.solve(start, { maxNodes: 250000, weight });
      if (sol && (!best || sol.length < best.length)) best = sol;
    }
    if (!best) continue;
    const minLen = c.colors * 2;
    if (best.length < minLen && attempt < 30) continue;
    levels.push({ n, ...level, par: best.length, solution: best });
    console.log(`L${n}: colors=${c.colors} flip=${c.flip} lock=${locked >= 0} par=${best.length} (attempt ${attempt})`);
    break;
  }
}
fs.writeFileSync(__dirname + '/levels.json', JSON.stringify(levels));
