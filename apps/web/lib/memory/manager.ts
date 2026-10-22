/**
 * Memory and Personalization Manager for Jarvis AI Companion.
 * 
 * Extracts candidate memories from conversation turns.
 * Builds personalized prompt context from approved memories.
 */

export interface MemoryItem {
  id?: string;
  category: 'preference' | 'project' | 'goal' | 'workflow' | 'fact' | 'routine';
  content: string;
  confidence: number;
  provenance?: string;
  is_approved?: boolean;
  is_sensitive?: boolean;
}

const PREFERENCE_TRIGGERS = [
  /i prefer\s+(.*)/i,
  /i like\s+(.*)/i,
  /always\s+(.*)/i,
  /never\s+(.*)/i,
  /my name is\s+(.*)/i,
  /call me\s+(.*)/i,
  /my project is\s+(.*)/i,
  /i am working on\s+(.*)/i,
  /my goal is\s+(.*)/i
];

export function extractCandidateMemories(userMessage: string): MemoryItem[] {
  const extracted: MemoryItem[] = [];
  const text = userMessage.trim();

  for (const pattern of PREFERENCE_TRIGGERS) {
    const match = text.match(pattern);
    if (match && match[1]) {
      const fact = match[1].replace(/[.!]+$/, '').trim();
      let category: MemoryItem['category'] = 'preference';

      if (pattern.source.includes('project') || pattern.source.includes('working on')) {
        category = 'project';
      } else if (pattern.source.includes('goal')) {
        category = 'goal';
      } else if (pattern.source.includes('name') || pattern.source.includes('call me')) {
        category = 'fact';
      }

      extracted.push({
        category,
        content: fact,
        confidence: 0.85,
        provenance: 'conversation_turn',
        is_approved: true,
        is_sensitive: false
      });
    }
  }

  return extracted;
}

export function assembleSystemPrompt(
  companionName: string = 'Jarvis',
  userName: string = 'Friend',
  memories: MemoryItem[] = []
): string {
  let memorySection = '';
  if (memories.length > 0) {
    memorySection = `\n[Known Long-term Memories about User]:\n` +
      memories.map(m => `- [${m.category.toUpperCase()}]: ${m.content}`).join('\n');
  }

  return `You are ${companionName}, a warm, highly capable, and transparent personal AI companion.
You are conversing with ${userName}.

Core Principles:
1. Be warm, personable, and thoughtful. Never pretend to be human or claim physical feelings you don't have.
2. Transparent: Acknowledge being an AI companion.
3. Concise & Useful: Give practical, direct answers without unnecessary corporate fluff.
4. Memory Retention: Respect and naturally incorporate the user's remembered preferences.
${memorySection}

Maintain a calm, reliable, and supportive tone.`;
}
