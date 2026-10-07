import { execFileSync, spawn } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { STORAGE_CONFIG } from '../storage/config.js';
const root=fileURLToPath(new URL('..',import.meta.url));
const baseUrl=process.env.DJANGO_GAMES_API_BASE_URL||STORAGE_CONFIG.apiBaseUrl;
let token=process.env.CASCADE_COMMAND_API_TOKEN;
if(!token)try{token=execFileSync('/usr/bin/security',['find-generic-password','-s','wpos.cascade-command','-a',new URL(baseUrl).hostname,'-w'],{encoding:'utf8',stdio:['ignore','pipe','ignore']}).trim();}catch{}
if(!token){console.error('API-token ontbreekt. Open eerst Configureer API-token.command; de token wordt alleen in de lokale login-sleutelhanger opgeslagen.');process.exit(1);}
const child=spawn(process.execPath,[fileURLToPath(new URL('../server.mjs',import.meta.url))],{cwd:root,env:{...process.env,CASCADE_STORAGE_BACKEND:'django',DJANGO_GAMES_API_BASE_URL:baseUrl,CASCADE_COMMAND_API_TOKEN:token},stdio:'inherit'});
child.on('error',()=>{console.error('De API-gameserver kon niet starten.');process.exitCode=1;});
for(const signal of ['SIGINT','SIGTERM'])process.on(signal,()=>child.kill(signal));
child.on('exit',code=>{process.exitCode=code??0;});
