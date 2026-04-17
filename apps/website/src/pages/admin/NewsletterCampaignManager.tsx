import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import { Mail, Send, Calendar, TrendingUp, Plus, Eye, Trash2 } from 'lucide-react';
import { Button } from '../../components/ui/button';
import { Input } from '../../components/ui/Input';
import { Label } from '../../components/ui/Label';
import { Select } from '../../components/ui/Select';
import { supabase, type BlogArticle } from '../../lib/supabase';
import { AdminBreadcrumb } from '../../components/admin/AdminBreadcrumb';
import { AdminLayout } from '../../components/admin/AdminLayout';
import {
  createNewsletterCampaign,
  getNewsletterCampaigns,
  scheduleCampaign,
  sendCampaignNow,
  cancelCampaign,
  getCampaignAnalytics,
  getCampaignPerformanceComparison,
  type NewsletterCampaign,
} from '../../lib/newsletterCampaignService';

const NewsletterCampaignManager: React.FC = () => {
  const navigate = useNavigate();
  const [campaigns, setCampaigns] = useState<NewsletterCampaign[]>([]);
  const [blogPosts, setBlogPosts] = useState<BlogArticle[]>([]);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [selectedCampaign, setSelectedCampaign] = useState<string | null>(null);
  const [analytics, setAnalytics] = useState<any>(null);
  const [performance, setPerformance] = useState<any>(null);
  const [formData, setFormData] = useState({
    blog_post_id: '',
    subject_line: '',
    preview_text: '',
    send_at: '',
  });

  useEffect(() => {
    loadCampaigns();
    loadBlogPosts();
    loadPerformance();
  }, []);

  const loadCampaigns = async () => {
    const data = await getNewsletterCampaigns();
    setCampaigns(data);
  };

  const loadBlogPosts = async () => {
    const { data } = await supabase
      .from('blog_articles')
      .select('id, title, slug, excerpt, content, featured_image_url, category, author, author_id, tags, published_date, read_time, is_published, created_at, updated_at, view_count')
      .eq('is_published', true)
      .order('published_date', { ascending: false })
      .limit(50);

    if (data) setBlogPosts(data);
  };

  const loadPerformance = async () => {
    const data = await getCampaignPerformanceComparison();
    setPerformance(data);
  };

  const loadCampaignAnalytics = async (campaignId: string) => {
    const data = await getCampaignAnalytics(campaignId);
    setAnalytics(data);
    setSelectedCampaign(campaignId);
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.blog_post_id || !formData.subject_line) {
      alert('Please fill in all required fields');
      return;
    }

    const campaign = await createNewsletterCampaign({
      blog_post_id: formData.blog_post_id,
      subject_line: formData.subject_line,
      preview_text: formData.preview_text,
      status: 'draft',
      target_segment: {},
    });

    if (campaign) {
      alert('Campaign created successfully!');
      setShowCreateForm(false);
      setFormData({
        blog_post_id: '',
        subject_line: '',
        preview_text: '',
        send_at: '',
      });
      loadCampaigns();
    } else {
      alert('Failed to create campaign');
    }
  };

  const handleSchedule = async (campaignId: string, sendAt: string) => {
    if (!sendAt) {
      alert('Please select a send date and time');
      return;
    }

    const result = await scheduleCampaign(campaignId, sendAt);

    if (result.success) {
      alert('Campaign scheduled successfully!');
      loadCampaigns();
    } else {
      alert(`Failed to schedule campaign: ${result.error}`);
    }
  };

  const handleSendNow = async (campaignId: string) => {
    if (!confirm('Are you sure you want to send this campaign immediately?')) {
      return;
    }

    const result = await sendCampaignNow(campaignId);

    if (result.success) {
      alert('Campaign is being sent!');
      loadCampaigns();
    } else {
      alert(`Failed to send campaign: ${result.error}`);
    }
  };

  const handleCancel = async (campaignId: string) => {
    if (!confirm('Are you sure you want to cancel this campaign?')) {
      return;
    }

    const success = await cancelCampaign(campaignId);

    if (success) {
      alert('Campaign cancelled');
      loadCampaigns();
    } else {
      alert('Failed to cancel campaign');
    }
  };

  const getStatusColor = (status: string) => {
    const colors: Record<string, string> = {
      draft: 'bg-gray-100 text-gray-800',
      scheduled: 'bg-blue-100 text-blue-800',
      sending: 'bg-yellow-100 text-yellow-800',
      sent: 'bg-green-100 text-green-800',
      failed: 'bg-red-100 text-red-800',
      cancelled: 'bg-gray-100 text-gray-600',
    };
    return colors[status] || 'bg-gray-100 text-gray-800';
  };

  return (
    <AdminLayout activeView="newsletter-camp" onViewChange={(view) => navigate(`/admin?view=${view}`)}>
      <Helmet>
        <title>Newsletter Campaign Manager | MPB Health Admin</title>
      </Helmet>

      <div>
        <AdminBreadcrumb currentPage="Newsletter Campaign Manager" />

          <div className="mb-8 flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-3">
                <Mail className="h-8 w-8 text-blue-600" />
                Newsletter Campaign Manager
              </h1>
              <p className="mt-2 text-gray-600">
                Create and manage automated newsletter campaigns
              </p>
            </div>
            <Button onClick={() => setShowCreateForm(true)}>
              <Plus className="h-5 w-5 mr-2" />
              New Campaign
            </Button>
          </div>

          {/* Performance Overview */}
          {performance && (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
              <div className="bg-white rounded-xl shadow-sm p-6">
                <div className="flex items-center justify-between">
                  <div className="text-sm text-gray-600">Avg Open Rate</div>
                  <TrendingUp className="h-5 w-5 text-green-600" />
                </div>
                <div className="text-3xl font-bold text-gray-900 mt-2">
                  {performance.avgOpenRate.toFixed(1)}%
                </div>
              </div>

              <div className="bg-white rounded-xl shadow-sm p-6">
                <div className="flex items-center justify-between">
                  <div className="text-sm text-gray-600">Avg Click Rate</div>
                  <TrendingUp className="h-5 w-5 text-blue-600" />
                </div>
                <div className="text-3xl font-bold text-gray-900 mt-2">
                  {performance.avgClickRate.toFixed(1)}%
                </div>
              </div>

              <div className="bg-white rounded-xl shadow-sm p-6">
                <div className="flex items-center justify-between">
                  <div className="text-sm text-gray-600">Total Campaigns</div>
                  <Mail className="h-5 w-5 text-purple-600" />
                </div>
                <div className="text-3xl font-bold text-gray-900 mt-2">
                  {campaigns.length}
                </div>
              </div>
            </div>
          )}

          {/* Create Campaign Form */}
          {showCreateForm && (
            <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
              <div className="bg-white rounded-xl shadow-xl max-w-2xl w-full p-6">
                <h2 className="text-2xl font-bold text-gray-900 mb-6">Create New Campaign</h2>

                <form onSubmit={handleCreate} className="space-y-6">
                  <div>
                    <Label htmlFor="blog_post">Blog Post</Label>
                    <Select
                      id="blog_post"
                      value={formData.blog_post_id}
                      onChange={(e) =>
                        setFormData({ ...formData, blog_post_id: e.target.value })
                      }
                      className="mt-2"
                      required
                    >
                      <option value="">Select a blog post</option>
                      {blogPosts.map((post) => (
                        <option key={post.id} value={post.id}>
                          {post.title}
                        </option>
                      ))}
                    </Select>
                  </div>

                  <div>
                    <Label htmlFor="subject">Subject Line</Label>
                    <Input
                      id="subject"
                      type="text"
                      value={formData.subject_line}
                      onChange={(e) =>
                        setFormData({ ...formData, subject_line: e.target.value })
                      }
                      placeholder="Your compelling subject line"
                      className="mt-2"
                      required
                    />
                  </div>

                  <div>
                    <Label htmlFor="preview">Preview Text</Label>
                    <Input
                      id="preview"
                      type="text"
                      value={formData.preview_text}
                      onChange={(e) =>
                        setFormData({ ...formData, preview_text: e.target.value })
                      }
                      placeholder="Email preview text"
                      className="mt-2"
                    />
                  </div>

                  <div className="flex gap-4">
                    <Button type="submit" className="flex-1">
                      Create Campaign
                    </Button>
                    <Button
                      type="button"
                      onClick={() => setShowCreateForm(false)}
                      className="flex-1 bg-gray-200 text-gray-900 hover:bg-gray-300"
                    >
                      Cancel
                    </Button>
                  </div>
                </form>
              </div>
            </div>
          )}

          {/* Campaigns List */}
          <div className="bg-white rounded-xl shadow-sm overflow-hidden">
            <div className="p-6 border-b border-gray-200">
              <h2 className="text-xl font-semibold text-gray-900">All Campaigns</h2>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                      Subject Line
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                      Status
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                      Sent
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                      Open Rate
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                      Click Rate
                    </th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {campaigns.map((campaign) => (
                    <tr key={campaign.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 text-sm font-medium text-gray-900">
                        {campaign.subject_line}
                      </td>
                      <td className="px-6 py-4">
                        <span
                          className={`inline-flex px-2 py-1 text-xs font-medium rounded ${getStatusColor(
                            campaign.status
                          )}`}
                        >
                          {campaign.status}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-600">
                        {campaign.sent_count.toLocaleString()}
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-600">
                        {campaign.open_rate.toFixed(1)}%
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-600">
                        {campaign.click_rate.toFixed(1)}%
                      </td>
                      <td className="px-6 py-4 text-right text-sm">
                        <div className="flex items-center justify-end gap-2">
                          <button
                            onClick={() => loadCampaignAnalytics(campaign.id)}
                            className="text-blue-600 hover:text-blue-900"
                            title="View Analytics"
                          >
                            <Eye className="h-5 w-5" />
                          </button>

                          {campaign.status === 'draft' && (
                            <>
                              <button
                                onClick={() =>
                                  handleSendNow(campaign.id)
                                }
                                className="text-green-600 hover:text-green-900"
                                title="Send Now"
                              >
                                <Send className="h-5 w-5" />
                              </button>
                              <button
                                onClick={() => {
                                  const sendAt = prompt('Enter send date/time (YYYY-MM-DD HH:MM):');
                                  if (sendAt) {
                                    handleSchedule(campaign.id, sendAt);
                                  }
                                }}
                                className="text-blue-600 hover:text-blue-900"
                                title="Schedule"
                              >
                                <Calendar className="h-5 w-5" />
                              </button>
                            </>
                          )}

                          {campaign.status === 'scheduled' && (
                            <button
                              onClick={() => handleCancel(campaign.id)}
                              className="text-red-600 hover:text-red-900"
                              title="Cancel"
                            >
                              <Trash2 className="h-5 w-5" />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>

              {campaigns.length === 0 && (
                <div className="text-center py-12 text-gray-500">
                  <Mail className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                  <p>No campaigns yet. Create your first campaign!</p>
                </div>
              )}
            </div>
          </div>

          {/* Analytics Modal */}
          {selectedCampaign && analytics && (
            <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
              <div className="bg-white rounded-xl shadow-xl max-w-2xl w-full p-6">
                <h2 className="text-2xl font-bold text-gray-900 mb-6">Campaign Analytics</h2>

                <div className="grid grid-cols-2 gap-4 mb-6">
                  <div className="bg-blue-50 rounded-lg p-4">
                    <div className="text-sm text-blue-600 mb-1">Total Sent</div>
                    <div className="text-2xl font-bold text-blue-900">
                      {analytics.totalSent.toLocaleString()}
                    </div>
                  </div>

                  <div className="bg-green-50 rounded-lg p-4">
                    <div className="text-sm text-green-600 mb-1">Total Opened</div>
                    <div className="text-2xl font-bold text-green-900">
                      {analytics.totalOpened.toLocaleString()}
                    </div>
                  </div>

                  <div className="bg-purple-50 rounded-lg p-4">
                    <div className="text-sm text-purple-600 mb-1">Total Clicked</div>
                    <div className="text-2xl font-bold text-purple-900">
                      {analytics.totalClicked.toLocaleString()}
                    </div>
                  </div>

                  <div className="bg-red-50 rounded-lg p-4">
                    <div className="text-sm text-red-600 mb-1">Total Bounced</div>
                    <div className="text-2xl font-bold text-red-900">
                      {analytics.totalBounced.toLocaleString()}
                    </div>
                  </div>
                </div>

                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-gray-600">Open Rate</span>
                    <span className="font-bold text-gray-900">{analytics.openRate.toFixed(2)}%</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-gray-600">Click Rate</span>
                    <span className="font-bold text-gray-900">{analytics.clickRate.toFixed(2)}%</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-gray-600">Click-to-Open Rate</span>
                    <span className="font-bold text-gray-900">
                      {analytics.clickToOpenRate.toFixed(2)}%
                    </span>
                  </div>
                </div>

                <div className="mt-6">
                  <Button onClick={() => setSelectedCampaign(null)} className="w-full">
                    Close
                  </Button>
                </div>
              </div>
            </div>
          )}
        </div>
    </AdminLayout>
  );
};

export default NewsletterCampaignManager;
