import React, { useState } from 'react';
import { Star, Quote, ChevronLeft, ChevronRight, Play, MapPin, Users, Heart, TrendingUp, Award, ArrowRight } from 'lucide-react';
import { Badge } from '../ui/Badge';

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
      story: "In today's healthcare system, it's so easy to feel like just another number. MPB Health has been completely different. Every interaction I've had has been marked by responsiveness, kindness, and genuine compassion. They make me feel heard, respected, and human. While I haven't yet submitted a claim, the quality of communication and care I've experienced gives me complete confidence in this community. MPB has been a refreshing and reassuring presence in an otherwise complex and often impersonal healthcare landscape.",
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
      <section className="relative pt-20 pb-10 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-blue-50 to-cyan-50/50" />
        <div className="absolute inset-0 opacity-30">
          <img
            src="https://images.pexels.com/photos/3184325/pexels-photo-3184325.jpeg?auto=compress&cs=tinysrgb&w=1260&h=750&dpr=2"
            alt="Member Stories"
            className="w-full h-full object-cover"
          />
        </div>
        <div className="absolute inset-0 bg-gradient-to-r from-white/95 via-white/90 to-white/80" />

        <div className="relative mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
          <div className="max-w-2xl">
            <Badge className="mb-4 bg-blue-100 text-blue-700 border-0">
              <Heart className="w-3 h-3 mr-1" />
              Member Stories
            </Badge>

            <h1 className="text-4xl sm:text-5xl font-bold mb-4 text-gray-900 text-balance">
              Real Families. Real Savings.
            </h1>

            <p className="text-lg text-gray-600 mb-6 leading-relaxed">
              Hear directly from members whose lives have been changed by community health sharing.
            </p>

            <div className="inline-flex items-center gap-6 text-sm text-gray-600">
              <span className="flex items-center gap-1">
                <Star className="w-4 h-4 text-yellow-500 fill-current" />
                4.9/5 Rating
              </span>
              <span className="flex items-center gap-1">
                <TrendingUp className="w-4 h-4 text-green-600" />
                $3,400 Avg. Savings
              </span>
              <span className="flex items-center gap-1">
                <Users className="w-4 h-4 text-blue-600" />
                12K+ Members
              </span>
            </div>
          </div>
        </div>
      </section>

      <section className="py-24 bg-gradient-to-b from-white to-gray-50">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="bg-white rounded-3xl shadow-2xl overflow-hidden border border-gray-200 hover:shadow-3xl transition-all duration-500">
            <div className="grid lg:grid-cols-2">
              <div className="relative bg-gradient-to-br from-blue-100 to-cyan-100 lg:min-h-[700px]">
                {showVideo && current.videoUrl ? (
                  <video
                    className="absolute inset-0 w-full h-full object-cover"
                    controls
                    autoPlay
                    playsInline
                  >
                    <source src={current.videoUrl} type="video/mp4" />
                  </video>
                ) : (
                  <>
                    <img
                      src={current.imageUrl}
                      alt={current.name}
                      className="absolute inset-0 w-full h-full object-cover"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-gray-900/80 via-gray-900/40 to-transparent" />

                    {current.videoUrl && (
                      <button
                        onClick={() => setShowVideo(true)}
                        className="absolute inset-0 flex items-center justify-center group"
                      >
                        <div className="w-24 h-24 bg-white rounded-full flex items-center justify-center shadow-2xl group-hover:scale-110 transition-all duration-300">
                          <Play className="w-10 h-10 text-blue-600 ml-1" />
                        </div>
                      </button>
                    )}

                    <div className="absolute bottom-0 left-0 right-0 p-8 text-white">
                      <div className="flex items-center gap-1 mb-3">
                        {[...Array(current.rating)].map((_, i) => (
                          <Star key={i} className="w-5 h-5 fill-current text-yellow-400" />
                        ))}
                      </div>
                      <h3 className="text-3xl font-bold mb-3">{current.name}</h3>
                      <div className="flex flex-wrap items-center gap-4 text-sm">
                        <Badge className="bg-white/20 text-white border-white/30">
                          <MapPin className="w-3 h-3 mr-1" />
                          {current.location}
                        </Badge>
                        <Badge className="bg-white/20 text-white border-white/30">
                          <Users className="w-3 h-3 mr-1" />
                          {current.familySize}
                        </Badge>
                        <Badge className="bg-white/20 text-white border-white/30">
                          <Award className="w-3 h-3 mr-1" />
                          Since {current.memberSince}
                        </Badge>
                      </div>
                    </div>
                  </>
                )}
              </div>

              <div className="p-8 lg:p-12 flex flex-col">
                <div className="flex-1">
                  <div className="flex flex-wrap gap-3 mb-6">
                    <Badge className="bg-gradient-to-r from-green-500 to-emerald-500 text-white border-0 px-4 py-2 text-lg font-bold shadow-lg">
                      {current.savings} Saved
                    </Badge>
                    {current.condition && (
                      <Badge className="bg-blue-100 text-blue-700 border-blue-200 px-4 py-2">
                        {current.condition}
                      </Badge>
                    )}
                  </div>

                  <div className="relative mb-8">
                    <Quote className="absolute -top-4 -left-2 w-12 h-12 text-blue-200" />
                    <p className="text-2xl font-medium text-gray-900 leading-relaxed pl-8">
                      "{current.quote}"
                    </p>
                  </div>

                  <div className="mb-8">
                    <h4 className="text-xl font-bold text-gray-900 mb-4 flex items-center gap-2">
                      <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center">
                        <Heart className="w-4 h-4 text-blue-600" />
                      </div>
                      Their Story
                    </h4>
                    <p className="text-gray-700 leading-relaxed text-lg">
                      {current.story}
                    </p>
                  </div>
                </div>

                <div className="flex items-center justify-between pt-8 border-t border-gray-200">
                  <button
                    onClick={prevTestimonial}
                    className="flex items-center gap-2 px-6 py-3 bg-gray-100 hover:bg-gray-200 rounded-xl transition-all duration-300 font-medium group"
                  >
                    <ChevronLeft className="w-5 h-5 group-hover:-translate-x-1 transition-transform" />
                    <span>Previous</span>
                  </button>

                  <div className="flex items-center gap-2">
                    {testimonials.map((_, index) => (
                      <button
                        key={index}
                        onClick={() => {
                          setActiveTestimonial(index);
                          setShowVideo(false);
                        }}
                        className={`h-2 rounded-full transition-all duration-300 ${
                          index === activeTestimonial
                            ? 'bg-blue-600 w-8'
                            : 'bg-gray-300 hover:bg-gray-400 w-2'
                        }`}
                        aria-label={`Go to testimonial ${index + 1}`}
                      />
                    ))}
                  </div>

                  <button
                    onClick={nextTestimonial}
                    className="flex items-center gap-2 px-6 py-3 bg-gray-100 hover:bg-gray-200 rounded-xl transition-all duration-300 font-medium group"
                  >
                    <span>Next</span>
                    <ChevronRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                  </button>
                </div>
              </div>
            </div>
          </div>

          <div className="grid md:grid-cols-3 gap-8 mt-16">
            <div className="bg-gradient-to-br from-blue-50 to-cyan-50 rounded-3xl p-8 text-center border border-blue-200 hover:shadow-xl transition-all duration-300 hover:-translate-y-1">
              <div className="w-16 h-16 bg-blue-500 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-lg">
                <Star className="w-8 h-8 text-white fill-current" />
              </div>
              <div className="text-4xl font-bold text-blue-600 mb-2">4.9/5</div>
              <div className="text-gray-600 font-medium">Average Member Rating</div>
            </div>
            <div className="bg-gradient-to-br from-green-50 to-emerald-50 rounded-3xl p-8 text-center border border-green-200 hover:shadow-xl transition-all duration-300 hover:-translate-y-1">
              <div className="w-16 h-16 bg-green-500 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-lg">
                <TrendingUp className="w-8 h-8 text-white" />
              </div>
              <div className="text-4xl font-bold text-green-600 mb-2">$3,400</div>
              <div className="text-gray-600 font-medium">Average Annual Savings</div>
            </div>
            <div className="bg-gradient-to-br from-rose-50 to-pink-50 rounded-3xl p-8 text-center border border-rose-200 hover:shadow-xl transition-all duration-300 hover:-translate-y-1">
              <div className="w-16 h-16 bg-rose-500 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-lg">
                <Heart className="w-8 h-8 text-white fill-current" />
              </div>
              <div className="text-4xl font-bold text-rose-600 mb-2">12,000+</div>
              <div className="text-gray-600 font-medium">Verified Reviews</div>
            </div>
          </div>

          <div className="mt-16 text-center">
            <a
              href="/get-started"
              className="inline-flex items-center justify-center gap-2 bg-gradient-to-r from-blue-600 to-cyan-600 text-white px-10 py-5 rounded-2xl font-bold text-lg hover:from-blue-700 hover:to-cyan-700 transition-all duration-300 shadow-2xl hover:shadow-cyan-500/50 hover:scale-105 group"
            >
              Start Your Savings Story
              <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
            </a>
            <p className="mt-6 text-gray-600 text-lg">
              Join <span className="font-bold text-gray-900">50,000+ families</span> already saving with MPB Health
            </p>
          </div>
        </div>
      </section>
    </>
  );
};

export { TestimonialShowcase };
