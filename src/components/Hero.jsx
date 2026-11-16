import { motion } from 'framer-motion';
import { ArrowDown } from 'lucide-react';
import ScrambleText from './ScrambleText.jsx';
import SocialLinks from './SocialLinks.jsx';
import { useStarted } from '../lib/useStarted.js';
import { profile } from '../data/content.js';

const rise = (delay) => ({
  hidden: { opacity: 0, y: 24 },
  show: { opacity: 1, y: 0, transition: { duration: 0.8, delay } },
});

export default function Hero() {
  const started = useStarted();
  const state = started ? 'show' : 'hidden';

  return (
    <section id="intro" className="relative min-h-screen flex flex-col overflow-hidden">
      {/* soft radial glow behind the particle name (drawn by the WebGL universe) */}
      <div
        className="absolute left-1/2 top-[28%] -translate-x-1/2 -translate-y-1/2 w-[80vw] h-[38vh] rounded-full pointer-events-none"
        style={{
          background:
            'radial-gradient(ellipse at center, rgba(0,240,255,0.08) 0%, transparent 70%)',
        }}
        aria-hidden="true"
      />

      <h1 className="sr-only">
        {profile.name} — {profile.role}
      </h1>

      {/* the WebGL particles form the name inside this box, so it scrolls with the hero */}
      <div
        data-shape-anchor="intro"
        className="mx-auto mt-24 mb-6 w-[min(88vw,980px)] min-h-[120px] flex-1"
        aria-hidden="true"
      />

      <motion.div
        initial="hidden"
        animate={state}
        className="relative z-10 flex flex-col items-center text-center px-6 pb-14 sm:pb-16"
      >
        <motion.p
          variants={rise(0.3)}
          className="font-mono text-[11px] sm:text-xs uppercase tracking-[0.3em] text-slate2 mb-5"
        >
          <ScrambleText key={`${state}-${profile.role}`} text={profile.role} delay={400} />
          {profile.subtitle && (
            <>
              <span className="text-cyan-glow mx-2">/</span>
              <ScrambleText key={`${state}-${profile.subtitle}`} text={profile.subtitle} delay={800} />
            </>
          )}
        </motion.p>

        <motion.p
          variants={rise(0.45)}
          className="max-w-2xl text-sm sm:text-base leading-relaxed text-slate2 mb-9"
        >
          {profile.tagline}
        </motion.p>

        <motion.div variants={rise(0.6)} className="flex flex-col sm:flex-row items-center gap-4">
          <a
            href="#projects"
            className="glow-border relative rounded-full border border-cyan-glow/60 bg-black/40 px-8 py-3 font-mono text-xs uppercase tracking-[0.25em] text-cyan-glow shadow-glow-sm backdrop-blur-sm transition-all duration-300 hover:bg-cyan-glow/10 hover:shadow-glow-md"
          >
            View Projects
          </a>
          <a
            href="#contact"
            className="rounded-full border border-white/15 bg-black/40 px-8 py-3 font-mono text-xs uppercase tracking-[0.25em] text-white backdrop-blur-sm transition-all duration-300 hover:border-white/40 hover:bg-white/5"
          >
            Contact Me
          </a>
        </motion.div>

        <motion.div variants={rise(0.75)}>
          <SocialLinks className="mt-6" />
        </motion.div>

        <motion.a
          href="#skills"
          aria-label="Scroll to skills"
          variants={{ hidden: { opacity: 0 }, show: { opacity: 1, transition: { duration: 1, delay: 1.1 } } }}
          className="mt-10 flex flex-col items-center gap-2 text-slate2 hover:text-cyan-glow transition-colors"
        >
          <span className="font-mono text-[10px] uppercase tracking-[0.35em]">Scroll to warp</span>
          <ArrowDown className="w-5 h-5 animate-bounce" />
        </motion.a>
      </motion.div>
    </section>
  );
}
