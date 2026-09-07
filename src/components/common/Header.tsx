import React from 'react';
import { 
  Heart, 
  Globe, 
  Sparkles, 
  ShieldCheck,
  LogOut,
  User as UserIcon,
  Camera,
  Edit3
} from 'lucide-react';
import { RegionalLanguage, User, UserRole } from '../../types';
import { LANGUAGE_LABELS, UI_TRANSLATIONS } from '../../data/nerContent';
import { soundEffects } from '../../utils/speechAndAudio';

interface HeaderProps {
  currentUser: User;
  currentLanguage: RegionalLanguage;
  onLanguageChange: (lang: RegionalLanguage) => void;
  onEditProfile: () => void;
  onLogout: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  currentUser,
  currentLanguage,
  onLanguageChange,
  onEditProfile,
  onLogout,
}) => {
  const t = UI_TRANSLATIONS[currentLanguage] || UI_TRANSLATIONS.en;
  const isElderly = currentUser.role === 'elderly';

  return (
    <header 
      style={{ background: 'linear-gradient(to right, #C3F2D6, #8DE5A6, #6BC1B8, #3E82F0)' }}
      className="sticky top-0 z-40 border-b-2 border-[#6BC1B8]/40 shadow-sm transition-all"
    >
      <div className="max-w-6xl mx-auto px-4 sm:px-8 py-3 flex flex-wrap items-center justify-between gap-4">
        {/* Brand Logo & Cultural Title */}
        <div className="flex items-center gap-3.5">
          <div className="w-12 h-12 bg-white/95 rounded-2xl flex items-center justify-center text-[#3E82F0] shadow-md border-2 border-[#8DE5A6]">
            <Heart className="w-7 h-7 fill-[#3E82F0] text-[#3E82F0]" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xl sm:text-2xl font-black tracking-tight text-[#1E293B]">
                स्मरण साथी
              </span>
              <span className="text-xs sm:text-sm font-black text-[#1E293B] bg-white/90 border border-[#8DE5A6] px-2.5 py-0.5 rounded-full shadow-2xs">
                Smaran Sathi
              </span>
            </div>
            <p className="text-xs text-[#1E293B] font-bold flex items-center gap-1.5 pt-0.5">
              <span className="text-[11px]">🌸</span>
              <span className="italic tracking-wide">हर कदम पर आपका हमसफ़र।</span>
            </p>
          </div>
        </div>

        {/* Center: Strict Role Portal Indicator (No cross-switching) */}
        <div>
          {isElderly ? (
            <div className="flex items-center gap-2 px-4 py-2 rounded-full bg-white/90 text-[#1E293B] border-2 border-[#8DE5A6] text-xs sm:text-sm font-black shadow-xs">
              <Sparkles className="w-4 h-4 text-[#3E82F0]" />
              <span>Senior Companion Portal</span>
            </div>
          ) : (
            <div className="flex items-center gap-2 px-4 py-2 rounded-full bg-white/90 text-[#1E293B] border-2 border-[#6BC1B8] text-xs sm:text-sm font-black shadow-xs">
              <ShieldCheck className="w-4 h-4 text-[#3E82F0]" />
              <span>Caregiver Command Center</span>
            </div>
          )}
        </div>

        {/* Right: Language Selector & User Profile */}
        <div className="flex items-center gap-2 sm:gap-3">
          {/* Regional Language Picker */}
          <div className="flex items-center bg-white/95 border-2 border-[#8DE5A6] hover:border-[#6BC1B8] px-3.5 py-1.5 rounded-full text-[#1E293B] font-bold shadow-xs transition-colors">
            <Globe className="w-4 h-4 text-[#3E82F0] mr-1.5 shrink-0" />
            <select
              id="language-select"
              aria-label="Select Regional Language"
              value={currentLanguage}
              onChange={(e) => onLanguageChange(e.target.value as RegionalLanguage)}
              className="bg-transparent text-xs sm:text-sm font-bold text-[#1E293B] focus:outline-none cursor-pointer"
            >
              {Object.entries(LANGUAGE_LABELS).map(([code, label]) => (
                <option key={code} value={code} className="text-[#1E293B] bg-white">
                  {label.nativeName} ({label.region})
                </option>
              ))}
            </select>
          </div>

          {/* Current User Badge (Click to Edit Profile & Photo) & Logout */}
          <div className="flex items-center gap-1.5 sm:gap-2">
            <button
              id="user-profile-badge-btn"
              type="button"
              onClick={() => {
                soundEffects.playGentleTap();
                onEditProfile();
              }}
              className="group flex items-center gap-2 bg-white/95 hover:bg-white border-2 border-[#8DE5A6] hover:border-[#6BC1B8] px-3 py-1.5 rounded-full shadow-xs cursor-pointer transition-all active:scale-98"
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
              <div className="hidden md:flex flex-col text-left">
                <span className="text-xs font-black text-[#1E293B] max-w-[120px] truncate leading-tight group-hover:text-[#3E82F0]">
                  {currentUser.name}
                </span>
                <span className="text-[10px] font-bold text-slate-600 group-hover:text-slate-900 flex items-center gap-1">
                  <span>{isElderly ? 'Senior' : 'Caregiver'}</span>
                  <span className="text-[9px] font-extrabold text-[#3E82F0] bg-blue-50 px-1 py-0.2 rounded">Edit ✏️</span>
                </span>
              </div>
            </button>

            <button
              id="logout-btn"
              onClick={() => {
                soundEffects.playGentleTap(380);
                onLogout();
              }}
              className="flex items-center gap-1.5 px-3.5 py-2 rounded-full bg-white/90 hover:bg-red-50 text-red-700 border-2 border-red-200 text-xs sm:text-sm font-black transition-colors cursor-pointer shadow-xs"
              title="Log Out of this portal"
            >
              <LogOut className="w-3.5 h-3.5 text-red-600" />
              <span>Log Out</span>
            </button>
          </div>
        </div>
      </div>
    </header>
  );
};
