import React, { useState, useEffect, useRef } from 'react';
import { Volume2, RefreshCw, ArrowLeft, CheckCircle2, HelpCircle } from 'lucide-react';
import { CulturalItem, DifficultyLevel, RegionalLanguage, GameSession } from '../../types';
import { CULTURAL_ITEMS, UI_TRANSLATIONS } from '../../data/nerContent';
import { soundEffects, speakText } from '../../utils/speechAndAudio';

interface MemoryCard {
  uniqueId: string;
  itemId: string;
  item: CulturalItem;
  isFlipped: boolean;
  isMatched: boolean;
}

interface MemoryMatchGameProps {
  difficulty: DifficultyLevel;
  language: RegionalLanguage;
  userId: string;
  onFinish: (sessionData: Omit<GameSession, 'id' | 'completed_at'>) => void;
  onBack: () => void;
}

export const MemoryMatchGame: React.FC<MemoryMatchGameProps> = ({
  difficulty,
  language,
  userId,
  onFinish,
  onBack,
}) => {
  const t = UI_TRANSLATIONS[language] || UI_TRANSLATIONS.en;
  const [cards, setCards] = useState<MemoryCard[]>([]);
  const [flippedCards, setFlippedCards] = useState<MemoryCard[]>([]);
  const [matchedPairsCount, setMatchedPairsCount] = useState(0);
  const [totalPairs, setTotalPairs] = useState(3);
  const [attempts, setAttempts] = useState(0);
  const [mistakes, setMistakes] = useState(0);
  const [startTime, setStartTime] = useState<number>(Date.now());
  const [isProcessing, setIsProcessing] = useState(false);
  const [voiceInstructionGiven, setVoiceInstructionGiven] = useState(false);
  const gameEndedRef = useRef(false);

  // Setup game board based on difficulty
  const setupGame = () => {
    gameEndedRef.current = false;
    let pairsNeeded = 3; // Easy: 6 cards (3 pairs)
    if (difficulty === 'medium') pairsNeeded = 4; // 8 cards (4 pairs)
    if (difficulty === 'hard') pairsNeeded = 6; // 12 cards (6 pairs)

    setTotalPairs(pairsNeeded);

    // Pick items from cultural pack
    const selectedItems = CULTURAL_ITEMS.slice(0, pairsNeeded);
    const cardDeck: MemoryCard[] = [];

    selectedItems.forEach((item) => {
      // First card of pair
      cardDeck.push({
        uniqueId: `${item.id}-1`,
        itemId: item.id,
        item,
        isFlipped: false,
        isMatched: false,
      });
      // Second card of pair
      cardDeck.push({
        uniqueId: `${item.id}-2`,
        itemId: item.id,
        item,
        isFlipped: false,
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
    setIsProcessing(false);
  };

  useEffect(() => {
    setupGame();
  }, [difficulty]);

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
      setAttempts((prev) => prev + 1);

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
          setMatchedPairsCount((prev) => {
            const nextCount = prev + 1;
            if (nextCount >= totalPairs && !gameEndedRef.current) {
              gameEndedRef.current = true;
              finishGame(attempts + 1, mistakes, nextCount, totalPairs);
            }
            return nextCount;
          });
          setIsProcessing(false);
        }, 600);
      } else {
        // NO MATCH - gentle flip back (no harsh sounds)
        soundEffects.playGentleEncouragement();
        setMistakes((prev) => prev + 1);
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
        }, 1200);
      }
    }
  };

  const finishGame = (
    finalAttempts: number,
    finalMistakes: number,
    matchedCount: number,
    pairsCount: number
  ) => {
    const elapsedSeconds = Math.max(2, (Date.now() - startTime) / 1000);
    const avgResponseTime = Number((elapsedSeconds / Math.max(1, finalAttempts)).toFixed(1));
    const accuracy = Math.max(
      50,
      Math.min(100, Math.round(((pairsCount) / Math.max(pairsCount, finalAttempts)) * 100))
    );

    let stars = 3;
    if (accuracy < 70 || finalMistakes >= 4) stars = 2;
    if (accuracy < 55) stars = 1;

    onFinish({
      user_id: userId,
      game_type: 'memory_match',
      accuracy,
      response_time: avgResponseTime,
      attempts: finalAttempts,
      mistakes: finalMistakes,
      completion_rate: Math.round((matchedCount / pairsCount) * 100),
      difficulty_level: difficulty,
      stars,
    });
  };

  return (
    <div className="w-full max-w-4xl mx-auto space-y-6">
      {/* Game Header with Navigation & Voice Instruction */}
      <div className="flex items-center justify-between bg-white p-4 sm:p-5 rounded-[32px] border-4 border-yellow-200 shadow-[0_8px_0_0_#FEF08A]">
        <button
          id="game-back-home"
          onClick={onBack}
          className="min-h-[52px] min-w-[52px] flex items-center justify-center p-3 rounded-2xl bg-orange-100 hover:bg-orange-200 text-gray-800 transition-transform active:scale-95 cursor-pointer"
          aria-label="Back to home"
        >
          <ArrowLeft className="w-7 h-7 text-gray-900" />
        </button>

        <div className="text-center">
          <h2 className="text-2xl md:text-3xl font-black text-gray-900">
            {t.memory_match}
          </h2>
          <p className="text-gray-600 font-bold text-sm md:text-base">
            {matchedPairsCount} of {totalPairs} pairs found
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            id="game-voice-instruct"
            onClick={() => speakText(`${t.memory_match}. ${t.memory_match_desc}`, language)}
            className="min-h-[52px] min-w-[52px] flex items-center justify-center p-3 rounded-2xl bg-orange-500 hover:bg-orange-600 text-white font-black shadow-[0_4px_0_0_#C2410C] active:translate-y-1 active:shadow-none transition-all cursor-pointer"
            title="Read instructions aloud"
          >
            <Volume2 className="w-6 h-6 text-white" />
          </button>
          <button
            id="game-restart"
            onClick={setupGame}
            className="min-h-[52px] min-w-[52px] flex items-center justify-center p-3 rounded-2xl bg-orange-50 hover:bg-orange-100 text-gray-700 border border-orange-100 transition-transform active:scale-95 cursor-pointer"
            title="Restart game"
          >
            <RefreshCw className="w-6 h-6" />
          </button>
        </div>
      </div>

      {/* Gentle Instructions Banner */}
      <div className="flex items-center gap-3 px-5 py-3.5 rounded-2xl bg-yellow-50 border-2 border-yellow-200 text-yellow-950 font-bold shadow-sm">
        <HelpCircle className="w-6 h-6 text-yellow-700 shrink-0" />
        <span className="text-base md:text-lg font-bold">
          {t.memory_match_desc}
        </span>
      </div>

      {/* Card Grid (Large tap targets > 80px) */}
      <div
        className={`grid gap-4 md:gap-6 justify-center ${
          totalPairs <= 3
            ? 'grid-cols-2 sm:grid-cols-3 max-w-2xl mx-auto'
            : totalPairs === 4
            ? 'grid-cols-2 sm:grid-cols-4 max-w-3xl mx-auto'
            : 'grid-cols-3 sm:grid-cols-4 max-w-4xl mx-auto'
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
              className={`min-h-[140px] md:min-h-[170px] min-w-[120px] md:min-w-[150px] p-4 rounded-[28px] flex flex-col items-center justify-center text-center transition-all duration-200 ${
                showFace
                  ? card.isMatched
                    ? 'bg-emerald-50 border-4 border-emerald-400 shadow-[0_6px_0_0_#34D399] scale-95 opacity-90'
                    : 'bg-white border-4 border-yellow-400 shadow-[0_8px_0_0_#FACC15] scale-100'
                  : 'bg-amber-400 hover:bg-amber-500 border-4 border-yellow-200 shadow-[0_8px_0_0_#D97706] active:translate-y-1 active:shadow-none cursor-pointer'
              }`}
            >
              {showFace ? (
                <div className="flex flex-col items-center space-y-2">
                  <img
                    src={card.item.image_url}
                    alt={card.item.name.en}
                    className="w-16 h-16 md:w-20 md:h-20 rounded-2xl object-cover border-2 border-yellow-200 shadow-sm"
                    loading="lazy"
                  />
                  <span className="font-black text-gray-900 text-sm md:text-base leading-tight">
                    {card.item.name[language] || card.item.name.en}
                  </span>
                  {card.isMatched && (
                    <span className="inline-flex items-center gap-1 text-emerald-700 text-xs font-black">
                      <CheckCircle2 className="w-4 h-4" /> Matched
                    </span>
                  )}
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center space-y-2 text-gray-900">
                  <div className="w-14 h-14 rounded-2xl bg-white/70 flex items-center justify-center border-2 border-amber-300">
                    <span className="text-3xl select-none">🌸</span>
                  </div>
                  <span className="font-black text-gray-900 text-sm tracking-wide">
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
