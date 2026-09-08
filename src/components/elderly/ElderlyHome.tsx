import React, { useState } from 'react';
import { 
  Volume2, 
  AlertCircle, 
  Heart, 
  CheckCircle2, 
  Circle, 
  Sparkles, 
  ChevronRight,
  ShieldAlert,
  Puzzle,
  Music,
  Grid,
  Image as ImageIcon,
  Users,
  BookOpen,
  GitFork,
  Mic,
  Pill,
  Bell,
  HeartHandshake,
  ShieldCheck,
  Camera,
  Edit3,
  Calendar,
  Palette,
  Layout,
  Moon,
  Sun
} from 'lucide-react';
import { 
  User, 
  GameType, 
  RegionalLanguage, 
  Reminder, 
  AIRecommendation,
  UILayoutMode
} from '../../types';
import { UI_TRANSLATIONS } from '../../data/nerContent';
import { soundEffects, speakText } from '../../utils/speechAndAudio';

interface ElderlyHomeProps {
  user: User;
  language: RegionalLanguage;
  reminders: Reminder[];
  recommendation: AIRecommendation | null;
  assignedCaregiverName?: string;
  assignedCaregiverCode?: string;
  layoutMode?: UILayoutMode;
  onOpenDesignStudio?: () => void;
  onSelectGame: (gameType: GameType) => void;
  onOpenFamilyAlbum: () => void;
  onOpenJournal: () => void;
  onOpenConnectCaregiver?: () => void;
  onEditProfile?: () => void;
  onTriggerSOS: () => void;
  onToggleReminder: (reminderId: string) => void;
  onTriggerAlarm?: (reminder: Reminder) => void;
}

export const ElderlyHome: React.FC<ElderlyHomeProps> = ({
  user,
  language,
  reminders,
  recommendation,
  assignedCaregiverName,
  assignedCaregiverCode,
  layoutMode = 'standard',
  onOpenDesignStudio,
  onSelectGame,
  onOpenFamilyAlbum,
  onOpenJournal,
  onOpenConnectCaregiver,
  onEditProfile,
  onTriggerSOS,
  onToggleReminder,
  onTriggerAlarm,
}) => {
  const t = UI_TRANSLATIONS[language] || UI_TRANSLATIONS.en;
  const [sosModalOpen, setSosModalOpen] = useState(false);
  const [sosSent, setSosSent] = useState(false);

  const effectiveCaregiverName =
    assignedCaregiverName ||
    user.connected_caregiver_name ||
    user.emergency_contact?.name ||
    'Assigned Caregiver';

  const effectiveCaregiverCode =
    assignedCaregiverCode ||
    user.connected_caregiver_id ||
    null;

  const isCaregiverAssigned = Boolean(
    assignedCaregiverName ||
    user.connected_caregiver_name ||
    user.connected_caregiver_id
  );

  const handleSOSConfirm = () => {
    soundEffects.playGentleEncouragement();
    setSosSent(true);
    onTriggerSOS();
    const spokenAlert = t.sos_sent ? t.sos_sent.replace(/Priya|প্ৰিয়া|প্রিয়াদা/gi, effectiveCaregiverName) : `Alert sent to ${effectiveCaregiverName}!`;
    speakText(spokenAlert, language);

    setTimeout(() => {
      setSosModalOpen(false);
      setSosSent(false);
    }, 4000);
  };

  const handleReadGreeting = () => {
    const greeting = `${t.welcome} ${user.name}! Smaran Sathi. Har kadam par aapka humsafar. ${t.app_subtitle}. Tap any game below to begin your joyful memory companion journey.`;
    speakText(greeting, language);
  };

  // Game menu cards with fresh palette styling
  const gamesList: {
    type: GameType;
    title: string;
    description: string;
    icon: React.ReactNode;
    cardStyle: string;
    iconBg: string;
    textStyle: string;
    borderDivider: string;
    badge?: string;
  }[] = [
    {
      type: 'memory_match',
      title: t.memory_match,
      description: t.memory_match_desc,
      icon: <Grid className="w-9 h-9 text-[#3E82F0]" />,
      cardStyle: 'bg-[#FAFAFA] border-2 border-[#8DE5A6] shadow-sm hover:border-[#6BC1B8] hover:shadow-md hover:translate-y-0.5 active:translate-y-1',
      iconBg: 'bg-white border border-[#8DE5A6]',
      textStyle: 'text-[#1E293B]',
      borderDivider: 'border-slate-200 text-[#3E82F0]',
      badge: recommendation?.next_game_type === 'memory_match' ? 'Recommended' : undefined,
    },
    {
      type: 'sequence_recall',
      title: t.sequence_recall,
      description: t.sequence_recall_desc,
      icon: <Music className="w-9 h-9 text-[#3E82F0]" />,
      cardStyle: 'bg-[#FAFAFA] border-2 border-[#8DE5A6] shadow-sm hover:border-[#6BC1B8] hover:shadow-md hover:translate-y-0.5 active:translate-y-1',
      iconBg: 'bg-white border border-[#8DE5A6]',
      textStyle: 'text-[#1E293B]',
      borderDivider: 'border-slate-200 text-[#3E82F0]',
      badge: recommendation?.next_game_type === 'sequence_recall' ? 'Recommended' : undefined,
    },
    {
      type: 'picture_recognition',
      title: t.picture_recognition,
      description: t.picture_recognition_desc,
      icon: <ImageIcon className="w-9 h-9 text-[#3E82F0]" />,
      cardStyle: 'bg-[#FAFAFA] border-2 border-[#8DE5A6] shadow-sm hover:border-[#6BC1B8] hover:shadow-md hover:translate-y-0.5 active:translate-y-1',
      iconBg: 'bg-white border border-[#8DE5A6]',
      textStyle: 'text-[#1E293B]',
      borderDivider: 'border-slate-200 text-[#3E82F0]',
      badge: recommendation?.next_game_type === 'picture_recognition' ? 'Recommended' : undefined,
    },
    {
      type: 'simple_puzzle',
      title: t.simple_puzzle,
      description: t.simple_puzzle_desc,
      icon: <Puzzle className="w-9 h-9 text-[#3E82F0]" />,
      cardStyle: 'bg-[#FAFAFA] border-2 border-[#8DE5A6] shadow-sm hover:border-[#6BC1B8] hover:shadow-md hover:translate-y-0.5 active:translate-y-1',
      iconBg: 'bg-white border border-[#8DE5A6]',
      textStyle: 'text-[#1E293B]',
      borderDivider: 'border-slate-200 text-[#3E82F0]',
      badge: recommendation?.next_game_type === 'simple_puzzle' ? 'Recommended' : undefined,
    },
    {
      type: 'face_match',
      title: t.face_match,
      description: t.face_match_desc,
      icon: <Heart className="w-9 h-9 text-[#3E82F0] fill-[#3E82F0]/20" />,
      cardStyle: 'bg-[#FAFAFA] border-2 border-[#8DE5A6] shadow-sm hover:border-[#6BC1B8] hover:shadow-md hover:translate-y-0.5 active:translate-y-1',
      iconBg: 'bg-white border border-[#8DE5A6]',
      textStyle: 'text-[#1E293B]',
      borderDivider: 'border-slate-200 text-[#3E82F0]',
      badge: recommendation?.next_game_type === 'face_match' ? 'Recommended' : undefined,
    },
  ];

  return (
    <div className="w-full max-w-5xl mx-auto space-y-8 animate-fade-in pb-12">
      {/* Elderly Welcome Hero Card with Theme Gradient */}
      <div 
        style={{ background: 'linear-gradient(to right, #C3F2D6, #8DE5A6, #6BC1B8, #3E82F0)' }}
        className="rounded-[32px] p-6 md:p-8 border-2 border-[#6BC1B8] shadow-md flex flex-col md:flex-row items-center justify-between gap-6 text-[#1E293B]"
      >
        <div className="flex flex-col sm:flex-row items-center gap-5 text-center sm:text-left">
          <div className="relative group shrink-0">
            {user.avatar ? (
              <img
                src={user.avatar}
                alt={user.name}
                className="w-24 h-24 md:w-28 md:h-28 rounded-full object-cover border-4 border-white shadow-md shrink-0"
              />
            ) : (
              <div className="w-24 h-24 md:w-28 md:h-28 rounded-full bg-white flex items-center justify-center text-4xl shadow-inner border-4 border-white">
                🧓
              </div>
            )}
            {onEditProfile && (
              <button
                id="elderly-avatar-edit-btn"
                type="button"
                onClick={() => {
                  soundEffects.playGentleTap();
                  onEditProfile();
                }}
                className="absolute -bottom-1 -right-1 p-2 rounded-full bg-white hover:bg-slate-50 text-[#1E293B] border-2 border-[#8DE5A6] shadow-md cursor-pointer transition-transform active:scale-95 group-hover:scale-105"
                title="Change Profile Picture"
              >
                <Camera className="w-4 h-4 text-[#1E293B]" />
              </button>
            )}
          </div>

          <div className="space-y-1.5">
            <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2">
              <h1 className="text-3xl md:text-4xl font-black text-[#1E293B] tracking-tight">
                {t.welcome} {user.name}!
              </h1>
              {onEditProfile && (
                <button
                  id="elderly-edit-profile-btn"
                  type="button"
                  onClick={() => {
                    soundEffects.playGentleTap();
                    onEditProfile();
                  }}
                  className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/90 hover:bg-white text-[#1E293B] border border-[#8DE5A6] text-xs font-black shadow-2xs transition-all cursor-pointer"
                  title="Edit Profile Information and Photo"
                >
                  <Edit3 className="w-3.5 h-3.5 text-[#3E82F0]" />
                  <span>Edit Profile</span>
                </button>
              )}
            </div>

            <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2 pt-0.5">
              <p className="text-[#1E293B] font-bold text-base md:text-lg">
                {t.app_subtitle}
              </p>
              <span className="inline-flex items-center gap-1.5 px-3 py-0.5 rounded-full bg-white/95 border border-[#8DE5A6] text-[#1E293B] text-xs font-black shadow-2xs">
                <span>🌸</span>
                <span>हर कदम पर आपका हमसफ़र।</span>
              </span>
            </div>
            <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2.5 pt-0.5">
              <span className="text-sm text-[#1E293B] font-bold bg-white/80 px-2.5 py-0.5 rounded-full border border-[#8DE5A6]">
                📍 {user.location || 'Guwahati, Assam'}
              </span>
              <button
                type="button"
                onClick={() => {
                  soundEffects.playGentleTap();
                  onEditProfile?.();
                }}
                className="inline-flex items-center gap-1.5 px-3 py-0.5 rounded-full bg-white/90 hover:bg-white text-[#1E293B] border border-[#8DE5A6] text-xs font-black transition-all cursor-pointer shadow-2xs active:scale-95"
                title="Click to change age"
              >
                <Calendar className="w-3.5 h-3.5 text-[#3E82F0]" />
                <span>Age: {user.age || 72}</span>
                <span className="text-[10px] text-[#3E82F0] underline font-bold">Change</span>
              </button>
            </div>

            {/* Connected Caregiver Status / Action */}
            <div className="pt-2">
              {user.connected_caregiver_id ? (
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/95 text-[#1E293B] border border-[#8DE5A6] text-xs font-black shadow-xs">
                  <ShieldCheck className="w-4 h-4 text-[#3E82F0]" />
                  <span>
                    Caregiver: {user.connected_caregiver_name || user.connected_caregiver_id} ({user.connected_caregiver_id})
                  </span>
                  {onOpenConnectCaregiver && (
                    <button
                      type="button"
                      onClick={() => {
                        soundEffects.playGentleTap();
                        onOpenConnectCaregiver();
                      }}
                      className="ml-1 text-[11px] underline text-[#3E82F0] hover:text-[#1E293B] cursor-pointer font-bold"
                    >
                      Change
                    </button>
                  )}
                </div>
              ) : (
                <button
                  type="button"
                  onClick={() => {
                    soundEffects.playGentleTap();
                    onOpenConnectCaregiver?.();
                  }}
                  className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-white hover:bg-slate-50 text-[#1E293B] border-2 border-[#8DE5A6] text-xs font-black shadow-xs cursor-pointer transition-colors"
                >
                  <HeartHandshake className="w-4 h-4 text-[#3E82F0] animate-pulse" />
                  <span>⚠️ Connect Your Caregiver ID</span>
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Read aloud guide button */}
        <button
          id="elderly-welcome-voice"
          onClick={handleReadGreeting}
          className="min-h-[56px] px-6 py-3 rounded-2xl bg-[#1E293B] hover:bg-slate-800 text-white font-extrabold text-base md:text-lg flex items-center justify-center gap-3 shadow-md active:translate-y-1 transition-all border-2 border-slate-700 shrink-0 cursor-pointer"
        >
          <Volume2 className="w-6 h-6 text-[#6BC1B8]" />
          <span>{t.voice_guide}</span>
        </button>
      </div>

      {/* Active Interface Layout Archetype Bar */}
      <div className="flex flex-wrap items-center justify-between gap-3 px-5 py-3 rounded-2xl bg-white border-2 border-[#8DE5A6]/80 shadow-2xs">
        <div className="flex items-center gap-2 text-xs sm:text-sm font-bold text-slate-700">
          <Layout className="w-4 h-4 text-[#3E82F0]" />
          <span>Active Interface Layout:</span>
          <span className="font-black px-2.5 py-0.5 rounded-full bg-blue-50 text-blue-900 border border-blue-200">
            {layoutMode === 'bento' ? 'Modular Bento Grid' : layoutMode === 'zen' ? 'Zen Sundowning Calm' : 'Tactile Senior Tablet'}
          </span>
        </div>

        {onOpenDesignStudio && (
          <button
            id="elderly-customize-layout-btn"
            type="button"
            onClick={() => {
              soundEffects.playGentleTap();
              onOpenDesignStudio();
            }}
            className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-slate-900 hover:bg-[#3E82F0] text-white text-xs font-black transition-all cursor-pointer shadow-xs active:scale-95"
          >
            <Palette className="w-3.5 h-3.5 text-[#8DE5A6]" />
            <span>Customize Layout & Themes</span>
          </button>
        )}
      </div>

      {layoutMode === 'zen' ? (
        /* ZEN SUNDOWNING CALM INTERFACE */
        <div className="space-y-6">
          <div className="p-8 sm:p-12 rounded-[40px] bg-gradient-to-b from-amber-900/90 to-amber-950 text-amber-100 border-4 border-amber-600/60 shadow-2xl space-y-8 text-center max-w-2xl mx-auto">
            <div className="w-20 h-20 mx-auto rounded-full bg-amber-500/20 border-2 border-amber-400/80 flex items-center justify-center text-amber-300 shadow-inner">
              <Moon className="w-10 h-10" />
            </div>
            
            <div className="space-y-2">
              <span className="text-xs uppercase tracking-widest font-black text-amber-300 bg-amber-900/80 px-3 py-1 rounded-full border border-amber-500/40">
                Sundowning Calm Mode · Reduced Cognitive Load
              </span>
              <h2 className="text-3xl sm:text-4xl font-black text-amber-50 tracking-tight">
                {t.welcome} {user.name}
              </h2>
              <p className="text-base sm:text-lg text-amber-200 max-w-lg mx-auto font-medium">
                Take a calm breath. Enjoy the gentle warmth and peaceful evening sounds.
              </p>
            </div>

            {/* Solitary Gentle Memory Card */}
            <div className="p-6 rounded-3xl bg-amber-900/60 border-2 border-amber-500/40 text-left flex flex-col sm:flex-row items-center justify-between gap-5">
              <div className="flex items-center gap-4">
                <div className="w-16 h-16 rounded-2xl bg-amber-400 text-amber-950 flex items-center justify-center font-black text-3xl shadow-md shrink-0">
                  🌸
                </div>
                <div>
                  <span className="text-xs font-black uppercase text-amber-300">Tonight's Gentle Activity</span>
                  <h3 className="text-xl font-black text-white">Memory Card Match</h3>
                  <p className="text-xs text-amber-200 mt-0.5">Gentle matching with native flowers, tea leaves, and birds.</p>
                </div>
              </div>
              <button
                id="zen-play-game-btn"
                onClick={() => {
                  soundEffects.playGentleTap(520);
                  onSelectGame('memory_match');
                }}
                className="w-full sm:w-auto px-7 py-3.5 rounded-2xl bg-amber-400 hover:bg-amber-300 text-amber-950 font-black text-base shadow-lg cursor-pointer transition-all active:scale-95 shrink-0"
              >
                Begin Game
              </button>
            </div>

            {/* Soothing Soundscapes */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
              <button
                onClick={() => {
                  soundEffects.playGentleChime(392);
                  speakText('Playing peaceful Assamese bamboo flute melodies.', language);
                }}
                className="p-4 rounded-2xl bg-amber-900/40 hover:bg-amber-800/60 border border-amber-500/30 text-left flex items-center gap-3 cursor-pointer transition-all"
              >
                <div className="w-10 h-10 rounded-xl bg-amber-500/20 flex items-center justify-center text-amber-300 shrink-0">
                  <Music className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="text-sm font-black text-white">Bamboo Flute</h4>
                  <span className="text-xs text-amber-200">Peaceful evening melody</span>
                </div>
              </button>

              <button
                onClick={() => {
                  soundEffects.playGentleChime(440);
                  speakText('Playing soothing rain sounds of the Brahmaputra valley.', language);
                }}
                className="p-4 rounded-2xl bg-amber-900/40 hover:bg-amber-800/60 border border-amber-500/30 text-left flex items-center gap-3 cursor-pointer transition-all"
              >
                <div className="w-10 h-10 rounded-xl bg-amber-500/20 flex items-center justify-center text-amber-300 shrink-0">
                  <Volume2 className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="text-sm font-black text-white">Valley Rain</h4>
                  <span className="text-xs text-amber-200">Gentle relaxing raindrops</span>
                </div>
              </button>
            </div>

            {/* Next Medication Reminder */}
            {reminders.length > 0 && (
              <div className="p-4 rounded-2xl bg-amber-900/40 border border-amber-500/30 flex items-center justify-between text-left">
                <div className="flex items-center gap-3">
                  <Pill className="w-6 h-6 text-amber-400" />
                  <div>
                    <h5 className="text-sm font-black text-white">{reminders[0].title}</h5>
                    <span className="text-xs text-amber-300 font-bold">⏰ {reminders[0].time}</span>
                  </div>
                </div>
                <button
                  onClick={() => onToggleReminder(reminders[0].id)}
                  className={`px-4 py-2 rounded-xl text-xs font-black cursor-pointer ${
                    reminders[0].completed
                      ? 'bg-emerald-800 text-white'
                      : 'bg-amber-400 text-amber-950 hover:bg-amber-300'
                  }`}
                >
                  {reminders[0].completed ? '✓ Taken' : 'Mark Taken'}
                </button>
              </div>
            )}

            {/* Emergency Calm Pill */}
            <div className="pt-4 border-t border-amber-800/80 flex items-center justify-between text-xs text-amber-300">
              <span>Caregiver on call: <strong>{effectiveCaregiverName}</strong></span>
              <button
                onClick={() => setSosModalOpen(true)}
                className="px-3 py-1.5 rounded-xl bg-rose-900/80 hover:bg-rose-800 text-rose-200 border border-rose-600/50 font-black cursor-pointer"
              >
                🚨 Emergency Help
              </button>
            </div>
          </div>
        </div>
      ) : layoutMode === 'bento' ? (
        /* MODULAR BENTO GRID INTERFACE */
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Bento Tile 1 (Span 2): Brain & Memory Games Matrix */}
            <div className="md:col-span-2 p-6 md:p-8 rounded-[32px] bg-[#FAFAFA] border-2 border-[#8DE5A6] shadow-sm flex flex-col justify-between space-y-4">
              <div className="flex items-center justify-between border-b border-slate-200 pb-3">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-emerald-100 border border-emerald-200 flex items-center justify-center text-emerald-800">
                    <Sparkles className="w-5 h-5 text-emerald-700" />
                  </div>
                  <div>
                    <h3 className="text-xl font-black text-slate-900">{t.play_game}</h3>
                    <p className="text-xs text-slate-600 font-bold">Culturally tailored memory & cognitive stimulation</p>
                  </div>
                </div>
                {recommendation && (
                  <span className="text-xs font-black bg-blue-100 text-blue-900 px-2.5 py-1 rounded-full border border-blue-200">
                    AI Pick: {recommendation.recommended_game_title}
                  </span>
                )}
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                {gamesList.map((g) => (
                  <button
                    key={g.type}
                    id={`bento-game-${g.type}`}
                    onClick={() => {
                      soundEffects.playGentleTap(500);
                      onSelectGame(g.type);
                    }}
                    className="p-4 rounded-2xl bg-white hover:bg-slate-50 border-2 border-[#8DE5A6] hover:border-[#3E82F0] shadow-xs flex items-center gap-3.5 text-left transition-all cursor-pointer hover:translate-y-[-2px]"
                  >
                    <div className="w-12 h-12 rounded-xl bg-slate-50 border border-slate-200 flex items-center justify-center shadow-2xs shrink-0">
                      {g.icon}
                    </div>
                    <div className="min-w-0">
                      <h4 className="font-black text-slate-900 text-sm md:text-base truncate">{g.title}</h4>
                      <p className="text-xs text-slate-500 font-medium line-clamp-1 mt-0.5">{g.description}</p>
                    </div>
                  </button>
                ))}
              </div>
            </div>

            {/* Bento Tile 2: Today's Scheduled Routine */}
            <div className="p-6 md:p-8 rounded-[32px] bg-[#FAFAFA] border-2 border-[#8DE5A6] shadow-sm flex flex-col justify-between space-y-4">
              <div>
                <div className="flex items-center justify-between border-b border-slate-200 pb-3">
                  <h3 className="text-lg font-black text-slate-900 flex items-center gap-2">
                    <Calendar className="w-5 h-5 text-[#3E82F0]" />
                    <span>{t.daily_reminders}</span>
                  </h3>
                  <span className="text-xs font-black bg-blue-100 text-blue-900 px-2 py-0.5 rounded-full">
                    {reminders.filter(r => !r.completed).length} Pending
                  </span>
                </div>

                <div className="space-y-2.5 pt-3">
                  {reminders.slice(0, 3).map((rem) => (
                    <div
                      key={rem.id}
                      onClick={() => onToggleReminder(rem.id)}
                      className="p-3 rounded-2xl bg-white border border-slate-200 hover:border-[#8DE5A6] flex items-center justify-between cursor-pointer transition-all"
                    >
                      <div className="min-w-0">
                        <h4 className={`text-xs font-black ${rem.completed ? 'line-through text-slate-400' : 'text-slate-900'} truncate`}>
                          {rem.title}
                        </h4>
                        <span className="text-[11px] text-[#3E82F0] font-bold">⏰ {rem.time}</span>
                      </div>
                      <button
                        type="button"
                        className={`px-3 py-1 rounded-xl text-xs font-black cursor-pointer shrink-0 ${
                          rem.completed ? 'bg-emerald-100 text-emerald-800' : 'bg-slate-900 text-white'
                        }`}
                      >
                        {rem.completed ? '✓' : 'Take'}
                      </button>
                    </div>
                  ))}
                </div>
              </div>

              <button
                type="button"
                onClick={() => speakText('Here are your daily routine and medicine reminders.', language)}
                className="w-full py-2.5 rounded-xl bg-white hover:bg-slate-50 border border-[#8DE5A6] text-xs font-black text-[#1E293B] flex items-center justify-center gap-2 cursor-pointer shadow-2xs"
              >
                <Volume2 className="w-4 h-4 text-[#3E82F0]" />
                <span>Voice Readout Reminders</span>
              </button>
            </div>

            {/* Bento Tile 3: Family Photo Album */}
            <button
              onClick={() => {
                soundEffects.playGentleTap();
                onOpenFamilyAlbum();
              }}
              className="p-6 md:p-7 rounded-[32px] bg-[#FAFAFA] border-2 border-[#8DE5A6] hover:border-[#3E82F0] shadow-sm text-left flex flex-col justify-between cursor-pointer transition-all hover:translate-y-[-2px]"
            >
              <div className="w-12 h-12 rounded-2xl bg-white border border-[#8DE5A6] flex items-center justify-center text-[#3E82F0] shadow-xs">
                <Users className="w-6 h-6" />
              </div>
              <div className="pt-3">
                <h4 className="text-lg font-black text-slate-900">Family & Loved Ones</h4>
                <p className="text-xs text-slate-600 font-medium mt-1">Look at photos and hear warm voice messages from family.</p>
              </div>
              <span className="text-xs font-black text-[#3E82F0] flex items-center gap-1 pt-3 border-t border-slate-200">
                <span>Open Family Album</span> <ChevronRight className="w-4 h-4" />
              </span>
            </button>

            {/* Bento Tile 4: Memory Journal & Stories */}
            <button
              onClick={() => {
                soundEffects.playGentleTap();
                onOpenJournal();
              }}
              className="p-6 md:p-7 rounded-[32px] bg-[#FAFAFA] border-2 border-[#8DE5A6] hover:border-[#6BC1B8] shadow-sm text-left flex flex-col justify-between cursor-pointer transition-all hover:translate-y-[-2px]"
            >
              <div className="w-12 h-12 rounded-2xl bg-white border border-[#8DE5A6] flex items-center justify-center text-emerald-600 shadow-xs">
                <BookOpen className="w-6 h-6" />
              </div>
              <div className="pt-3">
                <h4 className="text-lg font-black text-slate-900">Memory Journal & Audio</h4>
                <p className="text-xs text-slate-600 font-medium mt-1">Listen to childhood tales of Majuli and record new memories.</p>
              </div>
              <span className="text-xs font-black text-emerald-700 flex items-center gap-1 pt-3 border-t border-slate-200">
                <span>🎙️ Speak Stories</span> <ChevronRight className="w-4 h-4" />
              </span>
            </button>

            {/* Bento Tile 5: Large Emergency SOS Button */}
            <button
              id="bento-sos-btn"
              onClick={() => setSosModalOpen(true)}
              className="p-6 md:p-7 rounded-[32px] bg-rose-600 hover:bg-rose-700 text-white shadow-md text-left flex flex-col justify-between cursor-pointer transition-all hover:translate-y-[-2px] border-4 border-rose-300"
            >
              <div className="w-12 h-12 rounded-2xl bg-white/20 flex items-center justify-center text-white">
                <ShieldAlert className="w-7 h-7" />
              </div>
              <div className="pt-3">
                <span className="text-xs uppercase font-black tracking-widest text-rose-200">One-Touch Emergency</span>
                <h4 className="text-2xl font-black text-white mt-0.5">🚨 {t.sos_button}</h4>
                <p className="text-xs text-rose-100 font-bold mt-1">Alerts caregiver {effectiveCaregiverName} instantly</p>
              </div>
              <span className="text-xs font-black text-white bg-white/20 px-3 py-1.5 rounded-xl self-start mt-2">
                Press for Immediate Help
              </span>
            </button>
          </div>
        </div>
      ) : (
        /* STANDARD TACTILE SENIOR TABLET LAYOUT */
        <>
          {/* Main Grid: Cognitive Games Menu (Large buttons/tap targets min 60px) */}
          <div className="space-y-5">
            <div className="flex items-center justify-between">
              <h2 className="text-2xl md:text-3xl font-black text-gray-900 flex items-center gap-3">
                <Sparkles className="w-8 h-8 text-orange-500" />
                <span>{t.play_game}</span>
              </h2>
              <span className="text-sm md:text-base font-bold text-gray-500">
                No rush · Play at your comfort
              </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {gamesList.map((game) => (
                <button
                  key={game.type}
                  id={`game-btn-${game.type}`}
                  onClick={() => {
                    soundEffects.playGentleTap(500);
                    onSelectGame(game.type);
                  }}
                  className={`relative min-h-[160px] p-6 md:p-7 rounded-[36px] text-left flex flex-col justify-between transition-all duration-200 cursor-pointer ${game.cardStyle}`}
                >
                  {game.badge && (
                    <span className="absolute top-4 right-4 px-3 py-1 rounded-full bg-emerald-500 text-white font-black text-xs tracking-wider uppercase shadow-sm">
                      ★ {game.badge}
                    </span>
                  )}

                  <div className="flex items-center gap-4">
                    <div className={`w-14 h-14 rounded-2xl flex items-center justify-center shadow-inner shrink-0 ${game.iconBg}`}>
                      {game.icon}
                    </div>
                    <div>
                      <h3 className={`text-xl md:text-2xl font-black leading-snug ${game.textStyle}`}>
                        {game.title}
                      </h3>
                    </div>
                  </div>

                  <p className="text-gray-600 font-bold text-sm md:text-base leading-snug mt-3">
                    {game.description}
                  </p>

                  <div className={`flex items-center justify-between pt-3 mt-3 border-t font-black text-sm ${game.borderDivider}`}>
                    <span>Start Playing</span>
                    <ChevronRight className="w-5 h-5" />
                  </div>
                </button>
              ))}

              {/* Familiar People Album Card */}
              <button
                id="family-album-btn"
                onClick={() => {
                  soundEffects.playGentleTap(550);
                  onOpenFamilyAlbum();
                }}
                className="min-h-[160px] p-6 md:p-7 rounded-[36px] bg-[#FAFAFA] border-2 border-[#8DE5A6] shadow-sm hover:border-[#6BC1B8] hover:shadow-md hover:translate-y-0.5 active:translate-y-1 text-left flex flex-col justify-between transition-all duration-200 cursor-pointer"
              >
                <div className="flex items-center gap-4">
                  <div className="w-14 h-14 rounded-2xl bg-white border border-[#8DE5A6] flex items-center justify-center text-[#3E82F0] shadow-2xs shrink-0">
                    <Users className="w-9 h-9" />
                  </div>
                  <h3 className="text-xl md:text-2xl font-black text-[#1E293B] leading-snug">
                    Family & Friends Album
                  </h3>
                </div>
                <p className="text-slate-600 font-bold text-sm md:text-base leading-snug mt-3">
                  Look at loving pictures and hear warm voice messages from family
                </p>
                <div className="flex items-center justify-between pt-3 mt-3 border-t border-slate-200 text-[#3E82F0] font-black text-sm">
                  <span>Open Album</span>
                  <ChevronRight className="w-5 h-5" />
                </div>
              </button>

              {/* Memory Journal & Spoken Stories Card */}
              <button
                id="elderly-journal-btn"
                onClick={() => {
                  soundEffects.playGentleTap(600);
                  onOpenJournal();
                }}
                className="min-h-[160px] p-6 md:p-7 rounded-[36px] bg-[#FAFAFA] border-2 border-[#8DE5A6] shadow-sm hover:border-[#6BC1B8] hover:shadow-md hover:translate-y-0.5 active:translate-y-1 text-left flex flex-col justify-between transition-all duration-200 cursor-pointer"
              >
                <div className="flex items-center gap-4">
                  <div className="w-14 h-14 rounded-2xl bg-white border border-[#8DE5A6] flex items-center justify-center text-[#3E82F0] shadow-2xs shrink-0">
                    <BookOpen className="w-9 h-9" />
                  </div>
                  <div>
                    <h3 className="text-xl md:text-2xl font-black text-[#1E293B] leading-snug">
                      Memory Journal & Stories
                    </h3>
                    <span className="text-xs font-bold text-[#1E293B] bg-white px-2 py-0.5 rounded-full border border-[#8DE5A6] inline-block mt-1">
                      🎙️ Spoken Reminiscence
                    </span>
                  </div>
                </div>
                <p className="text-slate-600 font-bold text-sm md:text-base leading-snug mt-3">
                  Listen to your childhood tales of Majuli, tea gardens, and speak new memories
                </p>
                <div className="flex items-center justify-between pt-3 mt-3 border-t border-slate-200 text-[#3E82F0] font-black text-sm">
                  <span>Record & Listen</span>
                  <ChevronRight className="w-5 h-5" />
                </div>
              </button>
            </div>
          </div>

          {/* Daily Reminders & Large SOS Section */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Daily Reminders Card */}
            <div className="lg:col-span-2 bg-[#FAFAFA] rounded-[32px] p-6 md:p-8 border-2 border-[#8DE5A6] shadow-sm space-y-4">
              <div className="flex items-center justify-between border-b border-slate-200 pb-3">
                <h2 className="text-2xl font-black text-[#1E293B] flex items-center gap-3">
                  <span className="text-3xl">🗓️</span>
                  <span>{t.daily_reminders}</span>
                </h2>
                <button
                  onClick={() => speakText('Here are your daily medicine and meal reminders for today.', language)}
                  className="p-2.5 rounded-full bg-white hover:bg-slate-100 text-[#1E293B] border border-[#8DE5A6] cursor-pointer transition-colors shadow-2xs"
                  title="Read reminders"
                >
                  <Volume2 className="w-5 h-5 text-[#3E82F0]" />
                </button>
              </div>

              <div className="space-y-3">
                {reminders.map((rem) => (
                  <div
                    key={rem.id}
                    id={`rem-item-${rem.id}`}
                    onClick={() => onToggleReminder(rem.id)}
                    className={`p-4 rounded-2xl border-2 flex items-center justify-between gap-4 cursor-pointer transition-all ${
                      rem.completed
                        ? 'bg-white/80 border-slate-200 text-slate-400'
                        : 'bg-white hover:bg-slate-50 border-[#8DE5A6] text-[#1E293B] shadow-2xs'
                    }`}
                  >
                    <div className="flex items-center gap-4">
                      <button
                        className="p-1 rounded-full text-emerald-600 focus:outline-none cursor-pointer"
                        aria-label={rem.completed ? 'Mark incomplete' : 'Mark complete'}
                      >
                        {rem.completed ? (
                          <CheckCircle2 className="w-8 h-8 fill-emerald-100 text-emerald-600" />
                        ) : (
                          <Circle className="w-8 h-8 text-slate-300" />
                        )}
                      </button>
                      <div>
                        <div className="flex items-center gap-2">
                          <h4 className={`text-lg md:text-xl font-bold ${rem.completed ? 'line-through text-slate-400' : 'text-[#1E293B]'}`}>
                            {rem.title}
                          </h4>
                          {rem.priority === 'urgent' && (
                            <span className="text-[10px] font-black bg-rose-100 text-rose-800 px-2 py-0.5 rounded-full border border-rose-200">
                              Urgent
                            </span>
                          )}
                        </div>
                        <p className="text-sm font-bold text-[#3E82F0] flex items-center gap-2">
                          <span>⏰ {rem.time} · {rem.type.toUpperCase()}</span>
                          {rem.recurrence && <span>· 🔄 {rem.recurrence}</span>}
                        </p>
                        {rem.instructions && (
                          <p className="text-xs md:text-sm text-slate-500 font-semibold pt-0.5">
                            {rem.instructions}
                          </p>
                        )}
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          if (onTriggerAlarm) {
                            onTriggerAlarm(rem);
                          } else {
                            soundEffects.playGentleChime();
                            const textToRead = rem.spoken_prompt || `${rem.title}. Time is ${rem.time}. ${rem.instructions || ''}`;
                            speakText(textToRead, language);
                          }
                        }}
                        className="p-2.5 rounded-xl bg-white hover:bg-slate-100 text-[#1E293B] text-xs font-black flex items-center gap-1 cursor-pointer transition-colors border border-[#8DE5A6] shadow-2xs"
                        title="Play reminder alarm chime and announcement"
                      >
                        <Bell className="w-4 h-4 text-[#3E82F0]" />
                        <span className="hidden sm:inline">Chime</span>
                      </button>

                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          soundEffects.playGentleChime();
                          const textToRead = rem.spoken_prompt || `${rem.title}. Time is ${rem.time}. ${rem.instructions || ''}`;
                          speakText(textToRead, language);
                        }}
                        className="p-2.5 rounded-xl bg-white hover:bg-slate-100 text-[#1E293B] text-xs font-black flex items-center gap-1 cursor-pointer transition-colors border border-[#8DE5A6] shadow-2xs"
                        title="Listen to reminder prompt"
                      >
                        <Volume2 className="w-4 h-4 text-[#3E82F0]" />
                        <span className="hidden sm:inline">Listen</span>
                      </button>

                      <button
                        type="button"
                        style={!rem.completed ? { background: 'linear-gradient(to right, #C3F2D6, #8DE5A6, #6BC1B8, #3E82F0)' } : undefined}
                        className={`px-4 py-2 rounded-xl text-xs md:text-sm font-black transition-all cursor-pointer ${
                          rem.completed
                            ? 'bg-slate-100 text-slate-600 border border-slate-300'
                            : 'text-[#0F172A] border border-[#6BC1B8] shadow-xs hover:brightness-105 active:scale-95'
                        }`}
                      >
                        {rem.completed ? t.completed_badge : t.mark_taken}
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Large Emergency SOS Button Card */}
            <div className="bg-[#FAFAFA] rounded-[32px] p-6 md:p-8 border-2 border-rose-300 shadow-sm flex flex-col justify-between text-center space-y-4">
              <div className="space-y-2">
                <div className="w-16 h-16 mx-auto bg-rose-100 rounded-full flex items-center justify-center text-rose-700 shadow-inner">
                  <ShieldAlert className="w-9 h-9" />
                </div>
                <h3 className="text-2xl font-black text-[#1E293B]">
                  {t.sos_button}
                </h3>
                <p className="text-slate-600 text-sm md:text-base font-bold leading-snug">
                  {t.sos_desc}
                </p>
              </div>

              <button
                id="elderly-sos-trigger-btn"
                onClick={() => setSosModalOpen(true)}
                className="w-full min-h-[72px] px-6 py-4 rounded-2xl bg-rose-600 hover:bg-rose-700 text-white font-black text-2xl border-4 border-rose-200 shadow-[0_6px_0_0_#FDA4AF] active:translate-y-1 active:shadow-none transition-all cursor-pointer"
              >
                🚨 {t.sos_button}
              </button>

              <p className="text-xs text-slate-600 font-bold italic">
                Caregiver <span className="text-rose-800 font-black">{effectiveCaregiverName}</span> will be informed instantly.
              </p>
            </div>
          </div>
        </>
      )}

      {/* Ethical Guardrail Disclaimer */}
      <div className="p-4 rounded-2xl bg-[#FAFAFA] border-2 border-[#8DE5A6]/50 text-center shadow-sm">
        <p className="text-xs text-slate-600 uppercase font-bold tracking-widest px-4">
          {t.disclaimer}
        </p>
      </div>

      {/* SOS Confirmation Dialog */}
      {sosModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-stone-950/70 backdrop-blur-sm animate-fade-in">
          <div className="w-full max-w-md bg-white rounded-3xl border-4 border-rose-400 p-6 md:p-8 text-center space-y-6 shadow-2xl">
            <div className="w-20 h-20 mx-auto bg-rose-100 rounded-full flex items-center justify-center text-rose-600">
              <AlertCircle className="w-12 h-12" />
            </div>

            {sosSent ? (
              <div className="space-y-3">
                <h3 className="text-2xl font-extrabold text-emerald-800">
                  Help Alert Sent!
                </h3>
                <p className="text-stone-700 text-lg font-medium">
                  {effectiveCaregiverName} has been notified with your current location coordinates. Stay calm, help is on the way!
                </p>
              </div>
            ) : (
              <>
                <div className="space-y-2">
                  <h3 className="text-2xl font-extrabold text-stone-900">
                    Notify Caregiver {effectiveCaregiverName}?
                  </h3>
                  <p className="text-stone-700 text-base">
                    This will send an immediate notification to your assigned caregiver, <strong className="text-rose-700 font-black">{effectiveCaregiverName}</strong>.
                  </p>
                </div>

                <div className="grid grid-cols-2 gap-4 pt-2">
                  <button
                    onClick={() => setSosModalOpen(false)}
                    className="min-h-[60px] px-4 py-3 rounded-2xl bg-stone-100 hover:bg-stone-200 text-stone-800 font-bold text-lg border-2 border-stone-300 cursor-pointer"
                  >
                    Cancel
                  </button>

                  <button
                    id="sos-confirm-send-btn"
                    onClick={handleSOSConfirm}
                    className="min-h-[60px] px-4 py-3 rounded-2xl bg-rose-600 hover:bg-rose-700 text-white font-extrabold text-lg shadow-md border-2 border-rose-700 cursor-pointer"
                  >
                    Yes, Send Alert
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
