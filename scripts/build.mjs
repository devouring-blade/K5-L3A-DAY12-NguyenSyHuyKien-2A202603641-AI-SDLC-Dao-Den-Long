import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = fileURLToPath(new URL('../', import.meta.url));
const dest = path.join(root, 'dist');
fs.mkdirSync(path.join(dest, 'vendor'), { recursive: true });
for (const name of ['index.html', 'style.css', 'app.mjs']) fs.copyFileSync(path.join(root, 'web', name), path.join(dest, name));
fs.copyFileSync(path.join(root, 'src/simulation.mjs'), path.join(dest, 'simulation.mjs'));
for (const name of ['world.mjs', 'validation.mjs']) fs.copyFileSync(path.join(root, 'src', name), path.join(dest, name));
fs.copyFileSync(path.join(root, 'node_modules/three/LICENSE'), path.join(dest, 'vendor/LICENSE-three.txt'));
for (const name of ['three.module.js', 'three.core.js']) fs.copyFileSync(path.join(root, 'node_modules/three/build', name), path.join(dest, 'vendor', name));
const contract = JSON.parse(fs.readFileSync(path.join(root, 'game.contract.json'), 'utf8'));
fs.writeFileSync(path.join(dest, 'config.mjs'), 'export const tuning = ' + JSON.stringify(contract.tuning) + ';\n');
console.log('Built static game in dist/ (no CDN or runtime network dependency).');
