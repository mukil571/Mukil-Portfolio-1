import { useEffect, useRef } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { X, Github, ExternalLink, Check } from 'lucide-react';

const pill =
  'inline-flex items-center gap-2 rounded-full border px-4 py-2 font-mono text-[11px] uppercase tracking-[0.18em] transition-all duration-300';

/** A live link when `href` is set, otherwise a dimmed "Coming soon" placeholder. */
function LinkPill({ href, icon: Icon, label, liveClass }) {
  const stop = (e) => e.stopPropagation();
  if (href) {
    return (
      <a href={href} target="_blank" rel="noreferrer" onClick={stop} className={`${pill} ${liveClass}`}>
        <Icon className="h-3.5 w-3.5" strokeWidth={1.8} /> {label}
      </a>
    );
  }
  return (
    <span
      aria-disabled="true"
      title="Coming soon"
      onClick={stop}
      className={`${pill} cursor-not-allowed border-white/10 text-slate2 opacity-45`}
    >
      <Icon className="h-3.5 w-3.5" strokeWidth={1.8} /> {label}
      <span className="rounded-full bg-white/10 px-1.5 py-px text-[9px] tracking-[0.12em]">Soon</span>
    </span>
  );
}

/** Live Demo + Source Code buttons, always shown; empty links appear as "Coming soon". */
export function ProjectLinks({ repo, demo, className = '' }) {
  return (
    <div className={`flex flex-wrap gap-3 ${className}`}>
      <LinkPill
        href={demo}
        icon={ExternalLink}
        label="Live Demo"
        liveClass="border-cyan-glow/50 text-cyan-glow hover:bg-cyan-glow/10 hover:shadow-glow-sm"
      />
      <LinkPill
        href={repo}
        icon={Github}
        label="Source Code"
        liveClass="border-white/15 text-white hover:border-white/40 hover:bg-white/5"
      />
    </div>
  );
}

/** Glass detail panel for one project. Esc or a backdrop click closes it. */
export default function ProjectModal({ project, onClose }) {
  const closeRef = useRef(null);

  useEffect(() => {
    if (!project) return undefined;
    const root = document.documentElement;
    const prevOverflow = root.style.overflow;
    root.style.overflow = 'hidden';
    const onKey = (e) => e.key === 'Escape' && onClose();
    window.addEventListener('keydown', onKey);
    closeRef.current?.focus();
    return () => {
      root.style.overflow = prevOverflow;
      window.removeEventListener('keydown', onKey);
    };
  }, [project, onClose]);

  return (
    <AnimatePresence>
      {project && (
        <motion.div
          key="backdrop"
          className="fixed inset-0 z-[70] flex items-center justify-center bg-black/70 px-4 backdrop-blur-sm"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
        >
          <motion.div
            role="dialog"
            aria-modal="true"
            aria-labelledby="project-modal-title"
            className="relative w-full max-w-xl max-h-[85vh] overflow-y-auto rounded-2xl border border-cyan-glow/30 bg-[#05070c]/95 p-7 sm:p-9 shadow-glow-lg"
            initial={{ opacity: 0, scale: 0.92, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 10 }}
            transition={{ duration: 0.3, ease: 'easeOut' }}
            onClick={(e) => e.stopPropagation()}
          >
            <button
              ref={closeRef}
              type="button"
              onClick={onClose}
              aria-label="Close project details"
              className="absolute right-4 top-4 rounded-full border border-white/10 p-2 text-slate2 transition-colors hover:border-cyan-glow/40 hover:text-cyan-glow"
            >
              <X className="h-4 w-4" />
            </button>

            <div className="mb-5 inline-flex rounded-xl border border-cyan-glow/30 bg-cyan-glow/5 p-3 text-cyan-glow">
              <project.icon className="h-6 w-6" strokeWidth={1.6} />
            </div>
            <h3 id="project-modal-title" className="mb-3 text-2xl font-bold">
              {project.title}
            </h3>
            <p className="mb-6 text-sm leading-relaxed text-slate2">{project.description}</p>

            <p className="section-heading mb-3">Highlights</p>
            <ul className="mb-6 space-y-2.5">
              {project.highlights.map((h) => (
                <li key={h} className="flex gap-3 text-sm text-white/90">
                  <Check className="mt-0.5 h-4 w-4 shrink-0 text-cyan-glow" strokeWidth={2} />
                  {h}
                </li>
              ))}
            </ul>

            <p className="section-heading mb-3">Tech</p>
            <ul className="mb-7 flex flex-wrap gap-2">
              {project.tags.map((tag) => (
                <li
                  key={tag}
                  className="rounded-md border border-accent/25 bg-accent/5 px-2.5 py-1 font-mono text-[11px] text-accent"
                >
                  {tag}
                </li>
              ))}
            </ul>

            <ProjectLinks repo={project.repo} demo={project.demo} />
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
