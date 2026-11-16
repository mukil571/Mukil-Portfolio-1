import { motion } from 'framer-motion';
import { GraduationCap } from 'lucide-react';
import Section, { fadeUp } from './Section.jsx';
import { education } from '../data/content.js';

export default function Education() {
  return (
    <Section id="education" kicker="// 03" title="Education">
      <div className="relative pl-8 sm:pl-10">
        {/* timeline rail */}
        <div
          className="absolute left-[7px] sm:left-[9px] top-2 bottom-0 w-px bg-gradient-to-b from-cyan-glow/70 via-cyan-glow/20 to-transparent"
          aria-hidden="true"
        />

        <ol className="space-y-8">
          {education.map((entry, i) => (
            <li key={`${entry.degree}-${i}`} className="relative">
              {/* glowing node */}
              <div
                className="absolute -left-8 sm:-left-[38px] top-1.5 h-4 w-4 rounded-full border border-cyan-glow bg-cyan-glow/20 shadow-glow-md"
                aria-hidden="true"
              >
                <div className="absolute inset-1 rounded-full bg-cyan-glow animate-pulse-slow" />
              </div>

              <motion.div
                variants={fadeUp}
                className="glow-border relative glass max-w-2xl rounded-2xl p-7 sm:p-8 transition-all duration-300 hover:border-cyan-glow/40 hover:shadow-glow-sm"
              >
                {entry.period && (
                  <div className="mb-4 flex items-center gap-3">
                    <GraduationCap className="h-5 w-5 text-cyan-glow" strokeWidth={1.6} />
                    <span className="font-mono text-xs uppercase tracking-[0.25em] text-cyan-glow">
                      {entry.period}
                    </span>
                  </div>
                )}
                <h3 className="mb-2 text-xl sm:text-2xl font-semibold leading-snug">{entry.degree}</h3>
                {entry.institution && (
                  <p className="text-sm sm:text-base text-slate2">{entry.institution}</p>
                )}
              </motion.div>
            </li>
          ))}
        </ol>
      </div>
    </Section>
  );
}
