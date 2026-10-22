'use client';

import React from 'react';
import { Sparkles } from 'lucide-react';

export function CloudAiStatusBadge({ provider = 'Gemini Flash' }: { provider?: string }) {
  return (
    <div className="flex items-center space-x-1.5 text-xs px-2.5 py-1 rounded-full bg-blue-50 dark:bg-blue-950/50 border border-blue-200 dark:border-blue-800 text-blue-700 dark:text-blue-300">
      <Sparkles className="w-3.5 h-3.5 text-blue-500 animate-pulse-slow" />
      <span className="font-medium">Cloud AI: Active</span>
    </div>
  );
}
