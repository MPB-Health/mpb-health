import type { SupabaseClient } from '@supabase/supabase-js';
import type {
  DynamicRecord,
  DynamicFilters,
  StudioView,
  StudioField,
  ValidationError,
  StudioModuleWithRelations,
} from './studioTypes';
import { ValidationService } from './validationService';

export class DynamicRecordService {
  private validationService: ValidationService;

  constructor(private supabase: SupabaseClient) {
    this.validationService = new ValidationService(supabase);
  }

  /**
   * Get the table name for a module
   */
  private async getTableName(module: StudioModuleWithRelations): Promise<string | null> {
    const { data, error } = await this.supabase.rpc('get_custom_module_table_name', {
      p_org_id: module.org_id,
      p_api_name: module.api_name,
    });

    if (error) {
      console.error('Failed to get table name:', error);
      return null;
    }

    return data as any;
  }

  /**
   * Get records for a custom module with optional view-based filtering
   */
  async getRecords(
    module: StudioModuleWithRelations,
    filters: DynamicFilters = {},
    view?: StudioView,
    limit: number = 50,
    offset: number = 0
  ): Promise<{ records: DynamicRecord[]; total: number }> {
    try {
      const tableName = await this.getTableName(module);
      if (!tableName) {
        return { records: [], total: 0 };
      }

      // Build field map for filter resolution
      const fields = module.fields || [];
      const fieldMap = new Map<string, StudioField>();
      for (const field of fields) {
        fieldMap.set(field.id, field);
      }

      // Build explicit column list from module fields to avoid select('*')
      const columnNames = ['id', 'name', 'owner_id', 'created_by', 'created_at', 'updated_at',
        ...fields.map((f) => f.api_name)];
      const uniqueColumns = [...new Set(columnNames)].join(', ');

      let query = this.supabase.from(tableName).select(uniqueColumns, { count: 'exact' });

      // Apply search filter
      if (filters.search) {
        const searchableFields = fields
          .filter((f) => f.is_searchable && ['text', 'textarea', 'email', 'phone', 'url'].includes(f.field_type))
          .map((f) => `${f.api_name}.ilike.%${filters.search}%`);

        if (searchableFields.length > 0) {
          query = query.or(searchableFields.join(','));
        }
      }

      // Apply owner filter
      if (filters.owner_id) {
        query = query.eq('owner_id', filters.owner_id);
      }

      // Apply view filters
      if (view?.filters && view.filters.length > 0) {
        for (const filter of view.filters) {
          const field = fieldMap.get(filter.field_id);
          if (!field) continue;

          const apiName = field.api_name;
          const value = filter.value;

          switch (filter.operator) {
            case 'equals':
              query = query.eq(apiName, value);
              break;
            case 'not_equals':
              query = query.neq(apiName, value);
              break;
            case 'contains':
              query = query.ilike(apiName, `%${value}%`);
              break;
            case 'starts_with':
              query = query.ilike(apiName, `${value}%`);
              break;
            case 'ends_with':
              query = query.ilike(apiName, `%${value}`);
              break;
            case 'greater_than':
              query = query.gt(apiName, value);
              break;
            case 'less_than':
              query = query.lt(apiName, value);
              break;
            case 'greater_or_equal':
              query = query.gte(apiName, value);
              break;
            case 'less_or_equal':
              query = query.lte(apiName, value);
              break;
            case 'is_empty':
              query = query.is(apiName, null);
              break;
            case 'is_not_empty':
              query = query.not(apiName, 'is', null);
              break;
            case 'in':
              if (Array.isArray(value)) {
                query = query.in(apiName, value);
              }
              break;
            case 'not_in':
              if (Array.isArray(value)) {
                query = query.not(apiName, 'in', `(${value.join(',')})`);
              }
              break;
          }
        }
      }

      // Apply sorting
      if (view?.sort_field_id) {
        const sortField = fieldMap.get(view.sort_field_id);
        if (sortField) {
          query = query.order(sortField.api_name, {
            ascending: view.sort_direction === 'asc',
          });
        }
      } else {
        query = query.order('created_at', { ascending: false });
      }

      // Apply pagination
      const { data, error, count } = await query.range(offset, offset + limit - 1);

      if (error) {
        console.error('Failed to get records:', error);
        return { records: [], total: 0 };
      }

      return {
        records: (data || []) as unknown as DynamicRecord[],
        total: count || 0,
      };
    } catch (error) {
      console.error('Get records error:', error);
      return { records: [], total: 0 };
    }
  }

  /**
   * Get a single record by ID
   */
  async getRecord(
    module: StudioModuleWithRelations,
    recordId: string
  ): Promise<DynamicRecord | null> {
    try {
      const tableName = await this.getTableName(module);
      if (!tableName) {
        return null;
      }

      const fields = module.fields || [];
      const columnNames = ['id', 'name', 'owner_id', 'created_by', 'created_at', 'updated_at',
        ...fields.map((f) => f.api_name)];
      const uniqueColumns = [...new Set(columnNames)].join(', ');

      const { data, error } = await this.supabase
        .from(tableName)
        .select(uniqueColumns)
        .eq('id', recordId)
        .single();

      if (error) {
        console.error('Failed to get record:', error);
        return null;
      }

      return data as unknown as DynamicRecord;
    } catch (error) {
      console.error('Get record error:', error);
      return null;
    }
  }

  /**
   * Create a new record
   */
  async createRecord(
    module: StudioModuleWithRelations,
    data: Record<string, unknown>
  ): Promise<{
    success: boolean;
    recordId?: string;
    error?: string;
    validationErrors?: ValidationError[];
  }> {
    try {
      const { data: user } = await this.supabase.auth.getUser();
      if (!user.user) {
        return { success: false, error: 'Not authenticated' };
      }

      const tableName = await this.getTableName(module);
      if (!tableName) {
        return { success: false, error: 'Module table not found' };
      }

      // Validate against rules
      const fields = module.fields || [];
      const validation = await this.validationService.validateRecord(
        module.id,
        data,
        true,
        fields
      );

      if (!validation.isValid) {
        return {
          success: false,
          error: 'Validation failed',
          validationErrors: validation.errors,
        };
      }

      // Check required fields
      const requiredErrors = this.checkRequiredFields(data, fields);
      if (requiredErrors.length > 0) {
        return {
          success: false,
          error: 'Missing required fields',
          validationErrors: requiredErrors,
        };
      }

      // Build insert data with only valid field api_names
      const validApiNames = new Set(fields.map((f) => f.api_name));
      validApiNames.add('name'); // System field
      validApiNames.add('owner_id'); // System field

      const insertData: Record<string, unknown> = {
        created_by: user.user.id,
      };

      for (const [key, value] of Object.entries(data)) {
        if (validApiNames.has(key)) {
          insertData[key] = value;
        }
      }

      const { data: result, error } = await this.supabase
        .from(tableName)
        .insert(insertData)
        .select('id')
        .single();

      if (error) {
        return { success: false, error: error.message };
      }

      return { success: true, recordId: result?.id };
    } catch (error) {
      console.error('Create record error:', error);
      return { success: false, error: 'Failed to create record' };
    }
  }

  /**
   * Update a record
   */
  async updateRecord(
    module: StudioModuleWithRelations,
    recordId: string,
    data: Record<string, unknown>
  ): Promise<{
    success: boolean;
    error?: string;
    validationErrors?: ValidationError[];
  }> {
    try {
      const tableName = await this.getTableName(module);
      if (!tableName) {
        return { success: false, error: 'Module table not found' };
      }

      // Merge with existing record for validation
      const existingRecord = await this.getRecord(module, recordId);
      if (!existingRecord) {
        return { success: false, error: 'Record not found' };
      }

      const mergedData = { ...existingRecord, ...data };

      // Validate against rules
      const fields = module.fields || [];
      const validation = await this.validationService.validateRecord(
        module.id,
        mergedData,
        false,
        fields
      );

      if (!validation.isValid) {
        return {
          success: false,
          error: 'Validation failed',
          validationErrors: validation.errors,
        };
      }

      // Build update data with only valid field api_names
      const validApiNames = new Set(fields.map((f) => f.api_name));
      validApiNames.add('name');
      validApiNames.add('owner_id');

      const updateData: Record<string, unknown> = {
        updated_at: new Date().toISOString(),
      };

      for (const [key, value] of Object.entries(data)) {
        if (validApiNames.has(key)) {
          updateData[key] = value;
        }
      }

      const { error } = await this.supabase
        .from(tableName)
        .update(updateData)
        .eq('id', recordId);

      if (error) {
        return { success: false, error: error.message };
      }

      return { success: true };
    } catch (error) {
      console.error('Update record error:', error);
      return { success: false, error: 'Failed to update record' };
    }
  }

  /**
   * Delete a record
   */
  async deleteRecord(
    module: StudioModuleWithRelations,
    recordId: string
  ): Promise<{ success: boolean; error?: string }> {
    try {
      const tableName = await this.getTableName(module);
      if (!tableName) {
        return { success: false, error: 'Module table not found' };
      }

      const { error } = await this.supabase
        .from(tableName)
        .delete()
        .eq('id', recordId);

      if (error) {
        return { success: false, error: error.message };
      }

      return { success: true };
    } catch (error) {
      console.error('Delete record error:', error);
      return { success: false, error: 'Failed to delete record' };
    }
  }

  /**
   * Delete multiple records
   */
  async deleteRecords(
    module: StudioModuleWithRelations,
    recordIds: string[]
  ): Promise<{ success: boolean; error?: string; deletedCount?: number }> {
    try {
      const tableName = await this.getTableName(module);
      if (!tableName) {
        return { success: false, error: 'Module table not found' };
      }

      const { error, count } = await this.supabase
        .from(tableName)
        .delete()
        .in('id', recordIds);

      if (error) {
        return { success: false, error: error.message };
      }

      return { success: true, deletedCount: count || recordIds.length };
    } catch (error) {
      console.error('Delete records error:', error);
      return { success: false, error: 'Failed to delete records' };
    }
  }

  /**
   * Check required fields
   */
  private checkRequiredFields(
    data: Record<string, unknown>,
    fields: StudioField[]
  ): ValidationError[] {
    const errors: ValidationError[] = [];

    for (const field of fields) {
      if (field.is_required && !field.is_system) {
        const value = data[field.api_name];
        if (value === null || value === undefined || value === '') {
          errors.push({
            field_id: field.id,
            field_api_name: field.api_name,
            message: `${field.label} is required`,
          });
        }
      }
    }

    // Check system name field
    if (!data.name || (typeof data.name === 'string' && data.name.trim() === '')) {
      const nameField = fields.find((f) => f.api_name === 'name');
      errors.push({
        field_id: nameField?.id || '',
        field_api_name: 'name',
        message: 'Name is required',
      });
    }

    return errors;
  }

  /**
   * Get record count for a module
   */
  async getRecordCount(module: StudioModuleWithRelations): Promise<number> {
    try {
      const tableName = await this.getTableName(module);
      if (!tableName) {
        return 0;
      }

      const { count, error } = await this.supabase
        .from(tableName)
        .select('id', { count: 'exact', head: true });

      if (error) {
        console.error('Failed to get record count:', error);
        return 0;
      }

      return count || 0;
    } catch (error) {
      console.error('Get record count error:', error);
      return 0;
    }
  }
}

// Factory function
export function createDynamicRecordService(supabase: SupabaseClient): DynamicRecordService {
  return new DynamicRecordService(supabase);
}
