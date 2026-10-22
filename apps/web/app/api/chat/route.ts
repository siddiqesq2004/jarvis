import { NextRequest, NextResponse } from 'next/server';
import { getAIProvider, MockProvider } from '@/lib/ai/provider';
import { dataStore } from '@/lib/db/store';
import { assembleSystemPrompt, extractCandidateMemories } from '@/lib/memory/manager';

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

    // 1. Memory context assembly
    const systemPrompt = assembleSystemPrompt('Jarvis', 'User', dataStore.memories);

    // 2. Extract new candidate memories from latest user message
    const latestUserMsg = [...messages].reverse().find(m => m.role === 'user');
    if (latestUserMsg?.content) {
      const candidates = extractCandidateMemories(latestUserMsg.content);
      for (const cand of candidates) {
        const exists = dataStore.memories.some(m => m.content.toLowerCase() === cand.content.toLowerCase());
        if (!exists) {
          dataStore.memories.push({ ...cand, id: `mem-${Date.now()}` });
        }
      }
    }

    // 3. AI provider generation with automatic free-tier fallback
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
    // Top-level catch guarantee: never crash or send empty 500
    const fallback = new MockProvider();
    const response = await fallback.generateResponse([], '');
    return NextResponse.json({
      content: response.content,
      provider: 'fallback',
      model: 'jarvis-fallback'
    });
  }
}
