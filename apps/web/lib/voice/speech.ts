/**
 * Client-Side Voice Engine using Browser-Native Natural Web Speech APIs.
 * 100% Free, zero latency, runs entirely client-side.
 * Prioritizes high-definition Natural Neural human voices over robotic synthesizers.
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
  // Strip bullet stars and markdown headers
  clean = clean.replace(/[#*_~>]/g, '');
  return clean.trim();
}

export class BrowserVoiceEngine {
  private recognition: any = null;
  private isListening: boolean = false;
  private cachedVoices: SpeechSynthesisVoice[] = [];
  private selectedVoice: SpeechSynthesisVoice | null = null;

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

      this.initVoices();
    }
  }

  private initVoices() {
    if (typeof window === 'undefined' || !('speechSynthesis' in window)) return;

    const load = () => {
      this.cachedVoices = window.speechSynthesis.getVoices();
      this.selectedVoice = this.pickBestNaturalVoice();
    };

    load();
    if (window.speechSynthesis.onvoiceschanged !== undefined) {
      window.speechSynthesis.onvoiceschanged = load;
    }
  }

  /**
   * Selects the highest quality natural neural human voice available on the device.
   * Filters out robotic legacy synthesizers (like legacy desktop voices).
   */
  public pickBestNaturalVoice(): SpeechSynthesisVoice | null {
    if (!this.cachedVoices || this.cachedVoices.length === 0) {
      if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
        this.cachedVoices = window.speechSynthesis.getVoices();
      }
    }

    const voices = this.cachedVoices;
    if (!voices || voices.length === 0) return null;

    // Preference list for top-tier natural human voices
    const naturalKeywords = [
      'Natural',
      'Neural',
      'Jenny',
      'Guy',
      'Aria',
      'Christopher',
      'Google US English',
      'Samantha'
    ];

    for (const kw of naturalKeywords) {
      const match = voices.find(
        v => v.lang.startsWith('en') && v.name.toLowerCase().includes(kw.toLowerCase())
      );
      if (match) return match;
    }

    // Secondary fallback: any English voice that contains "Online"
    const onlineVoice = voices.find(
      v => v.lang.startsWith('en') && v.name.toLowerCase().includes('online')
    );
    if (onlineVoice) return onlineVoice;

    // Tertiary fallback: any English voice
    return voices.find(v => v.lang.startsWith('en')) || voices[0] || null;
  }

  public getAvailableNaturalVoices(): SpeechSynthesisVoice[] {
    if (!this.cachedVoices || this.cachedVoices.length === 0) {
      if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
        this.cachedVoices = window.speechSynthesis.getVoices();
      }
    }
    return this.cachedVoices.filter(v => v.lang.startsWith('en'));
  }

  public setVoice(voiceName: string) {
    const found = this.cachedVoices.find(v => v.name === voiceName);
    if (found) {
      this.selectedVoice = found;
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
    if (!this.isSpeechSynthesisSupported()) {
      onEnd?.();
      return;
    }

    this.stopSpeaking();

    const spokenText = cleanTextForSpeech(text);
    if (!spokenText) {
      onEnd?.();
      return;
    }

    const utterance = new SpeechSynthesisUtterance(spokenText);
    utterance.rate = speed;
    utterance.pitch = pitch;

    // Pick best voice
    const voiceToUse = this.selectedVoice || this.pickBestNaturalVoice();
    if (voiceToUse) {
      utterance.voice = voiceToUse;
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
