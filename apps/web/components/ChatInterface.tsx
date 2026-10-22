'use client';

import React, { useState, useRef, useEffect } from 'react';
import { Send, Mic, MicOff, Volume2, VolumeX, Bot, User, Clock, Terminal, CheckCircle2, AlertCircle } from 'lucide-react';
import { BrowserVoiceEngine } from '@/lib/voice/speech';

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: string;
  commandAction?: {
    type: string;
    label: string;
    status: 'pending' | 'queued' | 'executing' | 'completed' | 'failed';
  };
}

export function ChatInterface() {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: 'welcome-1',
      role: 'assistant',
      content: "Hello! I am Jarvis, your cloud-first AI companion. I run entirely on remote free-tier cloud services, so your laptop stays light with maximum free RAM. We can chat here anytime, and whenever your laptop is online, I can also perform authorized tasks for you.",
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    }
  ]);
  const [input, setInput] = useState('');
  const [isStreaming, setIsStreaming] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [speakingId, setSpeakingId] = useState<string | null>(null);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const voiceEngineRef = useRef<BrowserVoiceEngine | null>(null);

  useEffect(() => {
    voiceEngineRef.current = new BrowserVoiceEngine();
  }, []);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isStreaming]);

  const handleSend = async (textToSend?: string) => {
    const text = textToSend || input;
    if (!text.trim() || isStreaming) return;

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

      if (!res.ok) {
        throw new Error(`Chat API error: ${res.statusText}`);
      }

      const data = await res.json();
      const assistantMessage: Message = {
        id: `assist-${Date.now()}`,
        role: 'assistant',
        content: data.content,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      };

      setMessages(prev => [...prev, assistantMessage]);

      // Automatically speak response if user was speaking
      if (isListening && voiceEngineRef.current) {
        voiceEngineRef.current.speak(data.content, () => setSpeakingId(null));
        setSpeakingId(assistantMessage.id);
      }
    } catch (err: any) {
      setMessages(prev => [
        ...prev,
        {
          id: `err-${Date.now()}`,
          role: 'assistant',
          content: `I encountered an issue connecting to the inference engine: ${err.message}. Please check your connection or provider settings.`,
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
        }
      ]);
    } finally {
      setIsStreaming(false);
    }
  };

  const toggleMic = () => {
    if (!voiceEngineRef.current?.isSpeechRecognitionSupported()) {
      alert('Speech recognition is not supported in this browser. Please use Google Chrome or Microsoft Edge.');
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
      voiceEngineRef.current.speak(text, () => setSpeakingId(null));
      setSpeakingId(id);
    }
  };

  const dispatchLaptopAction = async (commandType: string, label: string) => {
    try {
      const res = await fetch('/api/devices/commands', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          command_type: commandType,
          user_confirmed: true
        })
      });
      const data = await res.json();
      const statusText = data.command_status === 'dispatched'
        ? `Dispatched '${label}' to your laptop.`
        : `Laptop unavailable. Queued '${label}' to execute when laptop reconnects.`;

      setMessages(prev => [
        ...prev,
        {
          id: `cmd-res-${Date.now()}`,
          role: 'assistant',
          content: statusText,
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
        }
      ]);
    } catch (e: any) {
      alert(`Failed to queue command: ${e.message}`);
    }
  };

  return (
    <div className="flex flex-col h-[calc(100vh-5rem)] max-w-4xl mx-auto px-4 py-4">
      {/* Messages list */}
      <div className="flex-1 overflow-y-auto space-y-4 pr-1">
        {messages.map((m) => {
          const isUser = m.role === 'user';
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

                <div className="flex items-center justify-between mt-2 pt-1 border-t border-black/5 dark:border-white/5 text-[10px] text-slate-400 dark:text-slate-500">
                  <span>{m.timestamp}</span>

                  {!isUser && (
                    <button
                      onClick={() => toggleSpeech(m.id, m.content)}
                      className="ml-3 text-slate-400 hover:text-blue-500 transition-colors"
                      title={speakingId === m.id ? 'Stop speaking' : 'Read aloud'}
                    >
                      {speakingId === m.id ? (
                        <VolumeX className="w-3.5 h-3.5 text-blue-500 animate-pulse" />
                      ) : (
                        <Volume2 className="w-3.5 h-3.5" />
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
          onClick={() => dispatchLaptopAction('system_info', 'Check Diagnostics')}
          className="flex items-center space-x-1.5 px-3 py-1.5 rounded-full bg-slate-100 dark:bg-slate-800/80 hover:bg-blue-50 dark:hover:bg-blue-950/40 border border-slate-200 dark:border-slate-700/60 text-slate-700 dark:text-slate-300 transition-colors whitespace-nowrap"
        >
          <Terminal className="w-3.5 h-3.5 text-blue-500" />
          <span>Laptop Diagnostics</span>
        </button>

        <button
          onClick={() => handleSend("What do you remember about my goals and preferences?")}
          className="flex items-center space-x-1.5 px-3 py-1.5 rounded-full bg-slate-100 dark:bg-slate-800/80 hover:bg-blue-50 dark:hover:bg-blue-950/40 border border-slate-200 dark:border-slate-700/60 text-slate-700 dark:text-slate-300 transition-colors whitespace-nowrap"
        >
          <span>Review Memories</span>
        </button>

        <button
          onClick={() => dispatchLaptopAction('screenshot', 'Capture Screenshot')}
          className="flex items-center space-x-1.5 px-3 py-1.5 rounded-full bg-slate-100 dark:bg-slate-800/80 hover:bg-blue-50 dark:hover:bg-blue-950/40 border border-slate-200 dark:border-slate-700/60 text-slate-700 dark:text-slate-300 transition-colors whitespace-nowrap"
        >
          <span>Authorize Screenshot</span>
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
            placeholder={isListening ? 'Listening to your voice...' : 'Type a message or request a laptop action...'}
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
