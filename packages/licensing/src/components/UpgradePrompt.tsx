// ============================================================================
// UpgradePrompt — Shown when a user tries to access a gated module/feature
// ============================================================================

import type { ReactNode } from 'react';
import type { ProductModule } from '../types';

export interface UpgradePromptProps {
  module?: ProductModule | null;
  featureName?: string;
  onUpgrade?: () => void;
  children?: ReactNode;
}

export function UpgradePrompt({ module, featureName, onUpgrade, children }: UpgradePromptProps) {
  const title = module
    ? `Unlock ${module.name}`
    : featureName
      ? `Upgrade to access ${featureName}`
      : 'Upgrade Required';

  const description = module
    ? module.description || `Add ${module.name} to your subscription to access this feature.`
    : 'This feature requires a higher plan tier or an add-on module.';

  const price = module?.addon_price_monthly
    ? `$${module.addon_price_monthly}/mo`
    : null;

  return (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '48px 24px',
      textAlign: 'center',
      maxWidth: '480px',
      margin: '0 auto',
    }}>
      <div style={{
        width: 64,
        height: 64,
        borderRadius: 16,
        background: 'linear-gradient(135deg, #1a5c5c, #2d8f6b)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        fontSize: 28,
        marginBottom: 24,
        color: '#fff',
      }}>
        {module?.icon ? '🔒' : '⬆️'}
      </div>
      <h3 style={{ fontSize: 24, fontWeight: 700, marginBottom: 8 }}>{title}</h3>
      <p style={{ fontSize: 16, color: '#64748b', marginBottom: 24, lineHeight: 1.6 }}>
        {description}
      </p>
      {price && (
        <p style={{ fontSize: 14, color: '#94a3b8', marginBottom: 16 }}>
          Starting at <strong style={{ color: '#34d399' }}>{price}</strong>
        </p>
      )}
      {onUpgrade && (
        <button
          onClick={onUpgrade}
          style={{
            padding: '12px 32px',
            borderRadius: 8,
            border: 'none',
            background: 'linear-gradient(135deg, #1a5c5c, #2d8f6b)',
            color: '#fff',
            fontSize: 16,
            fontWeight: 600,
            cursor: 'pointer',
          }}
        >
          Upgrade Now
        </button>
      )}
      {children}
    </div>
  );
}
