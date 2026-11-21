import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
const root = fileURLToPath(new URL('../', import.meta.url));
const temp = fs.mkdtempSync(path.join(os.tmpdir(), 'dao-den-long-clean-'));
const records = [];
try {
  for (const name of ['src', 'web', 'scripts', 'package.json', 'package-lock.json', 'game.contract.json']) fs.cpSync(path.join(root, name), path.join(temp, name), { recursive: true });
  const npm = process.env.npm_execpath;
  assert.ok(npm, 'Run through npm run smoke:clean');
  for (const args of [[npm, 'ci', '--offline', '--ignore-scripts', '--no-audit', '--no-fund'], ['scripts/build.mjs'], ['src/cli.mjs', '--seed', '12', '--night', '1', '--ticks', '60', '--out', 'smoke.jsonl']]) {
    const r = spawnSync(process.execPath, args, { cwd: temp, encoding: 'utf8' });
    records.push({ command: args.map(a => a === npm ? 'npm-cli' : a), status: r.status, stdout: r.stdout, stderr: r.stderr });
    assert.equal(r.status, 0, r.stderr);
  }
  assert.ok(fs.existsSync(path.join(temp, 'dist/vendor/three.module.js')));
  assert.ok(fs.existsSync(path.join(temp, 'dist/vendor/LICENSE-three.txt')));
  const lines = fs.readFileSync(path.join(temp, 'smoke.jsonl'), 'utf8').trim().split('\n').map(JSON.parse);
  assert.equal(lines.at(-1).ticks, 60);
  const contract=JSON.parse(fs.readFileSync(path.join(root,'game.contract.json'))),phase=Number(contract.contract_version.split('.')[1])+1;
  const proof=path.join(root,'docs/proof/phase-'+phase);fs.mkdirSync(proof,{recursive:true});
  fs.writeFileSync(path.join(proof,'clean-install.json'), JSON.stringify({ generated_at: new Date().toISOString(), platform: os.platform(), clean_directory: temp, passed: true, commands: records }, null, 2) + '\n');
  console.log('Clean directory: offline npm ci, static build and headless smoke passed.');
} catch (e) { console.error(e.message); process.exitCode = 1; }
finally { fs.rmSync(temp, { recursive: true, force: true }); }
