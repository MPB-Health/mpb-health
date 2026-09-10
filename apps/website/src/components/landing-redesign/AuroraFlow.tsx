import { Suspense, lazy, useEffect, useState } from 'react';

const MeshGradient = lazy(() =>
  import('@paper-design/shaders-react').then((m) => ({ default: m.MeshGradient })),
);

// Lime appears twice so the mesh reads blue → cyan → lime with green weight
const AURORA_COLORS = ['#1a4fd6', '#2cb7dc', '#a3e475', '#2cb7dc', '#7fd3c9', '#a3e475'];

/**
 * Animated WebGL mesh gradient (brand aurora).
 * Client-only and lazy-loaded; the CSS aurora underneath acts as the
 * fallback while the chunk loads or when WebGL is unavailable.
 */
export function AuroraFlow({
  className = 'lr-statement__shader',
  speed = 0.7,
}: {
  className?: string;
  speed?: number;
}) {
  const [ready, setReady] = useState(false);
  const [reduce, setReduce] = useState(false);

  useEffect(() => {
    setReady(true);
    const mq = window.matchMedia('(prefers-reduced-motion: reduce)');
    setReduce(mq.matches);
    const onChange = (e: MediaQueryListEvent) => setReduce(e.matches);
    mq.addEventListener('change', onChange);
    return () => mq.removeEventListener('change', onChange);
  }, []);

  if (!ready) return null;

  return (
    <Suspense fallback={null}>
      <MeshGradient
        className={className}
        colors={AURORA_COLORS}
        distortion={0.9}
        swirl={0.5}
        speed={reduce ? 0 : speed}
      />
    </Suspense>
  );
}

export default AuroraFlow;
