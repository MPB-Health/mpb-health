import React, { useState, useEffect } from 'react';
import { DollarSign, TrendingDown, Calculator, ArrowRight, Download } from 'lucide-react';

export const EnhancedROICalculator: React.FC = () => {
  const [currentPlan, setCurrentPlan] = useState({
    premium: 800,
    deductible: 5000,
    copay: 50,
    coinsurance: 20,
  });

  const [mpbPlan, setMpbPlan] = useState({
    monthly: 295,
    iua: 2500,
  });

  const [usage, setUsage] = useState({
    doctorVisits: 4,
    prescriptions: 6,
    specialists: 2,
  });

  const [results, setResults] = useState({
    currentAnnual: 0,
    mpbAnnual: 0,
    savings: 0,
    savingsPercent: 0,
    breakEvenMonth: 0,
  });

  useEffect(() => {
    calculateROI();
  }, [currentPlan, mpbPlan, usage]);

  const calculateROI = () => {
    const currentAnnualPremium = currentPlan.premium * 12;
    const currentOutOfPocket =
      (usage.doctorVisits * currentPlan.copay) +
      (usage.specialists * currentPlan.copay * 2) +
      (usage.prescriptions * 30);

    const currentTotal = currentAnnualPremium + Math.min(currentOutOfPocket, currentPlan.deductible);

    const mpbAnnual = mpbPlan.monthly * 12;
    const mpbTotal = mpbAnnual + mpbPlan.iua;

    const savings = currentTotal - mpbTotal;
    const savingsPercent = (savings / currentTotal) * 100;
    const breakEvenMonth = Math.ceil(mpbPlan.iua / (currentPlan.premium - mpbPlan.monthly));

    setResults({
      currentAnnual: currentTotal,
      mpbAnnual: mpbTotal,
      savings,
      savingsPercent,
      breakEvenMonth: Math.max(1, breakEvenMonth),
    });
  };

  const exportResults = () => {
    const data = {
      comparison: {
        current_plan: currentPlan,
        mpb_plan: mpbPlan,
        annual_usage: usage,
      },
      results: {
        current_annual_cost: results.currentAnnual,
        mpb_annual_cost: results.mpbAnnual,
        annual_savings: results.savings,
        savings_percentage: results.savingsPercent.toFixed(1) + '%',
        break_even_month: results.breakEvenMonth,
      },
      five_year_projection: {
        current_plan: results.currentAnnual * 5,
        mpb_plan: results.mpbAnnual * 5,
        total_savings: results.savings * 5,
      }
    };

    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'mpb-health-savings-analysis.json';
    a.click();
  };

  return (
    <div className="max-w-6xl mx-auto space-y-8">
      <div className="text-center mb-12">
        <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-br from-blue-600 to-cyan-600 rounded-2xl mb-4">
          <Calculator className="h-8 w-8 text-white" />
        </div>
        <h2 className="text-3xl font-bold text-neutral-900 mb-3">
          Calculate Your Savings
        </h2>
        <p className="text-lg text-neutral-600">
          See exactly how much you could save with MPB Health
        </p>
      </div>

      <div className="grid lg:grid-cols-3 gap-8">
        {/* Current Plan Input */}
        <div className="bg-white rounded-2xl shadow-lg border border-neutral-200 p-6">
          <h3 className="text-xl font-bold text-neutral-900 mb-6">Your Current Plan</h3>

          <div className="space-y-4">
            <div>
              <label className="block text-sm font-semibold text-neutral-700 mb-2">
                Monthly Premium
              </label>
              <div className="relative">
                <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-neutral-400" />
                <input
                  type="number"
                  value={currentPlan.premium}
                  onChange={(e) => setCurrentPlan({...currentPlan, premium: Number(e.target.value)})}
                  className="w-full pl-10 pr-4 py-3 border-2 border-neutral-200 rounded-xl focus:border-blue-600 focus:outline-none"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-semibold text-neutral-700 mb-2">
                Annual Deductible
              </label>
              <div className="relative">
                <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-neutral-400" />
                <input
                  type="number"
                  value={currentPlan.deductible}
                  onChange={(e) => setCurrentPlan({...currentPlan, deductible: Number(e.target.value)})}
                  className="w-full pl-10 pr-4 py-3 border-2 border-neutral-200 rounded-xl focus:border-blue-600 focus:outline-none"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-semibold text-neutral-700 mb-2">
                Doctor Visit Copay
              </label>
              <div className="relative">
                <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-neutral-400" />
                <input
                  type="number"
                  value={currentPlan.copay}
                  onChange={(e) => setCurrentPlan({...currentPlan, copay: Number(e.target.value)})}
                  className="w-full pl-10 pr-4 py-3 border-2 border-neutral-200 rounded-xl focus:border-blue-600 focus:outline-none"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-semibold text-neutral-700 mb-2">
                Annual Usage
              </label>
              <div className="space-y-2">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-neutral-600">Doctor visits</span>
                  <input
                    type="number"
                    value={usage.doctorVisits}
                    onChange={(e) => setUsage({...usage, doctorVisits: Number(e.target.value)})}
                    className="w-20 px-3 py-2 border-2 border-neutral-200 rounded-lg focus:border-blue-600 focus:outline-none text-center"
                  />
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-neutral-600">Specialists</span>
                  <input
                    type="number"
                    value={usage.specialists}
                    onChange={(e) => setUsage({...usage, specialists: Number(e.target.value)})}
                    className="w-20 px-3 py-2 border-2 border-neutral-200 rounded-lg focus:border-blue-600 focus:outline-none text-center"
                  />
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-neutral-600">Prescriptions</span>
                  <input
                    type="number"
                    value={usage.prescriptions}
                    onChange={(e) => setUsage({...usage, prescriptions: Number(e.target.value)})}
                    className="w-20 px-3 py-2 border-2 border-neutral-200 rounded-lg focus:border-blue-600 focus:outline-none text-center"
                  />
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Results */}
        <div className="bg-gradient-to-br from-blue-600 to-cyan-600 rounded-2xl shadow-xl p-8 text-white">
          <div className="flex items-center gap-3 mb-8">
            <TrendingDown className="h-8 w-8" />
            <h3 className="text-2xl font-bold">Your Savings</h3>
          </div>

          <div className="space-y-6">
            <div>
              <p className="text-white/80 text-sm mb-2">Annual Savings</p>
              <p className="text-5xl font-bold">
                ${results.savings.toLocaleString()}
              </p>
              <p className="text-white/90 text-lg mt-2">
                {results.savingsPercent.toFixed(1)}% reduction in costs
              </p>
            </div>

            <div className="pt-6 border-t border-white/20">
              <div className="grid grid-cols-2 gap-4 mb-6">
                <div>
                  <p className="text-white/70 text-xs mb-1">Current Annual</p>
                  <p className="text-xl font-bold">${results.currentAnnual.toLocaleString()}</p>
                </div>
                <div>
                  <p className="text-white/70 text-xs mb-1">MPB Annual</p>
                  <p className="text-xl font-bold">${results.mpbAnnual.toLocaleString()}</p>
                </div>
              </div>

              <div className="bg-white/10 backdrop-blur-sm rounded-xl p-4">
                <p className="text-white/90 text-sm mb-1">Break-even point</p>
                <p className="text-2xl font-bold">Month {results.breakEvenMonth}</p>
              </div>
            </div>

            <div className="pt-6 border-t border-white/20">
              <p className="text-white/80 text-sm mb-2">5-Year Projection</p>
              <p className="text-3xl font-bold">
                ${(results.savings * 5).toLocaleString()}
              </p>
              <p className="text-white/90 text-sm mt-1">in total savings</p>
            </div>
          </div>
        </div>

        {/* MPB Plan Input */}
        <div className="bg-white rounded-2xl shadow-lg border border-neutral-200 p-6">
          <h3 className="text-xl font-bold text-neutral-900 mb-6">MPB Health Plan</h3>

          <div className="space-y-4">
            <div>
              <label className="block text-sm font-semibold text-neutral-700 mb-2">
                Monthly Contribution
              </label>
              <div className="relative">
                <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-neutral-400" />
                <input
                  type="number"
                  value={mpbPlan.monthly}
                  onChange={(e) => setMpbPlan({...mpbPlan, monthly: Number(e.target.value)})}
                  className="w-full pl-10 pr-4 py-3 border-2 border-neutral-200 rounded-xl focus:border-blue-600 focus:outline-none"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-semibold text-neutral-700 mb-2">
                Initial Unshareable Amount (IUA)
              </label>
              <select
                value={mpbPlan.iua}
                onChange={(e) => setMpbPlan({...mpbPlan, iua: Number(e.target.value)})}
                className="w-full px-4 py-3 border-2 border-neutral-200 rounded-xl focus:border-blue-600 focus:outline-none"
              >
                <option value={500}>$500</option>
                <option value={1000}>$1,000</option>
                <option value={1500}>$1,500</option>
                <option value={2500}>$2,500</option>
                <option value={5000}>$5,000</option>
              </select>
            </div>

            <div className="pt-4 mt-4 border-t border-neutral-200">
              <div className="bg-blue-50 rounded-xl p-4 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-neutral-600">Monthly</span>
                  <span className="font-semibold text-neutral-900">${mpbPlan.monthly}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-neutral-600">Annual Total</span>
                  <span className="font-semibold text-neutral-900">${mpbPlan.monthly * 12}</span>
                </div>
                <div className="flex items-center justify-between pt-3 border-t border-blue-200">
                  <span className="text-sm font-semibold text-neutral-700">With IUA</span>
                  <span className="text-lg font-bold text-blue-600">${(mpbPlan.monthly * 12) + mpbPlan.iua}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Actions */}
      <div className="flex items-center justify-center gap-4">
        <button
          onClick={exportResults}
          className="flex items-center gap-2 px-6 py-3 border-2 border-neutral-300 text-neutral-700 font-semibold rounded-xl hover:bg-neutral-50 transition-all"
        >
          <Download className="h-5 w-5" />
          Export Results
        </button>
        <a href="/get-started">
          <button className="flex items-center gap-2 px-8 py-3 bg-gradient-to-r from-blue-600 to-cyan-600 text-white font-bold rounded-xl hover:from-blue-700 hover:to-cyan-700 transition-all shadow-lg hover:shadow-xl">
            Get My Quote
            <ArrowRight className="h-5 w-5" />
          </button>
        </a>
      </div>
    </div>
  );
};
