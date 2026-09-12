import React, { useEffect, useState } from 'react';
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
  Sparkles,
  Volume2
} from 'lucide-react';
import { GameType, RegionalLanguage, LevelFinishResult } from '../../types';
import { soundEffects, speakHindi, speakGameCheerHindi, stopSpeaking } from '../../utils/soundEffects';

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
      const starText = stars === 3 ? 'तीन सितारे' : stars === 2 ? 'दो सितारे' : 'एक सितारा';
      const prompt = `बधाई हो! आपने स्तर ${level} सफलतापूर्वक पूरा कर लिया है! आपको ${starText} मिले हैं।`;
      speakHindi(prompt);
    } else {
      soundEffects.playGentleTap(350);
      speakHindi(`स्तर ${level} का अच्छा प्रयास। थोड़ा और अभ्यास करें, आप निश्चित रूप से सफल होंगे।`);
    }
  }, [won, level, stars]);

  const handleSpeakResults = () => {
    soundEffects.playGentleTap();
    if (won) {
      const starText = stars === 3 ? 'तीन सितारे' : stars === 2 ? 'दो सितारे' : 'एक सितारा';
      speakHindi(`शानदार प्रदर्शन! स्तर ${level} पूरा हुआ। स्कोर ${score}, सटीकता ${accuracy} प्रतिशत, और ${starText} मिले हैं।`);
    } else {
      speakHindi(`स्तर ${level} का अच्छा प्रयास। आपका स्कोर ${score} है। दोबारा प्रयास करने के लिए पुनः प्रयास पर टैप करें।`);
    }
  };

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
              <span>{won ? `Level ${level} Cleared! / स्तर ${level} पूर्ण!` : `Level ${level} Complete`}</span>
            </span>

            <h2 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
              {won ? 'शानदार उपलब्धि! / Outstanding!' : 'अच्छा प्रयास! / Good Effort!'}
            </h2>
            <p className="text-xs sm:text-sm text-slate-600 font-medium max-w-sm mx-auto">
              {won
                ? winConditionMet || 'आपने धैर्य और एकाग्रता से यह स्तर पूरा कर लिया है।'
                : failReason || 'आराम से दोबारा अभ्यास करें — नियमित अभ्यास से याददाश्त तेज होती है।'}
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
              <span>Score / अंक</span>
            </div>
            <div className="text-lg font-black text-slate-900 mt-0.5">{score}</div>
          </div>

          <div className="bg-white p-2.5 rounded-xl border border-slate-100 shadow-2xs">
            <div className="text-[10px] uppercase font-bold text-slate-400 flex items-center justify-center gap-1">
              <Clock className="w-3 h-3 text-blue-500" />
              <span>Time / समय</span>
            </div>
            <div className="text-lg font-black text-slate-900 mt-0.5">{timeSec}s</div>
          </div>

          <div className="bg-white p-2.5 rounded-xl border border-slate-100 shadow-2xs">
            <div className="text-[10px] uppercase font-bold text-slate-400 flex items-center justify-center gap-1">
              <Target className="w-3 h-3 text-emerald-500" />
              <span>Accuracy / सटीकता</span>
            </div>
            <div className="text-lg font-black text-slate-900 mt-0.5">{accuracy}%</div>
          </div>

          <div className="bg-white p-2.5 rounded-xl border border-slate-100 shadow-2xs">
            <div className="text-[10px] uppercase font-bold text-slate-400 flex items-center justify-center gap-1">
              <CheckCircle2 className="w-3 h-3 text-indigo-500" />
              <span>Tries / प्रयास</span>
            </div>
            <div className="text-lg font-black text-slate-900 mt-0.5">
              {attempts} {mistakes > 0 ? `(${mistakes} err)` : ''}
            </div>
          </div>
        </div>

        {/* Hindi Voice Listen Button */}
        <div className="flex justify-center">
          <button
            onClick={handleSpeakResults}
            className="px-4 py-2 rounded-xl bg-amber-50 hover:bg-amber-100 border border-amber-300 text-amber-900 text-xs font-black flex items-center gap-1.5 transition-all cursor-pointer shadow-xs"
          >
            <Volume2 className="w-4 h-4 text-amber-700" />
            <span>परिणाम हिंदी में सुनें</span>
          </button>
        </div>

        {/* Main Action Buttons */}
        <div className="space-y-2.5 pt-1">
          {won && hasNextLevel ? (
            <button
              id="level-complete-next-btn"
              onClick={() => {
                soundEffects.playGentleTap(600);
                stopSpeaking();
                onNextLevel();
              }}
              className="w-full py-4 px-6 rounded-2xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white font-black text-base flex items-center justify-center gap-2 shadow-lg shadow-emerald-600/20 hover:scale-[1.01] transition-all cursor-pointer"
            >
              <span>Next Level ({level + 1}) / अगला स्तर</span>
              <ArrowRight className="w-5 h-5" />
            </button>
          ) : null}

          {/* Retry Level Button */}
          <button
            id="level-complete-retry-btn"
            onClick={() => {
              soundEffects.playGentleTap();
              stopSpeaking();
              handleRetryAction();
            }}
            className={`w-full py-3.5 px-6 rounded-2xl font-black text-sm flex items-center justify-center gap-2 transition-all cursor-pointer ${
              !won
                ? 'bg-blue-600 hover:bg-blue-700 text-white shadow-md'
                : 'bg-slate-100 hover:bg-slate-200 text-slate-800'
            }`}
          >
            <RotateCcw className="w-4 h-4" />
            <span>{won ? 'Replay Level / पुनः खेलें' : 'Try Again / फिर कोशिश करें'}</span>
          </button>

          {/* Navigation Secondary Row */}
          <div className="flex gap-2.5">
            <button
              id="level-complete-select-levels-btn"
              onClick={() => {
                soundEffects.playGentleTap();
                stopSpeaking();
                handleBackToSelectAction();
              }}
              className="flex-1 py-3 px-4 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 font-bold text-xs sm:text-sm flex items-center justify-center gap-1.5 transition-all cursor-pointer"
            >
              <Grid className="w-4 h-4 text-slate-500" />
              <span>Levels / स्तर सूची</span>
            </button>

            <button
              id="level-complete-home-btn"
              onClick={() => {
                soundEffects.playGentleTap();
                stopSpeaking();
                if (onReturnHome) {
                  onReturnHome();
                } else {
                  handleBackToSelectAction();
                }
              }}
              className="flex-1 py-3 px-4 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 font-bold text-xs sm:text-sm flex items-center justify-center gap-1.5 transition-all cursor-pointer"
            >
              <Home className="w-4 h-4 text-slate-500" />
              <span>Home / मुख्य पृष्ठ</span>
            </button>
          </div>
        </div>

      </div>
    </div>
  );
};
