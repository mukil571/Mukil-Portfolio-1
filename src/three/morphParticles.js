import * as THREE from 'three';
import { glowFragment } from './shaders.js';
import { flags } from '../lib/bus.js';
import { profile } from '../data/content.js';

const SECTION_IDS = ['intro', 'skills', 'projects', 'education', 'contact'];
// shape index 0 = intro scatter cloud, then one shape per section (index = section + 1)

const morphVertex = /* glsl */ `
  uniform float uTime;
  uniform float uProgress;
  uniform float uPixelRatio;
  uniform float uSizeFactor;
  uniform float uSwirl;
  uniform float uNoise;
  uniform vec4 uFromLayout; // x, y, scale, alpha
  uniform vec4 uToLayout;
  uniform vec2 uMouse;
  uniform float uMouseRadius;
  attribute vec3 aFrom;
  attribute vec3 aTo;
  attribute vec4 aRandom;
  attribute vec3 aColor;
  attribute float aSize;
  varying vec3 vColor;
  varying float vAlpha;

  float easeInOut(float t) {
    return t < 0.5 ? 4.0 * t * t * t : 1.0 - pow(-2.0 * t + 2.0, 3.0) / 2.0;
  }

  void main() {
    float delay = aRandom.x * 0.35;
    float p = clamp((uProgress - delay) / 0.65, 0.0, 1.0);
    float e = easeInOut(p);
    float mid = sin(3.14159265 * p);

    vec3 from = aFrom * uFromLayout.z + vec3(uFromLayout.xy, 0.0);
    vec3 to = aTo * uToLayout.z + vec3(uToLayout.xy, 0.0);
    vec3 pos = mix(from, to, e);

    // spiral swirl around the moving centre mid-transition
    vec2 center = mix(uFromLayout.xy, uToLayout.xy, e);
    vec2 rel = pos.xy - center;
    float ang = mid * uSwirl * (aRandom.y - 0.3) * 3.0;
    float s = sin(ang);
    float c = cos(ang);
    pos.xy = center + mat2(c, s, -s, c) * rel;

    // organic drift: big while morphing, a gentle shimmer at rest
    vec3 wobble = vec3(
      sin(aRandom.z * 6.2831 + uTime * 0.8),
      cos(aRandom.w * 6.2831 + uTime * 0.7),
      sin(aRandom.y * 6.2831 + uTime * 0.6)
    );
    pos += wobble * (mid * uNoise + 0.12);

    // cursor repulsion
    vec2 d = pos.xy - uMouse;
    float dist = length(d);
    float force = 1.0 - smoothstep(0.0, uMouseRadius, dist);
    pos.xy += normalize(d + 0.0001) * force * uMouseRadius * 0.7;
    pos.z += force * 5.0;

    vec4 mv = modelViewMatrix * vec4(pos, 1.0);
    gl_Position = projectionMatrix * mv;
    gl_PointSize = aSize * uPixelRatio * uSizeFactor * (50.0 / -mv.z) * (1.0 + force * 0.9);

    vColor = mix(aColor, vec3(1.0), force * 0.6);
    float twinkle = 0.78 + 0.22 * sin(uTime * 2.2 + aRandom.x * 40.0);
    vAlpha = mix(uFromLayout.w, uToLayout.w, e) * (0.55 + 0.45 * aRandom.w) * twinkle;
  }
`;

function shuffle(a) {
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

/**
 * Rasterise one or more layers on an offscreen canvas and sample filled pixels.
 * Each layer gets `share` of the particles so thin text (the subtitle) stays legible.
 * Result is normalised around the bbox centre, by width ('width') or the larger side.
 */
function buildShape({ w, h, step, layers, normalize = 'max', zJitter = 0.02 }, count) {
  const canvas = document.createElement('canvas');
  canvas.width = w;
  canvas.height = h;
  const ctx = canvas.getContext('2d', { willReadFrequently: true });

  let minX = Infinity;
  let minY = Infinity;
  let maxX = -Infinity;
  let maxY = -Infinity;
  const sampled = layers.map((layer) => {
    ctx.clearRect(0, 0, w, h);
    ctx.save();
    ctx.fillStyle = '#fff';
    ctx.strokeStyle = '#fff';
    layer.draw(ctx, w, h);
    ctx.restore();
    const data = ctx.getImageData(0, 0, w, h).data;
    const pts = [];
    for (let y = 0; y < h; y += step) {
      for (let x = 0; x < w; x += step) {
        if (data[(y * w + x) * 4 + 3] > 128) {
          pts.push([x, y]);
          if (x < minX) minX = x;
          if (x > maxX) maxX = x;
          if (y < minY) minY = y;
          if (y > maxY) maxY = y;
        }
      }
    }
    return shuffle(pts);
  });

  const cx = (minX + maxX) / 2;
  const cy = (minY + maxY) / 2;
  const norm = normalize === 'width' ? maxX - minX : Math.max(maxX - minX, maxY - minY);
  const arr = new Float32Array(count * 3);
  let i = 0;
  layers.forEach((layer, li) => {
    const pts = sampled[li];
    const n = li === layers.length - 1 ? count - i : Math.round(count * layer.share);
    for (let k = 0; k < n && pts.length; k++, i++) {
      const [px, py] = pts[k % pts.length];
      const dup = k >= pts.length ? 1 : 0;
      arr[i * 3] = (px - cx) / norm + dup * (Math.random() - 0.5) * 0.004;
      arr[i * 3 + 1] = -(py - cy) / norm + dup * (Math.random() - 0.5) * 0.004;
      arr[i * 3 + 2] = (Math.random() - 0.5) * zJitter;
    }
  });
  // normalised extents let each shape be fitted into its on-page anchor box
  return { arr, w: (maxX - minX) / norm, h: (maxY - minY) / norm };
}

function spacedText(ctx, text, cx, y, spacing) {
  let total = 0;
  for (const ch of text) total += ctx.measureText(ch).width + spacing;
  total -= spacing;
  let x = cx - total / 2;
  ctx.textAlign = 'left';
  for (const ch of text) {
    ctx.fillText(ch, x, y);
    x += ctx.measureText(ch).width + spacing;
  }
  return total;
}

function fitFont(ctx, weightFamily, text, targetWidth, spacingEm = 0) {
  ctx.font = `${weightFamily.replace('{s}', 100)}`;
  let w = 0;
  for (const ch of text) w += ctx.measureText(ch).width;
  w += spacingEm * 100 * (text.length - 1);
  return (100 * targetWidth) / w;
}

const NAME_FONT = '800 {s}px Inter, sans-serif';
const MONO_FONT = '600 {s}px "JetBrains Mono", monospace';

function nameShape(count) {
  const W = 1600;
  const H = 700;
  const nameW = W * 0.9;
  const name = (profile.name || ' ').toUpperCase();
  const role = (profile.role || '').toUpperCase().trim();
  let nameSize = 0;
  const nameLayer = {
    share: role ? 0.76 : 1,
    draw(ctx) {
      // cap the size so short names don't overflow the canvas height
      nameSize = Math.min(380, fitFont(ctx, NAME_FONT, name, nameW));
      ctx.font = NAME_FONT.replace('{s}', nameSize);
      ctx.textAlign = 'center';
      ctx.fillText(name, W / 2, 330);
    },
  };
  const roleLayer = {
    share: 0.24,
    draw(ctx) {
      const size = Math.min(64, fitFont(ctx, MONO_FONT, role, nameW * 0.86, 0.5));
      ctx.font = MONO_FONT.replace('{s}', size);
      spacedText(ctx, role, W / 2, 330 + nameSize * 0.3 + size, size * 0.5);
    },
  };
  return buildShape(
    {
      w: W,
      h: H,
      step: 3,
      normalize: 'width',
      zJitter: 0.015,
      layers: role ? [nameLayer, roleLayer] : [nameLayer],
    },
    count
  );
}

function strokeShape(w, h, lineWidth, draw, count) {
  return buildShape(
    {
      w,
      h,
      step: 2,
      zJitter: 0.05,
      layers: [
        {
          share: 1,
          draw(ctx) {
            ctx.lineWidth = lineWidth;
            ctx.lineCap = 'round';
            ctx.lineJoin = 'round';
            draw(ctx);
          },
        },
      ],
    },
    count
  );
}

function codeShape(count) {
  return strokeShape(
    1000,
    600,
    48,
    (ctx) => {
      ctx.beginPath();
      ctx.moveTo(330, 130);
      ctx.lineTo(140, 300);
      ctx.lineTo(330, 470);
      ctx.moveTo(575, 100);
      ctx.lineTo(425, 500);
      ctx.moveTo(670, 130);
      ctx.lineTo(860, 300);
      ctx.lineTo(670, 470);
      ctx.stroke();
    },
    count
  );
}

function mailShape(count) {
  return strokeShape(
    800,
    600,
    38,
    (ctx) => {
      ctx.beginPath();
      ctx.roundRect(90, 120, 620, 360, 36);
      ctx.moveTo(110, 140);
      ctx.lineTo(400, 340);
      ctx.lineTo(690, 140);
      ctx.stroke();
    },
    count
  );
}

function rocketShape(count) {
  return buildShape(
    {
      w: 600,
      h: 600,
      step: 2,
      zJitter: 0.06,
      layers: [
        {
          share: 1,
          draw(ctx) {
            ctx.translate(300, 300);
            ctx.rotate(Math.PI / 4);
            ctx.scale(0.95, 0.95);
            // body
            ctx.beginPath();
            ctx.moveTo(0, -240);
            ctx.quadraticCurveTo(100, -120, 80, 60);
            ctx.lineTo(80, 130);
            ctx.lineTo(-80, 130);
            ctx.lineTo(-80, 60);
            ctx.quadraticCurveTo(-100, -120, 0, -240);
            ctx.fill();
            // fins
            ctx.beginPath();
            ctx.moveTo(-80, 30);
            ctx.lineTo(-155, 130);
            ctx.lineTo(-155, 190);
            ctx.lineTo(-80, 130);
            ctx.closePath();
            ctx.fill();
            ctx.beginPath();
            ctx.moveTo(80, 30);
            ctx.lineTo(155, 130);
            ctx.lineTo(155, 190);
            ctx.lineTo(80, 130);
            ctx.closePath();
            ctx.fill();
            // porthole: ring + dot
            ctx.globalCompositeOperation = 'destination-out';
            ctx.beginPath();
            ctx.arc(0, -50, 40, 0, Math.PI * 2);
            ctx.fill();
            ctx.globalCompositeOperation = 'source-over';
            ctx.beginPath();
            ctx.arc(0, -50, 20, 0, Math.PI * 2);
            ctx.fill();
            // flame
            ctx.beginPath();
            ctx.moveTo(-50, 152);
            ctx.quadraticCurveTo(-30, 230, 0, 320);
            ctx.quadraticCurveTo(30, 230, 50, 152);
            ctx.closePath();
            ctx.fill();
          },
        },
      ],
    },
    count
  );
}

function capShape(count) {
  return buildShape(
    {
      w: 600,
      h: 600,
      step: 2,
      zJitter: 0.06,
      layers: [
        {
          share: 1,
          draw(ctx) {
            const board = () => {
              ctx.beginPath();
              ctx.moveTo(300, 120);
              ctx.lineTo(560, 230);
              ctx.lineTo(300, 340);
              ctx.lineTo(40, 230);
              ctx.closePath();
            };
            // skull cap
            ctx.beginPath();
            ctx.moveTo(150, 280);
            ctx.lineTo(150, 400);
            ctx.quadraticCurveTo(300, 480, 450, 400);
            ctx.lineTo(450, 280);
            ctx.closePath();
            ctx.fill();
            // carve a gap so the board reads as a separate plane
            ctx.globalCompositeOperation = 'destination-out';
            ctx.lineWidth = 28;
            board();
            ctx.fill();
            ctx.stroke();
            ctx.globalCompositeOperation = 'source-over';
            board();
            ctx.fill();
            // tassel
            ctx.lineWidth = 10;
            ctx.beginPath();
            ctx.moveTo(505, 250);
            ctx.lineTo(505, 400);
            ctx.stroke();
            ctx.fillRect(490, 395, 30, 70);
          },
        },
      ],
    },
    count
  );
}

function scatterShape(count) {
  const arr = new Float32Array(count * 3);
  for (let i = 0; i < count; i++) {
    const r = 0.15 + Math.cbrt(Math.random()) * 0.6;
    const th = Math.random() * Math.PI * 2;
    const ph = Math.acos(2 * Math.random() - 1);
    arr[i * 3] = r * Math.sin(ph) * Math.cos(th);
    arr[i * 3 + 1] = r * Math.cos(ph) * 0.7;
    arr[i * 3 + 2] = r * Math.sin(ph) * Math.sin(th) * 0.8;
  }
  return { arr, w: 1.5, h: 1 };
}

function computeLayouts(s) {
  const { w: W, h: H } = s.view;
  const wide = s.width >= 1024;
  const section = wide
    ? [0.26 * W, -0.04 * H, 0.62 * H, 0.75]
    : [0, -0.06 * H, Math.min(0.72 * W, 0.4 * H), 0.4];
  return [
    [0, 0, Math.max(W, H) * 0.9, 0.55], // scatter
    [0, 0.19 * H, Math.min(0.82 * W, 0.8 * H), 1], // name
    section,
    section,
    section,
    section,
  ];
}

/** Particles that form the name, then morph into a themed shape per section. */
export function createMorph(scene, state) {
  const count = state.mobile ? 3500 : 9000;
  const shapes = [
    scatterShape(count),
    nameShape(count),
    codeShape(count),
    rocketShape(count),
    capShape(count),
    mailShape(count),
  ];

  const random = new Float32Array(count * 4);
  const color = new Float32Array(count * 3);
  const size = new Float32Array(count);
  const palette = [
    [0, 0.94, 1, 0.6],
    [1, 1, 1, 0.15],
    [0.22, 0.74, 0.97, 0.17],
    [0.55, 0.36, 0.96, 0.08],
  ];
  for (let i = 0; i < count; i++) {
    random.set([Math.random(), Math.random(), Math.random(), Math.random()], i * 4);
    let r = Math.random();
    const c = palette.find((p) => (r -= p[3]) <= 0) || palette[0];
    color.set([c[0], c[1], c[2]], i * 3);
    size[i] = Math.random() < 0.05 ? 5.5 : 2.6 + Math.random() * 2;
  }

  const geo = new THREE.BufferGeometry();
  geo.setAttribute('position', new THREE.BufferAttribute(new Float32Array(count * 3), 3));
  const fromAttr = new THREE.BufferAttribute(new Float32Array(shapes[0].arr), 3).setUsage(
    THREE.DynamicDrawUsage
  );
  const toAttr = new THREE.BufferAttribute(new Float32Array(shapes[1].arr), 3).setUsage(
    THREE.DynamicDrawUsage
  );
  geo.setAttribute('aFrom', fromAttr);
  geo.setAttribute('aTo', toAttr);
  geo.setAttribute('aRandom', new THREE.BufferAttribute(random, 4));
  geo.setAttribute('aColor', new THREE.BufferAttribute(color, 3));
  geo.setAttribute('aSize', new THREE.BufferAttribute(size, 1));

  const mat = new THREE.ShaderMaterial({
    uniforms: {
      uTime: { value: 0 },
      uProgress: { value: 0 },
      uPixelRatio: { value: state.pixelRatio },
      uSizeFactor: { value: state.sizeFactor },
      uSwirl: { value: 2.2 },
      uNoise: { value: 10 },
      uFromLayout: { value: new THREE.Vector4() },
      uToLayout: { value: new THREE.Vector4() },
      uMouse: { value: new THREE.Vector2(9999, 9999) },
      uMouseRadius: { value: 5 },
      uOpacity: { value: 1 },
    },
    vertexShader: morphVertex,
    fragmentShader: glowFragment,
    transparent: true,
    depthWrite: false,
    blending: THREE.AdditiveBlending,
  });

  const points = new THREE.Points(geo, mat);
  points.frustumCulled = false;
  scene.add(points);

  const sections = SECTION_IDS.map((id) => document.getElementById(id));
  const anchors = SECTION_IDS.map((id) => document.querySelector(`[data-shape-anchor="${id}"]`));
  let layouts = computeLayouts(state);
  let pair = [0, 1];
  let introT = state.reduced ? 1 : 0;
  const mouse = new THREE.Vector2(9999, 9999);

  function setPair(from, to) {
    if (pair[0] === from && pair[1] === to) return;
    pair = [from, to];
    fromAttr.array.set(shapes[from].arr);
    toAttr.array.set(shapes[to].arr);
    fromAttr.needsUpdate = true;
    toAttr.needsUpdate = true;
  }

  /** Fit shape `index` into its section's on-page anchor box (in world units at z=0). */
  function layoutFor(index, s) {
    if (index === 0) return layouts[0];
    const el = anchors[index - 1];
    const r = el?.getBoundingClientRect();
    if (!r || r.width < 2 || r.height < 2) return layouts[index];
    const { w: W, h: H } = s.view;
    const shape = shapes[index];
    const boxW = (r.width / s.width) * W;
    const boxH = (r.height / s.height) * H;
    return [
      ((r.left + r.width / 2) / s.width - 0.5) * W,
      -((r.top + r.height / 2) / s.height - 0.5) * H,
      Math.min(boxW / shape.w, boxH / shape.h),
      index === 1 ? 1 : 0.9,
    ];
  }

  return {
    update(s) {
      if (introT < 1 && flags.started) introT = Math.min(1, introT + s.dt / 2.6);

      // which section transition are we in, and how far through it?
      const vh = s.height;
      let k = 0;
      let progress = 0;
      for (let i = 1; i < sections.length; i++) {
        const el = sections[i];
        if (!el) continue;
        // morph runs while the section's top edge travels from 70% to 30% of the viewport
        const start = el.getBoundingClientRect().top + s.scrollY - 0.7 * vh;
        if (s.scrollY >= start) {
          k = i;
          progress = Math.min(1, (s.scrollY - start) / (0.4 * vh));
        }
      }
      if (k === 0) {
        if (introT < 1) {
          setPair(0, 1);
          progress = introT;
        } else {
          setPair(1, 2);
          progress = 0;
        }
      } else {
        setPair(k, k + 1);
      }

      const u = mat.uniforms;
      u.uTime.value = s.time;
      u.uProgress.value = progress;
      u.uSwirl.value = s.reduced ? 0 : pair[0] === 0 ? 2.2 : 1.1;
      u.uNoise.value = s.reduced ? 0 : pair[0] === 0 ? 10 : 5;
      u.uFromLayout.value.fromArray(layoutFor(pair[0], s));
      u.uToLayout.value.fromArray(layoutFor(pair[1], s));

      mouse.lerp(s.mouseWorld, s.mouseActive ? 0.2 : 1);
      u.uMouse.value.copy(mouse);
    },
    resize(s) {
      layouts = computeLayouts(s);
      mat.uniforms.uPixelRatio.value = s.pixelRatio;
      mat.uniforms.uSizeFactor.value = s.sizeFactor;
      mat.uniforms.uMouseRadius.value = s.view.w * 0.045;
    },
  };
}
