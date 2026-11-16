/**
 * Tiny event bus shared by React components and the lazily loaded WebGL scene.
 * Events: 'ready', 'start', 'hyperjump', 'sfx' (detail: 'blip' | 'whoosh').
 */
export const bus = new EventTarget();

export const flags = {
  ready: false,
  started: false,
  sound: false,
};

export function emit(name, detail) {
  if (name === 'ready') flags.ready = true;
  if (name === 'start') flags.started = true;
  bus.dispatchEvent(new CustomEvent(name, { detail }));
}

export function on(name, handler) {
  bus.addEventListener(name, handler);
  return () => bus.removeEventListener(name, handler);
}
