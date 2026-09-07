import React, { useState, useEffect, useRef } from 'react';
import { Volume2, ArrowLeft, Heart, CheckCircle2, RefreshCw } from 'lucide-react';
import { DifficultyLevel, RegionalLanguage, GameSession, FamiliarPerson } from '../../types';
import { UI_TRANSLATIONS } from '../../data/nerContent';
import { soundEffects, speakText } from '../../utils/speechAndAudio';

interface FaceMatchGameProps {
  difficulty: DifficultyLevel;
  language: RegionalLanguage;
  userId: string;
  familiarPeople: FamiliarPerson[];
  onFinish: (sessionData: Omit<GameSession, 'id' | 'completed_at'>) => void;
  onBack: () => void;
}

export const FaceMatchGame: React.FC<FaceMatchGameProps> = ({
  difficulty,
  language,
  userId,
  familiarPeople,
  onFinish,
  onBack,
}) => {
  const t = UI_TRANSLATIONS[language] || UI_TRANSLATIONS.en;
  const [currentIndex, setCurrentIndex] = useState(0);
  const [selectedPersonId, setSelectedPersonId] = useState<string | null>(null);
  const [isCorrect, setIsCorrect] = useState<boolean | null>(null);
  const [attempts, setAttempts] = useState(0);
  const [mistakes, setMistakes] = useState(0);
  const [correctCount, setCorrectCount] = useState(0);
  const [startTime, setStartTime] = useState<number>(Date.now());
  const gameEndedRef = useRef(false);

  // Filter or fallback to ensure at least 2 people exist
  const activePeople = familiarPeople.length > 0 ? familiarPeople : [
    {
      id: 'fam-demo-1',
      user_id: userId,
      name: 'Priya Barua',
      relation: 'Granddaughter',
      photo_url: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=300&q=80',
      notes: 'Loves bringing tea every afternoon',
    },
    {
      id: 'fam-demo-2',
      user_id: userId,
      name: 'Rohan Barua',
      relation: 'Son',
      photo_url: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=300&q=80',
      notes: 'Calls every evening',
    },
  ];

  const currentPerson = activePeople[currentIndex % activePeople.length];

  // Options: current person + other distractors
  const options = React.useMemo(() => {
    if (!currentPerson) return [];
    const others = activePeople.filter((p) => p.id !== currentPerson.id);
    return [currentPerson, ...others.slice(0, 2)].sort(() => Math.random() - 0.5);
  }, [currentPerson, activePeople]);

  useEffect(() => {
    gameEndedRef.current = false;
    setAttempts(0);
    setMistakes(0);
    setCorrectCount(0);
    setCurrentIndex(0);
    setStartTime(Date.now());
  }, [difficulty]);

  useEffect(() => {
    if (currentPerson) {
      speakText(`Do you recognize this smiling family member?`, language);
    }
  }, [currentIndex, currentPerson, language]);

  const handleOptionClick = (person: FamiliarPerson) => {
    if (selectedPersonId !== null) return;

    setSelectedPersonId(person.id);
    setAttempts((prev) => prev + 1);

    const correct = person.id === currentPerson.id;
    setIsCorrect(correct);

    if (correct) {
      soundEffects.playSuccessChime();
      const message = `${person.name}, your dear ${person.relation}!`;
      speakText(message, language);
      setCorrectCount((prev) => prev + 1);

      setTimeout(() => {
        advance();
      }, 1800);
    } else {
      soundEffects.playGentleEncouragement();
      setMistakes((prev) => prev + 1);
      speakText('Take another gentle look at their kind smile.', language);

      setTimeout(() => {
        setSelectedPersonId(null);
        setIsCorrect(null);
      }, 1400);
    }
  };

  const advance = () => {
    const totalRounds = Math.min(activePeople.length, 3);
    if (currentIndex + 1 < totalRounds) {
      setCurrentIndex((prev) => prev + 1);
      setSelectedPersonId(null);
      setIsCorrect(null);
    } else {
      if (!gameEndedRef.current) {
        gameEndedRef.current = true;
        finishGame(attempts + 1, mistakes, correctCount + 1, totalRounds);
      }
    }
  };

  const finishGame = (
    finalAttempts: number,
    finalMistakes: number,
    finalCorrect: number,
    totalRounds: number
  ) => {
    const elapsedSeconds = Math.max(3, (Date.now() - startTime) / 1000);
    const avgResponseTime = Number((elapsedSeconds / Math.max(1, finalAttempts)).toFixed(1));
    const accuracy = Math.max(
      60,
      Math.min(100, Math.round((totalRounds / Math.max(totalRounds, finalAttempts)) * 100))
    );

    let stars = 3;
    if (accuracy < 75 || finalMistakes >= 2) stars = 2;
    if (accuracy < 60) stars = 1;

    onFinish({
      user_id: userId,
      game_type: 'face_match',
      accuracy,
      response_time: avgResponseTime,
      attempts: finalAttempts,
      mistakes: finalMistakes,
      completion_rate: 100,
      difficulty_level: difficulty,
      stars,
    });
  };

  if (!currentPerson) return null;

  return (
    <div className="w-full max-w-2xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between bg-white p-4 sm:p-5 rounded-[32px] border-4 border-rose-200 shadow-[0_8px_0_0_#FDA4AF]">
        <button
          onClick={onBack}
          className="min-h-[52px] min-w-[52px] flex items-center justify-center p-3 rounded-2xl bg-orange-100 hover:bg-orange-200 text-gray-800 transition-transform active:scale-95 cursor-pointer"
        >
          <ArrowLeft className="w-7 h-7 text-gray-900" />
        </button>

        <div className="text-center">
          <h2 className="text-2xl md:text-3xl font-black text-gray-900">
            {t.face_match}
          </h2>
          <p className="text-gray-600 font-bold text-sm md:text-base">
            Person {currentIndex + 1} of {Math.min(activePeople.length, 3)}
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => speakText(`Who is this smiling face in your family?`, language)}
            className="min-h-[52px] min-w-[52px] flex items-center justify-center p-3 rounded-2xl bg-orange-500 hover:bg-orange-600 text-white font-black shadow-[0_4px_0_0_#C2410C] active:translate-y-1 active:shadow-none transition-all cursor-pointer"
            title="Read instructions"
          >
            <Volume2 className="w-6 h-6 text-white" />
          </button>
          <button
            onClick={() => {
              setCurrentIndex(0);
              setSelectedPersonId(null);
              setIsCorrect(null);
            }}
            className="min-h-[52px] min-w-[52px] flex items-center justify-center p-3 rounded-2xl bg-orange-50 hover:bg-orange-100 text-gray-700 border border-orange-100 transition-transform active:scale-95 cursor-pointer"
            title="Restart"
          >
            <RefreshCw className="w-6 h-6" />
          </button>
        </div>
      </div>

      {/* Face Card */}
      <div className="bg-white rounded-[32px] p-6 sm:p-8 border-4 border-rose-200 shadow-[0_8px_0_0_#FDA4AF] text-center space-y-5">
        <div className="flex justify-center">
          <div className="relative group">
            <img
              src={currentPerson.photo_url}
              alt={currentPerson.name}
              className="w-48 h-48 md:w-56 md:h-56 rounded-full object-cover border-4 border-rose-300 shadow-xl"
            />
            <div className="absolute bottom-2 right-2 bg-rose-500 text-white p-2.5 rounded-full shadow-lg">
              <Heart className="w-6 h-6 fill-current" />
            </div>
          </div>
        </div>

        <div className="space-y-1">
          <h3 className="text-xl md:text-2xl font-black text-gray-900">
            Who is this familiar loved one?
          </h3>
          <p className="text-gray-600 font-bold text-sm md:text-base">
            Tap their name below to connect
          </p>
        </div>

        {/* Options */}
        <div className="grid grid-cols-1 gap-3 pt-2">
          {options.map((opt) => {
            const isSelected = selectedPersonId === opt.id;
            const isTarget = opt.id === currentPerson.id;

            let btnClass = 'bg-white hover:bg-rose-50 border-2 border-rose-100 shadow-[0_4px_0_0_#FECDD3] text-gray-900 cursor-pointer';
            if (isSelected) {
              if (isTarget) {
                btnClass = 'bg-emerald-100 border-4 border-emerald-500 text-emerald-950 font-black shadow-[0_6px_0_0_#059669]';
              } else {
                btnClass = 'bg-rose-50 border-2 border-rose-300 text-rose-900 font-bold';
              }
            }

            return (
              <button
                key={opt.id}
                id={`face-opt-${opt.id}`}
                onClick={() => handleOptionClick(opt)}
                disabled={selectedPersonId !== null && isCorrect === true}
                className={`min-h-[64px] px-6 py-4 rounded-2xl text-lg md:text-xl font-bold flex items-center justify-between transition-all duration-200 active:scale-98 ${btnClass}`}
              >
                <div className="flex flex-col text-left">
                  <span className="text-lg md:text-xl font-black text-gray-900">
                    {opt.name}
                  </span>
                  <span className="text-sm text-gray-600 font-bold">
                    {opt.relation}
                  </span>
                </div>
                {isSelected && isTarget && (
                  <CheckCircle2 className="w-7 h-7 text-emerald-600 shrink-0" />
                )}
              </button>
            );
          })}
        </div>

        {/* Warm Note / Memory Cue */}
        {selectedPersonId && isCorrect && currentPerson.notes && (
          <div className="p-4 rounded-2xl bg-rose-50 border-2 border-rose-200 text-rose-950 text-base leading-relaxed animate-fade-in flex items-center gap-3 font-medium">
            <Heart className="w-6 h-6 text-rose-500 shrink-0 fill-current" />
            <span>{currentPerson.notes}</span>
          </div>
        )}
      </div>
    </div>
  );
};
