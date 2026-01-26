import { DollarSign, Users, Shield, Heart, Globe, LucideIcon, Calendar, Stethoscope, HeartPulse, Home } from 'lucide-react';

export interface Benefit {
  id: string;
  icon: LucideIcon;
  title: string;
  description: string;
  angle: number;
}

export interface MaternityMembershipStage {
  id: string;
  icon: LucideIcon;
  title: string;
  description: string;
  details: string[];
}

export interface MaternityDetails {
  headline: string;
  description: string;
  waitingPeriod: string;
  eligiblePlans: string[];
  membershipStages: MaternityMembershipStage[];
  highlights: string[];
  sharingInfo: {
    prenatalCare: string;
    deliveryHospital: string;
    postnatalCare: string;
    additionalBenefits: string[];
  };
}

export const benefits: Benefit[] = [
  {
    id: 'save_30_60',
    icon: DollarSign,
    title: 'Save 30–60%',
    description: 'Typical families spend far less than traditional insurance.',
    angle: 0,
  },
  {
    id: 'community_support',
    icon: Users,
    title: 'Real Community Support',
    description: 'Your bills are shared by a nationwide member community.',
    angle: 60,
  },
  {
    id: 'any_provider',
    icon: Shield,
    title: 'Choose Any Provider',
    description: 'No networks. See any licensed doctor, anywhere.',
    angle: 120,
  },
  {
    id: 'transparent_pricing',
    icon: Heart,
    title: 'Transparent Pricing',
    description: 'Clear monthly amounts. No surprise bills.',
    angle: 180,
  },
  {
    id: 'worldwide_sharing',
    icon: Globe,
    title: 'Worldwide Sharing',
    description: 'Support that travels with you across the globe.',
    angle: 240,
  },
];

export const maternityDetails: MaternityDetails = {
  headline: 'Comprehensive Maternity Membership for Your Growing Family',
  description: 'Experience peace of mind throughout your pregnancy journey with our comprehensive maternity sharing program. From your first prenatal visit to bringing your baby home, we\'re here to help share the costs of this beautiful life milestone.',
  waitingPeriod: '6-month waiting period — conception must occur after 6 months of continuous membership. No waiting period for accidents or complications.',
  eligiblePlans: ['Care+', 'Direct', 'Secure HSA'],
  membershipStages: [
    {
      id: 'prenatal',
      icon: Calendar,
      title: 'Prenatal Care',
      description: 'Regular checkups and monitoring throughout pregnancy',
      details: [
        'Monthly prenatal visits with your OB/GYN',
        'Routine ultrasounds and screenings',
        'Blood work and diagnostic tests',
        'Nutritional counseling and education',
      ],
    },
    {
      id: 'delivery',
      icon: HeartPulse,
      title: 'Delivery & Hospital Stay',
      description: 'Complete membership for your delivery experience',
      details: [
        'Hospital or birthing center costs',
        'Physician and anesthesiologist fees',
        'C-section if medically necessary',
        'Standard postpartum hospital stay',
      ],
    },
    {
      id: 'postnatal',
      icon: Home,
      title: 'Postnatal Care',
      description: 'Support for mother and baby after delivery',
      details: [
        'Follow-up visits for mother',
        'Newborn hospital care',
        'Lactation consultation',
        'Postpartum wellness checkups',
      ],
    },
    {
      id: 'additional',
      icon: Stethoscope,
      title: 'Additional Support',
      description: 'Extra benefits for comprehensive care',
      details: [
        'Access to any licensed provider nationwide',
        '24/7 nurse hotline for questions',
        'Complications and emergencies covered',
        'No network restrictions for specialists',
      ],
    },
  ],
  highlights: [
    'Choose any OB/GYN or midwife nationwide',
    'No network restrictions or referrals required',
    'Transparent sharing amounts with no surprise bills',
    'Support from a caring community of families',
    'Membership for both routine and high-risk pregnancies',
  ],
  sharingInfo: {
    prenatalCare: 'Prenatal visits and routine care eligible after waiting period',
    deliveryHospital: 'Hospital delivery and associated costs shared according to plan terms',
    postnatalCare: 'Mother and newborn care covered for standard recovery period',
    additionalBenefits: [
      'Complications during pregnancy are eligible immediately',
      'Emergency services covered regardless of waiting period',
      'NICU care for newborns when medically necessary',
      'Virtual behavioral health support during and after pregnancy',
    ],
  },
};
