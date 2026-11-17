import { useCallback, useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { Menu } from 'lucide-react';
import MobileMenu from './MobileMenu.jsx';

const LINKS = [
  { label: 'INTRO', href: '#intro' },
  { label: 'SKILLS', href: '#skills' },
  { label: 'PROJECTS', href: '#projects' },
  { label: 'EDUCATION', href: '#education' },
  { label: 'CONTACT', href: '#contact' },
];

export default function Navbar() {
  const [active, setActive] = useState('intro');
  const [menuOpen, setMenuOpen] = useState(false);
  const closeMenu = useCallback(() => setMenuOpen(false), []);

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

  const activeLabel = LINKS.find((l) => l.href === `#${active}`)?.label ?? 'INTRO';

  return (
    <>
      <motion.header
        initial={{ y: -40, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.7, ease: 'easeOut' }}
        className="fixed top-3 inset-x-0 z-50 flex justify-center px-4 md:top-4"
      >
        {/* phones: logo + current section + menu button */}
        <div className="glass flex w-full max-w-md items-center justify-between rounded-full py-1.5 pl-1.5 pr-1.5 shadow-glow-sm md:hidden">
          <a
            href="#intro"
            aria-label="Back to top"
            className="flex h-9 w-9 items-center justify-center rounded-full border border-cyan-glow/50 font-mono text-[11px] font-semibold text-cyan-glow"
          >
            MP
          </a>
          <span className="font-mono text-[10px] uppercase tracking-[0.3em] text-cyan-glow">{activeLabel}</span>
          <button
            type="button"
            onClick={() => setMenuOpen(true)}
            aria-label="Open menu"
            aria-expanded={menuOpen}
            className="flex h-9 w-9 items-center justify-center rounded-full bg-cyan-glow/10 text-cyan-glow"
          >
            <Menu className="h-[18px] w-[18px]" />
          </button>
        </div>

        {/* tablets and up: full pill nav */}
        <nav className="glass hidden rounded-full px-2 py-2 shadow-glow-sm md:block">
          <ul className="flex items-center gap-2">
            {LINKS.map(({ label, href }) => {
              const isActive = active === href.slice(1);
              return (
                <li key={label}>
                  <a
                    href={href}
                    className={`block rounded-full px-4 py-1.5 font-mono text-xs uppercase tracking-[0.25em] transition-colors duration-300 ${
                      isActive ? 'text-cyan-glow bg-cyan-glow/10' : 'text-slate2 hover:text-white'
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

      <MobileMenu open={menuOpen} onClose={closeMenu} links={LINKS} active={active} />
    </>
  );
}
