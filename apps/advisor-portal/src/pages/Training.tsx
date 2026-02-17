import { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  GraduationCap,
  Play,
  CheckCircle2,
  Clock,
  Search,
  ChevronDown,
  ChevronRight,
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
  Sparkles,
  ArrowRight,
  X,
} from 'lucide-react';

interface TrainingProps {
  section?: 'mpb' | 'sedera' | 'zion';
}

/* ------------------------------------------------------------------ */
/*  Lesson & Topic types                                               */
/* ------------------------------------------------------------------ */

interface Lesson {
  id: string;
  title: string;
  type: 'video' | 'text' | 'quiz' | 'form' | 'resource';
  duration?: string;
  vimeoId?: string;
  description?: string;
  content?: string;
  resourceLinks?: { label: string; url: string }[];
}

interface Topic {
  id: string;
  title: string;
  icon: React.ElementType;
  lessons: Lesson[];
}

/* ------------------------------------------------------------------ */
/*  MPB Course Data                                                    */
/* ------------------------------------------------------------------ */

const mpbCourseDescription = [
  'Gain deep understanding of MPB Health\'s mission, values, and commitment to providing exceptional healthcare solutions.',
  'Understand our diverse range of programs, services, and benefits — including their unique features and advantages.',
  'Explore different healthcare memberships and their corresponding benefits, and how to effectively explain them to potential members.',
  'Understand expectations of an MPB Healthcare Advisor, including client interaction and sales techniques.',
  'Complete your required forms and certification quiz to become a fully certified advisor.',
];

const mpbCourseTopics: Topic[] = [
  {
    id: 'introduction',
    title: 'Introduction',
    icon: BookOpen,
    lessons: [
      {
        id: 'about-us',
        title: 'About Us',
        type: 'text',
        content:
          'MPB Health is a forward-thinking healthcare organization dedicated to making quality healthcare accessible and affordable for everyone. We believe in empowering individuals and families with healthcare solutions that fit their needs and budget.\n\nOur innovative approach combines technology, community, and cost-sharing principles to deliver programs that truly serve our members.',
      },
      {
        id: 'mission',
        title: 'Mission',
        type: 'text',
        content:
          'Our mission is to empower individuals and families by providing accessible, affordable, and comprehensive healthcare solutions. We are committed to bridging the gap in healthcare accessibility through innovative programs, personalized service, and a community-driven approach.',
      },
      {
        id: 'vision-values',
        title: 'Vision & Values',
        type: 'text',
        content:
          'Vision: To be the leading healthcare solution provider that transforms lives through accessible and affordable care.\n\nCore Values:\n• Integrity — We operate with honesty and transparency in everything we do.\n• Innovation — We continuously seek new ways to improve healthcare accessibility.\n• Community — We believe in the power of people helping people.\n• Excellence — We strive for the highest standards of quality and service.\n• Empowerment — We equip our advisors and members with the knowledge they need to succeed.',
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
          'As an MPB Healthcare Advisor, you enjoy numerous benefits:\n\n• Flexible Work Schedule — Work from anywhere, at any time.\n• Competitive Compensation — Earn generous commissions and bonuses.\n• Make a Difference — Help families access affordable healthcare.\n• Professional Growth — Continuous training and development opportunities.\n• Community Impact — Be part of a mission-driven organization.\n• Support System — Access to dedicated support teams and resources.',
      },
      {
        id: 'what-is-expected',
        title: 'What is Expected',
        type: 'text',
        content:
          'Expectations for MPB Healthcare Advisors:\n\n• Complete all required training modules and pass the certification quiz.\n• Maintain a professional and ethical approach when working with potential members.\n• Stay up-to-date with program changes, new benefits, and company announcements.\n• Follow all compliance guidelines and regulations.\n• Provide accurate information about memberships and benefits.\n• Respond to client inquiries in a timely and professional manner.\n• Meet minimum activity and performance requirements.',
      },
      {
        id: 'choose-right-plan',
        title: 'How to Choose the Right Plan for Your Clients',
        type: 'text',
        content:
          'Choosing the right plan involves understanding your client\'s unique needs:\n\n1. Assess Their Situation — Understand their family size, health needs, and budget.\n2. Compare Memberships — Review the features of each membership tier.\n3. Explain Benefits — Clearly communicate what is included in each plan.\n4. Address Concerns — Answer questions about coverage, costs, and processes.\n5. Personalize Your Recommendation — Match the plan to their specific needs.\n6. Follow Up — Ensure they are satisfied and understand their membership.',
      },
      {
        id: 'sales-tips',
        title: 'Watch Video: Sales Tips',
        type: 'video',
        description: 'Learn effective sales techniques and tips for presenting healthcare membership options to potential clients.',
      },
    ],
  },
  {
    id: 'benefits-memberships',
    title: 'Benefits Included in Our Memberships',
    icon: Heart,
    lessons: [
      {
        id: 'medical-cost-sharing',
        title: 'Medical Cost Sharing',
        type: 'video',
        duration: '04:12',
        description: 'Learn how medical cost sharing works and how it benefits our members by significantly reducing healthcare costs through a community-based approach.',
      },
      {
        id: 'mec',
        title: 'Minimum Essential Coverage (MEC)',
        type: 'text',
        content:
          'Minimum Essential Coverage (MEC) is a type of health coverage that satisfies the individual shared responsibility provision of the Affordable Care Act.\n\nOur MEC plans provide:\n• Preventive care services\n• Wellness visits\n• Immunizations\n• Screenings\n• ACA-compliant coverage\n\nMEC is included in select membership tiers and helps members meet federal requirements while providing essential preventive benefits.',
      },
      {
        id: 'virtual-health',
        title: 'Virtual Health',
        type: 'video',
        duration: '01:46',
        description: 'Discover our virtual health services that allow members to consult with doctors from the comfort of their home, 24/7, for a wide range of medical needs.',
      },
      {
        id: 'mpb-concierge',
        title: 'MPB Concierge',
        type: 'text',
        content:
          'The MPB Concierge service is a dedicated support team available to assist members with:\n\n• Finding healthcare providers\n• Understanding benefits and coverage\n• Navigating medical bills and claims\n• Scheduling appointments\n• Coordinating care\n• Answering questions about their membership\n\nOur concierge team ensures every member has a seamless and supportive healthcare experience.',
      },
      {
        id: 'qr-lifecode',
        title: 'QR LifeCode & Personal Medical Records Vault',
        type: 'text',
        content:
          'QR LifeCode is an innovative medical ID system that:\n\n• Stores vital medical information accessible via QR code\n• Provides emergency responders with critical health data\n• Includes a Personal Medical Records Vault for secure document storage\n• Allows members to share medical records with providers easily\n• Accessible from any smartphone — no app required\n\nThis feature gives members peace of mind knowing their medical information is always accessible when it matters most.',
      },
      {
        id: 'supplements',
        title: 'Discounted Supplements & Wellness Products',
        type: 'text',
        content:
          'Members enjoy exclusive access to discounted health supplements and wellness products:\n\n• Premium-quality vitamins and supplements\n• Wellness and fitness products\n• Personal care items\n• Exclusive member pricing\n• Convenient online ordering\n\nThis benefit helps members maintain their health proactively with affordable access to top-quality wellness products.',
      },
      {
        id: 'debt-dismissal',
        title: 'Debt Dismissal Program',
        type: 'text',
        content:
          'The Debt Dismissal Program helps members manage and reduce medical debt:\n\n• Professional medical bill negotiation\n• Debt reduction assistance\n• Financial counseling support\n• Guidance on medical billing processes\n• Help resolving billing disputes\n\nThis program provides valuable financial relief and support for members dealing with medical expenses.',
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
          'Compare our membership tiers to find the right fit for each client. Each tier includes a unique combination of benefits designed to meet different healthcare needs and budgets.\n\nKey comparison areas:\n• Monthly contribution amounts\n• Medical cost sharing limits\n• Included benefits (MEC, Virtual Health, Concierge, etc.)\n• Family coverage options\n• Waiting periods\n• Maximum sharing amounts\n\nRefer to the official MPB membership comparison chart for the most up-to-date pricing and benefit details.',
      },
      {
        id: 'do-not-sell',
        title: 'Do Not Sell States',
        type: 'text',
        content:
          'Important: Certain membership plans may not be available in all states. Before presenting options to a potential member, always verify state availability.\n\nRefer to the current "Do Not Sell" state list on the advisor portal for the most up-to-date information on restricted states and products.',
      },
      {
        id: 'important-message',
        title: 'Important Message',
        type: 'text',
        content:
          'Important Compliance Reminder:\n\nAs an MPB Healthcare Advisor, it is critical that you:\n\n• Never misrepresent our programs as health insurance\n• Always use approved language and terminology\n• Follow all state and federal compliance guidelines\n• Present accurate information about benefits and limitations\n• Disclose all relevant terms and conditions\n• Maintain ethical sales practices at all times\n\nViolation of compliance guidelines may result in termination of your advisor agreement.',
      },
      {
        id: 'memberships-video',
        title: 'Watch Video: Membership Overview',
        type: 'video',
        duration: '05:12',
        description: 'A comprehensive video walkthrough of all MPB Health membership tiers, their benefits, pricing, and how to position them for potential members.',
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
        description: 'Learn how to customize and effectively use your personal advisor landing page to attract and convert potential members. This video covers page setup, customization options, best practices, and how to share your link.',
      },
    ],
  },
  {
    id: 'get-started',
    title: 'Get Started',
    icon: Briefcase,
    lessons: [
      {
        id: 'useful-resources',
        title: 'Useful Resources',
        type: 'resource',
        content: 'Access helpful resources to support your journey as an MPB Healthcare Advisor.',
        resourceLinks: [
          { label: 'MPB Health Official Website', url: 'https://mpb.health' },
          { label: 'Advisor Portal', url: 'https://advisor.mpb.health' },
          { label: 'Provider Search (MultiPlan)', url: 'https://providersearch.multiplan.com/' },
          { label: 'GoodRx - Prescription Discounts', url: 'https://www.goodrx.com/' },
        ],
      },
      {
        id: 'networking',
        title: 'Best Platforms & Apps for Networking',
        type: 'resource',
        content: 'Discover the best platforms and apps to grow your network and connect with potential clients.',
        resourceLinks: [
          { label: 'LinkedIn', url: 'https://www.linkedin.com/' },
          { label: 'Facebook Groups', url: 'https://www.facebook.com/groups/' },
          { label: 'Alignable', url: 'https://www.alignable.com/' },
          { label: 'Nextdoor', url: 'https://nextdoor.com/' },
        ],
      },
      {
        id: 'business-tools',
        title: 'Business Tools & Tips',
        type: 'resource',
        content: 'Tools and strategies to help you manage your advisor business efficiently.',
        resourceLinks: [
          { label: 'Canva - Marketing Materials', url: 'https://www.canva.com/' },
          { label: 'Calendly - Appointment Scheduling', url: 'https://calendly.com/' },
          { label: 'Loom - Video Messaging', url: 'https://www.loom.com/' },
        ],
      },
    ],
  },
  {
    id: 'required-forms',
    title: 'Required Forms',
    icon: ClipboardList,
    lessons: [
      {
        id: 'complete-forms',
        title: 'Complete Your Required Forms',
        type: 'form',
        content: 'Before you can begin working as an MPB Healthcare Advisor, you must complete and submit all required forms. These include your advisor agreement, compliance acknowledgement, and W-9 form.\n\nPlease access the Forms section of the advisor portal to complete all required documents.',
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
        content: 'After completing all training topics, take the Healthcare Advisor Certification Quiz to test your knowledge and earn your certification.\n\nThe quiz covers all topics from this course including:\n• MPB Health mission and values\n• Benefits and membership details\n• Compliance guidelines\n• Sales techniques and best practices\n\nYou must score 80% or higher to pass and receive your certification.',
      },
    ],
  },
];

/* ------------------------------------------------------------------ */
/*  Helpers                                                            */
/* ------------------------------------------------------------------ */

function getLessonIcon(type: Lesson['type']) {
  switch (type) {
    case 'video':
      return Video;
    case 'quiz':
      return HelpCircle;
    case 'form':
      return ClipboardList;
    case 'resource':
      return ExternalLink;
    default:
      return FileText;
  }
}

function getLessonTypeLabel(type: Lesson['type']) {
  switch (type) {
    case 'video':
      return 'Video';
    case 'quiz':
      return 'Quiz';
    case 'form':
      return 'Form';
    case 'resource':
      return 'Resource';
    default:
      return 'Lesson';
  }
}

function getLessonTypeBadgeClasses(type: Lesson['type']) {
  switch (type) {
    case 'video':
      return 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-300';
    case 'quiz':
      return 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300';
    case 'form':
      return 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300';
    case 'resource':
      return 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300';
    default:
      return 'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300';
  }
}

function getLessonIconContainerClasses(type: Lesson['type']) {
  switch (type) {
    case 'video':
      return 'bg-purple-100 dark:bg-purple-900/20';
    case 'quiz':
      return 'bg-amber-100 dark:bg-amber-900/20';
    case 'form':
      return 'bg-blue-100 dark:bg-blue-900/20';
    case 'resource':
      return 'bg-emerald-100 dark:bg-emerald-900/20';
    default:
      return 'bg-gray-100 dark:bg-gray-800/30';
  }
}

function getLessonIconColorClasses(type: Lesson['type']) {
  switch (type) {
    case 'video':
      return 'text-purple-600 dark:text-purple-400';
    case 'quiz':
      return 'text-amber-600 dark:text-amber-400';
    case 'form':
      return 'text-blue-600 dark:text-blue-400';
    case 'resource':
      return 'text-emerald-600 dark:text-emerald-400';
    default:
      return 'text-gray-600 dark:text-gray-400';
  }
}

/* ------------------------------------------------------------------ */
/*  LessonContent                                                      */
/* ------------------------------------------------------------------ */

function LessonContent({ lesson }: { lesson: Lesson }) {
  const contentRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    contentRef.current?.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
  }, []);

  return (
    <div ref={contentRef} className="px-4 py-4 pl-[76px] bg-surface-primary border-t border-th-border-subtle">
      {/* Video */}
      {lesson.type === 'video' && (
        <div className="space-y-3">
          {lesson.description && (
            <p className="text-sm text-th-text-secondary leading-relaxed">{lesson.description}</p>
          )}
          {lesson.vimeoId ? (
            <div className="aspect-video bg-neutral-900 rounded-lg overflow-hidden">
              <iframe
                src={`https://player.vimeo.com/video/${lesson.vimeoId}?badge=0&autopause=0&player_id=0`}
                className="w-full h-full"
                allow="autoplay; fullscreen; picture-in-picture"
                allowFullScreen
                title={lesson.title}
              />
            </div>
          ) : (
            <div className="aspect-video bg-neutral-100 dark:bg-neutral-800 rounded-lg flex items-center justify-center">
              <div className="text-center">
                <Video className="w-12 h-12 mx-auto mb-3 text-th-text-tertiary" />
                <p className="text-th-text-tertiary text-sm">Video content coming soon</p>
                <p className="text-th-text-tertiary text-xs mt-1">
                  {lesson.duration && `Duration: ${lesson.duration}`}
                </p>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Text content */}
      {lesson.type === 'text' && lesson.content && (
        <div className="prose prose-sm max-w-none dark:prose-invert">
          {lesson.content.split('\n\n').map((paragraph, i) => (
            <div key={i} className="mb-3 last:mb-0">
              {paragraph.startsWith('•') || paragraph.includes('\n•') ? (
                <ul className="list-none space-y-1.5 ml-0 pl-0">
                  {paragraph.split('\n').map((line, j) => {
                    const trimmed = line.replace(/^•\s*/, '');
                    if (!trimmed) return null;
                    return (
                      <li key={j} className="flex items-start gap-2 text-sm text-th-text-secondary">
                        <CheckCircle2 className="w-4 h-4 text-green-500 flex-shrink-0 mt-0.5" />
                        <span>{trimmed}</span>
                      </li>
                    );
                  })}
                </ul>
              ) : paragraph.match(/^\d+\./) ? (
                <ol className="list-none space-y-1.5 ml-0 pl-0">
                  {paragraph.split('\n').map((line, j) => {
                    const trimmed = line.replace(/^\d+\.\s*/, '');
                    if (!trimmed) return null;
                    const num = line.match(/^(\d+)\./)?.[1];
                    return (
                      <li key={j} className="flex items-start gap-3 text-sm text-th-text-secondary">
                        <span className="flex-shrink-0 w-6 h-6 rounded-full bg-th-accent-50 dark:bg-th-accent-900/20 text-th-accent-600 dark:text-th-accent-400 flex items-center justify-center text-xs font-semibold">
                          {num}
                        </span>
                        <span className="pt-0.5">{trimmed}</span>
                      </li>
                    );
                  })}
                </ol>
              ) : (
                <p className="text-sm text-th-text-secondary leading-relaxed">{paragraph}</p>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Quiz */}
      {lesson.type === 'quiz' && (
        <div className="space-y-3">
          {lesson.content && (
            <div className="prose prose-sm max-w-none dark:prose-invert">
              {lesson.content.split('\n\n').map((paragraph, i) => (
                <div key={i} className="mb-3 last:mb-0">
                  {paragraph.startsWith('•') || paragraph.includes('\n•') ? (
                    <ul className="list-none space-y-1.5 ml-0 pl-0">
                      {paragraph.split('\n').map((line, j) => {
                        const trimmed = line.replace(/^•\s*/, '');
                        if (!trimmed) return null;
                        return (
                          <li key={j} className="flex items-start gap-2 text-sm text-th-text-secondary">
                            <CheckCircle2 className="w-4 h-4 text-amber-500 flex-shrink-0 mt-0.5" />
                            <span>{trimmed}</span>
                          </li>
                        );
                      })}
                    </ul>
                  ) : (
                    <p className="text-sm text-th-text-secondary leading-relaxed">{paragraph}</p>
                  )}
                </div>
              ))}
            </div>
          )}
          <div className="bg-amber-50 dark:bg-amber-900/10 border border-amber-200 dark:border-amber-800/30 rounded-lg p-4">
            <div className="flex items-center gap-2 text-amber-700 dark:text-amber-400">
              <HelpCircle className="w-5 h-5" />
              <span className="font-medium text-sm">Quiz will be available after completing all lessons</span>
            </div>
          </div>
        </div>
      )}

      {/* Form */}
      {lesson.type === 'form' && (
        <div className="space-y-3">
          {lesson.content && (
            <p className="text-sm text-th-text-secondary leading-relaxed">{lesson.content}</p>
          )}
          <a
            href="/forms"
            className="inline-flex items-center gap-2 px-4 py-2 bg-th-accent-600 text-white rounded-lg text-sm font-medium hover:bg-th-accent-700 transition-colors"
          >
            <ClipboardList className="w-4 h-4" />
            Go to Forms
          </a>
        </div>
      )}

      {/* Resource */}
      {lesson.type === 'resource' && (
        <div className="space-y-3">
          {lesson.content && (
            <p className="text-sm text-th-text-secondary leading-relaxed">{lesson.content}</p>
          )}
          {lesson.resourceLinks && (
            <div className="grid gap-2">
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
        </div>
      )}
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Course Cards (main /training page)                                 */
/* ------------------------------------------------------------------ */

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
    href: '/training/sedera',
    gradient: 'from-emerald-600 via-teal-600 to-cyan-700',
    icon: Shield,
    available: false,
  },
  {
    id: 'zion',
    title: 'Zion Training',
    description:
      'Explore Zion HealthShare programs and learn how to effectively advise clients on Zion membership options.',
    topicCount: 0,
    lessonCount: 0,
    href: '/training/zion',
    gradient: 'from-orange-500 via-red-500 to-rose-600',
    icon: Heart,
    available: false,
  },
];

/* ------------------------------------------------------------------ */
/*  Main Component                                                     */
/* ------------------------------------------------------------------ */

export default function Training({ section }: TrainingProps) {
  const navigate = useNavigate();
  const [expandedTopics, setExpandedTopics] = useState<Set<string>>(new Set(['introduction']));
  const [searchQuery, setSearchQuery] = useState('');
  const [activeLesson, setActiveLesson] = useState<string | null>(null);

  const toggleTopic = (topicId: string) => {
    setExpandedTopics((prev) => {
      const next = new Set(prev);
      if (next.has(topicId)) {
        next.delete(topicId);
      } else {
        next.add(topicId);
      }
      return next;
    });
  };

  /* -------------------- Course Listing Page -------------------- */
  if (!section) {
    return (
      <div className="space-y-6">
        {/* Header */}
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

        {/* Course Cards */}
        <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-5">
          {courses.map((course) => {
            const CourseIcon = course.icon;
            return (
              <div
                key={course.id}
                onClick={() => course.available && navigate(course.href)}
                onKeyDown={(e) => e.key === 'Enter' && course.available && navigate(course.href)}
                role={course.available ? 'button' : undefined}
                tabIndex={course.available ? 0 : undefined}
                className={`rounded-xl border border-th-border overflow-hidden flex flex-col transition-all ${
                  course.available
                    ? 'cursor-pointer hover:shadow-lg hover:border-th-accent-300'
                    : 'opacity-60'
                }`}
              >
                {/* Gradient Header */}
                <div className={`bg-gradient-to-br ${course.gradient} p-5 text-white relative overflow-hidden`}>
                  <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHZpZXdCb3g9IjAgMCA2MCA2MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZyBmaWxsPSJub25lIiBmaWxsLXJ1bGU9ImV2ZW5vZGQiPjxnIGZpbGw9IiNmZmYiIGZpbGwtb3BhY2l0eT0iMC4wNSI+PHBhdGggZD0iTTM2IDM0djItSDI0di0yaDEyek0zNiAyNHYySDI0di0yaDEyeiIvPjwvZz48L2c+PC9zdmc+')] opacity-30" />
                  <div className="relative">
                    <div className="p-2 rounded-lg bg-white/15 w-fit mb-3">
                      <CourseIcon className="w-6 h-6" />
                    </div>
                    <h3 className="font-bold text-lg">{course.title}</h3>
                  </div>
                </div>

                {/* Content */}
                <div className="p-5 bg-surface-primary flex-1 flex flex-col">
                  <p className="text-sm text-th-text-secondary leading-relaxed line-clamp-3 mb-4">
                    {course.description}
                  </p>
                  <div className="mt-auto flex items-center justify-between">
                    {course.available ? (
                      <>
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
                        <span className="flex items-center gap-1 text-sm text-th-accent-600 font-medium">
                          Start <ArrowRight className="w-4 h-4" />
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

  /* -------------------- MPB Course Detail -------------------- */
  const totalLessons = mpbCourseTopics.reduce((acc, t) => acc + t.lessons.length, 0);

  const filteredTopics = searchQuery
    ? mpbCourseTopics
        .map((topic) => ({
          ...topic,
          lessons: topic.lessons.filter(
            (l) =>
              l.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
              topic.title.toLowerCase().includes(searchQuery.toLowerCase())
          ),
        }))
        .filter((topic) => topic.lessons.length > 0)
    : mpbCourseTopics;

  return (
    <div className="space-y-6">
      {/* Back Link */}
      <button
        onClick={() => navigate('/training')}
        className="flex items-center gap-1 text-sm text-th-text-tertiary hover:text-th-text-primary transition-colors"
      >
        &larr; <span>All Courses</span>
      </button>

      {/* Course Header */}
      <div className="bg-gradient-to-br from-blue-600 via-indigo-600 to-purple-700 rounded-2xl p-6 md:p-8 text-white relative overflow-hidden">
        <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHZpZXdCb3g9IjAgMCA2MCA2MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZyBmaWxsPSJub25lIiBmaWxsLXJ1bGU9ImV2ZW5vZGQiPjxnIGZpbGw9IiNmZmYiIGZpbGwtb3BhY2l0eT0iMC4wNSI+PHBhdGggZD0iTTM2IDM0djItSDI0di0yaDEyek0zNiAyNHYySDI0di0yaDEyeiIvPjwvZz48L2c+PC9zdmc+')] opacity-30" />
        <div className="relative">
          <div className="flex items-center gap-3 mb-3">
            <div className="p-2.5 rounded-xl bg-white/15">
              <GraduationCap className="w-7 h-7" />
            </div>
            <span className="text-sm font-medium text-white/80 bg-white/10 px-3 py-1 rounded-full">
              Required Course
            </span>
          </div>
          <h1 className="text-2xl md:text-3xl font-bold mb-3">
            Become an MPB Healthcare Advisor
          </h1>
          <p className="text-white/80 text-sm md:text-base max-w-2xl leading-relaxed">
            This comprehensive course equips you with the knowledge and skills necessary to excel as an MPB team member and healthcare advisor.
          </p>
          <div className="flex items-center gap-6 mt-5 text-sm text-white/70">
            <div className="flex items-center gap-1.5">
              <BookOpen className="w-4 h-4" />
              <span>{mpbCourseTopics.length} Topics</span>
            </div>
            <div className="flex items-center gap-1.5">
              <FileText className="w-4 h-4" />
              <span>{totalLessons} Lessons</span>
            </div>
            <div className="flex items-center gap-1.5">
              <Award className="w-4 h-4" />
              <span>Certificate</span>
            </div>
          </div>
        </div>
      </div>

      {/* What You'll Learn */}
      <div className="bg-surface-primary rounded-xl border border-th-border p-5">
        <h2 className="font-semibold text-th-text-primary mb-3 flex items-center gap-2">
          <Sparkles className="w-5 h-5 text-th-text-tertiary" />
          What You'll Learn
        </h2>
        <ul className="space-y-2">
          {mpbCourseDescription.map((item, i) => (
            <li key={i} className="flex items-start gap-3">
              <CheckCircle2 className="w-4 h-4 text-green-500 flex-shrink-0 mt-0.5" />
              <span className="text-sm text-th-text-secondary leading-relaxed">{item}</span>
            </li>
          ))}
        </ul>
      </div>

      {/* Course Content */}
      <div className="bg-surface-primary rounded-xl border border-th-border overflow-hidden">
        <div className="flex items-center justify-between p-5 border-b border-th-border-subtle">
          <h2 className="font-semibold text-th-text-primary">Course Content</h2>
          <div className="flex items-center gap-3">
            <span className="text-sm text-th-text-tertiary">
              {mpbCourseTopics.length} topics &middot; {totalLessons} lessons
            </span>
            <button
              onClick={() => {
                if (expandedTopics.size === mpbCourseTopics.length) {
                  setExpandedTopics(new Set());
                } else {
                  setExpandedTopics(new Set(mpbCourseTopics.map((t) => t.id)));
                }
              }}
              className="text-xs text-th-accent-600 hover:text-th-accent-700 font-medium"
            >
              {expandedTopics.size === mpbCourseTopics.length ? 'Collapse All' : 'Expand All'}
            </button>
          </div>
        </div>

        {/* Search */}
        <div className="p-4 border-b border-th-border-subtle">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-th-text-tertiary" />
            <input
              type="text"
              placeholder="Search lessons..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-4 py-2 text-sm border border-th-border rounded-lg bg-surface-primary text-th-text-primary focus:outline-none focus:ring-2 focus:ring-th-accent-500 focus:border-transparent"
            />
          </div>
        </div>

        {/* Topics */}
        <div className="divide-y divide-th-border-subtle">
          {filteredTopics.map((topic, topicIndex) => {
            const isExpanded = expandedTopics.has(topic.id);
            const TopicIcon = topic.icon;

            return (
              <div key={topic.id}>
                {/* Topic Header */}
                <button
                  onClick={() => toggleTopic(topic.id)}
                  className="w-full flex items-center gap-3 p-4 hover:bg-surface-tertiary transition-colors text-left"
                >
                  <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-th-accent-50 dark:bg-th-accent-900/20 flex-shrink-0">
                    <TopicIcon className="w-4 h-4 text-th-accent-600 dark:text-th-accent-400" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <span className="text-[11px] font-medium text-th-text-tertiary uppercase tracking-wider">
                      Topic {topicIndex + 1}
                    </span>
                    <h3 className="font-medium text-th-text-primary text-sm leading-snug">
                      {topic.title}
                    </h3>
                  </div>
                  <span className="text-xs text-th-text-tertiary flex-shrink-0 mr-2">
                    {topic.lessons.length} {topic.lessons.length === 1 ? 'lesson' : 'lessons'}
                  </span>
                  {isExpanded ? (
                    <ChevronDown className="w-4 h-4 text-th-text-tertiary flex-shrink-0" />
                  ) : (
                    <ChevronRight className="w-4 h-4 text-th-text-tertiary flex-shrink-0" />
                  )}
                </button>

                {/* Lessons */}
                {isExpanded && (
                  <div className="bg-surface-secondary">
                    {topic.lessons.map((lesson) => {
                      const LessonIcon = getLessonIcon(lesson.type);
                      const isActive = activeLesson === lesson.id;

                      return (
                        <div key={lesson.id}>
                          <button
                            onClick={() => setActiveLesson(isActive ? null : lesson.id)}
                            className={`w-full flex items-center gap-3 px-4 py-3 pl-[60px] text-left transition-colors ${
                              isActive
                                ? 'bg-th-accent-50 dark:bg-th-accent-900/10 border-l-2 border-th-accent-500'
                                : 'hover:bg-surface-tertiary border-l-2 border-transparent'
                            }`}
                          >
                            <div className={`w-7 h-7 rounded-md flex items-center justify-center flex-shrink-0 ${getLessonIconContainerClasses(lesson.type)}`}>
                              <LessonIcon className={`w-3.5 h-3.5 ${getLessonIconColorClasses(lesson.type)}`} />
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className="text-sm text-th-text-primary leading-snug">{lesson.title}</p>
                            </div>
                            <div className="flex items-center gap-2 flex-shrink-0">
                              {lesson.duration && (
                                <span className="flex items-center gap-1 text-xs text-th-text-tertiary">
                                  <Clock className="w-3 h-3" />
                                  {lesson.duration}
                                </span>
                              )}
                              <span className={`text-[10px] font-medium px-1.5 py-0.5 rounded ${getLessonTypeBadgeClasses(lesson.type)}`}>
                                {getLessonTypeLabel(lesson.type)}
                              </span>
                              {isActive ? (
                                <ChevronDown className="w-3.5 h-3.5 text-th-text-tertiary" />
                              ) : (
                                <ChevronRight className="w-3.5 h-3.5 text-th-text-tertiary" />
                              )}
                            </div>
                          </button>

                          {/* Expanded lesson content */}
                          {isActive && <LessonContent lesson={lesson} />}
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {filteredTopics.length === 0 && (
          <div className="text-center py-12">
            <Search className="w-10 h-10 mx-auto mb-3 text-th-text-tertiary" />
            <p className="text-th-text-tertiary text-sm">No lessons match your search</p>
          </div>
        )}
      </div>

      {/* Start CTA */}
      <div className="bg-surface-primary rounded-xl border border-th-border p-5 flex flex-col sm:flex-row items-center justify-between gap-4">
        <div>
          <h3 className="font-semibold text-th-text-primary">Ready to get started?</h3>
          <p className="text-sm text-th-text-tertiary mt-0.5">
            Complete all {totalLessons} lessons to earn your Healthcare Advisor certification.
          </p>
        </div>
        <button
          onClick={() => {
            setExpandedTopics(new Set(['introduction']));
            setActiveLesson('about-us');
            window.scrollTo({ top: 0, behavior: 'smooth' });
          }}
          className="flex items-center gap-2 px-6 py-2.5 bg-th-accent-600 text-white rounded-lg font-medium hover:bg-th-accent-700 transition-colors flex-shrink-0"
        >
          <Play className="w-4 h-4" />
          Start Learning
        </button>
      </div>
    </div>
  );
}
