// ============================================================================
// AI Scoring Factors — Display AI-generated scoring factors for a lead
// ============================================================================

import { useState } from 'react';
import { formatDistanceToNow } from 'date-fns';
import {
  Brain,
  TrendingUp,
  TrendingDown,
  ChevronDown,
  ChevronUp,
  Info,
  Clock,
  Sparkles,
} from 'lucide-react';
import { useLeadScoringFactors } from '../../hooks/useCompliance';
import type { AIScoringFactor } from '@mpbhealth/champion-core';

interface AIScoringFactorsProps {
  leadId: string;
  className?: string;
  compact?: boolean;
}

const FACTOR_TYPE_COLORS: Record<string, string> = {
  engagement: 'bg-blue-100 text-blue-700',
  response_time: 'bg-green-100 text-green-700',
  sentiment: 'bg-purple-100 text-purple-700',
  intent: 'bg-orange-100 text-orange-700',
  recency: 'bg-cyan-100 text-cyan-700',
  completeness: 'bg-pink-100 text-pink-700',
};

export default function AIScoringFactors({
  leadId,
  className = '',
  compact = false,
}: AIScoringFactorsProps) {
  const [isExpanded, setIsExpanded] = useState(!compact);
  const { factors, loading, error } = useLeadScoringFactors(leadId);

  const totalAdjustment = factors.reduce((sum, f) => sum + f.score_impact, 0);

  if (loading) {
    return (
      <div className={`bg-gray-50 rounded-lg p-4 ${className}`}>
        <div className="animate-pulse flex items-center gap-2">
          <div className="w-5 h-5 bg-gray-200 rounded" />
          <div className="h-4 bg-gray-200 rounded w-32" />
        </div>
      </div>
    );
  }

  if (error || factors.length === 0) {
    return null;
  }

  if (compact) {
    return (
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className={`w-full bg-gradient-to-br from-purple-50 to-blue-50 rounded-lg border border-purple-200 overflow-hidden ${className}`}
      >
        <div className="flex items-center justify-between p-3">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-purple-500 to-blue-500 flex items-center justify-center">
              <Brain className="h-4 w-4 text-white" />
            </div>
            <span className="text-sm font-medium text-gray-900">AI Score Factors</span>
          </div>
          <div className="flex items-center gap-2">
            <span className={`text-sm font-bold ${
              totalAdjustment > 0 ? 'text-green-600' :
              totalAdjustment < 0 ? 'text-red-600' : 'text-gray-600'
            }`}>
              {totalAdjustment > 0 ? '+' : ''}{totalAdjustment}
            </span>
            {isExpanded ? (
              <ChevronUp className="h-4 w-4 text-gray-400" />
            ) : (
              <ChevronDown className="h-4 w-4 text-gray-400" />
            )}
          </div>
        </div>

        {isExpanded && (
          <div className="border-t border-purple-200 p-3 space-y-2">
            {factors.map((factor) => (
              <FactorRow key={factor.id} factor={factor} />
            ))}
          </div>
        )}
      </button>
    );
  }

  return (
    <div className={`bg-white rounded-xl border border-gray-200 overflow-hidden ${className}`}>
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 bg-gradient-to-r from-purple-50 to-blue-50 border-b border-gray-200">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-purple-500 to-blue-500 flex items-center justify-center">
            <Brain className="h-4 w-4 text-white" />
          </div>
          <div>
            <h3 className="text-sm font-semibold text-gray-900">AI Score Analysis</h3>
            <p className="text-xs text-gray-500">{factors.length} active factors</p>
          </div>
        </div>
        <div className="text-right">
          <p className="text-xs text-gray-500">Total adjustment</p>
          <p className={`text-lg font-bold ${
            totalAdjustment > 0 ? 'text-green-600' :
            totalAdjustment < 0 ? 'text-red-600' : 'text-gray-600'
          }`}>
            {totalAdjustment > 0 ? '+' : ''}{totalAdjustment} pts
          </p>
        </div>
      </div>

      {/* Factors List */}
      <div className="divide-y divide-gray-100">
        {factors.map((factor) => (
          <FactorDetailRow key={factor.id} factor={factor} />
        ))}
      </div>

      {/* Footer */}
      <div className="px-4 py-3 bg-gray-50 border-t border-gray-200">
        <div className="flex items-center gap-2 text-xs text-gray-500">
          <Sparkles className="h-3.5 w-3.5" />
          <span>Powered by AI analysis • Updated continuously</span>
        </div>
      </div>
    </div>
  );
}

function FactorRow({ factor }: { factor: AIScoringFactor }) {
  const isPositive = factor.score_impact > 0;

  return (
    <div className="flex items-center justify-between text-left">
      <div className="flex items-center gap-2">
        {isPositive ? (
          <TrendingUp className="h-3.5 w-3.5 text-green-500" />
        ) : (
          <TrendingDown className="h-3.5 w-3.5 text-red-500" />
        )}
        <span className="text-sm text-gray-700">{factor.factor_name}</span>
      </div>
      <span className={`text-sm font-medium ${
        isPositive ? 'text-green-600' : 'text-red-600'
      }`}>
        {isPositive ? '+' : ''}{factor.score_impact}
      </span>
    </div>
  );
}

function FactorDetailRow({ factor }: { factor: AIScoringFactor }) {
  const [showDetails, setShowDetails] = useState(false);
  const isPositive = factor.score_impact > 0;
  const typeColor = FACTOR_TYPE_COLORS[factor.factor_type] || 'bg-gray-100 text-gray-700';

  return (
    <div className="p-4 hover:bg-gray-50 transition-colors">
      <div className="flex items-start justify-between gap-4">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${typeColor}`}>
              {factor.factor_type}
            </span>
            {factor.valid_until && (
              <span className="flex items-center gap-1 text-xs text-gray-400">
                <Clock className="h-3 w-3" />
                {formatDistanceToNow(new Date(factor.valid_until), { addSuffix: true })}
              </span>
            )}
          </div>
          <p className="text-sm font-medium text-gray-900">{factor.factor_name}</p>
          {factor.reasoning && (
            <p className="text-sm text-gray-500 mt-1">{factor.reasoning}</p>
          )}
        </div>
        <div className="flex items-center gap-3">
          <div className={`flex items-center gap-1 ${
            isPositive ? 'text-green-600' : 'text-red-600'
          }`}>
            {isPositive ? (
              <TrendingUp className="h-4 w-4" />
            ) : (
              <TrendingDown className="h-4 w-4" />
            )}
            <span className="text-lg font-bold">
              {isPositive ? '+' : ''}{factor.score_impact}
            </span>
          </div>
          {factor.analysis_data && Object.keys(factor.analysis_data).length > 0 && (
            <button
              onClick={() => setShowDetails(!showDetails)}
              className="p-1 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded transition-colors"
              title="View analysis data"
            >
              <Info className="h-4 w-4" />
            </button>
          )}
        </div>
      </div>

      {showDetails && factor.analysis_data && (
        <div className="mt-3 p-3 bg-gray-100 rounded-lg">
          <p className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-2">Analysis Data</p>
          <pre className="text-xs text-gray-700 overflow-x-auto">
            {JSON.stringify(factor.analysis_data, null, 2)}
          </pre>
        </div>
      )}
    </div>
  );
}
