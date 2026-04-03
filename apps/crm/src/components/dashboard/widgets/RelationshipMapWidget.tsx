/**
 * Relationship Map Widget
 *
 * Zoho-killer feature: Visual relationship intelligence showing connections
 * between accounts, contacts, deals, and engagement health.
 */

import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Users,
  Building2,
  DollarSign,
  ArrowRight,
  Activity,
  Clock,
  Star,
  ChevronRight,
  Sparkles,
} from 'lucide-react';
import { useCRM } from '../../../contexts/CRMContext';

interface RelationshipNode {
  id: string;
  type: 'account' | 'contact' | 'deal';
  name: string;
  subtitle?: string;
  healthScore: number;
  lastActivity: string | null;
  value?: number;
}

interface RelationshipEdge {
  from: string;
  to: string;
  label: string;
  strength: 'strong' | 'moderate' | 'weak';
}

const HEALTH_COLORS: Record<string, { bg: string; text: string; ring: string }> = {
  excellent: { bg: 'bg-green-100', text: 'text-green-700', ring: 'ring-green-400' },
  good: { bg: 'bg-blue-100', text: 'text-blue-700', ring: 'ring-blue-400' },
  fair: { bg: 'bg-amber-100', text: 'text-amber-700', ring: 'ring-amber-400' },
  poor: { bg: 'bg-red-100', text: 'text-red-700', ring: 'ring-red-400' },
};

function getHealthLevel(score: number): string {
  if (score >= 80) return 'excellent';
  if (score >= 60) return 'good';
  if (score >= 40) return 'fair';
  return 'poor';
}

function getHealthLabel(score: number): string {
  if (score >= 80) return 'Strong';
  if (score >= 60) return 'Healthy';
  if (score >= 40) return 'Needs Attention';
  return 'At Risk';
}

export default function RelationshipMapWidget() {
  const navigate = useNavigate();
  const { accountService, contactService, dealService } = useCRM();
  const [accounts, setAccounts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedAccount, setSelectedAccount] = useState<string | null>(null);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const { accounts: accs } = await accountService.getAccounts({}, 10, 0);
      setAccounts(accs);
    } catch (err) {
      console.error('Failed to load relationship data:', err);
    } finally {
      setLoading(false);
    }
  };

  const calculateAccountHealth = (account: any): number => {
    let score = 50;
    if (account.deal_count > 0) score += 15;
    if (account.contact_count > 2) score += 10;
    if (account.last_activity_at) {
      const daysSince = Math.floor(
        (Date.now() - new Date(account.last_activity_at).getTime()) / 86_400_000
      );
      if (daysSince < 7) score += 20;
      else if (daysSince < 30) score += 10;
      else score -= 15;
    } else {
      score -= 10;
    }
    return Math.min(100, Math.max(0, score));
  };

  const formatTimeAgo = (date: string | null) => {
    if (!date) return 'Never';
    const days = Math.floor((Date.now() - new Date(date).getTime()) / 86_400_000);
    if (days === 0) return 'Today';
    if (days === 1) return 'Yesterday';
    if (days < 30) return `${days}d ago`;
    return `${Math.floor(days / 30)}mo ago`;
  };

  if (loading) {
    return (
      <div className="animate-pulse space-y-3 p-1">
        <div className="h-4 bg-surface-tertiary rounded w-1/3" />
        {[1, 2, 3].map(i => (
          <div key={i} className="h-24 bg-surface-tertiary rounded-lg" />
        ))}
      </div>
    );
  }

  if (accounts.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-8 text-center">
        <Building2 className="w-10 h-10 text-th-text-tertiary mb-3 opacity-40" />
        <p className="text-sm font-medium text-th-text-secondary">No accounts yet</p>
        <p className="text-xs text-th-text-tertiary mt-1">
          Create accounts to see relationship intelligence
        </p>
      </div>
    );
  }

  // Group accounts by health
  const healthDistribution = {
    excellent: 0,
    good: 0,
    fair: 0,
    poor: 0,
  };

  accounts.forEach(acc => {
    const health = getHealthLevel(calculateAccountHealth(acc));
    healthDistribution[health as keyof typeof healthDistribution]++;
  });

  return (
    <div className="space-y-4">
      {/* Health Distribution Bar */}
      <div>
        <div className="flex items-center justify-between mb-2">
          <h4 className="text-xs font-semibold text-th-text-tertiary uppercase tracking-wider">
            Relationship Health
          </h4>
          <span className="text-xs text-th-text-tertiary">{accounts.length} accounts</span>
        </div>
        <div className="flex h-2.5 rounded-full overflow-hidden bg-surface-tertiary">
          {Object.entries(healthDistribution).map(([level, count]) => {
            if (count === 0) return null;
            const width = (count / accounts.length) * 100;
            const colors: Record<string, string> = {
              excellent: 'bg-green-500',
              good: 'bg-blue-500',
              fair: 'bg-amber-500',
              poor: 'bg-red-500',
            };
            return (
              <div
                key={level}
                className={`${colors[level]} transition-all duration-500`}
                style={{ width: `${width}%` }}
                title={`${level}: ${count}`}
              />
            );
          })}
        </div>
        <div className="flex items-center gap-3 mt-2">
          {Object.entries(healthDistribution).map(([level, count]) => {
            if (count === 0) return null;
            const colors = HEALTH_COLORS[level];
            return (
              <div key={level} className="flex items-center gap-1">
                <div className={`w-2 h-2 rounded-full ${colors.bg}`} />
                <span className="text-[10px] text-th-text-tertiary capitalize">
                  {level} ({count})
                </span>
              </div>
            );
          })}
        </div>
      </div>

      {/* Account List with Relationship Insights */}
      <div className="space-y-2">
        {accounts.slice(0, 6).map((account) => {
          const health = calculateAccountHealth(account);
          const healthLevel = getHealthLevel(health);
          const colors = HEALTH_COLORS[healthLevel];

          return (
            <button
              key={account.id}
              onClick={() => navigate(`/accounts/${account.id}`)}
              className="w-full flex items-center gap-3 p-3 rounded-xl border border-th-border hover:bg-surface-secondary transition-all text-left group"
            >
              {/* Health Ring */}
              <div className="relative flex-shrink-0">
                <div className={`w-10 h-10 rounded-full flex items-center justify-center ${colors.bg}`}>
                  <Building2 className={`w-5 h-5 ${colors.text}`} />
                </div>
                <div
                  className={`absolute -bottom-0.5 -right-0.5 w-4 h-4 rounded-full border-2 border-surface-primary flex items-center justify-center text-[8px] font-bold ${colors.bg} ${colors.text}`}
                >
                  {health}
                </div>
              </div>

              {/* Info */}
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-th-text-primary group-hover:text-th-accent-600 truncate transition-colors">
                  {account.name}
                </p>
                <div className="flex items-center gap-3 mt-0.5">
                  {account.contact_count > 0 && (
                    <span className="text-[10px] text-th-text-tertiary flex items-center gap-0.5">
                      <Users className="w-3 h-3" /> {account.contact_count}
                    </span>
                  )}
                  {account.deal_count > 0 && (
                    <span className="text-[10px] text-th-text-tertiary flex items-center gap-0.5">
                      <DollarSign className="w-3 h-3" /> {account.deal_count}
                    </span>
                  )}
                  <span className="text-[10px] text-th-text-tertiary flex items-center gap-0.5">
                    <Clock className="w-3 h-3" /> {formatTimeAgo(account.last_activity_at || account.updated_at)}
                  </span>
                </div>
              </div>

              {/* Health Badge */}
              <div className="flex-shrink-0 flex items-center gap-2">
                <span className={`text-[10px] px-2 py-0.5 rounded-full font-medium ${colors.bg} ${colors.text}`}>
                  {getHealthLabel(health)}
                </span>
                <ChevronRight className="w-3.5 h-3.5 text-th-text-tertiary opacity-0 group-hover:opacity-100 transition-opacity" />
              </div>
            </button>
          );
        })}
      </div>

      {/* View All */}
      {accounts.length > 6 && (
        <button
          onClick={() => navigate('/accounts')}
          className="w-full text-center py-2 text-xs font-medium text-th-accent-600 hover:text-th-accent-700 hover:bg-th-accent-50 rounded-lg transition-colors"
        >
          View all {accounts.length} accounts
        </button>
      )}
    </div>
  );
}
