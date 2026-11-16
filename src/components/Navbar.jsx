import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';

const LINKS = [
  { label: 'INTRO', href: '#intro' },
  { label: 'SKILLS', href: '#skills' },
  { label: 'PROJECTS', href: '#projects' },
  { label: 'EDUCATION', href: '#education' },
  { label: 'CONTACT', href: '#contact' },
];

export default function Navbar() {
  const [active, setActive] = useState('intro');

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) setActive(entry.target.id);
        }
      },
      { rootMargin: '-45% 0px -45% 0px' }
    );
    for (const { href } of LINKS) {
      const el = document.querySelector(href);
      if (el) observer.observe(el);
    }
    return () => observer.disconnect();
  }, []);

  return (
    <motion.header
      initial={{ y: -40, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.7, ease: 'easeOut' }}
      className="fixed top-4 inset-x-0 z-50 flex justify-center px-4"
    >
      <nav className="glass rounded-full px-1.5 py-1.5 sm:px-2 sm:py-2 shadow-glow-sm">
        <ul className="flex items-center gap-0 sm:gap-2">
          {LINKS.map(({ label, href }) => {
            const isActive = active === href.slice(1);
            return (
              <li key={label}>
                <a
                  href={href}
                  className={`block rounded-full px-2 sm:px-4 py-1.5 font-mono text-[9px] sm:text-xs uppercase tracking-[0.1em] sm:tracking-[0.25em] transition-colors duration-300 ${
                    isActive
                      ? 'text-cyan-glow bg-cyan-glow/10'
                      : 'text-slate2 hover:text-white'
                  }`}
                >
                  {label}
                </a>
              </li>
            );
          })}
        </ul>
      </nav>
    </motion.header>
  );
}
