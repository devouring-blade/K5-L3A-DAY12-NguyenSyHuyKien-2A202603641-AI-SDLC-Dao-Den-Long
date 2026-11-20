import {HZ,DT,ISLAND_RADIUS,distXZ,round,world,groundHeight,blocked} from './world.mjs';
import {BUTTONS,validateInputs,validateScenario} from './validation.mjs';
export {HZ,DT,ISLAND_RADIUS,world,groundHeight,validateInputs,validateScenario};
const EPS=1e-8, clone=x=>structuredClone(x), byId=(a,b)=>a.id.localeCompare(b.id,'en',{numeric:true});
export class Game{
  constructor(tuning,seed=1,scenario={},night=1,options={}){
    this.t=clone(tuning);this.night=night;this.world=world(night);const s=validateScenario(scenario,tuning,night);
    this.rng=(seed>>>0)||0x9e3779b9;this.tick=0;this.simTick=0;this.state='playing';this.score=0;this.events=[];this.bench=Boolean(options.benchmark);
    this.fuelRules=Boolean(tuning.fuel_max);this.initialTime=s.time_left_s??this.t['night'+night+'_duration_s'];this.timeLeft=this.initialTime;
    this.randomMotes=s.random_motes??true;this.randomShades=s.random_shades??true;this.randomDrifters=s.random_drifters??true;this.windEnabled=s.wind_enabled??true;
    this.input={move:[0,0],cam_yaw_deg:0,...Object.fromEntries(BUTTONS.map(b=>[b,false]))};this.blockedButtons=new Set();
    this.player={pos:clone(s.player?.pos??this.world.spawn),vel:[0,0,0],carried:s.player?.carried??0,flames:s.player?.flames??3,grounded:false};
    this.player.grounded=Math.abs(this.player.pos[1]-groundHeight(night,this.player.pos[0],this.player.pos[2]))<EPS;
    this.invuln=s.player?.invuln_ticks??0;this.dashCD=s.player?.dash_cd_ticks??0;this.pulseCD=s.player?.pulse_cd_ticks??0;this.charm=s.player?.charm_ticks??0;
    this.successfulLights=s.player?.successful_lights??0;this.facing=[0,1];this.dashTicks=0;this.dashDir=[0,1];this.launch=null;this.respawnTicks=0;this.pendingFall=false;this.padLock=false;
    this.nextMote=1;this.nextShade=1;this.nextDrifter=1;this.wind={active:false,dir_deg:0};
    this.lanterns=this.world.lanterns.map((pos,i)=>({id:'L'+(i+1),pos:clone(pos),lit:false,deposited:0,fuelUnits:0,ever_lit:false,relit_count:0}));
    for(const patch of s.lanterns??[]){const l=this.lanterns.find(l=>l.id===patch.id);Object.assign(l,clone(patch));if(l.lit||l.deposited>=10){l.lit=true;l.deposited=10;l.fuelUnits=Math.round((patch.fuel??100)*60);l.ever_lit=patch.ever_lit??true;}else l.fuelUnits=0;}
    this.motes=[];this.shades=[];this.drifters=[];
    this.charms=('charms'in s?s.charms:this.world.charms.map((pos,i)=>({id:'C'+(i+1),pos}))).map((c,i)=>({id:c.id??'C'+(i+1),pos:clone(c.pos??this.world.charms[i]??[0,0,0]),available:c.available??true,respawn:c.respawn_ticks??Math.round((c.respawn_s??0)*60)}));
    if('motes'in s)for(const pos of s.motes)this.addMote(pos);else if(this.randomMotes)for(const pos of this.shuffle(this.world.motePoints).slice(0,20))this.addMote(pos);
    for(const sh of s.shades??[])this.addShade(sh.pos,sh.id,sh);
    for(const d of s.drifters??[])this.addDrifter(d.pos,d.id,d);
  }
  random(){let x=this.rng;x^=x<<13;x^=x>>>17;x^=x<<5;this.rng=x>>>0;return this.rng/4294967296;}
  shuffle(items){const a=items.map(clone);for(let i=a.length-1;i>0;i--){const j=Math.floor(this.random()*(i+1));[a[i],a[j]]=[a[j],a[i]];}return a;}
  get capacity(){return this.fuelRules?Math.min(20,10+2*this.successfulLights):10;}
  emit(name,data={}){this.events.push({type:'event',tick:this.tick,name,data});}
  uid(kind){const list=kind==='M'?this.motes:kind==='S'?this.shades:this.drifters;const key=kind==='M'?'nextMote':kind==='S'?'nextShade':'nextDrifter';let id;do{id=kind+this[key]++;}while(list.some(e=>e.id===id));return id;}
  addMote(pos,kind='random',ttl=0){const m={id:this.uid('M'),pos:clone(pos),kind,ttl,born:this.simTick};this.motes.push(m);return m;}
  addShade(pos,id,patch={}){const sh={id:id??this.uid('S'),pos:clone(pos),state:patch.state??'wander',stateTicks:patch.state_ticks_left??0,push:[0,0],pushTicks:0,safeTicks:0,born:this.simTick-1,target_lantern_id:patch.target_lantern_id??null,drainTicks:0};if(sh.state==='recoil'){sh.push=[1,0];sh.pushTicks=sh.stateTicks;}this.shades.push(sh);return sh;}
  addDrifter(pos,id,patch={}){const d={id:id??this.uid('D'),pos:clone(pos),state:patch.state??'idle',stolen:patch.stolen??0,stateTicks:patch.state_ticks_left??(patch.state==='flee'?240:0),born:this.simTick-1,phase:this.random()*Math.PI*2};this.drifters.push(d);return d;}
  safeLanterns(){return this.lanterns.filter(l=>l.lit&&(!this.fuelRules||l.fuelUnits>=1800));}
  safe(pos){return this.safeLanterns().some(l=>distXZ(pos,l.pos)<=6+EPS);}
  moveEntity(e,dx,dz){const next=[e.pos[0]+dx,e.pos[1],e.pos[2]+dz];if(blocked(this.night,e.pos,next))return false;const h=groundHeight(this.night,next[0],next[2]),old=groundHeight(this.night,e.pos[0],e.pos[2]);if(!Number.isFinite(h)||(Number.isFinite(old)&&h>old+.4))return false;e.pos[0]=next[0];e.pos[2]=next[2];if(Number.isFinite(old))e.pos[1]+=h-old;return true;}
  advance(e,target,speed){const d=distXZ(e.pos,target);if(d<EPS)return;const a=Math.min(d,speed*DT);this.moveEntity(e,(target[0]-e.pos[0])/d*a,(target[2]-e.pos[2])/d*a);}
  expel(sh){for(const l of this.safeLanterns()){const d=distXZ(sh.pos,l.pos);if(d<6-EPS){sh.safeTicks=Math.max(sh.safeTicks,30);const dx=d>EPS?(sh.pos[0]-l.pos[0])/d:1,dz=d>EPS?(sh.pos[2]-l.pos[2])/d:0;sh.pos[0]=l.pos[0]+6*dx;sh.pos[2]=l.pos[2]+6*dz;}}}
  drop(amount,pos){for(let i=0;i<amount;i++){const a=this.random()*Math.PI*2,r=1.5+this.random();const p=[pos[0]+Math.cos(a)*r,pos[1],pos[2]+Math.sin(a)*r];const h=groundHeight(this.night,p[0],p[2]);if(Number.isFinite(h))p[1]=h;this.addMote(p,'dropped',480);}}
  step(patch={}){
    this.events=[];if(this.state==='won'||this.state==='lost')return this.events;
    const edges=Object.fromEntries(BUTTONS.map(b=>[b,patch[b]===true&&!this.input[b]]));Object.assign(this.input,patch);this.tick++;
    for(const b of this.blockedButtons)if(!this.input[b])this.blockedButtons.delete(b);
    for(const b of this.blockedButtons)edges[b]=false;
    if(edges.pause){if(this.state==='paused'){this.state='playing';this.emit('resumed');}else{this.state='paused';this.emit('paused');}for(const b of ['jump','dash','interact','pulse'])if(this.input[b])this.blockedButtons.add(b);if(this.state==='paused')return this.events;}
    if(this.state==='paused')return this.events;
    this.simTick++;this.timeLeft=Math.max(0,this.initialTime-this.simTick/60);
    for(const key of ['invuln','dashCD','pulseCD','charm'])this[key]=Math.max(0,this[key]-1);
    for(const sh of this.shades){sh.stateTicks=Math.max(0,sh.stateTicks-1);sh.safeTicks=Math.max(0,sh.safeTicks-1);}
    for(const c of this.charms)if(!c.available&&c.respawn>0){c.respawn--;if(c.respawn===0)c.available=true;}
    this.motes=this.motes.filter(m=>m.kind!=='dropped'||--m.ttl>0);
    this.decayFuel();
    if(this.night===3&&this.windEnabled){const phase=this.simTick%1800;if(phase===1680)this.emit('wind_warning');if(phase===0)this.wind.dir_deg=this.random()*360;this.wind.active=phase<300&&this.simTick>=1800;}else this.wind.active=false;
    const p=this.player;
    if(this.respawnTicks>0){this.respawnTicks--;p.vel=[0,0,0];if(this.respawnTicks===0){p.pos=clone(this.world.spawn);p.grounded=true;this.invuln=90;this.pendingFall=false;this.launch=null;}}
    else this.movePlayer(edges);
    if(!this.bench&&this.respawnTicks===0&&!this.pendingFall){
      this.motes=this.motes.filter(m=>{if(m.born>=this.simTick||p.carried>=this.capacity||distXZ(p.pos,m.pos)>1+EPS||Math.abs(p.pos[1]-m.pos[1])>1.5+EPS)return true;p.carried++;this.emit('mote_picked',{carried:p.carried});return false;});
      for(const c of this.charms)if(c.available&&distXZ(p.pos,c.pos)<=1+EPS&&Math.abs(p.pos[1]-c.pos[1])<=1.5+EPS){c.available=false;c.respawn=2700;this.charm=600;this.dashCD=0;this.emit('charm_picked',{charm_id:c.id,charm_ticks:600});}
      if(edges.interact)this.interact();
    }
    for(const sh of this.shades)this.expel(sh);
    if(edges.pulse&&!this.pendingFall&&this.respawnTicks===0)this.pulse();
    this.updateShades();this.updateDrifters();
    if(!this.bench&&this.respawnTicks===0&&!this.pendingFall){
      for(const d of [...this.drifters].sort(byId))if(d.state==='chase'&&d.born<this.simTick&&distXZ(d.pos,p.pos)<=1.2+EPS){const amount=Math.min(3,p.carried);p.carried-=amount;d.stolen=amount;d.state='flee';d.stateTicks=240;this.emit('drifter_steal',{drifter_id:d.id,amount,carried:p.carried});}
      for(const sh of [...this.shades].sort(byId))if(p.flames>0&&this.invuln===0&&sh.safeTicks===0&&!['stunned','spawning','recoil'].includes(sh.state)&&sh.born<this.simTick&&!this.safe(p.pos)&&distXZ(sh.pos,p.pos)<=1+EPS&&Math.abs(sh.pos[1]-p.pos[1])<=1.5+EPS){p.flames--;const dropped=Math.floor(p.carried/2);p.carried-=dropped;this.drop(dropped,p.pos);this.invuln=90;sh.state='recoil';sh.stateTicks=60;sh.pushTicks=60;const d=distXZ(sh.pos,p.pos);sh.push=d>EPS?[(sh.pos[0]-p.pos[0])/d,(sh.pos[2]-p.pos[2])/d]:[1,0];this.emit('player_hit',{by:'shade',flames:p.flames,dropped});break;}
    }
    if(!this.bench)this.spawnScheduled();
    if(!this.bench)this.finish();return this.events;
  }
  movePlayer(edges){
    const p=this.player;let[x,z]=this.input.move;let d=Math.hypot(x,z);if(d>1){x/=d;z/=d;}const a=this.input.cam_yaw_deg*Math.PI/180;
    const direction=[x*Math.cos(a)+z*Math.sin(a),-x*Math.sin(a)+z*Math.cos(a)];
    if(d>EPS)this.facing=direction.map(v=>v/Math.min(d,1));
    if(edges.dash&&this.dashTicks===0&&(this.dashCD===0||this.charm>0)){this.dashTicks=12;this.dashDir=clone(this.facing);this.dashCD=this.charm>0?0:90;this.emit('dash');}
    if(edges.jump&&p.grounded&&this.dashTicks===0){p.vel[1]=7;p.grounded=false;this.emit('jump');}
    const speed=this.charm>0?7.2:6;
    let vx=this.launch?.[0]??direction[0]*speed,vz=this.launch?.[1]??direction[1]*speed;
    const dashing=this.dashTicks>0;if(dashing){vx=this.dashDir[0]*14;vz=this.dashDir[1]*14;this.dashTicks--;}
    if(this.wind.active){const w=this.wind.dir_deg*Math.PI/180;vx+=2*Math.cos(w);vz+=2*Math.sin(w);}
    const next=[p.pos[0]+vx*DT,p.pos[1],p.pos[2]+vz*DT];
    if(!blocked(this.night,p.pos,next)){p.pos[0]=next[0];p.pos[2]=next[2];}else{vx=0;vz=0;}
    const h=groundHeight(this.night,p.pos[0],p.pos[2]);
    if(!dashing){if(!p.grounded||!Number.isFinite(h)||p.pos[1]>h+EPS){p.vel[1]-=20*DT;p.pos[1]+=p.vel[1]*DT;p.grounded=false;}
      if(Number.isFinite(h)&&p.pos[1]<=h+EPS&&p.vel[1]<=0){p.pos[1]=h;p.vel[1]=0;p.grounded=true;this.launch=null;}}
    p.vel[0]=vx;p.vel[2]=vz;
    const pad=this.world.pads.find(pad=>p.grounded&&distXZ(p.pos,pad.pos)<=1+EPS&&Math.abs(p.pos[1]-pad.pos[1])<.2);
    if(pad&&!this.padLock){const len=distXZ(pad.pos,pad.target);this.launch=[(pad.target[0]-pad.pos[0])/len*pad.speed,(pad.target[2]-pad.pos[2])/len*pad.speed];p.vel[1]=pad.vy;p.grounded=false;this.padLock=true;this.emit('jump_pad');}
    if(!pad&&p.grounded)this.padLock=false;
    if(p.pos[1]<-10&&!this.pendingFall){p.flames=Math.max(0,p.flames-1);const lost=p.carried;p.carried=0;this.pendingFall=true;this.respawnTicks=p.flames>0?60:0;this.dashTicks=0;this.emit('player_hit',{by:'fall',flames:p.flames,dropped:0,lost});}
  }
  interact(){
    const p=this.player;if(p.carried===0)return;
    const targets=this.lanterns.filter(l=>this.receives(l)&&distXZ(l.pos,p.pos)<=2+EPS).sort((a,b)=>distXZ(a.pos,p.pos)-distXZ(b.pos,p.pos)||byId(a,b));
    const l=targets[0];if(!l)return;if(l.lit){this.refuel(l);return;}
    const cost=this.lightCost(l),amount=Math.min(p.carried,cost-l.deposited);p.carried-=amount;l.deposited+=amount;this.score+=amount*(this.t.score.per_deposit??10);
    this.emit('deposit',{lantern_id:l.id,amount,deposited:l.deposited});
    if(l.deposited>=cost){const relight=l.ever_lit;l.lit=true;l.fuelUnits=6000;l.ever_lit=true;if(relight)l.relit_count++;this.successfulLights++;this.score+=this.fuelRules?(relight?40:100):100;this.emit('lantern_lit',{lantern_id:l.id,...(this.fuelRules?{relight}:{})});}
  }
  receives(l){return!l.lit;}
  lightCost(l){return 10;}
  refuel(l){}
  decayFuel(){}
  pulse(){
    const p=this.player;if(this.pulseCD>0||p.carried<3)return;p.carried-=3;this.pulseCD=180;
    const center=[p.pos[0],p.pos[1]+.8,p.pos[2]],hit=e=>Math.hypot(...e.pos.map((v,i)=>v-center[i]))<=5+EPS,ids=[];
    for(const sh of this.shades)if(hit(sh)&&sh.born<this.simTick){this.score+=this.fuelRules&&sh.state==='drain'?15:5;sh.state='stunned';sh.stateTicks=120;sh.pushTicks=15;const d=distXZ(sh.pos,p.pos);sh.push=d>EPS?[(sh.pos[0]-p.pos[0])/d,(sh.pos[2]-p.pos[2])/d]:[1,0];ids.push(sh.id);}
    for(const d of this.drifters)if(hit(d)&&d.born<this.simTick){if(d.state==='chase'){d.state='flee';d.stateTicks=240;}else if(d.state==='flee'&&d.stolen>0){const amount=d.stolen;d.stolen=0;this.drop(amount,d.pos);d.stateTicks=120;this.emit('drifter_drop',{drifter_id:d.id,amount});}}
    this.emit('pulse',{stunned_ids:ids});
  }
  updateShades(){
    for(const sh of this.shades){if(sh.born>=this.simTick)continue;
      if(sh.state==='spawning'){if(sh.stateTicks>0)continue;sh.state='wander';}
      if(sh.state==='stunned'||sh.state==='recoil'){
        if(sh.pushTicks>0){const speed=sh.state==='stunned'?4/15:2/60;this.moveEntity(sh,sh.push[0]*speed,sh.push[1]*speed);sh.pushTicks--;}
        if(sh.stateTicks>0){this.expel(sh);continue;}sh.state='wander';
      }
      const playerDistance=distXZ(sh.pos,this.player.pos);
      if(sh.state==='drain'){if(playerDistance<=6){sh.state='chase';}else{const l=this.lanterns.find(l=>l.id===sh.target_lantern_id);if(!l?.lit||l.fuelUnits>=1800||distXZ(sh.pos,l.pos)>2)sh.state='wander';else{this.expel(sh);continue;}}}
      if(sh.state==='chase'&&playerDistance>18)sh.state='wander';
      else if(sh.state==='wander'&&playerDistance<=12)sh.state='chase';
      if(sh.state==='chase')this.advance(sh,this.player.pos,this.night===3?4.5:4);
      else if(sh.state==='wander'){
        const weak=this.fuelRules?this.lanterns.filter(l=>l.lit&&l.fuelUnits<1800):[];
        const candidates=(weak.length?weak:this.lanterns.filter(l=>!l.lit)).sort((a,b)=>distXZ(sh.pos,a.pos)-distXZ(sh.pos,b.pos)||byId(a,b));
        const target=candidates[0];if(target){sh.target_lantern_id=target.id;this.advance(sh,target.pos,2);if(this.fuelRules&&target.lit&&distXZ(sh.pos,target.pos)<=2+EPS){sh.state='drain';sh.drainTicks=0;}}
      }this.expel(sh);
    }
  }
  updateDrifters(){const p=this.player;
    for(const d of this.drifters){if(d.born>=this.simTick)continue;
      if(d.state==='flee'){d.stateTicks--;if(d.stateTicks<=0){d.state='removed';continue;}let len=distXZ(d.pos,p.pos);const dx=len>EPS?(d.pos[0]-p.pos[0])/len:1,dz=len>EPS?(d.pos[2]-p.pos[2])/len:0;d.pos[0]+=dx*7*DT;d.pos[2]+=dz*7*DT;continue;}
      const chase=p.carried>=5&&distXZ(d.pos,p.pos)<=15;d.state=chase?'chase':'idle';
      if(chase){const len=distXZ(d.pos,p.pos);if(len>EPS){const a=Math.min(len,7*DT);d.pos[0]+=(p.pos[0]-d.pos[0])/len*a;d.pos[2]+=(p.pos[2]-d.pos[2])/len*a;}}
      else{d.phase+=DT*.3;d.pos[0]+=Math.cos(d.phase)*2*DT;d.pos[2]+=Math.sin(d.phase)*2*DT;}
    }this.drifters=this.drifters.filter(d=>d.state!=='removed');
  }
  spawnScheduled(){
    if(this.randomMotes&&this.simTick%240===0&&this.motes.length<30){const available=this.world.motePoints.filter(p=>!this.motes.some(m=>distXZ(m.pos,p)<.01&&Math.abs(m.pos[1]-p[1])<.1));if(available.length)this.addMote(available[Math.floor(this.random()*available.length)]);}
    if(this.randomShades&&this.simTick>=300&&(this.simTick-300)%this.world.interval===0){const amount=this.simTick===300?2:1;for(let i=0;i<amount&&this.shades.length<this.world.maxShades;i++){const available=this.world.shadePoints.filter(p=>distXZ(p,this.player.pos)>=15&&!this.shades.some(sh=>distXZ(sh.pos,p)<1));if(!available.length)break;const sh=this.addShade(available[Math.floor(this.random()*available.length)],undefined,{state:'spawning',state_ticks_left:30});sh.born=this.simTick;this.emit('shade_spawned',{id:sh.id});}}
    if(this.night>=2&&this.randomDrifters&&this.simTick%1200===0&&this.drifters.length<2){const pos=this.world.shadePoints[Math.floor(this.random()*this.world.shadePoints.length)];const d=this.addDrifter(pos);d.born=this.simTick;this.emit('drifter_spawned',{id:d.id});}
  }
  finish(){let reason;const p=this.player;
    if(p.flames===0){this.state='lost';reason='no_flames';}
    else if(this.lanterns.every(l=>l.lit)){this.state='won';reason='all_lit';this.score+=Math.floor(this.timeLeft)*2+p.flames*50;}
    else if(this.timeLeft<=0){this.state='lost';reason='dawn';}
    if(reason)this.emit('game_over',{result:this.state,reason});
  }
  snapshot(){const p=this.player;return {type:'snapshot',tick:this.tick,sim_tick:this.simTick,night:this.night,state:this.state,time_left_s:round(this.timeLeft),score:this.score,
    player:{pos:p.pos.map(v=>round(v)),vel:p.vel.map(v=>round(v)),grounded:p.grounded,invuln:this.invuln>0,flames:p.flames,carried:p.carried,dash_cd_s:round(this.dashCD/60),pulse_cd_s:round(this.pulseCD/60),charm_s:round(this.charm/60),...(this.fuelRules?{capacity:this.capacity}:{})},
    wind:{active:this.wind.active,dir_deg:round(this.wind.dir_deg)},lanterns:this.lanterns.map(l=>({id:l.id,pos:l.pos.map(v=>round(v)),lit:l.lit,deposited:l.deposited,...(this.fuelRules?{fuel:l.lit?round(l.fuelUnits/60,1):0,ever_lit:l.ever_lit,relit_count:l.relit_count}:{})})),
    shades:this.shades.map(sh=>({id:sh.id,pos:sh.pos.map(v=>round(v)),state:sh.state})),motes_active:this.motes.length,
    motes:this.motes.map(m=>({id:m.id,pos:m.pos.map(v=>round(v)),kind:m.kind,ttl_s:m.kind==='dropped'?round(m.ttl/60):null})),drifters:this.drifters.map(d=>({id:d.id,pos:d.pos.map(v=>round(v)),state:d.state,stolen:d.stolen})),charms:this.charms.map(c=>({id:c.id,available:c.available,respawn_s:round(c.respawn/60)}))};}
  end(){return{type:'end',ticks:this.tick,state:this.state,score:this.score};}
}
