import { createRequire } from 'node:module';
import { mkdir, writeFile } from 'node:fs/promises';
const require=createRequire(import.meta.url);
const {chromium}=require('/Users/wp/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright');
const mode=process.argv[2]||'before',directory='/private/tmp/cascade-pause-change/measurements';
await mkdir(directory,{recursive:true});
const browser=await chromium.launch({headless:true,executablePath:'/Applications/Google Chrome.app/Contents/MacOS/Google Chrome'});
const page=await browser.newPage({viewport:{width:1440,height:900},deviceScaleFactor:2});
const errors=[];page.on('pageerror',error=>errors.push(error.message));
await page.addInitScript(()=>{
 window.__work={frames:0,draws:0,mutations:0,hudMutations:0};
 const request=window.requestAnimationFrame;window.requestAnimationFrame=callback=>request.call(window,now=>{window.__work.frames++;callback(now);});
 const clear=CanvasRenderingContext2D.prototype.clearRect;CanvasRenderingContext2D.prototype.clearRect=function(...args){window.__work.draws++;return clear.apply(this,args);};
 const observer=new MutationObserver(records=>{window.__work.mutations+=records.length;for(const record of records){const element=record.target.nodeType===Node.ELEMENT_NODE?record.target:record.target.parentElement;if(element?.closest('.hud,.control-rail,#service-list,#combo,#scan-peek'))window.__work.hudMutations++;}});
 addEventListener('DOMContentLoaded',()=>observer.observe(document.body,{subtree:true,childList:true,attributes:true,characterData:true}),{once:true});
});
await page.goto('http://127.0.0.1:4321/');await page.waitForFunction(()=>document.body.dataset.assets==='ready');
const samples=[];
async function sample(state){
 const first=await page.evaluate(()=>({time:performance.now(),...window.__work}));
 await page.waitForTimeout(4000);
 const last=await page.evaluate(()=>({time:performance.now(),...window.__work}));
 const duration=(last.time-first.time)/1000,result={state,duration};
 for(const key of ['frames','draws','mutations','hudMutations']){result[key]=last[key]-first[key];result[key+'PerSecond']=result[key]/duration;}
 samples.push(result);console.log(JSON.stringify({mode,...result}));
}
await page.locator('#start').click();await page.waitForFunction(()=>document.body.dataset.state==='playing');
await page.waitForTimeout(2500);await sample('playing');
await page.locator('#pause').click();await page.waitForFunction(()=>document.body.dataset.state==='paused');
await page.waitForTimeout(2300);await sample('paused');await page.screenshot({path:directory+'/'+mode+'-paused.png'});
await page.locator('#resume').click();
// Reach the real finish UI quickly; no scores are submitted in this measurement.
await page.evaluate(async()=>{const {Game,FPS,DURATION}=await import('/src/engine.js');const update=Game.prototype.update;Game.prototype.update=function(){Game.prototype.update=update;this.tick=FPS*DURATION-1;return update.call(this);};});
await page.waitForFunction(()=>document.body.dataset.state==='result');
await page.waitForTimeout(2300);await sample('result');await page.screenshot({path:directory+'/'+mode+'-result.png'});
await writeFile(directory+'/'+mode+'.json',JSON.stringify({mode,date:new Date().toISOString(),browser:browser.version(),viewport:{width:1440,height:900},samples,errors},null,2)+'\n');
await browser.close();
