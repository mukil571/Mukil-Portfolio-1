import { useEffect, useRef } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { X } from 'lucide-react';
import SocialLinks from './SocialLinks.jsx';
import SoundToggle from './SoundToggle.jsx';

const list = {
  hidden: {},
  show: { transition: { staggerChildren: 0.06, delayChildren: 0.08 } },
};
const item = {
  hidden: { opacity: 0, x: -24 },
  show: { opacity: 1, x: 0, transition: { duration: 0.35, ease: 'easeOut' } },
};

/** Full-screen glass menu for phones. */
export default function MobileMenu({ open, onClose, links, active }) {
  const firstLink = useRef(null);

  useEffect(() => {
    if (!open) return undefined;
    const root = document.documentElement;
    root.style.overflow = 'hidden';
    const onKey = (e) => e.key === 'Escape' && onClose();
    window.addEventListener('keydown', onKey);
    const t = setTimeout(() => firstLink.current?.focus(), 50);
    return () => {
      root.style.overflow = '';
      window.removeEventListener('keydown', onKey);
      clearTimeout(t);
    };
  }, [open, onClose]);

  function go(e, id) {
    e.preventDefault();
    onClose();
    // wait for the scroll lock to lift before scrolling
    setTimeout(() => document.getElementById(id)?.scrollIntoView({ behavior: 'smooth' }), 60);
  }

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          key="mobile-menu"
          role="dialog"
          aria-modal="true"
          aria-label="Site menu"
          className="fixed inset-0 z-[80] flex flex-col overflow-y-auto bg-[#050505]/90 px-7 pb-10 pt-6 backdrop-blur-xl md:hidden"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.25 }}
        >
          <div
            className="pointer-events-none absolute inset-0"
            style={{
              background:
                'radial-gradient(circle at 80% 10%, rgba(0,240,255,0.12), transparent 45%), radial-gradient(circle at 10% 90%, rgba(124,58,237,0.14), transparent 50%)',
            }}
            aria-hidden="true"
          />

          <div className="relative flex items-center justify-between">
            <span className="flex h-10 w-10 items-center justify-center rounded-xl border border-cyan-glow/50 font-mono text-xs font-semibold text-cyan-glow shadow-glow-sm">
              MP
            </span>
            <button
              type="button"
              onClick={onClose}
              aria-label="Close menu"
              className="flex h-11 w-11 items-center justify-center rounded-full border border-white/15 text-white"
            >
              <X className="h-5 w-5" />
            </button>
          </div>

          <motion.ul variants={list} initial="hidden" animate="show" className="relative mt-12 space-y-2">
            {links.map(({ label, href }, i) => {
              const id = href.slice(1);
              const isActive = id === active;
              return (
                <motion.li key={href} variants={item}>
                  <a
                    ref={i === 0 ? firstLink : undefined}
                    href={href}
                    onClick={(e) => go(e, id)}
                    aria-current={isActive ? 'true' : undefined}
                    className="group flex items-baseline gap-4 rounded-2xl px-2 py-3 outline-none focus-visible:bg-white/5"
                  >
                    <span className={`font-mono text-xs ${isActive ? 'text-cyan-glow' : 'text-slate2/60'}`}>
                      0{i}
                    </span>
                    <span
                      className={`text-4xl font-extrabold tracking-tight transition-colors ${
                        isActive ? 'text-cyan-glow' : 'text-white group-active:text-cyan-glow'
                      }`}
                      style={isActive ? { textShadow: '0 0 24px rgba(0,240,255,0.55)' } : undefined}
                    >
                      {label.charAt(0) + label.slice(1).toLowerCase()}
                    </span>
                  </a>
                </motion.li>
              );
            })}
          </motion.ul>

          <motion.div
            className="relative mt-auto space-y-5"
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.35, duration: 0.35 }}
          >
            <SocialLinks className="justify-start" />
            <div className="flex items-center gap-3">
              <SoundToggle inline />
              <span className="font-mono text-[10px] uppercase tracking-[0.25em] text-slate2">Ambient sound</span>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
