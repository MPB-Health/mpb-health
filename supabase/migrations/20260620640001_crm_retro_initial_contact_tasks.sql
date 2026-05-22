-- ============================================================================
-- CRM rebuild — retroactive Initial Contact tasks for the 230-lead backfill cohort
--
-- The Phase 2 `crm_lead_after_insert_automation` trigger creates an Initial
-- Contact task at insert time. Because the 230 org_id-backfill leads were
-- already in the table when their org_id and assigned_to were patched (via
-- UPDATE, not INSERT), the trigger never fired. This leaves reps with 10
-- new leads each but no task-queue prompt.
--
-- This migration creates one "Initial Contact" task per cohort lead:
--   • due_date = now() (immediately actionable)
--   • task_type = 'call'
--   • priority = 'high'
--   • assigned_to = lead.assigned_to (the rep who just received the lead)
--   • completed = false
--   • org_id = lead.org_id
--
-- Deliberately does NOT enroll the lead in any cadence and does NOT send
-- any email (per operator decision: retro_email = none).
-- ============================================================================

BEGIN;

INSERT INTO public.lead_tasks (
    lead_id,
    title,
    description,
    task_type,
    due_date,
    priority,
    completed,
    assigned_to,
    created_by,
    org_id
)
SELECT
    ls.id,
    'Initial Contact — ' || TRIM(COALESCE(ls.first_name, '') || ' ' || COALESCE(ls.last_name, '')),
    'Recovered website lead (backfill cohort 2026-05-18). No auto-response was sent — please make first contact.',
    'call',
    now(),
    'high',
    false,
    ls.assigned_to,
    ls.assigned_to,
    ls.org_id
FROM public.lead_submissions ls
WHERE 'backfill_2026_05_18_org' = ANY(ls.tags)
  AND ls.assigned_to IS NOT NULL
  AND NOT EXISTS (
      SELECT 1 FROM public.lead_tasks lt
       WHERE lt.lead_id = ls.id
         AND lt.completed = false
  );

-- Update next_followup_at on the leads so dashboard widgets surface them.
UPDATE public.lead_submissions ls
   SET next_followup_at = now(),
       updated_at       = now()
 WHERE 'backfill_2026_05_18_org' = ANY(ls.tags)
   AND ls.assigned_to IS NOT NULL
   AND ls.next_followup_at IS NULL;

-- Audit trail
INSERT INTO public.audit_logs (
    user_id, user_email, action, entity_type, entity_id,
    old_values, new_values, created_at
)
VALUES (
    NULL,
    'system:migration',
    'crm.intake.retro_initial_contact_tasks',
    'lead_tasks',
    'bulk:backfill_2026_05_18_org',
    jsonb_build_object('reason', 'Phase 2 insert trigger did not fire on UPDATE-only assignment; reps had no task prompt'),
    jsonb_build_object(
        'task_type', 'call',
        'priority', 'high',
        'due_date', 'now()',
        'cadence_enrolled', false,
        'email_sent', false,
        'cohort_tag', 'backfill_2026_05_18_org'
    ),
    now()
);

COMMIT;
