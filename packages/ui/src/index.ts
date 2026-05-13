// Brand (hostname-aware ARYX/MPB switching — Phase 1.5)
export { detectBrand, applyBrandClass, initBrand, getBrandLogo } from './brand';
export type { Brand, InitBrandOptions } from './brand';

// UI Components
export { Button } from './components/Button';
export type { ButtonProps } from './components/Button';

export { Input } from './components/Input';
export type { InputProps } from './components/Input';

export { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from './components/Card';

export { Badge } from './components/Badge';
export type { BadgeProps } from './components/Badge';

export { Checkbox } from './components/Checkbox';
export type { CheckboxProps } from './components/Checkbox';

export { Label } from './components/Label';
export type { LabelProps } from './components/Label';

export { Select } from './components/Select';
export type { SelectProps } from './components/Select';

export { Textarea } from './components/Textarea';
export type { TextareaProps } from './components/Textarea';

export { TooltipProvider, Tooltip, TooltipTrigger, TooltipContent } from './components/Tooltip';

export { Separator } from './components/Separator';
export type { SeparatorProps } from './components/Separator';

export { Accordion, AccordionItem, AccordionTrigger, AccordionContent } from './components/Accordion';

// Login
export { LoginLayout } from './components/LoginLayout';
export type { LoginLayoutProps } from './components/LoginLayout';

export { GradientHeader } from './components/GradientHeader';
export type { GradientHeaderProps } from './components/GradientHeader';

export { MetricCard } from './components/MetricCard';
export type { MetricCardProps } from './components/MetricCard';

export { InfoTip } from './components/InfoTip';
export type { InfoTipProps } from './components/InfoTip';

export { StatusDot } from './components/StatusDot';
export type { StatusDotProps } from './components/StatusDot';

export { SkeletonLine, SkeletonAvatar, SkeletonMetric, SkeletonCard, SkeletonTable } from './components/Skeleton';
export type { SkeletonLineProps, SkeletonAvatarProps, SkeletonMetricProps, SkeletonCardProps, SkeletonTableProps } from './components/Skeleton';

export { AppLayout } from './components/AppLayout';
export type { AppLayoutProps, NavItem, NavLinkRenderProps, ChildNavLinkRenderProps } from './components/AppLayout';

export { Breadcrumbs } from './components/Breadcrumbs';
export type { BreadcrumbsProps, BreadcrumbItem } from './components/Breadcrumbs';

export { PortalSwitcher } from './components/PortalSwitcher';
export type { PortalSwitcherProps, PortalKey } from './components/PortalSwitcher';

// Theme
export { ThemeProvider, useTheme } from './theme';
export type { Theme, ResolvedTheme, ThemeContextType, ThemeProviderProps } from './theme';

export { ThemeToggle } from './theme';
export type { ThemeToggleProps } from './theme';

export { useChartTheme } from './theme';
export type { ChartTheme } from './theme';

// Utilities
export { cn } from './utils';
