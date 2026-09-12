import React, { useState, useEffect, useRef } from 'react';
import { Volume2, RefreshCw, ArrowLeft, Play, Sparkles } from 'lucide-react';
import { DifficultyLevel, RegionalLanguage, GameSession, LevelFinishResult } from '../../types';
import { UI_TRANSLATIONS } from '../../data/nerContent';
import { soundEffects, speakText, speakHindi, speakGameCheerHindi } from '../../utils/speechAndAudio';
import { getLevelConfig, SequenceRecallLevelConfig } from '../../data/gameLevels';
import { GameLevelBanner } from './GameLevelBanner';

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
  difficulty?: DifficultyLevel;
  level?: number;
  language: RegionalLanguage;
  userId: string;
  onFinish: (sessionData: Omit<GameSession, 'id' | 'completed_at'>) => void;
  onFinishLevel?: (result: LevelFinishResult) => void;
  onBack: () => void;
  onExitToLevelSelect?: () => void;
}

export const SequenceRecallGame: React.FC<SequenceRecallGameProps> = ({
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
  const levelConfig = getLevelConfig<SequenceRecallLevelConfig>('sequence_recall', level);
  const activeDifficulty = levelConfig.difficulty || propDifficulty;

  const [sequence, setSequence] = useState<number[]>([]);
  const [userStep, setUserStep] = useState<number>(0);
  const [activeItem, setActiveItem] = useState<number | null>(null);
  const [isPlayingSequence, setIsPlayingSequence] = useState<boolean>(false);
  const [round, setRound] = useState<number>(1);
  const [totalRounds, setTotalRounds] = useState<number>(levelConfig.roundsCount || 2);
  const [attempts, setAttempts] = useState<number>(0);
  const [mistakes, setMistakes] = useState<number>(0);
  const [startTime, setStartTime] = useState<number>(Date.now());
  const [elapsedSec, setElapsedSec] = useState<number>(0);
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

  const startRound = (roundNum: number) => {
    const length = levelConfig.sequenceLength || 2;
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
    await new Promise((resolve) => setTimeout(resolve, 600));

    const stepInterval = levelConfig.stepIntervalMs || 900;
    const toneDuration = Math.min(450, Math.floor(stepInterval * 0.6));
    const pauseDuration = Math.max(150, Math.floor(stepInterval * 0.4));

    for (let i = 0; i < seq.length; i++) {
      const itemIdx = seq[i];
      setActiveItem(itemIdx);
      soundEffects.playSequenceTone(itemIdx);
      await new Promise((resolve) => setTimeout(resolve, toneDuration));
      setActiveItem(null);
      await new Promise((resolve) => setTimeout(resolve, pauseDuration));
    }

    setIsPlayingSequence(false);
  };

  const initGame = () => {
    gameEndedRef.current = false;
    setRound(1);
    setTotalRounds(levelConfig.roundsCount || 2);
    setAttempts(0);
    setMistakes(0);
    setStartTime(Date.now());
    setElapsedSec(0);
    startRound(1);
  };

  useEffect(() => {
    initGame();
  }, [level, propDifficulty]);

  useEffect(() => {
    const promptHindi = `स्वर और लय की याददाश्त स्तर ${level}। धुन सुनकर याद रखें और उसी क्रम में दोहराएं।`;
    speakHindi(promptHindi);
  }, [level]);

  const handleVoiceGuide = () => {
    soundEffects.playGentleTap();
    const hindiInstruction = `धुन को ध्यान से सुनें। जब धुन बजना बंद हो, तो उन्हीं वाद्ययंत्रों को उसी क्रम में दबाएं। कुल ${totalRounds} राउंड हैं।`;
    speakHindi(hindiInstruction);
  };

  const handleItemClick = (index: number) => {
    if (isPlayingSequence || sequence.length === 0) return;

    soundEffects.playSequenceTone(index);
    setActiveItem(index);
    setTimeout(() => setActiveItem(null), 250);

    const newAttempts = attempts + 1;
    setAttempts(newAttempts);

    if (sequence[userStep] === index) {
      // Correct step
      const nextStep = userStep + 1;
      setUserStep(nextStep);

      if (nextStep === sequence.length) {
        // Round completed successfully!
        soundEffects.playSuccessChime();

        if (round < totalRounds) {
          speakHindi('बहुत बढ़िया! अगला राउंड शुरू हो रहा है।');
          setTimeout(() => {
            setRound((prev) => prev + 1);
            startRound(round + 1);
          }, 1100);
        } else {
          // Completed all rounds!
          if (!gameEndedRef.current) {
            gameEndedRef.current = true;
            speakGameCheerHindi('win');
            setTimeout(() => {
              finishGame(newAttempts, mistakes);
            }, 400);
          }
        }
      }
    } else {
      // Mistake feedback
      soundEffects.playGentleEncouragement();
      const newMistakes = mistakes + 1;
      setMistakes(newMistakes);
      setUserStep(0);
      speakHindi('कोई बात नहीं, धुन फिर से सुनिए।');
      setTimeout(() => {
        playSequence(sequence);
      }, 1200);
    }
  };

  const finishGame = (finalAttempts: number, finalMistakes: number) => {
    const elapsedSeconds = Math.max(3, Math.round((Date.now() - startTime) / 1000));
    const avgResponseTime = Number((elapsedSeconds / Math.max(1, finalAttempts)).toFixed(1));
    const accuracy = Math.max(
      45,
      Math.min(100, Math.round((totalRounds / Math.max(totalRounds, totalRounds + finalMistakes)) * 100))
    );

    // Win condition check
    const won = finalMistakes <= levelConfig.maxMistakesAllowed;
    let stars = 0;
    if (won) {
      if (finalMistakes === 0) {
        stars = 3;
      } else if (finalMistakes <= 1) {
        stars = 2;
      } else {
        stars = 1;
      }
    }

    const calculatedScore = won ? Math.round(levelConfig.pointsBase + (accuracy * 2) + Math.max(0, 100 - elapsedSeconds * 2)) : Math.round(accuracy);

    if (onFinishLevel) {
      onFinishLevel({
        won,
        level,
        gameType: 'sequence_recall',
        score: calculatedScore,
        stars,
        timeSec: elapsedSeconds,
        accuracy,
        attempts: finalAttempts,
        mistakes: finalMistakes,
        completionRate: 100,
        winConditionMet: won
          ? `Completed all ${totalRounds} rounds with ${finalMistakes} mistakes (Allowed: ≤ ${levelConfig.maxMistakesAllowed}).`
          : undefined,
        failReason: !won
          ? `Made ${finalMistakes} mistakes (Maximum allowed: ${levelConfig.maxMistakesAllowed}). Listen closely to the rhythm and try again!`
          : undefined,
      });
    }

    onFinish({
      user_id: userId,
      game_type: 'sequence_recall',
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

  return (
    <div className="w-full max-w-3xl mx-auto space-y-4">
      {/* Universal Level Banner with Hindi Voice Guide */}
      <GameLevelBanner
        level={level}
        totalLevels={10}
        difficulty={activeDifficulty}
        levelTitle={levelConfig.title[language] || levelConfig.title.en}
        winConditionText={levelConfig.winConditionText[language] || levelConfig.winConditionText.en}
        hindiVoicePrompt={`स्वर और लय की याददाश्त स्तर ${level}। ${totalRounds} राउंड्स में धुन को ध्यान से सुनकर दोहराएं।`}
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
            {t.sequence_recall}
          </h2>
          <p className="text-slate-600 font-bold text-xs sm:text-sm">
            Round {round} of {totalRounds} · {levelConfig.sequenceLength} notes sequence
          </p>
        </div>

        <div className="flex items-center gap-2">
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
            onClick={() => playSequence(sequence)}
            disabled={isPlayingSequence}
            className="min-h-[48px] min-w-[48px] flex items-center justify-center p-2.5 rounded-2xl bg-orange-500 hover:bg-orange-600 text-white font-black shadow-xs active:translate-y-0.5 transition-all cursor-pointer disabled:opacity-50"
            title="Replay sequence sound"
          >
            <Play className="w-5 h-5 text-white" />
          </button>
          <button
            onClick={initGame}
            className="min-h-[48px] min-w-[48px] flex items-center justify-center p-2.5 rounded-2xl bg-slate-100 hover:bg-slate-200 text-slate-700 transition-transform active:scale-95 cursor-pointer"
            title="Restart"
          >
            <RefreshCw className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* Guidance Banner */}
      <div className="text-center py-3 px-6 rounded-2xl bg-blue-50 border border-blue-200 shadow-xs">
        <p className="text-base sm:text-lg font-black text-slate-800">
          {isPlayingSequence ? (
            <span className="text-blue-900 animate-pulse flex items-center justify-center gap-2">
              <Sparkles className="w-5 h-5 text-blue-600" /> धुन बज रही है, ध्यान से सुनें...
            </span>
          ) : (
            <span className="text-emerald-800 font-black">
              अब आपकी बारी! उसी क्रम में वाद्ययंत्रों पर टैप करें।
            </span>
          )}
        </p>
      </div>

      {/* Interactive Sequence Tiles (Large tap targets >= 90px) */}
      <div className="grid grid-cols-2 gap-3 sm:gap-4 md:gap-5 max-w-lg mx-auto pt-1">
        {SEQUENCE_ITEMS.map((item, idx) => {
          const isGlowing = activeItem === idx;
          const localizedName = item.label[language] || item.label.en;

          return (
            <button
              key={item.id}
              id={`seq-item-${item.id}`}
              onClick={() => handleItemClick(idx)}
              disabled={isPlayingSequence}
              className={`min-h-[130px] sm:min-h-[150px] rounded-[24px] border-3 p-4 flex flex-col items-center justify-center gap-2 transition-all duration-200 select-none ${
                isGlowing 
                  ? `${item.activeColor} shadow-md` 
                  : `${item.color} shadow-xs`
              } hover:brightness-105 active:scale-95 cursor-pointer`}
            >
              <span className="text-4xl sm:text-5xl filter drop-shadow-xs">
                {item.icon}
              </span>
              <span className="text-base sm:text-lg font-black text-slate-900 tracking-tight">
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
            className={`w-3.5 h-3.5 rounded-full transition-all ${
              i < userStep
                ? 'bg-orange-500 scale-110 shadow-xs'
                : 'bg-orange-200'
            }`}
          />
        ))}
      </div>
    </div>
  );
};
