import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Zap,
  RefreshCw,
  Filter,
  CheckCircle2,
  Clock,
  TrendingUp,
  ChevronRight,
} from 'lucide-react';
import { GradientHeader, MetricCard } from '@mpbhealth/ui';
import { usePowerList, usePriorityStats, usePriorityActions, usePriorityLanes } from '../hooks/usePriority';
import { PriorityCard } from '../components/priority/PriorityCard';
import type { PowerListItem } from '@mpbhealth/champion-core';

export default function PowerList() {
  const navigate = useNavigate();
  const { items, loading, error, refresh } = usePowerList();
  const { stats, loading: statsLoading } = usePriorityStats();
  const { lanes } = usePriorityLanes();
  const { completeItem, snoozeItem, moveItem } = usePriorityActions();

  const [selectedLane, setSelectedLane] = useState<string | null>(null);
  const [showSnoozeModal, setShowSnoozeModal] = useState<string | null>(null);
  const [showMoveModal, setShowMoveModal] = useState<string | null>(null);

  const filteredItems = selectedLane
    ? items.filter((item) => item.lane_id === selectedLane)
    : items;

  const handleComplete = async (itemId: string) => {
    try {
      await completeItem(itemId, 'Marked complete from Power List');
      refresh();
    } catch (err) {
      console.error('Failed to complete item:', err);
    }
  };

  const handleSnooze = (itemId: string) => {
    setShowSnoozeModal(itemId);
  };

  const handleMove = (itemId: string) => {
    setShowMoveModal(itemId);
  };

  const handleItemClick = (item: PowerListItem) => {
    if (item.lead_id) {
      navigate(`/leads/${item.lead_id}`);
    }
  };

  const confirmSnooze = async (hours: number) => {
    if (!showSnoozeModal) return;
    try {
      const until = new Date();
      until.setHours(until.getHours() + hours);
      await snoozeItem(showSnoozeModal, until, `Snoozed for ${hours} hours`);
      setShowSnoozeModal(null);
      refresh();
    } catch (err) {
      console.error('Failed to snooze item:', err);
    }
  };

  const confirmMove = async (newLaneId: string) => {
    if (!showMoveModal) return;
    try {
      await moveItem(showMoveModal, newLaneId);
      setShowMoveModal(null);
      refresh();
    } catch (err) {
      console.error('Failed to move item:', err);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <GradientHeader
        title="Power List"
        subtitle="Your prioritized leads for today. Focus on high-score items first."
        icon={<Zap className="w-6 h-6" />}
      />

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <MetricCard
          label="Total Active"
          value={stats?.totalItems ?? '-'}
          icon={<TrendingUp className="w-5 h-5" />}
        />
        <MetricCard
          label="Completed Today"
          value={stats?.completedToday ?? '-'}
          icon={<CheckCircle2 className="w-5 h-5" />}
        />
        <MetricCard
          label="Snoozed"
          value={stats?.snoozedCount ?? '-'}
          icon={<Clock className="w-5 h-5" />}
        />
        <button onClick={refresh} className="text-left">
          <MetricCard
            label="Refresh"
            value={<RefreshCw className={`w-5 h-5 ${loading ? 'animate-spin' : ''}`} />}
            icon={<span className="text-xs">Click to refresh</span>}
            className="hover:border-th-accent-300 cursor-pointer"
          />
        </button>
      </div>

      {/* Lane filter */}
      <div className="flex items-center space-x-2 overflow-x-auto pb-2">
        <button
          onClick={() => setSelectedLane(null)}
          className={`px-3 py-1.5 rounded-full text-sm font-medium whitespace-nowrap transition-colors ${
            !selectedLane
              ? 'bg-neutral-900 text-white'
              : 'bg-neutral-100 text-neutral-600 hover:bg-neutral-200'
          }`}
        >
          All Lanes
        </button>
        {lanes.map((lane) => {
          const laneStyle = { '--lane-color': lane.color } as React.CSSProperties;
          return (
            <button
              key={lane.id}
              onClick={() => setSelectedLane(lane.id)}
              className={`px-3 py-1.5 rounded-full text-sm font-medium whitespace-nowrap transition-colors flex items-center space-x-2 ${
                selectedLane === lane.id
                  ? 'text-white lane-button-selected'
                  : 'bg-neutral-100 text-neutral-600 hover:bg-neutral-200'
              }`}
              style={laneStyle}
            >
              <span className="w-2 h-2 rounded-full lane-color-indicator" />
              <span>{lane.name}</span>
            </button>
          );
        })}
      </div>

      {/* Items list */}
      {loading ? (
        <div className="flex items-center justify-center py-16">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600" />
        </div>
      ) : error ? (
        <div className="text-center py-16">
          <p className="text-red-500 mb-4">Failed to load power list</p>
          <button
            onClick={refresh}
            className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700"
          >
            Try Again
          </button>
        </div>
      ) : filteredItems.length === 0 ? (
        <div className="text-center py-16">
          <Zap className="w-12 h-12 text-neutral-300 mx-auto mb-3" />
          <p className="text-neutral-500">
            {selectedLane ? 'No items in this lane' : 'Your power list is empty. Great work!'}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredItems.map((item) => (
            <PriorityCard
              key={item.item_id}
              item={item}
              onComplete={handleComplete}
              onSnooze={handleSnooze}
              onMove={handleMove}
              onClick={handleItemClick}
            />
          ))}
        </div>
      )}

      {/* Snooze Modal */}
      {showSnoozeModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl p-6 w-full max-w-sm mx-4">
            <h3 className="text-lg font-semibold text-neutral-900 mb-4">Snooze Item</h3>
            <p className="text-sm text-neutral-600 mb-4">
              How long would you like to snooze this item?
            </p>
            <div className="space-y-2">
              {[
                { hours: 1, label: '1 hour' },
                { hours: 4, label: '4 hours' },
                { hours: 24, label: '1 day' },
                { hours: 72, label: '3 days' },
                { hours: 168, label: '1 week' },
              ].map(({ hours, label }) => (
                <button
                  key={hours}
                  onClick={() => confirmSnooze(hours)}
                  className="w-full px-4 py-2 text-left text-sm hover:bg-neutral-50 rounded-lg flex items-center justify-between"
                >
                  <span>{label}</span>
                  <ChevronRight className="w-4 h-4 text-neutral-400" />
                </button>
              ))}
            </div>
            <button
              onClick={() => setShowSnoozeModal(null)}
              className="w-full mt-4 px-4 py-2 text-sm text-neutral-600 hover:bg-neutral-100 rounded-lg"
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      {/* Move Modal */}
      {showMoveModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl p-6 w-full max-w-sm mx-4">
            <h3 className="text-lg font-semibold text-neutral-900 mb-4">Move to Lane</h3>
            <p className="text-sm text-neutral-600 mb-4">
              Select the lane to move this item to:
            </p>
            <div className="space-y-2">
              {lanes.map((lane) => {
                const laneStyle = { '--lane-color': lane.color } as React.CSSProperties;
                return (
                  <button
                    key={lane.id}
                    onClick={() => confirmMove(lane.id)}
                    className="w-full px-4 py-2 text-left text-sm hover:bg-neutral-50 rounded-lg flex items-center space-x-3"
                    style={laneStyle}
                  >
                    <span className="w-3 h-3 rounded-full lane-color-indicator" />
                    <span>{lane.name}</span>
                  </button>
                );
              })}
            </div>
            <button
              onClick={() => setShowMoveModal(null)}
              className="w-full mt-4 px-4 py-2 text-sm text-neutral-600 hover:bg-neutral-100 rounded-lg"
            >
              Cancel
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
