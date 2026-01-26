import React from 'react';
import { Helmet } from 'react-helmet-async';
import { Mic2, Youtube, Music, UserPlus, Users, TrendingUp, Heart, ExternalLink } from 'lucide-react';

const HealthyCarePodcast = () => {
  return (
    <>
      <Helmet>
        <title>HealthyCare Podcast | MPB Health</title>
        <meta
          name="description"
          content="Welcome to the HealthyCare Podcast — where wellness meets real life. Host Catherine Okubo talks with fighters, doctors, therapists, immigrants, and entrepreneurs about the true journey of health, hustle, and healing."
        />
      </Helmet>

      <div className="min-h-screen bg-gradient-to-b from-white to-neutral-50">
        <section className="relative bg-gradient-to-br from-blue-600 via-blue-500 to-cyan-500 text-white overflow-hidden">
          <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PGRlZnM+PHBhdHRlcm4gaWQ9ImdyaWQiIHdpZHRoPSI2MCIgaGVpZ2h0PSI2MCIgcGF0dGVyblVuaXRzPSJ1c2VyU3BhY2VPblVzZSI+PHBhdGggZD0iTSAxMCAwIEwgMCAwIDAgMTAiIGZpbGw9Im5vbmUiIHN0cm9rZT0id2hpdGUiIHN0cm9rZS1vcGFjaXR5PSIwLjA1IiBzdHJva2Utd2lkdGg9IjEiLz48L3BhdHRlcm4+PC9kZWZzPjxyZWN0IHdpZHRoPSIxMDAlIiBoZWlnaHQ9IjEwMCUiIGZpbGw9InVybCgjZ3JpZCkiLz48L3N2Zz4=')] opacity-30"></div>

          <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20 lg:py-28">
            <div className="grid lg:grid-cols-2 gap-12 items-center">
              <div className="space-y-8">
                <div>
                  <h1 className="text-4xl lg:text-6xl font-bold mb-6 leading-tight">
                    Where Wellness Meets Real Life
                  </h1>
                  <p className="text-xl lg:text-2xl text-blue-50 leading-relaxed">
                    Host Catherine Okubo talks with fighters, doctors, therapists, immigrants, and entrepreneurs about the true journey of health, hustle, and healing.
                  </p>
                </div>

                <div className="flex flex-col sm:flex-row gap-4">
                  <a
                    href="https://open.spotify.com/show/0Kwvp9GONcuOOU0l1Wuvpl"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center justify-center space-x-2 bg-[#1DB954] hover:bg-[#1ed760] text-white px-8 py-4 rounded-xl font-semibold transition-all duration-300 shadow-lg hover:shadow-xl hover:scale-105"
                  >
                    <Music className="h-5 w-5" />
                    <span>Listen on Spotify</span>
                  </a>
                  <a
                    href="https://www.youtube.com/@HealthyCarePodcast"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center justify-center space-x-2 bg-[#FF0000] hover:bg-[#cc0000] text-white px-8 py-4 rounded-xl font-semibold transition-all duration-300 shadow-lg hover:shadow-xl hover:scale-105"
                  >
                    <Youtube className="h-5 w-5" />
                    <span>Watch on YouTube</span>
                  </a>
                </div>
              </div>

              <div className="relative">
                <div className="relative rounded-2xl overflow-hidden shadow-2xl border-8 border-white/20">
                  <img
                    src="/assets/ac2f4013-8c50-4aa2-bae1-759215e530a9.jpg"
                    alt="Catherine Okubo hosting the HealthyCare Podcast"
                    className="w-full h-auto"
                  />
                </div>
                <div className="absolute -bottom-6 -right-6 bg-lime-400 text-neutral-900 px-6 py-3 rounded-xl shadow-xl font-bold text-lg">
                  6,000+ Active Listeners
                </div>
              </div>
            </div>
          </div>
        </section>

        <section className="py-16 lg:py-24 bg-white">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-16">
              <h2 className="text-3xl lg:text-5xl font-bold text-neutral-900 mb-4">
                About the Podcast
              </h2>
              <p className="text-xl text-neutral-600 max-w-3xl mx-auto">
                Our HealthyCare Podcast spotlights real voices in health, wellness, and entrepreneurship
              </p>
            </div>

            <div className="grid md:grid-cols-3 gap-8">
              <div className="bg-gradient-to-br from-blue-50 to-cyan-50 p-8 rounded-2xl border border-blue-100">
                <div className="w-12 h-12 bg-blue-600 rounded-xl flex items-center justify-center mb-4">
                  <Heart className="h-6 w-6 text-white" />
                </div>
                <h3 className="text-xl font-bold text-neutral-900 mb-3">Real Stories</h3>
                <p className="text-neutral-600">
                  Authentic conversations with professionals and patients sharing their health journeys and insights
                </p>
              </div>

              <div className="bg-gradient-to-br from-lime-50 to-green-50 p-8 rounded-2xl border border-lime-100">
                <div className="w-12 h-12 bg-lime-500 rounded-xl flex items-center justify-center mb-4">
                  <TrendingUp className="h-6 w-6 text-white" />
                </div>
                <h3 className="text-xl font-bold text-neutral-900 mb-3">Expert Insights</h3>
                <p className="text-neutral-600">
                  Healthcare professionals, wellness leaders, and entrepreneurs sharing practical advice
                </p>
              </div>

              <div className="bg-gradient-to-br from-cyan-50 to-blue-50 p-8 rounded-2xl border border-cyan-100">
                <div className="w-12 h-12 bg-cyan-600 rounded-xl flex items-center justify-center mb-4">
                  <Users className="h-6 w-6 text-white" />
                </div>
                <h3 className="text-xl font-bold text-neutral-900 mb-3">Community Impact</h3>
                <p className="text-neutral-600">
                  Reaching 6,000+ engaged MPB Health members with empowering health content
                </p>
              </div>
            </div>
          </div>
        </section>

        <section className="py-16 lg:py-24 bg-gradient-to-b from-neutral-50 to-white">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-16">
              <h2 className="text-3xl lg:text-5xl font-bold text-neutral-900 mb-4">
                Meet Your Host
              </h2>
            </div>

            <div className="max-w-4xl mx-auto bg-white rounded-3xl shadow-xl overflow-hidden border border-neutral-200">
              <div className="grid md:grid-cols-2 gap-0">
                <div className="relative h-64 md:h-auto">
                  <img
                    src="/assets/Image (6) copy copy.jpg"
                    alt="Catherine Okubo"
                    className="w-full h-full object-cover"
                  />
                </div>
                <div className="p-8 lg:p-12 flex flex-col justify-center">
                  <h3 className="text-3xl font-bold text-neutral-900 mb-2">Catherine Okubo</h3>
                  <p className="text-lg text-blue-600 font-semibold mb-6">Podcast Host</p>
                  <p className="text-neutral-600 mb-6 leading-relaxed">
                    Catherine brings together diverse voices from across the healthcare, wellness, and entrepreneurship communities. Her engaging interview style creates meaningful conversations that inspire and educate listeners on their health journeys.
                  </p>
                  <div className="flex items-center space-x-2 text-sm text-neutral-500">
                    <Mic2 className="h-4 w-4" />
                    <span>Broadcasting weekly on Spotify & YouTube</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        <section className="py-16 lg:py-24 bg-gradient-to-br from-blue-600 via-blue-500 to-cyan-500 text-white relative overflow-hidden">
          <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PGRlZnM+PHBhdHRlcm4gaWQ9ImdyaWQiIHdpZHRoPSI2MCIgaGVpZ2h0PSI2MCIgcGF0dGVyblVuaXRzPSJ1c2VyU3BhY2VPblVzZSI+PHBhdGggZD0iTSAxMCAwIEwgMCAwIDAgMTAiIGZpbGw9Im5vbmUiIHN0cm9rZT0id2hpdGUiIHN0cm9rZS1vcGFjaXR5PSIwLjA1IiBzdHJva2Utd2lkdGg9IjEiLz48L3BhdHRlcm4+PC9kZWZzPjxyZWN0IHdpZHRoPSIxMDAlIiBoZWlnaHQ9IjEwMCUiIGZpbGw9InVybCgjZ3JpZCkiLz48L3N2Zz4=')] opacity-30"></div>

          <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="grid lg:grid-cols-2 gap-12 items-center">
              <div className="order-2 lg:order-1">
                <img
                  src="/assets/8473310a-eda8-4eb2-aeec-7c8996d9b661.jpg"
                  alt="Be a Guest on the HealthyCare Podcast"
                  className="w-full h-auto rounded-2xl shadow-2xl border-8 border-white/20"
                />
              </div>

              <div className="order-1 lg:order-2 space-y-6">
                <h2 className="text-4xl lg:text-5xl font-bold leading-tight">
                  Be a Guest on the HealthyCare Podcast!
                </h2>
                <p className="text-xl text-blue-50 leading-relaxed">
                  Share your expertise, inspire our community, and shape the future of healthcare.
                </p>

                <div className="space-y-4 bg-white/10 backdrop-blur-sm rounded-xl p-6 border border-white/20">
                  <h3 className="text-xl font-bold">Ideal Guests Include:</h3>
                  <ul className="space-y-3">
                    <li className="flex items-start space-x-3">
                      <div className="w-6 h-6 bg-lime-400 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                        <span className="text-neutral-900 text-sm font-bold">✓</span>
                      </div>
                      <span>Healthcare professionals & behavioral health advocates</span>
                    </li>
                    <li className="flex items-start space-x-3">
                      <div className="w-6 h-6 bg-lime-400 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                        <span className="text-neutral-900 text-sm font-bold">✓</span>
                      </div>
                      <span>Wellness & fitness leaders</span>
                    </li>
                    <li className="flex items-start space-x-3">
                      <div className="w-6 h-6 bg-lime-400 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                        <span className="text-neutral-900 text-sm font-bold">✓</span>
                      </div>
                      <span>Entrepreneurs in the health space</span>
                    </li>
                    <li className="flex items-start space-x-3">
                      <div className="w-6 h-6 bg-lime-400 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                        <span className="text-neutral-900 text-sm font-bold">✓</span>
                      </div>
                      <span>Patients with inspiring health journeys</span>
                    </li>
                    <li className="flex items-start space-x-3">
                      <div className="w-6 h-6 bg-lime-400 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                        <span className="text-neutral-900 text-sm font-bold">✓</span>
                      </div>
                      <span>Community leaders passionate about healthcare</span>
                    </li>
                  </ul>
                </div>

                <div className="flex flex-col sm:flex-row gap-4">
                  <a
                    href="https://joinmpb.com/healthy-care-podcast-invitation/"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center justify-center space-x-2 bg-lime-400 hover:bg-lime-300 text-neutral-900 px-8 py-4 rounded-xl font-bold transition-all duration-300 shadow-lg hover:shadow-xl hover:scale-105"
                  >
                    <UserPlus className="h-5 w-5" />
                    <span>Apply to Be a Guest</span>
                  </a>
                </div>

                <p className="text-sm text-blue-100">
                  Reach our audience of 6,000+ engaged MPB Health Members with your expertise
                </p>
              </div>
            </div>
          </div>
        </section>

        <section className="py-16 lg:py-24 bg-white">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-16">
              <h2 className="text-3xl lg:text-5xl font-bold text-neutral-900 mb-4">
                Topics We Cover
              </h2>
              <p className="text-xl text-neutral-600 max-w-3xl mx-auto">
                Practical stories and expert insights across the health and wellness spectrum
              </p>
            </div>

            <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
              <div className="bg-gradient-to-br from-blue-50 to-blue-100 p-6 rounded-xl border border-blue-200">
                <h3 className="text-lg font-bold text-neutral-900 mb-2">Healthcare Freedom</h3>
                <p className="text-sm text-neutral-600">Exploring alternative healthcare models and patient empowerment</p>
              </div>

              <div className="bg-gradient-to-br from-lime-50 to-lime-100 p-6 rounded-xl border border-lime-200">
                <h3 className="text-lg font-bold text-neutral-900 mb-2">Nutrition & Wellness</h3>
                <p className="text-sm text-neutral-600">Holistic approaches to health through nutrition and lifestyle</p>
              </div>

              <div className="bg-gradient-to-br from-cyan-50 to-cyan-100 p-6 rounded-xl border border-cyan-200">
                <h3 className="text-lg font-bold text-neutral-900 mb-2">Behavioral Health</h3>
                <p className="text-sm text-neutral-600">Addressing emotional wellness and healing strategies</p>
              </div>

              <div className="bg-gradient-to-br from-blue-50 to-cyan-100 p-6 rounded-xl border border-blue-200">
                <h3 className="text-lg font-bold text-neutral-900 mb-2">Entrepreneurship</h3>
                <p className="text-sm text-neutral-600">Building businesses in the health and wellness industry</p>
              </div>

              <div className="bg-gradient-to-br from-lime-50 to-green-100 p-6 rounded-xl border border-lime-200">
                <h3 className="text-lg font-bold text-neutral-900 mb-2">Mindset & Healing</h3>
                <p className="text-sm text-neutral-600">The power of mindset in health transformation</p>
              </div>

              <div className="bg-gradient-to-br from-cyan-50 to-blue-100 p-6 rounded-xl border border-cyan-200">
                <h3 className="text-lg font-bold text-neutral-900 mb-2">Patient Stories</h3>
                <p className="text-sm text-neutral-600">Real experiences from health journeys and recoveries</p>
              </div>

              <div className="bg-gradient-to-br from-blue-50 to-blue-100 p-6 rounded-xl border border-blue-200">
                <h3 className="text-lg font-bold text-neutral-900 mb-2">Medical Innovation</h3>
                <p className="text-sm text-neutral-600">Cutting-edge approaches to healthcare delivery</p>
              </div>

              <div className="bg-gradient-to-br from-lime-50 to-lime-100 p-6 rounded-xl border border-lime-200">
                <h3 className="text-lg font-bold text-neutral-900 mb-2">Community Health</h3>
                <p className="text-sm text-neutral-600">Building healthier communities through shared support</p>
              </div>
            </div>
          </div>
        </section>

        <section className="py-16 lg:py-24 bg-neutral-900 text-white">
          <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
            <Mic2 className="h-16 w-16 text-lime-400 mx-auto mb-6" />
            <h2 className="text-3xl lg:text-5xl font-bold mb-6">
              Start Listening Today
            </h2>
            <p className="text-xl text-neutral-300 mb-8 leading-relaxed">
              Join thousands of listeners discovering inspiring health stories and expert insights
            </p>

            <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
              <a
                href="https://open.spotify.com/show/0Kwvp9GONcuOOU0l1Wuvpl"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center justify-center space-x-2 bg-[#1DB954] hover:bg-[#1ed760] text-white px-8 py-4 rounded-xl font-semibold transition-all duration-300 shadow-lg hover:shadow-xl hover:scale-105"
              >
                <Music className="h-5 w-5" />
                <span>Listen on Spotify</span>
                <ExternalLink className="h-4 w-4" />
              </a>

              <a
                href="https://www.youtube.com/@HealthyCarePodcast"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center justify-center space-x-2 bg-[#FF0000] hover:bg-[#cc0000] text-white px-8 py-4 rounded-xl font-semibold transition-all duration-300 shadow-lg hover:shadow-xl hover:scale-105"
              >
                <Youtube className="h-5 w-5" />
                <span>Watch on YouTube</span>
                <ExternalLink className="h-4 w-4" />
              </a>
            </div>

            <div className="mt-12 pt-8 border-t border-neutral-800">
              <p className="text-neutral-400 mb-4">Interested in sharing your story?</p>
              <a
                href="https://joinmpb.com/healthy-care-podcast-invitation/"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center space-x-2 text-lime-400 hover:text-lime-300 font-semibold transition-colors"
              >
                <span>Apply to Be a Guest</span>
                <ExternalLink className="h-4 w-4" />
              </a>
            </div>
          </div>
        </section>
      </div>
    </>
  );
};

export default HealthyCarePodcast;
