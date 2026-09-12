import React, { useState, useEffect, useRef } from 'react';
import { Volume2, RefreshCw, ArrowLeft, CheckCircle2, Clock, HelpCircle } from 'lucide-react';
import { CulturalItem, DifficultyLevel, RegionalLanguage, GameSession, LevelFinishResult } from '../../types';
import { CULTURAL_ITEMS, UI_TRANSLATIONS } from '../../data/nerContent';
import { soundEffects, speakText, speakHindi, speakGameCheerHindi } from '../../utils/speechAndAudio';
import { getLevelConfig, PictureRecognitionLevelConfig } from '../../data/gameLevels';
import { GameLevelBanner } from './GameLevelBanner';

interface PictureRecognitionGameProps {
  difficulty?: DifficultyLevel;
  level?: number;
  language: RegionalLanguage;
  userId: string;
  onFinish: (sessionData: Omit<GameSession, 'id' | 'completed_at'>) => void;
  onFinishLevel?: (result: LevelFinishResult) => void;
  onBack: () => void;
  onExitToLevelSelect?: () => void;
}

export const PictureRecognitionGame: React.FC<PictureRecognitionGameProps> = ({
  difficulty: propDifficulty = 'easy',
  level = 1,
  language,
  userId,
  onFinish,
  onFinishLevel,
  onBack,
  onExitToLevelSelect,
}) => {
  const t = UI_TRANSLATIONS[language] || UI_TRANSLATIONS.en;
  const levelConfig = getLevelConfig<PictureRecognitionLevelConfig>('picture_recognition', level);
  const activeDifficulty = levelConfig.difficulty || propDifficulty;

  const [questions, setQuestions] = useState<{ item: CulturalItem; options: CulturalItem[] }[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [selectedOptionId, setSelectedOptionId] = useState<string | null>(null);
  const [isCorrect, setIsCorrect] = useState<boolean | null>(null);
  const [attempts, setAttempts] = useState(0);
  const [mistakes, setMistakes] = useState(0);
  const [correctAnswersCount, setCorrectAnswersCount] = useState(0);
  const [startTime, setStartTime] = useState<number>(Date.now());
  const [elapsedSec, setElapsedSec] = useState(0);
  const [questionTimerSec, setQuestionTimerSec] = useState<number | null>(levelConfig.timePerQuestionSec || null);
  const gameEndedRef = useRef(false);

  // Timer ticker
  useEffect(() => {
    const timer = setInterval(() => {
      if (!gameEndedRef.current) {
        setElapsedSec(Math.floor((Date.now() - startTime) / 1000));
      }
    }, 1000);
    return () => clearInterval(timer);
  }, [startTime]);

  // Question countdown timer if applicable
  useEffect(() => {
    if (!levelConfig.timePerQuestionSec || levelConfig.timePerQuestionSec <= 0) return;

    setQuestionTimerSec(levelConfig.timePerQuestionSec);
    const qTimer = setInterval(() => {
      setQuestionTimerSec((prev) => {
        if (prev === null) return null;
        if (prev <= 1) {
          clearInterval(qTimer);
          // Auto advance if timer expires
          handleTimeout();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(qTimer);
  }, [currentIndex, levelConfig.timePerQuestionSec]);

  const handleTimeout = () => {
    if (selectedOptionId !== null || gameEndedRef.current) return;
    soundEffects.playGentleEncouragement();
    setMistakes((prev) => prev + 1);
    setAttempts((prev) => prev + 1);
    speakHindi('समय समाप्त हुआ! आइए अगला प्रश्न देखें।');
    advanceQuestion(correctAnswersCount);
  };

  const totalQuestions = levelConfig.questionsCount || 3;
  const optionsCount = levelConfig.optionsCount || 3;

  const setupQuestions = () => {
    gameEndedRef.current = false;
    const shuffledItems = [...CULTURAL_ITEMS].sort(() => Math.random() - 0.5);
    const chosenItems = shuffledItems.slice(0, totalQuestions);

    const generated = chosenItems.map((targetItem) => {
      // Pick other random distractors
      const distractors = CULTURAL_ITEMS.filter((i) => i.id !== targetItem.id)
        .sort(() => Math.random() - 0.5)
        .slice(0, Math.max(1, optionsCount - 1));

      const options = [targetItem, ...distractors].sort(() => Math.random() - 0.5);
      return { item: targetItem, options };
    });

    setQuestions(generated);
    setCurrentIndex(0);
    setSelectedOptionId(null);
    setIsCorrect(null);
    setAttempts(0);
    setMistakes(0);
    setCorrectAnswersCount(0);
    setStartTime(Date.now());
    setElapsedSec(0);
  };

  useEffect(() => {
    setupQuestions();
  }, [level, propDifficulty]);

  const currentQuestion = questions[currentIndex];

  useEffect(() => {
    if (currentQuestion) {
      const stateOriginHindi = currentQuestion.item.state_origin || 'पूर्वोत्तर';
      const prompt = `प्रश्न ${currentIndex + 1}। क्या आप ${stateOriginHindi} की इस सांस्कृतिक धरोहर को पहचान सकते हैं?`;
      speakHindi(prompt);
    }
  }, [currentIndex, currentQuestion]);

  const handleVoiceGuide = () => {
    if (!currentQuestion) return;
    soundEffects.playGentleTap();
    const stateOrigin = currentQuestion.item.state_origin || 'पूर्वोत्तर';
    const hindiPrompt = `तस्वीर को ध्यान से देखें। यह ${stateOrigin} की धरोहर है। नीचे दिए गए विकल्पों में से सही नाम चुनें।`;
    speakHindi(hindiPrompt);
  };

  const handleOptionClick = (option: CulturalItem) => {
    if (selectedOptionId !== null) return;

    setSelectedOptionId(option.id);
    const newAttempts = attempts + 1;
    setAttempts(newAttempts);

    const correct = option.id === currentQuestion.item.id;
    setIsCorrect(correct);

    if (correct) {
      soundEffects.playSuccessChime();
      const itemNameHindi = option.name.hi || option.name.en;
      speakHindi(`बिल्कुल सही! यह ${itemNameHindi} है। बहुत बढ़िया!`);
      const newCorrect = correctAnswersCount + 1;
      setCorrectAnswersCount(newCorrect);

      setTimeout(() => {
        advanceQuestion(newCorrect);
      }, 1500);
    } else {
      soundEffects.playGentleEncouragement();
      const newMistakes = mistakes + 1;
      setMistakes(newMistakes);
      speakHindi('कोई बात नहीं, तस्वीर को ध्यान से देखें और अभ्यास जारी रखें।');

      setTimeout(() => {
        advanceQuestion(correctAnswersCount);
      }, 1500);
    }
  };

  const advanceQuestion = (finalCorrectCount: number) => {
    if (currentIndex + 1 < questions.length) {
      setCurrentIndex((prev) => prev + 1);
      setSelectedOptionId(null);
      setIsCorrect(null);
    } else {
      if (!gameEndedRef.current) {
        gameEndedRef.current = true;
        speakGameCheerHindi('win');
        setTimeout(() => {
          finishGame(attempts + 1, mistakes, finalCorrectCount);
        }, 400);
      }
    }
  };

  const finishGame = (finalAttempts: number, finalMistakes: number, finalCorrect: number) => {
    const elapsedSeconds = Math.max(3, Math.round((Date.now() - startTime) / 1000));
    const avgResponseTime = Number((elapsedSeconds / Math.max(1, finalAttempts)).toFixed(1));
    const accuracy = Math.max(
      35,
      Math.min(100, Math.round((finalCorrect / totalQuestions) * 100))
    );

    // Win condition check
    const won = finalCorrect >= levelConfig.minCorrectToPass;
    let stars = 0;
    if (won) {
      if (finalCorrect === totalQuestions) {
        stars = 3;
      } else if (finalCorrect >= totalQuestions - 1) {
        stars = 2;
      } else {
        stars = 1;
      }
    }

    const calculatedScore = won
      ? Math.round(levelConfig.pointsBase + (accuracy * 2) + Math.max(0, 100 - elapsedSeconds * 2))
      : Math.round(accuracy);

    if (onFinishLevel) {
      onFinishLevel({
        won,
        level,
        gameType: 'picture_recognition',
        score: calculatedScore,
        stars,
        timeSec: elapsedSeconds,
        accuracy,
        attempts: finalAttempts,
        mistakes: finalMistakes,
        completionRate: 100,
        winConditionMet: won
          ? `Correctly identified ${finalCorrect} out of ${totalQuestions} items (Needed: ≥ ${levelConfig.minCorrectToPass}).`
          : undefined,
        failReason: !won
          ? `Answered ${finalCorrect} out of ${totalQuestions} correctly (Needed: ≥ ${levelConfig.minCorrectToPass}). Relax and give it another try!`
          : undefined,
      });
    }

    onFinish({
      user_id: userId,
      game_type: 'picture_recognition',
      level_number: level,
      accuracy,
      response_time: avgResponseTime,
      attempts: finalAttempts,
      mistakes: finalMistakes,
      completion_rate: 100,
      difficulty_level: activeDifficulty,
      stars: Math.max(1, stars),
    });
  };

  if (!currentQuestion) {
    return (
      <div className="p-12 text-center text-slate-600 font-bold">
        Loading culturally rich photos...
      </div>
    );
  }

  return (
    <div className="w-full max-w-3xl mx-auto space-y-4">
      {/* Universal Level Banner with Hindi Voice */}
      <GameLevelBanner
        level={level}
        totalLevels={10}
        difficulty={activeDifficulty}
        levelTitle={levelConfig.title[language] || levelConfig.title.en}
        winConditionText={levelConfig.winConditionText[language] || levelConfig.winConditionText.en}
        hindiVoicePrompt={`चित्र पहचान स्तर ${level}। ${totalQuestions} में से कम से कम ${levelConfig.minCorrectToPass} सही पहचानें।`}
        onExitToLevelSelect={onExitToLevelSelect || onBack}
        attempts={attempts}
        timeSec={elapsedSec}
      />

      {/* Header */}
      <div className="flex items-center justify-between bg-white p-4 sm:p-5 rounded-[28px] border-2 border-slate-200 shadow-xs flex-wrap gap-2">
        <button
          onClick={onBack}
          className="min-h-[48px] min-w-[48px] flex items-center justify-center p-2.5 rounded-2xl bg-slate-100 hover:bg-slate-200 text-slate-800 transition-transform active:scale-95 cursor-pointer"
        >
          <ArrowLeft className="w-6 h-6 text-slate-900" />
        </button>

        <div className="text-center">
          <h2 className="text-xl sm:text-2xl font-black text-slate-900">
            {t.picture_recognition}
          </h2>
          <p className="text-slate-600 font-bold text-xs sm:text-sm">
            Question {currentIndex + 1} of {questions.length} · Score: {correctAnswersCount}
          </p>
        </div>

        <div className="flex items-center gap-2">
          {levelConfig.timePerQuestionSec && levelConfig.timePerQuestionSec > 0 && (
            <div className={`px-3 py-1.5 rounded-xl border flex items-center gap-1 text-xs font-black ${
              questionTimerSec && questionTimerSec <= 5 ? 'bg-rose-50 border-rose-300 text-rose-700 animate-pulse' : 'bg-slate-100 border-slate-200 text-slate-800'
            }`}>
              <Clock className="w-3.5 h-3.5" />
              <span>{questionTimerSec}s</span>
            </div>
          )}

          {/* Hindi Voice Guide */}
          <button
            onClick={handleVoiceGuide}
            className="min-h-[48px] px-3.5 py-2 rounded-2xl bg-amber-500 hover:bg-amber-600 text-white font-black shadow-xs active:translate-y-0.5 transition-all cursor-pointer flex items-center gap-1.5 text-xs sm:text-sm"
            title="Listen in Hindi"
          >
            <Volume2 className="w-5 h-5 text-white" />
            <span className="hidden sm:inline">हिंदी आवाज़</span>
          </button>
          <button
            onClick={setupQuestions}
            className="min-h-[48px] min-w-[48px] flex items-center justify-center p-2.5 rounded-2xl bg-slate-100 hover:bg-slate-200 text-slate-700 transition-transform active:scale-95 cursor-pointer"
            title="Restart"
          >
            <RefreshCw className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* Main Image Showcase (Large, clear, cultural photograph) */}
      <div className="relative rounded-[32px] overflow-hidden border-3 border-emerald-300 shadow-md bg-slate-900 max-h-[300px] flex items-center justify-center">
        <img
          src={currentQuestion.item.image_url}
          alt={currentQuestion.item.name.en}
          className="w-full h-full object-cover max-h-[300px]"
        />
        <div className="absolute bottom-3 left-4 right-4 flex items-center justify-between pointer-events-none">
          <span className="px-3 py-1 rounded-full bg-black/60 backdrop-blur-md text-white font-black text-xs">
            From {currentQuestion.item.state_origin}
          </span>
          <span className="px-3 py-1 rounded-full bg-emerald-600/80 backdrop-blur-md text-white font-bold text-xs uppercase tracking-wider">
            {currentQuestion.item.category}
          </span>
        </div>
      </div>

      {/* Guidance */}
      <div className="text-center py-2">
        <p className="text-sm sm:text-base font-black text-slate-800">
          तस्वीर में कौन सी सांस्कृतिक धरोहर दिखाई दे रही है?
        </p>
      </div>

      {/* Multiple-choice Options Grid (Large tap targets >= 60px) */}
      <div className={`grid gap-3 pt-1 ${optionsCount === 2 ? 'grid-cols-1 sm:grid-cols-2 max-w-xl mx-auto' : 'grid-cols-1 sm:grid-cols-2'}`}>
        {currentQuestion.options.map((option) => {
          const isSelected = selectedOptionId === option.id;
          const isTarget = option.id === currentQuestion.item.id;
          const showAnswerFeedback = selectedOptionId !== null;

          let btnStyle = 'bg-white hover:bg-slate-50 border-2 border-slate-200 text-slate-900 shadow-xs';
          if (showAnswerFeedback) {
            if (isTarget) {
              btnStyle = 'bg-emerald-100 border-2 border-emerald-500 text-emerald-950 font-black shadow-md scale-[1.01]';
            } else if (isSelected) {
              btnStyle = 'bg-rose-100 border-2 border-rose-400 text-rose-950 font-black';
            } else {
              btnStyle = 'bg-slate-100 border-2 border-slate-200 text-slate-400 opacity-60';
            }
          }

          return (
            <button
              key={option.id}
              id={`pic-opt-${option.id}`}
              onClick={() => handleOptionClick(option)}
              disabled={selectedOptionId !== null}
              className={`min-h-[64px] p-4 rounded-2xl flex items-center justify-between text-left transition-all duration-200 cursor-pointer ${btnStyle}`}
            >
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-slate-100 flex items-center justify-center font-black text-slate-700 text-sm">
                  🌸
                </div>
                <div>
                  <span className="text-sm sm:text-base font-black block leading-tight">
                    {option.name[language] || option.name.hi || option.name.en}
                  </span>
                  <span className="text-xs text-slate-500 font-medium">
                    {option.state_origin}
                  </span>
                </div>
              </div>

              {showAnswerFeedback && isTarget && (
                <CheckCircle2 className="w-6 h-6 text-emerald-600 shrink-0" />
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
};
