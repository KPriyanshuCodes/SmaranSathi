import React, { useState, useEffect, useRef } from 'react';
import { Volume2, RefreshCw, ArrowLeft, CheckCircle2, HelpCircle } from 'lucide-react';
import { CulturalItem, DifficultyLevel, RegionalLanguage, GameSession, LevelFinishResult } from '../../types';
import { CULTURAL_ITEMS, UI_TRANSLATIONS } from '../../data/nerContent';
import { soundEffects, speakText } from '../../utils/speechAndAudio';
import { getLevelConfig, MemoryMatchLevelConfig } from '../../data/gameLevels';
import { GameLevelBanner } from './GameLevelBanner';

interface MemoryCard {
  uniqueId: string;
  itemId: string;
  item: CulturalItem;
  isFlipped: boolean;
  isMatched: boolean;
}

interface MemoryMatchGameProps {
  difficulty?: DifficultyLevel;
  level?: number;
  language: RegionalLanguage;
  userId: string;
  onFinish: (sessionData: Omit<GameSession, 'id' | 'completed_at'>) => void;
  onFinishLevel?: (result: LevelFinishResult) => void;
  onBack: () => void;
  onExitToLevelSelect?: () => void;
}

export const MemoryMatchGame: React.FC<MemoryMatchGameProps> = ({
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
  const levelConfig = getLevelConfig<MemoryMatchLevelConfig>('memory_match', level);
  const activeDifficulty = levelConfig.difficulty || propDifficulty;

  const [cards, setCards] = useState<MemoryCard[]>([]);
  const [flippedCards, setFlippedCards] = useState<MemoryCard[]>([]);
  const [matchedPairsCount, setMatchedPairsCount] = useState(0);
  const [totalPairs, setTotalPairs] = useState(levelConfig.pairsCount || 2);
  const [attempts, setAttempts] = useState(0);
  const [mistakes, setMistakes] = useState(0);
  const [startTime, setStartTime] = useState<number>(Date.now());
  const [elapsedSec, setElapsedSec] = useState(0);
  const [isProcessing, setIsProcessing] = useState(false);
  const [voiceInstructionGiven, setVoiceInstructionGiven] = useState(false);
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

  // Setup game board based on level config
  const setupGame = () => {
    gameEndedRef.current = false;
    const pairsNeeded = levelConfig.pairsCount || 2;
    setTotalPairs(pairsNeeded);

    // Pick items from cultural pack
    const selectedItems = CULTURAL_ITEMS.slice(0, pairsNeeded);
    const cardDeck: MemoryCard[] = [];

    selectedItems.forEach((item) => {
      cardDeck.push({
        uniqueId: `${item.id}-1`,
        itemId: item.id,
        item,
        isFlipped: !!levelConfig.previewPeekMs,
        isMatched: false,
      });
      cardDeck.push({
        uniqueId: `${item.id}-2`,
        itemId: item.id,
        item,
        isFlipped: !!levelConfig.previewPeekMs,
        isMatched: false,
      });
    });

    // Shuffle cards gently
    const shuffled = [...cardDeck].sort(() => Math.random() - 0.5);
    setCards(shuffled);
    setFlippedCards([]);
    setMatchedPairsCount(0);
    setAttempts(0);
    setMistakes(0);
    setStartTime(Date.now());
    setElapsedSec(0);
    setIsProcessing(false);

    // Preview peek if specified in level config
    if (levelConfig.previewPeekMs && levelConfig.previewPeekMs > 0) {
      setIsProcessing(true);
      setTimeout(() => {
        setCards((prev) => prev.map((c) => ({ ...c, isFlipped: false })));
        setIsProcessing(false);
        soundEffects.playGentleTap(400);
      }, levelConfig.previewPeekMs);
    }
  };

  useEffect(() => {
    setupGame();
  }, [level, propDifficulty]);

  // Voice instruction on mount
  useEffect(() => {
    if (!voiceInstructionGiven) {
      const prompt = `${t.memory_match}. ${t.memory_match_desc}`;
      speakText(prompt, language);
      setVoiceInstructionGiven(true);
    }
  }, [language, voiceInstructionGiven, t]);

  // Handle card tap
  const handleCardClick = (card: MemoryCard) => {
    if (isProcessing || card.isFlipped || card.isMatched) return;

    soundEffects.playGentleTap(520);

    // Flip the clicked card
    const updatedCards = cards.map((c) =>
      c.uniqueId === card.uniqueId ? { ...c, isFlipped: true } : c
    );
    setCards(updatedCards);

    const newFlipped = [...flippedCards, card];
    setFlippedCards(newFlipped);

    if (newFlipped.length === 2) {
      setIsProcessing(true);
      const newAttempts = attempts + 1;
      setAttempts(newAttempts);

      const [first, second] = newFlipped;
      if (first.itemId === second.itemId) {
        // MATCH!
        soundEffects.playSuccessChime();
        speakText(first.item.name[language] || first.item.name.en, language);

        setTimeout(() => {
          setCards((prev) =>
            prev.map((c) =>
              c.itemId === first.itemId ? { ...c, isMatched: true } : c
            )
          );
          setFlippedCards([]);
          const nextCount = matchedPairsCount + 1;
          setMatchedPairsCount(nextCount);
          setIsProcessing(false);

          if (nextCount >= totalPairs && !gameEndedRef.current) {
            gameEndedRef.current = true;
            setTimeout(() => {
              finishGame(newAttempts, mistakes, nextCount, totalPairs);
            }, 300);
          }
        }, 600);
      } else {
        // NO MATCH - gentle flip back (no harsh sounds)
        soundEffects.playGentleEncouragement();
        const newMistakes = mistakes + 1;
        setMistakes(newMistakes);
        setTimeout(() => {
          setCards((prev) =>
            prev.map((c) =>
              c.uniqueId === first.uniqueId || c.uniqueId === second.uniqueId
                ? { ...c, isFlipped: false }
                : c
            )
          );
          setFlippedCards([]);
          setIsProcessing(false);
        }, levelConfig.flipBackDelayMs || 1200);
      }
    }
  };

  const finishGame = (
    finalAttempts: number,
    finalMistakes: number,
    matchedCount: number,
    pairsCount: number
  ) => {
    const elapsedSeconds = Math.max(2, Math.round((Date.now() - startTime) / 1000));
    const avgResponseTime = Number((elapsedSeconds / Math.max(1, finalAttempts)).toFixed(1));
    const accuracy = Math.max(
      40,
      Math.min(100, Math.round(((pairsCount) / Math.max(pairsCount, finalAttempts)) * 100))
    );

    // Evaluate Level Win Condition
    const won = finalAttempts <= levelConfig.maxAttempts;
    let stars = 0;
    if (won) {
      if (finalAttempts <= pairsCount + 1) {
        stars = 3;
      } else if (finalAttempts <= levelConfig.maxAttempts - 1) {
        stars = 2;
      } else {
        stars = 1;
      }
    }

    const calculatedScore = won ? Math.round(levelConfig.pointsBase + (accuracy * 2) + Math.max(0, 100 - elapsedSeconds * 2)) : Math.round(accuracy);

    // Call Level Result handler for the level progression modal
    if (onFinishLevel) {
      onFinishLevel({
        won,
        level,
        gameType: 'memory_match',
        score: calculatedScore,
        stars,
        timeSec: elapsedSeconds,
        accuracy,
        attempts: finalAttempts,
        mistakes: finalMistakes,
        completionRate: Math.round((matchedCount / pairsCount) * 100),
        winConditionMet: won
          ? `Matched all ${pairsCount} pairs in ${finalAttempts} attempts (Max allowed: ${levelConfig.maxAttempts}).`
          : undefined,
        failReason: !won
          ? `Used ${finalAttempts} attempts (Target was within ${levelConfig.maxAttempts} attempts). Take a gentle breath and try again!`
          : undefined,
      });
    }

    // Call standard onFinish for patient telemetry and caregiver analytics
    onFinish({
      user_id: userId,
      game_type: 'memory_match',
      level_number: level,
      accuracy,
      response_time: avgResponseTime,
      attempts: finalAttempts,
      mistakes: finalMistakes,
      completion_rate: Math.round((matchedCount / pairsCount) * 100),
      difficulty_level: activeDifficulty,
      stars: Math.max(1, stars),
    });
  };

  return (
    <div className="w-full max-w-4xl mx-auto space-y-4">
      {/* Universal Level Banner */}
      <GameLevelBanner
        level={level}
        totalLevels={10}
        difficulty={activeDifficulty}
        levelTitle={levelConfig.title[language] || levelConfig.title.en}
        winConditionText={levelConfig.winConditionText[language] || levelConfig.winConditionText.en}
        onExitToLevelSelect={onExitToLevelSelect || onBack}
        attempts={attempts}
        maxAttempts={levelConfig.maxAttempts}
        timeSec={elapsedSec}
      />

      {/* Game Header with Navigation & Controls */}
      <div className="flex items-center justify-between bg-white p-4 sm:p-5 rounded-[28px] border-2 border-slate-200 shadow-xs">
        <button
          id="game-back-home"
          onClick={onBack}
          className="min-h-[48px] min-w-[48px] flex items-center justify-center p-2.5 rounded-2xl bg-slate-100 hover:bg-slate-200 text-slate-800 transition-transform active:scale-95 cursor-pointer"
          aria-label="Back to home"
        >
          <ArrowLeft className="w-6 h-6 text-slate-900" />
        </button>

        <div className="text-center">
          <h2 className="text-xl sm:text-2xl font-black text-slate-900">
            {t.memory_match}
          </h2>
          <p className="text-slate-600 font-bold text-xs sm:text-sm">
            {matchedPairsCount} of {totalPairs} pairs matched · {attempts} / {levelConfig.maxAttempts} tries
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            id="game-voice-instruct"
            onClick={() => speakText(`${t.memory_match}. ${t.memory_match_desc}`, language)}
            className="min-h-[48px] min-w-[48px] flex items-center justify-center p-2.5 rounded-2xl bg-orange-500 hover:bg-orange-600 text-white font-black shadow-xs active:translate-y-0.5 transition-all cursor-pointer"
            title="Read instructions aloud"
          >
            <Volume2 className="w-5 h-5 text-white" />
          </button>
          <button
            id="game-restart"
            onClick={setupGame}
            className="min-h-[48px] min-w-[48px] flex items-center justify-center p-2.5 rounded-2xl bg-slate-100 hover:bg-slate-200 text-slate-700 transition-transform active:scale-95 cursor-pointer"
            title="Restart game"
          >
            <RefreshCw className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* Card Grid (Large tap targets > 80px) */}
      <div
        className={`grid gap-3 sm:gap-4 md:gap-5 justify-center ${
          totalPairs <= 2
            ? 'grid-cols-2 max-w-md mx-auto'
            : totalPairs <= 4
            ? 'grid-cols-2 sm:grid-cols-4 max-w-2xl mx-auto'
            : 'grid-cols-3 sm:grid-cols-4 max-w-3xl mx-auto'
        }`}
      >
        {cards.map((card) => {
          const showFace = card.isFlipped || card.isMatched;

          return (
            <button
              key={card.uniqueId}
              id={`card-${card.uniqueId}`}
              onClick={() => handleCardClick(card)}
              disabled={card.isMatched || isProcessing}
              className={`min-h-[130px] sm:min-h-[160px] min-w-[110px] sm:min-w-[140px] p-3 sm:p-4 rounded-[24px] flex flex-col items-center justify-center text-center transition-all duration-200 ${
                showFace
                  ? card.isMatched
                    ? 'bg-emerald-50 border-3 border-emerald-400 shadow-xs scale-95 opacity-90'
                    : 'bg-white border-3 border-amber-400 shadow-md scale-100'
                  : 'bg-amber-400 hover:bg-amber-500 border-3 border-amber-300 shadow-sm active:translate-y-0.5 cursor-pointer'
              }`}
            >
              {showFace ? (
                <div className="flex flex-col items-center space-y-1.5 sm:space-y-2">
                  <img
                    src={card.item.image_url}
                    alt={card.item.name.en}
                    className="w-14 h-14 sm:w-18 sm:h-18 rounded-2xl object-cover border border-amber-200 shadow-xs"
                    loading="lazy"
                  />
                  <span className="font-black text-slate-900 text-xs sm:text-sm leading-tight line-clamp-1">
                    {card.item.name[language] || card.item.name.en}
                  </span>
                  {card.isMatched && (
                    <span className="inline-flex items-center gap-1 text-emerald-700 text-[10px] font-black bg-emerald-100/80 px-2 py-0.5 rounded-full">
                      <CheckCircle2 className="w-3 h-3" /> Matched
                    </span>
                  )}
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center space-y-1 text-slate-900">
                  <div className="w-12 h-12 rounded-2xl bg-white/70 flex items-center justify-center border border-amber-300">
                    <span className="text-2xl select-none">🌸</span>
                  </div>
                  <span className="font-black text-slate-900 text-xs tracking-wide">
                    Tap to Open
                  </span>
                </div>
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
};
