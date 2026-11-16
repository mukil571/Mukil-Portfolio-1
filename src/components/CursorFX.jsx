import { useEffect, useRef } from 'react';
import { emit } from '../lib/bus.js';

const COLORS = [
  [0, 240, 255],
  [0, 240, 255],
  [0, 240, 255],
  [56, 189, 248],
  [255, 255, 255],
];
const MAX_PARTICLES = 500;

/** Comet trail that follows the mouse, plus a particle burst + shockwave on click/tap. */
export default function CursorFX() {
  const canvasRef = useRef(null);

  useEffect(() => {
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return undefined;
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    let width = 0;
    let height = 0;
    const particles = [];
    const rings = [];
    const head = { x: -100, y: -100, tx: -100, ty: -100, visible: false };
    let lastX = null;
    let lastY = null;
    let raf = 0;
    let last = performance.now();

    function resize() {
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      width = window.innerWidth;
      height = window.innerHeight;
      canvas.width = Math.floor(width * dpr);
      canvas.height = Math.floor(height * dpr);
      canvas.style.width = `${width}px`;
      canvas.style.height = `${height}px`;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    }

    function spawn(x, y, vx, vy, life, size, gravity = 0) {
      if (particles.length >= MAX_PARTICLES) particles.shift();
      const color = COLORS[Math.floor(Math.random() * COLORS.length)];
      particles.push({ x, y, vx, vy, life, max: life, size, gravity, color });
    }

    function onMove(e) {
      if (e.pointerType !== 'mouse') return;
      head.tx = e.clientX;
      head.ty = e.clientY;
      if (!head.visible) {
        head.x = e.clientX;
        head.y = e.clientY;
        head.visible = true;
      }
      if (lastX !== null) {
        const dx = e.clientX - lastX;
        const dy = e.clientY - lastY;
        const dist = Math.hypot(dx, dy);
        const n = Math.min(5, Math.ceil(dist / 7));
        for (let i = 0; i < n; i++) {
          const t = i / n;
          spawn(
            lastX + dx * t,
            lastY + dy * t,
            -dx * 0.6 + (Math.random() - 0.5) * 40,
            -dy * 0.6 + (Math.random() - 0.5) * 40,
            0.35 + Math.random() * 0.5,
            1 + Math.random() * 1.8
          );
        }
      }
      lastX = e.clientX;
      lastY = e.clientY;
    }

    function onDown(e) {
      const x = e.clientX;
      const y = e.clientY;
      const n = 42;
      for (let i = 0; i < n; i++) {
        const a = (i / n) * Math.PI * 2 + Math.random() * 0.3;
        const speed = 80 + Math.random() * 280;
        spawn(x, y, Math.cos(a) * speed, Math.sin(a) * speed, 0.6 + Math.random() * 0.6, 1.2 + Math.random() * 2, 260);
      }
      rings.push({ x, y, age: 0 });
      emit('sfx', 'blip');
    }

    function onLeave() {
      head.visible = false;
      lastX = null;
      lastY = null;
    }

    function frame(now) {
      const dt = Math.min(0.05, (now - last) / 1000);
      last = now;
      ctx.clearRect(0, 0, width, height);
      ctx.globalCompositeOperation = 'lighter';

      for (let i = particles.length - 1; i >= 0; i--) {
        const p = particles[i];
        p.life -= dt;
        if (p.life <= 0) {
          particles.splice(i, 1);
          continue;
        }
        p.vx *= 0.94;
        p.vy = p.vy * 0.94 + p.gravity * dt;
        p.x += p.vx * dt;
        p.y += p.vy * dt;
        const a = p.life / p.max;
        const r = p.size * (0.4 + 0.6 * a);
        const [cr, cg, cb] = p.color;
        ctx.fillStyle = `rgba(${cr},${cg},${cb},${a * 0.18})`;
        ctx.beginPath();
        ctx.arc(p.x, p.y, r * 3.2, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = `rgba(${cr},${cg},${cb},${a})`;
        ctx.beginPath();
        ctx.arc(p.x, p.y, r, 0, Math.PI * 2);
        ctx.fill();
      }

      for (let i = rings.length - 1; i >= 0; i--) {
        const ring = rings[i];
        ring.age += dt;
        const t = ring.age / 0.65;
        if (t >= 1) {
          rings.splice(i, 1);
          continue;
        }
        ctx.strokeStyle = `rgba(0,240,255,${(1 - t) * 0.7})`;
        ctx.lineWidth = 1.5 * (1 - t) + 0.5;
        ctx.beginPath();
        ctx.arc(ring.x, ring.y, 8 + t * 90, 0, Math.PI * 2);
        ctx.stroke();
      }

      if (head.visible) {
        head.x += (head.tx - head.x) * 0.3;
        head.y += (head.ty - head.y) * 0.3;
        const g = ctx.createRadialGradient(head.x, head.y, 0, head.x, head.y, 16);
        g.addColorStop(0, 'rgba(255,255,255,0.9)');
        g.addColorStop(0.25, 'rgba(0,240,255,0.5)');
        g.addColorStop(1, 'rgba(0,240,255,0)');
        ctx.fillStyle = g;
        ctx.beginPath();
        ctx.arc(head.x, head.y, 16, 0, Math.PI * 2);
        ctx.fill();
      }

      ctx.globalCompositeOperation = 'source-over';
      raf = requestAnimationFrame(frame);
    }

    resize();
    raf = requestAnimationFrame(frame);
    window.addEventListener('resize', resize);
    window.addEventListener('pointermove', onMove);
    window.addEventListener('pointerdown', onDown);
    document.documentElement.addEventListener('pointerleave', onLeave);

    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener('resize', resize);
      window.removeEventListener('pointermove', onMove);
      window.removeEventListener('pointerdown', onDown);
      document.documentElement.removeEventListener('pointerleave', onLeave);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      className="fixed inset-0 z-[60] pointer-events-none"
      aria-hidden="true"
    />
  );
}
