import React from 'react';
import { Shield, Users, Clock, Award, CheckCircle, Star } from 'lucide-react';
import { cn } from '../../lib/utils';

interface TrustBadge {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  value: string;
  color: string;
}

const badges: TrustBadge[] = [
  {
    icon: Users,
    label: 'Active Members',
    value: '50,000+',
    color: 'from-blue-600 to-cyan-600',
  },
  {
    icon: Shield,
    label: 'Member Satisfaction',
    value: '98%',
    color: 'from-green-600 to-emerald-600',
  },
  {
    icon: Clock,
    label: 'Years of Service',
    value: '15+',
    color: 'from-purple-600 to-pink-600',
  },
  {
    icon: Award,
    label: 'Claims Processed',
    value: '$100M+',
    color: 'from-orange-600 to-red-600',
  },
];

interface TrustBadgesProps {
  variant?: 'horizontal' | 'grid';
  className?: string;
  animated?: boolean;
}

export const TrustBadges: React.FC<TrustBadgesProps> = ({
  variant = 'horizontal',
  className,
  animated = true,
}) => {
  return (
    <div
      className={cn(
        'w-full',
        variant === 'grid' && 'grid grid-cols-2 lg:grid-cols-4 gap-4',
        variant === 'horizontal' && 'flex flex-wrap justify-center gap-4',
        className
      )}
    >
      {badges.map((badge, index) => {
        const Icon = badge.icon;
        return (
          <div
            key={index}
            className={cn(
              'group relative overflow-hidden rounded-xl bg-white border border-neutral-200 p-6 transition-all duration-300',
              animated && 'hover:shadow-xl hover:scale-105 hover:-translate-y-1',
              variant === 'horizontal' && 'flex-1 min-w-[200px]'
            )}
          >
            <div className="relative z-10">
              <div
                className={cn(
                  'inline-flex items-center justify-center w-12 h-12 rounded-xl bg-gradient-to-br mb-4',
                  badge.color
                )}
              >
                <Icon className="h-6 w-6 text-white" />
              </div>
              <p className="text-3xl font-bold text-neutral-900 mb-1">
                {badge.value}
              </p>
              <p className="text-sm font-medium text-neutral-600">
                {badge.label}
              </p>
            </div>

            {animated && (
              <div
                className={cn(
                  'absolute inset-0 bg-gradient-to-br opacity-0 group-hover:opacity-5 transition-opacity duration-300',
                  badge.color
                )}
              />
            )}
          </div>
        );
      })}
    </div>
  );
};

interface SocialProofBarProps {
  className?: string;
}

export const SocialProofBar: React.FC<SocialProofBarProps> = ({ className }) => {
  return (
    <div className={cn('bg-gradient-to-r from-blue-50 to-cyan-50 border-y border-blue-100 py-6', className)}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-wrap items-center justify-center gap-8 text-center">
          <div className="flex items-center gap-2">
            <Star className="h-5 w-5 text-yellow-500 fill-yellow-500" />
            <Star className="h-5 w-5 text-yellow-500 fill-yellow-500" />
            <Star className="h-5 w-5 text-yellow-500 fill-yellow-500" />
            <Star className="h-5 w-5 text-yellow-500 fill-yellow-500" />
            <Star className="h-5 w-5 text-yellow-500 fill-yellow-500" />
            <span className="ml-2 text-sm font-semibold text-neutral-700">
              4.9/5 from 3,500+ reviews
            </span>
          </div>

          <div className="hidden sm:block h-6 w-px bg-neutral-300"></div>

          <div className="flex items-center gap-2">
            <CheckCircle className="h-5 w-5 text-green-600" />
            <span className="text-sm font-semibold text-neutral-700">
              A+ Better Business Bureau Rating
            </span>
          </div>

          <div className="hidden sm:block h-6 w-px bg-neutral-300"></div>

          <div className="flex items-center gap-2">
            <Shield className="h-5 w-5 text-blue-600" />
            <span className="text-sm font-semibold text-neutral-700">
              HIPAA Compliant & Secure
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};

interface TestimonialCardProps {
  name: string;
  location: string;
  quote: string;
  savings?: string;
  avatar?: string;
  rating?: number;
}

export const TestimonialCard: React.FC<TestimonialCardProps> = ({
  name,
  location,
  quote,
  savings,
  avatar,
  rating = 5,
}) => {
  return (
    <div className="bg-white rounded-xl border border-neutral-200 p-6 shadow-sm hover:shadow-lg transition-shadow duration-300">
      <div className="flex items-center gap-1 mb-4">
        {Array.from({ length: rating }).map((_, i) => (
          <Star
            key={i}
            className="h-4 w-4 text-yellow-500 fill-yellow-500"
          />
        ))}
      </div>

      <p className="text-neutral-700 mb-6 leading-relaxed italic">
        "{quote}"
      </p>

      {savings && (
        <div className="mb-4 p-3 bg-green-50 border border-green-200 rounded-lg">
          <p className="text-sm font-semibold text-green-800">
            Saved {savings} per month
          </p>
        </div>
      )}

      <div className="flex items-center gap-3">
        {avatar ? (
          <img
            src={avatar}
            alt={name}
            className="w-12 h-12 rounded-full object-cover"
          />
        ) : (
          <div className="w-12 h-12 rounded-full bg-gradient-to-br from-blue-600 to-cyan-600 flex items-center justify-center text-white font-semibold text-lg">
            {name.charAt(0)}
          </div>
        )}
        <div>
          <p className="font-semibold text-neutral-900">{name}</p>
          <p className="text-sm text-neutral-600">{location}</p>
        </div>
      </div>
    </div>
  );
};
