'use client';

import React, { useEffect, useState } from 'react';
import { Laptop, Wifi, WifiOff, AlertTriangle, RefreshCw, Clock } from 'lucide-react';
import { LaptopAvailabilityResult } from '@/lib/devices/availability';

interface LaptopStatusBadgeProps {
  deviceId?: string;
  refreshInterval?: number; // ms
}

export function LaptopStatusBadge({ deviceId = 'default-laptop-dev', refreshInterval = 5000 }: LaptopStatusBadgeProps) {
  const [data, setData] = useState<{
    availability: LaptopAvailabilityResult;
    device_name: string;
    pending_commands_count: number;
  } | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const fetchStatus = async () => {
    try {
      const res = await fetch(`/api/devices/status?device_id=${deviceId}`);
      if (res.ok) {
        const json = await res.json();
        setData(json);
      }
    } catch (e) {
      // Keep previous data or show error
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchStatus();
    const interval = setInterval(fetchStatus, refreshInterval);
    return () => clearInterval(interval);
  }, [deviceId, refreshInterval]);

  if (!data) {
    return (
      <div className="flex items-center space-x-2 text-xs px-2.5 py-1 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-500">
        <RefreshCw className="w-3.5 h-3.5 animate-spin" />
        <span>Checking laptop...</span>
      </div>
    );
  }

  const { availability, device_name, pending_commands_count } = data;

  if (availability.status === 'online') {
    return (
      <div className="flex items-center space-x-2 text-xs px-3 py-1.5 rounded-full bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-300 dark:border-emerald-800 text-emerald-800 dark:text-emerald-300 transition-all">
        <span className="relative flex h-2 w-2">
          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
          <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
        </span>
        <Laptop className="w-3.5 h-3.5" />
        <span className="font-medium">Laptop Online</span>
        <span className="text-emerald-600 dark:text-emerald-400 text-[10px] flex items-center">
          <Clock className="w-2.5 h-2.5 mr-0.5" />
          {availability.lastHeartbeatFormatted}
        </span>
      </div>
    );
  }

  if (availability.status === 'error') {
    return (
      <div className="flex items-center space-x-2 text-xs px-3 py-1.5 rounded-full bg-rose-50 dark:bg-rose-950/60 border border-rose-300 dark:border-rose-800 text-rose-800 dark:text-rose-300">
        <AlertTriangle className="w-3.5 h-3.5 text-rose-500" />
        <span className="font-medium">Laptop Agent Error</span>
      </div>
    );
  }

  // Laptop is unavailable (Sleeping / Shut Down / Disconnected)
  return (
    <div
      title={availability.userFacingMessage}
      className="flex items-center space-x-2 text-xs px-3 py-1.5 rounded-full bg-amber-50 dark:bg-amber-950/50 border border-amber-300 dark:border-amber-800/80 text-amber-800 dark:text-amber-300"
    >
      <WifiOff className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400" />
      <span className="font-medium">Laptop Unavailable</span>
      {pending_commands_count > 0 && (
        <span className="bg-amber-200 dark:bg-amber-900 text-amber-900 dark:text-amber-200 text-[10px] px-1.5 py-0.2 rounded-full font-bold">
          {pending_commands_count} queued
        </span>
      )}
    </div>
  );
}
