import React from 'react';
import { 
  Heart, 
  Globe, 
  Sparkles, 
  ShieldCheck, 
  LogOut, 
  User as UserIcon, 
  Camera, 
  Edit3,
  Palette,
  Layout
} from 'lucide-react';
import { RegionalLanguage, User, UserRole } from '../../types';
import { LANGUAGE_LABELS, UI_TRANSLATIONS } from '../../data/nerContent';
import { soundEffects } from '../../utils/speechAndAudio';
import { FloatingSOSButton } from './FloatingSOSButton';

interface HeaderProps {
  currentUser: User;
  currentLanguage: RegionalLanguage;
  onLanguageChange: (lang: RegionalLanguage) => void;
  onEditProfile: () => void;
  onLogout: () => void;
  onOpenDesignStudio?: () => void;
  onTriggerSOS?: () => void;
  patientName?: string;
  contactName?: string;
}

export const Header: React.FC<HeaderProps> = ({
  currentUser,
  currentLanguage,
  onLanguageChange,
  onEditProfile,
  onLogout,
  onOpenDesignStudio,
  onTriggerSOS,
  patientName,
  contactName,
}) => {
  const t = UI_TRANSLATIONS[currentLanguage] || UI_TRANSLATIONS.en;
  const isElderly = currentUser.role === 'elderly';

  return (
    <header 
      style={{ background: 'linear-gradient(to right, #C3F2D6, #8DE5A6, #6BC1B8, #3E82F0)' }}
      className="sticky top-0 z-40 border-b-2 border-[#6BC1B8]/40 shadow-sm transition-all"
    >
      <div className="max-w-7xl mx-auto px-3 sm:px-6 py-2.5 flex items-center justify-between gap-3">
        {/* Left: Brand Logo & Cultural Title */}
        <div className="flex items-center gap-3 shrink-0">
          <div className="w-10 h-10 sm:w-11 sm:h-11 bg-white/95 rounded-2xl flex items-center justify-center text-[#3E82F0] shadow-md border-2 border-[#8DE5A6]">
            <Heart className="w-6 h-6 fill-[#3E82F0] text-[#3E82F0]" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xl sm:text-2xl font-black tracking-tight text-[#1E293B]">
                स्मरण साथी
              </span>
              <span className="text-xs font-black text-[#1E293B] bg-white/90 border border-[#8DE5A6] px-2 py-0.5 rounded-full shadow-2xs">
                Smaran Sathi
              </span>
              <span className="hidden xl:inline-flex items-center gap-1.5 text-xs font-black text-[#1E293B] bg-white/90 border border-[#8DE5A6] px-2 py-0.5 rounded-full shadow-2xs">
                {isElderly ? (
                  <>
                    <Sparkles className="w-3.5 h-3.5 text-[#3E82F0]" />
                    <span>Senior Portal</span>
                  </>
                ) : (
                  <>
                    <ShieldCheck className="w-3.5 h-3.5 text-[#3E82F0]" />
                    <span>Caregiver Hub</span>
                  </>
                )}
              </span>
            </div>
            <p className="text-xs text-[#1E293B] font-bold flex items-center gap-1.5 pt-0.5">
              <span className="text-[11px]">🌸</span>
              <span className="italic tracking-wide">हर कदम पर आपका हमसफ़र।</span>
            </p>
          </div>
        </div>

        {/* Right: Language Selector, User Profile & Actions (Clean, uncrowded layout) */}
        <div className="flex items-center gap-2 sm:gap-2.5 shrink-0 ml-auto">
          {/* Regional Language Picker - Clear, High-Contrast, Never Overlapped */}
          <div className="relative z-30 flex items-center bg-white/95 border-2 border-[#8DE5A6] hover:border-[#6BC1B8] px-2.5 sm:px-3 py-1.5 rounded-full text-[#1E293B] font-bold shadow-xs transition-colors shrink-0">
            <Globe className="w-4 h-4 text-[#3E82F0] mr-1.5 shrink-0" />
            <select
              id="language-select"
              aria-label="Select Regional Language"
              value={currentLanguage}
              onChange={(e) => onLanguageChange(e.target.value as RegionalLanguage)}
              className="bg-transparent text-xs sm:text-sm font-bold text-[#1E293B] focus:outline-none cursor-pointer pr-1"
            >
              {Object.entries(LANGUAGE_LABELS).map(([code, label]) => (
                <option key={code} value={code} className="text-[#1E293B] bg-white">
                  {label.nativeName} ({label.region})
                </option>
              ))}
            </select>
          </div>

          {/* Current User Badge (Click to Edit Profile & Photo) */}
          <button
            id="user-profile-badge-btn"
            type="button"
            onClick={() => {
              soundEffects.playGentleTap();
              onEditProfile();
            }}
            className="group flex items-center gap-2 bg-white/95 hover:bg-white border-2 border-[#8DE5A6] hover:border-[#6BC1B8] px-2.5 sm:px-3 py-1.5 rounded-full shadow-xs cursor-pointer transition-all active:scale-98"
            title="Click to edit profile and change photo"
          >
            <div className="relative">
              <img
                src={currentUser.avatar || 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=250&q=80'}
                alt={currentUser.name}
                className="w-7 h-7 rounded-full object-cover border-2 border-[#6BC1B8] group-hover:border-[#3E82F0] shrink-0"
              />
              <span className="absolute -bottom-1 -right-1 w-3.5 h-3.5 bg-[#3E82F0] rounded-full flex items-center justify-center text-white text-[9px] shadow-xs group-hover:scale-110 transition-transform">
                <Camera className="w-2 h-2 text-white" />
              </span>
            </div>
            <div className="hidden lg:flex flex-col text-left">
              <span className="text-xs font-black text-[#1E293B] max-w-[110px] truncate leading-tight group-hover:text-[#3E82F0]">
                {currentUser.name}
              </span>
              <span className="text-[10px] font-bold text-slate-600 group-hover:text-slate-900 flex items-center gap-1">
                <span>{isElderly ? 'Senior' : 'Caregiver'}</span>
                <span className="text-[9px] font-extrabold text-[#3E82F0] bg-blue-50 px-1 py-0.2 rounded">Edit ✏️</span>
              </span>
            </div>
          </button>

          {/* UI & Layout Studio Button */}
          {onOpenDesignStudio && (
            <button
              id="header-design-studio-btn"
              type="button"
              onClick={() => {
                soundEffects.playGentleTap();
                onOpenDesignStudio();
              }}
              className="flex items-center gap-1.5 bg-white/95 hover:bg-white text-[#1E293B] hover:text-[#3E82F0] border-2 border-[#8DE5A6] hover:border-[#3E82F0] px-3 py-1.5 rounded-full text-xs sm:text-sm font-black shadow-xs cursor-pointer transition-all active:scale-95"
              title="Explore UI/UX Designs, Layouts & Themes"
            >
              <Palette className="w-4 h-4 text-[#3E82F0]" />
              <span className="hidden xl:inline">Designs</span>
            </button>
          )}

          {/* Logout */}
          <button
            id="logout-btn"
            onClick={() => {
              soundEffects.playGentleTap(380);
              onLogout();
            }}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-white/90 hover:bg-red-50 text-red-700 border-2 border-red-200 text-xs sm:text-sm font-black transition-colors cursor-pointer shadow-xs"
            title="Log Out of this portal"
          >
            <LogOut className="w-3.5 h-3.5 text-red-600" />
            <span className="hidden sm:inline">Log Out</span>
          </button>
        </div>
      </div>
    </header>
  );
};
