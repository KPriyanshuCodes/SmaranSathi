import React, { useState } from 'react';
import { 
  LineChart, 
  Line, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer, 
  BarChart, 
  Bar 
} from 'recharts';
import { 
  Activity, 
  Clock, 
  AlertTriangle, 
  Plus, 
  Trash2, 
  CheckCircle2, 
  Brain, 
  Users, 
  Bell, 
  Sparkles, 
  Info,
  Calendar,
  Layers,
  GitFork,
  Database,
  Stethoscope,
  Pill,
  BookOpen,
  Camera,
  Edit3,
  ShieldAlert,
  ShieldCheck,
  Link as LinkIcon
} from 'lucide-react';
import { 
  User, 
  Reminder, 
  Alert, 
  FamiliarPerson, 
  AIRecommendation, 
  DifficultyLevel,
  ReminderType,
  RecurrenceType
} from '../../types';
import { EcosystemFlowMap } from '../ecosystem/EcosystemFlowMap';
import { DataLakeHubView } from '../datalake/DataLakeHubView';
import { IntegratedCareView } from '../care/IntegratedCareView';
import { ConsultationPortalView } from '../consultation/ConsultationPortalView';
import { CommunityImpactView } from '../community/CommunityImpactView';
import { ScheduleRemindersManager } from './ScheduleRemindersManager';
import { soundEffects } from '../../utils/speechAndAudio';

interface CaregiverDashboardProps {
  caregiverUser?: User;
  currentPatient?: User | null;
  allPatients: User[];
  onSwitchPatient: (patientId: string) => void;
  onEditProfile?: (targetUser: User) => void;
  onConnectPatient?: (patientIdentifier: string) => Promise<{ success: boolean; message?: string }>;
  reminders: Reminder[];
  alerts: Alert[];
  familiarPeople: FamiliarPerson[];
  recommendation: AIRecommendation | null;
  onAddReminder: (newReminder: Omit<Reminder, 'id' | 'created_at' | 'completed'>) => void;
  onDeleteReminder: (id: string) => void;
  onToggleReminder: (id: string) => void;
  onResolveAlert: (id: string) => void;
  onAddFamiliarPerson: (person: Omit<FamiliarPerson, 'id'>) => void;
  onDeleteFamiliarPerson: (id: string) => void;
  onOpenOnboarding?: () => void;
  onOpenJournal?: () => void;
  onTriggerSOS?: () => void;
  onTriggerAlarm?: (reminder: Reminder) => void;
  trendData: {
    trends: {
      session_num: number;
      date: string;
      accuracy: number;
      response_time: number;
      mistakes: number;
      game_type: string;
      difficulty: string;
      baseline: number;
    }[];
    baseline_accuracy: number;
    recent_accuracy: number;
    deviation_from_baseline_pct: number;
    baseline_observation: string;
    game_breakdown: Record<string, number>;
    ethical_disclaimer: string;
  } | null;
}

export const CaregiverDashboard: React.FC<CaregiverDashboardProps> = ({
  caregiverUser,
  currentPatient,
  allPatients,
  onSwitchPatient,
  onEditProfile,
  onConnectPatient,
  reminders,
  alerts,
  familiarPeople,
  recommendation,
  onAddReminder,
  onDeleteReminder,
  onToggleReminder,
  onResolveAlert,
  onAddFamiliarPerson,
  onDeleteFamiliarPerson,
  onOpenOnboarding,
  onOpenJournal,
  onTriggerSOS,
  onTriggerAlarm,
  trendData,
}) => {
  const [activeTab, setActiveTab] = useState<'ecosystem' | 'trends' | 'datalake' | 'care' | 'consultation' | 'community' | 'reminders' | 'alerts' | 'people' | 'ai'>('ecosystem');
  const [showAddReminderModal, setShowAddReminderModal] = useState(false);
  const [showAddPersonModal, setShowAddPersonModal] = useState(false);

  // Connect Patient direct linking state
  const [patientLinkInput, setPatientLinkInput] = useState('');
  const [isLinkingPatient, setIsLinkingPatient] = useState(false);
  const [linkStatusMessage, setLinkStatusMessage] = useState('');
  const [isConnectModalOpen, setIsConnectModalOpen] = useState(false);

  const handleDirectConnectPatient = async () => {
    if (!patientLinkInput.trim() || !onConnectPatient) return;
    setIsLinkingPatient(true);
    setLinkStatusMessage('');
    try {
      const res = await onConnectPatient(patientLinkInput.trim());
      if (res.success) {
        setLinkStatusMessage(res.message || 'Patient successfully assigned and connected!');
        soundEffects.playSuccessChime();
        setPatientLinkInput('');
        setTimeout(() => {
          setIsConnectModalOpen(false);
          setLinkStatusMessage('');
        }, 1500);
      } else {
        setLinkStatusMessage(res.message || 'Could not find patient with that ID or details.');
        soundEffects.playGentleTap();
      }
    } catch (err) {
      setLinkStatusMessage('Failed to connect patient. Please try again.');
    } finally {
      setIsLinkingPatient(false);
    }
  };

  // New Reminder form state
  const [remTitle, setRemTitle] = useState('');
  const [remType, setRemType] = useState<ReminderType>('medication');
  const [remTime, setRemTime] = useState('09:00 AM');
  const [remRecurrence, setRemRecurrence] = useState<RecurrenceType>('daily');
  const [remInstructions, setRemInstructions] = useState('');

  // New Familiar Person form state
  const [personName, setPersonName] = useState('');
  const [personRelation, setPersonRelation] = useState('');
  const [personPhoto, setPersonPhoto] = useState('');
  const [personNotes, setPersonNotes] = useState('');
  const [personPhone, setPersonPhone] = useState('');

  const handleCreateReminder = (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentPatient || !remTitle.trim()) return;

    onAddReminder({
      user_id: currentPatient.id,
      title: remTitle,
      type: remType,
      time: remTime,
      recurrence: remRecurrence,
      instructions: remInstructions,
      created_by: 'Caregiver Priya',
    });

    setRemTitle('');
    setRemInstructions('');
    setShowAddReminderModal(false);
  };

  const handleCreatePerson = (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentPatient || !personName.trim() || !personRelation.trim()) return;

    onAddFamiliarPerson({
      user_id: currentPatient.id,
      name: personName,
      relation: personRelation,
      photo_url: personPhoto || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=300&q=80',
      notes: personNotes,
      phone: personPhone,
    });

    setPersonName('');
    setPersonRelation('');
    setPersonPhoto('');
    setPersonNotes('');
    setPersonPhone('');
    setShowAddPersonModal(false);
  };

  const chartData = trendData?.trends || [];
  const barData = Object.entries(trendData?.game_breakdown || {}).map(([game, count]) => ({
    game: game.replace('_', ' ').toUpperCase(),
    count,
  }));

  const activeAlerts = alerts.filter((a) => !a.resolved);

  return (
    <div className="w-full max-w-6xl mx-auto space-y-6 pb-16 animate-fade-in">
      {/* Caregiver ID & Connection Code Bar with Theme Gradient */}
      {caregiverUser && (
        <div 
          style={{ background: 'linear-gradient(to right, #C3F2D6, #8DE5A6, #6BC1B8, #3E82F0)' }}
          className="text-[#1E293B] rounded-2xl p-4 sm:p-5 shadow-sm flex flex-col sm:flex-row items-center justify-between gap-4 border-2 border-[#6BC1B8]"
        >
          <div className="flex items-center gap-3.5 text-center sm:text-left">
            <div className="w-12 h-12 rounded-2xl bg-white/90 border-2 border-[#8DE5A6] flex items-center justify-center font-black text-[#1E293B] text-base shrink-0 shadow-2xs">
              CG
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-black uppercase tracking-wider text-[#1E293B]">
                  Your Unique Caregiver ID:
                </span>
                <span className="px-2 py-0.5 rounded-md bg-white/90 text-[#1E293B] text-[10px] font-mono font-bold border border-[#8DE5A6]">
                  Active Link
                </span>
              </div>
              <p className="text-2xl font-mono font-black text-[#1E293B] tracking-wider">
                {caregiverUser.caregiver_code || caregiverUser.id}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <span className="text-xs text-[#1E293B] font-bold max-w-xs text-center sm:text-right hidden md:inline">
              Give this ID to your elderly patient to connect their account & view their daily routine
            </span>
            <button
              type="button"
              onClick={() => {
                navigator.clipboard?.writeText(caregiverUser.caregiver_code || caregiverUser.id);
                soundEffects.playGentleTap();
              }}
              className="px-4 py-2.5 rounded-xl bg-white hover:bg-slate-50 text-[#1E293B] border border-[#8DE5A6] text-xs font-black transition-all cursor-pointer shadow-sm active:translate-y-0.5"
            >
              Copy Caregiver ID
            </button>
          </div>
        </div>
      )}

      {/* Prominent Ethical Guardrail Banner */}
      <div className="bg-[#FAFAFA] border-2 border-[#8DE5A6] rounded-2xl p-4 flex items-start gap-3 text-[#1E293B] shadow-sm">
        <Info className="w-6 h-6 text-[#3E82F0] shrink-0 mt-0.5" />
        <div>
          <h4 className="font-black text-sm tracking-wide uppercase text-[#1E293B]">
            Cognitive Engagement Monitoring Protocol
          </h4>
          <p className="text-sm leading-relaxed text-slate-600 font-medium">
            {trendData?.ethical_disclaimer ||
              'This is a cognitive engagement tool, not a medical diagnosis. Consult a healthcare professional for clinical assessment.'}
          </p>
        </div>
      </div>

      {/* If no patient assigned to this caregiver, show strict privacy & access protection card */}
      {(!currentPatient || allPatients.length === 0) ? (
        <div className="bg-white rounded-3xl p-8 sm:p-12 border-2 border-[#8DE5A6] shadow-sm text-center space-y-6">
          <div className="w-20 h-20 mx-auto rounded-3xl bg-amber-50 border-2 border-amber-300 flex items-center justify-center text-amber-600 shadow-2xs">
            <ShieldAlert className="w-10 h-10" />
          </div>

          <div className="max-w-xl mx-auto space-y-2">
            <h3 className="text-2xl font-black text-slate-800">
              Access Restricted · No Patients Assigned Yet
            </h3>
            <p className="text-sm text-slate-600 leading-relaxed font-medium">
              In strict adherence to patient privacy and dementia health ethics, caregivers can <strong>only access data for senior citizens who have explicitly assigned them</strong>. Other patients' clinical profiles, medication logs, and cognitive trends are hidden and protected.
            </p>
          </div>

          {/* Caregiver Code instructions */}
          <div className="max-w-md mx-auto p-5 rounded-2xl bg-gradient-to-r from-[#C3F2D6]/40 via-[#8DE5A6]/30 to-[#3E82F0]/20 border-2 border-[#6BC1B8] text-left space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-black uppercase tracking-wider text-slate-700">
                Your Caregiver Code:
              </span>
              <span className="text-xs font-mono font-black text-[#1E293B] bg-white px-2.5 py-1 rounded-lg border border-[#8DE5A6]">
                {caregiverUser?.caregiver_code || caregiverUser?.id}
              </span>
            </div>
            <p className="text-xs text-slate-600 leading-relaxed font-medium">
              Share this code with your senior citizen patient or their family guardian. When they enter it in their app under <strong>'Connect Caregiver'</strong> or <strong>'Edit Profile'</strong>, their care profile will immediately appear on your dashboard.
            </p>
            <button
              type="button"
              onClick={() => {
                navigator.clipboard?.writeText(caregiverUser?.caregiver_code || caregiverUser?.id || '');
                soundEffects.playGentleTap();
              }}
              className="w-full py-2.5 rounded-xl bg-white hover:bg-slate-50 text-slate-800 border border-[#8DE5A6] text-xs font-black transition-all cursor-pointer shadow-xs"
            >
              Copy Caregiver Code to Clipboard
            </button>
          </div>

          {/* Optional Direct Patient Linking Form if Caregiver is assisting */}
          {onConnectPatient && (
            <div className="max-w-md mx-auto pt-4 border-t border-slate-100 text-left space-y-3">
              <h4 className="text-xs font-black text-slate-700 uppercase tracking-wider flex items-center gap-1.5">
                <LinkIcon className="w-3.5 h-3.5 text-blue-600" />
                Assisting a Patient? Link with Patient ID or Name
              </h4>
              <p className="text-[11px] text-slate-500 font-medium">
                If the senior citizen requested your assistance, enter their Patient ID (e.g. PT-1001), phone number, or full name:
              </p>
              <div className="flex gap-2">
                <input
                  type="text"
                  placeholder="Patient ID (e.g. PT-1001) / Name / Phone"
                  value={patientLinkInput}
                  onChange={(e) => setPatientLinkInput(e.target.value)}
                  className="flex-1 px-3 py-2 text-xs font-bold rounded-xl border border-slate-300 bg-slate-50 outline-none focus:border-[#6BC1B8] focus:bg-white"
                />
                <button
                  type="button"
                  disabled={isLinkingPatient || !patientLinkInput.trim()}
                  onClick={handleDirectConnectPatient}
                  className="px-4 py-2 text-xs font-black text-white bg-slate-900 hover:bg-slate-800 rounded-xl transition-all cursor-pointer disabled:opacity-50"
                >
                  {isLinkingPatient ? 'Linking...' : 'Connect'}
                </button>
              </div>
              {linkStatusMessage && (
                <p className={`text-xs font-bold ${linkStatusMessage.includes('Success') || linkStatusMessage.includes('connected') ? 'text-emerald-700' : 'text-red-600'}`}>
                  {linkStatusMessage}
                </p>
              )}
            </div>
          )}
        </div>
      ) : (
        <>
          {/* Top Patient Selector & Profile Hero Bar */}
          <div 
            style={{ background: 'linear-gradient(to right, #C3F2D6, #8DE5A6, #6BC1B8, #3E82F0)' }}
            className="rounded-[32px] p-6 border-2 border-[#6BC1B8] shadow-md flex flex-col md:flex-row items-center justify-between gap-6 text-[#1E293B]"
          >
            <div className="flex items-center gap-5">
              <div className="relative group shrink-0">
                <img
                  src={currentPatient.avatar || 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=250&q=80'}
                  alt={currentPatient.name}
                  className="w-20 h-20 rounded-2xl object-cover border-4 border-white shadow-md shrink-0"
                />
                {onEditProfile && (
                  <button
                    id="caregiver-patient-photo-edit-btn"
                    type="button"
                    onClick={() => {
                      soundEffects.playGentleTap();
                      onEditProfile(currentPatient);
                    }}
                    className="absolute -bottom-1.5 -right-1.5 p-1.5 rounded-lg bg-white hover:bg-slate-50 text-[#1E293B] border-2 border-[#8DE5A6] shadow-xs cursor-pointer transition-transform group-hover:scale-110"
                    title="Change patient profile picture"
                  >
                    <Camera className="w-3.5 h-3.5 text-[#1E293B]" />
                  </button>
                )}
              </div>
              <div>
                <div className="flex items-center gap-3">
                  <h2 className="text-2xl font-black text-[#1E293B]">
                    {currentPatient.name}
                  </h2>
                  <span 
                    className="px-2.5 py-1 rounded-full bg-white/95 text-[#1E293B] text-xs font-black font-mono flex items-center gap-1 border border-[#8DE5A6] shadow-2xs"
                    title="Unique Patient ID Code"
                  >
                    <span className="text-slate-500 font-sans font-bold text-[10px] uppercase">ID:</span>
                    <span>{currentPatient.patient_id || currentPatient.id}</span>
                  </span>
                  {onEditProfile ? (
                    <button
                      type="button"
                      onClick={() => {
                        soundEffects.playGentleTap();
                        onEditProfile(currentPatient);
                      }}
                      className="px-3 py-1 rounded-full bg-white/90 hover:bg-white text-[#1E293B] text-xs font-black flex items-center gap-1.5 border border-[#8DE5A6] transition-all cursor-pointer shadow-xs active:scale-95"
                      title="Click to change age"
                    >
                      <Calendar className="w-3.5 h-3.5 text-[#3E82F0]" />
                      <span>Age: {currentPatient.age || 74}</span>
                      <span className="text-[10px] text-[#3E82F0] font-bold underline">Change</span>
                    </button>
                  ) : (
                    <span className="px-3 py-1 rounded-full bg-white/90 text-[#1E293B] text-xs font-black flex items-center gap-1 border border-[#8DE5A6]">
                      <Calendar className="w-3 h-3 text-[#3E82F0]" />
                      Age: {currentPatient.age || 74}
                    </span>
                  )}
                  {onEditProfile && (
                    <button
                      id="caregiver-patient-profile-edit-btn"
                      type="button"
                      onClick={() => {
                        soundEffects.playGentleTap();
                        onEditProfile(currentPatient);
                      }}
                      className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-white/90 hover:bg-white text-[#1E293B] border border-[#8DE5A6] text-xs font-black transition-colors cursor-pointer"
                      title="Edit Patient Profile and Photo"
                    >
                      <Edit3 className="w-3 h-3 text-[#3E82F0]" />
                      <span>Edit Details</span>
                    </button>
                  )}
                </div>
                <p className="text-[#1E293B] text-sm font-bold mt-1">
                  📍 {currentPatient.location || 'Guwahati, Assam'} · Primary Language: {currentPatient.language_pref.toUpperCase()}
                </p>
                {currentPatient.diagnosis_note && (
                  <p className="text-xs text-[#1E293B]/90 italic mt-1 font-semibold">
                    Clinical Note: {currentPatient.diagnosis_note}
                  </p>
                )}
              </div>
            </div>

            {/* Linked Patient Switcher */}
            <div className="flex flex-col sm:flex-row items-start sm:items-center gap-2 bg-white/90 p-2 rounded-2xl border border-[#8DE5A6]">
              <div className="flex items-center gap-1 px-2">
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
                <span className="text-xs font-black text-[#1E293B] uppercase">
                  Assigned ({allPatients.length}):
                </span>
              </div>
              <div className="flex flex-wrap gap-1.5 items-center">
                {allPatients.map((p) => (
                  <button
                    key={p.id}
                    id={`switch-patient-${p.id}`}
                    onClick={() => onSwitchPatient(p.id)}
                    className={`px-3 py-1.5 rounded-xl text-xs font-black transition-all cursor-pointer ${
                      p.id === currentPatient.id
                        ? 'bg-[#1E293B] text-white shadow-sm'
                        : 'bg-white hover:bg-slate-100 text-[#1E293B] border border-[#8DE5A6]'
                    }`}
                  >
                    {p.name.split(' ')[0]}
                  </button>
                ))}
                {onConnectPatient && (
                  <button
                    type="button"
                    onClick={() => {
                      setIsConnectModalOpen(true);
                      setLinkStatusMessage('');
                    }}
                    className="px-2.5 py-1.5 rounded-xl text-xs font-bold text-blue-700 bg-blue-50 hover:bg-blue-100 border border-blue-200 transition-all cursor-pointer flex items-center gap-1"
                    title="Connect another assigned patient"
                  >
                    <Plus className="w-3 h-3" />
                    <span>Link</span>
                  </button>
                )}
              </div>
            </div>
          </div>

      {/* KPI Overview Cards with Theme Palette */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Rolling Engagement Index */}
        <div className="bg-[#FAFAFA] rounded-2xl p-5 border-2 border-[#8DE5A6] shadow-sm space-y-2">
          <div className="flex items-center justify-between text-slate-500">
            <span className="text-xs font-black uppercase tracking-wider text-slate-600">
              Engagement Score
            </span>
            <Sparkles className="w-5 h-5 text-[#3E82F0]" />
          </div>
          <div className="text-3xl font-black text-[#1E293B]">
            {recommendation?.engagement_score || 88}
            <span className="text-base font-bold text-slate-400"> / 100</span>
          </div>
          <p className="text-xs text-emerald-700 font-black">
            Steady cognitive participation
          </p>
        </div>

        {/* Accuracy vs Baseline */}
        <div className="bg-[#FAFAFA] rounded-2xl p-5 border-2 border-[#8DE5A6] shadow-sm space-y-2">
          <div className="flex items-center justify-between text-slate-500">
            <span className="text-xs font-black uppercase tracking-wider text-slate-600">
              Avg. Accuracy
            </span>
            <Activity className="w-5 h-5 text-[#3E82F0]" />
          </div>
          <div className="text-3xl font-black text-[#1E293B]">
            {trendData?.recent_accuracy || 88}%
          </div>
          <p className="text-xs text-slate-600 font-bold">
            Baseline: {trendData?.baseline_accuracy || 80}% (
            {trendData && trendData.deviation_from_baseline_pct >= 0 ? '+' : ''}
            {trendData?.deviation_from_baseline_pct || 8}%)
          </p>
        </div>

        {/* Avg Response Speed */}
        <div className="bg-[#FAFAFA] rounded-2xl p-5 border-2 border-[#8DE5A6] shadow-sm space-y-2">
          <div className="flex items-center justify-between text-slate-500">
            <span className="text-xs font-black uppercase tracking-wider text-slate-600">
              Avg Response Time
            </span>
            <Clock className="w-5 h-5 text-[#3E82F0]" />
          </div>
          <div className="text-3xl font-black text-[#1E293B]">
            {chartData.length > 0
              ? (
                  chartData.reduce((acc, c) => acc + c.response_time, 0) /
                  chartData.length
                ).toFixed(1)
              : '4.2'}
            s
          </div>
          <p className="text-xs text-slate-600 font-bold">
            Within comfortable range
          </p>
        </div>

        {/* Active Alerts */}
        <div className="bg-[#FAFAFA] rounded-2xl p-5 border-2 border-[#8DE5A6] shadow-sm space-y-2">
          <div className="flex items-center justify-between text-slate-500">
            <span className="text-xs font-black uppercase tracking-wider text-slate-600">
              Active Alerts
            </span>
            <AlertTriangle className="w-5 h-5 text-rose-500" />
          </div>
          <div className="text-3xl font-black text-[#1E293B]">
            {activeAlerts.length}
          </div>
          <p className="text-xs text-slate-600 font-bold">
            {activeAlerts.length === 0 ? 'All systems peaceful' : 'Requires review'}
          </p>
        </div>
      </div>

      {/* Baseline Observation Highlight Card */}
      {trendData && (
        <div className="bg-gradient-to-r from-emerald-50 to-teal-50 border-2 border-emerald-200 rounded-2xl p-5 flex items-start gap-4 shadow-sm">
          <div className="p-2.5 bg-emerald-100 rounded-xl text-emerald-800 shrink-0">
            <Activity className="w-6 h-6" />
          </div>
          <div className="space-y-1">
            <h4 className="text-base font-black text-emerald-950">
              Weekly Baseline Observation
            </h4>
            <p className="text-gray-700 text-sm leading-relaxed font-medium">
              {trendData.baseline_observation}
            </p>
            <p className="text-xs text-gray-500 italic pt-1">
              Note: This is an empirical observation of game interaction speed and accuracy, not a clinical diagnostic assessment.
            </p>
          </div>
        </div>
      )}

      {/* Navigation Tabs */}
      <div className="flex flex-wrap items-center justify-between gap-2.5 border-b-2 border-slate-200 pb-3">
        <div className="flex flex-wrap gap-2">
          <button
            id="tab-ecosystem"
            onClick={() => setActiveTab('ecosystem')}
            style={activeTab === 'ecosystem' ? { background: 'linear-gradient(to right, #C3F2D6, #8DE5A6, #6BC1B8, #3E82F0)' } : undefined}
            className={`px-4 py-2.5 rounded-2xl font-black text-xs sm:text-sm flex items-center gap-1.5 transition-all cursor-pointer ${
              activeTab === 'ecosystem'
                ? 'text-[#0F172A] border border-[#6BC1B8] shadow-sm'
                : 'bg-[#FAFAFA] hover:bg-white text-[#1E293B] border border-[#8DE5A6]'
            }`}
          >
            <GitFork className="w-4 h-4 text-[#3E82F0]" />
            <span>Ecosystem Flow Map</span>
          </button>

          <button
            id="tab-trends"
            onClick={() => setActiveTab('trends')}
            style={activeTab === 'trends' ? { background: 'linear-gradient(to right, #C3F2D6, #8DE5A6, #6BC1B8, #3E82F0)' } : undefined}
            className={`px-4 py-2.5 rounded-2xl font-black text-xs sm:text-sm flex items-center gap-1.5 transition-all cursor-pointer ${
              activeTab === 'trends'
                ? 'text-[#0F172A] border border-[#6BC1B8] shadow-sm'
                : 'bg-[#FAFAFA] hover:bg-white text-[#1E293B] border border-[#8DE5A6]'
            }`}
          >
            <Activity className="w-4 h-4 text-[#3E82F0]" />
            <span>Cognitive Trends</span>
          </button>

          <button
            id="tab-datalake"
            onClick={() => setActiveTab('datalake')}
            style={activeTab === 'datalake' ? { background: 'linear-gradient(to right, #C3F2D6, #8DE5A6, #6BC1B8, #3E82F0)' } : undefined}
            className={`px-4 py-2.5 rounded-2xl font-black text-xs sm:text-sm flex items-center gap-1.5 transition-all cursor-pointer ${
              activeTab === 'datalake'
                ? 'text-[#0F172A] border border-[#6BC1B8] shadow-sm'
                : 'bg-[#FAFAFA] hover:bg-white text-[#1E293B] border border-[#8DE5A6]'
            }`}
          >
            <Database className="w-4 h-4 text-[#3E82F0]" />
            <span>Data Lake & AI Hub</span>
          </button>

          <button
            id="tab-care"
            onClick={() => setActiveTab('care')}
            style={activeTab === 'care' ? { background: 'linear-gradient(to right, #C3F2D6, #8DE5A6, #6BC1B8, #3E82F0)' } : undefined}
            className={`px-4 py-2.5 rounded-2xl font-black text-xs sm:text-sm flex items-center gap-1.5 transition-all cursor-pointer ${
              activeTab === 'care'
                ? 'text-[#0F172A] border border-[#6BC1B8] shadow-sm'
                : 'bg-[#FAFAFA] hover:bg-white text-[#1E293B] border border-[#8DE5A6]'
            }`}
          >
            <Pill className="w-4 h-4 text-[#3E82F0]" />
            <span>Meds & Emergency Care</span>
          </button>

          <button
            id="tab-consultation"
            onClick={() => setActiveTab('consultation')}
            style={activeTab === 'consultation' ? { background: 'linear-gradient(to right, #C3F2D6, #8DE5A6, #6BC1B8, #3E82F0)' } : undefined}
            className={`px-4 py-2.5 rounded-2xl font-black text-xs sm:text-sm flex items-center gap-1.5 transition-all cursor-pointer ${
              activeTab === 'consultation'
                ? 'text-[#0F172A] border border-[#6BC1B8] shadow-sm'
                : 'bg-[#FAFAFA] hover:bg-white text-[#1E293B] border border-[#8DE5A6]'
            }`}
          >
            <Stethoscope className="w-4 h-4 text-[#3E82F0]" />
            <span>Doctor Consultations</span>
          </button>

          <button
            id="tab-community"
            onClick={() => setActiveTab('community')}
            style={activeTab === 'community' ? { background: 'linear-gradient(to right, #C3F2D6, #8DE5A6, #6BC1B8, #3E82F0)' } : undefined}
            className={`px-4 py-2.5 rounded-2xl font-black text-xs sm:text-sm flex items-center gap-1.5 transition-all cursor-pointer ${
              activeTab === 'community'
                ? 'text-[#0F172A] border border-[#6BC1B8] shadow-sm'
                : 'bg-[#FAFAFA] hover:bg-white text-[#1E293B] border border-[#8DE5A6]'
            }`}
          >
            <Users className="w-4 h-4 text-[#3E82F0]" />
            <span>Community & Research</span>
          </button>

          <button
            id="tab-reminders"
            onClick={() => setActiveTab('reminders')}
            style={activeTab === 'reminders' ? { background: 'linear-gradient(to right, #C3F2D6, #8DE5A6, #6BC1B8, #3E82F0)' } : undefined}
            className={`px-4 py-2.5 rounded-2xl font-black text-xs sm:text-sm flex items-center gap-1.5 transition-all cursor-pointer ${
              activeTab === 'reminders'
                ? 'text-[#0F172A] border border-[#6BC1B8] shadow-sm'
                : 'bg-[#FAFAFA] hover:bg-white text-[#1E293B] border border-[#8DE5A6]'
            }`}
          >
            <Clock className="w-4 h-4 text-[#3E82F0]" />
            <span>Schedule Reminders ({reminders.length})</span>
            <span className="text-[10px] bg-white/90 text-[#1E293B] font-extrabold px-1.5 py-0.5 rounded-md ml-1 border border-[#8DE5A6]">
              Caregiver Access
            </span>
          </button>

          <button
            id="tab-alerts"
            onClick={() => setActiveTab('alerts')}
            style={activeTab === 'alerts' ? { background: 'linear-gradient(to right, #C3F2D6, #8DE5A6, #6BC1B8, #3E82F0)' } : undefined}
            className={`px-4 py-2.5 rounded-2xl font-black text-xs sm:text-sm flex items-center gap-1.5 transition-all cursor-pointer ${
              activeTab === 'alerts'
                ? 'text-[#0F172A] border border-[#6BC1B8] shadow-sm'
                : 'bg-[#FAFAFA] hover:bg-white text-[#1E293B] border border-[#8DE5A6]'
            }`}
          >
            <Bell className="w-4 h-4 text-[#3E82F0]" />
            <span>Alerts ({activeAlerts.length})</span>
          </button>

          <button
            id="tab-people"
            onClick={() => setActiveTab('people')}
            style={activeTab === 'people' ? { background: 'linear-gradient(to right, #C3F2D6, #8DE5A6, #6BC1B8, #3E82F0)' } : undefined}
            className={`px-4 py-2.5 rounded-2xl font-black text-xs sm:text-sm flex items-center gap-1.5 transition-all cursor-pointer ${
              activeTab === 'people'
                ? 'text-[#0F172A] border border-[#6BC1B8] shadow-sm'
                : 'bg-[#FAFAFA] hover:bg-white text-[#1E293B] border border-[#8DE5A6]'
            }`}
          >
            <Users className="w-4 h-4 text-[#3E82F0]" />
            <span>Family Album ({familiarPeople.length})</span>
          </button>

          <button
            id="tab-ai"
            onClick={() => setActiveTab('ai')}
            style={activeTab === 'ai' ? { background: 'linear-gradient(to right, #C3F2D6, #8DE5A6, #6BC1B8, #3E82F0)' } : undefined}
            className={`px-4 py-2.5 rounded-2xl font-black text-xs sm:text-sm flex items-center gap-1.5 transition-all cursor-pointer ${
              activeTab === 'ai'
                ? 'text-[#0F172A] border border-[#6BC1B8] shadow-sm'
                : 'bg-[#FAFAFA] hover:bg-white text-[#1E293B] border border-[#8DE5A6]'
            }`}
          >
            <Brain className="w-4 h-4 text-[#3E82F0]" />
            <span>AI Policy Insights</span>
          </button>
        </div>

        {/* Quick Action Buttons for Onboarding & Journal */}
        <div className="flex items-center gap-2">
          {onOpenOnboarding && (
            <button
              onClick={onOpenOnboarding}
              className="px-3 py-2 rounded-xl bg-white hover:bg-slate-50 text-[#1E293B] font-black text-xs flex items-center gap-1 border border-[#8DE5A6] cursor-pointer shadow-2xs"
              title="Tailored Onboarding Assessment"
            >
              <Sparkles className="w-3.5 h-3.5 text-[#3E82F0]" />
              <span>Assessment & Goals</span>
            </button>
          )}

          {onOpenJournal && (
            <button
              onClick={onOpenJournal}
              className="px-3 py-2 rounded-xl bg-white hover:bg-slate-50 text-[#1E293B] font-black text-xs flex items-center gap-1 border border-[#8DE5A6] cursor-pointer shadow-2xs"
              title="Memory Reminiscence Journal"
            >
              <BookOpen className="w-3.5 h-3.5 text-[#3E82F0]" />
              <span>Memory Journal</span>
            </button>
          )}
        </div>
      </div>

      {/* TAB 0: Interactive Ecosystem Architecture Map */}
      {activeTab === 'ecosystem' && (
        <EcosystemFlowMap
          currentTab={activeTab}
          onNavigateTab={(tab) => setActiveTab(tab)}
          onOpenOnboarding={onOpenOnboarding || (() => {})}
          onOpenJournal={onOpenJournal || (() => {})}
          onTriggerSOS={onTriggerSOS || (() => {})}
          userRole="caregiver"
        />
      )}

      {/* TAB: Data Lake & AI Hub */}
      {activeTab === 'datalake' && (
        <DataLakeHubView
          userId={currentPatient.id}
          patientName={currentPatient.name}
        />
      )}

      {/* TAB: Integrated Care Services */}
      {activeTab === 'care' && (
        <IntegratedCareView
          user={currentPatient}
          caregiverName={caregiverUser.name}
          onTriggerSOS={onTriggerSOS}
          onAddReminder={onAddReminder}
        />
      )}

      {/* TAB: Professional Consultation Portal */}
      {activeTab === 'consultation' && (
        <ConsultationPortalView
          user={currentPatient}
        />
      )}

      {/* TAB: Long-Term Impact & Community */}
      {activeTab === 'community' && (
        <CommunityImpactView />
      )}

      {/* TAB 1: Cognitive Trends & Charts (Recharts) */}
      {activeTab === 'trends' && (
        <div className="space-y-6">
          {/* Chart 1: Accuracy Trend vs Baseline */}
          <div className="bg-[#FAFAFA] rounded-[32px] p-6 md:p-8 border-2 border-[#8DE5A6] shadow-sm space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <div>
                <h3 className="text-xl font-black text-[#1E293B]">
                  Game Accuracy Trend (%)
                </h3>
                <p className="text-slate-500 text-xs font-medium">
                  Session-by-session accuracy compared against {currentPatient.name.split(' ')[0]}'s historical baseline
                </p>
              </div>
              <div className="flex items-center gap-4 text-xs font-bold">
                <span className="flex items-center gap-1.5 text-[#3E82F0]">
                  <span className="w-3 h-3 rounded-full bg-[#3E82F0]" /> Session Accuracy
                </span>
                <span className="flex items-center gap-1.5 text-slate-400">
                  <span className="w-3 h-0.5 bg-slate-400" /> Baseline (80%)
                </span>
              </div>
            </div>

            <div className="h-64 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={chartData} margin={{ top: 10, right: 20, left: -20, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                  <XAxis dataKey="date" stroke="#94a3b8" fontSize={12} />
                  <YAxis domain={[40, 100]} stroke="#94a3b8" fontSize={12} />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: '#ffffff',
                      borderRadius: '16px',
                      border: '2px solid #8DE5A6',
                      boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)',
                    }}
                  />
                  <Line
                    type="monotone"
                    dataKey="accuracy"
                    stroke="#3E82F0"
                    strokeWidth={3}
                    dot={{ r: 5, fill: '#1E293B' }}
                    activeDot={{ r: 8 }}
                  />
                  <Line
                    type="monotone"
                    dataKey="baseline"
                    stroke="#94a3b8"
                    strokeDasharray="4 4"
                    strokeWidth={2}
                    dot={false}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Chart 2: Response Time & Activity Breakdown */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Response Time Trend */}
            <div className="bg-[#FAFAFA] rounded-[32px] p-6 md:p-8 border-2 border-[#8DE5A6] shadow-sm space-y-4">
              <div>
                <h3 className="text-xl font-black text-[#1E293B]">
                  Average Response Time (seconds)
                </h3>
                <p className="text-slate-500 text-xs font-medium">
                  Lower & steady reaction times indicate confident recall
                </p>
              </div>

              <div className="h-56 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={chartData} margin={{ top: 10, right: 20, left: -20, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                    <XAxis dataKey="date" stroke="#94a3b8" fontSize={12} />
                    <YAxis stroke="#94a3b8" fontSize={12} />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: '#ffffff',
                        borderRadius: '16px',
                        border: '2px solid #8DE5A6',
                      }}
                    />
                    <Line
                      type="monotone"
                      dataKey="response_time"
                      stroke="#6BC1B8"
                      strokeWidth={3}
                      dot={{ r: 5, fill: '#3E82F0' }}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Games Played Distribution */}
            <div className="bg-[#FAFAFA] rounded-[32px] p-6 md:p-8 border-2 border-[#8DE5A6] shadow-sm space-y-4">
              <div>
                <h3 className="text-xl font-black text-[#1E293B]">
                  Cognitive Domain Participation
                </h3>
                <p className="text-slate-500 text-xs font-medium">
                  Frequency of each cultural game module completed
                </p>
              </div>

              <div className="h-56 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={barData} margin={{ top: 10, right: 20, left: -20, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                    <XAxis dataKey="game" stroke="#94a3b8" fontSize={10} />
                    <YAxis stroke="#94a3b8" fontSize={12} allowDecimals={false} />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: '#ffffff',
                        borderRadius: '16px',
                        border: '2px solid #8DE5A6',
                      }}
                    />
                    <Bar dataKey="count" fill="#6BC1B8" radius={[8, 8, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: Reminder Management (Schedule Reminders - Caregiver Access Only) */}
      {activeTab === 'reminders' && (
        <ScheduleRemindersManager
          currentPatient={currentPatient}
          allPatients={allPatients}
          onSwitchPatient={onSwitchPatient}
          reminders={reminders}
          onAddReminder={onAddReminder}
          onDeleteReminder={onDeleteReminder}
          onToggleReminder={onToggleReminder}
          onTriggerAlarm={onTriggerAlarm}
          caregiverName={caregiverUser.name}
        />
      )}

      {/* TAB 3: Alerts & Safety Logs */}
      {activeTab === 'alerts' && (
        <div className="bg-[#FAFAFA] rounded-[32px] p-6 md:p-8 border-2 border-[#8DE5A6] shadow-sm space-y-6">
          <div>
            <h3 className="text-xl font-black text-[#1E293B]">
              Safety & Emergency Alert Log
            </h3>
            <p className="text-slate-500 text-xs font-medium">
              Real-time records of SOS requests, missed medications, and baseline deviations
            </p>
          </div>

          <div className="space-y-3">
            {alerts.length === 0 ? (
              <p className="text-slate-500 text-sm py-6 text-center font-medium">
                No alerts recorded. Everything is peaceful.
              </p>
            ) : (
              alerts.map((al) => (
                <div
                  key={al.id}
                  className={`p-4 rounded-2xl border-2 flex items-center justify-between gap-4 ${
                    al.resolved
                      ? 'bg-white border-slate-200 text-slate-400'
                      : al.type === 'sos'
                      ? 'bg-rose-50 border-rose-300 text-rose-950'
                      : 'bg-white border-[#8DE5A6] text-[#1E293B]'
                  }`}
                >
                  <div className="flex items-center gap-4">
                    <div
                      className={`p-2.5 rounded-xl ${
                        al.type === 'sos' ? 'bg-rose-200 text-rose-800' : 'bg-emerald-100 text-emerald-800'
                      }`}
                    >
                      <AlertTriangle className="w-6 h-6" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <span
                          className={`px-2 py-0.5 rounded-md text-xs font-black uppercase ${
                            al.type === 'sos'
                              ? 'bg-rose-600 text-white'
                              : 'bg-emerald-600 text-white'
                          }`}
                        >
                          {al.type.toUpperCase()}
                        </span>
                        <span className="text-xs text-slate-500 font-medium">
                          {new Date(al.triggered_at).toLocaleTimeString([], {
                            hour: '2-digit',
                            minute: '2-digit',
                          })}
                        </span>
                      </div>
                      <p className="text-sm font-bold text-[#1E293B] pt-1">
                        {al.message}
                      </p>
                    </div>
                  </div>

                  {!al.resolved ? (
                    <button
                      onClick={() => onResolveAlert(al.id)}
                      className="px-4 py-2 rounded-xl bg-[#1E293B] hover:bg-slate-800 text-white text-xs font-black shadow-sm cursor-pointer"
                    >
                      Acknowledge & Resolve
                    </button>
                  ) : (
                    <span className="text-xs font-black text-emerald-700 flex items-center gap-1">
                      <CheckCircle2 className="w-4 h-4" /> Resolved
                    </span>
                  )}
                </div>
              ))
            )}
          </div>
        </div>
      )}

      {/* TAB 4: Familiar People Management */}
      {activeTab === 'people' && (
        <div className="bg-[#FAFAFA] rounded-[32px] p-6 md:p-8 border-2 border-[#8DE5A6] shadow-sm space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-xl font-black text-[#1E293B]">
                Familiar Loved Ones & Memory Cues
              </h3>
              <p className="text-slate-500 text-xs font-medium">
                Photos and voice notes displayed in {currentPatient.name.split(' ')[0]}'s Family Album and Face Match games
              </p>
            </div>

            <button
              onClick={() => setShowAddPersonModal(true)}
              style={{ background: 'linear-gradient(to right, #C3F2D6, #8DE5A6, #6BC1B8, #3E82F0)' }}
              className="flex items-center gap-2 px-5 py-3 rounded-2xl text-[#0F172A] font-black text-sm border border-[#6BC1B8] shadow-xs hover:brightness-105 active:scale-95 transition-all cursor-pointer"
            >
              <Plus className="w-5 h-5" />
              <span>Add Family Member</span>
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {familiarPeople.map((person) => (
              <div
                key={person.id}
                className="p-4 rounded-2xl border-2 border-[#8DE5A6]/40 flex items-start justify-between gap-4 hover:border-[#6BC1B8] transition-colors bg-white shadow-2xs"
              >
                <div className="flex items-center gap-4">
                  <img
                    src={person.photo_url}
                    alt={person.name}
                    className="w-16 h-16 rounded-2xl object-cover border-2 border-[#8DE5A6] shrink-0"
                  />
                  <div>
                    <h4 className="text-base font-black text-[#1E293B]">
                      {person.name}
                    </h4>
                    <span className="text-xs font-black text-[#3E82F0]">
                      {person.relation}
                    </span>
                    {person.notes && (
                      <p className="text-xs text-slate-600 pt-1 font-medium">
                        {person.notes}
                      </p>
                    )}
                  </div>
                </div>

                <button
                  onClick={() => onDeleteFamiliarPerson(person.id)}
                  className="p-2 rounded-xl text-slate-400 hover:text-rose-600 hover:bg-rose-50 cursor-pointer"
                  title="Remove person"
                >
                  <Trash2 className="w-5 h-5" />
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* TAB 5: AI Personalization Engine Details */}
      {activeTab === 'ai' && recommendation && (
        <div className="bg-[#FAFAFA] rounded-[32px] p-6 md:p-8 border-2 border-[#8DE5A6] shadow-sm space-y-6">
          <div>
            <h3 className="text-xl font-black text-[#1E293B] flex items-center gap-2">
              <Brain className="w-6 h-6 text-[#3E82F0]" />
              <span>AI Cognitive Personalization Engine</span>
            </h3>
            <p className="text-slate-500 text-xs font-medium">
              Rule-based adaptive tuning based on recent accuracy, mistake frequency, and response times
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="p-5 rounded-2xl bg-white border-2 border-[#8DE5A6] space-y-3">
              <span className="text-xs font-black text-[#1E293B] uppercase tracking-wide">
                Current Difficulty Recommendation
              </span>
              <div className="flex items-center gap-3">
                <span className="text-3xl font-black text-[#1E293B] uppercase">
                  {recommendation.recommended_difficulty}
                </span>
                <span className="px-3 py-1 rounded-full bg-emerald-100 text-emerald-900 border border-emerald-300 font-black text-xs">
                  Next Activity: {recommendation.next_game_type.replace('_', ' ').toUpperCase()}
                </span>
              </div>
              <p className="text-slate-600 text-sm leading-relaxed font-medium">
                {recommendation.rationale}
              </p>
            </div>

            <div className="p-5 rounded-2xl bg-white border-2 border-slate-200 space-y-3">
              <span className="text-xs font-black text-slate-700 uppercase tracking-wide">
                Recent Observation Note
              </span>
              <p className="text-[#1E293B] text-sm leading-relaxed font-medium">
                {recommendation.observation_note}
              </p>
              <div className="pt-2 border-t border-slate-200 text-xs text-slate-500 flex items-center gap-2 font-bold">
                <Layers className="w-4 h-4 text-slate-400" />
                <span>Rolling weighted engagement index: {recommendation.engagement_score}%</span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Add Reminder Modal */}
      {showAddReminderModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-gray-900/60 backdrop-blur-sm animate-fade-in">
          <div className="w-full max-w-lg bg-white rounded-[32px] p-6 border-2 border-[#8DE5A6] shadow-2xl space-y-5">
            <h3 className="text-2xl font-black text-[#1E293B]">
              Create New Reminder
            </h3>

            <form onSubmit={handleCreateReminder} className="space-y-4">
              <div>
                <label className="block text-xs font-black uppercase text-slate-700 mb-1">
                  Reminder Title
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g., Blood Pressure Medication, Hydration"
                  value={remTitle}
                  onChange={(e) => setRemTitle(e.target.value)}
                  className="w-full px-4 py-3 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-[#3E82F0] text-sm font-medium"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-black uppercase text-slate-700 mb-1">
                    Category
                  </label>
                  <select
                    value={remType}
                    onChange={(e) => setRemType(e.target.value as ReminderType)}
                    className="w-full px-4 py-3 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-[#3E82F0] text-sm font-medium"
                  >
                    <option value="medication">Medication</option>
                    <option value="meal">Meal / Tea</option>
                    <option value="exercise">Gentle Walk</option>
                    <option value="appointment">Doctor Visit</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-black uppercase text-slate-700 mb-1">
                    Scheduled Time
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. 09:30 AM"
                    value={remTime}
                    onChange={(e) => setRemTime(e.target.value)}
                    className="w-full px-4 py-3 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-[#3E82F0] text-sm font-medium"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-black uppercase text-slate-700 mb-1">
                  Recurrence
                </label>
                <select
                  value={remRecurrence}
                  onChange={(e) => setRemRecurrence(e.target.value as RecurrenceType)}
                  className="w-full px-4 py-3 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-[#3E82F0] text-sm font-medium"
                >
                  <option value="daily">Daily</option>
                  <option value="weekly">Weekly</option>
                  <option value="as_needed">As Needed</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-black uppercase text-slate-700 mb-1">
                  Gentle Instructions for Patient
                </label>
                <input
                  type="text"
                  placeholder="e.g. Take with warm water after morning tea"
                  value={remInstructions}
                  onChange={(e) => setRemInstructions(e.target.value)}
                  className="w-full px-4 py-3 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-[#3E82F0] text-sm font-medium"
                />
              </div>

              <div className="grid grid-cols-2 gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setShowAddReminderModal(false)}
                  className="px-4 py-3 rounded-xl border border-slate-300 font-bold text-slate-700 text-sm hover:bg-slate-50 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  style={{ background: 'linear-gradient(to right, #C3F2D6, #8DE5A6, #6BC1B8, #3E82F0)' }}
                  className="px-4 py-3 rounded-xl text-[#0F172A] font-black text-sm border border-[#6BC1B8] shadow-xs hover:brightness-105 active:scale-95 cursor-pointer"
                >
                  Save Reminder
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Add Familiar Person Modal */}
      {showAddPersonModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-gray-900/60 backdrop-blur-sm animate-fade-in">
          <div className="w-full max-w-lg bg-white rounded-[32px] p-6 border-2 border-[#8DE5A6] shadow-2xl space-y-5">
            <h3 className="text-2xl font-black text-[#1E293B]">
              Add Family Member or Friend
            </h3>

            <form onSubmit={handleCreatePerson} className="space-y-4">
              <div>
                <label className="block text-xs font-black uppercase text-slate-700 mb-1">
                  Full Name
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Nilav Barua"
                  value={personName}
                  onChange={(e) => setPersonName(e.target.value)}
                  className="w-full px-4 py-3 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-[#3E82F0] text-sm font-medium"
                />
              </div>

              <div>
                <label className="block text-xs font-black uppercase text-slate-700 mb-1">
                  Relationship to Patient
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Grandson (नाति)"
                  value={personRelation}
                  onChange={(e) => setPersonRelation(e.target.value)}
                  className="w-full px-4 py-3 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-[#3E82F0] text-sm font-medium"
                />
              </div>

              <div>
                <label className="block text-xs font-black uppercase text-slate-700 mb-1">
                  Photo URL (or Unsplash URL)
                </label>
                <input
                  type="url"
                  placeholder="https://images.unsplash.com/photo-..."
                  value={personPhoto}
                  onChange={(e) => setPersonPhoto(e.target.value)}
                  className="w-full px-4 py-3 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-[#3E82F0] text-sm font-medium"
                />
              </div>

              <div>
                <label className="block text-xs font-black uppercase text-slate-700 mb-1">
                  Personal Memory Note / Story
                </label>
                <input
                  type="text"
                  placeholder="e.g. Studies in college, visits every Sunday with pitha"
                  value={personNotes}
                  onChange={(e) => setPersonNotes(e.target.value)}
                  className="w-full px-4 py-3 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-[#3E82F0] text-sm font-medium"
                />
              </div>

              <div>
                <label className="block text-xs font-black uppercase text-slate-700 mb-1">
                  Phone Number (Optional)
                </label>
                <input
                  type="tel"
                  placeholder="+91 98640 12345"
                  value={personPhone}
                  onChange={(e) => setPersonPhone(e.target.value)}
                  className="w-full px-4 py-3 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-[#3E82F0] text-sm font-medium"
                />
              </div>

              <div className="grid grid-cols-2 gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setShowAddPersonModal(false)}
                  className="px-4 py-3 rounded-xl border border-slate-300 font-bold text-slate-700 text-sm hover:bg-slate-50 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  style={{ background: 'linear-gradient(to right, #C3F2D6, #8DE5A6, #6BC1B8, #3E82F0)' }}
                  className="px-4 py-3 rounded-xl text-[#0F172A] font-black text-sm border border-[#6BC1B8] shadow-xs hover:brightness-105 active:scale-95 cursor-pointer"
                >
                  Save Loved One
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
        </>
      )}

      {/* Direct Connect Assigned Patient Modal */}
      {isConnectModalOpen && onConnectPatient && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-xs z-50 flex items-center justify-center p-4 animate-fade-in">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl border-2 border-[#6BC1B8] space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <ShieldCheck className="w-5 h-5 text-emerald-600" />
                <h3 className="text-lg font-black text-slate-800">
                  Connect Assigned Senior
                </h3>
              </div>
              <button
                type="button"
                onClick={() => {
                  setIsConnectModalOpen(false);
                  setLinkStatusMessage('');
                }}
                className="p-1.5 rounded-xl hover:bg-slate-100 text-slate-400 hover:text-slate-600 transition-colors"
              >
                ✕
              </button>
            </div>

            <p className="text-xs text-slate-600 leading-relaxed font-medium">
              Enter the patient's User ID (e.g. <span className="font-mono font-bold text-slate-800">user-1788728777084</span>), phone number, or full name to link their profile to your caregiver dashboard.
            </p>

            <div className="space-y-3">
              <input
                type="text"
                placeholder="Patient ID / Name / Phone"
                value={patientLinkInput}
                onChange={(e) => setPatientLinkInput(e.target.value)}
                className="w-full px-4 py-3 text-sm font-bold rounded-xl border border-slate-300 bg-slate-50 outline-none focus:border-[#6BC1B8] focus:bg-white"
              />

              {linkStatusMessage && (
                <p className={`text-xs font-bold p-2.5 rounded-xl ${linkStatusMessage.includes('Success') || linkStatusMessage.includes('connected') ? 'text-emerald-800 bg-emerald-50 border border-emerald-200' : 'text-red-700 bg-red-50 border border-red-200'}`}>
                  {linkStatusMessage}
                </p>
              )}

              <div className="grid grid-cols-2 gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => {
                    setIsConnectModalOpen(false);
                    setLinkStatusMessage('');
                  }}
                  className="px-4 py-2.5 rounded-xl border border-slate-300 font-bold text-slate-700 text-xs hover:bg-slate-50 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  disabled={isLinkingPatient || !patientLinkInput.trim()}
                  onClick={handleDirectConnectPatient}
                  style={{ background: 'linear-gradient(to right, #C3F2D6, #8DE5A6, #6BC1B8, #3E82F0)' }}
                  className="px-4 py-2.5 rounded-xl text-[#0F172A] font-black text-xs border border-[#6BC1B8] shadow-xs hover:brightness-105 active:scale-95 cursor-pointer disabled:opacity-50"
                >
                  {isLinkingPatient ? 'Linking...' : 'Connect Patient'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
