import React, { useState, useRef } from 'react';
import { 
  X, 
  Camera, 
  Upload, 
  Link as LinkIcon, 
  User as UserIcon, 
  Phone, 
  MapPin, 
  Globe, 
  Calendar, 
  FileText, 
  Lock, 
  ShieldCheck, 
  Check, 
  Sparkles, 
  Heart, 
  AlertCircle,
  Stethoscope,
  Smile,
  Scan,
  CheckCircle2,
  Trash2,
  RefreshCw
} from 'lucide-react';
import { FaceRegistrationScanner } from '../auth/FaceRegistrationScanner';
import { User, RegionalLanguage, DementiaStage } from '../../types';
import { LANGUAGE_LABELS, UI_TRANSLATIONS } from '../../data/nerContent';
import { soundEffects } from '../../utils/speechAndAudio';
import { searchCaregiverByCodeOrName, unlinkElderlyFromCaregiverInFirebase } from '../../lib/firebase';

interface EditProfileModalProps {
  isOpen: boolean;
  onClose: () => void;
  user: User;
  onSave: (updatedUser: User) => Promise<void> | void;
}

// Culturally respectful curated presets for North East India & universal care
const ELDERLY_AVATAR_PRESETS = [
  {
    id: 'elder-1',
    label: 'Dadaji Bhaben (Guwahati)',
    url: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=400&q=80',
    description: 'Traditional Assam Elder'
  },
  {
    id: 'elder-2',
    label: 'Aita Kalyani (Assam)',
    url: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&w=400&q=80',
    description: 'Graceful Grandmother'
  },
  {
    id: 'elder-3',
    label: 'Bah Heprit (Shillong)',
    url: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?auto=format&fit=crop&w=400&q=80',
    description: 'Smiling Meghalaya Elder'
  },
  {
    id: 'elder-4',
    label: 'Ima Ibemhal (Imphal)',
    url: 'https://images.unsplash.com/photo-1580489944761-15a19d654956?auto=format&fit=crop&w=400&q=80',
    description: 'Loving Matriarch'
  },
  {
    id: 'elder-5',
    label: 'Koka Hazarika (Jorhat)',
    url: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=400&q=80',
    description: 'Peaceful Scholar Elder'
  },
  {
    id: 'elder-6',
    label: 'Mei Wanlang (Cherrapunji)',
    url: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&w=400&q=80',
    description: 'Gentle Khasi Elder'
  },
];

const CAREGIVER_AVATAR_PRESETS = [
  {
    id: 'cg-1',
    label: 'Dr. Priya Barua',
    url: 'https://images.unsplash.com/photo-1559839734-2b71ea197ec2?auto=format&fit=crop&w=400&q=80',
    description: 'Geriatric Specialist'
  },
  {
    id: 'cg-2',
    label: 'Dr. Bikash Hazarika',
    url: 'https://images.unsplash.com/photo-1622253692010-333f2da6031d?auto=format&fit=crop&w=400&q=80',
    description: 'Clinical Neurologist'
  },
  {
    id: 'cg-3',
    label: 'Care Coordinator Ananya',
    url: 'https://images.unsplash.com/photo-1594824813576-96b01b63ef26?auto=format&fit=crop&w=400&q=80',
    description: 'Community Health Nurse'
  },
  {
    id: 'cg-4',
    label: 'Family Caregiver Rahul',
    url: 'https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?auto=format&fit=crop&w=400&q=80',
    description: 'Devoted Family Companion'
  },
  {
    id: 'cg-5',
    label: 'Clinical Associate Maya',
    url: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=400&q=80',
    description: 'Cognitive Engagement Lead'
  },
  {
    id: 'cg-6',
    label: 'Home Health Nurse David',
    url: 'https://images.unsplash.com/photo-1612349317150-e413f6a5b16d?auto=format&fit=crop&w=400&q=80',
    description: 'Primary Care Specialist'
  },
];

const POPULAR_LOCATIONS = [
  'Guwahati, Assam',
  'Shillong, Meghalaya',
  'Dibrugarh, Assam',
  'Jorhat, Assam',
  'Imphal, Manipur',
  'Silchar, Assam',
  'Tezpur, Assam',
  'Kohima, Nagaland',
  'Aizawl, Mizoram',
  'Itanagar, Arunachal'
];

export const EditProfileModal: React.FC<EditProfileModalProps> = ({
  isOpen,
  onClose,
  user,
  onSave,
}) => {
  if (!isOpen) return null;

  const isElderly = user.role === 'elderly';
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Form States
  const [name, setName] = useState(user.name || '');
  const [avatar, setAvatar] = useState(
    user.avatar || (isElderly ? ELDERLY_AVATAR_PRESETS[0].url : CAREGIVER_AVATAR_PRESETS[0].url)
  );
  const [phone, setPhone] = useState(user.phone || '');
  const [location, setLocation] = useState(user.location || 'Guwahati, Assam');
  const [languagePref, setLanguagePref] = useState<RegionalLanguage>(user.language_pref || 'as');
  const [pin, setPin] = useState(user.pin || '1234');
  
  // Face ID Biometric States
  const [faceDescriptor, setFaceDescriptor] = useState<number[] | null>(user.face_descriptor || null);
  const [faceRegisteredAt, setFaceRegisteredAt] = useState<string | null>(user.face_registered_at || null);
  const [isFaceScannerOpen, setIsFaceScannerOpen] = useState(false);
  
  // Role-specific fields
  const [patientId, setPatientId] = useState(user.patient_id || (user.role === 'elderly' ? `PT-${Math.floor(1000 + Math.random() * 9000)}` : ''));
  const [age, setAge] = useState<number>(user.age || 72);
  const [diagnosisNote, setDiagnosisNote] = useState(user.diagnosis_note || '');
  const [dementiaStage, setDementiaStage] = useState<DementiaStage>(user.dementia_stage || 'mild');
  const [caregiverCode, setCaregiverCode] = useState(user.caregiver_code || '');
  const [emergencyName, setEmergencyName] = useState(user.emergency_contact?.name || '');
  const [emergencyPhone, setEmergencyPhone] = useState(user.emergency_contact?.phone || '');
  const [emergencyRelation, setEmergencyRelation] = useState(user.emergency_contact?.relation || '');

  // Caregiver assignment & access control
  const [connectedCaregiverId, setConnectedCaregiverId] = useState(user.connected_caregiver_id || '');
  const [connectedCaregiverName, setConnectedCaregiverName] = useState(user.connected_caregiver_name || '');
  const [isChangingCaregiver, setIsChangingCaregiver] = useState(false);
  const [caregiverInputCode, setCaregiverInputCode] = useState('');
  const [caregiverStatusMsg, setCaregiverStatusMsg] = useState('');
  const [isVerifyingCaregiver, setIsVerifyingCaregiver] = useState(false);

  // Handle assigning caregiver code
  const handleAssignCaregiver = async () => {
    if (!caregiverInputCode.trim()) {
      setCaregiverStatusMsg('Please enter a Caregiver ID (e.g. CG-2125).');
      return;
    }
    setIsVerifyingCaregiver(true);
    setCaregiverStatusMsg('');
    try {
      const matched = await searchCaregiverByCodeOrName(caregiverInputCode.trim());
      if (matched) {
        setConnectedCaregiverId(matched.caregiver_code || matched.id);
        setConnectedCaregiverName(matched.name);
        setCaregiverStatusMsg(`Caregiver ${matched.name} found and assigned! Save profile to confirm.`);
        setIsChangingCaregiver(false);
        setCaregiverInputCode('');
        soundEffects.playSuccessChime();
      } else {
        // Allow manual code assignment if caregiver will sign up later
        const code = caregiverInputCode.trim().toUpperCase();
        setConnectedCaregiverId(code);
        setConnectedCaregiverName('Assigned Caregiver');
        setCaregiverStatusMsg(`Code ${code} saved as your assigned caregiver. Save profile to confirm.`);
        setIsChangingCaregiver(false);
        setCaregiverInputCode('');
        soundEffects.playGentleTap();
      }
    } catch (e) {
      console.warn('Error looking up caregiver:', e);
      setConnectedCaregiverId(caregiverInputCode.trim().toUpperCase());
      setConnectedCaregiverName('Assigned Caregiver');
      setIsChangingCaregiver(false);
    } finally {
      setIsVerifyingCaregiver(false);
    }
  };

  // Handle removing assigned caregiver
  const handleUnassignCaregiver = async () => {
    soundEffects.playGentleTap();
    setConnectedCaregiverId('');
    setConnectedCaregiverName('');
    setCaregiverStatusMsg('Caregiver unassigned. Save profile to update permissions.');
    try {
      await unlinkElderlyFromCaregiverInFirebase(user.id);
      fetch('/api/caregivers/unlink', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ elderly_id: user.id })
      }).catch(() => {});
    } catch (e) {
      console.warn('Error unlinking in Firebase:', e);
    }
  };

  // UI tabs & states
  const [photoTab, setPhotoTab] = useState<'presets' | 'upload' | 'url'>('presets');
  const [customUrlInput, setCustomUrlInput] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [successMessage, setSuccessMessage] = useState('');

  // Handle local image file upload
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      setErrorMessage('Please select a valid image file (PNG, JPG, WebP).');
      return;
    }

    // Limit file size (max 4MB)
    if (file.size > 4 * 1024 * 1024) {
      setErrorMessage('Image size is too large. Please select an image under 4MB.');
      return;
    }

    setErrorMessage('');
    const reader = new FileReader();
    reader.onload = (event) => {
      if (typeof event.target?.result === 'string') {
        setAvatar(event.target.result);
        soundEffects.playGentleTap();
      }
    };
    reader.readAsDataURL(file);
  };

  // Apply custom URL
  const handleApplyCustomUrl = () => {
    if (!customUrlInput.trim()) {
      setErrorMessage('Please enter an image URL.');
      return;
    }
    setAvatar(customUrlInput.trim());
    setErrorMessage('');
    soundEffects.playGentleTap();
  };

  // Submit Handler
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      setErrorMessage('Name cannot be empty.');
      return;
    }
    if (!pin || pin.length < 4) {
      setErrorMessage('Please enter a valid 4-digit PIN.');
      return;
    }

    setIsSaving(true);
    setErrorMessage('');

    const updatedUser: User = {
      ...user,
      name: name.trim(),
      avatar,
      language_pref: languagePref,
      pin: pin.slice(-4),
      age: Number(age) || (isElderly ? 72 : 35),
      ...(phone.trim() ? { phone: phone.trim() } : {}),
      ...(location.trim() ? { location: location.trim() } : {}),
      ...(diagnosisNote.trim() ? { diagnosis_note: diagnosisNote.trim() } : {}),
      ...(isElderly ? { 
        patient_id: patientId.trim().toUpperCase() || user.patient_id || `PT-${Math.floor(1000 + Math.random() * 9000)}`,
        dementia_stage: dementiaStage,
        connected_caregiver_id: connectedCaregiverId.trim() || undefined,
        connected_caregiver_name: connectedCaregiverName.trim() || undefined,
      } : {}),
      ...(!isElderly && (caregiverCode.trim() || user.caregiver_code) ? { caregiver_code: caregiverCode.trim() || user.caregiver_code } : {}),
      ...((emergencyName.trim() && emergencyPhone.trim()) ? {
        emergency_contact: {
          name: emergencyName.trim(),
          phone: emergencyPhone.trim(),
          relation: emergencyRelation.trim() || 'Family Member'
        }
      } : (user.emergency_contact ? { emergency_contact: user.emergency_contact } : {})),
      face_descriptor: faceDescriptor && faceDescriptor.length > 0 ? faceDescriptor : null,
      face_registered_at: faceDescriptor && faceDescriptor.length > 0 ? (faceRegisteredAt || new Date().toISOString()) : null,
    };

    try {
      await onSave(updatedUser);
      soundEffects.playSuccessChime();
      setSuccessMessage('Profile updated successfully!');
      setTimeout(() => {
        setIsSaving(false);
        onClose();
      }, 700);
    } catch (err) {
      console.error('Failed to update profile:', err);
      setErrorMessage('Could not update profile. Please try again.');
      setIsSaving(false);
    }
  };

  const presetList = isElderly ? ELDERLY_AVATAR_PRESETS : CAREGIVER_AVATAR_PRESETS;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/60 backdrop-blur-xs overflow-y-auto animate-fade-in">
      <div 
        id="edit-profile-dialog"
        className="relative w-full max-w-2xl bg-white rounded-[32px] border-4 border-amber-300 shadow-2xl my-8 overflow-hidden flex flex-col max-h-[92vh]"
      >
        {/* Modal Header */}
        <div className="flex items-center justify-between px-6 py-5 bg-gradient-to-r from-amber-500 via-orange-500 to-amber-600 text-gray-950 border-b-3 border-amber-600">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-amber-400 border-2 border-amber-300 flex items-center justify-center shadow-xs">
              <Camera className="w-5 h-5 text-gray-950" />
            </div>
            <div>
              <h2 className="text-xl sm:text-2xl font-black tracking-tight text-gray-950">
                Edit Profile & Photo
              </h2>
              <p className="text-xs sm:text-sm font-bold text-amber-950/80">
                {isElderly ? 'Senior Companion Account' : 'Caregiver Specialist Account'}
              </p>
            </div>
          </div>

          <button
            id="close-edit-profile-btn"
            type="button"
            onClick={() => {
              soundEffects.playGentleTap();
              onClose();
            }}
            className="w-10 h-10 rounded-full bg-white/30 hover:bg-white/50 text-gray-950 flex items-center justify-center cursor-pointer transition-colors border border-amber-300"
            title="Close"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Scrollable Form Body */}
        <form onSubmit={handleSubmit} className="p-6 overflow-y-auto space-y-6 flex-1 text-gray-800">
          
          {/* 1. Profile Picture Studio */}
          <div className="bg-stone-50 rounded-3xl p-5 border-2 border-stone-200 space-y-4">
            <div className="flex items-center justify-between">
              <label className="text-sm font-black text-gray-900 uppercase tracking-wider flex items-center gap-2">
                <Camera className="w-4 h-4 text-amber-600" />
                Profile Picture
              </label>
              <span className="text-xs font-bold text-gray-500">
                Select preset, upload, or paste link
              </span>
            </div>

            {/* Current Avatar Preview & Quick Switcher */}
            <div className="flex flex-col sm:flex-row items-center gap-5">
              <div className="relative group shrink-0">
                <img
                  src={avatar}
                  alt={name || 'Avatar'}
                  className="w-24 h-24 sm:w-28 sm:h-28 rounded-3xl object-cover border-4 border-amber-400 shadow-md bg-stone-200"
                  onError={(e) => {
                    (e.target as HTMLImageElement).src =
                      'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=400&q=80';
                  }}
                />
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="absolute -bottom-2 -right-2 p-2 rounded-xl bg-amber-500 hover:bg-amber-600 text-white shadow-md border-2 border-white transition-transform active:scale-95 cursor-pointer"
                  title="Upload from device"
                >
                  <Upload className="w-4 h-4" />
                </button>
              </div>

              {/* Photo Options Navigation Tabs */}
              <div className="flex-1 w-full space-y-2.5">
                <div className="flex items-center bg-stone-200/80 p-1 rounded-2xl gap-1">
                  <button
                    type="button"
                    onClick={() => {
                      soundEffects.playGentleTap();
                      setPhotoTab('presets');
                    }}
                    className={`flex-1 py-1.5 px-2.5 rounded-xl text-xs font-black transition-all cursor-pointer ${
                      photoTab === 'presets'
                        ? 'bg-white text-gray-950 shadow-xs'
                        : 'text-gray-600 hover:text-gray-900'
                    }`}
                  >
                    ✨ Curated Presets
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      soundEffects.playGentleTap();
                      setPhotoTab('upload');
                    }}
                    className={`flex-1 py-1.5 px-2.5 rounded-xl text-xs font-black transition-all cursor-pointer ${
                      photoTab === 'upload'
                        ? 'bg-white text-gray-950 shadow-xs'
                        : 'text-gray-600 hover:text-gray-900'
                    }`}
                  >
                    📁 Upload File
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      soundEffects.playGentleTap();
                      setPhotoTab('url');
                    }}
                    className={`flex-1 py-1.5 px-2.5 rounded-xl text-xs font-black transition-all cursor-pointer ${
                      photoTab === 'url'
                        ? 'bg-white text-gray-950 shadow-xs'
                        : 'text-gray-600 hover:text-gray-900'
                    }`}
                  >
                    🔗 Image URL
                  </button>
                </div>

                {/* Tab 1: Presets Gallery */}
                {photoTab === 'presets' && (
                  <div className="grid grid-cols-3 sm:grid-cols-6 gap-2 pt-1">
                    {presetList.map((preset) => (
                      <button
                        key={preset.id}
                        type="button"
                        onClick={() => {
                          soundEffects.playGentleTap();
                          setAvatar(preset.url);
                        }}
                        className={`group relative rounded-2xl overflow-hidden border-2 transition-all cursor-pointer aspect-square ${
                          avatar === preset.url
                            ? 'border-amber-500 ring-3 ring-amber-300 scale-102'
                            : 'border-stone-300 hover:border-amber-400'
                        }`}
                        title={`${preset.label} (${preset.description})`}
                      >
                        <img
                          src={preset.url}
                          alt={preset.label}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                        />
                        {avatar === preset.url && (
                          <div className="absolute inset-0 bg-amber-500/30 flex items-center justify-center">
                            <Check className="w-5 h-5 text-white stroke-[3]" />
                          </div>
                        )}
                      </button>
                    ))}
                  </div>
                )}

                {/* Tab 2: Upload File */}
                {photoTab === 'upload' && (
                  <div className="p-3 bg-white rounded-2xl border-2 border-dashed border-amber-300 flex flex-col items-center justify-center text-center gap-2">
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept="image/*"
                      onChange={handleFileChange}
                      className="hidden"
                    />
                    <Upload className="w-7 h-7 text-amber-600" />
                    <div>
                      <p className="text-xs font-bold text-gray-800">
                        Choose an image from your device
                      </p>
                      <p className="text-[11px] text-gray-500">
                        PNG, JPG, WebP (Max 4MB)
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={() => fileInputRef.current?.click()}
                      className="px-4 py-1.5 rounded-xl bg-amber-100 hover:bg-amber-200 text-amber-950 font-black text-xs border border-amber-300 cursor-pointer transition-colors"
                    >
                      Browse Device
                    </button>
                  </div>
                )}

                {/* Tab 3: Custom Web Link */}
                {photoTab === 'url' && (
                  <div className="flex gap-2">
                    <input
                      type="url"
                      placeholder="https://example.com/photo.jpg"
                      value={customUrlInput}
                      onChange={(e) => setCustomUrlInput(e.target.value)}
                      className="flex-1 px-3 py-2 text-xs rounded-xl border-2 border-stone-300 focus:border-amber-500 focus:outline-none bg-white font-medium"
                    />
                    <button
                      type="button"
                      onClick={handleApplyCustomUrl}
                      className="px-4 py-2 rounded-xl bg-amber-500 hover:bg-amber-600 text-gray-950 text-xs font-black cursor-pointer shadow-xs"
                    >
                      Apply
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* 2. Basic Profile Information */}
          <div className="space-y-4">
            <h3 className="text-sm font-black text-gray-900 uppercase tracking-wider flex items-center gap-2">
              <UserIcon className="w-4 h-4 text-amber-600" />
              General Details
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* Full Name */}
              <div className="space-y-1">
                <label className="text-xs font-bold text-gray-700">
                  Full Name <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <UserIcon className="w-4 h-4 absolute left-3 top-3.5 text-gray-400" />
                  <input
                    type="text"
                    required
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder={isElderly ? "e.g., Bhaben Barua" : "e.g., Dr. Priya Barua"}
                    className="w-full pl-9 pr-3 py-2.5 rounded-xl border-2 border-stone-300 focus:border-amber-500 focus:ring-2 focus:ring-amber-200 outline-none text-sm font-bold bg-stone-50"
                  />
                </div>
              </div>

              {/* Phone Number */}
              <div className="space-y-1">
                <label className="text-xs font-bold text-gray-700">
                  Phone / WhatsApp Number
                </label>
                <div className="relative">
                  <Phone className="w-4 h-4 absolute left-3 top-3.5 text-gray-400" />
                  <input
                    type="tel"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="+91 98640 12345"
                    className="w-full pl-9 pr-3 py-2.5 rounded-xl border-2 border-stone-300 focus:border-amber-500 focus:ring-2 focus:ring-amber-200 outline-none text-sm font-bold bg-stone-50"
                  />
                </div>
              </div>

              {/* Location */}
              <div className="space-y-1">
                <label className="text-xs font-bold text-gray-700">
                  Home City / Region
                </label>
                <div className="relative">
                  <MapPin className="w-4 h-4 absolute left-3 top-3.5 text-gray-400" />
                  <input
                    type="text"
                    value={location}
                    onChange={(e) => setLocation(e.target.value)}
                    placeholder="Guwahati, Assam"
                    className="w-full pl-9 pr-3 py-2.5 rounded-xl border-2 border-stone-300 focus:border-amber-500 focus:ring-2 focus:ring-amber-200 outline-none text-sm font-bold bg-stone-50"
                  />
                </div>
                {/* Popular Chips */}
                <div className="flex flex-wrap gap-1 pt-1">
                  {POPULAR_LOCATIONS.slice(0, 4).map((loc) => (
                    <button
                      key={loc}
                      type="button"
                      onClick={() => setLocation(loc)}
                      className="text-[10px] px-2 py-0.5 rounded-md bg-stone-200 hover:bg-stone-300 text-stone-800 font-bold transition-colors cursor-pointer"
                    >
                      {loc.split(',')[0]}
                    </button>
                  ))}
                </div>
              </div>

              {/* Language Preference */}
              <div className="space-y-1">
                <label className="text-xs font-bold text-gray-700">
                  Primary Language
                </label>
                <div className="relative">
                  <Globe className="w-4 h-4 absolute left-3 top-3.5 text-gray-400" />
                  <select
                    value={languagePref}
                    onChange={(e) => setLanguagePref(e.target.value as RegionalLanguage)}
                    className="w-full pl-9 pr-3 py-2.5 rounded-xl border-2 border-stone-300 focus:border-amber-500 focus:ring-2 focus:ring-amber-200 outline-none text-sm font-bold bg-stone-50 cursor-pointer"
                  >
                    {Object.entries(LANGUAGE_LABELS).map(([code, meta]) => (
                      <option key={code} value={code}>
                        {meta.nativeName} ({meta.name} - {meta.region})
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            </div>
          </div>

          {/* 3. Role-Specific Settings */}
          {isElderly ? (
            <div className="bg-amber-50/70 rounded-3xl p-5 border-2 border-amber-200 space-y-4">
              <h3 className="text-sm font-black text-amber-950 uppercase tracking-wider flex items-center gap-2">
                <Heart className="w-4 h-4 text-amber-600" />
                Senior Care & Health Details
              </h3>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* Age (Interactive Stepper & Presets) */}
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-bold text-gray-700 flex items-center gap-1.5">
                      <Calendar className="w-3.5 h-3.5 text-amber-600" />
                      Senior Citizen Age
                    </label>
                    <span className="text-[11px] font-black text-amber-900 bg-amber-200/80 px-2 py-0.5 rounded-full">
                      {age} Years Old
                    </span>
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => setAge((prev) => Math.max(45, prev - 1))}
                      className="w-10 h-10 rounded-xl bg-white hover:bg-amber-100 border-2 border-amber-300 font-black text-xl text-amber-950 flex items-center justify-center cursor-pointer active:scale-95 transition-all shadow-xs"
                      title="Decrease age by 1 year"
                    >
                      -
                    </button>
                    <div className="relative flex-1">
                      <input
                        type="number"
                        min={45}
                        max={120}
                        value={age}
                        onChange={(e) => setAge(Math.max(1, Number(e.target.value)))}
                        className="w-full text-center py-2 rounded-xl border-2 border-amber-200 focus:border-amber-500 focus:ring-2 focus:ring-amber-200 outline-none text-base font-black bg-white text-gray-900"
                      />
                    </div>
                    <button
                      type="button"
                      onClick={() => setAge((prev) => Math.min(120, prev + 1))}
                      className="w-10 h-10 rounded-xl bg-white hover:bg-amber-100 border-2 border-amber-300 font-black text-xl text-amber-950 flex items-center justify-center cursor-pointer active:scale-95 transition-all shadow-xs"
                      title="Increase age by 1 year"
                    >
                      +
                    </button>
                  </div>

                  {/* Quick Age Presets */}
                  <div className="flex items-center gap-1.5 pt-0.5">
                    <span className="text-[10px] text-stone-500 font-bold">Quick set:</span>
                    {[65, 70, 75, 80, 85].map((preset) => (
                      <button
                        key={preset}
                        type="button"
                        onClick={() => setAge(preset)}
                        className={`text-[10px] px-2 py-0.5 rounded-md font-black transition-all cursor-pointer ${
                          age === preset
                            ? 'bg-amber-700 text-white shadow-xs'
                            : 'bg-white hover:bg-amber-100 text-stone-700 border border-amber-300'
                        }`}
                      >
                        {preset}y
                      </button>
                    ))}
                  </div>
                </div>

                {/* Patient ID Code */}
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-bold text-gray-700 flex items-center gap-1.5">
                      <ShieldCheck className="w-3.5 h-3.5 text-amber-600" />
                      Patient ID Code
                    </label>
                    <button
                      type="button"
                      onClick={() => {
                        if (patientId) {
                          navigator.clipboard?.writeText(patientId);
                          soundEffects.playSuccessChime();
                        }
                      }}
                      className="text-[10px] font-black text-amber-800 hover:underline cursor-pointer"
                    >
                      Copy ID
                    </button>
                  </div>
                  <input
                    type="text"
                    value={patientId}
                    onChange={(e) => setPatientId(e.target.value.toUpperCase())}
                    placeholder="e.g. PT-1001"
                    className="w-full font-mono uppercase px-3 py-2.5 rounded-xl border-2 border-amber-200 focus:border-amber-500 focus:ring-2 focus:ring-amber-200 outline-none text-sm font-black bg-white text-gray-900"
                  />
                  <p className="text-[10px] text-gray-500 font-semibold">
                    Unique identifier for caregivers to link and assist with care routines.
                  </p>
                </div>

                {/* Dementia Stage / Cognitive Support Level */}
                <div className="space-y-1">
                  <label className="text-xs font-bold text-gray-700">
                    Cognitive Care Stage
                  </label>
                  <select
                    value={dementiaStage}
                    onChange={(e) => setDementiaStage(e.target.value as DementiaStage)}
                    className="w-full px-3 py-2.5 rounded-xl border-2 border-amber-200 focus:border-amber-500 focus:ring-2 focus:ring-amber-200 outline-none text-sm font-bold bg-white cursor-pointer"
                  >
                    <option value="healthy_aging">Active Healthy Aging (Mental Vitality)</option>
                    <option value="early">Early Stage (Gentle Word/Story Recall)</option>
                    <option value="mild">Mild Stage (Familiar People & Visual Support)</option>
                    <option value="moderate">Moderate Stage (Assisted Audio & Calming Music)</option>
                  </select>
                </div>
              </div>

              {/* Diagnosis / Memory Notes */}
              <div className="space-y-1">
                <label className="text-xs font-bold text-gray-700 flex items-center gap-1.5">
                  <FileText className="w-3.5 h-3.5 text-amber-700" />
                  Personal Interests & Memory Notes
                </label>
                <textarea
                  rows={2}
                  value={diagnosisNote}
                  onChange={(e) => setDiagnosisNote(e.target.value)}
                  placeholder="e.g., Loves old Bihu songs, enjoyed tea garden walks, prefers large font pictures."
                  className="w-full px-3 py-2 rounded-xl border-2 border-amber-200 focus:border-amber-500 focus:ring-2 focus:ring-amber-200 outline-none text-xs font-medium bg-white"
                />
              </div>

              {/* Emergency Contact */}
              <div className="space-y-2 pt-1 border-t border-amber-200/80">
                <label className="text-xs font-black text-amber-950 uppercase tracking-wide flex items-center gap-1">
                  <AlertCircle className="w-3.5 h-3.5 text-red-500" />
                  Primary Emergency Contact
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                  <input
                    type="text"
                    placeholder="Contact Name (e.g. Priya)"
                    value={emergencyName}
                    onChange={(e) => setEmergencyName(e.target.value)}
                    className="px-3 py-2 text-xs font-bold rounded-xl border border-amber-200 bg-white outline-none focus:border-amber-500"
                  />
                  <input
                    type="tel"
                    placeholder="Phone (+91 98640...)"
                    value={emergencyPhone}
                    onChange={(e) => setEmergencyPhone(e.target.value)}
                    className="px-3 py-2 text-xs font-bold rounded-xl border border-amber-200 bg-white outline-none focus:border-amber-500"
                  />
                  <input
                    type="text"
                    placeholder="Relation (e.g. Granddaughter)"
                    value={emergencyRelation}
                    onChange={(e) => setEmergencyRelation(e.target.value)}
                    className="px-3 py-2 text-xs font-bold rounded-xl border border-amber-200 bg-white outline-none focus:border-amber-500"
                  />
                </div>
              </div>

              {/* Assigned Caregiver & Access Control */}
              <div className="space-y-3 pt-3 border-t border-amber-200/80">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-black text-amber-950 uppercase tracking-wide flex items-center gap-1.5">
                    <ShieldCheck className="w-4 h-4 text-emerald-600" />
                    Assigned Caregiver & Privacy
                  </label>
                  {connectedCaregiverId ? (
                    <span className="text-[11px] font-black text-emerald-800 bg-emerald-100 border border-emerald-300 px-2 py-0.5 rounded-full flex items-center gap-1">
                      <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                      Assigned
                    </span>
                  ) : (
                    <span className="text-[11px] font-bold text-amber-800 bg-amber-100/80 px-2 py-0.5 rounded-full">
                      No Caregiver Linked
                    </span>
                  )}
                </div>

                {connectedCaregiverId ? (
                  <div className="p-3.5 rounded-2xl bg-white border border-emerald-200 shadow-2xs space-y-2">
                    <div className="flex items-center justify-between">
                      <div>
                        <div className="text-sm font-black text-slate-800 flex items-center gap-1.5">
                          <Stethoscope className="w-4 h-4 text-emerald-600" />
                          {connectedCaregiverName || 'Caregiver'}
                        </div>
                        <div className="text-xs text-slate-500 font-mono font-bold">
                          Code: {connectedCaregiverId}
                        </div>
                      </div>
                      <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-700 bg-emerald-50 border border-emerald-200 px-2 py-1 rounded-lg">
                        Authorized
                      </span>
                    </div>

                    <p className="text-[11px] text-slate-500 leading-relaxed">
                      Privacy Protected: Only this assigned caregiver can view your memory health records, schedule medications, and monitor safety alerts.
                    </p>

                    <div className="flex items-center gap-2 pt-1 border-t border-slate-100">
                      <button
                        type="button"
                        onClick={() => {
                          setIsChangingCaregiver(!isChangingCaregiver);
                          setCaregiverStatusMsg('');
                        }}
                        className="px-3 py-1.5 text-xs font-bold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-xl transition-colors cursor-pointer"
                      >
                        {isChangingCaregiver ? 'Cancel' : 'Change Caregiver'}
                      </button>
                      <button
                        type="button"
                        onClick={handleUnassignCaregiver}
                        className="px-3 py-1.5 text-xs font-bold text-red-600 hover:text-red-700 hover:bg-red-50 rounded-xl transition-colors cursor-pointer flex items-center gap-1"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                        Unassign
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="p-3.5 rounded-2xl bg-white border border-amber-200 shadow-2xs space-y-2">
                    <p className="text-xs text-slate-600 leading-relaxed font-medium">
                      Caregivers cannot access or monitor your account until you assign them. Enter your family or professional caregiver's ID code (e.g. <span className="font-mono font-bold text-slate-800">CG-2125</span>) to grant them access.
                    </p>
                  </div>
                )}

                {/* Change or Assign Caregiver Form */}
                {(!connectedCaregiverId || isChangingCaregiver) && (
                  <div className="p-3 rounded-2xl bg-amber-50/60 border border-amber-200 space-y-2">
                    <label className="text-[11px] font-black text-amber-950 uppercase tracking-wide">
                      Enter Caregiver ID:
                    </label>
                    <div className="flex gap-2">
                      <input
                        type="text"
                        placeholder="e.g. CG-2125"
                        value={caregiverInputCode}
                        onChange={(e) => setCaregiverInputCode(e.target.value.toUpperCase())}
                        className="flex-1 px-3 py-2 text-xs font-bold rounded-xl border border-amber-300 bg-white uppercase outline-none focus:border-amber-500 font-mono"
                      />
                      <button
                        type="button"
                        disabled={isVerifyingCaregiver}
                        onClick={handleAssignCaregiver}
                        className="px-4 py-2 text-xs font-black text-white bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 rounded-xl shadow-xs transition-all cursor-pointer disabled:opacity-50"
                      >
                        {isVerifyingCaregiver ? 'Verifying...' : 'Assign'}
                      </button>
                    </div>
                  </div>
                )}

                {caregiverStatusMsg && (
                  <p className="text-xs font-bold text-emerald-800 bg-emerald-50 border border-emerald-200 p-2.5 rounded-xl">
                    {caregiverStatusMsg}
                  </p>
                )}
              </div>
            </div>
          ) : (
            /* Caregiver Specific Settings */
            <div className="bg-blue-50/70 rounded-3xl p-5 border-2 border-blue-200 space-y-4">
              <h3 className="text-sm font-black text-blue-950 uppercase tracking-wider flex items-center gap-2">
                <Stethoscope className="w-4 h-4 text-blue-700" />
                Caregiver Clinical Credentials
              </h3>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* Caregiver Age */}
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-bold text-gray-700 flex items-center gap-1.5">
                      <Calendar className="w-3.5 h-3.5 text-blue-600" />
                      Caregiver Age
                    </label>
                    <span className="text-[11px] font-black text-blue-900 bg-blue-100 px-2 py-0.5 rounded-full">
                      {age} Years Old
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => setAge((prev) => Math.max(18, prev - 1))}
                      className="w-10 h-10 rounded-xl bg-white hover:bg-blue-100 border-2 border-blue-200 font-black text-xl text-blue-950 flex items-center justify-center cursor-pointer active:scale-95 transition-all shadow-xs"
                      title="Decrease age"
                    >
                      -
                    </button>
                    <input
                      type="number"
                      min={18}
                      max={100}
                      value={age}
                      onChange={(e) => setAge(Math.max(18, Number(e.target.value)))}
                      className="w-full text-center py-2 rounded-xl border-2 border-blue-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 outline-none text-base font-black bg-white text-gray-900"
                    />
                    <button
                      type="button"
                      onClick={() => setAge((prev) => Math.min(100, prev + 1))}
                      className="w-10 h-10 rounded-xl bg-white hover:bg-blue-100 border-2 border-blue-200 font-black text-xl text-blue-950 flex items-center justify-center cursor-pointer active:scale-95 transition-all shadow-xs"
                      title="Increase age"
                    >
                      +
                    </button>
                  </div>
                </div>

                {/* Caregiver Code */}
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-gray-700">
                    Caregiver Code (For Seniors to Link)
                  </label>
                  <div className="relative">
                    <ShieldCheck className="w-4 h-4 absolute left-3 top-3.5 text-blue-600" />
                    <input
                      type="text"
                      value={caregiverCode}
                      onChange={(e) => setCaregiverCode(e.target.value.toUpperCase())}
                      placeholder="CG-101"
                      className="w-full pl-9 pr-3 py-2.5 rounded-xl border-2 border-blue-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 outline-none text-sm font-black bg-white uppercase"
                    />
                  </div>
                </div>

                {/* Specialty / Role Description */}
                <div className="space-y-1 sm:col-span-2">
                  <label className="text-xs font-bold text-gray-700">
                    Clinical Role / Relation
                  </label>
                  <input
                    type="text"
                    value={diagnosisNote}
                    onChange={(e) => setDiagnosisNote(e.target.value)}
                    placeholder="Geriatric Specialist / Family Caregiver"
                    className="w-full px-3 py-2.5 rounded-xl border-2 border-blue-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 outline-none text-sm font-bold bg-white"
                  />
                </div>
              </div>
            </div>
          )}

          {/* 4. Face ID Biometric Authentication */}
          <div className="bg-stone-50 rounded-3xl p-5 border-2 border-stone-200 space-y-4">
            <div className="flex items-center justify-between">
              <label className="text-sm font-black text-gray-900 uppercase tracking-wider flex items-center gap-2">
                <Scan className="w-4 h-4 text-[#3E82F0]" />
                Face ID Biometric Sign-In
              </label>
              {faceDescriptor && faceDescriptor.length > 0 ? (
                <span className="text-xs font-black text-emerald-700 bg-emerald-100 border border-emerald-300 px-2.5 py-0.5 rounded-full flex items-center gap-1.5 shadow-2xs">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                  Face Enrolled
                </span>
              ) : (
                <span className="text-xs font-bold text-slate-500 bg-slate-200 px-2.5 py-0.5 rounded-full border border-slate-300">
                  Not Enrolled
                </span>
              )}
            </div>

            {faceDescriptor && faceDescriptor.length > 0 ? (
              <div className="p-4 rounded-2xl bg-white border-2 border-emerald-200 space-y-3 shadow-2xs">
                <div className="flex items-start gap-3">
                  <div className="w-10 h-10 rounded-xl bg-gradient-to-r from-[#C3F2D6] to-[#8DE5A6] flex items-center justify-center text-[#1E293B] shrink-0 shadow-2xs">
                    <ShieldCheck className="w-5 h-5 text-emerald-700" />
                  </div>
                  <div className="flex-1">
                    <h4 className="text-sm font-black text-slate-900">Biometric Profile Active</h4>
                    <p className="text-xs text-slate-600 font-medium mt-0.5">
                      128-point biometric descriptor linked to this account for instant camera sign-in.
                    </p>
                    {faceRegisteredAt && (
                      <p className="text-[11px] text-slate-400 font-bold mt-1">
                        Enrolled on {new Date(faceRegisteredAt).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}
                      </p>
                    )}
                  </div>
                </div>

                <div className="flex flex-wrap items-center gap-2 pt-2 border-t border-slate-100">
                  <button
                    type="button"
                    onClick={() => {
                      soundEffects.playGentleTap();
                      setIsFaceScannerOpen(true);
                    }}
                    className="py-2 px-3.5 rounded-xl bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-300 text-xs font-black flex items-center gap-1.5 cursor-pointer transition-colors shadow-2xs active:scale-98"
                  >
                    <RefreshCw className="w-3.5 h-3.5 text-emerald-700" />
                    <span>Re-scan / Update Face</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      soundEffects.playGentleTap();
                      setFaceDescriptor(null);
                      setFaceRegisteredAt(null);
                      setSuccessMessage('Face ID removed. Remember to click "Save Profile" below.');
                    }}
                    className="py-2 px-3 rounded-xl bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 text-xs font-bold flex items-center gap-1.5 cursor-pointer transition-colors active:scale-98"
                  >
                    <Trash2 className="w-3.5 h-3.5 text-rose-600" />
                    <span>Remove Face ID</span>
                  </button>
                </div>
              </div>
            ) : (
              <div className="p-4 rounded-2xl bg-white border-2 border-dashed border-stone-300 space-y-3 shadow-2xs">
                <div className="flex items-start gap-3">
                  <div className="w-10 h-10 rounded-xl bg-blue-50 border border-blue-200 flex items-center justify-center text-[#3E82F0] shrink-0">
                    <Camera className="w-5 h-5 text-[#3E82F0]" />
                  </div>
                  <div className="space-y-0.5">
                    <h4 className="text-sm font-black text-slate-900">One-Tap Camera Sign-In</h4>
                    <p className="text-xs text-slate-600 leading-relaxed font-medium">
                      Enroll your face to sign in instantly using the front camera with zero memorized PINs. All processing is 100% private in-browser.
                    </p>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => {
                    soundEffects.playGentleTap();
                    setIsFaceScannerOpen(true);
                  }}
                  className="w-full py-2.5 px-4 rounded-xl text-slate-900 font-black text-xs sm:text-sm flex items-center justify-center gap-2 cursor-pointer shadow-2xs hover:shadow-md transition-all active:scale-98 border border-[#8DE5A6]"
                  style={{ background: 'linear-gradient(to right, #C3F2D6, #8DE5A6, #6BC1B8)' }}
                >
                  <Camera className="w-4 h-4 text-slate-900" />
                  <span>Enroll Face ID Now</span>
                </button>
              </div>
            )}
          </div>

          {/* 5. Security PIN */}
          <div className="bg-stone-50 rounded-3xl p-5 border-2 border-stone-200 space-y-3">
            <div className="flex items-center justify-between">
              <label className="text-sm font-black text-gray-900 uppercase tracking-wider flex items-center gap-2">
                <Lock className="w-4 h-4 text-amber-600" />
                Access PIN (4 Digits)
              </label>
              <span className="text-xs font-bold text-gray-500">
                Used to quickly sign in
              </span>
            </div>
            <div className="relative max-w-xs">
              <Lock className="w-4 h-4 absolute left-3 top-3.5 text-gray-400" />
              <input
                type="password"
                maxLength={4}
                required
                value={pin}
                onChange={(e) => setPin(e.target.value.replace(/\D/g, ''))}
                placeholder="4-digit PIN"
                className="w-full pl-9 pr-3 py-2.5 rounded-xl border-2 border-stone-300 focus:border-amber-500 focus:ring-2 focus:ring-amber-200 outline-none text-base font-black tracking-widest bg-white"
              />
            </div>
          </div>

          {/* Feedback Messages */}
          {errorMessage && (
            <div className="p-3 rounded-2xl bg-red-50 border border-red-200 text-red-700 text-xs font-bold flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{errorMessage}</span>
            </div>
          )}

          {successMessage && (
            <div className="p-3 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-black flex items-center gap-2 animate-fade-in">
              <Check className="w-4 h-4 shrink-0 text-emerald-600" />
              <span>{successMessage}</span>
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex items-center justify-end gap-3 pt-3 border-t border-stone-200">
            <button
              type="button"
              disabled={isSaving}
              onClick={() => {
                soundEffects.playGentleTap();
                onClose();
              }}
              className="px-5 py-2.5 rounded-xl bg-stone-100 hover:bg-stone-200 text-stone-800 font-bold text-sm cursor-pointer transition-colors border border-stone-300"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSaving}
              className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-gray-950 font-black text-sm cursor-pointer shadow-md transition-all active:scale-98 flex items-center gap-2 border-2 border-amber-600"
            >
              {isSaving ? (
                <>
                  <span className="w-4 h-4 border-2 border-gray-950 border-t-transparent rounded-full animate-spin"></span>
                  <span>Saving...</span>
                </>
              ) : (
                <>
                  <Check className="w-4 h-4" />
                  <span>Save Profile</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>

      {/* Biometric Face Registration Modal Scanner */}
      <FaceRegistrationScanner
        isOpen={isFaceScannerOpen}
        onClose={() => setIsFaceScannerOpen(false)}
        userName={name.trim() || user.name}
        onFaceCaptured={(descriptor) => {
          setFaceDescriptor(descriptor);
          setFaceRegisteredAt(new Date().toISOString());
          setSuccessMessage('Face ID captured successfully! Click "Save Profile" below to apply changes.');
          soundEffects.playSuccessChime();
        }}
      />
    </div>
  );
};
