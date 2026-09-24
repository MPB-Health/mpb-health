-- Add five advisor bulletins (April 29 2026 through July 2026) sourced from
-- the Mailchimp advisor bulletin campaigns. Idempotent: re-running updates the
-- existing row by slug, and each insert is skipped if the same bulletin was
-- already created under a different slug (e.g. via the admin CMS).

-- ============================================================================
-- Bulletin 1 of 5: July 2026
-- ============================================================================
INSERT INTO advisor_content (title, slug, excerpt, content, content_type, category_id, published_date, is_published, is_featured, view_count, metadata, org_id)
SELECT
  'Advisor Bulletin: July 2026',
  'advisor-bulletin-july-2026',
  'July 2026 — RX Valet guidelines, chronic condition sharing (Zion & Sedera), need submission deadlines, HSA compatibility, Kansas health sharing tax deduction, and the Sedera peer review process.',
  '
<h1 style="font-size: 32px; font-weight: 700; color: #000000; margin: 0 0 8px 0; line-height: 1.3;">July 2026</h1>

<p style="font-size: 16px; line-height: 1.7; color: #334155; margin: 0 0 24px 0;">Advisor Bulletin — Stay informed with the latest updates and advisor resources.</p>

<h3 style="text-align: center; font-size: 22px; font-weight: 700; color: #000000; margin: 40px 0 24px 0; padding-bottom: 12px; border-bottom: 2px solid #e2e8f0;">Updates</h3>

<h2 style="font-size: 24px; font-weight: 700; color: #000000; margin: 32px 0 16px 0; line-height: 1.3;">💊 RX Valet</h2>

<p style="font-size: 16px; line-height: 1.7; color: #334155; margin: 0 0 12px 0;">Please remember the following important RX Valet guidelines when assisting members:</p>

<ul style="margin: 0 0 16px 0; padding-left: 24px; list-style-type: disc;">
  <li style="font-size: 16px; line-height: 1.7; color: #334155; margin-bottom: 6px;"><strong style="color: #111827;">RX Valet discounts apply to generic prescription medications ONLY.</strong> Brand-name medications are <strong style="color: #111827;">NOT</strong> discounted and will be charged at full retail price.</li>
  <li style="font-size: 16px; line-height: 1.7; color: #334155; margin-bottom: 6px;">Retail pharmacies are limited to a 30-day supply. Members needing a 90-day prescription must use RX Valet Home Delivery.</li>
  <li style="font-size: 16px; line-height: 1.7; color: #334155; margin-bottom: 6px;"><strong style="color: #111827;">Medication prices are subject to change.</strong> The MPB Health app provides current pricing.</li>
</ul>

<h2 style="font-size: 24px; font-weight: 700; color: #000000; margin: 32px 0 16px 0; line-height: 1.3;">🩺 Chronic Conditions</h2>

<p style="font-size: 16px; line-height: 1.7; color: #334155; margin: 0 0 12px 0;"><strong style="color: #111827;">Zion (Care+, Direct &amp; Secure HSA)</strong></p>

<p style="font-size: 16px; line-height: 1.7; color: #334155; margin: 0 0 12px 0;">An eligible medical need may be considered medically stable when the condition is chronic and further treatment will not likely result in improvement. At this point, the sharing request is subject to review and may result in determination of ineligibility for future sharing.</p>

<p style="font-size: 16px; line-height: 1.7; color: #334155; margin: 0 0 12px 0;"><strong style="color: #111827;">Sedera (Premium Care &amp; Premium HSA)</strong></p>

<p style="font-size: 16px; line-height: 1.7; color: #334155; margin: 0 0 12px 0;"><strong style="color: #111827;">Sharing for New Chronic Conditions:</strong> If a member is diagnosed with a chronic condition that first presents after their membership effective date, the diagnosis and treatment are generally shareable. There are generally not limits on shareable Needs, unless it of course falls under the Pre-Existing stipulations.</p>

<p style="font-size: 16px; line-height: 1.7; color: #334155; margin: 0 0 12px 0;"><strong style="color: #111827;">The 120-Day Prescription Rule:</strong> Curative or treatment-focused prescription medications related to this new diagnosis are eligible for sharing for the first 120 days. However, the community does not share the costs of ongoing, long-term maintenance medications (such as blood pressure or cholesterol drugs) or routine checkups beyond that initial 120-day window.</p>

<p style="font-size: 16px; line-height: 1.7; color: #334155; margin: 0 0 12px 0;"><strong style="color: #111827;">Emergency Care:</strong> If an acute complication of a post-enrollment chronic condition requires emergency room or urgent care, those medical bills are shareable once the member meets their chosen Initial Unshareable Amount (IUA). In the event of any emergency care, members are strongly encouraged to notify a Sedera Member Advisor within 48 hours.</p>

<h2 style="font-size: 24px; font-weight: 700; color: #000000; margin: 32px 0 16px 0; line-height: 1.3;">⏰ Need Submission Deadline</h2>

<p style="font-size: 16px; line-height: 1.7; color: #334155; margin: 0 0 12px 0;">In order for Members'' needs to be processed, <strong style="color: #111827;">sharing requests must be submitted within 6 months from the first date of service</strong> for each consultation, treatment, test or screening completed. If the bills are not yet in their possession, Members can still initiate the sharing request and communicate with their Needs Coordinator and provider to obtain necessary paperwork.</p>

<h2 style="font-size: 24px; font-weight: 700; color: #000000; margin: 32px 0 16px 0; line-height: 1.3;">💵 HSA Compatibility</h2>

<p style="font-size: 16px; line-height: 1.7; color: #334155; margin: 0 0 12px 0;">The MPB Health HDHP is structured as HSA-compatible under IRC §223. Individual HSA eligibility depends on the member''s complete personal coverage and tax situation.</p>

<p style="margin: 0 0 16px 0;"><a href="https://drive.google.com/file/d/1vaKt8eLkzBs9pTFJhN_IbwlcmJ9CkYrj/view?usp=sharing" target="_blank" style="display: inline-block; padding: 12px 28px; background-color: #2563eb; color: #ffffff; border-radius: 8px; text-decoration: none; font-weight: 600; font-size: 16px;">Quick Reference Guide</a></p>

<h2 style="font-size: 24px; font-weight: 700; color: #000000; margin: 32px 0 16px 0; line-height: 1.3;">🎙️ HealthyCare Podcast</h2>

<p style="font-size: 16px; line-height: 1.7; color: #334155; margin: 0 0 12px 0;">Reba Larney discusses why more Americans are looking beyond health insurance and how MPB Health helps individuals, families, and businesses find cost-effective healthcare solutions.</p>

<p style="margin: 0 0 16px 0;"><a href="https://www.youtube.com/watch?v=5PF_93ejXHY&amp;t=2s" target="_blank" style="display: inline-block; padding: 12px 28px; background-color: #2563eb; color: #ffffff; border-radius: 8px; text-decoration: none; font-weight: 600; font-size: 16px;">Watch the Podcast</a></p>

<h2 style="font-size: 24px; font-weight: 700; color: #000000; margin: 32px 0 16px 0; line-height: 1.3;">📍 Kansas Health Sharing Tax Deduction</h2>

<p style="font-size: 16px; line-height: 1.7; color: #334155; margin: 0 0 12px 0;">Kansas has passed Senate Bill 368 (SB 368), the Health Care Sharing Ministries Tax Deduction Act, creating a new state tax benefit beginning with the 2027 tax year!</p>

<p style="font-size: 16px; line-height: 1.7; color: #334155; margin: 0 0 12px 0;">Eligible Kansas residents who belong to a qualifying Health Care Sharing Ministry may be able to deduct:</p>

<ul style="margin: 0 0 16px 0; padding-left: 24px; list-style-type: disc;">
  <li style="font-size: 16px; line-height: 1.7; color: #334155; margin-bottom: 6px;">Up to <strong style="color: #111827;">$5,000</strong> for individuals</li>
  <li style="font-size: 16px; line-height: 1.7; color: #334155; margin-bottom: 6px;">Up to <strong style="color: #111827;">$10,000</strong> for married couples filing jointly</li>
</ul>

<p style="font-size: 16px; line-height: 1.7; color: #334155; margin: 0 0 12px 0;">This deduction may:</p>

<ul style="margin: 0 0 16px 0; padding-left: 24px; list-style-type: disc;">
  <li style="font-size: 16px; line-height: 1.7; color: #334155; margin-bottom: 6px;">Reduce Kansas taxable income starting in 2027.</li>
  <li style="font-size: 16px; line-height: 1.7; color: #334155; margin-bottom: 6px;">Potentially lower state tax liability.</li>
  <li style="font-size: 16px; line-height: 1.7; color: #334155; margin-bottom: 6px;">Provide an additional financial incentive for participating in a qualifying Health Care Sharing Ministry.</li>
</ul>

<h2 style="font-size: 24px; font-weight: 700; color: #000000; margin: 32px 0 16px 0; line-height: 1.3;">⚖️ Sedera Peer Review Process</h2>

<p style="font-size: 16px; line-height: 1.7; color: #334155; margin: 0 0 12px 0;">If a Need is denied, Members may submit a written appeal to the Sedera Community Stewardship Board (CSB) using a Needs Appeal Form, available from their Member Advisor or Needs Coordinator.</p>

<p style="font-size: 16px; line-height: 1.7; color: #334155; margin: 0 0 12px 0;">If the Member disagrees with the CSB''s decision, they may request a Member Review Panel (MRP) within 30 days. If at least 2 of the 7 panel members determine the Need is shareable, Sedera will process the Need as shareable.</p>

<hr style="border: none; border-top: 2px solid #e2e8f0; margin: 40px 0;">

<h3 style="text-align: center; font-size: 22px; font-weight: 700; color: #000000; margin: 40px 0 24px 0; padding-bottom: 12px; border-bottom: 2px solid #e2e8f0;">Reminders</h3>

<h2 style="font-size: 24px; font-weight: 700; color: #000000; margin: 32px 0 16px 0; line-height: 1.3;">Payment Updates</h2>

<p style="font-size: 16px; line-height: 1.7; color: #334155; margin: 0 0 12px 0;">The Payment Update Form is no longer available for Members. To update payment information, Members must log in to their <strong style="color: #111827;">e123 Member Portal</strong> and make changes directly within their account. Instructions for accessing the Member Portal can be found:</p>

<ul style="margin: 0 0 16px 0; padding-left: 24px; list-style-type: disc;">
  <li style="font-size: 16px; line-height: 1.7; color: #334155; margin-bottom: 6px;">On the MPB Health website under the Members tab</li>
  <li style="font-size: 16px; line-height: 1.7; color: #334155; margin-bottom: 6px;">In the MPB Health App</li>
</ul>

<p style="font-size: 16px; line-height: 1.7; color: #334155; margin: 0 0 12px 0;">Members who need assistance updating their payment information may contact Patti in the Billing Department at <strong style="color: #111827;">(561) 922-9648</strong>.</p>

<p style="margin: 0 0 16px 0;"><a href="https://mpb.health/update-form-of-payment" target="_blank" style="display: inline-block; padding: 12px 28px; background-color: #2563eb; color: #ffffff; border-radius: 8px; text-decoration: none; font-weight: 600; font-size: 16px;">Update Payment Information</a></p>

<h2 style="font-size: 24px; font-weight: 700; color: #000000; margin: 32px 0 16px 0; line-height: 1.3;">Concierge Support</h2>

<p style="font-size: 16px; line-height: 1.7; color: #334155; margin: 0 0 12px 0;">Please direct members to the MPB Health Concierge team at <strong style="color: #111827;">800-519-2969</strong>, not to Zion or Sedera.</p>

<h2 style="font-size: 24px; font-weight: 700; color: #000000; margin: 32px 0 16px 0; line-height: 1.3;">Advisor Playbook</h2>

<p style="font-size: 16px; line-height: 1.7; color: #334155; margin: 0 0 12px 0;">Log in to the Advisor Portal using your registered advisor email and password. If you''re unable to access your account, click "Forgot Password," enter your registered advisor email, and follow the reset link sent to your inbox to create a new password. If you need assistance, please contact rebalarney@mympb.com.</p>

<p style="margin: 0 0 16px 0;"><a href="https://advisor.mpb.health/" target="_blank" style="display: inline-block; padding: 12px 28px; background-color: #2563eb; color: #ffffff; border-radius: 8px; text-decoration: none; font-weight: 600; font-size: 16px;">Visit Advisor Playbook</a></p>

<h2 style="font-size: 24px; font-weight: 700; color: #000000; margin: 32px 0 16px 0; line-height: 1.3;">Enrollment Fee Waiver</h2>

<p style="font-size: 16px; line-height: 1.7; color: #334155; margin: 0 0 12px 0;">Use code <strong style="color: #111827;">100MPOWER</strong> to waive the $100 enrollment fee.</p>
',
  'bulletin',
  (SELECT id FROM advisor_content_categories WHERE slug = 'bulletin' LIMIT 1),
  '2026-07-22T12:00:00Z',
  true,
  false,
  0,
  '{}',
  (SELECT id FROM organizations WHERE slug = 'mpb-health' LIMIT 1)
WHERE NOT EXISTS (
  -- Skip if this bulletin already exists under a different slug (e.g. admin CMS)
  SELECT 1 FROM advisor_content
  WHERE content_type = 'bulletin'
    AND slug != 'advisor-bulletin-july-2026'
    AND title ILIKE '%july%2026%'
)
ON CONFLICT (slug) DO UPDATE SET
  title = EXCLUDED.title,
  excerpt = EXCLUDED.excerpt,
  content = EXCLUDED.content,
  published_date = EXCLUDED.published_date;

-- ============================================================================
-- Bulletin 2 of 5: June 24, 2026
-- ============================================================================
INSERT INTO advisor_content (title, slug, excerpt, content, content_type, category_id, published_date, is_published, is_featured, view_count, metadata, org_id)
SELECT
  'Advisor Bulletin: June 24, 2026',
  'advisor-bulletin-june-24-2026',
  'June 24, 2026 — Payment updates now handled in the e123 Member Portal, enrollment landing page checks, Sedera peer review process for rejected needs, and RX Valet pricing information.',
  '
<h1 style="font-size: 32px; font-weight: 700; color: #000000; margin: 0 0 8px 0; line-height: 1.3;">June 24, 2026</h1>

<p style="font-size: 16px; line-height: 1.7; color: #334155; margin: 0 0 24px 0;">Advisor Bulletin</p>

<h3 style="text-align: center; font-size: 22px; font-weight: 700; color: #000000; margin: 40px 0 24px 0; padding-bottom: 12px; border-bottom: 2px solid #e2e8f0;">Updates</h3>

<h2 style="font-size: 24px; font-weight: 700; color: #000000; margin: 32px 0 16px 0; line-height: 1.3;">Payment Updates</h2>

<p style="font-size: 16px; line-height: 1.7; color: #334155; margin: 0 0 12px 0;">The Payment Update Form is no longer available for Members. To update payment information, Members must log in to their <strong style="color: #111827;">e123 Member Portal</strong> and make changes directly within their account. Instructions for accessing the Member Portal can be found:</p>

<ul style="margin: 0 0 16px 0; padding-left: 24px; list-style-type: disc;">
  <li style="font-size: 16px; line-height: 1.7; color: #334155; margin-bottom: 6px;">On the MPB Health website under the Members tab</li>
  <li style="font-size: 16px; line-height: 1.7; color: #334155; margin-bottom: 6px;">In the MPB Health App</li>
</ul>

<p style="font-size: 16px; line-height: 1.7; color: #334155; margin: 0 0 12px 0;">Members who need assistance updating their payment information may contact Patti in the Billing Department at <strong style="color: #111827;">(561) 922-9648</strong>.</p>

<p style="margin: 0 0 16px 0;"><a href="https://mpb.health/update-form-of-payment" target="_blank" style="display: inline-block; padding: 12px 28px; background-color: #2563eb; color: #ffffff; border-radius: 8px; text-decoration: none; font-weight: 600; font-size: 16px;">Update Payment Information</a></p>

<h2 style="font-size: 24px; font-weight: 700; color: #000000; margin: 32px 0 16px 0; line-height: 1.3;">Enrollment Landing Pages</h2>

<p style="font-size: 16px; line-height: 1.7; color: #334155; margin: 0 0 12px 0;">Your new enrollment pages have now been live for a few weeks. Please check your URL and confirm it is correct. Also, check your phone number and email for accuracy. If any changes are needed, please email Reba Larney at rebalarney@mympb.com and submit a ticket.</p>

<h2 style="font-size: 24px; font-weight: 700; color: #000000; margin: 32px 0 16px 0; line-height: 1.3;">Sedera (Premium Care &amp; Premium HSA): Peer Review Process for Rejected Needs</h2>

<p style="font-size: 16px; line-height: 1.7; color: #334155; margin: 0 0 12px 0;">A written request to Sedera to have the Needs Case submitted to the Sedera Community Stewardship Board (CSB) to determine if, or how much, of a Needs Case will be Shareable. The CSB reserves the right to recommend partial sharing (less than the full amount) of a Needs Case. Please contact your Member Advisor or Needs Coordinator to receive a copy of the Needs Appeal Form to make this written request.</p>

<p style="font-size: 16px; line-height: 1.7; color: #334155; margin: 0 0 12px 0;">If the Member believes that the CSB is still misinterpreting the Guidelines or the Member''s particular circumstances, then the Member has 30 days to make a written request to have the Needs Case(s) submitted to a panel of seven randomly chosen Members who have agreed to review the Need to determine whether it is shareable ("Member Review Panel" or "MRP"). If any two Members out of the seven Member MRP agree that the Needs Case(s) should be Shareable, then Sedera will treat the Needs Case(s) as Shareable in the usual fashion.</p>

<h2 style="font-size: 24px; font-weight: 700; color: #000000; margin: 32px 0 16px 0; line-height: 1.3;">RX Valet Pricing Information</h2>

<p style="font-size: 16px; line-height: 1.7; color: #334155; margin: 0 0 12px 0;">Medication prices are subject to change. Monthly price fluctuations can occur. The MPB Health app provides the most current pricing available at the time of service.</p>

<hr style="border: none; border-top: 2px solid #e2e8f0; margin: 40px 0;">

<h3 style="text-align: center; font-size: 22px; font-weight: 700; color: #000000; margin: 40px 0 24px 0; padding-bottom: 12px; border-bottom: 2px solid #e2e8f0;">Reminders</h3>

<h2 style="font-size: 24px; font-weight: 700; color: #000000; margin: 32px 0 16px 0; line-height: 1.3;">Concierge Support</h2>

<p style="font-size: 16px; line-height: 1.7; color: #334155; margin: 0 0 12px 0;">Please do not direct Members to Zion or Sedera for assistance. Member support inquiries should be directed to the MPB Health Concierge team at: <strong style="color: #111827;">800-519-2969</strong>. Our Concierge team is best equipped to assist Members with questions, guidance, and support related to their membership.</p>

<h2 style="font-size: 24px; font-weight: 700; color: #000000; margin: 32px 0 16px 0; line-height: 1.3;">Advisor Playbook</h2>

<p style="font-size: 16px; line-height: 1.7; color: #334155; margin: 0 0 12px 0;">Log in to the Advisor Portal using your registered <strong style="color: #111827;">advisor email and password</strong>. If you''re unable to access your account, click "Forgot Password," enter your registered advisor email, and follow the reset link sent to your inbox to <strong style="color: #111827;">create a new password</strong>.</p>

<p style="font-size: 16px; line-height: 1.7; color: #334155; margin: 0 0 12px 0;"><strong style="color: #111827;">Having trouble logging in?</strong> Please reach out to rebalarney@mympb.com for assistance. We''re here to help get you logged in quickly.</p>

<p style="margin: 0 0 16px 0;"><a href="https://advisor.mpb.health/" target="_blank" style="display: inline-block; padding: 12px 28px; background-color: #2563eb; color: #ffffff; border-radius: 8px; text-decoration: none; font-weight: 600; font-size: 16px;">Visit Advisor Playbook</a></p>

<h2 style="font-size: 24px; font-weight: 700; color: #000000; margin: 32px 0 16px 0; line-height: 1.3;">Enrollment Fee Waiver</h2>

<p style="font-size: 16px; line-height: 1.7; color: #334155; margin: 0 0 12px 0;">To waive the $100 enrollment fee, please use code <strong style="color: #111827;">100MPOWER</strong> during enrollment.</p>
',
  'bulletin',
  (SELECT id FROM advisor_content_categories WHERE slug = 'bulletin' LIMIT 1),
  '2026-06-24T12:00:00Z',
  true,
  false,
  0,
  '{}',
  (SELECT id FROM organizations WHERE slug = 'mpb-health' LIMIT 1)
WHERE NOT EXISTS (
  SELECT 1 FROM advisor_content
  WHERE content_type = 'bulletin'
    AND slug != 'advisor-bulletin-june-24-2026'
    AND title ILIKE '%june 24%2026%'
)
ON CONFLICT (slug) DO UPDATE SET
  title = EXCLUDED.title,
  excerpt = EXCLUDED.excerpt,
  content = EXCLUDED.content,
  published_date = EXCLUDED.published_date;

-- ============================================================================
-- Bulletin 3 of 5: May 26, 2026
-- ============================================================================
INSERT INTO advisor_content (title, slug, excerpt, content, content_type, category_id, published_date, is_published, is_featured, view_count, metadata, org_id)
SELECT
  'Advisor Bulletin: May 26, 2026',
  'advisor-bulletin-may-26-2026',
  'May 26, 2026 — New landing pages live, RX brand-name medication update, Premium Care & Premium HSA price increase effective 6/1, Massachusetts selling update, healthshare objection handling, and Las Vegas recap.',
  '
<h1 style="font-size: 32px; font-weight: 700; color: #000000; margin: 0 0 8px 0; line-height: 1.3;">May 26, 2026</h1>

<p style="font-size: 16px; line-height: 1.7; color: #334155; margin: 0 0 24px 0;">Advisor Bulletin</p>

<h3 style="text-align: center; font-size: 22px; font-weight: 700; color: #000000; margin: 40px 0 24px 0; padding-bottom: 12px; border-bottom: 2px solid #e2e8f0;">Updates</h3>

<h2 style="font-size: 24px; font-weight: 700; color: #000000; margin: 32px 0 16px 0; line-height: 1.3;">New Landing Pages — NOW LIVE</h2>

<p style="font-size: 16px; line-height: 1.7; color: #334155; margin: 0 0 12px 0;">Our brand-new advisor landing pages are officially LIVE! We highly recommend reviewing the video linked below to familiarize yourself with the updates and how to navigate the new layout.</p>

<p style="font-size: 16px; line-height: 1.7; color: #334155; margin: 0 0 12px 0;">If you have any questions or run into any issues, please <strong style="color: #111827;">submit a support ticket</strong> and our team will assist you as quickly as possible.</p>

<p style="margin: 0 0 16px 0;"><a href="https://vimeo.com/1192014572/ab2c9703ca" target="_blank" style="display: inline-block; padding: 12px 28px; background-color: #2563eb; color: #ffffff; border-radius: 8px; text-decoration: none; font-weight: 600; font-size: 16px;">Landing Page Walkthrough Video</a></p>

<h2 style="font-size: 24px; font-weight: 700; color: #000000; margin: 32px 0 16px 0; line-height: 1.3;">RX Update</h2>

<p style="font-size: 16px; line-height: 1.7; color: #334155; margin: 0 0 12px 0;">Please note that certain brand-name medications do not offer discounts through Concierge Resources or RX Valet. In traditional insurance settings, pharmaceutical manufacturers may offer discounts or free medication when a member can provide a denial letter from their insurance carrier. Since MPB Health is not traditional insurance, we are <strong style="color: #111827;">unable to provide insurance denial letters</strong> for these manufacturer programs.</p>

<p style="font-size: 16px; line-height: 1.7; color: #334155; margin: 0 0 12px 0;">We encourage advisors to communicate this clearly with members who may be seeking assistance for specialty or high-cost brand-name medications so proper expectations can be set in advance.</p>

<h2 style="font-size: 24px; font-weight: 700; color: #000000; margin: 32px 0 16px 0; line-height: 1.3;">Premium Care &amp; Premium HSA Price Increase Effective 6/1/2026</h2>

<p style="font-size: 16px; line-height: 1.7; color: #334155; margin: 0 0 12px 0;">Please note that updated Sedera pricing went into effect on May 20th, 2026.</p>

<p style="font-size: 16px; line-height: 1.7; color: #334155; margin: 0 0 12px 0;">Multiple communications regarding this increase were sent over the past few months, including <strong style="color: #111827;">4 email notifications</strong> to Members as well as several reminders to Advisors. While many of these emails were successfully delivered, a large number remained unopened by Members.</p>

<p style="font-size: 16px; line-height: 1.7; color: #334155; margin: 0 0 12px 0;">Please be aware of this increase in the event your Members reach out with questions or concerns regarding their upcoming billing changes.</p>

<h2 style="font-size: 24px; font-weight: 700; color: #000000; margin: 32px 0 16px 0; line-height: 1.3;">Concierge Support</h2>

<p style="font-size: 16px; line-height: 1.7; color: #334155; margin: 0 0 12px 0;">Please <strong style="color: #111827;">do not</strong> direct Members to Zion or Sedera for assistance. Instead, all Member support inquiries should be directed to the MPB Health Concierge team at: <strong style="color: #111827;">800-519-2969</strong>. Our Concierge team is best equipped to assist Members with questions, guidance, and support related to their membership.</p>

<h2 style="font-size: 24px; font-weight: 700; color: #000000; margin: 32px 0 16px 0; line-height: 1.3;">Selling in Massachusetts</h2>

<p style="font-size: 16px; line-height: 1.7; color: #334155; margin: 0 0 12px 0;">The following memberships are available for selling in the state of Massachusetts:</p>

<ul style="margin: 0 0 16px 0; padding-left: 24px; list-style-type: disc;">
  <li style="font-size: 16px; line-height: 1.7; color: #334155; margin-bottom: 6px;">✔ <strong style="color: #111827;">Care+</strong></li>
  <li style="font-size: 16px; line-height: 1.7; color: #334155; margin-bottom: 6px;">✔ <strong style="color: #111827;">Secure HSA</strong></li>
</ul>

<p style="font-size: 16px; line-height: 1.7; color: #334155; margin: 0 0 12px 0;"><em>Please note:</em> <strong style="color: #111827;">the state form will NOT be provided,</strong> however members should let their tax professionals know that they are part of the Zion Healthshare plan. (We are still pending an official notice from Zion.)</p>

<h2 style="font-size: 24px; font-weight: 700; color: #000000; margin: 32px 0 16px 0; line-height: 1.3;">Healthshare Objections</h2>

<p style="font-size: 16px; line-height: 1.7; color: #334155; margin: 0 0 12px 0;">When an attorney, broker, or prospective member raises the objection that "health sharing has no legal obligation to pay medical bills because participation is voluntary," it is important to address this appropriately and consistently.</p>

<p style="font-size: 16px; line-height: 1.7; color: #334155; margin: 0 0 12px 0;">For guidance on handling objections, please refer to the Objection Handling Guide for recommended talking points and best practices.</p>

<p style="margin: 0 0 16px 0;"><a href="https://mcusercontent.com/6c93f6cc2c451ffa2accc8784/files/ff1251e1-a295-5224-c435-82ef8547756a/Health_Sharing_Objection_Framework_v3.pdf" target="_blank" style="display: inline-block; padding: 12px 28px; background-color: #2563eb; color: #ffffff; border-radius: 8px; text-decoration: none; font-weight: 600; font-size: 16px;">Objection Handling Guide (PDF)</a></p>

<h2 style="font-size: 24px; font-weight: 700; color: #000000; margin: 32px 0 16px 0; line-height: 1.3;">Advisor Spotlight</h2>

<p style="font-size: 16px; line-height: 1.7; color: #334155; margin: 0 0 12px 0;">We want to recognize one of our advisors, Charles Fhroman, for his recent podcast feature and for continuing to spread awareness about Health Sharing as a viable option!</p>

<p style="margin: 0 0 16px 0;"><a href="https://www.youtube.com/watch?v=3cYYjeg-_I0" target="_blank" style="display: inline-block; padding: 12px 28px; background-color: #2563eb; color: #ffffff; border-radius: 8px; text-decoration: none; font-weight: 600; font-size: 16px;">Watch the Podcast Feature</a></p>

<h2 style="font-size: 24px; font-weight: 700; color: #000000; margin: 32px 0 16px 0; line-height: 1.3;">Las Vegas Incentive Trip + The Healthcare Disruption Summit</h2>

<p style="font-size: 16px; line-height: 1.7; color: #334155; margin: 0 0 12px 0;">MPB Health recently had an incredible time in Las Vegas celebrating our advisors at the MPB Health Incentive Trip Awards Night and attending the Healthcare Disruption Summit.</p>

<p style="font-size: 16px; line-height: 1.7; color: #334155; margin: 0 0 12px 0;">The Awards Night was a special opportunity to recognize the hard work, dedication, and success of the advisors who earned this year''s incentive trip and continue to represent the MPB Health brand so well! We''re grateful for everyone who continues to represent MPB Health with dedication and integrity.</p>

<p style="font-size: 16px; line-height: 1.7; color: #334155; margin: 0 0 12px 0;">👉 Read more about the events below:</p>

<ul style="margin: 0 0 16px 0; padding-left: 24px; list-style-type: disc;">
  <li style="font-size: 16px; line-height: 1.7; color: #334155; margin-bottom: 6px;"><a href="https://mpb.health/events/Healthcare%20Disruption%20Summit%202026%20Brings%20Industry%20Leaders%20Together%20in%20Las%20Vegas" target="_blank" style="color: #2563eb; text-decoration: underline;">Healthcare Disruption Summit</a></li>
  <li style="font-size: 16px; line-height: 1.7; color: #334155; margin-bottom: 6px;"><a href="https://mpb.health/events/mpb-health-incentive-trip-awards-night-dinner-in-las-vegas" target="_blank" style="color: #2563eb; text-decoration: underline;">Las Vegas Awards Dinner</a></li>
  <li style="font-size: 16px; line-height: 1.7; color: #334155; margin-bottom: 6px;"><a href="https://mpb.health/events/mpb-health-annual-incentive-trip-2026-las-vegas" target="_blank" style="color: #2563eb; text-decoration: underline;">Annual Incentive Trip: Las Vegas</a></li>
</ul>

<hr style="border: none; border-top: 2px solid #e2e8f0; margin: 40px 0;">

<h3 style="text-align: center; font-size: 22px; font-weight: 700; color: #000000; margin: 40px 0 24px 0; padding-bottom: 12px; border-bottom: 2px solid #e2e8f0;">Reminders</h3>

<h2 style="font-size: 24px; font-weight: 700; color: #000000; margin: 32px 0 16px 0; line-height: 1.3;">Payment Declines</h2>

<p style="font-size: 16px; line-height: 1.7; color: #334155; margin: 0 0 12px 0;">We are now able to notify members of their Share Amount Decline faster &amp; more frequently than we have in the past.</p>

<ul style="margin: 0 0 16px 0; padding-left: 24px; list-style-type: disc;">
  <li style="font-size: 16px; line-height: 1.7; color: #334155; margin-bottom: 6px;">Credit Card declines: 4 notifications via email and voicemail (advisors are copied)</li>
  <li style="font-size: 16px; line-height: 1.7; color: #334155; margin-bottom: 6px;">ACH declines: 2–3 notifications via email and voicemail</li>
</ul>

<p style="font-size: 16px; line-height: 1.7; color: #334155; margin: 0 0 12px 0;">Please try to be in contact with your members that have declined to encourage them to update their payment methods or direct us to re-run their payments prior to the <strong style="color: #111827;">deadline: the last business day of the month at 3:00 PM EST</strong>.</p>

<h2 style="font-size: 24px; font-weight: 700; color: #000000; margin: 32px 0 16px 0; line-height: 1.3;">Advisor Playbook</h2>

<p style="font-size: 16px; line-height: 1.7; color: #334155; margin: 0 0 12px 0;">Log in to the Advisor Portal using your registered <strong style="color: #111827;">advisor email and password</strong>. If you''re unable to access your account, click "Forgot Password," enter your registered advisor email, and follow the reset link sent to your inbox to <strong style="color: #111827;">create a new password</strong>.</p>

<p style="font-size: 16px; line-height: 1.7; color: #334155; margin: 0 0 12px 0;"><strong style="color: #111827;">Having trouble logging in?</strong> Please reach out to rebalarney@mympb.com for assistance. We''re here to help get you logged in quickly.</p>

<p style="margin: 0 0 16px 0;"><a href="https://advisor.mpb.health/" target="_blank" style="display: inline-block; padding: 12px 28px; background-color: #2563eb; color: #ffffff; border-radius: 8px; text-decoration: none; font-weight: 600; font-size: 16px;">Visit Advisor Playbook</a></p>

<h2 style="font-size: 24px; font-weight: 700; color: #000000; margin: 32px 0 16px 0; line-height: 1.3;">Enrollment Fee Waiver</h2>

<p style="font-size: 16px; line-height: 1.7; color: #334155; margin: 0 0 12px 0;">To waive the $100 enrollment fee, please use code <strong style="color: #111827;">100MPOWER</strong> during enrollment.</p>
',
  'bulletin',
  (SELECT id FROM advisor_content_categories WHERE slug = 'bulletin' LIMIT 1),
  '2026-05-26T12:00:00Z',
  true,
  false,
  0,
  '{}',
  (SELECT id FROM organizations WHERE slug = 'mpb-health' LIMIT 1)
WHERE NOT EXISTS (
  SELECT 1 FROM advisor_content
  WHERE content_type = 'bulletin'
    AND slug != 'advisor-bulletin-may-26-2026'
    AND title ILIKE '%may 26%2026%'
)
ON CONFLICT (slug) DO UPDATE SET
  title = EXCLUDED.title,
  excerpt = EXCLUDED.excerpt,
  content = EXCLUDED.content,
  published_date = EXCLUDED.published_date;

-- ============================================================================
-- Bulletin 4 of 5: May 13, 2026
-- ============================================================================
INSERT INTO advisor_content (title, slug, excerpt, content, content_type, category_id, published_date, is_published, is_featured, view_count, metadata, org_id)
SELECT
  'Advisor Bulletin: May 13, 2026',
  'advisor-bulletin-may-13-2026',
  'May 13, 2026 — New landing pages now live, Massachusetts selling update, behavioral health and controlled substances guidance, Sedera open enrollment (May 1–19), and Las Vegas incentive trip recap.',
  '
<h1 style="font-size: 32px; font-weight: 700; color: #000000; margin: 0 0 8px 0; line-height: 1.3;">May 13, 2026</h1>

<p style="font-size: 16px; line-height: 1.7; color: #334155; margin: 0 0 24px 0;">Advisor Bulletin</p>

<h3 style="text-align: center; font-size: 22px; font-weight: 700; color: #000000; margin: 40px 0 24px 0; padding-bottom: 12px; border-bottom: 2px solid #e2e8f0;">Updates</h3>

<h2 style="font-size: 24px; font-weight: 700; color: #000000; margin: 32px 0 16px 0; line-height: 1.3;">New Landing Pages — NOW LIVE</h2>

<p style="font-size: 16px; line-height: 1.7; color: #334155; margin: 0 0 12px 0;">Our brand-new advisor landing pages are officially LIVE! These pages are designed to improve the member enrollment experience and make it easier for you to share and guide prospects through the process.</p>

<p style="font-size: 16px; line-height: 1.7; color: #334155; margin: 0 0 12px 0;">We highly recommend reviewing the video to familiarize yourself with the updates and how to navigate the new layout. If you have any questions or run into any issues, please <strong style="color: #111827;">submit a support ticket</strong> and our team will assist you as quickly as possible.</p>

<p style="margin: 0 0 16px 0;"><a href="https://vimeo.com/1192014572/ab2c9703ca" target="_blank" style="display: inline-block; padding: 12px 28px; background-color: #2563eb; color: #ffffff; border-radius: 8px; text-decoration: none; font-weight: 600; font-size: 16px;">Landing Page Walkthrough Video</a></p>

<h2 style="font-size: 24px; font-weight: 700; color: #000000; margin: 32px 0 16px 0; line-height: 1.3;">Selling in Massachusetts</h2>

<p style="font-size: 16px; line-height: 1.7; color: #334155; margin: 0 0 12px 0;">We have an important update regarding Massachusetts (MA) eligibility. After further review and clarification, the following memberships are available for selling in the state of Massachusetts:</p>

<ul style="margin: 0 0 16px 0; padding-left: 24px; list-style-type: disc;">
  <li style="font-size: 16px; line-height: 1.7; color: #334155; margin-bottom: 6px;">✔ <strong style="color: #111827;">Care+</strong></li>
  <li style="font-size: 16px; line-height: 1.7; color: #334155; margin-bottom: 6px;">✔ <strong style="color: #111827;">Secure HSA</strong></li>
</ul>

<p style="font-size: 16px; line-height: 1.7; color: #334155; margin: 0 0 12px 0;">*Please note <strong style="color: #111827;">the state form will not be provided,</strong> however members should let their tax professionals know that they are part of the Zion Healthshare plan. We are still pending an official notice from Zion.</p>

<h2 style="font-size: 24px; font-weight: 700; color: #000000; margin: 32px 0 16px 0; line-height: 1.3;">Behavioral Health and Controlled Substances</h2>

<p style="font-size: 16px; line-height: 1.7; color: #334155; margin: 0 0 12px 0;">Conditions <strong style="color: #111827;">NOT</strong> treated with Behavioral Health Services:</p>

<ul style="margin: 0 0 16px 0; padding-left: 24px; list-style-type: disc;">
  <li style="font-size: 16px; line-height: 1.7; color: #334155; margin-bottom: 6px;">Patients under the age of 12</li>
  <li style="font-size: 16px; line-height: 1.7; color: #334155; margin-bottom: 6px;">Emergency situations (suicidal, homicidal, self-harm)</li>
  <li style="font-size: 16px; line-height: 1.7; color: #334155; margin-bottom: 6px;">ADHD prescription of stimulant (therapy and non-stimulant medication management are in scope)</li>
  <li style="font-size: 16px; line-height: 1.7; color: #334155; margin-bottom: 6px;">Active hallucinations or delusions</li>
  <li style="font-size: 16px; line-height: 1.7; color: #334155; margin-bottom: 6px;">Substance use in an active medical detox program</li>
  <li style="font-size: 16px; line-height: 1.7; color: #334155; margin-bottom: 6px;">Moderate to severe autism spectrum disorders</li>
  <li style="font-size: 16px; line-height: 1.7; color: #334155; margin-bottom: 6px;">Internationally located patients</li>
  <li style="font-size: 16px; line-height: 1.7; color: #334155; margin-bottom: 6px;">Conditions that require laboratory or diagnostic imaging to determine final treatment recommendations without lab work present for review</li>
</ul>

<p style="font-size: 16px; line-height: 1.7; color: #334155; margin: 0 0 12px 0;">Our telehealth providers are prohibited from prescribing controlled substances. Including but not limited to:</p>

<ul style="margin: 0 0 16px 0; padding-left: 24px; list-style-type: disc;">
  <li style="font-size: 16px; line-height: 1.7; color: #334155; margin-bottom: 6px;">Benzodiazepines such as Xanax, Ativan, Klonopin, or Valium</li>
  <li style="font-size: 16px; line-height: 1.7; color: #334155; margin-bottom: 6px;">Stimulants such as Adderall, Ritalin or Dexedrine</li>
  <li style="font-size: 16px; line-height: 1.7; color: #334155; margin-bottom: 6px;">Opioids such as Codeine, Vicodin, Methadone or Suboxone</li>
  <li style="font-size: 16px; line-height: 1.7; color: #334155; margin-bottom: 6px;">Hypnotics such as Ambien, Sonata or Lunesta</li>
  <li style="font-size: 16px; line-height: 1.7; color: #334155; margin-bottom: 6px;">Antipsychotics such as Seroquel or Zyprexa</li>
</ul>

<p style="margin: 0 0 16px 0;"><a href="https://www.deadiversion.usdoj.gov/schedules/orangebook/c_cs_alpha.pdf" target="_blank" style="display: inline-block; padding: 12px 28px; background-color: #2563eb; color: #ffffff; border-radius: 8px; text-decoration: none; font-weight: 600; font-size: 16px;">Full List of Prohibited Substances</a></p>

<h2 style="font-size: 24px; font-weight: 700; color: #000000; margin: 32px 0 16px 0; line-height: 1.3;">Premium Care &amp; Premium HSA Open Enrollment</h2>

<p style="font-size: 16px; line-height: 1.7; color: #334155; margin: 0 0 12px 0;">Sedera Open Enrollment is <strong style="color: #111827;">May 1, 2026 – May 19, 2026</strong>. This is the only time during the year members can:</p>

<ul style="margin: 0 0 16px 0; padding-left: 24px; list-style-type: disc;">
  <li style="font-size: 16px; line-height: 1.7; color: #334155; margin-bottom: 6px;">Decrease their IUA</li>
  <li style="font-size: 16px; line-height: 1.7; color: #334155; margin-bottom: 6px;">Add a family member (unless there is a qualifying event)</li>
</ul>

<p style="font-size: 16px; line-height: 1.7; color: #334155; margin: 0 0 12px 0;">All requested changes must be submitted by the member using this form: <a href="https://www.mpb.health/forms/membership-changes/" target="_blank" style="color: #2563eb; text-decoration: underline;">Member Updates</a>. An email notification was sent to all Premium HSA and Premium Care members.</p>

<h2 style="font-size: 24px; font-weight: 700; color: #000000; margin: 32px 0 16px 0; line-height: 1.3;">Las Vegas Incentive Trip + The Healthcare Disruption Summit</h2>

<p style="font-size: 16px; line-height: 1.7; color: #334155; margin: 0 0 12px 0;">MPB Health recently had an incredible time in Las Vegas celebrating our advisors at the MPB Health Incentive Trip Awards Night and attending the Healthcare Disruption Summit.</p>

<p style="font-size: 16px; line-height: 1.7; color: #334155; margin: 0 0 12px 0;"><strong style="color: #111827;">Congratulations again to our top award winners:</strong></p>

<ul style="margin: 0 0 16px 0; padding-left: 24px; list-style-type: disc;">
  <li style="font-size: 16px; line-height: 1.7; color: #334155; margin-bottom: 6px;">🥇 1st Place: Louis Spatafore</li>
  <li style="font-size: 16px; line-height: 1.7; color: #334155; margin-bottom: 6px;">🥈 2nd Place: Christine Corsini</li>
  <li style="font-size: 16px; line-height: 1.7; color: #334155; margin-bottom: 6px;">🥉 3rd Place: Leslie Alford</li>
</ul>

<p style="font-size: 16px; line-height: 1.7; color: #334155; margin: 0 0 12px 0;">A special recognition was also presented to Wendy S. for her long-standing dedication and meaningful contributions to the company over the years.</p>

<p style="font-size: 16px; line-height: 1.7; color: #334155; margin: 0 0 12px 0;">In addition to the celebration, we attended the Healthcare Disruption Summit, where professionals from across the industry came together to discuss the changing healthcare landscape and the increasing demand for more affordable, flexible healthcare solutions. Our CEO, Catherine Okubo, served as MC for the event, and our founder, Rod Maxson, delivered an insightful presentation on the history and evolution of Health Sharing.</p>

<p style="font-size: 16px; line-height: 1.7; color: #334155; margin: 0 0 12px 0;">👉 Read more about the event here: <a href="https://mpb.health/events/Healthcare%20Disruption%20Summit%202026%20Brings%20Industry%20Leaders%20Together%20in%20Las%20Vegas" target="_blank" style="color: #2563eb; text-decoration: underline;">Healthcare Disruption Summit 2026 Brings Industry Leaders Together in Las Vegas</a></p>

<hr style="border: none; border-top: 2px solid #e2e8f0; margin: 40px 0;">

<h3 style="text-align: center; font-size: 22px; font-weight: 700; color: #000000; margin: 40px 0 24px 0; padding-bottom: 12px; border-bottom: 2px solid #e2e8f0;">Reminders</h3>

<h2 style="font-size: 24px; font-weight: 700; color: #000000; margin: 32px 0 16px 0; line-height: 1.3;">Ready-to-Share Content</h2>

<p style="font-size: 16px; line-height: 1.7; color: #334155; margin: 0 0 12px 0;">We''re excited to start providing content that you can repost on your LinkedIn, share with prospects and clients, and use to position yourself as a trusted healthcare resource. More content will be shared regularly, so stay tuned!</p>

<ul style="margin: 0 0 16px 0; padding-left: 24px; list-style-type: disc;">
  <li style="font-size: 16px; line-height: 1.7; color: #334155; margin-bottom: 6px;"><a href="https://www.mpb.health/blog" target="_blank" style="color: #2563eb; text-decoration: underline;">MPB Health Blogs</a></li>
  <li style="font-size: 16px; line-height: 1.7; color: #334155; margin-bottom: 6px;"><a href="https://www.linkedin.com/company/mpb-health" target="_blank" style="color: #2563eb; text-decoration: underline;">MPB Health LinkedIn</a></li>
</ul>

<h2 style="font-size: 24px; font-weight: 700; color: #000000; margin: 32px 0 16px 0; line-height: 1.3;">Payment Declines</h2>

<p style="font-size: 16px; line-height: 1.7; color: #334155; margin: 0 0 12px 0;">Due to recent enhancements to our notification system, we are now able to notify members of their Share Amount Decline faster &amp; more frequently than we have in the past.</p>

<ul style="margin: 0 0 16px 0; padding-left: 24px; list-style-type: disc;">
  <li style="font-size: 16px; line-height: 1.7; color: #334155; margin-bottom: 6px;">Credit Card declines: 4 notifications via email and voicemail (advisors are copied)</li>
  <li style="font-size: 16px; line-height: 1.7; color: #334155; margin-bottom: 6px;">ACH declines: 2–3 notifications via email and voicemail</li>
</ul>

<p style="font-size: 16px; line-height: 1.7; color: #334155; margin: 0 0 12px 0;">Please try to be in contact with your members that have declined to encourage them to update their payment methods or direct us to re-run their payments prior to the <strong style="color: #111827;">deadline: the last business day of the month at 3:00 PM EST</strong>.</p>

<p style="font-size: 16px; line-height: 1.7; color: #334155; margin: 0 0 12px 0;">If the member has some extenuating circumstance where they will not be able to pay by the deadline, please have them be in contact with us prior to the deadline and we will work with them if they can give us a date in the first few days of the month that we are able to re-run their payment. Unfortunately, once the deadline passes it gets very challenging to re-instate their membership.</p>

<h2 style="font-size: 24px; font-weight: 700; color: #000000; margin: 32px 0 16px 0; line-height: 1.3;">Advisor Playbook</h2>

<p style="font-size: 16px; line-height: 1.7; color: #334155; margin: 0 0 12px 0;">Log in to the Advisor Portal using your registered <strong style="color: #111827;">advisor email and password</strong>. If you''re unable to access your account, click "Forgot Password," enter your registered advisor email, and follow the reset link sent to your inbox to <strong style="color: #111827;">create a new password</strong>.</p>

<p style="font-size: 16px; line-height: 1.7; color: #334155; margin: 0 0 12px 0;"><strong style="color: #111827;">Having trouble logging in?</strong> Please reach out to rebalarney@mympb.com for assistance. We''re here to help get you logged in quickly.</p>

<p style="margin: 0 0 16px 0;"><a href="https://advisor.mpb.health/login" target="_blank" style="display: inline-block; padding: 12px 28px; background-color: #2563eb; color: #ffffff; border-radius: 8px; text-decoration: none; font-weight: 600; font-size: 16px;">Advisor Playbook</a></p>

<h2 style="font-size: 24px; font-weight: 700; color: #000000; margin: 32px 0 16px 0; line-height: 1.3;">Enrollment Fee Waiver</h2>

<p style="font-size: 16px; line-height: 1.7; color: #334155; margin: 0 0 12px 0;">To waive the $100 enrollment fee, please use code <strong style="color: #111827;">100MPOWER</strong> during enrollment.</p>
',
  'bulletin',
  (SELECT id FROM advisor_content_categories WHERE slug = 'bulletin' LIMIT 1),
  '2026-05-13T12:00:00Z',
  true,
  false,
  0,
  '{}',
  (SELECT id FROM organizations WHERE slug = 'mpb-health' LIMIT 1)
WHERE NOT EXISTS (
  SELECT 1 FROM advisor_content
  WHERE content_type = 'bulletin'
    AND slug != 'advisor-bulletin-may-13-2026'
    AND title ILIKE '%may 13%2026%'
)
ON CONFLICT (slug) DO UPDATE SET
  title = EXCLUDED.title,
  excerpt = EXCLUDED.excerpt,
  content = EXCLUDED.content,
  published_date = EXCLUDED.published_date;

-- ============================================================================
-- Bulletin 5 of 5: April 29, 2026
-- ============================================================================
INSERT INTO advisor_content (title, slug, excerpt, content, content_type, category_id, published_date, is_published, is_featured, view_count, metadata, org_id)
SELECT
  'Advisor Bulletin: April 29, 2026',
  'advisor-bulletin-april-29-2026',
  'April 29, 2026 — Landing page preview & rollout, Massachusetts no-sell update, Sedera reminders (open enrollment, Savvos IUA reductions, maternity, and more), and payment decline notifications.',
  '
<h1 style="font-size: 32px; font-weight: 700; color: #000000; margin: 0 0 8px 0; line-height: 1.3;">April 29, 2026</h1>

<p style="font-size: 16px; line-height: 1.7; color: #334155; margin: 0 0 24px 0;">Advisor Bulletin</p>

<h3 style="text-align: center; font-size: 22px; font-weight: 700; color: #000000; margin: 40px 0 24px 0; padding-bottom: 12px; border-bottom: 2px solid #e2e8f0;">Updates</h3>

<h2 style="font-size: 24px; font-weight: 700; color: #000000; margin: 32px 0 16px 0; line-height: 1.3;">Landing Page — Preview &amp; Rollout</h2>

<p style="font-size: 16px; line-height: 1.7; color: #334155; margin: 0 0 12px 0;">We are providing a preview of the new landing pages. Please keep in mind that your URL will remain the same, and all pages will be <strong style="color: #111827;">automatically updated on May 13th</strong>. We will be conducting a full walkthrough on <strong style="color: #111827;">May 12th — we ask that all advisors be present for this meeting</strong>.</p>

<p style="margin: 0 0 16px 0;"><a href="https://join.mpb.health/" target="_blank" style="display: inline-block; padding: 12px 28px; background-color: #2563eb; color: #ffffff; border-radius: 8px; text-decoration: none; font-weight: 600; font-size: 16px;">Landing Page Preview</a></p>

<h2 style="font-size: 24px; font-weight: 700; color: #000000; margin: 32px 0 16px 0; line-height: 1.3;">Massachusetts Update</h2>

<p style="font-size: 16px; line-height: 1.7; color: #334155; margin: 0 0 12px 0;">The state of Massachusetts requires health plans to be MEC and MCC (Minimum Creditable Coverage) compliant. At this time, the only option for our plans to meet MCC requirements in Massachusetts is for the member to file a <strong style="color: #111827;">Religious Exemption</strong>. Please reach out to any Massachusetts members directly to discuss next steps.</p>

<p style="font-size: 16px; line-height: 1.7; color: #334155; margin: 0 0 12px 0;"><strong style="color: #111827;">Please note: We are no longer selling in Massachusetts.</strong></p>

<p style="margin: 0 0 16px 0;"><a href="https://mcusercontent.com/6c93f6cc2c451ffa2accc8784/files/0738a36d-23db-14e1-88c1-416c9bc63885/No_Sell_States_Chart_.pdf" target="_blank" style="display: inline-block; padding: 12px 28px; background-color: #2563eb; color: #ffffff; border-radius: 8px; text-decoration: none; font-weight: 600; font-size: 16px;">No Sell and State Mandates</a></p>

<h2 style="font-size: 24px; font-weight: 700; color: #000000; margin: 32px 0 16px 0; line-height: 1.3;">Premium Care &amp; Premium HSA (Sedera) Reminders</h2>

<p style="font-size: 16px; line-height: 1.7; color: #334155; margin: 0 0 12px 0;"><strong style="color: #111827;">Open Enrollment Period:</strong> Sedera Open Enrollment is <strong style="color: #111827;">May 1, 2026 – May 19, 2026</strong>. This is the only time during the year members can decrease their IUA or add a family member (unless there is a qualifying event). All requested changes must be submitted by the member using this form: <a href="https://www.mpb.health/forms/membership-changes/" target="_blank" style="color: #2563eb; text-decoration: underline;">Member Updates</a>. An email notification was sent to all Premium HSA and Premium Care members.</p>

<p style="font-size: 16px; line-height: 1.7; color: #334155; margin: 0 0 12px 0;"><strong style="color: #111827;">Payment of Needs Schedule:</strong> The sharing community will communicate via email in 30 days upon receipt of the medical bills; it will take 60 days to process, 90 days for sharing. 30/60/90 day rule.</p>

<p style="font-size: 16px; line-height: 1.7; color: #334155; margin: 0 0 12px 0;"><strong style="color: #111827;">2nd MD:</strong> No longer required.</p>

<p style="font-size: 16px; line-height: 1.7; color: #334155; margin: 0 0 12px 0;"><strong style="color: #111827;">Savvos Surgery &amp; Diagnostic IUA Reductions:</strong> Savvos access to find the best prices, procedures, and providers. On eligible procedures, members can receive <strong style="color: #111827;">up to $1,500 off their IUA</strong>.</p>

<ul style="margin: 0 0 16px 0; padding-left: 24px; list-style-type: disc;">
  <li style="font-size: 16px; line-height: 1.7; color: #334155; margin-bottom: 6px;"><strong style="color: #111827;">Surgeries:</strong> $500, $1,000, $1,500 IUAs: Completely waived (Member pays $0). $2,500, $5,000 IUAs: Reduced by $1,500. <em>Summary:</em> The IUA can be potentially waived up to $1,500 depending on the savings the member finds for themselves and the community via Savvos.</li>
  <li style="font-size: 16px; line-height: 1.7; color: #334155; margin-bottom: 6px;"><strong style="color: #111827;">Diagnostic Procedures:</strong> Same structure as surgeries; members may obtain IUA reductions through Savvos utilization.</li>
</ul>

<p style="font-size: 16px; line-height: 1.7; color: #334155; margin: 0 0 12px 0;"><strong style="color: #111827;">Maintenance Medications:</strong> First diagnosis will be shared for 90 days.</p>

<p style="font-size: 16px; line-height: 1.7; color: #334155; margin: 0 0 12px 0;"><strong style="color: #111827;">International Residency:</strong> Members can reside outside of the US, as long as the membership originated in the US. Shared needs must be translated into English and converted to USD.</p>

<p style="font-size: 16px; line-height: 1.7; color: #334155; margin: 0 0 12px 0;"><strong style="color: #111827;">Professional Sports Injuries:</strong> Per Section 6.C.1 of the guidelines, injuries resulting from professional sports are generally shareable, with the specific exception of racing (motorized vehicles), which remains a standard exclusion.</p>

<p style="font-size: 16px; line-height: 1.7; color: #334155; margin: 0 0 12px 0;"><strong style="color: #111827;">Maternity:</strong> Sharable when due date is 9 months from effective date. 2x IUA max $5k. Groups of 10 or more: maternity pre-ex and waiting is waived with a mandatory $5k IUA.</p>

<p style="font-size: 16px; line-height: 1.7; color: #334155; margin: 0 0 12px 0;"><strong style="color: #111827;">Emergency Room and pre-ex:</strong> Sharing for stabilizing care only. No additional treatment beyond stabilization is shareable.</p>

<h2 style="font-size: 24px; font-weight: 700; color: #000000; margin: 32px 0 16px 0; line-height: 1.3;">Payment Declines</h2>

<p style="font-size: 16px; line-height: 1.7; color: #334155; margin: 0 0 12px 0;">Due to recent enhancements to our notification system, we are now able to notify members of their Share Amount Decline faster &amp; more frequently than we have in the past.</p>

<ul style="margin: 0 0 16px 0; padding-left: 24px; list-style-type: disc;">
  <li style="font-size: 16px; line-height: 1.7; color: #334155; margin-bottom: 6px;">Credit Card declines: 4 notifications via email and voicemail (advisors are copied)</li>
  <li style="font-size: 16px; line-height: 1.7; color: #334155; margin-bottom: 6px;">ACH declines: 2–3 notifications via email and voicemail</li>
</ul>

<p style="font-size: 16px; line-height: 1.7; color: #334155; margin: 0 0 12px 0;">Please try to be in contact with your members that have declined to encourage them to update their payment methods or direct us to re-run their payments prior to the <strong style="color: #111827;">deadline: the last business day of the month at 3:00 PM EST</strong>. If the member has some extenuating circumstance where they will not be able to pay by the deadline, please have them be in contact with us prior to the deadline and we will work with them if they can give us a date in the first few days of the month that we are able to re-run their payment. Unfortunately, once the deadline passes it gets very challenging to re-instate their membership.</p>

<hr style="border: none; border-top: 2px solid #e2e8f0; margin: 40px 0;">

<h3 style="text-align: center; font-size: 22px; font-weight: 700; color: #000000; margin: 40px 0 24px 0; padding-bottom: 12px; border-bottom: 2px solid #e2e8f0;">Reminders</h3>

<h2 style="font-size: 24px; font-weight: 700; color: #000000; margin: 32px 0 16px 0; line-height: 1.3;">Ready-to-Share Content</h2>

<p style="font-size: 16px; line-height: 1.7; color: #334155; margin: 0 0 12px 0;">We''re excited to start providing content that you can repost on your LinkedIn, share with prospects and clients, and use to position yourself as a trusted healthcare resource. More content will be shared regularly, so stay tuned!</p>

<ul style="margin: 0 0 16px 0; padding-left: 24px; list-style-type: disc;">
  <li style="font-size: 16px; line-height: 1.7; color: #334155; margin-bottom: 6px;"><a href="https://www.mpb.health/blog" target="_blank" style="color: #2563eb; text-decoration: underline;">MPB Health Blogs</a></li>
  <li style="font-size: 16px; line-height: 1.7; color: #334155; margin-bottom: 6px;"><a href="https://www.linkedin.com/company/mpb-health" target="_blank" style="color: #2563eb; text-decoration: underline;">MPB Health LinkedIn</a></li>
</ul>

<h2 style="font-size: 24px; font-weight: 700; color: #000000; margin: 32px 0 16px 0; line-height: 1.3;">Advisor Playbook</h2>

<p style="font-size: 16px; line-height: 1.7; color: #334155; margin: 0 0 12px 0;">Log in to the Advisor Portal using your registered <strong style="color: #111827;">advisor email and password</strong>. If you''re unable to access your account, click "Forgot Password," enter your registered advisor email, and follow the reset link sent to your inbox to <strong style="color: #111827;">create a new password</strong>.</p>

<p style="font-size: 16px; line-height: 1.7; color: #334155; margin: 0 0 12px 0;"><strong style="color: #111827;">Having trouble logging in?</strong> Please reach out to rebalarney@mympb.com for assistance. We''re here to help get you logged in quickly.</p>

<p style="margin: 0 0 16px 0;"><a href="https://advisor.mpb.health/login" target="_blank" style="display: inline-block; padding: 12px 28px; background-color: #2563eb; color: #ffffff; border-radius: 8px; text-decoration: none; font-weight: 600; font-size: 16px;">Advisor Playbook</a></p>

<h2 style="font-size: 24px; font-weight: 700; color: #000000; margin: 32px 0 16px 0; line-height: 1.3;">Vegas Trip</h2>

<p style="font-size: 16px; line-height: 1.7; color: #334155; margin: 0 0 12px 0;">All winners should have received trip details and should be fully prepared for travel! If you have any questions, please reach out to Reba at: rebalarney@mympb.com</p>

<p style="font-size: 16px; line-height: 1.7; color: #334155; margin: 0 0 12px 0;">Additionally, MPB Health is hosting a group dinner on Wednesday, May 6th at 7:30pm at Luchini in the MGM Grand.</p>

<p style="margin: 0 0 16px 0;"><a href="https://www.planstin.com/hds" target="_blank" style="display: inline-block; padding: 12px 28px; background-color: #2563eb; color: #ffffff; border-radius: 8px; text-decoration: none; font-weight: 600; font-size: 16px;">Planstin Summit</a></p>

<h2 style="font-size: 24px; font-weight: 700; color: #000000; margin: 32px 0 16px 0; line-height: 1.3;">Enrollment Fee Waiver</h2>

<p style="font-size: 16px; line-height: 1.7; color: #334155; margin: 0 0 12px 0;">To waive the $100 enrollment fee, please use the code <strong style="color: #111827;">100MPOWER</strong> during enrollment and be sure to <strong style="color: #111827;">click the "+" button</strong> after entering the code for it to apply.</p>
',
  'bulletin',
  (SELECT id FROM advisor_content_categories WHERE slug = 'bulletin' LIMIT 1),
  '2026-04-29T12:00:00Z',
  true,
  false,
  0,
  '{}',
  (SELECT id FROM organizations WHERE slug = 'mpb-health' LIMIT 1)
WHERE NOT EXISTS (
  SELECT 1 FROM advisor_content
  WHERE content_type = 'bulletin'
    AND slug != 'advisor-bulletin-april-29-2026'
    AND title ILIKE '%april 29%2026%'
)
ON CONFLICT (slug) DO UPDATE SET
  title = EXCLUDED.title,
  excerpt = EXCLUDED.excerpt,
  content = EXCLUDED.content,
  published_date = EXCLUDED.published_date;
