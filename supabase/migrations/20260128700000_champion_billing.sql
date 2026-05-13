-- ============================================================================
-- Champion Advisor OS — Phase 4: Billing & Subscriptions
-- ============================================================================

-- ============================================================================
-- SUBSCRIPTION PLANS
-- ============================================================================

CREATE TABLE IF NOT EXISTS subscription_plans (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    slug TEXT NOT NULL UNIQUE,
    description TEXT,
    tier TEXT NOT NULL DEFAULT 'standard', -- 'starter', 'standard', 'professional', 'enterprise'

    -- Pricing
    price_monthly DECIMAL(10,2) NOT NULL DEFAULT 0,
    price_yearly DECIMAL(10,2) NOT NULL DEFAULT 0,
    currency TEXT NOT NULL DEFAULT 'USD',

    -- Limits
    max_users INTEGER, -- NULL = unlimited
    max_leads INTEGER,
    max_messages_per_month INTEGER,
    max_sequences INTEGER,
    max_ai_assists_per_month INTEGER,
    storage_gb INTEGER DEFAULT 5,

    -- Features (JSON for flexibility)
    features JSONB NOT NULL DEFAULT '[]',

    -- Status
    is_active BOOLEAN NOT NULL DEFAULT true,
    is_public BOOLEAN NOT NULL DEFAULT true, -- Show on pricing page
    sort_order INTEGER NOT NULL DEFAULT 0,

    -- Stripe integration
    stripe_price_id_monthly TEXT,
    stripe_price_id_yearly TEXT,
    stripe_product_id TEXT,

    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
-- ============================================================================
-- ORGANIZATION SUBSCRIPTIONS
-- ============================================================================

CREATE TABLE IF NOT EXISTS organization_subscriptions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    org_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    plan_id UUID NOT NULL REFERENCES subscription_plans(id),

    -- Subscription details
    status TEXT NOT NULL DEFAULT 'active', -- 'trialing', 'active', 'past_due', 'canceled', 'paused'
    billing_cycle TEXT NOT NULL DEFAULT 'monthly', -- 'monthly', 'yearly'

    -- Dates
    current_period_start TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    current_period_end TIMESTAMPTZ NOT NULL,
    trial_start TIMESTAMPTZ,
    trial_end TIMESTAMPTZ,
    canceled_at TIMESTAMPTZ,
    cancel_at_period_end BOOLEAN NOT NULL DEFAULT false,

    -- Stripe integration
    stripe_subscription_id TEXT,
    stripe_customer_id TEXT,

    -- Overrides (for custom deals)
    custom_limits JSONB, -- Override plan limits
    discount_percent DECIMAL(5,2) DEFAULT 0,

    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

    UNIQUE(org_id) -- One active subscription per org
);
-- ============================================================================
-- USAGE RECORDS
-- ============================================================================

CREATE TABLE IF NOT EXISTS usage_records (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    org_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    subscription_id UUID REFERENCES organization_subscriptions(id) ON DELETE SET NULL,

    -- Period
    period_start TIMESTAMPTZ NOT NULL,
    period_end TIMESTAMPTZ NOT NULL,

    -- Usage metrics
    users_count INTEGER NOT NULL DEFAULT 0,
    leads_count INTEGER NOT NULL DEFAULT 0,
    messages_sent INTEGER NOT NULL DEFAULT 0,
    sequences_active INTEGER NOT NULL DEFAULT 0,
    ai_assists_used INTEGER NOT NULL DEFAULT 0,
    storage_used_mb INTEGER NOT NULL DEFAULT 0,

    -- Detailed breakdown (for analytics)
    messages_sms INTEGER NOT NULL DEFAULT 0,
    messages_email INTEGER NOT NULL DEFAULT 0,
    ai_message_assists INTEGER NOT NULL DEFAULT 0,
    ai_score_adjustments INTEGER NOT NULL DEFAULT 0,

    -- Status
    is_current BOOLEAN NOT NULL DEFAULT false,
    finalized_at TIMESTAMPTZ, -- When period ended

    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
-- Index for current period lookup
CREATE INDEX IF NOT EXISTS idx_usage_records_org_current ON usage_records(org_id, is_current) WHERE is_current = true;
CREATE INDEX IF NOT EXISTS idx_usage_records_org_period ON usage_records(org_id, period_start, period_end);
-- ============================================================================
-- INVOICES
-- ============================================================================

CREATE TABLE IF NOT EXISTS invoices (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    org_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    subscription_id UUID REFERENCES organization_subscriptions(id) ON DELETE SET NULL,

    -- Invoice details
    invoice_number TEXT NOT NULL,
    status TEXT NOT NULL DEFAULT 'draft', -- 'draft', 'open', 'paid', 'void', 'uncollectible'

    -- Amounts
    subtotal DECIMAL(10,2) NOT NULL DEFAULT 0,
    discount_amount DECIMAL(10,2) NOT NULL DEFAULT 0,
    tax_amount DECIMAL(10,2) NOT NULL DEFAULT 0,
    total DECIMAL(10,2) NOT NULL DEFAULT 0,
    amount_paid DECIMAL(10,2) NOT NULL DEFAULT 0,
    amount_due DECIMAL(10,2) NOT NULL DEFAULT 0,
    currency TEXT NOT NULL DEFAULT 'USD',

    -- Period
    period_start TIMESTAMPTZ,
    period_end TIMESTAMPTZ,

    -- Dates
    invoice_date TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    due_date TIMESTAMPTZ,
    paid_at TIMESTAMPTZ,

    -- Line items
    line_items JSONB NOT NULL DEFAULT '[]',

    -- Stripe integration
    stripe_invoice_id TEXT,
    stripe_payment_intent_id TEXT,
    hosted_invoice_url TEXT,
    invoice_pdf_url TEXT,

    -- Metadata
    notes TEXT,

    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
-- Generate invoice number
CREATE SEQUENCE IF NOT EXISTS invoice_number_seq START WITH 1000;
CREATE INDEX IF NOT EXISTS idx_invoices_org ON invoices(org_id);
CREATE INDEX IF NOT EXISTS idx_invoices_status ON invoices(status);
-- ============================================================================
-- PAYMENT METHODS
-- ============================================================================

CREATE TABLE IF NOT EXISTS payment_methods (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    org_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,

    -- Type
    type TEXT NOT NULL, -- 'card', 'bank_account', 'ach'

    -- Card details (masked)
    card_brand TEXT, -- 'visa', 'mastercard', 'amex', etc.
    card_last4 TEXT,
    card_exp_month INTEGER,
    card_exp_year INTEGER,

    -- Bank account details (masked)
    bank_name TEXT,
    account_last4 TEXT,

    -- Status
    is_default BOOLEAN NOT NULL DEFAULT false,
    is_verified BOOLEAN NOT NULL DEFAULT false,

    -- Stripe integration
    stripe_payment_method_id TEXT NOT NULL,

    -- Billing address
    billing_name TEXT,
    billing_email TEXT,
    billing_address JSONB,

    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_payment_methods_org ON payment_methods(org_id);
-- ============================================================================
-- BILLING EVENTS (Audit trail)
-- ============================================================================

CREATE TABLE IF NOT EXISTS billing_events (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    org_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    subscription_id UUID REFERENCES organization_subscriptions(id) ON DELETE SET NULL,
    invoice_id UUID REFERENCES invoices(id) ON DELETE SET NULL,

    event_type TEXT NOT NULL, -- 'subscription.created', 'subscription.updated', 'payment.succeeded', etc.
    description TEXT,

    -- Event data
    data JSONB NOT NULL DEFAULT '{}',

    -- Stripe event
    stripe_event_id TEXT,

    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_billing_events_org ON billing_events(org_id, created_at DESC);
-- ============================================================================
-- ROW LEVEL SECURITY
-- ============================================================================

ALTER TABLE subscription_plans ENABLE ROW LEVEL SECURITY;
ALTER TABLE organization_subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE usage_records ENABLE ROW LEVEL SECURITY;
ALTER TABLE invoices ENABLE ROW LEVEL SECURITY;
ALTER TABLE payment_methods ENABLE ROW LEVEL SECURITY;
ALTER TABLE billing_events ENABLE ROW LEVEL SECURITY;
-- Plans are publicly readable
CREATE POLICY "Plans are readable by all" ON subscription_plans
    FOR SELECT USING (is_active = true AND is_public = true);
-- Subscription access by org members
CREATE POLICY "Org members can view subscription" ON organization_subscriptions
    FOR SELECT USING (
        org_id IN (SELECT org_id FROM user_organization_roles WHERE user_id = auth.uid())
    );
-- Only admins can modify subscriptions
CREATE POLICY "Admins can manage subscriptions" ON organization_subscriptions
    FOR ALL USING (
        org_id IN (
            SELECT org_id FROM user_organization_roles
            WHERE user_id = auth.uid() AND role IN ('owner', 'admin')
        )
    );
-- Usage records access
CREATE POLICY "Org members can view usage" ON usage_records
    FOR SELECT USING (
        org_id IN (SELECT org_id FROM user_organization_roles WHERE user_id = auth.uid())
    );
-- Invoices access
CREATE POLICY "Org admins can view invoices" ON invoices
    FOR SELECT USING (
        org_id IN (
            SELECT org_id FROM user_organization_roles
            WHERE user_id = auth.uid() AND role IN ('owner', 'admin', 'billing')
        )
    );
-- Payment methods access
CREATE POLICY "Org admins can manage payment methods" ON payment_methods
    FOR ALL USING (
        org_id IN (
            SELECT org_id FROM user_organization_roles
            WHERE user_id = auth.uid() AND role IN ('owner', 'admin', 'billing')
        )
    );
-- Billing events access
CREATE POLICY "Org admins can view billing events" ON billing_events
    FOR SELECT USING (
        org_id IN (
            SELECT org_id FROM user_organization_roles
            WHERE user_id = auth.uid() AND role IN ('owner', 'admin', 'billing')
        )
    );
-- ============================================================================
-- FUNCTIONS
-- ============================================================================

-- Get or create current usage record
CREATE OR REPLACE FUNCTION get_or_create_current_usage(p_org_id UUID)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_usage_id UUID;
    v_subscription organization_subscriptions%ROWTYPE;
BEGIN
    -- Check for existing current record
    SELECT id INTO v_usage_id
    FROM usage_records
    WHERE org_id = p_org_id AND is_current = true;

    IF v_usage_id IS NOT NULL THEN
        RETURN v_usage_id;
    END IF;

    -- Get subscription for period dates
    SELECT * INTO v_subscription
    FROM organization_subscriptions
    WHERE org_id = p_org_id;

    -- Create new usage record
    INSERT INTO usage_records (
        org_id,
        subscription_id,
        period_start,
        period_end,
        is_current
    ) VALUES (
        p_org_id,
        v_subscription.id,
        COALESCE(v_subscription.current_period_start, NOW()),
        COALESCE(v_subscription.current_period_end, NOW() + INTERVAL '1 month'),
        true
    )
    RETURNING id INTO v_usage_id;

    RETURN v_usage_id;
END;
$$;
-- Increment usage metric
CREATE OR REPLACE FUNCTION increment_usage(
    p_org_id UUID,
    p_metric TEXT,
    p_amount INTEGER DEFAULT 1
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_usage_id UUID;
BEGIN
    v_usage_id := get_or_create_current_usage(p_org_id);

    EXECUTE format(
        'UPDATE usage_records SET %I = %I + $1, updated_at = NOW() WHERE id = $2',
        p_metric, p_metric
    ) USING p_amount, v_usage_id;
END;
$$;
-- Get current usage with limits
CREATE OR REPLACE FUNCTION get_usage_with_limits(p_org_id UUID)
RETURNS TABLE (
    metric TEXT,
    current_value INTEGER,
    limit_value INTEGER,
    usage_percent DECIMAL
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    RETURN QUERY
    WITH org_sub AS (
        SELECT os.*, sp.*
        FROM organization_subscriptions os
        JOIN subscription_plans sp ON sp.id = os.plan_id
        WHERE os.org_id = p_org_id
    ),
    current_usage AS (
        SELECT * FROM usage_records
        WHERE org_id = p_org_id AND is_current = true
    )
    SELECT
        'users' AS metric,
        COALESCE(cu.users_count, 0) AS current_value,
        s.max_users AS limit_value,
        CASE WHEN s.max_users IS NOT NULL AND s.max_users > 0
             THEN (COALESCE(cu.users_count, 0)::DECIMAL / s.max_users * 100)
             ELSE 0
        END AS usage_percent
    FROM org_sub s
    LEFT JOIN current_usage cu ON true

    UNION ALL

    SELECT
        'leads',
        COALESCE(cu.leads_count, 0),
        s.max_leads,
        CASE WHEN s.max_leads IS NOT NULL AND s.max_leads > 0
             THEN (COALESCE(cu.leads_count, 0)::DECIMAL / s.max_leads * 100)
             ELSE 0
        END
    FROM org_sub s
    LEFT JOIN current_usage cu ON true

    UNION ALL

    SELECT
        'messages',
        COALESCE(cu.messages_sent, 0),
        s.max_messages_per_month,
        CASE WHEN s.max_messages_per_month IS NOT NULL AND s.max_messages_per_month > 0
             THEN (COALESCE(cu.messages_sent, 0)::DECIMAL / s.max_messages_per_month * 100)
             ELSE 0
        END
    FROM org_sub s
    LEFT JOIN current_usage cu ON true

    UNION ALL

    SELECT
        'sequences',
        COALESCE(cu.sequences_active, 0),
        s.max_sequences,
        CASE WHEN s.max_sequences IS NOT NULL AND s.max_sequences > 0
             THEN (COALESCE(cu.sequences_active, 0)::DECIMAL / s.max_sequences * 100)
             ELSE 0
        END
    FROM org_sub s
    LEFT JOIN current_usage cu ON true

    UNION ALL

    SELECT
        'ai_assists',
        COALESCE(cu.ai_assists_used, 0),
        s.max_ai_assists_per_month,
        CASE WHEN s.max_ai_assists_per_month IS NOT NULL AND s.max_ai_assists_per_month > 0
             THEN (COALESCE(cu.ai_assists_used, 0)::DECIMAL / s.max_ai_assists_per_month * 100)
             ELSE 0
        END
    FROM org_sub s
    LEFT JOIN current_usage cu ON true;
END;
$$;
-- Check if usage limit exceeded
CREATE OR REPLACE FUNCTION check_usage_limit(
    p_org_id UUID,
    p_metric TEXT
)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_current INTEGER;
    v_limit INTEGER;
BEGIN
    SELECT current_value, limit_value INTO v_current, v_limit
    FROM get_usage_with_limits(p_org_id)
    WHERE metric = p_metric;

    -- NULL limit means unlimited
    IF v_limit IS NULL THEN
        RETURN false;
    END IF;

    RETURN v_current >= v_limit;
END;
$$;
-- Finalize usage period and create new one
CREATE OR REPLACE FUNCTION finalize_usage_period(p_org_id UUID)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    -- Mark current as finalized
    UPDATE usage_records
    SET is_current = false,
        finalized_at = NOW(),
        updated_at = NOW()
    WHERE org_id = p_org_id AND is_current = true;

    -- Create new current period
    PERFORM get_or_create_current_usage(p_org_id);
END;
$$;
-- Generate invoice number
CREATE OR REPLACE FUNCTION generate_invoice_number()
RETURNS TEXT
LANGUAGE plpgsql
AS $$
DECLARE
    v_num INTEGER;
BEGIN
    SELECT nextval('invoice_number_seq') INTO v_num;
    RETURN 'INV-' || TO_CHAR(NOW(), 'YYYY') || '-' || LPAD(v_num::TEXT, 6, '0');
END;
$$;
-- Create invoice from subscription
CREATE OR REPLACE FUNCTION create_subscription_invoice(
    p_org_id UUID,
    p_description TEXT DEFAULT NULL
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_subscription organization_subscriptions%ROWTYPE;
    v_plan subscription_plans%ROWTYPE;
    v_invoice_id UUID;
    v_price DECIMAL(10,2);
    v_line_items JSONB;
BEGIN
    -- Get subscription and plan
    SELECT os.*, sp.* INTO v_subscription
    FROM organization_subscriptions os
    JOIN subscription_plans sp ON sp.id = os.plan_id
    WHERE os.org_id = p_org_id;

    SELECT * INTO v_plan FROM subscription_plans WHERE id = v_subscription.plan_id;

    IF v_subscription.id IS NULL THEN
        RAISE EXCEPTION 'No subscription found for org';
    END IF;

    -- Determine price based on billing cycle
    v_price := CASE v_subscription.billing_cycle
        WHEN 'yearly' THEN v_plan.price_yearly
        ELSE v_plan.price_monthly
    END;

    -- Apply discount
    v_price := v_price * (1 - COALESCE(v_subscription.discount_percent, 0) / 100);

    -- Create line items
    v_line_items := jsonb_build_array(
        jsonb_build_object(
            'description', v_plan.name || ' - ' || INITCAP(v_subscription.billing_cycle) || ' Subscription',
            'quantity', 1,
            'unit_price', v_price,
            'amount', v_price
        )
    );

    -- Create invoice
    INSERT INTO invoices (
        org_id,
        subscription_id,
        invoice_number,
        status,
        subtotal,
        discount_amount,
        total,
        amount_due,
        period_start,
        period_end,
        due_date,
        line_items,
        notes
    ) VALUES (
        p_org_id,
        v_subscription.id,
        generate_invoice_number(),
        'open',
        v_price,
        0,
        v_price,
        v_price,
        v_subscription.current_period_start,
        v_subscription.current_period_end,
        NOW() + INTERVAL '30 days',
        v_line_items,
        p_description
    )
    RETURNING id INTO v_invoice_id;

    -- Log billing event
    INSERT INTO billing_events (org_id, subscription_id, invoice_id, event_type, description, data)
    VALUES (
        p_org_id,
        v_subscription.id,
        v_invoice_id,
        'invoice.created',
        'Invoice created for subscription',
        jsonb_build_object('amount', v_price, 'plan', v_plan.name)
    );

    RETURN v_invoice_id;
END;
$$;
-- ============================================================================
-- SEED DATA: Default Plans
-- ============================================================================

INSERT INTO subscription_plans (name, slug, description, tier, price_monthly, price_yearly, max_users, max_leads, max_messages_per_month, max_sequences, max_ai_assists_per_month, storage_gb, features, sort_order) VALUES
(
    'Starter',
    'starter',
    'Perfect for individual advisors getting started',
    'starter',
    49.00,
    470.00,
    1,
    100,
    500,
    3,
    50,
    5,
    '["Basic lead management", "Email & SMS messaging", "3 automation sequences", "Basic reporting", "Email support"]',
    1
),
(
    'Professional',
    'professional',
    'For growing teams that need more power',
    'professional',
    149.00,
    1430.00,
    5,
    1000,
    5000,
    25,
    500,
    25,
    '["Everything in Starter", "Priority OS power list", "Unlimited sequences", "AI message assistant", "Compliance tracking", "Advanced analytics", "Priority support"]',
    2
),
(
    'Business',
    'business',
    'For established agencies with advanced needs',
    'business',
    349.00,
    3350.00,
    25,
    10000,
    25000,
    100,
    2500,
    100,
    '["Everything in Professional", "Custom branding", "API access", "Dedicated success manager", "Custom integrations", "Audit logs", "SSO/SAML", "Phone support"]',
    3
),
(
    'Enterprise',
    'enterprise',
    'Custom solutions for large organizations',
    'enterprise',
    0,
    0,
    NULL,
    NULL,
    NULL,
    NULL,
    NULL,
    NULL,
    '["Everything in Business", "Unlimited users", "Unlimited leads", "Custom limits", "On-premise option", "SLA guarantee", "Dedicated infrastructure", "24/7 support"]',
    4
)
ON CONFLICT (slug) DO UPDATE SET
    name = EXCLUDED.name,
    description = EXCLUDED.description,
    price_monthly = EXCLUDED.price_monthly,
    price_yearly = EXCLUDED.price_yearly,
    max_users = EXCLUDED.max_users,
    max_leads = EXCLUDED.max_leads,
    max_messages_per_month = EXCLUDED.max_messages_per_month,
    max_sequences = EXCLUDED.max_sequences,
    max_ai_assists_per_month = EXCLUDED.max_ai_assists_per_month,
    storage_gb = EXCLUDED.storage_gb,
    features = EXCLUDED.features,
    updated_at = NOW();
-- ============================================================================
-- TRIGGERS
-- ============================================================================

-- Update timestamp trigger
CREATE OR REPLACE FUNCTION update_billing_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;
CREATE TRIGGER update_subscription_plans_updated_at
    BEFORE UPDATE ON subscription_plans
    FOR EACH ROW EXECUTE FUNCTION update_billing_updated_at();
CREATE TRIGGER update_organization_subscriptions_updated_at
    BEFORE UPDATE ON organization_subscriptions
    FOR EACH ROW EXECUTE FUNCTION update_billing_updated_at();
CREATE TRIGGER update_usage_records_updated_at
    BEFORE UPDATE ON usage_records
    FOR EACH ROW EXECUTE FUNCTION update_billing_updated_at();
CREATE TRIGGER update_invoices_updated_at
    BEFORE UPDATE ON invoices
    FOR EACH ROW EXECUTE FUNCTION update_billing_updated_at();
CREATE TRIGGER update_payment_methods_updated_at
    BEFORE UPDATE ON payment_methods
    FOR EACH ROW EXECUTE FUNCTION update_billing_updated_at();
-- Ensure only one default payment method per org
CREATE OR REPLACE FUNCTION ensure_single_default_payment_method()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.is_default = true THEN
        UPDATE payment_methods
        SET is_default = false
        WHERE org_id = NEW.org_id AND id != NEW.id;
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;
CREATE TRIGGER ensure_single_default_payment
    BEFORE INSERT OR UPDATE ON payment_methods
    FOR EACH ROW
    WHEN (NEW.is_default = true)
    EXECUTE FUNCTION ensure_single_default_payment_method();
