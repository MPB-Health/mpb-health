/*
  # Clean Feature Category Names

  1. Updates
    - Update all plan_features.category values to remove underscores and use proper capitalization
    - Change "virtual_health" to "Virtual Health"
    - Change "preventive" to "Preventive Care"
    - Change "mec" to "Minimum Essential Coverage"
    - Change "pharmacy" to "Pharmacy Benefits"
    - Change "support" to "Member Support"
    - Change "discounts" to "Exclusive Discounts"
    - Change "digital" to "Digital Health Tools"
    - Change "international" to "International Coverage"
    - Change "sharing" to "Medical Cost Sharing"
    - Change "core" to "Core Benefits"
    - Change "additional" to "Additional Benefits"
    - Change "virtual-care" to "Virtual Care"
    - Change "financial" to "Financial Benefits"

  2. Notes
    - This migration ensures professional, consistent category naming throughout the site
    - All category names will display with proper title case and no underscores
*/

-- Update feature category names to professional format
UPDATE plan_features SET category = 'Virtual Health' WHERE category = 'virtual_health';
UPDATE plan_features SET category = 'Preventive Care' WHERE category = 'preventive';
UPDATE plan_features SET category = 'Minimum Essential Coverage' WHERE category = 'mec';
UPDATE plan_features SET category = 'Pharmacy Benefits' WHERE category = 'pharmacy';
UPDATE plan_features SET category = 'Member Support' WHERE category = 'support';
UPDATE plan_features SET category = 'Exclusive Discounts' WHERE category = 'discounts';
UPDATE plan_features SET category = 'Digital Health Tools' WHERE category = 'digital';
UPDATE plan_features SET category = 'International Coverage' WHERE category = 'international';
UPDATE plan_features SET category = 'Medical Cost Sharing' WHERE category = 'sharing';
UPDATE plan_features SET category = 'Core Benefits' WHERE category = 'core';
UPDATE plan_features SET category = 'Additional Benefits' WHERE category = 'additional';
UPDATE plan_features SET category = 'Virtual Care' WHERE category = 'virtual-care';
UPDATE plan_features SET category = 'Financial Benefits' WHERE category = 'financial';
