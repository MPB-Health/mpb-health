-- Seed 10 bulletin articles scraped from https://advisor.mpb.health/bulletin/
-- First, get category IDs (use existing categories or create a default one)

-- Ensure we have a "Bulletin" category
INSERT INTO advisor_content_categories (name, slug, description, display_order)
VALUES ('Bulletin', 'bulletin', 'Regular advisor bulletins', 1)
ON CONFLICT (slug) DO NOTHING;
-- Ensure we have an "Important Messages" category
INSERT INTO advisor_content_categories (name, slug, description, display_order)
VALUES ('Important Messages', 'important-messages', 'Critical advisor updates', 2)
ON CONFLICT (slug) DO NOTHING;
-- ============================================================================
-- Article 1: Advisor Bulletin: December 24, 2025
-- ============================================================================
INSERT INTO advisor_content (title, slug, excerpt, content, content_type, category_id, published_date, is_published, is_featured, view_count, metadata)
VALUES (
  'Advisor Bulletin: December 24, 2025',
  'advisor-bulletin-december-24-2025',
  'December 24, 2025 — "Like snowflakes, every agent brings something unique, and together we create something powerful." Updates on Annual Wellness Visits, Telehealth Transition, Enrollment Requirements, and more.',
  '<h2>December 24, 2025</h2>
<blockquote><p>"Like snowflakes, every agent brings something unique, and together we create something powerful."<br>— MPB Health</p></blockquote>

<h3>Updates:</h3>

<h4>Annual Wellness Visits:</h4>
<p><strong>Sedera – Premium HSA and Premium Care:</strong></p>
<ul>
<li>Immunizations: Yes. Youth immunizations and flu vaccines are shareable.</li>
<li>Wellness Visits: Not shareable. There is zero allowance for annual check-ups or wellness visits for adults or children.</li>
</ul>

<p><strong>Zion – Direct</strong></p>
<ul>
<li>Immunizations: Youth immunizations only</li>
<li>Wellness Visits: Yes. Includes a $175 annual allowance for a wellness visit.</li>
</ul>

<h4>Telehealth Transition:</h4>
<p>CirrusMD access will end on December 31st. It is imperative that you instruct all members to download the MPB Health App immediately to access their new telehealth services.</p>

<h4>Enrollment Requirement – Unique Emails:</h4>
<p>When enrolling members for the purpose of accessing telehealth services and opening needs, the PRIMARY member must use their own personal email address. Please do not use a spouse''s email address for the primary member.</p>

<h4>Enrollment Fee Waiver:</h4>
<p>To waive the $100 enrollment fee, please use the code <strong>100MPOWER</strong> during enrollment and be sure to click the "+" button after entering the code for it to apply.</p>

<h4>Welcome Call Extended Hours:</h4>
<p>To support the high volume of new enrollments, our Welcome Team is extending their availability. For January and February, Welcome Calls will be extended within the hours of 9:00am-4:00pm EST.</p>

<h4>App Benefits Start Date:</h4>
<p>Please advise your new Members that even though they are able to download the app upon enrollment, some of the services and benefits will NOT be available until their Start date (ID Cards, RX Valet, Virtual Care).</p>

<h4>Updated Member Forms:</h4>
<p>There are 2 Cognito Forms that have been archived since they are outdated:</p>
<ul>
<li>MPowering Benefits Existing Member Payment Update</li>
<li>MPowering Benefits Existing Member Change Form</li>
</ul>
<p>The updated forms are:</p>
<ul>
<li><a href="https://mpb.health/membership-changes/">Member Updates</a></li>
</ul>

<h4>Groups – Employee Changes:</h4>
<p>All change requests for members on List Bills need to come through the Employer. If an employee on a List Bill contacts you directly to make changes, please refer them back to their employer to initiate the request.</p>

<h3>Reminders:</h3>

<h4>2026 Pricing Effective Jan 1st:</h4>
<p>Membership Pricing will increase effective January 1, 2026. Please ensure you are using the updated 2026 rates. The minimum IUA will increase from $1000 to $1250 for New and Existing enrollments.</p>
<p>New Rates:</p>
<ul>
<li><a href="https://advisor.mpb.health/wp-content/uploads/2025/10/care.pdf">Care+ Price Sheet</a></li>
<li><a href="https://advisor.mpb.health/wp-content/uploads/2025/10/Direct.pdf">Direct Price Sheet</a></li>
<li><a href="https://advisor.mpb.health/wp-content/uploads/2025/10/securehsa.pdf">Secure HSA Price Sheet</a></li>
</ul>

<h4>Enrollment Deadline</h4>
<p>The enrollment deadline is 12am EST on the 20th of every month for a 1st of the following month effective date.</p>

<h4>MPB Health App</h4>
<p>Please continue to encourage your members to download the MPB Health App!!</p>
<p><a href="https://mpb.health/download-app">MPB Health App Download</a></p>

<h3>Rewards in Motion</h3>
<h4>MGM Grand Las Vegas!</h4>
<p>Open Enrollment is almost here, are you going to LAS VEGAS!? Let us know how we can support you!</p>',
  'bulletin',
  (SELECT id FROM advisor_content_categories WHERE slug = 'bulletin' LIMIT 1),
  '2025-12-24T12:00:00Z',
  true,
  true,
  0,
  '{}'
) ON CONFLICT (slug) DO NOTHING;
-- ============================================================================
-- Article 2: Advisor Bulletin: December 10, 2025
-- ============================================================================
INSERT INTO advisor_content (title, slug, excerpt, content, content_type, category_id, published_date, is_published, is_featured, view_count, metadata)
VALUES (
  'Advisor Bulletin: December 10, 2025',
  'advisor-bulletin-december-10-2025',
  'December 10, 2025 — Updates on App Benefits Start Date, Updated Member Forms, Booking Virtual Care Appointments, PHCS Provider Nominations, and 2026 pricing reminders.',
  '<h2>December 10, 2025</h2>
<blockquote><p>"Like snowflakes, every agent brings something unique, and together we create something powerful."<br>— MPB Health</p></blockquote>

<h3>Updates:</h3>

<h4>App Benefits Start Date:</h4>
<p>Please advise your new Members that even though they are able to download the app upon enrollment, some of the services and benefits will NOT be available until their Start date (ID Cards, RX Valet, Virtual Care/Telehealth).</p>

<h4>Updated Member Forms:</h4>
<p>There are 2 Cognito Forms that have been archived since they are outdated:</p>
<ul>
<li>MPowering Benefits Existing Member Payment Update</li>
<li>MPowering Benefits Existing Member Change Form</li>
</ul>
<p>The new forms are:</p>
<ul>
<li><a href="https://mpb.health/membership-changes/">Member Updates</a></li>
</ul>
<p>These forms are available on the MPB Health website &amp; in the Advisor Playbook.</p>

<h4>Booking Virtual Care Appointments on the MPB Health App:</h4>
<p>When booking consultations for Primary Care, Psychology and Psychiatry, members can choose several days/times to reduce having to go back and forth with the doctor. The new system was rolled out to all members Monday, December 8.</p>

<h4>PHCS – Nominating Providers to the Network:</h4>
<p>Keep in mind, even though there is a process to nominate a provider into PHCS network, it is up to the provider and the practice to join a network. This process usually takes between 90 to 120 days.</p>

<h4>Groups – Employee Changes:</h4>
<p>All change requests for members on List Bills need to come through the Employer. If an employee on a List Bill contacts you directly to make changes, please refer them back to their employer to initiate the request.</p>

<h3>Reminders:</h3>

<h4>Secure HSA, Care+ and Direct Price Increase:</h4>
<p>The updated 2026 pricing has been changed on the enrollment platform, in e123 and in marketing materials. Please view the changes and ensure you''re sharing the most current information.</p>
<p>The minimum IUA will increase from $1000 to $1250 for New and Existing enrollments.</p>
<p>New Rates:</p>
<ul>
<li><a href="https://advisor.mpb.health/wp-content/uploads/2025/10/care.pdf">Care+ Price Sheet</a></li>
<li><a href="https://advisor.mpb.health/wp-content/uploads/2025/10/Direct.pdf">Direct Price Sheet</a></li>
<li><a href="https://advisor.mpb.health/wp-content/uploads/2025/10/securehsa.pdf">Secure HSA Price Sheet</a></li>
</ul>

<h4>Enrollment Deadline</h4>
<p>The enrollment deadline is 12am EST on the 20th of every month for a 1st of the following month effective date.</p>

<h4>MPB Health App</h4>
<p>Please continue to encourage your members to download the MPB Health App!!</p>
<p><a href="https://mpb.health/download-app">MPB Health App Download</a></p>

<h3>Rewards in Motion</h3>
<h4>MGM Grand Las Vegas!</h4>
<p>Open Enrollment is almost here, are you going to LAS VEGAS!? Let us know how we can support you!</p>',
  'bulletin',
  (SELECT id FROM advisor_content_categories WHERE slug = 'bulletin' LIMIT 1),
  '2025-12-10T12:00:00Z',
  true,
  true,
  0,
  '{}'
) ON CONFLICT (slug) DO NOTHING;
-- ============================================================================
-- Article 3: Advisor Bulletin: November 26, 2025
-- ============================================================================
INSERT INTO advisor_content (title, slug, excerpt, content, content_type, category_id, published_date, is_published, is_featured, view_count, metadata)
VALUES (
  'Advisor Bulletin: November 26, 2025',
  'advisor-bulletin-november-26-2025',
  'November 26, 2025 — "Gratitude is not only the greatest of virtues, but the parent of all the others." Reminders on Freedom to Share Act, PHCS Network in Michigan, 2026 pricing, pre-existing conditions, and more.',
  '<h2>November 26, 2025</h2>
<blockquote><p>"Gratitude is not only the greatest of virtues, but the parent of all the others."<br>— Cicero</p></blockquote>

<h3>Reminders</h3>

<h4>Freedom to Share Act:</h4>
<p>Ohio has taken an important first step toward expanding healthcare freedom and flexibility. The Freedom to Share Act has passed the Ohio House and is now moving to the Senate for consideration, great news for those who value medical cost-sharing options and greater choice in how they manage and pay for their healthcare.</p>

<h4>PHCS Network in Michigan – Limitations:</h4>
<p>We have been informed by ARM Ltd. that there is a small region in Michigan without adequate network coverage with PHCS. We will be notifying Members in Michigan to contact MPB Concierge for a solution to their Preventive Screening needs before any procedure.</p>

<h4>Secure HSA, Care+ and Direct Price Increase:</h4>
<p>The updated 2026 pricing has been changed on the enrollment platform, in e123 and in marketing materials. The minimum IUA will increase from $1000 to $1250 for New and Existing enrollments.</p>
<ul>
<li><a href="https://advisor.mpb.health/wp-content/uploads/2025/10/care.pdf">Care+ Price Sheet</a></li>
<li><a href="https://advisor.mpb.health/wp-content/uploads/2025/10/Direct.pdf">Direct Price Sheet</a></li>
<li><a href="https://advisor.mpb.health/wp-content/uploads/2025/10/securehsa.pdf">Secure HSA Price Sheet</a></li>
</ul>

<h4>Pre-Existing Conditions (See Sharing Guidelines)</h4>
<p>If a member has been examined, diagnosed, treated, had symptoms, taken medication, or has an increased risk for a condition, it qualifies as a pre-existing and there will be no sharing in the first year.</p>
<p>Pre-ex sharing limits:</p>
<ul>
<li>Year 4 and beyond: Up to $125,000</li>
<li>Year 3: Up to $50,000</li>
<li>Year 2: Up to $25,000</li>
<li>Year 1: No sharing</li>
</ul>

<h4>Tobacco Use (See Sharing Guidelines)</h4>
<p>Members who use tobacco will incur a surcharge of between $50–$75 per month. Additionally, members over 50 who use tobacco will have reduced sharing benefits for major conditions.</p>

<h4>Maternity (See Sharing Guidelines)</h4>
<p><strong>Secure HSA, Care+, and Direct Plans:</strong> 6 month waiting period from Enrollment for conception.</p>
<p><strong>Premium Care &amp; Premium HSA:</strong> Delivery date must be at least nine months after enrollment.</p>

<h4>Needs After Enrollment and Prior to Effective Date:</h4>
<p><strong>Sedera (Premium Care &amp; Premium HSA):</strong> Any medical costs incurred after the enrollment date but prior to the start date are NOT shareable.</p>
<ul>
<li>It''s only new medical conditions that occur after enrollment and prior to start date that would not be considered pre-ex after start date.</li>
<li>If the ER visit pertains to an existing pre-ex, it will remain a pre-ex after the start date.</li>
<li>Any dates of service prior to the start date are not shareable.</li>
<li>If the event involves a new medical condition, that condition will not be treated as a pre-existing condition after the start date.</li>
</ul>

<h4>Membership Changes</h4>
<p>We are expecting a higher volume of membership changes during Open Enrollment season. Please have your members fill out the "Change Membership" section, specifying the membership they wish to switch to and their current membership name.</p>

<h4>MPB Health App</h4>
<p>Please encourage your members to download the MPB Health App!!</p>
<p><a href="https://mpb.health/download-mpbhealth-app/">MPB Health App Download</a></p>

<h3>Rewards in Motion</h3>
<h4>MGM Grand Las Vegas!</h4>
<p>Open Enrollment is almost here, are you going to LAS VEGAS!?</p>',
  'bulletin',
  (SELECT id FROM advisor_content_categories WHERE slug = 'bulletin' LIMIT 1),
  '2025-11-26T12:00:00Z',
  true,
  false,
  0,
  '{}'
) ON CONFLICT (slug) DO NOTHING;
-- ============================================================================
-- Article 4: Advisor Bulletin: November 12, 2025
-- ============================================================================
INSERT INTO advisor_content (title, slug, excerpt, content, content_type, category_id, published_date, is_published, is_featured, view_count, metadata)
VALUES (
  'Advisor Bulletin: November 12, 2025',
  'advisor-bulletin-november-12-2025',
  'November 12, 2025 — "Success is the sum of small efforts, repeated day in and day out." Reminders on enrollment deadlines, pre-existing conditions, maternity, 2026 rates, PHCS Minnesota, and MPB Health App.',
  '<h2>November 12, 2025</h2>
<blockquote><p>"Success is the sum of small efforts, repeated day in and day out."<br>— Robert Collier</p></blockquote>

<h3>Reminders</h3>

<h4>Enrollment Deadline</h4>
<p>The enrollment deadline is 12am EST on the 20th of every month for a 1st of the following month effective date.</p>

<h4>Pre-Existing Conditions (See Sharing Guidelines)</h4>
<p>If a member has been examined, diagnosed, treated, had symptoms, taken medication, or has an increased risk for a condition, it qualifies as a pre-existing and there will be no sharing in the first year.</p>
<p>Pre-ex sharing limits:</p>
<ul>
<li>Year 4 and beyond: Up to $125,000</li>
<li>Year 3: Up to $50,000</li>
<li>Year 2: Up to $25,000</li>
<li>Year 1: No sharing</li>
</ul>

<h4>Tobacco Use (See Sharing Guidelines)</h4>
<p>Members who use tobacco will incur a surcharge of between $50–$75 per month. Additionally, members over 50 who use tobacco will have reduced sharing benefits for major conditions.</p>

<h4>Maternity (See Sharing Guidelines)</h4>
<p><strong>Secure, Care+, and Direct Plans:</strong> 6 month waiting period from Enrollment for conception.</p>
<p><strong>Premium Plans:</strong> Delivery date must be at least nine months after enrollment.</p>

<h4>Needs After Enrollment and Prior to Effective Date:</h4>
<p><strong>Sedera:</strong> Any medical costs incurred after the enrollment date but prior to the start date are NOT shareable.</p>
<ul>
<li>New medical conditions after enrollment and prior to start date would not be considered pre-ex after start date.</li>
<li>If the ER visit pertains to an existing pre-ex, it will remain a pre-ex after the start date.</li>
<li>Any dates of service prior to the start date are not shareable.</li>
<li>If the event involves a new medical condition, that condition will not be treated as a pre-existing condition after the start date.</li>
</ul>

<h4>Membership Changes</h4>
<p>We are expecting a higher volume of membership changes during Open Enrollment season. Please have your members fill out the "Change Membership" section, specifying the membership they wish to switch to and their current membership name.</p>

<h4>PHCS – Minnesota</h4>
<p>Please note: The network is no longer available in Minnesota. We are awaiting updates on the solution.</p>

<h4>2026 NEW Rates</h4>
<p>Care+, Direct and Secure HSA will have a rate increase for January 1, 2026, billed on December 20, 2025. The minimum IUA will increase from $1000 to $1250.</p>
<ul>
<li><a href="https://advisor.mpb.health/wp-content/uploads/2025/10/care.pdf">Care+ Price Sheet</a></li>
<li><a href="https://advisor.mpb.health/wp-content/uploads/2025/10/Direct.pdf">Direct Price Sheet</a></li>
<li><a href="https://advisor.mpb.health/wp-content/uploads/2025/10/securehsa.pdf">Secure HSA Price Sheet</a></li>
</ul>

<h4>MPB Health App</h4>
<p>Members have access to unlimited, $0 virtual care through the MPB Health App, including:</p>
<ul>
<li>24/7/365 Virtual Urgent Care</li>
<li>Virtual Primary Care</li>
<li>Virtual Behavioral Health</li>
<li>Pet Telehealth</li>
<li>3 Free Virtual Dermatology Consults</li>
</ul>
<p><a href="https://mpb.health/download-mpbhealth-app/">MPB Health App Download</a></p>

<h3>Rewards in Motion</h3>
<h4>Advisor Referral Program</h4>
<p>Earn rewards while you grow your business! $50 when the Advisor Contracts. $50 more when they write their first enrollment.</p>
<h4>MGM Grand Las Vegas!</h4>
<p>Open Enrollment is almost here, are you going to LAS VEGAS!?</p>',
  'bulletin',
  (SELECT id FROM advisor_content_categories WHERE slug = 'bulletin' LIMIT 1),
  '2025-11-12T12:00:00Z',
  true,
  false,
  0,
  '{}'
) ON CONFLICT (slug) DO NOTHING;
-- ============================================================================
-- Article 5: Advisor Bulletin: October 28, 2025
-- ============================================================================
INSERT INTO advisor_content (title, slug, excerpt, content, content_type, category_id, published_date, is_published, is_featured, view_count, metadata)
VALUES (
  'Advisor Bulletin: October 28, 2025',
  'advisor-bulletin-october-28-2025',
  'October 28, 2025 — "The secret of change is to focus all your energy not on fighting the old, but on building the new." Reminders on IUA changes, pre-existing conditions, 2026 rates, and HR.1 changes.',
  '<h2>October 28, 2025</h2>
<blockquote><p>"The secret of change is to focus all your energy not on fighting the old, but on building the new."<br>– Socrates</p></blockquote>

<h3>Reminders</h3>

<h4>Changes to IUA</h4>
<p>Please note the rules for changes to IUA''s:</p>
<ul>
<li><strong>Sedera</strong> only allows Decreases to the IUA during the MPB open enrollment, which for our group is the month of May, for a June 1 start. Sedera allows Increases anytime during the year with no waiting periods.</li>
<li><strong>Zion</strong> allows changes to the IUA ONE time per year and if they are decreasing the IUA there is a 60-day waiting period.</li>
</ul>

<h4>Minor Pre-Ex</h4>
<p>If a member has minor pre-existing conditions, keep in mind that only the first year of the plan has zero benefit. In the 2nd year they will have $25k, 3rd year $50k and 4th year and beyond $125k.</p>

<h4>2026 NEW Rates</h4>
<p>Care+, Direct and Secure HSA will have a rate increase for January 1, 2026, billed on December 20, 2025. The minimum IUA will increase from $1000 to $1250.</p>
<ul>
<li><a href="https://advisor.mpb.health/wp-content/uploads/2025/10/care.pdf">Care+ Price Sheet</a></li>
<li><a href="https://advisor.mpb.health/wp-content/uploads/2025/10/Direct.pdf">Direct Price Sheet</a></li>
<li><a href="https://advisor.mpb.health/wp-content/uploads/2025/10/securehsa.pdf">Secure HSA Price Sheet</a></li>
</ul>

<h4>Advisor Requests to Concierge:</h4>
<p>When contacting Concierge regarding Prospect RX quotes needs, please be sure to add to the Members name "prospect" or add this in the comments. That way the Concierge team easily identifies them as a prospect versus a current member.</p>

<h4>Virtual Benefits</h4>
<p>Members have access to unlimited, $0 virtual care through the MPB Health App, including:</p>
<ul>
<li>24/7/365 Virtual Urgent Care</li>
<li>Virtual Primary Care</li>
<li>Virtual Behavioral Health</li>
<li>Pet Telehealth</li>
<li>3 Free Virtual Dermatology Consults</li>
</ul>
<p><a href="https://mpb.health/download-mpbhealth-app/">MPB Health App Download</a></p>

<h4>Member Changes:</h4>
<p>Please instruct Members to submit changes for January 1 after December 1 as they will not be processed until that time.</p>

<h4>HR.1 Changes – 1099K</h4>
<p>Form 1099-K is used to report payments received for goods or services that are processed through payment apps (like PayPal and Zelle), online marketplaces (like eBay), and credit cards. If an individual has 1099-K income, they can qualify for the Secure HSA. As always, the Member should consult with their tax professional.</p>

<h3>Rewards in Motion</h3>
<h4>Advisor Referral Program</h4>
<p>Earn rewards while you grow your business! $50 when the Advisor Contracts. $50 more when they write their first enrollment.</p>
<h4>MGM Grand Las Vegas!</h4>
<p>Open Enrollment is almost here, are you going to LAS VEGAS!?</p>',
  'bulletin',
  (SELECT id FROM advisor_content_categories WHERE slug = 'bulletin' LIMIT 1),
  '2025-10-28T12:00:00Z',
  true,
  false,
  0,
  '{}'
) ON CONFLICT (slug) DO NOTHING;
-- ============================================================================
-- Article 6: Advisor Bulletin: October 15, 2025
-- ============================================================================
INSERT INTO advisor_content (title, slug, excerpt, content, content_type, category_id, published_date, is_published, is_featured, view_count, metadata)
VALUES (
  'Advisor Bulletin: October 15, 2025',
  'advisor-bulletin-october-15-2025',
  'October 15, 2025 — "If you are not taking care of your customer, your competitor will." Updates on Sedera changes in Florida, Zion sharing request payments, pet telehealth, and alternative/functional guidelines.',
  '<h2>October 1st Half</h2>
<blockquote><p>"If you are not taking care of your customer, your competitor will."<br>– Bob Hooey</p></blockquote>

<h3>Updates</h3>

<h4>Sedera Changes in Florida</h4>
<p>Sedera and their legal counsel have advised that, due to Florida Statute § 624.1265, they will be unable to pay commissions on any new Florida business written after July 1, 2025. However, they will continue to pay commissions on business written prior to that date.</p>
<p>As a result, MPB Health has designated Florida as a no-sell state for Sedera plans (Premium Care and Premium HSA).</p>
<p><a href="https://advisor.mpb.health/wp-content/uploads/2025/09/No-Sell-States-Chart-9.pdf">No Sell States Chart</a></p>

<h4>Zion Sharing Request Payments</h4>
<p>Typical end-to-end processing time is about 60 days, depending on:</p>
<ul>
<li>Time required to obtain medical records (if needed)</li>
<li>How promptly the member uploads documents</li>
<li>How quickly the provider submits bills</li>
<li>Appeals of declined sharing decisions have no fixed timeline</li>
<li>Zion can process needs in as little as 2 weeks, however, times may vary</li>
</ul>

<h4>Pet Telehealth Disclaimer</h4>
<p>This service is not for medical emergencies or urgent situations. This service should not be considered veterinary care, and is not a substitute for professional veterinary care, diagnosis, treatment or prescription for your pet.</p>

<h4>Zion HealthShare Membership &amp; IUA Updates – Member Communications Schedule</h4>
<ul>
<li>October 27, 2025 — Email</li>
<li>November 11, 2025 — Newsletter</li>
<li>December 1, 2025 — Email &amp; Mailed notices to follow</li>
</ul>
<p>Price sheets:</p>
<ul>
<li><a href="https://advisor.mpb.health/wp-content/uploads/2025/10/care.pdf">Care+ Price Sheet</a></li>
<li><a href="https://advisor.mpb.health/wp-content/uploads/2025/10/Direct.pdf">Direct Price Sheet</a></li>
<li><a href="https://advisor.mpb.health/wp-content/uploads/2025/10/securehsa.pdf">Secure HSA Price Sheet</a></li>
</ul>

<h3>Alternative and Functional Guidelines</h3>

<h4>Zion HealthShare – Therapeutic Treatments</h4>
<p>When prescribed and performed by a licensed medical professional for a specific illness, injury, or disease, expenses for therapeutic treatments are eligible for sharing up to a maximum of $7,500 or 35 treatments per medical need. Therapeutic services include:</p>
<ul>
<li>Physical therapy</li>
<li>Massage therapy</li>
<li>Chiropractic treatments</li>
<li>Alternative therapies such as acupuncture, craniosacral therapy, dry needling, ozone treatments, prolotherapy</li>
</ul>

<h4>Sedera – Alternative Practices</h4>
<p>Unproven and insufficiently proven diagnostics and therapeutics are considered Alternative and are not Shareable. Alternative practice methods include ayurvedic, acupuncture, homeopathy, naturopathy, functional/integrative medicine, most use of CBD and all marijuana.</p>

<h3>Reminders</h3>

<h4>Enrollment Reminders</h4>
<ul>
<li>When enrolling a 26+ or new spouse/dependent, you must use a unique email and phone number.</li>
<li>When entering an EIN or Social Security Number for MEC/HSA plans, NO DASHES please.</li>
<li>Enrollments are due by 12 midnight on the 20th of the month.</li>
<li>Milestone Birthdays Increases – Members who age up to new age bands will have an increase for January 1, 2026.</li>
</ul>

<h3>Rewards in Motion</h3>
<h4>MGM Grand Las Vegas Contest</h4>
<p><a href="https://advisor.mpb.health/zion-healthshare-contest/">Leaderboard</a></p>',
  'bulletin',
  (SELECT id FROM advisor_content_categories WHERE slug = 'bulletin' LIMIT 1),
  '2025-10-15T12:00:00Z',
  true,
  false,
  0,
  '{}'
) ON CONFLICT (slug) DO NOTHING;
-- ============================================================================
-- Article 7: Note to Advisors: 2026 Rates & e123 Update in Progress
-- ============================================================================
INSERT INTO advisor_content (title, slug, excerpt, content, content_type, category_id, published_date, is_published, is_featured, view_count, metadata)
VALUES (
  'Note to Advisors: 2026 Rates & e123 Update in Progress',
  'note-to-advisors-2026-rates-e123-update-in-progress',
  'Price updates in progress on your enrollment platform. Selling January 1, 2026 effective dates? Give members a heads-up that rates have increased.',
  '<h2>Price updates in progress in your enrollment platform</h2>

<p>Dear MPB Health Advisors,</p>

<p>Selling January 1, 2026 effective dates? Give members a heads-up that rates have increased. Enrollment page rates aren''t updated yet for 1/1/2026 enrollments, we''re working to configure this in e123.</p>

<p>In the meantime, remind clients to take advantage of the lower membership rates they receive until Dec 20th, and encourage your active clients to download the new MPB Health app for easier access.</p>

<ul>
<li><a href="https://advisor.mpb.health/wp-content/uploads/2025/10/2026-prices-Care-Direct-Secure-HSA-2.pdf">Price sheets</a></li>
<li><a href="https://advisor.mpb.health/wp-content/uploads/2025/10/2026-prices-Care-Direct-Secure-HSA-Comparison-4.pdf">Comparison sheet</a></li>
</ul>

<p><strong>Reba Larney</strong><br>Business Development Director<br>(561) 922 9647<br>Rebalarney@mympb.com</p>',
  'bulletin',
  (SELECT id FROM advisor_content_categories WHERE slug = 'important-messages' LIMIT 1),
  '2025-11-01T12:00:00Z',
  true,
  false,
  0,
  '{}'
) ON CONFLICT (slug) DO NOTHING;
-- ============================================================================
-- Article 8: Important Update Regarding Price Increase 2026
-- ============================================================================
INSERT INTO advisor_content (title, slug, excerpt, content, content_type, category_id, published_date, is_published, is_featured, view_count, metadata)
VALUES (
  'Important Update Regarding Price Increase 2026',
  'important-update-regarding-price-increase-2026',
  'Care+, Secure HSA, and Direct will see modest price updates designed to maintain robust sharing for major needs and keep monthly amounts low as healthcare costs continue to rise.',
  '<h2>Pricing &amp; IUA updates and how to position it.</h2>

<p>Dear MPB Health Advisors,</p>

<p>Care+, Secure HSA, and Direct will see modest price updates designed to maintain robust sharing for major needs and keep monthly amounts low as healthcare costs continue to rise.</p>

<h3>Key updates and timing</h3>
<p><strong>Dec 20, 2025 (Billing):</strong> A modest monthly increase applies to Care+, Direct, and Secure HSA memberships.</p>
<p><strong>Jan 1, 2026 (IUA):</strong> Only members currently at a $1,000 IUA will update to $1,250 per medical Need. All other IUA levels are unchanged.</p>

<ul>
<li><a href="https://advisor.mpb.health/wp-content/uploads/2025/10/2026-prices-Care-Direct-Secure-HSA-2.pdf">Price sheets</a></li>
<li><a href="https://advisor.mpb.health/wp-content/uploads/2025/10/2026-prices-Care-Direct-Secure-HSA-Comparison-4.pdf">Comparison sheet</a></li>
</ul>

<h3>Positive positioning</h3>
<p>"These minor updates strengthen the community''s ability to share larger medical needs while keeping your monthly amount highly competitive."</p>
<p>"The IUA change affects only those at $1,000; if your IUA is different, you''re not impacted."</p>
<p>"Remember, the IUA only applies when you have a shareable Need. Once met, eligible expenses are shared by the community."</p>

<h3>Reminders</h3>
<p>When prospecting, remind clients to take advantage of the lower membership rates they receive until Dec 20th. Don''t forget to remind your clients to download the new MPB Health app for easier access.</p>

<p>Our memberships remain competitive in price and deliver significant savings versus traditional options. Keep prospecting, keep educating, and keep offering side-by-side comparisons. When clients see the numbers, we win on value.</p>

<p><strong>Your Expertise + Our Value = Wins</strong></p>

<p><strong>Reba Larney</strong><br>Business Development Director<br>(561) 922 9647<br>Rebalarney@mympb.com</p>',
  'bulletin',
  (SELECT id FROM advisor_content_categories WHERE slug = 'important-messages' LIMIT 1),
  '2025-10-20T12:00:00Z',
  true,
  true,
  0,
  '{}'
) ON CONFLICT (slug) DO NOTHING;
-- ============================================================================
-- Article 9: Important Update Regarding Sedera Plans in Florida
-- ============================================================================
INSERT INTO advisor_content (title, slug, excerpt, content, content_type, category_id, published_date, is_published, is_featured, view_count, metadata)
VALUES (
  'Important Update Regarding Sedera Plans in Florida',
  'important-update-regarding-sedera-plans-in-florida',
  'Important update regarding Sedera and the recent legislative changes in Florida. Due to Florida Statute § 624.1265, Sedera plans can no longer be sold by licensed health agents in Florida.',
  '<h2>Important Update Regarding Sedera Plans in Florida</h2>

<p>Dear MPB Health Advisors,</p>

<p>We wanted to inform you of an important update regarding Sedera and the recent legislative changes in Florida.</p>

<p>Sedera and their legal counsel have advised that, due to Florida Statute § 624.1265 concerning Religious Health Care Sharing Ministries, they will be unable to pay commissions on any new Florida business written after July 1, 2025. However, they will continue to pay commissions on business written prior to that date.</p>

<p>As a result of this development—and due to the fact that Sedera plans can no longer be sold by licensed health agents in Florida—MPB Health has designated Florida as a no-sell state for Sedera plans (Premium Care and Premium HSA).</p>

<p>We want to emphasize that this change does not affect other plans offered by MPB Health. Click to view our updated Do Not Sell States &amp; Individual Mandates chart.</p>

<p><a href="https://advisor.mpb.health/wp-content/uploads/2025/02/No-Sell-States-Chart3.png">NO SELL STATES</a></p>

<p>Thank you for your attention to this matter and your continued partnership.</p>

<p>Regards,</p>

<p><strong>Reba Larney</strong><br>Business Development Director<br>(561) 922 9647<br>Rebalarney@mympb.com</p>',
  'bulletin',
  (SELECT id FROM advisor_content_categories WHERE slug = 'important-messages' LIMIT 1),
  '2025-10-01T12:00:00Z',
  true,
  false,
  0,
  '{}'
) ON CONFLICT (slug) DO NOTHING;
-- ============================================================================
-- Article 10: Advisor Bulletin: September 24, 2025
-- ============================================================================
INSERT INTO advisor_content (title, slug, excerpt, content, content_type, category_id, published_date, is_published, is_featured, view_count, metadata)
VALUES (
  'Advisor Bulletin: September 24, 2025',
  'advisor-bulletin-september-24-2025',
  'September 24, 2025 — "Sell the problem you solve, not the product." Updates on Sedera in Florida, new landing pages, virtual behavioral health, and enrollment reminders.',
  '<h2>September 2nd Half</h2>
<blockquote><p>"Sell the problem you solve, not the product."<br>—Unknown</p></blockquote>

<h3>Updates</h3>

<h4>Sedera in Florida</h4>
<p>Florida has a new statute stating that Florida-licensed agents cannot sell religious Health Care Sharing Ministry plans (HCSMs). In light of this, Sedera may discontinue commissions on plans sold by a licensed FL agent to members in Florida. We do not have all the details yet, but expect those by next week. We will send a dedicated bulletin when we have the final decision from the Sedera legal team.</p>

<h4>New Landing Pages Coming Soon!</h4>
<p>We are optimizing the Advisor Landing Page and, once we have completed a peer review, we will have a training regarding this exciting update on the October 14 Advisor call.</p>

<h4>Virtual Behavioral Health</h4>
<p>MPB Health''s virtual behavioral health services are delivered through a national Employee Assistance Program (EAP) partner. After logging into the app, members are prompted to call 1-833-483-0831 to speak with an intake clinician, who will assess the situation and authorize an initial course of care—typically six sessions. Within 24 hours, members receive a list of available local practitioners along with appointment times.</p>
<p>The number of sessions may be extended at the provider''s discretion based on the member''s clinical needs. Providers may also recommend ongoing care with a psychologist to support optimal treatment and outcomes.</p>
<p>There is no annual limit on clinically appropriate utilization of behavioral health.</p>

<h3>Reminders</h3>

<h4>Enrollments</h4>
<ul>
<li>When using the 100MPOWER code to waive the enrollment fee, the member must enter the code then click the Plus (+) sign to activate it.</li>
<li>When there is a Spouse or Dependent being entered on the 1st screen of the enrollment, use the Pencil on the second screen to enter the remaining information for the dependent.</li>
<li>When enrolling a MEC plan member, do not use dashes when filling out the EIN/SSN number box.</li>
<li>Enrollments are due by 12 midnight on the 20th of the month. This is a firm deadline.</li>
<li>MEC/HSA Enrollments require that the Member be a Sole Proprietor and have a Social Security Number or EIN or be a 1099 Contractor.</li>
<li>Dependent members who get married must have their own membership and can no longer be on their parents'' plan.</li>
</ul>

<h3>Rewards in Motion</h3>
<h4>MGM Grand Las Vegas Contest</h4>
<p><a href="https://advisor.mpb.health/zion-healthshare-contest/">Leaderboard</a></p>
<h4>Google Reviews</h4>
<p>Receive 5 or more Google reviews from members &amp; get dinner on us!</p>
<p><a href="https://mpb.health/review-us/">Review Us</a></p>',
  'bulletin',
  (SELECT id FROM advisor_content_categories WHERE slug = 'bulletin' LIMIT 1),
  '2025-09-24T12:00:00Z',
  true,
  false,
  0,
  '{}'
) ON CONFLICT (slug) DO NOTHING;
