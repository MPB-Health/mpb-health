import { UserPlus, CreditCard, Heart } from 'lucide-react';

export function EnrollmentHowItWorks() {
  const steps = [
    {
      icon: UserPlus,
      title: 'Choose Your Membership',
      description: 'Select from Care+, Direct, or Secure HSA based on your needs and budget',
    },
    {
      icon: CreditCard,
      title: 'Pay Your Monthly Share',
      description: 'Your transparent monthly contribution based on Age Band and IUA',
    },
    {
      icon: Heart,
      title: 'Get Care & Share Costs',
      description: 'Access care and have eligible medical expenses shared by the community',
    },
  ];

  return (
    <section id="how-it-works" className="py-16 bg-white">
      <div className="mx-auto max-w-7xl px-6 lg:px-8">
        <div className="text-center mb-12">
          <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
            How It Works
          </h2>
          <p className="text-lg text-gray-600 max-w-2xl mx-auto">
            Three simple steps to affordable healthcare
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {steps.map((step, index) => {
            const Icon = step.icon;
            return (
              <div key={index} className="relative text-center">
                {index < steps.length - 1 && (
                  <div className="hidden md:block absolute top-12 left-[60%] w-[80%] h-0.5 bg-gradient-to-r from-blue-300 to-transparent" />
                )}
                <div className="relative inline-flex w-24 h-24 bg-blue-100 rounded-full items-center justify-center mb-6">
                  <Icon className="h-10 w-10 text-blue-600" />
                  <div className="absolute -top-2 -right-2 w-8 h-8 bg-blue-600 text-white rounded-full flex items-center justify-center text-sm font-bold">
                    {index + 1}
                  </div>
                </div>
                <h3 className="text-xl font-semibold text-gray-900 mb-3">
                  {step.title}
                </h3>
                <p className="text-gray-600 leading-relaxed">
                  {step.description}
                </p>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
