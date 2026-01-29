import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Mail, Lock, ArrowRight, Shield, AlertTriangle, CheckCircle2, Clock, Eye, EyeOff } from 'lucide-react';
import { Card } from '../ui/Card';
import { Input } from '../ui/Input';
import { Button } from '../ui/button';
import { Label } from '../ui/Label';
import { secureAuthService } from '../../lib/secureAuthService';
import { mfaService } from '../../lib/mfaService';
import { supabase } from '../../lib/supabase';

interface SecureLoginPageProps {
  portalType: 'member' | 'advisor' | 'admin';
  title: string;
  subtitle: string;
  redirectPath: string;
  allowedRoles?: string[];
}

export function SecureLoginPage({
  portalType,
  title,
  subtitle,
  redirectPath,
  allowedRoles = [],
}: SecureLoginPageProps) {
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [mfaCode, setMfaCode] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [requiresMFA, setRequiresMFA] = useState(false);
  const [_requiresCaptcha, setRequiresCaptcha] = useState(false);
  const [waitTime, setWaitTime] = useState(0);
  const [showPassword, setShowPassword] = useState(false);
  const [deviceFingerprint, setDeviceFingerprint] = useState('');
  const [rememberDevice, setRememberDevice] = useState(false);

  useEffect(() => {
    const fingerprint = mfaService.generateDeviceFingerprint();
    setDeviceFingerprint(fingerprint);
  }, []);

  useEffect(() => {
    if (waitTime > 0) {
      const timer = setInterval(() => {
        setWaitTime(prev => {
          if (prev <= 1) {
            clearInterval(timer);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);

      return () => clearInterval(timer);
    }
  }, [waitTime]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const clientInfo = await secureAuthService.getClientInfo();

      const response = await secureAuthService.secureLogin({
        email,
        password,
        ipAddress: clientInfo.ipAddress,
        userAgent: clientInfo.userAgent,
        deviceFingerprint,
        mfaCode: requiresMFA ? mfaCode : undefined,
      });

      if (!response.success) {
        if (response.requiresMFA) {
          setRequiresMFA(true);
          setError(response.error || 'MFA code required');
        } else if (response.requiresCaptcha) {
          setRequiresCaptcha(true);
          setError(response.error || 'CAPTCHA verification required');
        } else if (response.waitTime) {
          setWaitTime(response.waitTime);
          setError(response.error || 'Too many attempts. Please wait.');
        } else {
          setError(response.error || 'Login failed');
        }
        setLoading(false);
        return;
      }

      if (response.mfaRequired) {
        navigate('/mfa-enrollment', {
          state: {
            userId: response.user?.id,
            returnPath: redirectPath,
          },
        });
        return;
      }

      if (rememberDevice && response.user) {
        await mfaService.addTrustedDevice(
          response.user.id,
          navigator.userAgent.split(' ')[0] || 'Unknown Device',
          deviceFingerprint
        );
      }

      const isSuperAdmin = response.user?.email === 'catherine@mympb.com';

      if (isSuperAdmin) {
        navigate(redirectPath);
      } else if (allowedRoles.length > 0) {
        const { data: profile, error: profileError } = await supabase
          .from('profiles')
          .select('role')
          .eq('id', response.user?.id)
          .maybeSingle();

        if (profileError) {
          console.error('Profile fetch error:', profileError);
        }

        if (profile?.role && allowedRoles.includes(profile.role)) {
          navigate(redirectPath);
        } else {
          const roleDescription = portalType === 'member' ? 'members' : `${portalType}s`;
          setError(`This login is for ${roleDescription} only. Please use the appropriate login portal.`);
          await supabase.auth.signOut();
        }
      } else {
        navigate(redirectPath);
      }
    } catch (err: any) {
      console.error('Login error:', err);
      setError(err.message || 'An error occurred during login');
    } finally {
      setLoading(false);
    }
  };

  const getOtherPortalLinks = () => {
    const links = [];
    if (portalType !== 'member') {
      links.push({ label: 'Member Login', path: '/login' });
    }
    if (portalType !== 'advisor') {
      links.push({ label: 'Advisor Login', path: '/advisor/login' });
    }
    if (portalType !== 'admin') {
      links.push({ label: 'Admin Login', path: '/admin/login' });
    }
    return links;
  };

  const otherPortalLinks = getOtherPortalLinks();

  const formatWaitTime = (seconds: number): string => {
    if (seconds < 60) {
      return `${seconds} second${seconds !== 1 ? 's' : ''}`;
    }
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes} minute${minutes !== 1 ? 's' : ''} ${remainingSeconds > 0 ? `${remainingSeconds} second${remainingSeconds !== 1 ? 's' : ''}` : ''}`;
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-slate-50 flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        <div className="text-center">
          <div className="flex justify-center mb-4">
            <div className="w-16 h-16 bg-blue-600 rounded-full flex items-center justify-center">
              <Shield className="w-10 h-10 text-white" />
            </div>
          </div>
          <h1 className="text-4xl font-bold text-gray-900 mb-2">{title}</h1>
          <p className="text-gray-600">{subtitle}</p>
          <p className="text-sm text-gray-500 mt-2 flex items-center justify-center gap-2">
            <Shield className="w-4 h-4" />
            HIPAA-Compliant Secure Login
          </p>
        </div>

        <Card className="p-8">
          {portalType === 'member' ? (
            <div className="space-y-6">
              <div className="text-center">
                <h2 className="text-2xl font-bold text-gray-900 mb-4">Member Portal Access</h2>
                <p className="text-gray-600 mb-6">
                  Access your member dashboard through the dedicated member app.
                </p>
              </div>
              <Button
                type="button"
                className="w-full"
                onClick={() => window.location.href = 'https://app.mpb.health'}
              >
                Launch Member App
                <ArrowRight className="ml-2 h-5 w-5" />
              </Button>
              <div className="mt-6 text-center text-sm text-gray-600">
                <p>Need help? Contact your administrator.</p>
              </div>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-6">
              <h2 className="text-2xl font-bold text-gray-900">Sign In to Your Account</h2>

              {error && (
                <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm flex items-start gap-2">
                  <AlertTriangle className="w-5 h-5 flex-shrink-0 mt-0.5" />
                  <span>{error}</span>
                </div>
              )}

              {waitTime > 0 && (
                <div className="bg-amber-50 border border-amber-200 text-amber-700 px-4 py-3 rounded-lg text-sm flex items-start gap-2">
                  <Clock className="w-5 h-5 flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="font-semibold">Account temporarily locked</p>
                    <p>Please wait {formatWaitTime(waitTime)} before trying again.</p>
                  </div>
                </div>
              )}

              <div>
                <Label htmlFor="email">Email Address</Label>
                <div className="relative mt-1">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
                  <Input
                    id="email"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder={`${portalType}@mympb.com`}
                    className="pl-10"
                    required
                    disabled={waitTime > 0}
                  />
                </div>
              </div>

              <div>
                <Label htmlFor="password">Password</Label>
                <div className="relative mt-1">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
                  <Input
                    id="password"
                    type={showPassword ? "text" : "password"}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    className="pl-10 pr-10"
                    required
                    disabled={waitTime > 0}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                  >
                    {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                  </button>
                </div>
              </div>

              {requiresMFA && (
                <div>
                  <Label htmlFor="mfaCode">MFA Code</Label>
                  <div className="relative mt-1">
                    <Shield className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
                    <Input
                      id="mfaCode"
                      type="text"
                      value={mfaCode}
                      onChange={(e) => setMfaCode(e.target.value)}
                      placeholder="Enter 6-digit code"
                      className="pl-10"
                      maxLength={6}
                      required
                      disabled={waitTime > 0}
                    />
                  </div>
                  <p className="text-xs text-gray-500 mt-1">
                    Enter the code from your authenticator app
                  </p>
                </div>
              )}

              {requiresMFA && (
                <div className="flex items-center">
                  <input
                    id="rememberDevice"
                    type="checkbox"
                    checked={rememberDevice}
                    onChange={(e) => setRememberDevice(e.target.checked)}
                    className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                  />
                  <label htmlFor="rememberDevice" className="ml-2 block text-sm text-gray-700">
                    Trust this device for 30 days
                  </label>
                </div>
              )}

              <Button
                type="submit"
                className="w-full"
                disabled={loading || waitTime > 0}
              >
                {loading ? (
                  <span>Signing In...</span>
                ) : (
                  <>
                    Sign In
                    <ArrowRight className="ml-2 h-5 w-5" />
                  </>
                )}
              </Button>

              <div className="space-y-2">
                <div className="flex items-center justify-center text-sm text-gray-600">
                  <CheckCircle2 className="w-4 h-4 mr-1 text-green-600" />
                  <span>Brute force protection enabled</span>
                </div>
                <div className="flex items-center justify-center text-sm text-gray-600">
                  <CheckCircle2 className="w-4 h-4 mr-1 text-green-600" />
                  <span>End-to-end encryption</span>
                </div>
                <div className="flex items-center justify-center text-sm text-gray-600">
                  <CheckCircle2 className="w-4 h-4 mr-1 text-green-600" />
                  <span>Audit logging enabled</span>
                </div>
              </div>

              <div className="mt-6 text-center text-sm text-gray-600">
                <p>Forgot your password? Contact your administrator.</p>
              </div>
            </form>
          )}
        </Card>

        <div className="text-center space-y-2">
          {otherPortalLinks.length > 0 && (
            <div className="flex items-center justify-center gap-4 text-sm text-gray-600">
              {otherPortalLinks.map((link, index) => (
                <React.Fragment key={link.path}>
                  {index > 0 && <span>•</span>}
                  <Link to={link.path} className="hover:text-blue-600 transition-colors">
                    {link.label}
                  </Link>
                </React.Fragment>
              ))}
            </div>
          )}
          <Link to="/" className="text-sm text-gray-600 hover:text-blue-600 transition-colors block">
            ← Back to Home
          </Link>
        </div>
      </div>
    </div>
  );
}
