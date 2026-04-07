import { useState, useEffect, useRef, useCallback } from 'react';
import toast from 'react-hot-toast';
import {
  Trophy,
  Star,
  Flame,
  Zap,
  Target,
  Phone,
  Mail,
  CheckSquare,
  TrendingUp,
  Users,
  Award,
  Crown,
  Sparkles,
  Medal,
  type LucideIcon,
} from 'lucide-react';

// ── Icon mapping ───────────────────────────────────────────────────────────

const ICON_MAP: Record<string, LucideIcon> = {
  trophy: Trophy,
  star: Star,
  flame: Flame,
  zap: Zap,
  target: Target,
  phone: Phone,
  mail: Mail,
  check: CheckSquare,
  trending: TrendingUp,
  users: Users,
  award: Award,
  crown: Crown,
  sparkles: Sparkles,
  medal: Medal,
};

function resolveIcon(icon: string): LucideIcon {
  const key = icon.toLowerCase().replace(/[-_\s]/g, '');
  for (const [mapKey, Component] of Object.entries(ICON_MAP)) {
    if (key.includes(mapKey)) return Component;
  }
  return Trophy;
}

// ── Rarity styles ──────────────────────────────────────────────────────────

interface RarityStyle {
  border: string;
  glow: string;
  badge: string;
  badgeText: string;
}

const RARITY_STYLES: Record<string, RarityStyle> = {
  common: {
    border: 'border-zinc-400/40',
    glow: 'shadow-md',
    badge: 'bg-zinc-100 dark:bg-zinc-700',
    badgeText: 'text-zinc-600 dark:text-zinc-300',
  },
  uncommon: {
    border: 'border-emerald-400/60',
    glow: 'shadow-emerald-500/20 shadow-lg',
    badge: 'bg-emerald-100 dark:bg-emerald-900/40',
    badgeText: 'text-emerald-700 dark:text-emerald-300',
  },
  rare: {
    border: 'border-blue-400/60',
    glow: 'shadow-blue-500/25 shadow-lg',
    badge: 'bg-blue-100 dark:bg-blue-900/40',
    badgeText: 'text-blue-700 dark:text-blue-300',
  },
  legendary: {
    border: 'border-amber-400/80',
    glow: 'shadow-amber-500/30 shadow-xl',
    badge: 'bg-amber-100 dark:bg-amber-900/40',
    badgeText: 'text-amber-700 dark:text-amber-300',
  },
};

function getRarityStyle(rarity: string): RarityStyle {
  return RARITY_STYLES[rarity] ?? RARITY_STYLES.common;
}

// ── Confetti particles for legendary ───────────────────────────────────────

const LEGENDARY_COLORS = ['#FFD700', '#FFA500', '#FF6347', '#FFE066', '#FFC107'];

function LegendaryParticles() {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    canvas.width = 360;
    canvas.height = 100;

    interface MiniParticle {
      x: number;
      y: number;
      vx: number;
      vy: number;
      size: number;
      color: string;
      life: number;
      maxLife: number;
    }

    const particles: MiniParticle[] = Array.from({ length: 24 }, () => ({
      x: Math.random() * canvas.width,
      y: canvas.height + 5,
      vx: (Math.random() - 0.5) * 2,
      vy: -(1.5 + Math.random() * 2.5),
      size: 2 + Math.random() * 3,
      color: LEGENDARY_COLORS[Math.floor(Math.random() * LEGENDARY_COLORS.length)],
      life: 0,
      maxLife: 40 + Math.random() * 30,
    }));

    let raf: number;
    const animate = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      let alive = false;

      for (const p of particles) {
        p.life++;
        if (p.life >= p.maxLife) continue;
        alive = true;

        p.x += p.vx;
        p.y += p.vy;
        p.vy += 0.04;
        const alpha = 1 - p.life / p.maxLife;

        ctx.globalAlpha = alpha;
        ctx.fillStyle = p.color;
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
        ctx.fill();
      }

      ctx.globalAlpha = 1;
      if (alive) raf = requestAnimationFrame(animate);
    };

    raf = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(raf);
  }, []);

  return (
    <canvas
      ref={canvasRef}
      className="absolute inset-0 pointer-events-none"
      style={{ width: '100%', height: '100%' }}
    />
  );
}

// ── Toast inner component ──────────────────────────────────────────────────

interface AchievementToastProps {
  achievement: {
    name: string;
    description: string;
    icon: string;
    xp_reward: number;
    rarity: string;
  };
  visible: boolean;
  onDismiss: () => void;
}

function AchievementToastInner({ achievement, visible, onDismiss }: AchievementToastProps) {
  const [mounted, setMounted] = useState(false);
  const style = getRarityStyle(achievement.rarity);
  const Icon = resolveIcon(achievement.icon);
  const isLegendary = achievement.rarity === 'legendary';

  useEffect(() => {
    if (visible) {
      requestAnimationFrame(() => setMounted(true));
    }
  }, [visible]);

  return (
    <div
      role="alert"
      onClick={onDismiss}
      className={`
        relative overflow-hidden cursor-pointer
        max-w-sm w-full bg-white dark:bg-zinc-800
        rounded-xl border-2 ${style.border} ${style.glow}
        transition-all duration-500 ease-out
        ${mounted && visible
          ? 'translate-x-0 opacity-100 scale-100'
          : 'translate-x-12 opacity-0 scale-95'
        }
      `}
    >
      {isLegendary && <LegendaryParticles />}

      {isLegendary && (
        <div
          className="absolute inset-0 pointer-events-none rounded-xl"
          style={{
            background: 'linear-gradient(135deg, transparent 30%, rgba(255,215,0,0.08) 50%, transparent 70%)',
            animation: 'achievement-shimmer 2s ease-in-out infinite',
          }}
        />
      )}

      <div className="relative flex items-center gap-3 p-4">
        <div
          className={`
            flex-shrink-0 w-11 h-11 rounded-lg flex items-center justify-center
            ${isLegendary
              ? 'bg-gradient-to-br from-amber-400 to-yellow-500'
              : achievement.rarity === 'rare'
                ? 'bg-gradient-to-br from-blue-400 to-indigo-500'
                : achievement.rarity === 'uncommon'
                  ? 'bg-gradient-to-br from-emerald-400 to-green-500'
                  : 'bg-zinc-200 dark:bg-zinc-600'
            }
          `}
        >
          <Icon className="w-5 h-5 text-white" />
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-0.5">
            <span className="text-xs font-medium tracking-wide uppercase text-zinc-400 dark:text-zinc-500">
              Achievement Unlocked
            </span>
            <span className={`text-[10px] font-bold uppercase px-1.5 py-0.5 rounded ${style.badge} ${style.badgeText}`}>
              {achievement.rarity}
            </span>
          </div>
          <p className="font-bold text-sm text-zinc-900 dark:text-zinc-100 truncate">
            {achievement.name}
          </p>
          <p className="text-xs text-zinc-500 dark:text-zinc-400 truncate">
            {achievement.description}
          </p>
        </div>

        <div className="flex-shrink-0 text-right">
          <span className="text-sm font-bold text-amber-600 dark:text-amber-400">
            +{achievement.xp_reward}
          </span>
          <span className="text-xs text-amber-600/70 dark:text-amber-400/70 ml-0.5">
            XP
          </span>
        </div>
      </div>
    </div>
  );
}

// ── Inject keyframes once ──────────────────────────────────────────────────

let achievementStylesInjected = false;
function injectAchievementStyles() {
  if (achievementStylesInjected) return;
  achievementStylesInjected = true;
  const style = document.createElement('style');
  style.textContent = `
    @keyframes achievement-shimmer {
      0%, 100% { opacity: 0; transform: translateX(-100%); }
      50% { opacity: 1; transform: translateX(100%); }
    }
  `;
  document.head.appendChild(style);
}

// ── Public API: showAchievementToast ───────────────────────────────────────

export function showAchievementToast(achievement: {
  name: string;
  description: string;
  icon: string;
  xp_reward: number;
  rarity: string;
}): void {
  injectAchievementStyles();

  toast.custom(
    (t) => (
      <AchievementToastInner
        achievement={achievement}
        visible={t.visible}
        onDismiss={() => toast.dismiss(t.id)}
      />
    ),
    {
      duration: 5000,
      position: 'top-right',
    },
  );
}

// ── Inline banner component ────────────────────────────────────────────────

interface AchievementUnlockedBannerProps {
  achievement: {
    name: string;
    description: string;
    icon: string;
    xp_reward: number;
    rarity: string;
  } | null;
  onDismiss?: () => void;
}

export function AchievementUnlockedBanner({ achievement, onDismiss }: AchievementUnlockedBannerProps) {
  const [visible, setVisible] = useState(false);
  const [particles, setParticles] = useState<
    { id: number; x: number; delay: number; color: string; size: number }[]
  >([]);
  const timerRef = useRef<ReturnType<typeof setTimeout>>();

  const dismiss = useCallback(() => {
    setVisible(false);
    setTimeout(() => onDismiss?.(), 500);
  }, [onDismiss]);

  useEffect(() => {
    if (!achievement) {
      setVisible(false);
      return;
    }

    injectAchievementStyles();
    requestAnimationFrame(() => setVisible(true));

    const confettiDots = Array.from({ length: 20 }, (_, i) => ({
      id: i,
      x: Math.random() * 100,
      delay: Math.random() * 0.8,
      color: LEGENDARY_COLORS[i % LEGENDARY_COLORS.length],
      size: 4 + Math.random() * 4,
    }));
    setParticles(confettiDots);

    timerRef.current = setTimeout(dismiss, 8000);

    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, [achievement, dismiss]);

  if (!achievement) return null;

  const style = getRarityStyle(achievement.rarity);
  const Icon = resolveIcon(achievement.icon);
  const isLegendary = achievement.rarity === 'legendary';

  return (
    <div
      role="alert"
      onClick={dismiss}
      className={`
        relative w-full overflow-hidden cursor-pointer
        rounded-xl border-2 ${style.border} ${style.glow}
        bg-white dark:bg-zinc-800
        transition-all duration-700 ease-out
        ${visible
          ? 'opacity-100 scale-100 translate-y-0'
          : 'opacity-0 scale-95 -translate-y-2'
        }
      `}
    >
      {particles.length > 0 && (
        <div className="absolute inset-0 pointer-events-none overflow-hidden">
          {particles.map((p) => (
            <span
              key={p.id}
              className="absolute rounded-full animate-ping"
              style={{
                left: `${p.x}%`,
                top: `${10 + Math.random() * 40}%`,
                width: p.size,
                height: p.size,
                backgroundColor: p.color,
                animationDelay: `${p.delay}s`,
                animationDuration: '1.2s',
                opacity: 0.6,
              }}
            />
          ))}
        </div>
      )}

      {isLegendary && (
        <div
          className="absolute inset-0 pointer-events-none"
          style={{
            background: 'linear-gradient(135deg, transparent 30%, rgba(255,215,0,0.06) 50%, transparent 70%)',
            animation: 'achievement-shimmer 2.5s ease-in-out infinite',
          }}
        />
      )}

      <div className="relative flex items-center gap-4 px-5 py-4">
        <div
          className={`
            flex-shrink-0 w-14 h-14 rounded-xl flex items-center justify-center
            ${isLegendary
              ? 'bg-gradient-to-br from-amber-400 to-yellow-500 shadow-amber-400/30 shadow-lg'
              : achievement.rarity === 'rare'
                ? 'bg-gradient-to-br from-blue-400 to-indigo-500 shadow-blue-400/20 shadow-md'
                : achievement.rarity === 'uncommon'
                  ? 'bg-gradient-to-br from-emerald-400 to-green-500 shadow-emerald-400/20 shadow-md'
                  : 'bg-zinc-200 dark:bg-zinc-600'
            }
          `}
        >
          <Icon className="w-7 h-7 text-white" />
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <Sparkles className="w-3.5 h-3.5 text-amber-500" />
            <span className="text-xs font-semibold tracking-wider uppercase text-amber-600 dark:text-amber-400">
              Achievement Unlocked
            </span>
            <span className={`text-[10px] font-bold uppercase px-1.5 py-0.5 rounded ${style.badge} ${style.badgeText}`}>
              {achievement.rarity}
            </span>
          </div>
          <p className="font-bold text-base text-zinc-900 dark:text-zinc-100">
            {achievement.name}
          </p>
          <p className="text-sm text-zinc-500 dark:text-zinc-400 mt-0.5">
            {achievement.description}
          </p>
        </div>

        <div className="flex-shrink-0 text-center">
          <div className="text-xl font-extrabold text-amber-600 dark:text-amber-400">
            +{achievement.xp_reward}
          </div>
          <div className="text-xs font-medium text-amber-600/70 dark:text-amber-400/70">
            XP
          </div>
        </div>
      </div>
    </div>
  );
}
