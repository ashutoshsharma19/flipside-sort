// Run: node --test
const test = require('node:test');
const assert = require('node:assert');
const L = require('./logic');
const levels = require('./levels.json');

const mk = (tubes, extra = {}) => L.newState({ tubes, cap: 4, flipEvery: 0, locked: -1, ...extra });

test('solved detection', () => {
  assert.ok(L.isSolved(mk([[0, 0, 0, 0], [1, 1, 1, 1], []])));
  assert.ok(!L.isSolved(mk([[0, 0, 0, 1], [1, 1, 1, 0], []])));
  assert.ok(!L.isSolved(mk([[0, 0, 0], [1, 1, 1, 1], [0]])), 'split colour is not solved');
});

test('move rules: same colour on top or empty target, capacity respected', () => {
  const s = mk([[0, 1], [2, 1], [], [3, 3, 3, 3]]);
  assert.ok(L.canMove(s, 0, 1));
  assert.ok(L.canMove(s, 0, 2));
  assert.ok(!L.canMove(s, 0, 3), 'colour mismatch');
  assert.ok(!L.canMove(s, 2, 0), 'empty source');
  assert.ok(!L.canMove(s, 0, 0), 'same tube');
  const full = mk([[1], [1, 1, 1, 1]]);
  assert.ok(!L.canMove(full, 0, 1), 'full target');
});

test('flip reverses every tube after N moves', () => {
  let s = mk([[0, 1, 2], [3], [], []], { flipEvery: 2 });
  let r = L.applyMove(s, 0, 2); // 2 -> tube 2
  assert.equal(r.flipped, false);
  r = L.applyMove(r.state, 1, 3); // move 2 => flip
  assert.equal(r.flipped, true);
  assert.deepEqual(r.state.tubes[0], [1, 0]);
  assert.equal(r.state.upsideDown, true);
  assert.equal(L.movesUntilFlip(r.state), 2);
});

test('locked tube blocks moves until any tube is completed', () => {
  let s = mk([[0, 0, 0], [0], [1, 1, 1, 1].slice(0, 3).concat([2]), []], { locked: 2 });
  assert.ok(!L.canMove(s, 2, 3));
  assert.ok(!L.canMove(s, 1, 2));
  const r = L.applyMove(s, 1, 0);
  assert.equal(r.unlocked, true);
  assert.equal(r.state.locked, -1);
  assert.ok(L.canMove(r.state, 2, 3));
});

test('applyMove does not mutate the input state', () => {
  const s = mk([[0, 1], []]);
  L.applyMove(s, 0, 1);
  assert.deepEqual(s.tubes, [[0, 1], []]);
  assert.equal(s.moves, 0);
});

test('every shipped level replays its stored solution to a solved board', () => {
  assert.ok(levels.length >= 60);
  for (const lv of levels) {
    let s = L.newState(lv);
    assert.ok(!L.isSolved(s), `L${lv.n} starts solved`);
    for (const [a, b] of lv.solution) {
      assert.ok(L.canMove(s, a, b), `L${lv.n} illegal move ${a}->${b}`);
      s = L.applyMove(s, a, b).state;
    }
    assert.ok(L.isSolved(s), `L${lv.n} not solved by its solution`);
  }
});

test('runtime hint solver finds a solution from each level start within the in-game budget', () => {
  for (const lv of levels) {
    const sol = L.solve(L.newState(lv), { maxNodes: 40000, weight: 3 });
    assert.ok(sol, `L${lv.n} hint solver failed`);
  }
});
