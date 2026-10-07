import { mountExperience, connectExperience } from './experience.js';
export { beforeStart } from './experience.js';
import { mountMobile, connectMobile } from './mobile.js';
export { showMobileScan as onScan } from './mobile.js';
const icons = {
  target:'<circle cx="12" cy="12" r="7"/><circle cx="12" cy="12" r="3"/><path d="M12 2v3m0 14v3M2 12h3m14 0h3"/>',
  build:'<path d="m12 3 0 6m0 6v6M3 12h6m6 0h6M5 5l4 4m6 6 4 4M5 19l4-4m6-6 4-4"/><circle cx="12" cy="12" r="3"/><circle cx="12" cy="3" r="1.5"/><circle cx="3" cy="12" r="1.5"/><circle cx="21" cy="12" r="1.5"/>',
  explore:'<path d="m12 2 8.7 5v10L12 22l-8.7-5V7Z M12 7l4.3 2.5v5L12 17l-4.3-2.5v-5Z M12 2v5m8.7 0-4.4 2.5m-8.6 0L3.3 7M12 17v5"/>',
  analyze:'<rect x="3" y="4" width="18" height="13" rx="2"/><path d="M8 21h8m-4-4v4"/>',
  monitor:'<path d="m12 2 8 3v6c0 5-4 8-8 11C8 19 4 16 4 11V5Z M12 7v5m0 4v.1"/>',
  chevron:'<path d="m9 5 7 7-7 7"/>',
  company:'<path d="m12 2 9 5v10l-9 5-9-5V7Z M12 6v7m-6 4 6-4 6 4"/>',
  people:'<circle cx="12" cy="7" r="3"/><circle cx="4" cy="11" r="2"/><circle cx="20" cy="11" r="2"/><path d="M6 21v-3c0-3 3-5 6-5s6 2 6 5v3M2 21v-3c0-2 1-3 3-3m14 0c2 0 3 1 3 3v3"/>',
  search:'<circle cx="10.5" cy="10.5" r="6.5"/><path d="m16 16 5 5"/>',
  sliders:'<path d="M4 5h16M4 12h16M4 19h16"/><circle cx="8" cy="5" r="2" fill="white"/><circle cx="16" cy="12" r="2" fill="white"/><circle cx="10" cy="19" r="2" fill="white"/>',
};
const icon = (name, className='') => `<svg class="${className}" viewBox="0 0 24 24" aria-hidden="true">${icons[name]}</svg>`;

export function mount(document) {
  const header = document.querySelector('.header');
  const brand = header.querySelector('.brand');
  const actions = header.querySelector('.header-actions');
  const workflow = document.createElement('ol'); workflow.className='rs-workflow'; workflow.setAttribute('aria-label','RiskStudio werkwijze, Explore actief');
  workflow.innerHTML=`<li><span class="rs-step">${icon('target')}Initiatives</span></li><li>${icon('chevron','rs-chevron')}</li><li class="rs-workflow-group"><span class="rs-step">${icon('build')}Build</span>${icon('chevron','rs-chevron')}<span class="rs-step current" aria-current="step">${icon('explore')}Explore</span>${icon('chevron','rs-chevron')}<span class="rs-step">${icon('analyze')}Analyze</span>${icon('chevron','rs-chevron')}<span class="rs-step">${icon('monitor')}Monitor</span></li>`;
  const workspace = document.createElement('div'); workspace.className='rs-workspace';
  workspace.innerHTML='<div class="rs-workspace-name"><strong>Cascade Command</strong><span>RiskStudio workspace</span></div><span class="rs-avatar" aria-hidden="true">RS</span>';
  workspace.append(actions); header.replaceChildren(brand,workflow,workspace);

  const left = document.createElement('aside'); left.className='rs-explore-panel'; left.setAttribute('aria-label','Explore, missie en leveranciersintelligence');
  left.innerHTML=`<div class="rs-explore-heading">${icon('explore','rs-explore-icon')}<div><h2>Explore</h2><p>Ontdek risico’s en afhankelijkheden.<br>Bescherm wat belangrijk is.</p></div></div><div class="rs-search"><label class="rs-search-label">${icon('search')}<input id="rs-search" type="search" placeholder="Zoek leverancier…" aria-label="Zoek een leverancier in de Galaxy" autocomplete="off" aria-controls="rs-search-results"></label><div id="rs-search-results" class="rs-search-results" hidden></div><p id="rs-search-message" class="rs-search-message" role="status" hidden></p></div><div class="rs-focus"><div class="rs-focus-caption"><span>Current focus</span><button class="rs-reset" id="rs-reset-focus" type="button">Reset naar Tier 0</button></div><div class="rs-focus-value">${icon('company')}<span id="rs-focus-name">RiskStudio</span><span aria-hidden="true">⌄</span></div></div><div class="rs-tabs" role="tablist" aria-label="Explore-panelen"><button id="rs-insights-tab" type="button" role="tab" aria-selected="true" aria-controls="rs-insights">Insights</button><button id="rs-risks-tab" type="button" role="tab" aria-selected="false" aria-controls="rs-risks" tabindex="-1">Risico’s</button></div><div id="rs-insights" role="tabpanel" aria-labelledby="rs-insights-tab"><p class="rs-panel-note">Van signaal naar inzicht. Van inzicht naar veerkracht.</p><div class="rs-featured-label"><span>Uitgelichte inzichten</span>${icon('sliders')}</div><div class="rs-featured"><span class="rs-featured-icon">${icon('people')}</span><div><strong>Overzicht keten</strong><p>Volg risico’s, ontdek afhankelijkheden en bescherm je kritieke diensten.</p></div></div></div><div id="rs-risks" role="tabpanel" aria-labelledby="rs-risks-tab" hidden></div>`;
  document.getElementById('intro-title').textContent='Cascade Command';
  left.querySelector('#rs-insights').append(document.getElementById('intro'),document.getElementById('intel-card'));
  left.querySelector('#rs-risks').append(document.querySelector('.threat-guide'));
  document.querySelector('.shell').prepend(left);

  const summary = document.createElement('section'); summary.className='rs-summary'; summary.setAttribute('aria-label','Overzicht van de dienstweerbaarheid');
  summary.innerHTML=`<p class="rs-summary-caption">Insight summary</p><div class="rs-summary-title"><span class="rs-summary-symbol">${icon('people')}</span><div><h2>Overzicht veerkracht</h2><p>Het effect van ketenrisico’s op je kritieke diensten, in één overzicht.</p></div></div><p class="rs-breakdown-label">Weerbaarheid</p><div class="rs-donut"><svg viewBox="0 0 144 144" aria-hidden="true"><circle cx="72" cy="72" r="48" stroke="#edf1f8"/>${['portal','payments','operations'].map((key,index)=>`<circle data-service="${key}" id="rs-donut-${index}" cx="72" cy="72" r="48" stroke="var(--service-color)" stroke-dasharray="96 206" transform="rotate(${index*120} 72 72)"/>`).join('')}</svg><div class="rs-donut-value"><strong id="rs-health-total">100%</strong><span>weerbaarheid</span></div></div><div class="rs-summary-legend"><span data-service="portal"><i></i>Portaal</span><span data-service="payments"><i></i>Betalingen</span><span data-service="operations"><i></i>Operatie</span></div><span class="rs-chip">Cascade Command</span>`;
  summary.append(document.querySelector('.service-status'));
  document.querySelector('.sidebar').prepend(summary);
  mountMobile(document);
  mountExperience(document);
}

export function connect(controls) {
  const { game, renderer, requestFrame } = controls;
  connectMobile(controls);
  connectExperience(controls);
  const $ = id => document.getElementById(id);
  const tabs=[$('rs-insights-tab'),$('rs-risks-tab')];
  const selectTab = index => {
    tabs.forEach((tab,i)=>{tab.setAttribute('aria-selected',String(i===index));tab.tabIndex=i===index?0:-1;});
    $('rs-insights').hidden=index!==0; $('rs-risks').hidden=index!==1;
  };
  tabs.forEach((tab,index)=>{
    tab.addEventListener('click',()=>selectTab(index));
    tab.addEventListener('keydown',event=>{if(['ArrowLeft','ArrowRight','Home','End'].includes(event.key)){event.preventDefault();event.stopPropagation();const next=event.key==='Home'?0:event.key==='End'?1:1-index;selectTab(next);tabs[next].focus();}});
  });
  let lastHealth='',lastState=document.body.dataset.state;
  const update=()=>{
    const current=game(), health=current.hp.map(value=>value*25),signature=health.join(',');
    if(signature!==lastHealth){
      lastHealth=signature;$('rs-health-total').textContent=Math.round(health.reduce((sum,value)=>sum+value,0)/3)+'%';
      health.forEach((value,index)=>$('rs-donut-'+index).setAttribute('stroke-dasharray',`${value*.96} ${302-value*.96}`));
    }
    const state=document.body.dataset.state;
    if(state!==lastState){
      if(state==='intro')selectTab(0);
      if(state==='playing'&&(lastState==='intro'||lastState==='result')&&!document.body.classList.contains('rs-mobile')&&matchMedia('(max-width:760px)').matches){requestAnimationFrame(()=>document.querySelector('.game-column').scrollIntoView({block:'start',behavior:renderer.reduced?'auto':'smooth'}));}
      lastState=state;
    }
  };
  const observer=new MutationObserver(update);
  observer.observe($('service-list'),{subtree:true,attributes:true,attributeFilter:['aria-valuenow']});
  observer.observe(document.body,{attributes:true,attributeFilter:['data-state']});
  addEventListener('pagehide',()=>observer.disconnect(),{once:true}); update();

  const input=$('rs-search'),results=$('rs-search-results'),message=$('rs-search-message');
  const focus=node=>{renderer.selectedNode=node?.id??null;$('rs-focus-name').textContent=node?.name||'RiskStudio';requestFrame();};
  const search=()=>{
    const query=input.value.trim().toLocaleLowerCase('nl-NL');results.replaceChildren();message.hidden=!query;
    if(!query){results.hidden=true;return;}
    const matches=game().network.nodes.filter(node=>node.tier>0&&(node.name+' '+node.country+' tier '+node.tier).toLocaleLowerCase('nl-NL').includes(query));
    message.textContent=matches.length?`${matches.length} leveranciers gevonden. Kies een locatie in de Galaxy.`:'Geen leverancier gevonden. Zoek bijvoorbeeld op een tier of land.';
    for(const node of matches.slice(0,8)){
      const button=document.createElement('button');button.type='button';button.textContent=node.name;
      const detail=document.createElement('span');detail.textContent=`Tier ${node.tier} · ${node.country}`;button.append(detail);
      button.addEventListener('click',()=>{input.value=node.name;results.hidden=true;focus(node);message.textContent='Locatie gemarkeerd. Gebruik Scan voor leveranciersintelligence.';});results.append(button);
    }
    results.hidden=!matches.length;
  };
  input.addEventListener('input',search);
  input.addEventListener('keydown',event=>{if(event.key==='Escape')results.hidden=true;if(event.key==='ArrowDown'){event.preventDefault();results.querySelector('button')?.focus();}});
  $('rs-reset-focus').addEventListener('click',()=>{input.value='';results.hidden=true;message.hidden=true;focus(null);});
}
