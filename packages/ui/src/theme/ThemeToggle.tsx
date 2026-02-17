import React from 'react';
import { Sun, Moon } from 'lucide-react';
import { useTheme } from './ThemeProvider';
import { cn } from '../utils';
import type { Theme } from './ThemeProvider';

export interface ThemeToggleProps {
  className?: string;
  showLabel?: boolean;
  size?: 'sm' | 'md' | 'lg';
}

const nextTheme: Record<Theme, Theme> = {
  light: 'dark',
  dark: 'light',
  system: 'light',
};

const themeLabel: Record<Theme, string> = {
  light: 'Light',
  dark: 'Dark',
  system: 'Light',
};

const themeIcon: Record<Theme, React.ElementType> = {
  light: Sun,
  dark: Moon,
  system: Sun,
};

const sizeClasses = {
  sm: 'p-1.5',
  md: 'p-2',
  lg: 'p-2.5',
};

const iconSizes = {
  sm: 'w-4 h-4',
  md: 'w-5 h-5',
  lg: 'w-6 h-6',
};

export function ThemeToggle({ className, showLabel = false, size = 'md' }: ThemeToggleProps) {
  const { theme, setTheme } = useTheme();
  const Icon = themeIcon[theme];

  return (
    <button
      onClick={() => setTheme(nextTheme[theme])}
      className={cn(
        'inline-flex items-center gap-2 rounded-lg transition-all duration-200',
        'text-th-text-secondary hover:text-th-text-primary',
        'hover:bg-surface-tertiary active:scale-95',
        'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-th-accent-500',
        sizeClasses[size],
        className
      )}
      title={`Theme: ${themeLabel[theme]}`}
      aria-label={`Switch to ${themeLabel[nextTheme[theme]]} theme`}
    >
      <Icon className={cn(iconSizes[size], 'transition-transform duration-200')} />
      {showLabel && (
        <span className="text-sm font-medium">{themeLabel[theme]}</span>
      )}
    </button>
  );
}
