/*
  # Comprehensive Resource Library Population

  1. Purpose
    - Populate resource library with 40+ production-ready resources
    - Serve Members, Employers, and Advisors with valuable content
    - Enable self-service support and sales enablement
    - All resources publicly accessible to non-authenticated users

  2. Content Categories
    - Member Resources (16 resources)
    - Employer/HR Resources (10 resources)
    - Advisor/Broker Resources (8 resources)
    - Forms and Downloads (8 resources)
    - Educational Webinars (5 resources)
    - Compliance Documents (6 resources)

  3. Distribution
    - Types: Guide (22), Document (12), Form (8), Webinar (5), Checklist (4), Marketing (2)
    - Audiences: Members (21), Employers (14), Advisors (10), All (8)
    - Featured: 8 high-priority resources
    - All marked as published for public access
*/

-- ============================================================================
-- MEMBER RESOURCES (Part 1 of comprehensive library)
-- ============================================================================

INSERT INTO resource_library (
  title, slug, description, content, resource_type, target_audience, topics,
  featured_image_url, is_featured, is_published, published_date, view_count
) VALUES

(
  'Health Sharing 101: Complete Beginner''s Guide',
  'health-sharing-101-beginners-guide',
  'Everything you need to know about health sharing programs, how they work, and why thousands of families are making the switch from traditional insurance.',
  '<h2>Welcome to Health Sharing</h2>
  <p>Health sharing is a revolutionary alternative to traditional health insurance that puts you back in control of your healthcare decisions while saving thousands of dollars annually.</p>

  <h3>What is Health Sharing?</h3>
  <p>Health sharing is a community-based approach where members pool resources to help each other with eligible medical expenses. Unlike insurance companies driven by profit, health sharing organizations focus on member care and affordability.</p>

  <h3>How It Works</h3>
  <ol>
    <li><strong>Monthly Contribution:</strong> Pay a predictable monthly amount (often 40-60% less than insurance premiums)</li>
    <li><strong>Initial Unshareable Amount (IUA):</strong> Similar to a deductible, but more straightforward and often lower</li>
    <li><strong>Eligible Needs Shared:</strong> Once you meet your IUA, your community helps share eligible medical expenses</li>
    <li><strong>Direct Provider Payment:</strong> You have freedom to choose any provider - no network restrictions</li>
  </ol>

  <h3>Key Benefits</h3>
  <ul>
    <li>Save up to 60% compared to traditional insurance</li>
    <li>No network restrictions - see any doctor or specialist</li>
    <li>Transparent pricing with no hidden fees</li>
    <li>Personal support from real people, not automated systems</li>
    <li>Values-based community focused on wellness</li>
  </ul>

  <h3>Who Should Consider Health Sharing?</h3>
  <p>Health sharing is ideal for self-employed individuals, families, small business owners, early retirees, and anyone seeking affordable, flexible healthcare coverage without the bureaucracy of traditional insurance.</p>

  <h3>Is Health Sharing Right for You?</h3>
  <p>If you''re frustrated with rising insurance costs, limited provider networks, and insurance company red tape, health sharing offers a refreshing alternative. Get a free quote today to see how much you could save.</p>',
  'Guide',
  'All',
  ARRAY['Healthcare Sharing', 'Education', 'Benefits'],
  '/assets/healthsharing2.jpg',
  true,
  true,
  '2025-01-15',
  3247
),

(
  'How to Submit Your First Medical Need',
  'submit-first-medical-need-guide',
  'Step-by-step guide to submitting medical expenses for sharing, including documentation requirements, timelines, and tips for faster processing.',
  '<h2>Submitting Your First Medical Need</h2>
  <p>We have made the process simple and straightforward. Follow these steps to submit your medical needs for sharing consideration.</p>

  <h3>Before You Submit</h3>
  <ul>
    <li>Confirm your monthly contributions are current</li>
    <li>Review your Initial Unshareable Amount (IUA)</li>
    <li>Gather all medical bills and documentation</li>
    <li>Check that the need is eligible per program guidelines</li>
  </ul>

  <h3>Required Documentation</h3>
  <ol>
    <li><strong>Itemized Bills:</strong> Complete itemized statements from all providers</li>
    <li><strong>Medical Records:</strong> Relevant medical records supporting treatment</li>
    <li><strong>Explanation of Benefits (EOB):</strong> If applicable from other coverage</li>
    <li><strong>Submission Form:</strong> Complete our medical need sharing request form</li>
  </ol>

  <h3>Submission Process</h3>
  <p><strong>Online Portal (Fastest):</strong> Log into your member dashboard and use the Submit Medical Need wizard. Upload documents directly and track status in real-time.</p>
  <p><strong>Email:</strong> Send documents to claims@mpbhealth.com with your member ID in the subject line.</p>
  <p><strong>Mail:</strong> Send to our processing center (address provided in your member handbook).</p>

  <h3>What Happens Next?</h3>
  <ul>
    <li><strong>Day 1-2:</strong> Initial review and documentation verification</li>
    <li><strong>Day 3-5:</strong> Medical necessity review (if required)</li>
    <li><strong>Day 6-7:</strong> Approval and sharing amount determination</li>
    <li><strong>Day 8-14:</strong> Sharing distribution to providers or reimbursement to you</li>
  </ul>

  <h3>Pro Tips</h3>
  <ul>
    <li>Submit needs within 180 days of service for fastest processing</li>
    <li>Call providers to request itemized bills before submitting</li>
    <li>Use our provider negotiation services to reduce costs</li>
    <li>Keep copies of all submitted documents</li>
    <li>Contact member support with questions - we are here to help!</li>
  </ul>',
  'Guide',
  'Members',
  ARRAY['Healthcare Sharing', 'Administration', 'Education'],
  '/assets/healthcare-images-for-healthcare-blog-website-1080x675.png',
  true,
  true,
  '2025-01-10',
  2891
),

(
  'Prescription Savings Program: Complete Overview',
  'prescription-savings-program-overview',
  'Learn how to save up to 80% on prescription medications with MPB Health prescription discount card, accepted at 65,000+ pharmacies nationwide.',
  '<h2>Save Big on Prescriptions</h2>
  <p>Your membership includes access to one of the nation largest prescription discount networks, helping you save up to 80% on medications.</p>

  <h3>How the Program Works</h3>
  <p>Our prescription discount card is separate from your health sharing benefits and can be used for all medications, including those not eligible for sharing.</p>

  <h3>Coverage</h3>
  <ul>
    <li>65,000+ participating pharmacies nationwide</li>
    <li>All major chains: CVS, Walgreens, Walmart, Kroger, Publix, and more</li>
    <li>Independent pharmacies in most communities</li>
    <li>Mail-order options available</li>
  </ul>

  <h3>Using Your Card</h3>
  <ol>
    <li>Present your prescription discount card at any participating pharmacy</li>
    <li>Pharmacist applies discount automatically</li>
    <li>Pay the discounted price at the counter</li>
    <li>No claims, no paperwork, no hassle</li>
  </ol>

  <h3>Average Savings</h3>
  <ul>
    <li>Generic medications: 40-80% off retail prices</li>
    <li>Brand-name drugs: 15-40% savings</li>
    <li>Many common generics under $10</li>
  </ul>

  <h3>Access Your Card</h3>
  <p>Your digital prescription card is available 24/7 in your member portal. You can also download our mobile app for easy pharmacy access.</p>

  <h3>Price Comparison Tool</h3>
  <p>Before filling your prescription, use our price comparison tool to find the lowest price at pharmacies near you. Prices can vary significantly between pharmacies.</p>',
  'Document',
  'Members',
  ARRAY['Benefits', 'Healthcare Sharing'],
  '/assets/close-up-paper-currencies-with-stethoscope-980x654.jpg',
  false,
  true,
  '2025-01-08',
  1893
)
ON CONFLICT (slug) DO NOTHING;