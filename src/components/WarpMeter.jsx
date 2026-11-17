import { useEffect, useState } from 'react';

const SECTIONS = [
  ['intro', 'Intro'],
  ['skills', 'Skills'],
  ['projects', 'Projects'],
  ['education', 'Education'],
  ['contact', 'Contact'],
];

const clamp01 = (v) => Math.max(0, Math.min(1, v));

/** Glowing scroll-progress rail on the right edge with clickable section markers. */
export default function WarpMeter() {
  const [progress, setProgress] = useState(0);
  const [marks, setMarks] = useState([]);
  const [active, setActive] = useState('intro');

  useEffect(() => {
    let raf = 0;
    const maxScroll = () => document.documentElement.scrollHeight - window.innerHeight;

    const measure = () => {
      const max = maxScroll();
      setMarks(
        SECTIONS.map(([id, label]) => {
          const el = document.getElementById(id);
          const top = el ? el.getBoundingClientRect().top + window.scrollY : 0;
          return { id, label, at: max > 0 ? clamp01(top / max) : 0 };
        })
      );
    };

    const update = () => {
      raf = 0;
      const max = maxScroll();
      setProgress(max > 0 ? clamp01(window.scrollY / max) : 0);
      let current = 'intro';
      for (const [id] of SECTIONS) {
        const el = document.getElementById(id);
        if (el && el.getBoundingClientRect().top <= window.innerHeight * 0.45) current = id;
      }
      setActive(current);
    };

    const onScroll = () => {
      if (!raf) raf = requestAnimationFrame(update);
    };
    const onResize = () => {
      measure();
      update();
    };

    onResize();
    const ro = new ResizeObserver(onResize);
    ro.observe(document.body);
    window.addEventListener('scroll', onScroll, { passive: true });
    window.addEventListener('resize', onResize);
    return () => {
      cancelAnimationFrame(raf);
      ro.disconnect();
      window.removeEventListener('scroll', onScroll);
      window.removeEventListener('resize', onResize);
    };
  }, []);

  return (
    <>
    {/* phones/tablets: a thin progress line along the top edge */}
    <div className="pointer-events-none fixed inset-x-0 top-0 z-[55] h-[2px] xl:hidden" aria-hidden="true">
      <div
        className="h-full bg-cyan-glow shadow-[0_0_8px_#00F0FF]"
        style={{ width: `${progress * 100}%` }}
      />
    </div>

    <nav
      aria-label="Section progress"
      className="fixed right-6 top-1/2 z-40 hidden h-[46vh] -translate-y-1/2 xl:block"
    >
      <div className="relative h-full w-px bg-white/10">
        <div
          className="absolute left-0 top-0 w-px bg-cyan-glow shadow-[0_0_10px_#00F0FF]"
          style={{ height: `${progress * 100}%` }}
        />
        <div
          className="absolute left-1/2 h-1.5 w-1.5 -translate-x-1/2 -translate-y-1/2 rounded-full bg-white shadow-[0_0_10px_#00F0FF]"
          style={{ top: `${progress * 100}%` }}
          aria-hidden="true"
        />

        {marks.map(({ id, label, at }) => {
          const isActive = id === active;
          return (
            <button
              key={id}
              type="button"
              onClick={() => document.getElementById(id)?.scrollIntoView({ behavior: 'smooth' })}
              aria-label={`Go to ${label}`}
              aria-current={isActive ? 'true' : undefined}
              className="group absolute left-1/2 flex h-6 w-6 -translate-x-1/2 -translate-y-1/2 items-center justify-center"
              style={{ top: `${at * 100}%` }}
            >
              <span
                className={`block rounded-full border transition-all duration-300 ${
                  isActive
                    ? 'h-3 w-3 border-cyan-glow bg-cyan-glow shadow-[0_0_12px_#00F0FF]'
                    : 'h-2 w-2 border-white/40 bg-[#050505] group-hover:border-cyan-glow'
                }`}
              />
              <span
                className={`pointer-events-none absolute right-6 whitespace-nowrap font-mono text-[10px] uppercase tracking-[0.25em] transition-opacity duration-300 ${
                  isActive ? 'text-cyan-glow opacity-100' : 'text-slate2 opacity-0 group-hover:opacity-100'
                }`}
              >
                {label}
              </span>
            </button>
          );
        })}
      </div>
      <p className="mt-3 -translate-x-1/2 font-mono text-[9px] tracking-[0.2em] text-slate2">
        {Math.round(progress * 100)}%
      </p>
    </nav>
    </>
  );
}
