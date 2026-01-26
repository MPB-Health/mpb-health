import { Link } from "react-router-dom";
import RouteGuard from "../../components/auth/RouteGuard";
import { MessageSquare, UserPlus, Star, Users, Phone, ClipboardList } from "lucide-react";
import { Card } from "../../components/ui/Card";

const formCategories = [
  {
    title: "Feedback & Reviews",
    description: "Share your experience and help us improve",
    forms: [
      {
        icon: MessageSquare,
        title: "Member Feedback",
        description: "Share your experience with us",
        href: "/member/forms/feedback",
      },
      {
        icon: Star,
        title: "Review Us",
        description: "Leave a review and help our community grow",
        href: "/member/forms/review",
      },
    ],
  },
  {
    title: "Referrals & Advisors",
    description: "Manage your network and advisory preferences",
    forms: [
      {
        icon: UserPlus,
        title: "Refer a Friend",
        description: "Help others discover MPB Health",
        href: "/member/forms/refer-friend",
      },
      {
        icon: Users,
        title: "Review or Change Advisor",
        description: "Update your healthcare advisor preferences",
        href: "/member/forms/change-advisor",
      },
    ],
  },
  {
    title: "Onboarding",
    description: "Get started with your membership",
    forms: [
      {
        icon: Phone,
        title: "Schedule Welcome Call",
        description: "Book your personalized orientation session",
        href: "/member/forms/welcome-call",
      },
      {
        icon: ClipboardList,
        title: "Welcome Call Survey",
        description: "Share feedback on your welcome experience",
        href: "/member/forms/welcome-survey",
      },
    ],
  },
];

export default function MemberFormsIndex() {
  return (
    <RouteGuard requiredRoles={["member", "advisor", "admin", "staff"]}>
      <div className="min-h-screen bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <div className="mb-12 text-center">
            <h1 className="text-4xl font-bold text-gray-900 mb-4">Member Forms</h1>
            <p className="text-lg text-gray-600 max-w-2xl mx-auto">
              Access all your member forms and resources in one place. Select a form below to get started.
            </p>
          </div>

          <div className="space-y-12">
            {formCategories.map((category, idx) => (
              <div key={idx}>
                <div className="mb-6">
                  <h2 className="text-2xl font-bold text-gray-900 mb-2">{category.title}</h2>
                  <p className="text-gray-600">{category.description}</p>
                </div>

                <div className="grid md:grid-cols-2 gap-6">
                  {category.forms.map((form, formIdx) => {
                    const Icon = form.icon;
                    return (
                      <Link key={formIdx} to={form.href}>
                        <Card className="p-6 hover:shadow-lg transition-shadow cursor-pointer h-full">
                          <div className="flex items-start space-x-4">
                            <div className="flex-shrink-0">
                              <div className="p-3 bg-blue-50 rounded-lg">
                                <Icon className="h-6 w-6 text-blue-600" />
                              </div>
                            </div>
                            <div className="flex-1 min-w-0">
                              <h3 className="text-lg font-semibold text-gray-900 mb-1">
                                {form.title}
                              </h3>
                              <p className="text-sm text-gray-600">{form.description}</p>
                            </div>
                          </div>
                        </Card>
                      </Link>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>

          <div className="mt-12 text-center">
            <p className="text-gray-600">
              Need help?{" "}
              <Link to="/contact" className="text-blue-600 hover:underline font-medium">
                Contact our support team
              </Link>
            </p>
          </div>
        </div>
      </div>
    </RouteGuard>
  );
}
