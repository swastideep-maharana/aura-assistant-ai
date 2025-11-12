'use client';

import { useState, useCallback, useEffect, useRef } from 'react';
// --- NEW IMPORTS ---
import { Button } from './components/ui/button';
import { Input } from './components/ui/input';
import { BentoGrid, BentoGridItem } from './components/ui/bento-grid';

import AuraDoodle, { type AuraState } from './components/AuraDoodle';

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
  }
}

// --- The Core Assistant Component ---
export default function AssistantPage() {
  const [history, setHistory] = useState<ChatMessage[]>([]);
  const [userInput, setUserInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [isTyping, setIsTyping] = useState(false); // For the doodle
  const [briefingContent, setBriefingContent] = useState<string>('Status: Nominal. Fetching daily web digest...');

  const chatContainerRef = useRef<HTMLDivElement>(null);
  const recognitionRef = useRef<SpeechRecognition | null>(null);

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
  }, [handleSubmit, isListening, isLoading, isSpeaking]);

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

  // --- Logic to determine the animation state (PRIORITY ORDER) ---
  const getAuraState = (): AuraState => {
    if (isListening) return 'listening';
    if (isSpeaking) return 'speaking';
    if (isLoading) return 'thinking';
    if (isTyping) return 'typing';
    return 'idle';
  };

  // --- NEW THEME STYLES ---
  const accentColor = 'text-indigo-600';

  return (
    <main className="p-6 lg:p-8">
      <BentoGrid className="max-w-7xl mx-auto md:grid-rows-3">
        {/* CHAT HISTORY */}
        <BentoGridItem
          title="// AURA CONVERSATION"
          className="md:col-span-2 md:row-span-3 h-[70vh] flex flex-col bg-white shadow-xl rounded-2xl border border-gray-200/80"
        >
          {/* Chat History Container */}
          <div ref={chatContainerRef} className="flex-1 overflow-y-auto p-4 space-y-4 rounded-lg bg-gray-100/50">
            {history.map((msg, index) => (
              <div key={index} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                <div
                  className={`max-w-3/4 p-4 rounded-xl shadow-md ${
                    msg.role === 'user' ? 'bg-indigo-600 text-white' : 'bg-gray-200 text-gray-800'
                  }`}
                >
                  <strong className={`block mb-1.5 ${msg.role === 'user' ? 'text-indigo-200' : accentColor}`}>{msg.role === 'user' ? 'USER' : 'AURA'}</strong>
                  <p className="whitespace-pre-line text-sm">{msg.text}</p>
                </div>
              </div>
            ))}
            {isLoading && (
              <div className="flex justify-start">
                <div className={`p-4 rounded-xl bg-gray-200`}>
                  <strong className={accentColor}>AURA</strong>
                  <div className="mt-2 flex space-x-1.5">
                    <div className="w-2.5 h-2.5 bg-indigo-500 rounded-full animate-bounce delay-75"></div>
                    <div className="w-2.5 h-2.5 bg-indigo-500 rounded-full animate-bounce delay-150"></div>
                    <div className="w-2.5 h-2.5 bg-indigo-500 rounded-full animate-bounce delay-200"></div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </BentoGridItem>

        {/* BRIEFING */}
        <BentoGridItem
          title="// DAILY BRIEFING"
          className="md:col-span-1 md:row-span-2 flex flex-col bg-white shadow-xl rounded-2xl border border-gray-200/80"
        >
          <div className="space-y-4 text-sm text-gray-700 whitespace-pre-line overflow-y-auto flex-1">{briefingContent}</div>
        </BentoGridItem>

        {/* CONTROL PANEL (BOT + INPUT) */}
        <BentoGridItem
          title="// CONTROL PANEL"
          className="md:col-span-1 md:row-span-1 flex flex-col justify-end bg-white shadow-xl rounded-2xl border border-gray-200/80"
        >
          <div className="flex items-end gap-4">
            {/* Bot Doodle (Large) */}
            <div
              className="cursor-pointer shrink-0"
              onClick={startListening}
              title={isListening ? 'Listening...' : 'Click to Speak'}
            >
              <AuraDoodle state={getAuraState()} />
            </div>

            {/* Input & Send Button */}
            <div className="flex-1 flex flex-col items-end gap-2">
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
                placeholder={isListening ? 'Listening...' : 'Enter command...'}
                className={`w-full p-4 rounded-lg bg-gray-100 text-gray-900 focus:outline-none focus:ring-2 focus:ring-indigo-500 border border-gray-300 text-sm`}
                disabled={isLoading || isListening}
              />
              <Button
                onClick={() => handleSubmit()}
                disabled={isLoading || isListening || !userInput.trim()}
                className={`w-full h-12 text-base font-bold transition-all duration-200 ${
                  isLoading || isListening || !userInput.trim() ? 'bg-gray-300 text-gray-500 cursor-not-allowed' : 'bg-indigo-600 hover:bg-indigo-700 text-white shadow-lg shadow-indigo-500/30'
                }`}
                variant="default" // Using the shadcn variant
              >
                Send
              </Button>
            </div>
          </div>
        </BentoGridItem>
      </BentoGrid>
    </main>
  );
}