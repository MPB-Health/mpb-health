import { createClientLogger } from '@mpbhealth/utils';
import { supabase } from '../lib/supabase';

const log = createClientLogger('MigrateArticles');

const existingArticles = [
  {
    title: 'Amid Rising Costs and ACA Changes, MPB Health Brings a Practical, Affordable Alternative for Healthcare Expenses',
    slug: 'practical-affordable-alternative-for-healthcare-expenses',
    excerpt: 'Year-round enrollment, $0 preventive care, HSA-compatible options, and concierge advocacy help households bypass subsidy confusion and paperwork. Families and individuals seeking affordable healthcare solutions are turning to MPB Health as a practical alternative.',
    content: `<p>Year-round enrollment, $0 preventive care, HSA-compatible options, and concierge advocacy help households bypass subsidy confusion and paperwork.</p>
<p>Families and individuals seeking affordable healthcare solutions are turning to MPB Health as a practical alternative to traditional insurance. With rising costs and recent ACA changes creating confusion, MPB Health provides a straightforward approach to managing healthcare expenses.</p>
<h2>Key Benefits</h2>
<ul>
<li>Year-round enrollment with no waiting periods</li>
<li>$0 preventive care services</li>
<li>HSA-compatible options</li>
<li>Dedicated concierge advocacy support</li>
<li>Transparent pricing structure</li>
</ul>
<p>As healthcare costs continue to rise, MPB Health stands ready to provide families with the affordable care they deserve.</p>`,
    featured_image_url: '/assets/close-up-paper-currencies-with-stethoscope-980x654.jpg',
    category: 'Healthcare',
    author: 'MPB Health',
    published_date: '2025-10-01T12:00:00Z',
    is_published: true,
  },
  {
    title: 'What the New ACA Bill Means for You, And Why MPB Health Might Be the Smartest Choice in 2025',
    slug: 'what-the-new-aca-bill-means-for-you',
    excerpt: 'With ACA changes raising costs and cutting access, MPB Health provides year-round enrollment, lower rates, and smarter care.',
    content: `<p>Recent changes to the Affordable Care Act have left many families wondering about their healthcare options. Understanding these changes is crucial for making informed decisions about your family's healthcare coverage.</p>
<h2>What's Changed</h2>
<p>The new ACA bill has introduced several modifications that affect coverage options, costs, and eligibility requirements. These changes have created both challenges and opportunities for families seeking affordable healthcare.</p>
<h2>Why MPB Health Stands Out</h2>
<ul>
<li>Year-round enrollment flexibility</li>
<li>Competitive monthly rates</li>
<li>Personalized care coordination</li>
<li>No network restrictions</li>
<li>Immediate coverage activation</li>
</ul>
<p>MPB Health offers a refreshing alternative to traditional healthcare plans, combining affordability with comprehensive support.</p>`,
    featured_image_url: '/assets/Untitled-design-2-1-980x980.jpg',
    category: 'Healthcare',
    author: 'MPB Health',
    published_date: '2025-09-20T12:00:00Z',
    is_published: true,
  },
  {
    title: 'The New Standard of Care: How MPB Health Is Reimagining Access, Experience, and Value',
    slug: 'the-new-standard-of-care-mpb-health',
    excerpt: 'Modern healthcare does not just need to cost less—it needs to work better. At MPB Health, we are building a member-first model that blends virtual care, transparent costs, concierge support, and community-based medical cost sharing to help people get care sooner.',
    content: `<p>Modern healthcare doesn't just need to cost less—it needs to work better. At MPB Health, we're building a member-first model that transforms how people access and experience healthcare.</p>
<h2>Our Approach</h2>
<p>We blend virtual care, transparent costs, concierge support, and community-based medical cost sharing to help people get care sooner and more affordably.</p>
<h3>Virtual Care Integration</h3>
<p>Access healthcare professionals from the comfort of your home, reducing wait times and increasing convenience.</p>
<h3>Transparent Pricing</h3>
<p>No hidden fees or surprise bills. Know exactly what you'll pay before receiving care.</p>
<h3>Concierge Support</h3>
<p>Dedicated advisors guide you through every step of your healthcare journey.</p>
<p>This is the future of healthcare—and it's available today through MPB Health.</p>`,
    featured_image_url: '/assets/newsletter-blog-images-17.jpg',
    category: 'Healthcare',
    author: 'MPB Health',
    published_date: '2025-09-18T12:00:00Z',
    is_published: true,
  },
  {
    title: 'Rewriting Your Heart Story: How Epigenetics Puts You Back in Control',
    slug: 'epigenetics-heart-health',
    excerpt: "When Maria's father passed away from a heart attack at just 58, she carried the weight of genetics. But modern science shows that your genes don't have to be your destiny.",
    content: `<p>When Maria's father passed away from a heart attack at just 58, she carried the weight of genetics. Like many people with family histories of heart disease, she felt trapped by her DNA.</p>
<p>But modern science tells a different story—one where your genes don't have to be your destiny.</p>
<h2>Understanding Epigenetics</h2>
<p>Epigenetics is the study of how your behaviors and environment can cause changes that affect the way your genes work. Unlike genetic changes, epigenetic changes are reversible and don't change your DNA sequence.</p>
<h3>What You Can Control</h3>
<ul>
<li>Diet and nutrition choices</li>
<li>Exercise and physical activity</li>
<li>Stress management</li>
<li>Sleep quality</li>
<li>Environmental exposures</li>
</ul>
<h2>Taking Action</h2>
<p>The good news is that lifestyle modifications can significantly impact your heart health, regardless of your genetic predisposition. Small, consistent changes add up to major health improvements over time.</p>
<p>You have more control over your heart health than you think. The key is taking action today.</p>`,
    featured_image_url: '/assets/newsletter-blog-images-14.png',
    category: 'Healthcare',
    author: 'MPB Health',
    published_date: '2025-09-08T12:00:00Z',
    is_published: true,
  },
  {
    title: 'Turning the Tide on Childhood Obesity',
    slug: 'turning-the-tide-on-childhood-obesity',
    excerpt: 'Building healthy habits for kids through nutrition and fitness strategies that work for the whole family.',
    content: `<p>Childhood obesity is a growing concern affecting millions of families. But with the right approach, you can help your children develop healthy habits that last a lifetime.</p>
<h2>The Challenge</h2>
<p>Today's children face unique challenges: sedentary lifestyles, processed foods, and screen time that far exceeds previous generations. But small changes can make a big difference.</p>
<h2>Practical Strategies</h2>
<h3>Nutrition That Works</h3>
<ul>
<li>Make healthy foods fun and accessible</li>
<li>Involve kids in meal planning and preparation</li>
<li>Focus on adding nutrients, not restricting foods</li>
<li>Lead by example with your own eating habits</li>
</ul>
<h3>Active Lifestyle</h3>
<ul>
<li>Make physical activity a family affair</li>
<li>Limit screen time and encourage outdoor play</li>
<li>Find activities your children genuinely enjoy</li>
<li>Celebrate movement, not just sports</li>
</ul>
<p>Remember, the goal isn't perfection—it's progress. Small, sustainable changes create lasting results.</p>`,
    featured_image_url: '/assets/newsletter-blog-images-7.jpg',
    category: 'Fitness',
    author: 'MPB Health',
    published_date: '2025-09-08T12:00:00Z',
    is_published: true,
  },
  {
    title: 'Longevity Medicine: The Future of Healthy Aging Starts Now',
    slug: 'longevity-medicine-the-future-of-healthy-aging-starts-now',
    excerpt: 'Explore the cutting-edge of preventive medicine and healthy aging strategies that can add years to your life—and life to your years.',
    content: `<p>Longevity medicine represents a paradigm shift in healthcare—from treating disease to optimizing health and extending healthspan, not just lifespan.</p>
<h2>What Is Longevity Medicine?</h2>
<p>Longevity medicine focuses on preventing age-related diseases before they start, using advanced diagnostics and personalized interventions to help you live longer and better.</p>
<h2>Key Components</h2>
<h3>Preventive Testing</h3>
<p>Advanced biomarker analysis, genetic testing, and comprehensive health assessments provide early detection and intervention opportunities.</p>
<h3>Lifestyle Optimization</h3>
<ul>
<li>Personalized nutrition plans</li>
<li>Targeted exercise programs</li>
<li>Sleep optimization</li>
<li>Stress management techniques</li>
</ul>
<h3>Cutting-Edge Interventions</h3>
<p>From hormone optimization to cellular therapy, longevity medicine leverages the latest scientific advances to promote healthy aging.</p>
<h2>Starting Your Journey</h2>
<p>You don't need to wait for disease to strike. The best time to invest in your longevity is now.</p>`,
    featured_image_url: '/assets/newsletter-blog-images-5.jpg',
    category: 'Healthcare',
    author: 'MPB Health',
    published_date: '2025-09-05T12:00:00Z',
    is_published: true,
  },
  {
    title: 'Why Millennials and Gen Z Prefer Flexible Healthcare Options',
    slug: 'why-millennials-and-gen-z-prefer-flexible-healthcare-options',
    excerpt: 'Understanding the healthcare needs and preferences of younger generations seeking alternatives to traditional insurance.',
    content: `<p>Millennials and Gen Z are reshaping healthcare expectations, demanding flexibility, transparency, and value that traditional insurance often fails to deliver.</p>
<h2>What Younger Generations Want</h2>
<h3>Flexibility</h3>
<p>The ability to choose providers, change plans without waiting periods, and customize coverage to fit their lifestyle.</p>
<h3>Transparency</h3>
<p>Clear pricing, straightforward policies, and no surprise bills or hidden fees.</p>
<h3>Technology Integration</h3>
<p>Digital-first solutions, telemedicine options, and mobile-friendly platforms that fit their connected lifestyle.</p>
<h3>Value Over Coverage</h3>
<p>Younger generations prioritize practical value over extensive coverage they rarely use.</p>
<h2>The MPB Health Advantage</h2>
<p>MPB Health meets these needs with year-round enrollment, transparent pricing, virtual care options, and a mobile-first approach to healthcare management.</p>
<p>We're not just meeting expectations—we're exceeding them.</p>`,
    featured_image_url: '/assets/newsletter-blog-images-8.avif',
    category: 'Healthcare',
    author: 'MPB Health',
    published_date: '2025-08-29T12:00:00Z',
    is_published: true,
  },
  {
    title: 'Pet Telehealth: Because Pets Are Family Too',
    slug: 'pet-telehealth-because-pets-are-family-too',
    excerpt: 'Virtual veterinary care for your furry family members—convenient, affordable, and comprehensive.',
    content: `<p>Your pets deserve quality healthcare too. Pet telehealth brings veterinary expertise directly to your home, making pet care more accessible and affordable than ever.</p>
<h2>How Pet Telehealth Works</h2>
<p>Connect with licensed veterinarians via video chat to discuss your pet's health concerns, get professional advice, and determine if an in-person visit is necessary.</p>
<h2>When to Use Pet Telehealth</h2>
<ul>
<li>Behavioral concerns</li>
<li>Minor injuries or skin conditions</li>
<li>Medication follow-ups</li>
<li>Nutrition and diet questions</li>
<li>Chronic condition management</li>
</ul>
<h2>Benefits</h2>
<h3>Convenience</h3>
<p>No more stressful car rides or waiting rooms. Get care from the comfort of home.</p>
<h3>Affordability</h3>
<p>Virtual consultations typically cost less than in-person visits.</p>
<h3>Quick Access</h3>
<p>Get expert advice when you need it, often with same-day appointments.</p>
<p>Because pets are family too, and they deserve the best care possible.</p>`,
    featured_image_url: '/assets/ChatGPT-Image-Aug-29-2025-02_18_36-PM-980x653.jpg',
    category: 'Healthcare',
    author: 'MPB Health',
    published_date: '2025-08-29T12:00:00Z',
    is_published: true,
  },
  {
    title: 'How MEC Works with Health Sharing for Better Care',
    slug: 'how-mec-works-with-health-sharing-for-better-care',
    excerpt: 'Understanding Minimum Essential Coverage and how it complements health sharing programs.',
    content: `<p>Minimum Essential Coverage (MEC) and health sharing can work together to provide comprehensive, affordable healthcare solutions.</p>
<h2>What Is MEC?</h2>
<p>MEC is a type of health coverage that meets basic standards under the Affordable Care Act, typically covering preventive care at no cost to you.</p>
<h2>How Health Sharing Complements MEC</h2>
<p>While MEC covers preventive care, health sharing programs help with larger medical expenses through community-based cost sharing.</p>
<h3>Together They Provide</h3>
<ul>
<li>Comprehensive preventive care coverage</li>
<li>Support for major medical expenses</li>
<li>Affordable monthly contributions</li>
<li>Flexibility in provider choice</li>
</ul>
<h2>The MPB Health Approach</h2>
<p>MPB Health combines the best of both worlds, offering MEC options alongside our health sharing programs to ensure comprehensive coverage at an affordable price.</p>`,
    featured_image_url: '/assets/myth-fact-concept-opposite-directions-signpost-with-sky-background-980x670.jpg',
    category: 'Medical Cost Sharing',
    author: 'MPB Health',
    published_date: '2025-08-25T12:00:00Z',
    is_published: true,
  },
  {
    title: 'Medical Cost Sharing Myths Debunked: What You Really Need to Know',
    slug: 'medical-cost-sharing-myths-debunked',
    excerpt: 'Separating fact from fiction about medical cost sharing to help you make informed decisions.',
    content: `<p>Medical cost sharing is often misunderstood. Let's clear up common misconceptions and reveal the truth about this affordable healthcare alternative.</p>
<h2>Myth #1: It's Not Real Coverage</h2>
<p><strong>Reality:</strong> Medical cost sharing provides real financial support for medical expenses through community-based sharing. Members help each other with eligible medical bills.</p>
<h2>Myth #2: Pre-Membership Conditions Are Never Covered</h2>
<p><strong>Reality:</strong> While there are typically waiting periods, many medical cost sharing programs do eventually share costs for pre-membership conditions.</p>
<h2>Myth #3: You Can't Choose Your Doctor</h2>
<p><strong>Reality:</strong> Most medical cost sharing programs allow you to see any provider. There are no network restrictions.</p>
<h2>Myth #4: It's Too Complicated</h2>
<p><strong>Reality:</strong> With dedicated support teams like those at MPB Health, the process is straightforward and simple.</p>
<h2>The Truth About Medical Cost Sharing</h2>
<p>Medical cost sharing offers legitimate, affordable healthcare solutions for millions of Americans. Understanding how it works empowers you to make the best choice for your family.</p>`,
    featured_image_url: '/assets/newsletter-blog-images-4.jpg',
    category: 'Medical Cost Sharing',
    author: 'MPB Health',
    published_date: '2025-08-25T12:00:00Z',
    is_published: true,
  },
  {
    title: "Leaving Your Parents' Health Insurance? Here's a Smarter Option",
    slug: 'leaving-parents-health-insurance',
    excerpt: 'Healthcare options for young adults aging out of parents\' coverage at 26.',
    content: `<p>Turning 26 is a milestone that comes with a healthcare decision: what coverage do you choose when you age out of your parents' plan?</p>
<h2>Your Options</h2>
<h3>Employer Coverage</h3>
<p>If available, employer-sponsored insurance is often a good choice. But what if you're self-employed, between jobs, or your employer doesn't offer benefits?</p>
<h3>ACA Marketplace</h3>
<p>Marketplace plans offer comprehensive coverage but can be expensive, especially if you don't qualify for subsidies.</p>
<h3>Medical Cost Sharing</h3>
<p>An affordable alternative that provides financial support for medical expenses without the high monthly premiums.</p>
<h2>Why Young Adults Choose MPB Health</h2>
<ul>
<li>Affordable monthly contributions</li>
<li>No waiting periods or open enrollment restrictions</li>
<li>Virtual care and telehealth access</li>
<li>Nationwide provider flexibility</li>
<li>Simple, straightforward process</li>
</ul>
<p>Don't let turning 26 be stressful. MPB Health makes the transition easy and affordable.</p>`,
    featured_image_url: '/assets/newsletter-blog-images-6.avif',
    category: 'Healthcare',
    author: 'MPB Health',
    published_date: '2025-08-25T12:00:00Z',
    is_published: true,
  },
  {
    title: 'The History of Health Sharing',
    slug: 'the-history-of-health-sharing',
    excerpt: 'Exploring the roots and evolution of health sharing in America—from faith-based communities to modern solutions.',
    content: `<p>Health sharing has deep roots in American history, originating from faith-based communities that came together to help members with medical expenses.</p>
<h2>Early Beginnings</h2>
<p>In the early 1900s, faith-based communities established mutual aid societies where members pooled resources to help those facing medical hardships.</p>
<h2>Modern Evolution</h2>
<p>Today's health sharing programs have evolved to serve diverse populations, maintaining the core principle of community support while adapting to modern healthcare needs.</p>
<h3>Key Developments</h3>
<ul>
<li>1980s: First formal health sharing organizations established</li>
<li>2010: ACA recognizes health sharing as an alternative to traditional insurance</li>
<li>2020s: Technology enables streamlined, accessible health sharing programs</li>
</ul>
<h2>Health Sharing Today</h2>
<p>Modern programs like MPB Health combine traditional community values with cutting-edge technology, providing affordable healthcare solutions for all Americans.</p>
<h2>The Future</h2>
<p>As healthcare costs continue rising, health sharing represents a sustainable, community-focused alternative that puts people first.</p>`,
    featured_image_url: '/assets/newsletter-blog-images-2.jpg',
    category: 'Medical Cost Sharing',
    author: 'MPB Health',
    published_date: '2025-08-20T12:00:00Z',
    is_published: true,
  },
];

export async function migrateArticles() {
  log.info('Starting article migration...');

  try {
    for (const article of existingArticles) {
      log.info(`Migrating: ${article.title}`);

      const { data: existing } = await supabase
        .from('blog_articles')
        .select('id')
        .eq('slug', article.slug)
        .maybeSingle();

      if (existing) {
        log.info(`  ↳ Already exists, skipping...`);
        continue;
      }

      const { error } = await supabase.from('blog_articles').insert([article]);

      if (error) {
        console.error(`  ↳ Error: ${error.message}`);
      } else {
        log.info(`  ↳ Successfully migrated`);
      }
    }

    log.info('\nMigration complete!');
    log.info(`Total articles: ${existingArticles.length}`);
  } catch (error) {
    console.error('Migration failed:', error);
  }
}
