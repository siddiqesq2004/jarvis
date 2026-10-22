/**
 * Provider-Agnostic AI Adapter for Jarvis AI Companion.
 * 
 * Supports:
 * 1. Google Gemini 1.5 / 2.0 Flash (Free Tier via Google AI Studio)
 * 2. Groq Cloud (Free Tier - Llama 3.3 70B Versatile)
 * 3. Mock Provider (Zero-cost local testing with no API keys needed)
 */

export interface ChatMessage {
  role: 'user' | 'assistant' | 'system';
  content: string;
}

export interface AIProviderResponse {
  content: string;
  provider: string;
  model: string;
  tokensUsed?: number;
}

export interface AIProvider {
  name: string;
  generateResponse(
    messages: ChatMessage[],
    systemPrompt: string
  ): Promise<AIProviderResponse>;
  streamResponse(
    messages: ChatMessage[],
    systemPrompt: string,
    onChunk: (chunk: string) => void
  ): Promise<AIProviderResponse>;
  checkAvailability(): Promise<{ available: boolean; error?: string }>;
}

/**
 * 1. GOOGLE GEMINI FLASH PROVIDER (Free Tier via Google AI Studio)
 * 15 Requests/Min, 1,500 Requests/Day — $0 Cost
 */
export class GeminiProvider implements AIProvider {
  name = 'gemini';
  private apiKey: string;
  private model: string;

  constructor(apiKey?: string, model: string = 'gemini-1.5-flash') {
    this.apiKey = apiKey || process.env.GEMINI_API_KEY || '';
    this.model = process.env.GEMINI_MODEL || model;
  }

  async checkAvailability(): Promise<{ available: boolean; error?: string }> {
    if (!this.apiKey) {
      return { available: false, error: 'GEMINI_API_KEY is not configured.' };
    }
    return { available: true };
  }

  async generateResponse(messages: ChatMessage[], systemPrompt: string): Promise<AIProviderResponse> {
    if (!this.apiKey) throw new Error('GEMINI_API_KEY is missing.');

    const contents = [
      { role: 'user', parts: [{ text: `[System Instruction: ${systemPrompt}]` }] },
      ...messages.map(m => ({
        role: m.role === 'assistant' ? 'model' : 'user',
        parts: [{ text: m.content }]
      }))
    ];

    const url = `https://generativelanguage.googleapis.com/v1beta/models/${this.model}:generateContent?key=${this.apiKey}`;
    const resp = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ contents })
    });

    if (!resp.ok) {
      const err = await resp.text();
      throw new Error(`Gemini API Error (HTTP ${resp.status}): ${err}`);
    }

    const data = await resp.json();
    const text = data.candidates?.[0]?.content?.parts?.[0]?.text || '';
    return {
      content: text,
      provider: 'gemini',
      model: this.model,
      tokensUsed: data.usageMetadata?.totalTokenCount || 0
    };
  }

  async streamResponse(
    messages: ChatMessage[],
    systemPrompt: string,
    onChunk: (chunk: string) => void
  ): Promise<AIProviderResponse> {
    // For reliable streaming over serverless, we generate and stream in natural sentence segments
    const res = await this.generateResponse(messages, systemPrompt);
    const words = res.content.split(' ');
    for (let i = 0; i < words.length; i += 3) {
      const slice = words.slice(i, i + 3).join(' ') + ' ';
      onChunk(slice);
      await new Promise(r => setTimeout(r, 20));
    }
    return res;
  }
}

/**
 * 2. GROQ CLOUD PROVIDER (Free Tier - Llama 3.3 70B Versatile)
 * 30 Requests/Min, 14,400 Requests/Day — $0 Cost
 */
export class GroqProvider implements AIProvider {
  name = 'groq';
  private apiKey: string;
  private model: string;

  constructor(apiKey?: string, model: string = 'llama-3.3-70b-versatile') {
    this.apiKey = apiKey || process.env.GROQ_API_KEY || '';
    this.model = process.env.GROQ_MODEL || model;
  }

  async checkAvailability(): Promise<{ available: boolean; error?: string }> {
    if (!this.apiKey) {
      return { available: false, error: 'GROQ_API_KEY is not configured.' };
    }
    return { available: true };
  }

  async generateResponse(messages: ChatMessage[], systemPrompt: string): Promise<AIProviderResponse> {
    if (!this.apiKey) throw new Error('GROQ_API_KEY is missing.');

    const formattedMessages = [
      { role: 'system', content: systemPrompt },
      ...messages.map(m => ({ role: m.role, content: m.content }))
    ];

    const resp = await fetch('https://api.groq.com/openai/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${this.apiKey}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        model: this.model,
        messages: formattedMessages,
        temperature: 0.7
      })
    });

    if (!resp.ok) {
      const err = await resp.text();
      throw new Error(`Groq API Error (HTTP ${resp.status}): ${err}`);
    }

    const data = await resp.json();
    const content = data.choices?.[0]?.message?.content || '';
    return {
      content,
      provider: 'groq',
      model: this.model,
      tokensUsed: data.usage?.total_tokens || 0
    };
  }

  async streamResponse(
    messages: ChatMessage[],
    systemPrompt: string,
    onChunk: (chunk: string) => void
  ): Promise<AIProviderResponse> {
    const res = await this.generateResponse(messages, systemPrompt);
    const words = res.content.split(' ');
    for (let i = 0; i < words.length; i += 3) {
      onChunk(words.slice(i, i + 3).join(' ') + ' ');
      await new Promise(r => setTimeout(r, 15));
    }
    return res;
  }
}

/**
 * 3. MOCK PROVIDER (Local / Zero-Configuration Testing)
 * Allows the entire application to run end-to-end even before entering API keys.
 */
export class MockProvider implements AIProvider {
  name = 'mock';

  async checkAvailability(): Promise<{ available: boolean }> {
    return { available: true };
  }

  async generateResponse(messages: ChatMessage[], systemPrompt: string): Promise<AIProviderResponse> {
    const lastUserMsg = [...messages].reverse().find(m => m.role === 'user')?.content.toLowerCase() || '';

    let reply = "Hello! I am Jarvis, your cloud-first personal AI companion. All my memory and conversation processing run remotely to keep your laptop light and fast. How can I assist you today?";

    if (lastUserMsg.includes('laptop') || lastUserMsg.includes('status')) {
      reply = "I keep your cloud chat completely independent from your laptop agent. If your laptop is sleeping or shut down, you and I can still chat freely here without interruption!";
    } else if (lastUserMsg.includes('memory') || lastUserMsg.includes('remember')) {
      reply = "I've noted that! My long-term memory system stores your preferences and ongoing projects in Supabase PostgreSQL, so I gradually become more personalized to your style.";
    } else if (lastUserMsg.includes('who are you') || lastUserMsg.includes('help')) {
      reply = "I am Jarvis — a zero-cost, cloud-first personal assistant. I can converse via text or voice, recall your preferences, and control approved tasks on your laptop when it's online.";
    }

    return {
      content: reply,
      provider: 'mock',
      model: 'jarvis-built-in-eval',
      tokensUsed: 42
    };
  }

  async streamResponse(
    messages: ChatMessage[],
    systemPrompt: string,
    onChunk: (chunk: string) => void
  ): Promise<AIProviderResponse> {
    const res = await this.generateResponse(messages, systemPrompt);
    const words = res.content.split(' ');
    for (const word of words) {
      onChunk(word + ' ');
      await new Promise(r => setTimeout(r, 30));
    }
    return res;
  }
}

/**
 * Factory function to retrieve the active AI Provider with automatic fallback.
 */
export function getAIProvider(): AIProvider {
  const chosen = (process.env.AI_PROVIDER || 'gemini').toLowerCase();

  if (chosen === 'groq' && process.env.GROQ_API_KEY) {
    return new GroqProvider();
  }

  if (process.env.GEMINI_API_KEY) {
    return new GeminiProvider();
  }

  if (process.env.GROQ_API_KEY) {
    return new GroqProvider();
  }

  // Graceful fallback to MockProvider when no keys are set
  return new MockProvider();
}
