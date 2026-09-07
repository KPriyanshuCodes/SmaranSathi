import React, { useState, useEffect, useRef } from 'react';
import { Volume2, ArrowLeft, RefreshCw, HelpCircle, Check, Eye } from 'lucide-react';
import { DifficultyLevel, RegionalLanguage, GameSession } from '../../types';
import { UI_TRANSLATIONS } from '../../data/nerContent';
import { soundEffects, speakText } from '../../utils/speechAndAudio';

interface SimplePuzzleGameProps {
  difficulty: DifficultyLevel;
  language: RegionalLanguage;
  userId: string;
  onFinish: (sessionData: Omit<GameSession, 'id' | 'completed_at'>) => void;
  onBack: () => void;
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
];

export const SimplePuzzleGame: React.FC<SimplePuzzleGameProps> = ({
  difficulty,
  language,
  userId,
  onFinish,
  onBack,
}) => {
  const t = UI_TRANSLATIONS[language] || UI_TRANSLATIONS.en;
  const gridDimension = difficulty === 'hard' ? 3 : 2; // 2x2 = 4 tiles, 3x3 = 9 tiles
  const totalTiles = gridDimension * gridDimension;

  const [puzzleImage, setPuzzleImage] = useState(PUZZLE_IMAGES[0]);
  const [tiles, setTiles] = useState<number[]>([]); // array of piece indices
  const [selectedTileIndex, setSelectedTileIndex] = useState<number | null>(null);
  const [moves, setMoves] = useState(0);
  const [mistakes, setMistakes] = useState(0);
  const [showHint, setShowHint] = useState(true);
  const [startTime, setStartTime] = useState<number>(Date.now());
  const gameEndedRef = useRef(false);

  // Initialize and shuffle tiles ensuring it is not already solved
  const setupPuzzle = () => {
    gameEndedRef.current = false;
    const img = PUZZLE_IMAGES[Math.floor(Math.random() * PUZZLE_IMAGES.length)];
    setPuzzleImage(img);

    const initial = Array.from({ length: totalTiles }, (_, i) => i);
    // Shuffle
    let shuffled = [...initial];
    for (let i = 0; i < 6; i++) {
      const a = Math.floor(Math.random() * totalTiles);
      const b = Math.floor(Math.random() * totalTiles);
      if (a !== b) {
        const temp = shuffled[a];
        shuffled[a] = shuffled[b];
        shuffled[b] = temp;
      }
    }
    // Make sure it's not solved initially
    if (shuffled.every((val, idx) => val === idx)) {
      const temp = shuffled[0];
      shuffled[0] = shuffled[1];
      shuffled[1] = temp;
    }

    setTiles(shuffled);
    setSelectedTileIndex(null);
    setMoves(0);
    setMistakes(0);
    setStartTime(Date.now());
  };

  useEffect(() => {
    setupPuzzle();
  }, [difficulty]);

  useEffect(() => {
    const prompt = `${t.simple_puzzle}. Tap two pieces to swap them into the right picture.`;
    speakText(prompt, language);
  }, [language, t]);

  const handleTileClick = (index: number) => {
    soundEffects.playGentleTap(480);

    if (selectedTileIndex === null) {
      setSelectedTileIndex(index);
    } else {
      if (selectedTileIndex === index) {
        // Deselect
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
      setMoves((prev) => prev + 1);

      // Check if newly swapped tile moved towards correct position
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
          finishGame(moves + 1, mistakes);
        }, 500);
      }
    }
  };

  const finishGame = (finalMoves: number, finalMistakes: number) => {
    const elapsedSeconds = Math.max(4, (Date.now() - startTime) / 1000);
    const avgResponseTime = Number((elapsedSeconds / Math.max(1, finalMoves)).toFixed(1));
    const accuracy = Math.max(
      55,
      Math.min(100, Math.round((totalTiles / Math.max(totalTiles, finalMoves)) * 100))
    );

    let stars = 3;
    if (accuracy < 70 || finalMoves > totalTiles * 2) stars = 2;
    if (accuracy < 55) stars = 1;

    onFinish({
      user_id: userId,
      game_type: 'simple_puzzle',
      accuracy,
      response_time: avgResponseTime,
      attempts: finalMoves,
      mistakes: finalMistakes,
      completion_rate: 100,
      difficulty_level: difficulty,
      stars,
    });
  };

  return (
    <div className="w-full max-w-3xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between bg-white p-4 sm:p-5 rounded-[32px] border-4 border-purple-200 shadow-[0_8px_0_0_#D8B4FE]">
        <button
          onClick={onBack}
          className="min-h-[52px] min-w-[52px] flex items-center justify-center p-3 rounded-2xl bg-orange-100 hover:bg-orange-200 text-gray-800 transition-transform active:scale-95 cursor-pointer"
        >
          <ArrowLeft className="w-7 h-7 text-gray-900" />
        </button>

        <div className="text-center">
          <h2 className="text-2xl md:text-3xl font-black text-gray-900">
            {t.simple_puzzle}
          </h2>
          <p className="text-gray-600 font-bold text-sm md:text-base">
            {puzzleImage.title[language] || puzzleImage.title.en}
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowHint(!showHint)}
            className={`min-h-[52px] min-w-[52px] flex items-center justify-center p-3 rounded-2xl transition-all active:scale-95 cursor-pointer ${
              showHint ? 'bg-orange-500 text-white font-black shadow-[0_4px_0_0_#C2410C]' : 'bg-orange-50 text-gray-700 border border-orange-100'
            }`}
            title="Toggle picture hint"
          >
            <Eye className="w-6 h-6" />
          </button>
          <button
            onClick={setupPuzzle}
            className="min-h-[52px] min-w-[52px] flex items-center justify-center p-3 rounded-2xl bg-orange-50 hover:bg-orange-100 text-gray-700 border border-orange-100 transition-transform active:scale-95 cursor-pointer"
            title="Restart"
          >
            <RefreshCw className="w-6 h-6" />
          </button>
        </div>
      </div>

      {/* Instructions */}
      <div className="flex items-center justify-between gap-4 px-5 py-3.5 rounded-2xl bg-purple-50 border-2 border-purple-200 text-purple-950 font-bold shadow-sm">
        <div className="flex items-center gap-2">
          <HelpCircle className="w-6 h-6 text-purple-700 shrink-0" />
          <span className="text-base md:text-lg font-bold">
            Tap a piece, then tap another piece to swap them into place.
          </span>
        </div>
        <button
          onClick={() => speakText('Tap one piece, then tap another piece to swap them.', language)}
          className="p-2.5 rounded-xl bg-purple-200 hover:bg-purple-300 text-purple-950 shrink-0 cursor-pointer"
        >
          <Volume2 className="w-5 h-5" />
        </button>
      </div>

      {/* Puzzle Board & Preview Layout */}
      <div className="flex flex-col md:flex-row items-center justify-center gap-6">
        {/* The Grid of puzzle pieces */}
        <div
          className={`grid gap-3.5 p-5 bg-white rounded-[32px] border-4 border-purple-200 shadow-[0_8px_0_0_#D8B4FE] ${
            gridDimension === 2 ? 'grid-cols-2 max-w-sm' : 'grid-cols-3 max-w-md'
          }`}
          style={{ width: '100%', maxWidth: gridDimension === 2 ? '360px' : '420px' }}
        >
          {tiles.map((pieceVal, slotIdx) => {
            const isSelected = selectedTileIndex === slotIdx;
            const isCorrect = pieceVal === slotIdx;

            // Compute background-position percentages for the jigsaw slice
            const col = pieceVal % gridDimension;
            const row = Math.floor(pieceVal / gridDimension);
            const xPercent = (col / (gridDimension - 1)) * 100;
            const yPercent = (row / (gridDimension - 1)) * 100;

            return (
              <button
                key={slotIdx}
                id={`puzzle-slot-${slotIdx}`}
                onClick={() => handleTileClick(slotIdx)}
                className={`relative aspect-square rounded-2xl overflow-hidden border-4 transition-all duration-200 active:scale-95 cursor-pointer shadow-sm ${
                  isSelected
                    ? 'border-purple-600 ring-4 ring-purple-300 scale-105 z-10'
                    : isCorrect
                    ? 'border-emerald-500'
                    : 'border-purple-200 hover:border-purple-400'
                }`}
                style={{
                  backgroundImage: `url(${puzzleImage.url})`,
                  backgroundSize: `${gridDimension * 100}% ${gridDimension * 100}%`,
                  backgroundPosition: `${xPercent}% ${yPercent}%`,
                }}
              >
                {/* Number hint badge */}
                {showHint && (
                  <div
                    className={`absolute top-2 left-2 px-2.5 py-1 rounded-full text-xs font-black shadow-md ${
                      isCorrect ? 'bg-emerald-600 text-white' : 'bg-gray-900/80 text-white'
                    }`}
                  >
                    #{pieceVal + 1}
                  </div>
                )}
                {isCorrect && (
                  <div className="absolute bottom-2 right-2 bg-emerald-500 text-white p-1 rounded-full shadow">
                    <Check className="w-4 h-4" />
                  </div>
                )}
              </button>
            );
          })}
        </div>

        {/* Small Reference Thumbnail */}
        {showHint && (
          <div className="flex flex-col items-center gap-2 p-4 bg-white rounded-[24px] border-3 border-purple-200 shadow-[0_4px_0_0_#E9D5FF]">
            <span className="text-xs font-black text-purple-900 uppercase tracking-wider">
              Goal Picture
            </span>
            <img
              src={puzzleImage.url}
              alt="Goal"
              className="w-32 h-32 object-cover rounded-xl border border-purple-100 shadow-inner"
            />
          </div>
        )}
      </div>
    </div>
  );
};
