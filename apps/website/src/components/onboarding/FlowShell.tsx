import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '../ui/button';
import { Input } from '../ui/Input';
import { ProgressDots } from './ProgressDots';
import { TypingIndicator } from './TypingIndicator';
import { ChipButtons, MultiSelectChips, AgeInputs } from './AnswerControls';
import { PlanResult } from './PlanResult';
import { recommendPlans } from '../../lib/onboarding/rules';
import { OnboardingAnswers, Audience, Priority, Usage, IUAComfort, Extra } from '../../lib/onboarding/types';
import { supabase } from '../../lib/supabase';
import { leadSubmissionService } from '../../lib/leadSubmissionService';
import { ArrowLeft, ArrowRight } from 'lucide-react';

declare global {
  interface Window {
    dataLayer?: Array<Record<string, unknown>>;
  }
}

const TOTAL_STEPS = 8;

export function FlowShell() {
  const [step, setStep] = useState(0);
  const [answers, setAnswers] = useState<OnboardingAnswers>({
    audience: undefined,
    ages: [0],
    extras: [],
  });
  const [showTyping, setShowTyping] = useState(false);
  const [sessionId] = useState(() => crypto.randomUUID());
  const [recommendations, setRecommendations] = useState<any[] | null>(null);

  const updateAnswer = <K extends keyof OnboardingAnswers>(key: K, value: OnboardingAnswers[K]) => {
    setAnswers(prev => ({ ...prev, [key]: value }));
  };

  const next = () => {
    setShowTyping(true);
    setTimeout(() => {
      setShowTyping(false);
      setStep(s => Math.min(s + 1, TOTAL_STEPS));
    }, 500);

    window.dataLayer?.push({
      event: 'ob_answer',
      key: Object.keys(answers)[step],
      value: Object.values(answers)[step],
    });
  };

  const back = () => {
    setStep(s => Math.max(s - 1, 0));
  };

  const handleComplete = async () => {
    const reco = recommendPlans(answers);
    setRecommendations(reco);

    try {
      await supabase.from('onboarding_responses').insert({
        session_id: sessionId,
        audience: answers.audience,
        zip_code: answers.zipCode,
        ages: answers.ages,
        priority: answers.priority,
        usage: answers.usage,
        iua_comfort: answers.iuaComfort,
        extras: answers.extras,
        pre_existing_awareness: answers.preExistingAwareness,
        contact_opt_in: answers.contactOptIn,
        contact_email: answers.contactEmail,
        contact_phone: answers.contactPhone,
        recommended_plan_primary: reco[0]?.planId,
        recommended_plan_alternate: reco[1]?.planId,
        completed_at: new Date().toISOString(),
      });

      window.dataLayer?.push({
        event: 'ob_reco_shown',
        primaryPlan: reco[0]?.planId,
        altPlan: reco[1]?.planId,
        score: reco[0]?.score,
      });

      // Submit to CRM if user opted in for contact
      if (answers.contactOptIn && (answers.contactEmail || answers.contactPhone)) {
        try {
          const leadResult = await leadSubmissionService.submitLead({
            firstName: answers.contactEmail?.split('@')[0] || 'Quick Start',
            lastName: 'Lead',
            email: answers.contactEmail || '',
            phone: answers.contactPhone || '',
            zipCode: answers.zipCode,
            sourcePage: window.location.pathname,
            sourceCTA: 'quick-start-plan-finder',
            formData: {
              audience: answers.audience,
              ages: answers.ages,
              priority: answers.priority,
              usage: answers.usage,
              iua_comfort: answers.iuaComfort,
              extras: answers.extras,
              pre_existing_awareness: answers.preExistingAwareness,
              recommended_plan_primary: reco[0]?.planId,
              recommended_plan_alternate: reco[1]?.planId,
              form_type: 'quick_start_plan_finder',
            },
          });
          if (!leadResult.success) {
            console.error('Lead submission failed:', leadResult.error);
          }
        } catch (crmError) {
          console.error('Error submitting to CRM:', crmError);
        }
      }
    } catch (error) {
      console.error('Error saving onboarding response:', error);
    }
  };

  useEffect(() => {
    window.dataLayer?.push({
      event: 'ob_start',
      advisor: 'MPB Health Team',
    });
  }, []);

  if (recommendations) {
    return (
      <div className="max-w-3xl mx-auto px-4 py-8">
        <PlanResult recommendations={recommendations} answers={answers} />
      </div>
    );
  }

  return (
    <section className="max-w-4xl mx-auto px-4 py-8">
      <div className="rounded-2xl border border-gray-200 bg-white shadow-xl overflow-hidden">
        <header className="bg-gradient-to-r from-blue-50 to-teal-50 px-6 py-5 border-b border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs uppercase text-gray-600 font-semibold tracking-wide">Health Advisor</p>
              <h3 className="text-lg font-bold text-gray-900">MPB Health Team</h3>
            </div>
            <div className="flex items-center gap-4">
              <ProgressDots current={step} total={TOTAL_STEPS} />
              <a
                href="tel:8558164650"
                className="text-xs text-gray-600 hover:text-blue-600 transition-colors whitespace-nowrap hidden sm:block"
              >
                Call Now: (855) 816-4650
              </a>
            </div>
          </div>
        </header>

        <div className="p-6 sm:p-8 min-h-[400px]">
          <AnimatePresence mode="wait">
            {showTyping ? (
              <motion.div
                key="typing"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="flex justify-start"
              >
                <TypingIndicator />
              </motion.div>
            ) : (
              <motion.div
                key={step}
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                transition={{ duration: 0.3 }}
              >
                {step === 0 && (
                  <div role="group" aria-labelledby="q0">
                    <h4 id="q0" className="text-2xl font-bold text-gray-900 mb-6">
                      Who's enrolling?
                    </h4>
                    <ChipButtons
                      options={[
                        { value: 'individual', label: 'Individual', icon: '👤', description: 'Just me' },
                        { value: 'family', label: 'Family', icon: '👨‍👩‍👧‍👦', description: 'Me and my family' },
                        { value: 'employer', label: 'Employer/Group', icon: '🏢', description: 'Small business or organization' },
                      ]}
                      selected={answers.audience}
                      onSelect={(val) => {
                        updateAnswer('audience', val as Audience);
                        next();
                      }}
                    />
                  </div>
                )}

                {step === 1 && (
                  <div role="group" aria-labelledby="q1">
                    <h4 id="q1" className="text-2xl font-bold text-gray-900 mb-6">
                      Tell us about your household
                    </h4>
                    <div className="space-y-4">
                      <AgeInputs
                        ages={answers.ages || [0]}
                        onAgesChange={(ages) => updateAnswer('ages', ages)}
                        householdType={answers.audience || 'individual'}
                      />
                      <Input
                        label="ZIP Code"
                        type="text"
                        maxLength={5}
                        value={answers.zipCode || ''}
                        onChange={(e) => updateAnswer('zipCode', e.target.value)}
                        placeholder="12345"
                      />
                    </div>
                  </div>
                )}

                {step === 2 && (
                  <div role="group" aria-labelledby="q2">
                    <h4 id="q2" className="text-2xl font-bold text-gray-900 mb-6">
                      What's your main priority?
                    </h4>
                    <ChipButtons
                      options={[
                        { value: 'cost', label: 'Lowest monthly cost', description: 'Keep it affordable' },
                        { value: 'balanced', label: 'Balanced coverage', description: 'Good mix of cost and benefits' },
                        { value: 'hsa', label: 'HSA compatible', description: 'Tax-advantaged savings' },
                        { value: 'coverage', label: 'Broadest coverage', description: 'Maximum protection' },
                      ]}
                      selected={answers.priority}
                      onSelect={(val) => {
                        updateAnswer('priority', val as Priority);
                        next();
                      }}
                    />
                  </div>
                )}

                {step === 3 && (
                  <div role="group" aria-labelledby="q3">
                    <h4 id="q3" className="text-2xl font-bold text-gray-900 mb-6">
                      How do you prefer to get care?
                    </h4>
                    <ChipButtons
                      options={[
                        { value: 'virtual', label: 'Mostly virtual', description: 'Telemedicine and online visits' },
                        { value: 'mixed', label: 'Mix of both', description: 'Virtual and in-person' },
                        { value: 'inperson', label: 'Mostly in-person', description: 'Traditional doctor visits' },
                      ]}
                      selected={answers.usage}
                      onSelect={(val) => {
                        updateAnswer('usage', val as Usage);
                        next();
                      }}
                    />
                  </div>
                )}

                {step === 4 && (
                  <div role="group" aria-labelledby="q4">
                    <h4 id="q4" className="text-2xl font-bold text-gray-900 mb-6">
                      How do you feel about your Initial Unshareable Amount (IUA)?
                    </h4>
                    <p className="text-sm text-gray-600 mb-4">
                      IUA is similar to a deductible. Higher IUA means lower monthly costs.
                    </p>
                    <ChipButtons
                      options={[
                        { value: 'higher', label: 'Higher IUA', description: 'Lower monthly cost' },
                        { value: 'lower', label: 'Lower IUA', description: 'More protection upfront' },
                      ]}
                      selected={answers.iuaComfort}
                      onSelect={(val) => {
                        updateAnswer('iuaComfort', val as IUAComfort);
                        next();
                      }}
                    />
                  </div>
                )}

                {step === 5 && (
                  <div role="group" aria-labelledby="q5">
                    <h4 id="q5" className="text-2xl font-bold text-gray-900 mb-6">
                      Any special coverage needs?
                    </h4>
                    <p className="text-sm text-gray-600 mb-4">Select all that apply</p>
                    <MultiSelectChips
                      options={[
                        { value: 'maternity', label: 'Maternity coverage' },
                        { value: 'worldwide', label: 'Worldwide travel protection' },
                        { value: 'networkFreedom', label: 'Complete provider freedom' },
                      ]}
                      selected={answers.extras || []}
                      onToggle={(val) => {
                        const current = answers.extras || [];
                        const updated = current.includes(val as Extra)
                          ? current.filter(v => v !== val)
                          : [...current, val as Extra];
                        updateAnswer('extras', updated);
                      }}
                    />
                  </div>
                )}

                {step === 6 && (
                  <div role="group" aria-labelledby="q6">
                    <h4 id="q6" className="text-2xl font-bold text-gray-900 mb-6">
                      Do you or anyone in your household have pre-membership conditions?
                    </h4>
                    <p className="text-sm text-gray-600 mb-4">
                      Don't worry - this won't affect your eligibility. We just want to provide accurate information.
                    </p>
                    <ChipButtons
                      options={[
                        { value: 'yes', label: 'Yes' },
                        { value: 'no', label: 'No' },
                        { value: 'unsure', label: 'Not sure' },
                      ]}
                      selected={answers.preExistingAwareness ? 'yes' : 'no'}
                      onSelect={(val) => {
                        updateAnswer('preExistingAwareness', val === 'yes');
                        next();
                      }}
                    />
                  </div>
                )}

                {step === 7 && (
                  <div role="group" aria-labelledby="q7">
                    <h4 id="q7" className="text-2xl font-bold text-gray-900 mb-6">
                      Want us to follow up with personalized guidance?
                    </h4>
                    <p className="text-sm text-gray-600 mb-4">Optional - helps us serve you better</p>
                    <div className="space-y-4">
                      <div className="flex items-center gap-3">
                        <input
                          type="checkbox"
                          id="contactOptIn"
                          checked={answers.contactOptIn || false}
                          onChange={(e) => updateAnswer('contactOptIn', e.target.checked)}
                          className="h-4 w-4 text-blue-600 rounded"
                        />
                        <label htmlFor="contactOptIn" className="text-sm text-gray-700">
                          Yes, I'd like personalized follow-up
                        </label>
                      </div>

                      {answers.contactOptIn && (
                        <motion.div
                          initial={{ opacity: 0, height: 0 }}
                          animate={{ opacity: 1, height: 'auto' }}
                          className="space-y-3"
                        >
                          <Input
                            label="Email"
                            type="email"
                            value={answers.contactEmail || ''}
                            onChange={(e) => updateAnswer('contactEmail', e.target.value)}
                            placeholder="your@email.com"
                          />
                          <Input
                            label="Phone"
                            type="tel"
                            value={answers.contactPhone || ''}
                            onChange={(e) => updateAnswer('contactPhone', e.target.value)}
                            placeholder="(555) 123-4567"
                          />
                        </motion.div>
                      )}
                    </div>
                  </div>
                )}
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {!showTyping && (
          <footer className="bg-gray-50 px-6 py-4 border-t border-gray-200 flex justify-between items-center">
            <Button
              type="button"
              variant="ghost"
              onClick={back}
              disabled={step === 0}
              className={step === 0 ? 'invisible' : ''}
            >
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back
            </Button>

            {step < TOTAL_STEPS - 1 && step !== 0 && step !== 2 && step !== 3 && step !== 4 && step !== 6 ? (
              <Button type="button" onClick={next}>
                Next
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            ) : step === TOTAL_STEPS - 1 ? (
              <Button
                type="button"
                onClick={handleComplete}
                className="bg-gradient-to-r from-blue-600 to-teal-600 hover:from-blue-700 hover:to-teal-700"
              >
                See My Recommendations
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            ) : (
              <Button type="button" onClick={next} variant="ghost">
                Skip
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            )}
          </footer>
        )}
      </div>
    </section>
  );
}
