-- Main /faq page: same 10 Q&As as About Us (Apr 2026). Website loads category `mpb-faq-main` only.

DELETE FROM public.faq_items WHERE category = 'mpb-faq-main';

INSERT INTO public.faq_items (title, content_html, category, order_index, is_active) VALUES
  (
    'What is MPB Health?',
    $m1$<p>MPB Health offers memberships that are alternatives to traditional health insurance. MPB Health is not insurance; rather, it is a community-focused organization dedicated to providing transparent, non-insurance alternatives for healthcare. We facilitate a medical cost-sharing model that empowers individuals, families, and businesses to break free from traditional network restrictions and high corporate overhead. By prioritizing people over profit, we provide innovative solutions that combine sharing, preventive care, and personalized support to help our members take back control of their healthcare journey.</p>$m1$,
    'mpb-faq-main',
    1,
    true
  ),
  (
    'Why do people choose MPB Health?',
    $m2$<p>Members choose MPB Health for the greater flexibility of seeing any doctor, significantly lower monthly costs compared to traditional insurance, and access to a community-based model. Our members value a system that prioritizes transparency and shared responsibility over corporate profit margins.</p>$m2$,
    'mpb-faq-main',
    2,
    true
  ),
  (
    'How much do members typically save by joining MPB Health?',
    $m3$<p>On average, our members see a 30–60% reduction in their monthly costs compared to traditional insurance premiums. Because we are a community-driven model without the high overhead of corporate insurance, those savings are passed directly back to our members.</p>$m3$,
    'mpb-faq-main',
    3,
    true
  ),
  (
    'How is MPB Health different from traditional insurance?',
    $m4$<p>Traditional insurance is built around premiums, restrictive networks, and corporate risk pools. MPB Health is a community-based alternative where members contribute monthly to share in eligible medical needs based on clear guidelines rather than insurance contracts. This model offers lower monthly costs and the freedom to choose any provider without network limitations.</p>$m4$,
    'mpb-faq-main',
    4,
    true
  ),
  (
    'What makes MPB Health different from other healthshares?',
    $m5$<p>While many healthshares require a religious “statement of faith,” MPB Health is inclusive and open to everyone. We welcome members from all backgrounds, beliefs, and walks of life who share the common goal of taking personal responsibility for their health within a supportive community. Beyond our inclusivity, we differentiate ourselves by providing modern benefits such as $0 unlimited virtual care and behavioral health resources from day one, ensuring the community supports your daily wellness rather than just major medical events.</p>$m5$,
    'mpb-faq-main',
    5,
    true
  ),
  (
    'Is MPB Health a good fit for families?',
    $m6$<p>Yes. Many families choose MPB Health because it offers total provider flexibility, allowing them to keep their trusted pediatricians and specialists. Families also benefit from significant monthly savings and immediate access to resources such as $0 unlimited virtual care and behavioral health, ensuring their everyday health needs are supported without the high costs of traditional insurance.</p>$m6$,
    'mpb-faq-main',
    6,
    true
  ),
  (
    'Who typically joins MPB Health?',
    $m7$<p>MPB Health is an ideal fit for individuals, families, small business owners, and self-employed professionals who prioritize freedom and flexibility in their healthcare. Our members are typically looking for a more affordable, community-driven alternative to traditional insurance that allows them to take full control of their healthcare choices without being restricted by corporate networks.</p>$m7$,
    'mpb-faq-main',
    7,
    true
  ),
  (
    'Is MPB Health available nationwide?',
    $m8$<p>Yes. MPB Health is available to members across most of the United States and Puerto Rico, providing individuals and families access to a nationwide, community-based healthcare model that travels with you. Note: Membership is currently unavailable to residents of Washington state.</p>$m8$,
    'mpb-faq-main',
    8,
    true
  ),
  (
    'Do I have to wait for an "Open Enrollment" period to join?',
    $m9$<p>No. One of the greatest advantages of MPB Health is that you can join any time of the year. There are no restrictive enrollment windows, meaning you can take control of your healthcare and start your membership as early as the first of the next month.</p>$m9$,
    'mpb-faq-main',
    9,
    true
  ),
  (
    'Is maternity care eligible for sharing?',
    $m10$<p>Yes. MPB Health supports growing families by sharing in eligible expenses related to prenatal care, delivery, and postnatal care. To be eligible for sharing, the pregnancy conception date must occur after at least six months of continuous membership. Once the Initial Unshareable Amount (IUA) is met for the pregnancy, the community shares in the remaining eligible costs for both the mother and the newborn's initial care.</p>$m10$,
    'mpb-faq-main',
    10,
    true
  );
