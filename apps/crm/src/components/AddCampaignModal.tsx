import { useState, useEffect } from 'react';
import toast from 'react-hot-toast';
import { Modal } from './Modal';
import { useCRM } from '../contexts/CRMContext';
import { useOrg } from '../contexts/OrgContext';
import { logAuditEvent, AUDIT_ACTIONS } from '@mpbhealth/auth';
import type {
  CampaignWithRelations,
  CampaignCreateInput,
  CampaignType,
  CampaignStatus,
} from '@mpbhealth/crm-core';

interface AddCampaignModalProps {
  open: boolean;
  onClose: () => void;
  onSuccess?: (campaignId: string) => void;
  campaign?: CampaignWithRelations | null;
}

export function AddCampaignModal({
  open,
  onClose,
  onSuccess,
  campaign,
}: AddCampaignModalProps) {
  const { campaignService } = useCRM();
  const { activeOrgId } = useOrg();

  const [loading, setLoading] = useState(false);

  // Form state
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [campaignType, setCampaignType] = useState<CampaignType>('email');
  const [status, setStatus] = useState<CampaignStatus>('draft');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [budget, setBudget] = useState('');
  const [actualCost, setActualCost] = useState('');
  const [expectedRevenue, setExpectedRevenue] = useState('');
  const [actualRevenue, setActualRevenue] = useState('');
  const [expectedResponse, setExpectedResponse] = useState('');
  const [tags, setTags] = useState('');

  // Initialize form when campaign prop changes or modal opens
  useEffect(() => {
    if (open) {
      if (campaign) {
        setName(campaign.name);
        setDescription(campaign.description || '');
        setCampaignType(campaign.campaign_type);
        setStatus(campaign.status);
        setStartDate(campaign.start_date?.split('T')[0] || '');
        setEndDate(campaign.end_date?.split('T')[0] || '');
        setBudget(campaign.budget?.toString() || '');
        setActualCost(campaign.actual_cost?.toString() || '');
        setExpectedRevenue(campaign.expected_revenue?.toString() || '');
        setActualRevenue(campaign.actual_revenue?.toString() || '');
        setExpectedResponse(campaign.expected_response?.toString() || '');
        setTags(campaign.tags?.join(', ') || '');
      } else {
        // Reset form for new campaign
        setName('');
        setDescription('');
        setCampaignType('email');
        setStatus('draft');
        setStartDate('');
        setEndDate('');
        setBudget('');
        setActualCost('');
        setExpectedRevenue('');
        setActualRevenue('');
        setExpectedResponse('');
        setTags('');
      }
    }
  }, [open, campaign]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!name.trim()) {
      toast.error('Campaign name is required');
      return;
    }

    setLoading(true);

    const tagsArray = tags
      .split(',')
      .map((t) => t.trim())
      .filter(Boolean);

    const input: CampaignCreateInput = {
      name: name.trim(),
      description: description || undefined,
      campaign_type: campaignType,
      status,
      start_date: startDate || undefined,
      end_date: endDate || undefined,
      budget: budget ? parseFloat(budget) : undefined,
      expected_revenue: expectedRevenue ? parseFloat(expectedRevenue) : undefined,
      expected_response: expectedResponse ? parseFloat(expectedResponse) : undefined,
      tags: tagsArray.length > 0 ? tagsArray : undefined,
    };

    let result;

    if (campaign) {
      // Update existing campaign
      result = await campaignService.updateCampaign(campaign.id, {
        ...input,
        actual_cost: actualCost ? parseFloat(actualCost) : undefined,
        actual_revenue: actualRevenue ? parseFloat(actualRevenue) : undefined,
      });
      if (result.success) {
        toast.success('Campaign updated');
        logAuditEvent({
          orgId: activeOrgId || '',
          action: 'campaign.updated',
          entityType: 'campaign',
          entityId: campaign.id,
          before: { name: campaign.name },
          after: { name: input.name },
        }).catch(console.error);
        onSuccess?.(campaign.id);
        onClose();
      } else {
        toast.error(result.error || 'Failed to update campaign');
      }
    } else {
      // Create new campaign
      result = await campaignService.createCampaign(input);
      if (result.success && result.campaignId) {
        toast.success('Campaign created');
        logAuditEvent({
          orgId: activeOrgId || '',
          action: 'campaign.created',
          entityType: 'campaign',
          entityId: result.campaignId,
          after: { name: input.name },
        }).catch(console.error);
        onSuccess?.(result.campaignId);
        onClose();
      } else {
        toast.error(result.error || 'Failed to create campaign');
      }
    }

    setLoading(false);
  };

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={campaign ? 'Edit Campaign' : 'New Campaign'}
      description={campaign ? 'Update campaign details' : 'Create a new marketing campaign'}
      variant="slideOver"
      size="lg"
    >
      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Campaign Name */}
        <div>
          <label className="block text-sm font-medium text-th-text-secondary mb-1">
            Campaign Name <span className="text-red-500">*</span>
          </label>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Enter campaign name"
            className="w-full border border-th-border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-th-accent-500"
            required
          />
        </div>

        {/* Type & Status */}
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-th-text-secondary mb-1">
              Campaign Type
            </label>
            <select
              value={campaignType}
              onChange={(e) => setCampaignType(e.target.value as CampaignType)}
              className="w-full border border-th-border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-th-accent-500"
            >
              <option value="email">Email</option>
              <option value="social">Social Media</option>
              <option value="event">Event</option>
              <option value="webinar">Webinar</option>
              <option value="advertisement">Advertisement</option>
              <option value="referral">Referral</option>
              <option value="other">Other</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-th-text-secondary mb-1">
              Status
            </label>
            <select
              value={status}
              onChange={(e) => setStatus(e.target.value as CampaignStatus)}
              className="w-full border border-th-border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-th-accent-500"
            >
              <option value="draft">Draft</option>
              <option value="scheduled">Scheduled</option>
              <option value="active">Active</option>
              <option value="paused">Paused</option>
              <option value="completed">Completed</option>
              <option value="cancelled">Cancelled</option>
            </select>
          </div>
        </div>

        {/* Description */}
        <div>
          <label className="block text-sm font-medium text-th-text-secondary mb-1">
            Description
          </label>
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Describe the campaign objectives and strategy..."
            rows={3}
            className="w-full border border-th-border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-th-accent-500"
          />
        </div>

        {/* Dates */}
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-th-text-secondary mb-1">
              Start Date
            </label>
            <input
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              className="w-full border border-th-border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-th-accent-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-th-text-secondary mb-1">
              End Date
            </label>
            <input
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              className="w-full border border-th-border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-th-accent-500"
            />
          </div>
        </div>

        {/* Budget Section */}
        <div className="border-t border-th-border pt-4">
          <h3 className="text-sm font-semibold text-th-text-primary mb-3">Budget & Revenue</h3>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-th-text-secondary mb-1">
                Budget
              </label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-th-text-tertiary">$</span>
                <input
                  type="number"
                  value={budget}
                  onChange={(e) => setBudget(e.target.value)}
                  placeholder="0.00"
                  min="0"
                  step="0.01"
                  className="w-full border border-th-border rounded-lg pl-7 pr-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-th-accent-500"
                />
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-th-text-secondary mb-1">
                Actual Cost
              </label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-th-text-tertiary">$</span>
                <input
                  type="number"
                  value={actualCost}
                  onChange={(e) => setActualCost(e.target.value)}
                  placeholder="0.00"
                  min="0"
                  step="0.01"
                  className="w-full border border-th-border rounded-lg pl-7 pr-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-th-accent-500"
                />
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-th-text-secondary mb-1">
                Expected Revenue
              </label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-th-text-tertiary">$</span>
                <input
                  type="number"
                  value={expectedRevenue}
                  onChange={(e) => setExpectedRevenue(e.target.value)}
                  placeholder="0.00"
                  min="0"
                  step="0.01"
                  className="w-full border border-th-border rounded-lg pl-7 pr-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-th-accent-500"
                />
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-th-text-secondary mb-1">
                Actual Revenue
              </label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-th-text-tertiary">$</span>
                <input
                  type="number"
                  value={actualRevenue}
                  onChange={(e) => setActualRevenue(e.target.value)}
                  placeholder="0.00"
                  min="0"
                  step="0.01"
                  className="w-full border border-th-border rounded-lg pl-7 pr-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-th-accent-500"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Expected Response */}
        <div>
          <label className="block text-sm font-medium text-th-text-secondary mb-1">
            Expected Response (%)
          </label>
          <input
            type="number"
            value={expectedResponse}
            onChange={(e) => setExpectedResponse(e.target.value)}
            placeholder="0"
            min="0"
            max="100"
            step="0.1"
            className="w-full border border-th-border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-th-accent-500"
          />
          <p className="mt-1 text-xs text-th-text-tertiary">Percentage of members expected to respond</p>
        </div>

        {/* Tags */}
        <div>
          <label className="block text-sm font-medium text-th-text-secondary mb-1">
            Tags
          </label>
          <input
            type="text"
            value={tags}
            onChange={(e) => setTags(e.target.value)}
            placeholder="product-launch, q1-2026, email"
            className="w-full border border-th-border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-th-accent-500"
          />
          <p className="mt-1 text-xs text-th-text-tertiary">Separate tags with commas</p>
        </div>

        {/* Actions */}
        <div className="flex justify-end gap-3 pt-4 border-t border-th-border">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-sm font-medium text-th-text-secondary hover:bg-surface-secondary rounded-lg"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={loading}
            className="px-4 py-2 text-sm font-medium text-white bg-th-accent-600 hover:bg-th-accent-700 rounded-lg disabled:opacity-50"
          >
            {loading ? 'Saving...' : campaign ? 'Update Campaign' : 'Create Campaign'}
          </button>
        </div>
      </form>
    </Modal>
  );
}
