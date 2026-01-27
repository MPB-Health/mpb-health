import { useTheme } from './ThemeProvider';

export interface ChartTheme {
  gridColor: string;
  textColor: string;
  tooltipBg: string;
  tooltipText: string;
  tooltipBorder: string;
  axisColor: string;
  cursorColor: string;
  colors: string[];
}

const lightChartTheme: ChartTheme = {
  gridColor: '#e2e8f0',
  textColor: '#64748b',
  tooltipBg: '#ffffff',
  tooltipText: '#0f172a',
  tooltipBorder: '#e2e8f0',
  axisColor: '#cbd5e1',
  cursorColor: '#94a3b8',
  colors: [
    '#8b5cf6', '#3b82f6', '#14b8a6', '#f59e0b',
    '#ef4444', '#ec4899', '#06b6d4', '#84cc16',
  ],
};

const darkChartTheme: ChartTheme = {
  gridColor: '#334155',
  textColor: '#94a3b8',
  tooltipBg: '#1e293b',
  tooltipText: '#f1f5f9',
  tooltipBorder: '#475569',
  axisColor: '#475569',
  cursorColor: '#475569',
  colors: [
    '#a78bfa', '#60a5fa', '#2dd4bf', '#fbbf24',
    '#f87171', '#f472b6', '#22d3ee', '#a3e635',
  ],
};

export function useChartTheme(): ChartTheme {
  const { resolvedTheme } = useTheme();
  return resolvedTheme === 'dark' ? darkChartTheme : lightChartTheme;
}
