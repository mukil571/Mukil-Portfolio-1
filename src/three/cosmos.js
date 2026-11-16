import * as THREE from 'three';

const NEBULAE = [
  { x: -38, y: 12, z: -75, s: 95, c: '#00F0FF', o: 0.1 },
  { x: 42, y: -14, z: -85, s: 115, c: '#7C3AED', o: 0.13 },
  { x: 8, y: -60, z: -65, s: 105, c: '#38BDF8', o: 0.1 },
  { x: -42, y: -96, z: -80, s: 125, c: '#6D28D9', o: 0.13 },
  { x: 38, y: -132, z: -72, s: 105, c: '#00F0FF', o: 0.09 },
  { x: -12, y: -172, z: -88, s: 135, c: '#38BDF8', o: 0.1 },
  { x: 32, y: -212, z: -72, s: 115, c: '#7C3AED', o: 0.12 },
];

const meteorVertex = /* glsl */ `
  uniform float uPixelRatio;
  attribute float aSize;
  attribute float aAlpha;
  attribute vec3 aColor;
  varying vec3 vColor;
  varying float vAlpha;
  void main() {
    vec4 mv = modelViewMatrix * vec4(position, 1.0);
    gl_Position = projectionMatrix * mv;
    gl_PointSize = aSize * uPixelRatio * (50.0 / -mv.z);
    vColor = aColor;
    vAlpha = aAlpha;
  }
`;

const meteorFragment = /* glsl */ `
  varying vec3 vColor;
  varying float vAlpha;
  void main() {
    float d = length(gl_PointCoord - 0.5);
    float a = 1.0 - smoothstep(0.0, 0.5, d);
    a *= a;
    if (a * vAlpha < 0.01) discard;
    gl_FragColor = vec4(vColor, a * vAlpha);
  }
`;

function cloudTexture() {
  const size = 256;
  const c = document.createElement('canvas');
  c.width = size;
  c.height = size;
  const ctx = c.getContext('2d');
  const g = ctx.createRadialGradient(size / 2, size / 2, 0, size / 2, size / 2, size / 2);
  g.addColorStop(0, 'rgba(255,255,255,1)');
  g.addColorStop(0.25, 'rgba(255,255,255,0.55)');
  g.addColorStop(0.6, 'rgba(255,255,255,0.14)');
  g.addColorStop(1, 'rgba(255,255,255,0)');
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, size, size);
  const tex = new THREE.CanvasTexture(c);
  tex.colorSpace = THREE.SRGBColorSpace;
  return tex;
}

/** Drifting nebula clouds + pooled shooting stars. */
export function createCosmos(scene, state) {
  // --- nebula ---
  const nebula = new THREE.Group();
  scene.add(nebula);
  const tex = cloudTexture();
  const clouds = NEBULAE.map((n, i) => {
    const mat = new THREE.SpriteMaterial({
      map: tex,
      color: new THREE.Color(n.c),
      transparent: true,
      opacity: n.o,
      depthWrite: false,
      blending: THREE.AdditiveBlending,
    });
    const sprite = new THREE.Sprite(mat);
    sprite.position.set(n.x, n.y, n.z);
    sprite.scale.set(n.s * 1.3, n.s, 1);
    nebula.add(sprite);
    return { sprite, base: n.o, phase: i * 1.7, dir: i % 2 ? 1 : -1 };
  });

  // --- shooting stars ---
  const METEORS = 4;
  const TRAIL = 42;
  const total = METEORS * TRAIL;
  const pos = new Float32Array(total * 3);
  const alpha = new Float32Array(total);
  const size = new Float32Array(total);
  const color = new Float32Array(total * 3);
  const white = new THREE.Color('#ffffff');
  const cyan = new THREE.Color('#00F0FF');
  const tmp = new THREE.Color();
  for (let m = 0; m < METEORS; m++) {
    for (let k = 0; k < TRAIL; k++) {
      const i = m * TRAIL + k;
      const t = k / TRAIL;
      size[i] = (k === 0 ? 9 : 5) * (1 - t * 0.85);
      tmp.copy(white).lerp(cyan, Math.min(1, t * 2.5));
      color.set([tmp.r, tmp.g, tmp.b], i * 3);
    }
  }
  const geo = new THREE.BufferGeometry();
  const posAttr = new THREE.BufferAttribute(pos, 3).setUsage(THREE.DynamicDrawUsage);
  const alphaAttr = new THREE.BufferAttribute(alpha, 1).setUsage(THREE.DynamicDrawUsage);
  geo.setAttribute('position', posAttr);
  geo.setAttribute('aAlpha', alphaAttr);
  geo.setAttribute('aSize', new THREE.BufferAttribute(size, 1));
  geo.setAttribute('aColor', new THREE.BufferAttribute(color, 3));
  const meteorMat = new THREE.ShaderMaterial({
    uniforms: { uPixelRatio: { value: state.pixelRatio } },
    vertexShader: meteorVertex,
    fragmentShader: meteorFragment,
    transparent: true,
    depthWrite: false,
    blending: THREE.AdditiveBlending,
  });
  const meteorPoints = new THREE.Points(geo, meteorMat);
  meteorPoints.frustumCulled = false;
  scene.add(meteorPoints);

  const meteors = Array.from({ length: METEORS }, () => ({
    active: false,
    head: new THREE.Vector3(),
    dir: new THREE.Vector3(),
    speed: 0,
    age: 0,
    life: 1,
  }));
  let spawnIn = 1.5;

  function spawn(s) {
    const m = meteors.find((x) => !x.active);
    if (!m) return;
    const z = -10 - Math.random() * 25;
    const depth = 50 - z;
    const halfH = depth * Math.tan(THREE.MathUtils.degToRad(30));
    const halfW = halfH * (s.width / s.height);
    const fromLeft = Math.random() < 0.5;
    const sx = fromLeft ? -halfW + Math.random() * halfW : halfW - Math.random() * halfW;
    m.head.set(sx, halfH * (0.5 + Math.random() * 0.45), z);
    m.dir.set(fromLeft ? 1 : -1, -0.4 - Math.random() * 0.35, 0).normalize();
    m.speed = 70 + Math.random() * 50;
    m.age = 0;
    m.life = 1.1 + Math.random() * 0.6;
    m.active = true;
  }

  return {
    update(s) {
      const pp = s.pageProgress;
      nebula.position.y = pp * 215;
      clouds.forEach((c, i) => {
        c.sprite.material.rotation += s.dt * 0.015 * c.dir;
        c.sprite.material.opacity = c.base * (0.75 + 0.25 * Math.sin(s.time * 0.35 + c.phase));
        c.sprite.position.x = NEBULAE[i].x + Math.sin(s.time * 0.05 + c.phase) * 4;
      });

      if (!s.reduced) {
        spawnIn -= s.dt;
        if (spawnIn <= 0) {
          spawn(s);
          spawnIn = 2 + Math.random() * 4;
        }
      }

      for (let mi = 0; mi < METEORS; mi++) {
        const m = meteors[mi];
        if (m.active) {
          m.age += s.dt;
          m.head.addScaledVector(m.dir, m.speed * s.dt);
          if (m.age >= m.life) m.active = false;
        }
        const fade = m.active ? Math.sin(Math.PI * Math.min(1, m.age / m.life)) : 0;
        for (let k = 0; k < TRAIL; k++) {
          const i = mi * TRAIL + k;
          const back = k * 0.55;
          pos[i * 3] = m.head.x - m.dir.x * back;
          pos[i * 3 + 1] = m.head.y - m.dir.y * back;
          pos[i * 3 + 2] = m.head.z;
          const t = 1 - k / TRAIL;
          alpha[i] = fade * t * t;
        }
      }
      posAttr.needsUpdate = true;
      alphaAttr.needsUpdate = true;
    },
    resize(s) {
      meteorMat.uniforms.uPixelRatio.value = s.pixelRatio;
    },
  };
}
