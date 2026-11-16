import { useEffect, useState } from 'react';
import { flags, on } from './bus.js';

/** True once the boot screen has handed over to the site. */
export function useStarted() {
  const [started, setStarted] = useState(flags.started);
  useEffect(() => {
    if (flags.started) {
      setStarted(true);
      return undefined;
    }
    return on('start', () => setStarted(true));
  }, []);
  return started;
}
