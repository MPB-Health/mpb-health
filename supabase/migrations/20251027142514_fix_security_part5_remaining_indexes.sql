/*
  # Fix Database Security Issues - Part 5: Add Remaining Foreign Key Indexes

  ## Add Missing Foreign Key Indexes
    - Add index on `lead_submissions.assigned_to`
    - Add index on `maternity_coverage_stages.maternity_coverage_id`
    - Add index on `solution_benefits.solution_id`
    - Add index on `solution_features.solution_id`
    - Add index on `solution_testimonials.solution_id`

  ## Security & Performance
    - Improves query performance for foreign key lookups
    - Essential for JOIN operations and referential integrity checks
*/

-- ============================================================================
-- ADD MISSING FOREIGN KEY INDEXES
-- ============================================================================

CREATE INDEX IF NOT EXISTS idx_lead_submissions_assigned_to 
  ON lead_submissions(assigned_to);

CREATE INDEX IF NOT EXISTS idx_maternity_coverage_stages_maternity_coverage_id 
  ON maternity_coverage_stages(maternity_coverage_id);

CREATE INDEX IF NOT EXISTS idx_solution_benefits_solution_id 
  ON solution_benefits(solution_id);

CREATE INDEX IF NOT EXISTS idx_solution_features_solution_id 
  ON solution_features(solution_id);

CREATE INDEX IF NOT EXISTS idx_solution_testimonials_solution_id 
  ON solution_testimonials(solution_id);
