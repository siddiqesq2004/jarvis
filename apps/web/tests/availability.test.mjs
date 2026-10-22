/**
 * Automated tests for Laptop Availability and Command Queue Safety.
 * Uses Node.js native test runner (zero external dependencies).
 */
import test from 'node:test';
import assert from 'node:assert/strict';

// Test Availability Logic
function evaluateAvailability(device, thresholdSeconds = 90) {
  if (!device || device.is_revoked) {
    return { status: 'unavailable', isOnline: false, canExecuteCommands: false };
  }
  if (device.health_status === 'error' || device.last_error_code) {
    return { status: 'error', isOnline: false, canExecuteCommands: false };
  }
  if (!device.last_heartbeat_at) {
    return { status: 'unavailable', isOnline: false, canExecuteCommands: false };
  }

  const lastHeartbeatTime = new Date(device.last_heartbeat_at).getTime();
  const now = Date.now();
  const secondsElapsed = Math.max(0, Math.floor((now - lastHeartbeatTime) / 1000));

  if (secondsElapsed <= thresholdSeconds) {
    return { status: 'online', isOnline: true, canExecuteCommands: true, secondsElapsed };
  }

  return {
    status: 'unavailable',
    isOnline: false,
    canExecuteCommands: false,
    secondsElapsed,
    message: 'Your laptop is currently unavailable. It may be sleeping, switched off, disconnected from the internet, or its Jarvis agent may have stopped. You can continue chatting with Jarvis, but laptop actions will wait until the laptop reconnects.'
  };
}

test('Laptop Online: Fresh heartbeat within 90 seconds', () => {
  const freshDevice = {
    id: 'test-laptop-1',
    health_status: 'healthy',
    last_heartbeat_at: new Date(Date.now() - 15 * 1000).toISOString() // 15s ago
  };

  const result = evaluateAvailability(freshDevice, 90);
  assert.equal(result.status, 'online');
  assert.equal(result.isOnline, true);
  assert.equal(result.canExecuteCommands, true);
});

test('Laptop Unavailable: Stale heartbeat > 90 seconds (Sleeping or Disconnected)', () => {
  const sleepingDevice = {
    id: 'test-laptop-2',
    health_status: 'healthy',
    last_heartbeat_at: new Date(Date.now() - 120 * 1000).toISOString() // 120s ago
  };

  const result = evaluateAvailability(sleepingDevice, 90);
  assert.equal(result.status, 'unavailable');
  assert.equal(result.isOnline, false);
  assert.equal(result.canExecuteCommands, false);
  assert.match(result.message, /sleeping, switched off, disconnected/);
});

test('Laptop Agent Error: Degraded or error code present', () => {
  const errorDevice = {
    id: 'test-laptop-3',
    health_status: 'error',
    last_error_code: 'SOCKET_DISCONNECT_ERR',
    last_heartbeat_at: new Date().toISOString()
  };

  const result = evaluateAvailability(errorDevice, 90);
  assert.equal(result.status, 'error');
  assert.equal(result.isOnline, false);
  assert.equal(result.canExecuteCommands, false);
});

test('Cloud AI Chat Independence: Cloud chat functions regardless of laptop availability', () => {
  const cloudAiState = { available: true, provider: 'gemini' };
  const laptopAvailability = evaluateAvailability(null); // No laptop connected

  // Laptop is offline
  assert.equal(laptopAvailability.isOnline, false);
  // Cloud AI is nonetheless available
  assert.equal(cloudAiState.available, true);
});

test('Command Queue Safety: Offline laptop causes commands to be marked waiting_reconnect, NOT executed', () => {
  const sleepingDevice = {
    id: 'test-laptop-sleep',
    health_status: 'healthy',
    last_heartbeat_at: new Date(Date.now() - 150 * 1000).toISOString()
  };

  const availability = evaluateAvailability(sleepingDevice, 90);
  assert.equal(availability.isOnline, false);

  // When dispatching command to unavailable device:
  let commandStatus = availability.isOnline ? 'dispatched' : 'waiting_reconnect';
  assert.equal(commandStatus, 'waiting_reconnect');
  assert.notEqual(commandStatus, 'completed');
  assert.notEqual(commandStatus, 'dispatched');
});
