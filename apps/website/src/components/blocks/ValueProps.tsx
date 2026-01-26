import React from 'react';
import { DollarSign, Users, Shield, Heart, Globe, Baby } from 'lucide-react';
import { Card, CardHeader, CardTitle, CardDescription } from '../ui/Card';

const ValueProps: React.FC = () => {
  const values = [
    {
      icon: DollarSign,
      title: 'Save 30-60% on Healthcare',
      description: 'Reduce your monthly healthcare costs significantly compared to traditional insurance plans.',
      color: 'text-accent',
      bgColor: 'bg-accent/10',
    },
    {
      icon: Users,
      title: 'Real Community Support',
      description: 'Join a caring community of families who help each other through medical challenges.',
      color: 'text-primary',
      bgColor: 'bg-primary/10',
    },
    {
      icon: Shield,
      title: 'No Network Restrictions',
      description: 'Visit any licensed healthcare provider, anywhere in the country. Your choice, your care.',
      color: 'text-success',
      bgColor: 'bg-success/10',
    },
    {
      icon: Heart,
      title: 'Transparent Pricing',
      description: 'Know exactly what you pay each month. No hidden fees, deductibles, or surprise bills.',
      color: 'text-primary',
      bgColor: 'bg-primary/10',
    },
    {
      icon: Globe,
      title: 'Worldwide Sharing',
      description: 'Access healthcare support wherever life takes you, with membership that travels globally.',
      color: 'text-success',
      bgColor: 'bg-success/10',
    },
    {
      icon: Baby,
      title: 'Maternity Sharing',
      description: 'Comprehensive maternity membership for your growing family, from prenatal care through delivery.',
      color: 'text-accent',
      bgColor: 'bg-accent/10',
    },
  ];

  return (
    <section className="py-16 bg-white">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-16">
          <h2 className="text-display-md font-bold text-neutral-900 mb-4">
            Why Families Choose Health Sharing
          </h2>
          <p className="text-xl text-neutral-600 max-w-3xl mx-auto">
            Experience healthcare the way it should be: affordable, transparent, and built on community support.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {values.map((value, index) => (
            <Card 
              key={index} 
              hover 
              className="animate-slide-up" 
              style={{ animationDelay: `${index * 0.1}s` }}
            >
              <CardHeader className="text-center">
                <div className={`inline-flex w-14 h-14 rounded-xl ${value.bgColor} items-center justify-center mb-4`}>
                  <value.icon className={`h-7 w-7 ${value.color}`} />
                </div>
                <CardTitle className="text-lg mb-3">{value.title}</CardTitle>
                <CardDescription className="text-base leading-relaxed">
                  {value.description}
                </CardDescription>
              </CardHeader>
            </Card>
          ))}
        </div>
      </div>
    </section>
  );
};

export { ValueProps };