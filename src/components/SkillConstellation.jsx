import { useEffect, useRef } from 'react';
import { skillGroups as GROUPS } from '../data/content.js';

export { GROUPS };

const GOLDEN = Math.PI * (3 - Math.sqrt(5));
const CAMERA = 3.2;

function buildNodes() {
  // round-robin across categories so each colour is spread around the sphere
  const flat = [];
  const longest = Math.max(0, ...GROUPS.map((g) => g.skills.length));
  for (let i = 0; i < longest; i++) {
    GROUPS.forEach((g, gi) => {
      if (g.skills[i]) flat.push({ name: g.skills[i], group: gi });
    });
  }
  const n = flat.length;
  return flat.map((node, i) => {
    const y = 1 - ((i + 0.5) / n) * 2;
    const r = Math.sqrt(1 - y * y);
    const a = i * GOLDEN;
    return { ...node, x: Math.cos(a) * r, y, z: Math.sin(a) * r };
  });
}

function buildLinks(nodes) {
  const seen = new Set();
  const links = [];
  const add = (a, b) => {
    const key = a < b ? `${a}-${b}` : `${b}-${a}`;
    if (a === b || seen.has(key)) return;
    seen.add(key);
    links.push({ a, b, phase: Math.random(), packet: Math.random() < 0.55 });
  };
  nodes.forEach((n, i) => {
    nodes.forEach((m, j) => {
      if (n.group === m.group) add(i, j);
    });
    const nearest = nodes
      .map((m, j) => ({ j, d: (n.x - m.x) ** 2 + (n.y - m.y) ** 2 + (n.z - m.z) ** 2 }))
      .filter(({ j }) => j !== i)
      .sort((p, q) => p.d - q.d)
      .slice(0, 2);
    nearest.forEach(({ j }) => add(i, j));
  });
  return links;
}

function buildDust(count) {
  return Array.from({ length: count }, () => {
    const y = Math.random() * 2 - 1;
    const r = Math.sqrt(1 - y * y);
    const a = Math.random() * Math.PI * 2;
    const k = 0.75 + Math.random() * 0.5;
    return { x: Math.cos(a) * r * k, y: y * k, z: Math.sin(a) * r * k, s: 0.6 + Math.random() * 1.1 };
  });
}

/** Rotating 3D sphere of skills drawn on a 2D canvas: drag to spin, hover to highlight. */
export default function SkillConstellation() {
  const canvasRef = useRef(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const nodes = buildNodes();
    const links = buildLinks(nodes);
    const dust = buildDust(70);

    let width = 0;
    let height = 0;
    let rotY = 0.4;
    let rotX = -0.25;
    let velY = 0;
    let velX = 0;
    let dragging = false;
    let lastX = 0;
    let lastY = 0;
    let hovered = -1;
    let pointer = null;
    let raf = 0;
    let visible = false;
    let last = performance.now();
    let time = 0;
    const projected = nodes.map(() => ({ x: 0, y: 0, z: 0, s: 1 }));

    function resize() {
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      const rect = canvas.getBoundingClientRect();
      width = rect.width;
      height = rect.height;
      canvas.width = Math.floor(width * dpr);
      canvas.height = Math.floor(height * dpr);
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    }

    function project(p, out, R, cx, cy) {
      const cosY = Math.cos(rotY);
      const sinY = Math.sin(rotY);
      const cosX = Math.cos(rotX);
      const sinX = Math.sin(rotX);
      const x1 = p.x * cosY - p.z * sinY;
      const z1 = p.x * sinY + p.z * cosY;
      const y2 = p.y * cosX - z1 * sinX;
      const z2 = p.y * sinX + z1 * cosX;
      const s = CAMERA / (CAMERA - z2);
      out.x = cx + x1 * R * s;
      out.y = cy - y2 * R * s;
      out.z = z2;
      out.s = s;
      return out;
    }

    const tmp = { x: 0, y: 0, z: 0, s: 1 };

    function draw() {
      ctx.clearRect(0, 0, width, height);
      const R = Math.min(width, height) * (width < 500 ? 0.36 : 0.38);
      const cx = width / 2;
      const cy = height / 2;
      nodes.forEach((n, i) => project(n, projected[i], R, cx, cy));

      // decorative dust
      for (const d of dust) {
        project(d, tmp, R, cx, cy);
        const depth = (tmp.z + 1.3) / 2.6;
        ctx.fillStyle = `rgba(255,255,255,${0.08 + depth * 0.35})`;
        ctx.beginPath();
        ctx.arc(tmp.x, tmp.y, d.s * tmp.s, 0, Math.PI * 2);
        ctx.fill();
      }

      // links + travelling data packets
      ctx.lineWidth = 1;
      for (const l of links) {
        const a = projected[l.a];
        const b = projected[l.b];
        const depth = (a.z + b.z + 2) / 4;
        const lit = hovered === l.a || hovered === l.b;
        const [r, g, bl] = GROUPS[nodes[l.a].group].rgb;
        ctx.strokeStyle = `rgba(${r},${g},${bl},${(lit ? 0.75 : 0.1 + depth * 0.25)})`;
        ctx.beginPath();
        ctx.moveTo(a.x, a.y);
        ctx.lineTo(b.x, b.y);
        ctx.stroke();
        if (l.packet) {
          const f = (time * 0.25 + l.phase) % 1;
          ctx.fillStyle = `rgba(255,255,255,${0.3 + depth * 0.6})`;
          ctx.beginPath();
          ctx.arc(a.x + (b.x - a.x) * f, a.y + (b.y - a.y) * f, 1.4, 0, Math.PI * 2);
          ctx.fill();
        }
      }

      // skill stars, far to near
      const order = nodes.map((_, i) => i).sort((i, j) => projected[i].z - projected[j].z);
      const fontBase = width < 500 ? 11 : 13;
      for (const i of order) {
        const p = projected[i];
        const n = nodes[i];
        const [r, g, b] = GROUPS[n.group].rgb;
        const depth = (p.z + 1) / 2;
        const isHover = i === hovered;
        const glowR = (isHover ? 30 : 18) * p.s;

        const grad = ctx.createRadialGradient(p.x, p.y, 0, p.x, p.y, glowR);
        grad.addColorStop(0, `rgba(${r},${g},${b},${0.55 + depth * 0.4})`);
        grad.addColorStop(1, `rgba(${r},${g},${b},0)`);
        ctx.fillStyle = grad;
        ctx.beginPath();
        ctx.arc(p.x, p.y, glowR, 0, Math.PI * 2);
        ctx.fill();

        ctx.fillStyle = `rgba(255,255,255,${0.6 + depth * 0.4})`;
        ctx.beginPath();
        ctx.arc(p.x, p.y, (isHover ? 4.5 : 3) * p.s, 0, Math.PI * 2);
        ctx.fill();

        ctx.font = `${isHover ? 700 : 600} ${Math.round(fontBase * p.s * (isHover ? 1.15 : 1))}px Inter, sans-serif`;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'top';
        ctx.shadowColor = `rgba(${r},${g},${b},0.9)`;
        ctx.shadowBlur = isHover ? 14 : 6;
        ctx.fillStyle = isHover ? '#ffffff' : `rgba(255,255,255,${0.25 + depth * 0.75})`;
        ctx.fillText(n.name, p.x, p.y + 9 * p.s);
        ctx.shadowBlur = 0;

        if (isHover) {
          const label = GROUPS[n.group].label.toUpperCase();
          ctx.font = '600 9px "JetBrains Mono", monospace';
          const w = ctx.measureText(label).width + 16;
          const tx = Math.min(width - w / 2 - 4, Math.max(w / 2 + 4, p.x));
          const ty = p.y - 36 * p.s;
          ctx.fillStyle = 'rgba(5,7,12,0.85)';
          ctx.strokeStyle = `rgba(${r},${g},${b},0.6)`;
          ctx.beginPath();
          ctx.roundRect(tx - w / 2, ty - 10, w, 20, 10);
          ctx.fill();
          ctx.stroke();
          ctx.fillStyle = GROUPS[n.group].color;
          ctx.textBaseline = 'middle';
          ctx.fillText(label, tx, ty);
        }
      }
    }

    function pickHover() {
      if (!pointer || dragging) return;
      let best = -1;
      let bestD = 30 * 30;
      projected.forEach((p, i) => {
        const d = (p.x - pointer.x) ** 2 + (p.y - pointer.y) ** 2;
        if (d < bestD && p.z > -0.2) {
          bestD = d;
          best = i;
        }
      });
      hovered = best;
      canvas.style.cursor = best >= 0 ? 'pointer' : 'grab';
    }

    function frame(now) {
      const dt = Math.min(0.05, (now - last) / 1000);
      last = now;
      time += dt;
      if (!dragging) {
        rotY += velY;
        rotX += velX;
        velY *= 0.95;
        velX *= 0.95;
        if (!reduced && hovered < 0) rotY += dt * 0.18;
        rotX += (-0.25 - rotX) * 0.01;
      }
      rotX = Math.max(-0.9, Math.min(0.9, rotX));
      pickHover();
      draw();
      if (visible) raf = requestAnimationFrame(frame);
    }

    function startLoop() {
      cancelAnimationFrame(raf);
      last = performance.now();
      raf = requestAnimationFrame(frame);
    }

    function onDown(e) {
      dragging = true;
      lastX = e.clientX;
      lastY = e.clientY;
      velX = 0;
      velY = 0;
      hovered = -1;
      try {
        canvas.setPointerCapture(e.pointerId);
      } catch {
        /* pointer already gone (e.g. cancelled touch); dragging still works without capture */
      }
      canvas.style.cursor = 'grabbing';
    }
    function onMove(e) {
      const rect = canvas.getBoundingClientRect();
      pointer = { x: e.clientX - rect.left, y: e.clientY - rect.top };
      if (!dragging) return;
      const dx = e.clientX - lastX;
      const dy = e.clientY - lastY;
      lastX = e.clientX;
      lastY = e.clientY;
      velY = dx * 0.006;
      velX = dy * 0.004;
      rotY += velY;
      rotX += velX;
    }
    function onUp(e) {
      dragging = false;
      if (canvas.hasPointerCapture(e.pointerId)) canvas.releasePointerCapture(e.pointerId);
      canvas.style.cursor = 'grab';
    }
    function onLeave() {
      pointer = null;
      hovered = -1;
    }

    resize();
    draw();
    const ro = new ResizeObserver(() => {
      resize();
      draw();
    });
    ro.observe(canvas);
    const io = new IntersectionObserver(([entry]) => {
      visible = entry.isIntersecting;
      if (visible) startLoop();
      else cancelAnimationFrame(raf);
    });
    io.observe(canvas);

    canvas.addEventListener('pointerdown', onDown);
    canvas.addEventListener('pointermove', onMove);
    canvas.addEventListener('pointerup', onUp);
    canvas.addEventListener('pointercancel', onUp);
    canvas.addEventListener('pointerleave', onLeave);

    return () => {
      cancelAnimationFrame(raf);
      ro.disconnect();
      io.disconnect();
      canvas.removeEventListener('pointerdown', onDown);
      canvas.removeEventListener('pointermove', onMove);
      canvas.removeEventListener('pointerup', onUp);
      canvas.removeEventListener('pointercancel', onUp);
      canvas.removeEventListener('pointerleave', onLeave);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      className="block h-[360px] w-full cursor-grab sm:h-[460px]"
      style={{ touchAction: 'pan-y' }}
      aria-hidden="true"
    />
  );
}
