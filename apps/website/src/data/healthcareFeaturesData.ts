import { Stethoscope, Ambulance, Brain, Baby, Pill, Wallet, ShieldCheck, Headphones, PawPrint, Heart, Video as LucideIcon } from 'lucide-react';

export interface FeatureKeyPoint {
  title: string;
  description: string;
}

export interface FeatureFAQ {
  question: string;
  answer: string;
}

export interface HealthcareFeature {
  id: string;
  name: string;
  icon: LucideIcon;
  tagline: string;
  shortDescription: string;
  heroImage: string;
  detailedDescription: string;
  keyPoints: FeatureKeyPoint[];
  howItWorks: string[];
  eligiblePlans: string[];
  membership: string[];
  faqs: FeatureFAQ[];
  color: string;
  bgColor: string;
  gradientFrom: string;
  gradientTo: string;
  examples: string[];
  disclaimer?: string;
}

export const healthcareFeatures: HealthcareFeature[] = [
  {
    id: 'health-sharing',
    name: 'Health Sharing for Large Medical Expenses',
    icon: Heart,
    tagline: 'Community support when you need it most',
    shortDescription: 'Protection from major medical needs including hospitalizations, surgeries, and serious illnesses',
    heroImage: 'https://images.pexels.com/photos/6129507/pexels-photo-6129507.jpeg?auto=compress&cs=tinysrgb&w=1260&h=750&dpr=2',
    detailedDescription: 'Our health sharing program provides robust financial support for significant medical needs. When you face major expenses like hospitalizations, surgeries, or serious illnesses, your healthcare costs are shared by our caring community of members. This is the foundation of health sharing—standing together when it matters most.',
    keyPoints: [
      {
        title: 'Protection From Major Medical Membership',
        description: 'Hospitalizations, surgeries, emergency care, and serious illnesses are eligible for sharing'
      },
      {
        title: 'No Network Restrictions',
        description: 'Visit any licensed healthcare provider nationwide without referrals or network limitations'
      },
      {
        title: 'Transparent Process',
        description: 'Clear guidelines on what qualifies for sharing with straightforward submission process'
      },
      {
        title: 'Community Support',
        description: 'Your needs are shared by thousands of caring members across the country'
      }
    ],
    howItWorks: [
      'When you have a major medical need, you pay providers directly for care received',
      'Submit your eligible medical expenses through your member portal with supporting documentation',
      'Our team reviews your submission to ensure it meets sharing guidelines',
      'Eligible expenses are shared by the community after your Initial Unshareable Amount (IUA)',
      'Reimbursement is processed and sent directly to you or the provider per your preference',
      'You can track your sharing requests and history through your online member portal'
    ],
    eligiblePlans: ['Care Plus', 'Direct', 'Secure HSA'],
    membership: [
      'Inpatient hospital stays for illness or injury',
      'Surgical procedures performed in hospital or outpatient settings',
      'Emergency room visits for sudden serious conditions',
      'Diagnostic imaging (MRI, CT scans, X-rays) when medically necessary',
      'Laboratory tests and pathology services',
      'Physician services during hospital stays and follow-up care',
      'Physical therapy and rehabilitation after major medical events',
      'Durable medical equipment prescribed by physicians',
      'Ambulance transportation for emergencies',
      'Specialist consultations and treatments'
    ],
    faqs: [
      {
        question: 'What is the Initial Unshareable Amount (IUA)?',
        answer: 'The IUA is similar to a deductible—it\'s the amount you pay out-of-pocket (per medical need) before the community begins sharing your eligible expenses. Different plans have different IUA levels, ranging from $1,250 to $5,000 per person.'
      },
      {
        question: 'How quickly are expenses shared?',
        answer: 'Once your submission is reviewed and approved, sharing typically occurs within 45-60 days (or as little as 2 weeks). Emergency situations may receive expedited processing. You can always check the status of your requests in your member portal.'
      },
      {
        question: 'Are there sharing limits?',
        answer: 'No. There are no sharing limits.'
      },
      {
        question: 'What if I need care for a pre-membership condition?',
        answer: 'Pre-membership conditions have a 12-month waiting period before they become eligible for sharing.'
      }
    ],
    color: 'text-rose-600',
    bgColor: 'bg-rose-50',
    gradientFrom: 'from-rose-500',
    gradientTo: 'to-pink-600',
    examples: [
      'Cancer treatment including surgery, chemotherapy, and radiation',
      'Knee replacement surgery with physical therapy and rehabilitation',
      'Heart attack with emergency care, cardiac catheterization, and follow-up'
    ]
  },
  {
    id: 'primary-care',
    name: 'Worldwide Protection',
    icon: Stethoscope,
    tagline: 'Protection while traveling',
    shortDescription: 'Protection for acute or emergency medical needs that occur while traveling outside the United States or Puerto Rico',
    heroImage: 'https://images.pexels.com/photos/4559592/pexels-photo-4559592.jpeg?auto=compress&cs=tinysrgb&w=1260&h=750&dpr=2',
    detailedDescription: 'Travel with confidence knowing you\'re protected worldwide. Our Worldwide Protection benefit provides sharing for acute or emergency medical needs that occur while traveling outside the United States or Puerto Rico. Whether you\'re on vacation, business travel, or studying abroad, receive care anywhere in the world with financial protection from unexpected medical emergencies.',
    keyPoints: [
      {
        title: 'Worldwide Protection for Eligible Medical Needs',
        description: 'Protection for medical emergencies anywhere outside the U.S. and Puerto Rico'
      },
      {
        title: 'Acute & Emergency Care',
        description: 'Sharing for sudden illnesses and emergency medical situations while traveling'
      },
      {
        title: 'No Pre-Authorization',
        description: 'Receive immediate care when emergencies occur abroad without delays'
      },
      {
        title: 'Direct Provider Payment',
        description: 'Submit expenses for reimbursement after receiving emergency treatment'
      }
    ],
    howItWorks: [
      'Travel outside the United States or Puerto Rico with active membership',
      'If you experience an acute illness or medical emergency, seek care at the nearest appropriate facility',
      'Pay for medical services directly at the time of treatment',
      'Keep all receipts, medical records, and documentation of your emergency treatment',
      'Submit your medical expenses through your member portal upon returning home',
      'Eligible emergency expenses are reviewed and shared according to your plan benefits'
    ],
    eligiblePlans: ['Care Plus', 'Direct', 'Secure HSA'],
    membership: [
      'Emergency room visits for sudden serious illness or injury abroad',
      'Hospital admission for acute medical conditions while traveling',
      'Emergency surgery required during international travel',
      'Urgent care for sudden illnesses (severe infection, food poisoning, etc.)',
      'Accident-related injuries requiring immediate treatment',
      'Acute pain or symptoms requiring emergency evaluation',
      'Emergency diagnostic testing (X-rays, CT scans, lab work)',
      'Emergency medications and treatments prescribed during travel',
      'Ambulance or emergency transport services internationally',
      'Emergency dental care for acute dental trauma'
    ],
    faqs: [
      {
        question: 'Does this include routine care while traveling?',
        answer: 'No, worldwide protection provides sharing only for acute illnesses and emergency medical needs that occur while traveling outside the U.S. and Puerto Rico. Routine care, pre-membership conditions, and planned treatments are not eligible for sharing under this benefit.'
      },
      {
        question: 'Do I need pre-authorization for emergency care abroad?',
        answer: 'No pre-authorization is required for emergency care. Seek immediate medical attention for emergencies and submit documentation for sharing consideration when you return home.'
      },
      {
        question: 'Are medical evaluations eligible for sharing?',
        answer: 'Medically necessary evaluations related to a new injury or illness may be eligible for sharing when they meet the membership guidelines. This can include office visits, diagnostic testing, or specialist consultations associated with an eligible need. Always refer to the Member Guidelines for details, limitations, and exclusions.'
      },
      {
        question: 'What documentation do I need?',
        answer: 'Keep all medical records, itemized bills, receipts, proof of payment, and a written description of the emergency. Translation of foreign language documents to English may be required for processing.'
      }
    ],
    color: 'text-blue-600',
    bgColor: 'bg-blue-50',
    gradientFrom: 'from-blue-500',
    gradientTo: 'to-cyan-600',
    examples: [
      'Emergency appendectomy while on vacation in Europe',
      'Broken leg requiring surgery and hospital stay during ski trip in Canada',
      'Severe food poisoning in Mexico requiring ER visit and IV fluids',
      'Heart attack symptoms while on business trip in Asia requiring hospitalization',
      'Motorcycle accident in Central America with emergency surgery and recovery'
    ]
  },
  {
    id: 'urgent-care',
    name: 'Virtual Urgent Care',
    icon: Ambulance,
    tagline: '24/7/365 virtual care for urgent needs',
    shortDescription: '$0, unlimited 24/7/365 virtual urgent care visits for non-emergency health concerns',
    heroImage: 'https://images.pexels.com/photos/5863389/pexels-photo-5863389.jpeg?auto=compress&cs=tinysrgb&w=1260&h=750&dpr=2',
    detailedDescription: 'Virtual urgent care visits are available 24/7/365 and are accessed through the MPB Health app. Members can connect with a licensed provider by phone or video for urgent, non-emergency health concerns. All MPB Health memberships include unlimited $0 virtual urgent care services.',
    keyPoints: [
      {
        title: '$0, Unlimited Visits',
        description: 'No cost per visit, use as often as needed with no limits'
      },
      {
        title: '24/7/365 Access',
        description: 'Connect with providers anytime, day or night, every day of the year'
      },
      {
        title: 'Phone or Video Visits',
        description: 'Choose how you connect - phone or video through the MPB Health app'
      },
      {
        title: 'Licensed Providers',
        description: 'Board-certified physicians and nurse practitioners available quickly'
      }
    ],
    howItWorks: [
      'Download the MPB Health app or access virtual care through your member portal',
      'When you have a non-emergency medical need, request a virtual urgent care visit',
      'Connect with a licensed provider via phone or video within minutes',
      'Discuss your symptoms and receive professional medical advice',
      'Get prescriptions sent directly to your pharmacy when needed',
      'Use this benefit as often as needed at no cost - it\'s included in all memberships'
    ],
    eligiblePlans: ['Essentials', 'MEC+Essentials', 'Care Plus', 'Direct', 'Secure HSA'],
    membership: [
      'Treatment for minor injuries and sprains',
      'Illness care (fever, flu, cold, strep throat, ear infections)',
      'Minor burns, cuts, and wound care',
      'Allergic reactions and rashes',
      'Urinary tract and bladder infections',
      'Breathing problems and asthma concerns',
      'Eye irritation and minor eye concerns',
      'Digestive issues and stomach concerns',
      'Skin conditions and infections',
      'Prescriptions for acute conditions when appropriate'
    ],
    faqs: [
      {
        question: 'When should I use virtual urgent care vs. calling 911?',
        answer: 'Use virtual urgent care for non-emergency injuries and illnesses that need prompt attention but aren\'t life-threatening. Always call 911 for chest pain, difficulty breathing, severe bleeding, loss of consciousness, or other serious emergencies. Virtual care is not for life-threatening conditions.'
      },
      {
        question: 'How much does virtual urgent care cost?',
        answer: 'Virtual urgent care is included at $0 in all MPB Health memberships with unlimited visits. There are no copays or additional fees to use this benefit.'
      },
      {
        question: 'How quickly can I see a provider?',
        answer: 'Most virtual urgent care visits connect you with a licensed provider within minutes. The service is available 24/7/365, so you can access care whenever you need it.'
      },
      {
        question: 'Can virtual urgent care providers write prescriptions?',
        answer: 'Yes, virtual urgent care physicians and nurse practitioners can write prescriptions for appropriate conditions. Prescriptions are sent directly to your pharmacy. Use your prescription discount benefit to save on medications.'
      }
    ],
    color: 'text-orange-600',
    bgColor: 'bg-orange-50',
    gradientFrom: 'from-orange-500',
    gradientTo: 'to-red-600',
    examples: [
      'Late evening ear infection requiring antibiotic prescription',
      'Weekend fever and flu symptoms needing evaluation',
      'Sunday morning child with sore throat and possible strep',
      'Allergic reaction causing hives needing medical guidance',
      'Urinary tract infection symptoms requiring prescription'
    ],
    disclaimer: 'Virtual care services are not insurance and are provided by third-party partners. They are not for emergency or life-threatening conditions. In an emergency, call 911 immediately.'
  },
  {
    id: 'mental-health',
    name: 'Virtual Behavioral Health',
    icon: Brain,
    tagline: 'Professional virtual support for emotional wellness',
    shortDescription: 'Virtual-only access to licensed counselors and therapists for virtual behavioral health support and emotional wellness',
    heroImage: 'https://images.pexels.com/photos/4101143/pexels-photo-4101143.jpeg?auto=compress&cs=tinysrgb&w=1260&h=750&dpr=2',
    detailedDescription: 'Your emotional wellness is just as important as physical health. Our virtual behavioral health benefit connects you with licensed therapists, counselors, and psychiatric professionals via secure video or phone sessions for anxiety, depression, stress management, and other emotional wellness needs. All sessions are delivered virtually for your convenience and privacy.',
    keyPoints: [
      {
        title: 'Licensed Professionals',
        description: 'Access to therapists, counselors, and psychiatric providers'
      },
      {
        title: 'Virtual Sessions',
        description: 'Secure phone or video sessions from the comfort of your home'
      },
      {
        title: 'Confidential Care',
        description: 'Private support for your emotional and mental wellness'
      },
      {
        title: 'Crisis Support',
        description: '24/7 crisis hotlines for immediate assistance when needed'
      }
    ],
    howItWorks: [
      'Login to your MPB Health app or member portal and select telehealth',
      'You\'ll be matched with licensed providers based on your needs',
      'Schedule virtual appointments directly with your chosen provider',
      'Attend sessions by phone or via secure video platform',
      'Continue therapy as needed with ongoing virtual sessions and support'
    ],
    eligiblePlans: ['Essentials', 'MEC+Essentials', 'Care Plus', 'Direct', 'Secure HSA'],
    membership: [
      'Individual counseling and therapy sessions',
      'Psychiatric evaluation and medication management',
      'Crisis intervention and emergency behavioral health care',
      'Treatment for anxiety disorders',
      'Depression and mood disorder treatment',
      'Stress management and coping strategies',
      'PTSD and trauma counseling',
      'Substance abuse counseling'
    ],
    faqs: [
      {
        question: 'How many therapy sessions are covered?',
        answer: 'An intake clinician will determine a baseline for the number of sessions pending assessment. Sessions can be extended at the providers discretion, with no annual limit of use.'
      },
      {
        question: 'Are virtual behavioral health services confidential?',
        answer: 'Yes, all virtual behavioral health services follow strict HIPAA privacy rules. Your therapy sessions and records are confidential.'
      },
      {
        question: 'How are virtual behavioral health sessions delivered?',
        answer: 'All behavioral health sessions are delivered virtually through secure video or phone visits only. Virtual therapy sessions are convenient, private, and just as effective as in-person visits. In-person sessions are not available through this benefit.'
      },
      {
        question: 'What about prescription medications?',
        answer: 'While prescription medications are not eligible for sharing, members can use our prescription discount program to receive reduced pricing on many medications.'
      }
    ],
    color: 'text-purple-600',
    bgColor: 'bg-purple-50',
    gradientFrom: 'from-purple-500',
    gradientTo: 'to-indigo-600',
    examples: [
      'Weekly therapy sessions for anxiety and panic disorder',
      'Couples counseling to improve relationship communication',
      'Psychiatric evaluation and medication management for depression',
      'Trauma counseling following a difficult life event',
      'Stress management therapy during a challenging work situation'
    ],
    disclaimer: 'For treatment of acute conditions. An intake clinician will determine a baseline for the number of sessions pending assessment. Sessions can be extended at the providers discretion, with no annual limit of use.'
  },
  {
    id: 'maternity-care',
    name: 'Maternity Care',
    icon: Baby,
    tagline: 'Supporting your journey to parenthood',
    shortDescription: 'Comprehensive sharing for pregnancy, delivery, and newborn care for growing families',
    heroImage: 'https://images.pexels.com/photos/1556652/pexels-photo-1556652.jpeg?auto=compress&cs=tinysrgb&w=1260&h=750&dpr=2',
    detailedDescription: 'Pregnancy is a beautiful journey that deserves comprehensive support. Our maternity care benefit covers prenatal visits, delivery, postpartum care, and newborn medical needs. From your first ultrasound to bringing baby home, we share the costs of this life-changing experience with you.',
    keyPoints: [
      {
        title: 'Full Pregnancy Journey',
        description: 'Membership from conception through postpartum recovery'
      },
      {
        title: 'Choice of Provider',
        description: 'Use any OB/GYN, midwife, or birthing center'
      },
      {
        title: 'Delivery Options',
        description: 'Hospital birth, birthing center, or home birth supported'
      },
      {
        title: 'Newborn Care',
        description: 'Medical care for your baby immediately after birth'
      }
    ],
    howItWorks: [
      'To be eligible for sharing, the conception date must be after six months of continuous membership, as confirmed by medical records.',
      'Choose your preferred OB/GYN or midwife without network restrictions',
      'Attend regular prenatal visits for monitoring throughout your pregnancy',
      'Deliver at your chosen hospital, birthing center, or at home with qualified professionals',
      'Receive postpartum care for mother and routine care for newborn',
      'Submit maternity expenses for sharing after delivery with supporting documentation'
    ],
    eligiblePlans: ['Care Plus', 'Direct', 'Secure HSA'],
    membership: [
      'Prenatal care including regular OB/GYN visits',
      'Routine ultrasounds and fetal monitoring',
      'Prenatal screening and genetic testing',
      'Labor and delivery including anesthesia',
      'C-section delivery when medically necessary',
      'Hospital or birthing center facility fees',
      'Physician and midwife services',
      'Postpartum care for mother (typically 6-8 weeks)',
      'Newborn hospital care and initial checkups',
      'Complications during pregnancy (eligible immediately without waiting period)'
    ],
    faqs: [
      {
        question: 'Is there a waiting period for maternity?',
        answer: 'Yes, to be eligible for sharing, the conception date must be after six months of continuous membership, as confirmed by medical records.'
      },
      {
        question: 'What if I\'m already pregnant?',
        answer: 'If you\'re already pregnant when you join, that pregnancy would be considered a pre-membership condition. You may still enroll for future pregnancies after satisfying the maternity waiting period. Check with our team about your specific situation.'
      },
      {
        question: 'Are prenatal vitamins and classes covered?',
        answer: 'Prescription prenatal vitamins are covered under pharmacy benefits. Educational childbirth classes are typically not shared but are often available at discounted rates through community resources.'
      },
      {
        question: 'What about NICU care for the baby?',
        answer: 'If your newborn requires NICU or intensive care, those medical needs are eligible for sharing as they are considered unexpected medical conditions. This provides important protection for families with complicated births.'
      }
    ],
    color: 'text-pink-600',
    bgColor: 'bg-pink-50',
    gradientFrom: 'from-pink-500',
    gradientTo: 'to-rose-600',
    examples: [
      'Routine prenatal care with monthly visits and two ultrasounds',
      'Hospital delivery with epidural anesthesia totaling $15,000',
      'C-section delivery with 3-day hospital stay for mother and baby',
      'Home birth with licensed midwife and doula support',
      'NICU care for premature baby requiring 2 weeks of intensive support'
    ]
  },
  {
    id: 'rx-benefits',
    name: 'Prescription Benefits & Discounts',
    icon: Pill,
    tagline: 'Save on medications you need',
    shortDescription: 'Significant discounts on prescription medications at thousands of pharmacies nationwide',
    heroImage: 'https://images.pexels.com/photos/208512/pexels-photo-208512.jpeg?auto=compress&cs=tinysrgb&w=1260&h=750&dpr=2',
    detailedDescription: 'Prescription medications shouldn\'t break your budget. Our pharmacy benefit provides substantial discounts on both generic and brand-name medications at over 65,000 pharmacies nationwide. Save on the medications you need to stay healthy without insurance-style formularies or prior authorizations.',
    keyPoints: [
      {
        title: 'Deep Discounts',
        description: 'Save up to 80% on generic medications and 15-50% on brand names'
      },
      {
        title: 'Huge Network',
        description: 'Over 65,000 participating pharmacies including major chains'
      },
      {
        title: 'No Restrictions',
        description: 'No formularies, prior authorizations, or medication denials'
      },
      {
        title: 'Easy to Use',
        description: 'Simply present your discount card at the pharmacy counter'
      }
    ],
    howItWorks: [
      'Receive your prescription discount card through your member portal or mobile app',
      'When you need a prescription filled, present your discount card to the pharmacist',
      'The discount is applied automatically at the point of sale',
      'Pay the discounted price directly to the pharmacy',
      'Use at any participating pharmacy - national chains, local stores, and mail-order',
      'Check prices at different pharmacies using our price comparison tool to find the best deal'
    ],
    eligiblePlans: ['Essentials', 'MEC+Essentials', 'Care Plus', 'Direct', 'Secure HSA'],
    membership: [
      'Generic medications at deeply discounted rates',
      'Brand-name prescription drugs when no generic available',
      'Specialty medications for complex conditions',
      'Chronic disease medications (diabetes, blood pressure, cholesterol)',
      'Antibiotics and short-term medications',
      'Behavioral health medications',
      'Pain management prescriptions',
      'Pediatric medications for children',
      'Over 50,000 FDA-approved medications',
      'Mail-order pharmacy options for maintenance medications'
    ],
    faqs: [
      {
        question: 'How much will I save on prescriptions?',
        answer: 'Savings vary by medication. Generic drugs often see 70-80% discounts, while brand names typically save 15-50%. Use our price comparison tool to check your specific medications at different pharmacies for the best prices.'
      },
      {
        question: 'Do I need prior authorization?',
        answer: 'No! Unlike insurance, there are no prior authorizations, formularies, or restrictions. If your doctor prescribes it, your discount applies. This means faster access to the medications you need.'
      },
      {
        question: 'Can I use this at any pharmacy?',
        answer: 'The discount works at over 65,000 pharmacies including CVS, Walgreens, Walmart, Kroger, Costco, and most local pharmacies. Check our pharmacy locator to confirm a specific location participates.'
      },
      {
        question: 'What about expensive specialty drugs?',
        answer: 'Specialty medications are included in the discount program. For very expensive biologics and specialty drugs, check prices at different pharmacies as savings can vary significantly. Some mail-order specialty pharmacies offer additional discounts.'
      }
    ],
    color: 'text-green-600',
    bgColor: 'bg-green-50',
    gradientFrom: 'from-green-500',
    gradientTo: 'to-emerald-600',
    examples: []
  },
  {
    id: 'hsa-compatibility',
    name: 'Health Savings Account (HSA) Compatibility',
    icon: Wallet,
    tagline: 'Triple tax advantages for healthcare savings',
    shortDescription: 'HSA-qualified plans that let you save pre-tax dollars for current and future healthcare expenses',
    heroImage: 'https://images.pexels.com/photos/259200/pexels-photo-259200.jpeg?auto=compress&cs=tinysrgb&w=1260&h=750&dpr=2',
    detailedDescription: 'Health Savings Accounts provide powerful tax advantages when paired with HSA-qualified health sharing plans. Contribute pre-tax dollars, grow your savings tax-free, and withdraw funds tax-free for qualified medical expenses. It\'s like a 401(k) for healthcare that you own and control forever.',
    keyPoints: [
      {
        title: 'Triple Tax Benefits',
        description: 'Tax-deductible contributions, tax-free growth, and tax-free withdrawals'
      },
      {
        title: 'You Own It Forever',
        description: 'HSA funds are yours to keep regardless of employment or plan changes'
      },
      {
        title: 'Investment Options',
        description: 'Grow your balance through investment options once you meet minimum balances'
      },
      {
        title: 'Retirement Asset',
        description: 'Use for retirement healthcare costs or convert to retirement income after age 65'
      }
    ],
    howItWorks: [
      'Enroll in an HSA-qualified health sharing plan (Secure HSA)',
      'Open an HSA account through a bank, credit union, or HSA administrator of your choice',
      'Contribute pre-tax dollars up to annual IRS limits ($4,150 individual, $8,300 family for 2025)',
      'Use your HSA debit card or checks to pay for qualified medical expenses tax-free',
      'Save receipts for reimbursement - you can reimburse yourself years later',
      'Invest unused funds for long-term growth once you meet your administrator\'s minimum balance',
      'Continue using your HSA throughout life for medical expenses or retirement income'
    ],
    eligiblePlans: ['Secure HSA'],
    membership: [
      'IRS-qualified medical expenses paid tax-free',
      'Doctor visits, prescriptions, and medical care',
      'Dental and vision care expenses',
      'Over-the-counter medications with prescription',
      'Medical equipment and supplies',
      'Long-term care insurance premiums',
      'COBRA and health insurance premiums while unemployed',
      'Medicare premiums after age 65 (except Medigap)',
      'Investment growth tax-free on savings',
      'Penalty-free withdrawals for retirement income after age 65'
    ],
    faqs: [
      {
        question: 'How much can I contribute to an HSA?',
        answer: 'For 2025, individuals can contribute up to $4,150 and families up to $8,300. Those age 55+ can add an extra $1,000 catch-up contribution. These limits are set by the IRS and typically increase annually.'
      },
      {
        question: 'What makes a plan HSA-qualified?',
        answer: 'HSA-qualified plans must meet IRS requirements including minimum deductibles and maximum out-of-pocket limits. Our Secure HSA plan is specifically designed to meet these requirements for HSA eligibility.'
      },
      {
        question: 'Can I take my HSA with me if I change plans?',
        answer: 'Yes! Your HSA is yours forever. Even if you change health plans, employers, or retire, your HSA stays with you. The funds never expire and continue growing tax-free throughout your lifetime.'
      },
      {
        question: 'What if I use HSA funds for non-medical expenses?',
        answer: 'Before age 65, non-medical withdrawals incur a 20% penalty plus income tax. After age 65, you can withdraw for any reason without penalty (just income tax like a traditional IRA), making it a powerful retirement savings vehicle.'
      }
    ],
    color: 'text-emerald-600',
    bgColor: 'bg-emerald-50',
    gradientFrom: 'from-emerald-500',
    gradientTo: 'to-teal-600',
    examples: [
      'Contributing $4,150/year saves $1,037 in taxes (25% tax bracket)',
      'Family saves $2,075 annually on $8,300 contribution at 25% tax rate',
      'Using HSA funds for $5,000 surgery saves $1,250 vs. paying with after-tax dollars',
      'Growing HSA balance from $10,000 to $50,000 over 15 years through investments',
      'Using HSA in retirement for Medicare premiums and healthcare costs tax-free'
    ]
  },
  {
    id: 'preventive-care',
    name: 'Preventative Care (ACA-Mandated)',
    icon: ShieldCheck,
    tagline: 'Proactive health screening and wellness',
    shortDescription: 'No-cost preventative care services as mandated by the Affordable Care Act including screenings, immunizations, and wellness visits',
    heroImage: 'https://images.pexels.com/photos/4173239/pexels-photo-4173239.jpeg?auto=compress&cs=tinysrgb&w=1260&h=750&dpr=2',
    detailedDescription: 'Prevention is the best medicine. Our preventative care benefit includes comprehensive screenings, immunizations, and wellness visits at no additional cost. Stay ahead of health problems by catching them early and maintaining good health through regular preventative services as mandated by the ACA.',
    keyPoints: [
      {
        title: 'No-Cost Screenings',
        description: 'Preventative services with no cost-sharing'
      },
      {
        title: 'Comprehensive Membership',
        description: 'Wide range of age-appropriate preventative care services'
      },
      {
        title: 'Early Detection',
        description: 'Catch health problems early when they\'re most treatable'
      },
      {
        title: 'Wellness Focus',
        description: 'Counseling and education to help you stay healthy'
      }
    ],
    howItWorks: [
      'Schedule your preventative care appointments with any licensed provider within the PHCS Network.',
      'Confirm with your provider that services are preventative (not diagnostic or treatment)',
      'Receive your preventative care services with no cost-sharing',
      'Provider bills according to preventative care codes for covered services',
      'No need to submit expenses - services are covered directly',
      'Repeat annually or per recommended schedules for ongoing preventative care'
    ],
    eligiblePlans: ['MEC+Essentials', 'Direct', 'Secure HSA'],
    membership: [
      'Annual wellness visits and physical exams',
      'Blood pressure, diabetes, and cholesterol screening',
      'Cancer screenings (mammograms, colonoscopy, cervical cancer)',
      'Immunizations for children and adults',
      'Well-child visits from birth through age 21',
      'Prenatal care for pregnant women',
      'Depression and behavioral health screening',
      'Obesity screening and counseling',
      'Tobacco cessation counseling',
      'STI screening and counseling',
      'Contraceptive counseling and FDA-approved methods',
      'Alcohol misuse screening and counseling',
      'Osteoporosis screening for at-risk individuals',
      'Vision and hearing screening for children'
    ],
    faqs: [
      {
        question: 'What\'s the difference between preventative and diagnostic care?',
        answer: 'Preventative care is routine screening when you have no symptoms (like an annual physical). Diagnostic care investigates symptoms or known conditions. Preventative services have no cost-sharing; diagnostic care may apply to your IUA.'
      },
      {
        question: 'How often can I get preventative screenings?',
        answer: 'Frequency depends on the service and your age/risk factors. Annual physicals are yearly, mammograms typically start at age 40, colonoscopies every 10 years starting at age 45-50. Your doctor will recommend appropriate schedules based on guidelines.'
      },
      {
        question: 'Are immunizations for international travel covered?',
        answer: 'Routine immunizations are included. Travel-specific vaccines (yellow fever, typhoid, etc.) may not be included in preventative care benefits. Check with your plan about membership for travel vaccinations.'
      },
      {
        question: 'What if something is found during preventative screening?',
        answer: 'The preventative screening itself has no cost-sharing. However, if the screening finds something requiring further testing or treatment, those follow-up services may have cost-sharing according to your plan\'s medical benefits.'
      }
    ],
    color: 'text-cyan-600',
    bgColor: 'bg-cyan-50',
    gradientFrom: 'from-cyan-500',
    gradientTo: 'to-blue-600',
    examples: [
      'Annual physical exam with bloodwork to check cholesterol, glucose, and thyroid',
      'Mammogram screening at age 40 to establish baseline breast health',
      'Colonoscopy at age 50 for colon cancer screening',
      'Well-child checkup for 2-year-old including developmental assessment',
      'Flu shot and Tdap booster immunizations for adults'
    ]
  },
  {
    id: 'membership-concierge',
    name: 'Membership Concierge',
    icon: Headphones,
    tagline: 'Personal support for all your healthcare needs',
    shortDescription: '24/7 access to knowledgeable support staff who help you navigate healthcare and maximize your benefits',
    heroImage: 'https://images.pexels.com/photos/7129713/pexels-photo-7129713.jpeg?auto=compress&cs=tinysrgb&w=1260&h=750&dpr=2',
    detailedDescription: 'Healthcare can be confusing. Our membership concierge team is here to help you understand your benefits, find providers, submit sharing requests, and answer any questions. Think of us as your personal healthcare guide—available whenever you need assistance navigating the system.',
    keyPoints: [
      {
        title: '24/7 Availability',
        description: 'Reach our team any time, day or night, for assistance'
      },
      {
        title: 'Benefit Guidance',
        description: 'Understand what\'s covered and how to maximize your benefits'
      },
      {
        title: 'Provider Assistance',
        description: 'Help finding doctors, specialists, and healthcare facilities'
      },
      {
        title: 'Sharing Support',
        description: 'Assistance submitting and tracking your sharing requests'
      }
    ],
    howItWorks: [
      'Contact our concierge team via phone, email, or secure member portal messaging',
      'Describe your question, concern, or healthcare need',
      'Our trained specialists provide personalized guidance and support',
      'We help you navigate benefits, find providers, or understand medical bills',
      'Follow up as needed - we\'re here throughout your healthcare journey',
      'Access our self-service resources and FAQs 24/7 through your member portal'
    ],
    eligiblePlans: ['Essentials', 'MEC+Essentials', 'Care Plus', 'Direct', 'Secure HSA'],
    membership: [
      '24/7 phone support from knowledgeable team members',
      'Benefit explanation and membership questions',
      'Help understanding medical bills and EOBs',
      'Provider search assistance and recommendations',
      'Sharing request submission guidance',
      'Sharing request status tracking and follow-up',
      'Coordination with healthcare providers',
      'Navigation support for complex medical situations',
      'Wellness program information and enrollment',
      'Billing and payment plan assistance',
      'Healthcare guidance and support services',
      'Prescription discount program support'
    ],
    faqs: [
      {
        question: 'How quickly can I reach someone?',
        answer: 'Our phone lines are answered 24/7 with typical wait times under 2 minutes. Email and portal messages are responded to within 24 hours on business days. For urgent situations, always call for immediate assistance.'
      },
      {
        question: 'Can the concierge team help me find a doctor?',
        answer: 'Yes! We can help you find primary care doctors, specialists, urgent care centers, hospitals, and other providers in your area. We\'ll explain your membership and any cost considerations for different provider types.'
      },
      {
        question: 'What if I need help understanding a medical bill?',
        answer: 'Our team can review medical bills with you, explain charges, help identify errors, and guide you through the sharing request process. We can also help negotiate bills and set up payment plans when appropriate.'
      }
    ],
    color: 'text-indigo-600',
    bgColor: 'bg-indigo-50',
    gradientFrom: 'from-indigo-500',
    gradientTo: 'to-purple-600',
    examples: [
      'Getting help finding an orthopedic surgeon for a knee injury',
      'Understanding confusing medical bill charges after a hospital stay',
      'Assistance submitting sharing request with proper documentation'
    ]
  },
  {
    id: 'pet-telehealth',
    name: 'Pet Telehealth',
    icon: PawPrint,
    tagline: '24/7/365 veterinary care for your furry family members',
    shortDescription: '$0, unlimited 24/7/365 access to virtual pet telehealth for your pets',
    heroImage: '/assets/image copy copy copy copy copy copy copy.png',
    detailedDescription: 'Your pets are family too. Our pet telehealth benefit provides $0, unlimited 24/7/365 access to licensed veterinarians via phone or video for health questions, concerns, and minor issues. Get professional advice about your dogs, cats, and other household pets without the stress and expense of an office visit.',
    keyPoints: [
      {
        title: '24/7/365 Vet Access',
        description: 'Talk to licensed veterinarians any time, day or night, every day of the year'
      },
      {
        title: 'Video or Phone',
        description: 'Choose video consultation to show symptoms or phone for quick questions'
      },
      {
        title: 'Expert Guidance',
        description: 'Professional advice from experienced veterinary professionals'
      },
      {
        title: 'Convenient Care',
        description: 'No travel, no waiting rooms, no stress for your pet'
      }
    ],
    howItWorks: [
      'Access pet telehealth through your member portal or dedicated app',
      'Request a consultation via phone or video with a licensed veterinarian',
      'Describe your pet\'s symptoms, behavior, or health concerns',
      'The vet provides guidance, recommendations, and next steps',
      'Receive advice on whether in-person care is needed',
      'Get follow-up support and ongoing guidance as needed'
    ],
    eligiblePlans: ['Care Plus', 'Direct', 'Secure HSA', 'Essentials', 'MEC+Essentials'],
    membership: [
      'Unlimited 24/7 consultations with licensed veterinarians',
      'Advice for dogs, cats, and other household pets',
      'Guidance on symptoms and behavior concerns',
      'Second opinions on diagnoses or treatment plans',
      'Medication questions and interactions',
      'Nutrition and diet recommendations',
      'Behavioral issues and training advice',
      'Preventive care guidance',
      'Emergency triage and decision support',
      'Post-surgery care questions',
      'Senior pet health management',
      'Puppy and kitten care guidance'
    ],
    faqs: [
      {
        question: 'Can the vet prescribe medications?',
        answer: 'Virtual veterinarians typically cannot prescribe medications as most states require an in-person examination to establish a veterinarian-client-patient relationship. The telehealth vet can provide recommendations and guide you on next steps, including when an in-person visit is necessary for prescriptions.'
      },
      {
        question: 'What types of issues can be addressed?',
        answer: 'Pet telehealth is great for health questions, minor concerns, behavioral issues, nutrition advice, and determining if emergency care is needed. Serious emergencies, injuries, or conditions requiring hands-on examination need in-person veterinary care.'
      },
      {
        question: 'Is there a limit on consultations?',
        answer: 'No! You have unlimited access to pet telehealth consultations. Use it as often as needed for your pets\' health questions and concerns throughout the year.'
      },
      {
        question: 'Do I need to be a pet insurance customer?',
        answer: 'No, pet telehealth is included as a membership benefit on eligible plans. You don\'t need separate pet insurance to access virtual vet consultations. This benefit is in addition to any pet insurance you may have.'
      }
    ],
    color: 'text-violet-600',
    bgColor: 'bg-violet-50',
    gradientFrom: 'from-violet-500',
    gradientTo: 'to-purple-600',
    examples: [
      'Late-night consultation about dog\'s vomiting to decide if ER visit needed',
      'Video call to show cat\'s skin rash and get treatment advice',
      'Advice about puppy\'s behavior and training approaches',
      'Second opinion on treatment plan recommended by regular vet',
      'Guidance on senior dog\'s mobility issues and pain management'
    ],
    disclaimer: 'Pet telehealth is NOT FOR EMERGENCIES. If you believe your pet has an emergency, call your vet immediately or contact the nearest Animal Hospital. Pet telehealth should not be considered veterinary care advice and is not a substitute for professional veterinary care advice, diagnosis, or treatment. It is NOT a replacement for regular in-office visits or vaccinations for your pet.'
  }
];

export const healthcareFeaturesOverview = {
  headline: 'Comprehensive Healthcare Features',
  subheadline: 'Explore comprehensive healthcare sharing options designed for your unique needs and budget.',
  heroImage: 'https://images.pexels.com/photos/5473955/pexels-photo-5473955.jpeg?auto=compress&cs=tinysrgb&w=1260&h=750&dpr=2',
  heroAlt: 'Healthcare features and benefits'
};
