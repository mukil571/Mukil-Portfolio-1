import { useEffect, useState } from 'react';
import { Volume2, VolumeX } from 'lucide-react';
import { setSound } from '../audio/sound.js';

const STORAGE_KEY = 'mp-sound';

function readPref() {
  try {
    return localStorage.getItem(STORAGE_KEY) === 'on';
  } catch {
    return false;
  }
}

function writePref(on) {
  try {
    localStorage.setItem(STORAGE_KEY, on ? 'on' : 'off');
  } catch {
    /* storage unavailable — preference just isn't remembered */
  }
}

/** Off-by-default ambient sound toggle. A remembered "on" resumes on the first interaction. */
export default function SoundToggle() {
  const [enabled, setEnabled] = useState(false);

  useEffect(() => {
    if (!readPref()) return undefined;
    // browsers block audio until a user gesture, so wait for one
    const resume = () => {
      setEnabled(true);
      setSound(true);
    };
    window.addEventListener('pointerdown', resume, { once: true });
    window.addEventListener('keydown', resume, { once: true });
    return () => {
      window.removeEventListener('pointerdown', resume);
      window.removeEventListener('keydown', resume);
    };
  }, []);

  function toggle(e) {
    e.stopPropagation();
    const next = !enabled;
    setEnabled(next);
    setSound(next);
    writePref(next);
  }

  return (
    <button
      type="button"
      onClick={toggle}
      aria-pressed={enabled}
      aria-label={enabled ? 'Turn sound off' : 'Turn sound on'}
      title={enabled ? 'Sound on' : 'Sound off'}
      className={`fixed bottom-5 left-5 z-50 flex h-11 w-11 items-center justify-center rounded-full border backdrop-blur-md transition-all duration-300 ${
        enabled
          ? 'border-cyan-glow/60 bg-cyan-glow/10 text-cyan-glow shadow-glow-sm'
          : 'border-white/15 bg-black/50 text-slate2 hover:border-white/40 hover:text-white'
      }`}
    >
      {enabled ? (
        <Volume2 className="h-4 w-4" strokeWidth={1.8} />
      ) : (
        <VolumeX className="h-4 w-4" strokeWidth={1.8} />
      )}
      {enabled && (
        <span className="absolute inset-0 rounded-full border border-cyan-glow/40 animate-ping" aria-hidden="true" />
      )}
    </button>
  );
}
