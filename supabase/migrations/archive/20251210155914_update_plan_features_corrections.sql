/*
  # Update Plan Features with Correct Data
  
  This migration updates the plan_features table to reflect the correct plan information:
  
  1. Direct Plan Updates:
     - Lab Work: Now included (was excluded)
     - Mammogram, Colonoscopy: Now included (was excluded)
     - Immunizations: Changed to "Youth only"
  
  2. Secure HSA Updates:
     - Preventive Care Sharing: Changed to "100% Coverage" (was "ACA Mandated")
     - Network Restrictions: Changed to "PHCS Network (Preventive Only)"
  
  3. All Plans Updates:
     - Rename "Mental Health Sharing" to "Virtual Mental Health Care"
     - Rename "Prescription Discounts" to "RX Benefits"
     - Vision Discounts: Changed to "Add-on" for Care+, Direct, Secure HSA
     - Dental Discounts: Changed to "Add-on" for Care+, Direct, Secure HSA
  
  4. Care+ Updates:
     - Best For: Updated description
*/

-- Get plan IDs for reference
DO $$
DECLARE
  care_plus_id uuid;
  direct_id uuid;
  secure_hsa_id uuid;
BEGIN
  -- Get plan IDs
  SELECT id INTO care_plus_id FROM plans WHERE slug = 'care-plus' OR slug = 'careplus' LIMIT 1;
  SELECT id INTO direct_id FROM plans WHERE slug = 'direct' LIMIT 1;
  SELECT id INTO secure_hsa_id FROM plans WHERE slug = 'secure-hsa' OR slug = 'securehsa' LIMIT 1;

  -- Update Direct plan: Lab Work should be included
  IF direct_id IS NOT NULL THEN
    UPDATE plan_features 
    SET feature_value = 'Included', cost = NULL
    WHERE plan_id = direct_id 
    AND feature_name ILIKE '%lab work%';
    
    -- Update Direct plan: Mammogram, Colonoscopy should be included
            UPDATE plan_features 
            SET feature_value = 'Included', cost = NULL
            WHERE plan_id = direct_id 
            AND (feature_name ILIKE '%routine screening%' OR feature_name ILIKE '%mammo%' OR feature_name ILIKE '%colo%');
    
    -- Update Direct plan: Immunizations to Youth only
    UPDATE plan_features 
    SET feature_value = 'Youth only'
    WHERE plan_id = direct_id 
    AND feature_name ILIKE '%immunization%';
  END IF;

  -- Update Secure HSA: Preventive Care Sharing to 100% Coverage
  IF secure_hsa_id IS NOT NULL THEN
    UPDATE plan_features 
    SET feature_value = '100% Coverage'
    WHERE plan_id = secure_hsa_id 
    AND feature_name ILIKE '%preventive care%';
    
    -- Update Secure HSA: Network to PHCS Network (Preventive Only)
    UPDATE plan_features 
    SET feature_value = 'PHCS Network (Preventive Only)'
    WHERE plan_id = secure_hsa_id 
    AND feature_name ILIKE '%network%';
  END IF;

  -- Rename Mental Health Sharing to Virtual Mental Health Care for all plans
  UPDATE plan_features 
  SET feature_name = 'Virtual Mental Health Care'
  WHERE feature_name ILIKE '%mental health sharing%';

  -- Rename Prescription Discounts to RX Benefits for all plans
  UPDATE plan_features 
  SET feature_name = 'RX Benefits'
  WHERE feature_name ILIKE '%prescription discount%';

  -- Update Vision Discounts to Add-on for Care+, Direct, Secure HSA
  IF care_plus_id IS NOT NULL THEN
    UPDATE plan_features 
    SET feature_value = 'Add-on'
    WHERE plan_id = care_plus_id 
    AND feature_name ILIKE '%vision%';
    
    UPDATE plan_features 
    SET feature_value = 'Add-on'
    WHERE plan_id = care_plus_id 
    AND feature_name ILIKE '%dental%';
  END IF;

  IF direct_id IS NOT NULL THEN
    UPDATE plan_features 
    SET feature_value = 'Add-on'
    WHERE plan_id = direct_id 
    AND feature_name ILIKE '%vision%';
    
    UPDATE plan_features 
    SET feature_value = 'Add-on'
    WHERE plan_id = direct_id 
    AND feature_name ILIKE '%dental%';
  END IF;

  IF secure_hsa_id IS NOT NULL THEN
    UPDATE plan_features 
    SET feature_value = 'Add-on'
    WHERE plan_id = secure_hsa_id 
    AND feature_name ILIKE '%vision%';
    
    UPDATE plan_features 
    SET feature_value = 'Add-on'
    WHERE plan_id = secure_hsa_id 
    AND feature_name ILIKE '%dental%';
  END IF;

  -- Update Care+ target_audience/description
  IF care_plus_id IS NOT NULL THEN
    UPDATE plans 
    SET target_audience = 'Individuals & families seeking protection from large medical expenses'
    WHERE id = care_plus_id;
  END IF;

  RAISE NOTICE 'Plan features updated successfully';
END $$;

-- Also update any Counseling Sessions entries to remove them (merged into Virtual Mental Health Care)
DELETE FROM plan_features 
WHERE feature_name ILIKE '%counseling session%';
