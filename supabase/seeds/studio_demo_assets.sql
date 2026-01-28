-- ============================================================================
-- CRM STUDIO: Demo "Assets" Module Seed
-- Run this after 20260128220000_crm_studio.sql migration
-- This creates a sample "Assets" module with fields, layout, view, and validation rule
-- ============================================================================

-- Note: This seed needs to be run with an org_id and user_id.
-- The script uses variables that should be set before running.
-- In a production setup, this would be part of the org setup flow.

-- For demo purposes, we'll create a function that can be called to set up
-- the Assets module for any organization.

CREATE OR REPLACE FUNCTION setup_demo_assets_module(
    p_org_id UUID,
    p_user_id UUID
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_module_id UUID;
    v_field_name_id UUID;
    v_field_owner_id UUID;
    v_field_asset_type_id UUID;
    v_field_serial_number_id UUID;
    v_field_purchase_date_id UUID;
    v_field_purchase_price_id UUID;
    v_field_warranty_expiry_id UUID;
    v_field_assigned_to_id UUID;
    v_field_status_id UUID;
    v_field_notes_id UUID;
    v_layout_id UUID;
    v_view_id UUID;
BEGIN
    -- Check if module already exists for this org
    SELECT id INTO v_module_id
    FROM crm_studio_modules
    WHERE org_id = p_org_id AND api_name = 'assets';

    IF v_module_id IS NOT NULL THEN
        RETURN v_module_id; -- Already exists
    END IF;

    -- Create the Assets module
    INSERT INTO crm_studio_modules (
        org_id, name, api_name, plural_name, singular_name, description,
        icon, color, is_active, is_system, allow_activities, allow_notes, allow_attachments,
        created_by
    ) VALUES (
        p_org_id,
        'Assets',
        'assets',
        'Assets',
        'Asset',
        'Track company assets including equipment, software licenses, and other valuable items',
        'Box',
        'blue',
        true,
        false,
        true,
        true,
        true,
        p_user_id
    )
    RETURNING id INTO v_module_id;

    -- Create system fields (Name, Owner)
    INSERT INTO crm_studio_fields (
        org_id, module_id, label, api_name, field_type,
        is_required, is_searchable, is_filterable, sort_order,
        is_system, is_name_field, created_by
    ) VALUES (
        p_org_id, v_module_id, 'Asset Name', 'name', 'text',
        true, true, true, 0,
        true, true, p_user_id
    )
    RETURNING id INTO v_field_name_id;

    INSERT INTO crm_studio_fields (
        org_id, module_id, label, api_name, field_type,
        is_required, is_searchable, is_filterable, config, sort_order,
        is_system, is_name_field, created_by
    ) VALUES (
        p_org_id, v_module_id, 'Owner', 'owner_id', 'lookup',
        false, false, true, '{"target_module": "users", "display_field": "email"}'::jsonb, 1,
        true, false, p_user_id
    )
    RETURNING id INTO v_field_owner_id;

    -- Create custom fields

    -- Asset Type (picklist)
    INSERT INTO crm_studio_fields (
        org_id, module_id, label, api_name, field_type,
        is_required, is_searchable, is_filterable, config, sort_order,
        help_text, created_by
    ) VALUES (
        p_org_id, v_module_id, 'Asset Type', 'asset_type', 'picklist',
        true, true, true,
        '{
            "options": [
                {"value": "hardware", "label": "Hardware", "color": "#3B82F6"},
                {"value": "software", "label": "Software", "color": "#8B5CF6"},
                {"value": "license", "label": "License", "color": "#10B981"},
                {"value": "vehicle", "label": "Vehicle", "color": "#F59E0B"},
                {"value": "furniture", "label": "Furniture", "color": "#6B7280"},
                {"value": "other", "label": "Other", "color": "#EC4899"}
            ]
        }'::jsonb,
        2,
        'Category of the asset',
        p_user_id
    )
    RETURNING id INTO v_field_asset_type_id;

    -- Serial Number
    INSERT INTO crm_studio_fields (
        org_id, module_id, label, api_name, field_type,
        is_required, is_searchable, is_filterable, sort_order,
        placeholder, created_by
    ) VALUES (
        p_org_id, v_module_id, 'Serial Number', 'serial_number', 'text',
        false, true, false, 3,
        'Enter serial number or SKU',
        p_user_id
    )
    RETURNING id INTO v_field_serial_number_id;

    -- Purchase Date
    INSERT INTO crm_studio_fields (
        org_id, module_id, label, api_name, field_type,
        is_required, is_searchable, is_filterable, sort_order, created_by
    ) VALUES (
        p_org_id, v_module_id, 'Purchase Date', 'purchase_date', 'date',
        false, false, true, 4, p_user_id
    )
    RETURNING id INTO v_field_purchase_date_id;

    -- Purchase Price (currency)
    INSERT INTO crm_studio_fields (
        org_id, module_id, label, api_name, field_type,
        is_required, is_searchable, is_filterable, config, sort_order, created_by
    ) VALUES (
        p_org_id, v_module_id, 'Purchase Price', 'purchase_price', 'currency',
        false, false, true, '{"precision": 2}'::jsonb, 5, p_user_id
    )
    RETURNING id INTO v_field_purchase_price_id;

    -- Warranty Expiry
    INSERT INTO crm_studio_fields (
        org_id, module_id, label, api_name, field_type,
        is_required, is_searchable, is_filterable, sort_order,
        help_text, created_by
    ) VALUES (
        p_org_id, v_module_id, 'Warranty Expiry', 'warranty_expiry', 'date',
        false, false, true, 6,
        'Date when warranty coverage ends',
        p_user_id
    )
    RETURNING id INTO v_field_warranty_expiry_id;

    -- Assigned To (lookup to contacts)
    INSERT INTO crm_studio_fields (
        org_id, module_id, label, api_name, field_type,
        is_required, is_searchable, is_filterable, config, sort_order,
        help_text, created_by
    ) VALUES (
        p_org_id, v_module_id, 'Assigned To', 'assigned_to', 'lookup',
        false, false, true, '{"target_module": "crm_contacts", "display_field": "first_name", "allow_create": false}'::jsonb, 7,
        'Person responsible for this asset',
        p_user_id
    )
    RETURNING id INTO v_field_assigned_to_id;

    -- Status (picklist)
    INSERT INTO crm_studio_fields (
        org_id, module_id, label, api_name, field_type,
        is_required, is_searchable, is_filterable, config, sort_order,
        default_value, created_by
    ) VALUES (
        p_org_id, v_module_id, 'Status', 'status', 'picklist',
        true, true, true,
        '{
            "options": [
                {"value": "active", "label": "Active", "color": "#10B981"},
                {"value": "in_repair", "label": "In Repair", "color": "#F59E0B"},
                {"value": "retired", "label": "Retired", "color": "#6B7280"},
                {"value": "lost", "label": "Lost", "color": "#EF4444"}
            ]
        }'::jsonb,
        8,
        'active',
        p_user_id
    )
    RETURNING id INTO v_field_status_id;

    -- Notes (textarea)
    INSERT INTO crm_studio_fields (
        org_id, module_id, label, api_name, field_type,
        is_required, is_searchable, is_filterable, sort_order,
        placeholder, created_by
    ) VALUES (
        p_org_id, v_module_id, 'Notes', 'notes', 'textarea',
        false, true, false, 9,
        'Additional notes about this asset...',
        p_user_id
    )
    RETURNING id INTO v_field_notes_id;

    -- Create the module table
    PERFORM create_custom_module_table(
        p_org_id,
        'assets',
        '[
            {"api_name": "asset_type", "field_type": "picklist"},
            {"api_name": "serial_number", "field_type": "text"},
            {"api_name": "purchase_date", "field_type": "date"},
            {"api_name": "purchase_price", "field_type": "currency"},
            {"api_name": "warranty_expiry", "field_type": "date"},
            {"api_name": "assigned_to", "field_type": "lookup"},
            {"api_name": "status", "field_type": "picklist"},
            {"api_name": "notes", "field_type": "textarea"}
        ]'::jsonb
    );

    -- Create default layout
    INSERT INTO crm_studio_layouts (
        org_id, module_id, name, api_name, layout_type,
        sections, is_default, is_active, created_by
    ) VALUES (
        p_org_id, v_module_id, 'Default Edit', 'default_edit', 'edit',
        jsonb_build_array(
            jsonb_build_object(
                'name', 'Asset Information',
                'columns', 2,
                'collapsed', false,
                'fields', jsonb_build_array(
                    jsonb_build_object('field_id', v_field_name_id, 'read_only', false, 'span', 2),
                    jsonb_build_object('field_id', v_field_asset_type_id, 'read_only', false, 'span', 1),
                    jsonb_build_object('field_id', v_field_status_id, 'read_only', false, 'span', 1),
                    jsonb_build_object('field_id', v_field_serial_number_id, 'read_only', false, 'span', 1),
                    jsonb_build_object('field_id', v_field_assigned_to_id, 'read_only', false, 'span', 1)
                )
            ),
            jsonb_build_object(
                'name', 'Purchase Details',
                'columns', 2,
                'collapsed', false,
                'fields', jsonb_build_array(
                    jsonb_build_object('field_id', v_field_purchase_date_id, 'read_only', false, 'span', 1),
                    jsonb_build_object('field_id', v_field_purchase_price_id, 'read_only', false, 'span', 1),
                    jsonb_build_object('field_id', v_field_warranty_expiry_id, 'read_only', false, 'span', 1)
                )
            ),
            jsonb_build_object(
                'name', 'Additional Information',
                'columns', 1,
                'collapsed', false,
                'fields', jsonb_build_array(
                    jsonb_build_object('field_id', v_field_notes_id, 'read_only', false, 'span', 1)
                )
            )
        ),
        true, true, p_user_id
    )
    RETURNING id INTO v_layout_id;

    -- Also create the same layout for create type
    INSERT INTO crm_studio_layouts (
        org_id, module_id, name, api_name, layout_type,
        sections, is_default, is_active, created_by
    )
    SELECT
        org_id, module_id, 'Default Create', 'default_create', 'create',
        sections, true, true, created_by
    FROM crm_studio_layouts
    WHERE id = v_layout_id;

    -- Create default view: "All Active Assets"
    INSERT INTO crm_studio_views (
        org_id, module_id, name,
        columns, filters, sort_field_id, sort_direction,
        visibility, owner_id, is_default, is_active, created_by
    ) VALUES (
        p_org_id, v_module_id, 'All Active Assets',
        jsonb_build_array(
            jsonb_build_object('field_id', v_field_name_id, 'width', 200, 'sortable', true),
            jsonb_build_object('field_id', v_field_asset_type_id, 'width', 120, 'sortable', true),
            jsonb_build_object('field_id', v_field_status_id, 'width', 100, 'sortable', true),
            jsonb_build_object('field_id', v_field_assigned_to_id, 'width', 150, 'sortable', false),
            jsonb_build_object('field_id', v_field_purchase_date_id, 'width', 120, 'sortable', true)
        ),
        jsonb_build_array(
            jsonb_build_object('field_id', v_field_status_id, 'operator', 'equals', 'value', 'active')
        ),
        v_field_name_id,
        'asc',
        'org', p_user_id, true, true, p_user_id
    )
    RETURNING id INTO v_view_id;

    -- Create "All Assets" view (no filter)
    INSERT INTO crm_studio_views (
        org_id, module_id, name,
        columns, filters, sort_field_id, sort_direction,
        visibility, owner_id, is_default, is_active, created_by
    ) VALUES (
        p_org_id, v_module_id, 'All Assets',
        jsonb_build_array(
            jsonb_build_object('field_id', v_field_name_id, 'width', 200, 'sortable', true),
            jsonb_build_object('field_id', v_field_asset_type_id, 'width', 120, 'sortable', true),
            jsonb_build_object('field_id', v_field_status_id, 'width', 100, 'sortable', true),
            jsonb_build_object('field_id', v_field_assigned_to_id, 'width', 150, 'sortable', false),
            jsonb_build_object('field_id', v_field_purchase_price_id, 'width', 120, 'sortable', true)
        ),
        '[]'::jsonb,
        v_field_name_id,
        'asc',
        'org', p_user_id, false, true, p_user_id
    );

    -- Create validation rule: "Warranty must be after purchase date"
    INSERT INTO crm_studio_validation_rules (
        org_id, module_id, name, description,
        conditions, condition_logic, error_message, error_field_id,
        run_on_create, run_on_update, is_active, created_by
    ) VALUES (
        p_org_id, v_module_id,
        'Warranty after purchase',
        'Warranty expiry date must be after the purchase date',
        jsonb_build_array(
            jsonb_build_object('field_id', v_field_warranty_expiry_id, 'operator', 'is_not_empty', 'value', true),
            jsonb_build_object('field_id', v_field_purchase_date_id, 'operator', 'is_not_empty', 'value', true),
            jsonb_build_object('field_id', v_field_warranty_expiry_id, 'operator', 'less_or_equal', 'value', v_field_purchase_date_id)
        ),
        'AND',
        'Warranty expiry must be after the purchase date',
        v_field_warranty_expiry_id,
        true, true, true, p_user_id
    );

    RETURN v_module_id;
END;
$$;

-- Comment
COMMENT ON FUNCTION setup_demo_assets_module IS 'Creates the demo Assets module with all fields, layouts, views, and validation rules for a given organization';
