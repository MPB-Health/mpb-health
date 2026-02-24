// ============================================================================
// AI Message Assistant — Helps compose and improve messages
// ============================================================================

import { useState, useCallback } from 'react';
import {
  Sparkles,
  Wand2,
  MessageSquare,
  CheckCircle2,
  AlertTriangle,
  Minimize2,
  X,
  ThumbsUp,
  ThumbsDown,
  Copy,
  RefreshCw,
  ArrowRight,
  Shield,
} from 'lucide-react';
import { useMessageAssist, useComplianceActions } from '../../hooks/useCompliance';
import type { MessageAssistResponse } from '@mpbhealth/champion-core';

interface AIMessageAssistantProps {
  userId: string;
  leadName?: string;
  originalMessage: string;
  onApply: (message: string) => void;
  onClose?: () => void;
  isOpen?: boolean;
}

type Action = 'improve' | 'shorten' | 'expand' | 'check_compliance';
type Tone = 'professional' | 'friendly' | 'urgent' | 'empathetic';

const ACTIONS: { value: Action; label: string; icon: typeof Wand2; description: string }[] = [
  { value: 'improve', label: 'Improve', icon: Wand2, description: 'Enhance clarity and tone' },
  { value: 'shorten', label: 'Shorten', icon: Minimize2, description: 'Make it more concise' },
  { value: 'expand', label: 'Expand', icon: ArrowRight, description: 'Add more context' },
  { value: 'check_compliance', label: 'Check Compliance', icon: Shield, description: 'Review for compliance issues' },
];

const TONES: { value: Tone; label: string }[] = [
  { value: 'professional', label: 'Professional' },
  { value: 'friendly', label: 'Friendly' },
  { value: 'empathetic', label: 'Empathetic' },
  { value: 'urgent', label: 'Urgent' },
];

export default function AIMessageAssistant({
  userId,
  leadName,
  originalMessage,
  onApply,
  onClose,
  isOpen = true,
}: AIMessageAssistantProps) {
  const [selectedAction, setSelectedAction] = useState<Action>('improve');
  const [selectedTone, setSelectedTone] = useState<Tone>('professional');
  const [result, setResult] = useState<MessageAssistResponse | null>(null);
  const [copied, setCopied] = useState(false);

  const { assist, loading, error } = useMessageAssist();
  const { recordSuggestionFeedback } = useComplianceActions();

  const handleAssist = useCallback(async () => {
    const response = await assist(userId, {
      original_message: originalMessage,
      lead_name: leadName,
      tone: selectedTone,
      action: selectedAction,
    });

    if (response) {
      setResult(response);
    }
  }, [assist, userId, originalMessage, leadName, selectedTone, selectedAction]);

  const handleApply = useCallback(() => {
    if (result?.suggested_message) {
      onApply(result.suggested_message);
      recordSuggestionFeedback(result.suggestion_id, 'accepted');
      setResult(null);
    }
  }, [result, onApply, recordSuggestionFeedback]);

  const handleReject = useCallback(() => {
    if (result) {
      recordSuggestionFeedback(result.suggestion_id, 'rejected');
      setResult(null);
    }
  }, [result, recordSuggestionFeedback]);

  const handleCopy = useCallback(() => {
    if (result?.suggested_message) {
      navigator.clipboard.writeText(result.suggested_message);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  }, [result]);

  if (!isOpen) return null;

  return (
    <div className="bg-gradient-to-br from-blue-50 to-blue-50 rounded-xl border border-blue-200 overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 bg-white/50 border-b border-blue-200">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-blue-500 to-blue-500 flex items-center justify-center">
            <Sparkles className="h-4 w-4 text-white" />
          </div>
          <div>
            <h3 className="text-sm font-semibold text-gray-900">AI Assistant</h3>
            <p className="text-xs text-gray-500">Powered by Claude</p>
          </div>
        </div>
        {onClose && (
          <button
            onClick={onClose}
            className="p-1.5 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <X className="h-4 w-4" />
          </button>
        )}
      </div>

      <div className="p-4 space-y-4">
        {/* Action Selection */}
        <div>
          <label className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-2 block">
            Action
          </label>
          <div className="grid grid-cols-2 gap-2">
            {ACTIONS.map((action) => {
              const Icon = action.icon;
              const isSelected = selectedAction === action.value;
              return (
                <button
                  key={action.value}
                  onClick={() => setSelectedAction(action.value)}
                  className={`flex items-center gap-2 p-2.5 rounded-lg border text-left transition-all ${
                    isSelected
                      ? 'border-blue-300 bg-white shadow-sm'
                      : 'border-transparent bg-white/50 hover:bg-white'
                  }`}
                >
                  <Icon className={`h-4 w-4 ${isSelected ? 'text-blue-600' : 'text-gray-400'}`} />
                  <div>
                    <p className={`text-sm font-medium ${isSelected ? 'text-blue-900' : 'text-gray-700'}`}>
                      {action.label}
                    </p>
                    <p className="text-xs text-gray-500">{action.description}</p>
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {/* Tone Selection (not for compliance check) */}
        {selectedAction !== 'check_compliance' && (
          <div>
            <label className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-2 block">
              Tone
            </label>
            <div className="flex flex-wrap gap-2">
              {TONES.map((tone) => (
                <button
                  key={tone.value}
                  onClick={() => setSelectedTone(tone.value)}
                  className={`px-3 py-1.5 rounded-full text-sm font-medium transition-all ${
                    selectedTone === tone.value
                      ? 'bg-blue-600 text-white'
                      : 'bg-white text-gray-600 hover:bg-gray-100'
                  }`}
                >
                  {tone.label}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Generate Button */}
        <button
          onClick={handleAssist}
          disabled={loading || !originalMessage.trim()}
          className="w-full py-2.5 bg-gradient-to-r from-blue-600 to-blue-600 text-white rounded-lg font-medium flex items-center justify-center gap-2 hover:from-blue-700 hover:to-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
        >
          {loading ? (
            <>
              <RefreshCw className="h-4 w-4 animate-spin" />
              Analyzing...
            </>
          ) : (
            <>
              <Sparkles className="h-4 w-4" />
              {selectedAction === 'check_compliance' ? 'Check Message' : 'Generate Suggestion'}
            </>
          )}
        </button>

        {/* Error */}
        {error && (
          <div className="p-3 bg-red-50 border border-red-200 rounded-lg flex items-start gap-2">
            <AlertTriangle className="h-4 w-4 text-red-500 flex-shrink-0 mt-0.5" />
            <p className="text-sm text-red-700">{error.message}</p>
          </div>
        )}

        {/* Result */}
        {result && (
          <div className="space-y-3">
            {/* Compliance Issues (if any) */}
            {result.compliance_issues && result.compliance_issues.length > 0 && (
              <div className="p-3 bg-yellow-50 border border-yellow-200 rounded-lg space-y-2">
                <div className="flex items-center gap-2">
                  <AlertTriangle className="h-4 w-4 text-yellow-600" />
                  <span className="text-sm font-medium text-yellow-800">Compliance Issues Found</span>
                </div>
                <ul className="space-y-1">
                  {result.compliance_issues.map((issue, i) => (
                    <li key={i} className="text-sm text-yellow-700 flex items-start gap-2">
                      <span className="text-yellow-500">•</span>
                      {issue}
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {/* Suggested Message */}
            {result.suggested_message && selectedAction !== 'check_compliance' && (
              <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
                <div className="p-3 border-b border-gray-200 flex items-center justify-between bg-gray-50">
                  <div className="flex items-center gap-2">
                    <MessageSquare className="h-4 w-4 text-gray-500" />
                    <span className="text-sm font-medium text-gray-700">Suggested Message</span>
                  </div>
                  <div className="flex items-center gap-1.5 text-xs text-gray-500">
                    <span className={`inline-flex items-center px-1.5 py-0.5 rounded ${
                      (result.confidence || 0) >= 0.8 ? 'bg-green-100 text-green-700' :
                      (result.confidence || 0) >= 0.6 ? 'bg-yellow-100 text-yellow-700' :
                      'bg-gray-100 text-gray-600'
                    }`}>
                      {Math.round((result.confidence || 0) * 100)}% confidence
                    </span>
                  </div>
                </div>
                <div className="p-3">
                  <p className="text-sm text-gray-800 whitespace-pre-wrap">
                    {result.suggested_message}
                  </p>
                </div>
                {result.reasoning && (
                  <div className="px-3 pb-3">
                    <p className="text-xs text-gray-500 italic">
                      {result.reasoning}
                    </p>
                  </div>
                )}
              </div>
            )}

            {/* Actions */}
            {result.suggested_message && selectedAction !== 'check_compliance' && (
              <div className="flex items-center justify-between gap-3">
                <div className="flex items-center gap-2">
                  <button
                    onClick={handleReject}
                    className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                    title="Reject suggestion"
                  >
                    <ThumbsDown className="h-4 w-4" />
                  </button>
                  <button
                    onClick={handleCopy}
                    className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
                    title="Copy to clipboard"
                  >
                    {copied ? (
                      <CheckCircle2 className="h-4 w-4 text-green-500" />
                    ) : (
                      <Copy className="h-4 w-4" />
                    )}
                  </button>
                </div>
                <button
                  onClick={handleApply}
                  className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg font-medium hover:bg-green-700 transition-colors"
                >
                  <ThumbsUp className="h-4 w-4" />
                  Apply Suggestion
                </button>
              </div>
            )}

            {/* Compliance Check Success */}
            {selectedAction === 'check_compliance' && (!result.compliance_issues || result.compliance_issues.length === 0) && (
              <div className="p-3 bg-green-50 border border-green-200 rounded-lg flex items-center gap-2">
                <CheckCircle2 className="h-4 w-4 text-green-600" />
                <span className="text-sm text-green-700">No compliance issues detected</span>
              </div>
            )}
          </div>
        )}

        {/* Empty State */}
        {!result && !loading && !originalMessage.trim() && (
          <div className="text-center py-4">
            <p className="text-sm text-gray-500">
              Start typing your message to get AI assistance
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
