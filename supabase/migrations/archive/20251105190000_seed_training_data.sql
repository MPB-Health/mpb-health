/*
  # Seed MPB Health Advisor Training University Data

  This migration seeds 31 training modules across 5 learning paths.
  All apostrophes are properly escaped using double single quotes.
*/

-- Clear any existing data
DELETE FROM training_progress;
DELETE FROM onboarding_progress;
DELETE FROM onboarding_steps;
DELETE FROM training_modules;

-- ONBOARDING MODULES
INSERT INTO training_modules (title, description, category, content_type, content_url, duration_minutes, order_index, is_required, prerequisites) VALUES
('Welcome to MPB Health', 'Introduction to MPB Health''s mission, values, and culture. Learn about our history and what makes us unique in the health sharing industry.', 'onboarding', 'video', 'https://www.youtube.com/embed/dQw4w9WgXcQ', 15, 1, true, '{}'),
('Company Structure & Team', 'Meet the MPB Health team, understand our organizational structure, and learn who to contact for different needs.', 'onboarding', 'document', null, 20, 2, true, '{}'),
('Health Sharing 101', 'Fundamental concepts of health sharing, how it differs from insurance, and the core principles that guide our members.', 'onboarding', 'video', 'https://www.youtube.com/embed/dQw4w9WgXcQ', 30, 3, true, '{}'),
('Member Experience Overview', 'Understanding the complete member journey from enrollment through claims processing to renewal.', 'onboarding', 'interactive', null, 25, 4, true, '{}'),
('Technology & Tools Training', 'Learn to use MPB Health''s technology platform, CRM system, member portal, and communication tools.', 'onboarding', 'video', 'https://www.youtube.com/embed/dQw4w9WgXcQ', 45, 5, true, '{}'),
('Communication Best Practices', 'Effective communication strategies for working with members, handling concerns, and building trust.', 'onboarding', 'document', null, 30, 6, true, '{}');

-- PRODUCT KNOWLEDGE MODULES
INSERT INTO training_modules (title, description, category, content_type, content_url, duration_minutes, order_index, is_required, prerequisites) VALUES
('MPB Plans Overview', 'Complete overview of all MPB Health plans including Core, Essential, Family, and Senior options.', 'product_knowledge', 'video', 'https://www.youtube.com/embed/dQw4w9WgXcQ', 40, 10, true, '{}'),
('Core Plan Deep Dive', 'In-depth training on the Core Plan features, benefits, limitations, and ideal member profiles.', 'product_knowledge', 'document', null, 35, 11, true, '{}'),
('Essential Plan Details', 'Comprehensive guide to the Essential Plan including coverage levels, sharing amounts, and member responsibilities.', 'product_knowledge', 'document', null, 35, 12, true, '{}'),
('Family Plan Features', 'Understanding family plan options, dependent coverage, maternity benefits, and family-specific scenarios.', 'product_knowledge', 'video', 'https://www.youtube.com/embed/dQw4w9WgXcQ', 30, 13, true, '{}'),
('Senior Plan Specifics', 'Specialized training for senior member needs, Medicare integration, and senior health considerations.', 'product_knowledge', 'document', null, 30, 14, false, '{}'),
('Voluntary Benefits & Add-ons', 'Overview of supplemental benefits including dental, vision, telemedicine, and wellness programs.', 'product_knowledge', 'video', 'https://www.youtube.com/embed/dQw4w9WgXcQ', 25, 15, false, '{}'),
('Pricing & Rate Structures', 'Understanding MPB Health pricing models, age-based rating, geographic adjustments, and discount structures.', 'product_knowledge', 'document', null, 40, 16, true, '{}'),
('Comparing to Traditional Insurance', 'How to effectively compare health sharing to traditional insurance and address common objections.', 'product_knowledge', 'interactive', null, 30, 17, true, '{}');

-- CLAIMS PROCESSING MODULES
INSERT INTO training_modules (title, description, category, content_type, content_url, duration_minutes, order_index, is_required, prerequisites) VALUES
('Claims Process Introduction', 'Overview of the MPB Health claims process from submission through resolution.', 'claims_processing', 'video', 'https://www.youtube.com/embed/dQw4w9WgXcQ', 30, 20, true, '{}'),
('Medical Needs Qualification', 'How to determine if a medical need qualifies for sharing under MPB Health guidelines.', 'claims_processing', 'document', null, 45, 21, true, '{}'),
('Pre-Existing Conditions Guidelines', 'Understanding pre-existing condition rules, waiting periods, and member disclosures.', 'claims_processing', 'document', null, 35, 22, true, '{}'),
('Claims Documentation Requirements', 'What documentation is needed for different types of claims and how to help members gather it.', 'claims_processing', 'document', null, 40, 23, true, '{}'),
('Common Claims Scenarios', 'Walk through typical claims scenarios including emergencies, hospitalizations, and routine care.', 'claims_processing', 'interactive', null, 50, 24, true, '{}'),
('Denied Claims & Appeals', 'How to handle claim denials, the appeals process, and member advocacy.', 'claims_processing', 'document', null, 35, 25, true, '{}'),
('Provider Network Guidance', 'Helping members find providers, negotiate costs, and maximize their sharing experience.', 'claims_processing', 'video', 'https://www.youtube.com/embed/dQw4w9WgXcQ', 25, 26, false, '{}');

-- COMPLIANCE MODULES
INSERT INTO training_modules (title, description, category, content_type, content_url, duration_minutes, order_index, is_required, prerequisites) VALUES
('Regulatory Compliance Overview', 'Understanding the regulatory framework for health sharing organizations and advisor responsibilities.', 'compliance', 'document', null, 35, 30, true, '{}'),
('State-Specific Regulations', 'Key differences in regulations across states where MPB Health operates.', 'compliance', 'document', null, 40, 31, true, '{}'),
('HIPAA & Privacy Requirements', 'Protecting member privacy, HIPAA compliance, and data security best practices.', 'compliance', 'video', 'https://www.youtube.com/embed/dQw4w9WgXcQ', 45, 32, true, '{}'),
('Anti-Fraud Policies', 'Identifying and preventing fraud, reporting procedures, and maintaining integrity.', 'compliance', 'document', null, 30, 33, true, '{}'),
('Ethical Guidelines for Advisors', 'Professional ethics, conflict of interest policies, and maintaining member trust.', 'compliance', 'document', null, 25, 34, true, '{}'),
('Marketing & Advertising Rules', 'Compliance requirements for marketing materials, social media, and member communications.', 'compliance', 'document', null, 30, 35, true, '{}');

-- SALES MODULES
INSERT INTO training_modules (title, description, category, content_type, content_url, duration_minutes, order_index, is_required, prerequisites) VALUES
('Consultative Selling Techniques', 'Advanced sales methodologies focused on understanding member needs and providing solutions.', 'sales', 'video', 'https://www.youtube.com/embed/dQw4w9WgXcQ', 40, 40, false, '{}'),
('Handling Objections', 'Strategies for addressing common objections and concerns from prospective members.', 'sales', 'interactive', null, 35, 41, false, '{}'),
('Group & Employer Sales', 'Specialized training for selling to businesses and organizations.', 'sales', 'document', null, 50, 42, false, '{}'),
('Building Your Advisor Practice', 'Business development strategies, marketing your services, and growing your client base.', 'sales', 'document', null, 45, 43, false, '{}'),
('Referral Program Mastery', 'Maximizing the MPB Health referral program and building a referral network.', 'sales', 'video', 'https://www.youtube.com/embed/dQw4w9WgXcQ', 30, 44, false, '{}'),
('Advanced Member Retention', 'Strategies for keeping members engaged, reducing churn, and increasing lifetime value.', 'sales', 'interactive', null, 40, 45, false, '{}');

-- CREATE ONBOARDING STEPS
DO $$
DECLARE
  welcome_id uuid;
  structure_id uuid;
  healthsharing_id uuid;
  member_exp_id uuid;
  tech_id uuid;
  comm_id uuid;
BEGIN
  SELECT id INTO welcome_id FROM training_modules WHERE title = 'Welcome to MPB Health';
  SELECT id INTO structure_id FROM training_modules WHERE title = 'Company Structure & Team';
  SELECT id INTO healthsharing_id FROM training_modules WHERE title = 'Health Sharing 101';
  SELECT id INTO member_exp_id FROM training_modules WHERE title = 'Member Experience Overview';
  SELECT id INTO tech_id FROM training_modules WHERE title = 'Technology & Tools Training';
  SELECT id INTO comm_id FROM training_modules WHERE title = 'Communication Best Practices';

  INSERT INTO onboarding_steps (title, description, order_index, required_modules, required_forms, is_active) VALUES
  ('Getting Started', 'Complete your profile and watch the welcome orientation', 1, ARRAY[welcome_id::text, structure_id::text], ARRAY['profile_completion', 'background_check'], true),
  ('Foundation Training', 'Learn the fundamentals of health sharing and MPB Health operations', 2, ARRAY[healthsharing_id::text, member_exp_id::text], ARRAY[]::text[], true),
  ('Technology Setup', 'Get familiar with our systems and communication tools', 3, ARRAY[tech_id::text, comm_id::text], ARRAY['system_access_form'], true),
  ('Product Certification', 'Complete product training and pass the certification quiz', 4, ARRAY[]::text[], ARRAY['product_quiz'], true),
  ('Compliance Training', 'Complete all required compliance and regulatory modules', 5, ARRAY[]::text[], ARRAY['compliance_attestation'], true),
  ('Final Review', 'Shadow experienced advisors and complete your onboarding checklist', 6, ARRAY[]::text[], ARRAY['shadowing_log', 'onboarding_survey'], true);
END $$;

-- CREATE REPORTING VIEW
CREATE OR REPLACE VIEW advisor_training_completion AS
SELECT
  ap.id as advisor_id,
  ap.first_name,
  ap.last_name,
  ap.email,
  COUNT(DISTINCT tm.id) FILTER (WHERE tm.is_required = true) as total_required_modules,
  COUNT(DISTINCT tp.module_id) FILTER (WHERE tp.status = 'completed' AND tm.is_required = true) as completed_required_modules,
  COUNT(DISTINCT tm.id) as total_modules,
  COUNT(DISTINCT tp.module_id) FILTER (WHERE tp.status = 'completed') as completed_all_modules,
  ROUND(
    (COUNT(DISTINCT tp.module_id) FILTER (WHERE tp.status = 'completed' AND tm.is_required = true)::numeric /
    NULLIF(COUNT(DISTINCT tm.id) FILTER (WHERE tm.is_required = true), 0)) * 100,
    2
  ) as required_completion_pct,
  ap.onboarding_completed
FROM advisor_profiles ap
CROSS JOIN training_modules tm
LEFT JOIN training_progress tp ON tp.advisor_id = ap.id AND tp.module_id = tm.id
WHERE tm.is_active = true
GROUP BY ap.id, ap.first_name, ap.last_name, ap.email, ap.onboarding_completed;
