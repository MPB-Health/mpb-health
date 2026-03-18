/*
  # Resource Library System

  ## Overview
  This migration creates a comprehensive resource library system for MPB Health,
  supporting guides, webinars, compliance documents, forms, and educational materials
  with advanced search, filtering, and categorization capabilities.

  ## New Tables

  ### `resource_topics`
  - `id` (uuid, primary key)
  - `name` (text) - Topic display name
  - `slug` (text, unique) - URL-friendly identifier
  - `description` (text) - Topic description
  - `icon` (text) - Lucide icon name for UI display
  - `created_at` (timestamptz) - Record creation timestamp

  ### `resource_library`
  - `id` (uuid, primary key)
  - `title` (text) - Resource title
  - `slug` (text, unique) - URL-friendly identifier
  - `description` (text) - Short description/excerpt
  - `content` (text) - Full resource content (rich text)
  - `resource_type` (text) - Type: Guide, Webinar, Checklist, Marketing, Form, Document
  - `target_audience` (text) - Audience: Members, Employers, Advisors, All
  - `topics` (text[]) - Array of topic tags for categorization
  - `featured_image_url` (text) - Hero/thumbnail image URL
  - `file_url` (text, nullable) - Downloadable file URL
  - `is_featured` (boolean) - Featured resource flag
  - `published_date` (timestamptz) - Publication date
  - `view_count` (integer) - View tracking counter
  - `download_count` (integer) - Download tracking counter
  - `metadata` (jsonb) - Flexible additional data storage
  - `is_published` (boolean) - Publication status
  - `created_at` (timestamptz) - Record creation timestamp
  - `updated_at` (timestamptz) - Last update timestamp

  ## Security
  - Enable Row Level Security on all tables
  - Public read access for published resources
  - Authenticated admin write access

  ## Indexes
  - Full-text search index on title and description
  - Indexes on frequently queried fields for optimal performance
*/

-- Create resource_topics table
CREATE TABLE IF NOT EXISTS resource_topics (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  slug text UNIQUE NOT NULL,
  description text DEFAULT '',
  icon text DEFAULT 'Tag',
  created_at timestamptz DEFAULT now()
);

-- Create resource_library table
CREATE TABLE IF NOT EXISTS resource_library (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  slug text UNIQUE NOT NULL,
  description text NOT NULL,
  content text DEFAULT '',
  resource_type text NOT NULL CHECK (resource_type IN ('Guide', 'Webinar', 'Checklist', 'Marketing', 'Form', 'Document')),
  target_audience text NOT NULL CHECK (target_audience IN ('Members', 'Employers', 'Advisors', 'All')),
  topics text[] DEFAULT '{}',
  featured_image_url text DEFAULT '',
  file_url text,
  is_featured boolean DEFAULT false,
  published_date timestamptz DEFAULT now(),
  view_count integer DEFAULT 0,
  download_count integer DEFAULT 0,
  metadata jsonb DEFAULT '{}',
  is_published boolean DEFAULT false,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE resource_topics ENABLE ROW LEVEL SECURITY;
ALTER TABLE resource_library ENABLE ROW LEVEL SECURITY;

-- RLS Policies for resource_topics
CREATE POLICY "Anyone can view published topics"
  ON resource_topics
  FOR SELECT
  USING (true);

CREATE POLICY "Authenticated users can insert topics"
  ON resource_topics
  FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Authenticated users can update topics"
  ON resource_topics
  FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Authenticated users can delete topics"
  ON resource_topics
  FOR DELETE
  TO authenticated
  USING (true);

-- RLS Policies for resource_library
CREATE POLICY "Anyone can view published resources"
  ON resource_library
  FOR SELECT
  USING (is_published = true OR auth.uid() IS NOT NULL);

CREATE POLICY "Authenticated users can insert resources"
  ON resource_library
  FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Authenticated users can update resources"
  ON resource_library
  FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Authenticated users can delete resources"
  ON resource_library
  FOR DELETE
  TO authenticated
  USING (true);

-- Create indexes for optimized queries
CREATE INDEX IF NOT EXISTS idx_resource_library_type ON resource_library(resource_type);
CREATE INDEX IF NOT EXISTS idx_resource_library_audience ON resource_library(target_audience);
CREATE INDEX IF NOT EXISTS idx_resource_library_featured ON resource_library(is_featured);
CREATE INDEX IF NOT EXISTS idx_resource_library_published_date ON resource_library(published_date DESC);
CREATE INDEX IF NOT EXISTS idx_resource_library_published ON resource_library(is_published);
CREATE INDEX IF NOT EXISTS idx_resource_library_topics ON resource_library USING GIN(topics);

-- Create full-text search index
CREATE INDEX IF NOT EXISTS idx_resource_library_search 
  ON resource_library 
  USING GIN(to_tsvector('english', title || ' ' || description));

-- Insert default topics
INSERT INTO resource_topics (name, slug, description, icon) VALUES
  ('Compliance', 'compliance', 'Regulatory and compliance information', 'Shield'),
  ('Enrollment', 'enrollment', 'Enrollment and onboarding resources', 'UserPlus'),
  ('Benefits', 'benefits', 'Member benefits and coverage details', 'Heart'),
  ('Education', 'education', 'Educational materials and training', 'GraduationCap'),
  ('Healthcare Sharing', 'healthcare-sharing', 'Health sharing program information', 'Users'),
  ('Administration', 'administration', 'Administrative tools and processes', 'Settings'),
  ('Marketing', 'marketing', 'Marketing and communication materials', 'Megaphone'),
  ('Analytics', 'analytics', 'Reporting and analytics resources', 'BarChart')
ON CONFLICT (slug) DO NOTHING;

-- Insert sample resources
INSERT INTO resource_library (
  title, 
  slug, 
  description, 
  content,
  resource_type, 
  target_audience, 
  topics,
  featured_image_url,
  is_featured,
  is_published,
  published_date
) VALUES
(
  '2025 Compliance Guide for Health Sharing Programs',
  '2025-compliance-guide',
  'Comprehensive overview of federal and state regulations affecting health sharing organizations and employer groups.',
  '<h2>Overview</h2><p>This comprehensive guide covers all federal and state regulations affecting health sharing organizations and employer groups in 2025.</p><h3>Key Topics</h3><ul><li>Federal compliance requirements</li><li>State-specific regulations</li><li>Reporting obligations</li><li>Best practices for compliance management</li></ul>',
  'Guide',
  'Employers',
  ARRAY['Compliance', 'Administration'],
  '/assets/healthcare-images-for-healthcare-blog-website-1080x675.png',
  true,
  true,
  '2025-01-14'
),
(
  'Enrollment Best Practices for Open Enrollment',
  'enrollment-best-practices',
  'Recorded webinar covering communication strategies, timeline planning, and member education tactics.',
  '<h2>Webinar Overview</h2><p>Learn proven strategies for successful open enrollment periods.</p><h3>What You Will Learn</h3><ul><li>Communication timeline planning</li><li>Member education strategies</li><li>Technology tools for enrollment</li><li>Common pitfalls to avoid</li></ul>',
  'Webinar',
  'Advisors',
  ARRAY['Enrollment', 'Education'],
  '/assets/businessTeamWorking.jpg',
  true,
  true,
  '2024-11-09'
),
(
  'Understanding IUA: A Member''s Guide',
  'understanding-iua-guide',
  'Plain-language explanation of Initial Unshareable Amount, how it works, and budgeting tips.',
  '<h2>What is IUA?</h2><p>The Initial Unshareable Amount (IUA) is an important concept in health sharing.</p><h3>Key Points</h3><ul><li>How IUA works</li><li>Budgeting for your IUA</li><li>When IUA applies</li><li>Planning ahead</li></ul>',
  'Guide',
  'Members',
  ARRAY['Healthcare Sharing', 'Education'],
  '/assets/healthsharing2.jpg',
  true,
  true,
  '2024-10-19'
),
(
  'Managing ADA and Medical Leave Requests',
  'managing-ada-leave-requests',
  'Comprehensive guide for employers on handling ADA compliance and medical leave requests within health sharing programs.',
  '<h2>ADA Compliance</h2><p>Understanding your obligations under the Americans with Disabilities Act.</p>',
  'Guide',
  'Employers',
  ARRAY['Compliance', 'Administration'],
  '/assets/healthcare-images-for-healthcare-blog-website2-980x653.png',
  false,
  true,
  '2024-09-04'
),
(
  'New Hire Enrollment Checklist',
  'new-hire-enrollment-checklist',
  'Step-by-step checklist for enrolling new employees in health sharing programs.',
  '<h2>Enrollment Steps</h2><p>Follow this checklist to ensure smooth new hire enrollment.</p>',
  'Checklist',
  'Employers',
  ARRAY['Enrollment', 'Administration'],
  '/assets/businessTeamWorking.jpg',
  false,
  true,
  '2024-08-14'
),
(
  'Telehealth Access Guide',
  'telehealth-access-guide',
  'How to access and maximize your telehealth benefits as an MPB Health member.',
  '<h2>Telehealth Benefits</h2><p>Learn how to access quality healthcare from home.</p>',
  'Guide',
  'Members',
  ARRAY['Benefits', 'Healthcare Sharing'],
  '/assets/healthsharing3.jpg',
  false,
  true,
  '2024-07-29'
),
(
  'MPB Health Advisor Pitch Deck',
  'advisor-pitch-deck',
  'Professional presentation materials for advisors to share MPB Health solutions with prospects.',
  '<h2>Presentation Materials</h2><p>Ready-to-use pitch deck for client presentations.</p>',
  'Marketing',
  'Advisors',
  ARRAY['Marketing', 'Education'],
  '/assets/aboutus1.jpg',
  false,
  true,
  '2024-06-30'
),
(
  'Prescription Discount Card Overview',
  'prescription-discount-card',
  'Information about MPB Health''s prescription discount card program and how to save on medications.',
  '<h2>Prescription Savings</h2><p>Save on prescription medications with our discount card program.</p>',
  'Guide',
  'Members',
  ARRAY['Benefits', 'Healthcare Sharing'],
  '/assets/close-up-paper-currencies-with-stethoscope-980x654.jpg',
  false,
  true,
  '2024-06-14'
),
(
  'Group Reporting & Analytics Webinar',
  'group-reporting-analytics-webinar',
  'Recorded webinar on utilizing MPB Health''s reporting tools and understanding group analytics.',
  '<h2>Analytics Training</h2><p>Master the reporting tools available to employer groups.</p>',
  'Webinar',
  'Employers',
  ARRAY['Analytics', 'Administration'],
  '/assets/medicalsymposium.jpg',
  false,
  true,
  '2024-05-19'
)
ON CONFLICT (slug) DO NOTHING;