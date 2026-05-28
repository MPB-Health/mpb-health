-- ============================================================================
-- CRM rebuild — Phase 3 — Seed master templates for Quote Response cadence
-- ============================================================================
--
-- Seeds 6 placeholder master template rows per org for the Quote Response
-- cadence: Email #1 (Day 0), TP#1–TP#5 at Day 3/7/14/21/30. Uses placeholder
-- content with merge tokens; actual copy is TBD from the .docx.
--
-- After inserting templates, updates the Quote Response cadence's `steps`
-- jsonb to wire each step's `template_id` to the corresponding row.
-- ============================================================================

BEGIN;

-- Helper: insert 6 templates per org, skip orgs that already have them.
DO $$
DECLARE
    v_org  record;
    v_ids  uuid[];
BEGIN
    FOR v_org IN SELECT id FROM public.orgs LOOP
        -- Skip if this org already has Email #1 master template
        IF EXISTS (
            SELECT 1 FROM public.crm_master_templates
            WHERE org_id = v_org.id
              AND channel = 'email'
              AND name = 'Email #1'
              AND archived_at IS NULL
        ) THEN
            CONTINUE;
        END IF;

        -- Insert 6 templates and capture their ids in order
        WITH ins AS (
            INSERT INTO public.crm_master_templates (org_id, channel, name, subject, body, version, tags)
            VALUES
                (v_org.id, 'email', 'Email #1',
                 'Your health coverage quote from MPB.Health',
                 E'Hi #firstname,\n\nThank you for requesting a quote from MPB.Health! We''ve put together a preliminary quote based on the information you provided.\n\nPlan: #plan\nEstimated Monthly Premium: #quote price\n\nThis quote is based on the details you shared and may change once we gather a few more specifics. One of our licensed agents will be reaching out shortly to walk you through your options and answer any questions.\n\nIn the meantime, feel free to reply to this email or call us directly.\n\n#yoursignature',
                 1, ARRAY['quote-response', 'auto-response']),

                (v_org.id, 'email', 'TP#1 — Day 3 Follow-up',
                 'Following up on your health coverage quote',
                 E'Hi #firstname,\n\nI wanted to follow up on the quote we sent a few days ago. Have you had a chance to review it?\n\nIf you have any questions about your coverage options or would like to discuss next steps, I''d be happy to help. We can schedule a quick call at your convenience.\n\nLooking forward to hearing from you!\n\n#yoursignature',
                 1, ARRAY['quote-response', 'follow-up']),

                (v_org.id, 'email', 'TP#2 — Day 7 Follow-up',
                 'Quick check-in: your MPB.Health quote',
                 E'Hi #firstname,\n\nJust checking in on the health coverage quote we prepared for you. Open enrollment periods can fill up quickly, so I wanted to make sure you don''t miss out on the best options available.\n\nWould you prefer a quick phone call or an email to go over the details? Either way, I''m here to help.\n\n#yoursignature',
                 1, ARRAY['quote-response', 'follow-up']),

                (v_org.id, 'email', 'TP#3 — Day 14 Follow-up',
                 'Still thinking about your health coverage?',
                 E'Hi #firstname,\n\nIt''s been a couple of weeks since we sent your initial quote, and I wanted to reach out one more time. Choosing the right health plan is a big decision, and I understand it takes time.\n\nHere are a few things to keep in mind:\n- Your quoted rate is based on current availability\n- We can adjust coverage levels to fit your budget\n- There''s no cost or obligation to explore your options with us\n\nReply to this email or give us a call whenever you''re ready.\n\n#yoursignature',
                 1, ARRAY['quote-response', 'follow-up']),

                (v_org.id, 'email', 'TP#4 — Day 21 Follow-up',
                 'Your coverage options are still available, #firstname',
                 E'Hi #firstname,\n\nI know life gets busy, but I didn''t want your quote to slip through the cracks. Your coverage options are still available, and I''d love to help you take the next step.\n\nIf your situation has changed or you''d like an updated quote, just let me know. I can have revised numbers to you within 24 hours.\n\n#yoursignature',
                 1, ARRAY['quote-response', 'follow-up']),

                (v_org.id, 'email', 'TP#5 — Day 30 Final Follow-up',
                 'Last check-in: your health coverage quote',
                 E'Hi #firstname,\n\nThis is my final follow-up regarding the health coverage quote we prepared for you. I completely understand if now isn''t the right time — your quote details will stay on file with us.\n\nWhenever you''re ready to revisit your options, just reply to this email or visit our website. We''re always here to help.\n\nWishing you all the best!\n\n#yoursignature',
                 1, ARRAY['quote-response', 'follow-up'])
            RETURNING id
        )
        SELECT array_agg(id ORDER BY ctid) INTO v_ids FROM ins;

        -- Wire the Quote Response cadence steps to these templates
        UPDATE public.crm_follow_up_cadences
        SET steps = jsonb_build_array(
            jsonb_build_object('step', 1, 'channel', 'email', 'day_offset', 0,  'template_id', v_ids[1]::text, 'description', 'Email #1 — preliminary quote (auto from website)',      'halt_on_engagement', true, 'send_window', null),
            jsonb_build_object('step', 2, 'channel', 'email', 'day_offset', 3,  'template_id', v_ids[2]::text, 'description', 'TP#1 — Day 3 follow-up',                                 'halt_on_engagement', true, 'send_window', null),
            jsonb_build_object('step', 3, 'channel', 'email', 'day_offset', 7,  'template_id', v_ids[3]::text, 'description', 'TP#2 — Day 7 follow-up',                                 'halt_on_engagement', true, 'send_window', null),
            jsonb_build_object('step', 4, 'channel', 'email', 'day_offset', 14, 'template_id', v_ids[4]::text, 'description', 'TP#3 — Day 14 follow-up',                                'halt_on_engagement', true, 'send_window', null),
            jsonb_build_object('step', 5, 'channel', 'email', 'day_offset', 21, 'template_id', v_ids[5]::text, 'description', 'TP#4 — Day 21 follow-up',                                'halt_on_engagement', true, 'send_window', null),
            jsonb_build_object('step', 6, 'channel', 'email', 'day_offset', 30, 'template_id', v_ids[6]::text, 'description', 'TP#5 — Day 30 final follow-up before nurture promotion', 'halt_on_engagement', true, 'send_window', null)
        ),
        updated_at = now()
        WHERE org_id = v_org.id
          AND name = 'Quote Response';
    END LOOP;
END;
$$;

COMMIT;
