import { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { format } from 'date-fns';
import {
  ArrowLeft,
  User,
  Send,
  Mail,
  MessageSquare,
  Phone,
  MoreVertical,
  FileText,
  Check,
  CheckCheck,
  Clock,
  AlertCircle,
  Paperclip,
  Sparkles,
} from 'lucide-react';
import { useConversation, useTemplates, useInboxActions } from '../hooks/useInbox';
import { useAuth } from '../hooks/useAuth';
import { templateService, type Message, type MessageTemplate } from '@mpbhealth/champion-core';
import { AIMessageAssistant } from '../components/ai';

export default function ConversationThread() {
  const { conversationId } = useParams<{ conversationId: string }>();
  const navigate = useNavigate();
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const { conversation, messages, loading, refresh } = useConversation(conversationId || null);
  const { templates } = useTemplates();
  const { sendMessage } = useInboxActions();
  const { user } = useAuth();

  const [channel, setChannel] = useState<'sms' | 'email'>('sms');
  const [content, setContent] = useState('');
  const [subject, setSubject] = useState('');
  const [sending, setSending] = useState(false);
  const [showTemplates, setShowTemplates] = useState(false);
  const [showAIAssist, setShowAIAssist] = useState(false);

  // Scroll to bottom on new messages
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Set initial channel based on conversation
  useEffect(() => {
    if (conversation) {
      if (conversation.channel === 'sms') {
        setChannel('sms');
      } else if (conversation.channel === 'email') {
        setChannel('email');
      }
    }
  }, [conversation]);

  const handleSend = async () => {
    if (!conversationId || !content.trim()) return;
    if (channel === 'email' && !subject.trim()) return;

    try {
      setSending(true);
      await sendMessage(conversationId, channel, content, { subject });
      setContent('');
      setSubject('');
      refresh();
    } catch (err) {
      console.error('Failed to send:', err);
    } finally {
      setSending(false);
    }
  };

  const handleTemplateSelect = (template: MessageTemplate) => {
    // Render template with basic variables
    const variables: Record<string, string> = {
      first_name: conversation?.participant_name?.split(' ')[0] || 'there',
      advisor_name: 'Your Advisor', // TODO: Get from profile
    };
    const rendered = templateService.renderTemplate(template, variables);
    setContent(rendered.body);
    if (rendered.subject) {
      setSubject(rendered.subject);
    }
    setShowTemplates(false);
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'sent':
        return <Check className="w-3 h-3 text-neutral-400" />;
      case 'delivered':
        return <CheckCheck className="w-3 h-3 text-neutral-400" />;
      case 'opened':
      case 'clicked':
        return <CheckCheck className="w-3 h-3 text-blue-500" />;
      case 'pending':
      case 'queued':
        return <Clock className="w-3 h-3 text-yellow-500" />;
      case 'failed':
      case 'bounced':
        return <AlertCircle className="w-3 h-3 text-red-500" />;
      default:
        return null;
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full py-16">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600" />
      </div>
    );
  }

  if (!conversation) {
    return (
      <div className="text-center py-16">
        <p className="text-neutral-500 mb-4">Conversation not found</p>
        <button
          onClick={() => navigate('/inbox')}
          className="px-4 py-2 bg-neutral-100 text-neutral-700 rounded-lg hover:bg-neutral-200"
        >
          Back to Inbox
        </button>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-[calc(100vh-8rem)]">
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-neutral-200 bg-white">
        <div className="flex items-center space-x-4">
          <button
            onClick={() => navigate('/inbox')}
            className="p-2 hover:bg-neutral-100 rounded-lg transition-colors"
          >
            <ArrowLeft className="w-5 h-5 text-neutral-600" />
          </button>
          <div className="w-10 h-10 bg-neutral-100 rounded-full flex items-center justify-center">
            <User className="w-5 h-5 text-neutral-500" />
          </div>
          <div>
            <h2 className="font-semibold text-neutral-900">{conversation.participant_name}</h2>
            <div className="flex items-center space-x-2 text-sm text-neutral-500">
              {conversation.participant_email && (
                <span>{conversation.participant_email}</span>
              )}
              {conversation.participant_phone && (
                <span>{conversation.participant_phone}</span>
              )}
            </div>
          </div>
        </div>

        <div className="flex items-center space-x-2">
          {conversation.participant_email && (
            <a
              href={`mailto:${conversation.participant_email}`}
              className="p-2 hover:bg-neutral-100 rounded-lg transition-colors"
              title="Send external email"
            >
              <Mail className="w-5 h-5 text-neutral-500" />
            </a>
          )}
          {conversation.participant_phone && (
            <a
              href={`tel:${conversation.participant_phone}`}
              className="p-2 hover:bg-neutral-100 rounded-lg transition-colors"
              title="Call"
            >
              <Phone className="w-5 h-5 text-neutral-500" />
            </a>
          )}
          {conversation.lead_id && (
            <button
              onClick={() => navigate(`/leads/${conversation.lead_id}`)}
              className="px-3 py-1.5 text-sm bg-neutral-100 text-neutral-700 rounded-lg hover:bg-neutral-200 transition-colors"
            >
              View Lead
            </button>
          )}
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-neutral-50">
        {messages.length === 0 ? (
          <div className="text-center py-8 text-neutral-400">
            <MessageSquare className="w-12 h-12 mx-auto mb-3" />
            <p>No messages yet. Start the conversation!</p>
          </div>
        ) : (
          messages.map((message) => (
            <div
              key={message.id}
              className={`flex ${
                message.direction === 'outbound' ? 'justify-end' : 'justify-start'
              }`}
            >
              <div
                className={`max-w-[70%] rounded-2xl px-4 py-2 ${
                  message.direction === 'outbound'
                    ? 'bg-primary-600 text-white rounded-br-md'
                    : 'bg-white text-neutral-900 border border-neutral-200 rounded-bl-md'
                }`}
              >
                {/* Channel indicator */}
                <div
                  className={`flex items-center space-x-1 text-xs mb-1 ${
                    message.direction === 'outbound' ? 'text-primary-200' : 'text-neutral-400'
                  }`}
                >
                  {message.channel === 'email' ? (
                    <Mail className="w-3 h-3" />
                  ) : (
                    <MessageSquare className="w-3 h-3" />
                  )}
                  <span className="uppercase">{message.channel}</span>
                </div>

                {/* Subject for email */}
                {message.channel === 'email' && message.subject && (
                  <p
                    className={`font-medium text-sm mb-1 ${
                      message.direction === 'outbound' ? 'text-white' : 'text-neutral-900'
                    }`}
                  >
                    {message.subject}
                  </p>
                )}

                {/* Content */}
                <p className="whitespace-pre-wrap break-words">
                  {message.content || message.body_text}
                </p>

                {/* Timestamp and status */}
                <div
                  className={`flex items-center justify-end space-x-1 mt-1 text-xs ${
                    message.direction === 'outbound' ? 'text-primary-200' : 'text-neutral-400'
                  }`}
                >
                  <span>{format(new Date(message.created_at), 'h:mm a')}</span>
                  {message.direction === 'outbound' && getStatusIcon(message.status)}
                </div>
              </div>
            </div>
          ))
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Compose area */}
      <div className="border-t border-neutral-200 bg-white p-4">
        {/* Channel toggle */}
        <div className="flex items-center space-x-2 mb-3">
          <button
            onClick={() => setChannel('sms')}
            disabled={!conversation.participant_phone}
            className={`flex items-center space-x-1 px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
              channel === 'sms'
                ? 'bg-green-100 text-green-700'
                : 'bg-neutral-100 text-neutral-600 hover:bg-neutral-200'
            } ${!conversation.participant_phone ? 'opacity-50 cursor-not-allowed' : ''}`}
          >
            <MessageSquare className="w-4 h-4" />
            <span>SMS</span>
          </button>
          <button
            onClick={() => setChannel('email')}
            disabled={!conversation.participant_email}
            className={`flex items-center space-x-1 px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
              channel === 'email'
                ? 'bg-blue-100 text-blue-700'
                : 'bg-neutral-100 text-neutral-600 hover:bg-neutral-200'
            } ${!conversation.participant_email ? 'opacity-50 cursor-not-allowed' : ''}`}
          >
            <Mail className="w-4 h-4" />
            <span>Email</span>
          </button>

          <div className="flex-1" />

          {/* AI Assist button */}
          <button
            onClick={() => setShowAIAssist(!showAIAssist)}
            className={`flex items-center space-x-1 px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
              showAIAssist
                ? 'bg-purple-100 text-purple-700'
                : 'bg-neutral-100 text-neutral-600 hover:bg-neutral-200'
            }`}
          >
            <Sparkles className="w-4 h-4" />
            <span>AI Assist</span>
          </button>

          {/* Templates button */}
          <div className="relative">
            <button
              onClick={() => setShowTemplates(!showTemplates)}
              className="flex items-center space-x-1 px-3 py-1.5 bg-neutral-100 text-neutral-600 rounded-lg hover:bg-neutral-200 text-sm font-medium"
            >
              <FileText className="w-4 h-4" />
              <span>Templates</span>
            </button>

            {/* Templates dropdown */}
            {showTemplates && (
              <div className="absolute bottom-full right-0 mb-2 w-72 bg-white rounded-xl shadow-lg border border-neutral-200 max-h-64 overflow-y-auto z-10">
                <div className="p-2">
                  {templates
                    .filter((t) => t.channel === channel || t.channel === 'both')
                    .map((template) => (
                      <button
                        key={template.id}
                        onClick={() => handleTemplateSelect(template)}
                        className="w-full text-left p-3 hover:bg-neutral-50 rounded-lg"
                      >
                        <p className="font-medium text-sm text-neutral-900">
                          {template.name}
                        </p>
                        <p className="text-xs text-neutral-500 truncate mt-0.5">
                          {template.body_text.substring(0, 60)}...
                        </p>
                      </button>
                    ))}
                  {templates.filter(
                    (t) => t.channel === channel || t.channel === 'both'
                  ).length === 0 && (
                    <p className="text-sm text-neutral-400 p-3 text-center">
                      No templates for {channel}
                    </p>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* AI Assistant Panel */}
        {showAIAssist && user?.id && content.trim() && (
          <div className="mb-3">
            <AIMessageAssistant
              userId={user.id}
              leadName={conversation.participant_name?.split(' ')[0]}
              originalMessage={content}
              onApply={(message) => {
                setContent(message);
                setShowAIAssist(false);
              }}
              onClose={() => setShowAIAssist(false)}
            />
          </div>
        )}

        {showAIAssist && !content.trim() && (
          <div className="mb-3 p-4 bg-purple-50 border border-purple-200 rounded-xl text-center text-sm text-purple-600">
            Start typing your message to get AI assistance
          </div>
        )}

        {/* Subject line for email */}
        {channel === 'email' && (
          <input
            type="text"
            placeholder="Subject..."
            value={subject}
            onChange={(e) => setSubject(e.target.value)}
            className="w-full px-4 py-2 border border-neutral-200 rounded-lg mb-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
          />
        )}

        {/* Message input */}
        <div className="flex items-end space-x-2">
          <textarea
            placeholder={
              channel === 'sms' ? 'Type your message...' : 'Type your email...'
            }
            value={content}
            onChange={(e) => setContent(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !e.shiftKey && channel === 'sms') {
                e.preventDefault();
                handleSend();
              }
            }}
            rows={channel === 'sms' ? 2 : 4}
            className="flex-1 px-4 py-2 border border-neutral-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent resize-none"
          />
          <button
            onClick={handleSend}
            disabled={sending || !content.trim() || (channel === 'email' && !subject.trim())}
            className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-2"
          >
            {sending ? (
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white" />
            ) : (
              <Send className="w-4 h-4" />
            )}
            <span>Send</span>
          </button>
        </div>

        {/* Character count for SMS */}
        {channel === 'sms' && (
          <p className="text-xs text-neutral-400 mt-1 text-right">
            {content.length} / 160 characters
            {content.length > 160 && ` (${Math.ceil(content.length / 160)} messages)`}
          </p>
        )}
      </div>
    </div>
  );
}
