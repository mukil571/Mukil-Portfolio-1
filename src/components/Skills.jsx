import { motion } from 'framer-motion';
import Section, { fadeUp } from './Section.jsx';
import SkillConstellation, { GROUPS } from './SkillConstellation.jsx';

const coarsePointer = window.matchMedia('(pointer: coarse)').matches;

export default function Skills() {
  return (
    <Section id="skills" kicker="// 01" title="Skills">
      {GROUPS.length === 0 ? (
        <motion.p variants={fadeUp} className="text-sm text-slate2">
          No skills added yet.
        </motion.p>
      ) : (
        <>
          <motion.div variants={fadeUp} className="glow-border relative glass overflow-hidden rounded-3xl">
            <SkillConstellation />
            <p className="pointer-events-none absolute left-5 top-4 font-mono text-[10px] uppercase tracking-[0.3em] text-slate2">
              {coarsePointer ? 'Swipe to spin · tap a star' : 'Drag to explore'}
            </p>
          </motion.div>

          <motion.ul variants={fadeUp} className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-3">
            {GROUPS.map((group) => (
              <li key={group.label} className="flex items-start gap-3">
                <span
                  className="mt-1.5 h-2.5 w-2.5 shrink-0 rounded-full"
                  style={{ background: group.color, boxShadow: `0 0 10px ${group.color}` }}
                  aria-hidden="true"
                />
                <div>
                  <p className="font-mono text-[11px] uppercase tracking-[0.2em]" style={{ color: group.color }}>
                    {group.label}
                  </p>
                  <p className="mt-1 text-sm text-slate2">{group.skills.join(' · ')}</p>
                </div>
              </li>
            ))}
          </motion.ul>
        </>
      )}
    </Section>
  );
}
