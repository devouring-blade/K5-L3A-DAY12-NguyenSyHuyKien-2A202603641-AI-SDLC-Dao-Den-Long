export const HZ = 60;
export const DT = 1 / HZ;
export const ISLAND_RADIUS = 34;
export const PLAYER_BOUNDARY = 32;
const EPS = 1e-9;
const buttons = ['jump', 'interact', 'pulse', 'dash'];
const distance = (a, b) => Math.hypot(a[0] - b[0], a[2] - b[2]);
const copyPos = p => [...p];
const round = n => Math.round(n * 1000) / 1000 || 0;
const object = x => x !== null && typeof x === 'object' && !Array.isArray(x);
const finite = x => typeof x === 'number' && Number.isFinite(x);
const integer = x => Number.isSafeInteger(x) && x >= 0;
const vec3 = x => Array.isArray(x) && x.length === 3 && x.every(finite);
function requireValue(ok, message) { if (!ok) throw new Error(message); }

export function validateInputs(input) {
  requireValue(object(input) && Array.isArray(input.frames), 'inputs.frames must be an array');
  let previous = -1;
  for (const f of input.frames) {
    requireValue(object(f) && integer(f.tick) && f.tick > previous, 'input ticks must be nonnegative and strictly increasing');
    previous = f.tick;
    requireValue(Object.keys(f).every(k => ['tick', 'move', 'cam_yaw_deg', ...buttons].includes(k)), 'unknown input field');
    if ('move' in f) requireValue(Array.isArray(f.move) && f.move.length === 2 && f.move.every(v => finite(v) && v >= -1 && v <= 1), 'move must have two numbers in [-1,1]');
    if ('cam_yaw_deg' in f) requireValue(finite(f.cam_yaw_deg), 'cam_yaw_deg must be finite');
    for (const b of buttons) if (b in f) requireValue(typeof f[b] === 'boolean', b + ' must be boolean');
  }
  return input.frames;
}

export function validateScenario(s, t) {
  requireValue(object(s), 'scenario must be an object');
  if ('player' in s) {
    requireValue(object(s.player), 'player must be an object');
    if ('pos' in s.player) requireValue(vec3(s.player.pos), 'player.pos must be a finite XYZ vector');
    if ('carried' in s.player) requireValue(integer(s.player.carried) && s.player.carried <= t.carry_capacity, 'invalid player.carried');
    if ('flames' in s.player) requireValue(integer(s.player.flames), 'invalid player.flames');
  }
  for (const flag of ['random_motes', 'random_shades']) if (flag in s) requireValue(typeof s[flag] === 'boolean', flag + ' must be boolean');
  if ('time_left_s' in s) requireValue(finite(s.time_left_s) && s.time_left_s >= 0, 'invalid time_left_s');
  if ('motes' in s) requireValue(Array.isArray(s.motes) && s.motes.every(vec3), 'motes must be an array of XYZ vectors');
  if ('shades' in s) {
    requireValue(Array.isArray(s.shades), 'shades must be an array');
    const ids = new Set();
    for (let i = 0; i < s.shades.length; i++) {
      const sh = s.shades[i];
      requireValue(object(sh) && vec3(sh.pos), 'each shade requires a finite XYZ pos');
      const id = sh.id ?? 'S' + (i + 1);
      requireValue(typeof id === 'string' && id.length > 0 && !ids.has(id), 'shade ids must be nonempty and unique');
      ids.add(id);
    }
  }
  if ('lanterns' in s) {
    requireValue(Array.isArray(s.lanterns), 'lanterns must be an array');
    const ids = new Set();
    for (const l of s.lanterns) {
      requireValue(object(l) && /^L[1-5]$/.test(l.id) && !ids.has(l.id), 'lantern id must be unique and in L1..L5');
      ids.add(l.id);
      if ('pos' in l) requireValue(vec3(l.pos), 'lantern.pos must be a finite XYZ vector');
      if ('deposited' in l) requireValue(integer(l.deposited) && l.deposited <= t.lantern_cost, 'invalid lantern.deposited');
      if ('lit' in l) requireValue(typeof l.lit === 'boolean', 'lantern.lit must be boolean');
    }
  }
  return s;
}

export class Game {
  constructor(tuning, seed = 1, scenario = {}) {
    this.t = structuredClone(tuning);
    const s = validateScenario(scenario, this.t);
    this.rng = (seed >>> 0) || 0x9e3779b9;
    this.tick = 0;
    this.state = 'playing';
    this.score = 0;
    this.initialTime = s.time_left_s ?? this.t.night1_duration_s;
    this.timeLeft = this.initialTime;
    this.randomMotes = s.random_motes ?? true;
    this.randomShades = s.random_shades ?? true;
    this.player = { pos: copyPos(s.player?.pos ?? [0, 0, 0]), carried: s.player?.carried ?? 0, flames: s.player?.flames ?? this.t.flames };
    this.vy = 0;
    this.invulnUntil = 0;
    this.pulseReady = 0;
    this.input = { move: [0, 0], cam_yaw_deg: 0, jump: false, interact: false, pulse: false, dash: false };
    this.events = [];
    this.nextMote = 1;
    this.nextShade = 1;
    this.lanterns = Array.from({ length: this.t.lantern_count_night1 }, (_, i) => {
      const angle = i * Math.PI * 2 / 5;
      return { id: 'L' + (i + 1), pos: [Math.sin(angle) * 18, 0, Math.cos(angle) * 18], deposited: 0, lit: false };
    });
    for (const patch of s.lanterns ?? []) {
      const l = this.lanterns.find(x => x.id === patch.id);
      Object.assign(l, structuredClone(patch));
      if (l.lit || l.deposited === this.t.lantern_cost) { l.lit = true; l.deposited = this.t.lantern_cost; }
    }
    this.motes = [];
    this.shades = [];
    if ('motes' in s) for (const p of s.motes) this.addMote(p);
    else if (this.randomMotes) for (let i = 0; i < 65; i++) this.addMote(this.randomPosition(4, 27));
    if ('shades' in s) for (const sh of s.shades) this.addShade(sh.pos, sh.id);
    else if (this.randomShades) for (let i = 0; i < 3; i++) this.addShade(this.randomPosition(27, 30));
  }
  random() {
    let x = this.rng;
    x ^= x << 13; x ^= x >>> 17; x ^= x << 5;
    this.rng = x >>> 0;
    return this.rng / 4294967296;
  }
  randomPosition(min, max) {
    const a = this.random() * Math.PI * 2;
    const r = Math.sqrt(min * min + this.random() * (max * max - min * min));
    return [Math.cos(a) * r, 0, Math.sin(a) * r];
  }
  addMote(pos, availableTick = 0) {
    this.motes.push({ id: 'M' + this.nextMote++, pos: copyPos(pos), availableTick });
  }
  addShade(pos, id) {
    if (id === undefined) { do { id = 'S' + this.nextShade++; } while (this.shades.some(s => s.id === id)); }
    const shade = { id, pos: copyPos(pos), state: 'chase', stunUntil: 0 };
    this.shades.push(shade);
    return shade;
  }
  emit(name, data) { this.events.push({ type: 'event', tick: this.tick, name, data }); }
  safe(pos) { return this.lanterns.some(l => l.lit && distance(pos, l.pos) <= this.t.safe_radius + EPS); }
  projectSafe(pos) {
    // Repeat for scenario lanterns whose safe areas overlap.
    for (let pass = 0; pass < 8; pass++) {
      let moved = false;
      for (const l of this.lanterns) if (l.lit) {
        const d = distance(pos, l.pos);
        if (d < this.t.safe_radius) {
          const dx = d > EPS ? (pos[0] - l.pos[0]) / d : 1;
          const dz = d > EPS ? (pos[2] - l.pos[2]) / d : 0;
          pos[0] = l.pos[0] + dx * this.t.safe_radius;
          pos[2] = l.pos[2] + dz * this.t.safe_radius;
          moved = true;
        }
      }
      if (!moved) break;
    }
  }
  step(patch = {}) {
    this.events = [];
    if (this.state !== 'playing') return this.events;
    const edges = Object.fromEntries(buttons.map(b => [b, patch[b] === true && !this.input[b]]));
    Object.assign(this.input, patch);
    this.tick++;
    const p = this.player;
    let [x, z] = this.input.move;
    const length = Math.hypot(x, z);
    if (length > 1) { x /= length; z /= length; }
    const yaw = (this.input.cam_yaw_deg % 360) * Math.PI / 180;
    p.pos[0] += (x * Math.cos(yaw) + z * Math.sin(yaw)) * this.t.player_speed * DT;
    p.pos[2] += (-x * Math.sin(yaw) + z * Math.cos(yaw)) * this.t.player_speed * DT;
    const radius = Math.hypot(p.pos[0], p.pos[2]);
    if (radius > PLAYER_BOUNDARY) { p.pos[0] *= PLAYER_BOUNDARY / radius; p.pos[2] *= PLAYER_BOUNDARY / radius; }
    if (edges.jump && p.pos[1] <= EPS) this.vy = 7;
    if (this.vy !== 0 || p.pos[1] > 0) {
      this.vy -= 18 * DT;
      p.pos[1] = Math.max(0, p.pos[1] + this.vy * DT);
      if (p.pos[1] === 0) this.vy = 0;
    }
    this.motes = this.motes.filter(m => {
      if (p.carried < this.t.carry_capacity && this.tick >= m.availableTick && distance(p.pos, m.pos) <= this.t.pickup_radius + EPS) {
        p.carried++;
        this.score += this.t.score.per_mote;
        this.emit('mote_picked', { carried: p.carried });
        return false;
      }
      return true;
    });
    if (edges.interact && p.carried > 0) {
      const nearby = this.lanterns.filter(l => !l.lit && distance(l.pos, p.pos) <= this.t.interact_radius + EPS)
        .sort((a, b) => distance(a.pos, p.pos) - distance(b.pos, p.pos));
      const l = nearby[0];
      if (l) {
        const amount = Math.min(p.carried, this.t.lantern_cost - l.deposited);
        p.carried -= amount;
        l.deposited += amount;
        this.emit('deposit', { lantern_id: l.id, amount, deposited: l.deposited });
        if (l.deposited === this.t.lantern_cost) {
          l.lit = true;
          this.score += this.t.score.per_lantern;
          this.emit('lantern_lit', { lantern_id: l.id });
        }
      }
    }
    if (edges.pulse && p.carried >= this.t.pulse_cost && this.tick >= this.pulseReady) {
      p.carried -= this.t.pulse_cost;
      this.pulseReady = this.tick + Math.ceil(this.t.pulse_cooldown_s * HZ);
      const stunned = [];
      for (const sh of this.shades) if (distance(sh.pos, p.pos) <= this.t.pulse_radius + EPS) {
        const d = distance(sh.pos, p.pos);
        sh.pos[0] += (d > EPS ? (sh.pos[0] - p.pos[0]) / d : 1) * this.t.pulse_push_m;
        sh.pos[2] += (d > EPS ? (sh.pos[2] - p.pos[2]) / d : 0) * this.t.pulse_push_m;
        sh.stunUntil = this.tick + Math.ceil(this.t.pulse_stun_s * HZ);
        sh.state = 'stunned';
        stunned.push(sh.id);
        this.score += this.t.score.per_stun;
      }
      this.emit('pulse', { stunned_ids: stunned });
    }
    if (this.randomMotes && this.tick % 120 === 0 && this.motes.length < 90) this.addMote(this.randomPosition(3, 28));
    if (this.randomShades && this.tick % 480 === 0 && this.shades.length < 8) {
      const sh = this.addShade(this.randomPosition(28, 31));
      this.emit('shade_spawned', { id: sh.id });
    }
    for (const sh of this.shades) {
      if (this.tick < sh.stunUntil) sh.state = 'stunned';
      else {
        sh.state = 'chase';
        const d = distance(sh.pos, p.pos);
        if (d > EPS) {
          const amount = Math.min(d, this.t.shade_speed * DT);
          sh.pos[0] += (p.pos[0] - sh.pos[0]) / d * amount;
          sh.pos[2] += (p.pos[2] - sh.pos[2]) / d * amount;
        }
      }
      this.projectSafe(sh.pos);
      if (sh.state !== 'stunned' && !this.safe(p.pos) && p.flames > 0 && this.tick >= this.invulnUntil && distance(sh.pos, p.pos) <= this.t.shade_hit_radius + EPS) {
        p.flames--;
        const dropped = Math.floor(p.carried * this.t.hit_drop_ratio);
        p.carried -= dropped;
        for (let i = 0; i < dropped; i++) this.addMote(p.pos, this.tick + 30);
        this.invulnUntil = this.tick + Math.ceil(this.t.invuln_s * HZ);
        this.emit('player_hit', { by: 'shade', flames: p.flames, dropped });
      }
    }
    this.timeLeft = Math.max(0, this.initialTime - this.tick / HZ);
    let reason;
    if (p.flames === 0) { this.state = 'lost'; reason = 'no_flames'; }
    else if (this.lanterns.every(l => l.lit)) {
      this.state = 'won'; reason = 'all_lit';
      this.score += Math.floor(this.timeLeft) * this.t.score.per_second_left + p.flames * this.t.score.per_flame_left;
    } else if (this.timeLeft <= 0) { this.state = 'lost'; reason = 'dawn'; }
    if (reason) this.emit('game_over', { result: this.state, reason });
    return this.events;
  }
  snapshot() {
    return {
      type: 'snapshot', tick: this.tick, sim_tick: this.tick, state: this.state,
      time_left_s: round(this.timeLeft), score: this.score,
      player: { pos: this.player.pos.map(round), flames: this.player.flames, carried: this.player.carried },
      lanterns: this.lanterns.map(l => ({ ...l, pos: l.pos.map(round) })),
      shades: this.shades.map(s => ({ id: s.id, pos: s.pos.map(round), state: s.state })),
      motes_active: this.motes.length,
      motes: this.motes.map(m => ({ id: m.id, pos: m.pos.map(round) }))
    };
  }
  end() { return { type: 'end', ticks: this.tick, state: this.state, score: this.score }; }
}
