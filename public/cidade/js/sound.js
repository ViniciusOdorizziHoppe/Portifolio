/** ambiente sonoro sintetizado: rumor de trânsito + buzinas distantes + pássaros de dia */
export class CitySound {
  constructor() {
    this.ctx = null;
    this.on = false;
    this.night = 0;
    this._nextHorn = 4;
    this._nextBird = 6;
  }

  _init() {
    const AC = window.AudioContext || window.webkitAudioContext;
    if (!AC) return false;
    this.ctx = new AC();

    // rumor: ruído marrom filtrado
    const len = this.ctx.sampleRate * 4;
    const buf = this.ctx.createBuffer(1, len, this.ctx.sampleRate);
    const d = buf.getChannelData(0);
    let last = 0;
    for (let i = 0; i < len; i++) {
      const w = Math.random() * 2 - 1;
      last = (last + 0.02 * w) / 1.02;
      d[i] = last * 3.2;
    }
    const src = this.ctx.createBufferSource();
    src.buffer = buf; src.loop = true;

    const lp = this.ctx.createBiquadFilter();
    lp.type = 'lowpass'; lp.frequency.value = 420; lp.Q.value = 0.6;

    const hp = this.ctx.createBiquadFilter();
    hp.type = 'highpass'; hp.frequency.value = 70;

    this.rumbleGain = this.ctx.createGain();
    this.rumbleGain.gain.value = 0;

    src.connect(hp).connect(lp).connect(this.rumbleGain).connect(this.ctx.destination);
    src.start();

    // camada de "vida": ruído mais agudo e baixo (gente, pneus)
    const src2 = this.ctx.createBufferSource();
    src2.buffer = buf; src2.loop = true;
    const bp = this.ctx.createBiquadFilter();
    bp.type = 'bandpass'; bp.frequency.value = 1200; bp.Q.value = 0.8;
    this.lifeGain = this.ctx.createGain(); this.lifeGain.gain.value = 0;
    src2.connect(bp).connect(this.lifeGain).connect(this.ctx.destination);
    src2.start();

    this.ready = true;
    return true;
  }

  toggle() {
    if (!this.ctx) this._init();
    if (!this.ctx) return false;
    if (this.ctx.state === 'suspended') this.ctx.resume();
    this.on = !this.on;
    const t = this.ctx.currentTime;
    this.rumbleGain.gain.cancelScheduledValues(t);
    this.rumbleGain.gain.linearRampToValueAtTime(this.on ? 0.16 : 0, t + 0.8);
    this.lifeGain.gain.cancelScheduledValues(t);
    this.lifeGain.gain.linearRampToValueAtTime(this.on ? 0.05 : 0, t + 0.8);
    return this.on;
  }

  setNight(n) { this.night = n; }

  _horn() {
    const c = this.ctx;
    const t = c.currentTime;
    const g = c.createGain();
    g.gain.setValueAtTime(0, t);
    g.gain.linearRampToValueAtTime(0.05, t + 0.02);
    g.gain.exponentialRampToValueAtTime(0.0001, t + 0.38);
    const f = c.createBiquadFilter();
    f.type = 'bandpass'; f.frequency.value = 520; f.Q.value = 3;
    const o = c.createOscillator();
    o.type = 'sawtooth';
    o.frequency.setValueAtTime(392 + Math.random() * 60, t);
    o.connect(f).connect(g).connect(c.destination);
    o.start(t); o.stop(t + 0.42);
  }

  _bird() {
    const c = this.ctx;
    for (let k = 0; k < 3; k++) {
      const t = c.currentTime + k * 0.11 + Math.random() * 0.03;
      const g = c.createGain();
      g.gain.setValueAtTime(0, t);
      g.gain.linearRampToValueAtTime(0.022, t + 0.01);
      g.gain.exponentialRampToValueAtTime(0.0001, t + 0.11);
      const o = c.createOscillator();
      o.type = 'sine';
      o.frequency.setValueAtTime(2200 + Math.random() * 1400, t);
      o.frequency.exponentialRampToValueAtTime(3200 + Math.random() * 900, t + 0.09);
      o.connect(g).connect(c.destination);
      o.start(t); o.stop(t + 0.13);
    }
  }

  update(dt) {
    if (!this.on || !this.ctx) return;
    this._nextHorn -= dt;
    this._nextBird -= dt;
    if (this._nextHorn <= 0) {
      this._nextHorn = 5 + Math.random() * 14;
      if (this.ctx.state === 'running') this._horn();
    }
    if (this.night < 0.3 && this._nextBird <= 0) {
      this._nextBird = 3 + Math.random() * 9;
      if (this.ctx.state === 'running') this._bird();
    }
    if (this.night >= 0.3) this._nextBird = 3;
  }
}
