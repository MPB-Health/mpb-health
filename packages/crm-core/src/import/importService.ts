import type { SupabaseClient } from '@supabase/supabase-js';
import type {
  ImportEntityType,
  ImportFieldMapping,
  ImportOptions,
  ImportPreview,
  ImportResult,
  ImportError,
  LeadImportRow,
  ContactImportRow,
  QuoteSubmission,
  QuoteSubmissionFilters,
} from './importTypes';

export class ImportService {
  constructor(private supabase: SupabaseClient) {}

  // =========================================================================
  // CSV PARSING
  // =========================================================================

  /**
   * Parse CSV content and return preview with suggested mappings
   */
  parseCSVPreview(
    csvContent: string,
    entityType: ImportEntityType
  ): ImportPreview {
    const lines = csvContent.split(/\r?\n/).filter(line => line.trim());
    if (lines.length === 0) {
      return { headers: [], sampleRows: [], totalRows: 0, suggestedMappings: [] };
    }

    // Parse headers
    const headers = this.parseCSVLine(lines[0]);

    // Parse sample rows (first 5)
    const sampleRows: Record<string, string>[] = [];
    for (let i = 1; i < Math.min(6, lines.length); i++) {
      const values = this.parseCSVLine(lines[i]);
      const row: Record<string, string> = {};
      headers.forEach((h, idx) => {
        row[h] = values[idx] || '';
      });
      sampleRows.push(row);
    }

    // Generate suggested mappings
    const suggestedMappings = this.suggestMappings(headers, entityType);

    return {
      headers,
      sampleRows,
      totalRows: lines.length - 1,
      suggestedMappings,
    };
  }

  /**
   * Parse a single CSV line handling quoted values
   */
  private parseCSVLine(line: string): string[] {
    const result: string[] = [];
    let current = '';
    let inQuotes = false;

    for (let i = 0; i < line.length; i++) {
      const char = line[i];
      if (char === '"') {
        inQuotes = !inQuotes;
      } else if (char === ',' && !inQuotes) {
        result.push(current.trim());
        current = '';
      } else {
        current += char;
      }
    }
    result.push(current.trim());
    return result;
  }

  /**
   * Suggest field mappings based on column names
   */
  private suggestMappings(
    headers: string[],
    entityType: ImportEntityType
  ): ImportFieldMapping[] {
    const fieldMap: Record<string, string[]> = {
      first_name: ['first_name', 'firstname', 'first', 'given_name', 'givenname'],
      last_name: ['last_name', 'lastname', 'last', 'surname', 'family_name'],
      email: ['email', 'email_address', 'e-mail', 'emailaddress'],
      phone: ['phone', 'phone_number', 'telephone', 'tel', 'mobile', 'cell'],
      company: ['company', 'company_name', 'organization', 'org', 'business'],
      title: ['title', 'job_title', 'position', 'role'],
      source: ['source', 'lead_source', 'origin', 'channel'],
      notes: ['notes', 'description', 'comments', 'remarks'],
      address: ['address', 'street', 'street_address', 'mailing_address'],
      city: ['city', 'town', 'mailing_city'],
      state: ['state', 'province', 'region', 'mailing_state'],
      zip_code: ['zip', 'zip_code', 'postal_code', 'postcode', 'mailing_zip'],
    };

    return headers.map(header => {
      const normalized = header.toLowerCase().replace(/[^a-z0-9]/g, '_');
      let targetField = '';

      for (const [field, aliases] of Object.entries(fieldMap)) {
        if (aliases.includes(normalized)) {
          targetField = field;
          break;
        }
      }

      return {
        sourceColumn: header,
        targetField,
        transform: 'trim' as const,
      };
    });
  }

  // =========================================================================
  // LEAD IMPORT
  // =========================================================================

  /**
   * Import leads from CSV content
   */
  async importLeads(
    csvContent: string,
    mappings: ImportFieldMapping[],
    options: ImportOptions
  ): Promise<ImportResult> {
    const { data: user } = await this.supabase.auth.getUser();
    if (!user.user) {
      return this.errorResult('Not authenticated');
    }

    const lines = csvContent.split(/\r?\n/).filter(line => line.trim());
    if (lines.length < 2) {
      return this.errorResult('No data rows found');
    }

    const headers = this.parseCSVLine(lines[0]);
    const errors: ImportError[] = [];
    const createdIds: string[] = [];
    let successCount = 0;
    let duplicateCount = 0;

    for (let i = 1; i < lines.length; i++) {
      const values = this.parseCSVLine(lines[i]);
      const rowData: Record<string, string> = {};
      headers.forEach((h, idx) => {
        rowData[h] = values[idx] || '';
      });

      // Map to lead fields
      const lead = this.mapToLead(rowData, mappings, options);

      // Validate required fields
      if (!lead.email && !lead.phone) {
        errors.push({ row: i + 1, message: 'Email or phone is required' });
        continue;
      }

      // Check for duplicates
      if (options.skipDuplicates && lead.email) {
        const { data: existing } = await this.supabase
          .from('lead_submissions')
          .select('id')
          .eq('email', lead.email)
          .limit(1)
          .single();

        if (existing) {
          duplicateCount++;
          continue;
        }
      }

      // Insert lead
      const { data, error } = await this.supabase
        .from('lead_submissions')
        .insert({
          first_name: lead.first_name || '',
          last_name: lead.last_name || '',
          email: lead.email || '',
          phone: lead.phone || null,
          source_page: options.source || 'CSV Import',
          source_cta: 'Import',
          form_data: {
            imported: true,
            import_source: options.source || 'CSV Import',
            company: lead.company,
            title: lead.title,
            notes: lead.notes,
            tags: options.tags || [],
            ...lead,
          },
        })
        .select('id')
        .single();

      if (error) {
        errors.push({ row: i + 1, message: error.message });
      } else if (data) {
        createdIds.push(data.id);
        successCount++;
      }
    }

    return {
      jobId: crypto.randomUUID(),
      status: errors.length === 0 ? 'completed' : 'completed',
      totalRows: lines.length - 1,
      processedRows: lines.length - 1,
      successCount,
      errorCount: errors.length,
      duplicateCount,
      errors,
      createdIds,
    };
  }

  /**
   * Map CSV row to lead object
   */
  private mapToLead(
    row: Record<string, string>,
    mappings: ImportFieldMapping[],
    options: ImportOptions
  ): LeadImportRow {
    const lead: LeadImportRow = {};

    for (const mapping of mappings) {
      if (!mapping.targetField) continue;

      let value = row[mapping.sourceColumn] || '';

      // Apply transform
      switch (mapping.transform) {
        case 'lowercase':
          value = value.toLowerCase();
          break;
        case 'uppercase':
          value = value.toUpperCase();
          break;
        case 'trim':
          value = value.trim();
          break;
      }

      if (value) {
        lead[mapping.targetField] = value;
      }
    }

    // Apply default values
    if (options.defaultValues) {
      for (const [key, val] of Object.entries(options.defaultValues)) {
        if (!lead[key] && val) {
          lead[key] = String(val);
        }
      }
    }

    return lead;
  }

  // =========================================================================
  // CONTACT IMPORT
  // =========================================================================

  /**
   * Import contacts from CSV content
   */
  async importContacts(
    csvContent: string,
    mappings: ImportFieldMapping[],
    options: ImportOptions
  ): Promise<ImportResult> {
    const { data: user } = await this.supabase.auth.getUser();
    if (!user.user) {
      return this.errorResult('Not authenticated');
    }

    const lines = csvContent.split(/\r?\n/).filter(line => line.trim());
    if (lines.length < 2) {
      return this.errorResult('No data rows found');
    }

    const headers = this.parseCSVLine(lines[0]);
    const errors: ImportError[] = [];
    const createdIds: string[] = [];
    let successCount = 0;
    let duplicateCount = 0;

    for (let i = 1; i < lines.length; i++) {
      const values = this.parseCSVLine(lines[i]);
      const rowData: Record<string, string> = {};
      headers.forEach((h, idx) => {
        rowData[h] = values[idx] || '';
      });

      // Map to contact fields
      const contact = this.mapToContact(rowData, mappings, options);

      // Validate required fields
      if (!contact.first_name && !contact.last_name) {
        errors.push({ row: i + 1, message: 'First or last name is required' });
        continue;
      }

      // Check for duplicates by email
      if (options.skipDuplicates && contact.email) {
        const { data: existing } = await this.supabase
          .from('crm_contacts')
          .select('id')
          .eq('email', contact.email)
          .limit(1)
          .single();

        if (existing) {
          duplicateCount++;
          continue;
        }
      }

      // Build address object
      const mailingAddress: Record<string, string> = {};
      if (contact.mailing_address) mailingAddress.street = contact.mailing_address;
      if (contact.mailing_city) mailingAddress.city = contact.mailing_city;
      if (contact.mailing_state) mailingAddress.state = contact.mailing_state;
      if (contact.mailing_zip) mailingAddress.postal_code = contact.mailing_zip;

      // Insert contact
      const { data, error } = await this.supabase
        .from('crm_contacts')
        .insert({
          first_name: contact.first_name || '',
          last_name: contact.last_name || '',
          email: contact.email || null,
          phone: contact.phone || null,
          mobile: contact.mobile || null,
          title: contact.title || null,
          department: contact.department || null,
          mailing_address: Object.keys(mailingAddress).length > 0 ? mailingAddress : {},
          tags: options.tags || [],
          lead_source: options.source || 'CSV Import',
          created_by: user.user.id,
        })
        .select('id')
        .single();

      if (error) {
        errors.push({ row: i + 1, message: error.message });
      } else if (data) {
        createdIds.push(data.id);
        successCount++;
      }
    }

    return {
      jobId: crypto.randomUUID(),
      status: 'completed',
      totalRows: lines.length - 1,
      processedRows: lines.length - 1,
      successCount,
      errorCount: errors.length,
      duplicateCount,
      errors,
      createdIds,
    };
  }

  /**
   * Map CSV row to contact object
   */
  private mapToContact(
    row: Record<string, string>,
    mappings: ImportFieldMapping[],
    options: ImportOptions
  ): ContactImportRow {
    const contact: ContactImportRow = {};

    for (const mapping of mappings) {
      if (!mapping.targetField) continue;

      let value = row[mapping.sourceColumn] || '';

      switch (mapping.transform) {
        case 'lowercase':
          value = value.toLowerCase();
          break;
        case 'uppercase':
          value = value.toUpperCase();
          break;
        case 'trim':
          value = value.trim();
          break;
      }

      if (value) {
        contact[mapping.targetField] = value;
      }
    }

    if (options.defaultValues) {
      for (const [key, val] of Object.entries(options.defaultValues)) {
        if (!contact[key] && val) {
          contact[key] = String(val);
        }
      }
    }

    return contact;
  }

  // =========================================================================
  // WEBSITE QUOTE SUBMISSIONS (Quick Rate Estimate Leads)
  // =========================================================================

  /**
   * Get website quote submissions that can be imported as unknown as leads
   */
  async getQuoteSubmissions(
    filters: QuoteSubmissionFilters = {},
    limit: number = 50,
    offset: number = 0
  ): Promise<{ submissions: QuoteSubmission[]; total: number }> {
    try {
      let query = this.supabase
        .from('lead_submissions')
        .select('id, org_id, first_name, last_name, email, phone, source, status, stage, priority, assigned_to, score, tags, metadata, notes, next_followup_at, created_by, created_at, updated_at, form_data, source_cta, source_page, zip_code, household_size, contact_preference, primary_concern, utm_source, utm_medium, utm_campaign', { count: 'exact' });

      // Get submissions from all website forms
      query = query.or('source_page.ilike.%quote%,source_cta.ilike.%quote%,source_cta.ilike.%estimate%,source_cta.eq.hero-calculator,source_cta.eq.quick-start-plan-finder,source_cta.eq.lead-form,source_cta.eq.multi-step-quote-form,source_cta.ilike.benefit-interest-%');

      if (filters.search) {
        query = query.or(
          `first_name.ilike.%${filters.search}%,last_name.ilike.%${filters.search}%,email.ilike.%${filters.search}%`
        );
      }

      if (filters.syncStatus) {
        query = query.eq('sync_status', filters.syncStatus);
      }

      if (filters.dateFrom) {
        query = query.gte('created_at', filters.dateFrom);
      }

      if (filters.dateTo) {
        query = query.lte('created_at', filters.dateTo);
      }

      const { data, error, count } = await query
        .order('created_at', { ascending: false })
        .range(offset, offset + limit - 1);

      if (error) {
        console.error('Failed to get quote submissions:', error);
        return { submissions: [], total: 0 };
      }

      return {
        submissions: (data || []) as unknown as QuoteSubmission[],
        total: count || 0,
      };
    } catch (error) {
      console.error('Get quote submissions error:', error);
      return { submissions: [], total: 0 };
    }
  }

  /**
   * Import quote submissions as unknown as CRM leads with "Quick Rate Estimate Leads" label
   */
  async importQuoteSubmissionsAsLeads(
    submissionIds: string[]
  ): Promise<{ success: boolean; importedCount: number; errors: string[] }> {
    const { data: user } = await this.supabase.auth.getUser();
    if (!user.user) {
      return { success: false, importedCount: 0, errors: ['Not authenticated'] };
    }

    const errors: string[] = [];
    let importedCount = 0;

    // Get the submissions
    const { data: submissions, error: fetchError } = await this.supabase
      .from('lead_submissions')
      .select('id, org_id, first_name, last_name, email, phone, source, status, stage, priority, assigned_to, score, tags, metadata, notes, next_followup_at, created_by, created_at, updated_at, form_data, source_cta, source_page, zip_code, household_size, contact_preference, primary_concern, utm_source, utm_medium, utm_campaign')
      .in('id', submissionIds);

    if (fetchError || !submissions) {
      return { success: false, importedCount: 0, errors: [fetchError?.message || 'Failed to fetch submissions'] };
    }

    for (const sub of submissions) {
      // Update the submission to mark it as unknown as a "Quick Rate Estimate Lead"
      const formData = (sub.form_data as Record<string, unknown>) || {};

      const { error: updateError } = await this.supabase
        .from('lead_submissions')
        .update({
          source_cta: 'Quick Rate Estimate',
          form_data: {
            ...formData,
            crm_imported: true,
            crm_import_date: new Date().toISOString(),
            crm_imported_by: user.user.id,
            lead_type: 'Quick Rate Estimate Leads',
          },
        })
        .eq('id', sub.id);

      if (updateError) {
        errors.push(`Failed to update submission ${sub.id}: ${updateError.message}`);
      } else {
        importedCount++;
      }
    }

    return {
      success: errors.length === 0,
      importedCount,
      errors,
    };
  }

  /**
   * Get all Quick Rate Estimate Leads (from hero calculator and manually labeled)
   */
  async getQuickRateEstimateLeads(
    filters: QuoteSubmissionFilters = {},
    limit: number = 50,
    offset: number = 0
  ): Promise<{ leads: QuoteSubmission[]; total: number }> {
    try {
      let query = this.supabase
        .from('lead_submissions')
        .select('id, org_id, first_name, last_name, email, phone, source, status, stage, priority, assigned_to, score, tags, metadata, notes, next_followup_at, created_by, created_at, updated_at, form_data, source_cta, source_page, zip_code, household_size, contact_preference, primary_concern, utm_source, utm_medium, utm_campaign', { count: 'exact' })
        .or('source_cta.eq.Quick Rate Estimate,source_cta.ilike.%hero-calculator%,form_data->>lead_type.eq.Quick Rate Estimate Leads,source_cta.eq.quick-start-plan-finder,source_cta.eq.lead-form,source_cta.eq.multi-step-quote-form,source_cta.ilike.benefit-interest-%');

      // Apply optional filters
      if (filters.search) {
        query = query.or(
          `first_name.ilike.%${filters.search}%,last_name.ilike.%${filters.search}%,email.ilike.%${filters.search}%`
        );
      }

      if (filters.syncStatus) {
        query = query.eq('sync_status', filters.syncStatus);
      }

      if (filters.dateFrom) {
        query = query.gte('created_at', filters.dateFrom);
      }

      if (filters.dateTo) {
        query = query.lte('created_at', filters.dateTo);
      }

      const { data, error, count } = await query
        .order('created_at', { ascending: false })
        .range(offset, offset + limit - 1);

      if (error) {
        console.error('Failed to get quick rate estimate leads:', error);
        return { leads: [], total: 0 };
      }

      return {
        leads: (data || []) as unknown as QuoteSubmission[],
        total: count || 0,
      };
    } catch (error) {
      console.error('Get quick rate estimate leads error:', error);
      return { leads: [], total: 0 };
    }
  }

  // =========================================================================
  // BULK ACTIONS
  // =========================================================================

  /**
   * Delete lead submissions by IDs
   */
  async deleteLeadSubmissions(ids: string[]): Promise<{ success: boolean; deletedCount: number; error?: string }> {
    const { error, count } = await this.supabase
      .from('lead_submissions')
      .delete({ count: 'exact' })
      .in('id', ids);

    if (error) return { success: false, deletedCount: 0, error: error.message };
    return { success: true, deletedCount: count || 0 };
  }

  /**
   * Add tags to lead submissions (merges with existing tags)
   */
  async addTagsToLeads(ids: string[], tags: string[]): Promise<{ success: boolean; error?: string }> {
    // Fetch current tags, merge, then update each row
    const { data: rows, error: fetchErr } = await this.supabase
      .from('lead_submissions')
      .select('id, tags')
      .in('id', ids);

    if (fetchErr) return { success: false, error: fetchErr.message };

    for (const row of rows || []) {
      const existing: string[] = (row.tags as string[]) || [];
      const merged = [...new Set([...existing, ...tags])];
      const { error } = await this.supabase
        .from('lead_submissions')
        .update({ tags: merged })
        .eq('id', row.id);
      if (error) return { success: false, error: error.message };
    }
    return { success: true };
  }

  /**
   * Remove tags from lead submissions
   */
  async removeTagsFromLeads(ids: string[], tags: string[]): Promise<{ success: boolean; error?: string }> {
    const { data: rows, error: fetchErr } = await this.supabase
      .from('lead_submissions')
      .select('id, tags')
      .in('id', ids);

    if (fetchErr) return { success: false, error: fetchErr.message };

    for (const row of rows || []) {
      const existing: string[] = (row.tags as string[]) || [];
      const filtered = existing.filter(t => !tags.includes(t));
      const { error } = await this.supabase
        .from('lead_submissions')
        .update({ tags: filtered })
        .eq('id', row.id);
      if (error) return { success: false, error: error.message };
    }
    return { success: true };
  }

  /**
   * Update interested_plans for leads
   */
  async setInterestedPlans(ids: string[], plans: string[]): Promise<{ success: boolean; error?: string }> {
    const { error } = await this.supabase
      .from('lead_submissions')
      .update({ interested_plans: plans })
      .in('id', ids);

    if (error) return { success: false, error: error.message };
    return { success: true };
  }

  /**
   * Update pipeline_stage for leads
   */
  async updateLeadStage(ids: string[], stage: string): Promise<{ success: boolean; error?: string }> {
    const { error } = await this.supabase
      .from('lead_submissions')
      .update({ pipeline_stage: stage, stage_changed_at: new Date().toISOString() })
      .in('id', ids);

    if (error) return { success: false, error: error.message };
    return { success: true };
  }

  /**
   * Convert leads to CRM contacts
   */
  async convertLeadsToContacts(ids: string[]): Promise<{ success: boolean; convertedCount: number; errors: string[] }> {
    const { data: user } = await this.supabase.auth.getUser();
    if (!user.user) return { success: false, convertedCount: 0, errors: ['Not authenticated'] };

    const { data: leads, error: fetchErr } = await this.supabase
      .from('lead_submissions')
      .select('id, org_id, first_name, last_name, email, phone, source, status, stage, priority, assigned_to, score, tags, metadata, notes, next_followup_at, created_by, created_at, updated_at, form_data, source_cta, source_page, zip_code, household_size, contact_preference, primary_concern, utm_source, utm_medium, utm_campaign')
      .in('id', ids);

    if (fetchErr || !leads) return { success: false, convertedCount: 0, errors: [fetchErr?.message || 'Fetch failed'] };

    const errors: string[] = [];
    let convertedCount = 0;

    for (const lead of leads) {
      const { error: insertErr } = await this.supabase
        .from('crm_contacts')
        .insert({
          first_name: lead.first_name,
          last_name: lead.last_name,
          email: lead.email || null,
          phone: lead.phone || null,
          tags: lead.tags || [],
          lead_source: lead.source_cta || lead.source_page || 'Quick Rate Lead',
          mailing_address: lead.zip_code ? { postal_code: lead.zip_code } : {},
          created_by: user.user.id,
        });

      if (insertErr) {
        errors.push(`${lead.first_name} ${lead.last_name}: ${insertErr.message}`);
      } else {
        await this.supabase
          .from('lead_submissions')
          .update({ converted_at: new Date().toISOString(), pipeline_stage: 'converted' })
          .eq('id', lead.id);
        convertedCount++;
      }
    }

    return { success: errors.length === 0, convertedCount, errors };
  }

  // =========================================================================
  // HELPERS
  // =========================================================================

  private errorResult(message: string): ImportResult {
    return {
      jobId: '',
      status: 'failed',
      totalRows: 0,
      processedRows: 0,
      successCount: 0,
      errorCount: 1,
      duplicateCount: 0,
      errors: [{ row: 0, message }],
      createdIds: [],
    };
  }
}

// Factory function
export function createImportService(supabase: SupabaseClient): ImportService {
  return new ImportService(supabase);
}
