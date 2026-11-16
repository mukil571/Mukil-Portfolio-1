import { useEffect, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { emit, flags } from '../lib/bus.js';
import { profile } from '../data/content.js';

const LINES = [
  'INITIALIZING UNIVERSE',
  'LOADING STARFIELD · 28,000 STARS',
  'SPAWNING NEBULAE',
  'CALIBRATING PARTICLES',
  `PLOTTING COURSE → ${profile.name.toUpperCase()}`,
];
const MIN_MS = 1600;
const MAX_MS = 4000;

const prefersReducedMotion = () =>
  window.matchMedia('(prefers-reduced-motion: reduce)').matches;

/** Sci-fi terminal boot sequence shown while the 3D scene loads, then a hyperjump into the site. */
export default function BootScreen() {
  const [visible, setVisible] = useState(() => !prefersReducedMotion());
  const [pct, setPct] = useState(0);
  const [lines, setLines] = useState(1);

  useEffect(() => {
    if (prefersReducedMotion()) {
      emit('start');
      return undefined;
    }
    const root = document.documentElement;
    root.style.overflow = 'hidden';
    const t0 = performance.now();
    let progress = 0;
    let raf = 0;
    const timers = [];

    const finish = () => {
      setPct(100);
      setLines(LINES.length);
      timers.push(
        setTimeout(() => {
          emit('hyperjump', 'boot');
          setVisible(false);
          root.style.overflow = '';
        }, 300),
        setTimeout(() => emit('start'), 650)
      );
    };

    const tick = () => {
      const elapsed = performance.now() - t0;
      const ready = flags.ready && elapsed >= MIN_MS;
      if (ready || elapsed >= MAX_MS) {
        finish();
        return;
      }
      // crawl toward 92% while loading; the final jump to 100 happens on ready
      const target = Math.min(92, (elapsed / MIN_MS) * 80);
      progress += (target - progress) * 0.1;
      setPct(Math.floor(progress));
      setLines(Math.min(LINES.length - 1, 1 + Math.floor(elapsed / 300)));
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);

    return () => {
      cancelAnimationFrame(raf);
      timers.forEach(clearTimeout);
      root.style.overflow = '';
    };
  }, []);

  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          key="boot"
          className="fixed inset-0 z-[100] flex items-center justify-center bg-[#050505] px-6"
          exit={{ opacity: 0, scale: 1.06, filter: 'blur(6px)' }}
          transition={{ duration: 0.6, ease: 'easeIn' }}
          role="status"
          aria-label="Loading"
        >
          <div className="w-full max-w-md font-mono">
            <div className="mb-8 flex items-center gap-3">
              <span className="flex h-9 w-9 items-center justify-center rounded-lg border border-cyan-glow/50 text-xs font-semibold text-cyan-glow shadow-glow-sm">
                MP
              </span>
              <span className="text-[11px] uppercase tracking-[0.3em] text-slate2">
                portfolio.os v3.0
              </span>
            </div>

            <ul className="mb-8 space-y-2 text-[11px] sm:text-xs uppercase tracking-[0.15em]">
              {LINES.slice(0, lines).map((line, i) => {
                const done = i < lines - 1 || pct >= 100;
                return (
                  <li key={line} className="flex justify-between gap-4">
                    <span className="text-white/85">
                      <span className="mr-2 text-cyan-glow">&gt;</span>
                      {line}
                      {!done && <span className="ml-1 animate-pulse text-cyan-glow">▌</span>}
                    </span>
                    <span className={done ? 'text-cyan-glow' : 'text-slate2/50'}>
                      {done ? '[OK]' : '[..]'}
                    </span>
                  </li>
                );
              })}
            </ul>

            <div className="h-px w-full overflow-hidden bg-white/10">
              <div
                className="h-full bg-cyan-glow shadow-[0_0_12px_#00F0FF] transition-[width] duration-150"
                style={{ width: `${pct}%` }}
              />
            </div>
            <div className="mt-3 flex justify-between text-[10px] uppercase tracking-[0.3em] text-slate2">
              <span>{pct >= 100 ? 'Engaging warp drive' : 'Booting'}</span>
              <span className="text-cyan-glow">{pct}%</span>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
