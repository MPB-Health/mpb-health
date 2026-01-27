import React, { useState } from 'react';
import {
  Mail,
  Lock,
  Eye,
  EyeOff,
  AlertCircle,
  Shield,
} from 'lucide-react';
import { LoginVisualPanel } from './LoginVisualPanel';
import type { LoginVisualPanelProps } from './LoginVisualPanel';

export interface LoginLayoutProps extends Omit<LoginVisualPanelProps, 'appName'> {
  /** Display name shown in visual panel and form heading */
  appName: string;
  /** Subtitle below "Welcome back" on right side */
  appDescription: string;
  /** Called on form submit — throw an Error to display it */
  onSubmit: (email: string, password: string) => Promise<void>;
  /** Show "Forgot password?" link */
  showForgotPassword?: boolean;
  /** Called when "Forgot password?" is clicked */
  onForgotPassword?: () => void;
  /** Show "Remember me" checkbox */
  showRememberMe?: boolean;
  /** Content rendered above the form (e.g. tabs) */
  formHeader?: React.ReactNode;
  /** Content rendered below the form (e.g. portal links) */
  formFooter?: React.ReactNode;
  /** Override the right-side form entirely */
  children?: React.ReactNode;
  /** Email input placeholder */
  emailPlaceholder?: string;
}

export function LoginLayout({
  appName,
  appDescription,
  onSubmit,
  accentVariant = 'blue',
  showForgotPassword = true,
  onForgotPassword,
  showRememberMe = true,
  formHeader,
  formFooter,
  children,
  emailPlaceholder = 'you@example.com',
  tagline,
  features,
}: LoginLayoutProps) {
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
      const msg =
        err instanceof Error ? err.message : 'Authentication failed. Please try again.';
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col lg:flex-row bg-white">
      {/* ── Left: Animated visual panel ── */}
      <LoginVisualPanel
        appName={appName}
        tagline={tagline}
        accentVariant={accentVariant}
        features={features}
      />

      {/* ── Right: Login form ── */}
      <div className="flex-1 flex items-center justify-center px-6 py-10 sm:px-8 lg:px-12 bg-gradient-to-b from-white via-white to-slate-50">
        <div className="w-full max-w-md space-y-8 login-fade-up">
          {/* Optional header slot (e.g. onboarding tabs) */}
          {formHeader}

          {/* If children are provided, render them instead of the default form */}
          {children ? (
            children
          ) : (
            <>
              {/* ── Heading ── */}
              <div className="space-y-2 login-fade-up login-fade-up-delay-1">
                <h2 className="text-3xl font-bold tracking-tight text-neutral-900">
                  Welcome back
                </h2>
                <p className="text-neutral-500">{appDescription}</p>
              </div>

              {/* ── Error ── */}
              {error && (
                <div className="login-shake flex items-start gap-3 rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-700">
                  <AlertCircle className="h-5 w-5 flex-shrink-0 text-red-500 mt-0.5" />
                  <span>{error}</span>
                </div>
              )}

              {/* ── Form ── */}
              <form onSubmit={handleSubmit} className="space-y-5">
                {/* Email */}
                <div className="space-y-1.5 login-fade-up login-fade-up-delay-2">
                  <label
                    htmlFor="login-email"
                    className="block text-sm font-medium text-neutral-700"
                  >
                    Email address
                  </label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-neutral-400" />
                    <input
                      id="login-email"
                      type="email"
                      required
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder={emailPlaceholder}
                      autoComplete="email"
                      className="block w-full rounded-lg border border-neutral-300 bg-white py-2.5 pl-10 pr-4 text-neutral-900 placeholder:text-neutral-400 focus:border-primary-500 focus:ring-2 focus:ring-primary-500/20 focus:outline-none transition-colors"
                    />
                  </div>
                </div>

                {/* Password */}
                <div className="space-y-1.5 login-fade-up login-fade-up-delay-3">
                  <label
                    htmlFor="login-password"
                    className="block text-sm font-medium text-neutral-700"
                  >
                    Password
                  </label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-neutral-400" />
                    <input
                      id="login-password"
                      type={showPassword ? 'text' : 'password'}
                      required
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="••••••••"
                      autoComplete="current-password"
                      className="block w-full rounded-lg border border-neutral-300 bg-white py-2.5 pl-10 pr-11 text-neutral-900 placeholder:text-neutral-400 focus:border-primary-500 focus:ring-2 focus:ring-primary-500/20 focus:outline-none transition-colors"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-neutral-400 hover:text-neutral-600 transition-colors"
                      aria-label={showPassword ? 'Hide password' : 'Show password'}
                    >
                      {showPassword ? (
                        <EyeOff className="h-5 w-5" />
                      ) : (
                        <Eye className="h-5 w-5" />
                      )}
                    </button>
                  </div>
                </div>

                {/* Remember me + Forgot password row */}
                <div className="flex items-center justify-between login-fade-up login-fade-up-delay-4">
                  {showRememberMe ? (
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="checkbox"
                        className="h-4 w-4 rounded border-neutral-300 text-primary-600 focus:ring-primary-500 transition-colors"
                      />
                      <span className="text-sm text-neutral-600">Remember me</span>
                    </label>
                  ) : (
                    <span />
                  )}
                  {showForgotPassword && (
                    <button
                      type="button"
                      onClick={onForgotPassword}
                      className="text-sm font-medium text-primary-600 hover:text-primary-700 transition-colors"
                    >
                      Forgot password?
                    </button>
                  )}
                </div>

                {/* Submit */}
                <button
                  type="submit"
                  disabled={loading}
                  className="relative w-full flex items-center justify-center gap-2 rounded-lg bg-primary-600 px-4 py-3 text-sm font-semibold text-white shadow-lg shadow-primary-600/25 hover:bg-primary-700 focus:ring-2 focus:ring-primary-500 focus:ring-offset-2 focus:outline-none disabled:opacity-60 disabled:cursor-not-allowed transition-all"
                >
                  {loading ? (
                    <>
                      <span className="login-spinner" />
                      <span>Signing in...</span>
                    </>
                  ) : (
                    'Sign in'
                  )}
                </button>
              </form>
            </>
          )}

          {/* Optional footer slot */}
          {formFooter}

          {/* ── Security footer ── */}
          <div className="flex items-center justify-center gap-4 pt-4 border-t border-neutral-100">
            <span className="inline-flex items-center gap-1.5 text-xs text-neutral-400">
              <Lock className="h-3.5 w-3.5" />
              256-bit encrypted
            </span>
            <span className="text-neutral-200">·</span>
            <span className="inline-flex items-center gap-1.5 text-xs text-neutral-400">
              <Shield className="h-3.5 w-3.5" />
              HIPAA Compliant
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
