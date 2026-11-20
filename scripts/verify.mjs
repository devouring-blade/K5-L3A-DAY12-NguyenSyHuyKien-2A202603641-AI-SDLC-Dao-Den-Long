import fs from 'node:fs';import os from 'node:os';import path from 'node:path';import crypto from 'node:crypto';import assert from 'node:assert/strict';import{spawnSync}from'node:child_process';import{performance}from'node:perf_hooks';import{fileURLToPath}from'node:url';
const root=fileURLToPath(new URL('../',import.meta.url)),contract=JSON.parse(fs.readFileSync(path.join(root,'game.contract.json'))),phase=Number(contract.contract_version.split('.')[1])+1;
const proof=path.join(root,'docs/proof/phase-'+phase);fs.mkdirSync(proof,{recursive:true});
const run=(args,log)=>{const r=spawnSync(process.execPath,args,{cwd:root,encoding:'utf8',maxBuffer:20*1024*1024});if(log)fs.writeFileSync(path.join(proof,log),(r.stdout??'')+(r.stderr??''));if(r.status!==0)throw Error(r.stdout+'\n'+r.stderr);return r;};
function scenario(name,night,s,frames,ticks){const sp=path.join(proof,name+'-scenario.json'),ip=path.join(proof,name+'-inputs.json'),op=path.join(proof,name+'.jsonl');fs.writeFileSync(sp,JSON.stringify(s,null,2)+'\n');fs.writeFileSync(ip,JSON.stringify({frames},null,2)+'\n');run(['src/cli.mjs','--seed','42','--night',String(night),'--scenario',sp,'--inputs',ip,'--ticks',String(ticks),'--out',op]);const raw=fs.readFileSync(op,'utf8');return{raw,lines:raw.trim().split('\n').map(JSON.parse)};}
try{
  const files=fs.readdirSync(path.join(root,'tests')).filter(f=>f.endsWith('.test.mjs')).map(f=>'tests/'+f);run(['--test','--test-reporter=tap',...files],'tests.tap');run(['scripts/build.mjs'],'build.txt');
  const q={random_motes:false,random_shades:false,random_drifters:false,wind_enabled:false};
  const dash=scenario('dash',1,q,[{tick:0,move:[0,1],dash:true}],12);assert.equal(dash.lines.filter(l=>l.name==='dash').length,1);
  const charm=scenario('charm',2,{...q,charms:[{id:'C1',pos:[0,0,0]}]},[],30);assert.ok(charm.lines.some(l=>l.name==='charm_picked'));
  const drifter=scenario('drifter',2,{...q,player:{carried:8},drifters:[{id:'D1',pos:[0,.8,0]}]},[{tick:1,pulse:true}],60);assert.ok(drifter.lines.some(l=>l.name==='drifter_steal'));assert.ok(drifter.lines.some(l=>l.name==='drifter_drop'));
  const paused=scenario('pause',1,q,[{tick:0,pause:true},{tick:1,pause:false},{tick:60,pause:true}],61);assert.equal(paused.lines.find(l=>l.type==='snapshot'&&l.tick===60).sim_tick,0);
  const pad=scenario('jump-pad',2,{...q,player:{pos:[20,0,18]}},[],110);assert.ok(pad.lines.some(l=>l.name==='jump_pad'));
  const fall=scenario('fall',1,{...q,player:{pos:[41,-10.1,0],carried:8,invuln_ticks:100}},[],62);assert.equal(fall.lines.filter(l=>l.name==='player_hit').length,1);
  scenario('wind',3,{...q,wind_enabled:true},[],1810);
  const lamps=Array.from({length:5},(_,i)=>({id:'L'+(i+1),pos:[i*3,0,0],lit:i>0}));
  const winScenario={...q,player:{carried:10},lanterns:lamps,time_left_s:phase===2?300:1};
  const a=scenario('win-a',1,winScenario,[{tick:0,interact:true}],100),b=scenario('win-b',1,winScenario,[{tick:0,interact:true}],100);assert.equal(a.raw,b.raw);assert.equal(a.lines.at(-1).state,'won');
  const measurements=[];for(let night=1;night<=3;night++){const start=performance.now();const r=scenario('full-night-'+night,night,q,[],21600);const ms=performance.now()-start;assert.ok(ms<=30000,'headless exceeds 30 seconds');measurements.push({night,elapsed_ms:Math.round(ms),...r.lines.at(-1)});}
  const hash=f=>crypto.createHash('sha256').update(fs.readFileSync(path.join(root,f))).digest('hex');
  const sources=['game.contract.json','src/simulation.mjs','src/world.mjs','src/validation.mjs','src/cli.mjs','web/app.mjs','web/index.html','web/style.css'];
  const report={generated_at:new Date().toISOString(),contract_version:contract.contract_version,phase,host:{node:process.version,platform:os.platform(),cpu:os.cpus()[0]?.model},test_report:'tests.tap',test_exit:0,deterministic:{identical:true,sha256:crypto.createHash('sha256').update(a.raw).digest('hex')},headless_measurements:measurements,source_sha256:Object.fromEntries(sources.map(f=>[f,hash(f)])),limits:['Only current host measured; hidden instructor tests unavailable.','Graphics benchmark and browser checks recorded separately.']};fs.writeFileSync(path.join(proof,'report.json'),JSON.stringify(report,null,2)+'\n');console.log('Verified Phase '+phase+': tests, build, feature scenarios, deterministic replay and all3 full-night headless runs.');
}catch(e){console.error(e.message);process.exitCode=1;}
