export class Audio {
  constructor(){ this.enabled=false;this.context=null; }
  toggle(){this.enabled=!this.enabled;if(this.enabled){this.context??=new (window.AudioContext||window.webkitAudioContext)();this.context.resume();this.play('scan');}return this.enabled;}
  play(type){if(!this.enabled||!this.context)return; const ctx=this.context;const now=ctx.currentTime;const oscillator=ctx.createOscillator(),gain=ctx.createGain();oscillator.connect(gain);gain.connect(ctx.destination);
    const settings={shot:[520,170,.1,.025,'sine'],hit:[880,1500,.12,.022,'sine'],damage:[100,40,.25,.045,'triangle'],scan:[230,900,.6,.025,'sine'],cascade:[160,90,.15,.02,'triangle'],finish:[440,880,.8,.03,'sine']};const [f,end,duration,volume,wave]=settings[type]||settings.hit;
    oscillator.type=wave;oscillator.frequency.setValueAtTime(f,now);oscillator.frequency.exponentialRampToValueAtTime(end,now+duration);gain.gain.setValueAtTime(volume,now);gain.gain.exponentialRampToValueAtTime(.001,now+duration);oscillator.start();oscillator.stop(now+duration);
  }
}
