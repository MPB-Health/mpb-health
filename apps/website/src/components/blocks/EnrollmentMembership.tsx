import { Check } from 'lucide-react';
import { Card } from '../ui/Card';

export function EnrollmentMembership() {
  const categories = [
    {
      title: 'Medical Needs',
      items: [
        'Doctor visits',
        'Hospital stays',
        'Emergency care',
        'Urgent care',
        'Specialist consultations',
        'Lab work & imaging',
      ],
    },
    {
      title: 'Preventive Care',
      items: [
        'Annual checkups',
        'Routine screenings',
        'Immunizations',
        'Well-child visits',
        'Preventive tests',
        'Health counseling',
      ],
    },
    {
      title: 'Prescriptions',
      items: [
        'Generic medications',
        'Brand-name drugs',
        'Specialty medications',
        'Maintenance prescriptions',
        'Short-term prescriptions',
        'Prescription discount program',
      ],
    },
    {
      title: 'Additional Benefits',
      items: [
        'Telemedicine access',
        'Direct primary care (Care+ plan)',
        'Maternity sharing',
        '24/7 member support',
        'Health advocacy',
        'Wellness programs',
      ],
    },
  ];

  return (
    <section id="whats-included" className="py-16 bg-gray-50">
      <div className="mx-auto max-w-7xl px-6 lg:px-8">
        <div className="text-center mb-12">
          <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-2">
            What's Included
          </h2>
          <p className="text-sm text-gray-500 italic mb-4">*After IUA is met</p>
          <p className="text-lg text-gray-600 max-w-2xl mx-auto">
            Comprehensive sharing for your healthcare needs
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {categories.map((category) => (
            <Card key={category.title} className="p-6">
              <h3 className="text-xl font-semibold text-gray-900 mb-4">
                {category.title}
              </h3>
              <ul className="space-y-2">
                {category.items.map((item) => (
                  <li key={item} className="flex items-start gap-2 text-sm text-gray-700">
                    <Check className="h-5 w-5 text-green-600 flex-shrink-0 mt-0.5" />
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            </Card>
          ))}
        </div>

        <div className="mt-8 text-center">
          <p className="text-sm text-gray-600 max-w-3xl mx-auto">
            <strong>Note:</strong> Sharing guidelines apply. Pre-membership conditions may have waiting periods. Refer to your plan's sharing guidelines for complete details on eligible expenses.
          </p>
        </div>
      </div>
    </section>
  );
}

