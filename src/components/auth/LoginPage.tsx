import React, { useState, useEffect } from 'react';
import { 
  User, 
  UserRole, 
  RegionalLanguage,
  Reminder
} from '../../types';
import { 
  Heart, 
  Sparkles, 
  ShieldCheck, 
  ArrowRight, 
  Lock, 
  User as UserIcon, 
  Volume2, 
  CheckCircle2, 
  KeyRound, 
  UserPlus, 
  LogIn, 
  Stethoscope,
  Info,
  RotateCcw,
  Check,
  Camera,
  Scan
} from 'lucide-react';
import { FaceLoginModal } from './FaceLoginModal';
import { FaceRegistrationScanner } from './FaceRegistrationScanner';
import { soundEffects, speakText } from '../../utils/speechAndAudio';
import { 
  findUserByCredentials, 
  saveUserToFirebase, 
  getAllUsersFromFirebase,
  saveRememberedUser,
  getRememberedUser,
  clearRememberedUser,
  saveReminderToFirebase,
  linkElderlyToCaregiverInFirebase
} from '../../lib/firebase';

interface LoginPageProps {
  onLogin: (user: User) => void;
  users: User[];
  onRegisterUser: (newUser: User) => void;
}

export const LoginPage: React.FC<LoginPageProps> = ({
  onLogin,
  users,
  onRegisterUser,
}) => {
  const [activeTab, setActiveTab] = useState<UserRole>('elderly');
  const [authMode, setAuthMode] = useState<'login' | 'register'>('login');

  // Remembered user from Firebase / LocalStorage
  const [rememberedUser, setRememberedUserState] = useState<User | null>(null);
  const [rememberMe, setRememberMe] = useState(true);

  // Elderly Form Fields
  const [elderlyName, setElderlyName] = useState('');
  const [elderlyPin, setElderlyPin] = useState('');
  const [elderlyPhone, setElderlyPhone] = useState('');
  const [elderlyLang, setElderlyLang] = useState<RegionalLanguage>('as');
  const [elderlyAge, setElderlyAge] = useState<number>(72);
  const [elderlyCaregiverCode, setElderlyCaregiverCode] = useState('');
  const [elderlyPatientId, setElderlyPatientId] = useState(`PT-${Math.floor(1000 + Math.random() * 9000)}`);

  // Caregiver Form Fields
  const [caregiverName, setCaregiverName] = useState('');
  const [caregiverCode, setCaregiverCode] = useState(`CG-${Math.floor(1000 + Math.random() * 9000)}`);
  const [caregiverPin, setCaregiverPin] = useState('');
  const [caregiverPhone, setCaregiverPhone] = useState('');
  const [caregiverRelation, setCaregiverRelation] = useState('Primary Family Caregiver');

  // Status & Feedback
  const [errorMessage, setErrorMessage] = useState('');
  const [loading, setLoading] = useState(false);

  // Face ID Biometric Authentication States
  const [isFaceModalOpen, setIsFaceModalOpen] = useState(false);
  const [faceModalMode, setFaceModalMode] = useState<'login' | 'enroll'>('login');
  const [isRegScannerOpen, setIsRegScannerOpen] = useState(false);
  const [registeredFaceDescriptor, setRegisteredFaceDescriptor] = useState<number[] | null>(null);

  // Check for remembered user on mount
  useEffect(() => {
    const cached = getRememberedUser();
    if (cached) {
      setRememberedUserState(cached);
    }
  }, []);

  // Regional speech assistance for elderly users
  const handleVoiceHelp = () => {
    soundEffects.playGentleTap();
    const message = activeTab === 'elderly'
      ? 'Namaskar. Welcome to Smaran Sathi. Har kadam par aapka humsafar. Enter your name and 4-digit PIN to log in.'
      : 'Caregiver Portal. Log in with your Caregiver ID or register to manage your elderly patient schedules and cognitive trends in Smaran Sathi.';
    speakText(message, elderlyLang);
  };

  // Switch role tab
  const handleSelectRole = (role: UserRole) => {
    soundEffects.playGentleTap();
    setActiveTab(role);
    setErrorMessage('');
  };

  // Quick Resume for Remembered User
  const handleQuickResume = () => {
    if (!rememberedUser) return;
    soundEffects.playSuccessChime();
    onLogin(rememberedUser);
  };

  // Forget remembered user
  const handleForgetRemembered = () => {
    soundEffects.playGentleTap();
    clearRememberedUser();
    setRememberedUserState(null);
  };

  // Submit Login
  const handleLoginSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage('');
    setLoading(true);

    const isElderly = activeTab === 'elderly';
    const identifier = isElderly ? elderlyName.trim() : caregiverName.trim();
    const pin = isElderly ? elderlyPin.trim() : caregiverPin.trim();

    if (!pin) {
      setErrorMessage('Please enter your 4-digit PIN.');
      setLoading(false);
      soundEffects.playGentleEncouragement();
      return;
    }

    try {
      // 1. Direct Firebase Firestore verification
      let matchedUser: User | null = null;
      try {
        matchedUser = await findUserByCredentials(activeTab, pin, identifier);
      } catch (fbErr) {
        console.warn('Firebase query failed, attempting backend proxy:', fbErr);
      }

      // 2. If not found via direct Firebase query, check backend API
      if (!matchedUser) {
        const res = await fetch('/api/auth/login', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            role: activeTab,
            identifier: identifier || undefined,
            pin,
          }),
        });

        if (res.ok) {
          const data = await res.json();
          if (data.success && data.user) {
            matchedUser = data.user;
          }
        }
      }

      // 3. Client state fallback
      if (!matchedUser) {
        matchedUser = users.find(
          (u) =>
            u.role === activeTab &&
            u.pin === pin &&
            (!identifier ||
              u.name.toLowerCase() === identifier.toLowerCase() ||
              u.phone === identifier ||
              u.caregiver_code?.toLowerCase() === identifier.toLowerCase() ||
              u.patient_id?.toLowerCase() === identifier.toLowerCase() ||
              u.id.toLowerCase() === identifier.toLowerCase())
        ) || null;
      }

      if (matchedUser) {
        soundEffects.playSuccessChime();
        // Save to Firebase to guarantee it's synced
        saveUserToFirebase(matchedUser).catch(() => {});
        
        // Remember user if option selected
        if (rememberMe) {
          saveRememberedUser(matchedUser);
        } else {
          clearRememberedUser();
        }

        onLogin(matchedUser);
      } else {
        soundEffects.playGentleEncouragement();
        setErrorMessage(
          `No ${activeTab === 'elderly' ? 'senior' : 'caregiver'} account found with that PIN. If you are new, tap "Create New Profile" below to register.`
        );
      }
    } catch (err) {
      setErrorMessage('Login failed. Please check your credentials or create a new profile.');
    } finally {
      setLoading(false);
    }
  };

  // Seed default routine reminders for newly created elderly
  const seedInitialUserReminders = async (user: User) => {
    const initialReminders: Reminder[] = [
      {
        id: `rem-${user.id}-1`,
        user_id: user.id,
        title: 'Morning Blood Pressure & Vitamin',
        type: 'medication',
        time: '08:30 AM',
        recurrence: 'daily',
        priority: 'high',
        instructions: 'Take with half glass of warm water after light breakfast.',
        spoken_prompt: 'Namaskar! It is time for your morning medicine. Please drink warm water.',
        completed: false,
        created_by: 'system_onboarding',
        created_at: new Date().toISOString(),
      },
      {
        id: `rem-${user.id}-2`,
        user_id: user.id,
        title: 'Mid-Morning Memory Card Practice',
        type: 'memory_game',
        time: '11:00 AM',
        recurrence: 'daily',
        priority: 'medium',
        instructions: 'Complete 1 gentle round of regional memory cards.',
        spoken_prompt: 'Time for your daily memory game! Let us match the beautiful cultural pictures.',
        completed: false,
        created_by: 'system_onboarding',
        created_at: new Date().toISOString(),
      },
      {
        id: `rem-${user.id}-3`,
        user_id: user.id,
        title: 'Evening Assam Chai & Relaxation',
        type: 'chai_time',
        time: '04:30 PM',
        recurrence: 'daily',
        priority: 'gentle',
        instructions: 'Enjoy warm tea and listen to familiar folk melodies.',
        spoken_prompt: 'It is tea time! Relax and enjoy your cup of tea.',
        completed: false,
        created_by: 'system_onboarding',
        created_at: new Date().toISOString(),
      }
    ];

    for (const rem of initialReminders) {
      await saveReminderToFirebase(rem);
    }
  };

  // Submit Registration
  const handleRegisterSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage('');
    setLoading(true);

    const isElderly = activeTab === 'elderly';

    if (isElderly) {
      if (!elderlyName.trim()) {
        setErrorMessage('Please enter your full name.');
        setLoading(false);
        return;
      }
      if (!elderlyPin || elderlyPin.length < 4) {
        setErrorMessage('Please create a 4-digit PIN.');
        setLoading(false);
        return;
      }

      const formattedPatientId = elderlyPatientId.trim().toUpperCase() || `PT-${Math.floor(1000 + Math.random() * 9000)}`;

      const newElderly: User = {
        id: `user-${Date.now()}`,
        patient_id: formattedPatientId,
        name: elderlyName.trim(),
        role: 'elderly',
        language_pref: elderlyLang,
        pin: elderlyPin.slice(-4),
        age: Number(elderlyAge) || 72,
        ...(elderlyPhone.trim() ? { phone: elderlyPhone.trim() } : {}),
        location: 'Guwahati, North East India',
        diagnosis_note: 'Enjoys regional memory activities and cultural stories.',
        location_sharing: false,
        avatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=250&q=80',
        created_at: new Date().toISOString(),
        ...(registeredFaceDescriptor ? {
          face_descriptor: registeredFaceDescriptor,
          face_registered_at: new Date().toISOString(),
        } : {}),
        ...(elderlyCaregiverCode.trim() ? {
          connected_caregiver_id: elderlyCaregiverCode.trim().toUpperCase(),
          connected_caregiver_name: 'Assigned Caregiver',
        } : {}),
      };

      if (elderlyCaregiverCode.trim()) {
        const cleanCode = elderlyCaregiverCode.trim().toUpperCase();
        const matchedCg = users.find(
          (u) =>
            u.role === 'caregiver' &&
            (u.caregiver_code?.toUpperCase() === cleanCode || u.id.toUpperCase() === cleanCode)
        );
        if (matchedCg) {
          newElderly.connected_caregiver_name = matchedCg.name;
        }
      }

      try {
        // 1. Save Directly to Firebase Firestore
        await saveUserToFirebase(newElderly);
        
        // 2. Link to Caregiver in Firebase if assigned
        if (elderlyCaregiverCode.trim()) {
          const cleanCode = elderlyCaregiverCode.trim().toUpperCase();
          const matchedCg = users.find(
            (u) =>
              u.role === 'caregiver' &&
              (u.caregiver_code?.toUpperCase() === cleanCode || u.id.toUpperCase() === cleanCode)
          );
          if (matchedCg) {
            await linkElderlyToCaregiverInFirebase(newElderly.id, matchedCg);
          }
        }

        // 3. Seed initial user-specific reminders in Firebase
        await seedInitialUserReminders(newElderly);

        // 4. Remember this user on device
        if (rememberMe) {
          saveRememberedUser(newElderly);
        }

        // 4. Sync with local backend
        fetch('/api/users', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(newElderly),
        }).catch(() => {});

        soundEffects.playSuccessChime();
        onRegisterUser(newElderly);
        onLogin(newElderly);
      } catch (err) {
        console.error('Error in Firebase registration:', err);
        // Fallback local save
        soundEffects.playSuccessChime();
        if (rememberMe) saveRememberedUser(newElderly);
        onRegisterUser(newElderly);
        onLogin(newElderly);
      } finally {
        setLoading(false);
      }
    } else {
      // Caregiver Registration
      if (!caregiverName.trim()) {
        setErrorMessage('Please enter your caregiver name.');
        setLoading(false);
        return;
      }
      if (!caregiverPin || caregiverPin.length < 4) {
        setErrorMessage('Please create a 4-digit PIN.');
        setLoading(false);
        return;
      }

      const formattedCode = caregiverCode.trim().toUpperCase() || `CG-${Math.floor(1000 + Math.random() * 9000)}`;

      const newCaregiver: User = {
        id: `caregiver-${Date.now()}`,
        name: caregiverName.trim(),
        role: 'caregiver',
        language_pref: 'en',
        pin: caregiverPin.slice(-4),
        ...(caregiverPhone.trim() ? { phone: caregiverPhone.trim() } : {}),
        caregiver_code: formattedCode,
        diagnosis_note: caregiverRelation,
        avatar: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&w=250&q=80',
        created_at: new Date().toISOString(),
        ...(registeredFaceDescriptor ? {
          face_descriptor: registeredFaceDescriptor,
          face_registered_at: new Date().toISOString(),
        } : {}),
      };

      try {
        // 1. Save Directly to Firebase Firestore
        await saveUserToFirebase(newCaregiver);

        // 2. Remember this user
        if (rememberMe) {
          saveRememberedUser(newCaregiver);
        }

        // 3. Sync with local backend
        fetch('/api/users', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(newCaregiver),
        }).catch(() => {});

        soundEffects.playSuccessChime();
        onRegisterUser(newCaregiver);
        onLogin(newCaregiver);
      } catch (err) {
        console.error('Error in Firebase caregiver registration:', err);
        soundEffects.playSuccessChime();
        if (rememberMe) saveRememberedUser(newCaregiver);
        onRegisterUser(newCaregiver);
        onLogin(newCaregiver);
      } finally {
        setLoading(false);
      }
    }
  };

  return (
    <div className="min-h-screen bg-[#F8FAFC] text-[#1E293B] flex flex-col justify-between py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-xl w-full mx-auto space-y-6">
        
        {/* Brand Hero Section with Theme Gradient */}
        <div 
          style={{ background: 'linear-gradient(to right, #C3F2D6, #8DE5A6, #6BC1B8, #3E82F0)' }}
          className="rounded-[32px] p-6 sm:p-8 text-center space-y-3 shadow-md border-2 border-[#6BC1B8]/40"
        >
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-3xl bg-white/95 text-[#3E82F0] shadow-md border-2 border-[#8DE5A6] mb-1">
            <Heart className="w-8 h-8 fill-[#3E82F0] text-[#3E82F0]" />
          </div>
          <div className="space-y-1.5">
            <h1 className="text-3xl sm:text-4xl font-black text-[#1E293B] tracking-tight flex items-center justify-center gap-2.5 flex-wrap">
              <span>स्मरण साथी</span>
              <span className="text-[#1E293B] bg-white/90 border border-[#8DE5A6] text-lg sm:text-xl px-3 py-0.5 rounded-full font-black shadow-2xs">
                Smaran Sathi
              </span>
            </h1>
            {/* Hindi Quote */}
            <div className="pt-1 flex items-center justify-center">
              <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-white/90 border border-[#8DE5A6] text-[#1E293B] shadow-2xs">
                <span className="text-base">🌸</span>
                <span className="text-sm sm:text-base font-black tracking-wide">
                  हर कदम पर आपका हमसफ़र।
                </span>
              </div>
            </div>
          </div>
          <p className="text-xs sm:text-sm text-[#1E293B] font-bold max-w-md mx-auto pt-1">
            AI Cognitive Engagement & Assistive Memory Companion for North East India
          </p>
        </div>

        {/* 1-Tap "Remembered User" Quick Resume Banner */}
        {rememberedUser && (
          <div 
            style={{ background: 'linear-gradient(to right, #C3F2D6, #8DE5A6, #6BC1B8, #3E82F0)' }}
            className="rounded-[28px] p-5 text-[#1E293B] shadow-md border-2 border-[#6BC1B8] space-y-3 animate-fade-in"
          >
            <div className="flex items-center justify-between">
              <span className="text-xs font-black uppercase tracking-wider text-[#1E293B] bg-white/90 border border-[#8DE5A6] px-2.5 py-0.5 rounded-md">
                Remembered on this device
              </span>
              <button
                type="button"
                onClick={handleForgetRemembered}
                className="text-xs font-black text-[#1E293B] hover:text-black underline cursor-pointer"
              >
                Switch Account
              </button>
            </div>

            <div className="flex items-center gap-4">
              <img
                src={rememberedUser.avatar || 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=250&q=80'}
                alt={rememberedUser.name}
                className="w-14 h-14 rounded-2xl object-cover border-2 border-white shadow-md shrink-0"
              />
              <div className="flex-1 min-w-0">
                <h3 className="text-xl font-black text-[#1E293B] truncate">
                  Welcome back, {rememberedUser.name}!
                </h3>
                <p className="text-xs font-bold text-[#1E293B] truncate">
                  {rememberedUser.role === 'elderly' ? '👵 Senior Citizen' : '🩺 Caregiver'} · PIN: ••••
                  {rememberedUser.connected_caregiver_id && ` · Linked to ${rememberedUser.connected_caregiver_id}`}
                </p>
              </div>
            </div>

            <button
              type="button"
              onClick={handleQuickResume}
              className="w-full min-h-[52px] rounded-xl bg-white hover:bg-slate-50 text-[#1E293B] font-black text-base flex items-center justify-center gap-2 border-2 border-[#8DE5A6] hover:border-[#6BC1B8] shadow-sm cursor-pointer transition-all active:translate-y-0.5"
            >
              <span>Continue as {rememberedUser.name.split(' ')[0]}</span>
              <ArrowRight className="w-5 h-5 text-[#3E82F0]" />
            </button>
          </div>
        )}

        {/* Dedicated Role Selector Portal */}
        <div className="bg-[#FAFAFA] rounded-[28px] p-2.5 border-2 border-[#8DE5A6] shadow-sm">
          <div className="grid grid-cols-2 gap-2 p-1 bg-slate-100 rounded-2xl border border-slate-200">
            <button
              type="button"
              onClick={() => handleSelectRole('elderly')}
              style={activeTab === 'elderly' ? { background: 'linear-gradient(to right, #C3F2D6, #8DE5A6, #6BC1B8, #3E82F0)' } : undefined}
              className={`min-h-[54px] rounded-xl font-black text-sm sm:text-base flex items-center justify-center gap-2.5 transition-all cursor-pointer ${
                activeTab === 'elderly'
                  ? 'text-[#0F172A] shadow-sm border border-[#6BC1B8]'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/60'
              }`}
            >
              <Sparkles className="w-5 h-5 text-[#3E82F0]" />
              <span>👵 Senior Citizen</span>
            </button>

            <button
              type="button"
              onClick={() => handleSelectRole('caregiver')}
              style={activeTab === 'caregiver' ? { background: 'linear-gradient(to right, #C3F2D6, #8DE5A6, #6BC1B8, #3E82F0)' } : undefined}
              className={`min-h-[54px] rounded-xl font-black text-sm sm:text-base flex items-center justify-center gap-2.5 transition-all cursor-pointer ${
                activeTab === 'caregiver'
                  ? 'text-[#0F172A] shadow-sm border border-[#6BC1B8]'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/60'
              }`}
            >
              <Stethoscope className="w-5 h-5 text-[#3E82F0]" />
              <span>🩺 Caregiver & Doctor</span>
            </button>
          </div>
        </div>

        {/* Main Authentication Box */}
        <div className="bg-[#FAFAFA] rounded-[32px] p-6 sm:p-8 border-2 border-[#8DE5A6] shadow-sm space-y-6">
          
          {/* Header Description & Audio Assist */}
          <div className="flex items-center justify-between gap-3 pb-3 border-b-2 border-slate-200">
            <div>
              <h2 className="text-xl sm:text-2xl font-black text-[#1E293B] flex items-center gap-2">
                {activeTab === 'elderly' ? (
                  <>
                    <Sparkles className="w-6 h-6 text-[#3E82F0]" />
                    <span>Senior Portal</span>
                  </>
                ) : (
                  <>
                    <ShieldCheck className="w-6 h-6 text-[#3E82F0]" />
                    <span>Caregiver Portal</span>
                  </>
                )}
              </h2>
              <p className="text-xs sm:text-sm text-slate-500 font-bold mt-0.5">
                {activeTab === 'elderly'
                  ? 'Safe, large-button access to daily games & voice reminders'
                  : 'Manage patient schedules, medication alarms & cognitive analytics'}
              </p>
            </div>

            <button
              type="button"
              onClick={handleVoiceHelp}
              className="p-2.5 rounded-xl bg-white hover:bg-[#F0FDF4] text-[#1E293B] border border-[#8DE5A6] hover:border-[#6BC1B8] text-xs font-black flex items-center gap-1.5 cursor-pointer shrink-0 transition-colors shadow-2xs"
              title="Listen to verbal guidance"
            >
              <Volume2 className="w-4 h-4 text-[#3E82F0]" />
              <span className="hidden sm:inline">Voice Help</span>
            </button>
          </div>

          {/* Sub-mode: Login vs Register */}
          <div className="flex rounded-xl bg-slate-200/80 p-1">
            <button
              type="button"
              onClick={() => {
                setAuthMode('login');
                setErrorMessage('');
              }}
              className={`flex-1 py-2.5 rounded-lg text-xs sm:text-sm font-black transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
                authMode === 'login'
                  ? 'bg-white text-[#1E293B] shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <LogIn className="w-4 h-4 text-[#3E82F0]" />
              <span>Log In with PIN</span>
            </button>

            <button
              type="button"
              onClick={() => {
                setAuthMode('register');
                setErrorMessage('');
              }}
              className={`flex-1 py-2.5 rounded-lg text-xs sm:text-sm font-black transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
                authMode === 'register'
                  ? 'bg-white text-[#1E293B] shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <UserPlus className="w-4 h-4 text-[#3E82F0]" />
              <span>Create New Profile</span>
            </button>
          </div>

          {/* Error Message */}
          {errorMessage && (
            <div className="p-3.5 rounded-2xl bg-red-50 border-2 border-red-200 text-red-700 text-xs sm:text-sm font-bold text-center">
              {errorMessage}
            </div>
          )}

          {/* ============================================================ */}
          {/* ELDERLY FORM */}
          {/* ============================================================ */}
          {activeTab === 'elderly' && (
            authMode === 'login' ? (
              <form onSubmit={handleLoginSubmit} className="space-y-5">
                {/* Sign in with Face ID Button */}
                <button
                  type="button"
                  onClick={() => {
                    soundEffects.playGentleTap();
                    setFaceModalMode('login');
                    setIsFaceModalOpen(true);
                  }}
                  className="w-full min-h-[58px] rounded-2xl bg-white hover:bg-slate-50 text-[#1E293B] font-black text-base flex items-center justify-center gap-3 border-2 border-[#8DE5A6] hover:border-[#3E82F0] shadow-xs hover:shadow-[0_4px_14px_rgba(62,130,240,0.18)] cursor-pointer transition-all active:translate-y-0.5 group"
                >
                  <div className="w-9 h-9 rounded-xl bg-gradient-to-r from-[#C3F2D6] to-[#8DE5A6] flex items-center justify-center text-[#1E293B] shadow-2xs group-hover:scale-105 transition-transform">
                    <Camera className="w-5 h-5 text-[#1E293B]" />
                  </div>
                  <span>Sign in with Face</span>
                  <span className="text-xs bg-[#3E82F0] text-white px-2.5 py-0.5 rounded-full font-black">
                    Face ID
                  </span>
                </button>

                <div className="relative flex py-0.5 items-center">
                  <div className="flex-grow border-t border-slate-200"></div>
                  <span className="flex-shrink mx-3 text-xs font-bold text-slate-400 uppercase tracking-wider">
                    or enter with 4-digit PIN
                  </span>
                  <div className="flex-grow border-t border-slate-200"></div>
                </div>

                <div className="space-y-2">
                  <label className="block text-sm font-black text-[#1E293B] flex items-center justify-between">
                    <span>Your Name, Patient ID, or Phone:</span>
                    <span className="text-xs text-[#3E82F0] font-bold">Optional</span>
                  </label>
                  <div className="relative">
                    <UserIcon className="w-5 h-5 absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
                    <input
                      type="text"
                      value={elderlyName}
                      onChange={(e) => setElderlyName(e.target.value)}
                      placeholder="e.g. Dadaji / PT-1001 / Bhaben Barua"
                      className="w-full min-h-[54px] pl-12 pr-4 text-base font-bold bg-white text-[#1E293B] border-2 border-[#8DE5A6] focus:border-[#6BC1B8] focus:ring-2 focus:ring-[#6BC1B8]/20 rounded-2xl outline-none transition-all shadow-2xs"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="block text-sm font-black text-[#1E293B] flex items-center justify-between">
                    <span>4-Digit Security PIN:</span>
                    <span className="text-xs text-[#3E82F0] font-bold">4 Numbers</span>
                  </label>
                  <div className="relative">
                    <KeyRound className="w-5 h-5 absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
                    <input
                      type="password"
                      inputMode="numeric"
                      maxLength={4}
                      value={elderlyPin}
                      onChange={(e) => setElderlyPin(e.target.value.replace(/\D/g, ''))}
                      placeholder="• • • •"
                      className="w-full min-h-[58px] pl-12 pr-4 text-2xl font-black tracking-[0.5em] bg-white text-[#1E293B] border-2 border-[#8DE5A6] focus:border-[#6BC1B8] focus:ring-2 focus:ring-[#6BC1B8]/20 rounded-2xl outline-none transition-all shadow-2xs"
                    />
                  </div>
                </div>

                {/* Remember Me Toggle */}
                <div className="flex items-center justify-between p-3 rounded-2xl bg-white border border-[#8DE5A6]">
                  <label htmlFor="remember-elderly" className="flex items-center gap-2.5 text-xs sm:text-sm font-black text-[#1E293B] cursor-pointer select-none">
                    <input
                      id="remember-elderly"
                      type="checkbox"
                      checked={rememberMe}
                      onChange={(e) => setRememberMe(e.target.checked)}
                      className="w-4 h-4 rounded text-[#3E82F0] focus:ring-[#3E82F0]"
                    />
                    <span>Remember me on this device</span>
                  </label>
                  <span className="text-[11px] font-bold text-[#3E82F0]">
                    Easy 1-tap next time
                  </span>
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  style={{ background: 'linear-gradient(to right, #C3F2D6, #8DE5A6, #6BC1B8, #3E82F0)' }}
                  className="w-full min-h-[58px] rounded-2xl text-[#0F172A] font-black text-lg flex items-center justify-center gap-2 border-2 border-[#6BC1B8] shadow-[0_4px_14px_rgba(62,130,240,0.25)] hover:brightness-105 cursor-pointer transition-all active:translate-y-1 disabled:opacity-50"
                >
                  {loading ? (
                    <span>Logging in...</span>
                  ) : (
                    <>
                      <span>Log In & Enter</span>
                      <ArrowRight className="w-5 h-5 text-[#0F172A]" />
                    </>
                  )}
                </button>
              </form>
            ) : (
              <form onSubmit={handleRegisterSubmit} className="space-y-4">
                <div className="space-y-1.5">
                  <label className="block text-xs font-black text-[#1E293B]">
                    Senior Citizen Full Name:
                  </label>
                  <input
                    type="text"
                    required
                    value={elderlyName}
                    onChange={(e) => setElderlyName(e.target.value)}
                    placeholder="e.g. Bhaben Barua"
                    className="w-full min-h-[50px] px-4 text-base font-bold bg-white text-[#1E293B] border-2 border-[#8DE5A6] focus:border-[#6BC1B8] rounded-xl outline-none transition-all shadow-2xs"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1.5">
                    <label className="block text-xs font-black text-[#1E293B]">
                      Preferred Language:
                    </label>
                    <select
                      value={elderlyLang}
                      onChange={(e) => setElderlyLang(e.target.value as RegionalLanguage)}
                      className="w-full min-h-[50px] px-3 text-sm font-bold bg-white text-[#1E293B] border-2 border-[#8DE5A6] focus:border-[#6BC1B8] rounded-xl outline-none"
                    >
                      <option value="as">অসমীয়া (Assamese)</option>
                      <option value="kha">Khasi (Meghalaya)</option>
                      <option value="mni">মৈতৈলোন্ (Manipuri)</option>
                      <option value="hi">हिंदी (Hindi)</option>
                      <option value="en">English</option>
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1.5">
                    <div className="flex items-center justify-between">
                      <label className="block text-xs font-black text-[#1E293B]">
                        Patient ID:
                      </label>
                      <button
                        type="button"
                        onClick={() => setElderlyPatientId(`PT-${Math.floor(1000 + Math.random() * 9000)}`)}
                        className="text-[10px] text-[#3E82F0] font-bold hover:underline cursor-pointer"
                        title="Generate a new Patient ID"
                      >
                        Auto-new
                      </button>
                    </div>
                    <input
                      type="text"
                      required
                      value={elderlyPatientId}
                      onChange={(e) => setElderlyPatientId(e.target.value.toUpperCase())}
                      placeholder="e.g. PT-1001"
                      className="w-full min-h-[50px] px-4 font-mono font-black text-sm uppercase bg-white text-[#1E293B] border-2 border-[#8DE5A6] focus:border-[#6BC1B8] rounded-xl outline-none shadow-2xs"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="block text-xs font-black text-[#1E293B]">
                      Age:
                    </label>
                    <input
                      type="number"
                      value={elderlyAge}
                      onChange={(e) => setElderlyAge(Number(e.target.value))}
                      className="w-full min-h-[50px] px-4 text-sm font-bold bg-white text-[#1E293B] border-2 border-[#8DE5A6] focus:border-[#6BC1B8] rounded-xl outline-none"
                    />
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label className="block text-xs font-black text-[#1E293B]">
                    Create 4-Digit Security PIN:
                  </label>
                  <input
                    type="password"
                    inputMode="numeric"
                    maxLength={4}
                    required
                    value={elderlyPin}
                    onChange={(e) => setElderlyPin(e.target.value.replace(/\D/g, ''))}
                    placeholder="e.g. 1234"
                    className="w-full min-h-[52px] px-4 text-xl font-black tracking-[0.4em] bg-white text-[#1E293B] border-2 border-[#8DE5A6] focus:border-[#6BC1B8] rounded-xl outline-none shadow-2xs"
                  />
                </div>

                {/* Assigned Caregiver Code (Privacy & Access Control) */}
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-black text-[#1E293B] flex items-center gap-1.5">
                      <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
                      Assign Caregiver Code (Optional):
                    </label>
                    <span className="text-[10px] font-bold text-slate-500">e.g. CG-2125</span>
                  </div>
                  <input
                    type="text"
                    value={elderlyCaregiverCode}
                    onChange={(e) => setElderlyCaregiverCode(e.target.value.toUpperCase())}
                    placeholder="Enter Caregiver ID (e.g. CG-2125)"
                    className="w-full min-h-[50px] px-4 text-sm font-bold bg-white text-[#1E293B] border-2 border-[#8DE5A6] focus:border-[#6BC1B8] rounded-xl outline-none uppercase shadow-2xs"
                  />
                  <p className="text-[11px] text-slate-500 font-medium">
                    Strict Privacy: Only the caregiver with this code will be granted access to your routines and care logs.
                  </p>
                </div>

                {/* Face ID Biometric Registration Option */}
                <div className="p-3.5 rounded-2xl bg-white border-2 border-[#8DE5A6] space-y-2.5 shadow-2xs">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 rounded-xl bg-gradient-to-r from-[#C3F2D6] to-[#8DE5A6] flex items-center justify-center text-[#1E293B]">
                        <Camera className="w-4 h-4 text-[#1E293B]" />
                      </div>
                      <div>
                        <h4 className="text-xs font-black text-[#1E293B]">Face ID Biometric Sign-In</h4>
                        <p className="text-[11px] text-slate-500 font-bold">100% in-browser face recognition</p>
                      </div>
                    </div>
                    {registeredFaceDescriptor ? (
                      <span className="text-[11px] font-black text-emerald-700 bg-emerald-100 border border-emerald-300 px-2 py-0.5 rounded-full flex items-center gap-1">
                        <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                        Face Enrolled
                      </span>
                    ) : (
                      <span className="text-[11px] font-bold text-[#3E82F0] bg-blue-50 px-2 py-0.5 rounded-md">
                        Optional
                      </span>
                    )}
                  </div>

                  {registeredFaceDescriptor ? (
                    <div className="flex items-center justify-between p-2.5 rounded-xl bg-emerald-50 border border-emerald-200">
                      <div className="text-xs font-black text-emerald-800 flex items-center gap-1.5">
                        <ShieldCheck className="w-4 h-4 text-emerald-600" />
                        <span>128-point biometric vector ready to save</span>
                      </div>
                      <button
                        type="button"
                        onClick={() => setIsRegScannerOpen(true)}
                        className="text-xs font-black text-[#3E82F0] hover:underline cursor-pointer"
                      >
                        Re-scan
                      </button>
                    </div>
                  ) : (
                    <button
                      type="button"
                      onClick={() => setIsRegScannerOpen(true)}
                      className="w-full py-2.5 px-3 rounded-xl bg-[#F0FDF4] hover:bg-emerald-100 text-[#1E293B] border border-[#8DE5A6] text-xs font-black flex items-center justify-center gap-2 cursor-pointer transition-colors shadow-2xs"
                    >
                      <Camera className="w-4 h-4 text-[#3E82F0]" />
                      <span>Scan Face for Face ID</span>
                    </button>
                  )}
                </div>

                {/* Remember Me Toggle */}
                <div className="flex items-center justify-between p-3 rounded-2xl bg-white border border-[#8DE5A6]">
                  <label htmlFor="remember-elderly-reg" className="flex items-center gap-2.5 text-xs sm:text-sm font-black text-[#1E293B] cursor-pointer select-none">
                    <input
                      id="remember-elderly-reg"
                      type="checkbox"
                      checked={rememberMe}
                      onChange={(e) => setRememberMe(e.target.checked)}
                      className="w-4 h-4 rounded text-[#3E82F0] focus:ring-[#3E82F0]"
                    />
                    <span>Remember me on this device</span>
                  </label>
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  style={{ background: 'linear-gradient(to right, #C3F2D6, #8DE5A6, #6BC1B8, #3E82F0)' }}
                  className="w-full min-h-[56px] rounded-2xl text-[#0F172A] font-black text-base flex items-center justify-center gap-2 border-2 border-[#6BC1B8] shadow-[0_4px_14px_rgba(62,130,240,0.25)] hover:brightness-105 cursor-pointer transition-all active:translate-y-1 mt-2"
                >
                  {loading ? (
                    <span>Saving Profile...</span>
                  ) : (
                    <>
                      <span>Save Profile & Proceed</span>
                      <ArrowRight className="w-5 h-5 text-[#0F172A]" />
                    </>
                  )}
                </button>
              </form>
            )
          )}

          {/* ============================================================ */}
          {/* CAREGIVER FORM */}
          {/* ============================================================ */}
          {activeTab === 'caregiver' && (
            authMode === 'login' ? (
              <form onSubmit={handleLoginSubmit} className="space-y-5">
                {/* Sign in with Face ID Button */}
                <button
                  type="button"
                  onClick={() => {
                    soundEffects.playGentleTap();
                    setFaceModalMode('login');
                    setIsFaceModalOpen(true);
                  }}
                  className="w-full min-h-[58px] rounded-2xl bg-white hover:bg-slate-50 text-[#1E293B] font-black text-base flex items-center justify-center gap-3 border-2 border-[#8DE5A6] hover:border-[#3E82F0] shadow-xs hover:shadow-[0_4px_14px_rgba(62,130,240,0.18)] cursor-pointer transition-all active:translate-y-0.5 group"
                >
                  <div className="w-9 h-9 rounded-xl bg-gradient-to-r from-[#C3F2D6] to-[#8DE5A6] flex items-center justify-center text-[#1E293B] shadow-2xs group-hover:scale-105 transition-transform">
                    <Camera className="w-5 h-5 text-[#1E293B]" />
                  </div>
                  <span>Sign in with Face</span>
                  <span className="text-xs bg-[#3E82F0] text-white px-2.5 py-0.5 rounded-full font-black">
                    Face ID
                  </span>
                </button>

                <div className="relative flex py-0.5 items-center">
                  <div className="flex-grow border-t border-slate-200"></div>
                  <span className="flex-shrink mx-3 text-xs font-bold text-slate-400 uppercase tracking-wider">
                    or enter with credentials & PIN
                  </span>
                  <div className="flex-grow border-t border-slate-200"></div>
                </div>

                <div className="space-y-2">
                  <label className="block text-sm font-black text-[#1E293B] flex items-center justify-between">
                    <span>Caregiver Name / ID / Phone:</span>
                    <span className="text-xs text-[#3E82F0] font-bold">e.g. CG-101, Dr. Priya</span>
                  </label>
                  <div className="relative">
                    <UserIcon className="w-5 h-5 absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
                    <input
                      type="text"
                      value={caregiverName}
                      onChange={(e) => setCaregiverName(e.target.value)}
                      placeholder="Enter Caregiver Name or ID"
                      className="w-full min-h-[54px] pl-12 pr-4 text-base font-bold bg-white text-[#1E293B] border-2 border-[#8DE5A6] focus:border-[#3E82F0] focus:ring-2 focus:ring-[#3E82F0]/20 rounded-2xl outline-none transition-all shadow-2xs"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="block text-sm font-black text-[#1E293B] flex items-center justify-between">
                    <span>4-Digit Security PIN:</span>
                    <span className="text-xs text-[#3E82F0] font-bold">4 Numbers</span>
                  </label>
                  <div className="relative">
                    <KeyRound className="w-5 h-5 absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
                    <input
                      type="password"
                      inputMode="numeric"
                      maxLength={4}
                      value={caregiverPin}
                      onChange={(e) => setCaregiverPin(e.target.value.replace(/\D/g, ''))}
                      placeholder="• • • •"
                      className="w-full min-h-[58px] pl-12 pr-4 text-2xl font-black tracking-[0.5em] bg-white text-[#1E293B] border-2 border-[#8DE5A6] focus:border-[#3E82F0] focus:ring-2 focus:ring-[#3E82F0]/20 rounded-2xl outline-none transition-all shadow-2xs"
                    />
                  </div>
                </div>

                {/* Remember Me Toggle */}
                <div className="flex items-center justify-between p-3 rounded-2xl bg-white border border-[#8DE5A6]">
                  <label htmlFor="remember-caregiver" className="flex items-center gap-2.5 text-xs sm:text-sm font-black text-[#1E293B] cursor-pointer select-none">
                    <input
                      id="remember-caregiver"
                      type="checkbox"
                      checked={rememberMe}
                      onChange={(e) => setRememberMe(e.target.checked)}
                      className="w-4 h-4 rounded text-[#3E82F0] focus:ring-[#3E82F0]"
                    />
                    <span>Remember me on this device</span>
                  </label>
                  <span className="text-[11px] font-bold text-[#3E82F0]">
                    Fast access
                  </span>
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  style={{ background: 'linear-gradient(to right, #C3F2D6, #8DE5A6, #6BC1B8, #3E82F0)' }}
                  className="w-full min-h-[58px] rounded-2xl text-[#0F172A] font-black text-lg flex items-center justify-center gap-2 border-2 border-[#6BC1B8] shadow-[0_4px_14px_rgba(62,130,240,0.25)] hover:brightness-105 cursor-pointer transition-all active:translate-y-1 disabled:opacity-50"
                >
                  {loading ? (
                    <span>Verifying Credentials...</span>
                  ) : (
                    <>
                      <span>Access Caregiver Dashboard</span>
                      <ArrowRight className="w-5 h-5 text-[#0F172A]" />
                    </>
                  )}
                </button>
              </form>
            ) : (
              <form onSubmit={handleRegisterSubmit} className="space-y-4">
                <div className="space-y-1.5">
                  <label className="block text-xs font-black text-[#1E293B]">
                    Caregiver Full Name:
                  </label>
                  <input
                    type="text"
                    required
                    value={caregiverName}
                    onChange={(e) => setCaregiverName(e.target.value)}
                    placeholder="e.g. Dr. Priya Barua / David Lalnunmawia"
                    className="w-full min-h-[50px] px-4 text-base font-bold bg-white text-[#1E293B] border-2 border-[#8DE5A6] focus:border-[#3E82F0] focus:bg-white rounded-xl outline-none transition-all shadow-2xs"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1.5">
                    <label className="block text-xs font-black text-[#1E293B] flex items-center justify-between">
                      <span>Caregiver ID Code:</span>
                    </label>
                    <input
                      type="text"
                      required
                      value={caregiverCode}
                      onChange={(e) => setCaregiverCode(e.target.value.toUpperCase())}
                      placeholder="e.g. CG-101"
                      className="w-full min-h-[50px] px-4 font-mono font-black text-sm uppercase bg-white text-[#1E293B] border-2 border-[#8DE5A6] focus:border-[#3E82F0] rounded-xl outline-none shadow-2xs"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="block text-xs font-black text-[#1E293B]">
                      4-Digit PIN:
                    </label>
                    <input
                      type="password"
                      inputMode="numeric"
                      maxLength={4}
                      required
                      value={caregiverPin}
                      onChange={(e) => setCaregiverPin(e.target.value.replace(/\D/g, ''))}
                      placeholder="e.g. 4321"
                      className="w-full min-h-[50px] px-4 text-lg font-black tracking-[0.3em] bg-white text-[#1E293B] border-2 border-[#8DE5A6] focus:border-[#3E82F0] rounded-xl outline-none shadow-2xs"
                    />
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label className="block text-xs font-black text-[#1E293B]">
                    Relation / Role:
                  </label>
                  <input
                    type="text"
                    value={caregiverRelation}
                    onChange={(e) => setCaregiverRelation(e.target.value)}
                    placeholder="e.g. Granddaughter / Primary Family Caregiver"
                    className="w-full min-h-[50px] px-4 text-sm font-bold bg-white text-[#1E293B] border-2 border-[#8DE5A6] focus:border-[#3E82F0] rounded-xl outline-none shadow-2xs"
                  />
                </div>

                {/* Face ID Biometric Registration Option */}
                <div className="p-3.5 rounded-2xl bg-white border-2 border-[#8DE5A6] space-y-2.5 shadow-2xs">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 rounded-xl bg-gradient-to-r from-[#C3F2D6] to-[#8DE5A6] flex items-center justify-center text-[#1E293B]">
                        <Camera className="w-4 h-4 text-[#1E293B]" />
                      </div>
                      <div>
                        <h4 className="text-xs font-black text-[#1E293B]">Face ID Biometric Sign-In</h4>
                        <p className="text-[11px] text-slate-500 font-bold">100% in-browser face recognition</p>
                      </div>
                    </div>
                    {registeredFaceDescriptor ? (
                      <span className="text-[11px] font-black text-emerald-700 bg-emerald-100 border border-emerald-300 px-2 py-0.5 rounded-full flex items-center gap-1">
                        <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                        Face Enrolled
                      </span>
                    ) : (
                      <span className="text-[11px] font-bold text-[#3E82F0] bg-blue-50 px-2 py-0.5 rounded-md">
                        Optional
                      </span>
                    )}
                  </div>

                  {registeredFaceDescriptor ? (
                    <div className="flex items-center justify-between p-2.5 rounded-xl bg-emerald-50 border border-emerald-200">
                      <div className="text-xs font-black text-emerald-800 flex items-center gap-1.5">
                        <ShieldCheck className="w-4 h-4 text-emerald-600" />
                        <span>128-point biometric vector ready to save</span>
                      </div>
                      <button
                        type="button"
                        onClick={() => setIsRegScannerOpen(true)}
                        className="text-xs font-black text-[#3E82F0] hover:underline cursor-pointer"
                      >
                        Re-scan
                      </button>
                    </div>
                  ) : (
                    <button
                      type="button"
                      onClick={() => setIsRegScannerOpen(true)}
                      className="w-full py-2.5 px-3 rounded-xl bg-[#F0FDF4] hover:bg-emerald-100 text-[#1E293B] border border-[#8DE5A6] text-xs font-black flex items-center justify-center gap-2 cursor-pointer transition-colors shadow-2xs"
                    >
                      <Camera className="w-4 h-4 text-[#3E82F0]" />
                      <span>Scan Face for Face ID</span>
                    </button>
                  )}
                </div>

                {/* Remember Me Toggle */}
                <div className="flex items-center justify-between p-3 rounded-2xl bg-white border border-[#8DE5A6]">
                  <label htmlFor="remember-caregiver-reg" className="flex items-center gap-2.5 text-xs sm:text-sm font-black text-[#1E293B] cursor-pointer select-none">
                    <input
                      id="remember-caregiver-reg"
                      type="checkbox"
                      checked={rememberMe}
                      onChange={(e) => setRememberMe(e.target.checked)}
                      className="w-4 h-4 rounded text-[#3E82F0] focus:ring-[#3E82F0]"
                    />
                    <span>Remember me on this device</span>
                  </label>
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  style={{ background: 'linear-gradient(to right, #C3F2D6, #8DE5A6, #6BC1B8, #3E82F0)' }}
                  className="w-full min-h-[56px] rounded-2xl text-[#0F172A] font-black text-base flex items-center justify-center gap-2 border-2 border-[#6BC1B8] shadow-[0_4px_14px_rgba(62,130,240,0.25)] hover:brightness-105 cursor-pointer transition-all active:translate-y-1 mt-2"
                >
                  {loading ? (
                    <span>Registering Account...</span>
                  ) : (
                    <>
                      <span>Register & Enter Portal</span>
                      <ArrowRight className="w-5 h-5 text-[#0F172A]" />
                    </>
                  )}
                </button>
              </form>
            )
          )}

        </div>

      </div>

      {/* Face ID Login Modal */}
      <FaceLoginModal
        isOpen={isFaceModalOpen}
        onClose={() => setIsFaceModalOpen(false)}
        users={users}
        onLogin={(matchedUser) => {
          if (rememberMe) {
            saveRememberedUser(matchedUser);
          }
          onLogin(matchedUser);
        }}
        onUpdateUser={(updatedUser) => {
          // If a user updated their face descriptor
          saveUserToFirebase(updatedUser).catch(() => {});
        }}
        initialMode={faceModalMode}
      />

      {/* Dedicated Face Registration Scanner for Signup Flow */}
      <FaceRegistrationScanner
        isOpen={isRegScannerOpen}
        onClose={() => setIsRegScannerOpen(false)}
        userName={
          activeTab === 'elderly'
            ? (elderlyName.trim() || 'Senior Citizen')
            : (caregiverName.trim() || 'Caregiver')
        }
        onFaceCaptured={(descriptor) => {
          setRegisteredFaceDescriptor(descriptor);
        }}
      />
    </div>
  );
};
