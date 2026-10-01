import{createRequire}from'node:module';import{mkdir,writeFile}from'node:fs/promises';
const require=createRequire(import.meta.url),{chromium,webkit}=require('/Users/wp/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright');
const mode=process.argv[2]||'before',out='/private/tmp/cascade-assets-change/measurements';await mkdir(out,{recursive:true});
const browser=await chromium.launch({headless:true,executablePath:'/Applications/Google Chrome.app/Contents/MacOS/Google Chrome'}),results={mode,date:new Date().toISOString(),browser:browser.version(),profiles:[]};
for(let i=0;i<3;i++){
 const context=await browser.newContext({viewport:{width:390,height:844},deviceScaleFactor:3,isMobile:true,hasTouch:true}),page=await context.newPage(),cdp=await context.newCDPSession(page);const errors=[];page.on('pageerror',e=>errors.push(e.message));
 await cdp.send('Network.enable');await cdp.send('Network.setCacheDisabled',{cacheDisabled:true});await cdp.send('Emulation.setCPUThrottlingRate',{rate:4});await cdp.send('Network.emulateNetworkConditions',{offline:false,latency:150,downloadThroughput:200000,uploadThroughput:93750,connectionType:'cellular4g'});
 await page.addInitScript(()=>{window.__assetTimes=[];const decode=HTMLImageElement.prototype.decode;HTMLImageElement.prototype.decode=function(){return decode.call(this).then(x=>{window.__assetTimes.push({url:this.src,time:performance.now()});return x;});};});
 await page.goto('http://127.0.0.1:4320/',{waitUntil:'domcontentloaded'});
 if(mode==='before')await page.waitForFunction(()=>window.__assetTimes.some(x=>x.url.endsWith('/assets/sprites.png')),{timeout:45000});else await page.waitForFunction(()=>document.body.dataset.assets==='ready',{timeout:45000});
 await page.waitForLoadState('networkidle');
 const data=await page.evaluate(()=>({ready:document.body.dataset.assets==='ready'?Number(document.body.dataset.assetsReadyMs):window.__assetTimes.find(x=>x.url.endsWith('/assets/sprites.png')).time,times:window.__assetTimes,resources:performance.getEntriesByType('resource').map(x=>({path:new URL(x.name).pathname,bytes:x.encodedBodySize,end:x.responseEnd})),navigation:performance.getEntriesByType('navigation')[0].toJSON(),loading:document.getElementById('asset-status')?.textContent,startDisabled:document.getElementById('start').disabled,overflow:document.documentElement.scrollWidth>innerWidth}));
 data.bytes=data.resources.reduce((s,x)=>s+x.bytes,0)+data.navigation.encodedBodySize;data.errors=errors;results.profiles.push(data);
 if(i===0)await page.screenshot({path:out+'/'+mode+'-mobile.png',fullPage:true});
 console.log(JSON.stringify({mode,run:i+1,ready:Math.round(data.ready),bytes:data.bytes,errors}));await context.close();
}
await browser.close();await writeFile(out+'/'+mode+'.json',JSON.stringify(results,null,2));
