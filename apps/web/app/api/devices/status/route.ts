import { NextRequest, NextResponse } from 'next/server';
import { dataStore } from '@/lib/db/store';
import { evaluateLaptopAvailability } from '@/lib/devices/availability';

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const deviceId = searchParams.get('device_id') || 'default-laptop-dev';

  const device = dataStore.devices.get(deviceId) || null;
  const availability = evaluateLaptopAvailability(device);

  // Count pending/waiting commands
  let pendingCount = 0;
  for (const cmd of dataStore.commands.values()) {
    if (cmd.device_id === deviceId && (cmd.status === 'pending_approval' || cmd.status === 'waiting_reconnect')) {
      pendingCount++;
    }
  }

  return NextResponse.json({
    device_id: deviceId,
    device_name: device ? device.device_name : 'Windows Laptop',
    agent_version: device ? device.agent_version : '1.0.0',
    os_info: device?.os_info || null,
    availability,
    pending_commands_count: pendingCount,
    server_time: new Date().toISOString()
  });
}
