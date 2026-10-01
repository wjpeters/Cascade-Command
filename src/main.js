import { renderMobileShare } from './mobile-share.js';
import { Game, FPS, DURATION, SEED, VERSION, THREATS, SHOT_COST, SCAN_COST, GAME_CONFIG, SERVICE_NAMES, clamp } from './engine.js';
import { Renderer } from './renderer.js';
import { Audio } from './audio.js';
import { CATEGORIES, symbolMarkup, SERVICE_VISUALS, serviceSymbolMarkup } from './symbols.js';
import { loadGameAssets } from './asset-loader.js';
const $=id=>document.getElementById(id), canvas=$('game'), renderer=new Renderer(canvas), audio=new Audio();
let state='intro',game=new Game(),session=null,actions=[],lastFrame=0,accumulator=0,toastUntil=0,previousPhase=1,boardId=null,mobileUrl='',busy=false,lastAnnounced=0;
let lastFeed=-1,lastIntel=undefined,boardRequest=0,scanTargeting=false;
let assetsReady=false,assetsLoading=false;
function updateLaunchButtons(){
  for(const id of ['start','retry','demo-play','watch-demo'])$(id).disabled=!assetsReady||busy;
  $('start-label').textContent=busy?'Missie starten…':assetsReady?'Start missie':document.body.dataset.assets==='error'?'Laden mislukt':'Spel laden…';
}
async function prepareAssets(){
  if(assetsLoading)return;
  assetsLoading=true;assetsReady=false;document.body.dataset.assets='loading';
  $('retry-assets').hidden=true;$('start-error').textContent='';updateLaunchButtons();
  try{
    const {images}=await loadGameAssets(({completed,total})=>{$('asset-status').textContent=`Spelbeelden laden · ${completed}/${total}`;});
    renderer.image=images.sprites;assetsReady=true;
    document.body.dataset.assets='ready';document.body.dataset.assetsReadyMs=String(Math.round(performance.now()));
    $('asset-status').textContent='Klaar voor de missie';
  }catch(error){
    document.body.dataset.assets='error';$('asset-status').textContent=error.message;
    $('retry-assets').hidden=false;
  }finally{assetsLoading=false;updateLaunchButtons();}
}
$('retry-assets').addEventListener('click',prepareAssets);
prepareAssets();
const formatTime=tick=>`${String(Math.floor(tick/FPS/60)).padStart(2,'0')}:${String(Math.floor(tick/FPS)%60).padStart(2,'0')}`;
const severityName={critical:'Kritiek',high:'Hoog',low:'Laag',unknown:'Geen signaal in beeld'};
const formatNumber=value=>value.toLocaleString('nl-NL',{maximumFractionDigits:2});
const roundTime=seconds=>`${String(Math.floor(seconds/60)).padStart(2,'0')}:${String(seconds%60).padStart(2,'0')}`;
const branchWave=GAME_CONFIG.waves.find(wave=>wave.maxBranches>1);
for(const element of document.querySelectorAll('[data-config-duration]'))element.textContent=formatNumber(DURATION);
$('energy-note').textContent=`Veld ${formatNumber(SHOT_COST)} · scan ${formatNumber(SCAN_COST)} · herstel ${formatNumber(GAME_CONFIG.energy.regenerationPerSecond)}/s`;
document.querySelector('.scan-cost').textContent=`${formatNumber(SCAN_COST)} energie per scan`;
$('rules-shot').textContent=`Klik of tik vóór een dreiging om een kort beschermingsveld te plaatsen. De onderschepper reist vanaf het centrum, dus richt een stukje vooruit. Een veld kost ${formatNumber(SHOT_COST)} energie en kan meerdere signalen raken, ook lage risico’s. Je krijgt ${formatNumber(GAME_CONFIG.energy.regenerationPerSecond)} energie per seconde terug.`;
$('rules-scan-cost').textContent=`Scan kost ${formatNumber(SCAN_COST)} energie.`;
$('rules-scan-time').textContent=`Scan vertraagt signalen ${formatNumber(GAME_CONFIG.scan.durationSeconds)} seconden naar ${formatNumber(GAME_CONFIG.scan.speedMultiplier*100)}% snelheid en kan na ${formatNumber(GAME_CONFIG.scan.cooldownSeconds)} seconden opnieuw. Nieuw ontdekte verbindingen blijven zichtbaar. Alle leveranciers en risico’s zijn fictief; dit is een spelmetafoor, geen live RiskStudio-dataset.`;
$('rules-branching').textContent=branchWave?`Vanaf seconde ${formatNumber(branchWave.startsAtSeconds)} kunnen ze bij gedeelde leveranciers opsplitsen. Stop ze vroeg om een kettingreactie te voorkomen.`:'Risico’s volgen de keten zonder zich op te splitsen.';

$('service-list').innerHTML=SERVICE_NAMES.map((name,i)=>`<div class="service-row" data-service="${SERVICE_VISUALS[name].key}" id="service-${i}"><span class="service-symbol" aria-hidden="true">${serviceSymbolMarkup(name)}</span><span class="service-name">${name}</span><div class="service-health" role="progressbar" id="hp-${i}" aria-label="Weerbaarheid ${name}" aria-valuemin="0" aria-valuemax="100" aria-valuenow="100"><i></i></div><strong id="health-${i}">100%</strong></div>`).join('');
$('category-list').innerHTML=Object.entries(CATEGORIES).filter(([kind])=>kind!=='low').map(([kind,item])=>`<div class="category" data-kind="${kind}"><span class="category-symbol">${symbolMarkup(kind)}</span><div><strong>${item.title}</strong><span>${item.detail}</span></div></div>`).join('');

const emptyBoard=$('leaderboard').innerHTML;
async function request(url,options={}){
  const response=await fetch(url,{...options,headers:{'Content-Type':'application/json',...options.headers}});
  const data=await response.json();if(!response.ok)throw new Error(data.error||'Verbinding met de gameserver mislukt.');return data;
}
// All three panels remain visible together, including during a round.
function setTargeting(value){
  scanTargeting=value;renderer.targeting=value;renderer.pointer=null;
  canvas.classList.toggle('targeting',value);$('target-scan').setAttribute('aria-pressed',String(value));
  $('target-scan').innerHTML=value?'Annuleer selectie <span>×</span>':'Kies een leverancier <span>⌖</span>';
  $('target-help').textContent=value?'Tik of klik op een node of dreiging. Esc annuleert.':'De scanknop onderzoekt automatisch het urgentste risico.';
}
function showPanel(id){for(const name of ['intro','pause-panel','result'])$(name).hidden=name!==id;}
function setState(value){
  state=value;if(state!=='playing')setTargeting(false);canvas.dataset.state=state;document.body.dataset.state=state;
  $('pause').hidden=state!=='playing';$('demo-label').hidden=state!=='demo';$('scan').disabled=state!=='playing';
  $('feed-mode').textContent=state==='intro'||state==='demo'?'Demo':state==='paused'?'Pauze':state==='result'?'Afgelopen':'Live';
  if(state==='intro')showPanel('intro');else if(state==='paused')showPanel('pause-panel');else if(state==='result')showPanel('result');else showPanel(null);
}
function toast(text,danger=false){$('event-toast').textContent=text;$('event-toast').className='event-toast show'+(danger?' danger':'');toastUntil=performance.now()+2100;}
function drawBoard(scores){
  const board=$('leaderboard');if(!scores.length){board.innerHTML=emptyBoard;return;}board.replaceChildren();
  for(const [index,score] of scores.entries()){
    const row=document.createElement('div');row.className='board-row'+(score.id===boardId?' mine':'');
    for(const [className,text] of [['rank',String(index+1).padStart(2,'0')],['name',score.name],['points',score.score.toLocaleString('nl-NL')]]){const span=document.createElement('span');span.className=className;span.textContent=text;row.append(span);}board.append(row);
  }
}
async function refreshBoard(){
  const revision=++boardRequest;
  try{const data=await request('/api/leaderboard');if(revision===boardRequest)drawBoard(data.scores);}
  catch{if(revision===boardRequest)$('leaderboard').innerHTML='<div class="empty-board"><strong>Leaderboard even niet bereikbaar.</strong><p>Probeer het zo opnieuw.</p></div>';}
}
function drawIntelligence(){
  const info=game.intelligence;
  if(info===lastIntel)return;lastIntel=info;
  $('intel-details').replaceChildren();$('intel-details').hidden=!info;$('intel-empty').hidden=!!info;$('intel-more').hidden=!info;
  renderer.selectedNode=info?game.network.nodes.find(node=>node.name===info.supplier)?.id:null;
  $('intel-card').classList.toggle('has-intel',!!info);
  if(!info)return;
  const heading=document.createElement('div');heading.className='supplier-heading';
  const supplier=document.createElement('strong');supplier.className='intel-supplier';supplier.textContent=info.supplier;
  const tier=document.createElement('span');tier.className='tier-badge';tier.textContent='TIER '+info.tier;heading.append(supplier,tier);
  const country=document.createElement('p');country.className='intel-country';country.textContent='◎ '+info.country;
  const kind=Object.keys(THREATS).find(key=>THREATS[key].label===info.label),category=kind?CATEGORIES[kind]:null;
  const badge=document.createElement('p');badge.className='intel-threat '+info.severity;
  if(category){const icon=document.createElement('span');icon.className='intel-threat-icon';icon.dataset.kind=kind;icon.innerHTML=symbolMarkup(kind);badge.append(icon);}
  badge.append(document.createTextNode(info.label));
  const table=document.createElement('dl');
  const impact=info.damage===0?'Geen in dit scenario':info.activeServices.length===0?'Diensten al uitgevallen':`${info.activeServices.join(', ')}${info.damage===null?'':` · −${info.damage*25}% bij inslag`}`;
  const entries=[['Ernst',severityName[info.severity]],['Business impact',impact],['Land / jurisdictie',`${info.country} / ${info.jurisdiction}`],['Cyberrating',`${info.rating} / 100`],['Verborgen links',`${info.discovered} nieuw · ${game.discovered} totaal`]];
  for(const [label,value] of entries){const dt=document.createElement('dt'),dd=document.createElement('dd');dt.textContent=label;dd.textContent=value;if(label==='Ernst')dd.className=info.severity;table.append(dt,dd);}
  const note=document.createElement('p');note.className='intel-time';note.textContent=`Scan ${formatTime(info.tick)} · momentopname`;
  $('intel-details').append(heading,country,badge,table,note);
  $('scan-peek').textContent=`${info.label} · ${severityName[info.severity]} · Tier ${info.tier} → details`;
}
function openIntelligence(){
  if(!game.intelligence)return;if(state==='playing')pause();
  $('intel-dialog-content').replaceChildren(...[...$('intel-details').children].map(child=>child.cloneNode(true)));
  const origin=document.createElement('p');origin.className='intel-origin';origin.textContent='Oorsprong in de keten: '+game.intelligence.origin;$('intel-dialog-content').append(origin);
  $('intel-dialog').showModal();
}
$('intel-more').addEventListener('click',openIntelligence);$('scan-peek').addEventListener('click',openIntelligence);
$('close-intel').addEventListener('click',()=>$('intel-dialog').close());$('intel-done').addEventListener('click',()=>{$('intel-dialog').close();if(state==='paused')resume();});
$('target-scan').addEventListener('click',()=>{if(state==='playing'){setTargeting(!scanTargeting);if(scanTargeting){toast('Kies een node of dreiging om te scannen');canvas.focus({preventScroll:true});if(matchMedia('(max-width:1099px)').matches)canvas.scrollIntoView({block:'center',behavior:renderer.reduced?'auto':'smooth'});}}});
function updateIntelFeed(){
  if(game.feedRevision!==lastFeed){
    lastFeed=game.feedRevision;$('feed-count').textContent=game.feedRevision?`${game.feedRevision} gebeurtenissen in deze ronde`:'Wacht op het eerste signaal';$('risk-feed').replaceChildren();
    if(!game.feed.length){const item=document.createElement('li');item.className='feed-empty';item.textContent='Wachten op signalen uit de keten…';$('risk-feed').append(item);}
    for(const event of game.feed.slice(0,4)){
      const item=document.createElement('li');item.className='feed-event '+event.severity;
      const time=document.createElement('time');time.textContent=formatTime(event.tick);
      const content=document.createElement('div'),title=document.createElement('strong'),detail=document.createElement('span');title.textContent=event.text;detail.textContent=event.detail;content.append(title,detail);item.append(time,content);$('risk-feed').append(item);
    }
  }
  drawIntelligence();$('scan-peek').hidden=state!=='playing'||!game.intelligence||game.tick>=game.scanUntil+180;
}
async function start(){
  if(busy||!assetsReady)return;busy=true;updateLaunchButtons();$('start-error').textContent='';
  try{
    session=await request('/api/session',{method:'POST',body:'{}'});
    if(session.version!==VERSION)throw new Error('Er zijn nieuwe spelregels. Vernieuw de pagina. Speel je lokaal? Herstart dan eerst de game.');
    game=new Game(session.seed);actions=[];accumulator=0;previousPhase=1;lastAnnounced=0;lastFeed=-1;lastIntel=undefined;
    $('intel-details').hidden=true;$('intel-empty').hidden=false;$('score-form').hidden=false;$('save-message').textContent='';$('save-message').className='form-message';$('save-score').disabled=false;$('player-name').value='';
    setState('playing');canvas.focus({preventScroll:true});toast('Stop dreigingen. Laat LOW-signalen passeren.');updateHud();
  }catch(error){setState('intro');$('start-error').textContent=error.message;}
  finally{busy=false;updateLaunchButtons();}
}
function goHome(){session=null;actions=[];game=new Game();lastFeed=-1;lastIntel=undefined;$('intel-details').hidden=true;$('intel-empty').hidden=false;accumulator=0;setState('intro');$('combo').hidden=true;updateHud();$('start').focus({preventScroll:true});refreshBoard();}
function action(type,point={}){
  if(state!=='playing')return false;
  const a={tick:game.tick,type,...point};
  if(type==='scan'&&a.x!==undefined){a.x=clamp(a.x,0,1000);a.y=clamp(a.y,0,1000);}
  if(game.act(a)){
    actions.push(a);audio.play(type);
    if(type==='scan'){setTargeting(false);toast(`${game.intelligence.label} · ${severityName[game.intelligence.severity]} · Tier ${game.intelligence.tier}`);updateHud();}
    return true;
  }
  if(type==='shot')toast(game.energy<SHOT_COST?'Energie laadt op…':'Even richten, dan opnieuw.');
  if(type==='scan')toast(game.energy<SCAN_COST?`Scan vraagt ${formatNumber(SCAN_COST)} energie.`:'Scan wordt opgeladen.');
  return false;
}
function pause(){if(state!=='playing')return;setState('paused');updateHud();$('resume').focus({preventScroll:true});}
function resume(){if(state!=='paused')return;accumulator=0;setState('playing');canvas.focus({preventScroll:true});}
function openRules(){if(state==='playing')pause();$('rules-dialog').showModal();}
$('help').addEventListener('click',openRules);$('intro-help').addEventListener('click',openRules);
$('close-rules').addEventListener('click',()=>$('rules-dialog').close());$('rules-done').addEventListener('click',()=>$('rules-dialog').close());
$('rules-dialog').addEventListener('click',event=>{if(event.target===$('rules-dialog'))$('rules-dialog').close();});
function finish(){
  setState('result');renderer.pointer=null;$('combo').hidden=true;
  $('result-title').textContent=game.services===3?'Keten overeind.':game.services===0?'De keten brak.':'Missie voltooid.';
  $('final-score').textContent=game.score.toLocaleString('nl-NL');
  $('result-description').textContent=game.services===3?'Alle drie je diensten zijn nog operationeel.':`${game.services} van de 3 diensten behouden. Elke afhankelijkheid telt.`;
  for(const [id,value] of [['final-hits',game.intercepted],['final-prevented',game.prevented],['final-discovered',game.discovered],['final-services',`${game.services} / 3`],['final-combo',game.bestCombo+'×'],['final-mistakes',game.mistakes],['final-bonus','+'+game.bonus]])$(id).textContent=value;
  $('accessible-status').textContent=`Missie afgelopen. ${game.score} punten. ${game.services} diensten. ${game.prevented} kettingreacties voorkomen.`;
  $('player-name').focus({preventScroll:true});audio.play('finish');updateHud();refreshBoard();
}
function updateHud(){
  const intro=state==='intro',t=Math.max(0,DURATION-Math.floor(game.seconds));
  $('score').textContent=String(intro?0:game.score).padStart(4,'0');$('time').textContent=roundTime(intro?DURATION:t);
  $('services').innerHTML=`${intro?3:game.services} <span>/ 3</span>`;document.querySelector('.timer').classList.toggle('urgent',!intro&&t<=15);
  $('phase').textContent=intro?`${formatNumber(DURATION)} seconden. Eén keten.`:state==='demo'?'Demonstratie':`${String(game.phase).padStart(2,'0')} · ${game.wave.name}`;
  const energy=intro?100:Math.floor(game.energy);$('energy-fill').style.width=energy+'%';$('energy-number').textContent=energy+'%';$('energy-meter').setAttribute('aria-valuenow',energy);$('energy-meter').classList.toggle('low',energy<SHOT_COST);
  const cooldown=Math.max(0,Math.ceil((game.scanReady-game.tick)/FPS));
  $('scan').disabled=state!=='playing'||cooldown>0||game.energy<SCAN_COST;
  $('target-scan').disabled=state!=='playing'||(!scanTargeting&&(cooldown>0||game.energy<SCAN_COST));
  $('scan-text').textContent=state==='playing'&&game.tick<game.scanUntil?'Actief':state==='playing'&&cooldown>0?cooldown+'s':`Scan · ${formatNumber(SCAN_COST)}`;
  $('scan').title=cooldown>0?`Scan over ${cooldown} seconden beschikbaar`:`Scan kost ${formatNumber(SCAN_COST)} energie; onderzoekt de gevaarlijkste dreiging`;
  $('scan').classList.toggle('active',state==='playing'&&game.tick<game.scanUntil);
  $('combo').hidden=!(state==='playing'&&game.combo>=2);$('combo-value').textContent=game.combo+'×';
  for(let i=0;i<3;i++){
    const health=(intro?4:game.hp[i])*25;$('service-'+i).classList.toggle('down',health===0);
    $('service-'+i).classList.toggle('warning',health>0&&health<=50);$('service-'+i).classList.toggle('healthy',health>50);
    $('hp-'+i).setAttribute('aria-valuenow',health);$('hp-'+i).firstElementChild.style.width=health+'%';$('health-'+i).textContent=health+'%';
  }
  updateIntelFeed();
  if(state==='playing'&&game.seconds-lastAnnounced>=15){lastAnnounced=game.seconds;$('accessible-status').textContent=`${t} seconden. ${game.score} punten. ${game.services} diensten. ${energy} procent energie.`;}
}
function autoPlay(){
  if(game.tick%21===0&&game.energy>=SHOT_COST){
    const active=game.packets.filter(packet=>packet.warning===0&&THREATS[packet.kind].damage>0);
    if(active.length){
      const target=active.sort((a,b)=>Math.hypot(a.x-500,a.y-500)-Math.hypot(b.x-500,b.y-500))[0],to=game.network.map[target.to],length=Math.max(1,Math.hypot(to.x-target.x,to.y-target.y));
      game.act({type:'shot',x:target.x+(to.x-target.x)/length*23,y:target.y+(to.y-target.y)/length*23});
    }
  }
  if(game.tick>300&&game.tick%1100===400)game.act({type:'scan'});
}
function frame(now){
  const dt=Math.min(.25,(now-lastFrame)/1000||0);lastFrame=now;
  if(['playing','intro','demo'].includes(state)){
    accumulator+=dt;let steps=0;
    while(accumulator>=1/FPS&&steps<15){
      if(state!=='playing')autoPlay();game.update();accumulator-=1/FPS;steps++;
      if(state==='playing'){
        for(const event of game.events){
          if(event.type==='hit')audio.play('hit');
          if(event.type==='damage'){audio.play('damage');toast(`Dienst geraakt · −${event.value} procentpunten weerbaarheid`,true);}
          if(event.type==='cascade')audio.play('cascade');
          if(event.type==='mistake')toast('Laag risico geraakt · −50 punten',true);
        }
        if(game.phase!==previousPhase){previousPhase=game.phase;toast(game.wave.message);}
        if(game.finished){finish();break;}
      }else if(game.finished){game=new Game(SEED);lastFeed=-1;lastIntel=undefined;$('intel-details').hidden=true;$('intel-empty').hidden=false;}
    }
  }
  if(now>toastUntil)$('event-toast').classList.remove('show');renderer.render(game,state);
  if(game.tick%4===0||state==='paused'||state==='result')updateHud();requestAnimationFrame(frame);
}
canvas.addEventListener('pointerdown',event=>{
  if(state!=='playing')return;event.preventDefault();const point=renderer.point(event.clientX,event.clientY);
  if(point.x<0||point.x>1000||point.y<0||point.y>1000)return;
  renderer.keyboard=false;renderer.pointer=point;canvas.focus({preventScroll:true});if(scanTargeting){action('scan',{x:Math.round(point.x),y:Math.round(point.y)});return;}action('shot',{x:Math.round(point.x),y:Math.round(point.y)});if(event.pointerType==='touch')renderer.pointer=null;
});
canvas.addEventListener('pointermove',event=>{if(event.pointerType!=='touch'&&state==='playing'){renderer.keyboard=false;renderer.pointer=renderer.point(event.clientX,event.clientY);}});
canvas.addEventListener('pointerleave',()=>{if(!renderer.keyboard)renderer.pointer=null;});
document.addEventListener('keydown',event=>{
  if(event.target.matches('input,textarea,select')||$('mobile-dialog').open||$('rules-dialog').open||$('intel-dialog').open)return;
  if(event.key==='Escape'){if(scanTargeting){setTargeting(false);return;}if(state==='playing')pause();else if(state==='paused')resume();return;}
  if(state!=='playing'||event.target.matches('button,a'))return;
  if(event.code==='Space'){event.preventDefault();if(!event.repeat)action('scan',renderer.pointer?{...renderer.pointer}:{});return;}
  if(['ArrowUp','ArrowDown','ArrowLeft','ArrowRight','Enter'].includes(event.key)){
    event.preventDefault();renderer.keyboard=true;renderer.pointer??={x:500,y:250};const step=event.shiftKey?12:30;
    if(event.key==='ArrowUp')renderer.pointer.y-=step;if(event.key==='ArrowDown')renderer.pointer.y+=step;
    if(event.key==='ArrowLeft')renderer.pointer.x-=step;if(event.key==='ArrowRight')renderer.pointer.x+=step;
    renderer.pointer.x=clamp(renderer.pointer.x,30,970);renderer.pointer.y=clamp(renderer.pointer.y,30,970);
    if(event.key==='Enter'&&!event.repeat)action(scanTargeting?'scan':'shot',{...renderer.pointer});
  }
});
document.addEventListener('visibilitychange',()=>{if(document.hidden)pause();});
$('start').addEventListener('click',start);$('retry').addEventListener('click',start);$('demo-play').addEventListener('click',start);
$('watch-demo').addEventListener('click',()=>{game=new Game(SEED);lastFeed=-1;lastIntel=undefined;accumulator=0;setState('demo');});
$('pause').addEventListener('click',pause);$('resume').addEventListener('click',resume);$('quit').addEventListener('click',goHome);$('result-home').addEventListener('click',goHome);$('scan').addEventListener('click',()=>action('scan'));
$('sound').addEventListener('click',()=>{try{const enabled=audio.toggle();$('sound').setAttribute('aria-pressed',enabled);$('sound').setAttribute('aria-label',enabled?'Geluid uitzetten':'Geluid aanzetten');$('sound').title=enabled?'Geluid uit':'Geluid aan';$('sound').innerHTML=enabled?'<svg viewBox="0 0 24 24"><path d="M11 4 5 9H2v6h3l6 5V4ZM16 8a6 6 0 0 1 0 8m3-11a10 10 0 0 1 0 14"/></svg>':'<svg viewBox="0 0 24 24"><path d="M11 4 5 9H2v6h3l6 5V4ZM16 8l6 8M22 8l-6 8"/></svg>';}catch{toast('Geluid is niet beschikbaar in deze browser.');}});
$('fullscreen').addEventListener('click',async()=>{try{if(document.fullscreenElement)await document.exitFullscreen();else await document.documentElement.requestFullscreen();}catch{toast('Gebruik de volledig-schermfunctie van je browser.');}});
$('score-form').addEventListener('submit',async e=>{e.preventDefault();if(!session)return;$('save-score').disabled=true;$('save-message').textContent='Score wordt gecontroleerd…';try{const result=await request('/api/score',{method:'POST',body:JSON.stringify({session:session.id,name:$('player-name').value,actions})});boardId=result.id;drawBoard(result.scores);$('score-form').hidden=true;$('save-message').className='form-message success';$('save-message').textContent=`Je staat op plek ${result.rank}. Goed gespeeld!`;session=null;}catch(error){$('save-message').textContent=error.message;$('save-score').disabled=false;}});
$('mobile-link').addEventListener('click',()=>{if(state==='playing')pause();renderMobileShare(mobileUrl);$('mobile-dialog').showModal();});$('close-mobile').addEventListener('click',()=>$('mobile-dialog').close());$('mobile-dialog').addEventListener('click',e=>{if(e.target===$('mobile-dialog'))$('mobile-dialog').close();});$('copy-url').addEventListener('click',async()=>{try{await navigator.clipboard.writeText(mobileUrl);$('copy-url').textContent='Adres gekopieerd';}catch{$('copy-url').textContent='Selecteer het adres hierboven';}});
request('/api/meta').then(meta=>{mobileUrl=meta.mobileUrls[0]||'';const online=meta.hosting==='sites';if(online)mobileUrl=location.origin+'/';$('mobile-instructions').textContent=online?'Scan de QR-code met de camera van je telefoon.':'Verbind je telefoon met hetzelfde wifi-netwerk als deze Mac en scan de QR-code.';$('mobile-availability').textContent=online?'Open de game via de link of QR-code. Je begint op je telefoon een nieuwe ronde.':'De Mac moet aan blijven en de gameserver moet draaien. Je begint op je telefoon een nieuwe ronde.';if($('mobile-dialog').open)renderMobileShare(mobileUrl);}).catch(()=>{});refreshBoard();setInterval(()=>{if(state!=='playing')refreshBoard();},15000);setState('intro');updateHud();requestAnimationFrame(frame);

// Optional page-scoped access uses the same leaderboard as the visible game.
if(document.modelContext?.registerTool){
  const lifecycle=new AbortController();
  addEventListener('pagehide',()=>lifecycle.abort(),{once:true});
  try{Promise.resolve(document.modelContext.registerTool({
    name:'read_cascade_leaderboard',title:'Bekijk Cascade Command leaderboard',
    description:'Lees de tien hoogste opgeslagen scores van Cascade Command. Start geen ronde en slaat geen scores op.',
    inputSchema:{type:'object',properties:{},additionalProperties:false},
    annotations:{readOnlyHint:true,untrustedContentHint:true},
    async execute(input){
      if(!input||typeof input!=='object'||Array.isArray(input)||Object.keys(input).length)throw new Error('Gebruik een leeg object.');
      const result=await request('/api/leaderboard');drawBoard(result.scores);return result;
    }
  },{signal:lifecycle.signal})).catch(()=>{});}catch{}
}
