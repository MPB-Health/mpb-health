import { supabase } from './supabase';

interface _EncryptionKey {
  id: string;
  key_name: string;
  encrypted_key: string;
  version: number;
  active: boolean;
}

const ALGORITHM = 'AES-GCM';
const KEY_LENGTH = 256;
const IV_LENGTH = 12;
const TAG_LENGTH = 128;

class EncryptionService {
  private keyCache: Map<string, CryptoKey> = new Map();

  private async getOrCreateEncryptionKey(keyName: string): Promise<CryptoKey> {
    if (this.keyCache.has(keyName)) {
      return this.keyCache.get(keyName)!;
    }

    const { data: existingKey, error: fetchError } = await supabase
      .from('encryption_keys')
      .select('id, key_name, encrypted_key, version, active')
      .eq('key_name', keyName)
      .eq('active', true)
      .maybeSingle();

    if (fetchError) {
      console.error('Error fetching encryption key:', fetchError);
      throw new Error('Failed to fetch encryption key');
    }

    let cryptoKey: CryptoKey;

    if (existingKey) {
      cryptoKey = await this.importKey(existingKey.encrypted_key);
    } else {
      cryptoKey = await this.generateNewKey();
      const exportedKey = await this.exportKey(cryptoKey);

      const { error: insertError } = await supabase
        .from('encryption_keys')
        .insert({
          key_name: keyName,
          key_type: 'DEK',
          encrypted_key: exportedKey,
          version: 1,
          active: true,
          rotation_date: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000).toISOString(),
        });

      if (insertError) {
        console.error('Error storing encryption key:', insertError);
        throw new Error('Failed to store encryption key');
      }
    }

    this.keyCache.set(keyName, cryptoKey);
    return cryptoKey;
  }

  private async generateNewKey(): Promise<CryptoKey> {
    return await crypto.subtle.generateKey(
      {
        name: ALGORITHM,
        length: KEY_LENGTH,
      },
      true,
      ['encrypt', 'decrypt']
    );
  }

  private async exportKey(key: CryptoKey): Promise<string> {
    const exported = await crypto.subtle.exportKey('raw', key);
    const exportedKeyBuffer = new Uint8Array(exported);
    const base64Key = btoa(String.fromCharCode(...exportedKeyBuffer));
    return base64Key;
  }

  private async importKey(base64Key: string): Promise<CryptoKey> {
    const keyData = Uint8Array.from(atob(base64Key), c => c.charCodeAt(0));
    return await crypto.subtle.importKey(
      'raw',
      keyData,
      {
        name: ALGORITHM,
        length: KEY_LENGTH,
      },
      true,
      ['encrypt', 'decrypt']
    );
  }

  async encryptField(plaintext: string, keyName: string = 'phi_data_key'): Promise<string> {
    if (!plaintext) {
      return '';
    }

    try {
      const key = await this.getOrCreateEncryptionKey(keyName);
      const iv = crypto.getRandomValues(new Uint8Array(IV_LENGTH));
      const encoder = new TextEncoder();
      const data = encoder.encode(plaintext);

      const encryptedData = await crypto.subtle.encrypt(
        {
          name: ALGORITHM,
          iv: iv,
          tagLength: TAG_LENGTH,
        },
        key,
        data
      );

      const encryptedArray = new Uint8Array(encryptedData);
      const combined = new Uint8Array(iv.length + encryptedArray.length);
      combined.set(iv);
      combined.set(encryptedArray, iv.length);

      return btoa(String.fromCharCode(...combined));
    } catch (error) {
      console.error('Encryption error:', error);
      throw new Error('Failed to encrypt data');
    }
  }

  async decryptField(ciphertext: string, keyName: string = 'phi_data_key'): Promise<string> {
    if (!ciphertext) {
      return '';
    }

    try {
      const key = await this.getOrCreateEncryptionKey(keyName);
      const combined = Uint8Array.from(atob(ciphertext), c => c.charCodeAt(0));
      const iv = combined.slice(0, IV_LENGTH);
      const encryptedData = combined.slice(IV_LENGTH);

      const decryptedData = await crypto.subtle.decrypt(
        {
          name: ALGORITHM,
          iv: iv,
          tagLength: TAG_LENGTH,
        },
        key,
        encryptedData
      );

      const decoder = new TextDecoder();
      return decoder.decode(decryptedData);
    } catch (error) {
      console.error('Decryption error:', error);
      throw new Error('Failed to decrypt data');
    }
  }

  async encryptPHI(data: {
    ssn?: string;
    medical_record_number?: string;
    diagnosis_codes?: string[];
    payment_info?: string;
  }): Promise<{
    ssn_encrypted?: string;
    medical_record_encrypted?: string;
    diagnosis_codes_encrypted?: string;
    payment_info_encrypted?: string;
  }> {
    const encrypted: any = {};

    if (data.ssn) {
      encrypted.ssn_encrypted = await this.encryptField(data.ssn, 'ssn_key');
    }

    if (data.medical_record_number) {
      encrypted.medical_record_encrypted = await this.encryptField(
        data.medical_record_number,
        'medical_record_key'
      );
    }

    if (data.diagnosis_codes && data.diagnosis_codes.length > 0) {
      encrypted.diagnosis_codes_encrypted = await this.encryptField(
        JSON.stringify(data.diagnosis_codes),
        'diagnosis_key'
      );
    }

    if (data.payment_info) {
      encrypted.payment_info_encrypted = await this.encryptField(
        data.payment_info,
        'payment_key'
      );
    }

    return encrypted;
  }

  async decryptPHI(data: {
    ssn_encrypted?: string;
    medical_record_encrypted?: string;
    diagnosis_codes_encrypted?: string;
    payment_info_encrypted?: string;
  }): Promise<{
    ssn?: string;
    medical_record_number?: string;
    diagnosis_codes?: string[];
    payment_info?: string;
  }> {
    const decrypted: any = {};

    if (data.ssn_encrypted) {
      decrypted.ssn = await this.decryptField(data.ssn_encrypted, 'ssn_key');
    }

    if (data.medical_record_encrypted) {
      decrypted.medical_record_number = await this.decryptField(
        data.medical_record_encrypted,
        'medical_record_key'
      );
    }

    if (data.diagnosis_codes_encrypted) {
      const decryptedCodes = await this.decryptField(
        data.diagnosis_codes_encrypted,
        'diagnosis_key'
      );
      decrypted.diagnosis_codes = JSON.parse(decryptedCodes);
    }

    if (data.payment_info_encrypted) {
      decrypted.payment_info = await this.decryptField(
        data.payment_info_encrypted,
        'payment_key'
      );
    }

    return decrypted;
  }

  async logPHIAccess(
    tableName: string,
    recordId: string,
    operation: 'SELECT' | 'INSERT' | 'UPDATE' | 'DELETE',
    phiFields: string[],
    justification?: string
  ): Promise<void> {
    try {
      const { data: { user } } = await supabase.auth.getUser();

      if (!user) {
        console.warn('No user found for PHI access logging');
        return;
      }

      await supabase.from('phi_access_log').insert({
        user_id: user.id,
        table_name: tableName,
        record_id: recordId,
        operation,
        phi_fields: phiFields,
        justification,
      });
    } catch (error) {
      console.error('Failed to log PHI access:', error);
    }
  }

  clearKeyCache(): void {
    this.keyCache.clear();
  }
}

export const encryptionService = new EncryptionService();
