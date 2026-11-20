import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

const root = fileURLToPath(new URL('../', import.meta.url));
const cli = path.join(root, 'src/cli.mjs');
function fixture(t) {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'lantern-cli-'));
  t.after(() => fs.rmSync(dir, { recursive: true, force: true }));
  const save = (name, value) => { const p = path.join(dir, name); fs.writeFileSync(p, typeof value === 'string' ? value : JSON.stringify(value)); return p; };
  const execute = (extra = [], ticks = 60, name = 'out.jsonl') => {
    const out = path.join(dir, name);
    const child = spawnSync(process.execPath, [cli, '--seed', '42', '--night', '1', '--ticks', String(ticks), '--out', out, ...extra], { cwd: root, encoding: 'utf8' });
    const raw = fs.existsSync(out) ? fs.readFileSync(out, 'utf8') : '';
    return { ...child, raw, lines: raw.trim() ? raw.trim().split('\n').map(JSON.parse) : [] };
  };
  return { save, execute };
}
test('CLI keeps sparse fields, writes tick 0, scheduled snapshots and final end', t => {
  const f = fixture(t);
  const scenario = f.save('scenario.json', { random_motes: false, random_shades: false });
  const inputs = f.save('inputs.json', { frames: [{ tick: 0, move: [0, 1] }, { tick: 30, jump: true }] });
  const r = f.execute(['--scenario', scenario, '--inputs', inputs]);
  assert.equal(r.status, 0, r.stderr); assert.equal(r.stdout, '');
  const snaps = r.lines.filter(l => l.type === 'snapshot');
  assert.deepEqual(snaps.map(s => s.tick), [0, 10, 20, 30, 40, 50, 60]);
  assert.deepEqual(snaps[0].player.pos, [0, 0, 0]);
  assert.equal(snaps.at(-1).player.pos[2], 6);
  assert.equal(r.lines.at(-1).type, 'end'); assert.equal(r.lines.at(-1).ticks, 60);
});
test('zero ticks emits initial snapshot and end without collecting nearby mote', t => {
  const f = fixture(t);
  const scenario = f.save('scenario.json', { random_motes: false, random_shades: false, motes: [[0, 0, 0]] });
  const r = f.execute(['--scenario', scenario], 0);
  assert.equal(r.status, 0); assert.equal(r.lines.length, 2);
  assert.equal(r.lines[0].player.carried, 0); assert.equal(r.lines[1].ticks, 0);
});
test('CLI stops early on terminal and event uses produced tick', t => {
  const f = fixture(t);
  const scenario = f.save('scenario.json', { random_motes: false, random_shades: false, time_left_s: 1 / 60 });
  const r = f.execute(['--scenario', scenario], 200);
  assert.equal(r.status, 0); assert.deepEqual(r.lines.at(-1), { type: 'end', ticks: 1, state: 'lost', score: 0 });
  assert.equal(r.lines.find(l => l.name === 'game_over').tick, 1);
});
test('CLI deterministic byte for byte across independent processes', t => {
  const f = fixture(t);
  const inputs = f.save('inputs.json', { frames: [{ tick: 0, move: [1, 0] }, { tick: 100, move: [0, 0] }] });
  const a = f.execute(['--inputs', inputs], 1000, 'a.jsonl');
  const b = f.execute(['--inputs', inputs], 1000, 'b.jsonl');
  assert.equal(a.status, 0); assert.equal(b.status, 0); assert.equal(a.raw, b.raw);
});
test('invalid JSON, schema, duplicate ticks, missing files and invalid flags return 2', t => {
  const f = fixture(t);
  const cases = [
    ['--scenario', f.save('bad.json', '{')],
    ['--scenario', f.save('null.json', null)],
    ['--scenario', f.save('pos.json', { player: { pos: [0, 1] } })],
    ['--inputs', f.save('frames.json', { frames: [{ tick: 1 }, { tick: 1 }] })],
    ['--inputs', f.save('bool.json', { frames: [{ tick: 0, interact: 'yes' }] })],
    ['--inputs', path.join(os.tmpdir(), 'lantern-file-that-does-not-exist.json')],
    ['--snapshot-every', '0'], ['--unknown', '1'], ['--seed', '1'], ['--night', '2']
  ];
  for (const flags of cases) {
    const r = f.execute(flags);
    assert.equal(r.status, 2, JSON.stringify(flags)); assert.match(r.stderr, /Headless error:/); assert.equal(r.stdout, '');
  }
});
