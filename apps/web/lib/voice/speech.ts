/**
 * Client-Side Voice Engine using Browser-Native Web Speech APIs.
 * 100% Free, zero latency, runs entirely client-side.
 */

export interface SpeechRecognitionHandlers {
  onResult: (transcript: string, isFinal: boolean) => void;
  onError: (error: string) => void;
  onEnd: () => void;
  onStart: () => void;
}

export function cleanTextForSpeech(rawMarkdown: string): string {
  // Strip code blocks
  let clean = rawMarkdown.replace(/```[\s\S]*?```/g, 'Code block omitted.');
  // Strip inline code
  clean = clean.replace(/`([^`]+)`/g, '$1');
  // Strip markdown links [text](url) -> text
  clean = clean.replace(/\[([^\]]+)\]\([^\)]+\)/g, '$1');
  // Strip URLs
  clean = clean.replace(/https?:\/\/\S+/g, 'link');
  // Strip markdown headers, bullets, bold, italics
  clean = clean.replace(/[#*_~>]/g, '');
  return clean.trim();
}

export class BrowserVoiceEngine {
  private recognition: any = null;
  private isListening: boolean = false;
  private synthesisVoice: SpeechSynthesisVoice | null = null;

  constructor() {
    if (typeof window !== 'undefined') {
      const SpeechRecognition =
        (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
      if (SpeechRecognition) {
        this.recognition = new SpeechRecognition();
        this.recognition.continuous = false;
        this.recognition.interimResults = true;
        this.recognition.lang = 'en-US';
      }
    }
  }

  isSpeechRecognitionSupported(): boolean {
    return this.recognition !== null;
  }

  isSpeechSynthesisSupported(): boolean {
    return typeof window !== 'undefined' && 'speechSynthesis' in window;
  }

  startListening(handlers: SpeechRecognitionHandlers) {
    if (!this.recognition) {
      handlers.onError('Speech recognition is not supported in this browser.');
      return;
    }

    if (this.isListening) {
      this.stopListening();
    }

    this.recognition.onstart = () => {
      this.isListening = true;
      handlers.onStart();
    };

    this.recognition.onresult = (event: any) => {
      let interim = '';
      let final = '';
      for (let i = event.resultIndex; i < event.results.length; ++i) {
        if (event.results[i].isFinal) {
          final += event.results[i][0].transcript;
        } else {
          interim += event.results[i][0].transcript;
        }
      }
      handlers.onResult(final || interim, Boolean(final));
    };

    this.recognition.onerror = (event: any) => {
      this.isListening = false;
      handlers.onError(event.error || 'Speech recognition error');
    };

    this.recognition.onend = () => {
      this.isListening = false;
      handlers.onEnd();
    };

    try {
      this.recognition.start();
    } catch (e: any) {
      handlers.onError(e.message || 'Failed to start microphone');
    }
  }

  stopListening() {
    if (this.recognition && this.isListening) {
      try {
        this.recognition.stop();
      } catch (e) {}
      this.isListening = false;
    }
  }

  speak(text: string, onEnd?: () => void, speed: number = 1.0, pitch: number = 1.0) {
    if (!this.isSpeechSynthesisSupported()) return;

    this.stopSpeaking();

    const spokenText = cleanTextForSpeech(text);
    if (!spokenText) {
      onEnd?.();
      return;
    }

    const utterance = new SpeechSynthesisUtterance(spokenText);
    utterance.rate = speed;
    utterance.pitch = pitch;

    // Pick a natural English voice if available
    const voices = window.speechSynthesis.getVoices();
    const naturalVoice = voices.find(
      v => v.lang.startsWith('en') && (v.name.includes('Natural') || v.name.includes('Google') || v.name.includes('Online'))
    ) || voices.find(v => v.lang.startsWith('en'));

    if (naturalVoice) {
      utterance.voice = naturalVoice;
    }

    utterance.onend = () => onEnd?.();
    utterance.onerror = () => onEnd?.();

    window.speechSynthesis.speak(utterance);
  }

  stopSpeaking() {
    if (this.isSpeechSynthesisSupported()) {
      window.speechSynthesis.cancel();
    }
  }
}
