import React, { useState, useEffect, useRef } from 'react';
import { Volume2, ArrowLeft, RefreshCw, HelpCircle, Check, Eye, Clock } from 'lucide-react';
import { DifficultyLevel, RegionalLanguage, GameSession, LevelFinishResult } from '../../types';
import { UI_TRANSLATIONS } from '../../data/nerContent';
import { soundEffects, speakText } from '../../utils/speechAndAudio';
import { getLevelConfig, SimplePuzzleLevelConfig } from '../../data/gameLevels';
import { GameLevelBanner } from './GameLevelBanner';

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

const PUZZLE_IMAGES = [
  {
    id: 'puz-rhino',
    title: { en: 'Kaziranga Rhino Sanctuary', as: 'কাজিৰঙাৰ গঁড়', kha: 'Ka Kaziranga', mni: 'কাজিরঙ্গা রাইনো', hi: 'काजीरंगा गैंडा' },
    url: 'https://images.unsplash.com/photo-1581852017103-68ac65514cf7?auto=format&fit=crop&w=600&q=80',
  },
  {
    id: 'puz-bridge',
    title: { en: 'Meghalaya Living Root Bridge', as: 'মেঘালয়ৰ শিপাৰ দলং', kha: 'Jingkieng Jri', mni: 'মশাংগী থোং', hi: 'मेघालय रूट ब्रिज' },
    url: 'https://images.unsplash.com/photo-1544644181-1484b3fdfc62?auto=format&fit=crop&w=600&q=80',
  },
  {
    id: 'puz-tea',
    title: { en: 'Lush Assam Tea Gardens', as: 'অসমৰ সেউজ চাহ বাগিচা', kha: 'Ki Kper Sha', mni: 'চা পাম্বী পাম', hi: 'असम के चाय बागान' },
    url: 'https://images.unsplash.com/photo-1590502593747-42a996133562?auto=format&fit=crop&w=600&q=80',
  },
  {
    id: 'puz-lake',
    title: { en: 'Loktak Floating Lake', as: 'মণিপুৰৰ লোকটাক হ্ৰদ', kha: 'Ka Nan Loktak', mni: 'লোকতাক পাত', hi: 'मणिपुर की लोकतक झील' },
    url: 'https://images.unsplash.com/photo-1509198397868-475647b2a1e5?auto=format&fit=crop&w=600&q=80',
  },
];

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

  const gridDimension = levelConfig.gridDimension || 2; // 2x2 or 3x3
  const totalTiles = gridDimension * gridDimension;

  const [puzzleImage, setPuzzleImage] = useState(PUZZLE_IMAGES[(level - 1) % PUZZLE_IMAGES.length]);
  const [tiles, setTiles] = useState<number[]>([]);
  const [selectedTileIndex, setSelectedTileIndex] = useState<number | null>(null);
  const [moves, setMoves] = useState(0);
  const [mistakes, setMistakes] = useState(0);
  const [showHint, setShowHint] = useState(levelConfig.showGhostHint ?? true);
  const [startTime, setStartTime] = useState<number>(Date.now());
  const [elapsedSec, setElapsedSec] = useState<number>(0);
  const [timerRemainingSec, setTimerRemainingSec] = useState<number>(levelConfig.timeLimitSec || 0);
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
    const prompt = `${t.simple_puzzle}. Tap two pieces to swap them into the right picture.`;
    speakText(prompt, language);
  }, [language, t]);

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
    const movesAllowed = levelConfig.maxMoves || (gridDimension === 2 ? 10 : 20);
    const won = finalMoves <= movesAllowed;
    let stars = 0;
    if (won) {
      if (finalMoves <= Math.max(gridDimension, Math.floor(movesAllowed * 0.6))) {
        stars = 3;
      } else if (finalMoves <= Math.floor(movesAllowed * 0.85)) {
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
      {/* Universal Level Banner */}
      <GameLevelBanner
        level={level}
        totalLevels={10}
        difficulty={activeDifficulty}
        levelTitle={levelConfig.title[language] || levelConfig.title.en}
        winConditionText={levelConfig.winConditionText[language] || levelConfig.winConditionText.en}
        onExitToLevelSelect={onExitToLevelSelect || onBack}
        attempts={moves}
        maxAttempts={levelConfig.maxMoves}
        timeSec={elapsedSec}
        timeLimitSec={levelConfig.timeLimitSec}
      />

      {/* Header */}
      <div className="flex items-center justify-between bg-white p-4 sm:p-5 rounded-[28px] border-2 border-slate-200 shadow-xs">
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
              timerRemainingSec <= 10 ? 'bg-rose-50 border-rose-300 text-rose-700 animate-pulse' : 'bg-slate-100 border-slate-200 text-slate-800'
            }`}>
              <Clock className="w-3.5 h-3.5" />
              <span>{timerRemainingSec}s</span>
            </div>
          )}

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
          <span>Tap one piece, then tap another piece to swap them into place.</span>
        </div>
        <button
          onClick={() => speakText('Tap one piece, then tap another piece to swap them.', language)}
          className="p-2 rounded-xl bg-purple-200 hover:bg-purple-300 text-purple-950 shrink-0 cursor-pointer"
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
                  backgroundSize: `${gridDimension * 100}% ${gridDimension * 100}%`,
                  backgroundPosition: `${xPercent}% ${yPercent}%`,
                }}
              >
                {showHint && (
                  <div
                    className={`absolute top-1.5 left-1.5 px-2 py-0.5 rounded-full text-[10px] font-black shadow-xs ${
                      isCorrect ? 'bg-emerald-600 text-white' : 'bg-slate-900/80 text-white'
                    }`}
                  >
                    #{pieceVal + 1}
                  </div>
                )}
                {isCorrect && (
                  <div className="absolute bottom-1.5 right-1.5 bg-emerald-500 text-white p-0.5 rounded-full shadow-xs">
                    <Check className="w-3.5 h-3.5" />
                  </div>
                )}
              </button>
            );
          })}
        </div>

        {/* Small Reference Thumbnail */}
        {showHint && (
          <div className="flex flex-col items-center gap-1.5 p-3 bg-white rounded-2xl border border-purple-200 shadow-xs">
            <span className="text-[11px] font-black text-purple-900 uppercase tracking-wider">
              Goal Picture
            </span>
            <img
              src={puzzleImage.url}
              alt="Goal"
              className="w-28 h-28 object-cover rounded-xl border border-purple-100 shadow-inner"
            />
          </div>
        )}
      </div>
    </div>
  );
};
