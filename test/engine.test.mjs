import test from 'node:test';
import assert from 'node:assert/strict';
import { Game, replay, SEED, FPS, DURATION, SCAN_COST, THREATS } from '../src/engine.js';
function play(){const game=new Game(SEED),actions=[];while(!game.finished){if(game.tick%20===0&&game.energy>=20){const targets=game.packets.filter(p=>p.warning===0&&THREATS[p.kind].damage>0).sort((a,b)=>Math.hypot(a.x-500,a.y-500)-Math.hypot(b.x-500,b.y-500));if(targets.length){const target=targets[0],to=game.network.map[target.to],length=Math.max(1,Math.hypot(to.x-target.x,to.y-target.y));const a={tick:game.tick,type:'shot',x:target.x+(to.x-target.x)/length*22,y:target.y+(to.y-target.y)/length*22};if(game.act(a))actions.push(a);}}if(game.tick%1100===0){const a={tick:game.tick,type:'scan'};if(game.act(a))actions.push(a);}game.update();}return {game,actions};}
test('client round replay produces identical score, health and timing',()=>{const {game,actions}=play();const result=replay(actions,SEED);assert.equal(result.score,game.score);assert.deepEqual(result.hp,game.hp);assert.equal(result.tick,game.tick);assert.equal(result.prevented,game.prevented);assert.equal(result.discovered,game.discovered);assert.equal(result.mistakes,game.mistakes);assert.deepEqual(result.intelligence,game.intelligence);assert.ok(game.intercepted>10);assert.ok(game.score>2000);console.log('Autoplay:',{score:game.score,services:game.services,hits:game.intercepted,duration:game.seconds});});
test('unprotected chain cascades and loses services',()=>{const g=replay([]);assert.equal(g.services,0);assert.ok(g.cascades>0);assert.ok(g.seconds<DURATION);assert.equal(g.score,0);});
test('energy budget, cooldown and regeneration prevent unlimited fields',()=>{const g=new Game();assert.equal(g.act({type:'shot',x:200,y:200}),true);assert.equal(g.energy,80);assert.equal(g.act({type:'shot',x:200,y:200}),false);for(let i=0;i<60;i++)g.update();assert.ok(Math.abs(g.energy-93)<.00001);assert.equal(g.act({type:'shot',x:-1,y:5}),false);assert.equal(g.act({type:'shot',x:NaN,y:5}),false);});
test('scan has a cooldown and slows incoming incidents',()=>{const a=new Game(),b=new Game();for(let i=0;i<155;i++){a.update();b.update();}assert.ok(a.packets.length);assert.equal(a.act({type:'scan'}),true);assert.equal(a.act({type:'scan'}),false);for(let i=0;i<60;i++){a.update();b.update();}assert.ok(a.packets[0].p<b.packets[0].p);});
test('a shield intercepts a packet before it reaches a service',()=>{const g=new Game();const from=g.network.map.i0,to=g.network.map.c0;g.spawn(from.id,to.id,1);g.act({type:'shot',x:from.x,y:from.y});for(let i=0;i<100;i++)g.update();assert.ok(g.intercepted>0);assert.equal(g.hp[0],4);assert.ok(g.score>=50);});
test('replay rejects forged, reordered, excessive or post-round actions',()=>{assert.throws(()=>replay([{tick:0,type:'shot',x:-1,y:5}]));assert.throws(()=>replay([{tick:5,type:'scan'},{tick:1,type:'scan'}]));assert.throws(()=>replay(Array.from({length:1001},()=>({tick:0,type:'scan'}))));assert.throws(()=>replay([{tick:FPS*DURATION,type:'scan'}]));assert.throws(()=>replay([{tick:0,type:'scan'},{tick:1,type:'scan'}]));});

function isolated(){const game=new Game();game.nextSpawn=Infinity;return game;}
function toService(kind){const g=isolated();g.spawn('i0','c0',1,null,kind);g.packets[0].p=.9999;g.update();return g;}
test('severity drives business impact while low-risk signals pass safely',()=>{
  assert.deepEqual(toService('cve').hp,[2,4,4]);
  assert.deepEqual(toService('incident').hp,[3,4,4]);
  const low=toService('low');assert.deepEqual(low.hp,[4,4,4]);assert.equal(low.ignored,1);assert.equal(low.lost,0);
});
test('hitting low risk costs points, never adds a threat interception or negative score',()=>{
  const g=isolated();g.score=100;g.spawn('i0','c0',1,null,'low');const p=g.packets[0];
  g.fields.push({x:p.x,y:p.y,start:0,end:100,radius:77,hits:0});
  for(let i=0;i<15;i++)g.update();assert.equal(g.mistakes,1);assert.equal(g.score,50);assert.equal(g.intercepted,0);
  const zero=isolated();zero.spawn('i0','c0',1,null,'low');zero.intercept(zero.packets[0],{hits:0});assert.equal(zero.score,0);
});
test('scan spends energy, reveals only observed hidden routes and counts each once',()=>{
  const g=isolated(),node=g.network.map.m1;g.spawn('m1','i1',1,null,'cve');
  assert.equal(g.act({type:'scan',x:node.x,y:node.y}),true);assert.equal(g.energy,100-SCAN_COST);
  assert.equal(g.intelligence.severity,'critical');assert.equal(g.intelligence.tier,2);assert.ok(g.intelligence.country);assert.ok(g.intelligence.services.length);
  assert.ok(g.discovered>0);const count=g.discovered;
  g.scanReady=0;assert.equal(g.act({type:'scan',x:node.x,y:node.y}),true);assert.equal(g.discovered,count);assert.equal(g.intelligence.discovered,0);
  g.scanReady=0;g.energy=SCAN_COST-1;assert.equal(g.act({type:'scan'}),false);assert.equal(g.energy,SCAN_COST-1);
  g.energy=100;assert.equal(g.act({type:'scan',x:NaN,y:3}),false);
});
test('splits preserve threat identity and early interception prevents a real branching path',()=>{
  const g=isolated();g.tick=1500;g.spawn('o2','m1',1,null,'geo');g.packets[0].p=.9999;g.update();
  assert.equal(g.cascades,1);assert.equal(g.packets.length,2);assert.ok(g.packets.every(p=>p.kind==='geo'));assert.equal(new Set(g.packets.map(p=>p.root)).size,1);
  g.intercept(g.packets[0],{hits:0});assert.equal(g.prevented,0,'already split roots cannot earn prevention credit');
  const early=isolated();early.tick=1500;early.spawn('o2','m1',1,null,'geo');early.intercept(early.packets[0],{hits:0});
  assert.equal(early.prevented,1);assert.equal(early.score,175,'50 interception + 100 prevention + 25 quick reaction');
  const low=isolated();low.tick=1500;low.spawn('o2','m1',1,null,'low');low.packets[0].p=.9999;low.update();assert.equal(low.cascades,0);assert.equal(low.packets.length,1);
});
test('remaining operational services give exactly 200 points each',()=>{
  const game=isolated();game.tick=DURATION*FPS-1;game.hp=[1,0,3];game.update();assert.equal(game.finished,true);assert.equal(game.bonus,400);assert.equal(game.score,400);
});

test('automatic intelligence prioritizes operational business impact',()=>{
  const game=isolated();game.hp=[0,4,4];game.spawn('i0','c0',1,null,'cve');game.spawn('i2','c1',1,null,'incident');
  assert.equal(game.act({type:'scan'}),true);assert.equal(game.intelligence.label,'Leveranciersincident');assert.deepEqual(game.intelligence.activeServices,['Betalingen']);
});
