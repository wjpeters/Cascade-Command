import assert from 'node:assert/strict';
import { createRequire } from 'node:module';
import { writeFile } from 'node:fs/promises';
const require = createRequire(import.meta.url);
const { chromium, webkit } = require('/Users/wp/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright');
const output = '/private/tmp/cascade-assets-change/measurements';
const checks = [];
const chrome = await chromium.launch({headless:true,executablePath:'/Applications/Google Chrome.app/Contents/MacOS/Google Chrome'});
const safari = await webkit.launch({headless:true,executablePath:'/Users/wp/Library/Caches/ms-playwright/webkit-2359/pw_run.sh'});
async function snapshot(page) {
  return page.evaluate(() => ({assets:document.body.dataset.assets,state:document.body.dataset.state,status:document.getElementById('asset-status').textContent,startDisabled:document.getElementById('start').disabled,overflow:document.documentElement.scrollWidth>innerWidth}));
}
async function ready(page) {await page.waitForFunction(()=>document.body.dataset.assets==='ready');}
for(const [name,browser,viewport,mobile] of [['chrome-desktop',chrome,{width:1440,height:1000},false],['chrome-mobile-320',chrome,{width:320,height:740},true],['webkit-mobile-390',safari,{width:390,height:844},true]]) {
  const context=await browser.newContext({viewport,deviceScaleFactor:mobile?3:1,isMobile:mobile,hasTouch:mobile});
  const page=await context.newPage(),errors=[],assetResponses=[];
  page.on('pageerror',error=>errors.push(error.message));
  page.on('response',response=>{if(response.url().includes('/assets/'))assetResponses.push({path:new URL(response.url()).pathname,status:response.status(),type:response.headers()['content-type'],cache:response.headers()['cache-control']});});
  await page.addInitScript(()=>{
    window.__spriteSources=[];const original=CanvasRenderingContext2D.prototype.drawImage;
    CanvasRenderingContext2D.prototype.drawImage=function(...args){if(args[0]?.src?.includes('/assets/sprites.'))window.__spriteSources.push(args.slice(1,5));return original.apply(this,args);};
  });
  await page.goto('http://127.0.0.1:4320/');await ready(page);
  assert.equal((await snapshot(page)).overflow,false,name);
  assert.equal(await page.locator('#start').isEnabled(),true,name);
  await page.locator('#start').click();await page.waitForFunction(()=>document.body.dataset.state==='playing');
  const canvas=page.locator('#game'),box=await canvas.boundingBox();
  if(mobile)await canvas.tap({position:{x:box.width*.5,y:box.height*.35}});else await canvas.click({position:{x:box.width*.5,y:box.height*.35}});
  await page.waitForFunction(()=>window.__spriteSources.some(([x])=>x===512));
  await page.locator('#scan').click();
  assert.ok((await page.locator('#intel-details').textContent()).length>20,name);
  await page.locator('#pause').click();await page.waitForFunction(()=>document.body.dataset.state==='paused');
  await page.locator('#resume').click();await page.waitForFunction(()=>document.body.dataset.state==='playing');
  await page.locator('#pause').click();await page.locator('#quit').click();await page.waitForFunction(()=>document.body.dataset.state==='intro');
  await page.locator('#watch-demo').click();await page.waitForFunction(()=>document.body.dataset.state==='demo');
  await page.locator('#demo-play').click();await page.waitForFunction(()=>document.body.dataset.state==='playing');
  await page.locator('#pause').click();
  await page.screenshot({path:output+'/'+name+'.png',fullPage:true});
  const sources=await page.evaluate(()=>[...new Set(window.__spriteSources.map(x=>JSON.stringify(x)))]);
  assert.ok(sources.includes('[0,0,512,512]'),name);assert.ok(sources.includes('[512,0,512,512]'),name);
  assert.equal((await snapshot(page)).overflow,false,name);assert.deepEqual(errors,[],name);
  assert.ok(assetResponses.length>=3,name);
  for(const item of assetResponses){assert.equal(item.status,200);assert.equal(item.type,'image/webp');assert.match(item.cache,/immutable/);}
  checks.push({name,passed:true,errors,assets:assetResponses,spriteSources:sources});
  await context.close();
}
// A delayed essential image must keep the launch controls disabled.
{
 const context=await chrome.newContext({viewport:{width:390,height:844},isMobile:true,hasTouch:true}),page=await context.newPage();
 let release;const gate=new Promise(resolve=>release=resolve);let sessions=0;
 page.on('request',request=>{if(request.url().endsWith('/api/session'))sessions++;});
 await page.route('**/assets/sprites.*.webp',async route=>{await gate;await route.continue();});
 await page.goto('http://127.0.0.1:4320/',{waitUntil:'domcontentloaded'});
 await page.waitForFunction(()=>document.body.dataset.assets==='loading');
 assert.equal(await page.locator('#start').isDisabled(),true);assert.equal(await page.locator('#watch-demo').isDisabled(),true);
 assert.match(await page.locator('#asset-status').textContent(),/laden/);
 await page.locator('#start').evaluate(button=>button.click());assert.equal(sessions,0);
 await page.screenshot({path:output+'/loading-mobile.png',fullPage:true});
 release();await ready(page);assert.equal(await page.locator('#start').isEnabled(),true);
 checks.push({name:'delayed-image',passed:true,sessionsBeforeReady:sessions});await context.close();
}
// Fail the essential asset, then recover through the visible retry action.
{
 const context=await chrome.newContext({viewport:{width:390,height:844},isMobile:true,hasTouch:true}),page=await context.newPage();
 let fail=true,sessions=0,requests=0;const errors=[];
 page.on('pageerror',error=>errors.push(error.message));page.on('request',request=>{if(request.url().endsWith('/api/session'))sessions++;});
 await page.route('**/assets/sprites.*.webp',async route=>{requests++;if(fail)await route.fulfill({status:503,contentType:'text/plain',body:'Unavailable'});else await route.continue();});
 await page.goto('http://127.0.0.1:4320/');await page.waitForFunction(()=>document.body.dataset.assets==='error');
 assert.equal(await page.locator('#start').isDisabled(),true);assert.equal(await page.locator('#retry-assets').isVisible(),true);
 assert.match(await page.locator('#asset-status').textContent(),/Probeer opnieuw/);assert.equal(sessions,0);
 assert.equal(await page.locator('#start-label').textContent(),'Laden mislukt');
 await page.screenshot({path:output+'/failed-mobile.png',fullPage:true});
 fail=false;await page.locator('#retry-assets').click();await ready(page);
 assert.equal(await page.locator('#retry-assets').isVisible(),false);assert.equal(await page.locator('#start-error').textContent(),'');
 await page.locator('#start').click();await page.waitForFunction(()=>document.body.dataset.state==='playing');
 assert.equal(sessions,1);assert.deepEqual(errors,[]);
 checks.push({name:'failed-image-retry',passed:true,spriteRequests:requests,sessionsAfterRetry:sessions,errors});await context.close();
}
// A missing decorative background or logo must not block the playable game.
{
 const context=await chrome.newContext(),page=await context.newPage();
 await page.route(/\/assets\/(space|riskstudio-logo)\..*\.webp$/,route=>route.fulfill({status:503,contentType:'text/plain',body:'Unavailable'}));
 await page.goto('http://127.0.0.1:4320/');await ready(page);await page.locator('#start').click();await page.waitForFunction(()=>document.body.dataset.state==='playing');
 checks.push({name:'decorative-image-fallback',passed:true});await context.close();
}
await chrome.close();await safari.close();
await writeFile(output+'/browser-checks.json',JSON.stringify({date:new Date().toISOString(),checks},null,2)+'\n');
console.log(JSON.stringify({passed:checks.length,checks:checks.map(check=>check.name)}));
