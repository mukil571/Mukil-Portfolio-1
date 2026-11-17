import { useEffect, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { emit, on } from '../lib/bus.js';

const SECRET = 'warp';
const CONTAINER_TAGS = new Set(['HTML', 'BODY', 'MAIN', 'SECTION', 'FOOTER', 'DIV']);
const LONG_PRESS_MS = 700;

/**
 * Flash overlay for hyperjumps, plus the hidden easter egg:
 * type "warp" or double-click empty space (mouse), or long-press the hero name (touch).
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

    // phones fire dblclick on a double-tap, so this trigger is for mouse users only
    const finePointer = window.matchMedia('(pointer: fine)');
    const onDoubleClick = (e) => {
      if (!finePointer.matches) return;
      const t = e.target;
      if (!CONTAINER_TAGS.has(t.tagName)) return;
      if (t.closest('a, button, form, canvas, .glass, [role="dialog"]')) return;
      window.getSelection()?.removeAllRanges();
      emit('hyperjump');
    };

    // touch: hold a finger on the hero name for LONG_PRESS_MS
    let press = null;
    const cancelPress = () => {
      if (press) clearTimeout(press.timer);
      press = null;
    };
    const onPointerDown = (e) => {
      if (e.pointerType === 'mouse' || !e.target.closest?.('[data-warp-target]')) return;
      cancelPress();
      press = {
        x: e.clientX,
        y: e.clientY,
        timer: setTimeout(() => {
          press = null;
          navigator.vibrate?.(30);
          emit('hyperjump');
        }, LONG_PRESS_MS),
      };
    };
    const onPointerMove = (e) => {
      if (press && Math.hypot(e.clientX - press.x, e.clientY - press.y) > 10) cancelPress();
    };
    const onContextMenu = (e) => {
      if (e.target.closest?.('[data-warp-target]')) e.preventDefault();
    };

    window.addEventListener('keydown', onKey);
    window.addEventListener('dblclick', onDoubleClick);
    window.addEventListener('pointerdown', onPointerDown);
    window.addEventListener('pointermove', onPointerMove);
    window.addEventListener('pointerup', cancelPress);
    window.addEventListener('pointercancel', cancelPress);
    window.addEventListener('contextmenu', onContextMenu);
    return () => {
      clearTimeout(timer);
      cancelPress();
      offJump();
      window.removeEventListener('keydown', onKey);
      window.removeEventListener('dblclick', onDoubleClick);
      window.removeEventListener('pointerdown', onPointerDown);
      window.removeEventListener('pointermove', onPointerMove);
      window.removeEventListener('pointerup', cancelPress);
      window.removeEventListener('pointercancel', cancelPress);
      window.removeEventListener('contextmenu', onContextMenu);
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
