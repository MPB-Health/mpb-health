// ============================================================================
// AI Suggestions Panel — Shows pending AI suggestions for context
// ============================================================================

import { useState, useCallback } from 'react';
import { formatDistanceToNow } from 'date-fns';
import {
  Sparkles,
  MessageSquare,
  TrendingUp,
  ArrowRight,
  ThumbsUp,
  ThumbsDown,
  X,
  ChevronDown,
  ChevronUp,
  Lightbulb,
  Target,
} from 'lucide-react';
import { usePendingAISuggestions, useComplianceActions } from '../../hooks/useCompliance';
import type { AISuggestion, SuggestionType } from '@mpbhealth/champion-core';

interface AISuggestionsPanelProps {
  userId: string;
  leadId?: string;
  conversationId?: string;
  onApplyMessage?: (message: string) => void;
  onApplyScoreAdjustment?: (delta: number) => void;
  onApplyLaneMove?: (laneId: string) => void;
  className?: string;
}

const SUGGESTION_ICONS: Record<SuggestionType, typeof MessageSquare> = {
  message_draft: MessageSquare,
  reply_suggestion: MessageSquare,
  score_adjustment: TrendingUp,
  lane_move: ArrowRight,
  next_action: Lightbulb,
};

const SUGGESTION_COLORS: Record<SuggestionType, string> = {
  message_draft: 'from-blue-500 to-cyan-500',
  reply_suggestion: 'from-purple-500 to-pink-500',
  score_adjustment: 'from-green-500 to-emerald-500',
  lane_move: 'from-orange-500 to-amber-500',
  next_action: 'from-indigo-500 to-violet-500',
};

export default function AISuggestionsPanel({
  userId,
  leadId,
  conversationId,
  onApplyMessage,
  onApplyScoreAdjustment,
  onApplyLaneMove,
  className = '',
}: AISuggestionsPanelProps) {
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [dismissedIds, setDismissedIds] = useState<Set<string>>(new Set());

  const { suggestions, loading, refresh } = usePendingAISuggestions(userId, {
    leadId,
    conversationId,
  });
  const { recordSuggestionFeedback, loading: actionLoading } = useComplianceActions();

  const visibleSuggestions = suggestions.filter(s => !dismissedIds.has(s.id));

  const handleAccept = useCallback(async (suggestion: AISuggestion) => {
    switch (suggestion.suggestion_type) {
      case 'message_draft':
      case 'reply_suggestion':
        if (suggestion.suggested_message && onApplyMessage) {
          onApplyMessage(suggestion.suggested_message);
        }
        break;
      case 'score_adjustment':
        if (suggestion.suggested_score_delta && onApplyScoreAdjustment) {
          onApplyScoreAdjustment(suggestion.suggested_score_delta);
        }
        break;
      case 'lane_move':
        if (suggestion.suggested_lane_id && onApplyLaneMove) {
          onApplyLaneMove(suggestion.suggested_lane_id);
        }
        break;
    }

    await recordSuggestionFeedback(suggestion.id, 'accepted');
    setDismissedIds(prev => new Set([...prev, suggestion.id]));
    refresh();
  }, [recordSuggestionFeedback, refresh, onApplyMessage, onApplyScoreAdjustment, onApplyLaneMove]);

  const handleReject = useCallback(async (suggestionId: string) => {
    await recordSuggestionFeedback(suggestionId, 'rejected');
    setDismissedIds(prev => new Set([...prev, suggestionId]));
    refresh();
  }, [recordSuggestionFeedback, refresh]);

  const handleIgnore = useCallback(async (suggestionId: string) => {
    await recordSuggestionFeedback(suggestionId, 'ignored');
    setDismissedIds(prev => new Set([...prev, suggestionId]));
  }, [recordSuggestionFeedback]);

  if (loading && suggestions.length === 0) {
    return null;
  }

  if (visibleSuggestions.length === 0) {
    return null;
  }

  return (
    <div className={`space-y-3 ${className}`}>
      <div className="flex items-center gap-2">
        <div className="w-6 h-6 rounded-lg bg-gradient-to-br from-purple-500 to-blue-500 flex items-center justify-center">
          <Sparkles className="h-3.5 w-3.5 text-white" />
        </div>
        <h3 className="text-sm font-semibold text-gray-900">AI Suggestions</h3>
        <span className="text-xs text-gray-500 bg-gray-100 px-2 py-0.5 rounded-full">
          {visibleSuggestions.length}
        </span>
      </div>

      <div className="space-y-2">
        {visibleSuggestions.map((suggestion) => {
          const Icon = SUGGESTION_ICONS[suggestion.suggestion_type];
          const colorClass = SUGGESTION_COLORS[suggestion.suggestion_type];
          const isExpanded = expandedId === suggestion.id;

          return (
            <div
              key={suggestion.id}
              className="bg-white rounded-lg border border-gray-200 overflow-hidden shadow-sm"
            >
              {/* Header */}
              <button
                onClick={() => setExpandedId(isExpanded ? null : suggestion.id)}
                className="w-full p-3 flex items-center gap-3 text-left hover:bg-gray-50 transition-colors"
              >
                <div className={`w-8 h-8 rounded-lg bg-gradient-to-br ${colorClass} flex items-center justify-center flex-shrink-0`}>
                  <Icon className="h-4 w-4 text-white" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-900 truncate">
                    {suggestion.title}
                  </p>
                  <p className="text-xs text-gray-500">
                    {formatDistanceToNow(new Date(suggestion.created_at), { addSuffix: true })}
                    {suggestion.confidence && (
                      <span className="ml-2">
                        • {Math.round(suggestion.confidence * 100)}% confidence
                      </span>
                    )}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleIgnore(suggestion.id);
                    }}
                    className="p-1 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded transition-colors"
                    title="Dismiss"
                  >
                    <X className="h-4 w-4" />
                  </button>
                  {isExpanded ? (
                    <ChevronUp className="h-4 w-4 text-gray-400" />
                  ) : (
                    <ChevronDown className="h-4 w-4 text-gray-400" />
                  )}
                </div>
              </button>

              {/* Expanded Content */}
              {isExpanded && (
                <div className="px-3 pb-3 space-y-3">
                  {/* Content */}
                  <div className="bg-gray-50 rounded-lg p-3">
                    {(suggestion.suggestion_type === 'message_draft' || suggestion.suggestion_type === 'reply_suggestion') && suggestion.suggested_message && (
                      <div>
                        <p className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-1">
                          Suggested Message
                        </p>
                        <p className="text-sm text-gray-800 whitespace-pre-wrap">
                          {suggestion.suggested_message}
                        </p>
                      </div>
                    )}

                    {suggestion.suggestion_type === 'score_adjustment' && (
                      <div className="flex items-center gap-3">
                        <Target className="h-5 w-5 text-gray-400" />
                        <div>
                          <p className="text-xs font-medium text-gray-500 uppercase tracking-wide">
                            Score Adjustment
                          </p>
                          <p className={`text-lg font-bold ${
                            (suggestion.suggested_score_delta || 0) > 0 ? 'text-green-600' : 'text-red-600'
                          }`}>
                            {(suggestion.suggested_score_delta || 0) > 0 ? '+' : ''}
                            {suggestion.suggested_score_delta} points
                          </p>
                        </div>
                      </div>
                    )}

                    {suggestion.suggestion_type === 'lane_move' && (
                      <div className="flex items-center gap-3">
                        <ArrowRight className="h-5 w-5 text-gray-400" />
                        <div>
                          <p className="text-xs font-medium text-gray-500 uppercase tracking-wide">
                            Move to Lane
                          </p>
                          <p className="text-sm font-medium text-gray-900">
                            {suggestion.content}
                          </p>
                        </div>
                      </div>
                    )}

                    {suggestion.suggestion_type === 'next_action' && (
                      <div>
                        <p className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-1">
                          Suggested Action
                        </p>
                        <p className="text-sm text-gray-800">
                          {suggestion.content}
                        </p>
                      </div>
                    )}
                  </div>

                  {/* Reasoning */}
                  {suggestion.reasoning && (
                    <p className="text-xs text-gray-500 italic px-1">
                      {suggestion.reasoning}
                    </p>
                  )}

                  {/* Actions */}
                  <div className="flex items-center justify-end gap-2 pt-2 border-t border-gray-200">
                    <button
                      onClick={() => handleReject(suggestion.id)}
                      disabled={actionLoading}
                      className="flex items-center gap-1.5 px-3 py-1.5 text-sm text-gray-600 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors disabled:opacity-50"
                    >
                      <ThumbsDown className="h-3.5 w-3.5" />
                      Not helpful
                    </button>
                    <button
                      onClick={() => handleAccept(suggestion)}
                      disabled={actionLoading}
                      className="flex items-center gap-1.5 px-3 py-1.5 text-sm bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors disabled:opacity-50"
                    >
                      <ThumbsUp className="h-3.5 w-3.5" />
                      Apply
                    </button>
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
