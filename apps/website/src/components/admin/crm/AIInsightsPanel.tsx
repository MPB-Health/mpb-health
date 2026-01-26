import React, { useState, useEffect } from 'react';
import {
  X,
  Sparkles,
  TrendingUp,
  TrendingDown,
  Phone,
  Mail,
  MessageSquare,
  Calendar,
  Clock,
  Target,
  Lightbulb,
  Copy,
  Check,
  RefreshCw,
  ChevronDown,
  ChevronUp,
  AlertCircle,
  Zap,
} from 'lucide-react';
import { Button } from '../../ui/Button';
import { aiTaskClusterService, type AILeadInsights, type FollowUpSuggestion } from '../../../lib/aiTaskClusterService';
import type { Lead } from '../../../lib/crmService';
import { cn } from '../../../lib/utils';

// ============================================================================
// Types
// ============================================================================

interface AIInsightsPanelProps {
  lead: Lead;
  isOpen: boolean;
  onClose: () => void;
  onActionClick?: (action: string, data?: Record<string, unknown>) => void;
}

// ============================================================================
// Score Gauge Component
// ============================================================================

const ScoreGauge: React.FC<{ score: number; size?: 'sm' | 'md' | 'lg' }> = ({ 
  score, 
  size = 'md' 
}) => {
  const dimensions = {
    sm: { width: 80, height: 80, strokeWidth: 6, fontSize: 'text-lg' },
    md: { width: 120, height: 120, strokeWidth: 8, fontSize: 'text-2xl' },
    lg: { width: 160, height: 160, strokeWidth: 10, fontSize: 'text-3xl' },
  };
  
  const { width, height, strokeWidth, fontSize } = dimensions[size];
  const radius = (width - strokeWidth) / 2;
  const circumference = radius * Math.PI * 2;
  const offset = circumference - (score / 100) * circumference;

  const getScoreColor = () => {
    if (score >= 80) return { stroke: '#dc2626', bg: 'bg-red-50', text: 'text-red-600' };
    if (score >= 60) return { stroke: '#ea580c', bg: 'bg-orange-50', text: 'text-orange-600' };
    if (score >= 40) return { stroke: '#ca8a04', bg: 'bg-yellow-50', text: 'text-yellow-600' };
    return { stroke: '#16a34a', bg: 'bg-green-50', text: 'text-green-600' };
  };

  const colors = getScoreColor();
  const tier = score >= 80 ? 'Very Hot' : score >= 60 ? 'Hot' : score >= 40 ? 'Warm' : 'Cold';

  return (
    <div className="flex flex-col items-center">
      <div className="relative" style={{ width, height }}>
        <svg width={width} height={height} className="transform -rotate-90">
          {/* Background circle */}
          <circle
            cx={width / 2}
            cy={height / 2}
            r={radius}
            fill="none"
            stroke="#e5e7eb"
            strokeWidth={strokeWidth}
          />
          {/* Progress circle */}
          <circle
            cx={width / 2}
            cy={height / 2}
            r={radius}
            fill="none"
            stroke={colors.stroke}
            strokeWidth={strokeWidth}
            strokeDasharray={circumference}
            strokeDashoffset={offset}
            strokeLinecap="round"
            className="transition-all duration-1000 ease-out"
          />
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span className={cn('font-bold', fontSize, colors.text)}>
            {score}
          </span>
          <span className="text-xs text-gray-500 font-medium">{tier}</span>
        </div>
      </div>
    </div>
  );
};

// ============================================================================
// Score Factor Item Component
// ============================================================================

const ScoreFactorItem: React.FC<{
  factor: string;
  points: number;
  positive: boolean;
}> = ({ factor, points, positive }) => (
  <div className="flex items-center justify-between py-2 border-b border-gray-100 last:border-0">
    <div className="flex items-center gap-2">
      {positive ? (
        <TrendingUp className="h-4 w-4 text-green-500" />
      ) : (
        <TrendingDown className="h-4 w-4 text-red-500" />
      )}
      <span className="text-sm text-gray-700">{factor}</span>
    </div>
    <span className={cn(
      'text-sm font-semibold',
      positive ? 'text-green-600' : 'text-red-600'
    )}>
      {positive ? '+' : ''}{points}
    </span>
  </div>
);

// ============================================================================
// Action Card Component
// ============================================================================

const ActionCard: React.FC<{
  icon: React.ElementType;
  title: string;
  description: string;
  onClick: () => void;
  variant?: 'default' | 'primary' | 'warning';
}> = ({ icon: Icon, title, description, onClick, variant = 'default' }) => {
  const variants = {
    default: 'bg-gray-50 hover:bg-gray-100 border-gray-200',
    primary: 'bg-primary-50 hover:bg-primary-100 border-primary-200',
    warning: 'bg-amber-50 hover:bg-amber-100 border-amber-200',
  };

  const iconColors = {
    default: 'text-gray-600',
    primary: 'text-primary-600',
    warning: 'text-amber-600',
  };

  return (
    <button
      onClick={onClick}
      className={cn(
        'w-full p-3 rounded-lg border text-left transition-colors',
        variants[variant]
      )}
    >
      <div className="flex items-start gap-3">
        <Icon className={cn('h-5 w-5 mt-0.5', iconColors[variant])} />
        <div>
          <h4 className="font-medium text-gray-900 text-sm">{title}</h4>
          <p className="text-xs text-gray-600 mt-0.5">{description}</p>
        </div>
      </div>
    </button>
  );
};

// ============================================================================
// Draft Preview Component
// ============================================================================

const DraftPreview: React.FC<{
  type: 'email' | 'sms';
  subject?: string;
  body: string;
  onCopy: () => void;
  onRegenerate: () => void;
  isLoading?: boolean;
}> = ({ type, subject, body, onCopy, onRegenerate, isLoading }) => {
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    const textToCopy = type === 'email' ? `Subject: ${subject}\n\n${body}` : body;
    navigator.clipboard.writeText(textToCopy);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
    onCopy();
  };

  return (
    <div className="border border-gray-200 rounded-lg overflow-hidden">
      <div className="bg-gray-50 px-3 py-2 border-b border-gray-200 flex items-center justify-between">
        <span className="text-xs font-medium text-gray-600 uppercase">
          {type === 'email' ? 'Email Draft' : 'SMS Draft'}
        </span>
        <div className="flex items-center gap-1">
          <button
            onClick={onRegenerate}
            disabled={isLoading}
            className="p-1 hover:bg-gray-200 rounded transition-colors"
            title="Regenerate"
          >
            <RefreshCw className={cn('h-3.5 w-3.5 text-gray-500', isLoading && 'animate-spin')} />
          </button>
          <button
            onClick={handleCopy}
            className="p-1 hover:bg-gray-200 rounded transition-colors"
            title="Copy"
          >
            {copied ? (
              <Check className="h-3.5 w-3.5 text-green-500" />
            ) : (
              <Copy className="h-3.5 w-3.5 text-gray-500" />
            )}
          </button>
        </div>
      </div>
      <div className="p-3 bg-white">
        {type === 'email' && subject && (
          <div className="mb-2 pb-2 border-b border-gray-100">
            <span className="text-xs text-gray-500">Subject: </span>
            <span className="text-sm text-gray-900">{subject}</span>
          </div>
        )}
        <p className="text-sm text-gray-700 whitespace-pre-wrap">{body}</p>
      </div>
    </div>
  );
};

// ============================================================================
// Main AI Insights Panel Component
// ============================================================================

export const AIInsightsPanel: React.FC<AIInsightsPanelProps> = ({
  lead,
  isOpen,
  onClose,
  onActionClick,
}) => {
  const [insights, setInsights] = useState<AILeadInsights | null>(null);
  const [suggestion, setSuggestion] = useState<FollowUpSuggestion | null>(null);
  const [loading, setLoading] = useState(true);
  const [expandedSections, setExpandedSections] = useState<Set<string>>(
    new Set(['score', 'actions'])
  );
  const [generatingDraft, setGeneratingDraft] = useState(false);

  useEffect(() => {
    if (isOpen && lead) {
      loadInsights();
    }
  }, [isOpen, lead?.id]);

  const loadInsights = async () => {
    setLoading(true);
    try {
      const [insightsData, suggestionData] = await Promise.all([
        aiTaskClusterService.getLeadInsights(lead.id),
        aiTaskClusterService.getFollowUpSuggestion(lead.id),
      ]);
      setInsights(insightsData);
      setSuggestion(suggestionData);
    } catch (error) {
      console.error('Failed to load insights:', error);
    } finally {
      setLoading(false);
    }
  };

  const regenerateDraft = async (type: 'email' | 'sms') => {
    setGeneratingDraft(true);
    try {
      const draft = await aiTaskClusterService.generateDraft(lead.id, type);
      if (draft && insights) {
        setInsights({
          ...insights,
          draft_email_subject: draft.emailSubject || insights.draft_email_subject,
          draft_email_body: draft.emailBody || insights.draft_email_body,
          draft_sms: draft.sms || insights.draft_sms,
        });
      }
    } catch (error) {
      console.error('Failed to generate draft:', error);
    } finally {
      setGeneratingDraft(false);
    }
  };

  const toggleSection = (section: string) => {
    const newExpanded = new Set(expandedSections);
    if (newExpanded.has(section)) {
      newExpanded.delete(section);
    } else {
      newExpanded.add(section);
    }
    setExpandedSections(newExpanded);
  };

  const getChannelIcon = (channel: string | null) => {
    switch (channel) {
      case 'call': return Phone;
      case 'email': return Mail;
      case 'sms': return MessageSquare;
      case 'meeting': return Calendar;
      default: return Zap;
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-y-0 right-0 w-96 bg-white shadow-xl z-50 flex flex-col">
      {/* Header */}
      <div className="px-4 py-3 border-b border-gray-200 flex items-center justify-between bg-gradient-to-r from-purple-600 to-primary-600">
        <div className="flex items-center gap-2 text-white">
          <Sparkles className="h-5 w-5" />
          <h2 className="font-semibold">AI Insights</h2>
        </div>
        <button
          onClick={onClose}
          className="p-1 hover:bg-white/20 rounded-full transition-colors"
        >
          <X className="h-5 w-5 text-white" />
        </button>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto">
        {loading ? (
          <div className="flex items-center justify-center h-64">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
          </div>
        ) : (
          <div className="p-4 space-y-4">
            {/* Lead Name */}
            <div className="text-center pb-2">
              <h3 className="font-semibold text-gray-900">
                {lead.first_name} {lead.last_name}
              </h3>
              <p className="text-sm text-gray-500">{lead.pipeline_stage}</p>
            </div>

            {/* Score Section */}
            <div className="bg-white rounded-lg border border-gray-200">
              <button
                onClick={() => toggleSection('score')}
                className="w-full px-4 py-3 flex items-center justify-between hover:bg-gray-50 transition-colors"
              >
                <div className="flex items-center gap-2">
                  <Target className="h-4 w-4 text-primary-600" />
                  <span className="font-medium text-gray-900">AI Lead Score</span>
                </div>
                {expandedSections.has('score') ? (
                  <ChevronUp className="h-4 w-4 text-gray-400" />
                ) : (
                  <ChevronDown className="h-4 w-4 text-gray-400" />
                )}
              </button>
              
              {expandedSections.has('score') && (
                <div className="px-4 pb-4 border-t border-gray-100">
                  <div className="flex justify-center py-4">
                    <ScoreGauge score={insights?.ai_score || 0} />
                  </div>
                  
                  {insights?.score_factors && insights.score_factors.length > 0 && (
                    <div className="mt-2">
                      <h4 className="text-xs font-semibold text-gray-500 uppercase mb-2">
                        Score Factors
                      </h4>
                      <div className="space-y-1">
                        {insights.score_factors.map((factor, i) => (
                          <ScoreFactorItem
                            key={i}
                            factor={factor.factor}
                            points={factor.points}
                            positive={factor.positive}
                          />
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Follow-up Recommendation */}
            {suggestion && (
              <div className={cn(
                'p-4 rounded-lg border',
                suggestion.urgency === 'urgent' ? 'bg-red-50 border-red-200' :
                suggestion.urgency === 'high' ? 'bg-orange-50 border-orange-200' :
                'bg-blue-50 border-blue-200'
              )}>
                <div className="flex items-start gap-3">
                  {React.createElement(getChannelIcon(suggestion.channel), {
                    className: cn(
                      'h-5 w-5 mt-0.5',
                      suggestion.urgency === 'urgent' ? 'text-red-600' :
                      suggestion.urgency === 'high' ? 'text-orange-600' :
                      'text-blue-600'
                    )
                  })}
                  <div>
                    <h4 className={cn(
                      'font-medium text-sm',
                      suggestion.urgency === 'urgent' ? 'text-red-800' :
                      suggestion.urgency === 'high' ? 'text-orange-800' :
                      'text-blue-800'
                    )}>
                      {suggestion.urgency === 'urgent' && '🔥 '}
                      Recommended: {suggestion.channel === 'call' ? 'Call' : 
                                   suggestion.channel === 'email' ? 'Email' :
                                   suggestion.channel === 'sms' ? 'SMS' : 'Follow up'}
                    </h4>
                    <p className="text-xs text-gray-600 mt-1">{suggestion.reasoning}</p>
                    <p className="text-xs text-gray-500 mt-2 flex items-center gap-1">
                      <Clock className="h-3 w-3" />
                      {new Date(suggestion.timing).toLocaleString()}
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* Quick Actions */}
            <div className="bg-white rounded-lg border border-gray-200">
              <button
                onClick={() => toggleSection('actions')}
                className="w-full px-4 py-3 flex items-center justify-between hover:bg-gray-50 transition-colors"
              >
                <div className="flex items-center gap-2">
                  <Lightbulb className="h-4 w-4 text-amber-500" />
                  <span className="font-medium text-gray-900">Suggested Actions</span>
                </div>
                {expandedSections.has('actions') ? (
                  <ChevronUp className="h-4 w-4 text-gray-400" />
                ) : (
                  <ChevronDown className="h-4 w-4 text-gray-400" />
                )}
              </button>
              
              {expandedSections.has('actions') && (
                <div className="px-4 pb-4 space-y-2 border-t border-gray-100 pt-3">
                  <ActionCard
                    icon={Phone}
                    title="Call Lead"
                    description={`Call ${lead.first_name} at ${lead.phone}`}
                    onClick={() => onActionClick?.('call', { phone: lead.phone })}
                    variant={suggestion?.channel === 'call' ? 'primary' : 'default'}
                  />
                  <ActionCard
                    icon={Mail}
                    title="Send Email"
                    description="Use AI-generated draft below"
                    onClick={() => onActionClick?.('email', { email: lead.email })}
                    variant={suggestion?.channel === 'email' ? 'primary' : 'default'}
                  />
                  <ActionCard
                    icon={Calendar}
                    title="Schedule Meeting"
                    description="Book a consultation call"
                    onClick={() => onActionClick?.('schedule')}
                  />
                </div>
              )}
            </div>

            {/* AI Drafts */}
            <div className="bg-white rounded-lg border border-gray-200">
              <button
                onClick={() => toggleSection('drafts')}
                className="w-full px-4 py-3 flex items-center justify-between hover:bg-gray-50 transition-colors"
              >
                <div className="flex items-center gap-2">
                  <Sparkles className="h-4 w-4 text-purple-500" />
                  <span className="font-medium text-gray-900">AI Drafts</span>
                </div>
                {expandedSections.has('drafts') ? (
                  <ChevronUp className="h-4 w-4 text-gray-400" />
                ) : (
                  <ChevronDown className="h-4 w-4 text-gray-400" />
                )}
              </button>
              
              {expandedSections.has('drafts') && (
                <div className="px-4 pb-4 space-y-3 border-t border-gray-100 pt-3">
                  {insights?.draft_email_body ? (
                    <DraftPreview
                      type="email"
                      subject={insights.draft_email_subject || undefined}
                      body={insights.draft_email_body}
                      onCopy={() => console.log('Copied email')}
                      onRegenerate={() => regenerateDraft('email')}
                      isLoading={generatingDraft}
                    />
                  ) : (
                    <Button
                      variant="outline"
                      size="sm"
                      className="w-full"
                      onClick={() => regenerateDraft('email')}
                      disabled={generatingDraft}
                    >
                      {generatingDraft ? (
                        <RefreshCw className="h-4 w-4 animate-spin mr-2" />
                      ) : (
                        <Sparkles className="h-4 w-4 mr-2" />
                      )}
                      Generate Email Draft
                    </Button>
                  )}

                  {insights?.draft_sms ? (
                    <DraftPreview
                      type="sms"
                      body={insights.draft_sms}
                      onCopy={() => console.log('Copied SMS')}
                      onRegenerate={() => regenerateDraft('sms')}
                      isLoading={generatingDraft}
                    />
                  ) : (
                    <Button
                      variant="outline"
                      size="sm"
                      className="w-full"
                      onClick={() => regenerateDraft('sms')}
                      disabled={generatingDraft}
                    >
                      {generatingDraft ? (
                        <RefreshCw className="h-4 w-4 animate-spin mr-2" />
                      ) : (
                        <MessageSquare className="h-4 w-4 mr-2" />
                      )}
                      Generate SMS Draft
                    </Button>
                  )}
                </div>
              )}
            </div>

            {/* Conversation Summary */}
            {insights?.conversation_summary && (
              <div className="bg-white rounded-lg border border-gray-200">
                <button
                  onClick={() => toggleSection('summary')}
                  className="w-full px-4 py-3 flex items-center justify-between hover:bg-gray-50 transition-colors"
                >
                  <div className="flex items-center gap-2">
                    <AlertCircle className="h-4 w-4 text-gray-500" />
                    <span className="font-medium text-gray-900">Conversation Summary</span>
                  </div>
                  {expandedSections.has('summary') ? (
                    <ChevronUp className="h-4 w-4 text-gray-400" />
                  ) : (
                    <ChevronDown className="h-4 w-4 text-gray-400" />
                  )}
                </button>
                
                {expandedSections.has('summary') && (
                  <div className="px-4 pb-4 border-t border-gray-100 pt-3">
                    <p className="text-sm text-gray-700">
                      {insights.conversation_summary}
                    </p>
                    
                    {insights.key_points && insights.key_points.length > 0 && (
                      <div className="mt-3">
                        <h5 className="text-xs font-semibold text-gray-500 uppercase mb-1">
                          Key Points
                        </h5>
                        <ul className="text-sm text-gray-600 space-y-1">
                          {insights.key_points.map((point, i) => (
                            <li key={i} className="flex items-start gap-2">
                              <span className="text-green-500">•</span>
                              {point}
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}

                    {insights.objections && insights.objections.length > 0 && (
                      <div className="mt-3">
                        <h5 className="text-xs font-semibold text-gray-500 uppercase mb-1">
                          Objections
                        </h5>
                        <ul className="text-sm text-gray-600 space-y-1">
                          {insights.objections.map((obj, i) => (
                            <li key={i} className="flex items-start gap-2">
                              <span className="text-red-500">•</span>
                              {obj}
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Footer */}
      <div className="px-4 py-3 border-t border-gray-200 bg-gray-50">
        <Button
          onClick={loadInsights}
          variant="outline"
          className="w-full"
          disabled={loading}
        >
          <RefreshCw className={cn('h-4 w-4 mr-2', loading && 'animate-spin')} />
          Refresh Insights
        </Button>
      </div>
    </div>
  );
};

export default AIInsightsPanel;

