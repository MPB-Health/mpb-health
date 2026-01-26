import { supabase } from '@mpbhealth/database';
import { securityEventService } from './securityEventService';

export interface MFASettings {
  mfa_enabled: boolean;
  mfa_method: 'totp' | 'sms' | 'none';
  phone_number?: string;
  enrolled_at?: string;
  last_verified_at?: string;
}

export interface TrustedDevice {
  id: string;
  name: string;
  fingerprint: string;
  added_at: string;
  expires_at: string;
  last_used: string;
}

export interface MFAEnrollmentData {
  qr_code: string;
  secret: string;
  backup_codes: string[];
}

class MFAService {
  private readonly BACKUP_CODE_COUNT = 10;
  private readonly TRUSTED_DEVICE_DURATION_DAYS = 30;

  async getMFASettings(userId: string): Promise<MFASettings | null> {
    try {
      const { data, error } = await supabase
        .from('user_mfa_settings')
        .select('*')
        .eq('user_id', userId)
        .maybeSingle();

      if (error) {
        console.error('Error fetching MFA settings:', error);
        return null;
      }

      if (!data) {
        return {
          mfa_enabled: false,
          mfa_method: 'none',
        };
      }

      return {
        mfa_enabled: data.mfa_enabled,
        mfa_method: data.mfa_method,
        phone_number: data.phone_number,
        enrolled_at: data.enrolled_at,
        last_verified_at: data.last_verified_at,
      };
    } catch (error) {
      console.error('Failed to get MFA settings:', error);
      return null;
    }
  }

  async enrollTOTP(userId: string): Promise<MFAEnrollmentData | null> {
    try {
      const { data, error } = await supabase.auth.mfa.enroll({
        factorType: 'totp',
      });

      if (error || !data) {
        console.error('Error enrolling TOTP:', error);
        return null;
      }

      const backupCodes = this.generateBackupCodes();

      const { error: insertError } = await supabase
        .from('user_mfa_settings')
        .upsert({
          user_id: userId,
          mfa_enabled: false,
          mfa_method: 'totp',
          backup_codes: backupCodes,
          enrolled_at: new Date().toISOString(),
        });

      if (insertError) {
        console.error('Error saving MFA settings:', insertError);
      }

      await securityEventService.logMFAEvent(userId, 'mfa_enabled', 'totp');

      return {
        qr_code: data.totp.qr_code,
        secret: data.totp.secret,
        backup_codes: backupCodes,
      };
    } catch (error) {
      console.error('Failed to enroll TOTP:', error);
      return null;
    }
  }

  async verifyTOTPEnrollment(userId: string, code: string, factorId: string): Promise<boolean> {
    try {
      const { data, error } = await supabase.auth.mfa.challenge({
        factorId,
      });

      if (error || !data) {
        console.error('Error creating MFA challenge:', error);
        return false;
      }

      const { error: verifyError } = await supabase.auth.mfa.verify({
        factorId,
        challengeId: data.id,
        code,
      });

      if (verifyError) {
        await securityEventService.logMFAEvent(userId, 'mfa_failed', 'totp');
        return false;
      }

      await supabase
        .from('user_mfa_settings')
        .update({
          mfa_enabled: true,
          last_verified_at: new Date().toISOString(),
        })
        .eq('user_id', userId);

      await securityEventService.logMFAEvent(userId, 'mfa_verified', 'totp');

      return true;
    } catch (error) {
      console.error('Failed to verify TOTP enrollment:', error);
      return false;
    }
  }

  async verifyTOTP(userId: string, code: string): Promise<boolean> {
    try {
      const { data: factors } = await supabase.auth.mfa.listFactors();

      if (!factors || factors.totp.length === 0) {
        return false;
      }

      const factor = factors.totp[0];

      const { data: challenge, error: challengeError } = await supabase.auth.mfa.challenge({
        factorId: factor.id,
      });

      if (challengeError || !challenge) {
        console.error('Error creating challenge:', challengeError);
        return false;
      }

      const { error: verifyError } = await supabase.auth.mfa.verify({
        factorId: factor.id,
        challengeId: challenge.id,
        code,
      });

      if (verifyError) {
        await securityEventService.logMFAEvent(userId, 'mfa_failed', 'totp');
        return false;
      }

      await supabase
        .from('user_mfa_settings')
        .update({
          last_verified_at: new Date().toISOString(),
        })
        .eq('user_id', userId);

      await securityEventService.logMFAEvent(userId, 'mfa_verified', 'totp');

      return true;
    } catch (error) {
      console.error('Failed to verify TOTP:', error);
      return false;
    }
  }

  async verifyBackupCode(userId: string, code: string): Promise<boolean> {
    try {
      const { data, error } = await supabase
        .from('user_mfa_settings')
        .select('backup_codes')
        .eq('user_id', userId)
        .maybeSingle();

      if (error || !data || !data.backup_codes) {
        return false;
      }

      const codeIndex = data.backup_codes.indexOf(code);
      if (codeIndex === -1) {
        return false;
      }

      const updatedCodes = data.backup_codes.filter((c: string) => c !== code);

      await supabase
        .from('user_mfa_settings')
        .update({
          backup_codes: updatedCodes,
          last_verified_at: new Date().toISOString(),
        })
        .eq('user_id', userId);

      await securityEventService.logMFAEvent(userId, 'mfa_verified', 'backup_code');

      return true;
    } catch (error) {
      console.error('Failed to verify backup code:', error);
      return false;
    }
  }

  async disableMFA(userId: string): Promise<boolean> {
    try {
      const { data: factors } = await supabase.auth.mfa.listFactors();

      if (factors && factors.totp.length > 0) {
        for (const factor of factors.totp) {
          await supabase.auth.mfa.unenroll({ factorId: factor.id });
        }
      }

      const { error } = await supabase
        .from('user_mfa_settings')
        .update({
          mfa_enabled: false,
          mfa_method: 'none',
          backup_codes: [],
          trusted_devices: [],
        })
        .eq('user_id', userId);

      if (error) {
        console.error('Error disabling MFA:', error);
        return false;
      }

      await securityEventService.logMFAEvent(userId, 'mfa_disabled');

      return true;
    } catch (error) {
      console.error('Failed to disable MFA:', error);
      return false;
    }
  }

  async regenerateBackupCodes(userId: string): Promise<string[] | null> {
    try {
      const backupCodes = this.generateBackupCodes();

      const { error } = await supabase
        .from('user_mfa_settings')
        .update({
          backup_codes: backupCodes,
        })
        .eq('user_id', userId);

      if (error) {
        console.error('Error regenerating backup codes:', error);
        return null;
      }

      return backupCodes;
    } catch (error) {
      console.error('Failed to regenerate backup codes:', error);
      return null;
    }
  }

  async addTrustedDevice(
    userId: string,
    deviceName: string,
    deviceFingerprint: string
  ): Promise<boolean> {
    try {
      const expiresAt = new Date();
      expiresAt.setDate(expiresAt.getDate() + this.TRUSTED_DEVICE_DURATION_DAYS);

      const trustedDevice: TrustedDevice = {
        id: crypto.randomUUID(),
        name: deviceName,
        fingerprint: deviceFingerprint,
        added_at: new Date().toISOString(),
        expires_at: expiresAt.toISOString(),
        last_used: new Date().toISOString(),
      };

      const { data: settings, error: fetchError } = await supabase
        .from('user_mfa_settings')
        .select('trusted_devices')
        .eq('user_id', userId)
        .maybeSingle();

      if (fetchError) {
        console.error('Error fetching MFA settings:', fetchError);
        return false;
      }

      const trustedDevices = settings?.trusted_devices || [];
      trustedDevices.push(trustedDevice);

      const { error: updateError } = await supabase
        .from('user_mfa_settings')
        .update({
          trusted_devices: trustedDevices,
        })
        .eq('user_id', userId);

      if (updateError) {
        console.error('Error adding trusted device:', updateError);
        return false;
      }

      return true;
    } catch (error) {
      console.error('Failed to add trusted device:', error);
      return false;
    }
  }

  async isTrustedDevice(userId: string, deviceFingerprint: string): Promise<boolean> {
    try {
      const { data, error } = await supabase
        .from('user_mfa_settings')
        .select('trusted_devices')
        .eq('user_id', userId)
        .maybeSingle();

      if (error || !data || !data.trusted_devices) {
        return false;
      }

      const trustedDevices: TrustedDevice[] = data.trusted_devices;
      const now = new Date();

      const validDevice = trustedDevices.find(
        device =>
          device.fingerprint === deviceFingerprint &&
          new Date(device.expires_at) > now
      );

      if (validDevice) {
        await this.updateDeviceLastUsed(userId, validDevice.id);
        return true;
      }

      return false;
    } catch (error) {
      console.error('Failed to check trusted device:', error);
      return false;
    }
  }

  async removeTrustedDevice(userId: string, deviceId: string): Promise<boolean> {
    try {
      const { data, error: fetchError } = await supabase
        .from('user_mfa_settings')
        .select('trusted_devices')
        .eq('user_id', userId)
        .maybeSingle();

      if (fetchError || !data) {
        return false;
      }

      const trustedDevices: TrustedDevice[] = data.trusted_devices || [];
      const updatedDevices = trustedDevices.filter(device => device.id !== deviceId);

      const { error: updateError } = await supabase
        .from('user_mfa_settings')
        .update({
          trusted_devices: updatedDevices,
        })
        .eq('user_id', userId);

      return !updateError;
    } catch (error) {
      console.error('Failed to remove trusted device:', error);
      return false;
    }
  }

  async getTrustedDevices(userId: string): Promise<TrustedDevice[]> {
    try {
      const { data, error } = await supabase
        .from('user_mfa_settings')
        .select('trusted_devices')
        .eq('user_id', userId)
        .maybeSingle();

      if (error || !data || !data.trusted_devices) {
        return [];
      }

      const now = new Date();
      return data.trusted_devices.filter(
        (device: TrustedDevice) => new Date(device.expires_at) > now
      );
    } catch (error) {
      console.error('Failed to get trusted devices:', error);
      return [];
    }
  }

  private async updateDeviceLastUsed(userId: string, deviceId: string): Promise<void> {
    try {
      const { data, error: fetchError } = await supabase
        .from('user_mfa_settings')
        .select('trusted_devices')
        .eq('user_id', userId)
        .maybeSingle();

      if (fetchError || !data) {
        return;
      }

      const trustedDevices: TrustedDevice[] = data.trusted_devices || [];
      const updatedDevices = trustedDevices.map(device =>
        device.id === deviceId
          ? { ...device, last_used: new Date().toISOString() }
          : device
      );

      await supabase
        .from('user_mfa_settings')
        .update({
          trusted_devices: updatedDevices,
        })
        .eq('user_id', userId);
    } catch (error) {
      console.error('Failed to update device last used:', error);
    }
  }

  private generateBackupCodes(): string[] {
    const codes: string[] = [];
    for (let i = 0; i < this.BACKUP_CODE_COUNT; i++) {
      const code = this.generateRandomCode(8);
      codes.push(code);
    }
    return codes;
  }

  private generateRandomCode(length: number): string {
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
    let result = '';
    const array = new Uint8Array(length);
    crypto.getRandomValues(array);

    for (let i = 0; i < length; i++) {
      result += chars[array[i] % chars.length];
    }

    return result.match(/.{1,4}/g)?.join('-') || result;
  }

  generateDeviceFingerprint(): string {
    const components = [
      navigator.userAgent,
      navigator.language,
      screen.width,
      screen.height,
      screen.colorDepth,
      new Date().getTimezoneOffset(),
      navigator.hardwareConcurrency || 0,
    ];

    return btoa(components.join('|'));
  }

  async isMFARequired(userId: string): Promise<boolean> {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', userId)
        .maybeSingle();

      if (error || !data) {
        return false;
      }

      return ['admin', 'staff', 'advisor'].includes(data.role);
    } catch (error) {
      console.error('Failed to check MFA requirement:', error);
      return false;
    }
  }

  async enforceMFAEnrollment(userId: string): Promise<{
    required: boolean;
    enrolled: boolean;
    message?: string;
  }> {
    try {
      const required = await this.isMFARequired(userId);

      if (!required) {
        return { required: false, enrolled: false };
      }

      const settings = await this.getMFASettings(userId);

      if (!settings || !settings.mfa_enabled) {
        return {
          required: true,
          enrolled: false,
          message: 'Multi-factor authentication is required for your account. Please enroll now.',
        };
      }

      return { required: true, enrolled: true };
    } catch (error) {
      console.error('Failed to enforce MFA enrollment:', error);
      return { required: false, enrolled: false };
    }
  }
}

export const mfaService = new MFAService();
