// ARYX Auth Shell — used by all 3 portal Login pages on *.aryxcloud.com.
// Drop-in replacement for <LoginLayout> on the ARYX brand: dark cinematic
// shell with orange ARYX wordmark and a focused single-card form.
//
// Each Login.tsx conditionally renders this on detectBrand() === 'aryx'.

import React, { useEffect, useState } from 'react';
import { Mail, Lock, Eye, EyeOff, AlertCircle, ArrowRight, Shield } from 'lucide-react';

export interface AryxAuthShellProps {
  /** Destination text — e.g. "Admin Portal", "CRM", "Advisor Portal". */
  appName: string;
  /** Short subtitle beneath "Sign in to ${appName}". */
  appDescription?: string;
  /** Optional tenant attribution shown beneath the ARYX wordmark. */
  tenantName?: string;
  /** Submit handler — throw an Error to display it. */
  onSubmit: (email: string, password: string) => Promise<void>;
  /** Email field placeholder. */
  emailPlaceholder?: string;
  /** Show the "Forgot password?" link. */
  showForgotPassword?: boolean;
  onForgotPassword?: () => void;
  /** Render anything beneath the form (e.g. "Need help? Contact support"). */
  formFooter?: React.ReactNode;
  /** Render anything above the heading (e.g. a "Back to home" link). */
  formHeader?: React.ReactNode;
}

// Load Inter Tight on demand (only when this shell renders). Cached after first load.
function useInterTight() {
  useEffect(() => {
    const ID = 'aryx-font-inter-tight';
    if (document.getElementById(ID)) return;
    const link = document.createElement('link');
    link.id = ID;
    link.rel = 'stylesheet';
    link.href = 'https://fonts.googleapis.com/css2?family=Inter+Tight:wght@500;600;700;800;900&display=swap';
    document.head.appendChild(link);
  }, []);
}

export function AryxAuthShell({
  appName,
  appDescription = 'Sign in to continue',
  tenantName,
  onSubmit,
  emailPlaceholder = 'you@example.com',
  showForgotPassword = false,
  onForgotPassword,
  formFooter,
  formHeader,
}: AryxAuthShellProps) {
  useInterTight();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await onSubmit(email, password);
    } catch (err: unknown) {
      let msg = 'Authentication failed. Please try again.';
      if (err instanceof Error && err.message) msg = err.message;
      else if (err && typeof err === 'object') {
        const o = err as Record<string, unknown>;
        msg = (o.error_description || o.msg || o.message || msg) as string;
      }
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  // Inline style block — keeps the visual identity self-contained inside this
  // component so it can be lifted into a Phase 2 tenant theme later without
  // hunting CSS overrides across the repo.
  const styles: Record<string, React.CSSProperties> = {
    page: {
      minHeight: '100vh',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '2rem 1rem',
      background: 'radial-gradient(ellipse 80% 60% at 50% 0%, rgba(255,90,31,0.18) 0%, rgba(255,90,31,0) 55%), linear-gradient(180deg, #0a0a0a 0%, #050505 100%)',
      color: '#FAFAFA',
      fontFamily: "'Inter', system-ui, sans-serif",
      position: 'relative',
      overflow: 'hidden',
    },
    grain: {
      position: 'absolute', inset: 0,
      backgroundImage: 'radial-gradient(rgba(255,255,255,0.03) 1px, transparent 1px)',
      backgroundSize: '3px 3px',
      pointerEvents: 'none',
    },
    container: {
      position: 'relative', zIndex: 1,
      width: '100%', maxWidth: '440px',
      display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '2rem',
    },
    wordmark: {
      fontFamily: "'Inter Tight', 'Inter', system-ui, sans-serif",
      fontSize: '3.5rem', fontWeight: 800,
      letterSpacing: '-0.04em', lineHeight: 1,
      background: 'linear-gradient(135deg, #FF7A00 0%, #FF5A1F 60%, #E04E18 100%)',
      WebkitBackgroundClip: 'text',
      WebkitTextFillColor: 'transparent',
      textShadow: '0 0 40px rgba(255,90,31,0.35)',
    },
    tagline: {
      fontFamily: "'Inter Tight', 'Inter', system-ui, sans-serif",
      fontSize: '0.875rem', fontWeight: 500, color: '#9CA3AF',
      letterSpacing: '0.18em', textTransform: 'uppercase' as const,
      marginTop: '0.25rem',
    },
    card: {
      width: '100%',
      background: 'linear-gradient(180deg, #141414 0%, #0F0F0F 100%)',
      border: '1px solid rgba(255,255,255,0.06)',
      borderRadius: '20px',
      padding: '2rem',
      boxShadow: '0 0 80px rgba(255,90,31,0.08), 0 30px 60px rgba(0,0,0,0.5), inset 0 1px 0 rgba(255,255,255,0.04)',
    },
    heading: {
      fontFamily: "'Inter Tight', 'Inter', system-ui, sans-serif",
      fontSize: '1.5rem', fontWeight: 700, letterSpacing: '-0.02em',
      color: '#FAFAFA', margin: '0 0 0.5rem 0',
    },
    subheading: { fontSize: '0.875rem', color: '#9CA3AF', margin: 0 },
    errorBox: {
      display: 'flex', gap: '0.75rem', alignItems: 'flex-start',
      padding: '0.75rem 1rem', marginBottom: '1rem',
      borderRadius: '10px',
      background: 'rgba(220,38,38,0.1)',
      border: '1px solid rgba(220,38,38,0.3)',
      color: '#FCA5A5', fontSize: '0.875rem',
    },
    label: {
      display: 'block', fontSize: '0.8125rem', fontWeight: 500,
      color: '#D1D5DB', marginBottom: '0.375rem',
    },
    inputWrap: { position: 'relative' },
    inputIcon: {
      position: 'absolute', left: '0.875rem', top: '50%',
      transform: 'translateY(-50%)', color: '#6B7280',
      pointerEvents: 'none',
    },
    input: {
      width: '100%', boxSizing: 'border-box',
      padding: '0.75rem 0.875rem 0.75rem 2.5rem',
      background: '#0A0A0A',
      border: '1px solid rgba(255,255,255,0.08)',
      borderRadius: '10px',
      color: '#FAFAFA', fontSize: '0.875rem',
      fontFamily: "'Inter', system-ui, sans-serif",
      outline: 'none',
      transition: 'border-color 0.15s, box-shadow 0.15s',
    },
    passwordToggle: {
      position: 'absolute', right: '0.75rem', top: '50%',
      transform: 'translateY(-50%)', background: 'none', border: 'none',
      cursor: 'pointer', color: '#6B7280', padding: '0.25rem',
      display: 'flex', alignItems: 'center',
    },
    submitButton: {
      width: '100%', marginTop: '0.5rem',
      padding: '0.875rem 1rem',
      border: 'none', borderRadius: '10px', cursor: 'pointer',
      background: 'linear-gradient(135deg, #FF7A00 0%, #FF5A1F 100%)',
      color: '#fff', fontSize: '0.9375rem', fontWeight: 600,
      fontFamily: "'Inter Tight', 'Inter', system-ui, sans-serif",
      letterSpacing: '0.01em',
      boxShadow: '0 10px 30px rgba(255,90,31,0.35), inset 0 1px 0 rgba(255,255,255,0.2)',
      transition: 'transform 0.15s, box-shadow 0.15s, opacity 0.15s',
      display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem',
    },
    forgotLink: {
      background: 'none', border: 'none', cursor: 'pointer',
      color: '#FF8A4F', fontSize: '0.8125rem', fontWeight: 500,
      padding: 0,
    },
    trustRow: {
      display: 'flex', justifyContent: 'center', gap: '1.25rem',
      marginTop: '1.5rem', paddingTop: '1.25rem',
      borderTop: '1px solid rgba(255,255,255,0.06)',
    },
    trustBadge: {
      display: 'inline-flex', alignItems: 'center', gap: '0.375rem',
      fontSize: '0.6875rem', color: '#6B7280',
      letterSpacing: '0.08em', textTransform: 'uppercase' as const,
    },
    footerNote: {
      marginTop: '1.25rem', fontSize: '0.75rem', color: '#6B7280',
      textAlign: 'center' as const,
    },
  };

  return (
    <div style={styles.page}>
      <div style={styles.grain} aria-hidden />

      <div style={styles.container}>
        {/* ── ARYX wordmark ── */}
        <div style={{ textAlign: 'center' }}>
          <div style={styles.wordmark}>ARYX</div>
          {tenantName && <div style={styles.tagline}>by {tenantName}</div>}
        </div>

        {/* ── Card ── */}
        <div style={styles.card}>
          {formHeader}

          <h2 style={styles.heading}>Sign in to {appName}</h2>
          <p style={styles.subheading}>{appDescription}</p>

          {error && (
            <div style={{ ...styles.errorBox, marginTop: '1.5rem', marginBottom: 0 }} role="alert">
              <AlertCircle size={18} style={{ flexShrink: 0, marginTop: 1 }} />
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} style={{ marginTop: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            {/* Email */}
            <div>
              <label htmlFor="aryx-email" style={styles.label}>Email</label>
              <div style={styles.inputWrap}>
                <Mail size={18} style={styles.inputIcon} />
                <input
                  id="aryx-email"
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder={emailPlaceholder}
                  autoComplete="email"
                  style={styles.input}
                  onFocus={(e) => {
                    e.currentTarget.style.borderColor = '#FF5A1F';
                    e.currentTarget.style.boxShadow = '0 0 0 3px rgba(255,90,31,0.15)';
                  }}
                  onBlur={(e) => {
                    e.currentTarget.style.borderColor = 'rgba(255,255,255,0.08)';
                    e.currentTarget.style.boxShadow = 'none';
                  }}
                />
              </div>
            </div>

            {/* Password */}
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
                <label htmlFor="aryx-password" style={styles.label}>Password</label>
                {showForgotPassword && (
                  <button type="button" onClick={onForgotPassword} style={styles.forgotLink}>
                    Forgot password?
                  </button>
                )}
              </div>
              <div style={styles.inputWrap}>
                <Lock size={18} style={styles.inputIcon} />
                <input
                  id="aryx-password"
                  type={showPassword ? 'text' : 'password'}
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  autoComplete="current-password"
                  style={{ ...styles.input, paddingRight: '2.75rem' }}
                  onFocus={(e) => {
                    e.currentTarget.style.borderColor = '#FF5A1F';
                    e.currentTarget.style.boxShadow = '0 0 0 3px rgba(255,90,31,0.15)';
                  }}
                  onBlur={(e) => {
                    e.currentTarget.style.borderColor = 'rgba(255,255,255,0.08)';
                    e.currentTarget.style.boxShadow = 'none';
                  }}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  style={styles.passwordToggle}
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                >
                  {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
            </div>

            {/* Submit */}
            <button
              type="submit"
              disabled={loading}
              style={{
                ...styles.submitButton,
                opacity: loading ? 0.6 : 1,
                cursor: loading ? 'not-allowed' : 'pointer',
              }}
              onMouseDown={(e) => { if (!loading) e.currentTarget.style.transform = 'translateY(1px)'; }}
              onMouseUp={(e) => { e.currentTarget.style.transform = 'translateY(0)'; }}
              onMouseLeave={(e) => { e.currentTarget.style.transform = 'translateY(0)'; }}
            >
              {loading ? 'Signing in…' : (<>Sign in <ArrowRight size={16} /></>)}
            </button>
          </form>

          {formFooter && <div style={{ marginTop: '1rem', fontSize: '0.8125rem', color: '#9CA3AF' }}>{formFooter}</div>}

          <div style={styles.trustRow}>
            <span style={styles.trustBadge}><Lock size={12} /> 256-bit</span>
            <span style={styles.trustBadge}><Shield size={12} /> HIPAA</span>
            <span style={styles.trustBadge}>SOC 2</span>
          </div>
        </div>

        <p style={styles.footerNote}>
          Your sign-in is encrypted end-to-end.
        </p>
      </div>
    </div>
  );
}
