import { Suspense, lazy, useEffect, useRef, useState } from 'react';
import type { MotionValue } from 'framer-motion';
import type { PaperShaderElement } from '@paper-design/shaders-react';

const MeshGradient = lazy(() =>
  import('@paper-design/shaders-react').then((m) => ({ default: m.MeshGradient })),
);

const AURORA_COLORS = ['#083d71', '#0a4e8e', '#0d7f9e', '#00a99d', '#7ec244'];

/**
 * Animated WebGL mesh gradient (brand aurora).
 * Client-only and lazy-loaded; the CSS aurora underneath acts as the
 * fallback while the chunk loads or when WebGL is unavailable.
 *
 * `offsetX` / `offsetY` (optional motion values, -1..1) move the gradient's
 * center. They are written straight to the shader uniforms, bypassing React
 * renders, so they can follow the pointer at frame rate.
 */
export function AuroraFlow({
  className = 'lr-statement__shader',
  speed = 0.7,
  offsetX,
  offsetY,
}: {
  className?: string;
  speed?: number;
  offsetX?: MotionValue<number>;
  offsetY?: MotionValue<number>;
}) {
  const [ready, setReady] = useState(false);
  const [reduce, setReduce] = useState(false);
  const mountRef = useRef<PaperShaderElement>(null);

  useEffect(() => {
    setReady(true);
    const mq = window.matchMedia('(prefers-reduced-motion: reduce)');
    setReduce(mq.matches);
    const onChange = (e: MediaQueryListEvent) => setReduce(e.matches);
    mq.addEventListener('change', onChange);
    return () => mq.removeEventListener('change', onChange);
  }, []);

  useEffect(() => {
    if (!offsetX || !offsetY) return;
    const push = () => {
      mountRef.current?.paperShaderMount?.setUniforms({
        u_offsetX: offsetX.get(),
        u_offsetY: offsetY.get(),
      });
    };
    const unX = offsetX.on('change', push);
    const unY = offsetY.on('change', push);
    return () => {
      unX();
      unY();
    };
  }, [offsetX, offsetY]);

  if (!ready) return null;

  return (
    <Suspense fallback={null}>
      <MeshGradient
        ref={mountRef}
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
