import { useState, useEffect } from 'react';
import { RefreshCw, Sparkles, Copy, Check, TrendingUp, AlertTriangle, Zap, Send } from 'lucide-react';
import toast from 'react-hot-toast';
import { useCRM } from '../contexts/CRMContext';
import { SendDraftModal } from './SendDraftModal';
import type { AILeadInsight } from '@mpbhealth/crm-core';

interface AIInsightsPanelProps {
  leadId: string;
  leadEmail?: string;
}

export function AIInsightsPanel({ leadId, leadEmail }: AIInsightsPanelProps) {
  const { insightsService } = useCRM();
  const [insights, setInsights] = useState<AILeadInsight | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [draftLoading, setDraftLoading] = useState<'email' | 'sms' | null>(null);
  const [draft, setDraft] = useState<{ type: string; subject?: string; body: string } | null>(null);
  const [copied, setCopied] = useState(false);
  const [showSendModal, setShowSendModal] = useState(false);

  useEffect(() => {
    loadInsights();
  }, [leadId]);

  const loadInsights = async () => {
    setLoading(true);
    const data = await insightsService.getInsights(leadId);
    setInsights(data);
    setLoading(false);
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    const result = await insightsService.refreshInsights(leadId);
    if (result.success) {
      await loadInsights();
      toast.success('Insights refreshed');
    } else {
      toast.error(result.error || 'Failed to refresh');
    }
    setRefreshing(false);
  };

  const handleGenerateDraft = async (type: 'email' | 'sms') => {
    setDraftLoading(type);
    const result = await insightsService.generateDraft(leadId, type);
    if (result.success && result.draft) {
      setDraft({ type, subject: result.draft.subject, body: result.draft.body });
    } else {
      toast.error(result.error || 'Failed to generate draft');
    }
    setDraftLoading(null);
  };

  const handleCopy = () => {
    if (!draft) return;
    const text = draft.subject ? `Subject: ${draft.subject}\n\n${draft.body}` : draft.body;
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const urgencyColors = {
    low: 'bg-green-100 text-green-700',
    medium: 'bg-yellow-100 text-yellow-700',
    high: 'bg-orange-100 text-orange-700',
    critical: 'bg-red-100 text-red-700',
  };

  if (loading) {
    return (
      <div className="bg-white rounded-xl border border-neutral-200 p-6">
        <div className="flex items-center space-x-2 mb-4">
          <Sparkles className="w-5 h-5 text-purple-500" />
          <h2 className="text-lg font-semibold text-neutral-900">AI Insights</h2>
        </div>
        <div className="flex items-center justify-center h-24">
          <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-purple-500" />
        </div>
      </div>
    );
  }

  if (!insights) {
    return (
      <div className="bg-white rounded-xl border border-neutral-200 p-6">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center space-x-2">
            <Sparkles className="w-5 h-5 text-purple-500" />
            <h2 className="text-lg font-semibold text-neutral-900">AI Insights</h2>
          </div>
          <button
            onClick={handleRefresh}
            disabled={refreshing}
            className="text-sm text-purple-600 hover:text-purple-700 flex items-center gap-1"
          >
            <RefreshCw className={`w-4 h-4 ${refreshing ? 'animate-spin' : ''}`} />
            Generate
          </button>
        </div>
        <p className="text-sm text-neutral-500 text-center py-4">
          No AI insights yet. Click Generate to analyze this lead.
        </p>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-xl border border-neutral-200 p-6 space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <Sparkles className="w-5 h-5 text-purple-500" />
          <h2 className="text-lg font-semibold text-neutral-900">AI Insights</h2>
        </div>
        <button
          onClick={handleRefresh}
          disabled={refreshing}
          className="text-sm text-purple-600 hover:text-purple-700 flex items-center gap-1"
        >
          <RefreshCw className={`w-4 h-4 ${refreshing ? 'animate-spin' : ''}`} />
          Refresh
        </button>
      </div>

      {/* Score ring + conversion */}
      <div className="flex items-center gap-4">
        <div className="relative w-16 h-16">
          <svg className="w-16 h-16 -rotate-90" viewBox="0 0 64 64">
            <circle cx="32" cy="32" r="28" fill="none" stroke="#e5e7eb" strokeWidth="4" />
            <circle
              cx="32" cy="32" r="28" fill="none"
              stroke={insights.ai_score >= 70 ? '#22c55e' : insights.ai_score >= 40 ? '#f59e0b' : '#ef4444'}
              strokeWidth="4"
              strokeDasharray={`${(insights.ai_score / 100) * 175.9} 175.9`}
              strokeLinecap="round"
            />
          </svg>
          <span className="absolute inset-0 flex items-center justify-center text-sm font-bold text-neutral-900">
            {insights.ai_score}
          </span>
        </div>
        <div>
          <p className="text-sm font-medium text-neutral-900">AI Score</p>
          <p className="text-xs text-neutral-500">
            {Math.round(insights.conversion_probability * 100)}% conversion probability
          </p>
          <span className={`inline-flex items-center px-2 py-0.5 mt-1 rounded-full text-xs font-medium ${urgencyColors[insights.urgency]}`}>
            {insights.urgency} urgency
          </span>
        </div>
      </div>

      {/* Score factors */}
      {insights.score_factors && insights.score_factors.length > 0 && (
        <div>
          <p className="text-xs font-medium text-neutral-500 uppercase tracking-wider mb-2">Score Factors</p>
          <div className="space-y-1.5">
            {insights.score_factors.slice(0, 4).map((factor, i) => (
              <div key={i} className="flex items-center gap-2 text-xs">
                {factor.impact === 'positive' ? (
                  <TrendingUp className="w-3.5 h-3.5 text-green-500 flex-shrink-0" />
                ) : factor.impact === 'negative' ? (
                  <AlertTriangle className="w-3.5 h-3.5 text-red-500 flex-shrink-0" />
                ) : (
                  <Zap className="w-3.5 h-3.5 text-neutral-400 flex-shrink-0" />
                )}
                <span className="text-neutral-700">{factor.description}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Recommended action */}
      <div className="bg-purple-50 rounded-lg p-3">
        <p className="text-xs font-medium text-purple-700 mb-1">Recommended Action</p>
        <p className="text-sm text-purple-900">{insights.recommended_action}</p>
        <p className="text-xs text-purple-600 mt-1">via {insights.recommended_channel}</p>
      </div>

      {/* Conversation summary */}
      {insights.conversation_summary && (
        <div>
          <p className="text-xs font-medium text-neutral-500 uppercase tracking-wider mb-1">Summary</p>
          <p className="text-sm text-neutral-600">{insights.conversation_summary}</p>
        </div>
      )}

      {/* Draft generation */}
      <div>
        <p className="text-xs font-medium text-neutral-500 uppercase tracking-wider mb-2">Generate Draft</p>
        <div className="flex gap-2">
          <button
            onClick={() => handleGenerateDraft('email')}
            disabled={draftLoading !== null}
            className="flex-1 px-3 py-1.5 text-xs font-medium bg-white border border-neutral-200 rounded-lg hover:bg-neutral-50 disabled:opacity-50"
          >
            {draftLoading === 'email' ? 'Generating...' : 'Email Draft'}
          </button>
          <button
            onClick={() => handleGenerateDraft('sms')}
            disabled={draftLoading !== null}
            className="flex-1 px-3 py-1.5 text-xs font-medium bg-white border border-neutral-200 rounded-lg hover:bg-neutral-50 disabled:opacity-50"
          >
            {draftLoading === 'sms' ? 'Generating...' : 'SMS Draft'}
          </button>
        </div>
      </div>

      {/* Generated draft */}
      {draft && (
        <div className="bg-neutral-50 rounded-lg p-3 relative">
          <div className="flex items-center justify-between mb-1">
            <p className="text-xs font-medium text-neutral-500">{draft.type.toUpperCase()} Draft</p>
            <div className="flex items-center gap-1">
              {leadEmail && (
                <button
                  onClick={() => setShowSendModal(true)}
                  className="text-purple-500 hover:text-purple-700 p-0.5"
                  title="Send"
                >
                  <Send className="w-4 h-4" />
                </button>
              )}
              <button onClick={handleCopy} className="text-neutral-400 hover:text-neutral-600 p-0.5">
                {copied ? <Check className="w-4 h-4 text-green-500" /> : <Copy className="w-4 h-4" />}
              </button>
            </div>
          </div>
          {draft.subject && (
            <p className="text-xs text-neutral-500 mb-1">Subject: {draft.subject}</p>
          )}
          <p className="text-sm text-neutral-700 whitespace-pre-wrap">{draft.body}</p>
        </div>
      )}

      {/* Send draft modal */}
      {draft && leadEmail && (
        <SendDraftModal
          open={showSendModal}
          onClose={() => setShowSendModal(false)}
          leadId={leadId}
          leadEmail={leadEmail}
          subject={draft.subject}
          body={draft.body}
          draftType={draft.type as 'email' | 'sms'}
        />
      )}
    </div>
  );
}
