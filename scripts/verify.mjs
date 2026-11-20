import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import crypto from 'node:crypto';
import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import { performance } from 'node:perf_hooks';
import { fileURLToPath } from 'node:url';
import { Game, HZ } from '../src/simulation.mjs';

const root = fileURLToPath(new URL('../', import.meta.url));
const proof = path.join(root, 'docs/proof/phase-1');
fs.mkdirSync(proof, { recursive: true });
function command(args, logfile) {
  const result = spawnSync(process.execPath, args, { cwd: root, encoding: 'utf8', maxBuffer: 20 * 1024 * 1024 });
  if (logfile) fs.writeFileSync(path.join(proof, logfile), (result.stdout ?? '') + (result.stderr ?? ''));
  if (result.status !== 0) { process.stderr.write(result.stdout ?? ''); process.stderr.write(result.stderr ?? ''); throw new Error(`Verification failed (${result.status}): ${args.join(' ')}`); }
  return result;
}
function headless(name, args, ticks = 600) {
  const out = path.join(proof, name + '.jsonl');
  command(['src/cli.mjs', '--seed', '12', '--night', '1', '--ticks', String(ticks), '--out', out, ...args]);
  const raw = fs.readFileSync(out, 'utf8');
  return { raw, lines: raw.trim().split('\n').map(JSON.parse) };
}
try {
  // No synthetic PASS output: retain the real node:test report and stop on nonzero exit.
  const tests = fs.readdirSync(path.join(root, 'tests')).filter(f => f.endsWith('.test.mjs')).map(f => 'tests/' + f);
  command(['--test', '--test-reporter=tap', ...tests], 'tests.tap');
  command(['scripts/build.mjs'], 'build.txt');
  const collect = headless('collect-deposit', ['--scenario', 'tests/scenarios/collect-deposit.json', '--inputs', 'tests/scenarios/collect-deposit-inputs.json'], 20);
  assert.equal(collect.lines.filter(e => e.name === 'mote_picked').length, 6);
  assert.equal(collect.lines.filter(e => e.name === 'lantern_lit').length, 1);
  const combat = headless('pulse-hit', ['--scenario', 'tests/scenarios/pulse-hit.json', '--inputs', 'tests/scenarios/pulse-inputs.json'], 400);
  assert.deepEqual(combat.lines.find(e => e.name === 'pulse').data.stunned_ids, ['shade-close']);
  assert.ok(combat.lines.some(e => e.name === 'player_hit'));
  const dawn = headless('dawn', ['--scenario', 'tests/scenarios/dawn.json'], 100);
  assert.equal(dawn.lines.at(-1).state, 'lost');
  assert.equal(dawn.lines.at(-1).ticks, 3);

  // Derive ordinary controller inputs for the default world, then replay through CLI.
  // No scenario override, teleportation, injected resource, or change to game tuning.
  const { tuning } = JSON.parse(fs.readFileSync(path.join(root, 'game.contract.json'), 'utf8'));
  const game = new Game(tuning, 12);
  const frames = [];
  let previous = {};
  for (let tick = 0; tick < 18000 && game.state === 'playing'; tick++) {
    const p = game.player;
    const dist = entity => Math.hypot(entity.pos[0] - p.pos[0], entity.pos[2] - p.pos[2]);
    const lanterns = game.lanterns.filter(l => !l.lit).sort((a, b) => dist(a) - dist(b));
    const wantLantern = p.carried >= tuning.lantern_cost || (lanterns[0] && p.carried >= tuning.lantern_cost - lanterns[0].deposited);
    const motes = game.motes.filter(m => m.availableTick <= game.tick).sort((a, b) => dist(a) - dist(b));
    const target = wantLantern ? lanterns[0] : motes[0];
    let x = target ? target.pos[0] - p.pos[0] : 0;
    let z = target ? target.pos[2] - p.pos[2] : 0;
    const d = Math.hypot(x, z);
    if (d > 0) { x /= d; z /= d; }
    const danger = game.shades.some(s => s.state !== 'stunned' && dist(s) < 3.5);
    const input = { move: [x, z], interact: Boolean(wantLantern && target && d <= tuning.interact_radius && tick % 2 === 0), pulse: Boolean(danger && p.carried >= tuning.pulse_cost && tick % 2 === 0) };
    const frame = { tick };
    for (const [key, value] of Object.entries(input)) if (JSON.stringify(value) !== JSON.stringify(previous[key])) frame[key] = value;
    if (Object.keys(frame).length > 1) frames.push(frame);
    game.step(input); previous = input;
  }
  assert.equal(game.state, 'won', 'Default world controller must win with ordinary inputs');
  const inputPath = path.join(proof, 'default-win-inputs.json');
  fs.writeFileSync(inputPath, JSON.stringify({ frames }, null, 2) + '\n');
  const start = performance.now();
  const a = headless('default-win-a', ['--inputs', inputPath], 18000);
  const elapsedMs = performance.now() - start;
  const b = headless('default-win-b', ['--inputs', inputPath], 18000);
  assert.equal(a.raw, b.raw, 'Determinism check: outputs differ');
  assert.equal(a.lines.at(-1).state, 'won');
  assert.equal(a.lines.filter(e => e.name === 'lantern_lit').length, 5);
  const hash = crypto.createHash('sha256').update(a.raw).digest('hex');
  const sourceFiles = ['game.contract.json', 'src/simulation.mjs', 'src/cli.mjs', 'web/app.mjs', 'web/index.html', 'web/style.css'];
  const report = {
    generated_at: new Date().toISOString(),
    host: { platform: os.platform(), arch: os.arch(), node: process.version, cpu: os.cpus()[0]?.model, logical_cpus: os.cpus().length },
    tests: { report: 'tests.tap', exit_code: 0 },
    scenarios: ['collect-deposit', 'pulse-hit', 'dawn', 'default-win'],
    default_win: { ...a.lines.at(-1), simulated_seconds: game.tick / HZ, lanterns_lit: 5, elapsed_ms: Math.round(elapsedMs * 100) / 100 },
    deterministic: { identical: true, sha256: hash, files: ['default-win-a.jsonl', 'default-win-b.jsonl'] },
    source_sha256: Object.fromEntries(sourceFiles.map(f => [f, crypto.createHash('sha256').update(fs.readFileSync(path.join(root, f))).digest('hex')])),
    limits: ['Measured on the current Windows host only; not a macOS/Linux runtime certification.', 'Browser evidence is recorded separately; no graphics FPS threshold was published in Phase 1.', 'No hidden instructor tests available.']
  };
  fs.writeFileSync(path.join(proof, 'report.json'), JSON.stringify(report, null, 2) + '\n');
  console.log(`Verified tests, build, scenarios, full default-world win (${game.tick} ticks) and byte-identical replay.`);
  console.log('Evidence: docs/proof/phase-1/report.json');
} catch (error) { console.error(error.message); process.exitCode = 1; }
