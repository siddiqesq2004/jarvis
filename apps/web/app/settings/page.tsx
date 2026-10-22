'use client';

import React, { useState } from 'react';
import { Settings, Cpu, HardDrive, Shield, Volume2, Sparkles, CheckCircle2 } from 'lucide-react';

export default function SettingsPage() {
  const [provider, setProvider] = useState('gemini');
  const [voiceSpeed, setVoiceSpeed] = useState(1.0);
  const [voicePitch, setVoicePitch] = useState(1.0);
  const [saved, setSaved] = useState(false);

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    setSaved(true);
    setTimeout(() => setSaved(false), 3000);
  };

  return (
    <div className="max-w-4xl mx-auto w-full px-4 py-8">
      {/* Header */}
      <div className="pb-6 border-b border-slate-200 dark:border-slate-800">
        <div className="flex items-center space-x-2">
          <Settings className="w-6 h-6 text-blue-500" />
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Settings & Provider Configuration</h1>
        </div>
        <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
          Customize AI models, voice synthesis preferences, and review zero-cost resource metrics.
        </p>
      </div>

      <form onSubmit={handleSave} className="space-y-6 mt-6">
        {/* Zero-Cost Quota & Storage Footprint Card */}
        <div className="p-5 rounded-3xl bg-blue-50/50 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-900/60">
          <div className="flex items-center space-x-2 text-blue-700 dark:text-blue-300 font-bold text-sm mb-3">
            <HardDrive className="w-4 h-4" />
            <span>Zero-Cost Architecture & Laptop Disk Report</span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs">
            <div className="p-3 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
              <span className="text-slate-400 block mb-1">Local Laptop Agent Disk Usage</span>
              <span className="font-bold text-emerald-600 dark:text-emerald-400 text-base">&lt; 100 KB</span>
              <p className="text-[10px] text-slate-500 mt-1">Zero local models, zero weights.</p>
            </div>

            <div className="p-3 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
              <span className="text-slate-400 block mb-1">AI Inference Quota</span>
              <span className="font-bold text-blue-600 dark:text-blue-400 text-base">1,500 req/day</span>
              <p className="text-[10px] text-slate-500 mt-1">Google Gemini Flash Free Tier ($0).</p>
            </div>

            <div className="p-3 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
              <span className="text-slate-400 block mb-1">Cloud Database & Storage</span>
              <span className="font-bold text-purple-600 dark:text-purple-400 text-base">500 MB Free</span>
              <p className="text-[10px] text-slate-500 mt-1">Supabase PostgreSQL Free Tier ($0).</p>
            </div>
          </div>
        </div>

        {/* AI Provider Section */}
        <div className="p-6 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm">
          <div className="flex items-center space-x-2 text-slate-900 dark:text-white font-bold text-base mb-4">
            <Sparkles className="w-5 h-5 text-blue-500" />
            <span>AI Model Provider (Swappable Adapter)</span>
          </div>

          <div className="space-y-3">
            <label className="flex items-start space-x-3 p-3.5 rounded-2xl border border-slate-200 dark:border-slate-800 cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors">
              <input
                type="radio"
                name="provider"
                value="gemini"
                checked={provider === 'gemini'}
                onChange={(e) => setProvider(e.target.value)}
                className="mt-1"
              />
              <div className="text-xs">
                <span className="font-bold text-slate-900 dark:text-white block">
                  Google Gemini 1.5 / 2.0 Flash (Recommended — Free Tier)
                </span>
                <span className="text-slate-500 block mt-0.5">
                  15 requests/min, 1,500 requests/day free via Google AI Studio. No credit card required.
                </span>
              </div>
            </label>

            <label className="flex items-start space-x-3 p-3.5 rounded-2xl border border-slate-200 dark:border-slate-800 cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors">
              <input
                type="radio"
                name="provider"
                value="groq"
                checked={provider === 'groq'}
                onChange={(e) => setProvider(e.target.value)}
                className="mt-1"
              />
              <div className="text-xs">
                <span className="font-bold text-slate-900 dark:text-white block">
                  Groq Cloud — Llama 3.3 70B (Ultra-fast Free Tier)
                </span>
                <span className="text-slate-500 block mt-0.5">
                  Ultra-low latency inference (~800 tokens/sec), 14,400 requests/day free.
                </span>
              </div>
            </label>

            <label className="flex items-start space-x-3 p-3.5 rounded-2xl border border-slate-200 dark:border-slate-800 cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors">
              <input
                type="radio"
                name="provider"
                value="mock"
                checked={provider === 'mock'}
                onChange={(e) => setProvider(e.target.value)}
                className="mt-1"
              />
              <div className="text-xs">
                <span className="font-bold text-slate-900 dark:text-white block">
                  Built-in Offline Test Engine (Zero Keys Required)
                </span>
                <span className="text-slate-500 block mt-0.5">
                  Runs local rule-based responses immediately for offline verification and testing.
                </span>
              </div>
            </label>
          </div>
        </div>

        {/* Voice Speech Preferences */}
        <div className="p-6 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm">
          <div className="flex items-center space-x-2 text-slate-900 dark:text-white font-bold text-base mb-4">
            <Volume2 className="w-5 h-5 text-indigo-500" />
            <span>Voice & Speech Synthesis</span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 text-xs">
            <div>
              <div className="flex justify-between font-medium text-slate-700 dark:text-slate-300 mb-2">
                <span>Speech Speed</span>
                <span>{voiceSpeed}x</span>
              </div>
              <input
                type="range"
                min="0.75"
                max="1.5"
                step="0.05"
                value={voiceSpeed}
                onChange={(e) => setVoiceSpeed(parseFloat(e.target.value))}
                className="w-full accent-blue-600"
              />
            </div>

            <div>
              <div className="flex justify-between font-medium text-slate-700 dark:text-slate-300 mb-2">
                <span>Voice Pitch</span>
                <span>{voicePitch}x</span>
              </div>
              <input
                type="range"
                min="0.8"
                max="1.2"
                step="0.05"
                value={voicePitch}
                onChange={(e) => setVoicePitch(parseFloat(e.target.value))}
                className="w-full accent-blue-600"
              />
            </div>
          </div>
        </div>

        {/* Submit */}
        <div className="flex items-center justify-between pt-2">
          {saved ? (
            <span className="flex items-center text-xs font-semibold text-emerald-600 dark:text-emerald-400">
              <CheckCircle2 className="w-4 h-4 mr-1.5" />
              Settings saved successfully!
            </span>
          ) : <div />}

          <button
            type="submit"
            className="px-6 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold shadow-sm transition-all"
          >
            Save Preferences
          </button>
        </div>
      </form>
    </div>
  );
}
