import * as THREE from './vendor/three.module.js';
import { Game, DT, ISLAND_RADIUS } from './simulation.mjs';
import { tuning } from './config.mjs';

const $ = id => document.getElementById(id);
let renderer;
try {
  renderer = new THREE.WebGLRenderer({ antialias: true, powerPreference: 'high-performance' });
} catch {
  $('loading').classList.add('hidden');
  $('error').classList.remove('hidden');
  $('error').textContent = 'Trình duyệt chưa bật WebGL. Hãy bật tăng tốc đồ họa hoặc mở bằng Chrome, Firefox, Edge mới. Chế độ headless vẫn chạy độc lập bằng Node.js.';
  throw new Error('WebGL is unavailable');
}
renderer.setPixelRatio(Math.min(devicePixelRatio, 1.7));
renderer.setSize(innerWidth, innerHeight);
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;
renderer.toneMapping = THREE.ACESFilmicToneMapping;
renderer.toneMappingExposure = 1.25;
$('scene').appendChild(renderer.domElement);

const scene = new THREE.Scene();
scene.background = new THREE.Color('#102a39');
scene.fog = new THREE.FogExp2('#173946', 0.0085);
const camera = new THREE.PerspectiveCamera(47, innerWidth / innerHeight, 0.1, 250);
const ambient = new THREE.HemisphereLight('#c9e5e4', '#152b31', 2.1);
scene.add(ambient);
const moonlight = new THREE.DirectionalLight('#b9d9e1', 2.1);
moonlight.position.set(-18, 35, -18); moonlight.castShadow = true;
moonlight.shadow.mapSize.set(2048, 2048);
Object.assign(moonlight.shadow.camera, { left: -40, right: 40, top: 40, bottom: -40, near: 1, far: 100 });
moonlight.shadow.bias = -0.001;
scene.add(moonlight);
const warmFill = new THREE.DirectionalLight('#f9bc80', 0.65); warmFill.position.set(25, 12, 15); scene.add(warmFill);

const mat = (color, roughness = 0.9, extra = {}) => new THREE.MeshStandardMaterial({ color, roughness, ...extra });
const materials = {
  ground: mat('#416557'), cliff: mat('#253e3f'), path: mat('#6e8670'), wood: mat('#604e43'),
  leaf: mat('#487d68'), leafLight: mat('#699982'), stone: mat('#637c6f'), hat: mat('#e6c794'),
  skin: mat('#edc29a'), cloth: mat('#638b9d'), dark: mat('#243d4a'), lamp: mat('#ffce7c', .5, { emissive: '#ffae42', emissiveIntensity: 1.5 })
};
function mesh(geometry, material, parent, position = [0, 0, 0], scale) {
  const m = new THREE.Mesh(geometry, material); m.position.fromArray(position);
  if (scale) m.scale.fromArray(scale);
  m.castShadow = true; m.receiveShadow = true; parent.add(m); return m;
}
const sphere = new THREE.SphereGeometry(1, 12, 8);
const cylinder = (r1, r2, h, n = 10) => new THREE.CylinderGeometry(r1, r2, h, n);
const island = new THREE.Group(); scene.add(island);
mesh(cylinder(34, 29, 5.5, 80), materials.cliff, island, [0, -2.8, 0]);
mesh(cylinder(34.1, 34, 0.25, 80), materials.ground, island, [0, -0.1, 0]);
mesh(new THREE.DodecahedronGeometry(22, 0), materials.cliff, island, [0, -14, 0], [1.1, .5, 1.08]);
const pathRing = mesh(new THREE.TorusGeometry(18, .46, 5, 100), materials.path, island, [0, -.28, 0]); pathRing.rotation.x = Math.PI / 2;
for (let i = 0; i < 5; i++) {
  const angle = i * Math.PI * 2 / 5;
  const m = mesh(new THREE.BoxGeometry(1.25, .02, 18), materials.path, island, [Math.sin(angle) * 9, .03, Math.cos(angle) * 9]); m.rotation.y = angle;
}
// Deterministic decoration, independent from simulation RNG and headless output.
let decoSeed = 918;
const rand = () => { decoSeed = (Math.imul(decoSeed, 1664525) + 1013904223) >>> 0; return decoSeed / 4294967296; };
const grass = new THREE.InstancedMesh(new THREE.ConeGeometry(.11, .48, 3), mat('#769978'), 380);
const dummy = new THREE.Object3D();
for (let i = 0; i < 380; i++) {
  const a = rand() * Math.PI * 2, r = 4 + Math.sqrt(rand()) * 28;
  dummy.position.set(Math.cos(a) * r, .2, Math.sin(a) * r);
  dummy.scale.setScalar(.7 + rand() * .8); dummy.rotation.y = rand() * Math.PI; dummy.updateMatrix(); grass.setMatrixAt(i, dummy.matrix);
}
island.add(grass);
for (let i = 0; i < 16; i++) {
  const a = i * Math.PI * 2 / 16 + .12, r = 27 + rand() * 4;
  const tree = new THREE.Group(); tree.position.set(Math.sin(a) * r, 0, Math.cos(a) * r);
  mesh(cylinder(.19, .36, 2.7, 7), materials.wood, tree, [0, 1.2, 0]);
  mesh(new THREE.IcosahedronGeometry(1.7, 1), i % 3 ? materials.leaf : materials.leafLight, tree, [0, 3.3, 0], [1, 1.2, 1]);
  mesh(new THREE.IcosahedronGeometry(1.1, 0), materials.leaf, tree, [.9, 2.6, .3]);
  tree.scale.setScalar(.8 + rand() * .4); island.add(tree);
}
for (let i = 0; i < 35; i++) {
  const a = rand() * Math.PI * 2, r = 30 + rand() * 4;
  mesh(new THREE.DodecahedronGeometry(.5 + rand() * .8), materials.stone, island, [Math.sin(a) * r, .15, Math.cos(a) * r], [1.4, .6, 1]);
}
// Small keeper's shelter: original procedural geometry.
const shelter = new THREE.Group(); shelter.position.set(-12, 0, 9); shelter.rotation.y = -.5;
mesh(new THREE.BoxGeometry(3.3, 2.6, 2.5), mat('#49615d'), shelter, [0, 1.3, 0]);
const roof = mesh(new THREE.ConeGeometry(3.1, 1.7, 4), materials.wood, shelter, [0, 3.2, 0], [1, .8, .85]); roof.rotation.y = Math.PI / 4;
mesh(new THREE.BoxGeometry(.75, 1.6, .05), materials.dark, shelter, [0, .8, 1.27]);
mesh(new THREE.BoxGeometry(.55, .65, .06), materials.lamp, shelter, [-1, 1.6, 1.28]);
island.add(shelter);

const cloudMat = new THREE.MeshStandardMaterial({ color: '#577984', roughness: 1, transparent: true, opacity: .45, depthWrite: false });
const clouds = new THREE.Group(); scene.add(clouds);
for (let i = 0; i < 55; i++) {
  const a = rand() * Math.PI * 2, r = 40 + rand() * 65;
  mesh(sphere, cloudMat, clouds, [Math.sin(a) * r, -6 - rand() * 7, Math.cos(a) * r], [6 + rand() * 10, 1.3 + rand() * 2, 5 + rand() * 9]);
}
const starsGeo = new THREE.BufferGeometry();
const starsPos = [];
for (let i = 0; i < 350; i++) starsPos.push((rand() - .5) * 240, 30 + rand() * 65, (rand() - .5) * 240);
starsGeo.setAttribute('position', new THREE.Float32BufferAttribute(starsPos, 3));
scene.add(new THREE.Points(starsGeo, new THREE.PointsMaterial({ color: '#d6e9da', size: .12, transparent: true, opacity: .65 })));
mesh(sphere, new THREE.MeshBasicMaterial({ color: '#dce4c5' }), scene, [-48, 48, -75], [3, 3, 3]);

const glowCanvas = document.createElement('canvas'); glowCanvas.width = glowCanvas.height = 64;
const glowCtx = glowCanvas.getContext('2d');
const gradient = glowCtx.createRadialGradient(32, 32, 0, 32, 32, 32);
gradient.addColorStop(0, '#ffffffff'); gradient.addColorStop(.13, '#ffffffdd'); gradient.addColorStop(.4, '#ffffff44'); gradient.addColorStop(1, '#ffffff00');
glowCtx.fillStyle = gradient; glowCtx.fillRect(0, 0, 64, 64);
const glowTexture = new THREE.CanvasTexture(glowCanvas);
function glow(parent, color, size, position = [0, 0, 0]) {
  const sprite = new THREE.Sprite(new THREE.SpriteMaterial({ map: glowTexture, color, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending }));
  sprite.position.fromArray(position); sprite.scale.set(size, size, 1); parent.add(sprite); return sprite;
}

const playerModel = new THREE.Group(); scene.add(playerModel);
mesh(cylinder(.25, .35, .65), materials.cloth, playerModel, [0, .85, 0]);
mesh(sphere, materials.skin, playerModel, [0, 1.35, 0], [.25, .27, .24]);
mesh(new THREE.ConeGeometry(.66, .36, 32), materials.hat, playerModel, [0, 1.65, 0]);
mesh(cylinder(.65, .65, .025, 32), materials.hat, playerModel, [0, 1.47, 0]);
mesh(new THREE.BoxGeometry(.12, .045, .02), materials.dark, playerModel, [0, 1.34, -.24]);
const legs = [-.15, .15].map(x => mesh(new THREE.CapsuleGeometry(.105, .3, 3, 6), materials.dark, playerModel, [x, .32, 0]));
mesh(cylinder(.025, .025, .5, 5), materials.wood, playerModel, [.6, 1.2, 0]);
mesh(sphere, materials.lamp, playerModel, [.6, .88, 0], [.15, .22, .15]);
glow(playerModel, '#ffb24c', 1.5, [.6, .9, 0]);
const playerLight = new THREE.PointLight('#ffb95c', 5, 8, 2); playerLight.position.set(.5, 1.1, 0); playerModel.add(playerLight);

const lanternModels = new Map(), moteModels = new Map(), shadeModels = new Map();
function makeLantern(l) {
  const group = new THREE.Group(); group.position.fromArray(l.pos); scene.add(group);
  mesh(cylinder(.8, 1, .3), materials.stone, group, [0, .15, 0]);
  mesh(cylinder(.12, .18, 2.8, 8), materials.wood, group, [0, 1.6, 0]);
  const lampMat = mat('#ab9171', .7, { emissive: '#ffad46', emissiveIntensity: .06 });
  mesh(new THREE.SphereGeometry(.58, 12, 10), lampMat, group, [0, 3.1, 0], [.85, 1.15, .85]);
  mesh(new THREE.ConeGeometry(.88, .36, 8), materials.wood, group, [0, 3.8, 0]);
  mesh(cylinder(.22, .22, .1), materials.wood, group, [0, 2.43, 0]);
  for (let i = 0; i < 4; i++) {
    const a = i * Math.PI / 2;
    mesh(new THREE.BoxGeometry(.035, 1.1, .035), materials.wood, group, [Math.sin(a) * .44, 3.1, Math.cos(a) * .44]);
  }
  const halo = glow(group, '#ffc365', 5, [0, 3.1, 0]); halo.material.opacity = .06;
  const light = new THREE.PointLight('#ffba5f', 0, 15, 2); light.position.set(0, 3, 0); group.add(light);
  const safe = mesh(new THREE.RingGeometry(tuning.safe_radius - .04, tuning.safe_radius, 64), new THREE.MeshBasicMaterial({ color: '#ffcf86', transparent: true, opacity: .14, side: THREE.DoubleSide, depthWrite: false }), group, [0, .045, 0]); safe.rotation.x = -Math.PI / 2; safe.visible = false;
  const beacon = mesh(cylinder(.05, .05, 15, 8), new THREE.MeshBasicMaterial({ color: '#b7dfd0', transparent: true, opacity: .13, depthWrite: false }), group, [0, 10.7, 0]);
  return { group, lampMat, halo, light, safe, beacon };
}
function makeShade(sh) {
  const group = new THREE.Group(); scene.add(group);
  const body = mat('#242139', .8, { emissive: '#24132b', emissiveIntensity: .4 });
  mesh(sphere, body, group, [0, .85, 0], [.68, .85, .64]);
  mesh(new THREE.ConeGeometry(.5, 1.1, 8), body, group, [0, .25, 0]);
  const eyes = new THREE.MeshBasicMaterial({ color: '#e4b6ed' });
  mesh(sphere, eyes, group, [-.22, 1.05, -.55], [.08, .1, .045]); mesh(sphere, eyes, group, [.22, 1.05, -.55], [.08, .1, .045]);
  const aura = glow(group, '#9259b0', 2.5, [0, .6, 0]); aura.material.opacity = .4;
  return { group, body, aura };
}
const pulseRing = mesh(new THREE.RingGeometry(.92, 1, 80), new THREE.MeshBasicMaterial({ color: '#ffe4a2', transparent: true, opacity: 0, side: THREE.DoubleSide, depthWrite: false }), scene);
pulseRing.rotation.x = -Math.PI / 2;

let game = new Game(tuning, 12), mode = 'intro', previousMode = 'playing';
let yaw = 0, accumulator = 0, last = performance.now(), pulseTime = -10, toastUntil = 0;
let audio, soundOn = false, drag = null, performanceFrames = 0, fps = 0;
const keys = new Set();
function chime(freq = 660, duration = .18, volume = .035) {
  if (!soundOn) return;
  audio ??= new AudioContext();
  const osc = audio.createOscillator(), gain = audio.createGain();
  osc.type = 'sine'; osc.frequency.setValueAtTime(freq, audio.currentTime);
  gain.gain.setValueAtTime(volume, audio.currentTime); gain.gain.exponentialRampToValueAtTime(.001, audio.currentTime + duration);
  osc.connect(gain); gain.connect(audio.destination); osc.start(); osc.stop(audio.currentTime + duration);
}
function toast(text) { $('toast').textContent = text; $('toast').classList.add('show'); toastUntil = performance.now() + 2500; }
function setPlayUI(playing) {
  document.body.classList.toggle('playing', playing);
  for (const id of ['objective', 'mapbox', 'play-controls']) $(id).classList.toggle('hidden', !playing);
  $('intro').classList.toggle('hidden', playing);
}
function begin() {
  keys.clear(); game = new Game(tuning, 12); yaw = 0; accumulator = 0; mode = 'playing'; pulseTime = -10;
  $('dialog').classList.add('hidden'); setPlayUI(true); $('game').focus();
  toast('Đến gần đom đóm để gom ánh sáng.'); updateHUD();
}
function showDialog(help = false, terminal = false) {
  if (mode === 'paused') return;
  previousMode = mode; mode = 'paused'; keys.clear();
  $('dialog').classList.remove('hidden'); $('help-text').classList.toggle('hidden', !help);
  $('resume').classList.toggle('hidden', terminal);
  $('dialog-label').textContent = terminal ? 'HÀNH TRÌNH ĐÊM 01' : help ? 'BỎ TÚI MỘT CHÚT ÁNH SÁNG' : 'MỘT KHOẢNG LẶNG';
  $('dialog-title').textContent = terminal ? (game.state === 'won' ? 'Đảo Bến đã sáng rồi.' : 'Hẹn Mây một đêm khác.') : help ? 'Làm người giữ đèn.' : 'Đêm vẫn đang chờ.';
  $('dialog-text').textContent = terminal ? (game.state === 'won' ? 'Năm ngọn đèn đã thức giấc. ' : game.player.flames === 0 ? 'Ngọn lửa cuối cùng đã tắt. ' : 'Bình minh đã đến trước khi thắp đủ đèn. ') + 'Điểm hành trình: ' + game.score + '.' : help ? 'Gom ánh sáng. Tránh sương đen. Tìm về những ngọn đèn.' : 'Nghỉ một chút. Ánh sáng vẫn ở đây.';
  $('restart').textContent = terminal ? 'Chơi lại đêm 1' : 'Bắt đầu lại';
  (terminal ? $('restart') : $('resume')).focus();
}
function resume() { if (game.state !== 'playing') return; mode = previousMode; $('dialog').classList.add('hidden'); accumulator = 0; keys.clear(); $('game').focus(); }
$('start').onclick = begin; $('restart').onclick = begin; $('resume').onclick = resume;
$('help').onclick = () => showDialog(true);
$('pause').onclick = () => mode === 'paused' ? resume() : showDialog();
$('sound').onclick = async () => {
  soundOn = !soundOn;
  if (soundOn) { audio ??= new AudioContext(); await audio.resume(); chime(); }
  $('sound').textContent = 'Âm thanh: ' + (soundOn ? 'bật' : 'tắt');
  $('sound').setAttribute('aria-label', soundOn ? 'Tắt âm thanh' : 'Bật âm thanh');
};
document.addEventListener('keydown', e => {
  if (['Space', 'ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'].includes(e.code)) e.preventDefault();
  if (e.code === 'KeyP' || e.code === 'Escape') { if (!e.repeat) mode === 'paused' ? resume() : showDialog(); return; }
  if (e.code === 'KeyH' && !e.repeat) { showDialog(true); return; }
  if (mode === 'playing') keys.add(e.code);
});
document.addEventListener('keyup', e => keys.delete(e.code));
window.addEventListener('blur', () => { keys.clear(); if (mode === 'playing') showDialog(); });
document.addEventListener('visibilitychange', () => { if (document.hidden && mode === 'playing') showDialog(); });
renderer.domElement.addEventListener('pointerdown', e => { if (mode === 'playing') { drag = e.clientX; renderer.domElement.setPointerCapture(e.pointerId); } });
renderer.domElement.addEventListener('pointermove', e => { if (drag !== null) { yaw -= (e.clientX - drag) * .35; drag = e.clientX; } });
renderer.domElement.addEventListener('pointerup', () => drag = null);

function updateHUD() {
  const lit = game.lanterns.filter(l => l.lit).length;
  $('flames').textContent = Array.from({ length: tuning.flames }, (_, i) => i < game.player.flames ? '◆' : '◇').join(' ');
  $('flames').setAttribute('aria-label', game.player.flames + ' ngọn lửa còn lại');
  $('carried').textContent = game.player.carried;
  const seconds = Math.ceil(game.timeLeft);
  $('timer').textContent = String(Math.floor(seconds / 60)).padStart(2, '0') + ':' + String(seconds % 60).padStart(2, '0');
  $('score').textContent = String(game.score).padStart(4, '0');
  $('litcount').textContent = lit + ' / 5 ĐÈN';
  $('lantern-progress').replaceChildren(...game.lanterns.map(l => { const el = document.createElement('span'); el.className = l.lit ? 'lit' : ''; el.title = l.id + (l.lit ? ': đã thắp' : ': ' + l.deposited + '/6'); return el; }));
  const near = game.lanterns.find(l => !l.lit && Math.hypot(l.pos[0] - game.player.pos[0], l.pos[2] - game.player.pos[2]) <= tuning.interact_radius);
  $('interaction').classList.toggle('hidden', !near || mode !== 'playing');
  if (near) $('interaction').querySelector('span').textContent = game.player.carried ? `Nạp ánh sáng · ${near.id} (${near.deposited}/6)` : 'Cần đom đóm để thắp đèn';
}
function processEvents(events, time) {
  for (const e of events) {
    if (e.name === 'mote_picked') { chime(620 + (e.data.carried % 5) * 85, .13, .025); if (e.data.carried === tuning.carry_capacity) toast('Túi đã đầy. Mang ánh sáng về một ngọn đèn nhé.'); }
    if (e.name === 'lantern_lit') { toast('Một ngọn đèn thức giấc. Nơi này đã an toàn.'); chime(880, .8, .07); }
    if (e.name === 'deposit' && !game.lanterns.find(l => l.id === e.data.lantern_id).lit) toast('Đã nạp ' + e.data.amount + ' đom đóm. Gom thêm để thắp đèn.');
    if (e.name === 'pulse') { pulseTime = time; pulseRing.position.set(game.player.pos[0], .12, game.player.pos[2]); chime(220, .4, .06); }
    if (e.name === 'player_hit') { toast('Bóng Mực đến gần! Tìm vùng sáng để trú ẩn.'); document.body.classList.remove('hit-flash'); void document.body.offsetWidth; document.body.classList.add('hit-flash'); chime(130, .5, .045); }
    if (e.name === 'game_over') showDialog(false, true);
  }
}
function syncModels(time) {
  const p = game.player.pos;
  playerModel.position.fromArray(p);
  const moving = Math.hypot(...game.input.move) > 0 && mode === 'playing';
  legs.forEach((leg, i) => leg.rotation.x = moving ? Math.sin(time * 12 + i * Math.PI) * .5 : 0);
  if (moving) {
    const a = yaw * Math.PI / 180;
    const dx = game.input.move[0] * Math.cos(a) + game.input.move[1] * Math.sin(a);
    const dz = -game.input.move[0] * Math.sin(a) + game.input.move[1] * Math.cos(a);
    playerModel.rotation.y = Math.atan2(-dx, -dz);
  }
  playerModel.visible = !(game.tick < game.invulnUntil && Math.floor(time * 12) % 2);
  for (const l of game.lanterns) {
    if (!lanternModels.has(l.id)) lanternModels.set(l.id, makeLantern(l));
    const model = lanternModels.get(l.id); model.group.position.fromArray(l.pos);
    model.lampMat.emissiveIntensity = l.lit ? 2 : .05 + l.deposited / 6 * .6;
    model.halo.material.opacity = l.lit ? .65 + Math.sin(time * 2) * .04 : .06;
    model.light.intensity = l.lit ? 23 : 0; model.safe.visible = l.lit; model.beacon.visible = !l.lit;
  }
  const currentMotes = new Set(game.motes.map(m => m.id));
  for (const [id, model] of moteModels) if (!currentMotes.has(id)) { scene.remove(model); model.material.dispose(); moteModels.delete(id); }
  for (const m of game.motes) {
    if (!moteModels.has(m.id)) moteModels.set(m.id, glow(scene, '#f8e79b', .95));
    const sprite = moteModels.get(m.id);
    const phase = Number(m.id.slice(1)) * 1.71;
    sprite.position.set(m.pos[0] + Math.sin(time * 1.8 + phase) * .15, .55 + Math.sin(time * 2.4 + phase) * .2, m.pos[2]);
    sprite.material.opacity = .6 + Math.sin(time * 3 + phase) * .3;
  }
  const currentShades = new Set(game.shades.map(s => s.id));
  for (const [id, model] of shadeModels) if (!currentShades.has(id)) { scene.remove(model.group); model.body.dispose(); model.aura.material.dispose(); shadeModels.delete(id); }
  for (const sh of game.shades) {
    if (!shadeModels.has(sh.id)) shadeModels.set(sh.id, makeShade(sh));
    const model = shadeModels.get(sh.id);
    model.group.position.set(sh.pos[0], sh.pos[1] + Math.sin(time * 3) * .12, sh.pos[2]);
    model.group.rotation.y = Math.atan2(sh.pos[0] - p[0], sh.pos[2] - p[2]);
    model.body.color.set(sh.state === 'stunned' ? '#665a84' : '#242139');
    model.aura.material.color.set(sh.state === 'stunned' ? '#ffd484' : '#9259b0');
  }
  const pulseAge = time - pulseTime;
  pulseRing.visible = pulseAge < .65;
  if (pulseRing.visible) { pulseRing.scale.setScalar(.5 + pulseAge / .65 * tuning.pulse_radius); pulseRing.material.opacity = (1 - pulseAge / .65) * .7; }
  const lit = game.lanterns.filter(l => l.lit).length;
  ambient.intensity = 2.1 + lit * .12;
  clouds.rotation.y = time * .001;
}
const map = $('minimap').getContext('2d');
function drawMap() {
  const w = 180, c = 90, scale = 2;
  map.clearRect(0, 0, w, w); map.save(); map.translate(c, c);
  map.beginPath(); map.arc(0, 0, ISLAND_RADIUS * scale, 0, Math.PI * 2); map.fillStyle = '#32564e'; map.fill(); map.strokeStyle = '#71938266'; map.stroke();
  for (const l of game.lanterns) {
    map.beginPath(); map.arc(l.pos[0] * scale, l.pos[2] * scale, l.lit ? 9 : 5, 0, Math.PI * 2);
    map.fillStyle = l.lit ? '#ffcc7c44' : '#829a87'; map.fill();
    if (l.lit) { map.beginPath(); map.arc(l.pos[0] * scale, l.pos[2] * scale, 4, 0, Math.PI * 2); map.fillStyle = '#ffd493'; map.fill(); }
  }
  for (const sh of game.shades) { map.beginPath(); map.arc(sh.pos[0] * scale, sh.pos[2] * scale, 2, 0, Math.PI * 2); map.fillStyle = '#c496cf'; map.fill(); }
  map.translate(game.player.pos[0] * scale, game.player.pos[2] * scale); map.rotate(-yaw * Math.PI / 180);
  map.beginPath(); map.moveTo(0, -5); map.lineTo(4, 5); map.lineTo(0, 3); map.lineTo(-4, 5); map.closePath(); map.fillStyle = '#fff2c9'; map.fill(); map.restore();
}
const cameraTarget = new THREE.Vector3(), cameraPosition = new THREE.Vector3();
function animate(now) {
  requestAnimationFrame(animate);
  const elapsed = Math.min((now - last) / 1000, .1); last = now; const time = now / 1000;
  if (mode === 'playing') {
    if (keys.has('KeyQ')) yaw += elapsed * 90;
    if (keys.has('KeyC')) yaw -= elapsed * 90;
    accumulator += elapsed;
    while (accumulator >= DT && mode === 'playing') {
      const x = Number(keys.has('KeyD') || keys.has('ArrowRight')) - Number(keys.has('KeyA') || keys.has('ArrowLeft'));
      const z = Number(keys.has('KeyS') || keys.has('ArrowDown')) - Number(keys.has('KeyW') || keys.has('ArrowUp'));
      processEvents(game.step({ move: [x, z], cam_yaw_deg: yaw, jump: keys.has('Space'), interact: keys.has('KeyE'), pulse: keys.has('KeyF') }), time);
      accumulator -= DT;
    }
  }
  if (now > toastUntil) $('toast').classList.remove('show');
  syncModels(time);
  if (mode === 'intro' || (mode === 'paused' && previousMode === 'intro')) {
    cameraPosition.set(41, 34, 43); cameraTarget.set(-1, 1, 0);
    // Shift island to the right of the intro's copy without moving the world.
    camera.setViewOffset(innerWidth, innerHeight, -innerWidth * .18, 0, innerWidth, innerHeight);
  } else {
    camera.clearViewOffset();
    const p = game.player.pos, a = yaw * Math.PI / 180;
    cameraPosition.set(p[0] + Math.sin(a) * 11.5, p[1] + 7.8, p[2] + Math.cos(a) * 11.5);
    cameraTarget.set(p[0], p[1] + .8, p[2]);
  }
  camera.position.lerp(cameraPosition, mode === 'intro' ? .04 : .12); camera.lookAt(cameraTarget);
  updateHUD(); drawMap(); renderer.render(scene, camera);
  performanceFrames++;
  if (performanceFrames % 60 === 0) { fps = Math.round(1 / Math.max(elapsed, .001)); $('scene').dataset.fps = fps; }
}
camera.position.set(41, 34, 43);
window.addEventListener('resize', () => { camera.aspect = innerWidth / innerHeight; camera.updateProjectionMatrix(); renderer.setSize(innerWidth, innerHeight); });
$('loading').classList.add('hidden'); updateHUD(); requestAnimationFrame(animate);
