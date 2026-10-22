import { NextRequest, NextResponse } from 'next/server';
import { dataStore, CommandRecord } from '@/lib/db/store';
import { evaluateLaptopAvailability } from '@/lib/devices/availability';

const ALLOWED_COMMAND_TYPES = [
  'system_info',
  'launch_app',
  'open_url',
  'list_files',
  'read_file',
  'create_file',
  'copy_clipboard',
  'screenshot'
];

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const deviceId = searchParams.get('device_id') || 'default-laptop-dev';

  const commands: CommandRecord[] = [];
  const now = new Date().getTime();

  for (const cmd of dataStore.commands.values()) {
    if (cmd.device_id === deviceId) {
      // Check for expiration
      if (new Date(cmd.expires_at).getTime() < now && cmd.status !== 'completed' && cmd.status !== 'failed') {
        cmd.status = 'expired';
      }
      // Return actionable commands for agent
      if (cmd.status === 'dispatched') {
        commands.push(cmd);
      }
    }
  }

  return NextResponse.json({ commands });
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { device_id, command_type, payload = {}, requires_approval = false, user_confirmed = false } = body;

    const targetDeviceId = device_id || 'default-laptop-dev';

    // 1. Validate allowlist
    if (!ALLOWED_COMMAND_TYPES.includes(command_type)) {
      return NextResponse.json(
        { error: `Command '${command_type}' is not in the approved allowlist.` },
        { status: 400 }
      );
    }

    // 2. Sensitive action check
    if ((command_type === 'screenshot' || command_type === 'create_file') && !user_confirmed) {
      return NextResponse.json(
        { error: 'Explicit user authorization required for this action.' },
        { status: 403 }
      );
    }

    // 3. Evaluate laptop availability
    const device = dataStore.devices.get(targetDeviceId) || null;
    const availability = evaluateLaptopAvailability(device);

    const now = new Date();
    const expiresAt = new Date(now.getTime() + 10 * 60 * 1000); // 10 min expiry

    let initialStatus: CommandRecord['status'] = 'dispatched';
    let statusMessage = 'Command dispatched to laptop agent.';

    if (!availability.isOnline) {
      // Laptop is sleeping / disconnected: queue as waiting_reconnect
      initialStatus = 'waiting_reconnect';
      statusMessage = 'Laptop is currently unavailable. Command has been queued to execute when laptop reconnects.';
    }

    const commandId = `cmd-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;
    const newCommand: CommandRecord = {
      id: commandId,
      device_id: targetDeviceId,
      command_type,
      payload: { ...payload, user_confirmed },
      status: initialStatus,
      requires_approval,
      expires_at: expiresAt.toISOString(),
      created_at: now.toISOString(),
      updated_at: now.toISOString()
    };

    dataStore.commands.set(commandId, newCommand);

    return NextResponse.json({
      status: 'queued',
      command_id: commandId,
      command_status: initialStatus,
      laptop_status: availability.status,
      message: statusMessage
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function PATCH(req: NextRequest) {
  try {
    const body = await req.json();
    const { command_id, status, result, error_message } = body;

    const cmd = dataStore.commands.get(command_id);
    if (!cmd) {
      return NextResponse.json({ error: 'Command not found.' }, { status: 404 });
    }

    // Record verified execution result
    cmd.status = status;
    if (result) cmd.result = result;
    if (error_message) cmd.error_message = error_message;
    cmd.updated_at = new Date().toISOString();

    return NextResponse.json({
      status: 'updated',
      command_id,
      verified_status: cmd.status
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
