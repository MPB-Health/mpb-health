import React, { useState } from 'react';
import { ArrowRight, ArrowLeft, Check, User, Users, DollarSign, MapPin } from 'lucide-react';
import { cn } from '../../lib/utils';
import { trackFormInteraction, trackQuoteRequest } from '../../lib/conversionTracking';

interface FormData {
  // Step 1: Household
  householdType: 'individual' | 'couple' | 'family' | '';
  dependentsCount: number;

  // Step 2: Demographics
  primaryAge: number | '';
  spouseAge: number | '';
  state: string;
  zipCode: string;

  // Step 3: Health
  primaryTobacco: boolean;
  spouseTobacco: boolean;
  preexistingConditions: boolean;

  // Step 4: Contact
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  referralSource: string;
}

const FORM_ID = 'multi-step-quote';

export const MultiStepQuoteForm: React.FC = () => {
  const [currentStep, setCurrentStep] = useState(1);
  const [formData, setFormData] = useState<FormData>({
    householdType: '',
    dependentsCount: 0,
    primaryAge: '',
    spouseAge: '',
    state: '',
    zipCode: '',
    primaryTobacco: false,
    spouseTobacco: false,
    preexistingConditions: false,
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    referralSource: '',
  });

  const totalSteps = 4;

  React.useEffect(() => {
    trackFormInteraction(FORM_ID, 'start');
  }, []);

  const updateField = (field: keyof FormData, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const nextStep = () => {
    if (currentStep < totalSteps) {
      setCurrentStep(prev => prev + 1);
    }
  };

  const prevStep = () => {
    if (currentStep > 1) {
      setCurrentStep(prev => prev - 1);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await trackFormInteraction(FORM_ID, 'submit', formData);
    await trackQuoteRequest(
      'quote',
      formData.householdType,
      undefined
    );
    console.log('Form submitted:', formData);
  };

  const isStepValid = (): boolean => {
    switch (currentStep) {
      case 1:
        return formData.householdType !== '';
      case 2:
        return formData.primaryAge !== '' && formData.state !== '' && formData.zipCode.length === 5;
      case 3:
        return true;
      case 4:
        return formData.firstName !== '' && formData.email !== '' && formData.phone !== '';
      default:
        return false;
    }
  };

  const renderStep1 = () => (
    <div className="space-y-6 animate-fade-in">
      <div className="text-center mb-8">
        <Users className="h-12 w-12 text-blue-600 mx-auto mb-4" />
        <h3 className="text-2xl font-bold text-neutral-900 mb-2">
          Who needs coverage?
        </h3>
        <p className="text-neutral-600">
          Select your household type to get started
        </p>
      </div>

      <div className="grid gap-4">
        {[
          { value: 'individual', label: 'Just Me', icon: User },
          { value: 'couple', label: 'Me + Spouse', icon: Users },
          { value: 'family', label: 'Me + Family', icon: Users },
        ].map((option) => {
          const Icon = option.icon;
          return (
            <button
              key={option.value}
              type="button"
              onClick={() => updateField('householdType', option.value)}
              className={cn(
                'flex items-center gap-4 p-6 rounded-xl border-2 transition-all duration-300',
                formData.householdType === option.value
                  ? 'border-blue-600 bg-blue-50'
                  : 'border-neutral-200 hover:border-blue-300 hover:bg-neutral-50'
              )}
            >
              <div className={cn(
                'flex-shrink-0 w-12 h-12 rounded-xl flex items-center justify-center',
                formData.householdType === option.value
                  ? 'bg-blue-600'
                  : 'bg-neutral-100'
              )}>
                <Icon className={cn(
                  'h-6 w-6',
                  formData.householdType === option.value ? 'text-white' : 'text-neutral-600'
                )} />
              </div>
              <div className="flex-1 text-left">
                <p className="font-semibold text-neutral-900">{option.label}</p>
              </div>
              {formData.householdType === option.value && (
                <Check className="h-6 w-6 text-blue-600" />
              )}
            </button>
          );
        })}
      </div>

      {formData.householdType === 'family' && (
        <div className="mt-6 p-6 bg-neutral-50 rounded-xl">
          <label className="block text-sm font-semibold text-neutral-700 mb-3">
            How many dependents?
          </label>
          <div className="flex items-center gap-4">
            <button
              type="button"
              onClick={() => updateField('dependentsCount', Math.max(0, formData.dependentsCount - 1))}
              className="w-12 h-12 rounded-lg border-2 border-neutral-300 hover:border-blue-600 hover:bg-blue-50 transition-colors flex items-center justify-center font-bold text-xl"
            >
              −
            </button>
            <div className="flex-1 text-center">
              <span className="text-3xl font-bold text-neutral-900">{formData.dependentsCount}</span>
              <p className="text-sm text-neutral-600 mt-1">children</p>
            </div>
            <button
              type="button"
              onClick={() => updateField('dependentsCount', Math.min(10, formData.dependentsCount + 1))}
              className="w-12 h-12 rounded-lg border-2 border-neutral-300 hover:border-blue-600 hover:bg-blue-50 transition-colors flex items-center justify-center font-bold text-xl"
            >
              +
            </button>
          </div>
        </div>
      )}
    </div>
  );

  const renderStep2 = () => (
    <div className="space-y-6 animate-fade-in">
      <div className="text-center mb-8">
        <MapPin className="h-12 w-12 text-blue-600 mx-auto mb-4" />
        <h3 className="text-2xl font-bold text-neutral-900 mb-2">
          Tell us about yourself
        </h3>
        <p className="text-neutral-600">
          Age and location help us calculate accurate rates
        </p>
      </div>

      <div className="grid gap-6">
        <div>
          <label className="block text-sm font-semibold text-neutral-700 mb-2">
            Your Age
          </label>
          <input
            type="number"
            value={formData.primaryAge}
            onChange={(e) => updateField('primaryAge', parseInt(e.target.value) || '')}
            min="18"
            max="64"
            className="w-full px-4 py-3 border-2 border-neutral-200 rounded-xl focus:border-blue-600 focus:outline-none transition-colors"
            placeholder="Enter your age"
          />
        </div>

        {(formData.householdType === 'couple' || formData.householdType === 'family') && (
          <div>
            <label className="block text-sm font-semibold text-neutral-700 mb-2">
              Spouse's Age
            </label>
            <input
              type="number"
              value={formData.spouseAge}
              onChange={(e) => updateField('spouseAge', parseInt(e.target.value) || '')}
              min="18"
              max="64"
              className="w-full px-4 py-3 border-2 border-neutral-200 rounded-xl focus:border-blue-600 focus:outline-none transition-colors"
              placeholder="Enter spouse's age"
            />
          </div>
        )}

        <div>
          <label className="block text-sm font-semibold text-neutral-700 mb-2">
            State
          </label>
          <select
            value={formData.state}
            onChange={(e) => updateField('state', e.target.value)}
            className="w-full px-4 py-3 border-2 border-neutral-200 rounded-xl focus:border-blue-600 focus:outline-none transition-colors"
          >
            <option value="">Select your state</option>
            <option value="FL">Florida</option>
            <option value="TX">Texas</option>
            <option value="CA">California</option>
            {/* Add all states */}
          </select>
        </div>

        <div>
          <label className="block text-sm font-semibold text-neutral-700 mb-2">
            ZIP Code
          </label>
          <input
            type="text"
            value={formData.zipCode}
            onChange={(e) => updateField('zipCode', e.target.value)}
            maxLength={5}
            className="w-full px-4 py-3 border-2 border-neutral-200 rounded-xl focus:border-blue-600 focus:outline-none transition-colors"
            placeholder="12345"
          />
        </div>
      </div>
    </div>
  );

  const renderStep3 = () => (
    <div className="space-y-6 animate-fade-in">
      <div className="text-center mb-8">
        <DollarSign className="h-12 w-12 text-blue-600 mx-auto mb-4" />
        <h3 className="text-2xl font-bold text-neutral-900 mb-2">
          Health Information
        </h3>
        <p className="text-neutral-600">
          This helps us provide accurate pricing
        </p>
      </div>

      <div className="space-y-4">
        <div className="p-6 bg-neutral-50 rounded-xl">
          <label className="flex items-center gap-3 cursor-pointer">
            <input
              type="checkbox"
              checked={formData.primaryTobacco}
              onChange={(e) => updateField('primaryTobacco', e.target.checked)}
              className="w-5 h-5 text-blue-600 rounded border-2 border-neutral-300 focus:ring-blue-500"
            />
            <span className="text-sm font-medium text-neutral-900">
              Any tobacco users
            </span>
          </label>
        </div>

        <div className="p-6 bg-neutral-50 rounded-xl">
          <label className="flex items-center gap-3 cursor-pointer">
            <input
              type="checkbox"
              checked={formData.preexistingConditions}
              onChange={(e) => updateField('preexistingConditions', e.target.checked)}
              className="w-5 h-5 text-blue-600 rounded border-2 border-neutral-300 focus:ring-blue-500"
            />
            <span className="text-sm font-medium text-neutral-900">
              I have pre-membership conditions
            </span>
          </label>
          <p className="text-xs text-neutral-600 mt-2 ml-8">
            Don't worry - this won't disqualify you. It helps us recommend the best plan.
          </p>
        </div>
      </div>
    </div>
  );

  const renderStep4 = () => (
    <div className="space-y-6 animate-fade-in">
      <div className="text-center mb-8">
        <User className="h-12 w-12 text-blue-600 mx-auto mb-4" />
        <h3 className="text-2xl font-bold text-neutral-900 mb-2">
          Almost Done!
        </h3>
        <p className="text-neutral-600">
          Get your personalized quote sent directly to you
        </p>
      </div>

      <div className="grid gap-4">
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-semibold text-neutral-700 mb-2">
              First Name
            </label>
            <input
              type="text"
              value={formData.firstName}
              onChange={(e) => updateField('firstName', e.target.value)}
              className="w-full px-4 py-3 border-2 border-neutral-200 rounded-xl focus:border-blue-600 focus:outline-none transition-colors"
              placeholder="John"
            />
          </div>
          <div>
            <label className="block text-sm font-semibold text-neutral-700 mb-2">
              Last Name
            </label>
            <input
              type="text"
              value={formData.lastName}
              onChange={(e) => updateField('lastName', e.target.value)}
              className="w-full px-4 py-3 border-2 border-neutral-200 rounded-xl focus:border-blue-600 focus:outline-none transition-colors"
              placeholder="Doe"
            />
          </div>
        </div>

        <div>
          <label className="block text-sm font-semibold text-neutral-700 mb-2">
            Email
          </label>
          <input
            type="email"
            value={formData.email}
            onChange={(e) => updateField('email', e.target.value)}
            className="w-full px-4 py-3 border-2 border-neutral-200 rounded-xl focus:border-blue-600 focus:outline-none transition-colors"
            placeholder="john@example.com"
          />
        </div>

        <div>
          <label className="block text-sm font-semibold text-neutral-700 mb-2">
            Phone
          </label>
          <input
            type="tel"
            value={formData.phone}
            onChange={(e) => updateField('phone', e.target.value)}
            className="w-full px-4 py-3 border-2 border-neutral-200 rounded-xl focus:border-blue-600 focus:outline-none transition-colors"
            placeholder="(555) 123-4567"
          />
        </div>

        <div>
          <label className="block text-sm font-semibold text-neutral-700 mb-2">
            How did you hear about us?
          </label>
          <select
            value={formData.referralSource}
            onChange={(e) => updateField('referralSource', e.target.value)}
            className="w-full px-4 py-3 border-2 border-neutral-200 rounded-xl focus:border-blue-600 focus:outline-none transition-colors"
          >
            <option value="">Select an option</option>
            <option value="search_engine">Search Engine (e.g. Google, Bing)</option>
            <option value="word_of_mouth">Word of mouth</option>
            <option value="social_media">Social Media</option>
            <option value="referral_program">Referral program (Through a referral link or Healthcare Agent)</option>
            <option value="blog_or_article">Blog or online article</option>
            <option value="print_media">Print media</option>
            <option value="event_or_tradeshow">Event or tradeshow</option>
            <option value="other">Other</option>
          </select>
        </div>
      </div>

      <div className="p-4 bg-blue-50 border border-blue-200 rounded-xl">
        <p className="text-sm text-blue-900">
          By submitting, you agree to be contacted about MPB Health plans. Your information is secure and will never be sold.
        </p>
      </div>
    </div>
  );

  return (
    <div className="max-w-2xl mx-auto">
      {/* Progress Bar */}
      <div className="mb-8">
        <div className="flex items-center justify-between mb-2">
          <span className="text-sm font-semibold text-neutral-600">
            Step {currentStep} of {totalSteps}
          </span>
          <span className="text-sm font-semibold text-blue-600">
            {Math.round((currentStep / totalSteps) * 100)}% Complete
          </span>
        </div>
        <div className="w-full bg-neutral-200 rounded-full h-2">
          <div
            className="bg-gradient-to-r from-blue-600 to-cyan-600 h-2 rounded-full transition-all duration-500"
            style={{ width: `${(currentStep / totalSteps) * 100}%` }}
          ></div>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="bg-white rounded-2xl shadow-xl p-8 border border-neutral-200">
        {currentStep === 1 && renderStep1()}
        {currentStep === 2 && renderStep2()}
        {currentStep === 3 && renderStep3()}
        {currentStep === 4 && renderStep4()}

        {/* Navigation Buttons */}
        <div className="flex items-center gap-4 mt-8 pt-8 border-t border-neutral-200">
          {currentStep > 1 && (
            <button
              type="button"
              onClick={prevStep}
              className="flex items-center gap-2 px-6 py-3 border-2 border-neutral-300 text-neutral-700 font-semibold rounded-xl hover:bg-neutral-50 transition-all duration-300"
            >
              <ArrowLeft className="h-5 w-5" />
              Back
            </button>
          )}

          {currentStep < totalSteps ? (
            <button
              type="button"
              onClick={nextStep}
              disabled={!isStepValid()}
              className={cn(
                'flex-1 flex items-center justify-center gap-2 px-6 py-4 font-bold rounded-xl transition-all duration-300',
                isStepValid()
                  ? 'bg-gradient-to-r from-blue-600 to-cyan-600 text-white hover:from-blue-700 hover:to-cyan-700 shadow-lg hover:shadow-xl'
                  : 'bg-neutral-300 text-neutral-500 cursor-not-allowed'
              )}
            >
              Continue
              <ArrowRight className="h-5 w-5" />
            </button>
          ) : (
            <button
              type="submit"
              disabled={!isStepValid()}
              className={cn(
                'flex-1 flex items-center justify-center gap-2 px-6 py-4 font-bold rounded-xl transition-all duration-300',
                isStepValid()
                  ? 'bg-gradient-to-r from-green-600 to-emerald-600 text-white hover:from-green-700 hover:to-emerald-700 shadow-lg hover:shadow-xl'
                  : 'bg-neutral-300 text-neutral-500 cursor-not-allowed'
              )}
            >
              Get My Quote
              <Check className="h-5 w-5" />
            </button>
          )}
        </div>
      </form>
    </div>
  );
};
