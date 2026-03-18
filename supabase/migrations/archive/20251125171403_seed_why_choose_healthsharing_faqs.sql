/*
  # Seed "Why Choose HealthSharing" FAQ Items

  1. Purpose
    - Populate the FAQ items table with marketing-focused benefits content
    - Replace "History of Health Sharing" with "Why Choose HealthSharing"
    - 8 compelling reasons to choose health sharing over traditional insurance

  2. Content Strategy
    - Marketing & benefits-focused messaging
    - Emotional and persuasive copy
    - SEO-optimized for conversion
    - Addresses common objections and highlights unique value props

  3. Changes
    - Insert 8 new FAQ items with category 'why-choose-healthsharing'
    - Content written for non-technical prospects
    - Ordered by importance and conversion impact
*/

-- Insert "Why Choose HealthSharing" FAQ items
INSERT INTO faq_items (title, content_html, category, order_index, is_active)
VALUES
  (
    'Save Up to 60% on Monthly Costs',
    '<p>Traditional insurance premiums average <strong>$500-$1,200/month</strong> for families. With health sharing, most members pay just <strong>$200-$400/month</strong> for comparable coverage.</p>
    <p>That means <strong>thousands of dollars saved every year</strong> - money that stays in your pocket for what matters most to you and your family.</p>
    <p>Whether you''re self-employed, between jobs, or just tired of rising insurance costs, health sharing offers a refreshingly affordable alternative without sacrificing quality care.</p>',
    'why-choose-healthsharing',
    1,
    true
  ),
  (
    'No Network Restrictions - Your Choice, Your Doctor',
    '<p>Visit <strong>any doctor, specialist, or hospital</strong> you trust. No narrow networks, no prior authorizations, no insurance company saying "no" to your preferred provider.</p>
    <p><strong>You''re in complete control</strong> of your healthcare decisions. Choose the best care available, not just what''s "in-network."</p>
    <p>Build lasting relationships with healthcare providers who know you and your family - not whoever happens to be in your plan''s network this year.</p>',
    'why-choose-healthsharing',
    2,
    true
  ),
  (
    'Transparent Pricing - No Hidden Surprises',
    '<p>Know exactly what you''ll pay every month. <strong>No confusing deductibles</strong> that reset annually, <strong>no surprise out-of-network bills</strong>, no fine print gotchas.</p>
    <p>Just straightforward, honest pricing you can count on. Your Initial Unshareable Amount stays consistent, and you''ll always know what''s covered before you receive care.</p>
    <p>No more anxiety over surprise medical bills or wondering if a procedure will be covered. <strong>Clarity and peace of mind</strong> should come standard.</p>',
    'why-choose-healthsharing',
    3,
    true
  ),
  (
    'Community That Cares - Real People, Not Corporations',
    '<p>You''re not a policy number to us. <strong>You''re part of a community</strong> of members who share your values and genuinely care about your wellbeing.</p>
    <p>When you need help, <strong>real people are there to support you</strong> - not automated claim denials or endless phone trees. Members receive personalized attention and compassionate care coordination.</p>
    <p>Experience healthcare the way it should be: human-centered, values-driven, and built on mutual support rather than corporate profit.</p>',
    'why-choose-healthsharing',
    4,
    true
  ),
  (
    'Direct Primary Care Access Included',
    '<p>Many health sharing programs include <strong>Direct Primary Care (DPC) membership</strong> at no extra cost. Get unlimited primary care visits, same-day appointments, and direct access to your doctor via text or phone.</p>
    <p>DPC means <strong>longer appointment times</strong>, personalized attention, and a doctor who actually knows your health history. No more rushed 7-minute visits or waiting weeks for an appointment.</p>
    <p>Combine health sharing for major medical needs with DPC for everyday care - the perfect healthcare solution for modern families.</p>',
    'why-choose-healthsharing',
    5,
    true
  ),
  (
    'Eligible Medical Expenses Shared Without Artificial Limits',
    '<p>When you have a qualifying medical need, <strong>your community steps in to help</strong>. No annual or lifetime benefit caps on most programs.</p>
    <p>Major surgeries, cancer treatment, serious accidents - <strong>your community is there when you need them most</strong>. Medical bills are shared according to program guidelines, giving you financial protection and peace of mind.</p>
    <p>Unlike traditional insurance with benefit maximums, health sharing communities focus on helping members through their most significant medical challenges.</p>',
    'why-choose-healthsharing',
    6,
    true
  ),
  (
    'Freedom from Insurance Company Red Tape',
    '<p>No more fighting with insurance adjusters. <strong>No more claim denials</strong> for arbitrary "medical necessity" decisions. No more prior authorizations that delay critical care.</p>
    <p>Get the treatment you need when you need it. Your healthcare decisions are made between you and your doctor - not dictated by an insurance company''s profit motives.</p>
    <p>Spend your time focusing on healing, not battling bureaucracy. <strong>Healthcare should be simple</strong>, and health sharing makes it that way.</p>',
    'why-choose-healthsharing',
    7,
    true
  ),
  (
    'Tax-Advantaged Health Savings Options',
    '<p>Many health sharing programs <strong>qualify for HSA compatibility</strong>, letting you save thousands pre-tax for medical expenses. Build wealth while protecting your health.</p>
    <p>HSA-compatible health sharing plans give you the <strong>triple tax advantage</strong>: tax-deductible contributions, tax-free growth, and tax-free withdrawals for qualified medical expenses.</p>
    <p>It''s the smartest way to pay for healthcare while building a financial safety net for your family''s future medical needs.</p>',
    'why-choose-healthsharing',
    8,
    true
  )
ON CONFLICT DO NOTHING;