'use client';

import React, { useState, useEffect } from 'react';
import { Laptop, Wifi, WifiOff, AlertTriangle, Play, RefreshCw, Clock, ShieldCheck, Terminal, Cpu, HardDrive, CheckCircle } from 'lucide-react';
import { LaptopAvailabilityResult } from '@/lib/devices/availability';

interface DeviceData {
  device_id: string;
  device_name: string;
  agent_version: string;
  os_info: any;
  availability: LaptopAvailabilityResult;
  pending_commands_count: number;
}

export default function DevicesPage() {
  const [deviceData, setDeviceData] = useState<DeviceData | null>(null);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [actionMessage, setActionMessage] = useState<string | null>(null);

  const fetchStatus = async () => {
    try {
      const res = await fetch('/api/devices/status?device_id=default-laptop-dev');
      if (res.ok) {
        const json = await res.json();
        setDeviceData(json);
      }
    } catch (e) {
      console.error('Failed to fetch device status:', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStatus();
    const interval = setInterval(fetchStatus, 4000);
    return () => clearInterval(interval);
  }, []);

  const triggerCommand = async (commandType: string, payload: any = {}, label: string) => {
    setActionLoading(true);
    setActionMessage(null);
    try {
      const res = await fetch('/api/devices/commands', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          device_id: 'default-laptop-dev',
          command_type: commandType,
          payload,
          user_confirmed: true
        })
      });

      const data = await res.json();
      if (res.ok) {
        setActionMessage(data.message || `Command '${label}' processed.`);
        fetchStatus();
      } else {
        setActionMessage(`Error: ${data.error}`);
      }
    } catch (e: any) {
      setActionMessage(`Request failed: ${e.message}`);
    } finally {
      setActionLoading(false);
    }
  };

  const simulateAgentHeartbeat = async () => {
    setActionLoading(true);
    try {
      await fetch('/api/devices/heartbeat', {
        method: 'POST',
        headers: {
          'Authorization': 'Bearer dev-test-token-32-chars-long',
          'X-Device-Id': 'default-laptop-dev',
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          agent_version: '1.0.0',
          health_status: 'healthy',
          os_info: { platform: 'Windows 11', cpu_cores: 8, ram_usage_pct: 42 }
        })
      });
      fetchStatus();
      setActionMessage('Sent simulated heartbeat from agent. Device marked online!');
    } catch (e: any) {
      setActionMessage(`Heartbeat simulation failed: ${e.message}`);
    } finally {
      setActionLoading(false);
    }
  };

  if (loading && !deviceData) {
    return (
      <div className="flex-1 flex items-center justify-center p-8 text-slate-500">
        <RefreshCw className="w-6 h-6 animate-spin mr-2" />
        <span>Loading laptop connection state...</span>
      </div>
    );
  }

  const availability = deviceData?.availability;
  const isOnline = availability?.status === 'online';

  return (
    <div className="max-w-5xl mx-auto w-full px-4 py-8">
      {/* Header */}
      <div className="pb-6 border-b border-slate-200 dark:border-slate-800">
        <div className="flex items-center space-x-2">
          <Laptop className="w-6 h-6 text-blue-500" />
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Laptop Bridge & Availability</h1>
        </div>
        <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
          Monitor your registered laptop agent, view real-time heartbeat health, and dispatch secure allowlisted actions.
        </p>
      </div>

      {/* Main Status Hero Card */}
      <div className="my-6 p-6 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center space-x-4">
            <div
              className={`w-14 h-14 rounded-2xl flex items-center justify-center ${
                isOnline
                  ? 'bg-emerald-100 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400'
                  : 'bg-amber-100 dark:bg-amber-950/60 text-amber-600 dark:text-amber-400'
              }`}
            >
              {isOnline ? <Wifi className="w-7 h-7" /> : <WifiOff className="w-7 h-7" />}
            </div>

            <div>
              <div className="flex items-center space-x-2">
                <h2 className="text-xl font-bold text-slate-900 dark:text-white">
                  {deviceData?.device_name || 'My Windows Laptop'}
                </h2>
                <span
                  className={`text-xs px-2.5 py-0.5 rounded-full font-semibold uppercase tracking-wider ${
                    isOnline
                      ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800'
                      : 'bg-amber-50 text-amber-700 dark:bg-amber-950/60 dark:text-amber-300 border border-amber-200 dark:border-amber-800'
                  }`}
                >
                  {isOnline ? 'Laptop Online' : 'Laptop Unavailable'}
                </span>
              </div>

              <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 flex items-center space-x-4">
                <span className="flex items-center">
                  <Clock className="w-3.5 h-3.5 mr-1" />
                  Last Heartbeat: {availability?.lastHeartbeatFormatted}
                </span>
                <span>Agent: v{deviceData?.agent_version}</span>
              </p>
            </div>
          </div>

          {/* Simulate Heartbeat Button for demonstration/testing */}
          <button
            onClick={simulateAgentHeartbeat}
            disabled={actionLoading}
            className="flex items-center space-x-2 px-4 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-xs font-semibold text-slate-700 dark:text-slate-200 transition-all self-start sm:self-center"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${actionLoading ? 'animate-spin' : ''}`} />
            <span>Send Test Heartbeat</span>
          </button>
        </div>

        {/* User-facing explanation banner */}
        <div
          className={`mt-6 p-4 rounded-2xl text-xs leading-relaxed border ${
            isOnline
              ? 'bg-emerald-50/50 dark:bg-emerald-950/20 border-emerald-200 dark:border-emerald-900/60 text-emerald-800 dark:text-emerald-300'
              : 'bg-amber-50/50 dark:bg-amber-950/20 border-amber-200 dark:border-amber-900/60 text-amber-800 dark:text-amber-300'
          }`}
        >
          <div className="font-semibold mb-1 flex items-center space-x-1.5">
            {isOnline ? (
              <CheckCircle className="w-4 h-4 text-emerald-500" />
            ) : (
              <AlertTriangle className="w-4 h-4 text-amber-500" />
            )}
            <span>Availability Status Note:</span>
          </div>
          <p>{availability?.userFacingMessage}</p>
        </div>

        {/* Action feedback message */}
        {actionMessage && (
          <div className="mt-4 p-3 rounded-xl bg-blue-50 dark:bg-blue-950/40 border border-blue-200 dark:border-blue-900 text-xs text-blue-700 dark:text-blue-300">
            {actionMessage}
          </div>
        )}
      </div>

      {/* Available Actions Allowlist */}
      <div className="my-8">
        <div className="flex items-center space-x-2 mb-4">
          <ShieldCheck className="w-5 h-5 text-emerald-500" />
          <h2 className="text-lg font-bold text-slate-900 dark:text-white">Strict Allowlisted Commands</h2>
        </div>
        <p className="text-xs text-slate-500 dark:text-slate-400 mb-4">
          Jarvis enforces strict sandboxing. No arbitrary PowerShell, no unapproved shell execution, and zero open inbound ports.
        </p>

        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
          <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 flex flex-col justify-between">
            <div>
              <div className="flex items-center space-x-2 text-blue-500 mb-1">
                <Cpu className="w-4 h-4" />
                <span className="font-semibold text-sm">System Diagnostics</span>
              </div>
              <p className="text-xs text-slate-500">Collects RAM, CPU usage, and battery percentages safely.</p>
            </div>
            <button
              onClick={() => triggerCommand('system_info', {}, 'System Diagnostics')}
              disabled={actionLoading}
              className="mt-4 w-full py-2 rounded-xl bg-blue-50 dark:bg-blue-950/60 hover:bg-blue-100 dark:hover:bg-blue-900/80 text-blue-600 dark:text-blue-400 text-xs font-semibold transition-all"
            >
              Run Diagnostics
            </button>
          </div>

          <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 flex flex-col justify-between">
            <div>
              <div className="flex items-center space-x-2 text-indigo-500 mb-1">
                <Terminal className="w-4 h-4" />
                <span className="font-semibold text-sm">Launch Notepad</span>
              </div>
              <p className="text-xs text-slate-500">Opens allowlisted notepad.exe without command-line interpolation.</p>
            </div>
            <button
              onClick={() => triggerCommand('launch_app', { app_name: 'notepad' }, 'Launch Notepad')}
              disabled={actionLoading}
              className="mt-4 w-full py-2 rounded-xl bg-indigo-50 dark:bg-indigo-950/60 hover:bg-indigo-100 dark:hover:bg-indigo-900/80 text-indigo-600 dark:text-indigo-400 text-xs font-semibold transition-all"
            >
              Open Notepad
            </button>
          </div>

          <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 flex flex-col justify-between">
            <div>
              <div className="flex items-center space-x-2 text-emerald-500 mb-1">
                <HardDrive className="w-4 h-4" />
                <span className="font-semibold text-sm">List Workspace Files</span>
              </div>
              <p className="text-xs text-slate-500">Confined to user-approved workspace directory with path traversal blocked.</p>
            </div>
            <button
              onClick={() => triggerCommand('list_files', { subpath: '' }, 'List Files')}
              disabled={actionLoading}
              className="mt-4 w-full py-2 rounded-xl bg-emerald-50 dark:bg-emerald-950/60 hover:bg-emerald-100 dark:hover:bg-emerald-900/80 text-emerald-600 dark:text-emerald-400 text-xs font-semibold transition-all"
            >
              List Files
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
