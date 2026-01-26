import React, { useEffect, useState } from 'react';
import { CheckCircle2, XCircle, AlertCircle } from 'lucide-react';
import { passwordSecurityService } from '../../lib/passwordSecurityService';

interface PasswordStrengthMeterProps {
  password: string;
  onStrengthChange?: (passed: boolean) => void;
}

export function PasswordStrengthMeter({ password, onStrengthChange }: PasswordStrengthMeterProps) {
  const [strength, setStrength] = useState<any>(null);

  useEffect(() => {
    if (password) {
      const result = passwordSecurityService.calculatePasswordStrength(password);
      setStrength(result);
      onStrengthChange?.(result.passed);
    } else {
      setStrength(null);
      onStrengthChange?.(false);
    }
  }, [password, onStrengthChange]);

  if (!password || !strength) {
    return null;
  }

  const getColorClass = () => {
    switch (strength.label) {
      case 'Weak':
        return 'bg-red-500';
      case 'Fair':
        return 'bg-orange-500';
      case 'Good':
        return 'bg-yellow-500';
      case 'Strong':
        return 'bg-green-500';
      case 'Very Strong':
        return 'bg-emerald-600';
      default:
        return 'bg-gray-300';
    }
  };

  const getTextColorClass = () => {
    switch (strength.label) {
      case 'Weak':
        return 'text-red-700';
      case 'Fair':
        return 'text-orange-700';
      case 'Good':
        return 'text-yellow-700';
      case 'Strong':
        return 'text-green-700';
      case 'Very Strong':
        return 'text-emerald-700';
      default:
        return 'text-gray-700';
    }
  };

  const getBgColorClass = () => {
    switch (strength.label) {
      case 'Weak':
        return 'bg-red-50 border-red-200';
      case 'Fair':
        return 'bg-orange-50 border-orange-200';
      case 'Good':
        return 'bg-yellow-50 border-yellow-200';
      case 'Strong':
        return 'bg-green-50 border-green-200';
      case 'Very Strong':
        return 'bg-emerald-50 border-emerald-200';
      default:
        return 'bg-gray-50 border-gray-200';
    }
  };

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between text-sm">
        <span className="text-gray-600">Password Strength:</span>
        <span className={`font-semibold ${getTextColorClass()}`}>
          {strength.label}
        </span>
      </div>

      <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
        <div
          className={`h-full transition-all duration-300 ${getColorClass()}`}
          style={{ width: `${(strength.score / 10) * 100}%` }}
        />
      </div>

      {strength.feedback && strength.feedback.length > 0 && (
        <div className={`mt-3 p-3 rounded-lg border ${getBgColorClass()}`}>
          <div className="flex items-start gap-2">
            {strength.passed ? (
              <CheckCircle2 className={`w-5 h-5 flex-shrink-0 mt-0.5 ${getTextColorClass()}`} />
            ) : (
              <AlertCircle className={`w-5 h-5 flex-shrink-0 mt-0.5 ${getTextColorClass()}`} />
            )}
            <div className="space-y-1">
              {strength.feedback.map((tip: string, index: number) => (
                <p key={index} className={`text-sm ${getTextColorClass()}`}>
                  {tip}
                </p>
              ))}
            </div>
          </div>
        </div>
      )}

      <div className="mt-3 space-y-1.5 text-xs text-gray-600">
        <div className="flex items-center gap-2">
          {password.length >= 12 ? (
            <CheckCircle2 className="w-4 h-4 text-green-600" />
          ) : (
            <XCircle className="w-4 h-4 text-gray-400" />
          )}
          <span>At least 12 characters</span>
        </div>
        <div className="flex items-center gap-2">
          {/[A-Z]/.test(password) ? (
            <CheckCircle2 className="w-4 h-4 text-green-600" />
          ) : (
            <XCircle className="w-4 h-4 text-gray-400" />
          )}
          <span>Uppercase letter (A-Z)</span>
        </div>
        <div className="flex items-center gap-2">
          {/[a-z]/.test(password) ? (
            <CheckCircle2 className="w-4 h-4 text-green-600" />
          ) : (
            <XCircle className="w-4 h-4 text-gray-400" />
          )}
          <span>Lowercase letter (a-z)</span>
        </div>
        <div className="flex items-center gap-2">
          {/\d/.test(password) ? (
            <CheckCircle2 className="w-4 h-4 text-green-600" />
          ) : (
            <XCircle className="w-4 h-4 text-gray-400" />
          )}
          <span>Number (0-9)</span>
        </div>
        <div className="flex items-center gap-2">
          {/[!@#$%^&*()_+\-=[\]{};':"\\|,.<>/?]/.test(password) ? (
            <CheckCircle2 className="w-4 h-4 text-green-600" />
          ) : (
            <XCircle className="w-4 h-4 text-gray-400" />
          )}
          <span>Special character (!@#$%...)</span>
        </div>
      </div>
    </div>
  );
}
