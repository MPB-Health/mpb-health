import { useState, useRef, useEffect, useCallback } from 'react';
import { useLocation } from 'react-router-dom';
import {
  Send, Bot, User, Sparkles, Copy,
  CheckCircle, Loader2, X, Minimize2,
} from 'lucide-react';
import { AIChatVoice } from './AIChatVoice';
import { AIChatDialer } from './AIChatDialer';

const cn = (...classes: (string | boolean | undefined | null)[]) =>
  classes.filter(Boolean).join(' ');

type TabId = 'chat' | 'voice' | 'dialer';

interface ChatMessage {
  id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  timestamp: Date;
  status?: 'sending' | 'sent' | 'error';
}

interface AIChatPanelProps {
  onClose: () => void;
  onMinimize: () => void;
}

const SUGGESTIONS = [
  'Show my pipeline summary',
  'Which leads need follow-up?',
  'Draft a follow-up email',
  "What's my revenue forecast?",
];

function derivePageContext(pathname: string): string {
  if (pathname.startsWith('/leads/')) return `Viewing lead detail (${pathname.split('/').pop()})`;
  if (pathname === '/leads') return 'On the Leads list page';
  if (pathname === '/dashboard') return 'On the Dashboard';
  if (pathname.startsWith('/deals/')) return `Viewing deal (${pathname.split('/').pop()})`;
  if (pathname === '/deals' || pathname === '/deal-pipeline') return 'On Deals/Pipeline';
  if (pathname === '/tasks') return 'On Tasks page';
  if (pathname === '/calendar') return 'On Calendar';
  if (pathname.startsWith('/members/') || pathname.startsWith('/contacts/'))
    return `Viewing member (${pathname.split('/').pop()})`;
  if (pathname.startsWith('/accounts/')) return `Viewing account (${pathname.split('/').pop()})`;
  return `On page: ${pathname}`;
}

function simulateAIResponse(message: string, context: string): Promise<string> {
  return new Promise((resolve) => {
    setTimeout(() => {
      const lower = message.toLowerCase();
      if (lower.includes('pipeline') || lower.includes('deal'))
        resolve("Here's your pipeline summary:\n\n- **New**: 12 deals ($45,000)\n- **Qualified**: 8 deals ($120,000)\n- **Proposal**: 5 deals ($85,000)\n- **Negotiation**: 3 deals ($210,000)\n\nTotal pipeline value: **$460,000**. Your conversion rate is trending up 12% this month.");
      else if (lower.includes('follow-up') || lower.includes('follow up'))
        resolve("You have **7 leads** needing follow-up today:\n\n1. **Sarah Johnson** - Last contact 3 days ago (Hot)\n2. **Mike Chen** - Proposal sent, awaiting response\n3. **Lisa Wang** - Scheduled call at 2:00 PM\n4. **David Park** - Demo requested\n5. **Emma Taylor** - Quote follow-up\n\nWant me to draft follow-up emails for any of these?");
      else if (lower.includes('email') || lower.includes('draft'))
        resolve("I'll draft a follow-up email. Here's a template:\n\n---\n**Subject:** Following up on our conversation\n\nHi [Name],\n\nI wanted to follow up on our recent discussion about [topic]. I believe our solution could help you achieve [benefit].\n\nWould you have 15 minutes this week for a quick call?\n\nBest regards");
      else if (lower.includes('revenue') || lower.includes('forecast'))
        resolve("**Q2 2026 Revenue Forecast:**\n\n- Closed won: **$340,000** (78% of target)\n- Weighted pipeline: **$185,000**\n- Projected close: **$525,000**\n\nYou're on track to exceed the quarterly target by ~10%. The highest-value deal in negotiation is the **Acme Corp** deal at $85,000.");
      else
        resolve(`I understand you're asking about "${message}". ${context ? `I can see you're currently ${context.toLowerCase()}.` : ''}\n\nI can help you with:\n- Pipeline and deal analysis\n- Lead follow-up recommendations\n- Email drafting\n- Revenue forecasting\n- Task management\n\nWhat would you like to do?`);
    }, 800 + Math.random() * 600);
  });
}

export function AIChatPanel({ onClose, onMinimize }: AIChatPanelProps) {
  const location = useLocation();
  const [activeTab, setActiveTab] = useState<TabId>('chat');
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: 'welcome',
      role: 'assistant',
      content: "Hi! I'm your CRM AI assistant. I can help you manage leads, analyze your pipeline, draft emails, and more. What can I help you with?",
      timestamp: new Date(),
      status: 'sent',
    },
  ]);
  const [input, setInput] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  const pageContext = derivePageContext(location.pathname);

  const scrollToBottom = useCallback(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, []);

  useEffect(() => {
    scrollToBottom();
  }, [messages, scrollToBottom]);

  const sendMessage = useCallback(async (text: string) => {
    if (!text.trim() || isProcessing) return;

    const userMsg: ChatMessage = {
      id: `user-${Date.now()}`,
      role: 'user',
      content: text.trim(),
      timestamp: new Date(),
      status: 'sent',
    };

    setMessages((prev) => [...prev, userMsg]);
    setInput('');
    setIsProcessing(true);

    try {
      const response = await simulateAIResponse(text, pageContext);
      const aiMsg: ChatMessage = {
        id: `ai-${Date.now()}`,
        role: 'assistant',
        content: response,
        timestamp: new Date(),
        status: 'sent',
      };
      setMessages((prev) => [...prev, aiMsg]);
    } catch {
      setMessages((prev) => [
        ...prev,
        {
          id: `err-${Date.now()}`,
          role: 'assistant',
          content: 'Sorry, I encountered an error. Please try again.',
          timestamp: new Date(),
          status: 'error',
        },
      ]);
    } finally {
      setIsProcessing(false);
    }
  }, [isProcessing, pageContext]);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage(input);
    }
  };

  const copyMessage = (id: string, content: string) => {
    navigator.clipboard.writeText(content);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const handleVoiceResult = (transcript: string) => {
    setActiveTab('chat');
    sendMessage(transcript);
  };

  const tabs: { id: TabId; label: string }[] = [
    { id: 'chat', label: 'Chat' },
    { id: 'voice', label: 'Voice' },
    { id: 'dialer', label: 'Call' },
  ];

  return (
    <div className={cn(
      'w-[380px] h-[520px] rounded-2xl overflow-hidden flex flex-col',
      'bg-surface-primary border border-th-border/60',
      'shadow-2xl dark:shadow-[0_25px_60px_rgb(0_0_0/0.5)]',
      'animate-scale-in'
    )}>
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-th-border/50 bg-surface-secondary/50">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg gradient-accent flex items-center justify-center">
            <Sparkles className="w-4 h-4 text-white" />
          </div>
          <div>
            <h3 className="text-sm font-semibold text-th-text-primary">CRM Assistant</h3>
            <p className="text-[10px] text-th-text-tertiary truncate max-w-[180px]">{pageContext}</p>
          </div>
        </div>
        <div className="flex items-center gap-1">
          <button onClick={onMinimize} className="p-1.5 rounded-lg hover:bg-surface-tertiary text-th-text-tertiary hover:text-th-text-secondary transition-colors">
            <Minimize2 className="w-4 h-4" />
          </button>
          <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-surface-tertiary text-th-text-tertiary hover:text-th-text-secondary transition-colors">
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-th-border/30 px-2">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={cn(
              'flex-1 py-2 text-xs font-medium transition-all border-b-2',
              activeTab === tab.id
                ? 'text-th-accent-500 border-th-accent-500'
                : 'text-th-text-tertiary border-transparent hover:text-th-text-secondary'
            )}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Tab content */}
      {activeTab === 'chat' && (
        <>
          {/* Messages */}
          <div className="flex-1 overflow-y-auto px-4 py-3 space-y-4">
            {messages.map((msg) => (
              <div key={msg.id} className={cn('flex gap-2', msg.role === 'user' && 'flex-row-reverse')}>
                <div className={cn(
                  'w-7 h-7 rounded-full flex items-center justify-center shrink-0',
                  msg.role === 'assistant' ? 'bg-th-accent-500/10' : 'bg-surface-tertiary'
                )}>
                  {msg.role === 'assistant' ? (
                    <Bot className="w-4 h-4 text-th-accent-500" />
                  ) : (
                    <User className="w-4 h-4 text-th-text-secondary" />
                  )}
                </div>
                <div className={cn(
                  'max-w-[85%] rounded-xl px-3 py-2 text-sm leading-relaxed group relative',
                  msg.role === 'assistant'
                    ? 'bg-surface-secondary text-th-text-primary'
                    : 'bg-th-accent-500 text-white',
                  msg.status === 'error' && 'bg-red-500/10 text-red-600 dark:text-red-400'
                )}>
                  <div className="whitespace-pre-wrap">{msg.content}</div>
                  <div className={cn(
                    'flex items-center gap-1 mt-1',
                    msg.role === 'user' ? 'justify-end' : 'justify-between'
                  )}>
                    <span className={cn(
                      'text-[10px]',
                      msg.role === 'user' ? 'text-white/60' : 'text-th-text-tertiary'
                    )}>
                      {msg.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </span>
                    {msg.role === 'assistant' && msg.id !== 'welcome' && (
                      <button
                        onClick={() => copyMessage(msg.id, msg.content)}
                        className="opacity-0 group-hover:opacity-100 p-0.5 rounded hover:bg-surface-tertiary transition-all"
                      >
                        {copiedId === msg.id ? (
                          <CheckCircle className="w-3 h-3 text-green-500" />
                        ) : (
                          <Copy className="w-3 h-3 text-th-text-tertiary" />
                        )}
                      </button>
                    )}
                  </div>
                </div>
              </div>
            ))}

            {isProcessing && (
              <div className="flex gap-2">
                <div className="w-7 h-7 rounded-full bg-th-accent-500/10 flex items-center justify-center shrink-0">
                  <Bot className="w-4 h-4 text-th-accent-500" />
                </div>
                <div className="bg-surface-secondary rounded-xl px-3 py-2">
                  <div className="flex items-center gap-1.5">
                    <Loader2 className="w-3.5 h-3.5 text-th-accent-500 animate-spin" />
                    <span className="text-sm text-th-text-tertiary">Thinking...</span>
                  </div>
                </div>
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>

          {/* Suggestions (shown when few messages) */}
          {messages.length <= 2 && !isProcessing && (
            <div className="px-4 pb-2 flex flex-wrap gap-1.5">
              {SUGGESTIONS.map((s) => (
                <button
                  key={s}
                  onClick={() => sendMessage(s)}
                  className="text-xs px-2.5 py-1.5 rounded-full bg-th-accent-500/10 text-th-accent-600 dark:text-th-accent-400 hover:bg-th-accent-500/20 transition-colors"
                >
                  {s}
                </button>
              ))}
            </div>
          )}

          {/* Input */}
          <div className="px-3 pb-3 pt-1">
            <div className="flex items-end gap-2 bg-surface-secondary rounded-xl border border-th-border/50 focus-within:border-th-accent-500/50 transition-colors">
              <textarea
                ref={inputRef}
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Ask anything..."
                rows={1}
                className="flex-1 bg-transparent text-sm text-th-text-primary placeholder:text-th-text-tertiary px-3 py-2.5 resize-none focus:outline-none max-h-[80px]"
                style={{ minHeight: '38px' }}
              />
              <button
                onClick={() => sendMessage(input)}
                disabled={!input.trim() || isProcessing}
                className={cn(
                  'p-2 mr-1 mb-1 rounded-lg transition-all',
                  input.trim() && !isProcessing
                    ? 'bg-th-accent-500 text-white hover:bg-th-accent-600'
                    : 'text-th-text-tertiary'
                )}
              >
                <Send className="w-4 h-4" />
              </button>
            </div>
          </div>
        </>
      )}

      {activeTab === 'voice' && (
        <AIChatVoice onResult={handleVoiceResult} />
      )}

      {activeTab === 'dialer' && (
        <AIChatDialer />
      )}
    </div>
  );
}
