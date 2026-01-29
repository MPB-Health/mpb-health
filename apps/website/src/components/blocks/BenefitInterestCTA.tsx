import React, { useState } from 'react';
import { CheckCircle2, Loader2 } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { Button } from '../ui/button';
import { Input } from '../ui/Input';
import { Label } from '../ui/Label';

interface BenefitInterestCTAProps {
  benefitType: string;
  benefitName: string;
  gradientFrom: string;
  gradientTo: string;
}

export const BenefitInterestCTA: React.FC<BenefitInterestCTAProps> = ({
  benefitType,
  benefitName,
  gradientFrom,
  gradientTo,
}) => {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError(null);

    try {
      const { error: insertError } = await supabase
        .from('benefit_interest_submissions')
        .insert({
          benefit_type: benefitType,
          user_name: formData.name,
          user_email: formData.email,
          user_phone: formData.phone || null,
          status: 'new',
        });

      if (insertError) throw insertError;

      setIsSuccess(true);
      setFormData({ name: '', email: '', phone: '' });

      setTimeout(() => {
        setIsSuccess(false);
      }, 5000);
    } catch (err) {
      console.error('Error submitting benefit interest:', err);
      setError('Something went wrong. Please try again or call us at (855) 816-4650.');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isSuccess) {
    return (
      <section className={`py-16 bg-gradient-to-r ${gradientFrom} ${gradientTo}`}>
        <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8">
          <div className="bg-white rounded-3xl p-8 md:p-12 shadow-2xl">
            <div className="text-center space-y-4">
              <div className="inline-flex w-16 h-16 bg-green-100 rounded-full items-center justify-center mb-4">
                <CheckCircle2 className="w-10 h-10 text-green-600" />
              </div>
              <h3 className="text-3xl font-bold text-neutral-900">
                Thank You!
              </h3>
              <p className="text-lg text-neutral-600 max-w-xl mx-auto">
                We have received your interest in {benefitName} coverage. One of our benefit specialists will contact you shortly to discuss your options and answer any questions.
              </p>
              <div className="pt-4">
                <p className="text-sm text-neutral-500">
                  Need immediate assistance? Call us at{' '}
                  <a href="tel:8558164650" className="font-semibold text-blue-600 hover:text-blue-700">
                    (855) 816-4650
                  </a>
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>
    );
  }

  return (
    <section className={`py-16 bg-gradient-to-r ${gradientFrom} ${gradientTo}`}>
      <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8">
        <div className="bg-white rounded-3xl p-8 md:p-12 shadow-2xl">
          <div className="text-center mb-8">
            <h3 className="text-3xl md:text-4xl font-bold text-neutral-900 mb-4">
              I want this benefit
            </h3>
            <p className="text-lg text-neutral-600 max-w-2xl mx-auto">
              Get personalized {benefitName} coverage information from one of our licensed benefit specialists. No obligation, just helpful guidance tailored to your needs.
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6 max-w-2xl mx-auto">
            <div className="grid md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <Label htmlFor="name">Full Name *</Label>
                <Input
                  id="name"
                  name="name"
                  type="text"
                  placeholder="John Smith"
                  value={formData.name}
                  onChange={handleInputChange}
                  required
                  disabled={isSubmitting}
                  className="w-full"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="email">Email Address *</Label>
                <Input
                  id="email"
                  name="email"
                  type="email"
                  placeholder="john@example.com"
                  value={formData.email}
                  onChange={handleInputChange}
                  required
                  disabled={isSubmitting}
                  className="w-full"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="phone">Phone Number (Optional)</Label>
              <Input
                id="phone"
                name="phone"
                type="tel"
                placeholder="(555) 123-4567"
                value={formData.phone}
                onChange={handleInputChange}
                disabled={isSubmitting}
                className="w-full"
              />
            </div>

            {error && (
              <div className="p-4 bg-red-50 border border-red-200 rounded-xl">
                <p className="text-sm text-red-800">{error}</p>
              </div>
            )}

            <div className="flex flex-col sm:flex-row gap-4 pt-4">
              <Button
                type="submit"
                size="lg"
                disabled={isSubmitting}
                className="flex-1 bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-700 hover:to-cyan-700 text-white shadow-lg hover:shadow-xl transition-all duration-300"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                    Submitting...
                  </>
                ) : (
                  'Get More Information'
                )}
              </Button>
              <Button
                type="button"
                size="lg"
                variant="outline"
                asChild
                className="flex-1"
              >
                <a href="tel:8558164650">
                  Call (855) 816-4650
                </a>
              </Button>
            </div>

            <p className="text-xs text-center text-neutral-500">
              By submitting this form, you agree to be contacted by MPB Health regarding {benefitName} coverage options. We respect your privacy and will never share your information.
            </p>
          </form>
        </div>
      </div>
    </section>
  );
};
