import { useEffect, useRef } from 'react';

/**
 * Fixed full-screen canvas for the WebGL universe. Three.js is loaded
 * on demand so the page content renders before the 3D bundle arrives.
 */
export default function Universe() {
  const canvasRef = useRef(null);

  useEffect(() => {
    let dispose = null;
    let cancelled = false;
    import('./scene.js').then(({ mountUniverse }) => {
      if (!cancelled) dispose = mountUniverse(canvasRef.current);
    });
    return () => {
      cancelled = true;
      dispose?.();
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      className="fixed left-0 top-0 z-0 h-screen w-full pointer-events-none supports-[height:100lvh]:h-[100lvh]"
      aria-hidden="true"
    />
  );
}
