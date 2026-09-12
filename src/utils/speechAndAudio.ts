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
      const notePatterns = {
        gentle: [523.25, 783.99],
        medium: [659.25, 783.99, 1046.50],
        high: [783.99, 1046.50, 1318.51, 1567.98]
      };

      const notes = notePatterns[priority] || notePatterns.medium;

      // Repeat the melody sequence twice gently (0s and 1.3s)
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

// Voice Cache & Selection Helper
let cachedVoices: SpeechSynthesisVoice[] = [];

function loadVoices(): SpeechSynthesisVoice[] {
  if (typeof window === 'undefined' || !('speechSynthesis' in window)) return [];
  if (cachedVoices.length > 0) return cachedVoices;
  const voices = window.speechSynthesis.getVoices();
  if (voices.length > 0) {
    cachedVoices = voices;
  }
  return cachedVoices;
}

if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
  window.speechSynthesis.onvoiceschanged = () => {
    cachedVoices = window.speechSynthesis.getVoices();
  };
}

/**
 * Finds the best voice for a given language code (prioritizing high quality Hindi and Indian voices)
 */
function findBestVoice(langCode: string): SpeechSynthesisVoice | null {
  const voices = loadVoices();
  if (!voices || voices.length === 0) return null;

  // 1. Specific search for Hindi voices if requested
  if (langCode.startsWith('hi')) {
    const hindiVoice = voices.find(
      (v) =>
        v.lang === 'hi-IN' ||
        v.lang === 'hi_IN' ||
        v.lang.toLowerCase().startsWith('hi') ||
        v.name.toLowerCase().includes('hindi') ||
        v.name.toLowerCase().includes('swara') ||
        v.name.toLowerCase().includes('hemant') ||
        v.name.toLowerCase().includes('kalpana') ||
        v.name.toLowerCase().includes('lekha')
    );
    if (hindiVoice) return hindiVoice;
  }

  // 2. Exact match on BCP-47 tag
  const exact = voices.find((v) => v.lang.toLowerCase() === langCode.toLowerCase());
  if (exact) return exact;

  // 3. Match on language prefix (e.g. 'en', 'hi', 'bn')
  const prefix = langCode.split('-')[0].toLowerCase();
  const prefixMatch = voices.find((v) => v.lang.toLowerCase().startsWith(prefix));
  if (prefixMatch) return prefixMatch;

  // 4. Fallback Indian accent voice
  const indianVoice = voices.find((v) => v.lang.includes('IN') || v.name.toLowerCase().includes('india'));
  if (indianVoice) return indianVoice;

  return null;
}

export type GameVoiceMode = 'hindi' | 'regional';

const VOICE_PREF_KEY = 'smriti_game_voice_pref';

export function getGameVoicePreference(): GameVoiceMode {
  if (typeof window === 'undefined') return 'hindi';
  try {
    const stored = localStorage.getItem(VOICE_PREF_KEY);
    if (stored === 'regional' || stored === 'hindi') return stored;
  } catch {}
  return 'hindi'; // Default to Hindi voice for games as requested
}

export function setGameVoicePreference(mode: GameVoiceMode) {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(VOICE_PREF_KEY, mode);
  } catch {}
}

/**
 * Speaks text in Hindi with elder-friendly pacing and voice mapping
 */
export function speakHindi(text: string, onEnd?: () => void) {
  speakText(text, 'hi', onEnd);
}

/**
 * Text to Speech using Web Speech API with regional & Hindi voice optimization
 */
export function speakText(
  text: string, 
  lang: RegionalLanguage | string = 'hi', 
  onEnd?: () => void
) {
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
      as: 'bn-IN', // Assamese TTS frequently maps smoothly to bn-IN
      kha: 'en-IN', // Khasi Latin script phonetic fallback
      mni: 'hi-IN', // Manipuri fallback
      hi: 'hi-IN',
    };

    const targetLangCode = langMap[lang] || 'hi-IN';
    utterance.lang = targetLangCode;

    // Pick best matching native voice
    const bestVoice = findBestVoice(targetLangCode);
    if (bestVoice) {
      utterance.voice = bestVoice;
    }

    utterance.rate = 0.84; // Calm, deliberate cadence for elderly clarity
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

/**
 * Speaks game instructions with support for Hindi voice preference
 */
export function speakGamePrompt(
  prompts: {
    en: string;
    hi: string;
    as?: string;
    kha?: string;
    mni?: string;
  },
  currentLang: RegionalLanguage = 'hi',
  forceHindi = false,
  onEnd?: () => void
) {
  const pref = getGameVoicePreference();
  if (forceHindi || pref === 'hindi' || currentLang === 'hi') {
    speakText(prompts.hi || prompts.en, 'hi', onEnd);
  } else {
    const text = (prompts as Record<string, string | undefined>)[currentLang] || prompts.en;
    speakText(text || prompts.hi || prompts.en, currentLang, onEnd);
  }
}

export function stopSpeaking() {
  if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
    window.speechSynthesis.cancel();
  }
}

/**
 * Cheerful encouragement in Hindi for games
 */
export function speakGameCheerHindi(type: 'correct' | 'win' | 'try_again' | 'streak', customMsg?: string) {
  if (customMsg) {
    speakHindi(customMsg);
    return;
  }

  const cheers = {
    correct: [
      'बहुत बढ़िया! बिल्कुल सही उत्तर!',
      'शाबाश! आपने सही चुना है!',
      'शानदार! बहुत सुंदर प्रयास!'
    ],
    win: [
      'बधाई हो! आपने यह स्तर सफलतापूर्वक पूरा कर लिया है!',
      'अद्भुत! आपका प्रदर्शन बहुत शानदार रहा!',
      'शाबाश! आपने सभी लक्ष्य पूरे कर लिए हैं!'
    ],
    try_again: [
      'कोई बात नहीं, ध्यान से देखें और दोबारा प्रयास करें!',
      'अच्छा प्रयास! एक बार फिर कोशिश कीजिए!',
      'धीरज रखिए, आप यह आसानी से कर सकते हैं।'
    ],
    streak: [
      'वाह! लगातार सही उत्तर! कमाल कर दिया!',
      'बहुत खूब! आपकी याददाश्त बहुत तेज है!'
    ]
  };

  const list = cheers[type];
  const chosen = list[Math.floor(Math.random() * list.length)];
  speakHindi(chosen);
}

// Full Audio Alarm sequence: Harmonic melodic chime + Spoken voice prompt in regional language
export function triggerReminderAudioAlarm(
  title: string,
  spokenPrompt?: string,
  priority: 'high' | 'medium' | 'gentle' = 'medium',
  lang: RegionalLanguage | string = 'hi',
  onEnd?: () => void
): () => void {
  // 1. Play the resonant musical chime
  soundEffects.playReminderAlarm(priority);

  // 2. Queue the spoken verbal reminder in the user's regional or Hindi language after opening bell
  const speechText = spokenPrompt && spokenPrompt.trim().length > 0 
    ? spokenPrompt 
    : `ध्यान दें: ${title} का समय हो गया है।`;

  const timer = setTimeout(() => {
    speakText(speechText, lang, onEnd);
  }, 1500);

  // Return cancel/silence function
  return () => {
    clearTimeout(timer);
    stopSpeaking();
  };
}
