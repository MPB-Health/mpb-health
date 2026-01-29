import React, { useEffect, useState } from 'react';
import {
  Link2,
  Plus,
  Copy,
  TrendingUp,
  DollarSign,
  MousePointerClick,
  Calendar,
  Edit2,
  Trash2,
  Download
} from 'lucide-react';
import { Card } from '../ui/Card';
import { Button } from '../ui/button';
import { analyticsTrackingService, UTMCampaign } from '../../lib/analyticsTrackingService';
import { useAuth } from '../../contexts/AuthContext';

interface CampaignForm {
  campaign_name: string;
  campaign_url: string;
  utm_source: string;
  utm_medium: string;
  utm_campaign: string;
  utm_term: string;
  utm_content: string;
  campaign_budget: string;
  campaign_start_date: string;
  campaign_end_date: string;
  notes: string;
}

export const UTMCampaignBuilder: React.FC = () => {
  const { user } = useAuth();
  const [campaigns, setCampaigns] = useState<UTMCampaign[]>([]);
  const [loading, setLoading] = useState(true);
  const [showBuilder, setShowBuilder] = useState(false);
  const [editingCampaign, setEditingCampaign] = useState<UTMCampaign | null>(null);
  const [generatedURL, setGeneratedURL] = useState('');

  const [form, setForm] = useState<CampaignForm>({
    campaign_name: '',
    campaign_url: '',
    utm_source: '',
    utm_medium: '',
    utm_campaign: '',
    utm_term: '',
    utm_content: '',
    campaign_budget: '',
    campaign_start_date: '',
    campaign_end_date: '',
    notes: ''
  });

  useEffect(() => {
    loadCampaigns();
  }, []);

  useEffect(() => {
    if (form.campaign_url && form.utm_source && form.utm_medium && form.utm_campaign) {
      generateURL();
    } else {
      setGeneratedURL('');
    }
  }, [form.campaign_url, form.utm_source, form.utm_medium, form.utm_campaign, form.utm_term, form.utm_content]);

  const loadCampaigns = async () => {
    try {
      const data = await analyticsTrackingService.getUTMCampaigns();
      setCampaigns(data);
    } catch (error) {
      console.error('Error loading campaigns:', error);
    } finally {
      setLoading(false);
    }
  };

  const generateURL = async () => {
    try {
      const url = await analyticsTrackingService.generateCampaignURL(form.campaign_url, {
        utm_source: form.utm_source,
        utm_medium: form.utm_medium,
        utm_campaign: form.utm_campaign,
        utm_term: form.utm_term || undefined,
        utm_content: form.utm_content || undefined
      });
      setGeneratedURL(url);
    } catch (error) {
      console.error('Error generating URL:', error);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user?.id) return;

    try {
      const campaignData = {
        campaign_name: form.campaign_name,
        campaign_url: generatedURL,
        utm_source: form.utm_source,
        utm_medium: form.utm_medium,
        utm_campaign: form.utm_campaign,
        utm_term: form.utm_term || undefined,
        utm_content: form.utm_content || undefined,
        campaign_budget: form.campaign_budget ? parseFloat(form.campaign_budget) : undefined,
        campaign_start_date: form.campaign_start_date || undefined,
        campaign_end_date: form.campaign_end_date || undefined,
        notes: form.notes || undefined,
        is_active: true,
        created_by: user.id
      };

      if (editingCampaign) {
        await analyticsTrackingService.updateUTMCampaign(editingCampaign.id, campaignData);
      } else {
        await analyticsTrackingService.createUTMCampaign(campaignData);
      }

      resetForm();
      loadCampaigns();
      alert(`Campaign ${editingCampaign ? 'updated' : 'created'} successfully!`);
    } catch (error) {
      console.error('Error saving campaign:', error);
      alert('Failed to save campaign');
    }
  };

  const resetForm = () => {
    setForm({
      campaign_name: '',
      campaign_url: '',
      utm_source: '',
      utm_medium: '',
      utm_campaign: '',
      utm_term: '',
      utm_content: '',
      campaign_budget: '',
      campaign_start_date: '',
      campaign_end_date: '',
      notes: ''
    });
    setEditingCampaign(null);
    setShowBuilder(false);
    setGeneratedURL('');
  };

  const editCampaign = (campaign: UTMCampaign) => {
    setForm({
      campaign_name: campaign.campaign_name,
      campaign_url: campaign.campaign_url.split('?')[0],
      utm_source: campaign.utm_source,
      utm_medium: campaign.utm_medium,
      utm_campaign: campaign.utm_campaign,
      utm_term: campaign.utm_term || '',
      utm_content: campaign.utm_content || '',
      campaign_budget: campaign.campaign_budget?.toString() || '',
      campaign_start_date: campaign.campaign_start_date || '',
      campaign_end_date: campaign.campaign_end_date || '',
      notes: campaign.notes || ''
    });
    setEditingCampaign(campaign);
    setShowBuilder(true);
  };

  const deleteCampaign = async (id: string) => {
    if (!confirm('Are you sure you want to delete this campaign?')) return;

    try {
      await analyticsTrackingService.deleteUTMCampaign(id);
      loadCampaigns();
    } catch (error) {
      console.error('Error deleting campaign:', error);
      alert('Failed to delete campaign');
    }
  };

  const copyURL = (url: string) => {
    navigator.clipboard.writeText(url);
    alert('Campaign URL copied to clipboard!');
  };

  const exportCampaigns = () => {
    const csv = [
      ['Campaign Name', 'URL', 'Source', 'Medium', 'Campaign', 'Clicks', 'Conversions', 'Revenue', 'ROI'],
      ...campaigns.map(c => [
        c.campaign_name,
        c.campaign_url,
        c.utm_source,
        c.utm_medium,
        c.utm_campaign,
        c.click_count,
        c.conversion_count,
        c.revenue_generated,
        c.campaign_budget ? ((c.revenue_generated - c.campaign_budget) / c.campaign_budget * 100).toFixed(2) + '%' : 'N/A'
      ])
    ].map(row => row.join(',')).join('\n');

    const blob = new Blob([csv], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'utm-campaigns.csv';
    a.click();
    window.URL.revokeObjectURL(url);
  };

  const mediumTemplates = [
    { value: 'email', label: 'Email' },
    { value: 'social', label: 'Social Media' },
    { value: 'cpc', label: 'Paid Search' },
    { value: 'display', label: 'Display Ads' },
    { value: 'affiliate', label: 'Affiliate' },
    { value: 'referral', label: 'Referral' }
  ];

  const sourceTemplates = [
    { value: 'google', label: 'Google' },
    { value: 'facebook', label: 'Facebook' },
    { value: 'linkedin', label: 'LinkedIn' },
    { value: 'twitter', label: 'Twitter' },
    { value: 'instagram', label: 'Instagram' },
    { value: 'newsletter', label: 'Newsletter' }
  ];

  if (loading) {
    return (
      <div className="p-6">
        <div className="animate-pulse text-neutral-600">Loading campaigns...</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-neutral-900 mb-2">UTM Campaign Builder</h2>
          <p className="text-neutral-600">Create and manage trackable campaign URLs</p>
        </div>
        <div className="flex gap-2">
          <Button onClick={exportCampaigns} variant="secondary" className="inline-flex items-center gap-2">
            <Download className="h-4 w-4" />
            Export CSV
          </Button>
          <Button onClick={() => setShowBuilder(!showBuilder)} className="inline-flex items-center gap-2">
            <Plus className="h-4 w-4" />
            {showBuilder ? 'Close Builder' : 'New Campaign'}
          </Button>
        </div>
      </div>

      {showBuilder && (
        <Card className="p-6">
          <h3 className="text-lg font-semibold text-neutral-900 mb-4">
            {editingCampaign ? 'Edit Campaign' : 'Build New Campaign'}
          </h3>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-neutral-700 mb-1">
                  Campaign Name *
                </label>
                <input
                  type="text"
                  value={form.campaign_name}
                  onChange={(e) => setForm({ ...form, campaign_name: e.target.value })}
                  className="w-full px-3 py-2 border border-neutral-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Summer 2024 Membership Drive"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-neutral-700 mb-1">
                  Destination URL *
                </label>
                <input
                  type="url"
                  value={form.campaign_url}
                  onChange={(e) => setForm({ ...form, campaign_url: e.target.value })}
                  className="w-full px-3 py-2 border border-neutral-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="https://mpb.health/join"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-neutral-700 mb-1">
                  Source * <span className="text-xs text-neutral-500">(e.g., google, facebook, newsletter)</span>
                </label>
                <input
                  type="text"
                  value={form.utm_source}
                  onChange={(e) => setForm({ ...form, utm_source: e.target.value.toLowerCase().replace(/\s+/g, '_') })}
                  className="w-full px-3 py-2 border border-neutral-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="facebook"
                  required
                  list="source-suggestions"
                />
                <datalist id="source-suggestions">
                  {sourceTemplates.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
                </datalist>
              </div>

              <div>
                <label className="block text-sm font-medium text-neutral-700 mb-1">
                  Medium * <span className="text-xs text-neutral-500">(e.g., email, social, cpc)</span>
                </label>
                <input
                  type="text"
                  value={form.utm_medium}
                  onChange={(e) => setForm({ ...form, utm_medium: e.target.value.toLowerCase().replace(/\s+/g, '_') })}
                  className="w-full px-3 py-2 border border-neutral-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="social"
                  required
                  list="medium-suggestions"
                />
                <datalist id="medium-suggestions">
                  {mediumTemplates.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
                </datalist>
              </div>

              <div>
                <label className="block text-sm font-medium text-neutral-700 mb-1">
                  Campaign Name * <span className="text-xs text-neutral-500">(utm_campaign)</span>
                </label>
                <input
                  type="text"
                  value={form.utm_campaign}
                  onChange={(e) => setForm({ ...form, utm_campaign: e.target.value.toLowerCase().replace(/\s+/g, '_') })}
                  className="w-full px-3 py-2 border border-neutral-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="summer_2024"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-neutral-700 mb-1">
                  Term <span className="text-xs text-neutral-500">(optional, for paid search)</span>
                </label>
                <input
                  type="text"
                  value={form.utm_term}
                  onChange={(e) => setForm({ ...form, utm_term: e.target.value.toLowerCase().replace(/\s+/g, '_') })}
                  className="w-full px-3 py-2 border border-neutral-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="health_insurance"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-neutral-700 mb-1">
                  Content <span className="text-xs text-neutral-500">(optional, for A/B testing)</span>
                </label>
                <input
                  type="text"
                  value={form.utm_content}
                  onChange={(e) => setForm({ ...form, utm_content: e.target.value.toLowerCase().replace(/\s+/g, '_') })}
                  className="w-full px-3 py-2 border border-neutral-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="blue_button"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-neutral-700 mb-1">
                  Budget
                </label>
                <input
                  type="number"
                  step="0.01"
                  value={form.campaign_budget}
                  onChange={(e) => setForm({ ...form, campaign_budget: e.target.value })}
                  className="w-full px-3 py-2 border border-neutral-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="1000.00"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-neutral-700 mb-1">
                  Start Date
                </label>
                <input
                  type="date"
                  value={form.campaign_start_date}
                  onChange={(e) => setForm({ ...form, campaign_start_date: e.target.value })}
                  className="w-full px-3 py-2 border border-neutral-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-neutral-700 mb-1">
                  End Date
                </label>
                <input
                  type="date"
                  value={form.campaign_end_date}
                  onChange={(e) => setForm({ ...form, campaign_end_date: e.target.value })}
                  className="w-full px-3 py-2 border border-neutral-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-neutral-700 mb-1">
                Notes
              </label>
              <textarea
                value={form.notes}
                onChange={(e) => setForm({ ...form, notes: e.target.value })}
                className="w-full px-3 py-2 border border-neutral-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                rows={2}
                placeholder="Campaign details, target audience, etc."
              />
            </div>

            {generatedURL && (
              <div>
                <label className="block text-sm font-medium text-neutral-700 mb-1">
                  Generated Campaign URL
                </label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={generatedURL}
                    readOnly
                    className="flex-1 px-3 py-2 border border-neutral-300 rounded bg-neutral-50 text-sm"
                  />
                  <button
                    type="button"
                    onClick={() => copyURL(generatedURL)}
                    className="px-4 py-2 bg-blue-100 text-blue-700 rounded hover:bg-blue-200 transition-colors inline-flex items-center gap-2"
                  >
                    <Copy className="h-4 w-4" />
                    Copy
                  </button>
                </div>
              </div>
            )}

            <div className="flex gap-2 justify-end">
              <Button type="button" variant="secondary" onClick={resetForm}>
                Cancel
              </Button>
              <Button type="submit">
                {editingCampaign ? 'Update Campaign' : 'Create Campaign'}
              </Button>
            </div>
          </form>
        </Card>
      )}

      <div className="grid gap-4">
        {campaigns.map(campaign => {
          const roi = campaign.campaign_budget
            ? ((campaign.revenue_generated - campaign.campaign_budget) / campaign.campaign_budget) * 100
            : 0;

          return (
            <Card key={campaign.id} className="p-6">
              <div className="flex items-start justify-between mb-4">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    <h3 className="text-lg font-semibold text-neutral-900">
                      {campaign.campaign_name}
                    </h3>
                    {campaign.is_active && (
                      <span className="px-2 py-1 bg-green-100 text-green-800 rounded text-xs font-medium">
                        Active
                      </span>
                    )}
                  </div>
                  <div className="flex items-center gap-4 text-sm text-neutral-600 mb-2">
                    <span className="inline-flex items-center gap-1">
                      <Link2 className="h-4 w-4" />
                      {campaign.utm_source}/{campaign.utm_medium}
                    </span>
                    <span>{campaign.utm_campaign}</span>
                    {campaign.campaign_start_date && (
                      <span className="inline-flex items-center gap-1">
                        <Calendar className="h-4 w-4" />
                        {new Date(campaign.campaign_start_date).toLocaleDateString()}
                      </span>
                    )}
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => copyURL(campaign.campaign_url)}
                    className="p-2 bg-blue-100 text-blue-700 rounded-lg hover:bg-blue-200 transition-colors"
                    title="Copy URL"
                  >
                    <Copy className="h-4 w-4" />
                  </button>
                  <button
                    onClick={() => editCampaign(campaign)}
                    className="p-2 bg-neutral-100 text-neutral-700 rounded-lg hover:bg-neutral-200 transition-colors"
                    title="Edit"
                  >
                    <Edit2 className="h-4 w-4" />
                  </button>
                  <button
                    onClick={() => deleteCampaign(campaign.id)}
                    className="p-2 bg-red-100 text-red-700 rounded-lg hover:bg-red-200 transition-colors"
                    title="Delete"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-4 gap-4 mb-4">
                <div className="bg-blue-50 p-3 rounded-lg">
                  <div className="flex items-center gap-2 mb-1">
                    <MousePointerClick className="h-4 w-4 text-blue-600" />
                    <span className="text-xs text-blue-900 font-medium">Clicks</span>
                  </div>
                  <div className="text-2xl font-bold text-blue-900">{campaign.click_count}</div>
                </div>

                <div className="bg-green-50 p-3 rounded-lg">
                  <div className="flex items-center gap-2 mb-1">
                    <TrendingUp className="h-4 w-4 text-green-600" />
                    <span className="text-xs text-green-900 font-medium">Conversions</span>
                  </div>
                  <div className="text-2xl font-bold text-green-900">{campaign.conversion_count}</div>
                </div>

                <div className="bg-purple-50 p-3 rounded-lg">
                  <div className="flex items-center gap-2 mb-1">
                    <DollarSign className="h-4 w-4 text-purple-600" />
                    <span className="text-xs text-purple-900 font-medium">Revenue</span>
                  </div>
                  <div className="text-2xl font-bold text-purple-900">
                    ${campaign.revenue_generated.toLocaleString()}
                  </div>
                </div>

                <div className={`p-3 rounded-lg ${roi >= 0 ? 'bg-green-50' : 'bg-red-50'}`}>
                  <div className="flex items-center gap-2 mb-1">
                    <TrendingUp className={`h-4 w-4 ${roi >= 0 ? 'text-green-600' : 'text-red-600'}`} />
                    <span className={`text-xs font-medium ${roi >= 0 ? 'text-green-900' : 'text-red-900'}`}>ROI</span>
                  </div>
                  <div className={`text-2xl font-bold ${roi >= 0 ? 'text-green-900' : 'text-red-900'}`}>
                    {roi >= 0 ? '+' : ''}{roi.toFixed(1)}%
                  </div>
                </div>
              </div>

              <div className="text-xs text-neutral-500 break-all">
                {campaign.campaign_url}
              </div>
            </Card>
          );
        })}
      </div>

      {campaigns.length === 0 && !showBuilder && (
        <Card className="p-12 text-center">
          <Link2 className="h-12 w-12 text-neutral-400 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-neutral-900 mb-2">No campaigns yet</h3>
          <p className="text-neutral-600 mb-4">
            Create your first UTM campaign to start tracking marketing performance
          </p>
          <Button onClick={() => setShowBuilder(true)}>
            Create First Campaign
          </Button>
        </Card>
      )}
    </div>
  );
};
