import { Github, Linkedin, FileDown } from 'lucide-react';
import { profile } from '../data/content.js';

const iconButton =
  'flex h-11 w-11 items-center justify-center rounded-full border border-white/15 bg-black/40 text-slate2 backdrop-blur-sm transition-all duration-300 hover:border-cyan-glow/60 hover:text-cyan-glow hover:shadow-glow-sm';

/** GitHub / LinkedIn / Resume buttons. Each renders only when its link is set in content.json. */
export default function SocialLinks({ className = '' }) {
  const { github, linkedin, resume } = profile;
  if (!github && !linkedin && !resume) return null;

  return (
    <div className={`flex flex-wrap items-center justify-center gap-3 ${className}`}>
      {github && (
        <a href={github} target="_blank" rel="noreferrer" aria-label="GitHub profile" className={iconButton}>
          <Github className="h-5 w-5" strokeWidth={1.6} />
        </a>
      )}
      {linkedin && (
        <a href={linkedin} target="_blank" rel="noreferrer" aria-label="LinkedIn profile" className={iconButton}>
          <Linkedin className="h-5 w-5" strokeWidth={1.6} />
        </a>
      )}
      {resume && (
        <a
          href={resume}
          download
          className="flex h-11 items-center gap-2 rounded-full border border-cyan-glow/40 bg-black/40 px-5 font-mono text-[11px] uppercase tracking-[0.2em] text-cyan-glow backdrop-blur-sm transition-all duration-300 hover:bg-cyan-glow/10 hover:shadow-glow-sm"
        >
          <FileDown className="h-4 w-4" strokeWidth={1.8} />
          Resume
        </a>
      )}
    </div>
  );
}
