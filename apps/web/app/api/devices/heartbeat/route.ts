import { NextRequest, NextResponse } from 'next/server';
import { dataStore } from '@/lib/db/store';

export async function POST(req: NextRequest) {
  try {
    const authHeader = req.headers.get('authorization') || '';
    const deviceId = req.headers.get('x-device-id') || '';

    // Validate bearer format
    if (!authHeader.startsWith('Bearer ') || !deviceId) {
      return NextResponse.json(
        { error: 'Unauthorized: Missing or invalid device authorization headers.' },
        { status: 401 }
      );
    }

    const body = await req.json();
    const serverTimestamp = new Date().toISOString();

    // Retrieve or register device
    let device = dataStore.devices.get(deviceId);
    if (!device) {
      device = {
        id: deviceId,
        device_name: 'Windows Laptop',
        agent_version: body.agent_version || '1.0.0',
        health_status: body.health_status || 'healthy',
        last_heartbeat_at: serverTimestamp,
        last_connected_at: serverTimestamp,
        last_error_code: null,
        os_info: body.os_info || {}
      };
      dataStore.devices.set(deviceId, device);
    } else {
      // Update with server receipt timestamp
      device.last_heartbeat_at = serverTimestamp;
      device.last_connected_at = serverTimestamp;
      device.health_status = body.health_status || 'healthy';
      device.agent_version = body.agent_version || device.agent_version;
      if (body.os_info) device.os_info = body.os_info;
      device.last_error_code = null;
    }

    return NextResponse.json({
      status: 'acknowledged',
      server_timestamp: serverTimestamp,
      heartbeat_interval: 30,
      online_threshold: 90
    });
  } catch (error: any) {
    return NextResponse.json(
      { error: `Internal heartbeat error: ${error.message}` },
      { status: 500 }
    );
  }
}
