'use client';

import React, { useState, useRef, useEffect } from 'react';
import { Send, Mic, MicOff, Volume2, VolumeX, Bot, User, Terminal, Sparkles, Play, Check } from 'lucide-react';
import { BrowserVoiceEngine } from '@/lib/voice/speech';

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: string;
}

export function ChatInterface() {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: 'welcome-1',
      role: 'assistant',
      content: "Hello! I am Jarvis, your cloud-first personal AI companion. Everything is running remotely to keep your laptop light with maximum free RAM. We can chat freely through text or natural voice, and whenever your laptop is online, I can also perform authorized actions for you.",
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    }
  ]);
  const [input, setInput] = useState('');
  const [isStreaming, setIsStreaming] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [autoSpeak, setAutoSpeak] = useState(true);
  const [speakingId, setSpeakingId] = useState<string | null>(null);
  const [activeVoiceName, setActiveVoiceName] = useState<string>('Natural Voice');
  const [hasWelcomed, setHasWelcomed] = useState(false);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const voiceEngineRef = useRef<BrowserVoiceEngine | null>(null);

  useEffect(() => {
    const engine = new BrowserVoiceEngine();
    voiceEngineRef.current = engine;

    // Check detected natural voice after voices load
    setTimeout(() => {
      const best = engine.pickBestNaturalVoice();
      if (best) {
        setActiveVoiceName(best.name.replace(' - English (United States)', ''));
      }
    }, 500);
  }, []);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isStreaming]);

  const speakWelcome = () => {
    if (!voiceEngineRef.current) return;
    setHasWelcomed(true);
    setSpeakingId('welcome-1');
    voiceEngineRef.current.speak(
      messages[0].content,
      () => setSpeakingId(null)
    );
  };

  const handleSend = async (textToSend?: string) => {
    const text = textToSend || input;
    if (!text.trim() || isStreaming) return;

    // Interrupt any active voice playback
    voiceEngineRef.current?.stopSpeaking();
    setSpeakingId(null);

    const userMessage: Message = {
      id: `user-${Date.now()}`,
      role: 'user',
      content: text,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };

    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setIsStreaming(true);

    try {
      const chatHistory = [...messages, userMessage].map(m => ({
        role: m.role,
        content: m.content
      }));

      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ messages: chatHistory })
      });

      const data = await res.json().catch(() => ({}));
      const replyContent = data.content || "Hello! I am Jarvis, your AI companion. How can I help you today?";

      const assistantMessage: Message = {
        id: `assist-${Date.now()}`,
        role: 'assistant',
        content: replyContent,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      };

      setMessages(prev => [...prev, assistantMessage]);

      // Automatically speak aloud if autoSpeak is enabled (default: ON)
      if (autoSpeak && voiceEngineRef.current) {
        setSpeakingId(assistantMessage.id);
        voiceEngineRef.current.speak(replyContent, () => {
          setSpeakingId(null);
        });
      }
    } catch (err: any) {
      const fallbackMsg: Message = {
        id: `assist-fallback-${Date.now()}`,
        role: 'assistant',
        content: "Hello! I am Jarvis, your personal AI companion. I am right here with you. How can I assist you right now?",
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      };
      setMessages(prev => [...prev, fallbackMsg]);
      if (autoSpeak && voiceEngineRef.current) {
        voiceEngineRef.current.speak(fallbackMsg.content, () => setSpeakingId(null));
      }
    } finally {
      setIsStreaming(false);
    }
  };

  const toggleMic = () => {
    if (!voiceEngineRef.current?.isSpeechRecognitionSupported()) {
      alert('Speech recognition is supported in Microsoft Edge and Google Chrome. Please grant microphone permission.');
      return;
    }

    if (isListening) {
      voiceEngineRef.current.stopListening();
      setIsListening(false);
    } else {
      voiceEngineRef.current.startListening({
        onStart: () => setIsListening(true),
        onResult: (transcript, isFinal) => {
          setInput(transcript);
          if (isFinal) {
            setIsListening(false);
            handleSend(transcript);
          }
        },
        onError: (err) => {
          console.error('Speech error:', err);
          setIsListening(false);
        },
        onEnd: () => setIsListening(false)
      });
    }
  };

  const toggleSpeech = (id: string, text: string) => {
    if (!voiceEngineRef.current) return;
    if (speakingId === id) {
      voiceEngineRef.current.stopSpeaking();
      setSpeakingId(null);
    } else {
      setSpeakingId(id);
      voiceEngineRef.current.speak(text, () => setSpeakingId(null));
    }
  };

  return (
    <div className="flex flex-col h-[calc(100vh-5rem)] max-w-4xl mx-auto px-4 py-3">
      {/* Voice Controls Bar */}
      <div className="flex items-center justify-between pb-2 mb-2 border-b border-slate-200 dark:border-slate-800 text-xs">
        <div className="flex items-center space-x-2 text-slate-500">
          <Sparkles className="w-3.5 h-3.5 text-blue-500" />
          <span>Natural Voice: <strong className="text-slate-800 dark:text-slate-200">{activeVoiceName}</strong></span>
        </div>

        <button
          onClick={() => {
            const next = !autoSpeak;
            setAutoSpeak(next);
            if (!next) {
              voiceEngineRef.current?.stopSpeaking();
              setSpeakingId(null);
            }
          }}
          className={`flex items-center space-x-1.5 px-3 py-1 rounded-full font-medium transition-all ${
            autoSpeak
              ? 'bg-blue-100 dark:bg-blue-950/80 text-blue-700 dark:text-blue-300 border border-blue-300 dark:border-blue-800'
              : 'bg-slate-100 dark:bg-slate-800 text-slate-500 hover:text-slate-700'
          }`}
          title="Toggle automatic natural voice speech"
        >
          {autoSpeak ? <Volume2 className="w-3.5 h-3.5 text-blue-500" /> : <VolumeX className="w-3.5 h-3.5" />}
          <span>Auto-Speak: {autoSpeak ? 'ON' : 'OFF'}</span>
        </button>
      </div>

      {/* Messages list */}
      <div className="flex-1 overflow-y-auto space-y-4 pr-1">
        {messages.map((m) => {
          const isUser = m.role === 'user';
          const isFirstWelcome = m.id === 'welcome-1';

          return (
            <div
              key={m.id}
              className={`flex items-start space-x-3 ${isUser ? 'flex-row-reverse space-x-reverse' : ''}`}
            >
              <div
                className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ${
                  isUser
                    ? 'bg-blue-600 text-white'
                    : 'bg-slate-200 dark:bg-slate-800 text-blue-600 dark:text-blue-400'
                }`}
              >
                {isUser ? <User className="w-4 h-4" /> : <Bot className="w-4 h-4" />}
              </div>

              <div
                className={`group relative max-w-[85%] sm:max-w-[75%] rounded-2xl px-4 py-3 text-sm leading-relaxed ${
                  isUser
                    ? 'bg-blue-600 text-white rounded-br-none shadow-sm'
                    : 'bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-800 dark:text-slate-200 rounded-bl-none shadow-sm'
                }`}
              >
                <div className="whitespace-pre-wrap">{m.content}</div>

                {/* Welcome Hear Me Button */}
                {isFirstWelcome && !hasWelcomed && (
                  <button
                    onClick={speakWelcome}
                    className="mt-3 flex items-center space-x-2 px-3 py-1.5 rounded-xl bg-blue-50 dark:bg-blue-950/80 hover:bg-blue-100 dark:hover:bg-blue-900 border border-blue-200 dark:border-blue-800 text-blue-700 dark:text-blue-300 font-semibold text-xs transition-all active:scale-95 shadow-sm"
                  >
                    <Play className="w-3.5 h-3.5 fill-current" />
                    <span>Click to hear Jarvis speak welcome</span>
                  </button>
                )}

                <div className="flex items-center justify-between mt-2 pt-1 border-t border-black/5 dark:border-white/5 text-[10px] text-slate-400 dark:text-slate-500">
                  <span>{m.timestamp}</span>

                  {!isUser && (
                    <button
                      onClick={() => toggleSpeech(m.id, m.content)}
                      className="ml-3 text-slate-400 hover:text-blue-500 transition-colors flex items-center space-x-1"
                      title={speakingId === m.id ? 'Stop speaking' : 'Speak aloud'}
                    >
                      {speakingId === m.id ? (
                        <>
                          <VolumeX className="w-3.5 h-3.5 text-blue-500 animate-pulse" />
                          <span className="text-blue-500 font-medium">Speaking...</span>
                        </>
                      ) : (
                        <>
                          <Volume2 className="w-3.5 h-3.5" />
                          <span>Speak</span>
                        </>
                      )}
                    </button>
                  )}
                </div>
              </div>
            </div>
          );
        })}

        {isStreaming && (
          <div className="flex items-center space-x-3 text-slate-400 text-xs py-2">
            <Bot className="w-4 h-4 animate-bounce text-blue-500" />
            <span>Jarvis is thinking...</span>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Suggested Quick Actions */}
      <div className="flex items-center space-x-2 py-2 overflow-x-auto text-xs no-scrollbar">
        <button
          onClick={() => handleSend("Tell me about yourself in a natural voice.")}
          className="flex items-center space-x-1.5 px-3 py-1.5 rounded-full bg-slate-100 dark:bg-slate-800/80 hover:bg-blue-50 dark:hover:bg-blue-950/40 border border-slate-200 dark:border-slate-700/60 text-slate-700 dark:text-slate-300 transition-colors whitespace-nowrap"
        >
          <Sparkles className="w-3.5 h-3.5 text-blue-500" />
          <span>Who are you?</span>
        </button>

        <button
          onClick={() => handleSend("What can you do on my laptop when it's online?")}
          className="flex items-center space-x-1.5 px-3 py-1.5 rounded-full bg-slate-100 dark:bg-slate-800/80 hover:bg-blue-50 dark:hover:bg-blue-950/40 border border-slate-200 dark:border-slate-700/60 text-slate-700 dark:text-slate-300 transition-colors whitespace-nowrap"
        >
          <Terminal className="w-3.5 h-3.5 text-indigo-500" />
          <span>Laptop Capabilities</span>
        </button>

        <button
          onClick={() => handleSend("What do you remember about my preferences?")}
          className="flex items-center space-x-1.5 px-3 py-1.5 rounded-full bg-slate-100 dark:bg-slate-800/80 hover:bg-blue-50 dark:hover:bg-blue-950/40 border border-slate-200 dark:border-slate-700/60 text-slate-700 dark:text-slate-300 transition-colors whitespace-nowrap"
        >
          <span>Remembered Preferences</span>
        </button>
      </div>

      {/* Input box & voice trigger */}
      <div className="pt-2">
        <form
          onSubmit={(e) => {
            e.preventDefault();
            handleSend();
          }}
          className="flex items-center space-x-2 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-2xl p-1.5 shadow-sm focus-within:ring-2 focus-within:ring-blue-500"
        >
          <button
            type="button"
            onClick={toggleMic}
            className={`p-2.5 rounded-xl transition-all ${
              isListening
                ? 'bg-rose-500 text-white animate-pulse'
                : 'text-slate-500 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800'
            }`}
            title={isListening ? 'Stop listening' : 'Push to talk (Speech-to-Text)'}
          >
            {isListening ? <MicOff className="w-5 h-5" /> : <Mic className="w-5 h-5" />}
          </button>

          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder={isListening ? 'Listening to your voice...' : 'Type a message or tap the mic...'}
            disabled={isStreaming}
            className="flex-1 bg-transparent px-2 py-1.5 text-sm outline-none text-slate-900 dark:text-white placeholder-slate-400"
          />

          <button
            type="submit"
            disabled={!input.trim() || isStreaming}
            className="p-2.5 rounded-xl bg-blue-600 text-white disabled:opacity-40 disabled:cursor-not-allowed hover:bg-blue-700 transition-all shadow-sm"
          >
            <Send className="w-4 h-4" />
          </button>
        </form>
      </div>
    </div>
  );
}
