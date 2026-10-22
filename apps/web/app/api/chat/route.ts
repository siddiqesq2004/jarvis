import { NextRequest, NextResponse } from 'next/server';
import { getAIProvider, MockProvider } from '@/lib/ai/provider';
import { dataStore, CommandRecord } from '@/lib/db/store';
import { assembleSystemPrompt, extractCandidateMemories } from '@/lib/memory/manager';
import { evaluateLaptopAvailability } from '@/lib/devices/availability';

interface ActionMatch {
  commandType: string;
  payload: Record<string, any>;
  confirmationText: string;
}

function parseComputerCommandIntent(text: string): ActionMatch | null {
  const lower = text.toLowerCase().trim();

  // App Launching
  if (lower.includes('open edge') || lower.includes('open microsoft edge') || lower.includes('launch edge') || lower.includes('open browser')) {
    return {
      commandType: 'launch_app',
      payload: { app_name: 'msedge' },
      confirmationText: 'Opening Microsoft Edge on your laptop right now!'
    };
  }
  if (lower.includes('open chrome') || lower.includes('launch chrome')) {
    return {
      commandType: 'launch_app',
      payload: { app_name: 'chrome' },
      confirmationText: 'Opening Google Chrome on your laptop!'
    };
  }
  if (lower.includes('open notepad') || lower.includes('launch notepad')) {
    return {
      commandType: 'launch_app',
      payload: { app_name: 'notepad' },
      confirmationText: 'Launching Notepad on your laptop!'
    };
  }
  if (lower.includes('open calculator') || lower.includes('open calc') || lower.includes('launch calculator')) {
    return {
      commandType: 'launch_app',
      payload: { app_name: 'calc' },
      confirmationText: 'Opening Calculator on your laptop!'
    };
  }

  // System Diagnostics / Battery
  if (lower.includes('diagnostic') || lower.includes('battery') || lower.includes('ram usage') || lower.includes('system info')) {
    return {
      commandType: 'system_info',
      payload: {},
      confirmationText: 'Gathering current hardware diagnostics and battery status from your laptop!'
    };
  }

  // Screenshot
  if (lower.includes('screenshot') || lower.includes('capture screen')) {
    return {
      commandType: 'screenshot',
      payload: { user_confirmed: true },
      confirmationText: 'Capturing a secure screenshot from your laptop display!'
    };
  }

  // Websites
  if (lower.includes('open youtube')) {
    return {
      commandType: 'open_url',
      payload: { url: 'https://www.youtube.com' },
      confirmationText: 'Opening YouTube in your default browser on your laptop!'
    };
  }
  if (lower.includes('open google')) {
    return {
      commandType: 'open_url',
      payload: { url: 'https://www.google.com' },
      confirmationText: 'Opening Google in your default browser on your laptop!'
    };
  }

  return null;
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => ({}));
    const { messages = [] } = body;

    if (!Array.isArray(messages) || messages.length === 0) {
      return NextResponse.json({
        content: "Hello! I am Jarvis, your personal AI companion. How can I help you today?",
        provider: 'jarvis-engine',
        model: 'jarvis-neural-core'
      });
    }

    const latestUserMsg = [...messages].reverse().find(m => m.role === 'user')?.content || '';

    // 1. Check for Computer Control Intent
    const actionMatch = parseComputerCommandIntent(latestUserMsg);
    if (actionMatch) {
      const device = dataStore.devices.get('default-laptop-dev') || null;
      const availability = evaluateLaptopAvailability(device);

      const commandId = `cmd-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`;
      const now = new Date();
      const expiresAt = new Date(now.getTime() + 10 * 60 * 1000);

      const initialStatus: CommandRecord['status'] = availability.isOnline ? 'dispatched' : 'waiting_reconnect';

      const newCommand: CommandRecord = {
        id: commandId,
        device_id: 'default-laptop-dev',
        command_type: actionMatch.commandType,
        payload: { ...actionMatch.payload, user_confirmed: true },
        status: initialStatus,
        requires_approval: false,
        expires_at: expiresAt.toISOString(),
        created_at: now.toISOString(),
        updated_at: now.toISOString()
      };

      dataStore.commands.set(commandId, newCommand);

      let reply = actionMatch.confirmationText;
      if (!availability.isOnline) {
        reply = `Your laptop is currently unavailable. I've queued the action: "${actionMatch.confirmationText}" and it will execute as soon as your laptop reconnects!`;
      }

      return NextResponse.json({
        content: reply,
        provider: 'laptop-bridge',
        model: 'jarvis-action-runner',
        command_id: commandId,
        command_status: initialStatus,
        laptop_online: availability.isOnline
      });
    }

    // 2. Memory context assembly
    const systemPrompt = assembleSystemPrompt('Jarvis', 'User', dataStore.memories);

    // 3. Extract candidate memories
    if (latestUserMsg) {
      const candidates = extractCandidateMemories(latestUserMsg);
      for (const cand of candidates) {
        const exists = dataStore.memories.some(m => m.content.toLowerCase() === cand.content.toLowerCase());
        if (!exists) {
          dataStore.memories.push({ ...cand, id: `mem-${Date.now()}` });
        }
      }
    }

    // 4. AI provider generation with automatic fallback
    let response;
    try {
      const provider = getAIProvider();
      response = await provider.generateResponse(messages, systemPrompt);
    } catch (e: any) {
      console.warn(`Provider exception in chat route: ${e.message}. Using companion fallback.`);
      const fallback = new MockProvider();
      response = await fallback.generateResponse(messages, systemPrompt);
    }

    return NextResponse.json({
      content: response.content,
      provider: response.provider,
      model: response.model,
      tokens_used: response.tokensUsed,
      active_memories_count: dataStore.memories.length
    });
  } catch (err: any) {
    const fallback = new MockProvider();
    const response = await fallback.generateResponse([], '');
    return NextResponse.json({
      content: response.content,
      provider: 'fallback',
      model: 'jarvis-fallback'
    });
  }
}
