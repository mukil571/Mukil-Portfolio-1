import { flags, on } from '../lib/bus.js';

/**
 * Procedural Web Audio sound: an ambient space pad plus whoosh / blip effects.
 * Nothing is downloaded; the AudioContext is only created on the first enable (a user gesture).
 */
let ctx = null;
let master = null;
let ambientStarted = false;

function ensureContext() {
  if (ctx) return ctx;
  const AC = window.AudioContext || window.webkitAudioContext;
  if (!AC) return null;
  ctx = new AC();
  master = ctx.createGain();
  master.gain.value = 0;
  master.connect(ctx.destination);
  return ctx;
}

function ramp(param, value, seconds) {
  const now = ctx.currentTime;
  param.cancelScheduledValues(now);
  param.setValueAtTime(param.value, now);
  param.linearRampToValueAtTime(value, now + seconds);
}

function noiseBuffer(seconds) {
  const buffer = ctx.createBuffer(1, Math.floor(ctx.sampleRate * seconds), ctx.sampleRate);
  const data = buffer.getChannelData(0);
  for (let i = 0; i < data.length; i++) data[i] = Math.random() * 2 - 1;
  return buffer;
}

function startAmbient() {
  if (ambientStarted) return;
  ambientStarted = true;

  const out = ctx.createGain();
  out.gain.value = 0.55;
  out.connect(master);

  const filter = ctx.createBiquadFilter();
  filter.type = 'lowpass';
  filter.frequency.value = 420;
  filter.Q.value = 0.8;
  filter.connect(out);

  // slow LFO sweeps the filter so the pad "breathes"
  const lfo = ctx.createOscillator();
  lfo.frequency.value = 0.05;
  const lfoDepth = ctx.createGain();
  lfoDepth.gain.value = 220;
  lfo.connect(lfoDepth).connect(filter.frequency);
  lfo.start();

  [
    [55, 'sawtooth', 0.05],
    [55.4, 'sawtooth', 0.05],
    [82.4, 'sine', 0.08],
    [110.2, 'triangle', 0.025],
  ].forEach(([freq, type, gain]) => {
    const osc = ctx.createOscillator();
    osc.type = type;
    osc.frequency.value = freq;
    const g = ctx.createGain();
    g.gain.value = gain;
    osc.connect(g).connect(filter);
    osc.start();
  });

  const noise = ctx.createBufferSource();
  noise.buffer = noiseBuffer(4);
  noise.loop = true;
  const band = ctx.createBiquadFilter();
  band.type = 'bandpass';
  band.frequency.value = 900;
  band.Q.value = 0.6;
  const noiseGain = ctx.createGain();
  noiseGain.gain.value = 0.02;
  noise.connect(band).connect(noiseGain).connect(out);
  noise.start();
}

function whoosh(strength) {
  const t = ctx.currentTime;
  const src = ctx.createBufferSource();
  src.buffer = noiseBuffer(1.8);
  const band = ctx.createBiquadFilter();
  band.type = 'bandpass';
  band.Q.value = 1.2;
  band.frequency.setValueAtTime(200, t);
  band.frequency.exponentialRampToValueAtTime(3200, t + 0.7);
  band.frequency.exponentialRampToValueAtTime(260, t + 1.7);
  const g = ctx.createGain();
  g.gain.setValueAtTime(0, t);
  g.gain.linearRampToValueAtTime(1.4 * strength, t + 0.55);
  g.gain.linearRampToValueAtTime(0, t + 1.75);
  src.connect(band).connect(g).connect(master);
  src.start(t);
  src.stop(t + 1.8);
}

function blip() {
  const t = ctx.currentTime;
  const osc = ctx.createOscillator();
  osc.type = 'sine';
  osc.frequency.setValueAtTime(880, t);
  osc.frequency.exponentialRampToValueAtTime(1480, t + 0.08);
  const g = ctx.createGain();
  g.gain.setValueAtTime(0, t);
  g.gain.linearRampToValueAtTime(0.35, t + 0.01);
  g.gain.exponentialRampToValueAtTime(0.0001, t + 0.2);
  osc.connect(g).connect(master);
  osc.start(t);
  osc.stop(t + 0.22);
}

export function setSound(enabled) {
  flags.sound = enabled;
  if (!enabled && !ctx) return;
  if (!ensureContext()) return;
  if (enabled) {
    ctx.resume();
    startAmbient();
    ramp(master.gain, 0.35, 1.2);
  } else {
    ramp(master.gain, 0, 0.4);
  }
}

export function audioState() {
  return ctx ? ctx.state : 'none';
}

on('sfx', (e) => {
  if (!flags.sound || !ctx) return;
  if (e.detail === 'blip') blip();
  else if (e.detail === 'whoosh') whoosh(1);
  else if (e.detail === 'swoosh') whoosh(0.35);
});
