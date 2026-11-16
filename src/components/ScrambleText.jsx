import { useEffect, useRef, useState } from 'react';
import { useInView } from 'framer-motion';

const GLYPHS = '!<>-_\\/[]{}=+*^?#01';

function randomGlyph() {
  return GLYPHS[Math.floor(Math.random() * GLYPHS.length)];
}

function scramble(text, revealed = 0) {
  let out = '';
  for (let i = 0; i < text.length; i++) {
    const ch = text[i];
    out += ch === ' ' || i < revealed ? ch : randomGlyph();
  }
  return out;
}

/** Text that decodes from random glyphs, left to right, the first time it scrolls into view. */
export default function ScrambleText({ text, delay = 0, speed = 45, className }) {
  const ref = useRef(null);
  const inView = useInView(ref, { once: true, margin: '-40px' });
  const [display, setDisplay] = useState(() => scramble(text));

  useEffect(() => {
    if (!inView) return undefined;
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      setDisplay(text);
      return undefined;
    }
    let raf = 0;
    let start;
    let lastUpdate = 0;
    const tick = (now) => {
      if (start === undefined) start = now + delay;
      const elapsed = now - start;
      if (elapsed >= 0 && now - lastUpdate > 40) {
        lastUpdate = now;
        const revealed = Math.floor(elapsed / speed);
        setDisplay(scramble(text, revealed));
        if (revealed >= text.length) return;
      }
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [inView, text, delay, speed]);

  return (
    <span ref={ref} className={className}>
      <span className="sr-only">{text}</span>
      <span aria-hidden="true">{display}</span>
    </span>
  );
}
