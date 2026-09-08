import React, { useEffect, useState } from 'react';
import { 
  AlertTriangle, 
  Phone, 
  CheckCircle2, 
  X, 
  MapPin, 
  Clock, 
  Volume2, 
  VolumeX, 
  UserCheck, 
  ExternalLink,
  ShieldAlert
} from 'lucide-react';
import { Alert, User } from '../../types';
import { soundEffects, speakText } from '../../utils/soundEffects';

interface CaregiverSOSAlertModalProps {
  alert: Alert;
  patient?: User | null;
  onResolve: (alertId: string) => void;
  onDismiss: () => void;
  onViewPatient?: (patientId: string) => void;
}

export const CaregiverSOSAlertModal: React.FC<CaregiverSOSAlertModalProps> = ({
  alert,
  patient,
  onResolve,
  onDismiss,
  onViewPatient
}) => {
  const [isMuted, setIsMuted] = useState(false);

  useEffect(() => {
    // Play urgent alarm chime on mount
    soundEffects.playReminderAlarm('high');
    const patientName = alert.patient_name || patient?.name || 'Your patient';
    speakText(`Emergency alert! ${patientName} has pressed the emergency SOS button.`, 'en');

    // Repeat alarm gently after 4 seconds if not dismissed
    const repeatTimer = setTimeout(() => {
      if (!isMuted) {
        soundEffects.playReminderAlarm('high');
      }
    }, 4500);

    return () => clearTimeout(repeatTimer);
  }, [alert.id, isMuted, alert.patient_name, patient?.name]);

  const handleToggleMute = () => {
    setIsMuted(prev => !prev);
    if (isMuted) {
      soundEffects.playReminderAlarm('high');
    }
  };

  const handleResolve = () => {
    soundEffects.playSuccessChime();
    onResolve(alert.id);
  };

  const patientPhone = patient?.emergency_contact?.phone || patient?.phone || '+91 98640 12345';
  const patientLocation = alert.lat && alert.lng 
    ? `GPS: ${alert.lat.toFixed(4)}°N, ${alert.lng.toFixed(4)}°E` 
    : (patient?.location || 'Guwahati, Assam');

  const triggeredTime = alert.triggered_at 
    ? new Date(alert.triggered_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })
    : 'Just now';

  return (
    <div 
      id="caregiver-sos-alert-modal"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md animate-in fade-in duration-200"
    >
      <div 
        className="w-full max-w-xl bg-white rounded-3xl shadow-2xl border-4 border-rose-500 overflow-hidden relative animate-in zoom-in-95 duration-200"
        role="alertdialog"
        aria-modal="true"
        aria-labelledby="sos-alert-title"
      >
        {/* Pulsing Emergency Top Banner */}
        <div className="bg-gradient-to-r from-rose-600 via-red-600 to-rose-700 text-white p-5 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <span className="relative flex h-5 w-5">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-rose-200 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-5 w-5 bg-white text-rose-600 items-center justify-center">
                <ShieldAlert className="w-3.5 h-3.5" />
              </span>
            </span>
            <div>
              <h2 id="sos-alert-title" className="text-base sm:text-lg font-black tracking-wide uppercase flex items-center gap-2">
                <span>Emergency SOS Alert</span>
                <span className="px-2 py-0.5 rounded-full bg-white/20 text-white text-[11px] font-bold tracking-normal">
                  High Priority
                </span>
              </h2>
              <p className="text-rose-100 text-xs font-semibold">
                Instant patient beacon transmitted to assigned caregiver
              </p>
            </div>
          </div>

          <div className="flex items-center gap-1.5">
            <button
              onClick={handleToggleMute}
              className="p-2 rounded-xl bg-white/15 hover:bg-white/25 text-white transition-colors cursor-pointer"
              title={isMuted ? 'Unmute siren' : 'Mute siren'}
              aria-label={isMuted ? 'Unmute siren' : 'Mute siren'}
            >
              {isMuted ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4 animate-pulse" />}
            </button>
            <button
              onClick={onDismiss}
              className="p-2 rounded-xl bg-white/15 hover:bg-white/25 text-white transition-colors cursor-pointer"
              title="Dismiss banner"
              aria-label="Dismiss banner"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Content Body */}
        <div className="p-6 space-y-5">
          {/* Patient Card */}
          <div className="bg-rose-50/70 border-2 border-rose-200 rounded-2xl p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex items-center gap-3.5">
              <div className="w-13 h-13 rounded-2xl bg-rose-600 text-white font-black text-xl flex items-center justify-center shadow-md">
                {(alert.patient_name || patient?.name || 'P')[0]}
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="text-lg font-black text-slate-900">
                    {alert.patient_name || patient?.name || 'Assigned Patient'}
                  </h3>
                  <span className="px-2 py-0.5 rounded-full bg-rose-200 text-rose-900 text-[11px] font-black">
                    SOS Pressed
                  </span>
                </div>
                <div className="flex items-center gap-3 text-xs text-slate-600 mt-0.5">
                  <span className="flex items-center gap-1 font-medium">
                    <Clock className="w-3.5 h-3.5 text-rose-500" />
                    {triggeredTime}
                  </span>
                  <span className="flex items-center gap-1 font-medium">
                    <MapPin className="w-3.5 h-3.5 text-rose-500" />
                    {patientLocation}
                  </span>
                </div>
              </div>
            </div>

            {/* Quick Call Action */}
            <a
              href={`tel:${patientPhone}`}
              className="px-4 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-black text-xs flex items-center justify-center gap-2 shadow-sm transition-transform active:scale-95 cursor-pointer no-underline"
            >
              <Phone className="w-4 h-4" />
              <span>Call Patient</span>
            </a>
          </div>

          {/* Broadcast Message Box */}
          <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4 space-y-1">
            <span className="text-[11px] font-black uppercase text-slate-500 tracking-wider">
              Beacon Dispatch Log
            </span>
            <p className="text-sm font-semibold text-slate-800 leading-relaxed">
              {alert.message}
            </p>
          </div>

          {/* Emergency Safety Protocol Info */}
          <div className="bg-amber-50/80 border border-amber-200 rounded-2xl p-3.5 text-xs text-amber-900 flex items-start gap-2.5">
            <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
            <div className="leading-snug">
              <strong className="font-bold">Protocol:</strong> Please verify the patient's immediate physical safety via voice or video call. If unresponsive, contact local emergency dispatch (112 / Assam State Ambulance 108).
            </div>
          </div>

          {/* Action Button Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
            {onViewPatient && (alert.user_id || patient?.id) && (
              <button
                type="button"
                onClick={() => onViewPatient(alert.user_id || patient!.id)}
                className="w-full py-3 px-4 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold text-xs flex items-center justify-center gap-2 transition-colors cursor-pointer border border-slate-300"
              >
                <ExternalLink className="w-4 h-4 text-slate-600" />
                <span>Open Patient Profile & Trends</span>
              </button>
            )}

            <button
              type="button"
              onClick={handleResolve}
              className="w-full py-3 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-black text-xs flex items-center justify-center gap-2 shadow-md transition-all cursor-pointer"
            >
              <CheckCircle2 className="w-4 h-4" />
              <span>Mark Patient Safe & Clear SOS</span>
            </button>
          </div>
        </div>

        {/* Footer Disclaimer */}
        <div className="bg-slate-50 px-6 py-3 border-t border-slate-200 flex items-center justify-between text-[11px] text-slate-500 font-medium">
          <span>Smaran Sathi Emergency Sentinel</span>
          <span>Assam & North East India Telemetry</span>
        </div>
      </div>
    </div>
  );
};
