'use client';

import { useState, useCallback, useEffect, useMemo, useRef } from 'react';
import { Button } from './components/ui/button';
import { Input } from './components/ui/input';

import AuraDoodle, { type AuraAccessory, type AuraState } from './components/AuraDoodle';

// Define the structure for a chat message
interface ChatMessage {
  role: 'user' | 'model';
  text: string;
}

// --- Types for Web Speech API ---
interface SpeechRecognitionEvent extends Event {
  readonly resultIndex: number;
  readonly results: SpeechRecognitionResultList;
}
interface SpeechRecognitionErrorEvent extends Event {
  readonly error: string;
  readonly message: string;
}
interface SpeechRecognition extends EventTarget {
  continuous: boolean;
  interimResults: boolean;
  lang: string;
  start(): void;
  stop(): void;
  onresult: (event: SpeechRecognitionEvent) => void;
  onerror: (event: SpeechRecognitionErrorEvent) => void;
  onend: () => void;
}
interface SpeechRecognitionStatic {
  new (): SpeechRecognition;
}
// --- Extend the global Window interface ---
declare global {
  interface Window {
    webkitSpeechRecognition: SpeechRecognitionStatic;
    webkitAudioContext?: typeof AudioContext;
  }
}

const HIGHLIGHT_TERMS = [
  'action',
  'actions',
  'next',
  'next-step',
  'next-steps',
  'urgent',
  'critical',
  'opportunity',
  'risk',
  'milestone',
  'focus',
  'deliverable',
  'timeline',
  'summary',
  'priority',
  'priorities',
  'insight',
  'insights',
  'alert',
  'attention',
  'optimize',
  'stabilize',
  'accelerate'
];

const deriveMoodFromResponse = (text: string): 'calm' | 'uplift' | 'alert' | 'focus' => {
  const lower = text.toLowerCase();
  if (/(urgent|alert|risk|escalat|immediate|critical|warning)/.test(lower)) {
    return 'alert';
  }
  if (/(celebrat|excited|great work|win|opportunity|momentum|confiden)/.test(lower)) {
    return 'uplift';
  }
  if (/(monitor|analyz|focus|optimiz|track|review|investigate|insight)/.test(lower)) {
    return 'focus';
  }
  return 'calm';
};

// --- The Core Assistant Component ---
export default function AssistantPage() {
  const [mode, setMode] = useState<'strategic' | 'creative' | 'analytical'>('strategic');
  const [hasInteracted, setHasInteracted] = useState(false);
  const [history, setHistory] = useState<ChatMessage[]>([]);
  const [userInput, setUserInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [isTyping, setIsTyping] = useState(false); // For the doodle
  const [briefingContent, setBriefingContent] = useState<string>('Status: Nominal. Fetching daily web digest...');
  const [currentTime, setCurrentTime] = useState<Date>(() => new Date());
  const [auraMood, setAuraMood] = useState<'calm' | 'uplift' | 'alert' | 'focus'>('calm');
  const [exportFeedback, setExportFeedback] = useState<string | null>(null);
  const [isDictating, setIsDictating] = useState(false);
  const [dictationTranscript, setDictationTranscript] = useState('');
  const [dictationSummary, setDictationSummary] = useState<string | null>(null);

  const chatContainerRef = useRef<HTMLDivElement>(null);
  const recognitionRef = useRef<SpeechRecognition | null>(null);
  const dictationRecognitionRef = useRef<SpeechRecognition | null>(null);
  const audioCtxRef = useRef<AudioContext | null>(null);
  const lastSfxStateRef = useRef<AuraState | null>(null);

  const userName = 'Swastideep';

  const auraState = useMemo<AuraState>(() => {
    if (isListening) return 'listening';
    if (isSpeaking) return 'speaking';
    if (isLoading) return 'thinking';
    if (isTyping) return 'typing';
    return 'idle';
  }, [isListening, isSpeaking, isLoading, isTyping]);

  const auraStatusMeta = useMemo(
    () => ({
      idle: {
        label: 'Idle',
        tone: 'Ready for your next command',
        badge: 'border-slate-500/40 bg-white/5 text-slate-300',
        pulse: 'bg-slate-400/80'
      },
      listening: {
        label: 'Listening',
        tone: 'Transcribing in real time',
        badge: 'border-cyan-400/50 bg-cyan-500/10 text-cyan-200',
        pulse: 'bg-cyan-300/80'
      },
      speaking: {
        label: 'Speaking',
        tone: 'Broadcasting response',
        badge: 'border-violet-400/60 bg-violet-500/10 text-violet-200',
        pulse: 'bg-violet-300/80'
      },
      thinking: {
        label: 'Thinking',
        tone: 'Synthesizing insight',
        badge: 'border-indigo-400/60 bg-indigo-500/10 text-indigo-200',
        pulse: 'bg-indigo-300/80'
      },
      typing: {
        label: 'Typing',
        tone: 'Capturing your prompt',
        badge: 'border-emerald-400/50 bg-emerald-400/10 text-emerald-200',
        pulse: 'bg-emerald-300/80'
      }
    }),
    []
  );

  const currentAuraStatus = auraStatusMeta[auraState];

  const modeConfigs = useMemo<Record<
    'strategic' | 'creative' | 'analytical',
    { label: string; blurb: string; accessory: AuraAccessory; commands: string[] }
  >>(
    () => ({
      strategic: {
        label: 'Strategic',
        blurb: 'Shape direction, align stakeholders, and translate vision into decisive action.',
        accessory: 'clipboard',
        commands: [
          'Summarize my inbox in 3 bullets with next actions',
          'Draft a confident investor update referencing ARR momentum',
          'Outline a product launch timeline with milestone owners',
          'Build a decision matrix for our Q4 market expansion bets'
        ]
      },
      creative: {
        label: 'Creative',
        blurb: 'Generate inspired narratives, naming, and experiential concepts on demand.',
        accessory: 'basketball',
        commands: [
          'Craft a launch teaser script for Aura in under 45 seconds',
          'Invent three visionary taglines for an AI command studio',
          'Design an interactive onboarding flow for new users',
          'Brainstorm a multisensory demo experience for investors'
        ]
      },
      analytical: {
        label: 'Analytical',
        blurb: 'Interrogate data, surface outliers, and compress research into insights.',
        accessory: 'datapad',
        commands: [
          'Compare this week’s support volume against the 6-week average',
          'Summarize today’s top AI research headlines with key implications',
          'Diagnose churn risks hidden inside our enterprise pipeline',
          'Generate a SWOT analysis for Aura’s market positioning'
        ]
      }
    }),
    []
  );

  const modeProfile = modeConfigs[mode];

  const quickCommands = useMemo(() => modeProfile.commands, [modeProfile]);

  const macroSequences = useMemo(
    () => [
      {
        name: 'Daily Standup Pulse',
        description: 'Status summary with blockers + urgent escalations in 120 words.',
        prompt: '#mode:brief Generate a standup summary with blockers, escalations, and morale pulse.'
      },
      {
        name: 'Investor Sparkline',
        description: 'One-slide story arc with metrics, narrative, and call-to-action.',
        prompt: '#mode:create Draft an investor sparkline: key metrics, growth drivers, CTA.'
      },
      {
        name: 'Ops Recon',
        description: 'Critical alerts, workflow health, and data anomalies to monitor.',
        prompt: '#mode:brief Produce operations recon: alerts, workflow health, anomalies to investigate.'
      }
    ],
    []
  );

  const sessionMetrics = useMemo(
    () => [
      {
        label: 'Session Flow',
        value: hasInteracted ? `${history.filter((msg) => msg.role === 'user').length} commands` : 'Calibrating',
        status: hasInteracted ? 'Live directives streaming' : 'Awaiting first directive'
      },
      {
        label: 'Response Latency',
        value: isLoading ? 'Synthesizing…' : 'Ready <1.2s',
        status: isLoading ? 'Optimizing inference path' : 'Instant execution lane open'
      },
      {
        label: 'Mode Focus',
        value: modeProfile.label,
        status: modeProfile.blurb
      }
    ],
    [hasInteracted, history, isLoading, modeProfile]
  );

  const highlightSet = useMemo(() => new Set(HIGHLIGHT_TERMS.map((term) => term.toLowerCase())), []);

  const renderMessageContent = useCallback(
    (msg: ChatMessage) => {
      const baseClass = 'text-sm leading-relaxed tracking-[0.01em]';
      if (msg.role === 'model') {
        return msg.text.split('\n').map((line, lineIndex) => (
          <p key={lineIndex} className={`${baseClass} ${lineIndex > 0 ? 'mt-2' : ''}`}>
            {line.split(/(\s+)/).map((token, idx) => {
              if (/^\s+$/.test(token)) return token;
              const normalized = token.replace(/[^\w#-]/g, '').toLowerCase();
              if (highlightSet.has(normalized)) {
                return (
                  <span key={`${lineIndex}-${idx}`} className="text-sky-200 font-semibold">
                    {token}
                  </span>
                );
              }
              if (token.includes(':') && token.length > 2) {
                return (
                  <span key={`${lineIndex}-${idx}`} className="text-indigo-200 font-semibold">
                    {token}
                  </span>
                );
              }
              return <span key={`${lineIndex}-${idx}`}>{token}</span>;
            })}
          </p>
        ));
      }

      return <p className={`whitespace-pre-line ${baseClass}`}>{msg.text}</p>;
    },
    [highlightSet]
  );

  const greetingHeading = useMemo(() => {
    const hour = currentTime.getHours();
    if (hour < 12) return 'Command Dawn';
    if (hour < 18) return 'Strategic Midday';
    return 'Nocturne Ops';
  }, [currentTime]);

  const greetingSubtext = useMemo(() => {
    const hour = currentTime.getHours();
    if (hour < 12) return 'Morning cadence aligned and ready.';
    if (hour < 18) return 'Momentum is live. Deploy with confidence.';
    return 'Night shift engaged. Synthesizing clarity after hours.';
  }, [currentTime]);

  const formattedTime = useMemo(
    () =>
      new Intl.DateTimeFormat('en-US', {
        hour: 'numeric',
        minute: '2-digit'
      }).format(currentTime),
    [currentTime]
  );

  const formattedDate = useMemo(
    () =>
      new Intl.DateTimeFormat('en-US', {
        weekday: 'long',
        month: 'short',
        day: 'numeric'
      }).format(currentTime),
    [currentTime]
  );

  const headerBadges = useMemo(
    () => [
      { label: 'Local Time', value: formattedTime },
      { label: 'Today', value: formattedDate },
      { label: 'Active Mode', value: modeProfile.label }
    ],
    [formattedTime, formattedDate, modeProfile.label]
  );

  const auraMoodGradient = useMemo(() => {
    switch (auraMood) {
      case 'uplift':
        return 'from-emerald-400/35 via-sky-300/25 to-indigo-400/30';
      case 'alert':
        return 'from-amber-500/45 via-rose-500/35 to-red-500/45';
      case 'focus':
        return 'from-cyan-400/40 via-indigo-500/30 to-purple-500/30';
      default:
        return 'from-indigo-500/30 via-violet-500/25 to-sky-500/30';
    }
  }, [auraMood]);

  const auraMoodPulse = useMemo(() => (auraMood === 'alert' ? 'animate-pulse' : 'animate-none'), [auraMood]);

  const lastModelMessage = useMemo(() => {
    for (let i = history.length - 1; i >= 0; i -= 1) {
      if (history[i]?.role === 'model' && history[i]?.text.trim()) {
        return history[i];
      }
    }
    return null;
  }, [history]);

  useEffect(() => {
    if (!exportFeedback) return;
    const timeout = window.setTimeout(() => setExportFeedback(null), 4000);
    return () => window.clearTimeout(timeout);
  }, [exportFeedback]);

  useEffect(() => {
    const AudioCtor = typeof window !== 'undefined' ? window.AudioContext || window.webkitAudioContext : null;
    if (!AudioCtor) return;
    const handler = () => {
      if (!audioCtxRef.current) {
        audioCtxRef.current = new AudioCtor();
      } else if (audioCtxRef.current.state === 'suspended') {
        audioCtxRef.current.resume().catch(() => undefined);
      }
      window.removeEventListener('pointerdown', handler);
    };
    window.addEventListener('pointerdown', handler);
    return () => window.removeEventListener('pointerdown', handler);
  }, []);

  const playAuraSfx = useCallback(
    (state: AuraState) => {
      const ctx = audioCtxRef.current;
      if (!ctx) return;

      if (ctx.state === 'suspended') {
        ctx.resume().catch(() => undefined);
      }

      const frequencies: Record<AuraState, number> = {
        idle: 220,
        listening: 320,
        speaking: 520,
        thinking: 280,
        typing: 420,
      };

      const now = ctx.currentTime;
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = state === 'speaking' ? 'triangle' : 'sine';
      osc.frequency.setValueAtTime(frequencies[state], now);

      gain.gain.setValueAtTime(0, now);
      gain.gain.linearRampToValueAtTime(0.12, now + 0.02);
      gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.35);

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start(now);
      osc.stop(now + 0.36);
    },
    []
  );

  // Function to handle Text-to-Speech (AI's voice)
  const speakResponse = useCallback((text: string) => {
    if ('speechSynthesis' in window) {
      const cleanText = text
        .replace(/\*\*(.*?)\*\*/g, '$1')
        .replace(/`{1,3}(.*?)`{1,3}/g, '$1')
        .replace(/(\r\n|\n|\r)/gm, ' ');

      const utterance = new SpeechSynthesisUtterance(cleanText);
      utterance.rate = 1.1;
      utterance.onstart = () => setIsSpeaking(true);
      utterance.onend = () => setIsSpeaking(false);
      window.speechSynthesis.speak(utterance);
    } else {
      console.warn('TTS not supported by this browser.');
    }
  }, []);

  // Function to send text to the Gemini API
  const handleSubmit = useCallback(
    async (message: string | null = null) => {
      const textToSend = message || userInput.trim();
      if (!textToSend || isLoading) return;

      setIsTyping(false); // Stop typing animation
      const newUserMessage: ChatMessage = { role: 'user', text: textToSend };
      setHistory((prev) => [...prev, newUserMessage]);
      setUserInput('');
      setIsLoading(true);
      setHasInteracted(true);

      try {
        const response = await fetch('/api/chat', { 
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            history: history.slice(-10),
            message: textToSend,
          }),
        });

        if (!response.ok) {
          const errorData = await response.json().catch(() => null);
          const errorMessage = errorData?.error || `API Error: ${response.statusText}`;
          throw new Error(errorMessage);
        }

        if (!response.body) {
          throw new Error('API request failed: No response body');
        }

        const reader = response.body.getReader();
        const decoder = new TextDecoder();
        let fullResponse = '';
        let done = false;

        const initialModelMessage: ChatMessage = { role: 'model', text: '' };
        setHistory((prev) => [...prev, initialModelMessage]);

        while (!done) {
          const { value, done: streamDone } = await reader.read();
          done = streamDone;
          const chunk = decoder.decode(value, { stream: true });
          fullResponse += chunk;
          setHistory((prev) => {
            const newHistory = [...prev];
            newHistory[newHistory.length - 1].text = fullResponse;
            return newHistory;
          });
        }
        setAuraMood(deriveMoodFromResponse(fullResponse));
        speakResponse(fullResponse);
      
      // --- FIX: Corrected the 'catch (error)t' typo ---
      } catch (error) { 
        let errorMessage = "An unknown error occurred";
        if (error instanceof Error) {
            errorMessage = error.message;
        } else if (typeof error === 'string') {
            errorMessage = error;
        }
        console.error('Chat error:', errorMessage);
        setHistory((prev) => [...prev, { role: 'model', text: `Sorry, I've run into an error: ${errorMessage}` }]);
      } finally {
        setIsLoading(false);
      }
    },
    [userInput, isLoading, history, speakResponse]
  );

  // Function to handle Speech-to-Text (Voice command)
  const startListening = useCallback(() => {
    if (isListening || isLoading || isSpeaking) return;

    if (isDictating) {
      dictationRecognitionRef.current?.stop();
      setIsDictating(false);
    }

    if (!('webkitSpeechRecognition' in window)) {
      alert('Browser does not support Web Speech API. Please use a modern browser like Chrome or Edge.');
      return;
    }

    if (window.speechSynthesis.speaking) {
      window.speechSynthesis.cancel();
      setIsSpeaking(false);
    }

    setIsListening(true);

    if (!recognitionRef.current) {
      const recognition = new window.webkitSpeechRecognition();
      recognition.continuous = false;
      recognition.interimResults = false;
      recognition.lang = 'en-US';

      recognition.onresult = (event: SpeechRecognitionEvent) => {
        const transcript = event.results[0][0].transcript;
        handleSubmit(transcript); // Automatically submit
      };

      recognition.onerror = (event: SpeechRecognitionErrorEvent) => {
        if (event.error === 'not-allowed') {
          alert('Microphone permission denied. Please allow microphone access in your browser settings.');
        }
        console.error('Speech recognition error:', event.error);
      };

      recognition.onend = () => {
        setIsListening(false);
      };

      recognitionRef.current = recognition;
    }

    recognitionRef.current.start();
  }, [handleSubmit, isDictating, isListening, isLoading, isSpeaking]);

  const startDictation = useCallback(() => {
    if (isDictating || isListening || isLoading) return;

    if (!('webkitSpeechRecognition' in window)) {
      alert('Browser does not support Web Speech API. Please use a modern browser like Chrome or Edge.');
      return;
    }

    const recognition = new window.webkitSpeechRecognition();
    recognition.continuous = true;
    recognition.interimResults = true;
    recognition.lang = 'en-US';

    const segments: string[] = [];
    recognition.onresult = (event: SpeechRecognitionEvent) => {
      let interim = '';
      for (let i = event.resultIndex; i < event.results.length; i += 1) {
        const result = event.results[i];
        if (result.isFinal) {
          segments.push(result[0].transcript.trim());
        } else {
          interim = result[0].transcript;
        }
      }
      const compiled = [...segments, interim].join(' ').replace(/\s+/g, ' ').trim();
      setDictationTranscript(compiled);
    };

    recognition.onerror = (event: SpeechRecognitionErrorEvent) => {
      console.error('Dictation error:', event.error);
      setIsDictating(false);
    };

    recognition.onend = () => {
      setIsDictating(false);
    };

    dictationRecognitionRef.current = recognition;
    setDictationTranscript('');
    setDictationSummary(null);
    setIsDictating(true);
    recognition.start();
  }, [isDictating, isListening, isLoading]);

  const stopDictation = useCallback(() => {
    if (!isDictating) return;
    dictationRecognitionRef.current?.stop();
    setIsDictating(false);
  }, [isDictating]);

  const generateDictationSummary = useCallback(() => {
    if (!dictationTranscript.trim()) {
      setDictationSummary(null);
      return;
    }

    const sentences = dictationTranscript
      .split(/[\.\n]/)
      .map((sentence) => sentence.trim())
      .filter(Boolean)
      .slice(0, 5);

    const summary = sentences.map((sentence) => `• ${sentence}`).join('\n');
    setDictationSummary(summary || null);
  }, [dictationTranscript]);

  const downloadFile = useCallback((filename: string, content: string, mime = 'text/plain') => {
    const blob = new Blob([content], { type: mime });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  }, []);

  const handleExport = useCallback(
    (format: 'slides' | 'document' | 'email') => {
      if (!lastModelMessage?.text.trim()) {
        setExportFeedback('No Aura response to export yet.');
        return;
      }

      const text = lastModelMessage.text.trim();
      if (format === 'slides') {
        const sections = text.split(/\n\s*\n/).filter(Boolean);
        const markdown = sections
          .map((section, idx) => `## Slide ${idx + 1}\n${section.trim()}`)
          .join('\n\n');
        downloadFile('aura-slides.md', markdown, 'text/markdown');
        setExportFeedback('Slides markdown downloaded.');
        return;
      }

      if (format === 'document') {
        const paragraphs = text
          .split(/\n+/)
          .filter(Boolean)
          .map((paragraph) => `<p>${paragraph.trim()}</p>`)
          .join('\n');
        const html = `<!doctype html>
<html>
<head>
  <meta charset="utf-8" />
  <title>Aura Narrative Export</title>
  <style>
    body { font-family: 'Segoe UI', sans-serif; padding: 40px; background: #0b1024; color: #f5f5ff; line-height: 1.6; }
    h1 { font-size: 28px; margin-bottom: 24px; }
    p { margin-bottom: 16px; }
  </style>
</head>
<body>
  <h1>Aura Narrative Export</h1>
  ${paragraphs}
</body>
</html>`;
        downloadFile('aura-narrative.html', html, 'text/html');
        setExportFeedback('HTML narrative ready—print to PDF if needed.');
        return;
      }

      const emailDraft = `Subject: Aura Narrative Draft\n\n${text}`;
      downloadFile('aura-email.eml', emailDraft, 'text/plain');
      setExportFeedback('Email draft saved as .eml');
    },
    [downloadFile, lastModelMessage]
  );

  // Scroll to bottom whenever history updates
  useEffect(() => {
    if (chatContainerRef.current) {
      chatContainerRef.current.scrollTop = chatContainerRef.current.scrollHeight;
    }
  }, [history]);

  // Fetch the briefing when the component loads
  useEffect(() => {
    const fetchBriefing = async () => {
      try {
        const response = await fetch('/api/briefing');
        if (!response.ok) {
          throw new Error(`Failed to fetch briefing: ${response.statusText}`);
        }
        const data = await response.json();
        setBriefingContent(data.briefing);
      } catch (error) {
        if (error instanceof Error) {
          console.error(error.message);
          setBriefingContent(`Failed to fetch daily briefing: ${error.message}`);
        } else {
          setBriefingContent('Failed to fetch daily briefing: An unknown error occurred.');
        }
      }
    };
    fetchBriefing();
  }, []);

  useEffect(() => {
    const interval = window.setInterval(() => setCurrentTime(new Date()), 60_000);
    return () => window.clearInterval(interval);
  }, []);

  useEffect(() => {
    return () => {
      recognitionRef.current?.stop();
      dictationRecognitionRef.current?.stop();
    };
  }, []);

  useEffect(() => {
    if (!hasInteracted) return;
    if (!audioCtxRef.current) return;
    if (lastSfxStateRef.current === auraState) return;
    lastSfxStateRef.current = auraState;
    playAuraSfx(auraState);
  }, [auraState, hasInteracted, playAuraSfx]);

  // --- Logic to determine the animation state (PRIORITY ORDER) ---
  const getAuraState = (): AuraState => {
    if (isListening) return 'listening';
    if (isSpeaking) return 'speaking';
    if (isLoading) return 'thinking';
    if (isTyping) return 'typing';
    return 'idle';
  };

  const injectPrompt = useCallback((prompt: string) => {
    setUserInput(prompt);
    setIsTyping(true);
    setHasInteracted(true);
  }, []);

  const showAuraTrail = auraState === 'speaking' || auraState === 'thinking';

  return (
    <main className="px-6 py-10 lg:px-12">
      <div className="max-w-7xl mx-auto flex flex-col gap-10">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div className="flex items-center gap-4">
            <div className="relative h-12 w-12 rounded-2xl border border-white/20 bg-linear-to-br from-indigo-500/40 via-violet-500/30 to-sky-500/35 shadow-[0_18px_34px_rgba(27,33,85,0.5)]">
              <span className="absolute inset-[3px] rounded-[14px] bg-slate-950/80 backdrop-blur flex items-center justify-center text-lg font-semibold text-white">
                {userName.charAt(0).toUpperCase()}
              </span>
              <span className="absolute -inset-[4px] rounded-[18px] border border-white/10 opacity-60 blur-sm"></span>
            </div>
            <div>
              <p className="text-xs uppercase tracking-[0.35em] text-slate-400/80">Hello, {userName}</p>
              <p className="text-xl font-semibold text-white">{greetingHeading}</p>
              <p className="text-sm text-slate-300/80">{greetingSubtext}</p>
            </div>
          </div>
          <div className="flex flex-wrap gap-2">
            {headerBadges.map((badge) => (
              <div
                key={badge.label}
                className="pill border-white/15 bg-white/6 text-white/90"
                aria-label={`${badge.label}: ${badge.value}`}
              >
                <span className="text-xs uppercase tracking-[0.25em] text-slate-300/80">{badge.label}</span>
                <span className="ml-2 text-sm font-medium text-white/90">{badge.value}</span>
              </div>
            ))}
          </div>
        </div>
        <header className="flex flex-col gap-6">
          <div className="pill self-start backdrop-blur">
            <span className="h-2 w-2 rounded-full bg-emerald-400/80 shadow-[0_0_12px_rgba(52,211,153,0.75)]"></span>
            Aura Command Studio
          </div>
          <div className="flex flex-col gap-8 lg:flex-row lg:items-end lg:justify-between">
            <div className="space-y-4 max-w-3xl">
              <h1 className="text-4xl sm:text-5xl font-semibold tracking-tight text-white">
                Reimagine how you brief, command, and collaborate with <span className="text-transparent bg-clip-text bg-linear-to-r from-indigo-300 via-sky-400 to-emerald-300">Aura</span>.
              </h1>
              <p className="text-base sm:text-lg text-slate-300 leading-relaxed">
                An orchestrated workspace engineered for multimodal intelligence. Whisper a task, Aura synthesizes it into actionable strategy—voice, text, briefing, and visualization in one command surface.
              </p>
            </div>
            <div className="glass-panel glimmer px-6 py-5 flex items-center gap-4 self-stretch lg:self-auto">
              <div className="relative">
                <span className={`absolute inset-0 rounded-full ${currentAuraStatus.pulse} blur-md opacity-60 animate-ping-slow`}></span>
                <span className={`inline-flex h-10 w-10 items-center justify-center rounded-full border ${currentAuraStatus.badge}`}>
                  <span className="h-2 w-2 rounded-full bg-current animate-pulse"></span>
                </span>
              </div>
              <div>
                <p className="text-sm uppercase tracking-[0.28em] text-slate-400">Aura status</p>
                <p className="text-lg font-medium text-white">{currentAuraStatus.label}</p>
                <p className="text-sm text-slate-300/80">{currentAuraStatus.tone}</p>
              </div>
            </div>
          </div>
          <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
            <div className="inline-flex rounded-full border border-white/10 bg-white/6 p-1 backdrop-blur">
              {Object.entries(modeConfigs).map(([key, profile]) => {
                const active = key === mode;
                return (
                  <Button
                    key={key}
                    type="button"
                    variant="ghost"
                    onClick={() => setMode(key as typeof mode)}
                    className={`h-9 rounded-full px-4 text-xs font-medium tracking-[0.2em] uppercase ${
                      active
                        ? 'bg-linear-to-r from-indigo-400/70 to-sky-400/70 text-white shadow-[0_8px_20px_rgba(66,90,255,0.35)]'
                        : 'text-slate-300'
                    }`}
                  >
                    {profile.label}
                  </Button>
                );
              })}
            </div>
            <p className="text-sm text-slate-300/90 max-w-3xl">{modeProfile.blurb}</p>
          </div>
          <div className="grid gap-4 md:grid-cols-3">
            {sessionMetrics.map((metric) => (
              <div key={metric.label} className="glass-panel glimmer rounded-2xl border border-white/10 bg-white/6 px-5 py-4">
                <p className="text-xs uppercase tracking-[0.28em] text-slate-400/80">{metric.label}</p>
                <p className="mt-2 text-2xl font-semibold text-white">{metric.value}</p>
                <p className="mt-1 text-sm text-slate-300/80">{metric.status}</p>
              </div>
            ))}
          </div>
          <div className="flex flex-wrap gap-3">
            {quickCommands.map((command) => (
              <Button
                key={command}
                type="button"
                variant="ghost"
                onClick={() => {
                  injectPrompt(command);
                }}
                className="group/pill border border-white/10 bg-white/5 text-slate-200 hover:bg-white/10 hover:text-white transition-all duration-150 rounded-full px-5 py-2 h-auto"
              >
                <span className="mr-2 inline-flex h-2 w-2 rounded-full bg-white/50 group-hover/pill:bg-white"></span>
                {command}
              </Button>
            ))}
          </div>
        </header>

        <div className="grid gap-8 xl:grid-cols-[minmax(0,1.6fr)_minmax(0,1fr)]">
          <section className="glass-panel glimmer flex flex-col overflow-hidden">
            <div className="flex items-center justify-between border-b border-white/10 pb-5">
              <div>
                <p className="text-xs uppercase tracking-[0.4em] text-slate-400/80">Live Dialogue</p>
                <h2 className="text-2xl font-semibold text-white mt-1">Conversation Stream</h2>
              </div>
              <div className="flex flex-col items-end gap-2 text-sm text-slate-300">
                <div className="flex flex-wrap items-center justify-end gap-2">
                  <span className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-3 py-1">
                    <span className={`h-2 w-2 rounded-full ${hasInteracted ? 'bg-emerald-300' : 'bg-slate-400/70'} animate-pulse`}></span>
                    {hasInteracted ? 'Syncing session' : 'Awaiting first prompt'}
                  </span>
                  {lastModelMessage && (
                    <div className="flex flex-wrap items-center gap-2">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleExport('slides')}
                        className="rounded-full border-white/20 bg-white/5 px-3 py-1 text-xs uppercase tracking-[0.18em]"
                      >
                        Export Slides
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleExport('document')}
                        className="rounded-full border-white/20 bg-white/5 px-3 py-1 text-xs uppercase tracking-[0.18em]"
                      >
                        Export Narrative
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleExport('email')}
                        className="rounded-full border-white/20 bg-white/5 px-3 py-1 text-xs uppercase tracking-[0.18em]"
                      >
                        Export Email
                      </Button>
                    </div>
                  )}
                </div>
                {exportFeedback && (
                  <p className="text-xs text-slate-300/80">{exportFeedback}</p>
                )}
              </div>
            </div>
          <div
            ref={chatContainerRef}
            className="flex-1 overflow-y-auto space-y-5 px-6 py-6 pr-4 custom-scrollbar"
            role="log"
            aria-live="polite"
            aria-relevant="additions text"
          >
              {history.length === 0 && !isLoading && (
                <div className="rounded-3xl border border-dashed border-white/10 bg-white/3 px-6 py-12 text-center text-slate-300">
                  <p className="text-lg font-medium text-white mb-2">Your command surface awaits</p>
                  <p className="text-sm leading-relaxed text-slate-300/80">
                    Try “Outline a product launch timeline” or press the listening control to brief Aura with your voice.
                  </p>
                </div>
              )}
              {history.map((msg, index) => {
                const isUser = msg.role === 'user';
                return (
                  <div key={`${msg.role}-${index}`} className={`flex ${isUser ? 'justify-end' : 'justify-start'}`}>
                    <div
                      className={`max-w-[78%] rounded-3xl px-5 py-4 shadow-[0_18px_36px_rgba(6,12,30,0.35)] transition-transform ${
                        isUser
                          ? 'bg-linear-to-br from-indigo-500/80 via-violet-500/75 to-purple-500/80 text-white border border-white/10 translate-y-0 focus-within:-translate-y-px'
                          : 'bg-white/5 border border-white/8 backdrop-blur-xl text-slate-100'
                      }`}
                    >
                      <strong className={`block text-xs uppercase tracking-[0.35em] mb-3 ${isUser ? 'text-white/70' : 'text-indigo-200/80'}`}>
                        {isUser ? 'You' : 'Aura'}
                      </strong>
                      <div className="space-y-2">{renderMessageContent(msg)}</div>
                    </div>
                  </div>
                );
              })}
              {isLoading && (
                <div className="flex justify-start">
                  <div className="max-w-[70%] rounded-3xl border border-white/10 bg-white/5 px-5 py-4 text-slate-100">
                    <strong className="block text-xs uppercase tracking-[0.35em] mb-3 text-indigo-200/80">Aura</strong>
                    <div className="flex items-center gap-2">
                      <span className="h-2.5 w-2.5 rounded-full bg-indigo-300 animate-bounce"></span>
                      <span className="h-2.5 w-2.5 rounded-full bg-indigo-200 animate-bounce delay-150"></span>
                      <span className="h-2.5 w-2.5 rounded-full bg-indigo-100 animate-bounce delay-300"></span>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </section>

          <aside className="flex flex-col gap-8">
            <section className="glass-panel glimmer flex flex-col overflow-hidden">
              <div className="border-b border-white/10 px-6 py-5">
                <p className="text-xs uppercase tracking-[0.4em] text-slate-400/80">Mission intel</p>
                <h3 className="text-xl font-semibold text-white mt-2">Daily Briefing</h3>
              </div>
              <div className="custom-scrollbar flex-1 overflow-y-auto space-y-4 px-6 py-6 text-sm leading-relaxed text-slate-200/90">
                {briefingContent}
              </div>
            </section>

            <section className="glass-panel glimmer flex flex-col gap-6 px-6 py-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs uppercase tracking-[0.4em] text-slate-400/80">Command Console</p>
                  <h3 className="text-xl font-semibold text-white mt-1">Deploy a new task</h3>
                </div>
                <Button
                  type="button"
                  onClick={startListening}
                  disabled={isListening || isLoading}
                  aria-label={isListening ? 'Aura is currently listening' : 'Activate voice briefing'}
                  className="group relative overflow-hidden rounded-full border border-white/20 bg-linear-to-r from-indigo-500/80 to-violet-500/80 px-4 py-2 text-sm font-medium text-white shadow-[0_8px_24px_rgba(66,77,255,0.4)] hover:scale-[1.01] transition"
                >
                  <span className="absolute inset-0 bg-white/20 opacity-0 transition-opacity duration-200 group-hover:opacity-40"></span>
                  {isListening ? 'Listening…' : 'Voice Brief'}
                </Button>
              </div>

              <div className="flex items-start gap-4">
                <div
                  className={`cursor-pointer rounded-2xl border border-white/10 bg-linear-to-br ${auraMoodGradient} p-[2px] shadow-[0_14px_34px_rgba(8,14,33,0.45)] transition hover:border-white/20 ${auraMoodPulse}`}
                  onClick={startListening}
                  title={isListening ? 'Listening…' : 'Tap to brief Aura with your voice'}
                >
                  <div className="rounded-2xl border border-white/10 bg-slate-950/70 p-3">
                    <AuraDoodle
                      state={getAuraState()}
                      accessory={modeProfile.accessory}
                      showTrail={showAuraTrail}
                    />
                  </div>
                </div>

                <div className="flex-1 space-y-3">
                  <Input
                    type="text"
                    value={userInput}
                    onChange={(e) => {
                      setUserInput(e.target.value);
                      setIsTyping(e.target.value.length > 0);
                    }}
                    onFocus={() => setIsTyping(userInput.length > 0)}
                    onBlur={() => setIsTyping(false)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') handleSubmit();
                    }}
                    placeholder={isListening ? 'Listening…' : 'Compose your directive'}
                    className="h-14 rounded-2xl border border-white/10 bg-white/8 px-5 text-base text-slate-100 placeholder:text-slate-400/70 focus-visible:ring-indigo-400"
                    disabled={isLoading || isListening}
                  />
                  <div className="flex items-center gap-3">
                    <Button
                    onClick={() => handleSubmit()}
                    disabled={isLoading || isListening || !userInput.trim()}
                    aria-live="polite"
                    aria-busy={isLoading}
                      className="flex-1 h-11 rounded-xl bg-linear-to-r from-indigo-400 via-violet-500 to-purple-500 text-sm font-semibold text-white shadow-[0_12px_32px_rgba(91,95,255,0.45)] transition hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-50"
                    >
                      {isLoading ? 'Synthesizing…' : 'Transmit Command'}
                    </Button>
                    <Button
                      type="button"
                      variant="ghost"
                      onClick={() => {
                        setUserInput('');
                        setIsTyping(false);
                      }}
                      disabled={!userInput && !isTyping}
                      className="h-11 rounded-xl border border-white/10 bg-white/5 px-4 text-sm text-slate-200 hover:bg-white/10 disabled:opacity-30"
                    >
                      Clear
                    </Button>
                  </div>
                </div>
              </div>

              <div className="rounded-2xl border border-white/5 bg-white/4 px-5 py-4 text-xs leading-relaxed text-slate-300/90">
                Pro tip: prepend your prompt with <code className="rounded bg-white/10 px-1 py-[2px] text-[0.85rem] text-white">#mode:brief</code> or <code className="rounded bg-white/10 px-1 py-[2px] text-[0.85rem] text-white">#mode:create</code> to instantly toggle Aura’s strategy versus generation engines.
              </div>
            </section>

            <section className="glass-panel glimmer flex flex-col gap-5 px-6 py-6">
              <div className="flex flex-col gap-2">
                <p className="text-xs uppercase tracking-[0.4em] text-slate-400/80">Whisper-to-Write</p>
                <h3 className="text-xl font-semibold text-white">Long-form dictation studio</h3>
                <p className="text-sm text-slate-300/80">
                  Capture extended thoughts, then auto-structure the output into bullet-ready summaries.
                </p>
              </div>
              <div className="flex flex-wrap items-center gap-3">
                <Button
                  size="sm"
                  onClick={startDictation}
                  disabled={isDictating || isListening || isLoading}
                  className="rounded-full bg-linear-to-r from-indigo-400/80 to-violet-500/80 px-4 py-2 text-xs font-semibold uppercase tracking-[0.2em] text-white shadow-[0_8px_24px_rgba(66,77,255,0.35)] hover:brightness-110 disabled:opacity-50"
                >
                  {isDictating ? 'Capturing…' : 'Start Dictation'}
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={stopDictation}
                  disabled={!isDictating}
                  className="rounded-full border-white/20 bg-white/5 px-4 py-2 text-xs uppercase tracking-[0.18em]"
                >
                  Stop
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={generateDictationSummary}
                  disabled={!dictationTranscript.trim()}
                  className="rounded-full border-white/20 bg-white/5 px-4 py-2 text-xs uppercase tracking-[0.18em]"
                >
                  Auto-Summarize
                </Button>
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => injectPrompt(dictationSummary ?? dictationTranscript)}
                  disabled={!dictationTranscript.trim()}
                  className="rounded-full px-4 py-2 text-xs uppercase tracking-[0.18em] text-slate-200 hover:text-white"
                >
                  Use as Prompt
                </Button>
              </div>
              <div className="space-y-3">
                <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
                  <p className="text-xs uppercase tracking-[0.3em] text-slate-300/80 mb-2">Live transcript</p>
                  <div className="max-h-32 overflow-y-auto whitespace-pre-wrap text-sm text-slate-200">
                    {dictationTranscript || 'Tap “Start Dictation” to begin recording.'}
                  </div>
                </div>
                {dictationSummary && (
                  <div className="rounded-2xl border border-emerald-300/30 bg-emerald-400/10 p-4">
                    <p className="text-xs uppercase tracking-[0.3em] text-emerald-200/90 mb-2">Auto summary</p>
                    <pre className="text-sm text-emerald-50 whitespace-pre-wrap">{dictationSummary}</pre>
                  </div>
                )}
              </div>
            </section>

            <section className="glass-panel glimmer flex flex-col gap-5 px-6 py-6">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <p className="text-xs uppercase tracking-[0.4em] text-slate-400/80">Mission Routines</p>
                  <h3 className="text-xl font-semibold text-white mt-1">Launch a macro sequence</h3>
                </div>
              </div>
              <div className="flex flex-col gap-4">
                {macroSequences.map((macro) => (
                  <div key={macro.name} className="rounded-2xl border border-white/10 bg-white/10 p-4 shadow-[0_18px_34px_rgba(12,17,44,0.4)]">
                    <div className="flex items-start justify-between gap-4">
                      <div>
                        <p className="text-sm font-semibold text-white">{macro.name}</p>
                        <p className="mt-1 text-xs text-slate-300/80">{macro.description}</p>
                      </div>
                      <Button
                        type="button"
                        size="sm"
                        variant="outline"
                        onClick={() => injectPrompt(macro.prompt)}
                        className="rounded-full border-white/20 bg-white/5 px-3 py-1 text-xs uppercase tracking-[0.22em]"
                      >
                        Queue
                      </Button>
                    </div>
                    <p className="mt-3 rounded-xl border border-white/8 bg-white/5 px-3 py-2 text-[0.72rem] text-slate-200/90 font-mono">
                      {macro.prompt}
                    </p>
                  </div>
                ))}
              </div>
            </section>
          </aside>
        </div>
      </div>
    </main>
  );
}