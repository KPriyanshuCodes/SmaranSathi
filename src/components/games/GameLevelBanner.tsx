import React from 'react';
import { ArrowLeft, Zap, Star, Trophy, Clock } from 'lucide-react';
import { RegionalLanguage, DifficultyLevel } from '../../types';
import { soundEffects } from '../../utils/soundEffects';

interface GameLevelBannerProps {
  level: number;
  totalLevels?: number;
  difficulty: DifficultyLevel;
  levelTitle?: string;
  winConditionText?: string;
  language?: RegionalLanguage;
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
  onExitToLevelSelect,
  attempts,
  maxAttempts,
  timeSec,
  timeLimitSec,
}) => {
  const difficultyBadge = {
    easy: 'bg-emerald-100 text-emerald-800 border-emerald-200',
    medium: 'bg-amber-100 text-amber-800 border-amber-200',
    hard: 'bg-rose-100 text-rose-800 border-rose-200',
  }[difficulty];

  return (
    <div className="bg-white rounded-2xl p-3 sm:p-4 border-2 border-slate-200 shadow-xs mb-4 space-y-2">
      {/* Top row: Back button, Level number & Progress bar, Difficulty badge */}
      <div className="flex items-center justify-between gap-3">
        <button
          id="game-level-exit-btn"
          onClick={() => {
            soundEffects.playGentleTap();
            onExitToLevelSelect();
          }}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold transition-all cursor-pointer shrink-0"
        >
          <ArrowLeft className="w-4 h-4" />
          <span className="hidden sm:inline">Levels</span>
        </button>

        {/* Level and Progress Bar */}
        <div className="flex-1 max-w-md mx-auto">
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

        {/* Live Stat Badges */}
        <div className="flex items-center gap-2 shrink-0">
          {typeof timeSec === 'number' && (
            <div className="flex items-center gap-1 px-2.5 py-1 rounded-xl bg-slate-100 text-slate-800 text-xs font-bold">
              <Clock className="w-3.5 h-3.5 text-blue-500" />
              <span>
                {timeSec}s
                {timeLimitSec ? ` / ${timeLimitSec}s` : ''}
              </span>
            </div>
          )}

          {typeof attempts === 'number' && (
            <div className="hidden sm:flex items-center gap-1 px-2.5 py-1 rounded-xl bg-slate-100 text-slate-800 text-xs font-bold">
              <span>
                Tries: {attempts}
                {maxAttempts ? ` / ${maxAttempts}` : ''}
              </span>
            </div>
          )}
        </div>
      </div>

      {/* Bottom row: Objective / Win Condition Pill */}
      {winConditionText && (
        <div className="flex items-center justify-between gap-2 px-3 py-1.5 rounded-xl bg-amber-50/70 border border-amber-200 text-amber-900 text-xs">
          <div className="flex items-center gap-1.5 min-w-0">
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
