import { useEffect, useRef } from 'react';

/**
 * Cursor-painted colour field (motion.dev-style hero interaction).
 *
 * A bright brand spectrum is drawn every frame, then masked by a "heat"
 * buffer: each pointer move stamps a soft disc into the buffer instantly (no
 * easing, so it snaps to the cursor) and the buffer fades a little every
 * frame, leaving a trail that dissolves behind the pointer. The spectrum's
 * hue offset drifts with time, so the same spot reveals different colours a
 * moment later.
 *
 * Pure 2D canvas, transform-free, runs only while there is heat to show.
 */
export function HeroFlowCanvas({
  targetRef,
  strength = 1,
}: {
  targetRef: React.RefObject<HTMLElement | null>;
  strength?: number;
}) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const target = targetRef.current;
    const canvas = canvasRef.current;
    if (!target || !canvas) return;
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Low-res heat buffer: the blur comes for free from upscaling.
    const heat = document.createElement('canvas');
    const hctx = heat.getContext('2d')!;
    const HEAT_SCALE = 0.12;

    let width = 0;
    let height = 0;
    const resize = () => {
      const rect = target.getBoundingClientRect();
      width = Math.max(1, Math.round(rect.width));
      height = Math.max(1, Math.round(rect.height));
      canvas.width = width;
      canvas.height = height;
      heat.width = Math.max(1, Math.round(width * HEAT_SCALE));
      heat.height = Math.max(1, Math.round(height * HEAT_SCALE));
    };
    resize();
    const ro = new ResizeObserver(resize);
    ro.observe(target);

    let raf = 0;
    let running = false;
    let lastStamp = 0;
    let last: { x: number; y: number } | null = null;

    const stamp = (x: number, y: number) => {
      const hx = x * HEAT_SCALE;
      const hy = y * HEAT_SCALE;
      const r = Math.max(heat.width, heat.height) * 0.08 * strength;
      const g = hctx.createRadialGradient(hx, hy, 0, hx, hy, r);
      // Very gentle falloff: the mask should read as a glow, never a shape.
      g.addColorStop(0, 'rgba(255,255,255,0.28)');
      g.addColorStop(0.35, 'rgba(255,255,255,0.14)');
      g.addColorStop(0.7, 'rgba(255,255,255,0.04)');
      g.addColorStop(1, 'rgba(255,255,255,0)');
      hctx.globalCompositeOperation = 'lighter';
      hctx.fillStyle = g;
      hctx.fillRect(hx - r, hy - r, r * 2, r * 2);
    };

    const frame = (t: number) => {
      // Decay: multiply the whole buffer's alpha down a notch.
      hctx.globalCompositeOperation = 'destination-out';
      hctx.fillStyle = 'rgba(0,0,0,0.012)';
      hctx.fillRect(0, 0, heat.width, heat.height);

      // Spectrum: brand hues sweeping diagonally, offset drifting with time.
      const phase = (t / 9000) % 1;
      const grad = ctx.createLinearGradient(0, height, width, 0);
      const stops: Array<[number, string]> = [
        [0, '#a6ce39'],
        [0.25, '#00a99d'],
        [0.5, '#3aa0e8'],
        [0.75, '#00a99d'],
        [1, '#a6ce39'],
      ];
      for (const [p, c] of stops) {
        grad.addColorStop((p + phase) % 1, c);
      }
      // Wrap the first stop so the seam is never visible.
      grad.addColorStop(0, stops[Math.floor(stops.length * (1 - phase)) % stops.length][1]);
      grad.addColorStop(1, stops[Math.floor(stops.length * (1 - phase)) % stops.length][1]);

      ctx.globalCompositeOperation = 'source-over';
      ctx.clearRect(0, 0, width, height);
      ctx.fillStyle = grad;
      ctx.fillRect(0, 0, width, height);

      // Keep only the spectrum where there is heat.
      ctx.globalCompositeOperation = 'destination-in';
      ctx.imageSmoothingEnabled = true;
      ctx.imageSmoothingQuality = 'high';
      ctx.filter = 'blur(10px)';
      ctx.drawImage(heat, 0, 0, width, height);
      ctx.filter = 'none';

      // Stop the loop once the trail has fully dissolved.
      if (t - lastStamp > 9000) {
        running = false;
        ctx.globalCompositeOperation = 'source-over';
        ctx.clearRect(0, 0, width, height);
        return;
      }
      raf = requestAnimationFrame(frame);
    };

    const start = () => {
      if (running) return;
      running = true;
      raf = requestAnimationFrame(frame);
    };

    const onMove = (e: PointerEvent) => {
      const rect = target.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;
      // Fill the gap between events so fast moves leave a continuous stroke.
      if (last) {
        const dx = x - last.x;
        const dy = y - last.y;
        const dist = Math.hypot(dx, dy);
        const steps = Math.min(8, Math.floor(dist / 14));
        for (let i = 1; i <= steps; i++) {
          stamp(last.x + (dx * i) / (steps + 1), last.y + (dy * i) / (steps + 1));
        }
      }
      stamp(x, y);
      last = { x, y };
      lastStamp = performance.now();
      start();
    };
    const onLeave = () => {
      last = null;
    };

    target.addEventListener('pointermove', onMove, { passive: true });
    target.addEventListener('pointerleave', onLeave);

    return () => {
      cancelAnimationFrame(raf);
      ro.disconnect();
      target.removeEventListener('pointermove', onMove);
      target.removeEventListener('pointerleave', onLeave);
    };
  }, [targetRef, strength]);

  return <canvas ref={canvasRef} className="lr-hero__flow-canvas" aria-hidden="true" />;
}

export default HeroFlowCanvas;
