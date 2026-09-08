import React, { useState, useEffect } from 'react';
import { 
  ArrowLeft, 
  Lock, 
  Play, 
  Star, 
  CheckCircle2, 
  RotateCcw, 
  Sparkles, 
  Trophy, 
  Clock, 
  Award,
  Zap
} from 'lucide-react';
import { GameType, RegionalLanguage, GameLevelProgress, LevelScoreRecord } from '../../types';
import { getGameLevels, BaseLevelConfig } from '../../data/gameLevels';
import { getUserGameProgress, resetGameProgress } from '../../utils/gameProgress';
import { soundEffects } from '../../utils/soundEffects';

interface GameLevelSelectScreenProps {
  gameType: GameType;
  userId: string;
  language: RegionalLanguage;
  onSelectLevel: (level: number) => void;
  onBack: () => void;
}

const GAME_METADATA: Record<GameType, { title: string; subtitle: string; icon: string; themeColor: string; borderColor: string }> = {
  memory_match: {
    title: 'Cultural Memory Match',
    subtitle: 'Preserve visual recollection with authentic North-East Indian cultural symbols',
    icon: '🎴',
    themeColor: 'from-amber-500/20 to-orange-500/10 text-amber-900',
    borderColor: 'border-amber-200',
  },
  sequence_recall: {
    title: 'Rhythm & Sound Sequence',
    subtitle: 'Nurture auditory memory and sequential focus with traditional folk rhythms',
    icon: '🥁',
    themeColor: 'from-purple-500/20 to-indigo-500/10 text-purple-900',
    borderColor: 'border-purple-200',
  },
  picture_recognition: {
    title: 'Picture & Heritage Quiz',
    subtitle: 'Reinvigorate episodic memory through familiar Northeast landmarks and crafts',
    icon: '🖼️',
    themeColor: 'from-emerald-500/20 to-teal-500/10 text-emerald-900',
    borderColor: 'border-emerald-200',
  },
  simple_puzzle: {
    title: 'Tactile Heritage Puzzle',
    subtitle: 'Strengthen spatial planning and visual orientation with gentle sliding tiles',
    icon: '🧩',
    themeColor: 'from-blue-500/20 to-cyan-500/10 text-blue-900',
    borderColor: 'border-blue-200',
  },
  face_match: {
    title: 'Family Face & Voice Match',
    subtitle: 'Warm emotional grounding connecting beloved family members and caregivers',
    icon: '👥',
    themeColor: 'from-rose-500/20 to-pink-500/10 text-rose-900',
    borderColor: 'border-rose-200',
  },
};

export const GameLevelSelectScreen: React.FC<GameLevelSelectScreenProps> = ({
  gameType,
  userId,
  language,
  onSelectLevel,
  onBack,
}) => {
  const [progress, setProgress] = useState<GameLevelProgress>(() => getUserGameProgress(userId, gameType));
  const [showResetConfirm, setShowResetConfirm] = useState(false);

  useEffect(() => {
    setProgress(getUserGameProgress(userId, gameType));
  }, [userId, gameType]);

  const levels = getGameLevels(gameType);
  const meta = GAME_METADATA[gameType] || GAME_METADATA.memory_match;

  const handleReset = async () => {
    soundEffects.playGentleTap();
    const fresh = await resetGameProgress(userId, gameType);
    setProgress(fresh);
    setShowResetConfirm(false);
  };

  // Compute overall summary stats
  const totalStars = Object.values(progress.bestScorePerLevel || {}).reduce((acc: number, curr: LevelScoreRecord | unknown) => {
    const rec = curr as LevelScoreRecord | undefined;
    return acc + (rec?.stars || 0);
  }, 0);
  const completedCount = progress.completedLevels.length;
  const highestUnlocked = progress.unlockedLevel;

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 pb-16 pt-4 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto space-y-6">
        
        {/* Navigation Bar */}
        <div className="flex items-center justify-between">
          <button
            id="level-select-back-btn"
            onClick={() => {
              soundEffects.playGentleTap();
              onBack();
            }}
            className="flex items-center gap-2 px-4 py-2.5 rounded-2xl bg-white border border-slate-200 shadow-xs hover:bg-slate-100 text-slate-700 font-bold transition-all cursor-pointer"
          >
            <ArrowLeft className="w-5 h-5 text-slate-600" />
            <span>Back to Games</span>
          </button>

          <button
            id="reset-progress-btn"
            onClick={() => setShowResetConfirm(true)}
            className="text-xs font-semibold text-slate-500 hover:text-rose-600 flex items-center gap-1.5 px-3 py-2 rounded-xl hover:bg-rose-50 transition-colors cursor-pointer"
            title="Reset progress to replay from level 1"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Reset Progress</span>
          </button>
        </div>

        {/* Game Hero Header */}
        <div className={`p-6 sm:p-8 rounded-3xl bg-gradient-to-br ${meta.themeColor} border ${meta.borderColor} shadow-xs relative overflow-hidden`}>
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6">
            <div className="flex items-start gap-4">
              <span className="text-4xl sm:text-5xl shrink-0 p-3 bg-white/80 backdrop-blur-xs rounded-2xl shadow-xs border border-white/40">
                {meta.icon}
              </span>
              <div className="space-y-1">
                <div className="inline-flex items-center gap-1.5 px-3 py-0.5 rounded-full bg-white/70 text-xs font-black uppercase tracking-wider text-slate-800">
                  <Sparkles className="w-3.5 h-3.5 text-amber-500" />
                  <span>10 Progression Levels</span>
                </div>
                <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
                  {meta.title}
                </h1>
                <p className="text-sm sm:text-base text-slate-700 font-medium max-w-xl">
                  {meta.subtitle}
                </p>
              </div>
            </div>

            {/* Overall Stats Pill */}
            <div className="flex items-center sm:flex-col justify-between sm:justify-center gap-2 bg-white/90 backdrop-blur-xs p-4 rounded-2xl border border-white/60 shadow-xs shrink-0">
              <div className="flex items-center gap-2">
                <Trophy className="w-5 h-5 text-amber-500" />
                <span className="text-xs font-black uppercase text-slate-500">Progress</span>
              </div>
              <div className="text-right sm:text-center">
                <div className="text-lg font-black text-slate-900">
                  {completedCount} / 10 <span className="text-xs font-normal text-slate-500">Levels</span>
                </div>
                <div className="text-xs font-bold text-amber-700 flex items-center gap-1 justify-end sm:justify-center">
                  <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-500" />
                  <span>{totalStars} / 30 Stars</span>
                </div>
              </div>
            </div>
          </div>

          {/* Quick Continue CTA Banner */}
          <div className="mt-6 pt-5 border-t border-slate-900/10 flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-3 text-left w-full sm:w-auto">
              <div className="w-10 h-10 rounded-xl bg-white shadow-xs flex items-center justify-center text-slate-900 font-black text-lg shrink-0">
                {highestUnlocked}
              </div>
              <div>
                <p className="text-xs font-bold text-slate-600 uppercase tracking-wide">Next Available Level</p>
                <p className="text-sm font-black text-slate-900">
                  Level {highestUnlocked}: {levels[highestUnlocked - 1]?.title[language] || levels[highestUnlocked - 1]?.title.en}
                </p>
              </div>
            </div>

            <button
              id={`quick-play-level-${highestUnlocked}`}
              onClick={() => {
                soundEffects.playGentleTap(550);
                onSelectLevel(highestUnlocked);
              }}
              className="w-full sm:w-auto px-6 py-3 rounded-2xl bg-slate-900 hover:bg-slate-800 text-white font-black text-sm sm:text-base flex items-center justify-center gap-2.5 shadow-md hover:shadow-lg transition-all cursor-pointer hover:scale-[1.02]"
            >
              <Play className="w-5 h-5 fill-current" />
              <span>Continue Level {highestUnlocked}</span>
            </button>
          </div>
        </div>

        {/* Level Progression Grid Header */}
        <div className="flex items-center justify-between px-1">
          <div>
            <h2 className="text-lg font-black text-slate-900">Select a Level</h2>
            <p className="text-xs text-slate-500 font-medium">
              Tap any unlocked level to play. Beat each level's goal to unlock the next challenge.
            </p>
          </div>
          <span className="text-xs font-bold px-3 py-1 rounded-full bg-slate-200 text-slate-700">
            {highestUnlocked === 10 && completedCount === 10 ? '★ Mastered' : `Level ${highestUnlocked} Active`}
          </span>
        </div>

        {/* 10-Level Cards Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-2 gap-4">
          {levels.map((lvl: BaseLevelConfig) => {
            const isUnlocked = lvl.level <= progress.unlockedLevel;
            const isCompleted = progress.completedLevels.includes(lvl.level);
            const bestRecord = progress.bestScorePerLevel[lvl.level];
            const stars = bestRecord?.stars || 0;
            const title = lvl.title[language] || lvl.title.en;
            const description = lvl.description[language] || lvl.description.en;
            const winCondition = lvl.winConditionText[language] || lvl.winConditionText.en;

            const difficultyColors = {
              easy: 'bg-emerald-100 text-emerald-800 border-emerald-200',
              medium: 'bg-amber-100 text-amber-800 border-amber-200',
              hard: 'bg-rose-100 text-rose-800 border-rose-200',
            }[lvl.difficulty];

            return (
              <div
                key={lvl.level}
                id={`level-card-${lvl.level}`}
                className={`relative rounded-3xl p-5 sm:p-6 transition-all border-2 flex flex-col justify-between ${
                  !isUnlocked
                    ? 'bg-slate-100/80 border-slate-200 opacity-70 select-none'
                    : isCompleted
                    ? 'bg-white border-emerald-300 hover:border-emerald-500 hover:shadow-md'
                    : 'bg-white border-blue-300 hover:border-blue-500 shadow-sm hover:shadow-md'
                }`}
              >
                <div>
                  {/* Top Bar: Level Number, Status Badge & Stars */}
                  <div className="flex items-center justify-between gap-2 mb-3">
                    <div className="flex items-center gap-2.5">
                      <span
                        className={`w-10 h-10 rounded-2xl flex items-center justify-center font-black text-base shadow-2xs ${
                          !isUnlocked
                            ? 'bg-slate-200 text-slate-400'
                            : isCompleted
                            ? 'bg-emerald-500 text-white'
                            : 'bg-blue-600 text-white'
                        }`}
                      >
                        {lvl.level}
                      </span>
                      <div>
                        <div className="flex items-center gap-1.5">
                          <span className={`text-[11px] font-black uppercase px-2 py-0.5 rounded-full border ${difficultyColors}`}>
                            {lvl.difficulty}
                          </span>
                          {isCompleted && (
                            <span className="text-[11px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full flex items-center gap-1 border border-emerald-200">
                              <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                              <span>Cleared</span>
                            </span>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Stars Earned */}
                    {isCompleted ? (
                      <div className="flex items-center gap-1 bg-amber-50 px-2.5 py-1 rounded-xl border border-amber-200">
                        {[1, 2, 3].map((starNum) => (
                          <Star
                            key={starNum}
                            className={`w-4 h-4 ${
                              starNum <= stars
                                ? 'fill-amber-400 text-amber-500'
                                : 'fill-slate-200 text-slate-300'
                            }`}
                          />
                        ))}
                      </div>
                    ) : !isUnlocked ? (
                      <div className="flex items-center gap-1 text-slate-400 text-xs font-bold bg-slate-200/70 px-2.5 py-1 rounded-xl">
                        <Lock className="w-3.5 h-3.5" />
                        <span>Locked</span>
                      </div>
                    ) : (
                      <div className="text-xs font-black text-blue-600 bg-blue-50 px-2.5 py-1 rounded-xl border border-blue-200">
                        Unlocked
                      </div>
                    )}
                  </div>

                  {/* Level Title & Description */}
                  <h3 className={`text-lg font-black ${!isUnlocked ? 'text-slate-500' : 'text-slate-900'}`}>
                    Level {lvl.level}: {title}
                  </h3>
                  <p className={`text-xs mt-1 leading-relaxed ${!isUnlocked ? 'text-slate-400' : 'text-slate-600'}`}>
                    {description}
                  </p>

                  {/* Win Goal Pill */}
                  <div className={`mt-3 px-3 py-2 rounded-xl text-xs flex items-center gap-2 ${
                    !isUnlocked ? 'bg-slate-200/60 text-slate-500' : 'bg-slate-50 text-slate-700 border border-slate-200'
                  }`}>
                    <Zap className={`w-3.5 h-3.5 shrink-0 ${!isUnlocked ? 'text-slate-400' : 'text-amber-500'}`} />
                    <span className="font-semibold">{winCondition}</span>
                  </div>
                </div>

                {/* Bottom Bar: Action Button / Unlock Requirement */}
                <div className="mt-5 pt-3 border-t border-slate-100 flex items-center justify-between gap-3">
                  {isUnlocked ? (
                    <>
                      {bestRecord ? (
                        <div className="text-xs text-slate-500 flex items-center gap-3">
                          <span className="flex items-center gap-1 font-bold text-slate-700">
                            <Award className="w-3.5 h-3.5 text-amber-500" />
                            {bestRecord.score} pts
                          </span>
                          {bestRecord.timeSec > 0 && (
                            <span className="flex items-center gap-1">
                              <Clock className="w-3.5 h-3.5 text-slate-400" />
                              {bestRecord.timeSec}s
                            </span>
                          )}
                        </div>
                      ) : (
                        <span className="text-xs text-blue-600 font-bold">Ready to play</span>
                      )}

                      <button
                        id={`play-level-btn-${lvl.level}`}
                        onClick={() => {
                          soundEffects.playGentleTap(550);
                          onSelectLevel(lvl.level);
                        }}
                        className={`px-4 py-2 rounded-xl font-black text-xs sm:text-sm flex items-center gap-1.5 transition-all cursor-pointer ${
                          isCompleted
                            ? 'bg-slate-100 hover:bg-slate-200 text-slate-800'
                            : 'bg-blue-600 hover:bg-blue-700 text-white shadow-xs'
                        }`}
                      >
                        <Play className="w-3.5 h-3.5 fill-current" />
                        <span>{isCompleted ? 'Replay' : 'Start'}</span>
                      </button>
                    </>
                  ) : (
                    <div className="w-full flex items-center justify-between text-xs text-slate-400">
                      <span className="flex items-center gap-1.5 font-medium">
                        <Lock className="w-3.5 h-3.5" />
                        Complete Level {lvl.level - 1} to unlock
                      </span>
                      <span className="font-bold">Locked</span>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>

        {/* Reset Confirmation Dialog */}
        {showResetConfirm && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs">
            <div className="bg-white rounded-3xl p-6 max-w-sm w-full shadow-2xl border border-slate-200 text-center space-y-4">
              <div className="w-12 h-12 rounded-2xl bg-rose-100 text-rose-600 mx-auto flex items-center justify-center">
                <RotateCcw className="w-6 h-6" />
              </div>
              <div>
                <h4 className="text-lg font-black text-slate-900">Reset Level Progress?</h4>
                <p className="text-xs text-slate-600 mt-1 leading-relaxed">
                  This will lock levels 2 through 10 and clear your star records for this game so you can enjoy playing from Level 1 again.
                </p>
              </div>
              <div className="flex gap-2">
                <button
                  onClick={() => setShowResetConfirm(false)}
                  className="flex-1 py-2.5 rounded-xl border border-slate-200 font-bold text-xs text-slate-700 hover:bg-slate-100"
                >
                  Cancel
                </button>
                <button
                  id="confirm-reset-progress-btn"
                  onClick={handleReset}
                  className="flex-1 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-700 font-bold text-xs text-white shadow-xs"
                >
                  Reset
                </button>
              </div>
            </div>
          </div>
        )}

      </div>
    </div>
  );
};
