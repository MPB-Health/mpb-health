import React, { useState } from 'react';
import { Star, Quote, ChevronLeft, ChevronRight, Play, MapPin, Users, Heart, TrendingUp, Award, ArrowRight } from 'lucide-react';

interface Testimonial {
  id: number;
  name: string;
  location: string;
  familySize: string;
  memberSince: string;
  rating: number;
  quote: string;
  story: string;
  savings: string;
  videoUrl?: string;
  imageUrl?: string;
  condition?: string;
}

const TestimonialShowcase: React.FC = () => {
  const [activeTestimonial, setActiveTestimonial] = useState(0);
  const [showVideo, setShowVideo] = useState(false);

  const testimonials: Testimonial[] = [
    {
      id: 1,
      name: "Patrick Dittoe",
      location: "United States",
      familySize: "Member",
      memberSince: "2024",
      rating: 5,
      quote: "Adam at concierge services is my hero. He ended an hour of frustration trying to get Dr. visits scheduled. He was patient and informative.",
      story: "I was struggling for over an hour trying to get my doctor visits scheduled through the usual channels. It was frustrating and I wasn't getting anywhere. Then I reached out to MPB Health's concierge services and Adam took over. He was incredibly patient, walked me through everything, and got my appointments scheduled quickly. The level of personal attention and care I received was unlike anything I've experienced with traditional insurance. Having someone like Adam in my corner makes all the difference.",
      savings: "$2,500",
      condition: "Concierge Excellence",
      imageUrl: "https://images.pexels.com/photos/5668859/pexels-photo-5668859.jpeg?auto=compress&cs=tinysrgb&w=1260&h=750&dpr=2"
    },
    {
      id: 2,
      name: "Ryan Donovan",
      location: "United States",
      familySize: "Member",
      memberSince: "2024",
      rating: 5,
      quote: "MPB have been rockstars all the way around. Getting set up was easy, payment was prompt and customer service has been excellent through and through. There is a learning curve coming from traditional insurance but they've been with me the whole way to make it easy and they've made sure I get what I'm looking for. Can't recommend highly enough.",
      story: "Switching from traditional insurance to health sharing was a big decision for me. I had questions and concerns about how everything would work. From day one, MPB Health has been incredible. The setup process was straightforward, payments have been prompt, and whenever I've had questions—and there have been many as I learned the ropes—the customer service team has been there every step of the way. They've made what could have been a confusing transition completely smooth. I'm saving money and getting better service than I ever did with my old insurance. I can't recommend them highly enough.",
      savings: "$3,600",
      condition: "Customer Service Excellence",
      imageUrl: "https://images.pexels.com/photos/3184339/pexels-photo-3184339.jpeg?auto=compress&cs=tinysrgb&w=1260&h=750&dpr=2"
    },
    {
      id: 3,
      name: "Sarah & Michael Johnson",
      location: "Austin, TX",
      familySize: "Family of 4",
      memberSince: "2021",
      rating: 5,
      quote: "MPB Health literally saved our family. When our daughter needed emergency surgery, we thought we'd be buried in debt. The community stepped up and shared over $42,000 in medical bills.",
      story: "Before joining MPB Health, we were paying $1,200/month for insurance with a $10,000 deductible. We never went to the doctor because we couldn't afford it. Now we pay $445/month and actually USE healthcare when we need it. Last year we saved over $10,000 compared to our old plan, and we have peace of mind knowing our community has our back.",
      savings: "$10,200",
      condition: "Emergency Surgery",
      videoUrl: "/assets/testimonial-johnson.mp4",
      imageUrl: "https://images.pexels.com/photos/3184325/pexels-photo-3184325.jpeg?auto=compress&cs=tinysrgb&w=1260&h=750&dpr=2"
    },
    {
      id: 4,
      name: "Marcus Williams",
      location: "Phoenix, AZ",
      familySize: "Individual",
      memberSince: "2022",
      rating: 5,
      quote: "As a self-employed contractor, I couldn't afford the $650/month insurance premiums. MPB Health gave me quality healthcare for $149/month. I finally got the knee surgery I needed.",
      story: "I'd been putting off knee surgery for three years because I couldn't afford insurance. With MPB Health, not only did I save $500/month, but I was able to choose my own orthopedic surgeon without network restrictions. The surgery was successful, and $18,600 of the $21,000 bill was shared by the community. I'm back to work and pain-free for the first time in years.",
      savings: "$6,012",
      condition: "Knee Surgery",
      imageUrl: "https://images.pexels.com/photos/7446997/pexels-photo-7446997.jpeg?auto=compress&cs=tinysrgb&w=1260&h=750&dpr=2"
    },
    {
      id: 5,
      name: "The Rodriguez Family",
      location: "Miami, FL",
      familySize: "Family of 5",
      memberSince: "2020",
      rating: 5,
      quote: "We welcomed our third child through MPB Health's maternity program. The support we received from our advisor and the community was incredible. No network restrictions meant we kept our trusted OB-GYN.",
      story: "When we found out we were expecting our third child, we were stressed about the cost. Our previous insurance had limited maternity membership and high out-of-pocket costs. With MPB Health, we paid predictable monthly amounts and our $15,000 delivery bill was completely shared. Plus, we had access to 24/7 telemedicine throughout the pregnancy, which was a lifesaver during those late-night worries.",
      savings: "$8,400",
      condition: "Maternity Care",
      imageUrl: "https://images.pexels.com/photos/1556652/pexels-photo-1556652.jpeg?auto=compress&cs=tinysrgb&w=1260&h=750&dpr=2"
    },
    {
      id: 6,
      name: "Jennifer Chen",
      location: "Nashville, TN",
      familySize: "Family of 3",
      memberSince: "2019",
      rating: 5,
      quote: "As a small business owner, I needed affordable healthcare for my family without sacrificing quality. MPB Health delivered on both counts. Five years strong and we've never looked back.",
      story: "Running a small business means every dollar counts. The $900/month we were paying for family coverage was crushing our budget. Switching to MPB Health cut our costs by more than half, and we actually have BETTER membership. No networks means we kept all our doctors. When my husband needed cancer treatment last year, the community shared over $75,000 in medical bills. The personal support from our advisor during that difficult time was invaluable.",
      savings: "$32,400",
      condition: "Cancer Treatment",
      imageUrl: "https://images.pexels.com/photos/7579831/pexels-photo-7579831.jpeg?auto=compress&cs=tinysrgb&w=1260&h=750&dpr=2"
    },
    {
      id: 7,
      name: "Robert & Linda Thompson",
      location: "Denver, CO",
      familySize: "Couple (Pre-Medicare)",
      memberSince: "2021",
      rating: 5,
      quote: "At 60 and 62, we were paying outrageous insurance premiums. MPB Health gave us comprehensive membership at a fraction of the cost while we wait for Medicare eligibility.",
      story: "Pre-Medicare couples pay some of the highest insurance premiums. We were quoted $2,100/month for basic membership with huge deductibles. MPB Health costs us $289/month with actual membership we can use. Last year, I had a heart procedure that would have cost us $35,000 out-of-pocket with our old insurance. With MPB Health, the community shared the eligible expenses, and we paid our IUA. We're saving over $21,000 per year!",
      savings: "$21,732",
      condition: "Cardiac Care",
      imageUrl: "https://images.pexels.com/photos/7551662/pexels-photo-7551662.jpeg?auto=compress&cs=tinysrgb&w=1260&h=750&dpr=2"
    },
    {
      id: 8,
      name: "Katie Burke",
      location: "Charlotte, NC",
      familySize: "Individual",
      memberSince: "2024",
      rating: 5,
      quote: "I didn't know things could ever be this easy! Angie and Adam, thank you for such a pleasant experience today. They both clearly communicated and provided the assistance I needed quickly and efficiently. MPB is a refreshing change from our old BCBS coverage!",
      story: "After years of dealing with Blue Cross Blue Shield, I was skeptical that any healthcare option could be simple and stress-free. MPB Health proved me wrong from day one. Angie and Adam made the entire process seamless—they answered all my questions, explained everything clearly, and got me set up quickly. The level of personal care and communication is something I never experienced with traditional insurance. I'm so glad I made the switch!",
      savings: "$2,400",
      condition: "Customer Service Excellence",
      imageUrl: "https://images.pexels.com/photos/3807517/pexels-photo-3807517.jpeg?auto=compress&cs=tinysrgb&w=1260&h=750&dpr=2"
    },
    {
      id: 9,
      name: "Charlotte Cadieux",
      location: "Portland, OR",
      familySize: "Individual",
      memberSince: "2024",
      rating: 5,
      quote: "I've cried tears of joy over how functional this system is. By far the easiest, most transparent and affordable coverage I've experienced. As an independent contractor MPB's individual plan beats anything the marketplace ever had to offer.",
      story: "As an independent contractor, I spent years struggling with the marketplace options—confusing plans, high premiums, and coverage that never seemed to work when I needed it. MPB Health changed everything. The concierge service is extremely helpful and patient, walking me through every step. The coverage actually does what it's supposed to do. For the first time, I feel like I have real healthcare protection without breaking the bank. I literally cried tears of joy when I realized how well this system works. Highly recommend to any self-employed person!",
      savings: "$4,800",
      condition: "Independent Contractor",
      imageUrl: "https://images.pexels.com/photos/3756679/pexels-photo-3756679.jpeg?auto=compress&cs=tinysrgb&w=1260&h=750&dpr=2"
    },
    {
      id: 10,
      name: "Gina Corsini Mattern",
      location: "San Diego, CA",
      familySize: "Individual",
      memberSince: "2024",
      rating: 5,
      quote: "I greatly appreciate Christine introducing me to MPB Health Share Plan. I have been very happy with the coverage. Christine did an excellent job explaining the plan and coverage.",
      story: "When Christine first told me about MPB Health, I was curious but cautious. She took the time to explain everything thoroughly—the plan details, the coverage, how the sharing process works. Her patience and knowledge made all the difference. Since joining, I've been very happy with my coverage, and whenever questions come up, Christine has always been available to help. It's rare to find this level of personal support in healthcare today.",
      savings: "$2,100",
      condition: "Advisor Excellence",
      imageUrl: "https://images.pexels.com/photos/3768114/pexels-photo-3768114.jpeg?auto=compress&cs=tinysrgb&w=1260&h=750&dpr=2"
    },
    {
      id: 11,
      name: "Laura Pascoe",
      location: "Seattle, WA",
      familySize: "Individual",
      memberSince: "2024",
      rating: 5,
      quote: "My experience with MPB has been consistently positive. They have been responsive, kind, and genuinely compassionate in all of my interactions. In a healthcare landscape where it's easy to feel like just a number, MPB stands out by making me feel heard, respected, and human.",
      story: "In today's healthcare system, it's so easy to feel like just another number. MPB Health has been completely different. Every interaction I've had has been marked by responsiveness, kindness, and genuine compassion. They make me feel heard, respected, and human. While I haven't yet submitted a sharing request, the quality of communication and care I've experienced gives me complete confidence in this community. MPB has been a refreshing and reassuring presence in an otherwise complex and often impersonal healthcare landscape.",
      savings: "$3,200",
      condition: "Compassionate Care",
      imageUrl: "https://images.pexels.com/photos/3771045/pexels-photo-3771045.jpeg?auto=compress&cs=tinysrgb&w=1260&h=750&dpr=2"
    }
  ];

  const current = testimonials[activeTestimonial];

  const nextTestimonial = () => {
    setActiveTestimonial((prev) => (prev + 1) % testimonials.length);
    setShowVideo(false);
  };

  const prevTestimonial = () => {
    setActiveTestimonial((prev) => (prev - 1 + testimonials.length) % testimonials.length);
    setShowVideo(false);
  };

  return (
    <>
      {/* Featured testimonial carousel */}
      <section className="hiw-section" aria-label="Member testimonials">
        <div className="hiw-inner">
          <div className="ms-feature">
            <div className="ms-feature__media">
              {showVideo && current.videoUrl ? (
                <video controls autoPlay playsInline>
                  <source src={current.videoUrl} type="video/mp4" />
                </video>
              ) : (
                <>
                  <img src={current.imageUrl} alt={current.name} loading="lazy" decoding="async" />
                  <div className="ms-feature__scrim" />

                  {current.videoUrl && (
                    <button
                      type="button"
                      onClick={() => setShowVideo(true)}
                      className="ms-feature__play"
                      aria-label={`Play ${current.name} video`}
                    >
                      <span className="ms-feature__play-circle">
                        <Play aria-hidden="true" />
                      </span>
                    </button>
                  )}

                  <div className="ms-feature__caption">
                    <div className="ms-feature__stars" aria-label={`${current.rating} out of 5 stars`}>
                      {[...Array(current.rating)].map((_, i) => (
                        <Star key={i} aria-hidden="true" />
                      ))}
                    </div>
                    <h3 className="ms-feature__name">{current.name}</h3>
                    <div className="ms-feature__badges">
                      <span className="ms-badge--glass">
                        <MapPin aria-hidden="true" />
                        {current.location}
                      </span>
                      <span className="ms-badge--glass">
                        <Users aria-hidden="true" />
                        {current.familySize}
                      </span>
                      <span className="ms-badge--glass">
                        <Award aria-hidden="true" />
                        Since {current.memberSince}
                      </span>
                    </div>
                  </div>
                </>
              )}
            </div>

            <div className="ms-feature__body">
              <div className="ms-feature__tags">
                <span className="ms-badge--savings">{current.savings} Saved</span>
                {current.condition && <span className="ms-badge--topic">{current.condition}</span>}
              </div>

              <div className="ms-feature__quote-wrap">
                <Quote className="ms-feature__quote-icon" aria-hidden="true" />
                <p className="ms-feature__quote">"{current.quote}"</p>
              </div>

              <h4 className="ms-feature__story-title">
                <span className="ms-feature__story-icon">
                  <Heart aria-hidden="true" />
                </span>
                Their Story
              </h4>
              <p className="ms-feature__story">{current.story}</p>

              <div className="ms-feature__nav">
                <button type="button" onClick={prevTestimonial} className="ms-feature__btn">
                  <ChevronLeft aria-hidden="true" />
                  <span>Previous</span>
                </button>

                <div className="ms-feature__dots">
                  {testimonials.map((_, index) => (
                    <button
                      key={index}
                      type="button"
                      onClick={() => {
                        setActiveTestimonial(index);
                        setShowVideo(false);
                      }}
                      className={`ms-feature__dot${index === activeTestimonial ? ' ms-feature__dot--active' : ''}`}
                      aria-label={`Go to testimonial ${index + 1}`}
                    />
                  ))}
                </div>

                <button type="button" onClick={nextTestimonial} className="ms-feature__btn">
                  <span>Next</span>
                  <ChevronRight aria-hidden="true" />
                </button>
              </div>
            </div>
          </div>

          {/* Stats trio */}
          <div className="ms-stats-grid">
            <div className="ms-stat-card">
              <div className="ms-stat-card__icon">
                <Star aria-hidden="true" style={{ fill: 'currentColor' }} />
              </div>
              <div className="ms-stat-card__value">4.9/5</div>
              <div className="ms-stat-card__caption">Average Member Rating</div>
            </div>
            <div className="ms-stat-card">
              <div className="ms-stat-card__icon ms-stat-card__icon--green">
                <TrendingUp aria-hidden="true" />
              </div>
              <div className="ms-stat-card__value">$3,400</div>
              <div className="ms-stat-card__caption">Average Annual Savings</div>
            </div>
            <div className="ms-stat-card">
              <div className="ms-stat-card__icon">
                <Heart aria-hidden="true" style={{ fill: 'currentColor' }} />
              </div>
              <div className="ms-stat-card__value">12,000+</div>
              <div className="ms-stat-card__caption">Verified Reviews</div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="ms-cta" aria-label="Start your savings story">
        <div className="ms-cta__card">
          <h2 className="ms-cta__title">
            Join 50,000+ families already saving with MPB Health
          </h2>
          <div className="ms-cta__actions">
            <a href="/get-started" className="ms-cta__btn">
              Start Your Savings Story
              <ArrowRight aria-hidden="true" />
            </a>
          </div>
        </div>
      </section>
    </>
  );
};

export { TestimonialShowcase };
