// ============================================================================
// ModuleGate — Conditionally render children based on module access
// ============================================================================

import { type ReactNode } from 'react';
import { useModuleAccess } from '../hooks/useModuleAccess';
import { useFeatureFlag } from '../hooks/useFeatureFlag';
import type { ModuleSlug } from '../types';

export interface ModuleGateProps {
  orgId: string | null;
  module: ModuleSlug;
  children: ReactNode;
  fallback?: ReactNode;
  loadingFallback?: ReactNode;
}

export function ModuleGate({
  orgId,
  module,
  children,
  fallback = null,
  loadingFallback = null,
}: ModuleGateProps) {
  const { hasAccess, loading } = useModuleAccess(orgId, module);

  if (loading) return <>{loadingFallback}</>;
  if (!hasAccess) return <>{fallback}</>;
  return <>{children}</>;
}

export interface FeatureGateProps {
  orgId: string | null;
  feature: string;
  children: ReactNode;
  fallback?: ReactNode;
  loadingFallback?: ReactNode;
}

export function FeatureGate({
  orgId,
  feature,
  children,
  fallback = null,
  loadingFallback = null,
}: FeatureGateProps) {
  const { enabled, loading } = useFeatureFlag(orgId, feature);

  if (loading) return <>{loadingFallback}</>;
  if (!enabled) return <>{fallback}</>;
  return <>{children}</>;
}
