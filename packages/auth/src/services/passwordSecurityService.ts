import { supabase } from '@mpbhealth/database';

export interface PasswordStrength {
  score: number;
  label: 'Weak' | 'Fair' | 'Good' | 'Strong' | 'Very Strong';
  feedback: string[];
  passed: boolean;
}

export interface PasswordPolicy {
  minLength: number;
  requireUppercase: boolean;
  requireLowercase: boolean;
  requireNumbers: boolean;
  requireSpecialChars: boolean;
  preventReuse: number;
  maxAge: number;
}

class PasswordSecurityService {
  private readonly DEFAULT_POLICY: PasswordPolicy = {
    minLength: 12,
    requireUppercase: true,
    requireLowercase: true,
    requireNumbers: true,
    requireSpecialChars: true,
    preventReuse: 5,
    maxAge: 90,
  };

  validatePassword(password: string, policy: PasswordPolicy = this.DEFAULT_POLICY): {
    valid: boolean;
    errors: string[];
  } {
    const errors: string[] = [];

    if (password.length < policy.minLength) {
      errors.push(`Password must be at least ${policy.minLength} characters long`);
    }

    if (policy.requireUppercase && !/[A-Z]/.test(password)) {
      errors.push('Password must contain at least one uppercase letter');
    }

    if (policy.requireLowercase && !/[a-z]/.test(password)) {
      errors.push('Password must contain at least one lowercase letter');
    }

    if (policy.requireNumbers && !/\d/.test(password)) {
      errors.push('Password must contain at least one number');
    }

    if (policy.requireSpecialChars && !/[!@#$%^&*()_+\-=[\]{};':"\\|,.<>/?]/.test(password)) {
      errors.push('Password must contain at least one special character');
    }

    return {
      valid: errors.length === 0,
      errors,
    };
  }

  calculatePasswordStrength(password: string): PasswordStrength {
    const feedback: string[] = [];
    let score = 0;

    if (password.length >= 8) score += 1;
    if (password.length >= 12) score += 1;
    if (password.length >= 16) score += 1;

    if (/[a-z]/.test(password)) score += 1;
    if (/[A-Z]/.test(password)) score += 1;
    if (/\d/.test(password)) score += 1;
    if (/[!@#$%^&*()_+\-=[\]{};':"\\|,.<>/?]/.test(password)) score += 1;

    if (!/(.)\1{2,}/.test(password)) {
      score += 1;
    } else {
      feedback.push('Avoid repeating characters');
    }

    if (!/^(?:123|abc|qwe|asd|zxc)/i.test(password)) {
      score += 1;
    } else {
      feedback.push('Avoid common patterns');
    }

    const commonPasswords = [
      'password', 'password123', '12345678', 'qwerty', 'abc123',
      'monkey', 'letmein', 'welcome', 'admin', 'user'
    ];

    if (!commonPasswords.some(common => password.toLowerCase().includes(common))) {
      score += 1;
    } else {
      feedback.push('Avoid common passwords');
    }

    let label: PasswordStrength['label'];
    let passed = false;

    if (score <= 3) {
      label = 'Weak';
      feedback.push('Use a longer password with mixed characters');
    } else if (score <= 5) {
      label = 'Fair';
      feedback.push('Add more character variety for better security');
    } else if (score <= 7) {
      label = 'Good';
      passed = true;
    } else if (score <= 9) {
      label = 'Strong';
      passed = true;
    } else {
      label = 'Very Strong';
      passed = true;
    }

    return {
      score: Math.min(10, score),
      label,
      feedback,
      passed,
    };
  }

  async checkPasswordHistory(userId: string, newPasswordHash: string): Promise<boolean> {
    try {
      const { data, error } = await supabase
        .from('password_history')
        .select('password_hash')
        .eq('user_id', userId)
        .order('changed_at', { ascending: false })
        .limit(this.DEFAULT_POLICY.preventReuse);

      if (error) {
        console.error('Error checking password history:', error);
        return true;
      }

      if (!data || data.length === 0) {
        return true;
      }

      const isReused = data.some(record => record.password_hash === newPasswordHash);

      return !isReused;
    } catch (error) {
      console.error('Failed to check password history:', error);
      return true;
    }
  }

  async savePasswordHistory(userId: string, passwordHash: string): Promise<void> {
    try {
      await supabase
        .from('password_history')
        .insert({
          user_id: userId,
          password_hash: passwordHash,
        });

      const { data: history } = await supabase
        .from('password_history')
        .select('id')
        .eq('user_id', userId)
        .order('changed_at', { ascending: false });

      if (history && history.length > this.DEFAULT_POLICY.preventReuse) {
        const idsToDelete = history
          .slice(this.DEFAULT_POLICY.preventReuse)
          .map(record => record.id);

        await supabase
          .from('password_history')
          .delete()
          .in('id', idsToDelete);
      }
    } catch (error) {
      console.error('Failed to save password history:', error);
    }
  }

  async checkPasswordBreach(password: string): Promise<{
    isBreached: boolean;
    count?: number;
  }> {
    try {
      const encoder = new TextEncoder();
      const data = encoder.encode(password);
      const hashBuffer = await crypto.subtle.digest('SHA-1', data);
      const hashArray = Array.from(new Uint8Array(hashBuffer));
      const hashHex = hashArray.map(b => b.toString(16).padStart(2, '0')).join('').toUpperCase();

      const prefix = hashHex.substring(0, 5);
      const suffix = hashHex.substring(5);

      const response = await fetch(`https://api.pwnedpasswords.com/range/${prefix}`);

      if (!response.ok) {
        console.warn('HIBP API request failed, skipping breach check');
        return { isBreached: false };
      }

      const text = await response.text();
      const hashes = text.split('\n');

      for (const line of hashes) {
        const [hashSuffix, countStr] = line.split(':');
        if (hashSuffix === suffix) {
          return {
            isBreached: true,
            count: parseInt(countStr.trim(), 10),
          };
        }
      }

      return { isBreached: false };
    } catch (error) {
      console.warn('Password breach check failed:', error);
      return { isBreached: false };
    }
  }

  async isPasswordExpired(userId: string): Promise<{
    expired: boolean;
    daysUntilExpiry?: number;
    lastChanged?: Date;
  }> {
    try {
      const { data: profile } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', userId)
        .maybeSingle();

      const requiresRotation = profile && ['admin', 'staff', 'advisor'].includes(profile.role);

      if (!requiresRotation) {
        return { expired: false };
      }

      const { data } = await supabase
        .from('password_history')
        .select('changed_at')
        .eq('user_id', userId)
        .order('changed_at', { ascending: false })
        .limit(1)
        .maybeSingle();

      if (!data || !data.changed_at) {
        return {
          expired: true,
          daysUntilExpiry: 0,
        };
      }

      const lastChanged = new Date(data.changed_at);
      const daysSinceChange = Math.floor(
        (Date.now() - lastChanged.getTime()) / (1000 * 60 * 60 * 24)
      );

      const daysUntilExpiry = this.DEFAULT_POLICY.maxAge - daysSinceChange;

      return {
        expired: daysUntilExpiry <= 0,
        daysUntilExpiry,
        lastChanged,
      };
    } catch (error) {
      console.error('Failed to check password expiration:', error);
      return { expired: false };
    }
  }

  generateSecurePassword(length: number = 16): string {
    const uppercase = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
    const lowercase = 'abcdefghijklmnopqrstuvwxyz';
    const numbers = '0123456789';
    const special = '!@#$%^&*()_+-=[]{}|;:,.<>?';

    const allChars = uppercase + lowercase + numbers + special;
    const array = new Uint8Array(length);
    crypto.getRandomValues(array);

    let password = '';
    password += uppercase[array[0] % uppercase.length];
    password += lowercase[array[1] % lowercase.length];
    password += numbers[array[2] % numbers.length];
    password += special[array[3] % special.length];

    for (let i = 4; i < length; i++) {
      password += allChars[array[i] % allChars.length];
    }

    return password.split('').sort(() => Math.random() - 0.5).join('');
  }

  async enforcePasswordPolicy(userId: string, newPassword: string): Promise<{
    allowed: boolean;
    errors: string[];
  }> {
    const errors: string[] = [];

    const validation = this.validatePassword(newPassword);
    if (!validation.valid) {
      errors.push(...validation.errors);
    }

    const strength = this.calculatePasswordStrength(newPassword);
    if (!strength.passed) {
      errors.push('Password is too weak. Please use a stronger password.');
    }

    const passwordHash = await this.hashPassword(newPassword);
    const historyCheck = await this.checkPasswordHistory(userId, passwordHash);
    if (!historyCheck) {
      errors.push(
        `Password cannot be the same as your last ${this.DEFAULT_POLICY.preventReuse} passwords`
      );
    }

    const breachCheck = await this.checkPasswordBreach(newPassword);
    if (breachCheck.isBreached) {
      errors.push(
        `This password has been found in ${breachCheck.count} data breaches. Please choose a different password.`
      );
    }

    return {
      allowed: errors.length === 0,
      errors,
    };
  }

  private async hashPassword(password: string): Promise<string> {
    const encoder = new TextEncoder();
    const data = encoder.encode(password);
    const hashBuffer = await crypto.subtle.digest('SHA-256', data);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
  }

  getPasswordPolicyDescription(policy: PasswordPolicy = this.DEFAULT_POLICY): string {
    const requirements: string[] = [];

    requirements.push(`At least ${policy.minLength} characters long`);

    if (policy.requireUppercase) {
      requirements.push('Include uppercase letters (A-Z)');
    }

    if (policy.requireLowercase) {
      requirements.push('Include lowercase letters (a-z)');
    }

    if (policy.requireNumbers) {
      requirements.push('Include numbers (0-9)');
    }

    if (policy.requireSpecialChars) {
      requirements.push('Include special characters (!@#$%^&*...)');
    }

    if (policy.preventReuse > 0) {
      requirements.push(`Cannot reuse last ${policy.preventReuse} passwords`);
    }

    if (policy.maxAge > 0) {
      requirements.push(`Must be changed every ${policy.maxAge} days`);
    }

    return requirements.join('\n• ');
  }
}

export const passwordSecurityService = new PasswordSecurityService();
