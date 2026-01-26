import React, { useState } from 'react';
import { ArrowRight, ArrowLeft, Check } from 'lucide-react';
import { Card, CardHeader, CardTitle, CardContent } from '../ui/Card';
import { Button } from '../ui/Button';
import { Input } from '../ui/Input';
import { Select } from '../ui/Select';
import { trackFormStep } from '../../lib/analytics';
import { typography } from '../../lib/typography';
import { sendLeadNotification } from '../../lib/emailService';

interface FormData {
  // Step 1: Contact Info
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  
  // Step 2: Preferences
  householdSize: string;
  currentInsurance: string;
  monthlyPremium: string;
  membershipLevel: string;
  
  // Step 3: Additional Info
  zipCode: string;
  primaryConcern: string;
  contactPreference: string;
  referralSource: string;
}

const initialFormData: FormData = {
  firstName: '',
  lastName: '',
  email: '',
  phone: '',
  householdSize: '',
  currentInsurance: '',
  monthlyPremium: '',
  membershipLevel: '',
  zipCode: '',
  primaryConcern: '',
  contactPreference: 'phone',
  referralSource: '',
};

interface LeadFormProps {
  onSubmit?: (data: FormData) => void;
  className?: string;
}

const LeadForm: React.FC<LeadFormProps> = ({ onSubmit, className }) => {
  const [currentStep, setCurrentStep] = useState(1);
  const [formData, setFormData] = useState<FormData>(initialFormData);
  const [errors, setErrors] = useState<Partial<FormData>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  const totalSteps = 3;

  const updateFormData = (field: keyof FormData, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }));
    }
  };

  const validateStep = (step: number): boolean => {
    const newErrors: Partial<FormData> = {};

    if (step === 1) {
      if (!formData.firstName.trim()) newErrors.firstName = 'First name is required';
      if (!formData.lastName.trim()) newErrors.lastName = 'Last name is required';
      if (!formData.email.trim()) newErrors.email = 'Email is required';
      else if (!/\S+@\S+\.\S+/.test(formData.email)) newErrors.email = 'Email is invalid';
      if (!formData.phone.trim()) newErrors.phone = 'Phone number is required';
    }

    if (step === 2) {
      if (!formData.householdSize) newErrors.householdSize = 'Household size is required';
      if (!formData.currentInsurance) newErrors.currentInsurance = 'Please select current insurance status';
      if (!formData.membershipLevel) newErrors.membershipLevel = 'Please select preferred membership';
    }

    if (step === 3) {
      if (!formData.zipCode.trim()) newErrors.zipCode = 'ZIP code is required';
      if (!formData.primaryConcern) newErrors.primaryConcern = 'Please select your primary concern';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const nextStep = () => {
    if (validateStep(currentStep)) {
      const nextStepNumber = currentStep + 1;
      setCurrentStep(nextStepNumber);
      trackFormStep('lead_form', nextStepNumber, totalSteps);
    }
  };

  const prevStep = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateStep(currentStep)) return;

    setIsSubmitting(true);

    try {
      const { supabase } = await import('../../lib/supabase');

      const { error } = await supabase
        .from('lead_submissions')
        .insert({
          first_name: formData.firstName,
          last_name: formData.lastName,
          email: formData.email,
          phone: formData.phone,
          household_size: parseInt(formData.householdSize || '1'),
          current_insurance: formData.currentInsurance,
          monthly_premium: formData.monthlyPremium,
          coverage_preference: formData.membershipLevel,
          zip_code: formData.zipCode,
          primary_concern: formData.primaryConcern,
          contact_preference: formData.contactPreference,
          referral_source: formData.referralSource || null,
          source: 'website_lead_form',
          submitted_at: new Date().toISOString()
        })
        .select()
        .single();

      if (error) {
        console.error('Supabase submission error:', error);
        throw error;
      }

      const emailResult = await sendLeadNotification({
        name: `${formData.firstName} ${formData.lastName}`,
        email: formData.email,
        phone: formData.phone,
        householdType: formData.householdSize ? `${formData.householdSize} ${parseInt(formData.householdSize) === 1 ? 'person' : 'people'}` : undefined,
        source: 'Website Lead Form'
      });

      if (!emailResult.success) {
        console.warn('Lead notification email failed:', emailResult.error);
      }

      trackFormStep('lead_form', 'completed', totalSteps);

      if (onSubmit) {
        onSubmit(formData);
      }

      setCurrentStep(4);
    } catch (error) {
      console.error('Form submission error:', error);
      alert('There was an issue submitting your form. Please try again or call us at (855) 816-4650.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const renderStep1 = () => (
    <div className="space-y-4">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <Input
          label="First Name"
          value={formData.firstName}
          onChange={(e) => updateFormData('firstName', e.target.value)}
          error={errors.firstName}
          placeholder="Enter your first name"
        />
        <Input
          label="Last Name"
          value={formData.lastName}
          onChange={(e) => updateFormData('lastName', e.target.value)}
          error={errors.lastName}
          placeholder="Enter your last name"
        />
      </div>
      <Input
        label="Email Address"
        type="email"
        value={formData.email}
        onChange={(e) => updateFormData('email', e.target.value)}
        error={errors.email}
        placeholder="your@email.com"
      />
      <Input
        label="Phone Number"
        type="tel"
        value={formData.phone}
        onChange={(e) => updateFormData('phone', e.target.value)}
        error={errors.phone}
        placeholder="(555) 123-4567"
      />
    </div>
  );

  const renderStep2 = () => (
    <div className="space-y-4">
      <Select
        label="Household Size"
        value={formData.householdSize}
        onChange={(e) => updateFormData('householdSize', e.target.value)}
        error={errors.householdSize}
      >
        <option value="">Select household size</option>
        <option value="1">1 person</option>
        <option value="2">2 people</option>
        <option value="3">3 people</option>
        <option value="4">4 people</option>
        <option value="5">5+ people</option>
      </Select>

      <Select
        label="Current Insurance Status"
        value={formData.currentInsurance}
        onChange={(e) => updateFormData('currentInsurance', e.target.value)}
        error={errors.currentInsurance}
      >
        <option value="">Select current status</option>
        <option value="employer">Employer-sponsored insurance</option>
        <option value="individual">Individual/marketplace insurance</option>
        <option value="medicaid">Medicaid/Medicare</option>
        <option value="none">No current membership</option>
        <option value="other">Other</option>
      </Select>

      <Input
        label="Current Monthly Premium (if any)"
        value={formData.monthlyPremium}
        onChange={(e) => updateFormData('monthlyPremium', e.target.value)}
        placeholder="$500"
        helperText="Enter 0 if no current premium"
      />

      <Select
        label="Preferred Membership Level"
        value={formData.membershipLevel}
        onChange={(e) => updateFormData('membershipLevel', e.target.value)}
        error={errors.membershipLevel}
      >
        <option value="">Select membership level</option>
        <option value="care-plus">Care+ - Comprehensive sharing</option>
        <option value="direct">Direct - Lower monthly costs</option>
        <option value="secure-hsa">Secure HSA - HSA compatible</option>
        <option value="unsure">Not sure yet</option>
      </Select>
    </div>
  );

  const renderStep3 = () => (
    <div className="space-y-4">
      <Input
        label="ZIP Code"
        value={formData.zipCode}
        onChange={(e) => updateFormData('zipCode', e.target.value)}
        error={errors.zipCode}
        placeholder="12345"
        maxLength={5}
      />

      <Select
        label="Primary Healthcare Concern"
        value={formData.primaryConcern}
        onChange={(e) => updateFormData('primaryConcern', e.target.value)}
        error={errors.primaryConcern}
      >
        <option value="">Select your main concern</option>
        <option value="cost">Rising healthcare costs</option>
        <option value="network">Network restrictions</option>
        <option value="deductibles">High deductibles</option>
        <option value="membership">Limited membership</option>
        <option value="service">Poor customer service</option>
        <option value="other">Other</option>
      </Select>

      <Select
        label="Preferred Contact Method"
        value={formData.contactPreference}
        onChange={(e) => updateFormData('contactPreference', e.target.value)}
      >
        <option value="phone">Phone call</option>
        <option value="email">Email</option>
        <option value="text">Text message</option>
      </Select>

      <Select
        label="How did you hear about us?"
        value={formData.referralSource}
        onChange={(e) => updateFormData('referralSource', e.target.value)}
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
      </Select>
    </div>
  );

  const renderSuccess = () => (
    <div className="text-center py-8">
      <div className="w-16 h-16 bg-success/10 rounded-full flex items-center justify-center mx-auto mb-6">
        <Check className="h-8 w-8 text-success" />
      </div>
      <h3 className={`${typography.headings.h3.card} text-neutral-900 mb-4`}>
        Thank You!
      </h3>
      <p className="text-neutral-600 mb-6">
        We've received your information and a member specialist will contact you within 24 hours to discuss your personalized health sharing options.
      </p>
      <div className="bg-neutral-50 rounded-lg p-6 text-left">
        <h4 className="font-semibold text-neutral-900 mb-3">What happens next:</h4>
        <ul className="space-y-2 text-sm text-neutral-600">
          <li>• A specialist will call you at {formData.phone}</li>
          <li>• We'll discuss your specific needs and answer questions</li>
          <li>• You'll receive a personalized quote within 24 hours</li>
          <li>• No obligation - take time to decide what's right for you</li>
        </ul>
      </div>
    </div>
  );

  if (currentStep === 4) {
    return (
      <Card className={className}>
        <CardContent>
          {renderSuccess()}
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className={className}>
      <CardHeader>
        <div className="flex items-center justify-between mb-4">
          <CardTitle>Get Your Free Quote</CardTitle>
          <span className="text-sm text-neutral-500">
            Step {currentStep} of {totalSteps}
          </span>
        </div>
        
        {/* Progress bar */}
        <div className="w-full bg-neutral-200 rounded-full h-2">
          <div 
            className="bg-primary h-2 rounded-full transition-all duration-300"
            style={{ width: `${(currentStep / totalSteps) * 100}%` }}
          />
        </div>
      </CardHeader>

      <CardContent>
        <form onSubmit={handleSubmit}>
          {currentStep === 1 && renderStep1()}
          {currentStep === 2 && renderStep2()}
          {currentStep === 3 && renderStep3()}

          <div className="flex justify-between mt-8">
            <Button
              type="button"
              variant="ghost"
              onClick={prevStep}
              disabled={currentStep === 1}
              className={currentStep === 1 ? 'invisible' : ''}
            >
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back
            </Button>

            {currentStep < totalSteps ? (
              <Button type="button" onClick={nextStep}>
                Next
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            ) : (
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting ? 'Submitting...' : 'Get My Quote'}
                {!isSubmitting && <ArrowRight className="ml-2 h-4 w-4" />}
              </Button>
            )}
          </div>
        </form>
      </CardContent>
    </Card>
  );
};

export { LeadForm };