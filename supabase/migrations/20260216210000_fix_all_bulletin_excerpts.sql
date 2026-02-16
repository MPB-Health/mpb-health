-- Fix all bulletin excerpts to be clean plain text (no HTML tags or entities)

UPDATE advisor_content
SET excerpt = 'December 24, 2025 — "Like snowflakes, every agent brings something unique, and together we create something powerful." Updates on Annual Wellness Visits, Telehealth Transition, Enrollment Requirements, and more.'
WHERE slug = 'advisor-bulletin-december-24-2025' AND content_type = 'bulletin';

UPDATE advisor_content
SET excerpt = 'December 10, 2025 — Updates on App Benefits Start Date, Updated Member Forms, Booking Virtual Care Appointments, PHCS Provider Nominations, and 2026 pricing reminders.'
WHERE slug = 'advisor-bulletin-december-10-2025' AND content_type = 'bulletin';

UPDATE advisor_content
SET excerpt = 'November 26, 2025 — "Gratitude is not only the greatest of virtues, but the parent of all the others." Reminders on Freedom to Share Act, PHCS Network in Michigan, 2026 pricing, pre-existing conditions, and more.'
WHERE slug = 'advisor-bulletin-november-26-2025' AND content_type = 'bulletin';

UPDATE advisor_content
SET excerpt = 'November 12, 2025 — "Success is the sum of small efforts, repeated day in and day out." Reminders on enrollment deadlines, pre-existing conditions, maternity, 2026 rates, PHCS Minnesota, and MPB Health App.'
WHERE slug = 'advisor-bulletin-november-12-2025' AND content_type = 'bulletin';

UPDATE advisor_content
SET excerpt = 'October 28, 2025 — "The secret of change is to focus all your energy not on fighting the old, but on building the new." Reminders on IUA changes, pre-existing conditions, 2026 rates, and HR.1 changes.'
WHERE slug = 'advisor-bulletin-october-28-2025' AND content_type = 'bulletin';

UPDATE advisor_content
SET excerpt = 'October 15, 2025 — "If you are not taking care of your customer, your competitor will." Updates on Sedera changes in Florida, Zion sharing request payments, pet telehealth, and alternative/functional guidelines.'
WHERE slug = 'advisor-bulletin-october-15-2025' AND content_type = 'bulletin';

UPDATE advisor_content
SET excerpt = 'Price updates in progress on your enrollment platform. Selling January 1, 2026 effective dates? Give members a heads-up that rates have increased.'
WHERE slug = 'note-to-advisors-2026-rates-e123-update-in-progress' AND content_type = 'bulletin';

UPDATE advisor_content
SET excerpt = 'Care+, Secure HSA, and Direct will see modest price updates designed to maintain robust sharing for major needs and keep monthly amounts low as healthcare costs continue to rise.'
WHERE slug = 'important-update-regarding-price-increase-2026' AND content_type = 'bulletin';

UPDATE advisor_content
SET excerpt = 'Important update regarding Sedera and the recent legislative changes in Florida. Due to Florida Statute 624.1265, Sedera plans can no longer be sold by licensed health agents in Florida.'
WHERE slug = 'important-update-regarding-sedera-plans-in-florida' AND content_type = 'bulletin';

UPDATE advisor_content
SET excerpt = 'September 24, 2025 — "Sell the problem you solve, not the product." Updates on Sedera in Florida, new landing pages, virtual behavioral health, and enrollment reminders.'
WHERE slug = 'advisor-bulletin-september-24-2025' AND content_type = 'bulletin';

UPDATE advisor_content
SET excerpt = 'September 2025 — "In the middle of every difficulty lies opportunity." Updates on the new MPB Health App launch, virtual care access, enrollment reminders, and rewards programs.'
WHERE slug = 'advisor-bulletin-september-09-2025' AND content_type = 'bulletin';

UPDATE advisor_content
SET excerpt = 'August 2nd Half — "Perseverance is not a long race; it is many short races one after the other." Updates on Sedera Summus partnership, MPB Health App enhancements, App Demo recording, MGM Grand contest, and rewards.'
WHERE slug = 'advisor-bulletin-august-2nd-half-2025' AND content_type = 'bulletin';

-- Catch-all: strip HTML from any remaining bulletin excerpts that still contain tags
UPDATE advisor_content
SET excerpt = regexp_replace(
  regexp_replace(
    regexp_replace(excerpt, '<[^>]+>', '', 'g'),
    '&[a-zA-Z]+;', '', 'g'
  ),
  '&#[0-9]+;', '', 'g'
)
WHERE content_type = 'bulletin'
  AND (excerpt LIKE '%<%' OR excerpt LIKE '%&%#%' OR excerpt LIKE '%&amp;%' OR excerpt LIKE '%&hellip;%' OR excerpt LIKE '%&ndash;%' OR excerpt LIKE '%&rsquo;%');
