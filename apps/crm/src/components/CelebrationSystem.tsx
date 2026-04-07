import {
  createContext,
  useContext,
  useCallback,
  useEffect,
  useRef,
  useState,
  type ReactNode,
} from 'react';
import { Trophy, Flame, Star, CheckCircle2, TrendingUp } from 'lucide-react';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

type CelebrationType =
  | 'deal_closed'
  | 'stage_won'
  | 'task_complete'
  | 'streak'
  | 'achievement';

interface CelebrationConfig {
  particleCount: number;
  palette: string[];
  durationMs: number;
  icon: React.ComponentType<{ className?: string }>;
  title: string;
  gradient: string;
  showOverlayText: boolean;
}

interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  size: number;
  color: string;
  rotation: number;
  rotationSpeed: number;
  opacity: number;
  shape: 'rect' | 'circle';
}

interface CelebrationContextValue {
  celebrate: (type: CelebrationType, message?: string) => void;
}

interface BannerState {
  visible: boolean;
  type: CelebrationType;
  title: string;
  subtitle: string;
  icon: React.ComponentType<{ className?: string }>;
  gradient: string;
}

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const PALETTE_VIBRANT = ['#FFD700', '#10B981', '#3B82F6', '#8B5CF6', '#F43F5E'];
const PALETTE_FLAME = ['#F97316', '#EF4444', '#FFD700', '#FB923C', '#DC2626'];

const CELEBRATION_CONFIGS: Record<CelebrationType, CelebrationConfig> = {
  deal_closed: {
    particleCount: 200,
    palette: PALETTE_VIBRANT,
    durationMs: 4000,
    icon: Trophy,
    title: 'DEAL CLOSED!',
    gradient: 'from-amber-500 via-yellow-400 to-amber-500',
    showOverlayText: true,
  },
  stage_won: {
    particleCount: 80,
    palette: PALETTE_VIBRANT,
    durationMs: 3000,
    icon: TrendingUp,
    title: 'Stage Won!',
    gradient: 'from-blue-500 via-indigo-500 to-blue-600',
    showOverlayText: false,
  },
  task_complete: {
    particleCount: 0,
    palette: PALETTE_VIBRANT,
    durationMs: 2000,
    icon: CheckCircle2,
    title: 'Task Complete',
    gradient: 'from-emerald-500 via-green-400 to-emerald-500',
    showOverlayText: false,
  },
  streak: {
    particleCount: 120,
    palette: PALETTE_FLAME,
    durationMs: 3500,
    icon: Flame,
    title: "You're On Fire!",
    gradient: 'from-orange-500 via-red-500 to-orange-600',
    showOverlayText: false,
  },
  achievement: {
    particleCount: 100,
    palette: PALETTE_VIBRANT,
    durationMs: 3000,
    icon: Star,
    title: 'Achievement Unlocked!',
    gradient: 'from-violet-500 via-purple-500 to-violet-600',
    showOverlayText: false,
  },
};

const GRAVITY = 0.12;
const FADE_START_RATIO = 0.6;
const BANNER_DISMISS_MS = 4000;

// ---------------------------------------------------------------------------
// Context
// ---------------------------------------------------------------------------

const CelebrationContext = createContext<CelebrationContextValue | null>(null);

export function useCelebration(): CelebrationContextValue {
  const ctx = useContext(CelebrationContext);
  if (!ctx) {
    throw new Error('useCelebration must be used within a CelebrationProvider');
  }
  return ctx;
}

// ---------------------------------------------------------------------------
// Sparkle overlay for task_complete (subtle CSS-only effect)
// ---------------------------------------------------------------------------

function SparkleOverlay({ active }: { active: boolean }) {
  const [dots, setDots] = useState<
    { id: number; x: number; y: number; delay: number; size: number }[]
  >([]);

  useEffect(() => {
    if (!active) {
      setDots([]);
      return;
    }
    const generated = Array.from({ length: 18 }, (_, i) => ({
      id: i,
      x: 40 + Math.random() * 20,
      y: 10 + Math.random() * 30,
      delay: Math.random() * 0.6,
      size: 4 + Math.random() * 6,
    }));
    setDots(generated);
    const timer = setTimeout(() => setDots([]), 2000);
    return () => clearTimeout(timer);
  }, [active]);

  if (dots.length === 0) return null;

  return (
    <div className="fixed inset-0 pointer-events-none z-[9998]">
      {dots.map((dot) => (
        <span
          key={dot.id}
          className="absolute rounded-full animate-ping"
          style={{
            left: `${dot.x}%`,
            top: `${dot.y}%`,
            width: dot.size,
            height: dot.size,
            backgroundColor: PALETTE_VIBRANT[dot.id % PALETTE_VIBRANT.length],
            animationDelay: `${dot.delay}s`,
            animationDuration: '1s',
            opacity: 0.8,
          }}
        />
      ))}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Confetti canvas
// ---------------------------------------------------------------------------

function ConfettiCanvas({
  particleCount,
  palette,
  durationMs,
  active,
}: {
  particleCount: number;
  palette: string[];
  durationMs: number;
  active: boolean;
}) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const particlesRef = useRef<Particle[]>([]);
  const rafRef = useRef<number>(0);
  const startTimeRef = useRef<number>(0);

  useEffect(() => {
    if (!active || particleCount === 0) return;

    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const resize = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    };
    resize();
    window.addEventListener('resize', resize);

    const spawnX = canvas.width / 2;
    particlesRef.current = Array.from({ length: particleCount }, () => ({
      x: spawnX + (Math.random() - 0.5) * canvas.width * 0.3,
      y: -10 - Math.random() * 40,
      vx: (Math.random() - 0.5) * 8,
      vy: 2 + Math.random() * 6,
      size: 4 + Math.random() * 8,
      color: palette[Math.floor(Math.random() * palette.length)],
      rotation: Math.random() * Math.PI * 2,
      rotationSpeed: (Math.random() - 0.5) * 0.2,
      opacity: 1,
      shape: Math.random() > 0.5 ? 'rect' : 'circle',
    }));

    startTimeRef.current = performance.now();

    const animate = (now: number) => {
      const elapsed = now - startTimeRef.current;
      const progress = elapsed / durationMs;

      if (progress >= 1) {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        return;
      }

      ctx.clearRect(0, 0, canvas.width, canvas.height);
      const fadeMultiplier =
        progress > FADE_START_RATIO
          ? 1 - (progress - FADE_START_RATIO) / (1 - FADE_START_RATIO)
          : 1;

      for (const p of particlesRef.current) {
        p.vy += GRAVITY;
        p.x += p.vx;
        p.y += p.vy;
        p.rotation += p.rotationSpeed;
        p.vx *= 0.995;
        p.opacity = fadeMultiplier;

        ctx.save();
        ctx.translate(p.x, p.y);
        ctx.rotate(p.rotation);
        ctx.globalAlpha = Math.max(0, p.opacity);
        ctx.fillStyle = p.color;

        if (p.shape === 'rect') {
          ctx.fillRect(-p.size / 2, -p.size / 2, p.size, p.size * 0.6);
        } else {
          ctx.beginPath();
          ctx.arc(0, 0, p.size / 2, 0, Math.PI * 2);
          ctx.fill();
        }

        ctx.restore();
      }

      rafRef.current = requestAnimationFrame(animate);
    };

    rafRef.current = requestAnimationFrame(animate);

    return () => {
      cancelAnimationFrame(rafRef.current);
      window.removeEventListener('resize', resize);
      if (canvas) {
        const c = canvas.getContext('2d');
        c?.clearRect(0, 0, canvas.width, canvas.height);
      }
    };
  }, [active, particleCount, palette, durationMs]);

  if (!active || particleCount === 0) return null;

  return (
    <canvas
      ref={canvasRef}
      className="fixed inset-0 pointer-events-none z-[9999]"
      style={{ width: '100vw', height: '100vh' }}
    />
  );
}

// ---------------------------------------------------------------------------
// Overlay text (deal_closed pulsing text)
// ---------------------------------------------------------------------------

function OverlayText({ text, active }: { text: string; active: boolean }) {
  const [show, setShow] = useState(false);

  useEffect(() => {
    if (active) {
      setShow(true);
      const timer = setTimeout(() => setShow(false), 2500);
      return () => clearTimeout(timer);
    }
    setShow(false);
  }, [active]);

  if (!show) return null;

  return (
    <div className="fixed inset-0 pointer-events-none z-[10000] flex items-center justify-center">
      <span
        className="text-5xl sm:text-7xl font-black tracking-wider text-white drop-shadow-[0_4px_24px_rgba(255,215,0,0.6)] select-none"
        style={{
          animation: 'celebration-pulse 0.6s ease-in-out infinite alternate',
        }}
      >
        {text}
      </span>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Celebration banner (toast)
// ---------------------------------------------------------------------------

function CelebrationBanner({ banner, onDismiss }: { banner: BannerState; onDismiss: () => void }) {
  const [mounted, setMounted] = useState(false);
  const timerRef = useRef<ReturnType<typeof setTimeout>>();

  useEffect(() => {
    if (banner.visible) {
      requestAnimationFrame(() => setMounted(true));
      timerRef.current = setTimeout(() => {
        setMounted(false);
        setTimeout(onDismiss, 400);
      }, BANNER_DISMISS_MS);
    }
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, [banner.visible, onDismiss]);

  if (!banner.visible) return null;

  const Icon = banner.icon;

  return (
    <div
      className={`
        fixed top-6 left-1/2 z-[10001] w-[90vw] max-w-md
        transition-all duration-500
        ${mounted ? 'translate-y-0 opacity-100 scale-100' : '-translate-y-16 opacity-0 scale-90'}
      `}
      style={{
        transform: `translateX(-50%) ${mounted ? 'translateY(0)' : 'translateY(-4rem)'}`,
        transitionTimingFunction: 'cubic-bezier(0.34, 1.56, 0.64, 1)',
      }}
    >
      <div
        className={`
          bg-gradient-to-r ${banner.gradient}
          rounded-xl shadow-2xl px-6 py-4 flex items-center gap-4
          border border-white/20
        `}
      >
        <div className="flex-shrink-0 bg-white/20 rounded-lg p-2">
          <Icon className="w-6 h-6 text-white" />
        </div>
        <div className="min-w-0">
          <p className="text-white font-bold text-lg leading-tight truncate">{banner.title}</p>
          {banner.subtitle && (
            <p className="text-white/80 text-sm leading-snug truncate">{banner.subtitle}</p>
          )}
        </div>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Keyframes (injected once)
// ---------------------------------------------------------------------------

let stylesInjected = false;
function injectKeyframes() {
  if (stylesInjected) return;
  stylesInjected = true;
  const style = document.createElement('style');
  style.textContent = `
    @keyframes celebration-pulse {
      0% { transform: scale(1); opacity: 1; }
      100% { transform: scale(1.08); opacity: 0.85; }
    }
  `;
  document.head.appendChild(style);
}

// ---------------------------------------------------------------------------
// Provider
// ---------------------------------------------------------------------------

export function CelebrationProvider({ children }: { children: ReactNode }) {
  const [confettiState, setConfettiState] = useState<{
    active: boolean;
    particleCount: number;
    palette: string[];
    durationMs: number;
  }>({ active: false, particleCount: 0, palette: [], durationMs: 3000 });

  const [overlayText, setOverlayText] = useState<{ active: boolean; text: string }>({
    active: false,
    text: '',
  });

  const [sparkleActive, setSparkleActive] = useState(false);

  const [banner, setBanner] = useState<BannerState>({
    visible: false,
    type: 'task_complete',
    title: '',
    subtitle: '',
    icon: CheckCircle2,
    gradient: '',
  });

  const confettiTimerRef = useRef<ReturnType<typeof setTimeout>>();

  useEffect(() => {
    injectKeyframes();
  }, []);

  const dismissBanner = useCallback(() => {
    setBanner((prev) => ({ ...prev, visible: false }));
  }, []);

  const celebrate = useCallback((type: CelebrationType, message?: string) => {
    const config = CELEBRATION_CONFIGS[type];

    if (confettiTimerRef.current) clearTimeout(confettiTimerRef.current);

    if (type === 'task_complete') {
      setSparkleActive(false);
      requestAnimationFrame(() => setSparkleActive(true));
    } else {
      setConfettiState({
        active: true,
        particleCount: config.particleCount,
        palette: config.palette,
        durationMs: config.durationMs,
      });

      confettiTimerRef.current = setTimeout(() => {
        setConfettiState((prev) => ({ ...prev, active: false }));
      }, config.durationMs + 100);
    }

    if (config.showOverlayText) {
      setOverlayText({ active: true, text: config.title });
      setTimeout(() => setOverlayText({ active: false, text: '' }), 3000);
    }

    setBanner({
      visible: true,
      type,
      title: message ?? config.title,
      subtitle: message ? config.title : '',
      icon: config.icon,
      gradient: config.gradient,
    });
  }, []);

  useEffect(() => {
    return () => {
      if (confettiTimerRef.current) clearTimeout(confettiTimerRef.current);
    };
  }, []);

  return (
    <CelebrationContext.Provider value={{ celebrate }}>
      {children}
      <ConfettiCanvas
        particleCount={confettiState.particleCount}
        palette={confettiState.palette}
        durationMs={confettiState.durationMs}
        active={confettiState.active}
      />
      <SparkleOverlay active={sparkleActive} />
      <OverlayText text={overlayText.text} active={overlayText.active} />
      <CelebrationBanner banner={banner} onDismiss={dismissBanner} />
    </CelebrationContext.Provider>
  );
}
