import{spawn}from'node:child_process';import path from'node:path';import{fileURLToPath}from'node:url';import electron from'electron';
const root=fileURLToPath(new URL('../',import.meta.url));
const args=process.argv.slice(2),o={seed:42,duration:30,out:'bench.json',mode:'bench'};
try{for(let i=0;i<args.length;i+=2){const k=args[i]?.slice(2);if(!['seed','duration','out','mode'].includes(k)||!args[i+1])throw Error('Invalid benchmark/demo argument');o[k]=['seed','duration'].includes(k)?Number(args[i+1]):args[i+1];}if(!Number.isSafeInteger(o.seed)||!Number.isFinite(o.duration)||o.duration<=0||!['bench','demo'].includes(o.mode))throw Error('Invalid seed/duration/mode');
  const env={...process.env,DAO_MODE:o.mode,DAO_SEED:String(o.seed),DAO_DURATION:String(o.duration),DAO_OUT:path.resolve(o.out),DAO_STARTED_AT:String(Date.now()-process.uptime()*1000)};delete env.ELECTRON_RUN_AS_NODE;
  const child=spawn(electron,[path.join(root,'scripts/electron-main.cjs')],{cwd:root,env,stdio:'inherit',windowsHide:true});child.on('exit',code=>{process.exitCode=code??1;});child.on('error',e=>{console.error(e.message);process.exitCode=1;});
}catch(e){console.error(e.message);process.exitCode=2;}
