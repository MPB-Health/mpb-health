-- Point all member handbooks at same-origin PDFs in apps/website/public/docs/.
-- Google Drive iframe previews break clickable links and fail on many browsers/devices.

UPDATE public.handbooks SET pdf_path = '/docs/Care+ Handbook-New Members (3).pdf', updated_at = now()
WHERE slug = 'careplus';

UPDATE public.handbooks SET pdf_path = '/docs/Direct Handbook-New Members (2).pdf', updated_at = now()
WHERE slug = 'direct-handbook';

UPDATE public.handbooks SET pdf_path = '/docs/Secure HSA Handbook-New Members.pdf', updated_at = now()
WHERE slug = 'secure-hsa';

UPDATE public.handbooks SET pdf_path = '/docs/Premium-Care-Member-Handbook.pdf', updated_at = now()
WHERE slug = 'premium-care';

UPDATE public.handbooks SET pdf_path = '/docs/Premium-HSA-Member-Handbook.pdf', updated_at = now()
WHERE slug = 'premium-hsa';

UPDATE public.handbooks SET pdf_path = '/docs/Essentials Handbook-New Members 1.pdf', updated_at = now()
WHERE slug = 'essentials';

UPDATE public.handbooks SET pdf_path = '/docs/MEC+Essentials Handbook-New Members 1.pdf', updated_at = now()
WHERE slug = 'mecessentials-handbook';

UPDATE public.handbooks SET pdf_path = '/docs/Zion Member Guidelines.pdf', updated_at = now()
WHERE slug = 'zion-guidelines';

UPDATE public.handbooks SET pdf_path = '/docs/Sedera-Community-Guidelines-2 (1).pdf', updated_at = now()
WHERE slug = 'sedera-guidelines';

UPDATE public.handbooks SET flipbook_url = 'https://mpb.health/3d-flip-book/' || slug, updated_at = now()
WHERE slug IN ('premium-care', 'premium-hsa') AND flipbook_url IS NULL;;
