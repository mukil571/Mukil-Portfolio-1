import * as THREE from 'three';
import { createGalaxy } from './galaxy.js';
import { createCosmos } from './cosmos.js';
import { createMorph } from './morphParticles.js';
import { emit, on } from '../lib/bus.js';

const CAMERA_Z = 50;
const FOV = 60;
const JUMP_DURATION = 1.8;
const clamp = (v, a, b) => Math.max(a, Math.min(b, v));

/**
 * Mounts the WebGL universe on `canvas`: spiral galaxy, warp streaks,
 * nebulae, meteors and the morphing name particles. Returns a dispose function.
 */
export function mountUniverse(canvas) {
  let renderer;
  try {
    renderer = new THREE.WebGLRenderer({
      canvas,
      alpha: true,
      antialias: false,
      powerPreference: 'high-performance',
    });
  } catch {
    return () => {}; // no WebGL: the page still works without the backdrop
  }
  renderer.setClearColor(0x000000, 0);

  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(FOV, 1, 0.1, 1000);
  camera.position.set(0, 0, CAMERA_Z);

  const state = {
    time: 0,
    dt: 0,
    width: window.innerWidth,
    height: window.innerHeight,
    mobile: window.innerWidth < 768,
    pixelRatio: 1,
    sizeFactor: 1,
    view: { w: 1, h: 1 },
    mouseNdc: new THREE.Vector2(0, 0),
    mouseWorld: new THREE.Vector2(9999, 9999),
    mouseActive: false,
    scrollY: window.scrollY,
    scrollVel: 0,
    warp: 0,
    jump: 0,
    pageProgress: 0,
    reduced: window.matchMedia('(prefers-reduced-motion: reduce)').matches,
  };

  const modules = [createGalaxy(scene, state), createCosmos(scene, state)];
  let disposed = false;

  function resize() {
    state.width = window.innerWidth;
    state.height = window.innerHeight;
    state.pixelRatio = Math.min(window.devicePixelRatio || 1, 1.5);
    state.sizeFactor = Math.min(1.25, Math.max(0.75, state.height / 900));
    renderer.setPixelRatio(state.pixelRatio);
    renderer.setSize(state.width, state.height);
    camera.aspect = state.width / state.height;
    camera.updateProjectionMatrix();
    state.view.h = 2 * CAMERA_Z * Math.tan(THREE.MathUtils.degToRad(FOV / 2));
    state.view.w = state.view.h * camera.aspect;
    modules.forEach((m) => m.resize(state));
  }
  resize();

  // the name particles need the web fonts before sampling text
  Promise.all([
    document.fonts?.load('800 100px Inter'),
    document.fonts?.load('600 100px "JetBrains Mono"'),
  ])
    .catch(() => {})
    .then(() => {
      if (disposed) return;
      const morph = createMorph(scene, state);
      morph.resize(state);
      modules.push(morph);
      emit('ready');
    });

  let raf = 0;
  let last = performance.now();
  let lastScroll = window.scrollY;
  let jumpT = -1;
  let warpHigh = false;
  let lastSwoosh = 0;

  const offJump = on('hyperjump', () => {
    if (state.reduced) return;
    jumpT = 0;
    emit('sfx', 'whoosh');
  });

  function frame(now) {
    state.dt = Math.min(0.05, (now - last) / 1000);
    last = now;
    if (!state.reduced) state.time += state.dt;

    state.scrollY = window.scrollY;
    const vel = state.dt > 0 ? (state.scrollY - lastScroll) / state.dt : 0;
    lastScroll = state.scrollY;
    state.scrollVel += (vel - state.scrollVel) * 0.15;
    // hyperjump: a sin-shaped pulse that drives warp, FOV punch and galaxy flash
    state.jump = 0;
    if (jumpT >= 0) {
      jumpT += state.dt;
      const p = jumpT / JUMP_DURATION;
      if (p >= 1) jumpT = -1;
      else state.jump = Math.sin(Math.PI * p);
    }
    const fov = FOV + 35 * state.jump;
    if (Math.abs(camera.fov - fov) > 0.01) {
      camera.fov = fov;
      camera.updateProjectionMatrix();
    }

    const scrollWarp = state.reduced ? 0 : Math.min(1, Math.abs(state.scrollVel) / 2500);
    const warpTarget = Math.max(scrollWarp, state.jump);
    state.warp += (warpTarget - state.warp) * 0.08;

    if (scrollWarp > 0.6 && !warpHigh && now - lastSwoosh > 1500) {
      warpHigh = true;
      lastSwoosh = now;
      emit('sfx', 'swoosh');
    } else if (scrollWarp < 0.4) {
      warpHigh = false;
    }
    const maxScroll = document.documentElement.scrollHeight - state.height;
    state.pageProgress = maxScroll > 0 ? state.scrollY / maxScroll : 0;

    // camera eases toward the cursor for a subtle 3D parallax
    if (!state.reduced) {
      camera.position.x += (state.mouseNdc.x * 3 - camera.position.x) * 0.04;
      camera.position.y += (state.mouseNdc.y * 2 - camera.position.y) * 0.04;
      camera.lookAt(0, 0, 0);
    }

    for (const m of modules) m.update(state);
    renderer.render(scene, camera);
    raf = requestAnimationFrame(frame);
  }

  function start() {
    cancelAnimationFrame(raf);
    last = performance.now();
    raf = requestAnimationFrame(frame);
  }

  function onPointerMove(e) {
    if (e.pointerType !== 'mouse') return;
    state.mouseNdc.set((e.clientX / state.width) * 2 - 1, -(e.clientY / state.height) * 2 + 1);
    state.mouseWorld.set((state.mouseNdc.x * state.view.w) / 2, (state.mouseNdc.y * state.view.h) / 2);
    state.mouseActive = true;
  }
  function onPointerLeave() {
    state.mouseActive = false;
    state.mouseWorld.set(9999, 9999);
    state.mouseNdc.set(0, 0);
  }
  function onVisibility() {
    if (document.hidden) cancelAnimationFrame(raf);
    else start();
  }

  // phones have no cursor: tilting the device drives the camera parallax instead
  const coarse = window.matchMedia('(pointer: coarse)').matches;
  function onOrientation(e) {
    if (e.gamma == null || e.beta == null) return;
    state.mouseNdc.set(clamp(e.gamma / 30, -1, 1), -clamp((e.beta - 45) / 30, -1, 1));
  }
  function askOrientationPermission() {
    window.DeviceOrientationEvent.requestPermission().catch(() => {});
  }
  const needsPermission =
    coarse && typeof window.DeviceOrientationEvent?.requestPermission === 'function';
  if (coarse) window.addEventListener('deviceorientation', onOrientation);
  if (needsPermission) window.addEventListener('touchend', askOrientationPermission, { once: true });

  window.addEventListener('resize', resize);
  window.addEventListener('pointermove', onPointerMove);
  document.documentElement.addEventListener('pointerleave', onPointerLeave);
  document.addEventListener('visibilitychange', onVisibility);
  start();

  return () => {
    disposed = true;
    offJump();
    window.removeEventListener('deviceorientation', onOrientation);
    window.removeEventListener('touchend', askOrientationPermission);
    cancelAnimationFrame(raf);
    window.removeEventListener('resize', resize);
    window.removeEventListener('pointermove', onPointerMove);
    document.documentElement.removeEventListener('pointerleave', onPointerLeave);
    document.removeEventListener('visibilitychange', onVisibility);
    scene.traverse((obj) => {
      obj.geometry?.dispose();
      if (obj.material) {
        obj.material.map?.dispose();
        obj.material.dispose();
      }
    });
    renderer.dispose();
  };
}
