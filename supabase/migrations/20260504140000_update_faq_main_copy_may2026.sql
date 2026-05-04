-- Sync /faq (category mpb-faq-main) with marketing copy: WA note as its own paragraph; straight quotes on "statement of faith."

UPDATE public.faq_items
SET content_html = $c$
<p>While many healthshares require a religious "statement of faith," MPB Health is inclusive and open to everyone. We welcome members from all backgrounds, beliefs, and walks of life who share the common goal of taking personal responsibility for their health within a supportive community. Beyond our inclusivity, we differentiate ourselves by providing modern benefits such as $0 unlimited virtual care and behavioral health resources from day one, ensuring the community supports your daily wellness rather than just major medical events.</p>
$c$
WHERE category = 'mpb-faq-main'
  AND title = 'What makes MPB Health different from other healthshares?';

UPDATE public.faq_items
SET content_html = $c$
<p>Yes. MPB Health is available to members across most of the United States and Puerto Rico, providing individuals and families access to a nationwide, community-based healthcare model that travels with you.</p>
<p>Note: Membership is currently unavailable to residents of Washington state.</p>
$c$
WHERE category = 'mpb-faq-main'
  AND title = 'Is MPB Health available nationwide?';
