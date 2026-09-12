import React, { useState } from 'react';
import { ArrowLeft, Zap, Star, Trophy, Clock, Volume2, VolumeX, Square } from 'lucide-react';
import { RegionalLanguage, DifficultyLevel } from '../../types';
import { 
  soundEffects, 
  speakHindi, 
  stopSpeaking,
  getGameVoicePreference,
  setGameVoicePreference,
  useVoiceMute,
  GameVoiceMode
} from '../../utils/soundEffects';

interface GameLevelBannerProps {
  level: number;
  totalLevels?: number;
  difficulty: DifficultyLevel;
  levelTitle?: string;
  winConditionText?: string;
  language?: RegionalLanguage;
  hindiVoicePrompt?: string;
  onExitToLevelSelect: () => void;
  attempts?: number;
  maxAttempts?: number;
  timeSec?: number;
  timeLimitSec?: number;
}

export const GameLevelBanner: React.FC<GameLevelBannerProps> = ({
  level,
  totalLevels = 10,
  difficulty,
  levelTitle,
  winConditionText,
  language = 'hi',
  hindiVoicePrompt,
  onExitToLevelSelect,
  attempts,
  maxAttempts,
  timeSec,
  timeLimitSec,
}) => {
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [voiceMode, setVoiceMode] = useState<GameVoiceMode>(getGameVoicePreference());
  const { isMuted, toggleMute, setMuted } = useVoiceMute();

  const difficultyBadge = {
    easy: 'bg-emerald-100 text-emerald-800 border-emerald-200',
    medium: 'bg-amber-100 text-amber-800 border-amber-200',
    hard: 'bg-rose-100 text-rose-800 border-rose-200',
  }[difficulty];

  const handleToggleVoice = () => {
    if (isSpeaking) {
      stopSpeaking();
      setIsSpeaking(false);
      return;
    }

    // If currently muted, automatically unmute when user explicitly requests voice playback
    if (isMuted) {
      setMuted(false);
    }

    soundEffects.playGentleTap();
    setIsSpeaking(true);

    const defaultHindiGoal = winConditionText 
      ? `स्तर ${level} का लक्ष्य है: ${winConditionText}` 
      : `स्तर ${level} खेलें और आनंद लें।`;
      
    const textToSpeak = hindiVoicePrompt || `${levelTitle ? `${levelTitle}। ` : ''}${defaultHindiGoal}`;

    speakHindi(textToSpeak, () => {
      setIsSpeaking(false);
    });
  };

  const handleToggleMuteBtn = () => {
    soundEffects.playGentleTap();
    if (isSpeaking) {
      stopSpeaking();
      setIsSpeaking(false);
    }
    toggleMute();
  };

  const handleToggleVoiceMode = () => {
    soundEffects.playGentleTap();
    const newMode = voiceMode === 'hindi' ? 'regional' : 'hindi';
    setVoiceMode(newMode);
    setGameVoicePreference(newMode);
    
    if (newMode === 'hindi' && !isMuted) {
      speakHindi('हिंदी आवाज़ सहायक सक्रिय है।');
    }
  };

  return (
    <div className="bg-white rounded-2xl p-3 sm:p-4 border-2 border-slate-200 shadow-xs mb-4 space-y-2.5">
      {/* Top row: Back button, Level number & Progress bar, Voice & Stats */}
      <div className="flex items-center justify-between gap-2.5 flex-wrap sm:flex-nowrap">
        <button
          id="game-level-exit-btn"
          onClick={() => {
            soundEffects.playGentleTap();
            stopSpeaking();
            onExitToLevelSelect();
          }}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold transition-all cursor-pointer shrink-0"
        >
          <ArrowLeft className="w-4 h-4" />
          <span className="hidden sm:inline">Levels</span>
        </button>

        {/* Level and Progress Bar */}
        <div className="flex-1 min-w-[200px] max-w-md mx-auto order-3 sm:order-2 w-full sm:w-auto">
          <div className="flex items-center justify-between text-xs font-black text-slate-800 mb-1">
            <span className="flex items-center gap-1.5">
              <Trophy className="w-3.5 h-3.5 text-amber-500" />
              <span>Level {level} / {totalLevels}</span>
              {levelTitle && <span className="text-slate-500 font-semibold hidden md:inline">· {levelTitle}</span>}
            </span>
            <span className={`text-[10px] uppercase font-black px-2 py-0.5 rounded-full border ${difficultyBadge}`}>
              {difficulty}
            </span>
          </div>

          {/* 10-step mini segmented progress bar */}
          <div className="grid grid-cols-10 gap-1 h-2 rounded-full overflow-hidden bg-slate-100 p-0.5">
            {Array.from({ length: totalLevels }).map((_, i) => {
              const step = i + 1;
              const isPast = step < level;
              const isCurrent = step === level;
              return (
                <div
                  key={step}
                  className={`rounded-full transition-all duration-300 ${
                    isCurrent
                      ? 'bg-blue-600 animate-pulse'
                      : isPast
                      ? 'bg-emerald-500'
                      : 'bg-slate-200'
                  }`}
                  title={`Level ${step}`}
                />
              );
            })}
          </div>
        </div>

        {/* Voice Control & Live Stats */}
        <div className="flex items-center gap-1.5 sm:gap-2 shrink-0 order-2 sm:order-3">
          {/* Dedicated Hindi Voice Assist Button */}
          <button
            id="hindi-voice-assist-btn"
            onClick={handleToggleVoice}
            className={`flex items-center gap-1.5 px-2.5 sm:px-3 py-1.5 rounded-xl text-xs font-black transition-all cursor-pointer shadow-xs border ${
              isSpeaking
                ? 'bg-amber-500 text-white border-amber-600 animate-pulse ring-2 ring-amber-300'
                : isMuted
                ? 'bg-slate-100 hover:bg-slate-200 text-slate-600 border-slate-300'
                : 'bg-amber-50 hover:bg-amber-100 text-amber-900 border-amber-300'
            }`}
            title={isMuted ? 'Voice is Muted (Click to Unmute & Listen)' : 'Listen in Hindi'}
          >
            {isSpeaking ? (
              <>
                <Square className="w-3.5 h-3.5 fill-current" />
                <span>रोकें</span>
              </>
            ) : isMuted ? (
              <>
                <VolumeX className="w-3.5 h-3.5 text-slate-500" />
                <span className="hidden xs:inline">आवाज़ बंद</span>
                <span className="xs:hidden">म्यूट</span>
              </>
            ) : (
              <>
                <Volume2 className="w-3.5 h-3.5 text-amber-700" />
                <span className="hidden xs:inline">हिंदी आवाज़</span>
                <span className="xs:hidden">हिंदी</span>
              </>
            )}
          </button>

          {/* Quick Mute / Unmute Toggle Button */}
          <button
            id="game-banner-mute-toggle-btn"
            onClick={handleToggleMuteBtn}
            className={`flex items-center justify-center p-1.5 sm:px-2.5 sm:py-1.5 rounded-xl text-xs font-black transition-all cursor-pointer shadow-xs border ${
              isMuted
                ? 'bg-rose-100 text-rose-800 border-rose-300 hover:bg-rose-200 ring-1 ring-rose-300'
                : 'bg-slate-100 hover:bg-slate-200 text-slate-700 border-slate-200'
            }`}
            title={isMuted ? 'Voice is Muted - Click to Unmute' : 'Voice is Active - Click to Mute'}
            aria-label={isMuted ? 'Unmute game voice' : 'Mute game voice'}
          >
            {isMuted ? (
              <>
                <VolumeX className="w-3.5 h-3.5 text-rose-600 shrink-0" />
                <span className="hidden md:inline font-bold">Unmute</span>
              </>
            ) : (
              <>
                <Volume2 className="w-3.5 h-3.5 text-slate-600 shrink-0" />
                <span className="hidden md:inline font-bold">Mute</span>
              </>
            )}
          </button>

          {typeof timeSec === 'number' && (
            <div className="flex items-center gap-1 px-2.5 py-1.5 rounded-xl bg-slate-100 text-slate-800 text-xs font-bold">
              <Clock className="w-3.5 h-3.5 text-blue-500" />
              <span>
                {timeSec}s
                {timeLimitSec ? ` / ${timeLimitSec}s` : ''}
              </span>
            </div>
          )}

          {typeof attempts === 'number' && (
            <div className="hidden md:flex items-center gap-1 px-2.5 py-1.5 rounded-xl bg-slate-100 text-slate-800 text-xs font-bold">
              <span>
                Tries: {attempts}
                {maxAttempts ? ` / ${maxAttempts}` : ''}
              </span>
            </div>
          )}
        </div>
      </div>

      {/* Bottom row: Objective / Win Condition Pill with Hindi Guide */}
      {winConditionText && (
        <div className="flex items-center justify-between gap-2 px-3 py-2 rounded-xl bg-amber-50/70 border border-amber-200 text-amber-900 text-xs">
          <div className="flex items-center gap-2 min-w-0">
            <Zap className="w-3.5 h-3.5 text-amber-600 shrink-0" />
            <span className="font-semibold truncate">
              <span className="font-bold">Goal:</span> {winConditionText}
            </span>
          </div>
          <div className="flex items-center gap-1 text-[11px] font-bold text-amber-700 shrink-0">
            <Star className="w-3 h-3 fill-amber-400 text-amber-500" />
            <span>Pass to unlock Level {Math.min(level + 1, 10)}</span>
          </div>
        </div>
      )}
    </div>
  );
};
