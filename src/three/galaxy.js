import * as THREE from 'three';
import { glowFragment } from './shaders.js';

const starVertex = /* glsl */ `
  uniform float uTime;
  uniform float uPixelRatio;
  uniform float uSizeFactor;
  uniform float uSpin;
  uniform float uDepthRef;
  attribute float aSize;
  attribute vec3 aColor;
  attribute float aPhase;
  varying vec3 vColor;
  varying float vAlpha;
  void main() {
    vec3 p = position;
    // differential rotation: inner stars orbit faster
    float r = length(p.xz);
    float ang = uTime * uSpin * (0.6 / (0.15 * r + 1.0));
    float s = sin(ang);
    float c = cos(ang);
    p.xz = mat2(c, -s, s, c) * p.xz;
    vec4 mv = modelViewMatrix * vec4(p, 1.0);
    gl_Position = projectionMatrix * mv;
    gl_PointSize = aSize * uPixelRatio * uSizeFactor * (uDepthRef / -mv.z);
    vColor = aColor;
    vAlpha = 0.6 + 0.4 * sin(uTime * 1.4 + aPhase);
  }
`;

const warpVertex = /* glsl */ `
  uniform float uTravel;
  uniform float uStretch;
  uniform float uDepth;
  uniform float uNear;
  uniform float uWarp;
  attribute float aEnd;
  varying float vAlpha;
  void main() {
    vec3 p = position;
    float z = mod(p.z + uTravel, uDepth);
    p.z = uNear - uDepth + z;
    p.z -= aEnd * uStretch;
    vec4 mv = modelViewMatrix * vec4(p, 1.0);
    gl_Position = projectionMatrix * mv;
    float fadeIn = smoothstep(0.0, 0.3, z / uDepth);
    vAlpha = fadeIn * (1.0 - aEnd) * (0.16 + uWarp * 0.84);
  }
`;

const warpFragment = /* glsl */ `
  varying float vAlpha;
  void main() {
    gl_FragColor = vec4(0.72, 0.96, 1.0, vAlpha);
  }
`;

const COLOR_STOPS = [
  [0, new THREE.Color('#ffffff')],
  [0.16, new THREE.Color('#00F0FF')],
  [0.55, new THREE.Color('#38BDF8')],
  [1, new THREE.Color('#7C3AED')],
];

function ramp(t, out) {
  for (let i = 1; i < COLOR_STOPS.length; i++) {
    if (t <= COLOR_STOPS[i][0]) {
      const [t0, c0] = COLOR_STOPS[i - 1];
      const [t1, c1] = COLOR_STOPS[i];
      return out.copy(c0).lerp(c1, (t - t0) / (t1 - t0));
    }
  }
  return out.copy(COLOR_STOPS[COLOR_STOPS.length - 1][1]);
}

function starMaterial(state, { spin, depthRef, opacity }) {
  return new THREE.ShaderMaterial({
    uniforms: {
      uTime: { value: 0 },
      uPixelRatio: { value: state.pixelRatio },
      uSizeFactor: { value: state.sizeFactor },
      uSpin: { value: spin },
      uDepthRef: { value: depthRef },
      uOpacity: { value: opacity },
    },
    vertexShader: starVertex,
    fragmentShader: glowFragment,
    transparent: true,
    depthWrite: false,
    blending: THREE.AdditiveBlending,
  });
}

function buildGalaxy(count) {
  const radius = 44;
  const branches = 4;
  const spin = 0.28;
  const pos = new Float32Array(count * 3);
  const col = new Float32Array(count * 3);
  const size = new Float32Array(count);
  const phase = new Float32Array(count);
  const c = new THREE.Color();

  for (let i = 0; i < count; i++) {
    let x;
    let y;
    let z;
    let core = false;
    if (Math.random() < 0.1) {
      // central bulge
      core = true;
      const r = Math.pow(Math.random(), 2) * 6;
      const th = Math.random() * Math.PI * 2;
      const ph = Math.acos(2 * Math.random() - 1);
      x = r * Math.sin(ph) * Math.cos(th);
      y = r * Math.cos(ph) * 0.5;
      z = r * Math.sin(ph) * Math.sin(th);
    } else {
      const r = Math.pow(Math.random(), 1.3) * radius + 1.5;
      const a = ((i % branches) / branches) * Math.PI * 2 + r * spin;
      const scatter = () =>
        Math.pow(Math.random(), 2.6) * (Math.random() < 0.5 ? 1 : -1) * (0.35 * r + 1.2);
      x = Math.cos(a) * r + scatter();
      y = scatter() * 0.25;
      z = Math.sin(a) * r + scatter();
    }
    pos[i * 3] = x;
    pos[i * 3 + 1] = y;
    pos[i * 3 + 2] = z;

    ramp(Math.min(1, Math.hypot(x, z) / radius), c);
    const b = (core ? 0.22 : 0.55) + Math.random() * 0.45;
    col[i * 3] = c.r * b;
    col[i * 3 + 1] = c.g * b;
    col[i * 3 + 2] = c.b * b;

    size[i] = Math.random() < 0.035 ? 5 : 1.2 + Math.random() * 2;
    phase[i] = Math.random() * Math.PI * 2;
  }

  const geo = new THREE.BufferGeometry();
  geo.setAttribute('position', new THREE.BufferAttribute(pos, 3));
  geo.setAttribute('aColor', new THREE.BufferAttribute(col, 3));
  geo.setAttribute('aSize', new THREE.BufferAttribute(size, 1));
  geo.setAttribute('aPhase', new THREE.BufferAttribute(phase, 1));
  return geo;
}

function buildShell(count) {
  const pos = new Float32Array(count * 3);
  const col = new Float32Array(count * 3);
  const size = new Float32Array(count);
  const phase = new Float32Array(count);
  for (let i = 0; i < count; i++) {
    const r = 160 + Math.random() * 160;
    const th = Math.random() * Math.PI * 2;
    const ph = Math.acos(2 * Math.random() - 1);
    pos[i * 3] = r * Math.sin(ph) * Math.cos(th);
    pos[i * 3 + 1] = r * Math.cos(ph);
    pos[i * 3 + 2] = r * Math.sin(ph) * Math.sin(th);
    const cyan = Math.random() < 0.25;
    col[i * 3] = cyan ? 0.4 : 1;
    col[i * 3 + 1] = cyan ? 0.95 : 1;
    col[i * 3 + 2] = 1;
    size[i] = 1.2 + Math.random() * 1.6;
    phase[i] = Math.random() * Math.PI * 2;
  }
  const geo = new THREE.BufferGeometry();
  geo.setAttribute('position', new THREE.BufferAttribute(pos, 3));
  geo.setAttribute('aColor', new THREE.BufferAttribute(col, 3));
  geo.setAttribute('aSize', new THREE.BufferAttribute(size, 1));
  geo.setAttribute('aPhase', new THREE.BufferAttribute(phase, 1));
  return geo;
}

function buildWarp(count, depth) {
  const pos = new Float32Array(count * 6);
  const end = new Float32Array(count * 2);
  for (let i = 0; i < count; i++) {
    const r = 6 + Math.pow(Math.random(), 0.7) * 55;
    const a = Math.random() * Math.PI * 2;
    const x = Math.cos(a) * r;
    const y = Math.sin(a) * r;
    const z = Math.random() * depth;
    pos.set([x, y, z, x, y, z], i * 6);
    end[i * 2] = 0;
    end[i * 2 + 1] = 1;
  }
  const geo = new THREE.BufferGeometry();
  geo.setAttribute('position', new THREE.BufferAttribute(pos, 3));
  geo.setAttribute('aEnd', new THREE.BufferAttribute(end, 1));
  return geo;
}

/** Spiral galaxy + deep star shell + hyperspace warp streaks. */
export function createGalaxy(scene, state) {
  const group = new THREE.Group();
  group.rotation.set(1.1, 0, 0.3);
  scene.add(group);

  const galaxyMat = starMaterial(state, { spin: 0.08, depthRef: 240, opacity: 0.85 });
  const galaxy = new THREE.Points(buildGalaxy(state.mobile ? 9000 : 28000), galaxyMat);
  group.add(galaxy);

  const shellMat = starMaterial(state, { spin: 0, depthRef: 240, opacity: 0.9 });
  const shell = new THREE.Points(buildShell(state.mobile ? 900 : 2400), shellMat);
  scene.add(shell);

  const WARP_DEPTH = 200;
  const warpMat = new THREE.ShaderMaterial({
    uniforms: {
      uTravel: { value: 0 },
      uStretch: { value: 0.3 },
      uDepth: { value: WARP_DEPTH },
      uNear: { value: 44 },
      uWarp: { value: 0 },
    },
    vertexShader: warpVertex,
    fragmentShader: warpFragment,
    transparent: true,
    depthWrite: false,
    blending: THREE.AdditiveBlending,
  });
  const warp = new THREE.LineSegments(buildWarp(state.mobile ? 350 : 900, WARP_DEPTH), warpMat);
  warp.frustumCulled = false;
  scene.add(warp);

  let travel = 0;

  return {
    update(s) {
      const pp = s.pageProgress;
      galaxyMat.uniforms.uTime.value = s.time;
      shellMat.uniforms.uTime.value = s.time;

      // the galaxy drifts and turns as you journey down the page
      group.position.set(6 - pp * 18, -6 + pp * 12, -70 + pp * 28);
      // spin in-plane and ease toward face-on; never turns edge-on
      group.rotation.x = 1.1 - pp * 0.4;
      group.rotation.y = pp * 2.2;
      galaxyMat.uniforms.uOpacity.value = (0.85 - pp * 0.25) * (1 + s.jump * 1.2);

      shell.rotation.y = s.time * 0.006 + pp * 0.5;
      shell.rotation.x = pp * 0.3;

      if (!s.reduced) {
        const vel = Math.max(-4000, Math.min(4000, s.scrollVel));
        travel += s.dt * (3 + vel * 0.012 + s.jump * 140);
      }
      warpMat.uniforms.uTravel.value = travel;
      warpMat.uniforms.uWarp.value = s.warp;
      warpMat.uniforms.uStretch.value = 0.3 + s.warp * 18;
    },
    resize(s) {
      for (const m of [galaxyMat, shellMat]) {
        m.uniforms.uPixelRatio.value = s.pixelRatio;
        m.uniforms.uSizeFactor.value = s.sizeFactor;
      }
    },
  };
}
