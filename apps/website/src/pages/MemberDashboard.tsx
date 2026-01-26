import React from 'react';
import { Link } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import {
  User,
  MessageSquare,
  UserPlus,
  Star,
  Phone,
  ClipboardList,
  FileText,
  Briefcase,
  Heart,
  TrendingUp,
  Calendar,
  DollarSign,
  ExternalLink
} from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { Breadcrumb } from '../components/layout/Breadcrumb';

const MemberDashboard: React.FC = () => {
  const { user } = useAuth();

  const quickActions = [
    {
      title: 'Member Feedback',
      description: 'Share your experience',
      icon: MessageSquare,
      href: '/member-feedback',
      color: 'blue',
    },
    {
      title: 'Refer a Friend',
      description: 'Help others discover MPB',
      icon: UserPlus,
      href: '/refer-a-friend',
      color: 'green',
    },
    {
      title: 'Review Us',
      description: 'Leave a review',
      icon: Star,
      href: '/review-us',
      color: 'yellow',
    },
    {
      title: 'Schedule Call',
      description: 'Book orientation',
      icon: Phone,
      href: '/schedule-welcome-call',
      color: 'purple',
    },
  ];


  const recentActivity = [
    {
      action: 'Welcome Call Scheduled',
      date: 'Today',
      icon: Calendar,
    },
    {
      action: 'Profile Updated',
      date: 'Yesterday',
      icon: User,
    },
    {
      action: 'Payment Processed',
      date: '2 days ago',
      icon: DollarSign,
    },
  ];

  return (
    <>
      <Helmet>
        <title>Member Dashboard - MPB Health</title>
        <meta name="description" content="Your MPB Health member dashboard" />
      </Helmet>

      <Breadcrumb />

      <div className="bg-gradient-to-br from-blue-50 to-cyan-50 py-12">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <h1 className="text-4xl font-bold text-neutral-900 mb-4">
              Welcome Back, {user?.email?.split('@')[0] || 'Member'}
            </h1>
            <p className="text-lg text-neutral-600 max-w-2xl mx-auto">
              Manage your account, access member services, and stay connected with your health sharing community.
            </p>
          </div>
        </div>
      </div>

      <div className="py-12 bg-white">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="grid md:grid-cols-3 gap-8">
            <div className="md:col-span-2 space-y-8">
              <div>
                <h2 className="text-2xl font-bold text-neutral-900 mb-6 flex items-center gap-2">
                  <Heart className="h-6 w-6 text-blue-600" />
                  Quick Actions
                </h2>
                <div className="grid sm:grid-cols-2 gap-4">
                  {quickActions.map((action) => {
                    const Icon = action.icon;
                    return (
                      <Link
                        key={action.href}
                        to={action.href}
                        className="p-6 border-2 border-neutral-200 rounded-xl hover:border-blue-600 hover:shadow-lg transition-all duration-300 group"
                      >
                        <div className="flex items-start gap-4">
                          <div className={`p-3 rounded-lg bg-${action.color}-100 group-hover:scale-110 transition-transform`}>
                            <Icon className={`h-6 w-6 text-${action.color}-600`} />
                          </div>
                          <div>
                            <h3 className="font-semibold text-neutral-900 mb-1 group-hover:text-blue-600 transition-colors">
                              {action.title}
                            </h3>
                            <p className="text-sm text-neutral-600">
                              {action.description}
                            </p>
                          </div>
                        </div>
                      </Link>
                    );
                  })}
                </div>
              </div>

              <div>
                <h2 className="text-2xl font-bold text-neutral-900 mb-6 flex items-center gap-2">
                  <FileText className="h-6 w-6 text-blue-600" />
                  Forms & Resources
                </h2>
                <div className="grid sm:grid-cols-2 gap-4">
                  <Link
                    to="/employer-forms/"
                    className="p-6 border-2 border-neutral-200 rounded-xl hover:border-blue-600 hover:shadow-lg transition-all duration-300 group"
                  >
                    <div className="flex items-start gap-4">
                      <div className="p-3 rounded-lg bg-blue-100 group-hover:scale-110 transition-transform">
                        <Briefcase className="h-6 w-6 text-blue-600" />
                      </div>
                      <div>
                        <h3 className="font-semibold text-neutral-900 mb-1 group-hover:text-blue-600 transition-colors">
                          Employer Forms
                        </h3>
                        <p className="text-sm text-neutral-600">
                          Access employer tools
                        </p>
                      </div>
                    </div>
                  </Link>
                  <Link
                    to="/member-forms/"
                    className="p-6 border-2 border-neutral-200 rounded-xl hover:border-blue-600 hover:shadow-lg transition-all duration-300 group"
                  >
                    <div className="flex items-start gap-4">
                      <div className="p-3 rounded-lg bg-green-100 group-hover:scale-110 transition-transform">
                        <ClipboardList className="h-6 w-6 text-green-600" />
                      </div>
                      <div>
                        <h3 className="font-semibold text-neutral-900 mb-1 group-hover:text-blue-600 transition-colors">
                          Member Forms
                        </h3>
                        <p className="text-sm text-neutral-600">
                          Access member forms
                        </p>
                      </div>
                    </div>
                  </Link>
                </div>
              </div>
            </div>

            <div className="space-y-8">
              <div className="bg-gradient-to-br from-blue-600 to-cyan-600 text-white rounded-xl p-6">
                <h3 className="text-lg font-bold mb-4">Your Plan</h3>
                <div className="space-y-3">
                  <div className="flex justify-between">
                    <span className="text-blue-100">Status</span>
                    <span className="font-semibold">Active</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-blue-100">Member Since</span>
                    <span className="font-semibold">Jan 2024</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-blue-100">Next Payment</span>
                    <span className="font-semibold">Dec 1, 2024</span>
                  </div>
                </div>
                <Link
                  to="/member-portal/account"
                  className="mt-6 flex items-center justify-center gap-2 px-4 py-2 bg-gradient-to-r from-blue-600 to-green-600 hover:from-blue-700 hover:to-green-700 text-white font-semibold rounded-lg transition-all duration-300 shadow-md hover:shadow-lg"
                >
                  View Details
                  <ExternalLink className="h-4 w-4" />
                </Link>
              </div>

              <div>
                <h3 className="text-lg font-bold text-neutral-900 mb-4 flex items-center gap-2">
                  <TrendingUp className="h-5 w-5 text-blue-600" />
                  Recent Activity
                </h3>
                <div className="space-y-3">
                  {recentActivity.map((activity, index) => {
                    const Icon = activity.icon;
                    return (
                      <div
                        key={index}
                        className="flex items-start gap-3 p-3 bg-neutral-50 rounded-lg"
                      >
                        <div className="p-2 bg-blue-100 rounded-lg">
                          <Icon className="h-4 w-4 text-blue-600" />
                        </div>
                        <div>
                          <p className="text-sm font-medium text-neutral-900">
                            {activity.action}
                          </p>
                          <p className="text-xs text-neutral-500">{activity.date}</p>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              <div className="bg-blue-50 border border-blue-200 rounded-xl p-6">
                <h3 className="text-lg font-bold text-neutral-900 mb-2">
                  Need Help?
                </h3>
                <p className="text-sm text-neutral-600 mb-4">
                  Our support team is here to assist you.
                </p>
                <Link
                  to="/support"
                  className="block text-center px-4 py-2 bg-blue-600 text-white font-semibold rounded-lg hover:bg-blue-700 transition-colors"
                >
                  Contact Support
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default MemberDashboard;
