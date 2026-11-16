import { useCallback, useRef, useState } from 'react';
import { motion } from 'framer-motion';
import { ArrowRight } from 'lucide-react';
import Section, { fadeUp } from './Section.jsx';
import ProjectModal, { ProjectLinks } from './ProjectModal.jsx';
import { projects } from '../data/content.js';

function TiltCard({ project, onOpen }) {
  const { icon: Icon, title, description, tags, repo, demo } = project;
  const ref = useRef(null);

  function onMouseMove(e) {
    const el = ref.current;
    const rect = el.getBoundingClientRect();
    const px = (e.clientX - rect.left) / rect.width - 0.5;
    const py = (e.clientY - rect.top) / rect.height - 0.5;
    el.style.transform = `perspective(900px) rotateY(${px * 8}deg) rotateX(${-py * 8}deg) translateY(-4px)`;
    el.style.setProperty('--mx', `${(px + 0.5) * 100}%`);
    el.style.setProperty('--my', `${(py + 0.5) * 100}%`);
  }

  function onMouseLeave() {
    ref.current.style.transform =
      'perspective(900px) rotateY(0deg) rotateX(0deg) translateY(0)';
  }

  function onKeyDown(e) {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      onOpen(project);
    }
  }

  return (
    <motion.article variants={fadeUp} className="h-full">
      <div
        ref={ref}
        role="button"
        tabIndex={0}
        aria-label={`${title}: view details`}
        onClick={() => onOpen(project)}
        onKeyDown={onKeyDown}
        onMouseMove={onMouseMove}
        onMouseLeave={onMouseLeave}
        className="group glow-border relative flex h-full cursor-pointer flex-col glass rounded-2xl p-7 outline-none transition-[transform,border-color,box-shadow] duration-200 will-change-transform hover:border-cyan-glow/40 hover:shadow-glow-md focus-visible:border-cyan-glow/60 focus-visible:shadow-glow-md overflow-hidden"
        style={{ transformStyle: 'preserve-3d' }}
      >
        {/* cursor-tracking sheen */}
        <div
          className="pointer-events-none absolute inset-0 opacity-0 transition-opacity duration-300 group-hover:opacity-100"
          style={{
            background:
              'radial-gradient(400px circle at var(--mx, 50%) var(--my, 50%), rgba(0,240,255,0.08), transparent 55%)',
          }}
          aria-hidden="true"
        />
        <div className="relative flex flex-1 flex-col">
          <div className="mb-5 inline-flex self-start rounded-xl border border-cyan-glow/30 bg-cyan-glow/5 p-3 text-cyan-glow">
            <Icon className="h-5 w-5" strokeWidth={1.6} />
          </div>
          <h3 className="mb-3 text-xl font-semibold transition-colors duration-300 group-hover:text-cyan-glow">
            {title}
          </h3>
          <p className="mb-6 text-sm leading-relaxed text-slate2">{description}</p>
          <ul className="mb-6 flex flex-wrap gap-2">
            {tags.map((tag) => (
              <li
                key={tag}
                className="rounded-md border border-accent/25 bg-accent/5 px-2.5 py-1 font-mono text-[11px] text-accent"
              >
                {tag}
              </li>
            ))}
          </ul>
          <ProjectLinks repo={repo} demo={demo} className="mb-5" />
          <span className="mt-auto inline-flex items-center gap-2 font-mono text-[11px] uppercase tracking-[0.2em] text-slate2 transition-colors group-hover:text-cyan-glow">
            View details
            <ArrowRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-1" />
          </span>
        </div>
      </div>
    </motion.article>
  );
}

export default function Projects() {
  const [open, setOpen] = useState(null);
  const close = useCallback(() => setOpen(null), []);

  return (
    <Section id="projects" kicker="// 02" title="Projects">
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {projects.map((project) => (
          <TiltCard key={project.title} project={project} onOpen={setOpen} />
        ))}
      </div>
      <ProjectModal project={open} onClose={close} />
    </Section>
  );
}
