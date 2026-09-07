import React, { useState } from 'react';
import { 
  Heart, 
  Sparkles, 
  ShieldCheck, 
  CheckCircle2, 
  ArrowRight, 
  Activity, 
  Brain, 
  UserCheck, 
  Phone, 
  MapPin,
  X
} from 'lucide-react';
import { User, DementiaStage, RegionalLanguage } from '../../types';
import { soundEffects } from '../../utils/soundEffects';

interface OnboardingModalProps {
  isOpen: boolean;
  user: User;
  onClose: () => void;
  onComplete: (updatedData: {
    dementia_stage: DementiaStage;
    care_goals: string[];
    emergency_contact: { name: string; phone: string; relation: string };
  }) => void;
  currentLanguage: RegionalLanguage;
}

const DEMENTIA_STAGES: {
  id: DementiaStage;
  title: string;
  subtitle: string;
  description: string;
  recommendedFocus: string;
}[] = [
  {
    id: 'early',
    title: 'Early Stage / Mild Cognitive Impairment (MCI)',
    subtitle: 'Independent with occasional word-finding or placement lapses',
    description: 'Alert and engaged. Enjoys cultural recognition and memory challenges with familiar regional motifs.',
    recommendedFocus: 'Memory maintenance, sequence recall, daily hydration routine'
  },
  {
    id: 'mild',
    title: 'Mild Dementia',
    subtitle: 'Noticeable forgetfulness of recent events and dates',
    description: 'Benefits from simplified visual cues, familiar faces album, and gentle reassurance.',
    recommendedFocus: 'Face matching, medication prompts, family orientation'
  },
  {
    id: 'moderate',
    title: 'Moderate Stage',
    subtitle: 'Significant memory loss, needs structured guidance',
    description: 'Requires calm voice prompts, soothing local music, large touch buttons, and emergency beacons.',
    recommendedFocus: 'Sensory calming, soothing soundscapes, emergency safety'
  },
  {
    id: 'healthy_aging',
    title: 'Healthy Brain Maintenance & Prevention',
    subtitle: 'Proactive cognitive vitality for elderly seniors',
    description: 'Active senior looking to keep mind sharp with culturally resonant linguistic and puzzle games.',
    recommendedFocus: 'Higher difficulty puzzles, speed recall, lifelong learning'
  }
];

const AVAILABLE_CARE_GOALS = [
  'Preserve Memory of Family & Relatives',
  'Timely Daily Medication & Hydration',
  'Reduce Evening Agitation (Sundowning)',
  'Connect with Culturally Familiar NER Cues',
  'Track Cognitive Alertness Over Time',
  'Provide Caregiver Peace of Mind & Respite',
  'Active Speech & Regional Language Comfort',
  'Emergency Location & SOS Preparedness'
];

export const OnboardingModal: React.FC<OnboardingModalProps> = ({
  isOpen,
  user,
  onClose,
  onComplete,
}) => {
  const [step, setStep] = useState<1 | 2 | 3>(1);
  const [selectedStage, setSelectedStage] = useState<DementiaStage>(user.dementia_stage || 'early');
  const [selectedGoals, setSelectedGoals] = useState<string[]>(
    user.care_goals || [
      'Preserve Memory of Family & Relatives',
      'Timely Daily Medication & Hydration',
      'Connect with Culturally Familiar NER Cues'
    ]
  );
  const [emergencyContact, setEmergencyContact] = useState({
    name: user.emergency_contact?.name || 'Dr. Priya Barua',
    phone: user.emergency_contact?.phone || '+91 98640 12345',
    relation: user.emergency_contact?.relation || 'Primary Caregiver / Daughter'
  });

  if (!isOpen) return null;

  const toggleGoal = (goal: string) => {
    soundEffects.playGentleTap(540);
    setSelectedGoals(prev => 
      prev.includes(goal) ? prev.filter(g => g !== goal) : [...prev, goal]
    );
  };

  const handleFinish = () => {
    soundEffects.playGentleTap(680);
    onComplete({
      dementia_stage: selectedStage,
      care_goals: selectedGoals,
      emergency_contact: emergencyContact
    });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div 
        className="bg-white border-2 border-emerald-500 rounded-3xl max-w-2xl w-full max-h-[92vh] overflow-y-auto shadow-2xl flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="p-5 sm:p-6 bg-gradient-to-r from-emerald-50 via-teal-50 to-amber-50 border-b border-emerald-100 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-emerald-600 flex items-center justify-center text-white shadow-md">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <span className="text-xs font-black uppercase tracking-wider text-emerald-800">
                Ecosystem Step 2 • Tailored Assessment
              </span>
              <h2 className="text-xl sm:text-2xl font-black text-gray-900 leading-tight">
                User Onboarding & Care Goals
              </h2>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-full hover:bg-white/80 text-gray-400 hover:text-gray-700 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Step Progress Tracker */}
        <div className="grid grid-cols-3 bg-emerald-50/50 border-b border-emerald-100 px-6 py-2.5 text-xs font-black">
          <button 
            onClick={() => setStep(1)}
            className={`flex items-center gap-2 py-1 ${step === 1 ? 'text-emerald-800 font-extrabold border-b-2 border-emerald-600' : 'text-gray-500'}`}
          >
            <span className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] ${step === 1 ? 'bg-emerald-600 text-white' : 'bg-gray-200 text-gray-700'}`}>1</span>
            Stage Assessment
          </button>
          <button 
            onClick={() => setStep(2)}
            className={`flex items-center gap-2 py-1 ${step === 2 ? 'text-emerald-800 font-extrabold border-b-2 border-emerald-600' : 'text-gray-500'}`}
          >
            <span className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] ${step === 2 ? 'bg-emerald-600 text-white' : 'bg-gray-200 text-gray-700'}`}>2</span>
            Care Goals
          </button>
          <button 
            onClick={() => setStep(3)}
            className={`flex items-center gap-2 py-1 ${step === 3 ? 'text-emerald-800 font-extrabold border-b-2 border-emerald-600' : 'text-gray-500'}`}
          >
            <span className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] ${step === 3 ? 'bg-emerald-600 text-white' : 'bg-gray-200 text-gray-700'}`}>3</span>
            Safety & Emergency
          </button>
        </div>

        {/* Content Body */}
        <div className="p-6 sm:p-7 space-y-6 flex-1">
          {step === 1 && (
            <div className="space-y-4 animate-in fade-in">
              <div>
                <h3 className="text-lg font-black text-gray-900">
                  Select Initial Dementia Stage or Assessment Band
                </h3>
                <p className="text-sm text-gray-600 mt-0.5">
                  Calibrates starting difficulty, voice pacing, game length, and cognitive alerts for {user.name}.
                </p>
              </div>

              <div className="grid gap-3">
                {DEMENTIA_STAGES.map((st) => {
                  const isSelected = selectedStage === st.id;
                  return (
                    <div
                      key={st.id}
                      onClick={() => {
                        soundEffects.playGentleTap(480);
                        setSelectedStage(st.id);
                      }}
                      className={`p-4 rounded-2xl border-2 transition-all cursor-pointer ${
                        isSelected
                          ? 'bg-emerald-50/70 border-emerald-500 shadow-sm'
                          : 'bg-white border-gray-200 hover:border-emerald-300'
                      }`}
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div className="space-y-1">
                          <div className="flex items-center gap-2">
                            <span className="font-black text-gray-900 text-base">{st.title}</span>
                            {isSelected && (
                              <CheckCircle2 className="w-4 h-4 text-emerald-600 fill-emerald-100" />
                            )}
                          </div>
                          <p className="text-xs font-bold text-emerald-800">{st.subtitle}</p>
                          <p className="text-xs text-gray-600">{st.description}</p>
                          <div className="pt-1.5 flex items-center gap-1.5 text-[11px] text-gray-700 font-semibold">
                            <Activity className="w-3.5 h-3.5 text-amber-600" />
                            <span>Recommended Focus: <span className="text-gray-900">{st.recommendedFocus}</span></span>
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {step === 2 && (
            <div className="space-y-4 animate-in fade-in">
              <div>
                <h3 className="text-lg font-black text-gray-900">
                  Select Key Care Goals
                </h3>
                <p className="text-sm text-gray-600 mt-0.5">
                  These goals configure daily activity prompts, memory journals, and caregiver reports.
                </p>
              </div>

              <div className="grid sm:grid-cols-2 gap-2.5">
                {AVAILABLE_CARE_GOALS.map((goal) => {
                  const active = selectedGoals.includes(goal);
                  return (
                    <button
                      key={goal}
                      type="button"
                      onClick={() => toggleGoal(goal)}
                      className={`p-3.5 text-left rounded-2xl border-2 transition-all flex items-start gap-2.5 ${
                        active
                          ? 'bg-emerald-50 border-emerald-500 text-emerald-950 font-bold'
                          : 'bg-white border-gray-200 hover:border-gray-300 text-gray-700'
                      }`}
                    >
                      <div className={`w-5 h-5 rounded-lg flex items-center justify-center shrink-0 mt-0.5 border ${
                        active ? 'bg-emerald-600 border-emerald-600 text-white' : 'border-gray-300 bg-white'
                      }`}>
                        {active && <CheckCircle2 className="w-3.5 h-3.5" />}
                      </div>
                      <span className="text-xs leading-snug">{goal}</span>
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {step === 3 && (
            <div className="space-y-5 animate-in fade-in">
              <div>
                <h3 className="text-lg font-black text-gray-900">
                  Emergency Protocol & Primary Contact
                </h3>
                <p className="text-sm text-gray-600 mt-0.5">
                  When the elderly user taps the Emergency SOS beacon, this primary contact receives immediate GPS location alerts.
                </p>
              </div>

              <div className="space-y-3.5 bg-gray-50 p-4 rounded-2xl border border-gray-200">
                <div>
                  <label className="block text-xs font-black text-gray-700 uppercase tracking-wide mb-1">
                    Emergency Contact Name
                  </label>
                  <div className="relative">
                    <UserCheck className="absolute left-3.5 top-3 w-4 h-4 text-gray-400" />
                    <input
                      type="text"
                      value={emergencyContact.name}
                      onChange={(e) => setEmergencyContact({ ...emergencyContact, name: e.target.value })}
                      className="w-full pl-10 pr-3 py-2 text-sm bg-white border border-gray-300 rounded-xl focus:border-emerald-500 font-bold"
                      placeholder="e.g. Dr. Priya Barua"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-black text-gray-700 uppercase tracking-wide mb-1">
                    Emergency Phone Number
                  </label>
                  <div className="relative">
                    <Phone className="absolute left-3.5 top-3 w-4 h-4 text-gray-400" />
                    <input
                      type="tel"
                      value={emergencyContact.phone}
                      onChange={(e) => setEmergencyContact({ ...emergencyContact, phone: e.target.value })}
                      className="w-full pl-10 pr-3 py-2 text-sm bg-white border border-gray-300 rounded-xl focus:border-emerald-500 font-bold"
                      placeholder="+91 98640 12345"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-black text-gray-700 uppercase tracking-wide mb-1">
                    Relationship to Patient
                  </label>
                  <input
                    type="text"
                    value={emergencyContact.relation}
                    onChange={(e) => setEmergencyContact({ ...emergencyContact, relation: e.target.value })}
                    className="w-full px-3 py-2 text-sm bg-white border border-gray-300 rounded-xl focus:border-emerald-500 font-bold"
                    placeholder="e.g. Daughter / Primary Caregiver"
                  />
                </div>
              </div>

              <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl flex items-start gap-2.5 text-xs text-amber-900">
                <ShieldCheck className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                <span>
                  <strong>Ethical Safeguard:</strong> Location beacons are encrypted and solely dispatched to verified primary caregivers upon manual SOS trigger.
                </span>
              </div>
            </div>
          )}
        </div>

        {/* Footer Navigation */}
        <div className="p-4 sm:p-5 bg-gray-50 border-t border-gray-200 flex items-center justify-between">
          {step > 1 ? (
            <button
              type="button"
              onClick={() => {
                soundEffects.playGentleTap(400);
                setStep((s) => (s - 1) as 1 | 2 | 3);
              }}
              className="px-4 py-2 text-sm font-bold text-gray-700 hover:text-gray-900"
            >
              Back
            </button>
          ) : (
            <div />
          )}

          {step < 3 ? (
            <button
              type="button"
              onClick={() => {
                soundEffects.playGentleTap(560);
                setStep((s) => (s + 1) as 1 | 2 | 3);
              }}
              className="flex items-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white px-5 py-2.5 rounded-xl font-black text-sm shadow-md transition-all cursor-pointer"
            >
              <span>Next Step</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          ) : (
            <button
              type="button"
              onClick={handleFinish}
              className="flex items-center gap-2 bg-gradient-to-r from-emerald-600 to-teal-700 hover:opacity-95 text-white px-6 py-2.5 rounded-xl font-black text-sm shadow-md transition-all cursor-pointer"
            >
              <CheckCircle2 className="w-4 h-4" />
              <span>Save & Complete Onboarding</span>
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
