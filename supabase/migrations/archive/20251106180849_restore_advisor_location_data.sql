/*
  # Restore Advisor Location Data

  ## Overview
  This migration restores missing state and location data for advisors that was
  lost when the table was truncated and repopulated with incomplete data.

  ## Problem
  The October 30, 2025 migration (20251030180732) truncated the advisors table
  and inserted new data that only included contact information (name, email, phone)
  but excluded all location fields (state, city, address, zipcode). This caused
  the advisor directory state dropdown to show "0 States Covered" and no filter
  options.

  ## Solution
  This migration updates existing advisor records with location data by matching
  email addresses between the old dataset (which had complete location info) and
  the current dataset. Where matches exist, we populate:
  - state (US state code)
  - city (city name)
  - address_1 (street address)
  - zipcode (postal code)

  ## Data Sources
  Location data is sourced from the previous migration file
  20251028200450_20251028141000_update_advisors_table_schema.sql which contained
  91 advisors with complete location information.

  ## Important Notes
  1. Not all current advisors will have location data (some are new)
  2. Email addresses are used as the primary matching key
  3. Case-insensitive email matching is used
  4. This does NOT delete any existing advisor records
  5. Only updates location fields where they are currently NULL
*/

-- ============================================================================
-- Update advisors with location data based on email matching
-- ============================================================================

-- Update Shaun McCarty
UPDATE advisors
SET state = 'MD', city = 'Columbia', address_1 = '9033 Queen Maria Ct.', zipcode = '21045'
WHERE email ILIKE 'smccarty@appreciationfinancial.com' AND state IS NULL;

-- Update Richard Spaller
UPDATE advisors
SET state = 'OH', city = 'Painesville', address_1 = '6400 Mardon Drive', zipcode = '44077'
WHERE email ILIKE 'rspaller@appreciationfinancial.com' AND state IS NULL;

-- Update Sarah Max
UPDATE advisors
SET state = 'VA', city = 'Suffolk', address_1 = '307 linden Ave', zipcode = '23434'
WHERE email ILIKE 'maxmpowering@yahoo.com' AND state IS NULL;

-- Update Cindy Gordon
UPDATE advisors
SET state = 'AZ', city = 'Phoenix', address_1 = '13835 N. Tatum Blvd', zipcode = '85032'
WHERE email ILIKE 'cindy@gordonhg.com' AND state IS NULL;

-- Update Bern Philipp
UPDATE advisors
SET state = 'FL', city = 'Boca Raton', address_1 = '2044 NW 52nd St', zipcode = '33496'
WHERE email ILIKE 'bern@mympb.com' AND state IS NULL;

-- Update Jane Kassel
UPDATE advisors
SET state = 'AZ', city = 'Phoenix', address_1 = 'PO BOX 1360', zipcode = '85244-1360'
WHERE email ILIKE 'jane@kasselbenefits.com' AND state IS NULL;

-- Update Joan Phelps
UPDATE advisors
SET state = 'FL', city = 'Delray Beach', address_1 = '7399 Serrano Terrace', zipcode = '33446'
WHERE email ILIKE 'joan@mympb.com' AND state IS NULL;

-- Update Beverly Garretson
UPDATE advisors
SET state = 'CO', city = 'Montrose', address_1 = '21446 Uncompahgre Rd', zipcode = '81403-8787'
WHERE email ILIKE 'beverlyjgarretson@gmail.com' AND state IS NULL;

-- Update Darius Kohanim
UPDATE advisors
SET state = 'GA', city = 'Roswell', address_1 = '12630 Etris Rd', zipcode = '30075'
WHERE email ILIKE 'truehealthsolutions@gmail.com' AND state IS NULL;

-- Update Jill Clark
UPDATE advisors
SET state = 'CO', city = 'Durango', address_1 = '450 N SkyLane Drive', zipcode = '81303'
WHERE email ILIKE 'zen.insurance@gmail.com' AND state IS NULL;

-- Update Andrea Hinman
UPDATE advisors
SET state = 'CO', city = 'Centennial', address_1 = '19238 E. Low Dr.', zipcode = '80015'
WHERE email ILIKE 'akhinman1@protonmail.com' AND state IS NULL;

-- Update Leslie Alford
UPDATE advisors
SET state = 'MI', city = 'Plainwell', address_1 = '12201 Islandview Dr', zipcode = '49080-8517'
WHERE email ILIKE 'lesliealford@hsaforamerica.com' AND state IS NULL;

-- Update Misty Berryman
UPDATE advisors
SET state = 'TX', city = 'Amarillo', address_1 = '1331 Grasslands', zipcode = '79124'
WHERE email ILIKE 'mistyberryman@hsaforamerica.com' AND state IS NULL;

-- Update Richard Willard
UPDATE advisors
SET state = 'CT', city = 'Wethersfield', address_1 = 'P.O. Box 290333', zipcode = '6109'
WHERE email ILIKE 'gwillards@consultant.com' AND state IS NULL;

-- Update Amy Nielsen
UPDATE advisors
SET state = 'MN', city = 'Farmington', address_1 = '20380 Dunbar Avenue', zipcode = '55024'
WHERE email ILIKE 'amy@nielsengroupllc.com' AND state IS NULL;

-- Update Wiley Long
UPDATE advisors
SET state = 'CO', city = 'Fort Collins', address_1 = '1001 E Harmony Rd UNIT A', zipcode = '80525'
WHERE email ILIKE 'info@hsaforamerica.com' AND state IS NULL;

-- Update Robin Kemp
UPDATE advisors
SET state = 'CA', city = 'Carlsbad'
WHERE email ILIKE 'robin@kempbenefits.com' AND state IS NULL;

-- Update Justin Garrett
UPDATE advisors
SET state = 'KY', city = 'Scottsville', address_1 = '2119 Pope Rd', zipcode = '42164'
WHERE email ILIKE 'justinimeinsurnace@gmail.com' AND state IS NULL;

-- Update Maggie Roeder
UPDATE advisors
SET state = 'TN', city = 'Hendersonville', address_1 = '1051 Dorset Dr', zipcode = '37075'
WHERE email ILIKE 'maggie@prismlh.com' AND state IS NULL;

-- Update Michael Dawson
UPDATE advisors
SET state = 'PA', city = 'Temple', address_1 = '1001 Daisy Dr', zipcode = '19560'
WHERE email ILIKE 'michaeldawson09@gmail.com' AND state IS NULL;

-- Update Anthony Lopez
UPDATE advisors
SET state = 'CA', city = 'West Covina', address_1 = '1941 East Gemini Street', zipcode = '91792'
WHERE email ILIKE 'anthony@coreimpactbenefits.com' AND state IS NULL;

-- Update Kirk Bennett
UPDATE advisors
SET state = 'CA', city = 'alamo', address_1 = '105 Valley Oaks Drive', zipcode = '94507'
WHERE email ILIKE 'kirk@bennett-solutions.com' AND state IS NULL;

-- Update Lukas Baker
UPDATE advisors
SET state = 'PA', city = 'Butler', address_1 = '541 Sunset Drive', zipcode = '16001'
WHERE email ILIKE 'lukas@consultbaker.com' AND state IS NULL;

-- Update Ruby Yu Deng
UPDATE advisors
SET state = 'TX', city = 'Houston', address_1 = '9004 Lakes At 610 Dr', zipcode = '77054'
WHERE email ILIKE 'yudeng0320@gmail.com' AND state IS NULL;

-- Update Mel Fonseca
UPDATE advisors
SET state = 'AZ', city = 'Anthem', address_1 = '2331 W Shinnecock Ct', zipcode = '85086'
WHERE email ILIKE 'melfonseca@hsaforamerica.com' AND state IS NULL;

-- Update Mark Smith
UPDATE advisors
SET state = 'CO', city = 'Ft. Collins', address_1 = '1001-A E. Harmony Road', zipcode = '46220'
WHERE email ILIKE 'marksmith@hsaforamerica.com' AND state IS NULL;

-- Update Paul Cholak
UPDATE advisors
SET state = 'FL', city = 'Boynton Beach', address_1 = '11632 Dove Hollow Avenue', zipcode = '33437'
WHERE email ILIKE 'pcholak@mpoweringbenefits.net' AND state IS NULL;

-- Update Kevin Michaels
UPDATE advisors
SET state = 'AZ', city = 'Chandler', address_1 = 'PO BOX 1360', zipcode = '85244-1360'
WHERE email ILIKE 'kevin@michaelsandassociates.com' AND state IS NULL;

-- Update Jonathan Masters
UPDATE advisors
SET state = 'TN', city = 'Franklin', address_1 = '134 Lancaster Dr', zipcode = '37064'
WHERE email ILIKE 'jmasters@myhst.com' AND state IS NULL;

-- Update Analisa Cleland
UPDATE advisors
SET state = 'CO', city = 'HIGHLANDS RANCH', address_1 = '2944 East Clarion Dr.', zipcode = '80126'
WHERE email ILIKE 'analisa.cleland@gmail.com' AND state IS NULL;

-- Update Jeff Kanter (via related email)
UPDATE advisors
SET state = 'OH', city = 'Olmsted Falls', address_1 = 'PO Box 38186', zipcode = '44138'
WHERE email ILIKE 'jkanter@myahe.org' AND state IS NULL;

-- Update Donna Groskopf
UPDATE advisors
SET state = 'VA', city = 'Suffolk', address_1 = '2161 Humphreys Dr', zipcode = '23435'
WHERE email ILIKE 'coastalbreezeagency@gmail.com' AND state IS NULL;

-- Update David Hobbs
UPDATE advisors
SET state = 'VA', city = 'Mechanicsville', address_1 = '9038 Fayemont Dr', zipcode = '23116'
WHERE email ILIKE 'david.hobbs@goodshepherdbenefits.com' AND state IS NULL;

-- Update Michael Santa Maria
UPDATE advisors
SET state = 'AZ', city = 'Phoenix', address_1 = '2018 N Dayton St', zipcode = '85006'
WHERE email ILIKE 'micky@mysmia.com' AND state IS NULL;

-- Update Daniel Roose
UPDATE advisors
SET state = 'VA', city = 'Mechanicsville'
WHERE email ILIKE 'daniel.roose67@gmail.com' AND state IS NULL;

-- Update Cheryl Cobbin
UPDATE advisors
SET state = 'CA', city = 'Sacramento'
WHERE email ILIKE 'cheryl@cherylcobbin.com' AND state IS NULL;

-- Update Christine Corsini
UPDATE advisors
SET state = 'CA', city = 'San Francisco'
WHERE email ILIKE 'christinecorsini@hsaforamerica.com' AND state IS NULL;

-- Update Connie Jabara
UPDATE advisors
SET state = 'KS', city = 'Overland Park'
WHERE email ILIKE 'connie@sunflowerbenefitsgroup.com' AND state IS NULL;

-- Update Diane Border
UPDATE advisors
SET state = 'GA', city = 'Atlanta'
WHERE email ILIKE 'dianeborder1@gmail.com' AND state IS NULL;

-- Update James Ashford
UPDATE advisors
SET state = 'OK', city = 'Tulsa'
WHERE email ILIKE 'james@verusbenefits.com' AND state IS NULL;

-- Update Craig Becker
UPDATE advisors
SET state = 'AZ', city = 'Phoenix'
WHERE email ILIKE 'cbecker@beckerconsultingaz.com' AND state IS NULL;

-- Update Linda Samson
UPDATE advisors
SET state = 'AZ', city = 'Phoenix'
WHERE email ILIKE 'lindasamsoninsurancellc@gmail.com' AND state IS NULL;

-- Update Lloyd Allen
UPDATE advisors
SET state = 'AZ', city = 'Phoenix'
WHERE email ILIKE 'lloyd@consultant.com' AND state IS NULL;

-- Update Kori Allen
UPDATE advisors
SET state = 'AZ', city = 'Phoenix'
WHERE email ILIKE 'koriallen@consultant.com' AND state IS NULL;

-- Update Theresa Meigs
UPDATE advisors
SET state = 'CA', city = 'San Jose'
WHERE email ILIKE 'theresameigs@wle-secure-email.com' AND state IS NULL;

-- Update Thomas Matthews
UPDATE advisors
SET state = 'NE', city = 'Omaha'
WHERE email ILIKE 'tom@thomasamatthews.com' AND state IS NULL;

-- Update Christopher Owens
UPDATE advisors
SET state = 'TN', city = 'Memphis'
WHERE email ILIKE 'brad.owens@hcunlocked.com' AND state IS NULL;

-- Update Lance Schuttler
UPDATE advisors
SET state = 'IA', city = 'Des Moines'
WHERE email ILIKE 'lanceschuttler@gmail.com' AND state IS NULL;

-- Update Adam Jordano
UPDATE advisors
SET state = 'LA', city = 'New Orleans'
WHERE email ILIKE 'adam@mympb.com' AND state IS NULL;

-- Update Alyssa Burgos (Quality Benefit Solutions)
UPDATE advisors
SET state = 'CO', city = 'Denver'
WHERE email ILIKE 'qbsupport@qbs2.com' AND state IS NULL;

-- Update Angelica Valencia
UPDATE advisors
SET state = 'PA', city = 'Philadelphia'
WHERE email ILIKE 'rebalarney@mympb.com' AND state IS NULL;

-- Update Anthony Castillo
UPDATE advisors
SET state = 'CO', city = 'Colorado Springs'
WHERE email ILIKE 'tavasolutionsllc@gmail.com' AND state IS NULL;

-- Update Becky Otteman
UPDATE advisors
SET state = 'CO', city = 'Fort Collins'
WHERE email ILIKE 'beckyotteman@wle-secure-email.com' AND state IS NULL;

-- Update Catherine Okubo
UPDATE advisors
SET state = 'FL', city = 'Orlando'
WHERE email ILIKE 'catherine@mympb.com' AND state IS NULL;

-- Update Christopher Felix
UPDATE advisors
SET state = 'CA', city = 'Riverside'
WHERE email ILIKE 'christopherfelix@mympb.com' AND state IS NULL;

-- Update Christopher Hotchkiss
UPDATE advisors
SET state = 'FL', city = 'Jacksonville'
WHERE email ILIKE 'chris.hotchkiss80@gmail.com' AND state IS NULL;

-- Update Claudia Disabato
UPDATE advisors
SET state = 'CA', city = 'Los Angeles'
WHERE email ILIKE 'contact@carechoicesolutions.com' AND state IS NULL;

-- Update Daniel Crawford
UPDATE advisors
SET state = 'UT', city = 'Salt Lake City'
WHERE email ILIKE 'dan@lakepointins.com' AND state IS NULL;

-- Update Daniel Wiegman
UPDATE advisors
SET state = 'WI', city = 'Madison'
WHERE email ILIKE 'weigmanrd@yahoo.com' AND state IS NULL;

-- Update David Ivery
UPDATE advisors
SET state = 'FL', city = 'Sarasota'
WHERE email ILIKE 'daveivery@gmail.com' AND state IS NULL;

-- Update DeBora Kroger
UPDATE advisors
SET state = 'MI', city = 'Detroit'
WHERE email ILIKE 'dakrogerassociates@gmail.com' AND state IS NULL;

-- Update Elizabeth Mullison (Betsy)
UPDATE advisors
SET state = 'CO', city = 'Denver'
WHERE email ILIKE 'betsy@simplyinsuranceforyou.com' AND state IS NULL;

-- Update Guy Travis
UPDATE advisors
SET state = 'FL', city = 'Fort Lauderdale'
WHERE email ILIKE 'gtravis9@gmail.com' AND state IS NULL;

-- Update Hari Cheedella
UPDATE advisors
SET state = 'SC', city = 'Columbia'
WHERE email ILIKE 'hari.cheedella@suseela.net' AND state IS NULL;

-- Update Jacob Martin
UPDATE advisors
SET state = 'CO', city = 'Denver'
WHERE email ILIKE 'martinmaker@gmail.com' AND state IS NULL;

-- Update James Childs
UPDATE advisors
SET state = 'GA', city = 'Atlanta'
WHERE email ILIKE 'jimchildsagency@gmail.com' AND state IS NULL;

-- Update Jamie Joeyen-Waldorf
UPDATE advisors
SET state = 'MI', city = 'Detroit'
WHERE email ILIKE 'jamie@care4creatives.com' AND state IS NULL;

-- Update Jan Capodi
UPDATE advisors
SET state = 'CT', city = 'Hartford'
WHERE email ILIKE 'yourchoicellc@gmail.com' AND state IS NULL;

-- Update Jean Mario Casseus
UPDATE advisors
SET state = 'FL', city = 'Miami'
WHERE email ILIKE 'mejoresllc@gmail.com' AND state IS NULL;

-- Update Jennifer Pollock
UPDATE advisors
SET state = 'CO', city = 'Denver'
WHERE email ILIKE 'jennifer@simplyinsuranceforyou.com' AND state IS NULL;

-- Update Jerry Webber
UPDATE advisors
SET state = 'MN', city = 'Minneapolis'
WHERE email ILIKE 'jerrywebber720@gmail.com' AND state IS NULL;

-- Update Jerry Fetta
UPDATE advisors
SET state = 'AK', city = 'Anchorage'
WHERE email ILIKE 'jerry@jerryfetta.com' AND state IS NULL;

-- Update Kieffer Insurance Group (Christine)
UPDATE advisors
SET state = 'PA', city = 'Philadelphia'
WHERE email ILIKE 'fitbychristine@gmail.com' AND state IS NULL;

-- Update Reba Larney
UPDATE advisors
SET state = 'FL', city = 'Delray Beach'
WHERE email ILIKE 'rebalarney@mympb.com' AND state IS NULL;

-- Update Andrew Malishenko
UPDATE advisors
SET state = 'CO', city = 'Denver'
WHERE email ILIKE 'andrew@malishenko.com' AND state IS NULL;

-- Update Christopher Jaffe
UPDATE advisors
SET state = 'IN', city = 'Indianapolis'
WHERE email ILIKE 'christopherjaffe@gmail.com' AND state IS NULL;

-- Update Health For You Insurance
UPDATE advisors
SET state = 'FL', city = 'Orlando'
WHERE email ILIKE 'healthforyou_orlando@icloud.com' AND state IS NULL;

-- Update Mark Enis
UPDATE advisors
SET state = 'MS', city = 'Jackson'
WHERE email ILIKE 'mark@thempegroup.com' AND state IS NULL;

-- Update Daniel Henbest
UPDATE advisors
SET state = 'FL', city = 'West Palm Beach'
WHERE email ILIKE 'leonardo@mympb.con' AND state IS NULL;

-- ============================================================================
-- Verification: Log the number of advisors with state data
-- ============================================================================

-- This will help us verify the migration was successful
DO $$
DECLARE
  total_advisors INT;
  advisors_with_state INT;
  unique_states INT;
BEGIN
  SELECT COUNT(*) INTO total_advisors FROM advisors WHERE is_active = true;
  SELECT COUNT(*) INTO advisors_with_state FROM advisors WHERE is_active = true AND state IS NOT NULL;
  SELECT COUNT(DISTINCT state) INTO unique_states FROM advisors WHERE is_active = true AND state IS NOT NULL;

  RAISE NOTICE 'Migration complete:';
  RAISE NOTICE '  Total active advisors: %', total_advisors;
  RAISE NOTICE '  Advisors with state data: %', advisors_with_state;
  RAISE NOTICE '  Unique states represented: %', unique_states;
END $$;
