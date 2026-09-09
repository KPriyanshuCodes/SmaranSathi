import React from 'react';
import { 
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
import { AppLogo } from './AppLogo';
import { RegionalLanguage, User, UserRole, UIThemePalette, UILayoutMode } from '../../types';
import { LANGUAGE_LABELS, UI_TRANSLATIONS } from '../../data/nerContent';
import { soundEffects } from '../../utils/speechAndAudio';
import { FloatingSOSButton } from './FloatingSOSButton';
import { THEME_CONFIGS } from '../../utils/themeConfig';

interface HeaderProps {
  currentUser: User;
  currentLanguage: RegionalLanguage;
  onLanguageChange: (lang: RegionalLanguage) => void;
  onEditProfile: () => void;
  onLogout: () => void;
  onTriggerSOS?: () => void;
  patientName?: string;
  contactName?: string;
  themePalette?: UIThemePalette;
  layoutMode?: UILayoutMode;
}

export const Header: React.FC<HeaderProps> = ({
  currentUser,
  currentLanguage,
  onLanguageChange,
  onEditProfile,
  onLogout,
  onTriggerSOS,
  patientName,
  contactName,
  themePalette = 'default',
  layoutMode = 'standard',
}) => {
  const t = UI_TRANSLATIONS[currentLanguage] || UI_TRANSLATIONS.en;
  const isElderly = currentUser.role === 'elderly';
  const activeTheme = THEME_CONFIGS[themePalette] || THEME_CONFIGS.default;

  return (
    <header 
      style={{ background: activeTheme.headerGradient }}
      className="sticky top-0 z-40 border-b-2 shadow-sm transition-all duration-300"
    >
      <div className="max-w-7xl mx-auto px-3 sm:px-6 py-2.5 flex items-center justify-between gap-3">
        {/* Left: Brand Logo & Cultural Title */}
        <div className="flex items-center gap-3 shrink-0">
          <div className="w-10 h-10 sm:w-11 sm:h-11 bg-white/95 rounded-2xl flex items-center justify-center shadow-md border-2 border-[#47D6B6] p-1.5">
            <AppLogo className="w-7 h-7" animate />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xl sm:text-2xl font-black tracking-tight text-white drop-shadow-xs">
                स्मरण साथी
              </span>
              <span className="text-xs font-black text-[#17B3C1] bg-white/95 border border-[#47D6B6] px-2 py-0.5 rounded-full shadow-2xs">
                Smaran Sathi
              </span>
              <span className="hidden xl:inline-flex items-center gap-1.5 text-xs font-black text-[#17B3C1] bg-white/95 border border-[#47D6B6] px-2 py-0.5 rounded-full shadow-2xs">
                {isElderly ? (
                  <>
                    <Sparkles className="w-3.5 h-3.5 text-[#2794EB]" />
                    <span>Senior Portal</span>
                  </>
                ) : (
                  <>
                    <ShieldCheck className="w-3.5 h-3.5 text-[#2794EB]" />
                    <span>Caregiver Hub</span>
                  </>
                )}
              </span>
            </div>
            <p className="text-xs text-white/95 font-bold flex items-center gap-1.5 pt-0.5 drop-shadow-xs">
              <span className="text-[11px]">🌸</span>
              <span className="italic tracking-wide">हर कदम पर आपका हमसफ़र।</span>
            </p>
          </div>
        </div>

        {/* Right: Language Selector, User Profile & Actions (Clean, uncrowded layout) */}
        <div className="flex items-center gap-2 sm:gap-2.5 shrink-0 ml-auto">
          {/* Regional Language Picker - Clear, High-Contrast, Never Overlapped */}
          <div className="relative z-30 flex items-center bg-white/95 border-2 border-[#47D6B6] hover:border-[#2794EB] px-2.5 sm:px-3 py-1.5 rounded-full text-[#1E293B] font-bold shadow-xs transition-colors shrink-0">
            <Globe className="w-4 h-4 text-[#2794EB] mr-1.5 shrink-0" />
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
            className="group flex items-center gap-2 bg-white/95 hover:bg-white border-2 border-[#47D6B6] hover:border-[#2794EB] px-2.5 sm:px-3 py-1.5 rounded-full shadow-xs cursor-pointer transition-all active:scale-98"
            title="Click to edit profile and change photo"
          >
            <div className="relative">
              <img
                src={currentUser.avatar || 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=250&q=80'}
                alt={currentUser.name}
                className="w-7 h-7 rounded-full object-cover border-2 border-[#17B3C1] group-hover:border-[#2794EB] shrink-0"
              />
              <span className="absolute -bottom-1 -right-1 w-3.5 h-3.5 bg-[#2794EB] rounded-full flex items-center justify-center text-white text-[9px] shadow-xs group-hover:scale-110 transition-transform">
                <Camera className="w-2 h-2 text-white" />
              </span>
            </div>
            <div className="hidden lg:flex flex-col text-left">
              <span className="text-xs font-black text-[#1E293B] max-w-[110px] truncate leading-tight group-hover:text-[#2794EB]">
                {currentUser.name}
              </span>
              <span className="text-[10px] font-bold text-slate-600 group-hover:text-slate-900 flex items-center gap-1">
                <span>{isElderly ? 'Senior' : 'Caregiver'}</span>
                <span className="text-[9px] font-extrabold text-[#17B3C1] bg-[#BFF8D4] px-1 py-0.2 rounded">Edit ✏️</span>
              </span>
            </div>
          </button>


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
