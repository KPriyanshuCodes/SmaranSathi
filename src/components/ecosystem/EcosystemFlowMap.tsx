import React from 'react';
import { 
  GitFork, 
  KeyRound, 
  Sparkles, 
  Gamepad2, 
  BookOpen, 
  Database, 
  Activity, 
  Stethoscope, 
  Users, 
  CheckCircle2, 
  ArrowRight, 
  ArrowDown, 
  ChevronRight,
  ShieldCheck,
  Pill,
  Bell,
  LineChart,
  Brain
} from 'lucide-react';
import { soundEffects } from '../../utils/soundEffects';

interface EcosystemFlowMapProps {
  currentTab: string;
  onNavigateTab: (tab: any) => void;
  onOpenOnboarding: () => void;
  onOpenJournal: () => void;
  onTriggerSOS: () => void;
  userRole: 'elderly' | 'caregiver';
}

export const EcosystemFlowMap: React.FC<EcosystemFlowMapProps> = ({
  currentTab,
  onNavigateTab,
  onOpenOnboarding,
  onOpenJournal,
  onTriggerSOS,
  userRole
}) => {
  return (
    <div className="bg-gradient-to-b from-[#FCF8F1] to-amber-50/50 rounded-3xl border-2 border-amber-300 p-5 sm:p-7 shadow-sm space-y-6 text-gray-900">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-amber-200 pb-4">
        <div>
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-amber-600 text-white flex items-center justify-center shadow-xs">
              <GitFork className="w-4 h-4" />
            </div>
            <h2 className="text-xl sm:text-2xl font-black text-amber-950">
              Smaran Sathi Full Ecosystem Architecture
            </h2>
          </div>
          <p className="text-xs sm:text-sm text-amber-900 mt-1">
            Visual flowchart of the end-to-end cognitive gaming, memory preservation, and care delivery platform.
          </p>
        </div>

        <span className="text-xs font-black uppercase tracking-wider bg-amber-100 text-amber-900 px-3 py-1.5 rounded-full border border-amber-300 w-fit">
          Click any step to open
        </span>
      </div>

      {/* Visual Workflow Steps Grid */}
      <div className="space-y-4">
        {/* ROW 1: START -> AUTHENTICATION -> ONBOARDING */}
        <div className="grid grid-cols-1 md:grid-cols-12 gap-3 items-center">
          {/* Node 1: START */}
          <div className="md:col-span-3 bg-white border-2 border-gray-300 rounded-2xl p-4 shadow-xs flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-100 text-emerald-800 flex items-center justify-center font-black text-xs shrink-0">
              START
            </div>
            <div>
              <h4 className="text-xs font-black uppercase text-gray-700">Elderly & Caregiver</h4>
              <p className="text-[11px] text-gray-500">Dual-role entry portal</p>
            </div>
          </div>

          <div className="hidden md:flex md:col-span-1 justify-center text-amber-500">
            <ArrowRight className="w-5 h-5" />
          </div>

          {/* Node 2: AUTHENTICATION */}
          <div className="md:col-span-3 bg-white border-2 border-amber-200 rounded-2xl p-4 shadow-xs flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-amber-100 text-amber-900 flex items-center justify-center shrink-0">
              <KeyRound className="w-5 h-5" />
            </div>
            <div>
              <h4 className="text-xs font-black text-gray-900">AUTHENTICATION</h4>
              <p className="text-[11px] text-gray-500">Simple passwordless / PIN / email</p>
            </div>
          </div>

          <div className="hidden md:flex md:col-span-1 justify-center text-amber-500">
            <ArrowRight className="w-5 h-5" />
          </div>

          {/* Node 3: ONBOARDING */}
          <button
            onClick={() => {
              soundEffects.playGentleTap(520);
              onOpenOnboarding();
            }}
            className="md:col-span-4 bg-gradient-to-r from-emerald-50 to-teal-50 border-2 border-emerald-400 hover:border-emerald-600 rounded-2xl p-4 shadow-xs text-left transition-all hover:shadow-md cursor-pointer group"
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="w-10 h-10 rounded-xl bg-emerald-600 text-white flex items-center justify-center shrink-0 shadow-xs">
                  <Sparkles className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="text-xs font-black text-emerald-950 uppercase">ONBOARDING</h4>
                  <p className="text-[11px] text-emerald-800 font-medium">Stage Assessment & Goals</p>
                </div>
              </div>
              <ChevronRight className="w-4 h-4 text-emerald-700 group-hover:translate-x-0.5 transition-transform" />
            </div>
          </button>
        </div>

        {/* Down Connector */}
        <div className="flex justify-center text-amber-500 py-1">
          <ArrowDown className="w-5 h-5" />
        </div>

        {/* ROW 2: DAILY ACTIVITIES <---> MEMORY JOURNAL */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Node 4: DAILY ACTIVITIES */}
          <button
            onClick={() => {
              soundEffects.playGentleTap(540);
              onNavigateTab(userRole === 'elderly' ? 'home' : 'analytics');
            }}
            className="bg-white border-2 border-amber-300 hover:border-amber-500 rounded-2xl p-5 shadow-xs text-left transition-all hover:shadow-md cursor-pointer group"
          >
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-2xl bg-amber-500 text-white flex items-center justify-center shrink-0 shadow-sm">
                  <Gamepad2 className="w-6 h-6" />
                </div>
                <div>
                  <span className="text-[10px] font-black uppercase tracking-wider text-amber-800">Core Loop</span>
                  <h3 className="text-base font-black text-gray-900">DAILY ACTIVITIES</h3>
                  <p className="text-xs text-gray-600 mt-0.5">
                    Culturally resonant games (Gamosa flip, Tea Garden sequence, Rhinos recall, Assam Bihu tunes)
                  </p>
                </div>
              </div>
              <ChevronRight className="w-5 h-5 text-amber-700 group-hover:translate-x-1 transition-transform" />
            </div>
          </button>

          {/* Node 5: MEMORY JOURNAL */}
          <button
            onClick={() => {
              soundEffects.playGentleTap(560);
              onOpenJournal();
            }}
            className="bg-gradient-to-r from-orange-50 to-amber-50 border-2 border-orange-300 hover:border-orange-500 rounded-2xl p-5 shadow-xs text-left transition-all hover:shadow-md cursor-pointer group"
          >
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-2xl bg-orange-500 text-white flex items-center justify-center shrink-0 shadow-sm">
                  <BookOpen className="w-6 h-6" />
                </div>
                <div>
                  <span className="text-[10px] font-black uppercase tracking-wider text-orange-800">Oral History</span>
                  <h3 className="text-base font-black text-gray-900">MEMORY JOURNAL</h3>
                  <p className="text-xs text-gray-600 mt-0.5">
                    Oral storytelling voice notes, nostalgic NER landmark memories, photos, and emotion tagging
                  </p>
                </div>
              </div>
              <ChevronRight className="w-5 h-5 text-orange-700 group-hover:translate-x-1 transition-transform" />
            </div>
          </button>
        </div>

        {/* Down Connector */}
        <div className="flex justify-center text-amber-500 py-1">
          <ArrowDown className="w-5 h-5" />
        </div>

        {/* ROW 3: DATA LAKE & AI HUB */}
        <button
          onClick={() => {
            soundEffects.playGentleTap(580);
            onNavigateTab('datalake');
          }}
          className={`w-full rounded-2xl border-2 p-5 shadow-xs text-left transition-all hover:shadow-md cursor-pointer group ${
            currentTab === 'datalake'
              ? 'bg-blue-50 border-blue-500'
              : 'bg-white border-blue-300 hover:border-blue-500'
          }`}
        >
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex items-start sm:items-center gap-3.5">
              <div className="w-12 h-12 rounded-2xl bg-blue-700 text-white flex items-center justify-center shrink-0 shadow-sm">
                <Database className="w-6 h-6" />
              </div>
              <div>
                <span className="text-[10px] font-black uppercase tracking-wider text-blue-700">Central Intelligence</span>
                <h3 className="text-base sm:text-lg font-black text-gray-900">DATA LAKE & AI HUB</h3>
                <p className="text-xs text-gray-600">
                  1. Raw Data &rarr; 2. Cleansing & Ethical Filtering &rarr; 3. Feature Extraction &rarr; 4. Advanced Model Training
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <span className="text-xs font-black px-3 py-1 rounded-full bg-blue-100 text-blue-900">
                Active Federated Model
              </span>
              <ChevronRight className="w-5 h-5 text-blue-700 group-hover:translate-x-1 transition-transform" />
            </div>
          </div>
        </button>

        {/* Down Connector */}
        <div className="flex justify-center text-amber-500 py-1">
          <ArrowDown className="w-5 h-5" />
        </div>

        {/* ROW 4: INTEGRATED CARE SERVICES & PROFESSIONAL CONSULTATION */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Node 7: INTEGRATED CARE SERVICES */}
          <button
            onClick={() => {
              soundEffects.playGentleTap(600);
              onNavigateTab('care');
            }}
            className={`rounded-2xl border-2 p-5 shadow-xs text-left transition-all hover:shadow-md cursor-pointer group ${
              currentTab === 'care'
                ? 'bg-teal-50 border-teal-500'
                : 'bg-white border-teal-300 hover:border-teal-500'
            }`}
          >
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-2xl bg-teal-600 text-white flex items-center justify-center shrink-0 shadow-sm">
                  <Activity className="w-6 h-6" />
                </div>
                <div>
                  <span className="text-[10px] font-black uppercase tracking-wider text-teal-800">Assistance</span>
                  <h3 className="text-base font-black text-gray-900">INTEGRATED CARE SERVICES</h3>
                  <p className="text-xs text-gray-600 mt-0.5">
                    Medication Management (dosages & timestamps) + Emergency Response SOS Beacon
                  </p>
                </div>
              </div>
              <ChevronRight className="w-5 h-5 text-teal-700 group-hover:translate-x-1 transition-transform" />
            </div>
          </button>

          {/* Node 8: PROFESSIONAL CONSULTATION PORTAL */}
          <button
            onClick={() => {
              soundEffects.playGentleTap(620);
              onNavigateTab('consultation');
            }}
            className={`rounded-2xl border-2 p-5 shadow-xs text-left transition-all hover:shadow-md cursor-pointer group ${
              currentTab === 'consultation'
                ? 'bg-cyan-50 border-cyan-500'
                : 'bg-white border-cyan-300 hover:border-cyan-500'
            }`}
          >
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-2xl bg-cyan-700 text-white flex items-center justify-center shrink-0 shadow-sm">
                  <Stethoscope className="w-6 h-6" />
                </div>
                <div>
                  <span className="text-[10px] font-black uppercase tracking-wider text-cyan-800">Clinical Link</span>
                  <h3 className="text-base font-black text-gray-900">CONSULTATION PORTAL</h3>
                  <p className="text-xs text-gray-600 mt-0.5">
                    Connect with NER geriatricians (GNRC, NEIGRIHMS) & export clinical summaries
                  </p>
                </div>
              </div>
              <ChevronRight className="w-5 h-5 text-cyan-700 group-hover:translate-x-1 transition-transform" />
            </div>
          </button>
        </div>

        {/* Down Connector */}
        <div className="flex justify-center text-amber-500 py-1">
          <ArrowDown className="w-5 h-5" />
        </div>

        {/* ROW 5: LONG-TERM IMPACT & COMMUNITY */}
        <button
          onClick={() => {
            soundEffects.playGentleTap(640);
            onNavigateTab('community');
          }}
          className={`w-full rounded-2xl border-2 p-5 shadow-xs text-left transition-all hover:shadow-md cursor-pointer group ${
            currentTab === 'community'
              ? 'bg-purple-50 border-purple-500'
              : 'bg-white border-purple-300 hover:border-purple-500'
          }`}
        >
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex items-start sm:items-center gap-3.5">
              <div className="w-12 h-12 rounded-2xl bg-purple-700 text-white flex items-center justify-center shrink-0 shadow-sm">
                <Users className="w-6 h-6" />
              </div>
              <div>
                <span className="text-[10px] font-black uppercase tracking-wider text-purple-700">Societal Impact</span>
                <h3 className="text-base sm:text-lg font-black text-gray-900">LONG-TERM IMPACT & COMMUNITY</h3>
                <p className="text-xs text-gray-600">
                  Caregiver Support Forum + Longitudinal Research Modeling (2022&ndash;2045) for NHM North East
                </p>
              </div>
            </div>

            <ChevronRight className="w-5 h-5 text-purple-700 group-hover:translate-x-1 transition-transform" />
          </div>
        </button>

        {/* Down Connector */}
        <div className="flex justify-center text-emerald-600 py-1">
          <ArrowDown className="w-5 h-5" />
        </div>

        {/* ROW 6: BETTER CARE OUTCOMES (DESTINATION) */}
        <div className="bg-gradient-to-r from-emerald-600 via-teal-600 to-cyan-700 text-white rounded-2xl p-4 sm:p-5 shadow-md flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-white/20 flex items-center justify-center shrink-0">
              <CheckCircle2 className="w-6 h-6 text-emerald-200" />
            </div>
            <div>
              <h4 className="text-sm sm:text-base font-black">BETTER CARE OUTCOMES ACHIEVED</h4>
              <p className="text-xs text-emerald-100">
                Maintained cognitive dignity, delayed MCI progression, reduced caregiver burnout, and empowered families across NER.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
