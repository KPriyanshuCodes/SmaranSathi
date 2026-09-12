import React, { useState, useEffect, useRef } from 'react';
import { 
  Volume2, 
  ArrowLeft, 
  CheckCircle2, 
  HelpCircle, 
  RefreshCw, 
  Clock, 
  Lightbulb, 
  Plus, 
  Calculator, 
  X 
} from 'lucide-react';
import { DifficultyLevel, RegionalLanguage, GameSession, LevelFinishResult } from '../../types';
import { soundEffects, speakText, speakHindi, speakGameCheerHindi } from '../../utils/speechAndAudio';
import { getLevelConfig, SimpleCalculationLevelConfig } from '../../data/gameLevels';
import { GameLevelBanner } from './GameLevelBanner';

interface SimpleCalculationGameProps {
  difficulty?: DifficultyLevel;
  level?: number;
  language: RegionalLanguage;
  userId: string;
  onFinish: (sessionData: Omit<GameSession, 'id' | 'completed_at'>) => void;
  onFinishLevel?: (result: LevelFinishResult) => void;
  onBack: () => void;
  onExitToLevelSelect?: () => void;
}

interface CalcItemTheme {
  name: { en: string; as: string; kha: string; mni: string; hi: string };
  emoji: string;
  unit: { en: string; as: string; kha: string; mni: string; hi: string };
}

const THEMES: CalcItemTheme[] = [
  {
    name: { en: 'Assam Lemons (Kaji Nemu)', as: 'কাজিনেমু', kha: 'Sohjew', mni: 'চম্প্ৰা', hi: 'असम नींबू' },
    emoji: '🍋',
    unit: { en: 'lemons', as: 'টা কাজিনেমু', kha: 'tylli ki sohjew', mni: 'মাকোক চম্প্ৰা', hi: 'नींबू' }
  },
  {
    name: { en: 'Assam Chai (Tea Cups)', as: 'চাহৰ কাপ', kha: 'Sha', mni: 'চা কাপ', hi: 'चाय के कप' },
    emoji: '☕',
    unit: { en: 'cups', as: 'কাপ চাহ', kha: 'khuri sha', mni: 'কাপ চা', hi: 'कप चाय' }
  },
  {
    name: { en: 'Khasi Mandarins (Sohniamtra)', as: 'মৰমৰ কমলা', kha: 'Sohniamtra', mni: 'কমলা', hi: 'रसीले संतरे' },
    emoji: '🍊',
    unit: { en: 'oranges', as: 'টা কমলা', kha: 'tylli ki sohniamtra', mni: 'মাকোক কমলা', hi: 'संतरे' }
  },
  {
    name: { en: 'Bihu Pitha (Traditional Treats)', as: 'বিহু পিঠা', kha: 'Kpu Pitha', mni: 'পিথা', hi: 'बीहू पीठा' },
    emoji: '🥟',
    unit: { en: 'pithas', as: 'টা পিঠা', kha: 'tylli ki pitha', mni: 'মাকোক পিথা', hi: 'पीठा' }
  },
  {
    name: { en: 'Clay Diyas (Traditional Lamps)', as: 'মাটিৰ চাকি', kha: 'Sharak', mni: 'থাওমৈ', hi: 'मिट्टी के दीये' },
    emoji: '🪔',
    unit: { en: 'diyas', as: 'গছি চাকি', kha: 'tylli ki sharak', mni: 'মাকোক থাওমৈ', hi: 'दीये' }
  },
  {
    name: { en: 'Heritage Brass Coins (Rupees)', as: 'পইচা / মুদ্ৰা', kha: 'Pisa Sikka', mni: 'লুপা মখল', hi: 'रुपये के सिक्के' },
    emoji: '🪙',
    unit: { en: 'coins', as: 'টকাৰ মুদ্ৰা', kha: 'tylli ki pisa', mni: 'লুপা খুদম', hi: 'सिक्के' }
  },
  {
    name: { en: 'Paan Leaves & Areca', as: 'পাণ-তামোল', kha: 'Kwai bad Tympew', mni: 'পানা অমসুং কুৱা', hi: 'पान-सुपारी' },
    emoji: '🍃',
    unit: { en: 'leaves', as: 'খিলা পাণ', kha: 'sla tympew', mni: 'পানা মনা', hi: 'पत्ते' }
  }
];

interface GeneratedQuestion {
  id: string;
  type: 'count' | 'addition' | 'subtraction' | 'comparison' | 'market';
  title: string;
  questionText: { en: string; as: string; kha: string; mni: string; hi: string };
  spokenText: { en: string; as: string; kha: string; mni: string; hi: string };
  theme: CalcItemTheme;
  groupA: number;
  groupB?: number;
  operation?: '+' | '-' | 'vs';
  correctAnswer: number | string;
  displayOptions: { value: number | string; label: string }[];
  hintText: { en: string; as: string; kha: string; mni: string; hi: string };
}

export const SimpleCalculationGame: React.FC<SimpleCalculationGameProps> = ({
  difficulty: propDifficulty = 'easy',
  level = 1,
  language,
  userId,
  onFinish,
  onFinishLevel,
  onBack,
  onExitToLevelSelect,
}) => {
  const levelConfig = getLevelConfig<SimpleCalculationLevelConfig>('simple_calculation', level);
  const activeDifficulty: DifficultyLevel = (levelConfig.difficulty || propDifficulty) as DifficultyLevel;

  const [currentIndex, setCurrentIndex] = useState(0);
  const [questions, setQuestions] = useState<GeneratedQuestion[]>([]);
  const [selectedOption, setSelectedOption] = useState<number | string | null>(null);
  const [isCorrect, setIsCorrect] = useState<boolean | null>(null);
  const [showHint, setShowHint] = useState(false);
  const [countedTokens, setCountedTokens] = useState<Record<string, boolean>>({});

  const [attempts, setAttempts] = useState(0);
  const [mistakes, setMistakes] = useState(0);
  const [correctAnswersCount, setCorrectAnswersCount] = useState(0);
  const [startTime, setStartTime] = useState<number>(Date.now());
  const [elapsedSec, setElapsedSec] = useState<number>(0);
  const [questionTimerSec, setQuestionTimerSec] = useState<number>(levelConfig.timePerQuestionSec || 0);

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

  // Per-question countdown if timePerQuestionSec exists
  useEffect(() => {
    if (!levelConfig.timePerQuestionSec || levelConfig.timePerQuestionSec <= 0 || gameEndedRef.current) return;

    setQuestionTimerSec(levelConfig.timePerQuestionSec);
    const qTimer = setInterval(() => {
      setQuestionTimerSec((prev) => {
        if (prev <= 1) {
          clearInterval(qTimer);
          handleTimeout();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(qTimer);
  }, [currentIndex, levelConfig.timePerQuestionSec]);

  const handleTimeout = () => {
    if (selectedOption !== null || gameEndedRef.current) return;
    soundEffects.playGentleEncouragement();
    setMistakes((prev) => prev + 1);
    setAttempts((prev) => prev + 1);
    advanceQuestion(correctAnswersCount);
  };

  const totalQuestions = levelConfig.questionsCount || 4;

  const generateOptionChoices = (correctVal: number, optionsCount: number, maxRange: number): { value: number; label: string }[] => {
    const choices = new Set<number>([correctVal]);
    
    // Add plausible nearby choices (e.g. +1, -1, +2, -2)
    const offsets = [1, -1, 2, -2, 3, -3].sort(() => Math.random() - 0.5);
    for (const offset of offsets) {
      const candidate = correctVal + offset;
      if (candidate >= 0 && candidate <= maxRange + 5 && candidate !== correctVal) {
        choices.add(candidate);
        if (choices.size >= optionsCount) break;
      }
    }
    
    // Fill remaining if needed
    let fallback = 1;
    while (choices.size < optionsCount) {
      if (!choices.has(fallback)) choices.add(fallback);
      fallback++;
    }

    return Array.from(choices)
      .sort(() => Math.random() - 0.5)
      .map((val) => ({ value: val, label: `${val}` }));
  };

  const setupQuestions = () => {
    gameEndedRef.current = false;
    const generated: GeneratedQuestion[] = [];
    const mode = levelConfig.mode || 'visual_count';
    const maxNum = levelConfig.maxNumber || 10;
    const optCount = levelConfig.optionsCount || 3;

    for (let i = 0; i < totalQuestions; i++) {
      const theme = THEMES[i % THEMES.length];
      const qId = `q_${i}_${Date.now()}`;

      if (mode === 'visual_count' || (mode === 'mixed' && i % 4 === 0)) {
        // Visual Count
        const count = Math.floor(Math.random() * Math.min(maxNum - 1, 6)) + 2; // 2 to maxNum
        const options = generateOptionChoices(count, optCount, maxNum);

        generated.push({
          id: qId,
          type: 'count',
          title: `Question ${i + 1}`,
          theme,
          groupA: count,
          correctAnswer: count,
          displayOptions: options,
          questionText: {
            en: `How many ${theme.unit.en} are in the tray?`,
            as: `থালখনত কেই${theme.unit.as} আছে গণনা কৰক?`,
            kha: `Kheiñ katno tylli ki ${theme.unit.kha} kiba don?`,
            mni: `মসিদা কয়াম ${theme.unit.mni} য়াওবগে থিদোকউ?`,
            hi: `थाली में कितने ${theme.unit.hi} हैं?`
          },
          spokenText: {
            en: `Count the ${theme.unit.en} displayed on the screen. How many are there?`,
            as: `পৰ্দাত থকা ${theme.unit.as} গণনা কৰক। ইয়াত মুঠ কেইটা আছে?`,
            kha: `Kheiñ ïa ki ${theme.unit.kha}. Katno tylli ki don?`,
            mni: `মসিদা লৈরিবা ${theme.unit.mni} থিদোকউ। অপুনবা কয়াম য়াওবগে?`,
            hi: `स्क्रीन पर दिखाई दे रहे ${theme.unit.hi} गिनें। कुल कितने हैं?`
          },
          hintText: {
            en: `Tap on each item gently to count them one by one!`,
            as: `প্ৰতিটো বস্তুৰ ওপৰত আঙুলি দি এটি এটিকৈ গণনা কৰক!`,
            kha: `Khnjot ha ki dur ban kheiñ marwei marwei!`,
            mni: `খুদম অমমদা থম্বিদুনা অমমম তাংনা থিদোকউ!`,
            hi: `एक-एक करके गिनने के लिए प्रत्येक वस्तु को धीरे से छुएं!`
          }
        });
      } else if (mode === 'addition' || (mode === 'mixed' && (i % 4 === 1 || i % 4 === 3))) {
        // Addition
        const maxPart = Math.max(2, Math.floor(maxNum / 2));
        const numA = Math.floor(Math.random() * maxPart) + 1;
        const numB = Math.floor(Math.random() * maxPart) + 1;
        const sum = numA + numB;
        const options = generateOptionChoices(sum, optCount, maxNum);

        generated.push({
          id: qId,
          type: 'addition',
          title: `Addition (${numA} + ${numB})`,
          theme,
          groupA: numA,
          groupB: numB,
          operation: '+',
          correctAnswer: sum,
          displayOptions: options,
          questionText: {
            en: `${numA} + ${numB} = ? (Add both groups)`,
            as: `${numA} + ${numB} = ? (দুয়োটা গোট একেলগে যোগ কৰক)`,
            kha: `${numA} + ${numB} = ? (Kheiñ lang baroh ar)`,
            mni: `${numA} + ${numB} = ? (অনীরোম পুনশিল্লু)`,
            hi: `${numA} + ${numB} = ? (दोनों को आपस में जोड़ें)`
          },
          spokenText: {
            en: `What is ${numA} plus ${numB}? Count both groups together.`,
            as: `${numA} আৰু ${numB} যোগ কৰিলে কিমান হ’ব? দুয়োটা গোট একেলগে হিচাপ কৰক।`,
            kha: `Katno ka long ${numA} kheiñ lang bad ${numB}?`,
            mni: `${numA} অমসুং ${numB} পুনশিল্লবা মতুংদা কয়াম ওইগনি?`,
            hi: `${numA} और ${numB} का जोड़ कितना होगा?`
          },
          hintText: {
            en: `First count ${numA} ${theme.unit.en}, then continue counting ${numB} more. Total is ${sum}.`,
            as: `প্ৰথমে ${numA} টা তাৰ পিছত আৰু ${numB} টা যোগ কৰক। মুঠ ${sum} হ’ব।`,
            kha: `Kheiñ shuwa ${numA} tylli, nangta sa ${numB} tylli.`,
            mni: `অহানবদা ${numA} থিদোকউ, মথংদা ${numB} হাপচিল্লু।`,
            hi: `पहले ${numA} गिनें, फिर उसमें ${numB} और जोड़ें। कुल ${sum} होगा।`
          }
        });
      } else if (mode === 'subtraction' || (mode === 'mixed' && i % 4 === 2)) {
        // Subtraction
        const total = Math.floor(Math.random() * (maxNum - 3)) + 4; // e.g. 4 to maxNum
        const takeAway = Math.floor(Math.random() * (total - 1)) + 1; // e.g. 1 to total - 1
        const remainder = total - takeAway;
        const options = generateOptionChoices(remainder, optCount, maxNum);

        generated.push({
          id: qId,
          type: 'subtraction',
          title: `Subtraction (${total} - ${takeAway})`,
          theme,
          groupA: total,
          groupB: takeAway,
          operation: '-',
          correctAnswer: remainder,
          displayOptions: options,
          questionText: {
            en: `You have ${total} ${theme.unit.en}. ${takeAway} are given away. How many remain?`,
            as: `আপোনাৰ হাতত ${total} ${theme.unit.as} আছিল, তাৰে ${takeAway} টা বিলাই দিলে, কেইটা বাকী থাকিল?`,
            kha: `Don ${total} tylli, la shim noh ${takeAway}. Katno kiba sah?`,
            mni: `${total} গী মনুংদগী ${takeAway} চনবা মতুংদা কয়াম লৈহৌগদগে?`,
            hi: `आपके पास ${total} ${theme.unit.hi} थे। ${takeAway} दे दिए गए। कितने बचे?`
          },
          spokenText: {
            en: `You had ${total}, and ${takeAway} were taken away. How many are left?`,
            as: `${total} টাৰ পৰা ${takeAway} টা আঁতৰালে কেইটা বাকী থাকে?`,
            kha: `Na ka ${total} la kheiñ noh ${takeAway}. Katno ba sah?`,
            mni: `${total} দগী ${takeAway} হন্থহল্লবা মতুংদা কয়াম লৈখিগদগে?`,
            hi: `${total} में से ${takeAway} घटाने पर कितने बचते हैं?`
          },
          hintText: {
            en: `Look at the remaining items that are not crossed out. There are ${remainder} left.`,
            as: `কাটি নিদিয়া বস্তুবোৰ গণনা কৰক, মুঠ ${remainder} টা বাকী আছে।`,
            kha: `Kheiñ ïa kiba dang sah. Don ${remainder} tylli.`,
            mni: `অহেম্বা লৈরিবা মচাকশিং থিদোকউ, ${remainder} লৈরি।`,
            hi: `बची हुई वस्तुओं को गिनें। कुल ${remainder} बची हैं।`
          }
        });
      } else {
        // Comparison (Which is more)
        const groupA = Math.floor(Math.random() * (maxNum - 3)) + 2;
        let groupB = Math.floor(Math.random() * (maxNum - 3)) + 2;
        if (groupA === groupB) groupB = groupA + 2;

        const isAGreater = groupA > groupB;
        const answerLabel = isAGreater ? 'Basket A' : 'Basket B';

        generated.push({
          id: qId,
          type: 'comparison',
          title: `Comparison (Which has more?)`,
          theme,
          groupA,
          groupB,
          operation: 'vs',
          correctAnswer: answerLabel,
          displayOptions: [
            { value: 'Basket A', label: `Basket A (${groupA})` },
            { value: 'Basket B', label: `Basket B (${groupB})` },
          ],
          questionText: {
            en: `Which basket has more ${theme.unit.en}? (Basket A or Basket B)`,
            as: `কোনটো পাত্ৰত বেছি ${theme.unit.as} আছে? (পাত্ৰ ক নে পাত্ৰ খ)`,
            kha: `Kano ka shang ba kham bun ki ${theme.unit.kha}?`,
            mni: `কদাইগী থালদা হেন্না য়াই? (থাল ১ নে থাল ২)`,
            hi: `किस टोकरी में अधिक ${theme.unit.hi} हैं? (टोकरी A या B)`
          },
          spokenText: {
            en: `Basket A has ${groupA}, and Basket B has ${groupB}. Which basket has more?`,
            as: `প্ৰথম পাত্ৰত ${groupA} টা আৰু দ্বিতীয় পাত্ৰত ${groupB} টা আছে। কোনটোত বেছি আছে?`,
            kha: `Ka shang A ka don ${groupA}, ka shang B ka don ${groupB}. Kano ba kham bun?`,
            mni: `অহানবদা ${groupA} অমসুং অনিশুবদা ${groupB} লৈরি। কদাইদা হেন্না য়াওবগে?`,
            hi: `टोकरी A में ${groupA} और टोकरी B में ${groupB} हैं। किसमें अधिक हैं?`
          },
          hintText: {
            en: `Compare ${groupA} and ${groupB}. The larger number is ${Math.max(groupA, groupB)}.`,
            as: `${groupA} আৰু ${groupB} তুলনা কৰক। ডাঙৰ সংখ্যাটো হ’ল ${Math.max(groupA, groupB)}।`,
            kha: `Kham bun ka ${Math.max(groupA, groupB)}.`,
            mni: `${groupA} অমসুং ${groupB} চাংদম্নৌ। চাউবা মশীকতি ${Math.max(groupA, groupB)} নি।`,
            hi: `${groupA} और ${groupB} की तुलना करें। बड़ी संख्या ${Math.max(groupA, groupB)} है।`
          }
        });
      }
    }

    setQuestions(generated);
    setCurrentIndex(0);
    setSelectedOption(null);
    setIsCorrect(null);
    setShowHint(false);
    setCountedTokens({});
    setAttempts(0);
    setMistakes(0);
    setCorrectAnswersCount(0);
    setStartTime(Date.now());
    setElapsedSec(0);
  };

  useEffect(() => {
    setupQuestions();
  }, [level]);

  const currentQ = questions[currentIndex];

  // Speak question automatically when question changes
  useEffect(() => {
    if (currentQ) {
      const speech = currentQ.spokenText.hi || currentQ.spokenText[language] || currentQ.spokenText.en;
      speakHindi(speech);
    }
  }, [currentIndex, questions.length]);

  const handleVoiceGuide = () => {
    if (currentQ) {
      soundEffects.playGentleTap();
      const speech = currentQ.spokenText.hi || currentQ.spokenText[language] || currentQ.spokenText.en;
      speakHindi(speech);
    }
  };

  const handleTokenClick = (tokenId: string) => {
    soundEffects.playGentleTap();
    setCountedTokens((prev) => ({
      ...prev,
      [tokenId]: !prev[tokenId]
    }));
  };

  const handleSelectOption = (optionVal: number | string) => {
    if (selectedOption !== null || gameEndedRef.current || !currentQ) return;

    setSelectedOption(optionVal);
    setAttempts((prev) => prev + 1);

    const match = String(optionVal).toLowerCase() === String(currentQ.correctAnswer).toLowerCase();
    setIsCorrect(match);

    let newCorrect = correctAnswersCount;

    if (match) {
      soundEffects.playSuccessChime();
      speakHindi(`बिल्कुल सही! उत्तर ${optionVal} है। बहुत बढ़िया!`);
      newCorrect += 1;
      setCorrectAnswersCount(newCorrect);
    } else {
      soundEffects.playGentleEncouragement();
      speakHindi('कोई बात नहीं, वस्तुओं को दोबारा ध्यान से गिनें।');
      setMistakes((prev) => prev + 1);
    }

    setTimeout(() => {
      advanceQuestion(newCorrect);
    }, 1400);
  };

  const advanceQuestion = (latestCorrect: number) => {
    if (gameEndedRef.current) return;

    if (currentIndex + 1 < questions.length) {
      setCurrentIndex((prev) => prev + 1);
      setSelectedOption(null);
      setIsCorrect(null);
      setShowHint(false);
      setCountedTokens({});
    } else {
      finishGame(latestCorrect);
    }
  };

  const finishGame = (finalCorrect: number) => {
    if (gameEndedRef.current) return;
    gameEndedRef.current = true;

    const totalTime = Math.max(5, Math.floor((Date.now() - startTime) / 1000));
    const totalQ = questions.length || 1;
    const accuracy = Math.round((finalCorrect / totalQ) * 100);
    const finalAttempts = attempts + 1;
    const finalMistakes = mistakes;
    const avgResponseTime = Number((totalTime / Math.max(1, finalAttempts)).toFixed(1));

    const minToPass = levelConfig.minCorrectToPass || Math.ceil(totalQ * 0.7);
    const isWin = finalCorrect >= minToPass;

    let calculatedStars = 1;
    if (accuracy >= 90 && (!levelConfig.timePerQuestionSec || avgResponseTime <= levelConfig.timePerQuestionSec * 0.8)) {
      calculatedStars = 3;
    } else if (accuracy >= 70) {
      calculatedStars = 2;
    }

    const calculatedScore = isWin
      ? Math.round(levelConfig.pointsBase + (accuracy * 2) + Math.max(0, 100 - totalTime * 2))
      : Math.round(accuracy);

    const sessionData: Omit<GameSession, 'id' | 'completed_at'> = {
      user_id: userId,
      game_type: 'simple_calculation',
      level_number: level,
      accuracy,
      response_time: avgResponseTime,
      attempts: finalAttempts,
      mistakes: finalMistakes,
      completion_rate: 100,
      difficulty_level: activeDifficulty,
      stars: Math.max(1, calculatedStars),
    };

    const levelResult: LevelFinishResult = {
      won: isWin,
      level,
      gameType: 'simple_calculation',
      score: calculatedScore,
      stars: isWin ? calculatedStars : 0,
      timeSec: totalTime,
      accuracy,
      attempts: finalAttempts,
      mistakes: finalMistakes,
      completionRate: 100,
      winConditionMet: isWin
        ? `Solved ${finalCorrect} out of ${totalQ} simple calculations accurately.`
        : undefined,
      failReason: !isWin
        ? `Solved ${finalCorrect} out of ${totalQ} correctly (Needed: ≥ ${minToPass}). You did well, let's practice once more!`
        : undefined,
    };

    if (onFinishLevel) {
      onFinishLevel(levelResult);
    }
    onFinish(sessionData);
  };

  if (!currentQ) {
    return (
      <div className="flex flex-col items-center justify-center p-12 bg-white rounded-3xl border-2 border-[#47D6B6] shadow-sm">
        <RefreshCw className="w-10 h-10 text-[#2794EB] animate-spin mb-4" />
        <p className="text-base font-bold text-slate-700">Preparing peaceful arithmetic questions...</p>
      </div>
    );
  }

  const promptText = currentQ.questionText[language] || currentQ.questionText.en;
  const hintTextDisplay = currentQ.hintText[language] || currentQ.hintText.en;

  return (
    <div className="w-full max-w-3xl mx-auto space-y-4 animate-in fade-in duration-300">
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

      {/* Main Game Stage */}
      <div className="bg-[#FAFAFA] rounded-3xl p-5 sm:p-7 border-2 border-[#47D6B6] shadow-sm space-y-6">
        {/* Header & Accessibility Bar */}
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-200 pb-4">
          <div className="flex items-center gap-3">
            <button
              onClick={onBack}
              className="p-2.5 rounded-2xl bg-white hover:bg-slate-100 border border-slate-200 text-slate-700 transition cursor-pointer flex items-center gap-1.5 text-xs font-bold shadow-xs"
              title="Return"
            >
              <ArrowLeft className="w-4 h-4" />
              <span className="hidden sm:inline">Back</span>
            </button>
            <div className="flex items-center gap-2">
              <span className="px-3 py-1 bg-amber-100 text-amber-900 border border-amber-300 rounded-full text-xs font-black uppercase tracking-wider flex items-center gap-1">
                <Calculator className="w-3.5 h-3.5 text-amber-700" />
                <span>Q {currentIndex + 1} of {totalQuestions}</span>
              </span>
              <span className="text-xs font-bold text-slate-500 hidden md:inline">
                {currentQ.theme.name[language] || currentQ.theme.name.en}
              </span>
            </div>
          </div>

          <div className="flex items-center gap-2.5">
            {/* Countdown timer if level is timed */}
            {levelConfig.timePerQuestionSec && levelConfig.timePerQuestionSec > 0 && (
              <div className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-black border ${
                questionTimerSec <= 5 
                  ? 'bg-rose-50 text-rose-700 border-rose-300 animate-pulse' 
                  : 'bg-blue-50 text-blue-800 border-blue-200'
              }`}>
                <Clock className="w-3.5 h-3.5" />
                <span>{questionTimerSec}s</span>
              </div>
            )}

            {/* Read aloud / Hindi voice button */}
            <button
              onClick={handleVoiceGuide}
              className="px-3.5 py-1.5 rounded-full bg-amber-50 hover:bg-amber-100 text-amber-900 border border-amber-300 text-xs font-black transition flex items-center gap-1.5 cursor-pointer shadow-xs"
              title="हिंदी में सुनें"
            >
              <Volume2 className="w-4 h-4 text-amber-700" />
              <span>हिंदी आवाज़</span>
            </button>

            {/* Hint Button */}
            {levelConfig.allowHints !== false && (
              <button
                onClick={() => {
                  soundEffects.playGentleTap();
                  const nextShow = !showHint;
                  setShowHint(nextShow);
                  if (nextShow && currentQ) {
                    const hintSpeech = currentQ.hintText.hi || currentQ.hintText[language] || currentQ.hintText.en;
                    speakHindi(`संकेत: ${hintSpeech}`);
                  }
                }}
                className={`px-3 py-1.5 rounded-full text-xs font-bold border transition flex items-center gap-1.5 cursor-pointer shadow-xs ${
                  showHint 
                    ? 'bg-amber-100 text-amber-900 border-amber-300' 
                    : 'bg-white hover:bg-amber-50 text-amber-800 border-amber-200'
                }`}
              >
                <Lightbulb className="w-3.5 h-3.5 text-amber-600" />
                <span>{showHint ? 'संकेत छिपाएं' : 'संकेत / Hint'}</span>
              </button>
            )}
          </div>
        </div>

        {/* Question Prompt */}
        <div className="text-center space-y-2 max-w-2xl mx-auto">
          <h2 className="text-xl sm:text-2xl md:text-3xl font-black text-[#1E293B] tracking-tight leading-snug">
            {promptText}
          </h2>
          <p className="text-xs sm:text-sm text-slate-500 font-medium">
            Tap items below to count them comfortably, then pick the correct answer.
          </p>
        </div>

        {/* Visual Token Canvas */}
        <div className="bg-white rounded-2xl p-5 sm:p-7 border border-slate-200 shadow-xs flex flex-col items-center justify-center min-h-[190px]">
          {/* Visual Display for Count Mode */}
          {currentQ.type === 'count' && (
            <div className="flex flex-wrap items-center justify-center gap-3 sm:gap-4 max-w-lg">
              {Array.from({ length: currentQ.groupA }).map((_, idx) => {
                const tokenId = `token_a_${idx}`;
                const isTapped = !!countedTokens[tokenId];
                return (
                  <button
                    key={tokenId}
                    type="button"
                    onClick={() => handleTokenClick(tokenId)}
                    className={`relative p-3 sm:p-4 rounded-2xl border-2 transition-all transform hover:scale-105 active:scale-95 cursor-pointer flex flex-col items-center justify-center ${
                      isTapped 
                        ? 'bg-emerald-50 border-emerald-500 ring-2 ring-emerald-300 shadow-sm' 
                        : 'bg-slate-50 hover:bg-slate-100 border-slate-200 shadow-xs'
                    }`}
                  >
                    <span className="text-3xl sm:text-4xl select-none">{currentQ.theme.emoji}</span>
                    {isTapped && (
                      <span className="absolute -top-2 -right-2 w-6 h-6 rounded-full bg-emerald-600 text-white font-black text-xs flex items-center justify-center shadow-xs animate-in zoom-in-50">
                        {idx + 1}
                      </span>
                    )}
                  </button>
                );
              })}
            </div>
          )}

          {/* Visual Display for Addition Mode */}
          {currentQ.type === 'addition' && (
            <div className="flex flex-col md:flex-row items-center justify-center gap-4 sm:gap-6 w-full max-w-xl">
              {/* Group A */}
              <div className="flex-1 bg-amber-50/70 rounded-2xl p-4 border border-amber-200/80 flex flex-col items-center gap-2 w-full">
                <span className="text-xs font-black text-amber-900 uppercase tracking-wider">Group 1 ({currentQ.groupA})</span>
                <div className="flex flex-wrap items-center justify-center gap-2.5">
                  {Array.from({ length: currentQ.groupA }).map((_, idx) => {
                    const tokenId = `token_add_a_${idx}`;
                    const isTapped = !!countedTokens[tokenId];
                    return (
                      <button
                        key={tokenId}
                        type="button"
                        onClick={() => handleTokenClick(tokenId)}
                        className={`relative p-2.5 sm:p-3 rounded-xl border transition-all transform hover:scale-105 cursor-pointer ${
                          isTapped ? 'bg-emerald-100 border-emerald-500' : 'bg-white border-amber-200 shadow-xs'
                        }`}
                      >
                        <span className="text-2xl sm:text-3xl select-none">{currentQ.theme.emoji}</span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Plus Sign */}
              <div className="w-10 h-10 rounded-full bg-amber-200 text-amber-900 font-black text-lg flex items-center justify-center shrink-0 border border-amber-300 shadow-xs">
                <Plus className="w-6 h-6" />
              </div>

              {/* Group B */}
              <div className="flex-1 bg-blue-50/70 rounded-2xl p-4 border border-blue-200/80 flex flex-col items-center gap-2 w-full">
                <span className="text-xs font-black text-blue-900 uppercase tracking-wider">Group 2 ({currentQ.groupB})</span>
                <div className="flex flex-wrap items-center justify-center gap-2.5">
                  {Array.from({ length: currentQ.groupB || 0 }).map((_, idx) => {
                    const tokenId = `token_add_b_${idx}`;
                    const isTapped = !!countedTokens[tokenId];
                    return (
                      <button
                        key={tokenId}
                        type="button"
                        onClick={() => handleTokenClick(tokenId)}
                        className={`relative p-2.5 sm:p-3 rounded-xl border transition-all transform hover:scale-105 cursor-pointer ${
                          isTapped ? 'bg-emerald-100 border-emerald-500' : 'bg-white border-blue-200 shadow-xs'
                        }`}
                      >
                        <span className="text-2xl sm:text-3xl select-none">{currentQ.theme.emoji}</span>
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>
          )}

          {/* Visual Display for Subtraction Mode */}
          {currentQ.type === 'subtraction' && (
            <div className="flex flex-col items-center gap-3 w-full max-w-lg">
              <div className="flex items-center gap-2 text-xs font-black text-slate-600 uppercase tracking-wider">
                <span>Total: {currentQ.groupA}</span>
                <span>•</span>
                <span className="text-rose-600 font-bold">Crossed out / Given: {currentQ.groupB}</span>
              </div>
              <div className="flex flex-wrap items-center justify-center gap-3">
                {Array.from({ length: currentQ.groupA }).map((_, idx) => {
                  const isCrossed = idx < (currentQ.groupB || 0);
                  const tokenId = `token_sub_${idx}`;
                  const isTapped = !!countedTokens[tokenId];
                  return (
                    <button
                      key={tokenId}
                      type="button"
                      onClick={() => handleTokenClick(tokenId)}
                      className={`relative p-3 rounded-2xl border-2 transition-all flex flex-col items-center justify-center ${
                        isCrossed 
                          ? 'bg-rose-50 border-rose-200 opacity-60' 
                          : isTapped
                          ? 'bg-emerald-50 border-emerald-500 shadow-sm'
                          : 'bg-white border-slate-200 shadow-xs hover:bg-slate-50'
                      }`}
                    >
                      <span className="text-3xl select-none">{currentQ.theme.emoji}</span>
                      {isCrossed && (
                        <div className="absolute inset-0 flex items-center justify-center">
                          <X className="w-8 h-8 text-rose-600 stroke-[3]" />
                        </div>
                      )}
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* Visual Display for Comparison Mode */}
          {currentQ.type === 'comparison' && (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6 w-full max-w-xl">
              {/* Basket A */}
              <div className="bg-amber-50/80 rounded-2xl p-4 border-2 border-amber-300 flex flex-col items-center gap-2.5 shadow-xs">
                <span className="text-xs font-black text-amber-950 uppercase tracking-wider bg-amber-200/80 px-3 py-0.5 rounded-full">
                  Basket A ({currentQ.groupA})
                </span>
                <div className="flex flex-wrap items-center justify-center gap-2">
                  {Array.from({ length: currentQ.groupA }).map((_, idx) => (
                    <span key={idx} className="text-2xl p-1 bg-white rounded-lg border border-amber-200 shadow-2xs">
                      {currentQ.theme.emoji}
                    </span>
                  ))}
                </div>
              </div>

              {/* Basket B */}
              <div className="bg-teal-50/80 rounded-2xl p-4 border-2 border-teal-300 flex flex-col items-center gap-2.5 shadow-xs">
                <span className="text-xs font-black text-teal-950 uppercase tracking-wider bg-teal-200/80 px-3 py-0.5 rounded-full">
                  Basket B ({currentQ.groupB})
                </span>
                <div className="flex flex-wrap items-center justify-center gap-2">
                  {Array.from({ length: currentQ.groupB || 0 }).map((_, idx) => (
                    <span key={idx} className="text-2xl p-1 bg-white rounded-lg border border-teal-200 shadow-2xs">
                      {currentQ.theme.emoji}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Hint Box (if toggled) */}
        {showHint && (
          <div className="bg-amber-50 border border-amber-300 rounded-2xl p-4 flex items-start gap-3 animate-in fade-in slide-in-from-top-2">
            <Lightbulb className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
            <div>
              <h4 className="text-xs font-black text-amber-900 uppercase tracking-wider">Helpful Clue</h4>
              <p className="text-sm font-medium text-amber-950 mt-0.5">{hintTextDisplay}</p>
            </div>
          </div>
        )}

        {/* Multiple Choice Options */}
        <div className="space-y-3">
          <div className="text-xs font-black uppercase tracking-wider text-slate-500 text-center">
            Choose the correct answer:
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3.5">
            {currentQ.displayOptions.map((opt) => {
              const isSelected = selectedOption === opt.value;
              const isOptionCorrect = String(opt.value).toLowerCase() === String(currentQ.correctAnswer).toLowerCase();
              
              let buttonStyle = 'bg-white hover:bg-slate-50 text-slate-800 border-2 border-slate-300 hover:border-blue-400 shadow-xs';
              
              if (selectedOption !== null) {
                if (isSelected && isOptionCorrect) {
                  buttonStyle = 'bg-emerald-100 text-emerald-950 border-2 border-emerald-500 ring-2 ring-emerald-300 scale-102';
                } else if (isSelected && !isOptionCorrect) {
                  buttonStyle = 'bg-rose-100 text-rose-950 border-2 border-rose-500 ring-2 ring-rose-300';
                } else if (isOptionCorrect) {
                  buttonStyle = 'bg-emerald-50 text-emerald-900 border-2 border-emerald-400';
                } else {
                  buttonStyle = 'bg-slate-100 text-slate-400 border-slate-200 opacity-60';
                }
              }

              return (
                <button
                  key={String(opt.value)}
                  type="button"
                  disabled={selectedOption !== null}
                  onClick={() => handleSelectOption(opt.value)}
                  className={`p-4 sm:p-5 rounded-2xl font-black text-lg sm:text-xl transition-all duration-200 cursor-pointer flex items-center justify-center gap-2 active:scale-97 ${buttonStyle}`}
                >
                  <span>{opt.label}</span>
                  {selectedOption !== null && isOptionCorrect && (
                    <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
                  )}
                </button>
              );
            })}
          </div>
        </div>

        {/* Instant Feedback Message */}
        {selectedOption !== null && (
          <div className={`p-4 rounded-2xl text-center text-sm font-black flex items-center justify-center gap-2 border animate-in zoom-in-95 ${
            isCorrect 
              ? 'bg-emerald-100 text-emerald-900 border-emerald-300' 
              : 'bg-amber-100 text-amber-900 border-amber-300'
          }`}>
            {isCorrect ? (
              <>
                <CheckCircle2 className="w-5 h-5 text-emerald-600" />
                <span>Wonderful! Correct answer!</span>
              </>
            ) : (
              <>
                <HelpCircle className="w-5 h-5 text-amber-600" />
                <span>Close effort! The answer was {currentQ.correctAnswer}. Keep going!</span>
              </>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
