import { NextResponse } from 'next/server';
import { getAIProvider } from '@/lib/ai/provider';
import { dataStore } from '@/lib/db/store';
import { evaluateLaptopAvailability } from '@/lib/devices/availability';

export async function GET() {
  const provider = getAIProvider();
  const providerStatus = await provider.checkAvailability();

  const device = dataStore.devices.get('default-laptop-dev') || null;
  const laptopAvailability = evaluateLaptopAvailability(device);

  // Check internal Vercel laptop-agent service binding if configured
  let internalAgentStatus = 'standalone';
  if (process.env.LAPTOP_AGENT_SERVICE_URL) {
    try {
      const internalRes = await fetch(new URL('/', process.env.LAPTOP_AGENT_SERVICE_URL), {
        signal: AbortSignal.timeout(2000)
      });
      if (internalRes.ok) {
        const json = await internalRes.json();
        internalAgentStatus = json.status || 'connected';
      }
    } catch {
      internalAgentStatus = 'unreachable';
    }
  }

  return NextResponse.json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    cloud_services: {
      ai_provider: provider.name,
      ai_available: providerStatus.available,
      ai_error: providerStatus.error || null,
      memory_store_count: dataStore.memories.length,
      internal_service_binding: internalAgentStatus
    },
    laptop_bridge: {
      device_id: device?.id || 'none',
      device_name: device?.device_name || 'None',
      status: laptopAvailability.status,
      is_online: laptopAvailability.isOnline,
      last_heartbeat: laptopAvailability.lastHeartbeatFormatted,
      explanation: laptopAvailability.userFacingMessage
    },
    zero_cost_metrics: {
      cloud_hosting: 'Vercel Free Tier ($0)',
      database: 'Supabase Free Tier ($0)',
      voice_engine: 'Web Speech API ($0, Client-Side)',
      laptop_storage_footprint: '< 100 KB total Python agent code'
    }
  });
}
