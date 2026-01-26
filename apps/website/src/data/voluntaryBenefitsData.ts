import {
  Shield,
  Heart,
  Eye,
  Users,
  Building2,
  AlertCircle,
  Smile,
  PawPrint,
  LucideIcon
} from 'lucide-react';

export interface BenefitFeature {
  title: string;
  description: string;
}

export interface BenefitFAQ {
  question: string;
  answer: string;
}

export interface BenefitPricingTier {
  name: string;
  priceRange: string;
  features: string[];
}

export interface VoluntaryBenefit {
  id: string;
  name: string;
  icon: LucideIcon;
  tagline: string;
  description: string;
  heroImage: string;
  detailedDescription: string;
  keyFeatures: BenefitFeature[];
  membership: string[];
  pricingTiers?: BenefitPricingTier[];
  eligibility: string[];
  faqs: BenefitFAQ[];
  color: string;
  bgColor: string;
  gradientFrom: string;
  gradientTo: string;
}

export const voluntaryBenefits: VoluntaryBenefit[] = [
  {
    id: 'disability',
    name: 'Disability',
    icon: Shield,
    tagline: 'Protect your income if you cannot work',
    description: 'Income protection when illness or injury prevents you from working',
    heroImage: 'https://images.pexels.com/photos/7176295/pexels-photo-7176295.jpeg?auto=compress&cs=tinysrgb&w=1260&h=750&dpr=2',
    detailedDescription: 'Disability insurance provides financial protection by replacing a portion of your income if you become unable to work due to illness or injury. This essential membership ensures you can continue to meet your financial obligations and maintain your standard of living during recovery.',
    keyFeatures: [
      {
        title: 'Short-Term Disability',
        description: 'Membership for temporary disabilities lasting weeks to months'
      },
      {
        title: 'Long-Term Disability',
        description: 'Extended membership for disabilities lasting months to years'
      },
      {
        title: 'Income Replacement',
        description: 'Typically replaces 50-70% of your pre-disability income'
      },
      {
        title: 'Flexible Waiting Periods',
        description: 'Choose elimination periods that fit your financial situation'
      }
    ],
    membership: [
      'Replaces portion of lost income during disability',
      'Covers both illness and injury-related disabilities',
      'Benefits continue during recovery period',
      'No restrictions on how benefits are used',
      'Portable membership that follows you between jobs'
    ],
    pricingTiers: [
      {
        name: 'Short-Term',
        priceRange: '$15-$40/month',
        features: ['3-6 month benefit period', '50-60% income replacement', '7-14 day elimination period']
      },
      {
        name: 'Long-Term',
        priceRange: '$40-$150/month',
        features: ['2-5 year or to age 65 benefits', '50-70% income replacement', '90-180 day elimination period']
      }
    ],
    eligibility: [
      'Must be actively employed or self-employed',
      'Minimum income requirements typically apply',
      'Pre-membership conditions may have waiting periods',
      'Medical underwriting may be required'
    ],
    faqs: [
      {
        question: 'What is the difference between short-term and long-term disability?',
        answer: 'Short-term disability provides membership for temporary disabilities, typically lasting 3-6 months. Long-term disability kicks in after short-term benefits end and can last for years or until retirement age, depending on the policy.'
      },
      {
        question: 'When do benefits start?',
        answer: 'After an elimination period (waiting period) which ranges from 7 days to 6 months depending on your policy. You choose this period when purchasing membership.'
      },
      {
        question: 'Is Social Security Disability the same?',
        answer: 'No. Social Security Disability Insurance (SSDI) is a government program with strict qualification requirements and a lengthy approval process. Private disability insurance provides faster benefits and more flexibility.'
      }
    ],
    color: 'text-blue-600',
    bgColor: 'bg-blue-50',
    gradientFrom: 'from-blue-500',
    gradientTo: 'to-blue-600'
  },
  {
    id: 'critical-illness',
    name: 'Critical Illness',
    icon: Heart,
    tagline: 'Lump-sum payment for major health diagnoses',
    description: 'Financial support when diagnosed with serious conditions like cancer or heart attack',
    heroImage: 'https://images.pexels.com/photos/7176026/pexels-photo-7176026.jpeg?auto=compress&cs=tinysrgb&w=1260&h=750&dpr=2',
    detailedDescription: 'Critical illness insurance provides a lump-sum cash payment upon diagnosis of a covered serious medical condition. Use the funds for any purpose—medical bills, mortgage payments, experimental treatments, or everyday expenses during recovery.',
    keyFeatures: [
      {
        title: 'Lump-Sum Payment',
        description: 'Receive full benefit amount upon diagnosis, not based on treatment costs'
      },
      {
        title: 'Broad Membership',
        description: 'Covers major conditions including cancer, heart attack, stroke, and more'
      },
      {
        title: 'Flexible Use',
        description: 'Use funds for any purpose without restrictions'
      },
      {
        title: 'Multiple Claims',
        description: 'Some policies allow claims for different covered conditions'
      }
    ],
    membership: [
      'Heart attack, stroke, and coronary artery bypass surgery',
      'Cancer (various types and stages)',
      'Major organ transplant',
      'Kidney failure requiring dialysis',
      'Paralysis and loss of limbs',
      'Severe burns and other traumatic injuries'
    ],
    pricingTiers: [
      {
        name: 'Basic Membership',
        priceRange: '$25-$75/month',
        features: ['$10,000-$25,000 benefit', 'Core conditions covered', 'Basic benefits']
      },
      {
        name: 'Comprehensive Membership',
        priceRange: '$75-$200/month',
        features: ['$25,000-$100,000 benefit', 'Extended conditions', 'Additional riders available']
      }
    ],
    eligibility: [
      'Available to adults typically ages 18-65',
      'Medical questionnaire or exam may be required',
      'Pre-membership conditions may be excluded',
      'Some policies offer guaranteed issue options'
    ],
    faqs: [
      {
        question: 'How much do I receive if diagnosed?',
        answer: 'You receive the full benefit amount you selected when purchasing the policy, typically ranging from $10,000 to $100,000 or more, paid as a lump sum shortly after diagnosis.'
      },
      {
        question: 'Can I use the money for anything?',
        answer: 'Yes. Unlike traditional health insurance, critical illness benefits can be used for any purpose—medical bills, mortgage payments, travel for treatment, experimental therapies, or everyday expenses.'
      },
      {
        question: 'What conditions are typically covered?',
        answer: 'Most policies cover heart attack, stroke, cancer, organ transplant, kidney failure, paralysis, and severe burns. Membership varies by policy, so review your specific plan details.'
      }
    ],
    color: 'text-red-600',
    bgColor: 'bg-red-50',
    gradientFrom: 'from-red-500',
    gradientTo: 'to-rose-600'
  },
  {
    id: 'vision',
    name: 'Vision',
    icon: Eye,
    tagline: 'Comprehensive eye care and eyewear membership',
    description: 'Affordable membership for routine eye exams, glasses, and contact lenses',
    heroImage: 'https://images.pexels.com/photos/5752282/pexels-photo-5752282.jpeg?auto=compress&cs=tinysrgb&w=1260&h=750&dpr=2',
    detailedDescription: 'Vision insurance helps make eye care affordable with membership for routine eye exams, prescription glasses, contact lenses, and often discounts on LASIK surgery. Maintain your eye health and look great with comprehensive vision benefits.',
    keyFeatures: [
      {
        title: 'Annual Eye Exams',
        description: 'Comprehensive eye exams covered once per year'
      },
      {
        title: 'Frames & Lenses',
        description: 'Allowance for prescription glasses with lens enhancements'
      },
      {
        title: 'Contact Lenses',
        description: 'Membership for daily, weekly, or monthly contact lenses'
      },
      {
        title: 'LASIK Discounts',
        description: 'Significant savings on vision correction procedures'
      }
    ],
    membership: [
      'Annual comprehensive eye exams',
      'Prescription eyeglasses (frames and lenses)',
      'Contact lenses (in lieu of glasses)',
      'Lens enhancements (anti-glare, transitions, etc.)',
      'Discounts on additional pairs',
      'LASIK and PRK surgery discounts',
      'Large network of providers'
    ],
    pricingTiers: [
      {
        name: 'Individual',
        priceRange: '$8-$20/month',
        features: ['Annual eye exam', '$150 frame allowance', 'Standard lens membership']
      },
      {
        name: 'Family',
        priceRange: '$20-$50/month',
        features: ['Membership for entire family', 'Higher frame allowances', 'Enhanced lens options']
      }
    ],
    eligibility: [
      'Available to individuals and families',
      'No medical underwriting required',
      'Immediate membership for exams and materials',
      'No waiting periods for routine benefits'
    ],
    faqs: [
      {
        question: 'How often can I get new glasses?',
        answer: 'Most vision plans provide a new frame allowance once per year and new lenses once per year. Some plans offer more frequent benefits for contact lenses.'
      },
      {
        question: 'Can I use any eye doctor?',
        answer: 'You will save the most using in-network providers, but most plans offer out-of-network benefits with reimbursement options. Check your plan\'s provider network.'
      },
      {
        question: 'Are contact lenses covered?',
        answer: 'Yes, most plans cover contact lenses in lieu of glasses. You typically choose between glasses or contacts each benefit period, though some plans offer both with different allowances.'
      }
    ],
    color: 'text-teal-600',
    bgColor: 'bg-teal-50',
    gradientFrom: 'from-teal-500',
    gradientTo: 'to-cyan-600'
  },
  {
    id: 'life',
    name: 'Life',
    icon: Users,
    tagline: 'Financial protection for your loved ones',
    description: 'Provide financial security for your family in the event of your passing',
    heroImage: 'https://images.pexels.com/photos/6932847/pexels-photo-6932847.jpeg?auto=compress&cs=tinysrgb&w=1260&h=750&dpr=2',
    detailedDescription: 'Life insurance provides a tax-free death benefit to your beneficiaries, helping them maintain financial stability after your passing. Whether covering final expenses, replacing lost income, or funding future goals, life insurance gives you peace of mind.',
    keyFeatures: [
      {
        title: 'Term Life Insurance',
        description: 'Affordable membership for specific time periods (10, 20, 30 years)'
      },
      {
        title: 'Whole Life Insurance',
        description: 'Permanent membership with cash value accumulation'
      },
      {
        title: 'Flexible Membership Amounts',
        description: 'Choose benefit amounts from $50,000 to $1 million or more'
      },
      {
        title: 'Conversion Options',
        description: 'Convert term policies to permanent membership without medical exam'
      }
    ],
    membership: [
      'Death benefit paid to beneficiaries',
      'Covers death from illness, accident, or natural causes',
      'Tax-free benefit for beneficiaries',
      'Living benefits for terminal illness (on some policies)',
      'Accidental death and dismemberment riders available',
      'Waiver of premium if disabled'
    ],
    pricingTiers: [
      {
        name: 'Term Life',
        priceRange: '$20-$100/month',
        features: ['$100,000-$500,000 membership', '10-30 year terms', 'Level premiums']
      },
      {
        name: 'Whole Life',
        priceRange: '$100-$500/month',
        features: ['Lifetime membership', 'Cash value growth', 'Guaranteed premiums']
      }
    ],
    eligibility: [
      'Available to adults typically ages 18-70',
      'Medical exam may be required for larger amounts',
      'Simplified or guaranteed issue options available',
      'Rates based on age, health, and lifestyle'
    ],
    faqs: [
      {
        question: 'How much life insurance do I need?',
        answer: 'A common guideline is 10-12 times your annual income. Consider your debts, mortgage, income replacement needs, and future expenses like college tuition when determining membership amount.'
      },
      {
        question: 'What is the difference between term and whole life?',
        answer: 'Term life provides membership for a specific period (like 20 years) at lower premiums. Whole life provides permanent membership with a savings component, but costs more. Term is ideal for temporary needs; whole life for lifetime protection.'
      },
      {
        question: 'Who should be my beneficiary?',
        answer: 'You can name anyone—spouse, children, other family members, or even a trust or charity. You can also name multiple beneficiaries and specify how the benefit is divided among them.'
      }
    ],
    color: 'text-green-600',
    bgColor: 'bg-green-50',
    gradientFrom: 'from-green-500',
    gradientTo: 'to-emerald-600'
  },
  {
    id: 'hospital',
    name: 'Hospital',
    icon: Building2,
    tagline: 'Cash benefits for hospital stays and procedures',
    description: 'Fixed cash payments for hospital admissions, surgeries, and stays',
    heroImage: 'https://images.pexels.com/photos/7089364/pexels-photo-7089364.jpeg?auto=compress&cs=tinysrgb&w=1260&h=750&dpr=2',
    detailedDescription: 'Hospital indemnity insurance pays fixed cash benefits directly to you when you are hospitalized. These benefits supplement your health membership by helping with out-of-pocket costs, lost wages, or everyday expenses during your hospital stay and recovery.',
    keyFeatures: [
      {
        title: 'Admission Benefits',
        description: 'Lump-sum payment upon hospital admission'
      },
      {
        title: 'Daily Stay Benefits',
        description: 'Fixed amount for each day of inpatient hospital care'
      },
      {
        title: 'Surgical Benefits',
        description: 'Additional payments for covered surgical procedures'
      },
      {
        title: 'ICU Membership',
        description: 'Enhanced benefits for intensive care unit stays'
      }
    ],
    membership: [
      'Inpatient hospital admission benefits',
      'Daily hospital confinement payments',
      'Intensive care unit (ICU) stays',
      'Surgical procedure benefits',
      'Emergency room visit benefits',
      'Ambulance transportation',
      'Outpatient surgery benefits'
    ],
    pricingTiers: [
      {
        name: 'Standard Plan',
        priceRange: '$30-$75/month',
        features: ['$1,000 admission benefit', '$200/day stay benefit', 'Basic surgical membership']
      },
      {
        name: 'Enhanced Plan',
        priceRange: '$75-$150/month',
        features: ['$2,000+ admission benefit', '$300-500/day stay benefit', 'Comprehensive surgical membership']
      }
    ],
    eligibility: [
      'Available to individuals and families',
      'Limited medical underwriting',
      'Guaranteed issue options often available',
      'Pre-membership conditions may have waiting periods'
    ],
    faqs: [
      {
        question: 'How do I receive the benefits?',
        answer: 'Benefits are paid directly to you (not the hospital) based on the services received. Simply submit a claim with hospital documentation, and receive payment regardless of your other insurance.'
      },
      {
        question: 'Can I use this with my regular health insurance?',
        answer: 'Yes! Hospital indemnity insurance is supplemental and works alongside your health insurance. It pays benefits directly to you regardless of what your health insurance pays.'
      },
      {
        question: 'What if I need multiple hospital stays?',
        answer: 'Most policies cover multiple hospital stays throughout the year. Each admission triggers new admission benefits, and daily benefits apply to each stay.'
      }
    ],
    color: 'text-blue-600',
    bgColor: 'bg-blue-50',
    gradientFrom: 'from-blue-600',
    gradientTo: 'to-indigo-600'
  },
  {
    id: 'accident',
    name: 'Accident',
    icon: AlertCircle,
    tagline: 'Membership for injuries from unexpected accidents',
    description: 'Financial assistance for emergency care, fractures, and accident-related expenses',
    heroImage: 'https://images.pexels.com/photos/7579831/pexels-photo-7579831.jpeg?auto=compress&cs=tinysrgb&w=1260&h=750&dpr=2',
    detailedDescription: 'Accident insurance provides cash benefits for injuries resulting from covered accidents. From emergency room visits to fractures, dislocations, and more, this membership helps offset the financial impact of unexpected injuries with fixed benefit payments directly to you.',
    keyFeatures: [
      {
        title: 'Emergency Care',
        description: 'Benefits for emergency room visits and urgent care'
      },
      {
        title: 'Fractures & Dislocations',
        description: 'Fixed payments based on type and severity of injury'
      },
      {
        title: 'Transportation',
        description: 'Ambulance and medical transportation membership'
      },
      {
        title: 'Follow-up Care',
        description: 'Benefits for physical therapy and rehabilitation'
      }
    ],
    membership: [
      'Emergency room treatment',
      'Urgent care center visits',
      'Fractures and dislocations',
      'Burns and lacerations requiring treatment',
      'Ambulance transportation',
      'Hospitalization due to accidents',
      'Surgery following accidents',
      'Physical therapy and rehabilitation',
      'Prosthetic devices',
      'Death and dismemberment benefits'
    ],
    pricingTiers: [
      {
        name: 'Individual',
        priceRange: '$10-$30/month',
        features: ['$250-500 ER benefit', 'Fracture benefits up to $5,000', 'Basic membership']
      },
      {
        name: 'Family',
        priceRange: '$30-$80/month',
        features: ['$500-1,000 ER benefit', 'Enhanced fracture benefits', 'Comprehensive membership']
      }
    ],
    eligibility: [
      'Available to individuals and families',
      'No medical exam required',
      'Membership typically starts immediately',
      'No age restrictions for most plans'
    ],
    faqs: [
      {
        question: 'What types of accidents are covered?',
        answer: 'Membership includes injuries from slips and falls, sports injuries, car accidents, burns, lacerations, fractures, dislocations, and other accidental injuries. Each policy has specific covered events listed.'
      },
      {
        question: 'How much will I receive for a fracture?',
        answer: 'Benefit amounts vary by bone and severity. For example, a broken arm might pay $2,000-$4,000, while a hip fracture could pay $6,000-$10,000 depending on your policy.'
      },
      {
        question: 'Do benefits cover my children\'s sports injuries?',
        answer: 'Yes! Family plans cover accidental injuries to all covered family members, including sports-related injuries at school, practice, or organized activities.'
      }
    ],
    color: 'text-orange-600',
    bgColor: 'bg-orange-50',
    gradientFrom: 'from-orange-500',
    gradientTo: 'to-red-600'
  },
  {
    id: 'dental',
    name: 'Dental',
    icon: Smile,
    tagline: 'Complete oral health membership',
    description: 'Membership for preventive care, fillings, crowns, and major dental work',
    heroImage: 'https://images.pexels.com/photos/3845653/pexels-photo-3845653.jpeg?auto=compress&cs=tinysrgb&w=1260&h=750&dpr=2',
    detailedDescription: 'Dental insurance helps make oral health care affordable with membership for preventive services like cleanings and exams, basic procedures like fillings, and major services like crowns and root canals. Maintain a healthy smile while protecting your budget.',
    keyFeatures: [
      {
        title: 'Preventive Care',
        description: '100% membership for cleanings, exams, and X-rays'
      },
      {
        title: 'Basic Procedures',
        description: 'Fillings, extractions, and basic restorations covered at 70-80%'
      },
      {
        title: 'Major Services',
        description: 'Crowns, bridges, dentures covered at 50%'
      },
      {
        title: 'Orthodontics',
        description: 'Optional membership for braces and aligners for children and adults'
      }
    ],
    membership: [
      'Preventive care: cleanings, exams, X-rays (100% membership)',
      'Basic procedures: fillings, extractions (70-80% membership)',
      'Major services: crowns, bridges, root canals (50% membership)',
      'Emergency dental care',
      'Periodontal (gum) disease treatment',
      'Orthodontics (braces/aligners) on select plans',
      'Large network of dentists nationwide'
    ],
    pricingTiers: [
      {
        name: 'Individual',
        priceRange: '$20-$50/month',
        features: ['$1,000-1,500 annual max', 'Preventive + basic + major', 'No orthodontics']
      },
      {
        name: 'Family with Ortho',
        priceRange: '$60-$150/month',
        features: ['$1,500-2,000 annual max per person', 'All services included', 'Orthodontics for kids']
      }
    ],
    eligibility: [
      'Available to individuals and families',
      'No medical exam required',
      'Waiting periods may apply for major services (6-12 months)',
      'Missing tooth clauses may apply'
    ],
    faqs: [
      {
        question: 'What is a dental annual maximum?',
        answer: 'The annual maximum is the most your dental plan will pay for covered services in a year, typically $1,000-$2,000 per person. Preventive care often does not count toward this limit.'
      },
      {
        question: 'Can I choose my own dentist?',
        answer: 'Most plans have a network of dentists offering the best rates. You can often use out-of-network dentists but may pay higher out-of-pocket costs. PPO plans offer the most flexibility.'
      },
      {
        question: 'Are there waiting periods?',
        answer: 'Preventive care is usually available immediately. Basic procedures may have a 3-6 month waiting period, and major services often require 6-12 months. Some employers waive waiting periods.'
      }
    ],
    color: 'text-cyan-600',
    bgColor: 'bg-cyan-50',
    gradientFrom: 'from-cyan-500',
    gradientTo: 'to-blue-600'
  },
  {
    id: 'pet',
    name: 'Pet',
    icon: PawPrint,
    tagline: 'Healthcare membership for your furry family members',
    description: 'Veterinary expense membership for accidents, illnesses, and wellness care',
    heroImage: '/assets/image copy copy copy copy copy copy copy.png',
    detailedDescription: 'Pet insurance helps you provide the best veterinary care for your dogs and cats without the financial stress. Membership includes accidents, illnesses, surgeries, medications, and optional wellness care for routine veterinary visits.',
    keyFeatures: [
      {
        title: 'Accident & Illness',
        description: 'Membership for injuries, sickness, and emergency care'
      },
      {
        title: 'Any Licensed Vet',
        description: 'Visit any licensed veterinarian in the US or Canada'
      },
      {
        title: 'Fast Reimbursement',
        description: 'Get reimbursed within days of claim submission'
      },
      {
        title: 'Wellness Add-On',
        description: 'Optional membership for routine care like vaccines and checkups'
      }
    ],
    membership: [
      'Emergency accidents and injuries',
      'Illnesses and chronic conditions',
      'Surgery and hospitalization',
      'Diagnostic tests and imaging',
      'Prescription medications',
      'Cancer treatment',
      'Hereditary and congenital conditions',
      'Optional wellness membership: vaccines, checkups, dental cleaning'
    ],
    pricingTiers: [
      {
        name: 'Accident Only',
        priceRange: '$10-$20/month per pet',
        features: ['Emergency injuries only', 'Lower premiums', 'Basic protection']
      },
      {
        name: 'Accident & Illness',
        priceRange: '$30-$80/month per pet',
        features: ['Comprehensive membership', '70-90% reimbursement', 'Wellness add-on available']
      }
    ],
    eligibility: [
      'Dogs and cats typically 8 weeks or older',
      'No upper age limit for enrollment',
      'Pre-membership conditions not included',
      'Waiting periods: 14 days illness, 2 days accidents',
      'Some breeds may have restrictions'
    ],
    faqs: [
      {
        question: 'What is a reimbursement percentage?',
        answer: 'After you pay the vet and meet your deductible, pet insurance reimburses you a percentage (typically 70-90%) of covered costs. You choose your reimbursement level when purchasing the policy.'
      },
      {
        question: 'Are pre-membership conditions covered?',
        answer: 'No, like human health insurance, pre-membership conditions are not covered. That is why it is best to enroll pets when they are young and healthy.'
      },
      {
        question: 'Can I use any veterinarian?',
        answer: 'Yes! Most pet insurance policies allow you to visit any licensed veterinarian, specialist, or emergency clinic in the US and Canada. There are no networks or restrictions.'
      }
    ],
    color: 'text-purple-600',
    bgColor: 'bg-purple-50',
    gradientFrom: 'from-purple-500',
    gradientTo: 'to-pink-600'
  }
];

export const voluntaryBenefitsOverview = {
  headline: 'Comprehensive Healthcare Features',
  subheadline: 'Explore comprehensive healthcare sharing options designed for your unique needs and budget.',
  heroImage: 'https://images.pexels.com/photos/5473955/pexels-photo-5473955.jpeg?auto=compress&cs=tinysrgb&w=1260&h=750&dpr=2',
  heroAlt: 'Happy family enjoying time together'
};
