import { useState, useEffect, useRef, useCallback } from 'react';
import { Mic, MicOff, StopCircle, Loader2 } from 'lucide-react';

const cn = (...classes: (string | boolean | undefined | null)[]) =>
  classes.filter(Boolean).join(' ');

interface AIChatVoiceProps {
  onResult: (transcript: string) => void;
}

type ListenState = 'idle' | 'listening' | 'processing';

interface SpeechRecognitionEvent {
  results: { [index: number]: { [index: number]: { transcript: string } }; length: number };
  resultIndex: number;
}

export function AIChatVoice({ onResult }: AIChatVoiceProps) {
  const [state, setState] = useState<ListenState>('idle');
  const [transcript, setTranscript] = useState('');
  const [interimTranscript, setInterimTranscript] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [audioLevel, setAudioLevel] = useState(0);
  const recognitionRef = useRef<ReturnType<typeof createRecognition> | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const animFrameRef = useRef<number>(0);
  const streamRef = useRef<MediaStream | null>(null);

  const bars = 24;

  function createRecognition() {
    const SpeechRecognition = (window as unknown as Record<string, unknown>).SpeechRecognition
      || (window as unknown as Record<string, unknown>).webkitSpeechRecognition;
    if (!SpeechRecognition) return null;
    const recognition = new (SpeechRecognition as new () => {
      continuous: boolean;
      interimResults: boolean;
      lang: string;
      start: () => void;
      stop: () => void;
      abort: () => void;
      onresult: ((e: SpeechRecognitionEvent) => void) | null;
      onerror: ((e: { error: string }) => void) | null;
      onend: (() => void) | null;
    })();
    recognition.continuous = true;
    recognition.interimResults = true;
    recognition.lang = 'en-US';
    return recognition;
  }

  const startAudioAnalysis = useCallback(async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      streamRef.current = stream;
      const audioCtx = new AudioContext();
      const source = audioCtx.createMediaStreamSource(stream);
      const analyser = audioCtx.createAnalyser();
      analyser.fftSize = 64;
      source.connect(analyser);
      analyserRef.current = analyser;

      const dataArray = new Uint8Array(analyser.frequencyBinCount);
      const tick = () => {
        analyser.getByteFrequencyData(dataArray);
        const avg = dataArray.reduce((a, b) => a + b, 0) / dataArray.length;
        setAudioLevel(avg / 255);
        animFrameRef.current = requestAnimationFrame(tick);
      };
      tick();
    } catch {
      // audio analysis is optional, voice recognition still works
    }
  }, []);

  const stopAudioAnalysis = useCallback(() => {
    cancelAnimationFrame(animFrameRef.current);
    streamRef.current?.getTracks().forEach((t) => t.stop());
    streamRef.current = null;
    analyserRef.current = null;
    setAudioLevel(0);
  }, []);

  const startListening = useCallback(() => {
    setError(null);
    setTranscript('');
    setInterimTranscript('');

    const recognition = createRecognition();
    if (!recognition) {
      setError('Speech recognition not supported in this browser');
      return;
    }

    recognition.onresult = (e: SpeechRecognitionEvent) => {
      let final = '';
      let interim = '';
      for (let i = e.resultIndex; i < e.results.length; i++) {
        const result = e.results[i];
        if ((result as unknown as { isFinal: boolean }).isFinal) {
          final += result[0].transcript;
        } else {
          interim += result[0].transcript;
        }
      }
      if (final) setTranscript((prev) => prev + final);
      setInterimTranscript(interim);
    };

    recognition.onerror = (e: { error: string }) => {
      if (e.error !== 'aborted') {
        setError(`Error: ${e.error}`);
        setState('idle');
        stopAudioAnalysis();
      }
    };

    recognition.onend = () => {
      if (state === 'listening') {
        setState('processing');
      }
    };

    recognitionRef.current = recognition;
    recognition.start();
    setState('listening');
    startAudioAnalysis();
  }, [state, startAudioAnalysis, stopAudioAnalysis]);

  const stopListening = useCallback(() => {
    recognitionRef.current?.stop();
    stopAudioAnalysis();
    setState('processing');

    setTimeout(() => {
      const finalTranscript = transcript || interimTranscript;
      if (finalTranscript.trim()) {
        onResult(finalTranscript.trim());
      }
      setState('idle');
      setTranscript('');
      setInterimTranscript('');
    }, 300);
  }, [transcript, interimTranscript, onResult, stopAudioAnalysis]);

  useEffect(() => {
    return () => {
      recognitionRef.current?.abort();
      stopAudioAnalysis();
    };
  }, [stopAudioAnalysis]);

  const barHeights = Array.from({ length: bars }, (_, i) => {
    if (state !== 'listening') return 4;
    const noise = Math.sin(Date.now() / 200 + i * 0.5) * 0.3 + 0.7;
    return Math.max(4, audioLevel * 40 * noise);
  });

  return (
    <div className="flex-1 flex flex-col items-center justify-center px-6 py-4 gap-6">
      {/* Waveform visualization */}
      <div className="flex items-center gap-[3px] h-16">
        {barHeights.map((h, i) => (
          <div
            key={i}
            className={cn(
              'w-1 rounded-full transition-all',
              state === 'listening' ? 'bg-th-accent-500' : 'bg-th-border',
              state === 'listening' && 'duration-75'
            )}
            style={{ height: `${h}px`, transitionDuration: '75ms' }}
          />
        ))}
      </div>

      {/* Status */}
      <div className="text-center">
        {state === 'idle' && !error && (
          <p className="text-sm text-th-text-secondary">
            Tap the microphone to start speaking
          </p>
        )}
        {state === 'listening' && (
          <p className="text-sm text-th-accent-500 font-medium animate-pulse">
            Listening...
          </p>
        )}
        {state === 'processing' && (
          <div className="flex items-center gap-2 justify-center">
            <Loader2 className="w-4 h-4 text-th-accent-500 animate-spin" />
            <p className="text-sm text-th-text-secondary">Processing...</p>
          </div>
        )}
        {error && (
          <p className="text-sm text-red-500">{error}</p>
        )}
      </div>

      {/* Transcript preview */}
      {(transcript || interimTranscript) && (
        <div className="w-full bg-surface-secondary rounded-xl p-3 max-h-[100px] overflow-y-auto">
          <p className="text-sm text-th-text-primary">
            {transcript}
            {interimTranscript && (
              <span className="text-th-text-tertiary">{interimTranscript}</span>
            )}
          </p>
        </div>
      )}

      {/* Mic button */}
      <button
        onClick={state === 'listening' ? stopListening : startListening}
        disabled={state === 'processing'}
        className={cn(
          'w-16 h-16 rounded-full flex items-center justify-center transition-all duration-200',
          state === 'listening'
            ? 'bg-red-500 text-white shadow-[0_0_25px_rgba(239,68,68,0.4)] hover:bg-red-600'
            : state === 'processing'
              ? 'bg-surface-tertiary text-th-text-tertiary cursor-not-allowed'
              : 'gradient-accent text-white glow-accent hover:scale-105'
        )}
      >
        {state === 'listening' ? (
          <StopCircle className="w-7 h-7" />
        ) : state === 'processing' ? (
          <Loader2 className="w-7 h-7 animate-spin" />
        ) : error ? (
          <MicOff className="w-7 h-7" />
        ) : (
          <Mic className="w-7 h-7" />
        )}
      </button>

      <p className="text-[10px] text-th-text-tertiary text-center">
        {state === 'listening'
          ? 'Tap stop or pause speaking to send'
          : 'Voice commands: "Show my pipeline", "Draft an email"'}
      </p>
    </div>
  );
}
