/* Mente Confusa — núcleo: armazenamento, áudio, efeitos e utilidades. */
(function () {
  'use strict';

  const KEY = 'menteConfusa.save.v1';
  const XP_PER_LEVEL = 250;

  const defaults = () => ({
    version: 1,
    name: '',
    avatar: '🦊',
    xp: 0,
    coins: 60,
    stars: {},          // { "mundo:fase": 0..3 }
    bestScore: 0,
    powerups: { fifty: 1, time: 1, skip: 1 },
    stats: { runs: 0, answered: 0, correct: 0, bestCombo: 0 },
    settings: { sound: true, reducedMotion: false, vibrate: true, music: true },
    ranking: [],        // { name, avatar, score, when, label }
    daily: { date: '', done: false, best: 0 },
    streak: { count: 0, last: '' },
    multiPlayers: null,
  });

  function merge(base, saved) {
    const out = Object.assign({}, base);
    if (!saved || typeof saved !== 'object') return out;
    Object.keys(base).forEach((k) => {
      const v = saved[k];
      if (v === undefined || v === null) return;
      if (typeof base[k] === 'object' && !Array.isArray(base[k])) {
        out[k] = Object.assign({}, base[k], v);
      } else {
        out[k] = v;
      }
    });
    return out;
  }

  const Store = {
    data: defaults(),
    load() {
      try {
        const raw = localStorage.getItem(KEY);
        this.data = merge(defaults(), raw ? JSON.parse(raw) : null);
      } catch (_) {
        this.data = defaults();
      }
      return this.data;
    },
    save() {
      try { localStorage.setItem(KEY, JSON.stringify(this.data)); } catch (_) {}
      return this.data;
    },
    reset() {
      try { localStorage.removeItem(KEY); } catch (_) {}
      this.data = defaults();
      return this.data;
    },
  };

  /* ---------- datas ---------- */
  const pad = (n) => String(n).padStart(2, '0');
  function dateKey(d) {
    const x = d || new Date();
    return `${x.getFullYear()}-${pad(x.getMonth() + 1)}-${pad(x.getDate())}`;
  }
  function dayDiff(a, b) {
    const pa = new Date(a + 'T00:00:00');
    const pb = new Date(b + 'T00:00:00');
    return Math.round((pb - pa) / 86400000);
  }

  /* ---------- utilidades ---------- */
  function shuffle(arr) {
    const a = arr.slice();
    for (let i = a.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [a[i], a[j]] = [a[j], a[i]];
    }
    return a;
  }
  function mulberry32(seed) {
    let a = seed >>> 0;
    return function () {
      a |= 0; a = (a + 0x6d2b79f5) | 0;
      let t = Math.imul(a ^ (a >>> 15), 1 | a);
      t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
  }
  function hashString(s) {
    let h = 2166136261;
    for (let i = 0; i < s.length; i++) {
      h ^= s.charCodeAt(i);
      h = Math.imul(h, 16777619);
    }
    return h >>> 0;
  }
  const clamp = (v, min, max) => Math.min(max, Math.max(min, v));
  const el = (id) => document.getElementById(id);
  const esc = (s) => String(s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  const nf = new Intl.NumberFormat('pt-BR');

  function playerLevel(xp) {
    const level = Math.floor(xp / XP_PER_LEVEL) + 1;
    return { level, into: xp % XP_PER_LEVEL, needed: XP_PER_LEVEL };
  }

  /* ---------- áudio sintetizado (sem arquivos) ---------- */
  const Sfx = {
    ctx: null,
    play(name) {
      const S = Store.data.settings;
      if (!S.sound) return;
      this._init();
      const ctx = this.ctx;
      if (!ctx) return;
      const now = ctx.currentTime;
      const tone = (freq, dur, opts) => {
        const o = Object.assign({ type: 'sine', gain: 0.07, delay: 0, to: null }, opts || {});
        const osc = ctx.createOscillator();
        const g = ctx.createGain();
        osc.type = o.type;
        osc.frequency.setValueAtTime(freq, now + o.delay);
        if (o.to) osc.frequency.exponentialRampToValueAtTime(o.to, now + o.delay + dur);
        g.gain.setValueAtTime(0.0001, now + o.delay);
        g.gain.exponentialRampToValueAtTime(o.gain, now + o.delay + 0.012);
        g.gain.exponentialRampToValueAtTime(0.0001, now + o.delay + dur);
        osc.connect(g); g.connect(ctx.destination);
        osc.start(now + o.delay); osc.stop(now + o.delay + dur + 0.03);
      };
      switch (name) {
        case 'click': tone(620, 0.06, { type: 'triangle', gain: 0.05 }); break;
        case 'correct':
          tone(523.25, 0.12, { type: 'triangle', gain: 0.07 });
          tone(659.25, 0.12, { type: 'triangle', gain: 0.07, delay: 0.09 });
          tone(783.99, 0.18, { type: 'triangle', gain: 0.06, delay: 0.18 });
          tone(1046.5, 0.24, { type: 'sine', gain: 0.045, delay: 0.26 });
          break;
        case 'wrong':
          tone(240, 0.22, { type: 'sawtooth', gain: 0.06, to: 90 });
          tone(120, 0.3, { type: 'square', gain: 0.045, delay: 0.04, to: 60 });
          tone(70, 0.36, { type: 'sine', gain: 0.06, delay: 0.02, to: 45 });
          break;
        case 'tick': tone(1050, 0.04, { type: 'square', gain: 0.025 }); break;
        case 'turn':
          tone(587.33, 0.1, { type: 'triangle', gain: 0.06 });
          tone(880, 0.16, { type: 'triangle', gain: 0.055, delay: 0.1 });
          break;
        case 'power': tone(420, 0.1, { to: 840, gain: 0.05 }); break;
        case 'coin':
          tone(1180, 0.07, { type: 'triangle', gain: 0.05 });
          tone(1560, 0.12, { type: 'triangle', gain: 0.045, delay: 0.06 });
          break;
        case 'level':
          [523.25, 659.25, 783.99, 1046.5].forEach((f, i) =>
            tone(f, 0.16, { type: 'triangle', gain: 0.07, delay: i * 0.1 }));
          break;
        case 'gameover':
          [392, 329.63, 261.63].forEach((f, i) =>
            tone(f, 0.26, { type: 'sawtooth', gain: 0.045, delay: i * 0.16 }));
          break;
        case 'star': tone(1320, 0.14, { type: 'triangle', gain: 0.05 }); break;
      }
    },
    _init() {
      if (this.ctx) { if (this.ctx.state === 'suspended') this.ctx.resume(); return; }
      const C = window.AudioContext || window.webkitAudioContext;
      if (!C) return;
      try { this.ctx = new C(); } catch (_) { this.ctx = null; }
    },
    /* precisa ser chamado após um toque do usuário no iOS */
    unlock() { this._init(); },
  };

  /* ---------- música de fundo procedural ---------- */
  const Music = {
    ctx: null,
    master: null,
    noise: null,
    timer: null,
    nextTime: 0,
    step: 0,
    playing: false,
    bpm: 158,

    _ensure() {
      Sfx._init();
      const ctx = Sfx.ctx;
      if (!ctx) return null;
      if (this.ctx !== ctx) {
        this.ctx = ctx;
        this.master = ctx.createGain();
        this.master.gain.value = 0;
        const comp = ctx.createDynamicsCompressor();
        comp.threshold.value = -16;
        comp.knee.value = 20;
        comp.ratio.value = 4;
        comp.attack.value = 0.004;
        comp.release.value = 0.25;
        this.master.connect(comp);
        comp.connect(ctx.destination);

        const len = Math.floor(ctx.sampleRate * 0.5);
        const buf = ctx.createBuffer(1, len, ctx.sampleRate);
        const data = buf.getChannelData(0);
        for (let i = 0; i < len; i++) data[i] = Math.random() * 2 - 1;
        this.noise = buf;
      }
      if (ctx.state === 'suspended') ctx.resume();
      return ctx;
    },

    start() {
      const st = Store.data.settings;
      if (!st.sound || !st.music || this.playing) return;
      const ctx = this._ensure();
      if (!ctx) return;
      this.playing = true;
      this.step = 0;
      this.nextTime = ctx.currentTime + 0.08;
      const t = ctx.currentTime;
      this.master.gain.cancelScheduledValues(t);
      this.master.gain.setValueAtTime(Math.max(0.0001, this.master.gain.value), t);
      this.master.gain.exponentialRampToValueAtTime(0.85, t + 0.35);
      clearInterval(this.timer);
      this.timer = setInterval(() => this._schedule(), 25);
    },

    stop(fade) {
      clearInterval(this.timer);
      this.timer = null;
      this.playing = false;
      const ctx = this.ctx;
      if (!ctx || !this.master) return;
      const t = ctx.currentTime;
      const dur = fade === undefined ? 0.2 : fade;
      try {
        this.master.gain.cancelScheduledValues(t);
        this.master.gain.setValueAtTime(Math.max(0.0001, this.master.gain.value), t);
        this.master.gain.exponentialRampToValueAtTime(0.0001, t + dur);
      } catch (_) {}
    },

    _schedule() {
      if (!this.playing || !this.ctx) return;
      const stepDur = 60 / this.bpm / 4;
      if (this.nextTime < this.ctx.currentTime - 0.2) {
        this.nextTime = this.ctx.currentTime + 0.05;
      }
      while (this.nextTime < this.ctx.currentTime + 0.15) {
        this._step(this.step, this.nextTime, stepDur);
        this.nextTime += stepDur;
        this.step = (this.step + 1) % 128;
      }
    },

    _step(step, t, dur) {
      const bar = Math.floor(step / 16);
      const pos = step % 16;
      const roots = [110, 87.31, 130.81, 98, 110, 87.31, 98, 82.41];
      const chords = [[0, 3, 7], [0, 4, 7], [0, 4, 7], [0, 4, 7], [0, 3, 7], [0, 4, 7], [0, 4, 7], [0, 4, 7]];
      const root = roots[bar % 8];
      const chord = chords[bar % 8];

      if (pos % 4 === 0) this._kick(t);
      if (pos === 4 || pos === 12) this._snare(t, 0.1);
      if (pos === 14 && bar % 2 === 1) this._snare(t, 0.06);
      if (pos % 2 === 0) this._hat(t, pos % 4 === 2 ? 0.032 : 0.016);

      if (pos % 2 === 0) {
        const bassSeq = [0, 0, 12, 0, 7, 0, 12, 0];
        this._bass(t, root * Math.pow(2, bassSeq[(pos / 2) % 8] / 12), dur * 1.7);
      }

      const pattern = [0, 1, 2, 1, 0, 2, 1, 2, 0, 1, 2, 1, 2, 1, 0, 2];
      const octave = [1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 0, 1, 1, 1, 0];
      const tone = chord[pattern[pos] % 3];
      const freq = root * 4 * Math.pow(2, tone / 12 + octave[pos]);
      this._lead(t, freq, dur * 0.95);
    },

    _kick(t) {
      const ctx = this.ctx;
      const o = ctx.createOscillator();
      const g = ctx.createGain();
      o.type = 'sine';
      o.frequency.setValueAtTime(150, t);
      o.frequency.exponentialRampToValueAtTime(42, t + 0.11);
      g.gain.setValueAtTime(0.0001, t);
      g.gain.exponentialRampToValueAtTime(0.2, t + 0.006);
      g.gain.exponentialRampToValueAtTime(0.0001, t + 0.17);
      o.connect(g).connect(this.master);
      o.start(t);
      o.stop(t + 0.19);
    },

    _snare(t, vol) {
      const ctx = this.ctx;
      const src = ctx.createBufferSource();
      src.buffer = this.noise;
      const hp = ctx.createBiquadFilter();
      hp.type = 'highpass';
      hp.frequency.value = 1500;
      const g = ctx.createGain();
      g.gain.setValueAtTime(vol, t);
      g.gain.exponentialRampToValueAtTime(0.0001, t + 0.13);
      src.connect(hp).connect(g).connect(this.master);
      src.start(t);
      src.stop(t + 0.15);

      const body = ctx.createOscillator();
      const bg = ctx.createGain();
      body.type = 'triangle';
      body.frequency.setValueAtTime(190, t);
      bg.gain.setValueAtTime(vol * 0.5, t);
      bg.gain.exponentialRampToValueAtTime(0.0001, t + 0.08);
      body.connect(bg).connect(this.master);
      body.start(t);
      body.stop(t + 0.1);
    },

    _hat(t, vol) {
      const ctx = this.ctx;
      const src = ctx.createBufferSource();
      src.buffer = this.noise;
      const hp = ctx.createBiquadFilter();
      hp.type = 'highpass';
      hp.frequency.value = 7200;
      const g = ctx.createGain();
      g.gain.setValueAtTime(vol, t);
      g.gain.exponentialRampToValueAtTime(0.0001, t + 0.035);
      src.connect(hp).connect(g).connect(this.master);
      src.start(t);
      src.stop(t + 0.05);
    },

    _bass(t, freq, dur) {
      const ctx = this.ctx;
      const o = ctx.createOscillator();
      const f = ctx.createBiquadFilter();
      const g = ctx.createGain();
      o.type = 'sawtooth';
      o.frequency.setValueAtTime(freq, t);
      f.type = 'lowpass';
      f.Q.value = 5;
      f.frequency.setValueAtTime(520, t);
      f.frequency.exponentialRampToValueAtTime(200, t + dur);
      g.gain.setValueAtTime(0.0001, t);
      g.gain.exponentialRampToValueAtTime(0.07, t + 0.008);
      g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
      o.connect(f).connect(g).connect(this.master);
      o.start(t);
      o.stop(t + dur + 0.02);
    },

    _lead(t, freq, dur) {
      const ctx = this.ctx;
      const o = ctx.createOscillator();
      const f = ctx.createBiquadFilter();
      const g = ctx.createGain();
      o.type = 'square';
      o.frequency.setValueAtTime(freq, t);
      f.type = 'lowpass';
      f.frequency.setValueAtTime(3200, t);
      f.frequency.exponentialRampToValueAtTime(1200, t + dur);
      g.gain.setValueAtTime(0.0001, t);
      g.gain.exponentialRampToValueAtTime(0.028, t + 0.006);
      g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
      o.connect(f).connect(g).connect(this.master);
      o.start(t);
      o.stop(t + dur + 0.01);
    },
  };

  function vibrate(pattern) {
    if (!Store.data.settings.vibrate) return;
    if (navigator.vibrate) { try { navigator.vibrate(pattern); } catch (_) {} }
  }

  /* ---------- toast ---------- */
  let toastTimer = null;
  function toast(text) {
    const node = el('toast');
    if (!node) return;
    node.textContent = text;
    node.classList.add('show');
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => node.classList.remove('show'), 2200);
  }

  /* ---------- modal ---------- */
  const Modal = {
    root: null,
    close() {
      if (!this.root) return;
      this.root.hidden = true;
      this.root.querySelector('.modal').classList.remove('in');
      document.body.classList.remove('modal-open');
    },
    open({ title, body, actions, onClose }) {
      this.root = this.root || el('modal-root');
      if (!this.root) return;
      el('modal-title').textContent = title || '';
      el('modal-body').innerHTML = body || '';
      const box = el('modal-actions');
      box.innerHTML = '';
      (actions || [{ label: 'OK', primary: true }]).forEach((a) => {
        const b = document.createElement('button');
        b.type = 'button';
        b.className = a.primary ? 'cta small' : 'ghost-btn';
        b.textContent = a.label;
        b.addEventListener('click', () => {
          Sfx.play('click');
          const keep = a.onClick ? a.onClick() : false;
          if (!keep) Modal.close();
        });
        box.appendChild(b);
      });
      this.root.hidden = false;
      document.body.classList.add('modal-open');
      requestAnimationFrame(() => this.root.querySelector('.modal').classList.add('in'));
      const focusable = this.root.querySelector('button.cta, button.ghost-btn, input');
      if (focusable) focusable.focus({ preventScroll: true });
      this._onClose = onClose || null;
    },
  };
  document.addEventListener('click', (e) => {
    if (e.target.closest('[data-modal-close]')) { Sfx.play('click'); Modal.close(); }
  });
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && Modal.root && !Modal.root.hidden) Modal.close();
  });

  /* ---------- confete / partículas ---------- */
  const Fx = {
    canvas: null, ctx: null, parts: [], raf: 0, dpr: 1,
    init() {
      this.canvas = el('fx');
      if (!this.canvas) return;
      this.ctx = this.canvas.getContext('2d');
      this.resize();
      window.addEventListener('resize', () => this.resize());
    },
    resize() {
      if (!this.canvas) return;
      this.dpr = Math.min(window.devicePixelRatio || 1, 2);
      this.canvas.width = Math.floor(window.innerWidth * this.dpr);
      this.canvas.height = Math.floor(window.innerHeight * this.dpr);
      this.canvas.style.width = window.innerWidth + 'px';
      this.canvas.style.height = window.innerHeight + 'px';
    },
    burst(x, y, count, colors) {
      if (Store.data.settings.reducedMotion) return;
      const palette = colors || ['#9b5cff', '#39d9ff', '#ff5ca8', '#ffd166', '#5cffb1'];
      for (let i = 0; i < count; i++) {
        const a = Math.random() * Math.PI * 2;
        const sp = 2 + Math.random() * 7;
        this.parts.push({
          x, y, vx: Math.cos(a) * sp, vy: Math.sin(a) * sp - 2.5,
          size: 3 + Math.random() * 5, rot: Math.random() * 6.28, vr: (Math.random() - 0.5) * 0.3,
          color: palette[Math.floor(Math.random() * palette.length)], life: 1, shape: Math.random() < 0.5 ? 'rect' : 'circle',
        });
      }
      this.start();
    },
    rain(count) {
      if (Store.data.settings.reducedMotion) return;
      const colors = ['#9b5cff', '#39d9ff', '#ff5ca8', '#ffd166', '#5cffb1'];
      for (let i = 0; i < count; i++) {
        this.parts.push({
          x: Math.random() * window.innerWidth, y: -20 - Math.random() * 120,
          vx: (Math.random() - 0.5) * 2, vy: 2 + Math.random() * 3,
          size: 4 + Math.random() * 6, rot: Math.random() * 6.28, vr: (Math.random() - 0.5) * 0.25,
          color: colors[Math.floor(Math.random() * colors.length)], life: 1, shape: Math.random() < 0.5 ? 'rect' : 'circle',
        });
      }
      this.start();
    },
    start() {
      if (!this.ctx || this.raf) return;
      const step = () => {
        const c = this.ctx;
        c.clearRect(0, 0, this.canvas.width, this.canvas.height);
        this.parts = this.parts.filter((p) => p.life > 0 && p.y < window.innerHeight + 60);
        this.parts.forEach((p) => {
          p.vy += 0.16; p.vx *= 0.995; p.x += p.vx; p.y += p.vy; p.rot += p.vr; p.life -= 0.006;
          c.save();
          c.globalAlpha = clamp(p.life, 0, 1);
          c.translate(p.x * this.dpr, p.y * this.dpr);
          c.rotate(p.rot);
          c.fillStyle = p.color;
          if (p.shape === 'rect') c.fillRect(-p.size / 2, -p.size / 2, p.size, p.size * 1.6);
          else { c.beginPath(); c.arc(0, 0, p.size / 2, 0, 6.283); c.fill(); }
          c.restore();
        });
        if (this.parts.length) { this.raf = requestAnimationFrame(step); }
        else { this.raf = 0; c.clearRect(0, 0, this.canvas.width, this.canvas.height); }
      };
      this.raf = requestAnimationFrame(step);
    },
  };

  window.MC = { Store, Sfx, Music, Fx, Modal, toast, vibrate, dateKey, dayDiff, shuffle, mulberry32, hashString, clamp, el, esc, nf, playerLevel, XP_PER_LEVEL };
})();
