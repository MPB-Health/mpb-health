import { Heart, Shield, DollarSign } from 'lucide-react';
import { Card } from '../ui/Card';

interface CredibilityStripProps {
  onCardClick: (anchor: string) => void;
}

export function CredibilityStrip({ onCardClick }: CredibilityStripProps) {
  const cards = [
    {
      icon: Heart,
      title: 'How It Works',
      description: 'Members share healthcare costs through a proven community model',
      anchor: '#how-it-works',
    },
    {
      icon: Shield,
      title: "What's Covered",
      description: 'Comprehensive sharing for medical needs, prescriptions, and preventive care',
      anchor: '#whats-covered',
    },
    {
      icon: DollarSign,
      title: "What You'll Pay",
      description: 'Transparent pricing by Age Band and IUA with no hidden fees',
      anchor: '#rate-calculator',
    },
  ];

  return (
    <section className="py-12 bg-white border-b border-gray-200">
      <div className="mx-auto max-w-7xl px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {cards.map((card) => {
            const Icon = card.icon;
            return (
              <Card
                key={card.anchor}
                className="p-6 hover:shadow-lg transition-shadow cursor-pointer"
                onClick={() => onCardClick(card.anchor)}
              >
                <div className="flex items-start gap-4">
                  <div className="flex-shrink-0">
                    <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                      <Icon className="h-6 w-6 text-blue-600" />
                    </div>
                  </div>
                  <div>
                    <h3 className="font-semibold text-lg text-gray-900 mb-2">
                      {card.title}
                    </h3>
                    <p className="text-sm text-gray-600 leading-relaxed">
                      {card.description}
                    </p>
                  </div>
                </div>
              </Card>
            );
          })}
        </div>
      </div>
    </section>
  );
}
