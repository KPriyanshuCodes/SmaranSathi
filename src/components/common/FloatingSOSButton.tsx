import React, { useState, useEffect } from 'react';
import { AlertOctagon, PhoneCall, X, Check, ShieldAlert } from 'lucide-react';
import { soundEffects } from '../../utils/speechAndAudio';

interface FloatingSOSButtonProps {
  /** Optional custom trigger function passed from parent (e.g. App.tsx) */
  onTriggerSOS?: () => void | Promise<void>;
  /** Optional current user or patient name for personalized alert messaging */
  patientName?: string;
  /** Optional emergency contact or caregiver name */
  contactName?: string;
  /** Optional positioning class override */
  className?: string;
  /** Whether the container uses fixed positioning (default: true) */
  isFixed?: boolean;
}

/**
 * Placeholder triggerSOS function that can be implemented separately
 * (e.g., to send GPS location, trigger SMS dispatch, or ping emergency backend APIs).
 */
export const defaultTriggerSOS = async (details?: { patientName?: string; location?: string }): Promise<void> => {
  console.log('🚨 [triggerSOS Placeholder]: Initiating SOS emergency alert dispatch...', details);
};

export const FloatingSOSButton: React.FC<FloatingSOSButtonProps> = ({
  onTriggerSOS,
  patientName,
  contactName,
  className = "bottom-6 right-6 sm:bottom-8 sm:right-8",
  isFixed = true,
}) => {
  const [isModalOpen, setIsModalOpen] = useState<boolean>(false);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [isSuccess, setIsSuccess] = useState<boolean>(false);

  // Close on Escape key press
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isModalOpen) {
        setIsModalOpen(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isModalOpen]);

  // Open Confirmation Modal
  const handleOpenModal = () => {
    try {
      soundEffects.playGentleTap(440);
    } catch {}
    setIsModalOpen(true);
    setIsSuccess(false);
  };

  // Close Modal
  const handleCloseModal = () => {
    try {
      soundEffects.playGentleTap(300);
    } catch {}
    setIsModalOpen(false);
    setIsSubmitting(false);
    setIsSuccess(false);
  };

  // User confirmed SOS dispatch
  const handleConfirmSOS = async () => {
    setIsSubmitting(true);
    try {
      soundEffects.playGentleEncouragement();
    } catch {}

    try {
      // Execute custom or provided triggerSOS handler
      if (onTriggerSOS) {
        await onTriggerSOS();
      } else {
        await defaultTriggerSOS({ patientName });
      }

      setIsSuccess(true);
      // Automatically close modal after positive confirmation display
      setTimeout(() => {
        setIsModalOpen(false);
        setIsSubmitting(false);
        setIsSuccess(false);
      }, 2200);
    } catch (error) {
      console.error('Failed to trigger SOS alert:', error);
      setIsSubmitting(false);
      setIsModalOpen(false);
    }
  };

  return (
    <>
      {/* SOS Button Container */}
      <aside
        id="floating-sos-container"
        aria-label="Emergency SOS Assistance"
        className={isFixed ? `fixed ${className} z-[9999] pointer-events-auto` : `relative z-30 flex items-center justify-center pointer-events-auto shrink-0 ${className !== "bottom-6 right-6 sm:bottom-8 sm:right-8" ? className : ''}`}
      >
        <button
          id="floating-sos-button"
          type="button"
          onClick={handleOpenModal}
          title="Press for Emergency SOS Assistance"
          aria-haspopup="dialog"
          aria-expanded={isModalOpen}
          className="group relative flex items-center justify-center gap-1.5 sm:gap-2 h-9 sm:h-11 px-3.5 sm:px-5 rounded-full bg-[#FF3B30] hover:bg-[#E03126] text-white border-2 border-white/90 shadow-[0_4px_16px_rgba(255,59,48,0.45)] hover:shadow-[0_6px_24px_rgba(255,59,48,0.65)] hover:scale-105 active:scale-95 transition-all duration-200 cursor-pointer animate-sos-glow focus:outline-none focus:ring-4 focus:ring-red-400/50"
        >
          {/* Subtle Beacon Indicator Ping */}
          <span className="relative flex h-2.5 w-2.5 sm:h-3 sm:w-3 shrink-0">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-white opacity-75" />
            <span className="relative inline-flex rounded-full h-2.5 w-2.5 sm:h-3 sm:w-3 bg-white shadow-xs" />
          </span>

          {/* White Bold "SOS" Text */}
          <span className="font-black text-xs sm:text-sm tracking-wider uppercase drop-shadow-xs select-none">
            SOS
          </span>

          {/* Emergency helper label for desktop */}
          <span className="hidden sm:inline text-[11px] font-extrabold uppercase opacity-95 tracking-wide border-l border-white/40 pl-2 select-none">
            Emergency
          </span>
        </button>
      </aside>

      {/* Accidental Tap Prevention Confirmation Modal */}
      {isModalOpen && (
        <div
          id="sos-modal-backdrop"
          role="dialog"
          aria-modal="true"
          aria-labelledby="sos-modal-title"
          className="fixed inset-0 z-[10000] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm transition-opacity animate-in fade-in duration-150"
          onClick={handleCloseModal}
        >
          <div
            id="sos-modal-dialog"
            onClick={(e) => e.stopPropagation()}
            className="w-full max-w-md bg-white rounded-3xl p-6 sm:p-8 border-3 border-red-500 shadow-2xl space-y-6 text-center transform transition-all animate-in zoom-in-95 duration-200"
          >
            {isSuccess ? (
              /* Success confirmation state */
              <div className="space-y-4 py-3">
                <div className="w-16 h-16 rounded-full bg-emerald-100 text-emerald-600 border-2 border-emerald-400 flex items-center justify-center mx-auto shadow-md">
                  <Check className="w-9 h-9 stroke-[3]" />
                </div>
                <div className="space-y-1.5">
                  <h3 className="text-xl sm:text-2xl font-black text-slate-900">
                    SOS Alert Dispatched!
                  </h3>
                  <p className="text-sm text-slate-600 font-medium">
                    {contactName 
                      ? `Urgent alert and location notified to ${contactName}. Help is on the way!`
                      : 'Urgent distress notification and location sent to designated caregivers.'}
                  </p>
                </div>
                <div className="pt-2">
                  <span className="inline-block px-3 py-1 bg-emerald-50 text-emerald-800 border border-emerald-300 rounded-full text-xs font-bold">
                    Assistance Request Active
                  </span>
                </div>
              </div>
            ) : (
              /* Initial Confirmation Form */
              <>
                {/* Header Icon */}
                <div className="flex justify-center">
                  <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-3xl bg-red-100 border-2 border-red-400 flex items-center justify-center text-[#FF3B30] shadow-md">
                    <ShieldAlert className="w-9 h-9 sm:w-11 sm:h-11" />
                  </div>
                </div>

                {/* Prompt Title & Subtitle */}
                <div className="space-y-2">
                  <h3
                    id="sos-modal-title"
                    className="text-xl sm:text-2xl font-black text-[#1E293B] leading-snug"
                  >
                    Do you want to send an SOS alert?
                  </h3>
                  <p className="text-xs sm:text-sm text-slate-600 font-medium leading-relaxed max-w-xs mx-auto">
                    This will immediately notify your designated caregivers and emergency contacts with your current status and location.
                  </p>
                </div>

                {/* Patient/Contact context note if available */}
                {contactName && (
                  <div className="p-3 bg-red-50/80 border border-red-200 rounded-2xl flex items-center justify-center gap-2 text-xs font-bold text-red-900">
                    <PhoneCall className="w-4 h-4 text-red-600 shrink-0" />
                    <span>Designated Responder: {contactName}</span>
                  </div>
                )}

                {/* Action Buttons: Confirm & Cancel */}
                <div className="flex flex-col-reverse sm:flex-row items-center gap-3 pt-2">
                  {/* Cancel Button */}
                  <button
                    id="sos-modal-cancel-btn"
                    type="button"
                    disabled={isSubmitting}
                    onClick={handleCloseModal}
                    className="w-full sm:w-1/2 py-3 px-4 rounded-2xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-black text-sm sm:text-base border-2 border-slate-300 transition-colors cursor-pointer active:scale-95 disabled:opacity-50"
                  >
                    Cancel
                  </button>

                  {/* Confirm Button */}
                  <button
                    id="sos-modal-confirm-btn"
                    type="button"
                    disabled={isSubmitting}
                    onClick={handleConfirmSOS}
                    className="w-full sm:w-1/2 py-3 px-4 rounded-2xl bg-[#FF3B30] hover:bg-[#E03126] text-white font-black text-sm sm:text-base border-2 border-red-700 shadow-md transition-all cursor-pointer active:scale-95 disabled:opacity-60 flex items-center justify-center gap-2"
                  >
                    {isSubmitting ? (
                      <span className="flex items-center gap-2">
                        <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                        <span>Sending...</span>
                      </span>
                    ) : (
                      <>
                        <AlertOctagon className="w-5 h-5" />
                        <span>Confirm</span>
                      </>
                    )}
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </>
  );
};
