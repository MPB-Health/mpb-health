import React from 'react';
import { motion } from 'framer-motion';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/Card';
import { Button } from '../ui/Button';
import { Badge } from '../ui/Badge';
import { Sparkles, Calculator, Phone, CheckCircle2, ArrowRight } from 'lucide-react';
import { PlanRecommendation } from '../../lib/onboarding/types';
import { OnboardingAnswers } from '../../lib/onboarding/types';

interface PlanResultProps {
  recommendations: PlanRecommendation[];
  answers: OnboardingAnswers;
}

export function PlanResult({ recommendations, answers: _answers }: PlanResultProps) {
  const [primary, alternate] = recommendations;

  const handleCalculateRate = () => {
    const calculatorSection = document.getElementById('calculator');
    if (calculatorSection) {
      calculatorSection.scrollIntoView({ behavior: 'smooth' });
    } else {
      // Navigate to the page with the calculator (IndividualsAndFamilies or Plans page)
      window.location.href = '/individuals-and-families#calculator';
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="space-y-6"
    >
      <div className="text-center">
        <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-br from-green-400 to-teal-500 rounded-full mb-4">
          <Sparkles className="h-8 w-8 text-white" />
        </div>
        <h3 className="text-2xl font-bold text-gray-900 mb-2">
          Perfect! We Found Your Match
        </h3>
        <p className="text-gray-600">
          Based on your answers, here are the plans that best fit your needs
        </p>
      </div>

      {primary && (
        <Card className="border-2 border-blue-500 bg-gradient-to-br from-blue-50 to-white shadow-xl">
          <CardHeader className="border-b border-blue-100 bg-gradient-to-r from-blue-50 to-teal-50">
            <div className="flex items-center justify-between">
              <Badge className="bg-blue-600 text-white">Best Match</Badge>
              <Sparkles className="h-5 w-5 text-blue-600" />
            </div>
            <CardTitle className="text-2xl mt-3">{primary.planName}</CardTitle>
          </CardHeader>
          <CardContent className="pt-6">
            <div className="space-y-4">
              <div>
                <h4 className="font-semibold text-gray-900 mb-2">Why this plan?</h4>
                <ul className="space-y-2">
                  {primary.rationale.map((reason, index) => (
                    <li key={index} className="flex items-start gap-2 text-gray-700">
                      <CheckCircle2 className="h-5 w-5 text-blue-600 flex-shrink-0 mt-0.5" />
                      <span>{reason}</span>
                    </li>
                  ))}
                </ul>
              </div>

              <div className="flex flex-col gap-3 pt-4">
                <Button
                  className="w-full bg-gradient-to-r from-blue-600 to-green-600 hover:from-blue-700 hover:to-green-700"
                  onClick={handleCalculateRate}
                >
                  <Calculator className="mr-2 h-4 w-4" />
                  Get Your Quote - {primary.planName}
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {alternate && (
        <Card className="border border-gray-200 shadow-md">
          <CardHeader className="border-b border-gray-100">
            <div className="flex items-center justify-between">
              <Badge variant="outline" className="border-gray-300">Alternative Option</Badge>
            </div>
            <CardTitle className="text-xl mt-2">{alternate.planName}</CardTitle>
          </CardHeader>
          <CardContent className="pt-6">
            <div className="space-y-4">
              <ul className="space-y-2">
                {alternate.rationale.map((reason, index) => (
                  <li key={index} className="flex items-start gap-2 text-sm text-gray-700">
                    <CheckCircle2 className="h-4 w-4 text-gray-600 flex-shrink-0 mt-0.5" />
                    <span>{reason}</span>
                  </li>
                ))}
              </ul>

              <Button
                variant="outline"
                className="w-full border-2 border-blue-600 text-blue-600 hover:bg-gradient-to-r hover:from-blue-600 hover:to-green-600 hover:text-white transition-all duration-300"
                onClick={handleCalculateRate}
              >
                <Calculator className="mr-2 h-4 w-4" />
                Get Your Quote - {alternate.planName}
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      <Card className="bg-gradient-to-br from-gray-50 to-white border-gray-200">
        <CardContent className="py-6">
          <div className="text-center space-y-4">
            <h4 className="font-semibold text-gray-900">Need Help Deciding?</h4>
            <p className="text-sm text-gray-600">
              Speak with a Health Advisor to discuss your options and answer any questions
            </p>
            <Button variant="outline" className="w-full" asChild>
              <a href="tel:8558164650">
                <Phone className="mr-2 h-4 w-4" />
                Call (855) 816-4650
              </a>
            </Button>
          </div>
        </CardContent>
      </Card>

      <div className="text-center">
        <p className="text-xs text-gray-500">
          These recommendations are based on the information you provided. Final pricing and eligibility are determined during enrollment.
        </p>
      </div>
    </motion.div>
  );
}
