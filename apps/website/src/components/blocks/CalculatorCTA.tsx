import { Button } from '../ui/Button';
import { Calculator, Info } from 'lucide-react';
import { Card } from '../ui/Card';
import { supabase } from '../../lib/supabase';

interface CalculatorCTAProps {
  onGetRate: () => void;
}

export function CalculatorCTA({ onGetRate }: CalculatorCTAProps) {
  const handleGetRate = async () => {
    const sessionId = sessionStorage.getItem('mpb_session_id') || crypto.randomUUID();
    sessionStorage.setItem('mpb_session_id', sessionId);

    await supabase.from('rate_calculator_views').insert({
      session_id: sessionId,
      source_section: 'main-cta',
      completed: false,
    });

    onGetRate();
  };

  return (
    <section id="rate-calculator" className="py-16 bg-blue-600">
      <div className="mx-auto max-w-5xl px-6 lg:px-8">
        <div className="text-center mb-12">
          <div className="inline-flex w-16 h-16 bg-white/10 rounded-full items-center justify-center mb-6">
            <Calculator className="h-8 w-8 text-white" />
          </div>
          <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">
            Get Your Personalized Rate
          </h2>
          <p className="text-lg text-blue-100 max-w-2xl mx-auto mb-8">
            Your monthly share is based on two simple factors: your Age Band and Initial Unshareable Amount (IUA).
          </p>

          <Button
            size="lg"
            variant="outline"
            className="bg-white text-blue-600 hover:bg-blue-50 border-0 text-base px-8 py-6"
            onClick={handleGetRate}
          >
            Get Your Rate
            <Calculator className="ml-2 h-5 w-5" />
          </Button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Card className="p-6 bg-white/10 backdrop-blur-sm border-white/20">
            <div className="flex items-start gap-3 mb-3">
              <Info className="h-5 w-5 text-blue-200 flex-shrink-0 mt-0.5" />
              <h3 className="text-lg font-semibold text-white">
                Age Band
              </h3>
            </div>
            <p className="text-sm text-blue-100 leading-relaxed">
              Your rate is determined by which age group you fall into: 18-29, 30-49, or 50-64. This ensures fair pricing based on typical healthcare usage patterns.
            </p>
          </Card>

          <Card className="p-6 bg-white/10 backdrop-blur-sm border-white/20">
            <div className="flex items-start gap-3 mb-3">
              <Info className="h-5 w-5 text-blue-200 flex-shrink-0 mt-0.5" />
              <h3 className="text-lg font-semibold text-white">
                IUA (Initial Unshareable Amount)
              </h3>
            </div>
            <p className="text-sm text-blue-100 leading-relaxed">
              The amount you pay out-of-pocket before sharing begins. Choose from $1,250, $2,500, or $5,000. Higher IUA = lower monthly share.
            </p>
          </Card>
        </div>
      </div>
    </section>
  );
}
