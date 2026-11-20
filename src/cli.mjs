import fs from 'node:fs';
import { Game, validateInputs } from './simulation.mjs';

function main() {
  const args = process.argv.slice(2);
  const options = {};
  const allowed = ['seed', 'night', 'scenario', 'inputs', 'ticks', 'out', 'snapshot-every'];
  for (let i = 0; i < args.length; i += 2) {
    const name = args[i].startsWith('--') ? args[i].slice(2) : '';
    if (!allowed.includes(name) || args[i + 1] === undefined || name in options) throw new Error('Invalid or duplicate argument: ' + args[i]);
    options[name] = args[i + 1];
  }
  const int = (key, fallback, min = 0) => {
    const v = options[key] ?? fallback;
    if (v === undefined || !/^-?\d+$/.test(String(v)) || !Number.isSafeInteger(Number(v)) || Number(v) < min) throw new Error('Invalid --' + key);
    return Number(v);
  };
  const seed = int('seed', 1, Number.MIN_SAFE_INTEGER);
  const night = int('night', 1, 1);
  const ticks = int('ticks');
  const every = int('snapshot-every', 10, 1);
  if (night !== 1) throw new Error('Phase 1 supports --night 1 only');
  if (!options.out) throw new Error('--out is required');
  const read = path => JSON.parse(fs.readFileSync(path, 'utf8'));
  const { tuning } = read(new URL('../game.contract.json', import.meta.url));
  const scenario = options.scenario ? read(options.scenario) : {};
  const frames = options.inputs ? validateInputs(read(options.inputs)) : [];
  const game = new Game(tuning, seed, scenario);
  let fd;
  try {
    fd = fs.openSync(options.out, 'w');
    const line = value => fs.writeSync(fd, JSON.stringify(value) + '\n');
    line(game.snapshot());
    let frame = 0;
    for (let k = 0; k < ticks && game.state === 'playing'; k++) {
      const patch = frames[frame]?.tick === k ? frames[frame++] : {};
      const { tick: ignored, ...input } = patch;
      for (const event of game.step(input)) line(event);
      if (game.tick % every === 0) line(game.snapshot());
    }
    line(game.end());
  } finally { if (fd !== undefined) fs.closeSync(fd); }
}

try { main(); }
catch (error) {
  process.stderr.write('Headless error: ' + error.message + '\n');
  process.exitCode = error.code && ['EACCES', 'EPERM', 'ENOSPC'].includes(error.code) ? 1 : 2;
}
