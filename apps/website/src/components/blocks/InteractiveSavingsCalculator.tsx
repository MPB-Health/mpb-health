import React, { useState } from 'react';
import { TrendingDown, Check, X, Award, Users, Calendar, Calculator } from 'lucide-react';
import { Button } from '../ui/button';

interface InteractiveSavingsCalculatorProps {
  defaultTraditional?: number;
  defaultMPB?: number;
  onGetStarted?: () => void;
  className?: string;
}

export function InteractiveSavingsCalculator({
  defaultTraditional = 850,
  defaultMPB = 445,
  onGetStarted,
  className = '',
}: InteractiveSavingsCalculatorProps) {
  const [traditionalMonthly, setTraditionalMonthly] = useState(defaultTraditional);
  const [mpbMonthly, setMPBMonthly] = useState(defaultMPB);

  const monthlySavings = traditionalMonthly - mpbMonthly;
  const annualSavings = monthlySavings * 12;
  const savingsPercentage = ((monthlySavings / traditionalMonthly) * 100).toFixed(0);

  return (
    <div className={`relative ${className}`}>
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-blue-600 via-cyan-500 to-blue-700 p-8 lg:p-12 shadow-2xl">
        {/* Background Pattern */}
        <div className="absolute inset-0 opacity-10">
          <div className="absolute inset-0" style={{
            backgroundImage: 'radial-gradient(circle at 2px 2px, white 1px, transparent 0)',
            backgroundSize: '40px 40px'
          }} />
        </div>

        <div className="relative z-10">
          {/* Header */}
          <div className="text-center mb-10">
            <div className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full bg-white/20 backdrop-blur-sm text-white text-sm font-medium mb-4 shadow-lg">
              <Calculator className="w-4 h-4" />
              Calculate Your Savings
            </div>
            <h2 className="text-4xl lg:text-5xl font-bold text-white mb-3">
              See How Much You'll Save
            </h2>
            <p className="text-xl text-white/90 font-medium">
              Compare your current insurance costs
            </p>
          </div>

          {/* Input Sliders */}
          <div className="bg-white/10 backdrop-blur-md rounded-2xl p-6 border border-white/20 mb-8">
            <div className="space-y-6">
              {/* Traditional Insurance Input */}
              <div>
                <label className="flex items-center justify-between text-white font-medium mb-3">
                  <span>Current Insurance Cost</span>
                  <span className="text-2xl font-bold">${traditionalMonthly}/mo</span>
                </label>
                <input
                  type="range"
                  min="200"
                  max="2000"
                  step="50"
                  value={traditionalMonthly}
                  onChange={(e) => setTraditionalMonthly(Number(e.target.value))}
                  className="w-full h-3 bg-white/20 rounded-full appearance-none cursor-pointer
                    [&::-webkit-slider-thumb]:appearance-none
                    [&::-webkit-slider-thumb]:w-6
                    [&::-webkit-slider-thumb]:h-6
                    [&::-webkit-slider-thumb]:rounded-full
                    [&::-webkit-slider-thumb]:bg-white
                    [&::-webkit-slider-thumb]:shadow-lg
                    [&::-webkit-slider-thumb]:cursor-pointer
                    [&::-moz-range-thumb]:w-6
                    [&::-moz-range-thumb]:h-6
                    [&::-moz-range-thumb]:rounded-full
                    [&::-moz-range-thumb]:bg-white
                    [&::-moz-range-thumb]:border-0
                    [&::-moz-range-thumb]:shadow-lg
                    [&::-moz-range-thumb]:cursor-pointer"
                />
                <div className="flex justify-between text-white/60 text-xs mt-2">
                  <span>$200</span>
                  <span>$2,000</span>
                </div>
              </div>

              {/* MPB Health Input */}
              <div>
                <label className="flex items-center justify-between text-white font-medium mb-3">
                  <span>MPB Health Sharing Cost</span>
                  <span className="text-2xl font-bold">${mpbMonthly}/mo</span>
                </label>
                <input
                  type="range"
                  min="100"
                  max="800"
                  step="25"
                  value={mpbMonthly}
                  onChange={(e) => setMPBMonthly(Number(e.target.value))}
                  className="w-full h-3 bg-white/20 rounded-full appearance-none cursor-pointer
                    [&::-webkit-slider-thumb]:appearance-none
                    [&::-webkit-slider-thumb]:w-6
                    [&::-webkit-slider-thumb]:h-6
                    [&::-webkit-slider-thumb]:rounded-full
                    [&::-webkit-slider-thumb]:bg-gradient-to-r
                    [&::-webkit-slider-thumb]:from-green-400
                    [&::-webkit-slider-thumb]:to-emerald-500
                    [&::-webkit-slider-thumb]:shadow-lg
                    [&::-webkit-slider-thumb]:cursor-pointer
                    [&::-moz-range-thumb]:w-6
                    [&::-moz-range-thumb]:h-6
                    [&::-moz-range-thumb]:rounded-full
                    [&::-moz-range-thumb]:bg-gradient-to-r
                    [&::-moz-range-thumb]:from-green-400
                    [&::-moz-range-thumb]:to-emerald-500
                    [&::-moz-range-thumb]:border-0
                    [&::-moz-range-thumb]:shadow-lg
                    [&::-moz-range-thumb]:cursor-pointer"
                />
                <div className="flex justify-between text-white/60 text-xs mt-2">
                  <span>$100</span>
                  <span>$800</span>
                </div>
              </div>
            </div>
          </div>

          {/* Comparison Cards */}
          <div className="grid md:grid-cols-2 gap-6 mb-8">
            {/* Traditional Insurance */}
            <div className="relative bg-white/10 backdrop-blur-md rounded-2xl p-6 border border-white/20 transform transition-all hover:scale-105">
              <div className="absolute top-4 right-4">
                <div className="w-10 h-10 rounded-full bg-red-500 flex items-center justify-center shadow-lg">
                  <X className="w-6 h-6 text-white" strokeWidth={3} />
                </div>
              </div>
              <div className="text-white/70 text-sm font-medium mb-2 uppercase tracking-wider">
                Traditional Insurance
              </div>
              <div className="text-5xl font-bold text-white mb-3">
                ${traditionalMonthly}<span className="text-2xl font-normal text-white/80">/mo</span>
              </div>
              <div className="space-y-2">
                <div className="flex items-center gap-2 text-white/80 text-sm">
                  <X className="w-4 h-4 text-red-400" />
                  Network restrictions
                </div>
                <div className="flex items-center gap-2 text-white/80 text-sm">
                  <X className="w-4 h-4 text-red-400" />
                  High deductibles
                </div>
                <div className="flex items-center gap-2 text-white/80 text-sm">
                  <X className="w-4 h-4 text-red-400" />
                  Annual premium increases
                </div>
              </div>
            </div>

            {/* MPB Health */}
            <div className="relative bg-white/10 backdrop-blur-md rounded-2xl p-6 border-2 border-green-400/50 transform transition-all hover:scale-105">
              <div className="absolute top-4 right-4">
                <div className="w-10 h-10 rounded-full bg-green-500 flex items-center justify-center shadow-lg">
                  <Check className="w-6 h-6 text-white" strokeWidth={3} />
                </div>
              </div>
              <div className="text-white/70 text-sm font-medium mb-2 uppercase tracking-wider">
                MPB Health Sharing
              </div>
              <div className="text-5xl font-bold text-white mb-3">
                ${mpbMonthly}<span className="text-2xl font-normal text-white/80">/mo</span>
              </div>
              <div className="space-y-2">
                <div className="flex items-center gap-2 text-white/90 text-sm">
                  <Check className="w-4 h-4 text-green-400" />
                  Any provider, anywhere
                </div>
                <div className="flex items-center gap-2 text-white/90 text-sm">
                  <Check className="w-4 h-4 text-green-400" />
                  Transparent pricing
                </div>
                <div className="flex items-center gap-2 text-white/90 text-sm">
                  <Check className="w-4 h-4 text-green-400" />
                  Community support
                </div>
              </div>
            </div>
          </div>

          {/* Savings Highlight */}
          <div className="bg-white rounded-2xl p-8 text-center shadow-2xl mb-8">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-gradient-to-r from-green-100 to-emerald-100 text-green-700 text-sm font-semibold mb-3">
              <TrendingDown className="w-4 h-4" />
              You Save {savingsPercentage}%
            </div>
            <div className="text-sm font-semibold text-gray-600 mb-2">
              Your monthly savings
            </div>
            <div className="text-6xl lg:text-7xl font-bold bg-gradient-to-r from-blue-600 to-cyan-600 bg-clip-text text-transparent mb-4">
              ${monthlySavings}
            </div>
            <div className="text-xl text-gray-700 font-medium mb-6">
              That's <span className="font-bold text-2xl bg-gradient-to-r from-blue-600 to-cyan-600 bg-clip-text text-transparent">${annualSavings.toLocaleString()}</span> back in your pocket every year!
            </div>
            {onGetStarted && (
              <Button
                size="lg"
                onClick={onGetStarted}
                className="bg-gradient-to-r from-blue-600 to-cyan-600 text-white shadow-lg hover:shadow-xl transform hover:scale-105 transition-all"
              >
                Get My Custom Quote
              </Button>
            )}
          </div>

          {/* Trust Indicators */}
          <div className="grid grid-cols-3 gap-6 pt-8 border-t border-white/20">
            <div className="text-center">
              <div className="flex items-center justify-center mb-3">
                <div className="w-16 h-16 rounded-full bg-white/10 backdrop-blur-sm flex items-center justify-center">
                  <Award className="w-9 h-9 text-yellow-300" />
                </div>
              </div>
              <div className="text-3xl font-bold text-white">BBB A+</div>
              <div className="text-sm text-white/70 mt-1">Rating</div>
            </div>
            <div className="text-center">
              <div className="flex items-center justify-center mb-3">
                <div className="w-16 h-16 rounded-full bg-white/10 backdrop-blur-sm flex items-center justify-center">
                  <Calendar className="w-9 h-9 text-white" />
                </div>
              </div>
              <div className="text-3xl font-bold text-white">15+ Years</div>
              <div className="text-sm text-white/70 mt-1">Experience</div>
            </div>
            <div className="text-center">
              <div className="flex items-center justify-center mb-3">
                <div className="w-16 h-16 rounded-full bg-white/10 backdrop-blur-sm flex items-center justify-center">
                  <Users className="w-9 h-9 text-white" />
                </div>
              </div>
              <div className="text-3xl font-bold text-white">50K+</div>
              <div className="text-sm text-white/70 mt-1">Members</div>
            </div>
          </div>
        </div>

        {/* Decorative Elements */}
        <div className="absolute top-0 right-0 w-96 h-96 bg-gradient-to-br from-white/10 to-transparent rounded-full blur-3xl" />
        <div className="absolute bottom-0 left-0 w-96 h-96 bg-gradient-to-tr from-white/10 to-transparent rounded-full blur-3xl" />
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-full h-full">
          <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/5 to-transparent transform rotate-45" />
        </div>
      </div>
    </div>
  );
}
