/**
 * Laptop Availability & Heartbeat Evaluation Engine.
 * 
 * Uses server-side receipt timestamps as the sole source of truth.
 * Accurately determines whether the laptop is Online, Unavailable (sleeping/shut down/disconnected),
 * or in an Error state.
 */

export interface DeviceRecord {
  id: string;
  device_name: string;
  agent_version: string;
  health_status: 'healthy' | 'degraded' | 'error';
  last_heartbeat_at: string | null;
  last_connected_at: string | null;
  last_error_code: string | null;
  os_info?: Record<string, any>;
  is_revoked?: boolean;
}

export type ComputedLaptopStatus = 'online' | 'unavailable' | 'error';

export interface LaptopAvailabilityResult {
  status: ComputedLaptopStatus;
  isOnline: boolean;
  lastHeartbeatFormatted: string;
  secondsSinceHeartbeat: number | null;
  userFacingMessage: string;
  safeDiagnostic?: string;
  canExecuteCommands: boolean;
}

export const LAPTOP_ONLINE_THRESHOLD_SECONDS = 90;

export function evaluateLaptopAvailability(
  device: DeviceRecord | null | undefined,
  thresholdSeconds: number = LAPTOP_ONLINE_THRESHOLD_SECONDS
): LaptopAvailabilityResult {
  if (!device || device.is_revoked) {
    return {
      status: 'unavailable',
      isOnline: false,
      lastHeartbeatFormatted: 'Never',
      secondsSinceHeartbeat: null,
      userFacingMessage: 'No approved laptop agent registered or device has been revoked.',
      canExecuteCommands: false
    };
  }

  if (device.health_status === 'error' || device.last_error_code) {
    return {
      status: 'error',
      isOnline: false,
      lastHeartbeatFormatted: device.last_heartbeat_at ? new Date(device.last_heartbeat_at).toLocaleTimeString() : 'Unknown',
      secondsSinceHeartbeat: null,
      userFacingMessage: 'Laptop agent reported an error or failed internal health check.',
      safeDiagnostic: device.last_error_code || 'Internal agent exception',
      canExecuteCommands: false
    };
  }

  if (!device.last_heartbeat_at) {
    return {
      status: 'unavailable',
      isOnline: false,
      lastHeartbeatFormatted: 'Never',
      secondsSinceHeartbeat: null,
      userFacingMessage: 'Waiting for initial heartbeat from your laptop.',
      canExecuteCommands: false
    };
  }

  const lastHeartbeatTime = new Date(device.last_heartbeat_at).getTime();
  const now = Date.now();
  const secondsElapsed = Math.max(0, Math.floor((now - lastHeartbeatTime) / 1000));

  if (secondsElapsed <= thresholdSeconds) {
    return {
      status: 'online',
      isOnline: true,
      lastHeartbeatFormatted: `${secondsElapsed}s ago`,
      secondsSinceHeartbeat: secondsElapsed,
      userFacingMessage: 'Laptop is online and connected to Jarvis.',
      canExecuteCommands: true
    };
  }

  // Heartbeat is older than threshold: Device is unavailable
  return {
    status: 'unavailable',
    isOnline: false,
    lastHeartbeatFormatted: formatTimeAgo(secondsElapsed),
    secondsSinceHeartbeat: secondsElapsed,
    userFacingMessage:
      'Your laptop is currently unavailable. It may be sleeping, switched off, disconnected from the internet, or its Jarvis agent may have stopped. You can continue chatting with Jarvis, but laptop actions will wait until the laptop reconnects.',
    canExecuteCommands: false
  };
}

function formatTimeAgo(seconds: number): string {
  if (seconds < 60) return `${seconds}s ago`;
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  return `${hours}h ago`;
}
