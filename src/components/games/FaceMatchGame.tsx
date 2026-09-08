import React, { useState, useEffect, useRef } from 'react';
import { Volume2, ArrowLeft, Heart, CheckCircle2, RefreshCw, Clock } from 'lucide-react';
import { DifficultyLevel, RegionalLanguage, GameSession, FamiliarPerson, LevelFinishResult } from '../../types';
import { UI_TRANSLATIONS } from '../../data/nerContent';
import { soundEffects, speakText } from '../../utils/speechAndAudio';
import { getLevelConfig, FaceMatchLevelConfig } from '../../data/gameLevels';
import { GameLevelBanner } from './GameLevelBanner';

interface FaceMatchGameProps {
  difficulty?: DifficultyLevel;
  level?: number;
  language: RegionalLanguage;
  userId: string;
  familiarPeople: FamiliarPerson[];
  onFinish: (sessionData: Omit<GameSession, 'id' | 'completed_at'>) => void;
  onFinishLevel?: (result: LevelFinishResult) => void;
  onBack: () => void;
  onExitToLevelSelect?: () => void;
}

const DEMO_FAMILY_MEMBERS: FamiliarPerson[] = [
  {
    id: 'fam-demo-1',
    user_id: 'demo',
    name: 'Priya Barua',
    relation: 'Granddaughter',
    photo_url: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=400&q=80',
    notes: 'Loves bringing warm Assam tea every afternoon',
  },
  {
    id: 'fam-demo-2',
    user_id: 'demo',
    name: 'Rohan Barua',
    relation: 'Son',
    photo_url: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=400&q=80',
    notes: 'Calls every evening after work from Guwahati',
  },
  {
    id: 'fam-demo-3',
    user_id: 'demo',
    name: 'Ananya Sharma',
    relation: 'Niece',
    photo_url: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&w=400&q=80',
    notes: 'Always plays Bihu tunes on the flute for you',
  },
  {
    id: 'fam-demo-4',
    user_id: 'demo',
    name: 'Deep Saikia',
    relation: 'Grandson',
    photo_url: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=400&q=80',
    notes: 'Helps water the potted tulsi plant every weekend',
  },
];

export const FaceMatchGame: React.FC<FaceMatchGameProps> = ({
  difficulty: propDifficulty = 'easy',
  level = 1,
  language,
  userId,
  familiarPeople,
  onFinish,
  onFinishLevel,
  onBack,
  onExitToLevelSelect,
}) => {
  const t = UI_TRANSLATIONS[language] || UI_TRANSLATIONS.en;
  const levelConfig = getLevelConfig<FaceMatchLevelConfig>('face_match', level);
  const activeDifficulty = levelConfig.difficulty || propDifficulty;

  const [currentIndex, setCurrentIndex] = useState(0);
  const [selectedPersonId, setSelectedPersonId] = useState<string | null>(null);
  const [isCorrect, setIsCorrect] = useState<boolean | null>(null);
  const [attempts, setAttempts] = useState(0);
  const [mistakes, setMistakes] = useState(0);
  const [correctCount, setCorrectCount] = useState(0);
  const [startTime, setStartTime] = useState<number>(Date.now());
  const [elapsedSec, setElapsedSec] = useState<number>(0);
  const [questionTimerSec, setQuestionTimerSec] = useState<number>(levelConfig.timePerQuestionSec || 0);
  const gameEndedRef = useRef(false);

  // Pool of people combining real familiar people + supplementary demo people
  const allPeople = React.useMemo(() => {
    const existing = [...familiarPeople];
    for (const demo of DEMO_FAMILY_MEMBERS) {
      if (!existing.some((p) => p.name.toLowerCase() === demo.name.toLowerCase())) {
        existing.push(demo);
      }
    }
    return existing;
  }, [familiarPeople]);

  const totalRounds = Math.min(allPeople.length, levelConfig.roundsCount || 2);
  const currentPerson = allPeople[currentIndex % allPeople.length];

  // Options count (2, 3, or 4 options)
  const options = React.useMemo(() => {
    if (!currentPerson) return [];
    const others = allPeople.filter((p) => p.id !== currentPerson.id);
    const neededOthers = Math.max(1, (levelConfig.optionsCount || 2) - 1);
    const chosenOthers = others.slice(0, neededOthers);
    return [currentPerson, ...chosenOthers].sort(() => Math.random() - 0.5);
  }, [currentPerson, allPeople, levelConfig.optionsCount]);

  // Overall timer ticker
  useEffect(() => {
    const timer = setInterval(() => {
      if (!gameEndedRef.current) {
        setElapsedSec(Math.floor((Date.now() - startTime) / 1000));
      }
    }, 1000);
    return () => clearInterval(timer);
  }, [startTime]);

  // Countdown per question if timePerQuestionSec > 0
  useEffect(() => {
    if (!levelConfig.timePerQuestionSec || levelConfig.timePerQuestionSec <= 0 || gameEndedRef.current) return;

    setQuestionTimerSec(levelConfig.timePerQuestionSec);
    const cd = setInterval(() => {
      setQuestionTimerSec((prev) => {
        if (prev <= 1) {
          clearInterval(cd);
          handleTimeExpired();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(cd);
  }, [currentIndex, levelConfig.timePerQuestionSec]);

  const handleTimeExpired = () => {
    if (selectedPersonId !== null || gameEndedRef.current) return;
    soundEffects.playGentleEncouragement();
    setMistakes((prev) => prev + 1);
    setAttempts((prev) => prev + 1);
    advance(correctCount);
  };

  useEffect(() => {
    gameEndedRef.current = false;
    setAttempts(0);
    setMistakes(0);
    setCorrectCount(0);
    setCurrentIndex(0);
    setSelectedPersonId(null);
    setIsCorrect(null);
    setStartTime(Date.now());
    setElapsedSec(0);
  }, [level, propDifficulty]);

  useEffect(() => {
    if (currentPerson) {
      speakText(`Do you recognize this smiling family member?`, language);
    }
  }, [currentIndex, currentPerson, language]);

  const handleOptionClick = (person: FamiliarPerson) => {
    if (selectedPersonId !== null) return;

    setSelectedPersonId(person.id);
    const newAttempts = attempts + 1;
    setAttempts(newAttempts);

    const correct = person.id === currentPerson.id;
    setIsCorrect(correct);

    if (correct) {
      soundEffects.playSuccessChime();
      const message = `${person.name}, your dear ${person.relation}!`;
      speakText(message, language);
      const newCorrect = correctCount + 1;
      setCorrectCount(newCorrect);

      setTimeout(() => {
        advance(newCorrect);
      }, 1600);
    } else {
      soundEffects.playGentleEncouragement();
      const newMistakes = mistakes + 1;
      setMistakes(newMistakes);
      speakText('Take another gentle look at their kind smile.', language);

      setTimeout(() => {
        advance(correctCount);
      }, 1400);
    }
  };

  const advance = (finalCorrect: number) => {
    if (currentIndex + 1 < totalRounds) {
      setCurrentIndex((prev) => prev + 1);
      setSelectedPersonId(null);
      setIsCorrect(null);
    } else {
      if (!gameEndedRef.current) {
        gameEndedRef.current = true;
        setTimeout(() => {
          finishGame(attempts + 1, mistakes, finalCorrect, totalRounds);
        }, 300);
      }
    }
  };

  const finishGame = (
    finalAttempts: number,
    finalMistakes: number,
    finalCorrect: number,
    roundsTotal: number
  ) => {
    const elapsedSeconds = Math.max(3, Math.round((Date.now() - startTime) / 1000));
    const avgResponseTime = Number((elapsedSeconds / Math.max(1, finalAttempts)).toFixed(1));
    const accuracy = Math.max(
      40,
      Math.min(100, Math.round((finalCorrect / roundsTotal) * 100))
    );

    // Win check
    const won = finalCorrect >= levelConfig.minCorrectToPass;
    let stars = 0;
    if (won) {
      if (finalCorrect === roundsTotal) {
        stars = 3;
      } else if (finalCorrect >= roundsTotal - 1) {
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
        gameType: 'face_match',
        score: calculatedScore,
        stars,
        timeSec: elapsedSeconds,
        accuracy,
        attempts: finalAttempts,
        mistakes: finalMistakes,
        completionRate: 100,
        winConditionMet: won
          ? `Recognized ${finalCorrect} out of ${roundsTotal} loved ones (Target: ≥ ${levelConfig.minCorrectToPass}).`
          : undefined,
        failReason: !won
          ? `Recognized ${finalCorrect} out of ${roundsTotal} loved ones (Target was ≥ ${levelConfig.minCorrectToPass}). Take your time and try again!`
          : undefined,
      });
    }

    onFinish({
      user_id: userId,
      game_type: 'face_match',
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

  if (!currentPerson) return null;

  return (
    <div className="w-full max-w-2xl mx-auto space-y-4">
      {/* Universal Level Banner */}
      <GameLevelBanner
        level={level}
        totalLevels={10}
        difficulty={activeDifficulty}
        levelTitle={levelConfig.title[language] || levelConfig.title.en}
        winConditionText={levelConfig.winConditionText[language] || levelConfig.winConditionText.en}
        onExitToLevelSelect={onExitToLevelSelect || onBack}
        attempts={attempts}
        timeSec={elapsedSec}
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
            {t.face_match}
          </h2>
          <p className="text-slate-600 font-bold text-xs sm:text-sm">
            Person {currentIndex + 1} of {totalRounds} · Correct: {correctCount}
          </p>
        </div>

        <div className="flex items-center gap-2">
          {levelConfig.timePerQuestionSec && levelConfig.timePerQuestionSec > 0 && (
            <div className={`px-2.5 py-1.5 rounded-xl border flex items-center gap-1 text-xs font-black ${
              questionTimerSec <= 5 ? 'bg-rose-50 border-rose-300 text-rose-700 animate-pulse' : 'bg-slate-100 border-slate-200 text-slate-800'
            }`}>
              <Clock className="w-3.5 h-3.5" />
              <span>{questionTimerSec}s</span>
            </div>
          )}

          <button
            onClick={() => speakText(`Who is this smiling face in your family?`, language)}
            className="min-h-[48px] min-w-[48px] flex items-center justify-center p-2.5 rounded-2xl bg-orange-500 hover:bg-orange-600 text-white font-black shadow-xs active:translate-y-0.5 transition-all cursor-pointer"
            title="Read instructions"
          >
            <Volume2 className="w-5 h-5 text-white" />
          </button>
          <button
            onClick={() => {
              setCurrentIndex(0);
              setSelectedPersonId(null);
              setIsCorrect(null);
              setCorrectCount(0);
              setAttempts(0);
              setMistakes(0);
            }}
            className="min-h-[48px] min-w-[48px] flex items-center justify-center p-2.5 rounded-2xl bg-slate-100 hover:bg-slate-200 text-slate-700 transition-transform active:scale-95 cursor-pointer"
            title="Restart"
          >
            <RefreshCw className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* Face Card */}
      <div className="bg-white rounded-[28px] p-5 sm:p-7 border-2 border-rose-200 shadow-sm text-center space-y-4">
        <div className="flex justify-center">
          <div className="relative">
            <img
              src={currentPerson.photo_url}
              alt={currentPerson.name}
              className="w-40 h-40 sm:w-48 sm:h-48 rounded-full object-cover border-4 border-rose-300 shadow-md"
            />
            <div className="absolute bottom-1 right-1 bg-rose-500 text-white p-2 rounded-full shadow-md">
              <Heart className="w-5 h-5 fill-current" />
            </div>
          </div>
        </div>

        <div className="space-y-0.5">
          <h3 className="text-lg sm:text-xl font-black text-slate-900">
            Who is this familiar loved one?
          </h3>
          <p className="text-slate-500 font-bold text-xs sm:text-sm">
            Tap their name below to connect
          </p>
        </div>

        {/* Options */}
        <div className={`grid gap-2.5 pt-1 ${options.length > 2 ? 'grid-cols-1 sm:grid-cols-2' : 'grid-cols-1 max-w-md mx-auto'}`}>
          {options.map((opt) => {
            const isSelected = selectedPersonId === opt.id;
            const isTarget = opt.id === currentPerson.id;

            let btnClass = 'bg-white hover:bg-rose-50/60 border-2 border-slate-200 shadow-xs text-slate-900 cursor-pointer';
            if (selectedPersonId !== null) {
              if (isTarget) {
                btnClass = 'bg-emerald-100 border-2 border-emerald-500 text-emerald-950 font-black shadow-md';
              } else if (isSelected) {
                btnClass = 'bg-rose-100 border-2 border-rose-300 text-rose-950 font-bold';
              } else {
                btnClass = 'bg-slate-100 border-2 border-slate-200 text-slate-400 opacity-60';
              }
            }

            return (
              <button
                key={opt.id}
                id={`face-opt-${opt.id}`}
                onClick={() => handleOptionClick(opt)}
                disabled={selectedPersonId !== null}
                className={`min-h-[58px] px-5 py-3 rounded-2xl text-base font-bold flex items-center justify-between transition-all duration-200 active:scale-98 ${btnClass}`}
              >
                <div className="flex flex-col text-left">
                  <span className="text-base sm:text-lg font-black text-slate-900">
                    {opt.name}
                  </span>
                  <span className="text-xs text-slate-500 font-bold">
                    {opt.relation}
                  </span>
                </div>
                {selectedPersonId !== null && isTarget && (
                  <CheckCircle2 className="w-6 h-6 text-emerald-600 shrink-0" />
                )}
              </button>
            );
          })}
        </div>

        {/* Warm Note / Memory Cue */}
        {selectedPersonId && isCorrect && currentPerson.notes && (
          <div className="p-3.5 rounded-2xl bg-rose-50 border border-rose-200 text-rose-950 text-xs sm:text-sm leading-relaxed flex items-center gap-2.5 font-medium text-left">
            <Heart className="w-5 h-5 text-rose-500 shrink-0 fill-current" />
            <span>{currentPerson.notes}</span>
          </div>
        )}
      </div>
    </div>
  );
};
