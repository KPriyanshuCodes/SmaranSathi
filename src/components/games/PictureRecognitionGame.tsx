import React, { useState, useEffect, useRef } from 'react';
import { Volume2, ArrowLeft, CheckCircle2, HelpCircle, RefreshCw } from 'lucide-react';
import { CulturalItem, DifficultyLevel, RegionalLanguage, GameSession } from '../../types';
import { CULTURAL_ITEMS, UI_TRANSLATIONS } from '../../data/nerContent';
import { soundEffects, speakText } from '../../utils/speechAndAudio';

interface PictureRecognitionGameProps {
  difficulty: DifficultyLevel;
  language: RegionalLanguage;
  userId: string;
  onFinish: (sessionData: Omit<GameSession, 'id' | 'completed_at'>) => void;
  onBack: () => void;
}

export const PictureRecognitionGame: React.FC<PictureRecognitionGameProps> = ({
  difficulty,
  language,
  userId,
  onFinish,
  onBack,
}) => {
  const t = UI_TRANSLATIONS[language] || UI_TRANSLATIONS.en;
  const [currentIndex, setCurrentIndex] = useState(0);
  const [questions, setQuestions] = useState<{ item: CulturalItem; options: CulturalItem[] }[]>([]);
  const [selectedOptionId, setSelectedOptionId] = useState<string | null>(null);
  const [isCorrect, setIsCorrect] = useState<boolean | null>(null);
  const [attempts, setAttempts] = useState(0);
  const [mistakes, setMistakes] = useState(0);
  const [correctAnswersCount, setCorrectAnswersCount] = useState(0);
  const [startTime, setStartTime] = useState<number>(Date.now());
  const gameEndedRef = useRef(false);

  const totalQuestions = difficulty === 'hard' ? 5 : difficulty === 'medium' ? 4 : 3;

  const setupQuestions = () => {
    gameEndedRef.current = false;
    const shuffledItems = [...CULTURAL_ITEMS].sort(() => Math.random() - 0.5);
    const chosenItems = shuffledItems.slice(0, totalQuestions);

    const generated = chosenItems.map((targetItem) => {
      // Pick 2 other random distractors
      const distractors = CULTURAL_ITEMS.filter((i) => i.id !== targetItem.id)
        .sort(() => Math.random() - 0.5)
        .slice(0, 2);

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
  };

  useEffect(() => {
    setupQuestions();
  }, [difficulty]);

  const currentQuestion = questions[currentIndex];

  useEffect(() => {
    if (currentQuestion) {
      const targetName = currentQuestion.item.name[language] || currentQuestion.item.name.en;
      const prompt = `Can you recognize this treasure from ${currentQuestion.item.state_origin}?`;
      speakText(prompt, language);
    }
  }, [currentIndex, currentQuestion, language]);

  const handleOptionClick = (option: CulturalItem) => {
    if (selectedOptionId !== null) return; // already answered this slide

    setSelectedOptionId(option.id);
    setAttempts((prev) => prev + 1);

    const correct = option.id === currentQuestion.item.id;
    setIsCorrect(correct);

    if (correct) {
      soundEffects.playSuccessChime();
      const itemName = option.name[language] || option.name.en;
      speakText(`${t.well_done}! ${itemName}`, language);
      setCorrectAnswersCount((prev) => prev + 1);

      setTimeout(() => {
        advanceQuestion();
      }, 1500);
    } else {
      soundEffects.playGentleEncouragement();
      setMistakes((prev) => prev + 1);
      speakText('Almost there! Take a gentle look at the photo.', language);

      setTimeout(() => {
        // allow retry
        setSelectedOptionId(null);
        setIsCorrect(null);
      }, 1400);
    }
  };

  const advanceQuestion = () => {
    if (currentIndex + 1 < questions.length) {
      setCurrentIndex((prev) => prev + 1);
      setSelectedOptionId(null);
      setIsCorrect(null);
    } else {
      if (!gameEndedRef.current) {
        gameEndedRef.current = true;
        finishGame(attempts + 1, mistakes, correctAnswersCount + 1);
      }
    }
  };

  const finishGame = (finalAttempts: number, finalMistakes: number, finalCorrect: number) => {
    const elapsedSeconds = Math.max(3, (Date.now() - startTime) / 1000);
    const avgResponseTime = Number((elapsedSeconds / Math.max(1, finalAttempts)).toFixed(1));
    const accuracy = Math.max(
      50,
      Math.min(100, Math.round((questions.length / Math.max(questions.length, finalAttempts)) * 100))
    );

    let stars = 3;
    if (accuracy < 75 || finalMistakes >= 2) stars = 2;
    if (accuracy < 55) stars = 1;

    onFinish({
      user_id: userId,
      game_type: 'picture_recognition',
      accuracy,
      response_time: avgResponseTime,
      attempts: finalAttempts,
      mistakes: finalMistakes,
      completion_rate: 100,
      difficulty_level: difficulty,
      stars,
    });
  };

  if (!currentQuestion) return null;

  return (
    <div className="w-full max-w-3xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between bg-white p-4 sm:p-5 rounded-[32px] border-4 border-emerald-200 shadow-[0_8px_0_0_#86EFAC]">
        <button
          onClick={onBack}
          className="min-h-[52px] min-w-[52px] flex items-center justify-center p-3 rounded-2xl bg-orange-100 hover:bg-orange-200 text-gray-800 transition-transform active:scale-95 cursor-pointer"
        >
          <ArrowLeft className="w-7 h-7 text-gray-900" />
        </button>

        <div className="text-center">
          <h2 className="text-2xl md:text-3xl font-black text-gray-900">
            {t.picture_recognition}
          </h2>
          <p className="text-gray-600 font-bold text-sm md:text-base">
            Question {currentIndex + 1} of {questions.length}
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => {
              const targetName = currentQuestion.item.name[language] || currentQuestion.item.name.en;
              speakText(`What is this picture from ${currentQuestion.item.state_origin}?`, language);
            }}
            className="min-h-[52px] min-w-[52px] flex items-center justify-center p-3 rounded-2xl bg-orange-500 hover:bg-orange-600 text-white font-black shadow-[0_4px_0_0_#C2410C] active:translate-y-1 active:shadow-none transition-all cursor-pointer"
            title="Read question aloud"
          >
            <Volume2 className="w-6 h-6 text-white" />
          </button>
          <button
            onClick={setupQuestions}
            className="min-h-[52px] min-w-[52px] flex items-center justify-center p-3 rounded-2xl bg-orange-50 hover:bg-orange-100 text-gray-700 border border-orange-100 transition-transform active:scale-95 cursor-pointer"
            title="Restart"
          >
            <RefreshCw className="w-6 h-6" />
          </button>
        </div>
      </div>

      {/* Picture Card (Prominent, High-Resolution, Calm framing) */}
      <div className="bg-white rounded-[32px] p-5 md:p-6 border-4 border-emerald-200 shadow-[0_8px_0_0_#86EFAC] text-center space-y-4">
        <div className="relative overflow-hidden rounded-2xl border-2 border-emerald-100 max-h-72 flex items-center justify-center bg-emerald-50/50">
          <img
            src={currentQuestion.item.image_url}
            alt="Cultural treasure"
            className="w-full max-h-72 object-cover rounded-2xl"
          />
          <div className="absolute top-3 right-3 bg-gray-900/80 backdrop-blur text-white px-3 py-1.5 rounded-full text-xs md:text-sm font-bold">
            Origin: {currentQuestion.item.state_origin}
          </div>
        </div>

        <div className="flex items-center justify-center gap-2 text-gray-800 font-bold text-base md:text-lg">
          <HelpCircle className="w-6 h-6 text-emerald-600" />
          <span>Which familiar friend is shown in this picture?</span>
        </div>

        {/* Options (Minimum 65px height, large clear font) */}
        <div className="grid grid-cols-1 gap-3 pt-2">
          {currentQuestion.options.map((opt) => {
            const isSelected = selectedOptionId === opt.id;
            const isTarget = opt.id === currentQuestion.item.id;
            let btnStyle = 'bg-white hover:bg-emerald-50 border-2 border-emerald-100 shadow-[0_4px_0_0_#A7F3D0] text-gray-900 font-black cursor-pointer';

            if (isSelected) {
              if (isTarget) {
                btnStyle = 'bg-emerald-100 border-4 border-emerald-500 text-emerald-950 font-black shadow-[0_6px_0_0_#059669]';
              } else {
                btnStyle = 'bg-rose-50 border-2 border-rose-300 text-rose-900 font-bold';
              }
            }

            return (
              <button
                key={opt.id}
                id={`pic-opt-${opt.id}`}
                onClick={() => handleOptionClick(opt)}
                disabled={selectedOptionId !== null && isCorrect === true}
                className={`min-h-[64px] px-6 py-4 rounded-2xl text-lg md:text-xl flex items-center justify-between transition-all duration-200 active:scale-98 ${btnStyle}`}
              >
                <span>{opt.name[language] || opt.name.en}</span>
                {isSelected && isTarget && (
                  <CheckCircle2 className="w-7 h-7 text-emerald-600 shrink-0" />
                )}
              </button>
            );
          })}
        </div>

        {/* Cultural Description tidbit */}
        {selectedOptionId && isCorrect && (
          <div className="p-4 rounded-2xl bg-emerald-50 border-2 border-emerald-200 text-emerald-950 text-sm md:text-base leading-relaxed animate-fade-in font-medium">
            {currentQuestion.item.description[language] || currentQuestion.item.description.en}
          </div>
        )}
      </div>
    </div>
  );
};
