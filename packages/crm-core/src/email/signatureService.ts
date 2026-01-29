// ============================================================================
// Email Signature Service
// Manage email signatures with logos and rich content
// ============================================================================

import type { SupabaseClient } from '@supabase/supabase-js';
import type {
  EmailSignature,
  SignatureCreateInput,
  SignatureUpdateInput,
} from './emailTypes';

export class SignatureService {
  constructor(private supabase: SupabaseClient) {}

  // ============================================================================
  // Get User Signatures
  // ============================================================================

  async getUserSignatures(orgId: string): Promise<EmailSignature[]> {
    const { data: { user } } = await this.supabase.auth.getUser();
    if (!user) throw new Error('Not authenticated');

    const { data, error } = await this.supabase
      .from('crm_email_signatures')
      .select('*')
      .eq('user_id', user.id)
      .eq('org_id', orgId)
      .order('is_default', { ascending: false })
      .order('name');

    if (error) {
      console.error('[SignatureService] Failed to get signatures:', error);
      throw new Error(`Failed to get signatures: ${error.message}`);
    }

    return data || [];
  }

  // ============================================================================
  // Get Default Signature
  // ============================================================================

  async getDefaultSignature(orgId: string): Promise<EmailSignature | null> {
    const { data: { user } } = await this.supabase.auth.getUser();
    if (!user) return null;

    const { data, error } = await this.supabase
      .from('crm_email_signatures')
      .select('*')
      .eq('user_id', user.id)
      .eq('org_id', orgId)
      .eq('is_default', true)
      .single();

    if (error) {
      if (error.code === 'PGRST116') return null;
      console.error('[SignatureService] Failed to get default signature:', error);
      return null;
    }

    return data;
  }

  // ============================================================================
  // Get Single Signature
  // ============================================================================

  async getSignature(id: string): Promise<EmailSignature | null> {
    const { data, error } = await this.supabase
      .from('crm_email_signatures')
      .select('*')
      .eq('id', id)
      .single();

    if (error) {
      if (error.code === 'PGRST116') return null;
      console.error('[SignatureService] Failed to get signature:', error);
      throw new Error(`Failed to get signature: ${error.message}`);
    }

    return data;
  }

  // ============================================================================
  // Create Signature
  // ============================================================================

  async createSignature(orgId: string, input: SignatureCreateInput): Promise<EmailSignature> {
    const { data: { user } } = await this.supabase.auth.getUser();
    if (!user) throw new Error('Not authenticated');

    // If this is default, unset other defaults
    if (input.is_default) {
      await this.supabase
        .from('crm_email_signatures')
        .update({ is_default: false })
        .eq('user_id', user.id)
        .eq('org_id', orgId);
    }

    const { data, error } = await this.supabase
      .from('crm_email_signatures')
      .insert({
        user_id: user.id,
        org_id: orgId,
        name: input.name,
        is_default: input.is_default || false,
        content: input.content,
        variables: input.variables || {},
        logo_url: input.logo_url,
        logo_storage_path: input.logo_storage_path,
        banner_url: input.banner_url,
        banner_storage_path: input.banner_storage_path,
        social_links: input.social_links || [],
        font_family: input.font_family || 'Arial, sans-serif',
        primary_color: input.primary_color || '#6366F1',
      })
      .select()
      .single();

    if (error) {
      console.error('[SignatureService] Failed to create signature:', error);
      throw new Error(`Failed to create signature: ${error.message}`);
    }

    return data;
  }

  // ============================================================================
  // Update Signature
  // ============================================================================

  async updateSignature(id: string, input: SignatureUpdateInput): Promise<EmailSignature> {
    const { data: { user } } = await this.supabase.auth.getUser();
    if (!user) throw new Error('Not authenticated');

    // If setting as default, unset other defaults
    if (input.is_default) {
      const existing = await this.getSignature(id);
      if (existing) {
        await this.supabase
          .from('crm_email_signatures')
          .update({ is_default: false })
          .eq('user_id', user.id)
          .eq('org_id', existing.org_id)
          .neq('id', id);
      }
    }

    const { data, error } = await this.supabase
      .from('crm_email_signatures')
      .update({
        ...input,
        updated_at: new Date().toISOString(),
      })
      .eq('id', id)
      .eq('user_id', user.id)
      .select()
      .single();

    if (error) {
      console.error('[SignatureService] Failed to update signature:', error);
      throw new Error(`Failed to update signature: ${error.message}`);
    }

    return data;
  }

  // ============================================================================
  // Delete Signature
  // ============================================================================

  async deleteSignature(id: string): Promise<void> {
    const { data: { user } } = await this.supabase.auth.getUser();
    if (!user) throw new Error('Not authenticated');

    // Get signature to check for logo/banner to delete
    const signature = await this.getSignature(id);
    if (signature) {
      // Delete logo from storage if exists
      if (signature.logo_storage_path) {
        await this.supabase.storage
          .from('email-attachments')
          .remove([signature.logo_storage_path]);
      }
      // Delete banner from storage if exists
      if (signature.banner_storage_path) {
        await this.supabase.storage
          .from('email-attachments')
          .remove([signature.banner_storage_path]);
      }
    }

    const { error } = await this.supabase
      .from('crm_email_signatures')
      .delete()
      .eq('id', id)
      .eq('user_id', user.id);

    if (error) {
      console.error('[SignatureService] Failed to delete signature:', error);
      throw new Error(`Failed to delete signature: ${error.message}`);
    }
  }

  // ============================================================================
  // Upload Logo
  // ============================================================================

  async uploadLogo(
    signatureId: string,
    file: File
  ): Promise<{ url: string; path: string }> {
    const { data: { user } } = await this.supabase.auth.getUser();
    if (!user) throw new Error('Not authenticated');

    // Validate file
    const allowedTypes = ['image/png', 'image/jpeg', 'image/gif', 'image/svg+xml'];
    if (!allowedTypes.includes(file.type)) {
      throw new Error('Invalid file type. Only PNG, JPEG, GIF, and SVG are allowed.');
    }

    const maxSize = 2 * 1024 * 1024; // 2MB
    if (file.size > maxSize) {
      throw new Error('File too large. Maximum size is 2MB.');
    }

    // Generate unique path
    const ext = file.name.split('.').pop();
    const path = `signatures/${user.id}/${signatureId}/logo.${ext}`;

    // Upload to storage
    const { error: uploadError } = await this.supabase.storage
      .from('email-attachments')
      .upload(path, file, {
        cacheControl: '3600',
        upsert: true,
      });

    if (uploadError) {
      console.error('[SignatureService] Failed to upload logo:', uploadError);
      throw new Error(`Failed to upload logo: ${uploadError.message}`);
    }

    // Get public URL
    const { data: { publicUrl } } = this.supabase.storage
      .from('email-attachments')
      .getPublicUrl(path);

    // Update signature with logo
    await this.updateSignature(signatureId, {
      logo_url: publicUrl,
      logo_storage_path: path,
    });

    return { url: publicUrl, path };
  }

  // ============================================================================
  // Upload Banner
  // ============================================================================

  async uploadBanner(
    signatureId: string,
    file: File
  ): Promise<{ url: string; path: string }> {
    const { data: { user } } = await this.supabase.auth.getUser();
    if (!user) throw new Error('Not authenticated');

    // Validate file
    const allowedTypes = ['image/png', 'image/jpeg', 'image/gif'];
    if (!allowedTypes.includes(file.type)) {
      throw new Error('Invalid file type. Only PNG, JPEG, and GIF are allowed.');
    }

    const maxSize = 5 * 1024 * 1024; // 5MB
    if (file.size > maxSize) {
      throw new Error('File too large. Maximum size is 5MB.');
    }

    // Generate unique path
    const ext = file.name.split('.').pop();
    const path = `signatures/${user.id}/${signatureId}/banner.${ext}`;

    // Upload to storage
    const { error: uploadError } = await this.supabase.storage
      .from('email-attachments')
      .upload(path, file, {
        cacheControl: '3600',
        upsert: true,
      });

    if (uploadError) {
      console.error('[SignatureService] Failed to upload banner:', uploadError);
      throw new Error(`Failed to upload banner: ${uploadError.message}`);
    }

    // Get public URL
    const { data: { publicUrl } } = this.supabase.storage
      .from('email-attachments')
      .getPublicUrl(path);

    // Update signature with banner
    await this.updateSignature(signatureId, {
      banner_url: publicUrl,
      banner_storage_path: path,
    });

    return { url: publicUrl, path };
  }

  // ============================================================================
  // Render Signature
  // ============================================================================

  renderSignature(
    signature: EmailSignature,
    overrideVars?: Record<string, string>
  ): string {
    let content = signature.content;
    const variables = { ...signature.variables, ...overrideVars };

    // Replace variables
    for (const [key, value] of Object.entries(variables)) {
      const regex = new RegExp(`\\{\\{${key}\\}\\}`, 'g');
      content = content.replace(regex, value || '');
    }

    // Replace logo
    if (signature.logo_url) {
      content = content.replace(/\{\{logo_url\}\}/g, signature.logo_url);
    }

    // Replace banner
    if (signature.banner_url) {
      content = content.replace(/\{\{banner_url\}\}/g, signature.banner_url);
    }

    return content;
  }

  // ============================================================================
  // Duplicate Signature
  // ============================================================================

  async duplicateSignature(id: string): Promise<EmailSignature> {
    const original = await this.getSignature(id);
    if (!original) throw new Error('Signature not found');

    return this.createSignature(original.org_id, {
      name: `${original.name} (Copy)`,
      is_default: false,
      content: original.content,
      variables: original.variables,
      social_links: original.social_links,
      font_family: original.font_family,
      primary_color: original.primary_color,
    });
  }

  // ============================================================================
  // Get Signature Templates (Pre-built)
  // ============================================================================

  getSignatureTemplates(): Array<{
    name: string;
    description: string;
    content: string;
  }> {
    return [
      {
        name: 'Professional',
        description: 'Clean professional signature with company info',
        content: `
<table cellpadding="0" cellspacing="0" style="font-family: {{font_family}}; font-size: 14px; color: #333;">
  <tr>
    <td style="padding-right: 15px; border-right: 2px solid {{primary_color}};">
      {{#if logo_url}}<img src="{{logo_url}}" alt="Logo" style="max-height: 60px; max-width: 120px;">{{/if}}
    </td>
    <td style="padding-left: 15px;">
      <div style="font-weight: bold; font-size: 16px; color: {{primary_color}};">{{user_name}}</div>
      <div style="color: #666;">{{user_title}}</div>
      <div style="margin-top: 8px;">
        <span>{{phone}}</span>
        <span style="margin: 0 8px;">|</span>
        <a href="mailto:{{email}}" style="color: {{primary_color}}; text-decoration: none;">{{email}}</a>
      </div>
      <div style="margin-top: 4px; color: #888;">{{company_name}}</div>
    </td>
  </tr>
</table>`,
      },
      {
        name: 'Modern',
        description: 'Modern signature with social links',
        content: `
<table cellpadding="0" cellspacing="0" style="font-family: {{font_family}}; font-size: 14px;">
  <tr>
    <td>
      <div style="font-size: 18px; font-weight: bold; color: {{primary_color}};">{{user_name}}</div>
      <div style="color: #666; margin: 4px 0;">{{user_title}} at {{company_name}}</div>
      <div style="margin-top: 12px;">
        <a href="tel:{{phone}}" style="color: #333; text-decoration: none; margin-right: 16px;">{{phone}}</a>
        <a href="mailto:{{email}}" style="color: {{primary_color}}; text-decoration: none;">{{email}}</a>
      </div>
      {{#if logo_url}}
      <div style="margin-top: 12px;">
        <img src="{{logo_url}}" alt="Logo" style="max-height: 40px;">
      </div>
      {{/if}}
    </td>
  </tr>
</table>`,
      },
      {
        name: 'Minimal',
        description: 'Simple text-based signature',
        content: `
<div style="font-family: {{font_family}}; font-size: 14px; color: #333;">
  <p style="margin: 0;">Best regards,</p>
  <p style="margin: 8px 0 0 0;"><strong>{{user_name}}</strong></p>
  <p style="margin: 4px 0 0 0; color: #666;">{{user_title}}</p>
  <p style="margin: 4px 0 0 0; color: #666;">{{company_name}}</p>
  <p style="margin: 8px 0 0 0;">
    <a href="tel:{{phone}}" style="color: {{primary_color}}; text-decoration: none;">{{phone}}</a>
    &nbsp;|&nbsp;
    <a href="mailto:{{email}}" style="color: {{primary_color}}; text-decoration: none;">{{email}}</a>
  </p>
</div>`,
      },
    ];
  }
}

// Factory function
export function createSignatureService(supabase: SupabaseClient): SignatureService {
  return new SignatureService(supabase);
}
