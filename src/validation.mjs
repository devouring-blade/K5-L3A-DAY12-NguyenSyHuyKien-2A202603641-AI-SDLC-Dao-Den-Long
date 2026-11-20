const obj=x=>x!==null&&typeof x==='object'&&!Array.isArray(x);
const finite=x=>typeof x==='number'&&Number.isFinite(x);
const integer=x=>Number.isSafeInteger(x)&&x>=0;
const vec=x=>Array.isArray(x)&&x.length===3&&x.every(finite);
const check=(ok,msg)=>{if(!ok)throw new Error(msg);};
export const BUTTONS=['jump','interact','pulse','dash','pause'];
export function validateInputs(input){
  check(obj(input)&&Array.isArray(input.frames),'inputs.frames must be an array');let prev=-1;
  for(const f of input.frames){check(obj(f)&&integer(f.tick)&&f.tick>prev,'ticks must be nonnegative and strictly increasing');prev=f.tick;
    check(Object.keys(f).every(k=>['tick','move','cam_yaw_deg',...BUTTONS].includes(k)),'unknown input field');
    if('move'in f)check(Array.isArray(f.move)&&f.move.length===2&&f.move.every(v=>finite(v)&&v>=-1&&v<=1),'invalid move');
    if('cam_yaw_deg'in f)check(finite(f.cam_yaw_deg),'invalid cam_yaw_deg');
    for(const b of BUTTONS)if(b in f)check(typeof f[b]==='boolean','invalid '+b);
  }return input.frames;
}
export function validateScenario(s,t,night=1){
  check(obj(s),'scenario must be an object');
  if('player'in s){check(obj(s.player),'invalid player');if('pos'in s.player)check(vec(s.player.pos),'invalid player.pos');
    for(const k of ['carried','flames','invuln_ticks','dash_cd_ticks','pulse_cd_ticks','charm_ticks','successful_lights'])if(k in s.player)check(integer(s.player[k]),'invalid player.'+k);
    const capacity=t.fuel_max?Math.min(20,10+2*(s.player.successful_lights??0)):10;
    if('carried'in s.player)check(s.player.carried<=capacity,'carried exceeds capacity');
  }
  for(const k of ['random_motes','random_shades','random_drifters','wind_enabled'])if(k in s)check(typeof s[k]==='boolean','invalid '+k);
  if('time_left_s'in s)check(finite(s.time_left_s)&&s.time_left_s>=0,'invalid time_left_s');
  if('motes'in s)check(Array.isArray(s.motes)&&s.motes.every(vec),'motes must be XYZ vectors');
  for(const name of ['shades','drifters','charms','lanterns'])if(name in s){check(Array.isArray(s[name]),name+' must be an array');const ids=new Set();
    s[name].forEach((e,i)=>{check(obj(e),'invalid '+name);const id=e.id??(name==='shades'?'S':name==='drifters'?'D':name==='charms'?'C':'L')+(i+1);check(typeof id==='string'&&id.length>0&&!ids.has(id),'invalid/duplicate id');ids.add(id);
      if(name==='lanterns')check(new RegExp('^L[1-'+(night+4)+']$').test(id),'invalid lantern id');
      if('pos'in e)check(vec(e.pos),'invalid '+name+'.pos');else if(name==='shades'||name==='drifters')check(false,'missing '+name+'.pos');
      for(const k of ['deposited','state_ticks_left','stolen','respawn_ticks','relit_count'])if(k in e)check(integer(e[k]),'invalid '+name+'.'+k);
      if('deposited'in e)check(e.deposited<=t.lantern_cost,'invalid deposited');
      if('fuel'in e)check(finite(e.fuel)&&e.fuel>=0&&e.fuel<=100,'invalid fuel');
      for(const k of ['lit','ever_lit','available'])if(k in e)check(typeof e[k]==='boolean','invalid '+k);
      if(name==='shades'&&'state'in e)check(['spawning','wander','chase','recoil','stunned',...(t.fuel_max?['drain']:[])].includes(e.state),'invalid shade state');
      if(name==='drifters'&&'state'in e)check(['idle','chase','flee','removed'].includes(e.state),'invalid drifter state');
      if('target_lantern_id'in e)check(typeof e.target_lantern_id==='string','invalid target_lantern_id');
    });
  }return s;
}
