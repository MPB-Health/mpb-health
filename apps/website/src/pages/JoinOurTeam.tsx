import React, { useEffect, useRef, useState } from 'react';
import { Helmet } from 'react-helmet-async';
import {
  Phone,
  DollarSign,
  GraduationCap,
  Clock,
  Heart,
  Shield,
  Award,
  ArrowRight,
  CheckCircle,
  Sparkles,
  TrendingUp,
  Users,
  Target,
  Zap
} from 'lucide-react';
import { Card, CardContent } from '../components/ui/Card';
import { Accordion, AccordionItem, AccordionTrigger, AccordionContent } from '../components/ui/Accordion';
import { Badge } from '../components/ui/Badge';
import { supabase } from '../lib/supabase';

interface Event {
  id: string;
  title: string;
  slug: string;
  excerpt: string;
  featured_image_url: string;
  author: string;
  published_date: string;
  category: string;
}

const JoinOurTeam: React.FC = () => {
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const [events, setEvents] = useState<Event[]>([]);
  const [_loading, setLoading] = useState(true);

  useEffect(() => {
    const handleResize = (event: MessageEvent) => {
      if (event.data && event.data.height && iframeRef.current) {
        const iframe = iframeRef.current;
        const height = parseInt(event.data.height, 10);
        if (height > 0) {
          iframe.style.height = `${height}px`;
        }
      }
    };

    window.addEventListener('message', handleResize);

    return () => {
      window.removeEventListener('message', handleResize);
    };
  }, []);

  useEffect(() => {
    const fetchEvents = async () => {
      try {
        const { data, error } = await supabase
          .from('blog_articles')
          .select('id, title, slug, excerpt, featured_image_url, author, published_date, category')
          .eq('category', 'Event')
          .eq('is_published', true)
          .order('published_date', { ascending: false })
          .limit(3);

        // Handle missing table gracefully
        if (error?.message?.includes('schema cache') || 
            error?.code === 'PGRST204' ||
            error?.code === 'PGRST205') {
          setEvents([]);
          return;
        }
        if (error) throw error;
        setEvents(data || []);
      } catch (error) {
        console.error('Error fetching events:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchEvents();
  }, []);

  const benefits = [
    {
      icon: DollarSign,
      title: 'Lucrative Commissions',
      description: 'Earn competitive commissions on every membership sale, plus ongoing residuals on renewals—so each client continues contributing to your income long after the first sale.',
      color: 'text-green-600',
      bgColor: 'bg-gradient-to-br from-green-50 to-emerald-50',
      iconBg: 'bg-green-500'
    },
    {
      icon: GraduationCap,
      title: 'Free Training & Support',
      description: 'Access live workshops, on-demand video courses, and a dedicated mentor, along with ready-to-use marketing assets and email templates to help you build momentum from day one.',
      color: 'text-blue-600',
      bgColor: 'bg-gradient-to-br from-blue-50 to-cyan-50',
      iconBg: 'bg-blue-500'
    },
    {
      icon: Clock,
      title: 'Flexible & Remote',
      description: 'Work from anywhere, set your own hours, and rely on our fully digital quoting and enrollment platform to streamline client interactions and minimize admin work.',
      color: 'text-orange-600',
      bgColor: 'bg-gradient-to-br from-orange-50 to-amber-50',
      iconBg: 'bg-orange-500'
    },
    {
      icon: Heart,
      title: 'Purpose-Driven Culture',
      description: 'Be part of a mission-focused team making healthcare more accessible; celebrate successes at quarterly retreats and take pride in the real impact you\'re creating.',
      color: 'text-rose-600',
      bgColor: 'bg-gradient-to-br from-rose-50 to-pink-50',
      iconBg: 'bg-rose-500'
    },
    {
      icon: Shield,
      title: 'Back-Office Support',
      description: 'Our operations and compliance teams manage billing and regulatory updates—freeing you to focus on clients and grow your business with confidence.',
      color: 'text-violet-600',
      bgColor: 'bg-gradient-to-br from-violet-50 to-purple-50',
      iconBg: 'bg-violet-500'
    },
    {
      icon: Award,
      title: 'Incentives & Exclusive Trips',
      description: 'Compete in yearly performance challenges and earn invitations to all-expenses-paid retreats—rewarding your top achievements and strengthening team bonds.',
      color: 'text-yellow-600',
      bgColor: 'bg-gradient-to-br from-yellow-50 to-amber-50',
      iconBg: 'bg-yellow-500'
    }
  ];

  const stats = [
    { icon: Users, value: '500+', label: 'Active Advisors', color: 'text-blue-600' },
    { icon: TrendingUp, value: '$2M+', label: 'Paid in Commissions', color: 'text-green-600' },
    { icon: Target, value: '98%', label: 'Advisor Satisfaction', color: 'text-orange-600' },
    { icon: Sparkles, value: '24/7', label: 'Support Available', color: 'text-violet-600' }
  ];

  const faqItems = [
    {
      question: 'What qualifications do I need to join?',
      answer: 'You\'ll need a valid health insurance license in the state(s) where you plan to sell, but prior industry experience isn\'t required. We\'ll guide you through any gaps and pair you with a mentor to ramp up quickly.'
    },
    {
      question: 'How long before I start earning?',
      answer: 'Most new advisors begin closing business within two weeks of starting training. Since our enrollment platform is fully digital, you can be in front of prospects—and earning commissions—almost immediately.'
    },
    {
      question: 'What technology will I need?',
      answer: 'Just a computer with internet access. Our cloud-based platform works seamlessly on any modern browser, with no special software required.'
    },
    {
      question: 'How much ongoing support can I expect?',
      answer: 'You\'ll have access to our dedicated Business Development team during regular business hours for any questions or guidance. Plus, we host biweekly update meetings covering the latest industry trends, product enhancements, and best practices to keep you informed and successful.'
    }
  ];

  const perks = [
    { icon: CheckCircle, text: 'Unlimited earning potential' },
    { icon: CheckCircle, text: 'Work-life balance' },
    { icon: CheckCircle, text: 'No cold calling required' },
    { icon: CheckCircle, text: 'Proven sales system' },
    { icon: CheckCircle, text: 'Marketing materials provided' },
    { icon: CheckCircle, text: 'Weekly team training' }
  ];

  return (
    <>
      <Helmet>
        <title>Join Our Team - MPB Health Careers</title>
        <meta
          name="description"
          content="Turn your passion for helping others into a thriving advisory business. Join MPB Health's community of impact-driven healthcare advisors."
        />
      </Helmet>

      <section className="relative pt-20 pb-10 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-blue-50 to-cyan-50/50" />
        <div className="absolute inset-0 opacity-30">
          <img
            src="/assets/CelebratingExcellence.jpg"
            alt="Join Our Team"
            className="w-full h-full object-cover"
          />
        </div>
        <div className="absolute inset-0 bg-gradient-to-r from-white/95 via-white/90 to-white/80" />

        <div className="relative mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
          <div className="max-w-2xl">
            <Badge className="mb-4 bg-blue-100 text-blue-700 border-0">
              <Sparkles className="w-3 h-3 mr-1" />
              Career Opportunities
            </Badge>

            <h1 className="text-4xl sm:text-5xl font-bold mb-4 text-gray-900 text-balance">
              Join Impact-Driven Health Advisors
            </h1>

            <p className="text-lg text-gray-600 mb-6 leading-relaxed">
              Turn your passion for helping others into a thriving advisory business.
            </p>

            <div className="flex flex-wrap gap-3 mb-6">
              <a
                href="https://calendly.com/rebalarney-mympb/time-with-reba"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-700 hover:to-cyan-700 text-white px-6 py-3 rounded-lg font-semibold transition-all duration-300 shadow-lg"
              >
                Schedule a Call
                <ArrowRight className="w-4 h-4" />
              </a>
              <a
                href="tel:8558164650"
                className="inline-flex items-center gap-2 bg-white border border-gray-300 text-gray-900 px-6 py-3 rounded-lg font-semibold hover:bg-gray-50 transition-all duration-300"
              >
                <Phone className="w-4 h-4" />
                (855) 816-4650
              </a>
            </div>

            <div className="flex flex-wrap items-center gap-6 text-sm text-gray-600">
              {stats.map((stat, index) => (
                <span key={index} className="flex items-center gap-1">
                  <stat.icon className={`w-4 h-4 ${stat.color}`} />
                  <span className="font-semibold text-gray-900">{stat.value}</span> {stat.label}
                </span>
              ))}
            </div>
          </div>
        </div>
      </section>

      <section className="py-24 bg-gradient-to-b from-white to-gray-50">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <Badge className="mb-4 bg-blue-100 text-blue-700 border-0">
              Why Join Us
            </Badge>
            <h2 className="text-4xl lg:text-5xl font-bold text-gray-900 mb-4">
              Build Your Future With MPB Health
            </h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              Join a team that values your growth, celebrates your success, and empowers you to make a real difference
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {benefits.map((benefit, index) => (
              <div
                key={index}
                className={`${benefit.bgColor} rounded-3xl p-8 border border-gray-200/50 hover:shadow-xl transition-all duration-300 hover:-translate-y-1 group`}
              >
                <div className={`w-16 h-16 ${benefit.iconBg} rounded-2xl flex items-center justify-center mb-6 shadow-lg group-hover:scale-110 transition-transform duration-300`}>
                  <benefit.icon className="h-8 w-8 text-white" />
                </div>
                <h3 className="text-2xl font-bold text-gray-900 mb-3">
                  {benefit.title}
                </h3>
                <p className="text-gray-700 leading-relaxed">
                  {benefit.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="py-24 bg-gradient-to-br from-blue-600 via-blue-700 to-cyan-600 relative overflow-hidden">
        <div className="absolute inset-0">
          <div className="absolute top-0 right-0 w-96 h-96 bg-white/10 rounded-full blur-3xl" />
          <div className="absolute bottom-0 left-0 w-96 h-96 bg-cyan-400/10 rounded-full blur-3xl" />
        </div>

        <div className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <div>
              <Badge className="mb-4 bg-white/20 text-white border-0">
                <Zap className="w-3 h-3 mr-1" />
                Quick Perks
              </Badge>
              <h2 className="text-4xl lg:text-5xl font-bold text-white mb-6">
                Everything You Need to Succeed
              </h2>
              <p className="text-xl text-white/90 mb-8 leading-relaxed">
                We provide all the tools, training, and support you need to build a thriving advisory business from day one.
              </p>

              <div className="grid sm:grid-cols-2 gap-4 mb-8">
                {perks.map((perk, index) => (
                  <div key={index} className="flex items-center gap-3 text-white">
                    <perk.icon className="w-5 h-5 text-green-400 flex-shrink-0" />
                    <span className="font-medium">{perk.text}</span>
                  </div>
                ))}
              </div>

              <a
                href="https://calendly.com/rebalarney-mympb/time-with-reba"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center justify-center px-8 py-4 bg-white text-blue-600 font-semibold rounded-2xl hover:bg-gray-50 transition-all duration-300 shadow-2xl hover:shadow-white/50 hover:scale-105 group"
              >
                Get Started Today
                <ArrowRight className="ml-2 h-5 w-5 transition-transform group-hover:translate-x-1" />
              </a>
            </div>

            <div className="relative">
              <div className="absolute inset-0 bg-gradient-to-br from-cyan-400/20 to-blue-400/20 rounded-3xl transform rotate-3" />
              <div className="relative rounded-3xl overflow-hidden shadow-2xl">
                <img
                  src="/assets/delegates-networking.jpg"
                  alt="Team Success"
                  className="w-full h-full object-cover"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-blue-900/60 to-transparent" />
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="py-24 bg-white">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="grid lg:grid-cols-2 gap-16 items-start">
            <div className="lg:sticky lg:top-24">
              <Badge className="mb-4 bg-green-100 text-green-700 border-0">
                Apply Now
              </Badge>
              <h2 className="text-4xl lg:text-5xl font-bold text-gray-900 mb-6">
                Ready to Join Our Team?
              </h2>
              <p className="text-xl text-gray-600 mb-8 leading-relaxed">
                Take the first step towards building your advisory business. Fill out the form and we'll be in touch to discuss your future with MPB Health.
              </p>

              <div className="relative rounded-3xl overflow-hidden shadow-2xl group mb-8">
                <img
                  src="/assets/making.jpg"
                  alt="Join Our Team"
                  className="w-full h-96 object-cover transition-transform duration-500 group-hover:scale-105"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-gray-900/80 via-gray-900/40 to-transparent" />
                <div className="absolute bottom-0 left-0 right-0 p-8">
                  <h3 className="text-2xl font-bold text-white mb-2">
                    Let's Connect!
                  </h3>
                  <p className="text-white/90">
                    We're excited to meet passionate, driven individuals like you
                  </p>
                </div>
              </div>

              <div className="flex flex-col sm:flex-row gap-4">
                <a
                  href="https://calendly.com/rebalarney-mympb/time-with-reba"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center justify-center px-6 py-3 bg-gradient-to-r from-blue-600 to-cyan-600 text-white font-semibold rounded-xl hover:from-blue-700 hover:to-cyan-700 transition-all duration-300 shadow-lg hover:shadow-xl group"
                >
                  Schedule a Call
                  <ArrowRight className="ml-2 h-4 w-4 transition-transform group-hover:translate-x-1" />
                </a>
                <a
                  href="tel:8558164650"
                  className="inline-flex items-center justify-center px-6 py-3 bg-gray-100 text-gray-900 font-semibold rounded-xl hover:bg-gray-200 transition-all duration-300"
                >
                  <Phone className="mr-2 h-4 w-4" />
                  (855) 816-4650
                </a>
              </div>
            </div>

            <div className="bg-white rounded-2xl shadow-2xl border border-gray-200 p-8">
              <div className="mb-6 flex items-center justify-between">
                <h3 className="text-xl font-bold text-gray-900">Application Form</h3>
                <a
                  href="https://www.cognitoforms.com/f/K4Fk3PtQHE-6M-fMiX2fVA/448"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white text-sm font-semibold rounded-lg hover:bg-blue-700 transition-all duration-300"
                >
                  <ArrowRight className="w-4 h-4" />
                  Open in New Window
                </a>
              </div>
              <iframe
                ref={iframeRef}
                src="https://www.cognitoforms.com/f/K4Fk3PtQHE-6M-fMiX2fVA/448"
                allow="payment"
                style={{ border: '0', width: '100%', overflow: 'hidden', minHeight: '600px' }}
                title="Application Form"
                onError={() => {
                  console.error('Iframe failed to load');
                }}
              />
              <div className="mt-4 p-4 bg-blue-50 border border-blue-200 rounded-lg">
                <p className="text-sm text-gray-700">
                  <strong>Having trouble viewing the form?</strong> Click the "Open in New Window" button above to access it directly.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {events.length > 0 && (
        <section className="py-24 bg-gradient-to-b from-gray-50 to-white">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-16">
              <Badge className="mb-4 bg-orange-100 text-orange-700 border-0">
                Latest Events
              </Badge>
              <h2 className="text-4xl lg:text-5xl font-bold text-gray-900 mb-4">
                Join Us at Upcoming Events
              </h2>
              <p className="text-xl text-gray-600 max-w-3xl mx-auto">
                Connect with fellow advisors and learn from industry leaders
              </p>
            </div>

            <div className="grid md:grid-cols-3 gap-8">
              {events.map((event) => {
                const formattedDate = new Date(event.published_date).toLocaleDateString('en-US', {
                  year: 'numeric',
                  month: 'short',
                  day: 'numeric'
                });
                const imageUrl = event.featured_image_url.startsWith('/')
                  ? event.featured_image_url
                  : `/${event.featured_image_url}`;

                return (
                  <Card key={event.id} className="overflow-hidden hover:shadow-2xl transition-all duration-300 hover:-translate-y-1 border-0">
                    <a href={`/events/${event.slug}`} className="block relative group">
                      <div className="relative overflow-hidden">
                        <img
                          src={imageUrl}
                          alt={event.title}
                          className="w-full h-56 object-cover transition-transform duration-500 group-hover:scale-110"
                          style={imageUrl.includes('womenHealth.jpg') ? { objectPosition: 'center 0px' } : undefined}
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-gray-900/60 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                      </div>
                    </a>
                    <CardContent className="p-6">
                      <div className="flex items-center gap-2 mb-3">
                        <Badge variant="outline" className="text-xs">
                          {event.category}
                        </Badge>
                        <span className="text-sm text-gray-500">{formattedDate}</span>
                      </div>
                      <a href={`/events/${event.slug}`}>
                        <h3 className="text-xl font-bold text-gray-900 mb-2 hover:text-blue-600 transition-colors line-clamp-2">
                          {event.title}
                        </h3>
                      </a>
                      <p className="text-gray-600 line-clamp-3">
                        {event.excerpt}
                      </p>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          </div>
        </section>
      )}

      <section className="py-24 bg-white">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <Badge className="mb-4 bg-violet-100 text-violet-700 border-0">
              FAQ
            </Badge>
            <h2 className="text-4xl lg:text-5xl font-bold text-gray-900 mb-4">
              Frequently Asked Questions
            </h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              Get answers to common questions about joining our team
            </p>
          </div>

          <div className="grid lg:grid-cols-2 gap-12 items-start">
            <div className="relative order-2 lg:order-1">
              <div className="absolute inset-0 bg-gradient-to-br from-blue-400/20 to-cyan-400/20 rounded-3xl transform rotate-3" />
              <div className="relative rounded-3xl overflow-hidden shadow-2xl">
                <img
                  src="/assets/mpbhealthteam.jpg"
                  alt="MPB Health Team"
                  className="w-full h-full object-cover"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-blue-900/40 to-transparent" />
              </div>
            </div>

            <div className="order-1 lg:order-2">
              <div className="bg-gray-50 rounded-3xl border border-gray-200 p-8">
                <Accordion type="single">
                  {faqItems.map((faq, index) => (
                    <AccordionItem key={index} value={`faq-${index}`}>
                      <AccordionTrigger>
                        <span className="text-left font-bold text-gray-900 text-lg">
                          {faq.question}
                        </span>
                      </AccordionTrigger>
                      <AccordionContent>
                        <p className="text-gray-700 leading-relaxed text-base">
                          {faq.answer}
                        </p>
                      </AccordionContent>
                    </AccordionItem>
                  ))}
                </Accordion>
              </div>
            </div>
          </div>
        </div>
      </section>
    </>
  );
};

export { JoinOurTeam };
export default JoinOurTeam;
