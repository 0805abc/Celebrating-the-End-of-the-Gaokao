/**
 * 场景音效引擎 — 支持交叉淡入淡出
 */
window.GAOKAO_AUDIO = (function () {
  'use strict';

  let ctx = null;
  let enabled = true;
  let ambientNodes = [];
  let rainNodes = [];
  let sceneId = -1;
  let crossfadeToken = 0;

  function supported() {
    return !!(window.AudioContext || window.webkitAudioContext);
  }

  function init() {
    if (ctx || !supported()) return !!ctx;
    ctx = new AudioContext();
    return true;
  }

  async function resume() {
    init();
    if (ctx && ctx.state === 'suspended') await ctx.resume();
    return ctx && ctx.state === 'running';
  }

  function setEnabled(on) {
    enabled = on;
    if (!on) stopAll();
  }

  function isEnabled() { return enabled; }

  function collectGains(list) {
    return list.filter(n => n && n.gain && typeof n.gain.value === 'number');
  }

  function fadeGains(gains, to, dur) {
    if (!ctx || !gains.length) return;
    const t = ctx.currentTime;
    gains.forEach(g => {
      g.gain.cancelScheduledValues(t);
      g.gain.setValueAtTime(g.gain.value, t);
      g.gain.linearRampToValueAtTime(Math.max(to, 0.0001), t + dur);
    });
  }

  function stopNodes(list) {
    list.forEach(n => {
      try {
        if (n.stop) n.stop(0);
        if (n.disconnect) n.disconnect();
      } catch (_) {}
    });
    list.length = 0;
  }

  function stopAmbient() { stopNodes(ambientNodes); }
  function stopRain() { stopNodes(rainNodes); }

  function stopAll() {
    stopAmbient();
    stopRain();
    sceneId = -1;
  }

  function master(vol = 0.5) {
    const g = ctx.createGain();
    g.gain.value = vol;
    g.connect(ctx.destination);
    return g;
  }

  function noiseBuffer(seconds = 2) {
    const len = ctx.sampleRate * seconds;
    const buf = ctx.createBuffer(1, len, ctx.sampleRate);
    const data = buf.getChannelData(0);
    for (let i = 0; i < len; i++) data[i] = Math.random() * 2 - 1;
    return buf;
  }

  function tone(freq, dur, type, vol, dest, startAt) {
    const t = startAt ?? ctx.currentTime;
    const osc = ctx.createOscillator();
    const g = ctx.createGain();
    osc.type = type;
    osc.frequency.setValueAtTime(freq, t);
    g.gain.setValueAtTime(0, t);
    g.gain.linearRampToValueAtTime(vol, t + 0.02);
    g.gain.exponentialRampToValueAtTime(0.001, t + dur);
    osc.connect(g);
    g.connect(dest);
    osc.start(t);
    osc.stop(t + dur + 0.05);
  }

  function playTypeTick() {
    if (!enabled || !ctx) return;
    tone(900 + Math.random() * 150, 0.04, 'sine', 0.045, master(0.55));
  }

  function playUIClick(freq = 640) {
    if (!enabled || !ctx) return;
    const t = ctx.currentTime;
    const m = master(0.58);
    tone(freq, 0.1, 'sine', 0.07, m, t);
    tone(freq * 1.45, 0.07, 'sine', 0.035, m, t + 0.025);
  }

  function playClimax() {
    if (!enabled || !ctx) return;
    const m = master(0.45);
    tone(220, 0.5, 'sine', 0.05, m);
    tone(330, 0.55, 'sine', 0.04, m, ctx.currentTime + 0.12);
    tone(440, 0.7, 'sine', 0.035, m, ctx.currentTime + 0.28);
  }

  function playDrop() {
    if (!enabled || !ctx) return;
    const m = master(0.5);
    tone(180, 0.12, 'triangle', 0.08, m);
    tone(95, 0.18, 'triangle', 0.05, m, ctx.currentTime + 0.06);
  }

  function playHeartbeat() {
    if (!enabled || !ctx) return;
    const m = master(0.55);
    tone(58, 0.14, 'sine', 0.1, m);
    tone(48, 0.1, 'sine', 0.07, m, ctx.currentTime + 0.18);
  }

  function playDoorOpen() {
    if (!enabled || !ctx) return;
    const t = ctx.currentTime;
    const m = master(0.65);
    const buf = noiseBuffer(0.4);
    const src = ctx.createBufferSource();
    src.buffer = buf;
    const filt = ctx.createBiquadFilter();
    filt.type = 'bandpass';
    filt.frequency.setValueAtTime(400, t);
    filt.frequency.exponentialRampToValueAtTime(1200, t + 0.25);
    const g = ctx.createGain();
    g.gain.setValueAtTime(0, t);
    g.gain.linearRampToValueAtTime(0.12, t + 0.04);
    g.gain.exponentialRampToValueAtTime(0.001, t + 0.35);
    src.connect(filt);
    filt.connect(g);
    g.connect(m);
    src.start(t);
    src.stop(t + 0.4);
    tone(120, 0.15, 'sine', 0.06, m, t);
    tone(200, 0.3, 'sine', 0.04, m, t + 0.08);
    tone(520, 0.5, 'sine', 0.025, m, t + 0.15);
  }

  function playDoorPush() {
    if (!enabled || !ctx) return;
    tone(80 + Math.random() * 20, 0.07, 'triangle', 0.038, master(0.5));
  }

  function playPenScratch() {
    if (!enabled || !ctx) return;
    const t = ctx.currentTime;
    const m = master(0.25);
    const buf = noiseBuffer(0.08);
    const src = ctx.createBufferSource();
    src.buffer = buf;
    const filt = ctx.createBiquadFilter();
    filt.type = 'highpass';
    filt.frequency.value = 2000;
    const g = ctx.createGain();
    g.gain.setValueAtTime(0.04, t);
    g.gain.exponentialRampToValueAtTime(0.001, t + 0.07);
    src.connect(filt);
    filt.connect(g);
    g.connect(m);
    src.start(t);
    src.stop(t + 0.08);
  }

  function playBell() {
    if (!enabled || !ctx) return;
    const m = master(0.4);
    tone(880, 1.2, 'sine', 0.06, m);
    tone(1320, 1.0, 'sine', 0.025, m, ctx.currentTime + 0.02);
  }

  function playLanternWhoosh() {
    if (!enabled || !ctx) return;
    const t = ctx.currentTime;
    const m = master(0.28);
    const buf = noiseBuffer(0.5);
    const src = ctx.createBufferSource();
    src.buffer = buf;
    const filt = ctx.createBiquadFilter();
    filt.type = 'lowpass';
    filt.frequency.setValueAtTime(600, t);
    filt.frequency.linearRampToValueAtTime(180, t + 0.5);
    const g = ctx.createGain();
    g.gain.setValueAtTime(0, t);
    g.gain.linearRampToValueAtTime(0.05, t + 0.08);
    g.gain.exponentialRampToValueAtTime(0.001, t + 0.5);
    src.connect(filt);
    filt.connect(g);
    g.connect(m);
    src.start(t);
    src.stop(t + 0.5);
  }

  function playSunrise() {
    if (!enabled || !ctx) return;
    const m = master(0.35);
    [262, 330, 392, 523].forEach((f, i) => tone(f, 0.8, 'sine', 0.03, m, ctx.currentTime + i * 0.15));
  }

  function playReleaseBurst() {
    if (!enabled || !ctx) return;
    const m = master(0.5);
    tone(90, 0.4, 'sawtooth', 0.05, m);
    tone(60, 0.6, 'sine', 0.06, m, ctx.currentTime + 0.1);
  }

  function createRain(fadeIn = 1.5, targetGain = 1) {
    const t = ctx.currentTime;
    const m = master(0.22);
    const buf = noiseBuffer(3);
    const src = ctx.createBufferSource();
    src.buffer = buf;
    src.loop = true;
    const filt = ctx.createBiquadFilter();
    filt.type = 'bandpass';
    filt.frequency.value = 900;
    filt.Q.value = 0.4;
    const g = ctx.createGain();
    g.gain.setValueAtTime(0, t);
    g.gain.linearRampToValueAtTime(targetGain, t + fadeIn);
    src.connect(filt);
    filt.connect(g);
    g.connect(m);
    src.start(t);
    rainNodes.push(src, filt, g);
    return g;
  }

  function startSceneAmbient(id, fadeIn = 1.2) {
    if (!enabled || !ctx) return;
    sceneId = id;
    const t = ctx.currentTime;
    const m = master(0.18);

    function loopNoise(lp, vol) {
      const buf = noiseBuffer(4);
      const src = ctx.createBufferSource();
      src.buffer = buf;
      src.loop = true;
      const filt = ctx.createBiquadFilter();
      filt.type = 'lowpass';
      filt.frequency.value = lp;
      const g = ctx.createGain();
      g.gain.setValueAtTime(0, t);
      g.gain.linearRampToValueAtTime(vol, t + fadeIn);
      src.connect(filt);
      filt.connect(g);
      g.connect(m);
      src.start(t);
      ambientNodes.push(src, filt, g);
    }

    if (id === 0 || id === 2 || id === 6) loopNoise(id === 2 ? 280 : 200, id === 2 ? 0.35 : 0.25);

    if (id === 1) {
      const osc = ctx.createOscillator();
      const g = ctx.createGain();
      osc.type = 'sine';
      osc.frequency.value = 55;
      g.gain.setValueAtTime(0, t);
      g.gain.linearRampToValueAtTime(0.03, t + fadeIn);
      osc.connect(g);
      g.connect(m);
      osc.start(t);
      ambientNodes.push(osc, g);
    }

    if (id === 4) createRain(fadeIn, 1);

    if (id === 5) {
      [220, 277, 330].forEach((f, i) => {
        const osc = ctx.createOscillator();
        const g = ctx.createGain();
        osc.type = 'sine';
        osc.frequency.value = f;
        g.gain.setValueAtTime(0, t);
        g.gain.linearRampToValueAtTime(0.012, t + fadeIn + i * 0.3);
        osc.connect(g);
        g.connect(master(0.2));
        osc.start(t);
        ambientNodes.push(osc, g);
      });
      loopNoise(320, 0.12);
    }

    if (id === 9) loopNoise(400, 0.2);

    if (id === 10) setTimeout(() => playSunrise(), fadeIn * 500);
  }

  function setScene(id, opts = {}) {
    if (!enabled || !ctx) return;
    const duration = opts.duration ?? 2.2;
    const token = ++crossfadeToken;

    fadeGains(collectGains(ambientNodes), 0, duration);
    fadeGains(collectGains(rainNodes), 0, duration);

    const oldAmbient = ambientNodes.slice();
    const oldRain = rainNodes.slice();
    ambientNodes = [];
    rainNodes = [];

    if (id >= 0) startSceneAmbient(id, duration);

    setTimeout(() => {
      if (token !== crossfadeToken) return;
      stopNodes(oldAmbient);
      stopNodes(oldRain);
    }, duration * 1000 + 120);
  }

  function crossfadeScene(id, duration = 3.5) {
    setScene(id, { duration });
  }

  return {
    supported,
    init,
    resume,
    setEnabled,
    isEnabled,
    stopAll,
    setScene,
    crossfadeScene,
    stopRain,
    playTypeTick,
    playUIClick,
    playClimax,
    playDrop,
    playHeartbeat,
    playDoorOpen,
    playDoorPush,
    playPenScratch,
    playBell,
    playLanternWhoosh,
    playSunrise,
    playReleaseBurst,
    startRain: () => createRain(1.5, 1),
    tone: (f, d, ty, v) => { if (enabled && ctx) tone(f, d, ty, v, master(0.55)); }
  };
})();
