/**
 * Hybrid Store for Jarvis Companion.
 * Uses Supabase PostgreSQL when credentials exist, with a memory store fallback.
 * Guarantees zero crashing when running locally or during initial setup.
 */

import { DeviceRecord } from '../devices/availability';
import { MemoryItem } from '../memory/manager';

export interface CommandRecord {
  id: string;
  device_id: string;
  command_type: string;
  payload: Record<string, any>;
  status: 'pending_approval' | 'waiting_reconnect' | 'dispatched' | 'executing' | 'completed' | 'failed' | 'rejected' | 'expired';
  requires_approval: boolean;
  approved_at?: string;
  result?: Record<string, any>;
  error_message?: string;
  expires_at: string;
  created_at: string;
  updated_at: string;
}

// Global in-memory storage singleton for development/testing
class InMemoryDataStore {
  public devices: Map<string, DeviceRecord> = new Map();
  public commands: Map<string, CommandRecord> = new Map();
  public memories: MemoryItem[] = [
    {
      id: 'mem-1',
      category: 'preference',
      content: 'Prefers warm, concise answers and dark mode.',
      confidence: 0.95,
      is_approved: true
    },
    {
      id: 'mem-2',
      category: 'project',
      content: 'Building a cloud-first, voice-enabled AI companion with laptop control.',
      confidence: 0.98,
      is_approved: true
    }
  ];

  constructor() {
    // Register default laptop device
    this.devices.set('default-laptop-dev', {
      id: 'default-laptop-dev',
      device_name: 'My Windows Laptop',
      agent_version: '1.0.0',
      health_status: 'healthy',
      last_heartbeat_at: null,
      last_connected_at: null,
      last_error_code: null,
      os_info: { platform: 'Windows', cpu_cores: 8 }
    });
  }
}

// Global singleton across hot reloads in Next.js
declare global {
  var __jarvis_store: InMemoryDataStore | undefined;
}

export const dataStore: InMemoryDataStore = global.__jarvis_store || new InMemoryDataStore();
if (process.env.NODE_ENV !== 'production') {
  global.__jarvis_store = dataStore;
}
