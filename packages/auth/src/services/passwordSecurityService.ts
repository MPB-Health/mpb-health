import { supabase } from '@mpbhealth/database';

export interface PasswordStrength {
  score: number;
  label: 'Weak' | 'Fair' | 'Good' | 'Strong' | 'Very Strong';
  feedback: string[];
  passed: boolean;
  requirements: PasswordRequirement[];
}

export interface PasswordRequirement {
  id: string;
  label: string;
  met: boolean;
}

export interface PasswordPolicy {
  minLength: number;
  maxLength: number;
  minUniqueChars: number;
  requireUppercase: boolean;
  requireLowercase: boolean;
  requireNumbers: boolean;
  requireSpecialChars: boolean;
  preventReuse: number;
  maxAge: number;
}

// Keyboard patterns to detect (qwerty, numeric sequences, etc.)
const KEYBOARD_PATTERNS = [
  'qwerty', 'qwertz', 'azerty', 'asdfgh', 'zxcvbn',
  '123456', '234567', '345678', '456789', '567890',
  '987654', '876543', '765432', '654321', '543210',
  'abcdef', 'bcdefg', 'cdefgh', 'defghi',
  '!@#$%^', '@#$%^&',
  'qazwsx', 'wsxedc', 'edcrfv',
];

// Common words that shouldn't be in passwords
const COMMON_WORDS = [
  'password', 'letmein', 'welcome', 'admin', 'login',
  'hello', 'dragon', 'master', 'monkey', 'shadow',
  'sunshine', 'princess', 'football', 'baseball', 'soccer',
  'hockey', 'batman', 'trustno1', 'superman', 'iloveyou',
  'starwars', 'whatever', 'passw0rd', 'access', 'secret',
  'michael', 'jennifer', 'jessica', 'ashley', 'daniel',
  'computer', 'internet', 'network', 'security', 'system',
];

class PasswordSecurityService {
  private readonly DEFAULT_POLICY: PasswordPolicy = {
    minLength: 12,
    maxLength: 128,
    minUniqueChars: 8,
    requireUppercase: true,
    requireLowercase: true,
    requireNumbers: true,
    requireSpecialChars: true,
    preventReuse: 5,
    maxAge: 90,
  };

  /**
   * Get the default password policy
   */
  getDefaultPolicy(): PasswordPolicy {
    return { ...this.DEFAULT_POLICY };
  }

  /**
   * Count unique characters in a string
   */
  private countUniqueChars(str: string): number {
    return new Set(str).size;
  }

  /**
   * Check for keyboard patterns
   */
  private hasKeyboardPattern(password: string): boolean {
    const lower = password.toLowerCase();
    return KEYBOARD_PATTERNS.some(pattern =>
      lower.includes(pattern) || lower.includes(pattern.split('').reverse().join(''))
    );
  }

  /**
   * Check for common words
   */
  private hasCommonWord(password: string): boolean {
    const lower = password.toLowerCase();
    return COMMON_WORDS.some(word => lower.includes(word));
  }

  /**
   * Check if password contains user info (email, name parts)
   */
  containsUserInfo(password: string, userInfo: { email?: string; firstName?: string; lastName?: string }): boolean {
    const lower = password.toLowerCase();
    const checks: string[] = [];

    if (userInfo.email) {
      // Extract username from email
      const emailParts = userInfo.email.toLowerCase().split('@');
      if (emailParts[0] && emailParts[0].length >= 3) {
        checks.push(emailParts[0]);
      }
      // Check domain name too
      if (emailParts[1]) {
        const domain = emailParts[1].split('.')[0];
        if (domain && domain.length >= 3) {
          checks.push(domain);
        }
      }
    }

    if (userInfo.firstName && userInfo.firstName.length >= 3) {
      checks.push(userInfo.firstName.toLowerCase());
    }

    if (userInfo.lastName && userInfo.lastName.length >= 3) {
      checks.push(userInfo.lastName.toLowerCase());
    }

    return checks.some(check => lower.includes(check));
  }

  validatePassword(
    password: string,
    policy: PasswordPolicy = this.DEFAULT_POLICY,
    userInfo?: { email?: string; firstName?: string; lastName?: string }
  ): {
    valid: boolean;
    errors: string[];
  } {
    const errors: string[] = [];

    // Length checks
    if (password.length < policy.minLength) {
      errors.push(`Password must be at least ${policy.minLength} characters long`);
    }

    if (password.length > policy.maxLength) {
      errors.push(`Password must be ${policy.maxLength} characters or less`);
    }

    // Unique characters check
    if (this.countUniqueChars(password) < policy.minUniqueChars) {
      errors.push(`Password must contain at least ${policy.minUniqueChars} unique characters`);
    }

    // Character class requirements
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

    // Keyboard pattern check
    if (this.hasKeyboardPattern(password)) {
      errors.push('Password cannot contain keyboard patterns (e.g., qwerty, 123456)');
    }

    // Common word check
    if (this.hasCommonWord(password)) {
      errors.push('Password cannot contain common words');
    }

    // User info check
    if (userInfo && this.containsUserInfo(password, userInfo)) {
      errors.push('Password cannot contain your email or name');
    }

    return {
      valid: errors.length === 0,
      errors,
    };
  }

  calculatePasswordStrength(
    password: string,
    userInfo?: { email?: string; firstName?: string; lastName?: string }
  ): PasswordStrength {
    const feedback: string[] = [];
    const requirements: PasswordRequirement[] = [];
    let score = 0;

    // Length scoring
    const lengthMet = password.length >= 12;
    requirements.push({ id: 'length', label: 'At least 12 characters', met: lengthMet });
    if (password.length >= 8) score += 1;
    if (password.length >= 12) score += 1;
    if (password.length >= 16) score += 1;
    if (password.length >= 20) score += 0.5;

    // Character class scoring
    const hasLower = /[a-z]/.test(password);
    const hasUpper = /[A-Z]/.test(password);
    const hasDigit = /\d/.test(password);
    const hasSpecial = /[!@#$%^&*()_+\-=[\]{};':"\\|,.<>/?]/.test(password);

    requirements.push({ id: 'lowercase', label: 'Lowercase letter', met: hasLower });
    requirements.push({ id: 'uppercase', label: 'Uppercase letter', met: hasUpper });
    requirements.push({ id: 'number', label: 'Number', met: hasDigit });
    requirements.push({ id: 'special', label: 'Special character', met: hasSpecial });

    if (hasLower) score += 1;
    if (hasUpper) score += 1;
    if (hasDigit) score += 1;
    if (hasSpecial) score += 1;

    // Unique characters
    const uniqueChars = this.countUniqueChars(password);
    const uniqueMet = uniqueChars >= 8;
    requirements.push({ id: 'unique', label: 'At least 8 unique characters', met: uniqueMet });
    if (uniqueChars >= 8) score += 1;
    if (uniqueChars >= 12) score += 0.5;

    // Repetition penalty
    const noRepetition = !/(.)\1{2,}/.test(password);
    requirements.push({ id: 'no-repeat', label: 'No repeating characters', met: noRepetition });
    if (noRepetition) {
      score += 1;
    } else {
      feedback.push('Avoid repeating characters');
    }

    // Keyboard pattern penalty
    const noKeyboardPattern = !this.hasKeyboardPattern(password);
    requirements.push({ id: 'no-pattern', label: 'No keyboard patterns', met: noKeyboardPattern });
    if (noKeyboardPattern) {
      score += 1;
    } else {
      feedback.push('Avoid keyboard patterns like qwerty or 123456');
    }

    // Common word penalty
    const noCommonWord = !this.hasCommonWord(password);
    requirements.push({ id: 'no-common', label: 'No common words', met: noCommonWord });
    if (noCommonWord) {
      score += 1;
    } else {
      feedback.push('Avoid common words');
    }

    // User info penalty
    if (userInfo) {
      const noUserInfo = !this.containsUserInfo(password, userInfo);
      requirements.push({ id: 'no-user-info', label: 'No personal info', met: noUserInfo });
      if (!noUserInfo) {
        score -= 2;
        feedback.push('Password should not contain your email or name');
      }
    }

    // Normalize score to 0-100
    const normalizedScore = Math.max(0, Math.min(100, Math.round((score / 12) * 100)));

    let label: PasswordStrength['label'];
    let passed = false;

    if (normalizedScore <= 25) {
      label = 'Weak';
      feedback.push('Use a longer password with mixed characters');
    } else if (normalizedScore <= 45) {
      label = 'Fair';
      feedback.push('Add more character variety for better security');
    } else if (normalizedScore <= 65) {
      label = 'Good';
      passed = true;
    } else if (normalizedScore <= 85) {
      label = 'Strong';
      passed = true;
    } else {
      label = 'Very Strong';
      passed = true;
    }

    return {
      score: normalizedScore,
      label,
      feedback,
      passed,
      requirements,
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
