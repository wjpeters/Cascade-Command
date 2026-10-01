import { clamp, THREATS, linkKey } from './engine.js';
const TAU = Math.PI * 2;
export class Renderer {
  constructor(canvas) {
    this.canvas = canvas; this.ctx = canvas.getContext('2d'); this.pointer = null; this.keyboard = false;
    this.image = new Image(); this.image.src = '/assets/sprites.png';
    this.ready = this.image.decode().catch(() => { this.assetError = true; });
    this.reduced = matchMedia('(prefers-reduced-motion: reduce)').matches;
    this.observer = new ResizeObserver(() => this.resize()); this.observer.observe(canvas); this.resize();
  }
  resize() {
    const rect = this.canvas.getBoundingClientRect(); this.w = rect.width; this.h = rect.height;
    this.dpr = Math.min(devicePixelRatio || 1, 2); this.canvas.width = Math.round(this.w * this.dpr); this.canvas.height = Math.round(this.h * this.dpr);
    this.size = Math.min(this.w, this.h); this.scale = this.size / 1000; this.ox = (this.w - this.size) / 2; this.oy = (this.h - this.size) / 2;
  }
  point(clientX, clientY) {
    const r = this.canvas.getBoundingClientRect();
    return { x: (clientX - r.left - this.ox) / this.scale, y: (clientY - r.top - this.oy) / this.scale };
  }
  sprite(index, x, y, size, alpha = 1) {
    if (!this.image.complete || !this.image.naturalWidth) return;
    const c = this.ctx, sw = this.image.naturalWidth / 2, sh = this.image.naturalHeight / 2;
    c.save(); c.globalAlpha *= alpha; c.drawImage(this.image, (index % 2) * sw, Math.floor(index / 2) * sh, sw, sh, x - size / 2, y - size / 2, size, size); c.restore();
  }
  circle(x,y,r,color,width=1) { const c=this.ctx;c.beginPath();c.arc(x,y,r,0,TAU);c.strokeStyle=color;c.lineWidth=width;c.stroke(); }
  render(game, state) {
    const c = this.ctx; c.setTransform(this.dpr,0,0,this.dpr,0,0); c.clearRect(0,0,this.w,this.h);
    c.translate(this.ox,this.oy); c.scale(this.scale,this.scale);
    const scan = game.tick < game.scanUntil;
    const faded = state === 'intro'; c.globalAlpha = faded ? 0.63 : 1;
    for (const r of [112, 209, 309, 422, 480]) this.circle(500,500,r, r===480?'#21415155':'#477895a0',r===480?1:1.1);
    for (let i=0;i<72;i++) {const a=i*TAU/72;const r=480;const big=i%6===0;c.strokeStyle=big?'#52758e77':'#23425744';c.lineWidth=1;c.beginPath();c.moveTo(500+Math.cos(a)*r,500+Math.sin(a)*r);c.lineTo(500+Math.cos(a)*(r+(big?9:4)),500+Math.sin(a)*(r+(big?9:4)));c.stroke();}
    for (const link of game.network.links) {
      const known=game.discoveredLinks.has(linkKey(link)); c.setLineDash(link.hidden ? [4,7] : []); c.strokeStyle=link.hidden ? (known?'#81e4f6b0':'#42647618') : '#71afcaa0'; c.lineWidth=scan?1.6:1.1;
      c.beginPath();c.moveTo(link.from.x,link.from.y);c.lineTo(link.to.x,link.to.y);c.stroke();c.setLineDash([]);
      if(!link.hidden || known) { const t=this.reduced?.5:((game.tick/600+link.from.index*.123)%1); c.fillStyle=scan?'#a9effe':'#80cee5';c.globalAlpha*=.55;c.beginPath();c.arc(link.from.x+(link.to.x-link.from.x)*t,link.from.y+(link.to.y-link.from.y)*t,2,0,TAU);c.fill();c.globalAlpha=faded?.63:1; }
    }
    for(const node of game.network.nodes){
      if(node.tier===0){
        c.beginPath();c.moveTo(500,500);c.lineTo(node.x,node.y);c.strokeStyle=game.hp[node.index]>0?'#79d8ebaa':'#743a4b77';c.lineWidth=2;c.stroke();
        this.sprite(1,node.x,node.y,90,game.hp[node.index]>0?1:.16);
        const health=game.hp[node.index];
        for(let i=0;i<4;i++){c.fillStyle=i<health?'#8cdded':'#243341';c.fillRect(node.x-20+i*11,node.y+36,8,3);}
      }else{this.sprite(0,node.x,node.y,node.tier===3?70:60,.95);}
    }
    // The central brand symbol and geometry intentionally remain vector-native.
    c.shadowColor='#ff9d4c';c.shadowBlur=18; c.fillStyle='#ff9d4c';c.beginPath();
    for(let i=0;i<6;i++){const a=i*TAU/6-Math.PI/2;c.lineTo(500+Math.cos(a)*26,500+Math.sin(a)*26);}c.closePath();c.fill();c.shadowBlur=0;
    this.circle(500,500,47,'#eea15b70',1.2);
    c.textAlign='center';
    c.font=`600 ${Math.max(13,8/this.scale)}px -apple-system, sans-serif`;c.fillStyle='#ffb87c';c.fillText('ORGANISATIE',500,558);
    if(scan){const age=300-(game.scanUntil-game.tick);const radius=(age%85)/85*490;this.circle(500,500,radius,'#80e5f866',2);this.circle(500,500,radius*.83,'#80e5f828',1);}
    for(const f of game.fields){
      if(game.tick<f.start){const t=(game.tick-f.born)/Math.max(1,f.start-f.born);const x=500+(f.x-500)*t,y=500+(f.y-500)*t;c.strokeStyle='#8cdded60';c.lineWidth=2;c.beginPath();c.moveTo(500+(f.x-500)*Math.max(0,t-.15),500+(f.y-500)*Math.max(0,t-.15));c.lineTo(x,y);c.stroke();c.fillStyle='#c8f6ff';c.beginPath();c.arc(x,y,4,0,TAU);c.fill();this.circle(f.x,f.y,7,'#8cdded80',1);}
      else {this.sprite(3,f.x,f.y,f.radius*2.55,Math.min(1,(f.end-game.tick)/25)*.9);c.fillStyle='#70dced0b';c.beginPath();c.arc(f.x,f.y,f.radius,0,TAU);c.fill();}
    }
    for(const packet of game.packets){
      const threat=THREATS[packet.kind], low=threat.damage===0;
      if(packet.warning>0)this.circle(packet.x,packet.y,27+(45-packet.warning)*.18,threat.color,1.4);
      else {
        const from=game.network.map[packet.from],to=game.network.map[packet.to],angle=Math.atan2(to.y-from.y,to.x-from.x);
        const trail=30+game.phase*7;c.save();c.translate(packet.x,packet.y);c.rotate(angle);
        const grad=c.createLinearGradient(-trail,0,0,0);grad.addColorStop(0,threat.color+'00');grad.addColorStop(1,threat.color+'bb');
        c.strokeStyle=grad;c.lineWidth=3;c.beginPath();c.moveTo(-trail,0);c.lineTo(0,0);c.stroke();c.restore();
      }
      if(!low){c.save();if(threat.severity==='critical')c.filter='hue-rotate(-30deg)';this.sprite(2,packet.x,packet.y,48);c.restore();}
      c.save();c.translate(packet.x,packet.y);c.strokeStyle=threat.color;c.fillStyle=low?'#061d2a':'#22151e';c.lineWidth=2.5;c.beginPath();
      if(low)c.arc(0,0,13,0,TAU);
      else if(threat.severity==='critical'){c.moveTo(0,-18);c.lineTo(17,0);c.lineTo(0,18);c.lineTo(-17,0);c.closePath();}
      else{c.moveTo(0,-18);c.lineTo(17,14);c.lineTo(-17,14);c.closePath();}
      c.fill();c.stroke();c.textAlign='center';c.fillStyle=threat.color;c.font='bold 22px -apple-system, sans-serif';c.fillText(low?'·':'!',0,7);c.restore();
      const fontSize=Math.max(19,10/this.scale);c.font=`600 ${fontSize}px SFMono-Regular, monospace`;c.textAlign='center';
      const width=c.measureText(threat.code).width+10;c.fillStyle='#06101de8';c.fillRect(packet.x-width/2,packet.y+20,width,fontSize+7);
      c.fillStyle=threat.color;c.fillText(threat.code,packet.x,packet.y+fontSize+21);
    }
    for(const effect of game.fx){const age=game.tick-effect.born;const a=1-age/65;c.globalAlpha=(faded?.63:1)*a;
      if(effect.type==='hit'||effect.type==='mistake'){this.circle(effect.x,effect.y,6+age*.45,'#d7f7ff',1);c.font='600 17px SFMono-Regular, monospace';c.textAlign='center';c.fillStyle='#a7edff';c.fillText((effect.points>0?'+':'')+effect.points,effect.x,effect.y-14-age*.45);}
      if(effect.type==='cascade'){this.circle(effect.x,effect.y,16+age*.7,'#ff9d4c',2);c.font='10px -apple-system, sans-serif';c.fillStyle='#ffad6b';c.fillText('SPLITSING',effect.x,effect.y-28);}
      if(effect.type==='damage'){this.circle(effect.x,effect.y,20+age,'#ff645b',3);}
    }
    // Reserve the empty bands between node orbits for the tier labels.
    // Their shared centre line matches ORGANISATIE; no node occupies these bands.
    // Draw after moving effects so the opaque backing keeps every label legible.
    c.save();c.globalAlpha=1;c.textAlign='center';c.textBaseline='middle';
    const labelSize=Math.max(15,10/this.scale),labelHeight=labelSize+8;
    c.font=`600 ${labelSize}px -apple-system, sans-serif`;
    for(const [tier,outer,inner] of [[3,422,309],[2,309,209],[1,209,112]]){
      const x=500,y=500-(outer+inner)/2,text='TIER '+tier;
      const width=Math.max(82,c.measureText(text).width+20);
      c.fillStyle='#071421';c.fillRect(x-width/2,y-labelHeight/2,width,labelHeight);
      c.fillStyle='#aac8db';c.fillText(text,x,y);
    }
    c.restore();c.globalAlpha=1;
    if(this.pointer && state==='playing'){
      const {x,y}=this.pointer;c.setLineDash([4,6]);this.circle(x,y,77,game.energy>=20?'#96e6f760':'#ff645b80',1.5);c.setLineDash([]);c.strokeStyle=game.energy>=20?'#b8f2ff':'#ff645b';c.lineWidth=1.5;c.beginPath();c.moveTo(x-9,y);c.lineTo(x+9,y);c.moveTo(x,y-9);c.lineTo(x,y+9);c.stroke();
    }
  }
}
