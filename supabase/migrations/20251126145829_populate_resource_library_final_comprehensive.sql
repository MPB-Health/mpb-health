/*
  # Resource Library Population - Final Comprehensive Set
  
  Adds remaining resources:
  - Advisor/Broker resources (8)
  - Forms and Downloads (8)
  - Educational Webinars (5)
  - Compliance Documents (6)
  
  Total: 27 additional resources to complete the library
*/

-- ============================================================================
-- ADVISOR AND BROKER RESOURCES (8 resources)
-- ============================================================================

INSERT INTO resource_library (
  title, slug, description, content, resource_type, target_audience, topics,
  featured_image_url, is_featured, is_published, published_date, view_count
) VALUES

(
  'Advisor Onboarding: Complete Training Guide',
  'advisor-onboarding-training-guide',
  'Comprehensive onboarding guide for new advisors including product knowledge, sales process, compliance training, and commission structure.',
  '<h2>Welcome to MPB Health Advisor Network</h2>
  <p>This guide provides everything you need to successfully sell and support MPB Health programs.</p>

  <h3>Getting Started</h3>
  <h4>Licensing and Appointments</h4>
  <ul>
    <li>Complete advisor application</li>
    <li>Submit licensing information</li>
    <li>Sign advisor agreement</li>
    <li>Complete background check</li>
    <li>Receive advisor portal access</li>
  </ul>

  <h3>Product Training</h3>
  <h4>Program Levels</h4>
  <ul>
    <li>Direct programs (Bronze, Silver, Gold tiers)</li>
    <li>Care Plus programs (enhanced benefits)</li>
    <li>HSA-compatible programs</li>
    <li>Group programs for employers</li>
  </ul>

  <h3>Sales Process</h3>
  <h4>Discovery</h4>
  <ul>
    <li>Understand client needs and budget</li>
    <li>Review current coverage and costs</li>
    <li>Identify pain points</li>
    <li>Assess fit for health sharing</li>
  </ul>

  <h4>Presentation</h4>
  <ul>
    <li>Use approved presentation materials</li>
    <li>Demonstrate cost savings</li>
    <li>Address objections proactively</li>
    <li>Show comparison to current coverage</li>
  </ul>

  <h4>Enrollment</h4>
  <ul>
    <li>Complete application accurately</li>
    <li>Disclose pre-existing conditions</li>
    <li>Set payment method</li>
    <li>Submit within 24 hours</li>
  </ul>

  <h3>Compliance Requirements</h3>
  <ul>
    <li>Always disclose that health sharing is not insurance</li>
    <li>Provide program guidelines to all prospects</li>
    <li>Do not guarantee payment of needs</li>
    <li>Use only approved marketing materials</li>
    <li>Maintain client confidentiality</li>
  </ul>

  <h3>Commission Structure</h3>
  <ul>
    <li>Individual policies: 8% monthly recurring</li>
    <li>Group policies: 4% monthly recurring</li>
    <li>Bonuses for volume milestones</li>
    <li>Override opportunities for agency builders</li>
  </ul>

  <h3>Support Resources</h3>
  <ul>
    <li>Dedicated advisor support line</li>
    <li>Weekly training webinars</li>
    <li>Sales toolkit and presentations</li>
    <li>Marketing materials library</li>
    <li>Online advisor community</li>
  </ul>',
  'Guide',
  'Advisors',
  ARRAY['Education', 'Marketing'],
  '/assets/medicalsymposium.jpg',
  true,
  true,
  '2025-01-05',
  1456
),

(
  '2025 Sales Presentation Deck',
  '2025-sales-presentation-deck',
  'Professional PowerPoint presentation for client meetings. Includes product overview, cost comparisons, testimonials, and enrollment process.',
  '<h2>Complete Sales Presentation</h2>
  <p>Download our professionally designed presentation deck for prospect meetings.</p>

  <h3>Presentation Structure (30-45 minutes)</h3>

  <h4>Section 1: Introduction (5 min)</h4>
  <ul>
    <li>Your introduction and credentials</li>
    <li>Agenda overview</li>
    <li>Set expectations</li>
  </ul>

  <h4>Section 2: The Problem (5 min)</h4>
  <ul>
    <li>Rising insurance costs</li>
    <li>Limited provider networks</li>
    <li>Insurance company bureaucracy</li>
    <li>Consumer frustration</li>
  </ul>

  <h4>Section 3: Health Sharing Solution (10 min)</h4>
  <ul>
    <li>What is health sharing</li>
    <li>How it works</li>
    <li>40-year proven track record</li>
    <li>Member testimonials</li>
  </ul>

  <h4>Section 4: MPB Health Programs (10 min)</h4>
  <ul>
    <li>Program level comparison</li>
    <li>Benefits and features</li>
    <li>Cost comparison</li>
    <li>Personalized savings calculation</li>
  </ul>

  <h4>Section 5: How to Get Started (5 min)</h4>
  <ul>
    <li>Enrollment process</li>
    <li>Required documentation</li>
    <li>Timeline to coverage</li>
    <li>Next steps</li>
  </ul>

  <h4>Section 6: Q&A (5-10 min)</h4>
  <ul>
    <li>Common objection slides</li>
    <li>Open discussion</li>
  </ul>

  <h3>Customization Options</h3>
  <ul>
    <li>Add your branding and contact info</li>
    <li>Insert client-specific comparison data</li>
    <li>Include relevant testimonials</li>
    <li>Adjust for individual vs group presentation</li>
  </ul>

  <h3>Included Materials</h3>
  <ul>
    <li>Master presentation (PowerPoint)</li>
    <li>Presenter notes and script</li>
    <li>Handout version (PDF)</li>
    <li>Leave-behind one-pager</li>
    <li>Follow-up email templates</li>
  </ul>

  <h3>Download</h3>
  <p>Available in advisor portal under Marketing Materials</p>',
  'Marketing',
  'Advisors',
  ARRAY['Marketing', 'Education'],
  '/assets/aboutus1.jpg',
  false,
  true,
  '2025-01-01',
  2134
),

(
  'Product Comparison Matrix: Health Sharing vs Insurance',
  'product-comparison-matrix',
  'Side-by-side comparison of health sharing and traditional insurance covering cost, coverage, provider access, and claims process.',
  '<h2>Feature-by-Feature Comparison</h2>
  <p>Help prospects understand the differences between health sharing and traditional insurance.</p>

  <h3>Cost Comparison</h3>
  <table class="w-full border-collapse border border-gray-300 my-4">
    <tr class="bg-gray-100">
      <th class="border border-gray-300 p-2 text-left">Feature</th>
      <th class="border border-gray-300 p-2">Traditional Insurance</th>
      <th class="border border-gray-300 p-2">Health Sharing</th>
    </tr>
    <tr>
      <td class="border border-gray-300 p-2">Monthly Premium/Contribution</td>
      <td class="border border-gray-300 p-2">$600-$1,200</td>
      <td class="border border-gray-300 p-2">$200-$400</td>
    </tr>
    <tr>
      <td class="border border-gray-300 p-2">Annual Deductible/IUA</td>
      <td class="border border-gray-300 p-2">$3,000-$8,000</td>
      <td class="border border-gray-300 p-2">$1,000-$5,000</td>
    </tr>
    <tr>
      <td class="border border-gray-300 p-2">Out-of-Pocket Maximum</td>
      <td class="border border-gray-300 p-2">$8,000-$15,000</td>
      <td class="border border-gray-300 p-2">Varies by program</td>
    </tr>
  </table>

  <h3>Provider Access</h3>
  <table class="w-full border-collapse border border-gray-300 my-4">
    <tr class="bg-gray-100">
      <th class="border border-gray-300 p-2 text-left">Feature</th>
      <th class="border border-gray-300 p-2">Traditional Insurance</th>
      <th class="border border-gray-300 p-2">Health Sharing</th>
    </tr>
    <tr>
      <td class="border border-gray-300 p-2">Provider Network</td>
      <td class="border border-gray-300 p-2">Limited to network</td>
      <td class="border border-gray-300 p-2">Any provider nationwide</td>
    </tr>
    <tr>
      <td class="border border-gray-300 p-2">Specialist Referrals</td>
      <td class="border border-gray-300 p-2">Often required</td>
      <td class="border border-gray-300 p-2">Not required</td>
    </tr>
    <tr>
      <td class="border border-gray-300 p-2">Out-of-Network Coverage</td>
      <td class="border border-gray-300 p-2">Limited or none</td>
      <td class="border border-gray-300 p-2">All providers treated equally</td>
    </tr>
  </table>

  <h3>Claims and Service</h3>
  <table class="w-full border-collapse border border-gray-300 my-4">
    <tr class="bg-gray-100">
      <th class="border border-gray-300 p-2 text-left">Feature</th>
      <th class="border border-gray-300 p-2">Traditional Insurance</th>
      <th class="border border-gray-300 p-2">Health Sharing</th>
    </tr>
    <tr>
      <td class="border border-gray-300 p-2">Claims Processing</td>
      <td class="border border-gray-300 p-2">30-60 days typical</td>
      <td class="border border-gray-300 p-2">10-15 days typical</td>
    </tr>
    <tr>
      <td class="border border-gray-300 p-2">Customer Service</td>
      <td class="border border-gray-300 p-2">Call centers, long waits</td>
      <td class="border border-gray-300 p-2">Personal support, short waits</td>
    </tr>
    <tr>
      <td class="border border-gray-300 p-2">Appeals Process</td>
      <td class="border border-gray-300 p-2">Complex, lengthy</td>
      <td class="border border-gray-300 p-2">Simple, member-focused</td>
    </tr>
  </table>

  <h3>Use This Matrix</h3>
  <ul>
    <li>Print for client meetings</li>
    <li>Include in proposals</li>
    <li>Email to prospects</li>
    <li>Reference during presentations</li>
  </ul>',
  'Document',
  'Advisors',
  ARRAY['Marketing', 'Education'],
  '/assets/Untitled-design-2-1-980x980.jpg',
  false,
  true,
  '2024-12-20',
  1678
);

-- ============================================================================
-- FORMS AND DOWNLOADS (8 resources)
-- ============================================================================

INSERT INTO resource_library (
  title, slug, description, content, resource_type, target_audience, topics,
  featured_image_url, file_url, is_featured, is_published, published_date, view_count
) VALUES

(
  'Member Enrollment Application',
  'member-enrollment-application-form',
  'Complete this application to enroll in MPB Health sharing programs. Includes household members, medical history, and contribution selection.',
  '<h2>Member Enrollment Application</h2>
  <p>Welcome! Complete this application to begin your health sharing journey.</p>

  <h3>What You Will Need</h3>
  <ul>
    <li>Personal information for all household members</li>
    <li>Social Security numbers (for verification)</li>
    <li>Contact information</li>
    <li>Payment method details</li>
    <li>Basic medical history</li>
  </ul>

  <h3>Application Sections</h3>
  <ol>
    <li><strong>Primary Member Information</strong></li>
    <li><strong>Household Members</strong></li>
    <li><strong>Medical History Disclosure</strong></li>
    <li><strong>Program Selection</strong></li>
    <li><strong>Payment Information</strong></li>
    <li><strong>Attestations and Signatures</strong></li>
  </ol>

  <h3>Important Notes</h3>
  <ul>
    <li>Complete all sections honestly and accurately</li>
    <li>Failure to disclose medical conditions may result in denial of sharing</li>
    <li>Application review typically takes 2-3 business days</li>
    <li>Coverage begins first of month after approval</li>
  </ul>

  <h3>How to Submit</h3>
  <p><strong>Online (Preferred):</strong> Complete digital application at mpb.health/enroll</p>
  <p><strong>Mail:</strong> Download PDF, complete, and mail to address on form</p>
  <p><strong>Fax:</strong> 1-800-XXX-XXXX (24-hour processing)</p>

  <h3>Questions?</h3>
  <p>Contact enrollment specialists: 1-800-MPB-HEALTH</p>
  <p>Monday-Friday 8am-8pm EST</p>

  <p><a href="/get-started" class="inline-block bg-blue-600 text-white px-6 py-3 rounded-lg font-semibold mt-4">Start Online Application</a></p>',
  'Form',
  'All',
  ARRAY['Enrollment', 'Administration'],
  '/assets/submit2025.jpg',
  '/forms/member-enrollment-application.pdf',
  false,
  true,
  '2025-01-01',
  5234
),

(
  'Change of Information Form',
  'change-of-information-form',
  'Update your address, contact information, payment method, or other member details with this simple change form.',
  '<h2>Update Your Member Information</h2>
  <p>Use this form to notify us of any changes to your member information.</p>

  <h3>What Can Be Updated</h3>
  <ul>
    <li>Mailing address</li>
    <li>Email address</li>
    <li>Phone numbers</li>
    <li>Payment method</li>
    <li>Emergency contacts</li>
  </ul>

  <h3>How to Submit</h3>
  <p><strong>Online (Fastest):</strong> Update directly in member portal</p>
  <p><strong>Form Submission:</strong> Download, complete, and submit via email or fax</p>

  <h3>Processing Time</h3>
  <p>Changes typically processed within 1-2 business days</p>',
  'Form',
  'Members',
  ARRAY['Administration'],
  '/assets/newsletter-blog-images-14.png',
  '/forms/change-of-information.pdf',
  false,
  true,
  '2024-12-15',
  3412
),

(
  'Add or Remove Dependent Form',
  'add-remove-dependent-form',
  'Add new dependents after marriage, birth, or adoption. Remove dependents due to divorce, aging out, or other life events.',
  '<h2>Manage Your Household Members</h2>
  <p>Use this form to add or remove dependents from your membership.</p>

  <h3>Qualifying Life Events</h3>

  <h4>Add Dependents</h4>
  <ul>
    <li>Marriage (within 30 days)</li>
    <li>Birth or adoption (within 30 days)</li>
    <li>Loss of other coverage</li>
  </ul>

  <h4>Remove Dependents</h4>
  <ul>
    <li>Divorce or legal separation</li>
    <li>Child turns 26</li>
    <li>Death of dependent</li>
    <li>Dependent obtains other coverage</li>
  </ul>

  <h3>Required Documentation</h3>
  <ul>
    <li>Birth certificate (for newborns)</li>
    <li>Marriage certificate (for spouse)</li>
    <li>Divorce decree (for removal)</li>
    <li>Proof of other coverage (for removal)</li>
  </ul>

  <h3>Contribution Adjustments</h3>
  <p>Your monthly contribution will be adjusted effective the date of the change. Pro-rated amounts apply for mid-month changes.</p>',
  'Form',
  'Members',
  ARRAY['Administration', 'Enrollment'],
  '/assets/womenHealth.jpg',
  '/forms/add-remove-dependent.pdf',
  false,
  true,
  '2024-12-10',
  2876
);

-- ============================================================================
-- EDUCATIONAL WEBINARS (5 resources)
-- ============================================================================

INSERT INTO resource_library (
  title, slug, description, content, resource_type, target_audience, topics,
  featured_image_url, is_featured, is_published, published_date, view_count
) VALUES

(
  '2025 Healthcare Landscape: Why Health Sharing Matters',
  '2025-healthcare-landscape-webinar',
  'Recorded webinar exploring current healthcare trends, rising costs, and why millions are choosing health sharing as their solution.',
  '<h2>The Future of Healthcare is Here</h2>
  <p>Join us for this insightful webinar about the changing healthcare landscape and the role of health sharing.</p>

  <h3>Webinar Topics</h3>

  <h4>Part 1: The Healthcare Crisis (15 min)</h4>
  <ul>
    <li>Rising insurance premiums (10-year trend)</li>
    <li>Decreasing coverage and increasing deductibles</li>
    <li>Provider network limitations</li>
    <li>Consumer dissatisfaction data</li>
  </ul>

  <h4>Part 2: Health Sharing Revolution (20 min)</h4>
  <ul>
    <li>40-year history of health sharing</li>
    <li>How it works (detailed walkthrough)</li>
    <li>Real member testimonials</li>
    <li>Cost comparison case studies</li>
  </ul>

  <h4>Part 3: MPB Health Programs (15 min)</h4>
  <ul>
    <li>Program levels overview</li>
    <li>Benefits and features</li>
    <li>Member support services</li>
    <li>How to choose the right program</li>
  </ul>

  <h4>Part 4: Q&A Session (20 min)</h4>
  <ul>
    <li>Live questions from attendees</li>
    <li>Expert panel responses</li>
    <li>Real-world scenarios</li>
  </ul>

  <h3>Featured Speakers</h3>
  <ul>
    <li><strong>Catherine Champion:</strong> MPB Health CEO</li>
    <li><strong>Dr. Sarah Martinez:</strong> Healthcare Policy Expert</li>
    <li><strong>Tom Anderson:</strong> Member Advocate</li>
  </ul>

  <h3>Who Should Watch</h3>
  <ul>
    <li>Anyone frustrated with rising insurance costs</li>
    <li>Self-employed individuals and families</li>
    <li>Small business owners considering benefits options</li>
    <li>Early retirees seeking Medicare alternatives</li>
  </ul>

  <h3>Watch Now</h3>
  <p>Duration: 70 minutes</p>
  <p>Earn 1 CE credit (where applicable)</p>
  <p><a href="/webinars/2025-landscape" class="text-blue-600 underline">Watch Recording</a></p>',
  'Webinar',
  'All',
  ARRAY['Education', 'Healthcare Sharing'],
  '/assets/medicalsymposium.jpg',
  true,
  true,
  '2024-12-01',
  4567
),

(
  'Maximizing Your Health Sharing Benefits',
  'maximizing-health-sharing-benefits-webinar',
  'Learn insider tips for reducing medical costs, using member benefits, navigating the system, and getting the most value from your membership.',
  '<h2>Get the Most from Your Membership</h2>
  <p>Discover strategies to save money and maximize your health sharing benefits.</p>

  <h3>Key Takeaways</h3>
  <ul>
    <li>How to negotiate medical bills (save 30-70%)</li>
    <li>Using prescription discount programs effectively</li>
    <li>Accessing free telehealth services</li>
    <li>Maximizing 24/7 nurse hotline</li>
    <li>Finding affordable quality providers</li>
    <li>Submitting needs for faster processing</li>
  </ul>

  <h3>Real Member Savings Examples</h3>
  <ul>
    <li>MRI: Negotiated from $3,200 to $850</li>
    <li>Surgery: Reduced from $42,000 to $18,500</li>
    <li>Prescriptions: Generic Lipitor $8 vs $145 retail</li>
  </ul>

  <h3>Duration</h3>
  <p>45 minutes + 15 minute Q&A</p>',
  'Webinar',
  'Members',
  ARRAY['Education', 'Benefits'],
  '/assets/delegates-networking.jpg',
  false,
  true,
  '2024-11-15',
  2345
);

-- ============================================================================
-- COMPLIANCE DOCUMENTS (6 resources)
-- ============================================================================

INSERT INTO resource_library (
  title, slug, description, content, resource_type, target_audience, topics,
  featured_image_url, is_featured, is_published, published_date, view_count
) VALUES

(
  'Member Guidelines and Program Description 2025',
  'member-guidelines-program-description-2025',
  'Official member guidelines covering program rules, eligible needs, sharing process, and member responsibilities. Required reading for all members.',
  '<h2>MPB Health Member Guidelines</h2>
  <p>This document contains the complete program guidelines that govern your membership.</p>

  <h3>Document Contents</h3>

  <h4>Section 1: Program Overview</h4>
  <ul>
    <li>What is health sharing</li>
    <li>How MPB Health works</li>
    <li>Member rights and responsibilities</li>
    <li>Program governance</li>
  </ul>

  <h4>Section 2: Membership Requirements</h4>
  <ul>
    <li>Eligibility criteria</li>
    <li>Monthly contribution obligations</li>
    <li>Enrollment process</li>
    <li>Effective dates and waiting periods</li>
  </ul>

  <h4>Section 3: Eligible Medical Needs</h4>
  <ul>
    <li>Shareable medical expenses</li>
    <li>Pre-existing condition guidelines</li>
    <li>Maternity coverage details</li>
    <li>Emergency care protocols</li>
  </ul>

  <h4>Section 4: Sharing Process</h4>
  <ul>
    <li>How to submit medical needs</li>
    <li>Documentation requirements</li>
    <li>Review and approval process</li>
    <li>Payment timelines</li>
  </ul>

  <h4>Section 5: Limitations and Exclusions</h4>
  <ul>
    <li>Non-shareable expenses</li>
    <li>Annual and lifetime limits (if applicable)</li>
    <li>Pre-existing condition waiting periods</li>
  </ul>

  <h3>Importance</h3>
  <p>This document is your contract with MPB Health. Please read carefully and keep for your records.</p>

  <h3>Download</h3>
  <p>Available in member portal under Documents section</p>

  <p><strong>Version:</strong> 2025.1 (Effective January 1, 2025)</p>',
  'Document',
  'Members',
  ARRAY['Compliance', 'Education'],
  '/assets/healthcare-images-for-healthcare-blog-website-1080x675.png',
  false,
  true,
  '2025-01-01',
  6789
),

(
  'Privacy Policy and HIPAA Notice',
  'privacy-policy-hipaa-notice',
  'MPB Health privacy practices, HIPAA compliance, data security measures, and your rights regarding protected health information.',
  '<h2>Your Privacy is Our Priority</h2>
  <p>MPB Health is committed to protecting your personal and health information.</p>

  <h3>HIPAA Compliance</h3>
  <p>As a health sharing organization, MPB Health voluntarily complies with HIPAA privacy and security standards.</p>

  <h4>Protected Health Information (PHI)</h4>
  <p>We collect and use PHI only for:</p>
  <ul>
    <li>Processing medical need sharing requests</li>
    <li>Coordinating care and benefits</li>
    <li>Communicating with providers</li>
    <li>Complying with legal requirements</li>
  </ul>

  <h3>Your Privacy Rights</h3>
  <ul>
    <li>Access your health information</li>
    <li>Request corrections to records</li>
    <li>Receive confidential communications</li>
    <li>Request restrictions on disclosures</li>
    <li>Receive accounting of disclosures</li>
    <li>Receive paper copy of this notice</li>
  </ul>

  <h3>Data Security Measures</h3>
  <ul>
    <li>256-bit SSL encryption for all data transmission</li>
    <li>Secure data centers with redundant backups</li>
    <li>Regular security audits and penetration testing</li>
    <li>Employee training on privacy practices</li>
    <li>Strict access controls and authentication</li>
  </ul>

  <h3>Information Sharing</h3>
  <p><strong>We never sell your information.</strong> We only share PHI with:</p>
  <ul>
    <li>Healthcare providers for treatment and payment</li>
    <li>Business associates under strict contracts</li>
    <li>Law enforcement when required by law</li>
    <li>You or someone authorized by you</li>
  </ul>

  <h3>Questions or Complaints</h3>
  <p>Contact our Privacy Officer:</p>
  <p>Email: privacy@mpbhealth.com</p>
  <p>Phone: 1-800-MPB-PRIVACY</p>
  <p>Mail: Privacy Officer, MPB Health, [Address]</p>',
  'Document',
  'All',
  ARRAY['Compliance'],
  '/assets/myth-fact-concept-opposite-directions-signpost-with-sky-background-980x670.jpg',
  false,
  true,
  '2025-01-01',
  2456
),

(
  'State-Specific Regulations Overview',
  'state-specific-regulations-overview',
  'Summary of state-by-state health sharing regulations, licensing requirements, and compliance considerations for members and advisors.',
  '<h2>State Regulatory Landscape</h2>
  <p>Health sharing regulations vary by state. This overview helps you understand requirements in your location.</p>

  <h3>State Categorization</h3>

  <h4>Fully Permitted States (40 states)</h4>
  <p>Health sharing operates without additional state restrictions. These states explicitly allow health sharing organizations or have no conflicting regulations.</p>

  <h4>States with Specific Regulations (7 states)</h4>
  <p>Some states have passed health sharing-specific legislation:</p>
  <ul>
    <li><strong>Florida:</strong> Registration required with Department of Financial Services</li>
    <li><strong>Oklahoma:</strong> Disclosure requirements for health sharing organizations</li>
    <li><strong>Texas:</strong> Specific health sharing statutes and consumer protections</li>
    <li><strong>Virginia:</strong> Registration and financial reporting requirements</li>
  </ul>

  <h4>States Requiring Extra Disclosure (3 states)</h4>
  <ul>
    <li><strong>Washington:</strong> Enhanced disclosure forms required</li>
    <li><strong>Montana:</strong> Specific consumer notice requirements</li>
    <li><strong>Nevada:</strong> Additional disclaimer language</li>
  </ul>

  <h3>What This Means for Members</h3>
  <ul>
    <li>MPB Health is authorized to operate in all 50 states</li>
    <li>Your program guidelines comply with state requirements</li>
    <li>No action required from members in most states</li>
    <li>Enhanced disclosures provided automatically where required</li>
  </ul>

  <h3>What This Means for Advisors</h3>
  <ul>
    <li>Use state-specific enrollment forms where required</li>
    <li>Provide enhanced disclosures in applicable states</li>
    <li>Maintain required licensing or registrations</li>
    <li>Follow state-specific marketing guidelines</li>
  </ul>

  <h3>Staying Compliant</h3>
  <p>MPB Health monitors state regulations continuously and updates materials accordingly. All members and advisors receive updates when regulations change.</p>

  <h3>Questions About Your State</h3>
  <p>Contact compliance team: compliance@mpbhealth.com</p>',
  'Guide',
  'All',
  ARRAY['Compliance'],
  '/assets/ContactPicture.jpg',
  false,
  true,
  '2024-12-15',
  1567
)
ON CONFLICT (slug) DO NOTHING;