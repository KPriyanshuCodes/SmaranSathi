import { RegionalLanguage } from '../types';

class AudioService {
  private audioCtx: AudioContext | null = null;

  private getAudioContext(): AudioContext | null {
    if (typeof window === 'undefined') return null;
    if (!this.audioCtx) {
      const AudioCtxClass = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      if (AudioCtxClass) {
        this.audioCtx = new AudioCtxClass();
      }
    }
    if (this.audioCtx && this.audioCtx.state === 'suspended') {
      this.audioCtx.resume().catch(() => {});
    }
    return this.audioCtx;
  }

  // Gentle pentatonic success chime (warm sine wave, smooth envelope)
  playSuccessChime() {
    try {
      const ctx = this.getAudioContext();
      if (!ctx) return;

      const now = ctx.currentTime;
      const notes = [523.25, 659.25, 783.99, 1046.50]; // C5, E5, G5, C6

      notes.forEach((freq, i) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();

        osc.type = 'sine';
        osc.frequency.setValueAtTime(freq, now + i * 0.08);

        gain.gain.setValueAtTime(0, now + i * 0.08);
        gain.gain.linearRampToValueAtTime(0.12, now + i * 0.08 + 0.02);
        gain.gain.exponentialRampToValueAtTime(0.001, now + i * 0.08 + 0.4);

        osc.connect(gain);
        gain.connect(ctx.destination);

        osc.start(now + i * 0.08);
        osc.stop(now + i * 0.08 + 0.45);
      });
    } catch {
      // AudioContext policy safe catch
    }
  }

  // Gentle soft pop for tap or selection
  playGentleTap(freq = 440) {
    try {
      const ctx = this.getAudioContext();
      if (!ctx) return;

      const now = ctx.currentTime;
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, now);

      gain.gain.setValueAtTime(0, now);
      gain.gain.linearRampToValueAtTime(0.1, now + 0.01);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.2);

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start(now);
      osc.stop(now + 0.22);
    } catch {}
  }

  // Gentle chime for reminder announcement
  playGentleChime(freq?: number) {
    if (freq) {
      this.playGentleTap(freq);
    } else {
      this.playSuccessChime();
    }
  }

  // Melodic, resonant multi-tone alarm for scheduled reminders
  playReminderAlarm(priority: 'high' | 'medium' | 'gentle' = 'medium') {
    try {
      const ctx = this.getAudioContext();
      if (!ctx) return;

      const now = ctx.currentTime;

      // Frequencies for soothing temple bells / harmonic chime
      // Priority 'high' has 4 brighter tones (G5 -> C6 -> E6 -> G6)
      // Priority 'medium' has 3 balanced tones (E5 -> G5 -> C6)
      // Priority 'gentle' has 2 warm deep tones (C5 -> G5)
      const notePatterns = {
        gentle: [523.25, 783.99],
        medium: [659.25, 783.99, 1046.50],
        high: [783.99, 1046.50, 1318.51, 1567.98]
      };

      const notes = notePatterns[priority] || notePatterns.medium;

      // Repeat the melody sequence twice gently (0s and 1.2s)
      [0, 1.3].forEach((offset) => {
        notes.forEach((freq, i) => {
          const osc = ctx.createOscillator();
          const gain = ctx.createGain();

          osc.type = 'sine';
          osc.frequency.setValueAtTime(freq, now + offset + i * 0.18);

          // Warm attack, sustained resonance, gentle decay
          const startTime = now + offset + i * 0.18;
          gain.gain.setValueAtTime(0, startTime);
          gain.gain.linearRampToValueAtTime(0.18, startTime + 0.04);
          gain.gain.exponentialRampToValueAtTime(0.001, startTime + 0.9);

          osc.connect(gain);
          gain.connect(ctx.destination);

          osc.start(startTime);
          osc.stop(startTime + 0.95);
        });
      });
    } catch {
      // Audio policy safe
    }
  }

  // Encouraging warm tone (never harsh, soft wobble)
  playGentleEncouragement() {
    try {
      const ctx = this.getAudioContext();
      if (!ctx) return;

      const now = ctx.currentTime;
      const notes = [392.00, 440.00]; // G4, A4

      notes.forEach((freq, i) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();

        osc.type = 'sine';
        osc.frequency.setValueAtTime(freq, now + i * 0.12);

        gain.gain.setValueAtTime(0, now + i * 0.12);
        gain.gain.linearRampToValueAtTime(0.08, now + i * 0.12 + 0.02);
        gain.gain.exponentialRampToValueAtTime(0.001, now + i * 0.12 + 0.35);

        osc.connect(gain);
        gain.connect(ctx.destination);

        osc.start(now + i * 0.12);
        osc.stop(now + i * 0.12 + 0.38);
      });
    } catch {}
  }

  // Sequence tone by index (C, D, E, G, A)
  playSequenceTone(index: number) {
    const scale = [261.63, 293.66, 329.63, 392.00, 440.00, 523.25];
    const freq = scale[index % scale.length];
    this.playGentleTap(freq);
  }
}

export const soundEffects = new AudioService();

// Text to Speech using Web Speech API with regional fallbacks
export function speakText(text: string, lang: RegionalLanguage | string = 'en', onEnd?: () => void) {
  if (typeof window === 'undefined' || !('speechSynthesis' in window)) {
    if (onEnd) onEnd();
    return;
  }

  try {
    window.speechSynthesis.cancel(); // cancel prior speech
    const utterance = new SpeechSynthesisUtterance(text);

    // Map regional language to TTS BCP 47 language code
    const langMap: Record<string, string> = {
      en: 'en-IN',
      as: 'bn-IN', // Assamese TTS frequently maps smoothly to bn-IN (Bengali/Assamese script engine) in browser TTS
      kha: 'en-IN', // Khasi uses Latin script, clear English-Indian phonetics provides smooth fallback
      mni: 'hi-IN', // Manipuri fallback
      hi: 'hi-IN',
    };

    utterance.lang = langMap[lang] || 'en-IN';
    utterance.rate = 0.85; // Slightly slower, calm cadence for elderly comprehension
    utterance.pitch = 1.0;
    utterance.volume = 1.0;

    if (onEnd) {
      utterance.onend = () => onEnd();
      utterance.onerror = () => onEnd();
    }

    window.speechSynthesis.speak(utterance);
  } catch {
    if (onEnd) onEnd();
  }
}

export function stopSpeaking() {
  if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
    window.speechSynthesis.cancel();
  }
}

// Full Audio Alarm sequence: Harmonic melodic chime + Spoken voice prompt in regional language
export function triggerReminderAudioAlarm(
  title: string,
  spokenPrompt?: string,
  priority: 'high' | 'medium' | 'gentle' = 'medium',
  lang: RegionalLanguage | string = 'as',
  onEnd?: () => void
): () => void {
  // 1. Play the resonant musical chime
  soundEffects.playReminderAlarm(priority);

  // 2. Queue the spoken verbal reminder in the user's regional language after the opening bell
  const speechText = spokenPrompt && spokenPrompt.trim().length > 0 
    ? spokenPrompt 
    : `Attention: It is time for ${title}.`;

  const timer = setTimeout(() => {
    speakText(speechText, lang, onEnd);
  }, 1500);

  // Return cancel/silence function
  return () => {
    clearTimeout(timer);
    stopSpeaking();
  };
}
