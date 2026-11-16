import Universe from './three/Universe.jsx';
import { profile } from './data/content.js';
import CursorFX from './components/CursorFX.jsx';
import BootScreen from './components/BootScreen.jsx';
import HyperFlash from './components/HyperFlash.jsx';
import WarpMeter from './components/WarpMeter.jsx';
import SoundToggle from './components/SoundToggle.jsx';
import Navbar from './components/Navbar.jsx';
import Hero from './components/Hero.jsx';
import Skills from './components/Skills.jsx';
import Projects from './components/Projects.jsx';
import Education from './components/Education.jsx';
import Contact from './components/Contact.jsx';

export default function App() {
  return (
    <div className="relative min-h-screen bg-void text-white">
      <Universe />
      <CursorFX />
      <HyperFlash />
      <BootScreen />
      <WarpMeter />
      <SoundToggle />
      <Navbar />
      <main className="relative z-10">
        <Hero />
        <Skills />
        <Projects />
        <Education />
        <Contact />
      </main>
      <footer className="relative z-10 border-t border-white/5 px-6 py-8 text-center">
        <p className="font-mono text-[11px] uppercase tracking-[0.25em] text-slate2">
          © {new Date().getFullYear()} {profile.name} <span className="text-cyan-glow mx-2">/</span>{' '}
          Built with React, Three.js &amp; Tailwind
        </p>
      </footer>
    </div>
  );
}
