import React, { useEffect } from 'react';
import confetti from 'canvas-confetti';
import { Star, Smile, Sparkles, ArrowRight, Home, Volume2 } from 'lucide-react';
import { GameType, RegionalLanguage, AIRecommendation } from '../../types';
import { UI_TRANSLATIONS } from '../../data/nerContent';
import { soundEffects, speakText } from '../../utils/speechAndAudio';

interface GameFeedbackModalProps {
  isOpen: boolean;
  gameType: GameType;
  stars: number;
  language: RegionalLanguage;
  recommendation: AIRecommendation | null;
  onPlayNext: (nextGameType: GameType) => void;
  onReturnHome: () => void;
}

export const GameFeedbackModal: React.FC<GameFeedbackModalProps> = ({
  isOpen,
  stars,
  language,
  recommendation,
  onPlayNext,
  onReturnHome,
}) => {
  const t = UI_TRANSLATIONS[language] || UI_TRANSLATIONS.en;

  useEffect(() => {
    if (isOpen) {
      soundEffects.playSuccessChime();
      try {
        confetti({
          particleCount: 50,
          spread: 70,
          origin: { y: 0.6 },
          colors: ['#f59e0b', '#10b981', '#3b82f6', '#ec4899'],
        });
      } catch {}

      const msg = `${t.well_done} ${t.encouraging_subtext}`;
      speakText(msg, language);
    }
  }, [isOpen, language, t]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-gray-900/60 backdrop-blur-sm animate-fade-in">
      <div 
        id="game-feedback-dialog"
        className="w-full max-w-lg bg-white rounded-[36px] shadow-[0_12px_0_0_#FDE047] border-4 border-yellow-300 p-6 md:p-8 text-center space-y-6 animate-scale-up"
      >
        {/* Heartwarming visual header with Smileys & Stars */}
        <div className="flex justify-center -mt-2">
          <div className="w-20 h-20 bg-yellow-100 rounded-full flex items-center justify-center border-4 border-yellow-300 shadow-inner">
            <Smile className="w-12 h-12 text-yellow-700" />
          </div>
        </div>

        {/* Stars Display (No stressful numbers!) */}
        <div className="flex items-center justify-center gap-3">
          {[1, 2, 3].map((starIndex) => (
            <div
              key={starIndex}
              className={`transition-all duration-500 transform ${
                starIndex <= stars ? 'scale-110 text-yellow-400' : 'text-gray-200'
              }`}
            >
              <Star
                className="w-12 h-12 md:w-14 md:h-14 fill-current drop-shadow-sm"
              />
            </div>
          ))}
        </div>

        {/* Big Encouraging Message */}
        <div className="space-y-2">
          <h2 className="text-2xl md:text-3xl font-black text-gray-900 tracking-tight">
            {t.well_done}
          </h2>
          <p className="text-lg md:text-xl text-gray-700 font-bold">
            {t.encouraging_subtext}
          </p>
        </div>

        {/* Voice replay button */}
        <button
          onClick={() => speakText(`${t.well_done} ${t.encouraging_subtext}`, language)}
          className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full bg-orange-100 text-orange-950 border border-orange-200 hover:bg-orange-200 text-sm font-black transition-colors cursor-pointer"
        >
          <Volume2 className="w-5 h-5 text-orange-700" />
          <span>{t.voice_guide}</span>
        </button>

        {/* Gentle AI Recommendation note */}
        {recommendation && (
          <div className="p-4 rounded-2xl bg-emerald-50 border-2 border-emerald-200 text-left">
            <div className="flex items-center gap-2 text-emerald-800 font-black text-sm mb-1">
              <Sparkles className="w-4 h-4 text-emerald-600" />
              <span>Recommended Next Step</span>
            </div>
            <p className="text-gray-700 text-sm leading-relaxed font-medium">
              {recommendation.rationale}
            </p>
          </div>
        )}

        {/* Large Action Buttons (minimum 60px touch height) */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
          <button
            id="feedback-return-home-btn"
            onClick={onReturnHome}
            className="min-h-[60px] flex items-center justify-center gap-3 px-6 py-4 rounded-2xl bg-orange-50 hover:bg-orange-100 text-gray-800 font-black text-lg md:text-xl border-2 border-orange-200 transition-all active:scale-95 shadow-sm cursor-pointer"
          >
            <Home className="w-6 h-6 text-gray-700" />
            <span>{t.return_home}</span>
          </button>

          <button
            id="feedback-play-next-btn"
            onClick={() => onPlayNext(recommendation?.next_game_type || 'picture_recognition')}
            className="min-h-[60px] flex items-center justify-center gap-3 px-6 py-4 rounded-2xl bg-orange-500 hover:bg-orange-600 text-white font-black text-lg md:text-xl shadow-[0_6px_0_0_#C2410C] active:translate-y-1 active:shadow-none transition-all border-2 border-orange-600 cursor-pointer"
          >
            <span>{t.play_next}</span>
            <ArrowRight className="w-6 h-6 text-white" />
          </button>
        </div>

        {/* Subtle Ethical Guardrail Disclaimer */}
        <p className="text-[12px] text-gray-500 italic pt-1 border-t border-gray-100">
          {t.disclaimer}
        </p>
      </div>
    </div>
  );
};
