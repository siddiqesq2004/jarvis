import { NextRequest, NextResponse } from 'next/server';
import { getAIProvider, ChatMessage } from '@/lib/ai/provider';
import { dataStore } from '@/lib/db/store';
import { assembleSystemPrompt, extractCandidateMemories } from '@/lib/memory/manager';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { messages = [] } = body;

    if (!Array.isArray(messages) || messages.length === 0) {
      return NextResponse.json({ error: 'Messages array is required.' }, { status: 400 });
    }

    // 1. Memory context assembly
    const systemPrompt = assembleSystemPrompt('Jarvis', 'User', dataStore.memories);

    // 2. Extract new candidate memories from the latest user message
    const latestUserMsg = [...messages].reverse().find(m => m.role === 'user');
    if (latestUserMsg?.content) {
      const candidates = extractCandidateMemories(latestUserMsg.content);
      for (const cand of candidates) {
        // Add if not already present
        const exists = dataStore.memories.some(m => m.content.toLowerCase() === cand.content.toLowerCase());
        if (!exists) {
          dataStore.memories.push({ ...cand, id: `mem-${Date.now()}` });
        }
      }
    }

    // 3. AI provider generation with automatic free-tier fallback
    const provider = getAIProvider();
    const response = await provider.generateResponse(messages, systemPrompt);

    return NextResponse.json({
      content: response.content,
      provider: response.provider,
      model: response.model,
      tokens_used: response.tokensUsed,
      active_memories_count: dataStore.memories.length
    });
  } catch (error: any) {
    return NextResponse.json(
      {
        error: `AI inference failed: ${error.message}. Please check your AI_PROVIDER or GEMINI_API_KEY.`,
        fallback_available: true
      },
      { status: 500 }
    );
  }
}
