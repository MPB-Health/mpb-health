import { useState, useRef, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  GraduationCap,
  Play,
  CheckCircle2,
  Clock,
  Search,
  ChevronDown,
  ChevronRight,
  ChevronLeft,
  Video,
  FileText,
  HelpCircle,
  BookOpen,
  Award,
  ExternalLink,
  Shield,
  Users,
  Briefcase,
  Heart,
  Globe,
  ClipboardList,
  ArrowRight,
  Download,
  RotateCcw,
  Trophy,
  XCircle,
} from 'lucide-react';
import { useAdvisor } from '../contexts/AdvisorContext';

interface TrainingProps {
  section?: 'mpb' | 'sedera' | 'zion';
}

interface Lesson {
  id: string;
  title: string;
  type: 'video' | 'text' | 'quiz' | 'form' | 'resource';
  duration?: string;
  vimeoId?: string;
  videoUrl?: string;
  content?: string;
  resourceLinks?: { label: string; url: string }[];
}

interface Topic {
  id: string;
  title: string;
  icon: React.ElementType;
  lessons: Lesson[];
}

const mpbCourseTopics: Topic[] = [
  {
    id: 'introduction',
    title: 'Introduction',
    icon: BookOpen,
    lessons: [
      {
        id: 'about-us',
        title: 'About Us',
        type: 'video',
        duration: '00:58',
        vimeoId: '1020734417',
        content:
          'At MPB Health, we believe in a different approach to healthcare. As part of MPowering Benefits Inc., we\'re on a mission to improve lives by offering innovative alternatives to traditional health insurance.\n\nOur dedicated team is passionate about helping individuals achieve their unique health goals. We provide a diverse range of services to address your specific needs, whether it\'s physical health, or mental well-being, we are here to empower you to lead a healthier and happier life.\n\n**More than just solutions, we offer knowledge and support.**\n\nWe go beyond simply providing services. Our commitment extends to offering educational resources and ongoing support for our members. Our goal is to equip you with the knowledge and tools you need to make informed decisions about your health journey. By empowering you with this knowledge, we hope to foster long-term well-being and a healthier you.',
      },
      {
        id: 'mission',
        title: 'Mission',
        type: 'video',
        duration: '00:38',
        vimeoId: '1042339977',
        content:
          'Our mission is to empower people to live healthier and happier lives with innovative, comprehensive healthcare solutions. We help our members make informed decisions about their healthcare by providing accessible, affordable, and personalized options.',
      },
      {
        id: 'vision-values',
        title: 'Vision & Values',
        type: 'text',
        content:
          '**VISION**\n\nTo be the go-to source for all healthcare needs.\n\n**VALUES**\n\n**Care**\nProviding quality service, being transparent and accountable, and offering proactive assistance to our customers\n\n**Compassion**\nThrough kindness and understanding, both in how we serve our customers and how we interact with each other.\n\n**Transparency**\nEnsuring that all information is communicated clearly between ourselves and our customers or partners.\n\n**Trust**\nProviding honest advice, fair pricing, reliable services, and excellent customer service that meets clients\' needs.',
      },
    ],
  },
  {
    id: 'becoming-advisor',
    title: 'Becoming a Healthcare Advisor',
    icon: Users,
    lessons: [
      {
        id: 'benefits-advisor',
        title: 'Benefits of Being a Healthcare Advisor',
        type: 'text',
        content:
          'Offer what your competition does not.\n\nExpand your catalog of services and solutions to meet all of your client\'s needs.\n\nAllows your customers to obtain a solution that would provide them with the benefits they need at a fraction of the cost of traditional insurance.\n\nOpen Network \u2013 and no Open Enrollment Periods.\n\nThe ideal demographic would be small business owners, individuals, and families who are in general good health and make too much money to qualify for a subsidy on an exchange.\n\nWe provide you with your own landing page, that you could market separately or use on your website. Training, ongoing agent and member support, through agent development and concierge. Depending on product, we offer competitive commissions paid monthly.',
      },
      {
        id: 'what-is-expected',
        title: 'What is Expected',
        type: 'text',
        content:
          '**What is Expected From You as a Healthcare Advisor?**\n\nOur Healthcare Advisors must go through our on-boarding process and service offering training in order to sell any of our MPB products, offer advice, and provide clear instructions and guidance throughout the process.\n\n\u2022 Deliver fast, efficient, and accurate information, including prompt responses to inquiries: Whether online, by phone, or in person. Providing valid information tells customers that you respect their attention and time.\n\n\u2022 Provide an open channel for communication and feedback: Respond quickly and personally to concerns of high interest to customers.\n\n\u2022 Treat Customers fairly and with respect.\n\n\u2022 Follow up as soon as possible with prospects or members regarding any concerns or requests.\n\n\u2022 Maintain good communication with members: Create a significant impact on retention and strengthen customer relationships.\n\n\u2022 Provide Options: Customers don\'t want to hear that there is only one way or a single solution. They may respond positively when they\'re given a selection. Options are essential because they create dialogue.\n\n\u2022 Create trust: As technology opens new doors, overwhelmed customers find themselves looking for someone to guide them through the challenges they face. Many products and services are difficult to distinguish, creating an opportunity for advisors who can build trust.',
      },
      {
        id: 'choose-right-plan',
        title: 'How to choose the right plan for your clients',
        type: 'text',
        content:
          'As a Healthcare Advisor, you can assist potential members in selecting the ideal plan by employing a series of pre-qualifying questions. For instance:\n\n\u2022 What type of plan are you currently enrolled in?\n\u2022 What aspects of your current plan do you find favorable?\n\u2022 Are there any aspects you are dissatisfied with?\n\u2022 How much are you currently paying for your plan?\n\u2022 Do you have any pre-existing medical conditions?\n\u2022 Are you taking any prescription medications?\n\u2022 Who do you intend to include in your coverage?\n\nBy actively listening to their responses, you can discern their unique needs and preferences, and recommend the most suitable plan. This approach eliminates confusion, simplifies the sales process, and enhances customer satisfaction.',
      },
      {
        id: 'sales-tips',
        title: 'Watch Video: Sales Tips',
        type: 'video',
        vimeoId: '1042341241',
      },
    ],
  },
  {
    id: 'benefits-memberships',
    title: 'Benefits Included in our Memberships',
    icon: Heart,
    lessons: [
      {
        id: 'medical-cost-sharing',
        title: 'Medical Cost Sharing',
        type: 'video',
        duration: '04:12',
        vimeoId: '1120296253',
        content:
          'Medical cost sharing is a healthcare model that has gained popularity in recent years as an alternative to traditional health insurance. It involves a group of individuals who come together to share medical expenses.\n\n**Health Sharing Roots**\n\nHealth sharing has roots in two main ideas:\n\n\u2022 Community Support: The concept of sharing resources within a community to help those facing hardship stretches back far, with some seeing connections to religious principles of shared burdens.\n\n\u2022 Rising Healthcare Costs: In the late 20th century, particularly the 1980s, healthcare costs were skyrocketing. This led some people to look for alternatives to traditional health insurance.\n\nThese two factors came together to create the modern health sharing ministry.\n\n**The Initial Unshareable Amount (IUA)**\n\nThe Initial Unshareable Amount (IUA) is the amount that the member is responsible for paying before eligible medical costs are shared within the community.\n\n**What is a \u201cNeed\u201d?**\n\nA \u201cNeed\u201d is a medical incident or illness that requires treatment. Each Need often has its own IUA.\n\n1. Medical Expense: Member incurs a medical expense (e.g., $10,000).\n2. IUA is Paid: Initial Unshareable Amount (IUA) is paid by the member (e.g., $1,000).\n3. Submit Need: Member submits the need to the HealthShare organization.\n4. Community Shares: Remaining amount (e.g., $9,000) of eligible medical need is shared by the community.',
      },
      {
        id: 'mec',
        title: 'Minimum Essential Coverage (MEC)',
        type: 'text',
        content:
          'Covers preventive care at 100% with no waiting period or limitations on pre-existing conditions and uses out-of-network reference-based pricing (RBP).\n\nServices include:\n\n\u2022 Annual Wellness Visit\n\u2022 Health Screenings\n\u2022 Immunizations\n\u2022 Cancer Screenings\n\u2022 Child\'s Vision Acuity Screening\n\nFor more information visit: https://www.healthcare.gov/coverage/preventive-care-benefits/',
      },
      {
        id: 'virtual-health',
        title: 'Virtual Health',
        type: 'video',
        duration: '01:46',
        vimeoId: '1119906028',
      },
      {
        id: 'mpb-concierge',
        title: 'MPB Concierge',
        type: 'text',
        content:
          'The Concierge\u2019s primary function is to be a trusted guide and advocate for members, ensuring they receive the best possible care. This involves providing personalized assistance at every stage of their healthcare journey.\n\nThe Concierges offer a range of support, including but not limited to:\n\n**Finding Cost-Effective Services**\n\n\u2022 Medication pricing: They can research different pharmacies and compare prices to help members find the most affordable medications.\n\u2022 Laboratory and imaging costs: The concierge can identify facilities that offer competitive rates for lab tests and imaging procedures.\n\n**Identifying High-Quality Providers**\n\n\u2022 Researching providers: They can use databases and member reviews to find qualified doctors, specialists, and hospitals.\n\u2022 Matching members with providers: The concierge can recommend providers based on the member\u2019s specific needs and preferences.',
      },
      {
        id: 'supplements',
        title: 'Discounted Supplements & Wellness Products',
        type: 'text',
        content:
          'Members enjoy exclusive access to discounted health supplements and wellness products:\n\n\u2022 Premium-quality vitamins and supplements\n\u2022 Wellness and fitness products\n\u2022 Personal care items\n\u2022 Exclusive member pricing\n\u2022 Convenient online ordering\n\nThis benefit helps members maintain their health proactively with affordable access to top-quality wellness products.',
      },
      {
        id: 'debt-dismissal',
        title: 'Debt Dismissal Program',
        type: 'text',
        content:
          'The Debt Dismissal Program helps members manage and reduce medical debt:\n\n\u2022 Professional medical bill negotiation\n\u2022 Debt reduction assistance\n\u2022 Financial counseling support\n\u2022 Guidance on medical billing processes\n\u2022 Help resolving billing disputes\n\nThis program provides valuable financial relief and support for members dealing with medical expenses.',
      },
    ],
  },
  {
    id: 'memberships',
    title: 'Memberships',
    icon: Shield,
    lessons: [
      {
        id: 'comparison-chart',
        title: 'Memberships Comparison Chart',
        type: 'text',
        content:
          'Compare our membership tiers to find the right fit for each client. Each tier includes a unique combination of benefits designed to meet different healthcare needs and budgets.\n\nKey comparison areas:\n\n\u2022 Monthly contribution amounts\n\u2022 Medical cost sharing limits\n\u2022 Included benefits (MEC, Virtual Health, Concierge, etc.)\n\u2022 Family coverage options\n\u2022 Waiting periods\n\u2022 Maximum sharing amounts\n\nRefer to the official MPB membership comparison chart for the most up-to-date pricing and benefit details.',
      },
      {
        id: 'do-not-sell',
        title: 'Do Not Sell States',
        type: 'text',
        content:
          'Important: Certain membership plans may not be available in all states. Before presenting options to a potential member, always verify state availability.\n\nRefer to the current \u201cDo Not Sell\u201d state list on the advisor portal for the most up-to-date information on restricted states and products.',
      },
      {
        id: 'important-message',
        title: 'Important Message',
        type: 'text',
        content:
          'Important Compliance Reminder:\n\nAs an MPB Healthcare Advisor, it is critical that you:\n\n\u2022 Never misrepresent our programs as health insurance\n\u2022 Always use approved language and terminology\n\u2022 Follow all state and federal compliance guidelines\n\u2022 Present accurate information about benefits and limitations\n\u2022 Disclose all relevant terms and conditions\n\u2022 Maintain ethical sales practices at all times\n\nViolation of compliance guidelines may result in termination of your advisor agreement.',
      },
      {
        id: 'memberships-video',
        title: 'Watch Video',
        type: 'video',
        duration: '05:12',
        vimeoId: '1115561411',
      },
    ],
  },
  {
    id: 'advisor-landing-page',
    title: 'Understanding Your Advisor Landing Page',
    icon: Globe,
    lessons: [
      {
        id: 'mastering-landing-page',
        title: 'Mastering Your Advisor Landing Page',
        type: 'video',
        duration: '12:59',
        videoUrl: 'https://training.mpb.health/wp-content/uploads/2025/07/Advisor-Landing-Page-Training-20250424_144214-Meeting-Recording.mp4',
        content:
          'Your advisor landing page is a personalized marketing and enrollment tool. It acts as your digital storefront, allowing prospects to:\n\n\u2022 Learn about MPB Health\u2019s memberships\n\u2022 Understand the benefits of medical cost sharing\n\u2022 Schedule a consultation with you directly\n\u2022 Start their enrollment process with your guidance',
      },
    ],
  },
  {
    id: 'get-started',
    title: 'Get Started',
    icon: Briefcase,
    lessons: [
      {
        id: 'networking',
        title: 'Best Platforms & Apps for Networking',
        type: 'text',
        content:
          '**LinkedIn**\nA professional networking site that allows you to connect with other professionals in your field and build your network.\n\n**Facebook Groups**\nA social media platform that enables you to network with your personal and professional contacts, join groups, and attend events.\n\n**Clubhouse**\nAn audio-based app that lets you join live conversations with experts, influencers, and peers on various topics.\n\n**MeetUp**\nAn app that helps you find and join local groups and events based on your interests and goals.\n\n**Eventbrite**\nAn app that allows you to discover, register, and attend events in your area or online.',
      },
      {
        id: 'business-tools',
        title: 'Business Tools & Tips',
        type: 'text',
        content:
          '**Digital Business Cards**\nDid you know that you can create your own Digital Business Cards for FREE? Download the Blinq app on your phone and get a personalized QR Code you can share with your contacts.\n\n**Stretch Your Resources with FIVERR**\nFeeling overwhelmed but can\u2019t afford a full-time hire? Consider Fiverr! This online marketplace connects businesses with freelance talent for various tasks. Find skilled professionals in diverse fields.\n\n**Free Harvard University Business Courses**\nDid you know Harvard University offers a variety of free online business courses? These courses, taught by renowned Harvard faculty, provide valuable insights and practical skills applicable to various business scenarios.\n\n**Create a Business Email Account**\nNeo is an email platform that offers users the opportunity to create a customized business email address starting at just $1.99 per month.\n\n**Generate Social Media Ad Creatives Using AI**\nGenerate ad creatives for social media that outperform your competitors using artificial intelligence. AdCreative.ai offers a 1 week free trial with plans starting at $15 a month, paid annually.\n\n**Free Online Courses with Certificates & Diplomas**\nExplore over 5,000 free online courses about business, management, health care, sales & marketing and much more. Alison is an online learning site that allows you to up-skill in your current career path.',
      },
    ],
  },
  {
    id: 'quiz',
    title: 'Quiz',
    icon: HelpCircle,
    lessons: [
      {
        id: 'advisor-quiz',
        title: 'Healthcare Advisor Certification Quiz',
        type: 'quiz',
        content:
          'After completing all training topics, take the Healthcare Advisor Certification Quiz to test your knowledge and earn your certification.\n\nThe quiz covers all topics from this course including:\n\n\u2022 MPB Health mission and values\n\u2022 Benefits and membership details\n\u2022 Compliance guidelines\n\u2022 Sales techniques and best practices\n\nYou must score 80% or higher to pass and receive your certification.',
      },
    ],
  },
];

const COMPLETED_KEY = 'mpb-training-completed';

function loadCompleted(): Set<string> {
  try {
    const raw = localStorage.getItem(COMPLETED_KEY);
    if (raw) return new Set(JSON.parse(raw));
  } catch { /* ignore */ }
  return new Set();
}

function saveCompleted(set: Set<string>) {
  localStorage.setItem(COMPLETED_KEY, JSON.stringify([...set]));
}

function allLessonsFlat(): Lesson[] {
  return mpbCourseTopics.flatMap((t) => t.lessons);
}

function findTopicForLesson(lessonId: string): Topic | undefined {
  return mpbCourseTopics.find((t) => t.lessons.some((l) => l.id === lessonId));
}

/* ------------------------------------------------------------------ */
/*  Quiz Data & Components                                              */
/* ------------------------------------------------------------------ */

interface QuizQuestion {
  id: number;
  question: string;
  options: string[];
  correctIndex: number;
}

const quizQuestions: QuizQuestion[] = [
  {
    id: 1,
    question: "What is MPB Health's mission?",
    options: [
      'To sell traditional health insurance policies',
      'To empower people to live healthier and happier lives with innovative healthcare solutions',
      'To provide only dental and vision coverage',
      'To replace hospitals with virtual-only clinics',
    ],
    correctIndex: 1,
  },
  {
    id: 2,
    question: 'Which of the following is NOT one of MPB Health\'s core values?',
    options: ['Care', 'Compassion', 'Profitability', 'Trust'],
    correctIndex: 2,
  },
  {
    id: 3,
    question: 'What is a key benefit of being an MPB Healthcare Advisor?',
    options: [
      'You can only sell during Open Enrollment periods',
      'You are limited to a single product type',
      'You get your own landing page and access to an open network with no Open Enrollment periods',
      'You must work exclusively from a corporate office',
    ],
    correctIndex: 2,
  },
  {
    id: 4,
    question: 'What is expected from MPB Healthcare Advisors?',
    options: [
      'Only communicate through email once per week',
      'Deliver fast, efficient, and accurate information with prompt responses to inquiries',
      'Follow up with members once a month at most',
      'Offer only one solution per client to simplify the process',
    ],
    correctIndex: 1,
  },
  {
    id: 5,
    question: 'What is the Initial Unshareable Amount (IUA) in medical cost sharing?',
    options: [
      'The total cost of medical treatment',
      'The amount the member is responsible for before eligible costs are shared by the community',
      'The monthly premium payment for membership',
      'The maximum amount the community will ever share',
    ],
    correctIndex: 1,
  },
  {
    id: 6,
    question: 'What does Minimum Essential Coverage (MEC) provide?',
    options: [
      'Only emergency room visits',
      'Preventive care at 100% with no waiting period or pre-existing condition limitations',
      'Only dental and vision benefits',
      'Only prescription medication coverage',
    ],
    correctIndex: 1,
  },
  {
    id: 7,
    question: "What is the primary function of the MPB Concierge?",
    options: [
      'To sell additional insurance products to members',
      'To be a trusted guide and advocate for members throughout their healthcare journey',
      'To process membership cancellations and refunds',
      'To schedule hospital admissions only',
    ],
    correctIndex: 1,
  },
  {
    id: 8,
    question: 'Which compliance practice is critical for MPB Healthcare Advisors?',
    options: [
      'You may describe programs as health insurance for simplicity',
      'Never misrepresent MPB programs as health insurance',
      'State compliance guidelines are optional',
      'Terms and conditions only need to be disclosed when asked',
    ],
    correctIndex: 1,
  },
  {
    id: 9,
    question: 'What approach should advisors use to help clients select the right plan?',
    options: [
      'Always recommend the most expensive plan available',
      'Use pre-qualifying questions and actively listen to responses to determine unique needs',
      'Let clients research and figure it out on their own',
      'Only offer plans that pay the highest commission',
    ],
    correctIndex: 1,
  },
  {
    id: 10,
    question: 'What does the Debt Dismissal Program help members with?',
    options: [
      'Applying for credit cards with low interest rates',
      'Managing and reducing medical debt through negotiation and financial counseling',
      'Paying monthly membership contributions automatically',
      'Filing lawsuits against healthcare providers',
    ],
    correctIndex: 1,
  },
];

const PASS_THRESHOLD = 0.8;
const QUIZ_RESULT_KEY = 'mpb-quiz-result';

function loadQuizResult(): { passed: boolean; score: number; date: string } | null {
  try {
    const raw = localStorage.getItem(QUIZ_RESULT_KEY);
    if (raw) return JSON.parse(raw);
  } catch { /* ignore */ }
  return null;
}

function saveQuizResult(result: { passed: boolean; score: number; date: string }) {
  localStorage.setItem(QUIZ_RESULT_KEY, JSON.stringify(result));
}

function generateCertificate(name: string, date: string): Promise<Blob> {
  return new Promise((resolve) => {
    const canvas = document.createElement('canvas');
    const W = 1400;
    const H = 1000;
    canvas.width = W;
    canvas.height = H;
    const ctx = canvas.getContext('2d')!;

    // Background
    ctx.fillStyle = '#FFFFFF';
    ctx.fillRect(0, 0, W, H);

    // Outer border
    ctx.strokeStyle = '#1e3a5f';
    ctx.lineWidth = 6;
    ctx.strokeRect(30, 30, W - 60, H - 60);

    // Inner decorative border
    ctx.strokeStyle = '#3b82f6';
    ctx.lineWidth = 2;
    ctx.strokeRect(45, 45, W - 90, H - 90);

    // Accent line
    ctx.fillStyle = '#3b82f6';
    ctx.fillRect(100, 180, W - 200, 3);

    // Header
    ctx.fillStyle = '#1e3a5f';
    ctx.font = 'bold 18px Georgia, serif';
    ctx.textAlign = 'center';
    ctx.fillText('MPB HEALTH', W / 2, 130);

    ctx.font = '14px Georgia, serif';
    ctx.fillStyle = '#64748b';
    ctx.fillText('MPowering Benefits Inc.', W / 2, 155);

    // Title
    ctx.fillStyle = '#1e3a5f';
    ctx.font = '46px Georgia, serif';
    ctx.fillText('Certificate of Completion', W / 2, 260);

    // Subtitle
    ctx.fillStyle = '#64748b';
    ctx.font = '18px Georgia, serif';
    ctx.fillText('This is to certify that', W / 2, 330);

    // Name
    ctx.fillStyle = '#1e3a5f';
    ctx.font = 'bold 42px Georgia, serif';
    ctx.fillText(name, W / 2, 400);

    // Decorative line under name
    const nameWidth = ctx.measureText(name).width;
    ctx.fillStyle = '#3b82f6';
    ctx.fillRect(W / 2 - nameWidth / 2 - 20, 415, nameWidth + 40, 2);

    // Course description
    ctx.fillStyle = '#475569';
    ctx.font = '18px Georgia, serif';
    ctx.fillText('has successfully completed the training course', W / 2, 470);

    ctx.fillStyle = '#1e3a5f';
    ctx.font = 'bold 28px Georgia, serif';
    ctx.fillText('Become an MPB Healthcare Advisor', W / 2, 520);

    ctx.fillStyle = '#475569';
    ctx.font = '16px Georgia, serif';
    ctx.fillText('and has demonstrated proficiency in MPB Health programs, membership benefits,', W / 2, 570);
    ctx.fillText('compliance guidelines, and healthcare advisory best practices.', W / 2, 595);

    // Score & Date section
    ctx.fillStyle = '#3b82f6';
    ctx.fillRect(100, 650, W - 200, 3);

    ctx.fillStyle = '#64748b';
    ctx.font = '16px Georgia, serif';
    ctx.fillText(`Certification Date: ${date}`, W / 2, 700);

    ctx.font = '14px Georgia, serif';
    ctx.fillText('Passed with 80% or higher on the Healthcare Advisor Certification Quiz', W / 2, 730);

    // Bottom decorative element
    ctx.fillStyle = '#3b82f6';
    ctx.fillRect(100, 780, W - 200, 3);

    // Award icon (drawn with text/symbols)
    ctx.fillStyle = '#f59e0b';
    ctx.font = '48px serif';
    ctx.fillText('★', W / 2, 850);

    ctx.fillStyle = '#1e3a5f';
    ctx.font = 'bold 14px Georgia, serif';
    ctx.fillText('MPB Health Certified Healthcare Advisor', W / 2, 890);

    // Corner decorations
    const corners = [
      [70, 70],
      [W - 70, 70],
      [70, H - 70],
      [W - 70, H - 70],
    ];
    ctx.fillStyle = '#3b82f6';
    for (const [x, y] of corners) {
      ctx.beginPath();
      ctx.arc(x, y, 6, 0, Math.PI * 2);
      ctx.fill();
    }

    canvas.toBlob((blob) => resolve(blob!), 'image/png');
  });
}

function QuizViewer({
  advisorName,
  onMarkComplete,
  completed,
}: {
  advisorName: string;
  onMarkComplete: () => void;
  completed: boolean;
}) {
  const [answers, setAnswers] = useState<Record<number, number>>({});
  const [submitted, setSubmitted] = useState(false);
  const [score, setScore] = useState(0);
  const [passed, setPassed] = useState(false);
  const [generating, setGenerating] = useState(false);
  const topRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const saved = loadQuizResult();
    if (saved && saved.passed) {
      setSubmitted(true);
      setScore(saved.score);
      setPassed(true);
    }
  }, []);

  const handleSelect = (questionId: number, optionIndex: number) => {
    if (submitted) return;
    setAnswers((prev) => ({ ...prev, [questionId]: optionIndex }));
  };

  const handleSubmit = () => {
    let correct = 0;
    for (const q of quizQuestions) {
      if (answers[q.id] === q.correctIndex) correct++;
    }
    const pct = correct / quizQuestions.length;
    const didPass = pct >= PASS_THRESHOLD;
    setScore(correct);
    setPassed(didPass);
    setSubmitted(true);

    if (didPass) {
      const result = { passed: true, score: correct, date: new Date().toLocaleDateString() };
      saveQuizResult(result);
      if (!completed) onMarkComplete();
    }

    topRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const handleRetry = () => {
    setAnswers({});
    setSubmitted(false);
    setScore(0);
    setPassed(false);
    topRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const handleDownloadCertificate = async () => {
    setGenerating(true);
    try {
      const date = new Date().toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
      });
      const blob = await generateCertificate(advisorName, date);
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'MPB_Healthcare_Advisor_Certificate.png';
      a.click();
      URL.revokeObjectURL(url);
    } finally {
      setGenerating(false);
    }
  };

  const allAnswered = quizQuestions.every((q) => answers[q.id] !== undefined);

  return (
    <div className="flex-1 overflow-y-auto">
      <div ref={topRef} className="px-8 pt-8 pb-4">
        <h2 className="text-2xl font-bold text-th-text-primary">Healthcare Advisor Certification Quiz</h2>
        <p className="text-th-text-secondary text-sm mt-2">
          Answer all 10 questions below. You need at least 80% (8 out of 10) to pass and earn your certificate.
        </p>
      </div>

      {/* Results Banner */}
      {submitted && (
        <div className="px-8 mb-6">
          <div
            className={`rounded-xl p-6 ${
              passed
                ? 'bg-gradient-to-br from-green-50 to-emerald-50 dark:from-green-900/20 dark:to-emerald-900/20 border border-green-200 dark:border-green-800/30'
                : 'bg-gradient-to-br from-red-50 to-orange-50 dark:from-red-900/20 dark:to-orange-900/20 border border-red-200 dark:border-red-800/30'
            }`}
          >
            <div className="flex items-center gap-4">
              <div
                className={`w-16 h-16 rounded-full flex items-center justify-center ${
                  passed ? 'bg-green-100 dark:bg-green-900/30' : 'bg-red-100 dark:bg-red-900/30'
                }`}
              >
                {passed ? (
                  <Trophy className="w-8 h-8 text-green-600 dark:text-green-400" />
                ) : (
                  <XCircle className="w-8 h-8 text-red-600 dark:text-red-400" />
                )}
              </div>
              <div className="flex-1">
                <h3
                  className={`text-lg font-bold ${
                    passed ? 'text-green-800 dark:text-green-300' : 'text-red-800 dark:text-red-300'
                  }`}
                >
                  {passed ? 'Congratulations! You Passed!' : 'Not Quite — Try Again'}
                </h3>
                <p
                  className={`text-sm mt-1 ${
                    passed ? 'text-green-700 dark:text-green-400' : 'text-red-700 dark:text-red-400'
                  }`}
                >
                  You scored {score} out of {quizQuestions.length} ({Math.round((score / quizQuestions.length) * 100)}%)
                  {passed
                    ? ' — You are now a certified MPB Healthcare Advisor!'
                    : ` — You need at least ${Math.round(PASS_THRESHOLD * 100)}% to pass. Review the lessons and try again.`}
                </p>
              </div>
            </div>

            {passed && (
              <div className="mt-4 flex flex-wrap gap-3">
                <button
                  onClick={handleDownloadCertificate}
                  disabled={generating}
                  className="flex items-center gap-2 px-5 py-2.5 bg-green-600 hover:bg-green-700 text-white rounded-lg text-sm font-medium transition-colors disabled:opacity-50"
                >
                  <Download className="w-4 h-4" />
                  {generating ? 'Generating...' : 'Download Certificate'}
                </button>
              </div>
            )}

            {!passed && (
              <div className="mt-4">
                <button
                  onClick={handleRetry}
                  className="flex items-center gap-2 px-5 py-2.5 bg-red-600 hover:bg-red-700 text-white rounded-lg text-sm font-medium transition-colors"
                >
                  <RotateCcw className="w-4 h-4" />
                  Retake Quiz
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Questions */}
      <div className="px-8 pb-8 space-y-6">
        {quizQuestions.map((q, qi) => {
          const selected = answers[q.id];
          const isCorrect = submitted && selected === q.correctIndex;
          const isWrong = submitted && selected !== undefined && selected !== q.correctIndex;

          return (
            <div
              key={q.id}
              className={`rounded-xl border p-5 transition-all ${
                submitted
                  ? isCorrect
                    ? 'border-green-300 dark:border-green-700 bg-green-50/50 dark:bg-green-900/10'
                    : isWrong
                    ? 'border-red-300 dark:border-red-700 bg-red-50/50 dark:bg-red-900/10'
                    : 'border-th-border'
                  : 'border-th-border hover:border-th-accent-300'
              }`}
            >
              <div className="flex items-start gap-3 mb-4">
                <span className="flex-shrink-0 w-8 h-8 rounded-full bg-blue-100 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 flex items-center justify-center text-sm font-bold">
                  {qi + 1}
                </span>
                <h4 className="text-[15px] font-semibold text-th-text-primary pt-1">{q.question}</h4>
              </div>

              <div className="space-y-2 ml-11">
                {q.options.map((opt, oi) => {
                  const isSelected = selected === oi;
                  const isThisCorrect = submitted && oi === q.correctIndex;
                  const isThisWrong = submitted && isSelected && oi !== q.correctIndex;

                  return (
                    <button
                      key={oi}
                      onClick={() => handleSelect(q.id, oi)}
                      disabled={submitted}
                      className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg text-left text-sm transition-all ${
                        submitted
                          ? isThisCorrect
                            ? 'bg-green-100 dark:bg-green-900/20 border-green-400 dark:border-green-700 border text-green-800 dark:text-green-300 font-medium'
                            : isThisWrong
                            ? 'bg-red-100 dark:bg-red-900/20 border-red-400 dark:border-red-700 border text-red-800 dark:text-red-300'
                            : 'bg-surface-tertiary border border-transparent text-th-text-secondary'
                          : isSelected
                          ? 'bg-blue-50 dark:bg-blue-900/15 border-blue-400 dark:border-blue-600 border text-blue-700 dark:text-blue-300 font-medium'
                          : 'bg-surface-tertiary hover:bg-blue-50/50 dark:hover:bg-blue-900/5 border border-transparent text-th-text-secondary'
                      }`}
                    >
                      <span
                        className={`flex-shrink-0 w-6 h-6 rounded-full border-2 flex items-center justify-center text-xs font-bold ${
                          submitted
                            ? isThisCorrect
                              ? 'bg-green-500 border-green-500 text-white'
                              : isThisWrong
                              ? 'bg-red-500 border-red-500 text-white'
                              : 'border-gray-300 dark:border-gray-600'
                            : isSelected
                            ? 'bg-blue-500 border-blue-500 text-white'
                            : 'border-gray-300 dark:border-gray-600'
                        }`}
                      >
                        {submitted && isThisCorrect && '✓'}
                        {submitted && isThisWrong && '✗'}
                        {!submitted && isSelected && '●'}
                        {!submitted && !isSelected && String.fromCharCode(65 + oi)}
                      </span>
                      <span>{opt}</span>
                    </button>
                  );
                })}
              </div>
            </div>
          );
        })}

        {/* Submit Button */}
        {!submitted && (
          <div className="flex justify-center pt-4">
            <button
              onClick={handleSubmit}
              disabled={!allAnswered}
              className="flex items-center gap-2 px-8 py-3 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-300 dark:disabled:bg-gray-700 disabled:cursor-not-allowed text-white rounded-xl text-base font-semibold transition-colors shadow-lg shadow-blue-600/20"
            >
              <CheckCircle2 className="w-5 h-5" />
              Submit Quiz ({Object.keys(answers).length}/{quizQuestions.length} answered)
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

interface CourseCard {
  id: string;
  title: string;
  description: string;
  topicCount: number;
  lessonCount: number;
  href: string;
  gradient: string;
  icon: React.ElementType;
  available: boolean;
  external?: boolean;
}

const courses: CourseCard[] = [
  {
    id: 'mpb',
    title: 'Become an MPB Healthcare Advisor',
    description:
      'Complete this comprehensive course to learn about MPB Health programs, membership benefits, sales techniques, and everything you need to become a certified advisor.',
    topicCount: 8,
    lessonCount: 24,
    href: '/training/mpb',
    gradient: 'from-blue-600 via-indigo-600 to-purple-700',
    icon: GraduationCap,
    available: true,
  },
  {
    id: 'sedera',
    title: 'Sedera Training',
    description:
      'Learn about Sedera medical cost sharing community, membership options, and how to present Sedera solutions to your clients.',
    topicCount: 0,
    lessonCount: 0,
    href: 'https://sedera.my.salesforce-sites.com/Affiliate/apex/Affiliate_Contact_Form?Contact.Parent_Affiliate_Account__c=0011N00001vSpDl',
    gradient: 'from-emerald-600 via-teal-600 to-cyan-700',
    icon: Shield,
    available: true,
    external: true,
  },
  {
    id: 'zion',
    title: 'Zion Training',
    description:
      'Explore Zion HealthShare programs and learn how to effectively advise clients on Zion membership options.',
    topicCount: 0,
    lessonCount: 0,
    href: 'https://zionhealthshare.thinkific.com/courses/zionhealthshare',
    gradient: 'from-orange-500 via-red-500 to-rose-600',
    icon: Heart,
    available: true,
    external: true,
  },
];

/* ------------------------------------------------------------------ */
/*  Lesson Viewer (main content area)                                   */
/* ------------------------------------------------------------------ */

function LessonViewer({
  lesson,
  completed,
  onMarkComplete,
  onPrev,
  onNext,
  hasPrev,
  hasNext,
}: {
  lesson: Lesson;
  completed: boolean;
  onMarkComplete: () => void;
  onPrev: () => void;
  onNext: () => void;
  hasPrev: boolean;
  hasNext: boolean;
}) {
  const contentRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    contentRef.current?.scrollTo({ top: 0 });
  }, [lesson.id]);

  const renderContent = (text: string) => {
    return text.split('\n\n').map((block, i) => {
      if (block.startsWith('**') && block.endsWith('**') && !block.includes('\n')) {
        return (
          <h4 key={i} className="font-bold text-th-text-primary mt-6 mb-2 first:mt-0">
            {block.replace(/\*\*/g, '')}
          </h4>
        );
      }

      const parts = block.split('\n');
      const hasBullets = parts.some((p) => p.startsWith('\u2022'));
      const hasNumbers = parts.some((p) => /^\d+\./.test(p));

      if (hasBullets) {
        return (
          <ul key={i} className="space-y-2 mb-4">
            {parts.map((line, j) => {
              if (line.startsWith('\u2022')) {
                return (
                  <li key={j} className="flex items-start gap-2 text-[15px] text-th-text-secondary leading-relaxed">
                    <span className="text-th-accent-600 mt-1 flex-shrink-0">&bull;</span>
                    <span>{line.replace(/^\u2022\s*/, '')}</span>
                  </li>
                );
              }
              if (line.startsWith('**') && line.endsWith('**')) {
                return <h4 key={j} className="font-bold text-th-text-primary mt-4 mb-1">{line.replace(/\*\*/g, '')}</h4>;
              }
              return <p key={j} className="text-[15px] text-th-text-secondary leading-relaxed mb-2">{renderInlineFormatting(line)}</p>;
            })}
          </ul>
        );
      }

      if (hasNumbers) {
        return (
          <ol key={i} className="space-y-2 mb-4">
            {parts.map((line, j) => {
              const match = line.match(/^(\d+)\.\s*(.*)/);
              if (match) {
                return (
                  <li key={j} className="flex items-start gap-3 text-[15px] text-th-text-secondary leading-relaxed">
                    <span className="flex-shrink-0 w-6 h-6 rounded-full bg-blue-100 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 flex items-center justify-center text-xs font-bold">
                      {match[1]}
                    </span>
                    <span>{match[2]}</span>
                  </li>
                );
              }
              return <p key={j} className="text-[15px] text-th-text-secondary leading-relaxed mb-2">{renderInlineFormatting(line)}</p>;
            })}
          </ol>
        );
      }

      return (
        <p key={i} className="text-[15px] text-th-text-secondary leading-relaxed mb-4">
          {renderInlineFormatting(block)}
        </p>
      );
    });
  };

  const renderInlineFormatting = (text: string) => {
    const parts = text.split(/(\*\*[^*]+\*\*)/g);
    return parts.map((part, i) => {
      if (part.startsWith('**') && part.endsWith('**')) {
        return <strong key={i} className="font-semibold text-th-text-primary">{part.replace(/\*\*/g, '')}</strong>;
      }
      return part;
    });
  };

  return (
    <div ref={contentRef} className="flex-1 overflow-y-auto">
      {/* Lesson Title */}
      <div className="px-8 pt-8 pb-4">
        <h2 className="text-2xl font-bold text-th-text-primary">{lesson.title}</h2>
      </div>

      {/* Video */}
      {lesson.type === 'video' && (
        <div className="px-8 mb-6">
          {lesson.vimeoId ? (
            <div className="aspect-video bg-neutral-900 rounded-lg overflow-hidden shadow-lg">
              <iframe
                src={`https://player.vimeo.com/video/${lesson.vimeoId}?badge=0&autopause=0&player_id=0&app_id=122963`}
                className="w-full h-full"
                allow="autoplay; fullscreen; picture-in-picture"
                allowFullScreen
                title={lesson.title}
              />
            </div>
          ) : lesson.videoUrl ? (
            <div className="aspect-video bg-neutral-900 rounded-lg overflow-hidden shadow-lg">
              <video
                src={lesson.videoUrl}
                controls
                className="w-full h-full"
                title={lesson.title}
              />
            </div>
          ) : (
            <div className="aspect-video bg-neutral-100 dark:bg-neutral-800 rounded-lg flex items-center justify-center">
              <div className="text-center">
                <Video className="w-12 h-12 mx-auto mb-3 text-th-text-tertiary" />
                <p className="text-th-text-tertiary text-sm">Video content coming soon</p>
                {lesson.duration && (
                  <p className="text-th-text-tertiary text-xs mt-1">Duration: {lesson.duration}</p>
                )}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Text Content */}
      <div className="px-8 pb-6">
        {lesson.content && renderContent(lesson.content)}

        {/* Resource links */}
        {lesson.type === 'resource' && lesson.resourceLinks && (
          <div className="grid gap-2 mt-4">
            {lesson.resourceLinks.map((link, i) => (
              <a
                key={i}
                href={link.url}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-3 p-3 rounded-lg border border-th-border hover:bg-surface-tertiary hover:border-th-accent-300 transition-all group"
              >
                <div className="w-8 h-8 rounded-md bg-emerald-100 dark:bg-emerald-900/20 flex items-center justify-center flex-shrink-0">
                  <ExternalLink className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                </div>
                <span className="text-sm text-th-text-primary font-medium group-hover:text-th-accent-600 transition-colors">
                  {link.label}
                </span>
                <ArrowRight className="w-4 h-4 text-th-text-tertiary ml-auto flex-shrink-0 opacity-0 group-hover:opacity-100 transition-opacity" />
              </a>
            ))}
          </div>
        )}

        {/* Form links */}
        {lesson.type === 'form' && lesson.resourceLinks && (
          <div className="grid gap-3 mt-4">
            {lesson.resourceLinks.map((link, i) => (
              <a
                key={i}
                href={link.url}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-3 p-4 rounded-lg bg-blue-50 dark:bg-blue-900/10 border border-blue-200 dark:border-blue-800/30 hover:bg-blue-100 dark:hover:bg-blue-900/20 transition-all group"
              >
                <ClipboardList className="w-5 h-5 text-blue-600 dark:text-blue-400 flex-shrink-0" />
                <span className="text-sm text-blue-700 dark:text-blue-300 font-medium">
                  {link.label}
                </span>
              </a>
            ))}
          </div>
        )}

        {/* Quiz is handled separately via QuizViewer, not here */}
      </div>

      {/* Mark as Complete + Navigation */}
      <div className="px-8 pb-8">
        <div className="flex items-center justify-between border-t border-th-border-subtle pt-6">
          <button
            onClick={onPrev}
            disabled={!hasPrev}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              hasPrev
                ? 'text-th-text-secondary hover:bg-surface-tertiary'
                : 'text-th-text-tertiary opacity-50 cursor-not-allowed'
            }`}
          >
            <ChevronLeft className="w-4 h-4" />
            Previous
          </button>

          <button
            onClick={onMarkComplete}
            className={`flex items-center gap-2 px-5 py-2.5 rounded-lg text-sm font-medium transition-all ${
              completed
                ? 'bg-green-100 text-green-700 dark:bg-green-900/20 dark:text-green-400'
                : 'bg-blue-600 text-white hover:bg-blue-700'
            }`}
          >
            <CheckCircle2 className="w-4 h-4" />
            {completed ? 'Completed' : 'Mark as Complete'}
          </button>

          <button
            onClick={onNext}
            disabled={!hasNext}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              hasNext
                ? 'text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/10'
                : 'text-th-text-tertiary opacity-50 cursor-not-allowed'
            }`}
          >
            Next
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Main Component                                                     */
/* ------------------------------------------------------------------ */

export default function Training({ section }: TrainingProps) {
  const navigate = useNavigate();
  const { profile } = useAdvisor();
  const [expandedTopics, setExpandedTopics] = useState<Set<string>>(new Set(['introduction']));
  const [activeLessonId, setActiveLessonId] = useState<string | null>(null);
  const [completedLessons, setCompletedLessons] = useState<Set<string>>(loadCompleted);
  const [sidebarOpen, setSidebarOpen] = useState(true);

  const flat = allLessonsFlat();
  const totalLessons = flat.length;
  const completedCount = [...completedLessons].filter((id) => flat.some((l) => l.id === id)).length;
  const progressPercent = totalLessons > 0 ? Math.round((completedCount / totalLessons) * 100) : 0;

  const activeLesson = flat.find((l) => l.id === activeLessonId) ?? null;
  const activeIndex = activeLesson ? flat.indexOf(activeLesson) : -1;

  const navigateLesson = useCallback((lessonId: string) => {
    setActiveLessonId(lessonId);
    const topic = findTopicForLesson(lessonId);
    if (topic) {
      setExpandedTopics((prev) => {
        const next = new Set(prev);
        next.add(topic.id);
        return next;
      });
    }
  }, []);

  const handlePrev = useCallback(() => {
    if (activeIndex > 0) navigateLesson(flat[activeIndex - 1].id);
  }, [activeIndex, flat, navigateLesson]);

  const handleNext = useCallback(() => {
    if (activeIndex < flat.length - 1) navigateLesson(flat[activeIndex + 1].id);
  }, [activeIndex, flat, navigateLesson]);

  const handleMarkComplete = useCallback(() => {
    if (!activeLessonId) return;
    setCompletedLessons((prev) => {
      const next = new Set(prev);
      if (next.has(activeLessonId)) {
        next.delete(activeLessonId);
      } else {
        next.add(activeLessonId);
      }
      saveCompleted(next);
      return next;
    });
  }, [activeLessonId]);

  const toggleTopic = (topicId: string) => {
    setExpandedTopics((prev) => {
      const next = new Set(prev);
      if (next.has(topicId)) next.delete(topicId);
      else next.add(topicId);
      return next;
    });
  };

  /* -------------------- Course Listing Page -------------------- */
  if (!section) {
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl flex items-center justify-center bg-surface-tertiary">
            <GraduationCap className="w-6 h-6 text-th-text-tertiary" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-th-text-primary">Training</h1>
            <p className="text-th-text-tertiary text-sm mt-1">
              Complete your training courses to become a certified advisor
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-5">
          {courses.map((course) => {
            const CourseIcon = course.icon;
            return (
              <div
                key={course.id}
                onClick={() => {
                  if (!course.available) return;
                  if (course.external) { window.open(course.href, '_blank', 'noopener,noreferrer'); }
                  else { navigate(course.href); }
                }}
                onKeyDown={(e) => {
                  if (e.key !== 'Enter' || !course.available) return;
                  if (course.external) { window.open(course.href, '_blank', 'noopener,noreferrer'); }
                  else { navigate(course.href); }
                }}
                role={course.available ? 'button' : undefined}
                tabIndex={course.available ? 0 : undefined}
                className={`rounded-xl border border-th-border overflow-hidden flex flex-col transition-all ${
                  course.available
                    ? 'cursor-pointer hover:shadow-lg hover:border-th-accent-300'
                    : 'opacity-60'
                }`}
              >
                <div className={`bg-gradient-to-br ${course.gradient} p-5 text-white relative overflow-hidden`}>
                  <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHZpZXdCb3g9IjAgMCA2MCA2MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZyBmaWxsPSJub25lIiBmaWxsLXJ1bGU9ImV2ZW5vZGQiPjxnIGZpbGw9IiNmZmYiIGZpbGwtb3BhY2l0eT0iMC4wNSI+PHBhdGggZD0iTTM2IDM0djItSDI0di0yaDEyek0zNiAyNHYySDI0di0yaDEyeiIvPjwvZz48L2c+PC9zdmc+')] opacity-30" />
                  <div className="relative">
                    <div className="p-2 rounded-lg bg-white/15 w-fit mb-3">
                      <CourseIcon className="w-6 h-6" />
                    </div>
                    <h3 className="font-bold text-lg">{course.title}</h3>
                  </div>
                </div>

                <div className="p-5 bg-surface-primary flex-1 flex flex-col">
                  <p className="text-sm text-th-text-secondary leading-relaxed line-clamp-3 mb-4">
                    {course.description}
                  </p>
                  <div className="mt-auto flex items-center justify-between">
                    {course.available ? (
                      <>
                        {course.external ? (
                          <span className="text-xs text-th-text-tertiary">External training</span>
                        ) : (
                          <div className="flex items-center gap-4 text-xs text-th-text-tertiary">
                            <span className="flex items-center gap-1">
                              <BookOpen className="w-3.5 h-3.5" />
                              {course.topicCount} Topics
                            </span>
                            <span className="flex items-center gap-1">
                              <FileText className="w-3.5 h-3.5" />
                              {course.lessonCount} Lessons
                            </span>
                          </div>
                        )}
                        <span className="flex items-center gap-1 text-sm text-th-accent-600 font-medium">
                          {course.external ? 'Open' : 'Start'} {course.external ? <ExternalLink className="w-4 h-4" /> : <ArrowRight className="w-4 h-4" />}
                        </span>
                      </>
                    ) : (
                      <span className="text-xs text-th-text-tertiary bg-surface-tertiary px-2 py-1 rounded-full">
                        Coming Soon
                      </span>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    );
  }

  /* -------------------- Sedera / Zion Placeholder -------------------- */
  if (section === 'sedera' || section === 'zion') {
    const cfg = {
      sedera: {
        title: 'Sedera Training',
        desc: 'Sedera training content is coming soon.',
        gradient: 'from-emerald-600 via-teal-600 to-cyan-700',
      },
      zion: {
        title: 'Zion Training',
        desc: 'Zion training content is coming soon.',
        gradient: 'from-orange-500 via-red-500 to-rose-600',
      },
    };
    const c = cfg[section];

    return (
      <div className="space-y-6">
        <div className={`bg-gradient-to-br ${c.gradient} rounded-2xl p-8 text-white text-center`}>
          <GraduationCap className="w-16 h-16 mx-auto mb-4 opacity-60" />
          <h1 className="text-2xl font-bold mb-2">{c.title}</h1>
          <p className="text-white/70">{c.desc}</p>
        </div>
        <div className="text-center">
          <button
            onClick={() => navigate('/training')}
            className="text-th-accent-600 hover:text-th-accent-700 font-medium text-sm"
          >
            &larr; Back to Training
          </button>
        </div>
      </div>
    );
  }

  /* -------------------- MPB Course Detail (Sidebar + Content) ---- */
  return (
    <div className="flex flex-col h-[calc(100vh-4rem)]">
      {/* Top Bar */}
      <div className="flex items-center justify-between bg-gradient-to-r from-blue-600 to-indigo-700 px-4 py-3 text-white flex-shrink-0 rounded-t-xl">
        <div className="flex items-center gap-3">
          <button
            onClick={() => navigate('/training')}
            className="p-1.5 rounded-lg hover:bg-white/10 transition-colors"
          >
            <ChevronLeft className="w-5 h-5" />
          </button>
          <span className="font-semibold text-sm md:text-base">Become an MPB Healthcare Advisor</span>
        </div>
        <div className="flex items-center gap-4">
          <span className="text-sm text-white/80 hidden sm:block">
            Your Progress: <strong>{completedCount}</strong> of {totalLessons} ({progressPercent}%)
          </span>
          {activeLesson && (
            <button
              onClick={handleMarkComplete}
              className={`flex items-center gap-2 px-4 py-1.5 rounded-lg text-sm font-medium transition-all ${
                activeLessonId && completedLessons.has(activeLessonId)
                  ? 'bg-green-500 text-white'
                  : 'bg-white/15 hover:bg-white/25 text-white border border-white/30'
              }`}
            >
              <CheckCircle2 className="w-4 h-4" />
              Mark as Complete
            </button>
          )}
        </div>
      </div>

      {/* Main area: Sidebar + Content */}
      <div className="flex flex-1 overflow-hidden border border-th-border border-t-0 rounded-b-xl bg-surface-primary">
        {/* Left Sidebar */}
        <div
          className={`${
            sidebarOpen ? 'w-80 xl:w-96' : 'w-0'
          } flex-shrink-0 border-r border-th-border overflow-hidden transition-all duration-200`}
        >
          <div className="w-80 xl:w-96 h-full flex flex-col">
            <div className="px-4 py-3 border-b border-th-border-subtle flex-shrink-0">
              <h3 className="text-sm font-semibold text-th-text-primary">Course Content</h3>
            </div>

            {/* Scrollable sidebar content */}
            <div className="flex-1 overflow-y-auto">
              {mpbCourseTopics.map((topic) => {
                const isExpanded = expandedTopics.has(topic.id);
                const topicCompleted = topic.lessons.filter((l) => completedLessons.has(l.id)).length;

                return (
                  <div key={topic.id} className="border-b border-th-border-subtle last:border-b-0">
                    <button
                      onClick={() => toggleTopic(topic.id)}
                      className="w-full flex items-center justify-between px-4 py-3 hover:bg-surface-tertiary transition-colors text-left"
                    >
                      <span className={`text-sm font-medium ${isExpanded ? 'text-blue-600 dark:text-blue-400' : 'text-th-text-primary'}`}>
                        {topic.title}
                      </span>
                      <div className="flex items-center gap-2">
                        <span className="text-xs text-th-text-tertiary">
                          {topicCompleted}/{topic.lessons.length}
                        </span>
                        {isExpanded ? (
                          <ChevronDown className="w-4 h-4 text-th-text-tertiary" />
                        ) : (
                          <ChevronRight className="w-4 h-4 text-th-text-tertiary" />
                        )}
                      </div>
                    </button>

                    {isExpanded && (
                      <div>
                        {topic.lessons.map((lesson) => {
                          const isActive = activeLessonId === lesson.id;
                          const isCompleted = completedLessons.has(lesson.id);
                          const isVideo = lesson.type === 'video';

                          return (
                            <button
                              key={lesson.id}
                              onClick={() => navigateLesson(lesson.id)}
                              className={`w-full flex items-center gap-3 px-4 py-2.5 pl-6 text-left transition-colors ${
                                isActive
                                  ? 'bg-blue-50 dark:bg-blue-900/10 text-blue-600 dark:text-blue-400'
                                  : 'hover:bg-surface-tertiary text-th-text-secondary'
                              }`}
                            >
                              {isVideo ? (
                                <Play className={`w-3.5 h-3.5 flex-shrink-0 ${isActive ? 'text-blue-600' : 'text-blue-500'}`} />
                              ) : (
                                <FileText className={`w-3.5 h-3.5 flex-shrink-0 ${isActive ? 'text-blue-600' : 'text-th-text-tertiary'}`} />
                              )}
                              <span className={`text-sm flex-1 ${isActive ? 'font-medium' : ''}`}>
                                {lesson.title}
                                {lesson.duration && (
                                  <span className="text-xs text-th-text-tertiary ml-2">{lesson.duration}</span>
                                )}
                              </span>
                              <div
                                className={`w-4 h-4 rounded-full border flex-shrink-0 flex items-center justify-center ${
                                  isCompleted
                                    ? 'bg-green-500 border-green-500'
                                    : 'border-gray-300 dark:border-gray-600'
                                }`}
                              >
                                {isCompleted && <CheckCircle2 className="w-3 h-3 text-white" />}
                              </div>
                            </button>
                          );
                        })}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Toggle sidebar button (mobile) */}
        <button
          onClick={() => setSidebarOpen(!sidebarOpen)}
          className="absolute left-0 top-1/2 -translate-y-1/2 z-10 bg-surface-primary border border-th-border rounded-r-lg px-1 py-3 md:hidden shadow-sm"
        >
          {sidebarOpen ? <ChevronLeft className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
        </button>

        {/* Right Content Area */}
        {activeLesson ? (
          activeLesson.type === 'quiz' ? (
            <QuizViewer
              key={activeLesson.id}
              advisorName={
                profile
                  ? `${profile.first_name} ${profile.last_name}`
                  : 'Healthcare Advisor'
              }
              onMarkComplete={handleMarkComplete}
              completed={completedLessons.has(activeLesson.id)}
            />
          ) : (
            <LessonViewer
              key={activeLesson.id}
              lesson={activeLesson}
              completed={completedLessons.has(activeLesson.id)}
              onMarkComplete={handleMarkComplete}
              onPrev={handlePrev}
              onNext={handleNext}
              hasPrev={activeIndex > 0}
              hasNext={activeIndex < flat.length - 1}
            />
          )
        ) : (
          <div className="flex-1 flex items-center justify-center">
            <div className="text-center max-w-md px-6">
              <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center mx-auto mb-6">
                <GraduationCap className="w-10 h-10 text-white" />
              </div>
              <h2 className="text-xl font-bold text-th-text-primary mb-2">
                Become an MPB Healthcare Advisor
              </h2>
              <p className="text-th-text-secondary text-sm mb-2">
                {totalLessons} lessons &middot; {mpbCourseTopics.length} topics &middot; Certificate
              </p>
              <div className="flex items-center gap-2 justify-center mb-6">
                <div className="flex-1 max-w-48 h-2 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-blue-600 rounded-full transition-all"
                    style={{ width: `${progressPercent}%` }}
                  />
                </div>
                <span className="text-xs text-th-text-tertiary">{progressPercent}%</span>
              </div>
              <button
                onClick={() => navigateLesson(flat[0].id)}
                className="inline-flex items-center gap-2 px-6 py-3 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition-colors"
              >
                <Play className="w-4 h-4" />
                Start Learning
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
