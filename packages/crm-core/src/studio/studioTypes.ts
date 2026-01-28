// ============================================================================
// CRM STUDIO TYPES
// Custom Modules, Fields, Layouts, Views, Validation Rules
// ============================================================================

// Field Types
export type FieldType =
  | 'text'
  | 'textarea'
  | 'number'
  | 'decimal'
  | 'currency'
  | 'percent'
  | 'email'
  | 'phone'
  | 'url'
  | 'date'
  | 'datetime'
  | 'checkbox'
  | 'picklist'
  | 'multi_picklist'
  | 'lookup'
  | 'multi_lookup'
  | 'formula'
  | 'auto_number';

export type LayoutType = 'create' | 'edit' | 'view' | 'quick_create';

export type ViewVisibility = 'private' | 'team' | 'org';

export type SortDirection = 'asc' | 'desc';

export type FilterOperator =
  | 'equals'
  | 'not_equals'
  | 'contains'
  | 'not_contains'
  | 'starts_with'
  | 'ends_with'
  | 'greater_than'
  | 'less_than'
  | 'greater_or_equal'
  | 'less_or_equal'
  | 'is_empty'
  | 'is_not_empty'
  | 'in'
  | 'not_in';

// ============================================================================
// MODULE TYPES
// ============================================================================

export interface StudioModule {
  id: string;
  org_id: string;
  name: string;
  api_name: string;
  plural_name: string;
  singular_name: string;
  description: string | null;
  icon: string;
  color: string;
  is_active: boolean;
  is_system: boolean;
  allow_activities: boolean;
  allow_notes: boolean;
  allow_attachments: boolean;
  created_by: string | null;
  created_at: string;
  updated_at: string;
}

export interface StudioModuleWithRelations extends StudioModule {
  fields?: StudioField[];
  layouts?: StudioLayout[];
  views?: StudioView[];
  validation_rules?: ValidationRule[];
  record_count?: number;
}

export interface ModuleCreateInput {
  name: string;
  api_name: string;
  plural_name: string;
  singular_name: string;
  description?: string;
  icon?: string;
  color?: string;
  allow_activities?: boolean;
  allow_notes?: boolean;
  allow_attachments?: boolean;
}

export interface ModuleUpdateInput extends Partial<Omit<ModuleCreateInput, 'api_name'>> {
  is_active?: boolean;
}

export interface ModuleFilters {
  search?: string;
  is_active?: boolean;
  is_system?: boolean;
}

// ============================================================================
// FIELD TYPES
// ============================================================================

export interface PicklistOption {
  value: string;
  label: string;
  color?: string;
}

export interface LookupConfig {
  target_module: string;
  display_field: string;
  allow_create?: boolean;
}

export interface FormulaConfig {
  expression: string;
  result_type: 'text' | 'number' | 'currency' | 'date' | 'datetime';
}

export interface NumberConfig {
  min?: number;
  max?: number;
  precision?: number;
}

export interface AutoNumberConfig {
  prefix?: string;
  suffix?: string;
  start?: number;
  padding?: number;
}

export interface FieldConfig {
  options?: PicklistOption[];
  target_module?: string;
  display_field?: string;
  allow_create?: boolean;
  expression?: string;
  result_type?: string;
  min?: number;
  max?: number;
  precision?: number;
  prefix?: string;
  suffix?: string;
  start?: number;
  padding?: number;
}

export interface StudioField {
  id: string;
  org_id: string;
  module_id: string;
  label: string;
  api_name: string;
  field_type: FieldType;
  is_required: boolean;
  is_unique: boolean;
  is_searchable: boolean;
  is_filterable: boolean;
  default_value: string | null;
  help_text: string | null;
  placeholder: string | null;
  config: FieldConfig;
  sort_order: number;
  is_system: boolean;
  is_name_field: boolean;
  created_by: string | null;
  created_at: string;
  updated_at: string;
}

export interface FieldCreateInput {
  module_id: string;
  label: string;
  api_name: string;
  field_type: FieldType;
  is_required?: boolean;
  is_unique?: boolean;
  is_searchable?: boolean;
  is_filterable?: boolean;
  default_value?: string;
  help_text?: string;
  placeholder?: string;
  config?: FieldConfig;
  sort_order?: number;
}

export interface FieldUpdateInput extends Partial<Omit<FieldCreateInput, 'module_id' | 'api_name' | 'field_type'>> {}

// ============================================================================
// LAYOUT TYPES
// ============================================================================

export interface LayoutFieldRef {
  field_id: string;
  read_only?: boolean;
  span?: number;
}

export interface LayoutSection {
  name: string;
  columns?: number;
  collapsed?: boolean;
  fields: LayoutFieldRef[];
}

export interface StudioLayout {
  id: string;
  org_id: string;
  module_id: string;
  name: string;
  api_name: string;
  layout_type: LayoutType;
  sections: LayoutSection[];
  is_default: boolean;
  is_active: boolean;
  created_by: string | null;
  created_at: string;
  updated_at: string;
}

export interface LayoutCreateInput {
  module_id: string;
  name: string;
  api_name: string;
  layout_type: LayoutType;
  sections?: LayoutSection[];
  is_default?: boolean;
}

export interface LayoutUpdateInput extends Partial<Omit<LayoutCreateInput, 'module_id' | 'api_name'>> {}

// ============================================================================
// VIEW TYPES
// ============================================================================

export interface ViewColumn {
  field_id: string;
  width?: number;
  sortable?: boolean;
}

export interface ViewFilter {
  field_id: string;
  operator: FilterOperator;
  value: string | number | boolean | string[];
}

export interface StudioView {
  id: string;
  org_id: string;
  module_id: string;
  name: string;
  columns: ViewColumn[];
  filters: ViewFilter[];
  sort_field_id: string | null;
  sort_direction: SortDirection;
  visibility: ViewVisibility;
  owner_id: string | null;
  is_default: boolean;
  is_active: boolean;
  created_by: string | null;
  created_at: string;
  updated_at: string;
}

export interface ViewCreateInput {
  module_id: string;
  name: string;
  columns?: ViewColumn[];
  filters?: ViewFilter[];
  sort_field_id?: string;
  sort_direction?: SortDirection;
  visibility?: ViewVisibility;
  is_default?: boolean;
}

export interface ViewUpdateInput extends Partial<Omit<ViewCreateInput, 'module_id'>> {}

// ============================================================================
// VALIDATION RULE TYPES
// ============================================================================

export interface ValidationCondition {
  field_id: string;
  operator: FilterOperator;
  value: string | number | boolean | string[];
}

export interface ValidationRule {
  id: string;
  org_id: string;
  module_id: string;
  name: string;
  description: string | null;
  conditions: ValidationCondition[];
  condition_logic: 'AND' | 'OR';
  error_message: string;
  error_field_id: string | null;
  run_on_create: boolean;
  run_on_update: boolean;
  is_active: boolean;
  created_by: string | null;
  created_at: string;
  updated_at: string;
}

export interface ValidationRuleCreateInput {
  module_id: string;
  name: string;
  description?: string;
  conditions: ValidationCondition[];
  condition_logic?: 'AND' | 'OR';
  error_message: string;
  error_field_id?: string;
  run_on_create?: boolean;
  run_on_update?: boolean;
}

export interface ValidationRuleUpdateInput extends Partial<Omit<ValidationRuleCreateInput, 'module_id'>> {
  is_active?: boolean;
}

// ============================================================================
// DYNAMIC RECORD TYPES
// ============================================================================

export interface DynamicRecord {
  id: string;
  org_id: string;
  name: string;
  owner_id: string | null;
  created_by: string | null;
  created_at: string;
  updated_at: string;
  [key: string]: unknown;
}

export interface DynamicFilters {
  search?: string;
  owner_id?: string;
  [key: string]: string | number | boolean | string[] | undefined;
}

export interface ValidationError {
  field_id: string;
  field_api_name?: string;
  message: string;
}

export interface ValidationResult {
  isValid: boolean;
  errors: ValidationError[];
}
