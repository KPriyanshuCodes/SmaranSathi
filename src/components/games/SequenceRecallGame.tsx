import React, { useState, useEffect, useRef } from 'react';
import { Volume2, RefreshCw, ArrowLeft, Play, Sparkles } from 'lucide-react';
import { DifficultyLevel, RegionalLanguage, GameSession } from '../../types';
import { UI_TRANSLATIONS } from '../../data/nerContent';
import { soundEffects, speakText } from '../../utils/speechAndAudio';

interface SequenceItem {
  id: number;
  label: Record<string, string>;
  icon: string;
  color: string;
  activeColor: string;
  soundIndex: number;
}

const SEQUENCE_ITEMS: SequenceItem[] = [
  {
    id: 0,
    label: { en: 'Bihu Dhol', as: 'বিহু ঢোল', kha: 'Ka Ksing', mni: 'ঢোল', hi: 'बिहू ढोल' },
    icon: '🥁',
    color: 'bg-amber-100 border-amber-300 text-amber-900',
    activeColor: 'bg-amber-400 border-amber-600 scale-105 shadow-xl',
    soundIndex: 0,
  },
  {
    id: 1,
    label: { en: 'Pepa Horn', as: 'ম’হৰ শিঙৰ পেঁপা', kha: 'Ka Pepa', mni: 'পেপা', hi: 'पेपा वाद्य' },
    icon: '🎺',
    color: 'bg-emerald-100 border-emerald-300 text-emerald-900',
    activeColor: 'bg-emerald-400 border-emerald-600 scale-105 shadow-xl',
    soundIndex: 1,
  },
  {
    id: 2,
    label: { en: 'Kaji Nemu', as: 'কাজি নেমু', kha: 'Sohjew', mni: 'চম্প্রা', hi: 'काजी नेमु' },
    icon: '🍋',
    color: 'bg-yellow-100 border-yellow-300 text-yellow-900',
    activeColor: 'bg-yellow-400 border-yellow-600 scale-105 shadow-xl',
    soundIndex: 2,
  },
  {
    id: 3,
    label: { en: 'Rhino Friend', as: 'এশিঙীয়া গঁড়', kha: 'Ka Rhino', mni: 'রাইনো', hi: 'गैंडा मित्र' },
    icon: '🦏',
    color: 'bg-stone-200 border-stone-400 text-stone-900',
    activeColor: 'bg-stone-400 border-stone-700 scale-105 shadow-xl',
    soundIndex: 3,
  },
];

interface SequenceRecallGameProps {
  difficulty: DifficultyLevel;
  language: RegionalLanguage;
  userId: string;
  onFinish: (sessionData: Omit<GameSession, 'id' | 'completed_at'>) => void;
  onBack: () => void;
}

export const SequenceRecallGame: React.FC<SequenceRecallGameProps> = ({
  difficulty,
  language,
  userId,
  onFinish,
  onBack,
}) => {
  const t = UI_TRANSLATIONS[language] || UI_TRANSLATIONS.en;
  const [sequence, setSequence] = useState<number[]>([]);
  const [userStep, setUserStep] = useState<number>(0);
  const [activeItem, setActiveItem] = useState<number | null>(null);
  const [isPlayingSequence, setIsPlayingSequence] = useState<boolean>(false);
  const [round, setRound] = useState<number>(1);
  const [totalRounds, setTotalRounds] = useState<number>(3);
  const [attempts, setAttempts] = useState<number>(0);
  const [mistakes, setMistakes] = useState<number>(0);
  const [startTime, setStartTime] = useState<number>(Date.now());
  const gameEndedRef = useRef(false);

  const getSequenceLength = (r: number) => {
    const base = difficulty === 'hard' ? 4 : difficulty === 'medium' ? 3 : 2;
    return base + (r - 1);
  };

  const startRound = (roundNum: number) => {
    const length = getSequenceLength(roundNum);
    const newSeq: number[] = [];
    for (let i = 0; i < length; i++) {
      newSeq.push(Math.floor(Math.random() * SEQUENCE_ITEMS.length));
    }
    setSequence(newSeq);
    setUserStep(0);
    playSequence(newSeq);
  };

  const playSequence = async (seq: number[]) => {
    setIsPlayingSequence(true);
    setActiveItem(null);

    // Initial pause before rhythm starts
    await new Promise((resolve) => setTimeout(resolve, 800));

    for (let i = 0; i < seq.length; i++) {
      const itemIdx = seq[i];
      setActiveItem(itemIdx);
      soundEffects.playSequenceTone(itemIdx);
      await new Promise((resolve) => setTimeout(resolve, 600));
      setActiveItem(null);
      await new Promise((resolve) => setTimeout(resolve, 250));
    }

    setIsPlayingSequence(false);
  };

  const initGame = () => {
    gameEndedRef.current = false;
    setRound(1);
    setTotalRounds(3);
    setAttempts(0);
    setMistakes(0);
    setStartTime(Date.now());
    startRound(1);
  };

  useEffect(() => {
    initGame();
  }, [difficulty]);

  useEffect(() => {
    const prompt = `${t.sequence_recall}. ${t.sequence_recall_desc}`;
    speakText(prompt, language);
  }, [language, t]);

  const handleItemClick = (index: number) => {
    if (isPlayingSequence || sequence.length === 0) return;

    soundEffects.playSequenceTone(index);
    setActiveItem(index);
    setTimeout(() => setActiveItem(null), 250);

    setAttempts((prev) => prev + 1);

    if (sequence[userStep] === index) {
      // Correct step
      const nextStep = userStep + 1;
      setUserStep(nextStep);

      if (nextStep === sequence.length) {
        // Round completed successfully!
        soundEffects.playSuccessChime();

        if (round < totalRounds) {
          setTimeout(() => {
            setRound((prev) => prev + 1);
            startRound(round + 1);
          }, 1000);
        } else {
          // Completed all rounds!
          if (!gameEndedRef.current) {
            gameEndedRef.current = true;
            finishGame(attempts + 1, mistakes);
          }
        }
      }
    } else {
      // Gentle mistake feedback - replay sequence gently without penalty
      soundEffects.playGentleEncouragement();
      setMistakes((prev) => prev + 1);
      setUserStep(0);
      setTimeout(() => {
        playSequence(sequence);
      }, 900);
    }
  };

  const finishGame = (finalAttempts: number, finalMistakes: number) => {
    const elapsedSeconds = Math.max(3, (Date.now() - startTime) / 1000);
    const avgResponseTime = Number((elapsedSeconds / Math.max(1, finalAttempts)).toFixed(1));
    const accuracy = Math.max(
      50,
      Math.min(100, Math.round((totalRounds / Math.max(totalRounds, totalRounds + finalMistakes)) * 100))
    );

    let stars = 3;
    if (accuracy < 75 || finalMistakes >= 3) stars = 2;
    if (accuracy < 55) stars = 1;

    onFinish({
      user_id: userId,
      game_type: 'sequence_recall',
      accuracy,
      response_time: avgResponseTime,
      attempts: finalAttempts,
      mistakes: finalMistakes,
      completion_rate: 100,
      difficulty_level: difficulty,
      stars,
    });
  };

  return (
    <div className="w-full max-w-3xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between bg-white p-4 sm:p-5 rounded-[32px] border-4 border-blue-200 shadow-[0_8px_0_0_#93C5FD]">
        <button
          onClick={onBack}
          className="min-h-[52px] min-w-[52px] flex items-center justify-center p-3 rounded-2xl bg-orange-100 hover:bg-orange-200 text-gray-800 transition-transform active:scale-95 cursor-pointer"
        >
          <ArrowLeft className="w-7 h-7 text-gray-900" />
        </button>

        <div className="text-center">
          <h2 className="text-2xl md:text-3xl font-black text-gray-900">
            {t.sequence_recall}
          </h2>
          <p className="text-gray-600 font-bold text-sm md:text-base">
            Round {round} of {totalRounds}
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => playSequence(sequence)}
            disabled={isPlayingSequence}
            className="min-h-[52px] min-w-[52px] flex items-center justify-center p-3 rounded-2xl bg-orange-500 hover:bg-orange-600 text-white font-black shadow-[0_4px_0_0_#C2410C] active:translate-y-1 active:shadow-none transition-all cursor-pointer disabled:opacity-50"
            title="Replay sequence sound"
          >
            <Play className="w-6 h-6 text-white" />
          </button>
          <button
            onClick={initGame}
            className="min-h-[52px] min-w-[52px] flex items-center justify-center p-3 rounded-2xl bg-orange-50 hover:bg-orange-100 text-gray-700 border border-orange-100 transition-transform active:scale-95 cursor-pointer"
            title="Restart"
          >
            <RefreshCw className="w-6 h-6" />
          </button>
        </div>
      </div>

      {/* Guidance Banner */}
      <div className="text-center py-3.5 px-6 rounded-2xl bg-blue-50 border-2 border-blue-200 shadow-sm">
        <p className="text-lg md:text-xl font-black text-gray-800">
          {isPlayingSequence ? (
            <span className="text-blue-900 animate-pulse flex items-center justify-center gap-2">
              <Sparkles className="w-6 h-6 text-blue-600" /> Please watch and listen to the rhythm...
            </span>
          ) : (
            <span className="text-emerald-800 font-black">
              Your turn! Tap the symbols in the same order.
            </span>
          )}
        </p>
      </div>

      {/* Interactive Sequence Tiles (Large tap targets >= 90px) */}
      <div className="grid grid-cols-2 gap-4 md:gap-6 max-w-xl mx-auto pt-2">
        {SEQUENCE_ITEMS.map((item, idx) => {
          const isGlowing = activeItem === idx;
          const localizedName = item.label[language] || item.label.en;

          return (
            <button
              key={item.id}
              id={`seq-item-${item.id}`}
              onClick={() => handleItemClick(idx)}
              disabled={isPlayingSequence}
              className={`min-h-[140px] md:min-h-[160px] rounded-[28px] border-4 p-5 flex flex-col items-center justify-center gap-3 transition-all duration-200 select-none ${
                isGlowing 
                  ? `${item.activeColor} shadow-[0_8px_0_0_#2563EB]` 
                  : `${item.color} shadow-[0_8px_0_0_#CBD5E1]`
              } hover:brightness-105 active:scale-95 cursor-pointer`}
            >
              <span className="text-5xl md:text-6xl filter drop-shadow-sm">
                {item.icon}
              </span>
              <span className="text-lg md:text-xl font-black text-gray-900 tracking-tight">
                {localizedName}
              </span>
            </button>
          );
        })}
      </div>

      {/* Progress Dots */}
      <div className="flex justify-center items-center gap-2 pt-2">
        {sequence.map((_, i) => (
          <div
            key={i}
            className={`w-4 h-4 rounded-full transition-all ${
              i < userStep
                ? 'bg-orange-500 scale-110 shadow-sm'
                : 'bg-orange-200'
            }`}
          />
        ))}
      </div>
    </div>
  );
};
