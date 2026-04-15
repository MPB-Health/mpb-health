import { useEffect, useRef, useState } from 'react';
import { motion, useInView, AnimatePresence } from 'framer-motion';
import { Search, Sparkles, User, Mail, Clock, Bot, Send, ArrowRight } from 'lucide-react';

/* ------------------------------------------------------------------ */
/*  Typewriter hook                                                     */
/* ------------------------------------------------------------------ */
function useTypewriter(text: string, speed: number, startDelay: number, active: boolean) {
  const [displayed, setDisplayed] = useState('');
  const [done, setDone] = useState(false);

  useEffect(() => {
    if (!active) return;
    let i = 0;
    setDisplayed('');
    setDone(false);

    const delayTimer = setTimeout(() => {
      const iv = setInterval(() => {
        i++;
        setDisplayed(text.slice(0, i));
        if (i >= text.length) {
          clearInterval(iv);
          setDone(true);
        }
      }, speed);
      return () => clearInterval(iv);
    }, startDelay);

    return () => clearTimeout(delayTimer);
  }, [text, speed, startDelay, active]);

  return { displayed, done };
}

/* ------------------------------------------------------------------ */
/*  Mock lead result cards                                              */
/* ------------------------------------------------------------------ */
const mockLeads = [
  { name: 'James Wilson', email: 'j.wilson@email.com', days: 8, stage: 'Quoted', avatar: 'JW' },
  { name: 'Maria Santos', email: 'm.santos@email.com', days: 10, stage: 'Contacted', avatar: 'MS' },
  { name: 'Robert Chen', email: 'r.chen@email.com', days: 14, stage: 'New', avatar: 'RC' },
];

/* ------------------------------------------------------------------ */
/*  Mock chat messages                                                  */
/* ------------------------------------------------------------------ */
const chatMessages = [
  { role: 'user' as const, text: 'Draft a follow-up email for James Wilson' },
  { role: 'ai' as const, text: 'Here\'s a personalized follow-up based on his quote history and engagement data:' },
];

const mockEmail = {
  subject: 'Re: Your Health Sharing Quote - Quick Update',
  preview: 'Hi James, I noticed you were interested in our Premium plan. I wanted to share a quick update on the coverage options we discussed...',
};

/* ================================================================== */
/*  AI Showcase Section                                                 */
/* ================================================================== */
export function AIShowcase() {
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { once: true, margin: '-80px' });
  const [phase, setPhase] = useState<'command' | 'results' | 'chat' | 'email'>('command');

  const query = 'Show me leads not contacted in 7+ days';
  const { displayed: typedQuery, done: queryDone } = useTypewriter(query, 45, 800, inView);

  useEffect(() => {
    if (!inView) return;
    const timers = [
      setTimeout(() => setPhase('results'), 3200),
      setTimeout(() => setPhase('chat'), 6000),
      setTimeout(() => setPhase('email'), 8200),
    ];
    return () => timers.forEach(clearTimeout);
  }, [inView]);

  return (
    <section ref={ref} className="relative py-24 overflow-hidden">
      {/* Background */}
      <div className="absolute inset-0 bg-gradient-to-b from-[#080e1e] via-[#0d1630] to-[#080e1e]" />

      {/* Ambient glow spots */}
      <div className="absolute inset-0 pointer-events-none">
        <motion.div
          animate={{ opacity: [0.15, 0.3, 0.15], scale: [1, 1.1, 1] }}
          transition={{ duration: 5, repeat: Infinity, ease: 'easeInOut' }}
          className="absolute top-1/4 left-1/3 w-80 h-80 bg-violet-500/20 rounded-full blur-[100px]"
        />
        <motion.div
          animate={{ opacity: [0.1, 0.25, 0.1], scale: [1, 1.15, 1] }}
          transition={{ duration: 6, repeat: Infinity, ease: 'easeInOut', delay: 1 }}
          className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-cyan-500/15 rounded-full blur-[120px]"
        />
        <motion.div
          animate={{ opacity: [0.08, 0.2, 0.08] }}
          transition={{ duration: 4, repeat: Infinity, ease: 'easeInOut', delay: 2 }}
          className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-64 h-64 bg-[#A4CC43]/15 rounded-full blur-[80px]"
        />
      </div>

      {/* Grid dots */}
      <div className="absolute inset-0 opacity-[0.03]" style={{
        backgroundImage: 'radial-gradient(circle, white 1px, transparent 1px)',
        backgroundSize: '40px 40px',
      }} />

      <div className="relative z-10 max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={inView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.6 }}
          className="text-center mb-16"
        >
          <span className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-violet-500/10 border border-violet-500/20 text-violet-300 text-sm font-semibold mb-4">
            <Sparkles className="w-4 h-4" />
            AI-Powered
          </span>
          <h2 className="text-3xl sm:text-4xl font-extrabold text-white tracking-tight">
            Your intelligent{' '}
            <span className="bg-gradient-to-r from-violet-400 to-cyan-400 bg-clip-text text-transparent">
              sales co-pilot
            </span>
          </h2>
          <p className="mt-4 text-lg text-white/40 max-w-2xl mx-auto">
            Ask anything in plain English. The AI finds data, drafts emails, and surfaces insights instantly.
          </p>
        </motion.div>

        {/* Two-column layout */}
        <div className="grid lg:grid-cols-2 gap-8 items-start">
          {/* ---- Left: AI Command Bar Demo ---- */}
          <div className="space-y-4">
            {/* Command bar */}
            <motion.div
              initial={{ opacity: 0, y: 20, scale: 0.95 }}
              animate={inView ? { opacity: 1, y: 0, scale: 1 } : {}}
              transition={{ duration: 0.5, delay: 0.3 }}
              className="relative"
            >
              {/* Outer glow ring */}
              <div className="absolute -inset-px rounded-2xl bg-gradient-to-r from-violet-500/40 via-cyan-500/40 to-violet-500/40 blur-sm" />

              <div className="relative rounded-2xl bg-[#111a35]/90 backdrop-blur-xl border border-white/10 overflow-hidden">
                {/* Input area */}
                <div className="flex items-center gap-3 px-5 py-4">
                  <Search className="w-5 h-5 text-violet-400 shrink-0" />
                  <div className="flex-1 text-sm text-white/80 font-medium min-h-[20px]">
                    {typedQuery}
                    {!queryDone && (
                      <motion.span
                        animate={{ opacity: [1, 0, 1] }}
                        transition={{ duration: 0.8, repeat: Infinity }}
                        className="inline-block w-0.5 h-4 bg-violet-400 ml-0.5 align-middle"
                      />
                    )}
                  </div>
                  <div className="flex items-center gap-1 px-2 py-1 rounded-md bg-white/5 text-[10px] text-white/30 font-mono shrink-0">
                    <span>⌘</span><span>J</span>
                  </div>
                </div>

                {/* Results area */}
                <AnimatePresence>
                  {(phase === 'results' || phase === 'chat' || phase === 'email') && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: 'auto', opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.4, ease: 'easeOut' }}
                      className="border-t border-white/5"
                    >
                      <div className="p-4 space-y-2">
                        <p className="text-[10px] text-white/30 font-medium uppercase tracking-wider mb-3">
                          3 leads found
                        </p>
                        {mockLeads.map((lead, i) => (
                          <motion.div
                            key={lead.name}
                            initial={{ opacity: 0, y: 12 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ duration: 0.3, delay: i * 0.12 }}
                            className="flex items-center gap-3 p-3 rounded-xl bg-white/[0.03] border border-white/[0.05] hover:bg-white/[0.06] transition-colors"
                          >
                            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-violet-500 to-blue-500 flex items-center justify-center text-[10px] font-bold text-white shrink-0">
                              {lead.avatar}
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className="text-xs font-semibold text-white">{lead.name}</p>
                              <p className="text-[10px] text-white/30">{lead.email}</p>
                            </div>
                            <div className="text-right shrink-0">
                              <div className="flex items-center gap-1 text-amber-400">
                                <Clock className="w-3 h-3" />
                                <span className="text-[10px] font-medium">{lead.days}d</span>
                              </div>
                              <span className="text-[9px] text-white/25">{lead.stage}</span>
                            </div>
                          </motion.div>
                        ))}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </motion.div>
          </div>

          {/* ---- Right: AI Chat Demo ---- */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={inView ? { opacity: 1, y: 0 } : {}}
            transition={{ duration: 0.6, delay: 0.5 }}
            className="relative"
          >
            {/* Glow */}
            <div className="absolute -inset-px rounded-2xl bg-gradient-to-br from-cyan-500/30 to-violet-500/30 blur-sm" />

            <div className="relative rounded-2xl bg-[#111a35]/90 backdrop-blur-xl border border-white/10 overflow-hidden">
              {/* Chat header */}
              <div className="flex items-center gap-3 px-5 py-3.5 border-b border-white/5">
                <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-violet-500 to-cyan-500 flex items-center justify-center">
                  <Bot className="w-4 h-4 text-white" />
                </div>
                <div>
                  <p className="text-xs font-semibold text-white">AI Assistant</p>
                  <div className="flex items-center gap-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                    <span className="text-[10px] text-white/30">Online</span>
                  </div>
                </div>
                <div className="ml-auto flex items-center gap-1 px-2 py-1 rounded-md bg-white/5 text-[10px] text-white/30 font-mono">
                  <span>⌘</span><span>⇧</span><span>A</span>
                </div>
              </div>

              {/* Messages */}
              <div className="p-4 space-y-3 min-h-[260px]">
                {/* User message */}
                <AnimatePresence>
                  {(phase === 'chat' || phase === 'email') && (
                    <motion.div
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.4 }}
                      className="flex justify-end"
                    >
                      <div className="max-w-[85%] px-4 py-2.5 rounded-2xl rounded-br-md bg-primary-600 text-white text-xs leading-relaxed">
                        {chatMessages[0].text}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>

                {/* AI response */}
                <AnimatePresence>
                  {(phase === 'chat' || phase === 'email') && (
                    <motion.div
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.4, delay: 0.6 }}
                      className="flex gap-2"
                    >
                      <div className="w-6 h-6 rounded-md bg-gradient-to-br from-violet-500 to-cyan-500 flex items-center justify-center shrink-0 mt-0.5">
                        <Sparkles className="w-3 h-3 text-white" />
                      </div>
                      <div className="max-w-[85%] px-4 py-2.5 rounded-2xl rounded-bl-md bg-white/[0.05] border border-white/[0.08] text-white/70 text-xs leading-relaxed">
                        {chatMessages[1].text}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>

                {/* Email preview card */}
                <AnimatePresence>
                  {phase === 'email' && (
                    <motion.div
                      initial={{ opacity: 0, y: 16, scale: 0.96 }}
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      transition={{ duration: 0.5, delay: 0.3, type: 'spring', stiffness: 200 }}
                      className="ml-8"
                    >
                      <div className="rounded-xl bg-white/[0.04] border border-white/[0.08] overflow-hidden">
                        <div className="px-4 py-2.5 border-b border-white/5 flex items-center gap-2">
                          <Mail className="w-3.5 h-3.5 text-cyan-400" />
                          <span className="text-[10px] font-medium text-white/50">Email Draft</span>
                          <span className="ml-auto text-[9px] text-[#A4CC43] font-medium">AI Generated</span>
                        </div>
                        <div className="p-4 space-y-2">
                          <div className="flex items-center gap-2">
                            <span className="text-[10px] text-white/30">To:</span>
                            <span className="text-[10px] text-white/60">j.wilson@email.com</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <span className="text-[10px] text-white/30">Subject:</span>
                            <span className="text-[10px] text-white/60 font-medium">{mockEmail.subject}</span>
                          </div>
                          <div className="mt-2 pt-2 border-t border-white/5">
                            <p className="text-[11px] text-white/50 leading-relaxed">{mockEmail.preview}</p>
                          </div>
                          <div className="flex items-center gap-2 pt-2">
                            <motion.button
                              whileHover={{ scale: 1.02 }}
                              whileTap={{ scale: 0.98 }}
                              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-primary-600 text-white text-[10px] font-semibold"
                            >
                              <Send className="w-3 h-3" />
                              Send Now
                            </motion.button>
                            <button className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white/5 text-white/50 text-[10px] font-medium hover:bg-white/10 transition-colors">
                              Edit Draft
                            </button>
                          </div>
                        </div>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>

              {/* Input bar */}
              <div className="px-4 py-3 border-t border-white/5 flex items-center gap-2">
                <div className="flex-1 px-3 py-2 rounded-lg bg-white/[0.03] border border-white/[0.06] text-[10px] text-white/20">
                  Ask the AI anything...
                </div>
                <div className="w-7 h-7 rounded-lg bg-primary-600 flex items-center justify-center">
                  <ArrowRight className="w-3.5 h-3.5 text-white" />
                </div>
              </div>
            </div>
          </motion.div>
        </div>

        {/* Capability pills */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={inView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.5, delay: 1.2 }}
          className="flex flex-wrap items-center justify-center gap-3 mt-12"
        >
          {[
            'Natural Language Search',
            'Email Drafting',
            'Lead Scoring',
            'Call Coaching',
            'Smart Suggestions',
            'Voice Commands',
          ].map((cap) => (
            <span
              key={cap}
              className="px-4 py-2 rounded-full bg-white/[0.04] border border-white/[0.08] text-xs text-white/40 font-medium hover:bg-white/[0.08] hover:text-white/60 transition-colors"
            >
              {cap}
            </span>
          ))}
        </motion.div>
      </div>
    </section>
  );
}
