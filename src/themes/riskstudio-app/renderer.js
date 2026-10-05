import { THREATS, SERVICE_NAMES, linkKey } from '../../engine.js';
import { CATEGORIES, SERVICE_VISUALS } from '../../symbols.js';
import { resolveTheme } from '../index.js';
const TAU = Math.PI * 2;
export class Renderer {
  constructor(canvas, theme = resolveTheme()) {
    this.theme = theme; this.colors = theme.canvas;
    this.canvas = canvas; this.ctx = canvas.getContext('2d'); this.pointer = null; this.keyboard = false; this.targeting = false; this.selectedNode = null;
    this.symbols = Object.fromEntries(Object.entries(CATEGORIES).map(([kind,item])=>[kind,new Path2D(theme.symbols.categories[kind])]));
    this.serviceSymbols = Object.fromEntries(Object.entries(SERVICE_VISUALS).map(([name,item])=>[name,new Path2D(theme.symbols.services[item.key])]));
    this.image = null; // Assigned only after the shared asset loader decodes it.
    this.reduced = matchMedia('(prefers-reduced-motion: reduce)').matches;
    this.observer = new ResizeObserver(() => this.resize()); this.observer.observe(canvas); this.resize();
  }
  resize() {
    const rect = this.canvas.getBoundingClientRect(), dpr = Math.min(devicePixelRatio || 1, 2);
    if (this.w === rect.width && this.h === rect.height && this.dpr === dpr) return;
    this.w = rect.width; this.h = rect.height; this.dpr = dpr;
    this.canvas.width = Math.round(this.w * this.dpr); this.canvas.height = Math.round(this.h * this.dpr);
    this.size = Math.min(this.w, this.h); this.scale = this.size / 1000; this.ox = (this.w - this.size) / 2; this.oy = (this.h - this.size) / 2;
    this.onResize?.();
  }
  point(clientX, clientY) {
    const r = this.canvas.getBoundingClientRect();
    return { x: (clientX - r.left - this.ox) / this.scale, y: (clientY - r.top - this.oy) / this.scale };
  }
  sprite(index, x, y, size, alpha = 1) {
    const c = this.ctx;
    c.save(); c.globalAlpha *= alpha;
    if (index === 0) {
      const r = 16;
      c.shadowColor = '#9eb5de55'; c.shadowBlur = 3;
      c.fillStyle = '#ffffff'; c.strokeStyle = '#aabfe9'; c.lineWidth = 1.4;
      c.beginPath(); c.arc(x,y,r,0,TAU); c.fill(); c.stroke(); c.shadowBlur = 0;
      c.strokeStyle = '#4670dd'; c.lineWidth = 1.8; c.lineJoin = 'round';
      c.beginPath(); c.rect(x-6,y-8,12,16);
      for (const dy of [-4,0]) for (const dx of [-3,2]) { c.moveTo(x+dx,y+dy); c.lineTo(x+dx+1,y+dy); }
      c.moveTo(x-2,y+8); c.lineTo(x-2,y+4); c.lineTo(x+2,y+4); c.lineTo(x+2,y+8); c.stroke();
    } else {
      const r = size / 2.55;
      const gradient = c.createRadialGradient(x,y,0,x,y,r);
      gradient.addColorStop(0,'#4670dd1c'); gradient.addColorStop(1,'#4670dd05');
      c.fillStyle = gradient; c.strokeStyle = '#4670dd99'; c.lineWidth = 2;
      c.beginPath(); c.arc(x,y,r,0,TAU); c.fill(); c.stroke();
      this.circle(x,y,r*.88,'#4670dd22',1);
    }
    c.restore();
  }
  circle(x,y,r,color,width=1) { const c=this.ctx;c.beginPath();c.arc(x,y,r,0,TAU);c.strokeStyle=color;c.lineWidth=width;c.stroke(); }
  arrow(from,to,t,color) {
    const c=this.ctx,a=Math.atan2(to.y-from.y,to.x-from.x);
    c.save();c.translate(from.x+(to.x-from.x)*t,from.y+(to.y-from.y)*t);c.rotate(a);
    c.strokeStyle=color;c.lineWidth=2;c.beginPath();c.moveTo(-7,-4);c.lineTo(0,0);c.lineTo(-7,4);c.stroke();c.restore();
  }
  threatIcon(kind,x,y,radius,critical) {
    const c=this.ctx,color=this.theme.categories[kind];
    c.save();c.translate(x,y);c.shadowColor=color;c.shadowBlur=kind==='low'?0:10;
    c.fillStyle=this.colors.surface;c.strokeStyle=color;c.lineWidth=2;c.beginPath();c.arc(0,0,radius,0,TAU);c.fill();c.stroke();c.shadowBlur=0;
    if(critical){c.strokeStyle=this.colors.critical;c.lineWidth=2.5;c.beginPath();c.arc(0,0,radius+5,0,TAU);c.stroke();}
    c.scale(radius/15,radius/15);c.translate(-12,-12);c.strokeStyle=color;c.lineWidth=1.8;c.lineCap='round';c.lineJoin='round';c.stroke(this.symbols[kind]);c.restore();
  }
  serviceIdentity(node,health) {
    const c=this.ctx,name=SERVICE_NAMES[node.index],service=SERVICE_VISUALS[name],r=Math.max(24,8/this.scale);
    c.save();
    c.shadowColor=this.theme.services[service.key];c.shadowBlur=health>0?10:0;
    c.fillStyle=this.colors.surface;c.strokeStyle=this.theme.services[service.key];c.lineWidth=2.2;
    c.beginPath();c.roundRect(node.x-r,node.y-r,r*2,r*2,8);c.fill();c.stroke();c.shadowBlur=0;
    c.save();c.translate(node.x,node.y);c.scale(r/17,r/17);c.translate(-12,-13);
    c.strokeStyle=this.theme.services[service.key];c.lineWidth=1.6;c.lineCap='round';c.lineJoin='round';c.stroke(this.serviceSymbols[name]);c.restore();
    const badge=Math.max(11,5/this.scale),bx=node.x+r+6,by=node.y;
    c.fillStyle=this.theme.services[service.key];c.beginPath();c.arc(bx,by,badge,0,TAU);c.fill();c.fillStyle=this.colors.surface;c.textAlign='center';c.textBaseline='middle';c.font=`700 ${badge*1.45}px ${this.theme.fonts.sans}`;c.fillText(service.code,bx,by+1);
    // Status stays separate from identity: warning/failed services keep their icon and letter.
    const barWidth=r*2,barY=node.y+r+8,segment=(barWidth-9)/4;
    for(let i=0;i<4;i++){c.fillStyle=i<health?(health<=2?this.colors.healthWarning:this.colors.healthGood):this.colors.healthEmpty;c.fillRect(node.x-r+i*(segment+3),barY,segment,4);}
    if(health===0){this.circle(node.x,node.y,r+7,this.colors.serviceFailed,2);}
    c.restore();
  }
  render(game, state) {
    const c = this.ctx; c.setTransform(this.dpr,0,0,this.dpr,0,0); c.clearRect(0,0,this.w,this.h);
    c.translate(this.ox,this.oy); c.scale(this.scale,this.scale);
    // Light Explore bands preserve the original interactive network coordinates.
    for (const [outer,inner,color] of [[480,390,'#e2e9ff'],[309,270,'#f5f8ff'],[162,78,'#fff9df']]) {
      c.beginPath(); c.arc(500,500,outer,0,TAU); c.arc(500,500,inner,0,TAU,true);
      c.fillStyle=color; c.fill('evenodd');
    }
    const scan = game.tick < game.scanUntil;
    const faded = false; c.globalAlpha = 1;
    for (const r of [112, 209, 309, 422, 480]) this.circle(500,500,r, r===480?this.colors.outerOrbit:this.colors.orbit,r===480?1:1.1);
    for (let i=0;i<72;i++) {const a=i*TAU/72;const r=480;const big=i%6===0;c.strokeStyle=big?this.colors.tickMajor:this.colors.tickMinor;c.lineWidth=1;c.beginPath();c.moveTo(500+Math.cos(a)*r,500+Math.sin(a)*r);c.lineTo(500+Math.cos(a)*(r+(big?9:4)),500+Math.sin(a)*(r+(big?9:4)));c.stroke();}
    const activeLinks=new Map(game.packets.filter(p=>THREATS[p.kind].damage>0&&p.warning===0).map(p=>[`${p.from}>${p.to}`,p]));
    for (const link of game.network.links) {
      const key=linkKey(link),known=game.discoveredLinks.has(key),active=activeLinks.get(key);
      const color=active?this.theme.categories[active.kind]:known?this.colors.linkKnown:this.colors.link;
      c.setLineDash(link.hidden?[5,8]:[]);c.strokeStyle=link.hidden&&!known&&!active?this.colors.linkHidden:color+(active?'b0':known?'ba':'70');c.lineWidth=active?2.4:scan?1.6:1.1;
      c.beginPath();c.moveTo(link.from.x,link.from.y);c.lineTo(link.to.x,link.to.y);c.stroke();c.setLineDash([]);
      if(active){this.arrow(link.from,link.to,.4,color);this.arrow(link.from,link.to,.75,color);}
      else if(!link.hidden||known){
        const t=this.reduced?.5:((game.tick/600+link.from.index*.123)%1);c.fillStyle=known?this.colors.linkParticleKnown:this.colors.linkParticle;c.beginPath();c.arc(link.from.x+(link.to.x-link.from.x)*t,link.from.y+(link.to.y-link.from.y)*t,known?2.8:1.8,0,TAU);c.fill();
      }
      if(link.hidden&&!known&&!active){
        const x=link.from.x+(link.to.x-link.from.x)*.38,y=link.from.y+(link.to.y-link.from.y)*.38;
        // Keep the reserved tier-label column clear of hidden-link markers.
        if(Math.hypot(x-500,y-500)>150&&(Math.abs(x-500)>95||y>425)){c.fillStyle=this.colors.surface;c.beginPath();c.arc(x,y,13,0,TAU);c.fill();this.circle(x,y,13,this.colors.hiddenMarker);c.font=`600 18px ${this.theme.fonts.sans}`;c.textAlign='center';c.fillStyle=this.colors.hiddenText;c.fillText('?',x,y+6);}
      }
    }
    // Tier labels belong to the network background; sprites and gameplay effects stay in front.
    c.save();c.globalAlpha=1;c.textAlign='center';c.textBaseline='middle';
    const labelSize=Math.max(15,10/this.scale),subSize=Math.max(12,7.5/this.scale),showDetails=this.scale>=.5;
    for(const [tier,outer,inner,description] of [[3,422,309,'Indirecte leveranciers'],[2,309,209,'Subleveranciers'],[1,209,112,'Directe leveranciers']]){
      const x=500,y=500-(outer+inner)/2,text='TIER '+tier;
      c.font=`600 ${labelSize}px ${this.theme.fonts.sans}`;
      const titleWidth=c.measureText(text).width;
      c.font=`400 ${subSize}px ${this.theme.fonts.sans}`;
      const width=Math.max(82,titleWidth+20,showDetails?c.measureText(description).width+14:0),height=labelSize+(showDetails?subSize+4:0)+8;
      c.fillStyle=this.colors.surface;c.fillRect(x-width/2,y-height/2,width,height);
      c.font=`600 ${labelSize}px ${this.theme.fonts.sans}`;c.fillStyle=this.colors.tierTitle;c.fillText(text,x,y-(showDetails?(subSize+4)/2:0));
      if(showDetails){c.font=`400 ${subSize}px ${this.theme.fonts.sans}`;c.fillStyle=this.colors.tierDescription;c.fillText(description,x,y+labelSize/2+2);}
    }
    c.restore();
    for(const node of game.network.nodes){
      if(node.tier===0){
        c.beginPath();c.moveTo(500,500);c.lineTo(node.x,node.y);c.strokeStyle=game.hp[node.index]>0?this.colors.serviceLink:this.colors.serviceLinkFailed;c.lineWidth=2;c.stroke();
      }else{this.sprite(0,node.x,node.y,node.tier===3?70:60,.95);}
    }
    for(const node of game.network.nodes)if(node.tier===0)this.serviceIdentity(node,game.hp[node.index]);
    const selected=game.network.map[this.selectedNode];
    if(selected){this.circle(selected.x,selected.y,32,this.colors.selection,2.8);this.circle(selected.x,selected.y,40,this.colors.selectionHalo,1);}
    if(this.targeting&&this.pointer){
      const nearest=game.network.nodes.filter(n=>n.tier>0).sort((a,b)=>Math.hypot(a.x-this.pointer.x,a.y-this.pointer.y)-Math.hypot(b.x-this.pointer.x,b.y-this.pointer.y))[0];
      if(nearest)this.circle(nearest.x,nearest.y,31,this.colors.target,2);
    }
    // The central brand symbol and geometry intentionally remain vector-native.
    c.shadowColor=this.colors.organization;c.shadowBlur=4; c.fillStyle=this.colors.organization;c.beginPath();
    for(let i=0;i<6;i++){const a=i*TAU/6-Math.PI/2;c.lineTo(500+Math.cos(a)*26,500+Math.sin(a)*26);}c.closePath();c.fill();c.shadowBlur=0;
    c.save(); c.translate(500,500); c.strokeStyle='#ffffff'; c.lineWidth=5; c.lineCap='round';
    c.beginPath();c.moveTo(0,-15);c.lineTo(0,0);c.moveTo(0,0);c.lineTo(-13,8);c.moveTo(0,0);c.lineTo(13,8);c.stroke();c.restore();
    this.circle(500,500,47,this.colors.organizationRing,1.2);
    c.textAlign='center';
    c.font=`600 ${Math.max(13,8/this.scale)}px ${this.theme.fonts.sans}`;c.fillStyle=this.colors.organizationLabel;c.fillText('ORGANISATIE',500,624);
    if(scan){const age=300-(game.scanUntil-game.tick);const radius=(age%85)/85*490;this.circle(500,500,radius,this.colors.scanRing,2);this.circle(500,500,radius*.83,this.colors.scanHalo,1);}
    for(const f of game.fields){
      if(game.tick<f.start){const t=(game.tick-f.born)/Math.max(1,f.start-f.born);const x=500+(f.x-500)*t,y=500+(f.y-500)*t;c.strokeStyle=this.colors.shotTrail;c.lineWidth=2;c.beginPath();c.moveTo(500+(f.x-500)*Math.max(0,t-.15),500+(f.y-500)*Math.max(0,t-.15));c.lineTo(x,y);c.stroke();c.fillStyle=this.colors.shot;c.beginPath();c.arc(x,y,4,0,TAU);c.fill();this.circle(f.x,f.y,7,this.colors.shotTarget,1);}
      else {this.sprite(1,f.x,f.y,f.radius*2.55,Math.min(1,(f.end-game.tick)/(game.config.shot.fadeSeconds*60))*.9);c.fillStyle=this.colors.field;c.beginPath();c.arc(f.x,f.y,f.radius,0,TAU);c.fill();}
    }
    for(const packet of game.packets){
      const threat=THREATS[packet.kind],low=threat.damage===0,color=this.theme.categories[packet.kind];
      const radius=low?Math.max(11,5/this.scale):Math.max(20,10/this.scale);
      if(packet.warning>0)this.circle(packet.x,packet.y,radius+8+(45-packet.warning)*.18,color+'aa',1.4);
      else {
        const from=game.network.map[packet.from],to=game.network.map[packet.to],angle=Math.atan2(to.y-from.y,to.x-from.x);
        const trail=30+game.phase*7;c.save();c.translate(packet.x,packet.y);c.rotate(angle);
        const grad=c.createLinearGradient(-trail,0,0,0);grad.addColorStop(0,color+'00');grad.addColorStop(1,color+'bb');
        c.strokeStyle=grad;c.lineWidth=3;c.beginPath();c.moveTo(-trail,0);c.lineTo(0,0);c.stroke();c.restore();
      }
      this.threatIcon(packet.kind,packet.x,packet.y,radius,threat.severity==='critical');
      if(low){const fontSize=Math.max(14,8/this.scale);c.font=`600 ${fontSize}px ${this.theme.fonts.mono}`;c.textAlign='center';const width=c.measureText('LOW').width+8;c.fillStyle=this.colors.surface;c.fillRect(packet.x-width/2,packet.y+radius+3,width,fontSize+4);c.fillStyle=color;c.fillText('LOW',packet.x,packet.y+radius+fontSize+3);}
    }
    for(const effect of game.fx){const age=game.tick-effect.born;const a=1-age/65;c.globalAlpha=(faded?.63:1)*a;
      if(effect.type==='hit'||effect.type==='mistake'){this.circle(effect.x,effect.y,6+age*.45,this.colors.hitRing,1);c.font=`600 17px ${this.theme.fonts.mono}`;c.textAlign='center';c.fillStyle=this.colors.hitText;c.fillText((effect.points>0?'+':'')+effect.points,effect.x,effect.y-14-age*.45);}
      if(effect.type==='cascade'){this.circle(effect.x,effect.y,20+age*.8,this.colors.cascadeRing,2.5);this.circle(effect.x,effect.y,12+age*.4,this.colors.cascadeInner,1.5);c.font=`600 ${Math.max(15,9/this.scale)}px ${this.theme.fonts.sans}`;c.textAlign='center';c.fillStyle=this.colors.cascadeText;c.fillText('KETTINGREACTIE',effect.x,effect.y-38);}
      if(effect.type==='damage'){this.circle(effect.x,effect.y,20+age,this.colors.damage,3);}
    }
    // Reserve the empty bands between node orbits for the tier labels.
    // Their shared centre line matches ORGANISATIE; no node occupies these bands.
    // Draw after moving effects so the opaque backing keeps every label legible.
    c.globalAlpha=1;
    if(this.pointer && state==='playing'){
      const {x,y}=this.pointer;c.setLineDash([4,6]);this.circle(x,y,this.targeting?35:game.config.shot.fieldRadius,game.energy>=game.config.shot.cost?this.colors.reticle:this.colors.reticleLow,1.5);c.setLineDash([]);c.strokeStyle=game.energy>=game.config.shot.cost?this.colors.crosshair:this.colors.damage;c.lineWidth=1.5;c.beginPath();c.moveTo(x-9,y);c.lineTo(x+9,y);c.moveTo(x,y-9);c.lineTo(x,y+9);c.stroke();
    }
  }
}
