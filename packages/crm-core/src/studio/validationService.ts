import type { SupabaseClient } from '@supabase/supabase-js';
import type {
  ValidationRule,
  ValidationRuleCreateInput,
  ValidationRuleUpdateInput,
  ValidationResult,
  ValidationError,
  ValidationCondition,
  StudioField,
  FilterOperator,
} from './studioTypes';

export class ValidationService {
  constructor(private supabase: SupabaseClient) {}

  /**
   * Get all validation rules for a module
   */
  async getRules(moduleId: string): Promise<ValidationRule[]> {
    try {
      const { data, error } = await this.supabase
        .from('crm_studio_validation_rules')
        .select('id, org_id, module_id, name, description, conditions, condition_logic, error_message, error_field_id, run_on_create, run_on_update, is_active, created_by, created_at, updated_at')
        .eq('module_id', moduleId)
        .order('name', { ascending: true });

      if (error) {
        console.error('Failed to get validation rules:', error);
        return [];
      }

      return data as unknown as ValidationRule[];
    } catch (error) {
      console.error('Get validation rules error:', error);
      return [];
    }
  }

  /**
   * Get active validation rules for a module
   */
  async getActiveRules(moduleId: string, isCreate: boolean): Promise<ValidationRule[]> {
    try {
      let query = this.supabase
        .from('crm_studio_validation_rules')
        .select('id, org_id, module_id, name, description, conditions, condition_logic, error_message, error_field_id, run_on_create, run_on_update, is_active, created_by, created_at, updated_at')
        .eq('module_id', moduleId)
        .eq('is_active', true);

      if (isCreate) {
        query = query.eq('run_on_create', true);
      } else {
        query = query.eq('run_on_update', true);
      }

      const { data, error } = await query;

      if (error) {
        console.error('Failed to get active validation rules:', error);
        return [];
      }

      return data as unknown as ValidationRule[];
    } catch (error) {
      console.error('Get active validation rules error:', error);
      return [];
    }
  }

  /**
   * Get a single validation rule by ID
   */
  async getRule(id: string): Promise<ValidationRule | null> {
    try {
      const { data, error } = await this.supabase
        .from('crm_studio_validation_rules')
        .select('id, org_id, module_id, name, description, conditions, condition_logic, error_message, error_field_id, run_on_create, run_on_update, is_active, created_by, created_at, updated_at')
        .eq('id', id)
        .single();

      if (error) {
        console.error('Failed to get validation rule:', error);
        return null;
      }

      return data as unknown as ValidationRule;
    } catch (error) {
      console.error('Get validation rule error:', error);
      return null;
    }
  }

  /**
   * Create a new validation rule
   */
  async createRule(
    input: ValidationRuleCreateInput
  ): Promise<{ success: boolean; ruleId?: string; error?: string }> {
    try {
      const { data: user } = await this.supabase.auth.getUser();
      if (!user.user) {
        return { success: false, error: 'Not authenticated' };
      }

      // Get module to find org_id
      const { data: module, error: moduleError } = await this.supabase
        .from('crm_studio_modules')
        .select('org_id')
        .eq('id', input.module_id)
        .single();

      if (moduleError || !module) {
        return { success: false, error: 'Module not found' };
      }

      const { data, error } = await this.supabase
        .from('crm_studio_validation_rules')
        .insert({
          org_id: module.org_id,
          module_id: input.module_id,
          name: input.name,
          description: input.description || null,
          conditions: input.conditions,
          condition_logic: input.condition_logic || 'AND',
          error_message: input.error_message,
          error_field_id: input.error_field_id || null,
          run_on_create: input.run_on_create ?? true,
          run_on_update: input.run_on_update ?? true,
          is_active: true,
          created_by: user.user.id,
        })
        .select('id')
        .single();

      if (error) {
        return { success: false, error: error.message };
      }

      return { success: true, ruleId: data?.id };
    } catch (error) {
      console.error('Create validation rule error:', error);
      return { success: false, error: 'Failed to create validation rule' };
    }
  }

  /**
   * Update a validation rule
   */
  async updateRule(
    id: string,
    updates: ValidationRuleUpdateInput
  ): Promise<{ success: boolean; error?: string }> {
    try {
      const { error } = await this.supabase
        .from('crm_studio_validation_rules')
        .update(updates)
        .eq('id', id);

      if (error) {
        return { success: false, error: error.message };
      }

      return { success: true };
    } catch (error) {
      console.error('Update validation rule error:', error);
      return { success: false, error: 'Failed to update validation rule' };
    }
  }

  /**
   * Delete a validation rule
   */
  async deleteRule(id: string): Promise<{ success: boolean; error?: string }> {
    try {
      const { error } = await this.supabase
        .from('crm_studio_validation_rules')
        .delete()
        .eq('id', id);

      if (error) {
        return { success: false, error: error.message };
      }

      return { success: true };
    } catch (error) {
      console.error('Delete validation rule error:', error);
      return { success: false, error: 'Failed to delete validation rule' };
    }
  }

  /**
   * Validate a record against all active rules
   */
  async validateRecord(
    moduleId: string,
    record: Record<string, unknown>,
    isCreate: boolean,
    fields: StudioField[]
  ): Promise<ValidationResult> {
    const errors: ValidationError[] = [];

    try {
      const rules = await this.getActiveRules(moduleId, isCreate);

      // Build field lookup map
      const fieldMap = new Map<string, StudioField>();
      for (const field of fields) {
        fieldMap.set(field.id, field);
      }

      for (const rule of rules) {
        const ruleResult = this.evaluateRule(rule, record, fieldMap);
        if (!ruleResult.passed) {
          const errorField = fieldMap.get(rule.error_field_id || '');
          errors.push({
            field_id: rule.error_field_id || '',
            field_api_name: errorField?.api_name,
            message: rule.error_message,
          });
        }
      }

      return {
        isValid: errors.length === 0,
        errors,
      };
    } catch (error) {
      console.error('Validate record error:', error);
      return {
        isValid: false,
        errors: [{ field_id: '', message: 'Validation failed unexpectedly' }],
      };
    }
  }

  /**
   * Evaluate a single validation rule against a record
   * Returns { passed: true } if the rule passes (record is valid)
   * Returns { passed: false } if the rule triggers (record violates the rule)
   */
  private evaluateRule(
    rule: ValidationRule,
    record: Record<string, unknown>,
    fieldMap: Map<string, StudioField>
  ): { passed: boolean } {
    const { conditions, condition_logic } = rule;

    if (conditions.length === 0) {
      return { passed: true };
    }

    const conditionResults = conditions.map((condition) =>
      this.evaluateCondition(condition, record, fieldMap)
    );

    // The rule triggers (returns error) when conditions are met
    // So "passed" means conditions are NOT met
    let conditionsMet: boolean;
    if (condition_logic === 'AND') {
      conditionsMet = conditionResults.every((r) => r);
    } else {
      conditionsMet = conditionResults.some((r) => r);
    }

    // Rule passes if conditions are NOT met (no validation error)
    return { passed: !conditionsMet };
  }

  /**
   * Evaluate a single condition
   * Returns true if the condition matches (would trigger the rule)
   */
  private evaluateCondition(
    condition: ValidationCondition,
    record: Record<string, unknown>,
    fieldMap: Map<string, StudioField>
  ): boolean {
    const field = fieldMap.get(condition.field_id);
    if (!field) {
      return false;
    }

    const fieldValue = record[field.api_name];
    const conditionValue = condition.value;

    return this.compareValues(fieldValue, condition.operator, conditionValue);
  }

  /**
   * Compare values based on operator
   */
  private compareValues(
    fieldValue: unknown,
    operator: FilterOperator,
    conditionValue: string | number | boolean | string[]
  ): boolean {
    switch (operator) {
      case 'equals':
        return fieldValue === conditionValue;

      case 'not_equals':
        return fieldValue !== conditionValue;

      case 'contains':
        if (typeof fieldValue === 'string' && typeof conditionValue === 'string') {
          return fieldValue.toLowerCase().includes(conditionValue.toLowerCase());
        }
        return false;

      case 'not_contains':
        if (typeof fieldValue === 'string' && typeof conditionValue === 'string') {
          return !fieldValue.toLowerCase().includes(conditionValue.toLowerCase());
        }
        return true;

      case 'starts_with':
        if (typeof fieldValue === 'string' && typeof conditionValue === 'string') {
          return fieldValue.toLowerCase().startsWith(conditionValue.toLowerCase());
        }
        return false;

      case 'ends_with':
        if (typeof fieldValue === 'string' && typeof conditionValue === 'string') {
          return fieldValue.toLowerCase().endsWith(conditionValue.toLowerCase());
        }
        return false;

      case 'greater_than':
        if (typeof fieldValue === 'number' && typeof conditionValue === 'number') {
          return fieldValue > conditionValue;
        }
        if (typeof fieldValue === 'string' && typeof conditionValue === 'string') {
          return fieldValue > conditionValue;
        }
        return false;

      case 'less_than':
        if (typeof fieldValue === 'number' && typeof conditionValue === 'number') {
          return fieldValue < conditionValue;
        }
        if (typeof fieldValue === 'string' && typeof conditionValue === 'string') {
          return fieldValue < conditionValue;
        }
        return false;

      case 'greater_or_equal':
        if (typeof fieldValue === 'number' && typeof conditionValue === 'number') {
          return fieldValue >= conditionValue;
        }
        return false;

      case 'less_or_equal':
        if (typeof fieldValue === 'number' && typeof conditionValue === 'number') {
          return fieldValue <= conditionValue;
        }
        return false;

      case 'is_empty':
        return (
          fieldValue === null ||
          fieldValue === undefined ||
          fieldValue === '' ||
          (Array.isArray(fieldValue) && fieldValue.length === 0)
        );

      case 'is_not_empty':
        return !(
          fieldValue === null ||
          fieldValue === undefined ||
          fieldValue === '' ||
          (Array.isArray(fieldValue) && fieldValue.length === 0)
        );

      case 'in':
        if (Array.isArray(conditionValue)) {
          return conditionValue.includes(fieldValue as string);
        }
        return false;

      case 'not_in':
        if (Array.isArray(conditionValue)) {
          return !conditionValue.includes(fieldValue as string);
        }
        return true;

      default:
        return false;
    }
  }
}

// Factory function
export function createValidationService(supabase: SupabaseClient): ValidationService {
  return new ValidationService(supabase);
}
