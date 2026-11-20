import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import { Game, validateInputs, validateScenario } from '../src/simulation.mjs';

const { tuning: t } = JSON.parse(fs.readFileSync(new URL('../game.contract.json', import.meta.url)));
const quiet = { random_motes: false, random_shades: false };
const make = s => new Game(t, 42, { ...quiet, ...s });
const run = (g, n, patch = {}) => { for (let i = 0; i < n; i++) g.step(i === 0 ? patch : {}); return g; };
const close = (a, b, eps = 1e-8) => assert.ok(Math.abs(a - b) < eps, `${a} != ${b}`);

test('tick 0 is pristine; 60 steps move 6m and consume exactly one second', () => {
  const g = make();
  assert.equal(g.tick, 0); assert.equal(g.score, 0); assert.deepEqual(g.events, []);
  assert.equal(g.lanterns.length, 5);
  run(g, 60, { move: [0, 1] });
  close(g.player.pos[2], t.player_speed); close(g.timeLeft, t.night1_duration_s - 1);
  assert.equal(g.snapshot().sim_tick, 60);
});
test('diagonal normalization and camera rotation use contract axes', () => {
  const g = make(); run(g, 60, { move: [1, 1] });
  close(Math.hypot(g.player.pos[0], g.player.pos[2]), t.player_speed);
  const h = make(); run(h, 60, { move: [0, 1], cam_yaw_deg: 90 });
  close(h.player.pos[0], t.player_speed); close(h.player.pos[2], 0);
});
test('pickup uses inclusive XZ radius and capacity even while airborne', () => {
  const g = make({ player: { pos: [0, 2, 0], carried: t.carry_capacity - 1 }, motes: [[t.pickup_radius, 0, 0], [0, 0, 0]] });
  const events = g.step();
  assert.equal(g.player.carried, t.carry_capacity); assert.equal(g.motes.length, 1);
  assert.equal(g.score, t.score.per_mote); assert.equal(events[0].tick, 1);
  assert.deepEqual(events[0].data, { carried: t.carry_capacity });
});
test('just outside pickup radius is not collected', () => {
  const g = make({ motes: [[t.pickup_radius + 0.001, 0, 0]] });
  assert.equal(g.step().length, 0); assert.equal(g.player.carried, 0);
});
test('scenario merges lantern ids; construction grants no score or events', () => {
  const g = make({ lanterns: [{ id: 'L2', pos: [1, 0, 2], lit: true }], player: { carried: 8 } });
  assert.equal(g.lanterns.length, 5); assert.equal(g.lanterns[1].lit, true);
  assert.equal(g.lanterns[0].lit, false); assert.equal(g.score, 0);
  assert.deepEqual(g.events, []); assert.equal(g.motes.length, 0);
});
test('deposit is partial, inclusive, edge-triggered and lights only once', () => {
  const g = make({ player: { carried: 2 }, lanterns: [{ id: 'L1', pos: [t.interact_radius, 0, 0] }] });
  let events = g.step({ interact: true });
  assert.deepEqual(events[0].data, { lantern_id: 'L1', amount: 2, deposited: 2 });
  g.player.carried = 10;
  assert.equal(g.step().filter(e => e.name === 'deposit').length, 0);
  g.step({ interact: false }); events = g.step({ interact: true });
  assert.equal(g.lanterns[0].lit, true); assert.equal(g.player.carried, 6);
  assert.equal(g.score, t.score.per_lantern);
  assert.equal(events.filter(e => e.name === 'lantern_lit').length, 1);
  g.step({ interact: false }); assert.equal(g.step({ interact: true }).length, 0);
});
test('pulse cost, inclusive radius, push, stun and rising-edge/cooldown rules', () => {
  const g = make({ player: { carried: 10 }, shades: [{ id: 'edge', pos: [t.pulse_radius, 0, 0] }, { id: 'outside', pos: [t.pulse_radius + 0.001, 0, 0] }] });
  const e = g.step({ pulse: true }).find(e => e.name === 'pulse');
  assert.deepEqual(e.data.stunned_ids, ['edge']);
  assert.equal(g.player.carried, 10 - t.pulse_cost);
  close(g.shades[0].pos[0], t.pulse_radius + t.pulse_push_m);
  assert.equal(g.shades[0].state, 'stunned');
  assert.equal(g.step().filter(e => e.name === 'pulse').length, 0);
  g.step({ pulse: false }); assert.equal(g.step({ pulse: true }).filter(e => e.name === 'pulse').length, 0);
  run(g, 56, { pulse: false });
  assert.equal(g.tick, 60);
  assert.equal(g.step({ pulse: true }).filter(e => e.name === 'pulse').length, 1);
  run(g, 119); assert.equal(g.shades[0].state, 'stunned');
  g.step(); assert.equal(g.shades[0].state, 'chase');
});
test('pulse with insufficient resource emits no pulse', () => {
  const g = make({ player: { carried: t.pulse_cost - 1 } });
  assert.equal(g.step({ pulse: true }).some(e => e.name === 'pulse'), false);
});
test('shade chases, hits, drops floor ratio, respects invulnerability', () => {
  const chase = make({ shades: [{ pos: [10, 0, 0] }] });
  run(chase, 60); close(chase.shades[0].pos[0], 10 - t.shade_speed);
  const g = make({ player: { carried: 10 }, shades: [{ pos: [0, 0, 0] }] });
  const e = g.step().find(e => e.name === 'player_hit');
  assert.deepEqual(e.data, { by: 'shade', flames: t.flames - 1, dropped: Math.floor(10 * t.hit_drop_ratio) });
  assert.equal(g.motes.length, 2);
  run(g, 119); assert.equal(g.player.flames, t.flames - 1);
  g.step(); assert.equal(g.player.flames, t.flames - 2);
});
test('lit lantern shields player and excludes shades from safe interior', () => {
  const g = make({ lanterns: [{ id: 'L1', pos: [0, 0, 0], lit: true }], shades: [{ pos: [0, 0, 0] }] });
  run(g, 300);
  assert.equal(g.player.flames, t.flames);
  assert.ok(Math.hypot(g.shades[0].pos[0], g.shades[0].pos[2]) >= t.safe_radius - 1e-8);
});
test('jump is edge-triggered and lands; boundary prevents fall', () => {
  const g = make(); g.step({ jump: true }); assert.ok(g.player.pos[1] > 0);
  run(g, 120); assert.equal(g.player.pos[1], 0);
  g.step(); assert.equal(g.player.pos[1], 0);
  g.step({ jump: false }); g.step({ jump: true }); assert.ok(g.player.pos[1] > 0);
  run(g, 600, { move: [1, 1] }); close(Math.hypot(g.player.pos[0], g.player.pos[2]), 32);
  assert.equal(g.player.flames, t.flames);
});
test('last lantern wins; score bonus once; terminal simulation stays frozen', () => {
  const g = make({ player: { carried: t.lantern_cost }, lanterns: Array.from({ length: 5 }, (_, i) => ({ id: 'L' + (i + 1), pos: [0, 0, 0], lit: i < 4 })) });
  const events = g.step({ interact: true });
  assert.equal(g.state, 'won');
  assert.deepEqual(events.at(-1).data, { result: 'won', reason: 'all_lit' });
  assert.equal(g.score, t.score.per_lantern + 299 * t.score.per_second_left + t.flames * t.score.per_flame_left);
  const before = g.snapshot(); g.step({ pulse: true }); assert.deepEqual(g.snapshot(), before);
});
test('dawn and no flames terminate with distinct reasons', () => {
  const dawn = make({ time_left_s: 1 / 60 });
  assert.deepEqual(dawn.step().at(-1).data, { result: 'lost', reason: 'dawn' });
  const hit = make({ player: { flames: 1 }, shades: [{ pos: [0, 0, 0] }] });
  assert.deepEqual(hit.step().at(-1).data, { result: 'lost', reason: 'no_flames' });
});
test('random flags suppress all spawning, explicit arrays replace defaults', () => {
  const g = make({ motes: [], shades: [] }); run(g, 1000);
  assert.equal(g.motes.length, 0); assert.equal(g.shades.length, 0);
  const h = new Game(t, 42, { motes: [], shades: [] });
  assert.equal(h.motes.length, 0); assert.equal(h.shades.length, 0);
  run(h, 480); assert.equal(h.shades.length, 1);
});
test('same seed gives identical snapshots and events; different seeds vary layout', () => {
  const a = new Game(t, 42); const b = new Game(t, 42); const c = new Game(t, 43);
  assert.notDeepEqual(a.snapshot().motes, c.snapshot().motes);
  for (let i = 0; i < 600; i++) { assert.deepEqual(a.step(), b.step()); assert.deepEqual(a.snapshot(), b.snapshot()); }
});
test('malformed input/scenario rejected, no duplicate or decreasing frame ticks', () => {
  for (const frames of [[{ tick: 0 }, { tick: 0 }], [{ tick: 2 }, { tick: 1 }], [{ tick: -1 }], [{ tick: 0, move: [2, 0] }], [{ tick: 0, pulse: 1 }]]) {
    assert.throws(() => validateInputs({ frames }));
  }
  for (const scenario of [null, { motes: [[0, 0]] }, { shades: [{ pos: [0, 0, 0], id: 'a' }, { pos: [1, 0, 0], id: 'a' }] }, { lanterns: [{ id: 'L6' }] }, { player: { carried: -1 } }]) {
    assert.throws(() => validateScenario(scenario, t));
  }
});
