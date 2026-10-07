import test from 'node:test';
import assert from 'node:assert/strict';
import { mkdtempSync, existsSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import path from 'node:path';
import http from 'node:http';
import { spawn } from 'node:child_process';
import { once } from 'node:events';
import { storageConfig, STORAGE_CONFIG } from '../storage/config.js';
import { djangoStorage } from '../storage/django.js';
import { handleGameApi } from '../storage/game-api.js';
import { handleApi } from '../worker/api.js';
import { VERSION, replay } from '../src/engine.js';
import { leaderboardRoute, leaderboardDay } from '../src/storage-ui.js';

const id='22345678-1234-4123-8123-123456789abc', scoreId='32345678-1234-4123-8123-123456789abc', visitId='12345678-1234-4123-8123-123456789abc';
const config=storageConfig({CASCADE_STORAGE_BACKEND:'django',CASCADE_COMMAND_API_TOKEN:'test-placeholder-only'});
const meta={game:'cascade-command',version:VERSION,timezone:'Europe/Amsterdam',contact_requirements:{full_name:'disabled',email:'required',phone:'optional',retention_days:90}};
function fixture(options={}) {
  const calls=[], sessions=new Map(), visits=new Set(), finished=new Map(), scores=new Map();
  let starts=0, finishes=0, saved=0, loseStart=options.loseStart, loseScore=options.loseScore;
  const reply=(body,status=200)=>Response.json(body,{status});
  const fetcher=async (url,request) => {
    assert.equal(request.headers.Authorization,'Bearer test-placeholder-only'); assert.equal(request.redirect,'error');
    const u=new URL(url), route=u.pathname.split('/cascade-command/')[1], body=request.body?JSON.parse(request.body):undefined;
    calls.push({route,method:request.method,body,query:u.searchParams});
    if(route==='meta/')return reply(options.meta||meta);
    if(route==='visits/') { const isNew=!visits.has(body.id); visits.add(body.id);return reply({recorded:true},isNew?201:200); }
    if(route==='sessions/') {
      const fresh=!sessions.has(body.id);
      if(fresh){starts++;sessions.set(body.id,{id:body.id,seed:options.seed??123456789,version:VERSION,day:'2026-10-06',started:Date.now()-80000,expires:Date.now()+1700000,consumed:false});}
      if(loseStart){loseStart=false;throw new Error('response lost after commit');}
      return reply(sessions.get(body.id),fresh?201:200);
    }
    if(route===`sessions/${id}/`)return reply(sessions.get(id));
    if(route===`sessions/${id}/finish/` || route===`sessions/${id}/score/`) {
      const result={version:body.version,score:body.score,services:body.services,duration:body.duration};
      if(finished.has(id)&&JSON.stringify(result)!==JSON.stringify(finished.get(id)))return reply(['Changed result'],400);
      if(route.endsWith('/score/')&&!scores.has(id)&&!body.contact?.email)return reply({contact:{email:['This field is required.']}},400);
      if(!finished.has(id)){finishes++;finished.set(id,result);}
      if(route.endsWith('/finish/'))return reply({recorded:true});
      const fresh=!scores.has(id);
      if(fresh){saved++;sessions.get(id).consumed=true;scores.set(id,{id:scoreId,name:body.name,score:body.score,services:body.services,date:'2026-10-07T00:00:01Z'});}
      if(loseScore){loseScore=false;throw new Error('response lost after commit');}
      return reply({id:scoreId,rank:options.rank??1,score:body.score,day:'2026-10-06',version:VERSION,scores:(options.rank??1)>10?[]:[scores.get(id)],contact:{email:'must-never-escape@example.test'}},fresh?201:200);
    }
    if(route==='leaderboard/')return reply({day:u.searchParams.get('day')||'2026-10-07',version:u.searchParams.get('version')||VERSION,scores:[...scores.values()].slice(0,10)});
    return reply({detail:'Not found.'},404);
  };
  const store=djangoStorage(config,{fetcher,sleep:async()=>{},random:()=>0});
  const call=(route,body)=>handleGameApi(new Request('https://game.example'+route,{method:body===undefined?'GET':'POST',headers:{'Content-Type':'application/json',Origin:'https://game.example','User-Agent':'Chrome','CF-Connecting-IP':'192.0.2.1'},...(body===undefined?{}:{body:JSON.stringify(body)})}),store,{hosting:'sites',mobileUrls:['https://game.example/']});
  return {call,store,fetcher,calls,sessions,counts:()=>({starts,finishes,saved,visits:visits.size})};
}

test('one server-only switch defaults to legacy and Django requires a safe URL and token',()=>{
  assert.deepEqual(storageConfig(),{backend:'legacy'});
  assert.equal(config.baseUrl,STORAGE_CONFIG.apiBaseUrl);
  assert.throws(()=>storageConfig({CASCADE_STORAGE_BACKEND:'auto'}));
  assert.throws(()=>storageConfig({CASCADE_STORAGE_BACKEND:'django'}));
  for(const url of ['http://external.example/api/v1/internal/games/cascade-command/','https://user:pass@example.test/api/v1/internal/games/cascade-command/','https://api.example/other/'])assert.throws(()=>storageConfig({CASCADE_STORAGE_BACKEND:'django',CASCADE_COMMAND_API_TOKEN:'placeholder',DJANGO_GAMES_API_BASE_URL:url}));
  assert.equal(storageConfig({...{CASCADE_STORAGE_BACKEND:'django',CASCADE_COMMAND_API_TOKEN:'placeholder'},DJANGO_GAMES_API_BASE_URL:'http://localhost:8000/api/v1/internal/games/cascade-command/'}).backend,'django');
});
test('Django uses server seed, deduplicates visits and a committed start with a lost response',async()=>{
  const f=fixture({loseStart:true});
  const publicMeta=await(await f.call('/api/meta')).json();assert.equal(publicMeta.storageBackend,'django');assert.equal(publicMeta.capabilities.consolationDraw,false);assert.equal(publicMeta.contact_requirements.email,'required');
  const prepared=await(await f.call('/api/session-id',{})).json();assert.match(prepared.id,/^[\da-f-]{36}$/);
  for(let i=0;i<2;i++)assert.equal((await f.call('/api/visit',{id:visitId,analytics:{ip:'198.51.100.9',width:390,referrer:'https://external.example/private?secret=x'}})).ok,true);
  const session=await(await f.call('/api/session',{id,analytics:{width:390}})).json();assert.equal(session.id,id);assert.equal(session.seed,123456789);
  assert.equal((await f.call('/api/session',{id})).status,200);
  assert.deepEqual(f.counts(),{starts:1,finishes:0,saved:0,visits:1});
  const visit=f.calls.find(c=>c.route==='visits/');assert.equal(visit.body.metadata.ip,'192.0.2.1');assert.equal(visit.body.metadata.referrer,'external.example');assert.equal(visit.body.metadata.viewport,'<768 px');
  assert.equal(new Set(f.calls.filter(c=>c.route==='sessions/').map(c=>JSON.stringify(c.body))).size,2,'internal retry payload stays equal; later logical retry may omit analytics');
});
test('finish and score replay browser actions, preserve exact duration and strip private responses',async()=>{
  const f=fixture({loseScore:true});await f.call('/api/session',{id});
  const input={session:id,name:' Test Speler ',actions:[],score:9999999,seed:0,contact:{email:'test@example.test',phone:''},arbitrary:'ignored'};
  assert.equal((await f.call('/api/finish',input)).status,200);
  const result=await(await f.call('/api/score',input)).json();assert.equal(result.score,replay([],123456789).score);assert.equal(result.id,scoreId);assert.equal(result.day,'2026-10-06');assert.equal(JSON.stringify(result).includes('@'),false);
  const finish=f.calls.find(c=>c.route.endsWith('/finish/')).body, score=f.calls.find(c=>c.route.endsWith('/score/')).body;
  for(const key of ['score','services','duration','version'])assert.equal(finish[key],score[key]);
  assert.equal('actions' in score,false);assert.equal('metadata' in score,false);assert.equal('seed' in score,false);assert.equal(score.name,'Test Speler');
  assert.deepEqual(f.counts(),{starts:1,finishes:1,saved:1,visits:0});
  assert.equal((await f.call('/api/score',input)).status,200);
});
test('score can finish implicitly, ranks outside top ten remain stored and field errors allow correction',async()=>{
  const f=fixture({rank:11});await f.call('/api/session',{id});
  const bad=await f.call('/api/score',{session:id,name:'Player',actions:[]});assert.equal(bad.status,400);assert.equal((await bad.json()).fields['contact.email'],'This field is required.');assert.equal(f.sessions.get(id).consumed,false);
  const good=await(await f.call('/api/score',{session:id,name:'Player',actions:[],contact:{email:'test@example.test'}})).json();assert.equal(good.rank,11);assert.deepEqual(good.scores,[]);assert.deepEqual(f.counts(),{starts:1,finishes:1,saved:1,visits:0});
});
test('Django daily board uses explicit startday even across midnight and unknown valid versions',async()=>{
  const f=fixture();await f.call('/api/session',{id});await f.call('/api/score',{session:id,name:'Player',actions:[],contact:{email:'test@example.test'}});
  const route=leaderboardRoute({day:'2026-10-06',version:VERSION});const board=await(await f.call(route)).json();assert.equal(board.day,'2026-10-06');assert.match(leaderboardDay(board.day),/6 oktober 2026/);
  assert.equal((await(await f.call('/api/leaderboard')).json()).day,'2026-10-07');
  await f.call('/api/leaderboard?day=2026-10-06&version=earlier');assert.equal(f.calls.at(-1).query.get('version'),'earlier');
});
test('version mismatch, forged actions, expired sessions and cross-origin writes fail before storage',async()=>{
  const mismatch=fixture({meta:{...meta,version:'another-engine'}});assert.equal((await mismatch.call('/api/session',{id})).status,409);assert.equal(mismatch.counts().starts,0);
  const f=fixture();await f.call('/api/session',{id});
  assert.equal((await f.call('/api/score',{session:id,name:'Player',actions:[{tick:0,type:'shot',x:-1,y:0}]})).status,400);
  f.sessions.get(id).expires=Date.now()-1;assert.equal((await f.call('/api/finish',{session:id,actions:[]})).status,400);
  const cross=await handleGameApi(new Request('https://game.example/api/session',{method:'POST',headers:{'Content-Type':'application/json',Origin:'https://evil.example'},body:'{}'}),f.store);assert.equal(cross.status,403);
});
test('temporary and non-JSON failures have bounded retries; rate limits and validation never blindly retry',async()=>{
  for(const status of [400,403,404,429]){
    let calls=0;const store=djangoStorage(config,{fetcher:async()=>{calls++;return new Response('proxy error',{status,headers:{'Retry-After':'120'}});},sleep:async()=>{}});
    await assert.rejects(()=>store.meta(),e=>e.status===status&&e.retryAfter==='120'&&!e.message.includes('test-placeholder-only'));assert.equal(calls,1);
  }
  let calls=0;const store=djangoStorage(config,{fetcher:async()=>{calls++;return new Response('temporary',{status:503});},sleep:async()=>{},random:()=>0});await assert.rejects(()=>store.meta(),e=>e.status===503);assert.equal(calls,3);
  const invalid=djangoStorage(config,{fetcher:async()=>Response.json({...meta,contact_requirements:null})});await assert.rejects(()=>invalid.meta(),e=>e.status===502);
});
test('Sites Django mode works without DB binding, closes all legacy admin routes and fails closed without token',async t=>{
  const f=fixture(),original=globalThis.fetch;globalThis.fetch=f.fetcher;t.after(()=>{globalThis.fetch=original;});
  const env={CASCADE_STORAGE_BACKEND:'django',CASCADE_COMMAND_API_TOKEN:'test-placeholder-only',get DB(){throw new Error('D1 must not be accessed');}};
  assert.equal((await handleApi(new Request('https://game.example/api/meta'),env)).status,200);
  for(const route of ['me','stats','leaderboard','export','update','delete','reset','prize-draw'])assert.equal((await handleApi(new Request('https://game.example/api/admin/'+route),env)).status,410);
  assert.equal((await handleApi(new Request('https://game.example/api/meta'),{CASCADE_STORAGE_BACKEND:'django'})).status,503);
});
test('local Node Django mode uses HTTP adapter and never creates legacy data files',async t=>{
  const directory=mkdtempSync(path.join(tmpdir(),'cascade-django-'));t.after(()=>rmSync(directory,{recursive:true,force:true}));
  const f=fixture(), upstream=http.createServer(async(req,res)=>{
    let body='';for await(const chunk of req)body+=chunk;
    const response=await f.fetcher(new URL(req.url,'http://localhost'),{method:req.method,headers:{Authorization:req.headers.authorization},redirect:'error',body:body||undefined});
    res.writeHead(response.status,{'Content-Type':'application/json'});res.end(await response.text());
  });
  upstream.listen(0,'127.0.0.1');await once(upstream,'listening');t.after(()=>new Promise(resolve=>upstream.close(resolve)));
  const dataDir=path.join(directory,'must-not-exist');
  const child=spawn(process.execPath,['server.mjs'],{cwd:new URL('..',import.meta.url),env:{...process.env,HOST:'127.0.0.1',PORT:'0',CASCADE_DATA_DIR:dataDir,CASCADE_STORAGE_BACKEND:'django',CASCADE_COMMAND_API_TOKEN:'test-placeholder-only',DJANGO_GAMES_API_BASE_URL:`http://localhost:${upstream.address().port}/api/v1/internal/games/cascade-command/`},stdio:['ignore','pipe','pipe']});
  t.after(async()=>{if(child.exitCode===null){child.kill();await once(child,'exit');}});
  let output='';const port=await new Promise((resolve,reject)=>{const timer=setTimeout(()=>reject(new Error('Node server startup timed out')),5000);child.stdout.on('data',chunk=>{output+=chunk;const match=output.match(/localhost:(\d+)/);if(match){clearTimeout(timer);resolve(match[1]);}});child.once('exit',()=>{clearTimeout(timer);reject(new Error('Node server did not start'));});});
  const response=await fetch(`http://localhost:${port}/api/meta`);assert.equal(response.status,200);assert.equal((await response.json()).storageBackend,'django');assert.equal(existsSync(dataDir),false);
  assert.equal((await fetch(`http://localhost:${port}/storage/config.js`)).status,404);
});
