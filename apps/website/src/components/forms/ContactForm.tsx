import React, { useState } from 'react';
import { Check } from 'lucide-react';
import { Card, CardHeader, CardTitle, CardContent } from '../ui/Card';
import { Button } from '../ui/button';
import { Input } from '../ui/Input';
import { Select } from '../ui/Select';
import { typography } from '../../lib/typography';
import { sendContactFormNotification } from '../../lib/emailService';

interface ContactFormData {
  firstName: string;
  lastName: string;
  email: string;
  referralSource: string;
  message: string;
}

const initialFormData: ContactFormData = {
  firstName: '',
  lastName: '',
  email: '',
  referralSource: '',
  message: '',
};

interface ContactFormProps {
  onSubmit?: (data: ContactFormData) => void;
  className?: string;
}

const ContactForm: React.FC<ContactFormProps> = ({ onSubmit, className }) => {
  const [formData, setFormData] = useState<ContactFormData>(initialFormData);
  const [errors, setErrors] = useState<Partial<ContactFormData>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  const updateFormData = (field: keyof ContactFormData, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }));
    }
  };

  const validateForm = (): boolean => {
    const newErrors: Partial<ContactFormData> = {};

    if (!formData.firstName.trim()) newErrors.firstName = 'First name is required';
    if (!formData.lastName.trim()) newErrors.lastName = 'Last name is required';
    if (!formData.email.trim()) newErrors.email = 'Email is required';
    else if (!/\S+@\S+\.\S+/.test(formData.email)) newErrors.email = 'Email is invalid';
    if (!formData.message.trim()) newErrors.message = 'Message is required';

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateForm()) return;

    setIsSubmitting(true);
    setSubmitError(null);

    try {
      const emailResult = await sendContactFormNotification({
        name: `${formData.firstName} ${formData.lastName}`,
        email: formData.email,
        message: formData.message,
        source: 'Contact Form',
        referralSource: formData.referralSource || undefined
      });

      if (!emailResult.success) {
        console.error('Failed to send email notification:', emailResult.error);
        setSubmitError('We couldn\'t send your message right now. Please try again or call us at (855) 816-4650.');
        return;
      }

      if (onSubmit) {
        onSubmit(formData);
      }

      setIsSuccess(true);
      setFormData(initialFormData);
    } catch (error) {
      console.error('Form submission error:', error);
      setSubmitError('Something went wrong. Please try again or call us at (855) 816-4650.');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isSuccess) {
    return (
      <Card className={className}>
        <CardContent>
          <div className="text-center py-8">
            <div className="w-16 h-16 bg-success/10 rounded-full flex items-center justify-center mx-auto mb-6">
              <Check className="h-8 w-8 text-success" />
            </div>
            <h3 className={`${typography.headings.h3.card} text-neutral-900 mb-4`}>
              Message Sent!
            </h3>
            <p className="text-neutral-600 mb-6">
              Thank you for contacting us. We'll get back to you within 24 hours.
            </p>
            <Button onClick={() => setIsSuccess(false)}>
              Send Another Message
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle>Contact Us</CardTitle>
      </CardHeader>

      <CardContent>
        {submitError && (
          <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700">
            {submitError}
          </div>
        )}
        <form onSubmit={handleSubmit}>
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
            <div className="space-y-1.5">
              <label className="block text-sm font-medium text-neutral-700">
                Message
              </label>
              <textarea
                value={formData.message}
                onChange={(e) => updateFormData('message', e.target.value)}
                placeholder="How can we help you?"
                rows={5}
                className={`w-full px-4 py-2.5 text-base border rounded-xl transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary ${
                  errors.message
                    ? 'border-error focus:border-error focus:ring-error/20'
                    : 'border-neutral-300'
                }`}
              />
              {errors.message && (
                <p className="text-sm text-error mt-1">{errors.message}</p>
              )}
            </div>
          </div>

          <div className="flex justify-end mt-8">
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? 'Sending...' : 'Send'}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
};

export { ContactForm };
