import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import { ArrowRight, Phone, Search, ChevronDown, Sparkles, Award, X } from 'lucide-react';
import { Badge } from '../components/ui/Badge';
import { healthcareFeatures } from '../data/healthcareFeaturesData';

export const Features: React.FC = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [showMobileFilter, setShowMobileFilter] = useState(false);

  const categories = [
    { id: 'all', name: 'All Benefits' },
    { id: 'medical', name: 'Medical Care' },
    { id: 'wellness', name: 'Wellness' },
    { id: 'support', name: 'Support' },
    { id: 'savings', name: 'Savings' },
  ];

  const getCategoryForFeature = (featureId: string): string => {
    const medicalFeatures = ['health-sharing', 'primary-care', 'urgent-care', 'maternity-care'];
    const wellnessFeatures = ['preventive-care', 'mental-health'];
    const supportFeatures = ['membership-concierge', 'pet-telehealth'];
    const savingsFeatures = ['rx-benefits', 'hsa-compatibility'];

    if (medicalFeatures.includes(featureId)) return 'medical';
    if (wellnessFeatures.includes(featureId)) return 'wellness';
    if (supportFeatures.includes(featureId)) return 'support';
    if (savingsFeatures.includes(featureId)) return 'savings';
    return 'all';
  };

  const filteredFeatures = healthcareFeatures.filter((feature) => {
    const matchesSearch = feature.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         feature.shortDescription.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         feature.tagline.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesCategory = selectedCategory === 'all' || getCategoryForFeature(feature.id) === selectedCategory;

    return matchesSearch && matchesCategory;
  });

  const selectedCategoryName = categories.find(c => c.id === selectedCategory)?.name || 'All Benefits';

  return (
    <>
      <Helmet>
        <title>Healthcare Benefits - Comprehensive Coverage | MPB Health</title>
        <meta
          name="description"
          content="Explore 10 comprehensive healthcare benefits including telemedicine, primary care, urgent care, virtual behavioral health support, maternity care, and more. Find the coverage you need."
        />
      </Helmet>

      {/* Hero Section */}
      <section className="relative pt-16 pb-20 overflow-hidden bg-gradient-to-b from-slate-50 to-white">
        {/* Subtle background pattern */}
        <div className="absolute inset-0 opacity-[0.03]" style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23000000' fill-opacity='1'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
        }} />

        <div className="relative mx-auto max-w-5xl px-4 sm:px-6 lg:px-8 text-center">
          <Badge className="mb-6 bg-blue-100 text-blue-700 border-0 px-4 py-1.5">
            <Sparkles className="w-3.5 h-3.5 mr-1.5" />
            Membership Benefits
          </Badge>

          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold mb-6 text-gray-900 tracking-tight">
            Protection Against
            <span className="block text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-cyan-600">
              Large Medical Expenses
            </span>
          </h1>

          <p className="text-lg sm:text-xl text-gray-600 mb-10 max-w-2xl mx-auto leading-relaxed">
            Our health sharing program provides protection against large medical expenses. When you face major expenses like hospitalizations, surgeries, or serious illnesses, your healthcare costs are shared by our community of members. This is the foundation of health sharing: standing together when it matters most.
          </p>

          {/* Search Bar - Clean, Centered */}
          <div className="max-w-xl mx-auto relative">
            <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
            <input
              type="text"
              placeholder="Search benefits..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-12 pr-4 py-4 text-base border border-gray-200 rounded-2xl bg-white shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-400 transition-all"
            />
            {searchTerm && (
              <button
                onClick={() => setSearchTerm('')}
                className="absolute right-4 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            )}
          </div>
        </div>
      </section>

      {/* Filter Section - Not Sticky, Clean Pills */}
      <section className="py-8 bg-white border-b border-gray-100">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          {/* Desktop Filter Pills */}
          <div className="hidden md:flex items-center justify-center gap-2 flex-wrap">
            {categories.map((category) => (
              <button
                key={category.id}
                onClick={() => setSelectedCategory(category.id)}
                className={`px-5 py-2.5 rounded-full text-sm font-medium transition-all duration-200 ${
                  selectedCategory === category.id
                    ? 'bg-gray-900 text-white shadow-md'
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200 hover:text-gray-900'
                }`}
              >
                {category.name}
              </button>
            ))}
          </div>

          {/* Mobile Filter Dropdown */}
          <div className="md:hidden">
            <button
              onClick={() => setShowMobileFilter(!showMobileFilter)}
              className="w-full flex items-center justify-between px-4 py-3 bg-gray-100 rounded-xl text-gray-700 font-medium"
            >
              <span>Filter: {selectedCategoryName}</span>
              <ChevronDown className={`w-5 h-5 transition-transform ${showMobileFilter ? 'rotate-180' : ''}`} />
            </button>
            
            {showMobileFilter && (
              <div className="mt-2 bg-white border border-gray-200 rounded-xl shadow-lg overflow-hidden">
                {categories.map((category) => (
                  <button
                    key={category.id}
                    onClick={() => {
                      setSelectedCategory(category.id);
                      setShowMobileFilter(false);
                    }}
                    className={`w-full px-4 py-3 text-left text-sm font-medium transition-colors ${
                      selectedCategory === category.id
                        ? 'bg-blue-50 text-blue-700'
                        : 'text-gray-700 hover:bg-gray-50'
                    }`}
                  >
                    {category.name}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Results Count */}
          <div className="mt-6 text-center text-sm text-gray-500">
            Showing {filteredFeatures.length} benefit{filteredFeatures.length !== 1 ? 's' : ''}
            {selectedCategory !== 'all' && ` in ${selectedCategoryName}`}
            {searchTerm && ` matching "${searchTerm}"`}
          </div>
        </div>
      </section>

      {/* Features Grid */}
      <section id="features-grid" className="py-16 bg-gray-50/50">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          {filteredFeatures.length === 0 ? (
            <div className="text-center py-20">
              <div className="w-16 h-16 bg-gray-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
                <Search className="h-8 w-8 text-gray-400" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-2">No benefits found</h3>
              <p className="text-gray-600 mb-6">Try adjusting your search or filter</p>
              <button
                onClick={() => {
                  setSearchTerm('');
                  setSelectedCategory('all');
                }}
                className="text-blue-600 font-medium hover:text-blue-700"
              >
                Clear filters
              </button>
            </div>
          ) : (
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredFeatures.map((feature) => {
                const Icon = feature.icon;
                return (
                  <Link
                    key={feature.id}
                    to={`/features/${feature.id}`}
                    className="group bg-white rounded-2xl border border-gray-200 hover:border-gray-300 shadow-sm hover:shadow-lg transition-all duration-300 overflow-hidden"
                  >
                    {/* Image */}
                    <div className="relative h-48 overflow-hidden">
                      <img
                        src={feature.heroImage}
                        alt={feature.name}
                        width={400}
                        height={192}
                        loading="lazy"
                        decoding="async"
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                      />
                      <div className={`absolute inset-0 bg-gradient-to-t ${feature.gradientFrom} ${feature.gradientTo} opacity-60`} />
                      
                      {/* Icon Badge */}
                      <div className="absolute top-4 left-4">
                        <div className="w-12 h-12 bg-white/95 backdrop-blur-sm rounded-xl flex items-center justify-center shadow-lg">
                          <Icon className={`w-6 h-6 ${feature.color}`} />
                        </div>
                      </div>
                    </div>

                    {/* Content */}
                    <div className="p-5">
                      <h3 className="text-lg font-bold text-gray-900 mb-1 group-hover:text-blue-600 transition-colors">
                        {feature.name}
                      </h3>
                      <p className="text-xs font-semibold text-blue-600 uppercase tracking-wide mb-3">
                        {feature.tagline}
                      </p>
                      <p className="text-sm text-gray-600 leading-relaxed line-clamp-2">
                        {feature.shortDescription}
                      </p>

                      {/* Plans */}
                      <div className="mt-4 pt-4 border-t border-gray-100">
                        <div className="flex flex-wrap gap-1.5">
                          {feature.eligiblePlans.slice(0, 3).map((plan, idx) => (
                            <span
                              key={idx}
                              className="inline-flex items-center px-2.5 py-1 rounded-md bg-gray-100 text-xs font-medium text-gray-600"
                            >
                              {plan}
                            </span>
                          ))}
                          {feature.eligiblePlans.length > 3 && (
                            <span className="inline-flex items-center px-2.5 py-1 rounded-md bg-gray-100 text-xs font-medium text-gray-500">
                              +{feature.eligiblePlans.length - 3}
                            </span>
                          )}
                        </div>
                      </div>

                      {/* Link */}
                      <div className="mt-4 flex items-center gap-1.5 text-sm font-semibold text-blue-600 group-hover:gap-2.5 transition-all">
                        <span>Learn more</span>
                        <ArrowRight className="w-4 h-4" />
                      </div>
                    </div>
                  </Link>
                );
              })}
            </div>
          )}
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 bg-gradient-to-br from-gray-900 to-gray-800 relative overflow-hidden">
        {/* Decorative elements */}
        <div className="absolute top-0 left-0 w-64 h-64 bg-blue-500/10 rounded-full blur-3xl" />
        <div className="absolute bottom-0 right-0 w-96 h-96 bg-cyan-500/10 rounded-full blur-3xl" />

        <div className="relative mx-auto max-w-3xl px-4 sm:px-6 lg:px-8 text-center">
          <Badge className="mb-6 bg-white/10 text-white border-white/20">
            <Award className="w-3.5 h-3.5 mr-1.5" />
            Expert Support
          </Badge>
          
          <h2 className="text-3xl sm:text-4xl font-bold text-white mb-4">
            Need help choosing the right benefits?
          </h2>
          <p className="text-lg text-gray-300 mb-8 max-w-xl mx-auto">
            Our specialists can help you understand which benefits best fit your healthcare needs.
          </p>

          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link to="/contact">
              <button className="inline-flex items-center justify-center gap-2 bg-white text-gray-900 px-6 py-3.5 rounded-xl font-semibold hover:bg-gray-100 transition-colors shadow-lg">
                Schedule a Call
                <ArrowRight className="w-4 h-4" />
              </button>
            </Link>
            <a
              href="tel:8558164650"
              className="inline-flex items-center justify-center gap-2 bg-white/10 backdrop-blur-sm border border-white/20 text-white px-6 py-3.5 rounded-xl font-semibold hover:bg-white/20 transition-colors"
            >
              <Phone className="w-4 h-4" />
              (855) 816-4650
            </a>
          </div>
        </div>
      </section>
    </>
  );
};

export default Features;
