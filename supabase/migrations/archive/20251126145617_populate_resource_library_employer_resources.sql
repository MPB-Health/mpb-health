/*
  # Resource Library Population - Employer Resources
  
  Adds 10 employer and HR-focused resources covering:
  - Complete employer guide
  - Cost comparisons
  - Open enrollment planning
  - Employee communication
  - Compliance guidance
  - Administrative tools
*/

INSERT INTO resource_library (
  title, slug, description, content, resource_type, target_audience, topics,
  featured_image_url, is_featured, is_published, published_date, view_count
) VALUES

(
  'Employer Complete Guide to Health Sharing Programs',
  'employer-guide-health-sharing-programs',
  'Comprehensive guide for employers considering health sharing as a benefits option. Learn about cost savings, compliance, and employee satisfaction.',
  '<h2>Why Employers Choose Health Sharing</h2>
  <p>Forward-thinking employers are discovering health sharing as a way to offer excellent benefits while controlling costs.</p>

  <h3>The Business Case</h3>

  <h4>Cost Savings</h4>
  <ul>
    <li>Reduce healthcare benefits costs by 30-50%</li>
    <li>Predictable monthly expenses</li>
    <li>No surprise premium increases mid-year</li>
    <li>Lower administrative burden</li>
  </ul>

  <h4>Employee Satisfaction</h4>
  <ul>
    <li>No network restrictions - employees choose their doctors</li>
    <li>Better customer service experience</li>
    <li>Simplified claims process</li>
    <li>Values-based healthcare resonates with employees</li>
  </ul>

  <h3>How It Works for Employers</h3>

  <h4>Setup Process</h4>
  <ol>
    <li><strong>Consultation:</strong> Discuss your needs and company demographics</li>
    <li><strong>Plan Design:</strong> Choose program levels and contribution structure</li>
    <li><strong>Enrollment:</strong> We handle employee education and enrollment</li>
    <li><strong>Ongoing Support:</strong> Dedicated account manager for your team</li>
  </ol>

  <h4>Employer Responsibilities</h4>
  <ul>
    <li>Communicate benefits option to employees</li>
    <li>Collect and remit monthly contributions</li>
    <li>Provide updates for employee changes (hires, terminations)</li>
    <li>Partner with us on annual renewal</li>
  </ul>

  <h3>Compliance Considerations</h3>

  <h4>ACA and Health Sharing</h4>
  <p>Health sharing is not insurance and is not subject to ACA regulations. However:</p>
  <ul>
    <li>Employers with 50+ employees must still offer ACA-compliant coverage OR pay penalty</li>
    <li>Health sharing can be offered as an additional benefit option</li>
    <li>Some employers offer health sharing to part-time or contractor employees</li>
    <li>Consult your benefits attorney for your specific situation</li>
  </ul>

  <h3>Success Stories</h3>
  <p><strong>Tech Startup (35 employees):</strong> Reduced benefits costs from $18,000/month to $8,500/month while improving employee satisfaction scores.</p>

  <p><strong>Manufacturing Company (120 employees):</strong> Offered health sharing alongside traditional insurance. 40% of employees chose health sharing, saving company $180,000 annually.</p>

  <h3>Next Steps</h3>
  <p>Schedule consultation with benefits advisor today.</p>',
  'Guide',
  'Employers',
  ARRAY['Education', 'Benefits', 'Enrollment'],
  '/assets/medicalsymposium.jpg',
  true,
  true,
  '2025-01-12',
  1876
),

(
  'Open Enrollment: 60-Day Success Timeline',
  'open-enrollment-60-day-timeline',
  'Step-by-step timeline for successful open enrollment period. Complete checklist from planning to execution for HR professionals.',
  '<h2>Your Open Enrollment Roadmap</h2>
  <p>Follow this proven 60-day timeline to execute a successful open enrollment period.</p>

  <h3>Days 60-45: Planning Phase</h3>

  <h4>Week 1 (Days 60-53)</h4>
  <ul>
    <li>Review current participation and costs</li>
    <li>Identify plan changes or new options</li>
    <li>Set enrollment period dates</li>
    <li>Assemble enrollment team and assign roles</li>
    <li>Order materials and schedule presentations</li>
  </ul>

  <h4>Week 2 (Days 52-45)</h4>
  <ul>
    <li>Prepare employee communication plan</li>
    <li>Create enrollment timeline and milestones</li>
    <li>Schedule employee meetings and Q&A sessions</li>
    <li>Test enrollment technology/portal</li>
    <li>Train HR team on new plans and systems</li>
  </ul>

  <h3>Days 44-30: Communication Phase</h3>

  <h4>Week 3 (Days 44-37)</h4>
  <ul>
    <li>Send save-the-date announcement</li>
    <li>Distribute enrollment packets (digital and print)</li>
    <li>Launch enrollment website/portal</li>
    <li>Post benefits information in common areas</li>
    <li>Send first email series about plan options</li>
  </ul>

  <h4>Week 4 (Days 36-30)</h4>
  <ul>
    <li>Host first round of employee info sessions</li>
    <li>Make decision support tools available</li>
    <li>Send targeted communications by employee segment</li>
    <li>Provide one-on-one consultation scheduling</li>
    <li>Share comparison tools and calculators</li>
  </ul>

  <h3>Days 29-15: Active Enrollment Phase</h3>

  <h4>Week 5 (Days 29-22)</h4>
  <ul>
    <li>Enrollment period officially opens</li>
    <li>Send enrollment reminder emails</li>
    <li>Monitor enrollment rates by department</li>
    <li>Conduct additional info sessions</li>
    <li>Provide extended HR support hours</li>
  </ul>

  <h4>Week 6 (Days 21-15)</h4>
  <ul>
    <li>Send mid-enrollment reminder to non-enrollees</li>
    <li>Address common questions in FAQ update</li>
    <li>Offer lunch-and-learn sessions</li>
    <li>Conduct one-on-one consultations</li>
    <li>Check enrollment system for issues</li>
  </ul>

  <h3>Days 14-1: Final Push Phase</h3>

  <h4>Week 7 (Days 14-8)</h4>
  <ul>
    <li>Send urgency communications to non-enrollees</li>
    <li>Escalate reminders to managers</li>
    <li>Extend support hours</li>
    <li>Final info sessions</li>
    <li>Address individual cases</li>
  </ul>

  <h4>Week 8 (Days 7-1)</h4>
  <ul>
    <li>Daily countdown communications</li>
    <li>Manager outreach to team non-enrollees</li>
    <li>Extended HR availability</li>
    <li>Final day: all-hands push</li>
    <li>Close enrollment at deadline</li>
  </ul>

  <h3>Post-Enrollment (Days 1-7 After Close)</h3>
  <ul>
    <li>Send confirmation communications</li>
    <li>Process late/exception cases</li>
    <li>Audit enrollments for accuracy</li>
    <li>Submit final rosters to carriers</li>
    <li>Conduct post-enrollment debrief</li>
    <li>Document lessons learned</li>
  </ul>

  <h3>Key Success Metrics</h3>
  <ul>
    <li>Target: 95%+ participation rate</li>
    <li>Track enrollment by week and department</li>
    <li>Monitor support ticket volume</li>
    <li>Survey employee satisfaction</li>
  </ul>',
  'Checklist',
  'Employers',
  ARRAY['Enrollment', 'Administration'],
  '/assets/submit2025.jpg',
  false,
  true,
  '2024-12-22',
  1543
),

(
  'Employee Communication Toolkit',
  'employee-communication-toolkit',
  'Ready-to-use email templates, flyers, and presentation slides for communicating health sharing benefits to your workforce.',
  '<h2>Make Benefits Communication Easy</h2>
  <p>Download our complete toolkit of proven communication materials to educate employees about health sharing.</p>

  <h3>Included Materials</h3>

  <h4>Email Templates</h4>
  <ul>
    <li>Save-the-date announcement</li>
    <li>Open enrollment launch</li>
    <li>Weekly enrollment reminders</li>
    <li>Final deadline warning</li>
    <li>Enrollment confirmation</li>
    <li>Welcome to new program</li>
  </ul>

  <h4>Presentation Slides</h4>
  <ul>
    <li>What is health sharing? (15-minute overview)</li>
    <li>How it works (detailed walkthrough)</li>
    <li>Cost comparison (vs current insurance)</li>
    <li>Q&A slides (20 common questions)</li>
    <li>Enrollment instructions</li>
  </ul>

  <h4>Print Materials</h4>
  <ul>
    <li>Benefits comparison one-pager</li>
    <li>Quick reference card</li>
    <li>Enrollment checklist</li>
    <li>FAQs booklet</li>
    <li>Poster templates</li>
  </ul>

  <h4>Digital Assets</h4>
  <ul>
    <li>Social media graphics</li>
    <li>Email signatures</li>
    <li>Intranet banners</li>
    <li>Video scripts</li>
  </ul>

  <h3>Communication Best Practices</h3>

  <h4>Frequency</h4>
  <p>Employees need to hear messages 5-7 times before taking action. Use multiple channels:</p>
  <ul>
    <li>Email (primary channel)</li>
    <li>In-person meetings</li>
    <li>Printed materials</li>
    <li>Intranet/portal</li>
    <li>Manager communication</li>
    <li>Text/SMS (for urgent reminders)</li>
  </ul>

  <h4>Messaging Framework</h4>
  <p><strong>Lead with value:</strong> Start with cost savings and benefits</p>
  <p><strong>Simplify complexity:</strong> Use analogies and examples</p>
  <p><strong>Address concerns:</strong> Acknowledge and answer objections</p>
  <p><strong>Clear call-to-action:</strong> Make next steps obvious</p>

  <h3>Sample Email: Open Enrollment Launch</h3>
  <div class="bg-gray-50 p-4 rounded border border-gray-200 my-4">
    <p><strong>Subject:</strong> Open Enrollment is Here - Review Your Health Benefits</p>
    <p>Dear [Employee Name],</p>
    <p>It is time to select your health benefits for [Year]! This year we are excited to offer health sharing as a new option alongside our traditional insurance.</p>
    <p><strong>What is Health Sharing?</strong> It is a community-based alternative that can save you $200-$400 per month while giving you the freedom to see any doctor.</p>
    <p><strong>Key dates:</strong> Enrollment opens [Date] and closes [Date]</p>
    <p><strong>Next steps:</strong> Attend our info session on [Date] or visit [Portal URL] to compare your options.</p>
  </div>

  <h3>Download the Complete Toolkit</h3>
  <p>All materials are customizable with your company branding. Available in Word, PowerPoint, and PDF formats.</p>',
  'Marketing',
  'Employers',
  ARRAY['Marketing', 'Enrollment', 'Education'],
  '/assets/delegates-networking.jpg',
  false,
  true,
  '2024-12-18',
  1234
),

(
  'New Hire Benefits Enrollment Guide',
  'new-hire-benefits-enrollment-guide',
  'Streamline new employee onboarding with this step-by-step benefits enrollment process for health sharing programs.',
  '<h2>Onboard New Hires Smoothly</h2>
  <p>Make benefits enrollment a positive first impression with this streamlined process.</p>

  <h3>Pre-Hire (Offer Stage)</h3>
  <ul>
    <li>Include benefits summary in offer letter</li>
    <li>Send benefits overview document</li>
    <li>Highlight health sharing as cost-effective option</li>
    <li>Mention no waiting period for new hires</li>
  </ul>

  <h3>Day 1: Welcome and Overview</h3>
  <ul>
    <li>Provide benefits enrollment packet</li>
    <li>Schedule one-on-one benefits consultation</li>
    <li>Give portal login credentials</li>
    <li>Set enrollment deadline (typically 30 days)</li>
  </ul>

  <h3>Week 1: Education and Decision</h3>

  <h4>Benefits Orientation (30-45 minutes)</h4>
  <ol>
    <li>Overview of all benefit options</li>
    <li>Deep dive into health sharing</li>
    <li>Cost comparison and personal savings calculator</li>
    <li>Q&A session</li>
    <li>Enrollment instructions</li>
  </ol>

  <h4>Decision Support</h4>
  <ul>
    <li>Provide comparison worksheets</li>
    <li>Offer one-on-one consultation</li>
    <li>Share testimonials from current employees</li>
    <li>Make HR available for questions</li>
  </ul>

  <h3>Week 2-4: Enrollment and Confirmation</h3>

  <h4>Enrollment Process</h4>
  <ol>
    <li>Employee completes enrollment form</li>
    <li>Submit to HR for review</li>
    <li>HR verifies accuracy and completeness</li>
    <li>Forward to MPB Health for processing</li>
    <li>Receive confirmation (2-3 days)</li>
  </ol>

  <h4>Documentation Needed</h4>
  <ul>
    <li>Completed enrollment application</li>
    <li>Dependent information (if applicable)</li>
    <li>Payment authorization</li>
    <li>Medical history questionnaire</li>
    <li>Signed program guidelines</li>
  </ul>

  <h3>Before Coverage Starts</h3>
  <ul>
    <li>Send welcome email with key info</li>
    <li>Provide member ID card (digital)</li>
    <li>Share portal login and mobile app</li>
    <li>Schedule welcome call (optional)</li>
    <li>Give provider letter template</li>
  </ul>

  <h3>First Month of Coverage</h3>
  <ul>
    <li>Check in to ensure smooth start</li>
    <li>Answer any initial questions</li>
    <li>Provide additional resources</li>
    <li>Connect with member services if needed</li>
  </ul>

  <h3>HR Checklist</h3>
  <ul>
    <li>☐ Benefits packet provided Day 1</li>
    <li>☐ Benefits orientation scheduled</li>
    <li>☐ Enrollment deadline communicated</li>
    <li>☐ Decision support offered</li>
    <li>☐ Enrollment form reviewed for accuracy</li>
    <li>☐ Submitted to MPB Health</li>
    <li>☐ Confirmation received</li>
    <li>☐ Employee received welcome materials</li>
    <li>☐ Payroll deduction set up</li>
    <li>☐ 30-day check-in completed</li>
  </ul>',
  'Guide',
  'Employers',
  ARRAY['Enrollment', 'Administration'],
  '/assets/CelebratingExcellence.jpg',
  false,
  true,
  '2024-12-15',
  1345
),

(
  'ACA Compliance and Health Sharing Overview',
  'aca-compliance-health-sharing-overview',
  'Understand how health sharing programs fit within ACA compliance requirements for applicable large employers and small businesses.',
  '<h2>Navigating ACA with Health Sharing</h2>
  <p>Understanding the compliance landscape helps you make informed decisions about offering health sharing to employees.</p>

  <h3>Important Disclaimer</h3>
  <p><strong>Health sharing is not insurance and is not subject to ACA regulations.</strong> This creates both opportunities and considerations for employers.</p>

  <h3>ACA Requirements Overview</h3>

  <h4>Applicable Large Employers (50+ FTE)</h4>
  <p>Employers with 50 or more full-time equivalent employees must:</p>
  <ul>
    <li>Offer minimum essential coverage to 95% of full-time employees</li>
    <li>Coverage must be affordable (employee cost not exceeding 9.12% of household income)</li>
    <li>Coverage must provide minimum value (60% actuarial value)</li>
    <li>OR pay employer shared responsibility payment (penalty)</li>
  </ul>

  <p><strong>Key Point:</strong> Health sharing does NOT satisfy ACA employer mandate requirements.</p>

  <h4>Small Employers (Under 50 FTE)</h4>
  <p>Not subject to employer mandate. You can:</p>
  <ul>
    <li>Offer health sharing as your only benefit option</li>
    <li>Offer multiple options including health sharing</li>
    <li>Choose not to offer benefits</li>
  </ul>

  <h3>How Employers Use Health Sharing</h3>

  <h4>Strategy 1: Supplemental Benefit (Large Employers)</h4>
  <ul>
    <li>Offer ACA-compliant plan to meet mandate</li>
    <li>Add health sharing as voluntary supplemental option</li>
    <li>Give employees choice based on their needs</li>
    <li>Popular with dual-coverage workforce</li>
  </ul>

  <h4>Strategy 2: Primary Benefit (Small Employers)</h4>
  <ul>
    <li>Offer health sharing as primary benefit</li>
    <li>No ACA compliance requirements</li>
    <li>Significant cost savings</li>
    <li>Competitive recruiting tool</li>
  </ul>

  <h4>Strategy 3: Contractor and Part-Time Coverage</h4>
  <ul>
    <li>Extend benefits to non-FTE workers</li>
    <li>No ACA implications</li>
    <li>Enhances contractor relationships</li>
    <li>Minimal administrative burden</li>
  </ul>

  <h3>Employee Considerations</h3>

  <h4>Individual Mandate</h4>
  <p>As of 2019, there is no federal penalty for individuals without coverage. However:</p>
  <ul>
    <li>Some states have individual mandates (CA, MA, NJ, RI, VT, DC)</li>
    <li>Health sharing may not satisfy state mandates</li>
    <li>Employees should consult tax advisor</li>
  </ul>

  <h3>Best Practices</h3>
  <ul>
    <li>Clearly communicate that health sharing is not insurance</li>
    <li>Provide comparison information so employees can make informed choices</li>
    <li>Document that participation is voluntary</li>
    <li>Consult benefits attorney for your specific situation</li>
    <li>Stay updated on state-specific regulations</li>
  </ul>

  <h3>Common Compliance Questions</h3>

  <h4>Q: Can we drop ACA coverage and offer only health sharing?</h4>
  <p>A: If you are an applicable large employer (50+ FTE), no. You would be subject to penalties. Small employers can offer health sharing exclusively.</p>

  <h4>Q: Do we need to report health sharing on 1095-C forms?</h4>
  <p>A: No, health sharing is not considered minimum essential coverage for ACA reporting purposes.</p>

  <h4>Q: Can we contribute to employee health sharing costs?</h4>
  <p>A: Yes, but structure contributions carefully. Consult ERISA attorney if making contributions, as this may trigger ERISA requirements.</p>',
  'Guide',
  'Employers',
  ARRAY['Compliance', 'Administration'],
  '/assets/myth-fact-concept-opposite-directions-signpost-with-sky-background-980x670.jpg',
  false,
  true,
  '2024-12-10',
  1678
),

(
  'Benefits Administration Portal Guide',
  'benefits-administration-portal-guide',
  'Complete walkthrough of the employer portal for managing enrollments, contributions, and employee changes throughout the year.',
  '<h2>Your Employer Portal Guide</h2>
  <p>Manage your group health sharing program efficiently with our employer administration portal.</p>

  <h3>Portal Access</h3>
  <p>Login at: mpb.health/employer-portal</p>
  <ul>
    <li>Use your administrator credentials</li>
    <li>Set up multi-user access for HR team</li>
    <li>Enable two-factor authentication</li>
  </ul>

  <h3>Dashboard Overview</h3>

  <h4>Key Metrics</h4>
  <ul>
    <li>Active employees enrolled</li>
    <li>Total monthly contributions</li>
    <li>Pending enrollments</li>
    <li>Recent changes</li>
    <li>Upcoming payment date</li>
  </ul>

  <h3>Managing Enrollments</h3>

  <h4>New Employee Enrollment</h4>
  <ol>
    <li>Click Add New Employee</li>
    <li>Enter employee information</li>
    <li>Select program level</li>
    <li>Set effective date</li>
    <li>Submit for processing</li>
  </ol>

  <h4>Life Event Changes</h4>
  <ul>
    <li>Marriage/divorce</li>
    <li>Birth/adoption</li>
    <li>Address changes</li>
    <li>Plan level changes</li>
  </ul>

  <h3>Employee Terminations</h3>
  <ol>
    <li>Navigate to employee record</li>
    <li>Select Terminate Coverage</li>
    <li>Enter last day of coverage</li>
    <li>Select termination reason</li>
    <li>Submit (processes within 24 hours)</li>
  </ol>

  <h3>Contribution Management</h3>

  <h4>Monthly Payment</h4>
  <ul>
    <li>View upcoming payment amount</li>
    <li>Download employee roster</li>
    <li>Submit payment (ACH or wire)</li>
    <li>Receive confirmation</li>
  </ul>

  <h4>Payment Methods</h4>
  <ul>
    <li><strong>ACH (Recommended):</strong> Set up auto-debit for hassle-free payments</li>
    <li><strong>Wire Transfer:</strong> For large groups or manual payment preference</li>
    <li><strong>Check:</strong> Must receive by 1st of month (not recommended)</li>
  </ul>

  <h3>Reporting</h3>

  <h4>Available Reports</h4>
  <ul>
    <li>Active enrollment roster</li>
    <li>Contribution summary by employee</li>
    <li>Year-to-date payment history</li>
    <li>New enrollments and terminations</li>
    <li>Demographics report</li>
  </ul>

  <h3>Support Resources</h3>

  <h4>Training and Help</h4>
  <ul>
    <li>Video tutorials in portal</li>
    <li>Downloadable user guide</li>
    <li>Live chat support</li>
    <li>Dedicated account manager</li>
  </ul>

  <h4>Contact Options</h4>
  <ul>
    <li>Phone: 1-800-MPB-EMPLOYER</li>
    <li>Email: employers@mpbhealth.com</li>
    <li>Portal: Submit support ticket</li>
  </ul>',
  'Guide',
  'Employers',
  ARRAY['Administration', 'Education'],
  '/assets/businessTeamWorking.jpg',
  false,
  true,
  '2024-12-05',
  1123
),

(
  'Employee Offboarding and COBRA Alternative',
  'employee-offboarding-cobra-alternative',
  'Guide to handling employee terminations, offering continuation coverage, and explaining health sharing as COBRA alternative.',
  '<h2>Employee Offboarding Process</h2>
  <p>Handle employee separations smoothly while ensuring they understand continuation options.</p>

  <h3>Termination Timeline</h3>

  <h4>Notice Period</h4>
  <ul>
    <li>Notify MPB Health within 24 hours of termination decision</li>
    <li>Coverage can continue through end of current month</li>
    <li>Employee receives termination notice automatically</li>
  </ul>

  <h3>Coverage Options for Departing Employees</h3>

  <h4>Option 1: Individual Membership</h4>
  <p>Departing employees can convert to individual membership:</p>
  <ul>
    <li>No gap in coverage</li>
    <li>Same program level or different plan</li>
    <li>Simplified enrollment (already in system)</li>
    <li>Employee pays full individual rate</li>
  </ul>

  <p><strong>Advantages over COBRA:</strong></p>
  <ul>
    <li>Typically 50-60% less expensive</li>
    <li>No time limit (not limited to 18 months)</li>
    <li>More flexible plan options</li>
    <li>Easier administration for employer</li>
  </ul>

  <h4>Option 2: Shop for New Coverage</h4>
  <p>Employee can:</p>
  <ul>
    <li>Explore other health sharing programs</li>
    <li>Return to traditional insurance</li>
    <li>Use healthcare.gov marketplace</li>
  </ul>

  <h3>Employer Responsibilities</h3>

  <h4>Required Communications</h4>
  <ul>
    <li>Notify employee of coverage termination date</li>
    <li>Explain individual membership option</li>
    <li>Provide contact information for MPB Health</li>
    <li>Document all communications</li>
  </ul>

  <h4>Final Payroll</h4>
  <ul>
    <li>Prorate final month contribution if mid-month termination</li>
    <li>Process any employee deduction refunds due</li>
    <li>Update payroll system</li>
  </ul>

  <h3>Health Sharing vs COBRA</h3>

  <table class="w-full border-collapse border border-gray-300 my-4">
    <tr class="bg-gray-100">
      <th class="border border-gray-300 p-2 text-left">Feature</th>
      <th class="border border-gray-300 p-2">COBRA</th>
      <th class="border border-gray-300 p-2">Health Sharing</th>
    </tr>
    <tr>
      <td class="border border-gray-300 p-2">Typical Monthly Cost</td>
      <td class="border border-gray-300 p-2">$600-$1,200</td>
      <td class="border border-gray-300 p-2">$200-$400</td>
    </tr>
    <tr>
      <td class="border border-gray-300 p-2">Duration Limit</td>
      <td class="border border-gray-300 p-2">18 months</td>
      <td class="border border-gray-300 p-2">No limit</td>
    </tr>
    <tr>
      <td class="border border-gray-300 p-2">Provider Network</td>
      <td class="border border-gray-300 p-2">Same as group plan</td>
      <td class="border border-gray-300 p-2">Any provider</td>
    </tr>
    <tr>
      <td class="border border-gray-300 p-2">Employer Admin</td>
      <td class="border border-gray-300 p-2">Significant</td>
      <td class="border border-gray-300 p-2">Minimal</td>
    </tr>
  </table>

  <h3>Sample Termination Letter Language</h3>
  <div class="bg-gray-50 p-4 rounded border border-gray-200 my-4">
    <p>Your health sharing coverage through [Company] will terminate on [Date]. You have two options to continue coverage:</p>
    <ol>
      <li><strong>Convert to Individual Membership:</strong> Continue with MPB Health on your own. Contact them at 1-800-MPB-HEALTH within 30 days.</li>
      <li><strong>Explore Other Options:</strong> Consider marketplace plans or other health sharing programs.</li>
    </ol>
    <p>We recommend contacting MPB Health immediately to avoid any gap in coverage.</p>
  </div>

  <h3>Portal Processing</h3>
  <ol>
    <li>Login to employer portal</li>
    <li>Navigate to employee record</li>
    <li>Click Terminate Coverage</li>
    <li>Enter effective date</li>
    <li>System sends automatic notices</li>
    <li>Employee removed from next billing cycle</li>
  </ol>',
  'Guide',
  'Employers',
  ARRAY['Administration', 'Compliance'],
  '/assets/mpbhealthteam.jpg',
  false,
  true,
  '2024-11-30',
  987
),

(
  'Handling Employee Questions: HR Quick Reference',
  'handling-employee-questions-hr-quick-reference',
  'Fast answers to the 25 most common employee questions about health sharing programs. Essential desk reference for HR teams.',
  '<h2>Quick Answer Guide for HR</h2>
  <p>Fast, accurate answers to employee questions you will hear most often.</p>

  <h3>Basic Questions</h3>

  <h4>Q: What is health sharing?</h4>
  <p>A: A community-based approach where members share eligible medical expenses. Think of it as a cooperative alternative to insurance where members help each other.</p>

  <h4>Q: Is this insurance?</h4>
  <p>A: No, health sharing is not insurance. It is a membership program where members voluntarily share medical costs.</p>

  <h4>Q: How much does it cost?</h4>
  <p>A: Most plans range from $200-$400/month for individuals, significantly less than traditional insurance. Exact cost depends on age, family size, and program level.</p>

  <h3>Coverage Questions</h3>

  <h4>Q: Can I keep my current doctors?</h4>
  <p>A: Yes! There are no network restrictions. See any doctor, specialist, or hospital you choose.</p>

  <h4>Q: What is not covered?</h4>
  <p>A: Generally not eligible: routine preventive care (varies by program), pre-existing conditions during waiting periods, cosmetic procedures, and services outside program guidelines.</p>

  <h4>Q: Are pre-existing conditions covered?</h4>
  <p>A: After a waiting period (typically 12-36 months), yes. New medical needs are covered immediately.</p>

  <h4>Q: Is maternity covered?</h4>
  <p>A: Yes, after a waiting period (typically 10-12 months from enrollment). Must enroll before pregnancy.</p>

  <h3>How It Works</h3>

  <h4>Q: How do I file a claim?</h4>
  <p>A: Log into your member portal, upload itemized bills and medical records, and submit. Most needs are processed within 10-15 business days.</p>

  <h4>Q: Do I pay the doctor directly?</h4>
  <p>A: Usually yes, then submit for sharing. Some providers accept direct payment from MPB Health. Use negotiation services to reduce bills first.</p>

  <h4>Q: What is an IUA?</h4>
  <p>A: Initial Unshareable Amount - similar to a deductible. It is the amount you pay before the community begins sharing your medical expenses.</p>

  <h3>Practical Questions</h3>

  <h4>Q: Can I add my spouse and kids?</h4>
  <p>A: Yes, add household members during enrollment or within 30 days of marriage/birth.</p>

  <h4>Q: What if I need emergency care?</h4>
  <p>A: Go to the nearest ER immediately. Call 24/7 nurse hotline after for guidance. Emergency needs are eligible for sharing.</p>

  <h4>Q: Do I get an ID card?</h4>
  <p>A: Yes, digital ID card available immediately in member portal. Physical card mailed within 7-10 days.</p>

  <h4>Q: What if I have questions?</h4>
  <p>A: Contact member services: 1-800-MPB-HEALTH (Mon-Fri 8am-8pm), email support, or 24/7 portal live chat.</p>

  <h3>Comparison Questions</h3>

  <h4>Q: How is this different from insurance?</h4>
  <p>A: Health sharing is member-focused (not profit-driven), has no networks, offers transparent pricing, and costs significantly less.</p>

  <h4>Q: Why is it cheaper?</h4>
  <p>A: No corporate profits, lower administrative costs, member focus on wellness, and direct provider negotiations.</p>

  <h4>Q: Is it risky?</h4>
  <p>A: Health sharing has successfully served millions of members for decades. MPB Health is A+ rated and financially stable.</p>

  <h3>Enrollment Questions</h3>

  <h4>Q: When does coverage start?</h4>
  <p>A: First of the month after enrollment is approved (typically 2-3 business days).</p>

  <h4>Q: Can I change plans later?</h4>
  <p>A: Yes, during annual open enrollment or within 30 days of a qualifying life event.</p>

  <h4>Q: What if I am denied?</h4>
  <p>A: Denials are rare and usually due to incomplete applications. Work with enrollment team to resolve.</p>

  <h3>When to Escalate</h3>
  <p>Direct employees to contact MPB Health directly for:</p>
  <ul>
    <li>Specific medical scenario questions</li>
    <li>Claims issues or appeals</li>
    <li>Complex coverage questions</li>
    <li>Provider-specific questions</li>
  </ul>',
  'Document',
  'Employers',
  ARRAY['Education', 'Administration'],
  '/assets/delegates-networking.jpg',
  false,
  true,
  '2024-11-25',
  1876
)
ON CONFLICT (slug) DO NOTHING;