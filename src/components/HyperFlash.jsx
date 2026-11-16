import { useEffect, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { emit, on } from '../lib/bus.js';

const SECRET = 'warp';
const CONTAINER_TAGS = new Set(['HTML', 'BODY', 'MAIN', 'SECTION', 'FOOTER', 'DIV']);

/**
 * Flash overlay for hyperjumps, plus the hidden easter egg:
 * type "warp" anywhere, or double-click empty space.
 */
export default function HyperFlash() {
  const [jump, setJump] = useState(null); // { id, label }

  useEffect(() => {
    let timer = 0;
    const offJump = on('hyperjump', (e) => {
      if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
      clearTimeout(timer);
      setJump({ id: Date.now(), label: e.detail !== 'boot' });
      timer = setTimeout(() => setJump(null), 1700);
    });

    let typed = '';
    const onKey = (e) => {
      const t = e.target;
      if (t.isContentEditable || ['INPUT', 'TEXTAREA', 'SELECT'].includes(t.tagName)) return;
      if (e.key.length !== 1 || e.ctrlKey || e.metaKey || e.altKey) return;
      typed = (typed + e.key.toLowerCase()).slice(-SECRET.length);
      if (typed === SECRET) {
        typed = '';
        emit('hyperjump');
      }
    };

    const onDoubleClick = (e) => {
      const t = e.target;
      if (!CONTAINER_TAGS.has(t.tagName)) return;
      if (t.closest('a, button, form, canvas, .glass, [role="dialog"]')) return;
      window.getSelection()?.removeAllRanges();
      emit('hyperjump');
    };

    window.addEventListener('keydown', onKey);
    window.addEventListener('dblclick', onDoubleClick);
    return () => {
      clearTimeout(timer);
      offJump();
      window.removeEventListener('keydown', onKey);
      window.removeEventListener('dblclick', onDoubleClick);
    };
  }, []);

  return (
    <AnimatePresence>
      {jump && (
        <motion.div
          key={jump.id}
          className="pointer-events-none fixed inset-0 z-[90] flex items-center justify-center"
          initial={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.4 }}
          aria-hidden="true"
        >
          <motion.div
            className="absolute inset-0"
            style={{
              background:
                'radial-gradient(circle at center, rgba(255,255,255,0.9) 0%, rgba(0,240,255,0.45) 22%, rgba(0,240,255,0) 65%)',
            }}
            initial={{ opacity: 0, scale: 0.4 }}
            animate={{ opacity: [0, 0.9, 0], scale: [0.4, 1.6, 2.4] }}
            transition={{ duration: 1.3, ease: 'easeOut' }}
          />
          {jump.label && (
            <motion.p
              className="relative font-mono text-sm sm:text-lg font-semibold uppercase text-white"
              style={{ textShadow: '0 0 18px #00F0FF, 0 0 40px #00F0FF' }}
              initial={{ opacity: 0, letterSpacing: '0.1em' }}
              animate={{ opacity: [0, 1, 1, 0], letterSpacing: ['0.1em', '0.5em', '0.6em', '0.8em'] }}
              transition={{ duration: 1.6, times: [0, 0.2, 0.7, 1] }}
            >
              Hyperspace engaged
            </motion.p>
          )}
        </motion.div>
      )}
    </AnimatePresence>
  );
}
