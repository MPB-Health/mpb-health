import React, { useState, useEffect } from 'react';
import { Calculator, TrendingDown, Users, DollarSign } from 'lucide-react';
import { Card, CardHeader, CardTitle, CardContent } from '../ui/Card';
import { Select } from '../ui/Select';
import { Button } from '../ui/button';
import { calculateCosts, getAgeBasedTier, formatCurrency, type HouseholdMember } from '../../lib/calculator';
import { trackCalculatorUsage } from '../../lib/analytics';

const CostEstimator: React.FC = () => {
  const [householdSize, setHouseholdSize] = useState(2);
  const [ages, setAges] = useState<number[]>([35, 32]);
  const [membershipLevel, setMembershipLevel] = useState<'essential' | 'premier' | 'elite'>('premier');
  const [result, setResult] = useState<any>(null);

  useEffect(() => {
    // Update ages array when household size changes
    if (ages.length !== householdSize) {
      const newAges = [...ages];
      while (newAges.length < householdSize) {
        newAges.push(35); // Default adult age
      }
      while (newAges.length > householdSize) {
        newAges.pop();
      }
      setAges(newAges);
    }
  }, [householdSize, ages]);

  useEffect(() => {
    // Calculate costs when inputs change
    const members: HouseholdMember[] = ages.map(age => ({
      age,
      tier: getAgeBasedTier(age)
    }));

    const calculationResult = calculateCosts({
      householdSize,
      members,
      membershipLevel
    });

    setResult(calculationResult);

    // Track usage
    trackCalculatorUsage(
      householdSize, 
      members.map(m => m.tier),
      calculationResult.monthlyShare
    );
  }, [householdSize, ages, membershipLevel]);

  const handleAgeChange = (index: number, age: string) => {
    const numericAge = parseInt(age) || 25;
    const newAges = [...ages];
    newAges[index] = numericAge;
    setAges(newAges);
  };

  return (
    <section id="calculator" className="py-16 bg-gradient-to-br from-primary/5 to-primary/10">
      <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-12">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-primary/10 rounded-xl mb-6">
            <Calculator className="h-8 w-8 text-primary" />
          </div>
          <h2 className="text-display-md font-bold text-neutral-900 mb-4">
            Calculate Your Health Sharing Costs
          </h2>
          <p className="text-xl text-neutral-600 max-w-2xl mx-auto">
            Get an estimate of your monthly health sharing contribution based on your family size and membership needs.
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Calculator Form */}
          <Card className="animate-slide-up">
            <CardHeader>
              <CardTitle>Your Household Details</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <Select
                label="Household Size"
                value={householdSize.toString()}
                onChange={(e) => setHouseholdSize(parseInt(e.target.value))}
              >
                <option value="1">1 person</option>
                <option value="2">2 people</option>
                <option value="3">3 people</option>
                <option value="4">4 people</option>
                <option value="5">5 people</option>
                <option value="6">6+ people</option>
              </Select>

              <div className="space-y-3">
                <label className="block text-sm font-medium text-neutral-700">
                  Ages of Household Members
                </label>
                <div className="grid grid-cols-2 gap-3">
                  {ages.map((age, index) => (
                    <Select
                      key={index}
                      value={age.toString()}
                      onChange={(e) => handleAgeChange(index, e.target.value)}
                    >
                      <option value="0">Under 1</option>
                      <option value="5">1-17</option>
                      <option value="25">18-29</option>
                      <option value="35">30-39</option>
                      <option value="45">40-49</option>
                      <option value="55">50-59</option>
                      <option value="65">60+</option>
                    </Select>
                  ))}
                </div>
              </div>

              <Select
                label="Membership Level"
                value={membershipLevel}
                onChange={(e) => setMembershipLevel(e.target.value as any)}
              >
                <option value="care-plus">Care+ - Comprehensive sharing</option>
                <option value="direct">Direct - Lower monthly costs</option>
                <option value="secure-hsa">Secure HSA - HSA compatible</option>
              </Select>
            </CardContent>
          </Card>

          {/* Results */}
          <Card className="animate-slide-up animate-delayed-1">
            <CardHeader>
              <CardTitle>Your Estimated Costs</CardTitle>
            </CardHeader>
            <CardContent>
              {result && (
                <div className="space-y-6">
                  <div className="text-center p-6 bg-gradient-to-br from-primary/10 to-primary/5 rounded-xl">
                    <div className="text-3xl font-bold text-primary tabular-nums mb-2">
                      {formatCurrency(result.monthlyShare)}
                    </div>
                    <div className="text-sm text-neutral-600">Monthly sharing amount</div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    <div className="text-center p-4 bg-neutral-50 rounded-lg">
                      <div className="flex justify-center mb-2">
                        <DollarSign className="h-5 w-5 text-success" />
                      </div>
                      <div className="text-lg font-semibold text-success tabular-nums">
                        {formatCurrency(result.estimatedSavings)}
                      </div>
                      <div className="text-xs text-neutral-600">Monthly savings</div>
                    </div>

                    <div className="text-center p-4 bg-neutral-50 rounded-lg">
                      <div className="flex justify-center mb-2">
                        <TrendingDown className="h-5 w-5 text-accent" />
                      </div>
                      <div className="text-lg font-semibold text-accent tabular-nums">
                        {result.comparedToInsurance}%
                      </div>
                      <div className="text-xs text-neutral-600">Less than insurance</div>
                    </div>

                    <div className="text-center p-4 bg-neutral-50 rounded-lg">
                      <div className="flex justify-center mb-2">
                        <Users className="h-5 w-5 text-primary" />
                      </div>
                      <div className="text-lg font-semibold text-primary tabular-nums">
                        {formatCurrency(result.annualIncident)}
                      </div>
                      <div className="text-xs text-neutral-600">Annual incident</div>
                    </div>
                  </div>

                  <Button 
                    size="lg" 
                    className="w-full inline-flex items-center justify-center px-8 py-4 bg-gradient-to-r from-blue-600 to-cyan-600 text-white font-semibold rounded-xl hover:from-blue-700 hover:to-cyan-700 transition-all duration-300 shadow-lg hover:shadow-xl hover:scale-105"
                    
                    trackingName="Get Quote from Calculator"
                    trackingLocation="calculator"
                  >
                    Get My Personalized Quote
                  </Button>

                  <p className="text-xs text-neutral-500 text-center">
                    * Estimates based on typical sharing amounts. Actual costs may vary based on specific circumstances and sharing guidelines.
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </section>
  );
};

export { CostEstimator };