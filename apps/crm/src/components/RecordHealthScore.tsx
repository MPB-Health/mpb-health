// ============================================================================
// Record Health Score Component
// Visual display of record health with score breakdown
// ============================================================================

import { useState } from 'react';
import {
  Activity,
  ChevronDown,
  ChevronUp,
  AlertCircle,
  CheckCircle2,
  AlertTriangle,
  Lightbulb,
  Info,
} from 'lucide-react';
import type { HealthScoreResult, HealthScoreFactor } from '../utils/recordHealthScore';

const cn = (...classes: (string | boolean | undefined | null)[]) =>
  classes.filter(Boolean).join(' ');

// ============================================================================
// Types
// ============================================================================

interface RecordHealthScoreProps {
  healthScore: HealthScoreResult;
  variant?: 'compact' | 'full' | 'badge';
  showSuggestions?: boolean;
  className?: string;
}

// ============================================================================
// Color Utilities
// ============================================================================

const scoreColors = {
  green: {
    bg: 'bg-green-100 dark:bg-green-900/30',
    text: 'text-green-700 dark:text-green-400',
    border: 'border-green-200 dark:border-green-800',
    ring: 'ring-green-500',
    progress: 'bg-green-500',
  },
  lime: {
    bg: 'bg-lime-100 dark:bg-lime-900/30',
    text: 'text-lime-700 dark:text-lime-400',
    border: 'border-lime-200 dark:border-lime-800',
    ring: 'ring-lime-500',
    progress: 'bg-lime-500',
  },
  yellow: {
    bg: 'bg-yellow-100 dark:bg-yellow-900/30',
    text: 'text-yellow-700 dark:text-yellow-400',
    border: 'border-yellow-200 dark:border-yellow-800',
    ring: 'ring-yellow-500',
    progress: 'bg-yellow-500',
  },
  orange: {
    bg: 'bg-orange-100 dark:bg-orange-900/30',
    text: 'text-orange-700 dark:text-orange-400',
    border: 'border-orange-200 dark:border-orange-800',
    ring: 'ring-orange-500',
    progress: 'bg-orange-500',
  },
  red: {
    bg: 'bg-red-100 dark:bg-red-900/30',
    text: 'text-red-700 dark:text-red-400',
    border: 'border-red-200 dark:border-red-800',
    ring: 'ring-red-500',
    progress: 'bg-red-500',
  },
};

// ============================================================================
// Badge Variant (Minimal)
// ============================================================================

function HealthScoreBadge({ healthScore }: { healthScore: HealthScoreResult }) {
  const colors = scoreColors[healthScore.color];

  return (
    <div
      className={cn(
        'inline-flex items-center gap-1.5 px-2 py-1 rounded-full text-xs font-medium',
        colors.bg,
        colors.text
      )}
      title={`Health Score: ${healthScore.score}/100 (${healthScore.grade})`}
    >
      <Activity className="w-3 h-3" />
      <span>{healthScore.score}</span>
    </div>
  );
}

// ============================================================================
// Compact Variant
// ============================================================================

function HealthScoreCompact({ healthScore }: { healthScore: HealthScoreResult }) {
  const colors = scoreColors[healthScore.color];
  const [expanded, setExpanded] = useState(false);

  return (
    <div className={cn('border rounded-lg', colors.border)}>
      {/* Header */}
      <button
        onClick={() => setExpanded(!expanded)}
        className="w-full flex items-center justify-between p-3 text-left"
      >
        <div className="flex items-center gap-3">
          {/* Score Circle */}
          <div
            className={cn(
              'w-12 h-12 rounded-full flex items-center justify-center font-bold text-lg',
              colors.bg,
              colors.text
            )}
          >
            {healthScore.score}
          </div>
          <div>
            <p className="font-medium text-th-text-primary">
              Health Score
            </p>
            <p className="text-sm text-th-text-secondary">
              Grade: {healthScore.grade}
            </p>
          </div>
        </div>
        {expanded ? (
          <ChevronUp className="w-5 h-5 text-th-text-tertiary" />
        ) : (
          <ChevronDown className="w-5 h-5 text-th-text-tertiary" />
        )}
      </button>

      {/* Expanded Details */}
      {expanded && (
        <div className="border-t border-th-border p-3 space-y-3">
          {/* Factors */}
          <div className="space-y-2">
            {healthScore.factors.map((factor) => (
              <FactorRow key={factor.id} factor={factor} />
            ))}
          </div>

          {/* Suggestions */}
          {healthScore.suggestions.length > 0 && (
            <div className="pt-3 border-t border-th-border">
              <div className="flex items-center gap-2 text-sm font-medium text-th-text-primary mb-2">
                <Lightbulb className="w-4 h-4 text-yellow-500" />
                Suggestions
              </div>
              <ul className="space-y-1">
                {healthScore.suggestions.map((suggestion, i) => (
                  <li
                    key={i}
                    className="text-sm text-th-text-secondary flex items-start gap-2"
                  >
                    <span className="text-yellow-500 mt-0.5">•</span>
                    {suggestion}
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// ============================================================================
// Full Variant
// ============================================================================

function HealthScoreFull({ healthScore, showSuggestions = true }: { healthScore: HealthScoreResult; showSuggestions?: boolean }) {
  const colors = scoreColors[healthScore.color];

  return (
    <div className="space-y-4">
      {/* Score Header */}
      <div className="flex items-center gap-4">
        {/* Score Circle */}
        <div className="relative">
          <svg className="w-20 h-20 -rotate-90">
            <circle
              cx="40"
              cy="40"
              r="36"
              stroke="currentColor"
              strokeWidth="8"
              fill="none"
              className="text-th-border"
            />
            <circle
              cx="40"
              cy="40"
              r="36"
              stroke="currentColor"
              strokeWidth="8"
              fill="none"
              strokeDasharray={`${(healthScore.score / 100) * 226} 226`}
              strokeLinecap="round"
              className={colors.text}
            />
          </svg>
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <span className={cn('text-2xl font-bold', colors.text)}>
              {healthScore.score}
            </span>
          </div>
        </div>

        {/* Grade & Summary */}
        <div>
          <div className="flex items-center gap-2">
            <span className="text-2xl font-bold text-th-text-primary">
              Grade: {healthScore.grade}
            </span>
            <span className={cn('px-2 py-0.5 rounded text-sm font-medium', colors.bg, colors.text)}>
              {getGradeLabel(healthScore.grade)}
            </span>
          </div>
          <p className="text-sm text-th-text-secondary mt-1">
            {getGradeDescription(healthScore.score)}
          </p>
        </div>
      </div>

      {/* Factors Breakdown */}
      <div className="space-y-3">
        <h4 className="text-sm font-medium text-th-text-primary flex items-center gap-2">
          <Info className="w-4 h-4" />
          Score Breakdown
        </h4>
        <div className="space-y-2">
          {healthScore.factors.map((factor) => (
            <FactorRow key={factor.id} factor={factor} showWeight />
          ))}
        </div>
      </div>

      {/* Suggestions */}
      {showSuggestions && healthScore.suggestions.length > 0 && (
        <div className="p-4 bg-yellow-50 dark:bg-yellow-900/20 rounded-lg border border-yellow-200 dark:border-yellow-800">
          <div className="flex items-center gap-2 font-medium text-yellow-800 dark:text-yellow-200 mb-2">
            <Lightbulb className="w-4 h-4" />
            Improve Your Score
          </div>
          <ul className="space-y-2">
            {healthScore.suggestions.map((suggestion, i) => (
              <li
                key={i}
                className="text-sm text-yellow-700 dark:text-yellow-300 flex items-start gap-2"
              >
                <span className="font-bold">{i + 1}.</span>
                {suggestion}
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}

// ============================================================================
// Factor Row Component
// ============================================================================

function FactorRow({ factor, showWeight = false }: { factor: HealthScoreFactor; showWeight?: boolean }) {
  const StatusIcon = factor.status === 'good'
    ? CheckCircle2
    : factor.status === 'warning'
    ? AlertTriangle
    : AlertCircle;

  const statusColors = {
    good: 'text-green-500',
    warning: 'text-yellow-500',
    critical: 'text-red-500',
  };

  return (
    <div className="flex items-center gap-3">
      <StatusIcon className={cn('w-4 h-4 flex-shrink-0', statusColors[factor.status])} />
      <div className="flex-1 min-w-0">
        <div className="flex items-center justify-between text-sm">
          <span className="text-th-text-primary truncate">
            {factor.label}
            {showWeight && (
              <span className="text-th-text-tertiary ml-1">({factor.weight}%)</span>
            )}
          </span>
          <span className="text-th-text-secondary ml-2">
            {factor.score}%
          </span>
        </div>
        {factor.detail && (
          <p className="text-xs text-th-text-secondary truncate">{factor.detail}</p>
        )}
        {/* Progress bar */}
        <div className="mt-1 h-1 bg-surface-tertiary rounded-full overflow-hidden">
          <div
            className={cn(
              'h-full rounded-full transition-all',
              factor.status === 'good'
                ? 'bg-green-500'
                : factor.status === 'warning'
                ? 'bg-yellow-500'
                : 'bg-red-500'
            )}
            style={{ width: `${factor.score}%` }}
          />
        </div>
      </div>
    </div>
  );
}

// ============================================================================
// Main Component
// ============================================================================

export function RecordHealthScore({
  healthScore,
  variant = 'compact',
  showSuggestions = true,
  className,
}: RecordHealthScoreProps) {
  if (variant === 'badge') {
    return <HealthScoreBadge healthScore={healthScore} />;
  }

  if (variant === 'full') {
    return (
      <div className={className}>
        <HealthScoreFull healthScore={healthScore} showSuggestions={showSuggestions} />
      </div>
    );
  }

  return (
    <div className={className}>
      <HealthScoreCompact healthScore={healthScore} />
    </div>
  );
}

// ============================================================================
// Helper Functions
// ============================================================================

function getGradeLabel(grade: string): string {
  const labels: Record<string, string> = {
    A: 'Excellent',
    B: 'Good',
    C: 'Fair',
    D: 'Poor',
    F: 'Critical',
  };
  return labels[grade] || 'Unknown';
}

function getGradeDescription(score: number): string {
  if (score >= 90) return 'This record has excellent data quality';
  if (score >= 80) return 'This record is in good shape with minor improvements possible';
  if (score >= 60) return 'Some improvements needed to maximize effectiveness';
  if (score >= 40) return 'Significant data gaps affecting record usefulness';
  return 'Critical issues need attention immediately';
}

export default RecordHealthScore;
