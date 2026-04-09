import React from 'react';
import { Shield, FileCheck, CreditCard, Users, CheckCircle } from 'lucide-react';
import { Card, CardHeader, CardTitle, CardContent } from '../ui/Card';

interface ObjectionItem {
  icon: React.ElementType;
  concern: string;
  answerPoints: string[];
  stats: string;
  color: string;
  bgColor: string;
}

const ObjectionBlocks: React.FC = () => {
  const objections: ObjectionItem[] = [
    {
      icon: Shield,
      concern: "Is health sharing really reliable?",
      answerPoints: [
        "Over $75 million in medical expenses shared in the last year alone",
        "A+ Better Business Bureau rating",
        "Serving families for over 15 years"
      ],
      stats: "$75M+ shared • A+ BBB rating • 15+ years",
      color: 'text-success',
      bgColor: 'bg-success/10'
    },
    {
      icon: FileCheck,
      concern: "What medical expenses are eligible for sharing?",
      answerPoints: [
        "Emergency Care: ER visits & ambulance rides",
        "Inpatient Hospitalization: Surgeries, overnight stays, ICU care",
        "Outpatient Surgery: Procedures at surgery centers",
        "Diagnostics: MRIs, CT scans, X-rays, lab work",
        "Specialist Care: Cardiologists, orthopedists, etc.",
        "Maternity & Childbirth: Prenatal, delivery, postnatal care"
      ],
      stats: "ER • Hospitalization • Surgery • Diagnostics • Specialist • Maternity",
      color: 'text-primary',
      bgColor: 'bg-primary/10'
    },
    {
      icon: CreditCard,
      concern: "How does billing and payment work?",
      answerPoints: [
        "Pay your monthly sharing amount",
        "Open a sharing request in your member portal when needed",
        "Submit eligible expenses for sharing with the community"
      ],
      stats: "Simple monthly payment • Easy reimbursement",
      color: 'text-accent',
      bgColor: 'bg-accent/10'
    },
    {
      icon: Users,
      concern: "What if I have pre-membership conditions?",
      answerPoints: [
        "No membership denial based on medical history",
        "New medical needs eligible for sharing immediately",
        "Pre-existing conditions subject to a phase-in period",
        "Diabetes, High Blood Pressure, High Cholesterol eligible from Day One (if no hospitalization in last year)"
      ],
      stats: "No membership denial • Phase-in period applies",
      color: 'text-primary',
      bgColor: 'bg-primary/10'
    },
  ];

  return (
    <section className="py-24 bg-gradient-to-b from-neutral-50 to-white">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-16">
          <h2 className="text-display-md font-bold text-neutral-900 mb-4">
            Common Questions Answered
          </h2>
          <p className="text-xl text-neutral-600 max-w-3xl mx-auto">
            We understand you may have questions about how health sharing works. Here are clear answers to the most common concerns.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {objections.map((objection, index) => (
            <Card
              key={index}
              hover
              className="animate-slide-up"
              style={{ animationDelay: `${index * 0.1}s` }}
            >
              <CardHeader>
                <div className="flex items-start space-x-4">
                  <div className={`flex-shrink-0 w-14 h-14 ${objection.bgColor} rounded-xl flex items-center justify-center`}>
                    <objection.icon className={`h-7 w-7 ${objection.color}`} />
                  </div>
                  <div className="flex-1">
                    <CardTitle className="text-lg mb-3 text-neutral-900">
                      {objection.concern}
                    </CardTitle>
                    <ul className="space-y-2">
                      {objection.answerPoints.map((point, idx) => (
                        <li key={idx} className="flex items-start gap-2 text-sm text-neutral-700">
                          <span className="text-blue-500 mt-1 flex-shrink-0">•</span>
                          <span>{point}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="pt-0">
                <div className="bg-primary/5 rounded-lg p-4">
                  <div className="flex items-center space-x-2 mb-2">
                    <CheckCircle className="h-4 w-4 text-success" />
                    <span className="text-sm font-medium text-neutral-900">Key Points:</span>
                  </div>
                  <p className="text-sm text-neutral-600">{objection.stats}</p>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        <div className="mt-16 text-center">
          <div className="bg-white rounded-2xl p-8 border border-neutral-200">
            <h3 className="text-xl font-semibold text-neutral-900 mb-4">
              Still Have Questions?
            </h3>
            <p className="text-neutral-600 mb-6">
              Our member specialists are available to answer any questions and help you understand if health sharing is right for your family.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <a
                href="tel:8558164650"
                className="inline-flex items-center justify-center px-6 py-3 bg-gradient-to-r from-blue-600 to-cyan-600 text-white font-semibold rounded-xl hover:from-blue-700 hover:to-cyan-700 transition-all duration-300 shadow-lg hover:shadow-xl hover:scale-105"
              >
                Call (855) 816-4650
              </a>
              <a
                href="https://outlook.office.com/book/SpeakWithaAdvisor@NETORG6712533.onmicrosoft.com/"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center justify-center px-6 py-3 border border-neutral-300 text-neutral-700 rounded-lg font-medium hover:bg-neutral-50 transition-colors"
              >
                Schedule a Call
              </a>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export { ObjectionBlocks };