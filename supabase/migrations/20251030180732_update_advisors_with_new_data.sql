/*
  # Update Advisors with New MPB Agent Landing Pages Data
  
  ## Summary
  This migration replaces all existing advisor data with the latest information from the 
  MPB Agent Landing Pages CSV file. The new data includes 125 active advisors with their
  contact information and landing page URLs.
  
  ## Changes Made
  1. Truncate the existing advisors table to remove old data
  2. Insert 125 new advisor records from the updated CSV
  3. All advisors are marked as active (is_active = true)
  4. All advisors have status set to 'Active Advisor'
  5. Agent IDs are generated from slugified landing page URLs for consistency
  
  ## Data Fields Populated
  - agent_id: Extracted from the landing page URL slug
  - first_name: Parsed from full name (where applicable)
  - last_name: Parsed from full name (where applicable)
  - company: Set to full name initially (can be updated later)
  - email: Primary contact email
  - phone_1: Primary phone number (cleaned format)
  - website_link: Landing page URL from joinmpb.com
  - agent_type: Set to 'Advisor' for all entries
  - status: Set to 'Active Advisor'
  - is_active: Set to true for all entries
  
  ## Security
  - RLS policies remain active and will control public access
  - Only advisors with is_active = true will be visible to public users
*/

-- Clear existing advisor data
TRUNCATE TABLE advisors CASCADE;

-- Reset the sequence to start fresh (optional but clean)
-- This ensures new UUIDs are generated

-- Insert new advisor data from MPB Agent Landing Pages CSV
-- Format: INSERT INTO advisors (agent_id, first_name, last_name, company, email, phone_1, website_link, agent_type, status, is_active)

INSERT INTO advisors (agent_id, first_name, last_name, company, email, phone_1, website_link, agent_type, status, is_active) VALUES
('andy', 'Andrew', 'Malishenko', 'Andrew Malishenko', 'Andrew@malishenko.com', '3038190697', 'https://joinmpb.com/andy/', 'Advisor', 'Active Advisor', true),
('cj', 'Christopher', 'Jaffe', 'Christopher Jaffe', 'Christopherjaffe@gmail.com', '8123456565', 'https://joinmpb.com/cj/', 'Advisor', 'Active Advisor', true),
('craigbecker', 'Craig', 'Becker', 'Craig Becker', 'cbecker@beckerconsultingaz.com', '4803637401', 'https://joinmpb.com/craigbecker/', 'Advisor', 'Active Advisor', true),
('healthforyou', NULL, NULL, 'Health For You Insurance', 'Healthforyou_orlando@icloud.com', '4077329685', 'https://joinmpb.com/healthforyou/#contact', 'Advisor', 'Active Advisor', true),
('lindasamson', 'Linda', 'Samson', 'Linda Samson', 'Lindasamsoninsurancellc@gmail.com', '4807035797', 'https://joinmpb.com/lindasamson/', 'Advisor', 'Active Advisor', true),
('lloyd', 'Lloyd', 'Allen', 'Lloyd Allen', 'lloyd@consultant.com', '6029201775', 'https://joinmpb.com/lloyd/', 'Advisor', 'Active Advisor', true),
('mpegroup', 'Mark', 'Enis', 'Mark Enis', 'Mark@thempegroup.com', '6623861840', 'https://joinmpb.com/mpegroup/', 'Advisor', 'Active Advisor', true),
('theresameigs', 'Theresa', 'Meigs', 'Theresa Meigs', 'Theresameigs@wle-secure-email.com', '4087727571', 'https://joinmpb.com/theresameigs/', 'Advisor', 'Active Advisor', true),
('thomasmatthews', 'Thomas', 'Matthews', 'Thomas Matthews', 'Tom@thomasamatthews.com', '4026796075', 'https://joinmpb.com/thomasmatthews/', 'Advisor', 'Active Advisor', true),
('bitcoinhsaio', 'William', 'Walton', 'William Walton', 'Richard@parallelhealtheconomy.com', '8066790816', 'https://joinmpb.com/bitcoinhsaio/', 'Advisor', 'Active Advisor', true),
('christopherowens', 'Christopher', 'Owens', 'Christopher Owens', 'Brad.owens@hcunlocked.com', '9014813164', 'https://joinmpb.com/christopherowens/#contact', 'Advisor', 'Active Advisor', true),
('henbesthealth', 'Daniel', 'Henbest', 'Daniel Henbest', 'leonardo@mympb.con', '5612863544', 'https://joinmpb.com/henbesthealth/', 'Advisor', 'Active Advisor', true),
('lanceschuttler', 'Lance', 'Schuttler', 'Lance Schuttler', 'Lanceschuttler@gmail.com', '5155713342', 'https://joinmpb.com/lanceschuttler/#contact', 'Advisor', 'Active Advisor', true),
('adamjordano', 'Adam', 'Jordano', 'Adam Jordano', 'Adam@mympb.com', '5044810304', 'https://joinmpb.com/adamjordano/', 'Advisor', 'Active Advisor', true),
('qualitybenefitsolutions', 'Alyssa', 'Burgos', 'Alyssa Burgos', 'qbsupport@qbs2.com', '7208329200', 'https://joinmpb.com/qualitybenefitsolutions/', 'Advisor', 'Active Advisor', true),
('amy-nielsen', 'Amy', 'Nielsen', 'Amy Nielsen', 'amy@nielsengroupllc.com', '9522109456', 'https://joinmpb.com/amy-nielsen/#contact', 'Advisor', 'Active Advisor', true),
('analisa-cleland', 'Analisa', 'Cleland', 'Analisa Cleland', 'analisa.cleland@gmail.com', '7202180667', 'https://joinmpb.com/analisa-cleland/', 'Advisor', 'Active Advisor', true),
('andrea-hinman', 'Andrea', 'Hinman', 'Andrea Hinman', 'akhinman1@protonmail.com', '3036992026', 'https://joinmpb.com/andrea-hinman/', 'Advisor', 'Active Advisor', true),
('angee', 'Angee', 'Montgomery', 'Angee Montgomery', 'angeemontgomery@gmail.com', '6624875888', 'https://joinmpb.com/angee/', 'Advisor', 'Active Advisor', true),
('referralsav', 'Angelica', 'Valencia', 'Angelica Valencia', 'Rebalarney@mympb.com', '6103316423', 'https://joinmpb.com/referralsav/', 'Advisor', 'Active Advisor', true),
('tavasolutions', 'Anthony', 'Castillo', 'Anthony Castillo', 'tavasolutionsllc@gmail.com', '7192717729', 'https://joinmpb.com/tavasolutions/', 'Advisor', 'Active Advisor', true),
('becky', 'Becky', 'Otteman', 'Becky Otteman', 'beckyotteman@wle-secure-email.com', '9704009686', 'https://joinmpb.com/becky/', 'Advisor', 'Active Advisor', true),
('bern-philipp', 'Bern', 'Philipp', 'Bern Philipp', 'bern@mympb.com', '5614457763', 'https://joinmpb.com/bern-philipp/', 'Advisor', 'Active Advisor', true),
('bev-garretson', 'Beverly', 'Garretson', 'Beverly Garretson', 'beverlyjgarretson@gmail.com', '9702495650', 'https://joinmpb.com/bev-garretson/', 'Advisor', 'Active Advisor', true),
('catherine', 'Catherine', 'Okubo', 'Catherine Okubo', 'catherine@mympb.com', NULL, 'https://joinmpb.com/catherine/', 'Advisor', 'Active Advisor', true),
('cheryl-cobbin', 'Cheryl', 'Cobbin', 'Cheryl Cobbin', 'cheryl@cherylcobbin.com', '9168371725', 'https://joinmpb.com/cheryl-cobbin/', 'Advisor', 'Active Advisor', true),
('christine-corsini', 'Christine', 'Corsini', 'Christine Corsini', 'christinecorsini@hsaforamerica.com', '4156865249', 'https://joinmpb.com/christine-corsini/', 'Advisor', 'Active Advisor', true),
('kieffer-insurance-group', 'Christine', 'Kieffer', 'Christine Kieffer', 'fitbychristine@gmail.com', '2156224236', 'https://joinmpb.com/kieffer-insurance-group/', 'Advisor', 'Active Advisor', true),
('christopherfelix', 'Christopher', 'Felix', 'Christopher Felix', 'Christopherfelix@mympb.com', '9513756478', 'https://joinmpb.com/christopherfelix/', 'Advisor', 'Active Advisor', true),
('christhotchkiss', 'Christopher', 'Hotchkiss', 'Christopher Hotchkiss', 'chris.hotchkiss80@gmail.com', '9049841060', 'https://joinmpb.com/christhotchkiss/', 'Advisor', 'Active Advisor', true),
('cindy-gordon', 'Cindy', 'Gordon', 'Cindy Gordon', 'Cindy@GordonHG.com', '6024237670', 'https://joinmpb.com/cindy-gordon/', 'Advisor', 'Active Advisor', true),
('carechoicesolutions', 'Claudia', 'Disabato', 'Claudia Disabato', 'contact@carechoicesolutions.com', '3234492717', 'https://joinmpb.com/carechoicesolutions/', 'Advisor', 'Active Advisor', true),
('conniejabara', 'Connie', 'Jabara', 'Connie Jabara', 'connie@sunflowerbenefitsgroup.com', '9135689277', 'https://joinmpb.com/conniejabara/', 'Advisor', 'Active Advisor', true),
('lakepointinsuranceagency', 'Daniel', 'Crawford', 'Daniel Crawford', 'dan@lakepointins.com', '8016997099', 'https://joinmpb.com/lakepointinsuranceagency/', 'Advisor', 'Active Advisor', true),
('daniel-roose', 'Daniel', 'Roose', 'Daniel Roose', 'daniel.roose67@gmail.com', '7577848560', 'https://joinmpb.com/daniel-roose/', 'Advisor', 'Active Advisor', true),
('daniel-wiegman', 'Daniel', 'Wiegman', 'Daniel Wiegman', 'weigmanrd@yahoo.com', '6085744266', 'https://joinmpb.com/daniel-wiegman/', 'Advisor', 'Active Advisor', true),
('darius-kohanim', 'Darius', 'Kohanim', 'Darius Kohanim', 'truehealthsolutions@gmail.com', '3034594167', 'https://joinmpb.com/darius-kohanim/', 'Advisor', 'Active Advisor', true),
('goodshepherdbenefits', 'David', 'Hobbs', 'David Hobbs', 'david.hobbs@goodshepherdbenefits.com', '8046251240', 'https://joinmpb.com/goodshepherdbenefits/', 'Advisor', 'Active Advisor', true),
('daveivery', 'David', 'Ivery', 'David Ivery', 'Daveivery@gmail.com', '9412360809', 'https://joinmpb.com/daveivery/', 'Advisor', 'Active Advisor', true),
('debora', 'DeBora', 'Kroger', 'DeBora Kroger', 'dakrogerassociates@gmail.com', '3132838200', 'https://joinmpb.com/debora/', 'Advisor', 'Active Advisor', true),
('diane-border', 'Diane', 'Border', 'Diane Border', 'dianeborder1@gmail.com', '7703296658', 'https://joinmpb.com/diane-border/', 'Advisor', 'Active Advisor', true),
('donna-groskopf', 'Donna', 'Groskopf', 'Donna Groskopf', 'coastalbreezeagency@gmail.com', '4404742700', 'https://joinmpb.com/donna-groskopf/', 'Advisor', 'Active Advisor', true),
('betsy', 'Elizabeth', 'Mullison', 'Elizabeth Mullison', 'betsy@simplyinsuranceforyou.com', '7202910572', 'https://joinmpb.com/betsy/', 'Advisor', 'Active Advisor', true),
('foreveremployer', 'Eric', 'Patti', 'Eric Patti', 'info@foreveremployer.com', '9706578224', 'https://joinmpb.com/foreveremployer/#contact', 'Advisor', 'Active Advisor', true),
('guy-travis', 'Guy', 'Travis', 'Guy Travis', 'gtravis9@gmail.com', '9545401259', 'https://joinmpb.com/guy-travis/', 'Advisor', 'Active Advisor', true),
('hari_p_cheedella', 'Hari', 'Cheedella', 'Hari Cheedella', 'Hari.cheedella@suseela.net', '8037286698', 'https://joinmpb.com/hari_p_cheedella/', 'Advisor', 'Active Advisor', true),
('jacobmartin', 'Jacob', 'Martin', 'Jacob Martin', 'Martinmaker@gmail.com', '7204412898', 'https://joinmpb.com/jacobmartin/', 'Advisor', 'Active Advisor', true),
('jamesashford', 'James', 'Ashford', 'James Ashford', 'james@verusbenefits.com', '9186953080', 'https://joinmpb.com/jamesashford/', 'Advisor', 'Active Advisor', true),
('jimchildsagency', 'James', 'Childs', 'James Childs', 'Jimchildsagency@gmail.com', '7708405077', 'https://joinmpb.com/jimchildsagency/', 'Advisor', 'Active Advisor', true),
('care4creatives', 'Jamie', 'Joeyen-Waldorf', 'Jamie Joeyen-Waldorf', 'Jamie@care4creatives.com', '9347991152', 'https://joinmpb.com/care4creatives/', 'Advisor', 'Active Advisor', true),
('yourchoice', 'Jan', 'Capodi', 'Jan Capodi', 'yourchoicellc@gmail.com', '8604901482', 'https://joinmpb.com/yourchoice/', 'Advisor', 'Active Advisor', true),
('jane-kassel', 'Jane', 'Kassel', 'Jane Kassel', 'jane@kasselbenefits.com', '4802060203', 'https://joinmpb.com/jane-kassel/', 'Advisor', 'Active Advisor', true),
('casseus', 'Jean Mario', 'Casseus', 'Jean Mario Casseus', 'mejoresllc@gmail.com', '7866992143', 'https://joinmpb.com/casseus/', 'Advisor', 'Active Advisor', true),
('jeff-kanter', 'Jeff', 'Kanter', 'Jeff Kanter', 'jkanter@myahe.org', '4402836849', 'https://joinmpb.com/jeff-kanter/', 'Advisor', 'Active Advisor', true),
('simplyjen', 'Jennifer', 'Pollock', 'Jennifer Pollock', 'Jennifer@simplyinsuranceforyou.com', '3039162909', 'https://joinmpb.com/simplyjen/', 'Advisor', 'Active Advisor', true),
('jerome-webber', 'Jerry', 'Webber', 'Jerry Webber', 'jerrywebber720@gmail.com', '6516904397', 'https://joinmpb.com/jerome-webber/', 'Advisor', 'Active Advisor', true),
('jerryfetta', 'Jerry', 'Fetta', 'Jerry Fetta', 'Jerry@jerryfetta.com', '9074145337', 'https://joinmpb.com/jerryfetta/', 'Advisor', 'Active Advisor', true),
('jc-clark', 'Jill', 'Clark', 'Jill Clark', 'zen.insurance@gmail.com', '9703854763', 'https://joinmpb.com/jc-clark/', 'Advisor', 'Active Advisor', true),
('joanbadzik', 'Joan', 'Badzik', 'Joan Badzik', 'jrbadzik@gmail.com', '3034084494', 'https://joinmpb.com/joanbadzik/', 'Advisor', 'Active Advisor', true),
('joan-phelps', 'Joan', 'Phelps', 'Joan Phelps', 'joan@mympb.com', '5617159017', 'https://joinmpb.com/joan-phelps/', 'Advisor', 'Active Advisor', true),
('johnhayes', 'John Sadler', 'Hayes', 'John Sadler Hayes', 'sadlerhayes@gmail.com', '9144194335', 'https://joinmpb.com/johnhayes/#contact', 'Advisor', 'Active Advisor', true),
('john-jarman', 'John', 'Jarman', 'John Jarman', 'johnjarman@youracaguy.com', '4025751574', 'https://joinmpb.com/john-jarman/', 'Advisor', 'Active Advisor', true),
('jonathan-masters', 'Jonathan', 'Masters', 'Jonathan Masters', 'jmasters@myhst.com', '6159816242', 'https://joinmpb.com/jonathan-masters/', 'Advisor', 'Active Advisor', true),
('yourbenefitsteam', 'Joshua', 'Dougherty', 'Joshua Dougherty', 'carriers@yourbenefits.team', '3212340707', 'https://joinmpb.com/yourbenefitsteam/', 'Advisor', 'Active Advisor', true),
('ccis', 'Justin', 'Brogdon', 'Justin Brogdon', 'Justin@classiccityins.com', '7063407717', 'https://joinmpb.com/ccis/', 'Advisor', 'Active Advisor', true),
('justin-garrett', 'Justin', 'Garrett', 'Justin Garrett', 'justinimeinsurnace@gmail.com', '6157755881', 'https://joinmpb.com/justin-garrett/', 'Advisor', 'Active Advisor', true),
('karen-torsoe', 'Karen', 'Torsoe', 'Karen Torsoe', 'thehealthsharelady@icloud.com', '8456419123', 'https://joinmpb.com/karen-torsoe/', 'Advisor', 'Active Advisor', true),
('katelynlambert', 'Katelyn', 'Lambert', 'Katelyn Lambert', 'reignhealthandwealth@gmail.com', '5203973444', 'https://joinmpb.com/katelynlambert/', 'Advisor', 'Active Advisor', true),
('keithotoole', 'Keith', 'OToole', 'Keith OToole', 'keithotoole77@gmail.com', '3074137774', 'https://joinmpb.com/keithotoole/', 'Advisor', 'Active Advisor', true),
('kevin-michaels', 'Kevin', 'Michaels', 'Kevin Michaels', 'kevin@michaelsandassociates.com', '4809635509', 'https://joinmpb.com/kevin-michaels/#contact', 'Advisor', 'Active Advisor', true),
('bennett-solutions', 'Kirk', 'Bennett', 'Kirk Bennett', 'kirk@bennett-solutions.com', '4157375107', 'https://joinmpb.com/bennett-solutions/', 'Advisor', 'Active Advisor', true),
('kirstenvastine', 'Kirsten', 'Vastine', 'Kirsten Vastine', 'kirstenvastine@gmail.com', '8442031048', 'https://joinmpb.com/kirstenvastine/', 'Advisor', 'Active Advisor', true),
('kori-allen', 'Kori', 'Allen', 'Kori Allen', 'koriallen@consultant.com', '6024888210', 'https://joinmpb.com/kori-allen/#contact', 'Advisor', 'Active Advisor', true),
('yourlifeagent', 'Krista', 'McKnight', 'Krista McKnight', 'krista.mcknight@yourlifeagent.online', '8595153700', 'https://joinmpb.com/yourlifeagent/', 'Advisor', 'Active Advisor', true),
('leah-garcia', 'Leah', 'Garcia', 'Leah Garcia', 'leahgarciaceo@gmail.com', '4086250613', 'https://joinmpb.com/leah-garcia/', 'Advisor', 'Active Advisor', true),
('lesliealford', 'Leslie', 'Alford', 'Leslie Alford', 'lesliealford@hsaforamerica.com', '8009132776', 'https://joinmpb.com/lesliealford/', 'Advisor', 'Active Advisor', true),
('mindfulfamilyinsurance', 'Lindsay', 'Dougherty', 'Lindsay Dougherty', 'lindsay@mindfulfamilyinsurance.com', '7703775977', 'https://joinmpb.com/mindfulfamilyinsurance/', 'Advisor', 'Active Advisor', true),
('louis-spatafore-hsaforamerica', 'Louis', 'Spatafore', 'Louis Spatafore', 'louspatafore@wle-secure-email.com', '3042767246', 'https://joinmpb.com/louis-spatafore-hsaforamerica/', 'Advisor', 'Active Advisor', true),
('lukasbaker', 'Lukas', 'Baker', 'Lukas Baker', 'Lukas@consultbaker.com', '7245947648', 'https://joinmpb.com/lukasbaker/', 'Advisor', 'Active Advisor', true),
('maggie-roeder', 'Maggie', 'Roeder', 'Maggie Roeder', 'maggie@prismlh.com', '6159994788', 'https://joinmpb.com/maggie-roeder/', 'Advisor', 'Active Advisor', true),
('leo-mpb', 'Manza Jordano', 'Moraes', 'Manza Jordano Moraes', 'Leonardo@mympb.com', '7818565424', 'https://joinmpb.com/leo-mpb/', 'Advisor', 'Active Advisor', true),
('mark-smith', 'Mark', 'Smith', 'Mark Smith', 'marksmith@hsaforamerica.com', '8009130172', 'https://joinmpb.com/mark-smith/', 'Advisor', 'Active Advisor', true),
('marlon-acevedo', 'Marlon', 'Acevedo', 'Marlon Acevedo', 'marlonacevedo3000@gmail.com', '2392031511', 'https://joinmpb.com/marlon-acevedo/', 'Advisor', 'Active Advisor', true),
('healthplus', 'Matthew', 'Stone', 'Health Plus Advisors / Matthew Stone', 'info@healthplusadvisors.com', '8632133637', 'https://joinmpb.com/healthplus/', 'Advisor', 'Active Advisor', true),
('mel-fonseca-hsa-for-america', 'Mel', 'Fonseca', 'Mel Fonseca', 'melfonseca@hsaforamerica.com', '7206693167', 'https://joinmpb.com/mel-fonseca-hsa-for-america/', 'Advisor', 'Active Advisor', true),
('indipop', NULL, NULL, 'INDIPOP', 'melblatt@indipop.co', '4808185489', 'https://joinmpb.com/indipop/', 'Advisor', 'Active Advisor', true),
('sharewize', 'Michael', 'Cazayoux', 'Michael Cazayoux', 'Michaelcazayoux@gmail.com', '2277188977', 'https://joinmpb.com/sharewize/#contact', 'Advisor', 'Active Advisor', true),
('michael-dawson', 'Michael', 'Dawson', 'Michael Dawson', 'michaeldawson09@gmail.com', '6105877275', 'https://joinmpb.com/michael-dawson/', 'Advisor', 'Active Advisor', true),
('michael-montes-hsaforamerica', 'Michael', 'Montes', 'Michael Montes', 'mikemontes@hsaforamerica.com', '8009132195', 'https://joinmpb.com/michael-montes-hsaforamerica/', 'Advisor', 'Active Advisor', true),
('michycare', 'Michael', 'Santa Maria', 'Michael Santa Maria', 'Micky@mysmia.com', '6023209033', 'https://joinmpb.com/michycare/#contact', 'Advisor', 'Active Advisor', true),
('michael-schunk', 'Michael', 'Schunk', 'Michael Schunk', 'mike.schunk@ebafl.com', '9549319970', 'https://joinmpb.com/michael-schunk/', 'Advisor', 'Active Advisor', true),
('miriam-thomas', 'Miriam', 'Thomas', 'Miriam Thomas', 'mqthomas4@gmail.com', '8644386052', 'https://joinmpb.com/miriam-thomas/#contact', 'Advisor', 'Active Advisor', true),
('misty-berryman', 'Misty', 'Berryman', 'Misty Berryman', 'mistyberryman@hsaforamerica.com', '8063360875', 'https://joinmpb.com/misty-berryman/', 'Advisor', 'Active Advisor', true),
('nicolas', 'Nicolas', 'Baker', 'Nicolas Baker', 'Nicolas@consultbaker.com', '4125852950', 'https://joinmpb.com/nicolas/', 'Advisor', 'Active Advisor', true),
('simplyinsurance', 'Owen', 'Mullison', 'Owen Mullison', 'Omullison@gmail.com', '7204675669', 'https://joinmpb.com/simplyinsurance/', 'Advisor', 'Active Advisor', true),
('paul', 'Paul', 'Cholak', 'Paul Cholak', 'pcholak@mpoweringbenefits.net', '5617343884', 'https://joinmpb.com/paul/', 'Advisor', 'Active Advisor', true),
('wiswellins', 'Peter', 'Wiswell', 'Peter Wiswell', 'pete@wiswellinsurance.com', '3037198720', 'https://joinmpb.com/wiswellins/', 'Advisor', 'Active Advisor', true),
('reba', 'Reba', 'Larney', 'Reba Larney', 'Rebalarney@mympb.com', '6103316423', 'https://joinmpb.com/reba/', 'Advisor', 'Active Advisor', true),
('richardspaller', 'Richard', 'Spaller', 'Richard Spaller', 'rspaller@appreciationfinancial.com', '4402278040', 'https://joinmpb.com/richardspaller/', 'Advisor', 'Active Advisor', true),
('richard-willard', 'Richard', 'Willard', 'Richard Willard', 'gwillards@consultant.com', '8609893905', 'https://joinmpb.com/richard-willard/', 'Advisor', 'Active Advisor', true),
('robin-kemp', 'Robin', 'Kemp', 'Robin Kemp', 'Robin@kempbenefits.com', '7604347868', 'https://joinmpb.com/robin-kemp/', 'Advisor', 'Active Advisor', true),
('betterhealthcover', 'Rosana', 'Bowman', 'Rosana Bowman', 'betterhealthcover@gmail.com', '7864020233', 'https://joinmpb.com/betterhealthcover/', 'Advisor', 'Active Advisor', true),
('rubenc', 'Ruben', 'Coto', 'Ruben Coto', 'Rcoto@aol.com', '7862297634', 'https://joinmpb.com/rubenc/', 'Advisor', 'Active Advisor', true),
('ruby', 'Ruby Yu', 'Deng', 'Ruby Yu Deng', 'yudeng0320@gmail.com', '7132913902', 'https://joinmpb.com/ruby/', 'Advisor', 'Active Advisor', true),
('sally-thomsen', 'Sally', 'Thomsen', 'Sally Thomsen', 'sallyjthomsen@yahoo.com', '3302683704', 'https://joinmpb.com/sally-thomsen/', 'Advisor', 'Active Advisor', true),
('sarah-max', 'Sarah', 'Max', 'Sarah Max', 'maxmpowering@yahoo.com', '7576178580', 'https://joinmpb.com/sarah-max/', 'Advisor', 'Active Advisor', true),
('satvikreddy', 'Satvik', 'Reddy', 'Satvik Reddy', 'healthclearbenefits@gmail.com', '7817903945', 'https://joinmpb.com/satvikreddy/', 'Advisor', 'Active Advisor', true),
('stephen-cox', 'Stephen', 'Cox', 'Stephen Cox', 'stevecox47@gmail.com', '3036664453', 'https://joinmpb.com/stephen-cox/', 'Advisor', 'Active Advisor', true),
('stephen-remmel', 'Stephen', 'Remmel', 'Stephen Remmel', 'steve@remmelsolutions.com', '4085095315', 'https://joinmpb.com/stephen-remmel/', 'Advisor', 'Active Advisor', true),
('steve-ramona', 'Steve', 'Ramona', 'Steve Ramona', 'stever1961@gmail.com', '4082059865', 'https://joinmpb.com/steve-ramona//#contact', 'Advisor', 'Active Advisor', true),
('stuart-lubline', 'Stuart', 'Lubline', 'Stuart Lubline', 'slubline@hotmail.com', '2165447077', 'https://joinmpb.com/stuart-lubline/#contact', 'Advisor', 'Active Advisor', true),
('sunny', 'Sunny', 'Lee', 'Sunny Lee', 'sunny@thexler8.com', '2489896457', 'https://joinmpb.com/sunny/', 'Advisor', 'Active Advisor', true),
('terry', 'Terry', 'Silkman', 'Terry Silkman', 'terry@silkmanfinancial.com', '8015509225', 'https://joinmpb.com/terry/', 'Advisor', 'Active Advisor', true),
('thomas-lash', 'Thomas', 'Lash', 'Thomas Lash', 'lashagency@gmail.com', '6785170630', 'https://joinmpb.com/thomas-lash/', 'Advisor', 'Active Advisor', true),
('timothy-dayney', 'Timothy', 'Dayney', 'Timothy Dayney', 'dayneyagency@gmail.com', '7346466885', 'https://joinmpb.com/timothy-dayney/', 'Advisor', 'Active Advisor', true),
('traci-mccoid', 'Traci', 'McCoid', 'Traci McCoid', 'traci@heritageconsultinggroup.com', '2162422621', 'https://joinmpb.com/traci-mccoid/', 'Advisor', 'Active Advisor', true),
('aztracyinsurance', 'Tracy', 'Steiner', 'Tracy Steiner', 'Steinertracy@gmail.com', '6023209453', 'https://joinmpb.com/aztracyinsurance/', 'Advisor', 'Active Advisor', true),
('tupac-mpb', 'Tupac', 'Manzanarez', 'Tupac Manzanarez', 'manzanareztupac@gmail.com', '9546756899', 'https://joinmpb.com/tupac-mpb/', 'Advisor', 'Active Advisor', true),
('tyler-dalton', 'Tyler', 'Dalton', 'Tyler Dalton', 'TDALTON508@GMAIL.COM', '3347971012', 'https://joinmpb.com/tyler-dalton/', 'Advisor', 'Active Advisor', true),
('veronicaescosar', 'Veronica', 'Escosar', 'Veronica Escosar', 'veronicae@escochecks.com', '8188361748', 'https://joinmpb.com/veronicaescosar/', 'Advisor', 'Active Advisor', true),
('vrminsurance', 'Victoria', 'Reese-Ronk', 'Victoria Reese-Ronk', 'Victoria@vrminsurancegroup.com', '7729858873', 'https://joinmpb.com/vrminsurance/', 'Advisor', 'Active Advisor', true),
('wendy', 'Wendy', 'Scipione', 'Wendy Scipione', 'wendys@mympb.com', '7202591555', 'https://joinmpb.com/wendy/', 'Advisor', 'Active Advisor', true),
('whitney-kline', 'Whitney', 'Kline', 'Whitney Kline', 'WhitneyKline@HSAforAmerica.com', '7207411566', 'https://joinmpb.com/whitney-kline/', 'Advisor', 'Active Advisor', true),
('wiley-long-mpb', 'Wiley', 'Long', 'Wiley Long', 'wileylong@hsaforamerica.com', '8009130172', 'https://joinmpb.com/wiley-long-mpb/', 'Advisor', 'Active Advisor', true);

-- Add helpful comment
COMMENT ON TABLE advisors IS 'Contains MPB Health advisor directory with contact information and landing pages. Updated from MPB Agent Landing Pages CSV file.';