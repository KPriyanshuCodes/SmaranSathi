import React, { useState, useEffect, useRef } from 'react';
import { Volume2, RefreshCw, ArrowLeft, Eye, HelpCircle, CheckCircle2, Clock } from 'lucide-react';
import { DifficultyLevel, RegionalLanguage, GameSession, LevelFinishResult } from '../../types';
import { UI_TRANSLATIONS } from '../../data/nerContent';
import { soundEffects, speakText, speakHindi, speakGameCheerHindi } from '../../utils/speechAndAudio';
import { getLevelConfig, SimplePuzzleLevelConfig } from '../../data/gameLevels';
import { GameLevelBanner } from './GameLevelBanner';

const PUZZLE_IMAGES = [
  {
    id: 'rhino',
    title: { en: 'Kaziranga Rhino', as: 'এশিঙীয়া গঁড়', hi: 'काजीरंगा गैंडा', kha: 'U Rhino', mni: 'রাইনো' },
    url: 'https://images.unsplash.com/photo-1575550959106-5a7defe28b56?w=600&auto=format&fit=crop&q=80',
  },
  {
    id: 'tea_garden',
    title: { en: 'Assam Tea Garden', as: 'চাহ বাগান', hi: 'असम चाय बागान', kha: 'Ka Kper Cha', mni: 'চা পাম' },
    url: 'https://images.unsplash.com/photo-1588880331179-bc9b93a8cb5e?w=600&auto=format&fit=crop&q=80',
  },
  {
    id: 'monastery',
    title: { en: 'Tawang Monastery', as: 'তাৱাং মঠ', hi: 'तवांग मठ', kha: 'Ka Monastery', mni: 'মঠ' },
    url: 'https://images.unsplash.com/photo-1544735716-392fe2489ffa?w=600&auto=format&fit=crop&q=80',
  },
  {
    id: 'living_bridge',
    title: { en: 'Living Root Bridge', as: 'জীৱন্ত শিপাৰ দলং', hi: 'लिविंग रूट ब्रिज', kha: 'Jingkieng Jri', mni: 'উরি থোং' },
    url: 'https://images.unsplash.com/photo-1506744038136-46273834b3fb?w=600&auto=format&fit=crop&q=80',
  },
];

interface SimplePuzzleGameProps {
  difficulty?: DifficultyLevel;
  level?: number;
  language: RegionalLanguage;
  userId: string;
  onFinish: (sessionData: Omit<GameSession, 'id' | 'completed_at'>) => void;
  onFinishLevel?: (result: LevelFinishResult) => void;
  onBack: () => void;
  onExitToLevelSelect?: () => void;
}

export const SimplePuzzleGame: React.FC<SimplePuzzleGameProps> = ({
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
  const levelConfig = getLevelConfig<SimplePuzzleLevelConfig>('simple_puzzle', level);
  const activeDifficulty = levelConfig.difficulty || propDifficulty;

  const gridDimension = levelConfig.gridDimension || 2;
  const totalTiles = gridDimension * gridDimension;

  const [puzzleImage, setPuzzleImage] = useState(PUZZLE_IMAGES[(level - 1) % PUZZLE_IMAGES.length]);
  const [tiles, setTiles] = useState<number[]>([]);
  const [selectedTileIndex, setSelectedTileIndex] = useState<number | null>(null);
  const [moves, setMoves] = useState(0);
  const [mistakes, setMistakes] = useState(0);
  const [startTime, setStartTime] = useState<number>(Date.now());
  const [elapsedSec, setElapsedSec] = useState(0);
  const [timerRemainingSec, setTimerRemainingSec] = useState<number | null>(levelConfig.timeLimitSec || null);
  const [showHint, setShowHint] = useState<boolean>(levelConfig.showGhostHint ?? true);
  const gameEndedRef = useRef(false);

  // Overall timer ticker
  useEffect(() => {
    const timer = setInterval(() => {
      if (!gameEndedRef.current) {
        setElapsedSec(Math.floor((Date.now() - startTime) / 1000));
      }
    }, 1000);
    return () => clearInterval(timer);
  }, [startTime]);

  // Countdown timer if level has a time limit
  useEffect(() => {
    if (!levelConfig.timeLimitSec || levelConfig.timeLimitSec <= 0 || gameEndedRef.current) return;

    setTimerRemainingSec(levelConfig.timeLimitSec);
    const cd = setInterval(() => {
      setTimerRemainingSec((prev) => {
        if (prev === null) return null;
        if (prev <= 1) {
          clearInterval(cd);
          handleTimeExpired();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(cd);
  }, [level, levelConfig.timeLimitSec]);

  const handleTimeExpired = () => {
    if (gameEndedRef.current) return;
    gameEndedRef.current = true;
    soundEffects.playGentleEncouragement();
    speakHindi('समय पूरा हुआ! आइए फिर से शांत मन से प्रयास करें।');

    const elapsedSeconds = levelConfig.timeLimitSec || 60;
    if (onFinishLevel) {
      onFinishLevel({
        won: false,
        level,
        gameType: 'simple_puzzle',
        score: Math.max(10, Math.round(50 - moves * 2)),
        stars: 0,
        timeSec: elapsedSeconds,
        accuracy: 45,
        attempts: moves,
        mistakes,
        completionRate: 50,
        failReason: `Time ran out (${levelConfig.timeLimitSec}s). Take your time and give it another try!`,
      });
    }
  };

  const setupPuzzle = () => {
    gameEndedRef.current = false;
    const img = PUZZLE_IMAGES[(level - 1) % PUZZLE_IMAGES.length];
    setPuzzleImage(img);

    const initial = Array.from({ length: totalTiles }, (_, i) => i);
    const shuffled = [...initial];

    const swapCount = levelConfig.scrambleSwaps || (gridDimension === 2 ? 2 : 4);
    for (let i = 0; i < swapCount; i++) {
      const a = Math.floor(Math.random() * totalTiles);
      const b = Math.floor(Math.random() * totalTiles);
      if (a !== b) {
        const temp = shuffled[a];
        shuffled[a] = shuffled[b];
        shuffled[b] = temp;
      }
    }

    // Ensure it's not accidentally solved initially
    if (shuffled.every((val, idx) => val === idx)) {
      const temp = shuffled[0];
      shuffled[0] = shuffled[1];
      shuffled[1] = temp;
    }

    setTiles(shuffled);
    setSelectedTileIndex(null);
    setMoves(0);
    setMistakes(0);
    setShowHint(levelConfig.showGhostHint ?? true);
    setStartTime(Date.now());
    setElapsedSec(0);
    if (levelConfig.timeLimitSec) {
      setTimerRemainingSec(levelConfig.timeLimitSec);
    }
  };

  useEffect(() => {
    setupPuzzle();
  }, [level, propDifficulty]);

  useEffect(() => {
    const imgNameHindi = puzzleImage.title.hi || puzzleImage.title.en;
    const prompt = `शांत प्राकृतिक पहेली स्तर ${level}। ${imgNameHindi} की तस्वीर को पूरा करने के लिए टुकड़ों को सही जगह लगाएं।`;
    speakHindi(prompt);
  }, [level, puzzleImage]);

  const handleVoiceGuide = () => {
    soundEffects.playGentleTap();
    const hindiInstruction = `किसी एक टुकड़े पर टैप करें, फिर दूसरे टुकड़े पर टैप करके उनकी जगह बदलें और ${puzzleImage.title.hi || 'तस्वीर'} को पूरा करें।`;
    speakHindi(hindiInstruction);
  };

  const handleTileClick = (index: number) => {
    if (gameEndedRef.current) return;
    soundEffects.playGentleTap(480);

    if (selectedTileIndex === null) {
      setSelectedTileIndex(index);
    } else {
      if (selectedTileIndex === index) {
        setSelectedTileIndex(null);
        return;
      }

      // Swap tiles
      const newTiles = [...tiles];
      const temp = newTiles[selectedTileIndex];
      newTiles[selectedTileIndex] = newTiles[index];
      newTiles[index] = temp;

      setTiles(newTiles);
      setSelectedTileIndex(null);
      const newMoves = moves + 1;
      setMoves(newMoves);

      const isBetter = newTiles[selectedTileIndex] === selectedTileIndex || newTiles[index] === index;
      if (isBetter) {
        soundEffects.playGentleTap(660);
      } else {
        setMistakes((prev) => prev + 1);
      }

      // Check if solved
      const isSolved = newTiles.every((val, idx) => val === idx);
      if (isSolved && !gameEndedRef.current) {
        gameEndedRef.current = true;
        soundEffects.playSuccessChime();
        speakGameCheerHindi('win', `बधाई हो! आपने ${puzzleImage.title.hi || 'सुंदर तस्वीर'} की पहेली पूरी कर ली!`);
        setTimeout(() => {
          finishGame(newMoves, mistakes);
        }, 500);
      }
    }
  };

  const finishGame = (finalMoves: number, finalMistakes: number) => {
    const elapsedSeconds = Math.max(3, Math.round((Date.now() - startTime) / 1000));
    const avgResponseTime = Number((elapsedSeconds / Math.max(1, finalMoves)).toFixed(1));
    const accuracy = Math.max(
      45,
      Math.min(100, Math.round((totalTiles / Math.max(totalTiles, finalMoves)) * 100))
    );

    // Win check
    const movesAllowed = levelConfig.maxMoves;
    const won = finalMoves <= movesAllowed;
    let stars = 0;
    if (won) {
      if (finalMoves <= (levelConfig.scrambleSwaps || 3) + 1) {
        stars = 3;
      } else if (finalMoves <= movesAllowed - 2) {
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
        gameType: 'simple_puzzle',
        score: calculatedScore,
        stars,
        timeSec: elapsedSeconds,
        accuracy,
        attempts: finalMoves,
        mistakes: finalMistakes,
        completionRate: 100,
        winConditionMet: won
          ? `Solved the ${gridDimension}x${gridDimension} puzzle in ${finalMoves} moves (Max allowed: ${movesAllowed}).`
          : undefined,
        failReason: !won
          ? `Used ${finalMoves} moves (Max allowed: ${movesAllowed}). Try again with deliberate swaps!`
          : undefined,
      });
    }

    onFinish({
      user_id: userId,
      game_type: 'simple_puzzle',
      level_number: level,
      accuracy,
      response_time: avgResponseTime,
      attempts: finalMoves,
      mistakes: finalMistakes,
      completion_rate: 100,
      difficulty_level: activeDifficulty,
      stars: Math.max(1, stars),
    });
  };

  return (
    <div className="w-full max-w-3xl mx-auto space-y-4">
      {/* Universal Level Banner with Hindi Voice */}
      <GameLevelBanner
        level={level}
        totalLevels={10}
        difficulty={activeDifficulty}
        levelTitle={levelConfig.title[language] || levelConfig.title.en}
        winConditionText={levelConfig.winConditionText[language] || levelConfig.winConditionText.en}
        hindiVoicePrompt={`प्राकृतिक पहेली स्तर ${level}। ${gridDimension} गुणा ${gridDimension} ग्रिड में ${levelConfig.maxMoves} से कम चालों में तस्वीर जोड़ें।`}
        onExitToLevelSelect={onExitToLevelSelect || onBack}
        attempts={moves}
        maxAttempts={levelConfig.maxMoves}
        timeSec={elapsedSec}
        timeLimitSec={levelConfig.timeLimitSec}
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
            {t.simple_puzzle}
          </h2>
          <p className="text-slate-600 font-bold text-xs sm:text-sm">
            {gridDimension}x{gridDimension} Grid · Moves: {moves} / {levelConfig.maxMoves}
          </p>
        </div>

        <div className="flex items-center gap-2">
          {levelConfig.timeLimitSec && levelConfig.timeLimitSec > 0 && (
            <div className={`px-2.5 py-1.5 rounded-xl border flex items-center gap-1 text-xs font-black ${
              timerRemainingSec && timerRemainingSec <= 10 ? 'bg-rose-50 border-rose-300 text-rose-700 animate-pulse' : 'bg-slate-100 border-slate-200 text-slate-800'
            }`}>
              <Clock className="w-3.5 h-3.5" />
              <span>{timerRemainingSec}s</span>
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
            onClick={() => setShowHint(!showHint)}
            className={`min-h-[48px] min-w-[48px] flex items-center justify-center p-2.5 rounded-2xl transition-all active:scale-95 cursor-pointer ${
              showHint ? 'bg-orange-500 text-white font-black shadow-xs' : 'bg-slate-100 text-slate-700'
            }`}
            title="Toggle picture hint"
          >
            <Eye className="w-5 h-5" />
          </button>
          <button
            onClick={setupPuzzle}
            className="min-h-[48px] min-w-[48px] flex items-center justify-center p-2.5 rounded-2xl bg-slate-100 hover:bg-slate-200 text-slate-700 transition-transform active:scale-95 cursor-pointer"
            title="Restart"
          >
            <RefreshCw className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* Instructions */}
      <div className="flex items-center justify-between gap-3 px-4 py-3 rounded-2xl bg-purple-50 border border-purple-200 text-purple-950 font-bold text-xs sm:text-sm">
        <div className="flex items-center gap-2">
          <HelpCircle className="w-5 h-5 text-purple-700 shrink-0" />
          <span>पहले एक टुकड़े पर टैप करें, फिर दूसरे टुकड़े पर टैप करके उन्हें आपस में बदलें।</span>
        </div>
        <button
          onClick={handleVoiceGuide}
          className="p-2 rounded-xl bg-purple-200 hover:bg-purple-300 text-purple-950 shrink-0 cursor-pointer"
          title="निर्देश सुनें"
        >
          <Volume2 className="w-4 h-4" />
        </button>
      </div>

      {/* Puzzle Board & Preview Layout */}
      <div className="flex flex-col md:flex-row items-center justify-center gap-5 pt-1">
        {/* The Grid of puzzle pieces */}
        <div
          className={`grid gap-2.5 sm:gap-3 p-4 bg-white rounded-[28px] border-3 border-purple-200 shadow-md ${
            gridDimension === 2 ? 'grid-cols-2 max-w-xs' : 'grid-cols-3 max-w-sm'
          }`}
          style={{ width: '100%', maxWidth: gridDimension === 2 ? '340px' : '400px' }}
        >
          {tiles.map((pieceVal, slotIdx) => {
            const isSelected = selectedTileIndex === slotIdx;
            const isCorrect = pieceVal === slotIdx;

            const col = pieceVal % gridDimension;
            const row = Math.floor(pieceVal / gridDimension);
            const xPercent = (col / (gridDimension - 1)) * 100;
            const yPercent = (row / (gridDimension - 1)) * 100;

            return (
              <button
                key={slotIdx}
                id={`puzzle-slot-${slotIdx}`}
                onClick={() => handleTileClick(slotIdx)}
                className={`relative aspect-square rounded-2xl overflow-hidden border-3 transition-all duration-200 active:scale-95 cursor-pointer shadow-xs ${
                  isSelected
                    ? 'border-purple-600 ring-4 ring-purple-300 scale-105 z-10'
                    : isCorrect
                    ? 'border-emerald-500'
                    : 'border-slate-200 hover:border-purple-300'
                }`}
                style={{
                  backgroundImage: `url(${puzzleImage.url})`,
                  backgroundSize: `${gridDimension * 100}%`,
                  backgroundPosition: `${xPercent}% ${yPercent}%`,
                }}
              >
                {isCorrect && (
                  <div className="absolute top-1.5 right-1.5 bg-emerald-500 text-white rounded-full p-0.5 shadow-xs">
                    <CheckCircle2 className="w-3.5 h-3.5" />
                  </div>
                )}
              </button>
            );
          })}
        </div>

        {/* Target Preview Thumbnail */}
        {showHint && (
          <div className="bg-white p-3.5 rounded-[24px] border-2 border-slate-200 shadow-xs max-w-[200px] text-center space-y-2">
            <span className="text-xs font-black text-slate-700 block">
              लक्ष्य तस्वीर:
            </span>
            <img
              src={puzzleImage.url}
              alt="Target"
              className="w-36 h-36 rounded-xl object-cover border border-slate-200 mx-auto shadow-xs"
            />
            <span className="text-[11px] font-bold text-slate-500 block truncate">
              {puzzleImage.title[language] || puzzleImage.title.hi || puzzleImage.title.en}
            </span>
          </div>
        )}
      </div>
    </div>
  );
};
