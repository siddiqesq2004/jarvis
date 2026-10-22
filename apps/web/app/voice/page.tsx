'use client';

import React, { useState, useEffect, useRef } from 'react';
import { Mic, MicOff, Volume2, VolumeX, Sparkles, AlertCircle, ArrowLeft } from 'lucide-react';
import Link from 'next/link';
import { BrowserVoiceEngine } from '@/lib/voice/speech';

export default function VoiceModePage() {
  const [state, setState] = useState<'idle' | 'listening' | 'thinking' | 'speaking'>('idle');
  const [transcript, setTranscript] = useState('');
  const [lastResponse, setLastResponse] = useState('');
  const [voiceSupported, setVoiceSupported] = useState(true);

  const voiceEngineRef = useRef<BrowserVoiceEngine | null>(null);

  useEffect(() => {
    const engine = new BrowserVoiceEngine();
    voiceEngineRef.current = engine;
    if (!engine.isSpeechRecognitionSupported()) {
      setVoiceSupported(false);
    }
  }, []);

  const handleStartListening = () => {
    if (!voiceEngineRef.current) return;

    // Interrupt any active speech first
    voiceEngineRef.current.stopSpeaking();

    setState('listening');
    setTranscript('');

    voiceEngineRef.current.startListening({
      onStart: () => setState('listening'),
      onResult: (text, isFinal) => {
        setTranscript(text);
        if (isFinal) {
          processVoiceQuery(text);
        }
      },
      onError: (err) => {
        console.error('Voice input error:', err);
        setState('idle');
      },
      onEnd: () => {
        if (state === 'listening') {
          // If stopped without final, proceed or reset
          setState('idle');
        }
      }
    });
  };

  const processVoiceQuery = async (queryText: string) => {
    if (!queryText.trim()) {
      setState('idle');
      return;
    }

    setState('thinking');

    try {
      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: [{ role: 'user', content: queryText }]
        })
      });

      const data = await res.json();
      const answer = data.content || "I couldn't generate a voice response.";
      setLastResponse(answer);
      setState('speaking');

      voiceEngineRef.current?.speak(answer, () => {
        setState('idle');
      });
    } catch (e) {
      setLastResponse("I had trouble reaching the cloud inference provider.");
      setState('idle');
    }
  };

  const handleStop = () => {
    voiceEngineRef.current?.stopListening();
    voiceEngineRef.current?.stopSpeaking();
    setState('idle');
  };

  return (
    <div className="flex-1 flex flex-col items-center justify-between p-6 max-w-xl mx-auto w-full text-center">
      {/* Top back button */}
      <div className="w-full flex items-center justify-between mb-4">
        <Link
          href="/"
          className="flex items-center space-x-2 text-sm text-slate-500 hover:text-slate-900 dark:hover:text-white"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to Chat</span>
        </Link>
        <div className="flex items-center space-x-1 text-xs text-blue-500">
          <Sparkles className="w-3.5 h-3.5" />
          <span>Real-time Voice Mode</span>
        </div>
      </div>

      {!voiceSupported && (
        <div className="p-4 rounded-xl bg-amber-50 dark:bg-amber-950/50 border border-amber-300 dark:border-amber-800 text-amber-800 dark:text-amber-200 text-xs text-left mb-6 flex items-start space-x-2">
          <AlertCircle className="w-4 h-4 flex-shrink-0 text-amber-500 mt-0.5" />
          <div>
            <p className="font-semibold">Speech Recognition Not Supported</p>
            <p>Your current browser does not support the Web Speech API. For full hands-free voice, please open Jarvis in Microsoft Edge or Google Chrome.</p>
          </div>
        </div>
      )}

      {/* Main Visualizer Orb */}
      <div className="my-auto flex flex-col items-center justify-center">
        <div className="relative flex items-center justify-center w-52 h-52">
          {/* Animated glow rings */}
          {state === 'speaking' && (
            <div className="absolute inset-0 rounded-full bg-blue-500/20 animate-ping" />
          )}
          {state === 'listening' && (
            <div className="absolute inset-0 rounded-full bg-rose-500/20 animate-pulse" />
          )}
          {state === 'thinking' && (
            <div className="absolute inset-0 rounded-full bg-indigo-500/20 animate-spin" />
          )}

          {/* Central orb */}
          <div
            className={`w-40 h-40 rounded-full flex flex-col items-center justify-center shadow-2xl transition-all duration-500 ${
              state === 'listening'
                ? 'bg-gradient-to-tr from-rose-500 to-pink-500 scale-105'
                : state === 'speaking'
                ? 'bg-gradient-to-tr from-blue-600 to-indigo-500 scale-105'
                : state === 'thinking'
                ? 'bg-gradient-to-tr from-indigo-500 to-purple-600 scale-95'
                : 'bg-gradient-to-tr from-slate-700 to-slate-900 border border-slate-600'
            }`}
          >
            {state === 'listening' ? (
              <Mic className="w-12 h-12 text-white animate-pulse" />
            ) : state === 'speaking' ? (
              <Volume2 className="w-12 h-12 text-white animate-bounce" />
            ) : state === 'thinking' ? (
              <Sparkles className="w-12 h-12 text-white animate-spin" />
            ) : (
              <Mic className="w-12 h-12 text-slate-300" />
            )}
            <span className="text-white text-xs font-semibold uppercase mt-2 tracking-wider">
              {state}
            </span>
          </div>
        </div>

        {/* Live Transcript / Response display */}
        <div className="mt-8 min-h-[5rem] px-4">
          {transcript && (
            <p className="text-sm text-slate-500 dark:text-slate-400 italic">
              "{transcript}"
            </p>
          )}
          {lastResponse && state === 'speaking' && (
            <p className="text-base text-slate-900 dark:text-white font-medium mt-2 leading-relaxed">
              {lastResponse}
            </p>
          )}
          {state === 'idle' && !transcript && (
            <p className="text-sm text-slate-400 dark:text-slate-500">
              Tap the button below and speak naturally to Jarvis.
            </p>
          )}
        </div>
      </div>

      {/* Voice Controls */}
      <div className="w-full pb-8 flex items-center justify-center space-x-4">
        {state === 'idle' ? (
          <button
            onClick={handleStartListening}
            className="flex items-center space-x-2 px-8 py-4 rounded-full bg-blue-600 hover:bg-blue-700 text-white font-medium shadow-lg shadow-blue-500/25 transition-all active:scale-95"
          >
            <Mic className="w-5 h-5" />
            <span>Tap to Speak</span>
          </button>
        ) : (
          <button
            onClick={handleStop}
            className="flex items-center space-x-2 px-8 py-4 rounded-full bg-rose-600 hover:bg-rose-700 text-white font-medium shadow-lg shadow-rose-500/25 transition-all active:scale-95"
          >
            <VolumeX className="w-5 h-5" />
            <span>Stop / Interrupt</span>
          </button>
        )}
      </div>
    </div>
  );
}
