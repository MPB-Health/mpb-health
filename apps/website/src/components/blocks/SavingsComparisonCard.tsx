import React from 'react';
import { TrendingDown, Check, X, Award, Users, Calendar } from 'lucide-react';

interface SavingsComparisonCardProps {
  traditionalMonthly?: number;
  mpbMonthly?: number;
  className?: string;
}

export function SavingsComparisonCard({
  traditionalMonthly = 850,
  mpbMonthly = 445,
  className = '',
}: SavingsComparisonCardProps) {
  const monthlySavings = traditionalMonthly - mpbMonthly;
  const annualSavings = monthlySavings * 12;

  return (
    <div className={`relative ${className}`}>
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-blue-600 via-cyan-500 to-blue-700 p-8 shadow-2xl">
        {/* Background Pattern */}
        <div className="absolute inset-0 opacity-10">
          <div className="absolute inset-0" style={{
            backgroundImage: 'radial-gradient(circle at 2px 2px, white 1px, transparent 0)',
            backgroundSize: '40px 40px'
          }} />
        </div>

        <div className="relative z-10">
          {/* Header */}
          <div className="text-center mb-8">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/20 backdrop-blur-sm text-white text-sm font-medium mb-4">
              <TrendingDown className="w-4 h-4" />
              Average Family Savings
            </div>
            <div className="text-6xl font-bold text-white mb-2">
              ${annualSavings.toLocaleString()}
            </div>
            <p className="text-xl text-white/90 font-medium">
              per year vs traditional insurance
            </p>
          </div>

          {/* Comparison Cards */}
          <div className="grid md:grid-cols-2 gap-4 mb-8">
            {/* Traditional Insurance */}
            <div className="relative bg-white/10 backdrop-blur-md rounded-2xl p-6 border border-white/20">
              <div className="absolute top-4 right-4">
                <div className="w-8 h-8 rounded-full bg-red-500 flex items-center justify-center">
                  <X className="w-5 h-5 text-white" strokeWidth={3} />
                </div>
              </div>
              <div className="text-white/80 text-sm font-medium mb-2">
                Traditional Insurance
              </div>
              <div className="text-4xl font-bold text-white mb-1">
                ${traditionalMonthly}<span className="text-xl font-normal text-white/80">/mo</span>
              </div>
              <div className="h-1 w-full bg-red-500/30 rounded-full mt-3" />
            </div>

            {/* MPB Health */}
            <div className="relative bg-white/10 backdrop-blur-md rounded-2xl p-6 border border-white/20">
              <div className="absolute top-4 right-4">
                <div className="w-8 h-8 rounded-full bg-green-500 flex items-center justify-center">
                  <Check className="w-5 h-5 text-white" strokeWidth={3} />
                </div>
              </div>
              <div className="text-white/80 text-sm font-medium mb-2">
                MPB Health Sharing
              </div>
              <div className="text-4xl font-bold text-white mb-1">
                ${mpbMonthly}<span className="text-xl font-normal text-white/80">/mo</span>
              </div>
              <div className="h-1 w-full bg-green-500/30 rounded-full mt-3" />
            </div>
          </div>

          {/* VS Divider */}
          <div className="flex items-center justify-center -my-6 relative z-20">
            <div className="w-16 h-16 rounded-full bg-gradient-to-br from-white to-gray-100 flex items-center justify-center shadow-xl border-4 border-white/20">
              <span className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-cyan-600 bg-clip-text text-transparent">
                VS
              </span>
            </div>
          </div>

          {/* Savings Highlight */}
          <div className="bg-white rounded-2xl p-6 text-center shadow-2xl mb-6">
            <div className="text-sm font-semibold text-gray-600 mb-1">
              Your monthly savings
            </div>
            <div className="text-5xl font-bold bg-gradient-to-r from-blue-600 to-cyan-600 bg-clip-text text-transparent mb-2">
              ${monthlySavings}
            </div>
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-gradient-to-r from-blue-600 to-cyan-600 text-white font-medium">
              <TrendingDown className="w-4 h-4" />
              That's ${annualSavings.toLocaleString()} back in your pocket every year!
            </div>
          </div>

          {/* Trust Indicators */}
          <div className="grid grid-cols-3 gap-4 pt-6 border-t border-white/20">
            <div className="text-center">
              <div className="flex items-center justify-center mb-2">
                <Award className="w-8 h-8 text-yellow-300" />
              </div>
              <div className="text-2xl font-bold text-white">BBB A+</div>
              <div className="text-xs text-white/70">Rating</div>
            </div>
            <div className="text-center">
              <div className="flex items-center justify-center mb-2">
                <Calendar className="w-8 h-8 text-white" />
              </div>
              <div className="text-2xl font-bold text-white">15+ Years</div>
              <div className="text-xs text-white/70">Experience</div>
            </div>
            <div className="text-center">
              <div className="flex items-center justify-center mb-2">
                <Users className="w-8 h-8 text-white" />
              </div>
              <div className="text-2xl font-bold text-white">50K+</div>
              <div className="text-xs text-white/70">Members</div>
            </div>
          </div>
        </div>

        {/* Decorative Elements */}
        <div className="absolute top-0 right-0 w-64 h-64 bg-gradient-to-br from-white/10 to-transparent rounded-full blur-3xl" />
        <div className="absolute bottom-0 left-0 w-64 h-64 bg-gradient-to-tr from-white/10 to-transparent rounded-full blur-3xl" />
      </div>
    </div>
  );
}
