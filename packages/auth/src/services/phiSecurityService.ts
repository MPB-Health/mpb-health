/**
 * PHI (Protected Health Information) Security Service
 * 
 * HIPAA §164.312(b) - Audit Controls
 * HIPAA §164.312(a)(1) - Access Control
 * 
 * Provides:
 * - PHI access logging for all read/write operations
 * - Field-level access tracking
 * - Data minimization helpers
 * - PHI data masking utilities
 */

import { supabase } from '@mpbhealth/database';

// ============================================================================
// PHI Table & Field Registry
// ============================================================================

/**
 * Registry of tables and fields that contain PHI.
 * Any access to these fields MUST be logged.
 */
export const PHI_REGISTRY: Record<string, string[]> = {
  // User/profile data
  profiles: ['first_name', 'last_name', 'email', 'phone', 'date_of_birth', 'address'],
  // Health-related data
  health_plans: ['member_name', 'member_ssn', 'member_dob', 'medical_conditions', 'medications'],
  plan_members: ['first_name', 'last_name', 'ssn', 'date_of_birth', 'email', 'phone', 'address'],
  // Contact/lead data with health info
  leads: ['first_name', 'last_name', 'email', 'phone', 'notes'],
  contacts: ['first_name', 'last_name', 'email', 'phone', 'address'],
};

/**
 * Check if a table contains PHI fields
 */
export function isPhiTable(tableName: string): boolean {
  return tableName in PHI_REGISTRY;
}

/**
 * Get the PHI fields for a given table
 */
export function getPhiFields(tableName: string): string[] {
  return PHI_REGISTRY[tableName] || [];
}

// ============================================================================
// PHI Access Logging
// ============================================================================

export type PhiAccessType = 'read' | 'write' | 'delete' | 'export';

export interface PhiAccessLogEntry {
  userId: string;
  tableName: string;
  recordId: string;
  accessType: PhiAccessType;
  fieldsAccessed?: string[];
  justification?: string;
}

/**
 * Log a PHI access event to the audit trail.
 * This is REQUIRED by HIPAA §164.312(b) for all PHI operations.
 */
export async function logPhiAccess(entry: PhiAccessLogEntry): Promise<void> {
  try {
    // Determine which fields are actually PHI
    const phiFields = getPhiFields(entry.tableName);
    const accessedPhiFields = entry.fieldsAccessed
      ? entry.fieldsAccessed.filter(f => phiFields.includes(f))
      : phiFields; // If no specific fields listed, assume all PHI fields accessed

    // Only log if actual PHI fields were accessed
    if (accessedPhiFields.length === 0 && entry.fieldsAccessed) {
      return; // No PHI fields were accessed
    }

    await supabase.from('phi_access_log').insert({
      user_id: entry.userId,
      phi_table: entry.tableName,
      phi_record_id: entry.recordId,
      access_type: entry.accessType,
      fields_accessed: accessedPhiFields,
      justification: entry.justification || null,
      ip_address: null, // Set by server-side if available
    });
  } catch (error) {
    // CRITICAL: PHI access log failures should be logged but never crash the app
    console.error('[HIPAA] Failed to log PHI access:', error);
    // In a production environment, this should trigger an alert
  }
}

// ============================================================================
// PHI Data Masking
// ============================================================================

/**
 * Mask an SSN for display (show last 4 only)
 * Input: "123-45-6789" → Output: "***-**-6789"
 */
export function maskSSN(ssn: string): string {
  if (!ssn || ssn.length < 4) return '***-**-****';
  const last4 = ssn.replace(/\D/g, '').slice(-4);
  return `***-**-${last4}`;
}

/**
 * Mask an email for display
 * Input: "john.doe@example.com" → Output: "j***e@example.com"
 */
export function maskEmail(email: string): string {
  if (!email || !email.includes('@')) return '***@***.***';
  const [local, domain] = email.split('@');
  if (local.length <= 2) return `${local[0]}***@${domain}`;
  return `${local[0]}${'*'.repeat(Math.min(local.length - 2, 5))}${local[local.length - 1]}@${domain}`;
}

/**
 * Mask a phone number for display
 * Input: "(555) 123-4567" → Output: "(***) ***-4567"
 */
export function maskPhone(phone: string): string {
  if (!phone) return '(***) ***-****';
  const digits = phone.replace(/\D/g, '');
  if (digits.length < 4) return '(***) ***-****';
  const last4 = digits.slice(-4);
  return `(***) ***-${last4}`;
}

/**
 * Mask a date of birth for display
 * Input: "1990-01-15" → Output: "****-**-15"
 */
export function maskDOB(dob: string): string {
  if (!dob) return '****-**-**';
  const parts = dob.split(/[-/]/);
  if (parts.length < 3) return '****-**-**';
  return `****-**-${parts[parts.length - 1]}`;
}

/**
 * Mask a name for display in logs
 * Input: "John Doe" → Output: "J*** D***"
 */
export function maskName(name: string): string {
  if (!name) return '****';
  return name
    .split(' ')
    .map(part => (part.length > 0 ? `${part[0]}${'*'.repeat(Math.min(part.length - 1, 4))}` : ''))
    .join(' ');
}

// ============================================================================
// Data Minimization
// ============================================================================

/**
 * Strip PHI fields from an object, returning only non-PHI data.
 * Use this when PHI is not needed for the operation.
 */
export function stripPhiFields<T extends Record<string, unknown>>(
  data: T,
  tableName: string
): Partial<T> {
  const phiFields = new Set(getPhiFields(tableName));
  const result: Partial<T> = {};

  for (const [key, value] of Object.entries(data)) {
    if (!phiFields.has(key)) {
      (result as Record<string, unknown>)[key] = value;
    }
  }

  return result;
}

/**
 * Mask all PHI fields in an object for logging/display.
 */
export function maskPhiFields<T extends Record<string, unknown>>(
  data: T,
  tableName: string
): T {
  const phiFields = new Set(getPhiFields(tableName));
  const result = { ...data };

  for (const key of Object.keys(result)) {
    if (phiFields.has(key) && typeof result[key] === 'string') {
      const value = result[key] as string;
      // Apply appropriate masking based on field name
      if (key.includes('ssn')) {
        (result as Record<string, unknown>)[key] = maskSSN(value);
      } else if (key.includes('email')) {
        (result as Record<string, unknown>)[key] = maskEmail(value);
      } else if (key.includes('phone')) {
        (result as Record<string, unknown>)[key] = maskPhone(value);
      } else if (key.includes('dob') || key.includes('date_of_birth') || key.includes('birth')) {
        (result as Record<string, unknown>)[key] = maskDOB(value);
      } else if (key.includes('name')) {
        (result as Record<string, unknown>)[key] = maskName(value);
      } else {
        (result as Record<string, unknown>)[key] = '[REDACTED]';
      }
    }
  }

  return result;
}

// ============================================================================
// Export Report Security
// ============================================================================

/**
 * Log a PHI data export event (required for HIPAA compliance).
 * Must be called whenever data is exported from the system.
 */
export async function logPhiExport(
  userId: string,
  exportType: 'csv' | 'pdf' | 'excel' | 'api',
  tableName: string,
  recordCount: number,
  filters?: Record<string, unknown>
): Promise<void> {
  await logPhiAccess({
    userId,
    tableName,
    recordId: `export:${exportType}:${recordCount}`,
    accessType: 'export',
    justification: `Data export: ${exportType} format, ${recordCount} records`,
  });

  // Also log to the security audit log for extra visibility
  try {
    await supabase.from('security_audit_log').insert({
      action: 'phi_data_export',
      resource_type: tableName,
      resource_id: `export:${exportType}`,
      user_id: userId,
      severity: recordCount > 100 ? 'critical' : 'warning',
      metadata: {
        export_type: exportType,
        record_count: recordCount,
        filters: filters || {},
      },
    });
  } catch (error) {
    console.error('[HIPAA] Failed to log PHI export to security audit:', error);
  }
}
