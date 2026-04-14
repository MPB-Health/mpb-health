import { useState, useCallback } from 'react';
import {
  Phone, PhoneOff, Delete, ExternalLink,
  PhoneCall, PhoneIncoming, PhoneMissed,
} from 'lucide-react';

const cn = (...classes: (string | boolean | undefined | null)[]) =>
  classes.filter(Boolean).join(' ');

type DialerView = 'pad' | 'log' | 'settings';
type CallStatus = 'idle' | 'connecting' | 'active' | 'ended';

interface CallLogEntry {
  id: string;
  number: string;
  name?: string;
  direction: 'inbound' | 'outbound' | 'missed';
  duration: string;
  timestamp: string;
}

const SAMPLE_LOG: CallLogEntry[] = [
  { id: '1', number: '(555) 123-4567', name: 'Sarah Johnson', direction: 'outbound', duration: '4:32', timestamp: '2h ago' },
  { id: '2', number: '(555) 987-6543', name: 'Mike Chen', direction: 'inbound', duration: '2:15', timestamp: '4h ago' },
  { id: '3', number: '(555) 456-7890', direction: 'missed', duration: '0:00', timestamp: 'Yesterday' },
  { id: '4', number: '(555) 321-9876', name: 'Lisa Wang', direction: 'outbound', duration: '12:47', timestamp: 'Yesterday' },
];

const DIAL_KEYS = [
  { digit: '1', letters: '' },
  { digit: '2', letters: 'ABC' },
  { digit: '3', letters: 'DEF' },
  { digit: '4', letters: 'GHI' },
  { digit: '5', letters: 'JKL' },
  { digit: '6', letters: 'MNO' },
  { digit: '7', letters: 'PQRS' },
  { digit: '8', letters: 'TUV' },
  { digit: '9', letters: 'WXYZ' },
  { digit: '*', letters: '' },
  { digit: '0', letters: '+' },
  { digit: '#', letters: '' },
];

const DIRECTION_ICONS = {
  inbound: PhoneIncoming,
  outbound: PhoneCall,
  missed: PhoneMissed,
};

const DIRECTION_COLORS = {
  inbound: 'text-green-500',
  outbound: 'text-th-accent-500',
  missed: 'text-red-500',
};

export function AIChatDialer() {
  const [view, setView] = useState<DialerView>('pad');
  const [number, setNumber] = useState('');
  const [callStatus, setCallStatus] = useState<CallStatus>('idle');
  const [callDuration, setCallDuration] = useState(0);
  const [provider, setProvider] = useState<'goto' | 'twilio' | 'none'>('none');

  const addDigit = (digit: string) => {
    if (callStatus === 'active') return;
    setNumber((prev) => prev + digit);
  };

  const removeDigit = () => {
    setNumber((prev) => prev.slice(0, -1));
  };

  const formatDisplay = (raw: string) => {
    const digits = raw.replace(/\D/g, '');
    if (digits.length <= 3) return digits;
    if (digits.length <= 6) return `(${digits.slice(0, 3)}) ${digits.slice(3)}`;
    return `(${digits.slice(0, 3)}) ${digits.slice(3, 6)}-${digits.slice(6, 10)}`;
  };

  const initiateCall = useCallback(() => {
    if (!number.trim() || callStatus !== 'idle') return;

    if (provider === 'none') {
      setView('settings');
      return;
    }

    setCallStatus('connecting');
    setTimeout(() => {
      setCallStatus('active');
      const interval = setInterval(() => {
        setCallDuration((d) => d + 1);
      }, 1000);

      // Auto-end after demo duration
      setTimeout(() => {
        clearInterval(interval);
        setCallStatus('ended');
        setTimeout(() => {
          setCallStatus('idle');
          setCallDuration(0);
        }, 2000);
      }, 5000);
    }, 2000);
  }, [number, callStatus, provider]);

  const endCall = useCallback(() => {
    setCallStatus('ended');
    setTimeout(() => {
      setCallStatus('idle');
      setCallDuration(0);
    }, 1500);
  }, []);

  const formatDuration = (s: number) =>
    `${Math.floor(s / 60)}:${(s % 60).toString().padStart(2, '0')}`;

  const navItems: { id: DialerView; label: string }[] = [
    { id: 'pad', label: 'Dial Pad' },
    { id: 'log', label: 'Recent' },
    { id: 'settings', label: 'Setup' },
  ];

  return (
    <div className="flex-1 flex flex-col overflow-hidden">
      {/* Sub-nav */}
      <div className="flex border-b border-th-border/30 px-2">
        {navItems.map((item) => (
          <button
            key={item.id}
            onClick={() => setView(item.id)}
            className={cn(
              'flex-1 py-2 text-[11px] font-medium transition-all border-b-2',
              view === item.id
                ? 'text-th-accent-500 border-th-accent-500'
                : 'text-th-text-tertiary border-transparent hover:text-th-text-secondary'
            )}
          >
            {item.label}
          </button>
        ))}
      </div>

      {view === 'pad' && (
        <div className="flex-1 flex flex-col items-center justify-between py-4 px-6">
          {/* Number display */}
          <div className="w-full text-center mb-2">
            {callStatus === 'active' || callStatus === 'connecting' ? (
              <div className="space-y-1">
                <p className="text-lg font-semibold text-th-text-primary tabular-nums">
                  {formatDisplay(number)}
                </p>
                <p className={cn(
                  'text-sm font-medium',
                  callStatus === 'connecting' ? 'text-amber-500 animate-pulse' : 'text-green-500'
                )}>
                  {callStatus === 'connecting' ? 'Connecting...' : formatDuration(callDuration)}
                </p>
              </div>
            ) : callStatus === 'ended' ? (
              <div className="space-y-1">
                <p className="text-lg font-semibold text-th-text-primary tabular-nums">
                  {formatDisplay(number)}
                </p>
                <p className="text-sm text-th-text-tertiary">Call ended</p>
              </div>
            ) : (
              <p className="text-2xl font-light text-th-text-primary tabular-nums h-8">
                {number ? formatDisplay(number) : (
                  <span className="text-th-text-tertiary text-base">Enter number</span>
                )}
              </p>
            )}
          </div>

          {/* Dial pad */}
          <div className="grid grid-cols-3 gap-2 w-full max-w-[240px]">
            {DIAL_KEYS.map((key) => (
              <button
                key={key.digit}
                onClick={() => addDigit(key.digit)}
                disabled={callStatus === 'active'}
                className={cn(
                  'h-12 rounded-xl flex flex-col items-center justify-center',
                  'bg-surface-secondary hover:bg-surface-tertiary active:scale-95',
                  'transition-all duration-100',
                  callStatus === 'active' && 'opacity-50 cursor-not-allowed'
                )}
              >
                <span className="text-lg font-medium text-th-text-primary leading-none">{key.digit}</span>
                {key.letters && (
                  <span className="text-[8px] text-th-text-tertiary tracking-widest mt-0.5">{key.letters}</span>
                )}
              </button>
            ))}
          </div>

          {/* Action buttons */}
          <div className="flex items-center gap-4 mt-3">
            {number && callStatus === 'idle' && (
              <button onClick={removeDigit} className="p-2 text-th-text-tertiary hover:text-th-text-secondary transition-colors">
                <Delete className="w-5 h-5" />
              </button>
            )}

            {callStatus === 'active' || callStatus === 'connecting' ? (
              <button
                onClick={endCall}
                className="w-14 h-14 rounded-full bg-red-500 text-white flex items-center justify-center shadow-lg hover:bg-red-600 transition-colors"
              >
                <PhoneOff className="w-6 h-6" />
              </button>
            ) : (
              <button
                onClick={initiateCall}
                disabled={!number.trim() || callStatus === 'ended'}
                className={cn(
                  'w-14 h-14 rounded-full flex items-center justify-center shadow-lg transition-all',
                  number.trim() && callStatus !== 'ended'
                    ? 'bg-green-500 text-white hover:bg-green-600 glow-success'
                    : 'bg-surface-tertiary text-th-text-tertiary cursor-not-allowed'
                )}
              >
                <Phone className="w-6 h-6" />
              </button>
            )}

            {number && callStatus === 'idle' && <div className="w-9" />}
          </div>
        </div>
      )}

      {view === 'log' && (
        <div className="flex-1 overflow-y-auto">
          {SAMPLE_LOG.map((entry) => {
            const Icon = DIRECTION_ICONS[entry.direction];
            return (
              <button
                key={entry.id}
                onClick={() => { setNumber(entry.number.replace(/\D/g, '')); setView('pad'); }}
                className="w-full flex items-center gap-3 px-4 py-3 hover:bg-surface-secondary/60 transition-colors border-b border-th-border/30"
              >
                <div className={cn('w-8 h-8 rounded-full bg-surface-secondary flex items-center justify-center shrink-0')}>
                  <Icon className={cn('w-4 h-4', DIRECTION_COLORS[entry.direction])} />
                </div>
                <div className="flex-1 text-left min-w-0">
                  <p className="text-sm font-medium text-th-text-primary truncate">
                    {entry.name || entry.number}
                  </p>
                  <p className="text-xs text-th-text-tertiary">
                    {entry.number} · {entry.duration}
                  </p>
                </div>
                <span className="text-[10px] text-th-text-tertiary shrink-0">{entry.timestamp}</span>
              </button>
            );
          })}
        </div>
      )}

      {view === 'settings' && (
        <div className="flex-1 px-4 py-4 space-y-4">
          <div>
            <h4 className="text-sm font-semibold text-th-text-primary mb-1">Telephony Provider</h4>
            <p className="text-xs text-th-text-tertiary mb-3">
              Connect a VoIP provider to make calls directly from the CRM.
            </p>
          </div>

          {[
            { id: 'goto' as const, name: 'GoTo Connect', desc: 'Enterprise VoIP and meetings' },
            { id: 'twilio' as const, name: 'Twilio', desc: 'Programmable voice and SMS' },
          ].map((p) => (
            <button
              key={p.id}
              onClick={() => setProvider(p.id)}
              className={cn(
                'w-full flex items-center gap-3 p-3 rounded-xl border transition-all',
                provider === p.id
                  ? 'border-th-accent-500 bg-th-accent-500/5'
                  : 'border-th-border/50 hover:border-th-border'
              )}
            >
              <div className={cn(
                'w-10 h-10 rounded-lg flex items-center justify-center shrink-0',
                provider === p.id ? 'gradient-accent' : 'bg-surface-secondary'
              )}>
                <Phone className={cn('w-5 h-5', provider === p.id ? 'text-white' : 'text-th-text-secondary')} />
              </div>
              <div className="text-left flex-1">
                <p className="text-sm font-medium text-th-text-primary">{p.name}</p>
                <p className="text-xs text-th-text-tertiary">{p.desc}</p>
              </div>
              {provider === p.id && (
                <span className="text-xs font-medium text-th-accent-500 bg-th-accent-500/10 px-2 py-0.5 rounded-full">
                  Active
                </span>
              )}
            </button>
          ))}

          {provider !== 'none' && (
            <div className="pt-2">
              <button className="w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl gradient-accent text-white text-sm font-medium hover:opacity-90 transition-opacity">
                <ExternalLink className="w-4 h-4" />
                Configure {provider === 'goto' ? 'GoTo Connect' : 'Twilio'}
              </button>
              <p className="text-[10px] text-th-text-tertiary text-center mt-2">
                Opens provider settings in a new window
              </p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
