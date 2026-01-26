import React from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, Sparkles } from 'lucide-react';

interface BlogCTAProps {
  headline?: string;
  subheadline?: string;
  buttonText?: string;
  buttonRoute?: string;
  className?: string;
}

export const BlogCTA: React.FC<BlogCTAProps> = ({
  headline = 'Unlock smarter wellness and coverage insights',
  subheadline = 'Join thousands of families discovering affordable, faith-based healthcare solutions.',
  buttonText = 'Join MPB Health',
  buttonRoute = '/plans',
  className = '',
}) => {
  return (
    <div className={`relative overflow-hidden rounded-2xl bg-gradient-to-br from-emerald-500 via-teal-500 to-blue-600 p-8 md:p-10 ${className}`}>
      {/* Background Pattern */}
      <div className="absolute inset-0 opacity-10">
        <div className="absolute top-0 right-0 w-64 h-64 bg-white rounded-full -translate-y-1/2 translate-x-1/2" />
        <div className="absolute bottom-0 left-0 w-48 h-48 bg-white rounded-full translate-y-1/2 -translate-x-1/2" />
      </div>

      <div className="relative z-10 text-center max-w-2xl mx-auto">
        <div className="inline-flex items-center gap-2 px-3 py-1 bg-white/20 backdrop-blur-sm rounded-full text-white/90 text-sm font-medium mb-4">
          <Sparkles className="w-4 h-4" />
          <span>Smart Healthcare Solutions</span>
        </div>

        <h3 className="text-2xl md:text-3xl font-bold text-white mb-3">
          {headline}
        </h3>
        
        <p className="text-white/80 text-lg mb-6">
          {subheadline}
        </p>

        <Link
          to={buttonRoute}
          className="inline-flex items-center gap-2 px-8 py-4 bg-white text-emerald-600 font-semibold rounded-full shadow-lg hover:shadow-xl hover:bg-gray-50 transition-all duration-300 group"
        >
          {buttonText}
          <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
        </Link>
      </div>
    </div>
  );
};

export default BlogCTA;
