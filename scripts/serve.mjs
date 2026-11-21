import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { readBoard,saveEntry } from '../src/leaderboard.mjs';

const root = fileURLToPath(new URL('../dist/', import.meta.url));
const boardFile=process.env.LEADERBOARD_FILE??fileURLToPath(new URL('../data/leaderboard.json',import.meta.url));
const exportIndex=process.argv.indexOf('--export-leaderboard');
if(exportIndex>=0){const out=process.argv[exportIndex+1];if(!out){console.error('Missing export path');process.exit(2);}fs.writeFileSync(out,JSON.stringify(readBoard(boardFile),null,2)+'\n');process.exit(0);}
if (!fs.existsSync(path.join(root, 'index.html'))) {
  console.error('Run npm run build first.'); process.exit(1);
}
const port = Number(process.env.PORT ?? 4173);
const types = { '.html': 'text/html; charset=utf-8', '.css': 'text/css; charset=utf-8', '.js': 'text/javascript; charset=utf-8', '.mjs': 'text/javascript; charset=utf-8' };
http.createServer((req, res) => {
  try {
    const name = decodeURIComponent(new URL(req.url, 'http://localhost').pathname);
    if(name==='/api/leaderboard'){
      if(req.method==='GET'){res.writeHead(200,{'Content-Type':'application/json'});res.end(JSON.stringify(readBoard(boardFile)));return;}
      if(req.method==='POST'){let body='';req.on('data',chunk=>{body+=chunk;if(body.length>10000)req.destroy();});req.on('end',()=>{try{const result=saveEntry(boardFile,JSON.parse(body));res.writeHead(200,{'Content-Type':'application/json'});res.end(JSON.stringify(result));}catch(e){res.writeHead(400,{'Content-Type':'application/json'});res.end(JSON.stringify({error:e.message}));}});return;}
      res.writeHead(405);res.end();return;
    }
    const target = path.resolve(root, '.' + (name === '/' ? '/index.html' : name));
    if (!target.startsWith(root) || !fs.existsSync(target) || !fs.statSync(target).isFile()) { res.writeHead(404); res.end('Not found'); return; }
    res.writeHead(200, { 'Content-Type': types[path.extname(target)] ?? 'application/octet-stream', 'Cache-Control': 'no-cache' });
    fs.createReadStream(target).pipe(res);
  } catch { res.writeHead(400); res.end('Bad request'); }
}).listen(port, '127.0.0.1', () => console.log('Đảo Đèn Lồng: http://localhost:' + port));
