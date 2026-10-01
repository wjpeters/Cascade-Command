import assert from 'node:assert/strict';
import {createRequire} from 'node:module';
import {mkdir,writeFile} from 'node:fs/promises';
const require=createRequire(import.meta.url);
const {chromium,webkit}=require('/Users/wp/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright');
const directory='/private/tmp/cascade-pause-change/measurements';await mkdir(directory,{recursive:true});
const chrome=await chromium.launch({headless:true,executablePath:'/Applications/Google Chrome.app/Contents/MacOS/Google Chrome'});
const safari=await webkit.launch({headless:true,executablePath:'/Users/wp/Library/Caches/ms-playwright/webkit-2359/pw_run.sh'});
const checks=[];
async function instrument(page){
 await page.addInitScript(()=>{
  window.__work={frames:0,draws:0,mutations:0};
  const request=requestAnimationFrame;window.requestAnimationFrame=callback=>request.call(window,now=>{window.__work.frames++;callback(now);});
  const clear=CanvasRenderingContext2D.prototype.clearRect;CanvasRenderingContext2D.prototype.clearRect=function(...args){window.__work.draws++;return clear.apply(this,args);};
  const observer=new MutationObserver(records=>window.__work.mutations+=records.length);
  addEventListener('DOMContentLoaded',()=>observer.observe(document.body,{subtree:true,childList:true,attributes:true,characterData:true}),{once:true});
 });
}
async function exposeGame(page){
 await page.evaluate(async()=>{
  const {Game}=await import('/src/engine.js');const update=Game.prototype.update;
  Game.prototype.update=function(){window.__game=this;return update.call(this);};
  window.__serviceText=document.getElementById('services').firstChild;
  window.__serviceDenominator=document.getElementById('services').querySelector('span');
 });
}
async function staticSample(page){
 await page.waitForTimeout(300);const first=await page.evaluate(()=>({...window.__work,tick:window.__game.tick}));
 await page.waitForTimeout(1000);const last=await page.evaluate(()=>({...window.__work,tick:window.__game.tick}));
 assert.equal(last.frames-first.frames,0);assert.equal(last.draws-first.draws,0);assert.equal(last.mutations-first.mutations,0);assert.equal(last.tick,first.tick);
 return {frames:0,draws:0,mutations:0,tick:last.tick};
}
for(const [name,browser,viewport,mobile] of [['chrome-desktop',chrome,{width:1440,height:900},false],['chrome-mobile',chrome,{width:390,height:844},true],['webkit-mobile',safari,{width:390,height:844},true]]){
 const context=await browser.newContext({viewport,deviceScaleFactor:mobile?3:2,isMobile:mobile,hasTouch:mobile}),page=await context.newPage(),errors=[];
 page.on('pageerror',error=>errors.push(error.message));await instrument(page);
 await page.goto('http://127.0.0.1:4321/');await page.waitForFunction(()=>document.body.dataset.assets==='ready');await exposeGame(page);
 await page.locator('#start').click();await page.waitForFunction(()=>document.body.dataset.state==='playing');await page.waitForTimeout(100);
 await page.locator('#scan').click();await page.waitForFunction(()=>document.getElementById('scan-text').textContent==='Actief');
 await page.locator('#pause').click();await page.waitForFunction(()=>document.body.dataset.state==='paused');
 const paused=await staticSample(page),beforeResize=await page.evaluate(()=>window.__work.draws);
 await page.setViewportSize({width:mobile?430:1280,height:viewport.height});await page.waitForTimeout(300);
 const resize=await page.evaluate(()=>({draws:window.__work.draws,width:document.getElementById('game').width,expected:Math.round(document.getElementById('game').getBoundingClientRect().width*Math.min(devicePixelRatio,2))}));
 assert.ok(resize.draws>beforeResize);assert.equal(resize.width,resize.expected);await staticSample(page);
 await page.screenshot({path:directory+'/'+name+'-paused.png',fullPage:true});
 const resumed=await page.evaluate(()=>{const tick=window.__game.tick;document.getElementById('resume').click();return {tick,time:performance.now()};});
 await page.waitForTimeout(120);const next=await page.evaluate(()=>({tick:window.__game.tick,time:performance.now(),state:document.body.dataset.state}));
 assert.equal(next.state,'playing');assert.ok(next.tick>resumed.tick);assert.ok(next.tick-resumed.tick<=Math.ceil((next.time-resumed.time)/1000*60)+2);
 await page.evaluate(()=>{const game=window.__game;game.spawn('i0','c0',1,null,'cve');game.packets.at(-1).p=.9999;});
 await page.waitForFunction(()=>document.getElementById('health-0').textContent==='50%');
 assert.equal(await page.locator('#hp-0').getAttribute('aria-valuenow'),'50');assert.equal(await page.locator('#service-0').evaluate(element=>element.classList.contains('warning')),true);
 assert.equal(await page.evaluate(()=>document.getElementById('services').firstChild===window.__serviceText&&document.getElementById('services').querySelector('span')===window.__serviceDenominator),true);
 // Let the actual engine end a short test round through service failure.
 await page.evaluate(()=>{window.__game.hp=[0,0,0];});await page.waitForFunction(()=>document.body.dataset.state==='result');
 assert.equal(await page.locator('#services').textContent(),'0 / 3');assert.equal(await page.locator('#final-services').textContent(),'0 / 3');
 const result=await staticSample(page);const resultBeforeResize=await page.evaluate(()=>window.__work.draws);
 await page.setViewportSize(viewport);await page.waitForTimeout(300);assert.ok(await page.evaluate(()=>window.__work.draws)>resultBeforeResize);await staticSample(page);
 await page.screenshot({path:directory+'/'+name+'-result.png',fullPage:true});
 await page.locator('#retry').click();await page.waitForFunction(()=>document.body.dataset.state==='playing');
 assert.equal(await page.locator('#services').textContent(),'3 / 3');assert.equal(await page.locator('#health-0').textContent(),'100%');
 await page.locator('#pause').click();await page.locator('#quit').click();await page.waitForFunction(()=>document.body.dataset.state==='intro');
 await page.locator('#watch-demo').click();await page.waitForFunction(()=>document.body.dataset.state==='demo');
 await page.waitForTimeout(100);const demoBefore=await page.evaluate(()=>window.__work.draws);await page.waitForTimeout(100);assert.ok(await page.evaluate(()=>window.__work.draws)>demoBefore);
 await page.locator('#demo-play').click();await page.waitForFunction(()=>document.body.dataset.state==='playing');
 assert.deepEqual(errors,[]);assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth),false);
 checks.push({name,passed:true,paused,result,resizeDraws:resize.draws-beforeResize,resumeTicks:next.tick-resumed.tick,resumeElapsedMs:next.time-resumed.time,errors});
 await context.close();console.log(JSON.stringify({name,passed:true}));
}
// Visibility events suspend animation in every state and stop automatic polling.
{
 const context=await chrome.newContext(),page=await context.newPage();await page.clock.install();await instrument(page);
 let boardRequests=0;page.on('request',request=>{if(request.url().endsWith('/api/leaderboard'))boardRequests++;});
 await page.goto('http://127.0.0.1:4321/');await page.waitForFunction(()=>document.body.dataset.assets==='ready');await exposeGame(page);
 await page.evaluate(()=>{window.__hidden=false;Object.defineProperty(document,'hidden',{configurable:true,get:()=>window.__hidden});});
 const states=[];
 for(const state of ['intro','demo','playing']){
  if(state==='demo')await page.locator('#watch-demo').click();if(state==='playing')await page.locator('#demo-play').click();
  await page.clock.runFor(100);
  await page.evaluate(()=>{window.__hidden=true;document.dispatchEvent(new Event('visibilitychange'));});
  const first=await page.evaluate(()=>({...window.__work,tick:window.__game.tick})),requests=boardRequests;
  await page.clock.runFor(16000);
  const last=await page.evaluate(()=>({...window.__work,tick:window.__game.tick,state:document.body.dataset.state}));
  assert.equal(last.draws,first.draws);assert.equal(last.frames,first.frames);assert.equal(last.tick,first.tick);assert.equal(boardRequests,requests);
  if(state==='playing')assert.equal(last.state,'paused');
  await page.evaluate(()=>{window.__hidden=false;document.dispatchEvent(new Event('visibilitychange'));});await page.clock.runFor(100);
  if(state!=='playing')assert.ok(await page.evaluate(()=>window.__work.draws)>last.draws);
  else assert.equal(await page.locator('#resume').isVisible(),true);
  states.push({state,hiddenDraws:0,hiddenFrames:0,hiddenPolls:0});
 }
 checks.push({name:'hidden-tab',passed:true,states});await context.close();console.log(JSON.stringify({name:'hidden-tab',passed:true}));
}
// A stable leaderboard response must not repeatedly rebuild paused DOM.
{
 const context=await chrome.newContext(),page=await context.newPage();await page.clock.install();await instrument(page);
 let polls=0;page.on('request',request=>{if(request.url().endsWith('/api/leaderboard'))polls++;});
 await page.goto('http://127.0.0.1:4321/');await page.waitForFunction(()=>document.body.dataset.assets==='ready');await exposeGame(page);
 await page.locator('#start').click();await page.clock.runFor(100);await page.locator('#pause').click();await page.clock.runFor(100);
 const first=await page.evaluate(()=>({...window.__work})),requests=polls;await page.clock.runFor(16000);await page.waitForLoadState('networkidle');
 const last=await page.evaluate(()=>({...window.__work}));assert.ok(polls>requests);assert.equal(last.mutations,first.mutations);assert.equal(last.draws,first.draws);
 checks.push({name:'unchanged-leaderboard',passed:true,polls:polls-requests,mutations:0});await context.close();console.log(JSON.stringify({name:'unchanged-leaderboard',passed:true}));
}
// Simulate a faster display while making a HUD field change every simulation tick.
{
 const context=await chrome.newContext(),page=await context.newPage();await page.clock.install();await instrument(page);
 await page.addInitScript(()=>{window.requestAnimationFrame=callback=>setTimeout(()=>{window.__work.frames++;callback(performance.now());},1000/120);window.cancelAnimationFrame=id=>clearTimeout(id);});
 await page.goto('http://127.0.0.1:4321/');await page.waitForFunction(()=>document.body.dataset.assets==='ready');
 await page.evaluate(async()=>{const {Game}=await import('/src/engine.js');const update=Game.prototype.update;window.__ticks=0;Game.prototype.update=function(){const result=update.call(this);window.__ticks++;this.energy=50+this.tick%40;return result;};window.__energyWrites=0;new MutationObserver(records=>window.__energyWrites+=records.length).observe(document.getElementById('energy-fill'),{attributes:true});});
 await page.locator('#start').click();
 const first=await page.evaluate(()=>({frames:window.__work.frames,ticks:window.__ticks,writes:window.__energyWrites}));await page.clock.runFor(1600);
 const last=await page.evaluate(()=>({frames:window.__work.frames,ticks:window.__ticks,writes:window.__energyWrites}));
 assert.ok(last.frames-first.frames>=170);assert.ok(last.ticks-first.ticks>=90);assert.ok(last.ticks-first.ticks<=100);assert.ok(last.writes-first.writes<=25);
 checks.push({name:'120hz-hud-clock',passed:true,frames:last.frames-first.frames,ticks:last.ticks-first.ticks,energyWrites:last.writes-first.writes,virtualMs:1600});await context.close();console.log(JSON.stringify({name:'120hz-hud-clock',passed:true}));
}
// A session response arriving after a tab switch must not bypass pause.
{
 const context=await chrome.newContext(),page=await context.newPage();await instrument(page);
 await page.goto('http://127.0.0.1:4321/');await page.waitForFunction(()=>document.body.dataset.assets==='ready');
 let release;const gate=new Promise(resolve=>release=resolve);
 await page.route('**/api/session',async route=>{await gate;await route.continue();});
 await page.locator('#start').click();
 await page.evaluate(()=>{window.__hidden=true;Object.defineProperty(document,'hidden',{configurable:true,get:()=>window.__hidden});document.dispatchEvent(new Event('visibilitychange'));});
 release();await page.waitForFunction(()=>document.body.dataset.state==='paused');
 const first=await page.evaluate(()=>({...window.__work}));await page.waitForTimeout(100);const last=await page.evaluate(()=>({...window.__work}));
 assert.equal(last.frames,first.frames);assert.equal(last.draws,first.draws);
 await page.evaluate(()=>{window.__hidden=false;document.dispatchEvent(new Event('visibilitychange'));});
 await page.waitForTimeout(100);assert.equal(await page.locator('#resume').isVisible(),true);
 await page.locator('#resume').click();await page.waitForFunction(()=>document.body.dataset.state==='playing');
 checks.push({name:'delayed-session-hidden',passed:true});await context.close();console.log(JSON.stringify({name:'delayed-session-hidden',passed:true}));
}
await chrome.close();await safari.close();await writeFile(directory+'/browser-checks.json',JSON.stringify({date:new Date().toISOString(),checks},null,2)+'\n');
console.log(JSON.stringify({passed:checks.length}));
