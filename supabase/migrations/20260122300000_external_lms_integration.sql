-- External LMS Integration for MPB Training Platform
-- Integrates with training.mpb.health (Tutor LMS)

-- Add external LMS fields to training_modules
ALTER TABLE training_modules
ADD COLUMN IF NOT EXISTS external_lms_url TEXT,
ADD COLUMN IF NOT EXISTS external_lms_course_id TEXT,
ADD COLUMN IF NOT EXISTS external_lms_lesson_id TEXT,
ADD COLUMN IF NOT EXISTS lms_provider TEXT DEFAULT 'internal' CHECK (lms_provider IN ('internal', 'tutor_lms', 'external')),
ADD COLUMN IF NOT EXISTS requires_external_completion BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS external_course_name TEXT;
-- Create table for tracking external LMS completion
CREATE TABLE IF NOT EXISTS advisor_external_training_progress (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  advisor_id UUID NOT NULL REFERENCES advisor_profiles(id) ON DELETE CASCADE,
  module_id UUID REFERENCES training_modules(id) ON DELETE CASCADE,
  external_course_id TEXT,
  external_lesson_id TEXT,
  lms_provider TEXT NOT NULL DEFAULT 'tutor_lms',
  status TEXT NOT NULL DEFAULT 'not_started' CHECK (status IN ('not_started', 'in_progress', 'completed', 'verified')),
  started_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ,
  verified_at TIMESTAMPTZ,
  verified_by UUID REFERENCES auth.users(id),
  external_progress_percent INTEGER DEFAULT 0,
  external_score INTEGER,
  certificate_url TEXT,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(advisor_id, module_id),
  UNIQUE(advisor_id, external_course_id, external_lesson_id)
);
-- Create table for LMS course catalog (mirrors external LMS structure)
CREATE TABLE IF NOT EXISTS external_lms_courses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  lms_provider TEXT NOT NULL DEFAULT 'tutor_lms',
  external_id TEXT NOT NULL,
  title TEXT NOT NULL,
  description TEXT,
  category TEXT,
  thumbnail_url TEXT,
  course_url TEXT NOT NULL,
  is_required BOOLEAN DEFAULT false,
  order_index INTEGER DEFAULT 0,
  estimated_hours NUMERIC(4,2) DEFAULT 1,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(lms_provider, external_id)
);
-- Create table for LMS lessons within courses
CREATE TABLE IF NOT EXISTS external_lms_lessons (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  course_id UUID NOT NULL REFERENCES external_lms_courses(id) ON DELETE CASCADE,
  external_id TEXT,
  title TEXT NOT NULL,
  description TEXT,
  lesson_url TEXT NOT NULL,
  order_index INTEGER DEFAULT 0,
  duration_minutes INTEGER DEFAULT 10,
  has_video BOOLEAN DEFAULT false,
  has_quiz BOOLEAN DEFAULT false,
  is_required BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
-- Create table for advisor course enrollments
CREATE TABLE IF NOT EXISTS advisor_lms_enrollments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  advisor_id UUID NOT NULL REFERENCES advisor_profiles(id) ON DELETE CASCADE,
  course_id UUID NOT NULL REFERENCES external_lms_courses(id) ON DELETE CASCADE,
  status TEXT NOT NULL DEFAULT 'enrolled' CHECK (status IN ('enrolled', 'in_progress', 'completed', 'certified')),
  enrolled_at TIMESTAMPTZ DEFAULT NOW(),
  started_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ,
  progress_percent INTEGER DEFAULT 0,
  lessons_completed INTEGER DEFAULT 0,
  total_lessons INTEGER DEFAULT 0,
  certificate_earned BOOLEAN DEFAULT false,
  certificate_url TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(advisor_id, course_id)
);
-- Create table for lesson completion tracking
CREATE TABLE IF NOT EXISTS advisor_lesson_completions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  advisor_id UUID NOT NULL REFERENCES advisor_profiles(id) ON DELETE CASCADE,
  enrollment_id UUID NOT NULL REFERENCES advisor_lms_enrollments(id) ON DELETE CASCADE,
  lesson_id UUID NOT NULL REFERENCES external_lms_lessons(id) ON DELETE CASCADE,
  status TEXT NOT NULL DEFAULT 'not_started' CHECK (status IN ('not_started', 'in_progress', 'completed')),
  started_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ,
  time_spent_minutes INTEGER DEFAULT 0,
  quiz_score INTEGER,
  quiz_passed BOOLEAN,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(advisor_id, lesson_id)
);
-- Enable RLS
ALTER TABLE advisor_external_training_progress ENABLE ROW LEVEL SECURITY;
ALTER TABLE external_lms_courses ENABLE ROW LEVEL SECURITY;
ALTER TABLE external_lms_lessons ENABLE ROW LEVEL SECURITY;
ALTER TABLE advisor_lms_enrollments ENABLE ROW LEVEL SECURITY;
ALTER TABLE advisor_lesson_completions ENABLE ROW LEVEL SECURITY;
-- RLS Policies for external_lms_courses (public read)
CREATE POLICY "Anyone can view active LMS courses"
  ON external_lms_courses FOR SELECT
  USING (is_active = true);
CREATE POLICY "Admins can manage LMS courses"
  ON external_lms_courses FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM auth.users u
      WHERE u.id = auth.uid()
      AND u.raw_user_meta_data->>'role' IN ('admin', 'super_admin')
    )
  );
-- RLS Policies for external_lms_lessons (public read)
CREATE POLICY "Anyone can view LMS lessons"
  ON external_lms_lessons FOR SELECT
  USING (true);
CREATE POLICY "Admins can manage LMS lessons"
  ON external_lms_lessons FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM auth.users u
      WHERE u.id = auth.uid()
      AND u.raw_user_meta_data->>'role' IN ('admin', 'super_admin')
    )
  );
-- RLS Policies for advisor_lms_enrollments
CREATE POLICY "Advisors can view own enrollments"
  ON advisor_lms_enrollments FOR SELECT
  USING (
    advisor_id IN (
      SELECT id FROM advisor_profiles WHERE id = auth.uid()
    )
  );
CREATE POLICY "Advisors can manage own enrollments"
  ON advisor_lms_enrollments FOR ALL
  USING (
    advisor_id IN (
      SELECT id FROM advisor_profiles WHERE id = auth.uid()
    )
  );
CREATE POLICY "Admins can view all enrollments"
  ON advisor_lms_enrollments FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM auth.users u
      WHERE u.id = auth.uid()
      AND u.raw_user_meta_data->>'role' IN ('admin', 'super_admin')
    )
  );
-- RLS Policies for advisor_lesson_completions
CREATE POLICY "Advisors can view own lesson completions"
  ON advisor_lesson_completions FOR SELECT
  USING (
    advisor_id IN (
      SELECT id FROM advisor_profiles WHERE id = auth.uid()
    )
  );
CREATE POLICY "Advisors can manage own lesson completions"
  ON advisor_lesson_completions FOR ALL
  USING (
    advisor_id IN (
      SELECT id FROM advisor_profiles WHERE id = auth.uid()
    )
  );
-- RLS Policies for advisor_external_training_progress
CREATE POLICY "Advisors can view own external progress"
  ON advisor_external_training_progress FOR SELECT
  USING (
    advisor_id IN (
      SELECT id FROM advisor_profiles WHERE id = auth.uid()
    )
  );
CREATE POLICY "Advisors can manage own external progress"
  ON advisor_external_training_progress FOR ALL
  USING (
    advisor_id IN (
      SELECT id FROM advisor_profiles WHERE id = auth.uid()
    )
  );
-- Create indexes
CREATE INDEX IF NOT EXISTS idx_external_progress_advisor ON advisor_external_training_progress(advisor_id);
CREATE INDEX IF NOT EXISTS idx_external_progress_module ON advisor_external_training_progress(module_id);
CREATE INDEX IF NOT EXISTS idx_lms_courses_provider ON external_lms_courses(lms_provider);
CREATE INDEX IF NOT EXISTS idx_lms_lessons_course ON external_lms_lessons(course_id);
CREATE INDEX IF NOT EXISTS idx_enrollments_advisor ON advisor_lms_enrollments(advisor_id);
CREATE INDEX IF NOT EXISTS idx_enrollments_course ON advisor_lms_enrollments(course_id);
CREATE INDEX IF NOT EXISTS idx_lesson_completions_advisor ON advisor_lesson_completions(advisor_id);
CREATE INDEX IF NOT EXISTS idx_lesson_completions_enrollment ON advisor_lesson_completions(enrollment_id);
-- ============================================================================
-- Seed MPB Training Course Data
-- ============================================================================

-- Insert the main Healthcare Advisor course
INSERT INTO external_lms_courses (
  lms_provider,
  external_id,
  title,
  description,
  category,
  course_url,
  is_required,
  order_index,
  estimated_hours,
  is_active
) VALUES (
  'tutor_lms',
  '15',
  'Become an MPB Healthcare Advisor',
  'This comprehensive training course equips you with the knowledge and skills needed to become a trusted MPB Healthcare Advisor. Learn about our programs, services, and how to help clients find the right healthcare solutions.',
  'Healthcare Advisors',
  'https://training.mpb.health/courses/become-an-mpb-healthcare-advisor/',
  true,
  1,
  4,
  true
), (
  'tutor_lms',
  '253',
  'SaudeMax',
  'Complete training on the SaudeMax membership program. Learn about member benefits, healthcare services, coverage limitations, and support resources for customer-facing roles.',
  'Employees',
  'https://training.mpb.health/courses/saudemax/',
  false,
  2,
  3,
  true
), (
  'tutor_lms',
  '348',
  'SaudeMax – Agências',
  'Treinamento em português para funcionários da MPB entenderem as assinaturas SaudeMax de forma abrangente.',
  'SaudeMax',
  'https://training.mpb.health/courses/saudemax-plano-agencias/',
  false,
  3,
  2,
  true
) ON CONFLICT (lms_provider, external_id) DO UPDATE SET
  title = EXCLUDED.title,
  description = EXCLUDED.description,
  course_url = EXCLUDED.course_url,
  updated_at = NOW();
-- Insert lessons for "Become an MPB Healthcare Advisor" course
WITH course AS (
  SELECT id FROM external_lms_courses WHERE external_id = '15' AND lms_provider = 'tutor_lms'
)
INSERT INTO external_lms_lessons (course_id, external_id, title, lesson_url, order_index, duration_minutes, has_video, is_required)
SELECT
  course.id,
  lesson.external_id,
  lesson.title,
  lesson.lesson_url,
  lesson.order_index,
  lesson.duration_minutes,
  lesson.has_video,
  lesson.is_required
FROM course, (VALUES
  -- Section 1: Company Foundation
  ('about-us', 'About Us', 'https://training.mpb.health/courses/become-an-mpb-healthcare-advisor/lessons/about-us/', 1, 10, true, true),
  ('mission', 'Mission', 'https://training.mpb.health/courses/become-an-mpb-healthcare-advisor/lessons/mission/', 2, 5, true, true),
  ('vision-values', 'Vision & Values', 'https://training.mpb.health/courses/become-an-mpb-healthcare-advisor/lessons/vision-values/', 3, 5, true, true),

  -- Section 2: Advisor Role
  ('benefits', 'Benefits of Being a Healthcare Advisor', 'https://training.mpb.health/courses/become-an-mpb-healthcare-advisor/lessons/benefits-of-being-a-healthcare-advisor/', 4, 10, true, true),
  ('expectations', 'What is Expected', 'https://training.mpb.health/courses/become-an-mpb-healthcare-advisor/lessons/what-is-expected/', 5, 10, true, true),
  ('plan-selection', 'How to Choose the Right Plan for Your Clients', 'https://training.mpb.health/courses/become-an-mpb-healthcare-advisor/lessons/how-to-choose-the-right-plan-for-your-clients/', 6, 15, true, true),

  -- Section 3: Sales & Communication
  ('sales-tips', 'Sales Tips (Video)', 'https://training.mpb.health/courses/become-an-mpb-healthcare-advisor/lessons/watch-video-sales-tips/', 7, 20, true, true),

  -- Section 4: Products & Services
  ('medical-cost-sharing', 'Medical Cost Sharing', 'https://training.mpb.health/courses/become-an-mpb-healthcare-advisor/lessons/medical-cost-sharing/', 8, 15, true, true),
  ('virtual-health', 'Virtual Health', 'https://training.mpb.health/courses/become-an-mpb-healthcare-advisor/lessons/virtual-health/', 9, 10, true, true),
  ('mpb-concierge', 'MPB Concierge', 'https://training.mpb.health/courses/become-an-mpb-healthcare-advisor/lessons/mpb-concierge/', 10, 10, true, true),
  ('supplements', 'Discounted Supplements & Wellness Products', 'https://training.mpb.health/courses/become-an-mpb-healthcare-advisor/lessons/discounted-supplements-wellness-products/', 11, 10, false, false),
  ('qr-lifecode', 'QR LifeCode Personal Medical Records Vault', 'https://training.mpb.health/courses/become-an-mpb-healthcare-advisor/lessons/qr-lifecode-personal-medical-records-vault/', 12, 10, true, false),
  ('mec', 'Minimum Essential Coverage (MEC)', 'https://training.mpb.health/courses/become-an-mpb-healthcare-advisor/lessons/minimum-essential-coverage-mec/', 13, 15, true, true),
  ('debt-dismissal', 'Debt Dismissal Program', 'https://training.mpb.health/courses/become-an-mpb-healthcare-advisor/lessons/debt-dismissal-program/', 14, 10, true, false),
  ('memberships-comparison', 'Memberships Comparison Chart', 'https://training.mpb.health/courses/become-an-mpb-healthcare-advisor/lessons/memberships-comparison-chart/', 15, 10, false, true),

  -- Section 5: Compliance & Certifications
  ('do-not-sell', 'Do Not Sell States', 'https://training.mpb.health/courses/become-an-mpb-healthcare-advisor/lessons/do-not-sell-states/', 16, 5, false, true),
  ('important-message', 'Important Message', 'https://training.mpb.health/courses/become-an-mpb-healthcare-advisor/lessons/important-message/', 17, 5, true, true),
  ('sedera-cert', 'Sedera Certification', 'https://training.mpb.health/courses/become-an-mpb-healthcare-advisor/lessons/sedera-certification/', 18, 30, true, true),
  ('zion-training', 'Zion HealthShare Affiliate Training', 'https://training.mpb.health/courses/become-an-mpb-healthcare-advisor/lessons/zion-healthshare-affiliate-training-course/', 19, 30, true, true),

  -- Section 6: Tools & Resources
  ('resources', 'Useful Resources', 'https://training.mpb.health/courses/become-an-mpb-healthcare-advisor/lessons/useful-resources/', 20, 10, false, false),
  ('networking', 'Best Platforms/Apps for Networking', 'https://training.mpb.health/courses/become-an-mpb-healthcare-advisor/lessons/best-platforms-apps-for-networking/', 21, 10, false, false),
  ('business-tools', 'Business Tools & Tips', 'https://training.mpb.health/courses/become-an-mpb-healthcare-advisor/lessons/business-tools-tips/', 22, 10, false, false),
  ('landing-page-request', 'Landing Page Request Form', 'https://training.mpb.health/courses/become-an-mpb-healthcare-advisor/lessons/landing-page-request-form/', 23, 5, false, false),
  ('landing-page-mastery', 'Mastering Your Advisor Landing Page', 'https://training.mpb.health/courses/become-an-mpb-healthcare-advisor/lessons/mastering-your-advisor-landing-page/', 24, 15, true, false),

  -- Section 7: Required Documentation
  ('advisor-agreement', 'Healthcare Advisor Agreement', 'https://training.mpb.health/courses/become-an-mpb-healthcare-advisor/lessons/healthcare-advisor-agreement/', 25, 10, false, true),
  ('eo-agreement', 'E&O Commission Agreement', 'https://training.mpb.health/courses/become-an-mpb-healthcare-advisor/lessons/eo-commission-agreement/', 26, 10, false, true),
  ('required-forms', 'Complete Your Required Forms', 'https://training.mpb.health/courses/become-an-mpb-healthcare-advisor/lessons/complete-your-required-forms/', 27, 15, false, true)
) AS lesson(external_id, title, lesson_url, order_index, duration_minutes, has_video, is_required)
ON CONFLICT DO NOTHING;
-- Update total lessons count for the Healthcare Advisor course
UPDATE external_lms_courses
SET updated_at = NOW()
WHERE external_id = '15' AND lms_provider = 'tutor_lms';
-- Function to calculate enrollment progress
CREATE OR REPLACE FUNCTION calculate_enrollment_progress()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE advisor_lms_enrollments
  SET
    lessons_completed = (
      SELECT COUNT(*)
      FROM advisor_lesson_completions
      WHERE enrollment_id = NEW.enrollment_id AND status = 'completed'
    ),
    progress_percent = (
      SELECT COALESCE(
        ROUND(
          (COUNT(*) FILTER (WHERE status = 'completed')::NUMERIC /
           NULLIF(COUNT(*), 0)) * 100
        ), 0
      )
      FROM advisor_lesson_completions
      WHERE enrollment_id = NEW.enrollment_id
    ),
    status = CASE
      WHEN (
        SELECT COUNT(*) FILTER (WHERE status = 'completed') = COUNT(*)
        FROM advisor_lesson_completions
        WHERE enrollment_id = NEW.enrollment_id
      ) THEN 'completed'
      WHEN (
        SELECT COUNT(*) FILTER (WHERE status IN ('in_progress', 'completed')) > 0
        FROM advisor_lesson_completions
        WHERE enrollment_id = NEW.enrollment_id
      ) THEN 'in_progress'
      ELSE 'enrolled'
    END,
    completed_at = CASE
      WHEN (
        SELECT COUNT(*) FILTER (WHERE status = 'completed') = COUNT(*)
        FROM advisor_lesson_completions
        WHERE enrollment_id = NEW.enrollment_id
      ) THEN NOW()
      ELSE NULL
    END,
    updated_at = NOW()
  WHERE id = NEW.enrollment_id;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
-- Trigger to update enrollment progress on lesson completion
DROP TRIGGER IF EXISTS update_enrollment_progress ON advisor_lesson_completions;
CREATE TRIGGER update_enrollment_progress
  AFTER INSERT OR UPDATE ON advisor_lesson_completions
  FOR EACH ROW
  EXECUTE FUNCTION calculate_enrollment_progress();
-- Function to auto-enroll advisor and create lesson completion records
CREATE OR REPLACE FUNCTION enroll_advisor_in_course(
  p_advisor_id UUID,
  p_course_id UUID
)
RETURNS UUID AS $$
DECLARE
  v_enrollment_id UUID;
  v_total_lessons INTEGER;
BEGIN
  -- Create enrollment if not exists
  INSERT INTO advisor_lms_enrollments (advisor_id, course_id, status)
  VALUES (p_advisor_id, p_course_id, 'enrolled')
  ON CONFLICT (advisor_id, course_id) DO UPDATE SET updated_at = NOW()
  RETURNING id INTO v_enrollment_id;

  -- Get total lessons
  SELECT COUNT(*) INTO v_total_lessons
  FROM external_lms_lessons WHERE course_id = p_course_id;

  -- Update total lessons
  UPDATE advisor_lms_enrollments
  SET total_lessons = v_total_lessons
  WHERE id = v_enrollment_id;

  -- Create lesson completion records for all lessons
  INSERT INTO advisor_lesson_completions (advisor_id, enrollment_id, lesson_id, status)
  SELECT p_advisor_id, v_enrollment_id, l.id, 'not_started'
  FROM external_lms_lessons l
  WHERE l.course_id = p_course_id
  ON CONFLICT (advisor_id, lesson_id) DO NOTHING;

  RETURN v_enrollment_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
-- Grant execute permission
GRANT EXECUTE ON FUNCTION enroll_advisor_in_course(UUID, UUID) TO authenticated;
