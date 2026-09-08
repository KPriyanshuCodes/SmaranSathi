import React, { useEffect } from 'react';
import { 
  Trophy, 
  Star, 
  RotateCcw, 
  ArrowRight, 
  Grid, 
  Home, 
  Clock, 
  Award, 
  Target, 
  CheckCircle2, 
  AlertCircle,
  Sparkles
} from 'lucide-react';
import { GameType, RegionalLanguage, LevelFinishResult } from '../../types';
import { soundEffects } from '../../utils/soundEffects';

interface LevelCompleteModalProps {
  result: LevelFinishResult | null;
  language: RegionalLanguage;
  isOpen?: boolean;
  onNextLevel: () => void;
  onRetry?: () => void;
  onReplayLevel?: () => void;
  onBackToLevelSelect?: () => void;
  onExitToLevelSelect?: () => void;
  onReturnHome?: () => void;
}

export const LevelCompleteModal: React.FC<LevelCompleteModalProps> = ({
  result,
  language,
  isOpen = true,
  onNextLevel,
  onRetry,
  onReplayLevel,
  onBackToLevelSelect,
  onExitToLevelSelect,
  onReturnHome,
}) => {
  if (!result || !isOpen) return null;

  const handleRetryAction = onRetry || onReplayLevel || (() => {});
  const handleBackToSelectAction = onBackToLevelSelect || onExitToLevelSelect || (() => {});

  const {
    won,
    level,
    score,
    stars,
    timeSec,
    accuracy,
    attempts,
    mistakes,
    winConditionMet,
    failReason,
  } = result;

  const hasNextLevel = level < 10;

  useEffect(() => {
    if (won) {
      soundEffects.playSuccessChime();
    } else {
      soundEffects.playGentleTap(350);
    }
  }, [won]);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fade-in">
      <div 
        id="level-complete-modal-container"
        className="bg-white rounded-[32px] p-6 sm:p-8 max-w-lg w-full shadow-2xl border-2 border-slate-200 text-center space-y-6 relative overflow-hidden"
      >
        {/* Background glow celebration decoration */}
        {won && (
          <div className="absolute -top-24 -left-24 w-52 h-52 bg-amber-200/50 rounded-full blur-3xl pointer-events-none" />
        )}
        {won && (
          <div className="absolute -top-24 -right-24 w-52 h-52 bg-emerald-200/50 rounded-full blur-3xl pointer-events-none" />
        )}

        {/* Status Badge & Icon */}
        <div className="relative">
          <div
            className={`w-20 h-20 sm:w-24 sm:h-24 rounded-3xl mx-auto flex items-center justify-center shadow-lg transition-transform ${
              won
                ? 'bg-gradient-to-br from-amber-400 to-amber-500 text-white shadow-amber-200 ring-8 ring-amber-100'
                : 'bg-gradient-to-br from-blue-400 to-indigo-500 text-white shadow-blue-200 ring-8 ring-blue-50'
            }`}
          >
            {won ? (
              <Trophy className="w-10 h-10 sm:w-12 sm:h-12" />
            ) : (
              <RotateCcw className="w-10 h-10 sm:w-12 sm:h-12" />
            )}
          </div>

          <div className="mt-4 space-y-1">
            <span
              className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-black uppercase tracking-wider ${
                won
                  ? 'bg-emerald-100 text-emerald-800 border border-emerald-200'
                  : 'bg-blue-100 text-blue-800 border border-blue-200'
              }`}
            >
              {won ? <Sparkles className="w-3.5 h-3.5" /> : <AlertCircle className="w-3.5 h-3.5" />}
              <span>{won ? `Level ${level} Cleared!` : `Level ${level} Complete`}</span>
            </span>

            <h2 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
              {won ? 'Outstanding Achievement!' : 'Good Effort! Keep Going'}
            </h2>
            <p className="text-xs sm:text-sm text-slate-600 font-medium max-w-sm mx-auto">
              {won
                ? winConditionMet || 'You successfully satisfied all the level objectives with calmness and skill.'
                : failReason || 'Take your time and try again — steady practice strengthens long-term memory.'}
            </p>
          </div>
        </div>

        {/* 3-Star Rating (Animated) */}
        {won && (
          <div className="flex items-center justify-center gap-3 py-1">
            {[1, 2, 3].map((starIndex) => (
              <div
                key={starIndex}
                className={`p-2 sm:p-2.5 rounded-2xl border transition-all duration-300 transform ${
                  starIndex <= stars
                    ? 'bg-amber-50 border-amber-300 scale-110 shadow-xs'
                    : 'bg-slate-100 border-slate-200 opacity-40 scale-95'
                }`}
              >
                <Star
                  className={`w-7 h-7 sm:w-9 sm:h-9 ${
                    starIndex <= stars
                      ? 'fill-amber-400 text-amber-500'
                      : 'fill-slate-300 text-slate-300'
                  }`}
                />
              </div>
            ))}
          </div>
        )}

        {/* Stats Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 bg-slate-50 p-4 rounded-2xl border border-slate-200">
          <div className="bg-white p-2.5 rounded-xl border border-slate-100 shadow-2xs">
            <div className="text-[10px] uppercase font-bold text-slate-400 flex items-center justify-center gap-1">
              <Award className="w-3 h-3 text-amber-500" />
              <span>Score</span>
            </div>
            <div className="text-lg font-black text-slate-900 mt-0.5">{score}</div>
          </div>

          <div className="bg-white p-2.5 rounded-xl border border-slate-100 shadow-2xs">
            <div className="text-[10px] uppercase font-bold text-slate-400 flex items-center justify-center gap-1">
              <Clock className="w-3 h-3 text-blue-500" />
              <span>Time</span>
            </div>
            <div className="text-lg font-black text-slate-900 mt-0.5">{timeSec}s</div>
          </div>

          <div className="bg-white p-2.5 rounded-xl border border-slate-100 shadow-2xs">
            <div className="text-[10px] uppercase font-bold text-slate-400 flex items-center justify-center gap-1">
              <Target className="w-3 h-3 text-emerald-500" />
              <span>Accuracy</span>
            </div>
            <div className="text-lg font-black text-slate-900 mt-0.5">{accuracy}%</div>
          </div>

          <div className="bg-white p-2.5 rounded-xl border border-slate-100 shadow-2xs">
            <div className="text-[10px] uppercase font-bold text-slate-400 flex items-center justify-center gap-1">
              <CheckCircle2 className="w-3 h-3 text-indigo-500" />
              <span>Attempts</span>
            </div>
            <div className="text-lg font-black text-slate-900 mt-0.5">
              {attempts} {mistakes > 0 ? `(${mistakes} err)` : ''}
            </div>
          </div>
        </div>

        {/* Main Action Buttons */}
        <div className="space-y-2.5 pt-1">
          {won && hasNextLevel ? (
            <button
              id="level-complete-next-btn"
              onClick={() => {
                soundEffects.playGentleTap(600);
                onNextLevel();
              }}
              className="w-full py-4 px-6 rounded-2xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white font-black text-base flex items-center justify-center gap-2 shadow-lg shadow-emerald-600/20 hover:scale-[1.01] transition-all cursor-pointer"
            >
              <span>Next Level ({level + 1})</span>
              <ArrowRight className="w-5 h-5" />
            </button>
          ) : null}

          {/* Retry Level Button */}
          <button
            id="level-complete-retry-btn"
            onClick={() => {
              soundEffects.playGentleTap();
              handleRetryAction();
            }}
            className={`w-full py-3.5 px-6 rounded-2xl font-black text-sm flex items-center justify-center gap-2 transition-all cursor-pointer ${
              !won
                ? 'bg-blue-600 hover:bg-blue-700 text-white shadow-md'
                : 'bg-slate-100 hover:bg-slate-200 text-slate-800'
            }`}
          >
            <RotateCcw className="w-4 h-4" />
            <span>{won ? 'Replay This Level' : 'Try Again'}</span>
          </button>

          {/* Navigation Secondary Row */}
          <div className="flex gap-2.5">
            <button
              id="level-complete-select-levels-btn"
              onClick={() => {
                soundEffects.playGentleTap();
                handleBackToSelectAction();
              }}
              className="flex-1 py-3 px-4 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 font-bold text-xs sm:text-sm flex items-center justify-center gap-1.5 transition-all cursor-pointer"
            >
              <Grid className="w-4 h-4 text-slate-500" />
              <span>Select Level</span>
            </button>

            <button
              id="level-complete-home-btn"
              onClick={() => {
                soundEffects.playGentleTap();
                if (onReturnHome) {
                  onReturnHome();
                } else {
                  handleBackToSelectAction();
                }
              }}
              className="flex-1 py-3 px-4 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 font-bold text-xs sm:text-sm flex items-center justify-center gap-1.5 transition-all cursor-pointer"
            >
              <Home className="w-4 h-4 text-slate-500" />
              <span>Return Home</span>
            </button>
          </div>
        </div>

      </div>
    </div>
  );
};
