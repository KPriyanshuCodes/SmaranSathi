import React, { useState } from 'react';
import { User, UserRole } from '../../types';
import { Lock, Sparkles, ShieldCheck, Check, Delete, X } from 'lucide-react';
import { soundEffects } from '../../utils/speechAndAudio';
import { saveRememberedUser } from '../../lib/firebase';

interface LoginModalProps {
  isOpen: boolean;
  onClose: () => void;
  users: User[];
  onSelectUser: (user: User) => void;
}

export const LoginModal: React.FC<LoginModalProps> = ({
  isOpen,
  onClose,
  users,
  onSelectUser,
}) => {
  const [selectedRole, setSelectedRole] = useState<UserRole>('elderly');
  const [pinInput, setPinInput] = useState('');
  const [errorMessage, setErrorMessage] = useState('');

  if (!isOpen) return null;

  const handleKeyClick = (digit: string) => {
    soundEffects.playGentleTap(500);
    if (pinInput.length < 4) {
      const nextPin = pinInput + digit;
      setPinInput(nextPin);
      setErrorMessage('');

      if (nextPin.length === 4) {
        verifyPin(nextPin);
      }
    }
  };

  const handleBackspace = () => {
    soundEffects.playGentleTap(400);
    setPinInput((prev) => prev.slice(0, -1));
    setErrorMessage('');
  };

  const verifyPin = (pinToTest: string) => {
    const matched = users.find((u) => u.pin === pinToTest && u.role === selectedRole);
    if (matched) {
      soundEffects.playSuccessChime();
      saveRememberedUser(matched);
      onSelectUser(matched);
      onClose();
    } else {
      soundEffects.playGentleEncouragement();
      setErrorMessage('PIN did not match. Please try again or tap your profile below.');
      setPinInput('');
    }
  };

  const handleQuickSelect = (user: User) => {
    soundEffects.playGentleTap(550);
    saveRememberedUser(user);
    onSelectUser(user);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-gray-900/65 backdrop-blur-sm animate-fade-in">
      <div className="w-full max-w-lg bg-white rounded-[36px] p-6 md:p-8 border-4 border-yellow-300 shadow-[0_12px_0_0_#FDE047] space-y-6 relative max-h-[90vh] overflow-y-auto">
        <button
          onClick={onClose}
          className="absolute top-5 right-5 p-2 rounded-full hover:bg-orange-100 text-gray-500 cursor-pointer"
          title="Close"
        >
          <X className="w-6 h-6" />
        </button>

        <div className="text-center space-y-2">
          <div className="w-16 h-16 mx-auto rounded-2xl bg-yellow-100 flex items-center justify-center text-yellow-800 border-2 border-yellow-300 shadow-sm">
            <Lock className="w-8 h-8" />
          </div>
          <h2 className="text-2xl md:text-3xl font-black text-gray-900">
            Welcome to Smaran Sathi
          </h2>
          <p className="text-amber-900 text-xs sm:text-sm font-bold flex items-center justify-center gap-1.5">
            <span>🌸</span>
            <span className="italic">"हर कदम पर आपका हमसफ़र।"</span>
          </p>
          <p className="text-gray-600 text-xs sm:text-sm font-bold">
            Please enter your 4-digit PIN or select your profile below
          </p>
        </div>

        {/* Role Switcher */}
        <div className="grid grid-cols-2 gap-3 p-1.5 bg-orange-50 rounded-2xl border-2 border-orange-100">
          <button
            onClick={() => {
              setSelectedRole('elderly');
              setPinInput('');
              setErrorMessage('');
            }}
            className={`min-h-[52px] rounded-xl font-black text-xs sm:text-sm flex items-center justify-center gap-2 transition-all cursor-pointer ${
              selectedRole === 'elderly'
                ? 'bg-amber-500 text-gray-950 shadow-[0_3px_0_0_#B45309]'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            <Sparkles className="w-4 h-4" />
            <span>🧓 Elderly Portal</span>
          </button>

          <button
            onClick={() => {
              setSelectedRole('caregiver');
              setPinInput('');
              setErrorMessage('');
            }}
            className={`min-h-[52px] rounded-xl font-black text-xs sm:text-sm flex items-center justify-center gap-2 transition-all cursor-pointer ${
              selectedRole === 'caregiver'
                ? 'bg-slate-900 text-white shadow-[0_3px_0_0_#1E293B]'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            <ShieldCheck className="w-4 h-4 text-emerald-400" />
            <span>🛡️ Caregiver Portal</span>
          </button>
        </div>

        {selectedRole === 'caregiver' ? (
          <div className="p-3 rounded-xl bg-slate-100 border border-slate-200 text-slate-800 text-xs font-bold text-center">
            🔐 Caregiver Access: Schedule & modify reminders, inspect AI telemetry, and manage clinical care. Demo PIN: <strong className="font-black text-slate-950">4321</strong>.
          </div>
        ) : (
          <div className="p-3 rounded-xl bg-amber-50 border border-amber-200 text-amber-900 text-xs font-bold text-center">
            🧓 Senior Access: Tap your picture below to enter your games and daily schedule immediately.
          </div>
        )}

        {/* PIN Dots (Large, Friendly) */}
        <div className="flex justify-center items-center gap-4 py-2">
          {[0, 1, 2, 3].map((i) => (
            <div
              key={i}
              className={`w-6 h-6 rounded-full border-2 transition-all duration-200 ${
                i < pinInput.length
                  ? 'bg-orange-500 border-orange-600 scale-110 shadow-sm'
                  : 'bg-orange-50 border-orange-200'
              }`}
            />
          ))}
        </div>

        {errorMessage && (
          <p className="text-rose-600 font-black text-center text-sm">
            {errorMessage}
          </p>
        )}

        {/* Large Touch Numpad (min 60px tap targets for elderly accessibility) */}
        <div className="grid grid-cols-3 gap-3 max-w-xs mx-auto">
          {['1', '2', '3', '4', '5', '6', '7', '8', '9'].map((digit) => (
            <button
              key={digit}
              onClick={() => handleKeyClick(digit)}
              className="min-h-[64px] rounded-2xl bg-white hover:bg-yellow-50 border-2 border-yellow-200 text-2xl font-black text-gray-900 shadow-[0_4px_0_0_#FDE047] active:translate-y-1 active:shadow-none flex items-center justify-center cursor-pointer transition-all"
            >
              {digit}
            </button>
          ))}
          <div />
          <button
            onClick={() => handleKeyClick('0')}
            className="min-h-[64px] rounded-2xl bg-white hover:bg-yellow-50 border-2 border-yellow-200 text-2xl font-black text-gray-900 shadow-[0_4px_0_0_#FDE047] active:translate-y-1 active:shadow-none flex items-center justify-center cursor-pointer transition-all"
          >
            0
          </button>
          <button
            onClick={handleBackspace}
            className="min-h-[64px] rounded-2xl bg-orange-50 hover:bg-orange-100 border-2 border-orange-200 text-gray-700 shadow-[0_4px_0_0_#FED7AA] active:translate-y-1 active:shadow-none flex items-center justify-center cursor-pointer transition-all"
            title="Backspace"
          >
            <Delete className="w-6 h-6" />
          </button>
        </div>

        {/* Helper Note instead of saved cards */}
        <div className="pt-2 border-t border-orange-100 text-center text-xs text-gray-500 font-semibold">
          Enter your 4-digit PIN to authenticate as {selectedRole === 'elderly' ? 'Senior' : 'Caregiver'}.
        </div>
      </div>
    </div>
  );
};
