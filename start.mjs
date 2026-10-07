import { spawn } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import path from 'node:path';
import { STORAGE_CONFIG } from './storage/config.js';
import { VERSION } from './src/engine.js';
const root=path.dirname(fileURLToPath(import.meta.url));
const admin=process.argv.includes('--admin'), display=process.argv.includes('--leaderboard');
const url='http://localhost:4317';
const destination=url+(admin?'/admin':display?'/leaderboard':'');
const desiredBackend=process.env.CASCADE_STORAGE_BACKEND??STORAGE_CONFIG.backend;
let running=false,wrongBackend=false;
try{const r=await fetch(url+'/api/meta',{signal:AbortSignal.timeout(1200)});const j=await r.json();running=j.version===VERSION;wrongBackend=running&&(j.storageBackend||'legacy')!==desiredBackend;}catch{}
if(wrongBackend){console.error('De opslagkeuze is gewijzigd. Stop de bestaande gameserver met Ctrl+C en start opnieuw.');process.exit(1);}
if(!running){const child=spawn(process.execPath,[path.join(root,'server.mjs')],{cwd:root,stdio:'inherit'});child.on('error',e=>console.error(e.message));process.on('SIGINT',()=>{child.kill('SIGINT');process.exit();});for(let i=0;i<30;i++){try{const r=await fetch(url+'/api/meta');if(r.ok){running=true;break;}}catch{}await new Promise(r=>setTimeout(r,150));}}
if(running){
  const meta=await (await fetch(url+'/api/meta')).json();
  if((admin&&meta.storageBackend!=='django'&&!meta.leaderboardAdmin)||(display&&!meta.leaderboardDisplay)){console.error('De game draait nog met een oudere server. Stop deze eerst met Ctrl+C in het bestaande Terminal-venster en start opnieuw.');process.exitCode=1;}
  else {spawn('open',[destination],{stdio:'ignore'});console.log('Cascade Command staat klaar: '+destination);}
}
else{console.error('Starten lukte niet. Controleer of poort 4317 vrij is.');process.exitCode=1;}
