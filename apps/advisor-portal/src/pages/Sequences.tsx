import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { format } from 'date-fns';
import {
  Workflow,
  Plus,
  Play,
  Pause,
  Archive,
  Copy,
  MoreVertical,
  Users,
  CheckCircle,
  MessageSquare,
  Mail,
  ChevronRight,
  Search,
} from 'lucide-react';
import { GradientHeader } from '@mpbhealth/ui';
import { useSequences } from '../hooks/useInbox';
import { sequenceService, type Sequence, type SequenceStatus } from '@mpbhealth/champion-core';
import { useAdvisor } from '../contexts/AdvisorContext';

export default function Sequences() {
  const navigate = useNavigate();
  const { profile } = useAdvisor();
  const [statusFilter, setStatusFilter] = useState<SequenceStatus | 'all'>('all');
  const [search, setSearch] = useState('');

  const { sequences, loading, refresh } = useSequences(
    statusFilter === 'all' ? undefined : statusFilter
  );

  const filteredSequences = search
    ? sequences.filter((s) =>
        s.name.toLowerCase().includes(search.toLowerCase())
      )
    : sequences;

  const handleCreateSequence = async () => {
    if (!profile?.org_id) return;
    try {
      const newSequence = await sequenceService.createSequence(profile!.org_id, {
        name: 'New Sequence',
        description: '',
      });
      navigate(`/sequences/${newSequence.id}`);
    } catch (err) {
      console.error('Failed to create sequence:', err);
    }
  };

  const handleStatusChange = async (sequenceId: string, status: SequenceStatus) => {
    try {
      await sequenceService.updateStatus(sequenceId, status);
      refresh();
    } catch (err) {
      console.error('Failed to update status:', err);
    }
  };

  const handleDuplicate = async (sequenceId: string) => {
    try {
      const newSequence = await sequenceService.duplicateSequence(sequenceId);
      navigate(`/sequences/${newSequence.id}`);
    } catch (err) {
      console.error('Failed to duplicate:', err);
    }
  };

  const getStatusBadge = (status: SequenceStatus) => {
    switch (status) {
      case 'active':
        return (
          <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-700">
            <Play className="w-3 h-3 mr-1" />
            Active
          </span>
        );
      case 'paused':
        return (
          <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-700">
            <Pause className="w-3 h-3 mr-1" />
            Paused
          </span>
        );
      case 'draft':
        return (
          <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-neutral-100 text-neutral-600">
            Draft
          </span>
        );
      case 'archived':
        return (
          <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-neutral-100 text-neutral-500">
            <Archive className="w-3 h-3 mr-1" />
            Archived
          </span>
        );
    }
  };

  const getTriggerLabel = (triggerType: string) => {
    switch (triggerType) {
      case 'manual':
        return 'Manual enrollment';
      case 'lead_created':
        return 'New lead created';
      case 'stage_change':
        return 'Stage change';
      case 'priority_lane':
        return 'Added to lane';
      case 'tag_added':
        return 'Tag added';
      default:
        return triggerType;
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <GradientHeader
          title="Sequences"
          subtitle="Automate your outreach with multi-step sequences"
          icon={<Workflow className="w-6 h-6" />}
        />
        <button
          onClick={handleCreateSequence}
          className="flex items-center space-x-2 px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700"
        >
          <Plus className="w-4 h-4" />
          <span>New Sequence</span>
        </button>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
        {/* Search */}
        <div className="flex items-center bg-white border border-neutral-200 rounded-lg px-3 py-2 w-full sm:w-64">
          <Search className="w-4 h-4 text-neutral-400 mr-2" />
          <input
            type="text"
            placeholder="Search sequences..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="bg-transparent border-none outline-none text-sm w-full text-neutral-700 placeholder-neutral-400"
          />
        </div>

        {/* Status filter */}
        <div className="flex items-center space-x-2">
          {(['all', 'active', 'paused', 'draft', 'archived'] as const).map((status) => (
            <button
              key={status}
              onClick={() => setStatusFilter(status)}
              className={`px-3 py-1.5 rounded-full text-sm font-medium capitalize transition-colors ${
                statusFilter === status
                  ? 'bg-neutral-900 text-white'
                  : 'bg-neutral-100 text-neutral-600 hover:bg-neutral-200'
              }`}
            >
              {status}
            </button>
          ))}
        </div>
      </div>

      {/* Sequences list */}
      {loading ? (
        <div className="flex items-center justify-center py-16">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600" />
        </div>
      ) : filteredSequences.length === 0 ? (
        <div className="text-center py-16 bg-white rounded-xl border border-neutral-200">
          <Workflow className="w-12 h-12 text-neutral-300 mx-auto mb-3" />
          <p className="text-neutral-500 mb-4">
            {search ? 'No sequences match your search' : 'No sequences yet'}
          </p>
          <button
            onClick={handleCreateSequence}
            className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700"
          >
            Create Your First Sequence
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredSequences.map((sequence) => (
            <div
              key={sequence.id}
              className="bg-white rounded-xl border border-neutral-200 p-5 hover:shadow-md transition-shadow cursor-pointer"
              onClick={() => navigate(`/sequences/${sequence.id}`)}
            >
              {/* Header */}
              <div className="flex items-start justify-between mb-3">
                <div>
                  <h3 className="font-semibold text-neutral-900">{sequence.name}</h3>
                  <p className="text-sm text-neutral-500 mt-0.5">
                    {getTriggerLabel(sequence.trigger_type)}
                  </p>
                </div>
                <div className="flex items-center space-x-2">
                  {getStatusBadge(sequence.status)}
                  <div className="relative group">
                    <button
                      onClick={(e) => e.stopPropagation()}
                      className="p-1 hover:bg-neutral-100 rounded"
                    >
                      <MoreVertical className="w-4 h-4 text-neutral-400" />
                    </button>
                    <div className="absolute right-0 top-full mt-1 w-40 bg-white rounded-lg shadow-lg border border-neutral-200 py-1 z-10 hidden group-hover:block">
                      {sequence.status === 'active' && (
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleStatusChange(sequence.id, 'paused');
                          }}
                          className="w-full px-3 py-2 text-left text-sm hover:bg-neutral-50 flex items-center space-x-2"
                        >
                          <Pause className="w-4 h-4" />
                          <span>Pause</span>
                        </button>
                      )}
                      {(sequence.status === 'draft' || sequence.status === 'paused') && (
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleStatusChange(sequence.id, 'active');
                          }}
                          className="w-full px-3 py-2 text-left text-sm hover:bg-neutral-50 flex items-center space-x-2"
                        >
                          <Play className="w-4 h-4" />
                          <span>Activate</span>
                        </button>
                      )}
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDuplicate(sequence.id);
                        }}
                        className="w-full px-3 py-2 text-left text-sm hover:bg-neutral-50 flex items-center space-x-2"
                      >
                        <Copy className="w-4 h-4" />
                        <span>Duplicate</span>
                      </button>
                      {sequence.status !== 'archived' && (
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleStatusChange(sequence.id, 'archived');
                          }}
                          className="w-full px-3 py-2 text-left text-sm hover:bg-neutral-50 flex items-center space-x-2 text-red-600"
                        >
                          <Archive className="w-4 h-4" />
                          <span>Archive</span>
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              </div>

              {/* Description */}
              {sequence.description && (
                <p className="text-sm text-neutral-600 mb-4 line-clamp-2">
                  {sequence.description}
                </p>
              )}

              {/* Stats */}
              <div className="grid grid-cols-3 gap-4 pt-3 border-t border-neutral-100">
                <div className="text-center">
                  <div className="flex items-center justify-center text-neutral-400 mb-1">
                    <Users className="w-4 h-4" />
                  </div>
                  <p className="text-lg font-semibold text-neutral-900">
                    {sequence.total_enrolled}
                  </p>
                  <p className="text-xs text-neutral-500">Enrolled</p>
                </div>
                <div className="text-center">
                  <div className="flex items-center justify-center text-neutral-400 mb-1">
                    <CheckCircle className="w-4 h-4" />
                  </div>
                  <p className="text-lg font-semibold text-neutral-900">
                    {sequence.total_completed}
                  </p>
                  <p className="text-xs text-neutral-500">Completed</p>
                </div>
                <div className="text-center">
                  <div className="flex items-center justify-center text-neutral-400 mb-1">
                    <MessageSquare className="w-4 h-4" />
                  </div>
                  <p className="text-lg font-semibold text-neutral-900">
                    {sequence.total_replied}
                  </p>
                  <p className="text-xs text-neutral-500">Replied</p>
                </div>
              </div>

              {/* Footer */}
              <div className="flex items-center justify-between mt-4 pt-3 border-t border-neutral-100 text-xs text-neutral-400">
                <span>Created {format(new Date(sequence.created_at), 'MMM d, yyyy')}</span>
                <ChevronRight className="w-4 h-4" />
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
