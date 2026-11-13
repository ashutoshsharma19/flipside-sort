// Flipside Sort — pure game logic (no DOM). Shared by the game, the level generator and the tests.
const Logic = (() => {
  const top = (t) => t[t.length - 1];
  const isUniform = (t) => t.every((b) => b === t[0]);
  const isComplete = (t, cap) => t.length === cap && isUniform(t);

  function clone(s) {
    return { ...s, tubes: s.tubes.map((t) => t.slice()) };
  }

  function isSolved(s) {
    return s.tubes.every((t) => t.length === 0 || isComplete(t, s.cap));
  }

  function canMove(s, a, b) {
    if (a === b || a === s.locked || b === s.locked) return false;
    const A = s.tubes[a], B = s.tubes[b];
    if (!A || !B || A.length === 0 || B.length >= s.cap) return false;
    return B.length === 0 || top(B) === top(A);
  }

  // Returns { state, unlocked, flipped }. Order: move -> unlock check -> flip check.
  function applyMove(s, a, b) {
    const n = clone(s);
    n.tubes[b].push(n.tubes[a].pop());
    n.moves += 1;
    let unlocked = false, flipped = false;
    if (n.locked >= 0 && n.tubes.some((t, i) => i !== n.locked && isComplete(t, n.cap))) {
      n.locked = -1;
      unlocked = true;
    }
    if (n.flipEvery > 0 && n.moves % n.flipEvery === 0) {
      n.tubes.forEach((t) => t.reverse());
      n.upsideDown = !n.upsideDown;
      flipped = true;
    }
    return { state: n, unlocked, flipped };
  }

  function movesUntilFlip(s) {
    if (!s.flipEvery) return Infinity;
    return s.flipEvery - (s.moves % s.flipEvery);
  }

  function legalMoves(s) {
    const out = [];
    for (let a = 0; a < s.tubes.length; a++) {
      const A = s.tubes[a];
      if (!A.length || a === s.locked || isComplete(A, s.cap)) continue;
      for (let b = 0; b < s.tubes.length; b++) {
        if (!canMove(s, a, b)) continue;
        // Pointless without flips: moving a single-colour stack into an empty tube.
        if (!s.flipEvery && s.tubes[b].length === 0 && isUniform(A)) continue;
        out.push([a, b]);
      }
    }
    return out;
  }

  function key(s) {
    const free = [];
    s.tubes.forEach((t, i) => { if (i !== s.locked) free.push(t.join('')); });
    free.sort();
    const lockPart = s.locked >= 0 ? 'L' + s.tubes[s.locked].join('') : '-';
    const phase = s.flipEvery ? s.moves % s.flipEvery : 0;
    return free.join('|') + '#' + lockPart + '#' + phase;
  }

  // Lower is better: colour breaks inside tubes + how scattered each colour is.
  function heuristic(s) {
    let h = 0;
    const where = new Map();
    s.tubes.forEach((t, i) => {
      for (let k = 1; k < t.length; k++) if (t[k] !== t[k - 1]) h++;
      // a uniform but incomplete tube sitting on top of nothing is fine; mixed bottoms cost more
      new Set(t).forEach((c) => where.set(c, (where.get(c) || 0) + 1));
    });
    where.forEach((n) => (h += n - 1));
    if (s.locked >= 0) h += 2;
    return h;
  }

  // Tiny binary heap
  class Heap {
    constructor() { this.a = []; }
    get size() { return this.a.length; }
    push(x) {
      const a = this.a; a.push(x);
      let i = a.length - 1;
      while (i > 0) { const p = (i - 1) >> 1; if (a[p].f <= a[i].f) break; [a[p], a[i]] = [a[i], a[p]]; i = p; }
    }
    pop() {
      const a = this.a, r = a[0], last = a.pop();
      if (a.length) {
        a[0] = last; let i = 0;
        for (;;) {
          const l = 2 * i + 1, rr = l + 1; let m = i;
          if (l < a.length && a[l].f < a[m].f) m = l;
          if (rr < a.length && a[rr].f < a[m].f) m = rr;
          if (m === i) break; [a[m], a[i]] = [a[i], a[m]]; i = m;
        }
      }
      return r;
    }
  }

  // Weighted best-first search. Returns an array of [from,to] moves, or null if none found within maxNodes.
  function solve(start, { maxNodes = 50000, weight = 3 } = {}) {
    if (isSolved(start)) return [];
    const seen = new Set([key(start)]);
    const heap = new Heap();
    heap.push({ s: start, path: [], f: weight * heuristic(start) });
    let nodes = 0;
    while (heap.size && nodes < maxNodes) {
      const { s, path } = heap.pop();
      nodes++;
      for (const [a, b] of legalMoves(s)) {
        const { state } = applyMove(s, a, b);
        const k = key(state);
        if (seen.has(k)) continue;
        seen.add(k);
        const p = path.concat([[a, b]]);
        if (isSolved(state)) return p;
        heap.push({ s: state, path: p, f: p.length + weight * heuristic(state) });
      }
    }
    return null;
  }

  function newState(level) {
    return {
      tubes: level.tubes.map((t) => t.slice()),
      cap: level.cap,
      flipEvery: level.flipEvery || 0,
      locked: level.locked ?? -1,
      moves: 0,
      upsideDown: false,
    };
  }

  return { isSolved, canMove, applyMove, movesUntilFlip, legalMoves, solve, newState, isComplete, clone, key };
})();

if (typeof module !== 'undefined') module.exports = Logic;
