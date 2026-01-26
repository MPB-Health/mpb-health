/*
  # Resource Library Population - Member Resources Part 2
  
  Adds 13 additional member-focused resources covering:
  - Pre-existing conditions
  - Maternity care
  - Mental health
  - Preventive care
  - Member portal tutorials
  - Telehealth access
  - 24/7 nurse support
  - Dental and vision benefits
  - FAQs for new members
*/

INSERT INTO resource_library (
  title, slug, description, content, resource_type, target_audience, topics,
  featured_image_url, is_featured, is_published, published_date, view_count
) VALUES

(
  'Pre-Existing Conditions: What You Need to Know',
  'pre-existing-conditions-guide',
  'Clear explanation of how pre-existing conditions are handled in health sharing programs, including waiting periods and coverage options.',
  '<h2>Understanding Pre-Existing Conditions</h2>
  <p>We believe in transparency. Here is exactly how pre-existing conditions work in health sharing programs.</p>

  <h3>Definition</h3>
  <p>A pre-existing condition is any health condition you had before joining the health sharing program. This includes conditions that were:</p>
  <ul>
    <li>Diagnosed or treated</li>
    <li>Showed symptoms (even if undiagnosed)</li>
    <li>Required medication or medical advice</li>
  </ul>

  <h3>Coverage Approach</h3>
  <p>Most health sharing programs handle pre-existing conditions differently than traditional insurance:</p>

  <h4>Standard Waiting Period</h4>
  <p>Typically, pre-existing conditions have a waiting period before becoming eligible for sharing. Common structures:</p>
  <ul>
    <li>12-month waiting period for most conditions</li>
    <li>36-month waiting period for more serious conditions</li>
    <li>Some conditions may have permanent limitations</li>
  </ul>

  <h4>Exceptions</h4>
  <p>Conditions considered resolved or cured may not have waiting periods. For example:</p>
  <ul>
    <li>Successfully treated cancers in remission (varies by program)</li>
    <li>Conditions resolved for 12+ months</li>
    <li>Minor conditions that required one-time treatment</li>
  </ul>

  <h3>During the Waiting Period</h3>
  <p>You are still protected for:</p>
  <ul>
    <li>New medical needs unrelated to pre-existing conditions</li>
    <li>Accidents and injuries</li>
    <li>Preventive care (in some programs)</li>
    <li>Prescription discounts for maintenance medications</li>
  </ul>

  <h3>After the Waiting Period</h3>
  <p>Once your waiting period ends, the previously pre-existing condition becomes eligible for sharing just like any other medical need.</p>

  <h3>Important Notes</h3>
  <ul>
    <li>Always disclose pre-existing conditions during enrollment</li>
    <li>Non-disclosure can result in denial of sharing requests</li>
    <li>Review your specific program guidelines for details</li>
    <li>Contact member services with questions about specific conditions</li>
  </ul>',
  'Guide',
  'Members',
  ARRAY['Healthcare Sharing', 'Education', 'Enrollment'],
  '/assets/healthcare-images-for-healthcare-blog-website2-980x653.png',
  false,
  true,
  '2024-12-20',
  2156
),

(
  'Maternity and Newborn Care Coverage Guide',
  'maternity-newborn-care-guide',
  'Complete guide to maternity benefits, prenatal care, delivery, and newborn coverage in health sharing programs for growing families.',
  '<h2>Welcome Growing Families</h2>
  <p>Health sharing programs offer excellent maternity coverage for families planning to expand. Here is everything you need to know.</p>

  <h3>Maternity Waiting Period</h3>
  <p>Most programs require enrollment before conception:</p>
  <ul>
    <li>Typical waiting period: 10-12 months from enrollment</li>
    <li>Covers prenatal care, delivery, and postnatal care</li>
    <li>Must be enrolled before pregnancy begins</li>
  </ul>

  <h3>What is Covered</h3>
  <h4>Prenatal Care</h4>
  <ul>
    <li>Regular OB-GYN visits</li>
    <li>Ultrasounds and diagnostic testing</li>
    <li>Lab work and screenings</li>
    <li>Genetic counseling if medically necessary</li>
  </ul>

  <h4>Delivery</h4>
  <ul>
    <li>Hospital or birthing center delivery</li>
    <li>Vaginal delivery and C-section</li>
    <li>Anesthesia and medications</li>
    <li>Complications during delivery</li>
  </ul>

  <h4>Newborn Care</h4>
  <ul>
    <li>Hospital stay for healthy newborn</li>
    <li>Newborn screenings and tests</li>
    <li>NICU care if medically necessary</li>
    <li>Well-baby checks after discharge</li>
  </ul>

  <h3>Adding Baby to Coverage</h3>
  <p>Notify us within 30 days of birth to add your newborn to your membership. Coverage is typically effective from date of birth.</p>

  <h3>Typical Sharing Amounts</h3>
  <p>After your IUA, maternity needs are shared according to program guidelines. Many members report sharing amounts of:</p>
  <ul>
    <li>Uncomplicated vaginal delivery: $8,000-$12,000</li>
    <li>C-section delivery: $12,000-$18,000</li>
    <li>NICU care: Varies based on medical necessity</li>
  </ul>

  <h3>Planning Ahead</h3>
  <p><strong>Best Practice:</strong> Enroll at least one year before planning pregnancy to ensure full maternity coverage.</p>

  <h3>Support Resources</h3>
  <ul>
    <li>24/7 nurse hotline for pregnancy questions</li>
    <li>Provider negotiation services for delivery costs</li>
    <li>Maternity care coordinator to guide you</li>
    <li>Lactation consultant access (many programs)</li>
  </ul>',
  'Guide',
  'Members',
  ARRAY['Benefits', 'Healthcare Sharing'],
  '/assets/womenHealth.jpg',
  false,
  true,
  '2024-12-15',
  1745
),

(
  'Mental Health Resources and Support',
  'mental-health-resources-support',
  'Access mental health support services, counseling resources, crisis hotlines, and wellness programs available to MPB Health members.',
  '<h2>Your Mental Health Matters</h2>
  <p>We recognize that mental health is an essential part of overall wellbeing. Here are the resources available to support you.</p>

  <h3>Available Services</h3>

  <h4>24/7 Crisis Support</h4>
  <ul>
    <li><strong>National Suicide Prevention Lifeline:</strong> 988</li>
    <li><strong>Crisis Text Line:</strong> Text HOME to 741741</li>
    <li><strong>SAMHSA National Helpline:</strong> 1-800-662-4357</li>
  </ul>

  <h4>Telehealth Mental Health Services</h4>
  <p>Your membership includes access to licensed counselors and therapists via secure video or phone:</p>
  <ul>
    <li>Individual therapy sessions</li>
    <li>Couples counseling</li>
    <li>Family therapy</li>
    <li>Psychiatric medication management</li>
  </ul>

  <h3>What is Eligible for Sharing</h3>
  <p>Mental health coverage varies by program. Generally eligible:</p>
  <ul>
    <li>Acute mental health crises requiring hospitalization</li>
    <li>Intensive outpatient programs (IOP)</li>
    <li>Medication management for serious conditions</li>
    <li>Substance abuse treatment programs</li>
  </ul>

  <h3>Affordable Counseling Options</h3>
  <p>Even if not eligible for sharing, we can help you access affordable mental health care:</p>
  <ul>
    <li>Teletherapy providers with discounted member rates ($40-$80/session)</li>
    <li>Community mental health centers</li>
    <li>Sliding scale counselors</li>
    <li>Support groups and peer counseling</li>
  </ul>

  <h3>Wellness Programs</h3>
  <ul>
    <li>Stress management workshops</li>
    <li>Meditation and mindfulness resources</li>
    <li>Sleep hygiene education</li>
    <li>Nutrition and mental health connection</li>
  </ul>

  <h3>Getting Started</h3>
  <p>Contact member services to:</p>
  <ul>
    <li>Access telehealth counseling</li>
    <li>Find affordable local providers</li>
    <li>Understand what is eligible for sharing</li>
    <li>Get referrals to appropriate resources</li>
  </ul>',
  'Guide',
  'Members',
  ARRAY['Benefits', 'Healthcare Sharing', 'Education'],
  '/assets/rear-view-mature-woman-with-tattoo-980x653.jpg',
  false,
  true,
  '2024-12-10',
  1523
),

(
  'Preventive Care: What is Covered',
  'preventive-care-coverage-checklist',
  'Comprehensive checklist of preventive care services, wellness visits, and screenings available in your health sharing program.',
  '<h2>Stay Healthy with Preventive Care</h2>
  <p>Prevention is better than treatment. Here is what preventive services are available in your program.</p>

  <h3>Annual Wellness Visits</h3>
  <ul>
    <li>Annual physical examination</li>
    <li>Routine blood work and lab tests</li>
    <li>Blood pressure screening</li>
    <li>Cholesterol screening</li>
    <li>Diabetes screening (if at risk)</li>
  </ul>

  <h3>Age-Specific Screenings</h3>

  <h4>Adults (18-39)</h4>
  <ul>
    <li>Blood pressure check (annual)</li>
    <li>Cholesterol check (every 5 years)</li>
    <li>Diabetes screening (if at risk)</li>
    <li>Depression screening</li>
    <li>HIV screening (once, or more if at risk)</li>
  </ul>

  <h4>Adults (40-64)</h4>
  <ul>
    <li>All of the above, plus:</li>
    <li>Colorectal cancer screening (starting age 45)</li>
    <li>Mammogram (women, starting age 40)</li>
    <li>Prostate screening (men, discuss with doctor)</li>
    <li>Osteoporosis screening (women 65+, earlier if at risk)</li>
  </ul>

  <h4>Seniors (65+)</h4>
  <ul>
    <li>Continued cancer screenings</li>
    <li>Fall prevention assessment</li>
    <li>Hearing test</li>
    <li>Vision screening</li>
    <li>Cognitive assessment</li>
  </ul>

  <h3>Women Health</h3>
  <ul>
    <li>Annual well-woman visit</li>
    <li>Pap smear (every 3 years, ages 21-65)</li>
    <li>HPV test (starting age 30)</li>
    <li>Breast exam</li>
    <li>Mammogram (annually starting age 40)</li>
  </ul>

  <h3>Immunizations</h3>
  <p>Coverage varies by program. Check your specific program guidelines for:</p>
  <ul>
    <li>Flu shots</li>
    <li>Tdap (tetanus/diphtheria/pertussis)</li>
    <li>Shingles vaccine</li>
    <li>Pneumonia vaccine</li>
    <li>COVID-19 vaccines</li>
  </ul>',
  'Checklist',
  'Members',
  ARRAY['Benefits', 'Healthcare Sharing'],
  '/assets/diverse-people-active-dance-class-980x653.jpg',
  false,
  true,
  '2024-12-05',
  1678
),

(
  'Understanding Your Member Dashboard',
  'member-dashboard-tutorial',
  'Complete walkthrough of your online member portal, including how to view contributions, submit needs, update information, and access resources.',
  '<h2>Your Member Dashboard Guide</h2>
  <p>Your online member portal is your command center for all things health sharing. Here is how to make the most of it.</p>

  <h3>Logging In</h3>
  <p>Access your dashboard at mpb.health/member-portal</p>
  <ul>
    <li>Use the email address on file</li>
    <li>Create a secure password (if first time)</li>
    <li>Enable two-factor authentication for security</li>
  </ul>

  <h3>Dashboard Overview</h3>

  <h4>Home Screen</h4>
  <p>Your dashboard home shows:</p>
  <ul>
    <li>Contribution status and upcoming payments</li>
    <li>Active medical needs and sharing status</li>
    <li>Important notifications and alerts</li>
    <li>Quick access buttons for common tasks</li>
  </ul>

  <h4>My Profile</h4>
  <ul>
    <li>View and update contact information</li>
    <li>Manage household members</li>
    <li>Update payment methods</li>
    <li>Download ID cards</li>
    <li>Access digital prescription card</li>
  </ul>

  <h4>Submit Medical Need</h4>
  <p>Step-by-step wizard to submit new medical needs:</p>
  <ol>
    <li>Select need type (hospital, physician, pharmacy, etc.)</li>
    <li>Enter provider and service details</li>
    <li>Upload itemized bills and documentation</li>
    <li>Review and submit</li>
    <li>Track status in real-time</li>
  </ol>

  <h4>Mobile App</h4>
  <p>Download the MPB Health mobile app for on-the-go access:</p>
  <ul>
    <li>View ID cards</li>
    <li>Submit needs with your camera</li>
    <li>Check sharing status</li>
    <li>Contact support</li>
    <li>Find nearby providers</li>
  </ul>',
  'Guide',
  'Members',
  ARRAY['Education', 'Administration'],
  '/assets/businessTeamWorking.jpg',
  false,
  true,
  '2024-11-30',
  2012
),

(
  '24/7 Nurse Hotline: Your Health Partner',
  '247-nurse-hotline-access',
  'Learn how to access free 24/7 nurse support for medical questions, symptom guidance, and care recommendations anytime you need help.',
  '<h2>Free 24/7 Nurse Support</h2>
  <p>Every member has unlimited access to registered nurses 24 hours a day, 7 days a week, 365 days a year.</p>

  <h3>When to Call</h3>
  <ul>
    <li>You have symptoms and are not sure if you need to see a doctor</li>
    <li>Questions about medications or side effects</li>
    <li>Need guidance on caring for a sick family member</li>
    <li>Want to understand test results</li>
    <li>Deciding between ER, urgent care, or waiting for appointment</li>
    <li>Post-surgical care questions</li>
    <li>Child health concerns</li>
  </ul>

  <h3>What Nurses Can Help With</h3>
  <ul>
    <li>Symptom assessment and triage</li>
    <li>Medication information and interactions</li>
    <li>Care recommendations</li>
    <li>Health education</li>
    <li>Chronic condition management tips</li>
    <li>Wellness coaching</li>
  </ul>

  <h3>How to Access</h3>
  <p><strong>Phone:</strong> 1-800-MPB-NURSE (available in member portal)</p>
  <p><strong>Average Wait Time:</strong> Less than 2 minutes</p>
  <p><strong>Languages:</strong> English, Spanish, and translation services available</p>

  <h3>Real Examples</h3>
  <p><strong>Scenario 1:</strong> Your child has a fever at 2 AM. Call the nurse hotline for guidance on whether to go to ER or wait until morning.</p>
  <p><strong>Scenario 2:</strong> You are prescribed a new medication and want to know about potential side effects and interactions.</p>
  <p><strong>Scenario 3:</strong> You have back pain and want advice on home care versus seeing a doctor.</p>

  <h3>Cost Savings</h3>
  <p>Nurse hotline guidance helps members:</p>
  <ul>
    <li>Avoid unnecessary ER visits (average savings: $1,200)</li>
    <li>Get care at appropriate level</li>
    <li>Manage conditions at home when safe</li>
    <li>Make informed healthcare decisions</li>
  </ul>',
  'Guide',
  'Members',
  ARRAY['Benefits', 'Healthcare Sharing'],
  '/assets/ChatGPT-Image-Aug-29-2025-02_18_36-PM-980x653.jpg',
  false,
  true,
  '2024-11-25',
  1834
),

(
  'Telehealth Services: Complete Access Guide',
  'telehealth-services-access-guide',
  'How to access virtual doctor visits, online prescriptions, and telehealth services included with your MPB Health membership.',
  '<h2>Healthcare from Home</h2>
  <p>Your membership includes unlimited telehealth visits with licensed physicians for common health concerns.</p>

  <h3>What is Telehealth?</h3>
  <p>Telehealth allows you to see a doctor via video or phone consultation from anywhere, anytime. No appointment needed for most services.</p>

  <h3>Conditions Treated</h3>
  <ul>
    <li>Cold, flu, and allergies</li>
    <li>Sinus infections and bronchitis</li>
    <li>UTIs and bladder infections</li>
    <li>Skin conditions and rashes</li>
    <li>Pink eye and ear infections</li>
    <li>Minor injuries and burns</li>
    <li>Mental health consultations</li>
  </ul>

  <h3>Prescription Services</h3>
  <p>Telehealth doctors can prescribe medications when medically appropriate:</p>
  <ul>
    <li>Sent directly to your preferred pharmacy</li>
    <li>Usually ready within 1-2 hours</li>
    <li>Use your prescription discount card for savings</li>
  </ul>

  <h3>How to Access</h3>
  <p><strong>Mobile App:</strong> Download MPB Health Telehealth app</p>
  <p><strong>Website:</strong> Visit telehealth.mpbhealth.com</p>
  <p><strong>Phone:</strong> Call 1-800-TELEHEALTH</p>

  <h3>Cost</h3>
  <p><strong>Included with membership:</strong> Most consultations are covered with no additional fee</p>
  <p>Some specialized consultations may have a small copay (typically $10-20)</p>

  <h3>When to Use Telehealth vs In-Person</h3>

  <h4>Perfect for Telehealth</h4>
  <ul>
    <li>Non-emergency illnesses</li>
    <li>Follow-up visits</li>
    <li>Prescription refills</li>
    <li>Mental health consultations</li>
  </ul>

  <h4>Go In-Person When</h4>
  <ul>
    <li>You need a physical examination</li>
    <li>Lab work or imaging required</li>
    <li>Severe symptoms or emergencies</li>
    <li>Complex or chronic conditions</li>
  </ul>',
  'Guide',
  'Members',
  ARRAY['Benefits', 'Healthcare Sharing'],
  '/assets/healthsharing3.jpg',
  false,
  true,
  '2024-11-20',
  1923
),

(
  'Dental and Vision Discount Programs',
  'dental-vision-discount-programs',
  'Save on dental care, eye exams, glasses, and contact lenses with MPB Health discount programs. Network of 100,000+ providers nationwide.',
  '<h2>Dental and Vision Savings</h2>
  <p>Your membership includes access to nationwide dental and vision discount networks, helping you save on routine and specialty care.</p>

  <h3>Dental Discount Program</h3>

  <h4>Network Coverage</h4>
  <ul>
    <li>100,000+ participating dentists nationwide</li>
    <li>General dentists and specialists</li>
    <li>Most major metros and rural areas</li>
  </ul>

  <h4>Average Savings</h4>
  <ul>
    <li>Routine cleanings: 30-50% savings</li>
    <li>Fillings: 20-40% off</li>
    <li>Crowns and bridges: 30-50% savings</li>
    <li>Orthodontics: 20-30% discount</li>
    <li>Dentures: 30-40% savings</li>
  </ul>

  <h4>How to Use</h4>
  <ol>
    <li>Find a participating dentist on our provider directory</li>
    <li>Schedule appointment and mention MPB Health</li>
    <li>Present your dental discount card</li>
    <li>Pay discounted fee at time of service</li>
  </ol>

  <h3>Vision Discount Program</h3>

  <h4>Network Coverage</h4>
  <ul>
    <li>35,000+ vision providers</li>
    <li>Major retailers: LensCrafters, Pearle Vision, Target Optical</li>
    <li>Independent optometrists</li>
    <li>Online lens providers</li>
  </ul>

  <h4>Discounts Available</h4>
  <ul>
    <li>Eye exams: $20-40 (often under $50 total)</li>
    <li>Glasses: 20-60% off retail</li>
    <li>Contact lenses: 15-30% savings</li>
    <li>LASIK: Special member pricing</li>
  </ul>

  <h3>Access Your Cards</h3>
  <p>Both discount cards are available in your member portal. Download to your phone or print for your wallet.</p>

  <h3>Find Providers</h3>
  <p>Use our online provider directory to find participating dentists and vision providers near you. Filter by specialty, location, and ratings.</p>',
  'Document',
  'Members',
  ARRAY['Benefits', 'Healthcare Sharing'],
  '/assets/newsletter-blog-images-10.png',
  false,
  true,
  '2024-11-15',
  1456
),

(
  'Provider Negotiation Services: Save More',
  'provider-negotiation-services-guide',
  'Learn how our provider negotiation team can help you reduce medical bills by 30-70% before you pay, saving you thousands on healthcare costs.',
  '<h2>Let Us Negotiate for You</h2>
  <p>One of the most valuable member benefits is our provider negotiation team. They work to reduce your medical bills before you pay.</p>

  <h3>How It Works</h3>
  <ol>
    <li>You receive a medical bill</li>
    <li>Contact our negotiation team before paying</li>
    <li>We negotiate with the provider on your behalf</li>
    <li>You pay the reduced amount</li>
  </ol>

  <h3>Average Savings</h3>
  <ul>
    <li>Hospital bills: 40-70% reduction</li>
    <li>Surgical procedures: 30-60% savings</li>
    <li>Imaging (MRI, CT): 50-80% off</li>
    <li>Lab work: 40-60% reduction</li>
  </ul>

  <h3>When to Use Negotiation Services</h3>
  <ul>
    <li>Before scheduled surgery or procedure</li>
    <li>After receiving a large hospital bill</li>
    <li>For expensive imaging or testing</li>
    <li>Emergency room visits</li>
    <li>Any bill over $500</li>
  </ul>

  <h3>Real Success Stories</h3>
  <p><strong>MRI Scan:</strong> Original bill $3,200 → Negotiated to $850 (73% savings)</p>
  <p><strong>Knee Surgery:</strong> Original bill $42,000 → Negotiated to $18,500 (56% savings)</p>
  <p><strong>ER Visit:</strong> Original bill $8,500 → Negotiated to $2,800 (67% savings)</p>

  <h3>Contact Negotiation Team</h3>
  <p>Phone: 1-800-MPB-NEGOTIATE</p>
  <p>Email: negotiate@mpbhealth.com</p>
  <p>Portal: Submit bill through member dashboard</p>

  <h3>Pro Tips</h3>
  <ul>
    <li>Always call before paying any large medical bill</li>
    <li>Request itemized bills to identify errors</li>
    <li>Ask about prompt pay discounts (5-20%)</li>
    <li>Negotiate before treatment when possible</li>
    <li>Use cash pay rates rather than insurance rates</li>
  </ul>',
  'Guide',
  'Members',
  ARRAY['Benefits', 'Healthcare Sharing', 'Administration'],
  '/assets/medical-cost-sharing-3-1-980x653.jpg',
  false,
  true,
  '2024-11-10',
  1678
),

(
  'Frequently Asked Questions for New Members',
  'faq-new-members-comprehensive',
  'Complete FAQ covering the most common questions from new members about contributions, sharing, providers, claims, and program details.',
  '<h2>Your Questions Answered</h2>
  <p>New to health sharing? Here are answers to the most frequently asked questions.</p>

  <h3>About Contributions</h3>

  <h4>Q: When is my first contribution due?</h4>
  <p>A: Your first monthly contribution is due on the first day of the month your coverage begins. Set up auto-pay to never miss a payment.</p>

  <h4>Q: What happens if I miss a payment?</h4>
  <p>A: You have a 15-day grace period. If payment is not received, your membership may be suspended and medical needs during that period may not be eligible for sharing.</p>

  <h4>Q: Can I change my payment method?</h4>
  <p>A: Yes, update your payment method anytime in your member portal.</p>

  <h3>About Medical Needs</h3>

  <h4>Q: How long does it take for needs to be shared?</h4>
  <p>A: Most needs are processed within 10-15 business days after receiving complete documentation.</p>

  <h4>Q: Can I submit needs for services before I became a member?</h4>
  <p>A: No, only medical services received after your membership effective date are eligible.</p>

  <h4>Q: What if my need is denied?</h4>
  <p>A: You have the right to appeal. Contact member services to understand the reason and discuss your options.</p>

  <h3>About Providers</h3>

  <h4>Q: Do I need to use network providers?</h4>
  <p>A: No! One of the biggest benefits is freedom to use ANY provider you choose.</p>

  <h4>Q: How do I explain health sharing to my doctor?</h4>
  <p>A: Download our provider letter from your member portal. It explains health sharing and how payment works.</p>

  <h4>Q: Can I keep my current doctors?</h4>
  <p>A: Absolutely! Continue seeing any doctors you trust.</p>

  <h3>About Coverage</h3>

  <h4>Q: Is there a lifetime maximum?</h4>
  <p>A: Most programs have no lifetime maximum, though annual limits may apply to specific conditions.</p>

  <h4>Q: What is not covered?</h4>
  <p>A: Generally not eligible: routine preventive care (varies by program), pre-existing conditions during waiting period, cosmetic procedures, and services received outside program guidelines.</p>

  <h3>Getting Help</h3>

  <h4>Q: How do I contact member services?</h4>
  <p>A: Phone: 1-800-MPB-HEALTH (Mon-Fri 8am-8pm EST), Email: support@mpbhealth.com, Portal: Live chat available 24/7</p>',
  'Document',
  'Members',
  ARRAY['Education', 'Healthcare Sharing'],
  '/assets/aboutus1.jpg',
  false,
  true,
  '2024-11-05',
  2834
)
ON CONFLICT (slug) DO NOTHING;