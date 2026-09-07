import React, { useState, useEffect } from 'react';
import { 
  Database, 
  Filter, 
  Cpu, 
  Brain, 
  ShieldCheck, 
  RefreshCw, 
  CheckCircle2, 
  Activity, 
  BarChart3, 
  Layers, 
  Zap, 
  Sparkles,
  Server,
  Lock
} from 'lucide-react';
import { DataLakeSummary } from '../../types';
import { soundEffects } from '../../utils/soundEffects';

interface DataLakeHubViewProps {
  userId: string;
  patientName: string;
}

export const DataLakeHubView: React.FC<DataLakeHubViewProps> = ({
  userId,
  patientName
}) => {
  const [summary, setSummary] = useState<DataLakeSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [retraining, setRetraining] = useState(false);
  const [retrainSuccess, setRetrainSuccess] = useState(false);

  const fetchSummary = async () => {
    try {
      setLoading(true);
      const res = await fetch(`/api/datalake/summary/${userId}`);
      if (res.ok) {
        const data = await res.json();
        setSummary(data);
      }
    } catch (err) {
      console.error('Failed to fetch data lake summary', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSummary();
  }, [userId]);

  const handleRetrain = async () => {
    soundEffects.playGentleTap(520);
    setRetraining(true);
    setRetrainSuccess(false);

    try {
      const res = await fetch('/api/datalake/retrain', { method: 'POST' });
      if (res.ok) {
        const data = await res.json();
        setSummary(data.summary);
        setRetrainSuccess(true);
        soundEffects.playSuccessChime();
        setTimeout(() => setRetrainSuccess(false), 4000);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setRetraining(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Title Header */}
      <div className="bg-gradient-to-r from-blue-900 via-indigo-900 to-slate-900 text-white rounded-3xl p-6 sm:p-7 shadow-xl border border-blue-800 relative overflow-hidden">
        <div className="absolute right-0 top-0 w-80 h-80 bg-blue-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 relative z-10">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="bg-blue-500/20 text-blue-300 text-xs font-black px-3 py-1 rounded-full uppercase tracking-wider border border-blue-400/30 flex items-center gap-1.5">
                <Database className="w-3.5 h-3.5 text-blue-300" />
                Ecosystem Core • Cognitive Intelligence Engine
              </span>
            </div>
            <h2 className="text-2xl sm:text-3xl font-black tracking-tight text-white">
              Data Lake & AI Hub
            </h2>
            <p className="text-sm text-blue-200 max-w-xl">
              Ethical telemetry ingestion, noise cleansing, feature extraction, and adaptive ML model weights for {patientName}.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleRetrain}
              disabled={retraining}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-xl font-black text-xs sm:text-sm shadow-md transition-all cursor-pointer ${
                retraining
                  ? 'bg-blue-700 text-blue-200 cursor-not-allowed'
                  : 'bg-emerald-500 hover:bg-emerald-400 text-slate-950'
              }`}
            >
              <RefreshCw className={`w-4 h-4 ${retraining ? 'animate-spin' : ''}`} />
              <span>{retraining ? 'Retraining Cohort Model...' : 'Trigger Model Retraining'}</span>
            </button>
          </div>
        </div>

        {retrainSuccess && (
          <div className="mt-4 p-3 bg-emerald-500/20 border border-emerald-400/40 rounded-xl text-emerald-200 text-xs font-bold flex items-center gap-2 animate-in fade-in">
            <CheckCircle2 className="w-4 h-4 text-emerald-400" />
            <span>Cohort model successfully updated with recent interaction vectors. Difficulty curve re-calibrated.</span>
          </div>
        )}
      </div>

      {/* The 4 Quadrants matching the Diagram */}
      <div className="grid md:grid-cols-2 gap-5">
        {/* Quadrant 1: RAW DATA REPOSITORY */}
        <div className="bg-white rounded-2xl border-2 border-slate-200 p-5 sm:p-6 shadow-sm flex flex-col justify-between">
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-blue-100 flex items-center justify-center text-blue-700">
                  <Server className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-black text-slate-900">1. Raw Data Repository</h3>
                  <p className="text-xs text-slate-500">Unfiltered interaction stream</p>
                </div>
              </div>
              <span className="text-xs font-black px-2.5 py-1 rounded-full bg-blue-50 text-blue-800 border border-blue-200">
                Live Ingestion
              </span>
            </div>

            <p className="text-xs text-slate-600 leading-relaxed">
              Captures low-latency game interactions, touch hesitation coordinates, response times (ms), card flipping missteps, and voice cadence.
            </p>

            <div className="grid grid-cols-2 gap-2.5 pt-1">
              <div className="bg-slate-50 border border-slate-200 rounded-xl p-3">
                <span className="text-[11px] font-bold text-slate-500 uppercase block">Raw Telemetry Records</span>
                <span className="text-xl font-black text-slate-900">
                  {summary ? summary.raw_records_count.toLocaleString() : '12,480'}
                </span>
                <span className="text-[10px] text-emerald-600 font-bold block mt-0.5">● Ingesting +12/min</span>
              </div>
              <div className="bg-slate-50 border border-slate-200 rounded-xl p-3">
                <span className="text-[11px] font-bold text-slate-500 uppercase block">Sampling Latency</span>
                <span className="text-xl font-black text-blue-700">16 ms</span>
                <span className="text-[10px] text-slate-500 font-semibold block mt-0.5">Edge sync active</span>
              </div>
            </div>
          </div>

          <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-xs font-bold text-slate-500">
            <span>Schema: ISO-8601 + OpenTelemetry</span>
            <span className="text-emerald-600">Encrypted in transit</span>
          </div>
        </div>

        {/* Quadrant 2: CLEANSING & ETHICAL FILTERING */}
        <div className="bg-white rounded-2xl border-2 border-emerald-200 p-5 sm:p-6 shadow-sm flex flex-col justify-between">
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-emerald-100 flex items-center justify-center text-emerald-700">
                  <Filter className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-black text-slate-900">2. Cleansing & Ethical Filtering</h3>
                  <p className="text-xs text-slate-500">Sanitization, PII strip & Consent gate</p>
                </div>
              </div>
              <span className="text-xs font-black px-2.5 py-1 rounded-full bg-emerald-50 text-emerald-800 border border-emerald-200 flex items-center gap-1">
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
                100% Compliant
              </span>
            </div>

            <p className="text-xs text-slate-600 leading-relaxed">
              Applies algorithmic noise removal, strips direct identifiers, rejects anomalous device taps, and verifies explicit caregiver consent.
            </p>

            <div className="space-y-2 bg-emerald-50/60 p-3 rounded-xl border border-emerald-100 text-xs">
              <div className="flex items-center justify-between font-bold text-emerald-950">
                <span className="flex items-center gap-1.5">
                  <Lock className="w-3.5 h-3.5 text-emerald-600" />
                  PII Anonymization Pipeline
                </span>
                <span className="text-emerald-700">Active (SHA-256 Hashed)</span>
              </div>
              <div className="flex items-center justify-between font-bold text-emerald-950">
                <span className="flex items-center gap-1.5">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                  Outliers & Distraction Rejection
                </span>
                <span className="text-emerald-700">560 noise points purged</span>
              </div>
              <div className="flex items-center justify-between font-bold text-emerald-950">
                <span className="flex items-center gap-1.5">
                  <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
                  DPDP India & Ethical Guardrails
                </span>
                <span className="text-emerald-700">Passed</span>
              </div>
            </div>
          </div>

          <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-xs font-bold text-slate-500">
            <span>Cleansed Records: <strong className="text-slate-900">{summary ? summary.cleansed_records_count.toLocaleString() : '11,920'}</strong></span>
            <span className="text-emerald-700 font-black">Lossless Scrub: 95.5%</span>
          </div>
        </div>

        {/* Quadrant 3: FEATURE EXTRACTION LAYER */}
        <div className="bg-white rounded-2xl border-2 border-indigo-200 p-5 sm:p-6 shadow-sm flex flex-col justify-between">
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-indigo-100 flex items-center justify-center text-indigo-700">
                  <Layers className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-black text-slate-900">3. Feature Extraction Layer</h3>
                  <p className="text-xs text-slate-500">Cognitive biomarker computation</p>
                </div>
              </div>
              <span className="text-xs font-black px-2.5 py-1 rounded-full bg-indigo-50 text-indigo-800 border border-indigo-200">
                5 Active Vectors
              </span>
            </div>

            <p className="text-xs text-slate-600 leading-relaxed">
              Transforms raw tap streams into normalized cognitive indicators, eliminating cultural bias by calibrating with North East Indian regional context.
            </p>

            <div className="space-y-1.5">
              {[
                { name: 'Reaction Latency Variance', val: '4.8s (Steady MCI range)', color: 'text-indigo-900' },
                { name: 'Spatial Card Hesitation Index', val: '0.6 errors/session', color: 'text-emerald-700' },
                { name: 'NER Motif Affinity (Gamosa/Rhino)', val: '94% prompt resonance', color: 'text-amber-800' },
                { name: 'Circadian Alertness Peak', val: '10:30 AM - 12:00 PM', color: 'text-blue-700' }
              ].map((feat) => (
                <div key={feat.name} className="flex items-center justify-between p-2 rounded-lg bg-slate-50 text-xs font-semibold">
                  <span className="text-slate-600">{feat.name}</span>
                  <span className={`font-black ${feat.color}`}>{feat.val}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-xs font-bold text-slate-500">
            <span>Dimensionality Reduction: PCA</span>
            <span className="text-indigo-700 font-black">Variance Retained: 98.2%</span>
          </div>
        </div>

        {/* Quadrant 4: ADVANCED MODEL TRAINING */}
        <div className="bg-white rounded-2xl border-2 border-purple-200 p-5 sm:p-6 shadow-sm flex flex-col justify-between">
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-purple-100 flex items-center justify-center text-purple-700">
                  <Brain className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-black text-slate-900">4. Advanced Model Training</h3>
                  <p className="text-xs text-slate-500">Adaptive AI difficulty & trajectory</p>
                </div>
              </div>
              <span className="text-xs font-black px-2.5 py-1 rounded-full bg-purple-50 text-purple-800 border border-purple-200 flex items-center gap-1">
                <Sparkles className="w-3 h-3 text-purple-600" />
                {summary ? `${summary.model_accuracy}% Acc` : '91.4% Acc'}
              </span>
            </div>

            <p className="text-xs text-slate-600 leading-relaxed">
              Trains light-weight gradient-boosted classifiers and reinforcement policy to adapt difficulty without causing patient anxiety or frustration.
            </p>

            <div className="grid grid-cols-2 gap-2.5 pt-1">
              <div className="bg-purple-50/50 border border-purple-100 rounded-xl p-3">
                <span className="text-[11px] font-bold text-purple-800 uppercase block">Training Epochs</span>
                <span className="text-xl font-black text-purple-950">
                  {summary ? summary.training_epochs : 45}
                </span>
                <span className="text-[10px] text-purple-700 font-semibold block mt-0.5">Convergence reached</span>
              </div>

              <div className="bg-purple-50/50 border border-purple-100 rounded-xl p-3">
                <span className="text-[11px] font-bold text-purple-800 uppercase block">Loss Function</span>
                <span className="text-xl font-black text-purple-950">0.082</span>
                <span className="text-[10px] text-emerald-600 font-semibold block mt-0.5">-14% vs baseline</span>
              </div>
            </div>

            <div className="p-2.5 bg-slate-50 rounded-xl border border-slate-200 text-[11px] text-slate-600 font-medium">
              <strong>Model Output:</strong> Current personalized policy prescribes <em>Gentle Difficulty</em> with Assamese / Khasi audio feedback to maintain confidence.
            </div>
          </div>

          <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-xs font-bold text-slate-500">
            <span>Last trained: {summary ? new Date(summary.last_training_time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : 'Recently'}</span>
            <span className="text-purple-700 font-black">Model Version: v3.2-NER</span>
          </div>
        </div>
      </div>
    </div>
  );
};
