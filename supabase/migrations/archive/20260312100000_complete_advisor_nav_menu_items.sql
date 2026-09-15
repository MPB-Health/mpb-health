-- ============================================================================
-- Complete Advisor Nav Menu: fully database-driven sidebar
-- ============================================================================
-- Changes:
--   1. Fix Training children URLs (MPB → /training/mpb-cards, Sedera/Zion → external)
--   2. Add missing Training children (Secure HSA, CARE+)
--   3. Add Handbooks as child of Resources
--   4. Add missing top-level items (Video Library, Events, Chat, Support Tickets, Knowledge Base)
--   5. Rename Quick Links → Resource Center
--   6. Reorder all items to match intended sidebar order
-- ============================================================================

-- Fix Training children: correct URLs and external flags
UPDATE advisor_nav_menu SET url = '/training/mpb-cards'
  WHERE label = 'MPB Training' AND parent_id = (SELECT id FROM advisor_nav_menu WHERE label = 'Training' AND parent_id IS NULL);
UPDATE advisor_nav_menu SET
  url = 'https://sedera.my.salesforce-sites.com/Affiliate/apex/Affiliate_Contact_Form?Contact.Parent_Affiliate_Account__c=0011N00001vSpDl',
  is_external = true
  WHERE label = 'Sedera Training' AND parent_id = (SELECT id FROM advisor_nav_menu WHERE label = 'Training' AND parent_id IS NULL);
UPDATE advisor_nav_menu SET
  url = 'https://zionhealthshare.thinkific.com/courses/zionhealthshare',
  is_external = true
  WHERE label = 'Zion Training' AND parent_id = (SELECT id FROM advisor_nav_menu WHERE label = 'Training' AND parent_id IS NULL);
-- Add missing Training children (idempotent)
INSERT INTO advisor_nav_menu (label, url, icon, parent_id, order_index, is_active, is_external, requires_auth)
SELECT 'Secure HSA Training', '/training/secure-hsa', 'GraduationCap',
       (SELECT id FROM advisor_nav_menu WHERE label = 'Training' AND parent_id IS NULL), 2, true, false, true
WHERE NOT EXISTS (SELECT 1 FROM advisor_nav_menu WHERE label = 'Secure HSA Training');
INSERT INTO advisor_nav_menu (label, url, icon, parent_id, order_index, is_active, is_external, requires_auth)
SELECT 'CARE+ Training', '/training/care-plus', 'GraduationCap',
       (SELECT id FROM advisor_nav_menu WHERE label = 'Training' AND parent_id IS NULL), 3, true, false, true
WHERE NOT EXISTS (SELECT 1 FROM advisor_nav_menu WHERE label = 'CARE+ Training');
-- Reorder Sedera/Zion after new items
UPDATE advisor_nav_menu SET order_index = 4 WHERE label = 'Sedera Training' AND parent_id IS NOT NULL;
UPDATE advisor_nav_menu SET order_index = 5 WHERE label = 'Zion Training' AND parent_id IS NOT NULL;
-- Add Handbooks as child of Resources (idempotent)
INSERT INTO advisor_nav_menu (label, url, icon, parent_id, order_index, is_active, is_external, requires_auth)
SELECT 'Handbooks', '/sops/handbooks', 'BookOpen',
       (SELECT id FROM advisor_nav_menu WHERE label = 'Resources' AND parent_id IS NULL), 0, true, false, true
WHERE NOT EXISTS (SELECT 1 FROM advisor_nav_menu WHERE label = 'Handbooks' AND parent_id IS NOT NULL);
-- Reorder active top-level items
UPDATE advisor_nav_menu SET order_index = 1 WHERE label = 'Dashboard' AND parent_id IS NULL;
UPDATE advisor_nav_menu SET order_index = 2 WHERE label = 'Bulletins' AND parent_id IS NULL;
UPDATE advisor_nav_menu SET order_index = 3 WHERE label = 'Quick Links' AND parent_id IS NULL;
UPDATE advisor_nav_menu SET order_index = 3 WHERE label = 'Resource Center' AND parent_id IS NULL;
UPDATE advisor_nav_menu SET order_index = 4 WHERE label = 'Resources' AND parent_id IS NULL;
UPDATE advisor_nav_menu SET order_index = 5 WHERE label = 'Forms' AND parent_id IS NULL;
UPDATE advisor_nav_menu SET order_index = 6 WHERE label = 'Training' AND parent_id IS NULL;
UPDATE advisor_nav_menu SET order_index = 12 WHERE label = 'Submit Group' AND parent_id IS NULL;
UPDATE advisor_nav_menu SET order_index = 15 WHERE label = 'Contact' AND parent_id IS NULL;
-- Rename Quick Links to Resource Center
UPDATE advisor_nav_menu SET label = 'Resource Center' WHERE label = 'Quick Links' AND parent_id IS NULL AND url = '/quick-links';
-- Add missing top-level items (idempotent)
INSERT INTO advisor_nav_menu (label, url, icon, parent_id, order_index, is_active, is_external, requires_auth)
SELECT 'Video Library', '/videos', 'Video', null, 7, true, false, true
WHERE NOT EXISTS (SELECT 1 FROM advisor_nav_menu WHERE label = 'Video Library');
INSERT INTO advisor_nav_menu (label, url, icon, parent_id, order_index, is_active, is_external, requires_auth)
SELECT 'Events', '/events/manage', 'Calendar', null, 8, true, false, true
WHERE NOT EXISTS (SELECT 1 FROM advisor_nav_menu WHERE label = 'Events');
INSERT INTO advisor_nav_menu (label, url, icon, parent_id, order_index, is_active, is_external, requires_auth)
SELECT 'Chat', '/chat', 'MessageSquare', null, 9, true, false, true
WHERE NOT EXISTS (SELECT 1 FROM advisor_nav_menu WHERE label = 'Chat');
INSERT INTO advisor_nav_menu (label, url, icon, parent_id, order_index, is_active, is_external, requires_auth)
SELECT 'Support Tickets', '/tickets', 'Headphones', null, 10, true, false, true
WHERE NOT EXISTS (SELECT 1 FROM advisor_nav_menu WHERE label = 'Support Tickets');
INSERT INTO advisor_nav_menu (label, url, icon, parent_id, order_index, is_active, is_external, requires_auth)
SELECT 'Knowledge Base', '/knowledge-base', 'BookOpen', null, 11, true, false, true
WHERE NOT EXISTS (SELECT 1 FROM advisor_nav_menu WHERE label = 'Knowledge Base');
