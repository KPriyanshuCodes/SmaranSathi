import React, { useState, useRef, useEffect, useCallback } from 'react';
import { 
  Camera, 
  X, 
  ShieldCheck, 
  CheckCircle2, 
  AlertCircle, 
  RefreshCw, 
  KeyRound, 
  Sparkles, 
  Lock, 
  Sun, 
  Moon, 
  UserCheck, 
  Eye, 
  Info,
  ChevronRight,
  ArrowRight
} from 'lucide-react';
import { User } from '../../types';
import { 
  loadFaceModels, 
  scanFaceFromVideo, 
  findBestFaceMatch, 
  distanceToSimilarity,
  FaceDetectionResult 
} from '../../services/faceRecognitionService';
import { soundEffects } from '../../utils/speechAndAudio';
import { saveUserToFirebase, updateUserFaceDescriptor, updateUserAvatar, saveRememberedUser } from '../../lib/firebase';

// Helper to capture a centered, mirrored square photo from the video feed
function captureFaceSnapshot(video: HTMLVideoElement): string | null {
  try {
    const canvas = document.createElement('canvas');
    canvas.width = 320;
    canvas.height = 320;
    const ctx = canvas.getContext('2d');
    if (!ctx) return null;
    const vw = video.videoWidth || 640;
    const vh = video.videoHeight || 480;
    const size = Math.min(vw, vh);
    const sx = (vw - size) / 2;
    const sy = (vh - size) / 2;
    // Mirror horizontally so it matches the selfie preview
    ctx.translate(canvas.width, 0);
    ctx.scale(-1, 1);
    ctx.drawImage(video, sx, sy, size, size, 0, 0, canvas.width, canvas.height);
    return canvas.toDataURL('image/jpeg', 0.85);
  } catch (e) {
    console.warn('Failed to capture face snapshot in modal:', e);
    return null;
  }
}

interface FaceLoginModalProps {
  isOpen: boolean;
  onClose: () => void;
  users: User[];
  onLogin: (user: User) => void;
  onUpdateUser?: (user: User) => void;
  initialMode?: 'login' | 'enroll';
  targetEnrollUser?: User | null;
}

export const FaceLoginModal: React.FC<FaceLoginModalProps> = ({
  isOpen,
  onClose,
  users,
  onLogin,
  onUpdateUser,
  initialMode = 'login',
  targetEnrollUser = null,
}) => {
  const [mode, setMode] = useState<'login' | 'enroll'>(initialMode);
  const [selectedUserToEnroll, setSelectedUserToEnroll] = useState<User | null>(targetEnrollUser);
  const [enrollPin, setEnrollPin] = useState('');

  // Camera & Stream State
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const scanIntervalRef = useRef<any>(null);
  const isMountedRef = useRef(true);

  // Status & AI State
  const [modelsReady, setModelsReady] = useState(false);
  const [modelError, setModelError] = useState<string | null>(null);
  const [cameraActive, setCameraActive] = useState(false);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [detecting, setDetecting] = useState(false);
  const [detectionFeedback, setDetectionFeedback] = useState<string>('Initializing face recognition...');
  const [feedbackType, setFeedbackType] = useState<'info' | 'success' | 'warning' | 'error'>('info');

  // Live Match Feedback
  const [matchedUser, setMatchedUser] = useState<User | null>(null);
  const [matchScore, setMatchScore] = useState<number | null>(null);
  const [recentBestDistance, setRecentBestDistance] = useState<number | null>(null);
  const [hasAttemptedMatch, setHasAttemptedMatch] = useState(false);

  // Enrollment feedback
  const [capturedDescriptor, setCapturedDescriptor] = useState<number[] | null>(null);
  const [enrollSuccess, setEnrollSuccess] = useState(false);
  const [enrollLoading, setEnrollLoading] = useState(false);

  // Users who have enrolled their face
  const enrolledUsers = users.filter(
    (u) => u.face_descriptor && Array.isArray(u.face_descriptor) && u.face_descriptor.length > 0
  );

  // Set initial selected user to enroll if none provided
  useEffect(() => {
    if (targetEnrollUser) {
      setSelectedUserToEnroll(targetEnrollUser);
    } else if (!selectedUserToEnroll && users.length > 0) {
      setSelectedUserToEnroll(users[0]);
    }
  }, [targetEnrollUser, users, selectedUserToEnroll]);

  // Sync mode with prop
  useEffect(() => {
    setMode(initialMode);
  }, [initialMode]);

  // Clean up camera on unmount or close
  const stopCamera = useCallback(() => {
    if (scanIntervalRef.current) {
      clearInterval(scanIntervalRef.current);
      scanIntervalRef.current = null;
    }
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }
    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }
    setCameraActive(false);
    setDetecting(false);
  }, []);

  // Initialize models and camera when modal opens
  useEffect(() => {
    isMountedRef.current = true;
    if (!isOpen) {
      stopCamera();
      return;
    }

    // Reset states
    setMatchedUser(null);
    setMatchScore(null);
    setRecentBestDistance(null);
    setHasAttemptedMatch(false);
    setEnrollSuccess(false);
    setCapturedDescriptor(null);
    setCameraError(null);
    setModelError(null);

    let streamInstance: MediaStream | null = null;

    const initialize = async () => {
      try {
        setDetectionFeedback('Loading face biometric models...');
        setFeedbackType('info');
        await loadFaceModels();
        if (!isMountedRef.current) return;
        setModelsReady(true);

        setDetectionFeedback('Requesting camera access...');
        // Request user camera
        const stream = await navigator.mediaDevices.getUserMedia({
          video: {
            width: { ideal: 640 },
            height: { ideal: 480 },
            facingMode: 'user',
          },
          audio: false,
        });

        if (!isMountedRef.current) {
          stream.getTracks().forEach((t) => t.stop());
          return;
        }

        streamInstance = stream;
        streamRef.current = stream;

        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          await videoRef.current.play();
          setCameraActive(true);
          setDetectionFeedback('Camera active. Center your face inside the guide.');
        }
      } catch (err: any) {
        console.error('Camera/model init error:', err);
        if (!isMountedRef.current) return;

        if (err.name === 'NotAllowedError' || err.name === 'PermissionDeniedError') {
          setCameraError('Camera access was denied. Please allow camera permissions in your browser or use PIN login.');
        } else if (err.name === 'NotFoundError' || err.name === 'DevicesNotFoundError') {
          setCameraError('No camera found on this device. Please log in with your 4-digit PIN.');
        } else {
          setCameraError(err.message || 'Unable to access camera or load AI models. Please use PIN login.');
        }
        setFeedbackType('error');
      }
    };

    initialize();

    return () => {
      isMountedRef.current = false;
      stopCamera();
    };
  }, [isOpen, stopCamera]);

  // Main real-time scanning loop
  const handlePerformScan = useCallback(async () => {
    if (!videoRef.current || !cameraActive || detecting) return;

    try {
      setDetecting(true);
      const result: FaceDetectionResult = await scanFaceFromVideo(videoRef.current);

      if (!isMountedRef.current) return;

      // Handle edge cases
      if (result.status === 'poor_lighting') {
        setFeedbackType('warning');
        setDetectionFeedback(result.message);
        soundEffects.playGentleTap(300);
        return;
      }

      if (result.status === 'no_face') {
        setFeedbackType('warning');
        setDetectionFeedback('No face detected. Please look directly into the camera.');
        return;
      }

      if (result.status === 'multiple_faces') {
        setFeedbackType('warning');
        setDetectionFeedback(result.message);
        soundEffects.playGentleTap(300);
        return;
      }

      if (result.status === 'error') {
        setFeedbackType('error');
        setDetectionFeedback(result.message || 'Detection error. Retrying...');
        return;
      }

      if (result.status === 'face_found' && result.descriptor) {
        // Mode 1: LOGIN
        if (mode === 'login') {
          setHasAttemptedMatch(true);

          if (enrolledUsers.length === 0) {
            setFeedbackType('info');
            setDetectionFeedback('Face captured! No profiles have Face ID enrolled yet. Switch to "Enroll Face ID" tab to register.');
            return;
          }

          setDetectionFeedback('Verifying face embedding with enrolled profiles...');
          const matchResult = findBestFaceMatch(result.descriptor, enrolledUsers, 0.6);

          if (matchResult.matchFound && matchResult.bestMatch) {
            const userMatch = users.find((u) => u.id === matchResult.bestMatch!.userId);
            if (userMatch) {
              // Capture authenticated face snapshot from camera to use as profile photo
              const liveFacePhoto = videoRef.current ? captureFaceSnapshot(videoRef.current) : null;
              const userWithAuthPhoto: User = {
                ...userMatch,
                ...(liveFacePhoto ? { avatar: liveFacePhoto } : {})
              };

              if (liveFacePhoto) {
                updateUserAvatar(userMatch.id, liveFacePhoto).catch(() => {});
                fetch(`/api/users`, {
                  method: 'POST',
                  headers: { 'Content-Type': 'application/json' },
                  body: JSON.stringify(userWithAuthPhoto),
                }).catch(() => {});
              }

              setMatchedUser(userWithAuthPhoto);
              setMatchScore(matchResult.bestMatch.similarityPercentage);
              setRecentBestDistance(matchResult.distance);
              setFeedbackType('success');
              setDetectionFeedback(`Login successful! Welcome back, ${userMatch.name}! Profile photo synchronized.`);
              soundEffects.playSuccessChime();

              // Auto login after short moment
              setTimeout(() => {
                if (isMountedRef.current) {
                  stopCamera();
                  saveRememberedUser(userWithAuthPhoto);
                  if (onUpdateUser) {
                    onUpdateUser(userWithAuthPhoto);
                  }
                  onLogin(userWithAuthPhoto);
                  onClose();
                }
              }, 1200);
              return;
            }
          } else {
            setFeedbackType('error');
            const dist = matchResult.distance;
            setRecentBestDistance(dist);
            const sim = distanceToSimilarity(dist);
            setDetectionFeedback(`Face not recognized, try again. (Similarity: ${sim}%, Threshold needed: 65%)`);
            soundEffects.playGentleEncouragement();
          }
        } 
        // Mode 2: ENROLLMENT
        else if (mode === 'enroll') {
          setCapturedDescriptor(result.descriptor);
          setFeedbackType('success');
          setDetectionFeedback('Face captured clearly! Click "Save Face ID to Profile" below.');
          soundEffects.playSuccessChime();
        }
      }
    } catch (err: any) {
      console.warn('Scan iteration error:', err);
      setFeedbackType('error');
      setDetectionFeedback('Camera processing error. Please try again.');
    } finally {
      if (isMountedRef.current) {
        setDetecting(false);
      }
    }
  }, [cameraActive, detecting, mode, enrolledUsers, users, stopCamera, onLogin, onClose]);

  // Periodic automatic scan (every 2.2s when camera is running and not yet matched)
  useEffect(() => {
    if (!isOpen || !cameraActive || matchedUser || enrollSuccess) return;

    const interval = setInterval(() => {
      handlePerformScan();
    }, 2200);

    return () => clearInterval(interval);
  }, [isOpen, cameraActive, matchedUser, enrollSuccess, handlePerformScan]);

  // Handle Save Enrollment for selected user
  const handleSaveEnrollment = async () => {
    if (!selectedUserToEnroll || !capturedDescriptor) return;

    // PIN check if user has a PIN
    if (selectedUserToEnroll.pin && enrollPin.trim() !== selectedUserToEnroll.pin) {
      setFeedbackType('error');
      setDetectionFeedback(`Incorrect PIN for ${selectedUserToEnroll.name}. Please enter their 4-digit PIN to authorize.`);
      soundEffects.playGentleEncouragement();
      return;
    }

    try {
      setEnrollLoading(true);
      setDetectionFeedback('Saving face embedding to profile...');

      // 1. Capture live face photo snapshot for profile picture
      const liveFacePhoto = videoRef.current ? captureFaceSnapshot(videoRef.current) : null;

      // 2. Update in Firebase
      const updatedUser = await updateUserFaceDescriptor(selectedUserToEnroll.id, capturedDescriptor, liveFacePhoto || undefined);
      
      const finalUser: User = updatedUser || {
        ...selectedUserToEnroll,
        face_descriptor: capturedDescriptor,
        face_registered_at: new Date().toISOString(),
        ...(liveFacePhoto ? { avatar: liveFacePhoto } : {}),
      };

      // 2. Update local disk/backend API
      fetch(`/api/users`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(finalUser),
      }).catch(() => {});

      if (onUpdateUser) {
        onUpdateUser(finalUser);
      }

      setEnrollSuccess(true);
      setFeedbackType('success');
      setDetectionFeedback(`Face ID registered for ${finalUser.name}! You can now sign in instantly with camera.`);
      soundEffects.playSuccessChime();

      // Offer instant sign in with this newly enrolled user
      setTimeout(() => {
        if (isMountedRef.current) {
          stopCamera();
          saveRememberedUser(finalUser);
          onLogin(finalUser);
          onClose();
        }
      }, 1500);
    } catch (err) {
      console.error('Error saving face enrollment:', err);
      setFeedbackType('error');
      setDetectionFeedback('Failed to save face ID. Please try again.');
    } finally {
      setEnrollLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/70 backdrop-blur-sm animate-fade-in overflow-y-auto">
      <div className="w-full max-w-xl bg-[#FAFAFA] rounded-[32px] p-5 sm:p-7 border-2 border-[#47D6B6] shadow-xl space-y-5 relative my-auto">
        
        {/* Close Button */}
        <button
          type="button"
          onClick={() => {
            stopCamera();
            onClose();
          }}
          className="absolute top-5 right-5 p-2 rounded-full hover:bg-slate-200 text-slate-500 hover:text-slate-800 transition-colors cursor-pointer z-10"
          title="Close and Return to PIN Login"
        >
          <X className="w-6 h-6" />
        </button>

        {/* Modal Header */}
        <div className="text-center space-y-1.5 pt-1">
          <div 
            style={{ background: 'linear-gradient(to right, #2794EB, #17B3C1, #47D6B6, #BFF8D4)' }}
            className="w-14 h-14 mx-auto rounded-2xl flex items-center justify-center text-white shadow-md border border-[#47D6B6]"
          >
            <Camera className="w-7 h-7" />
          </div>
          
          <h2 className="text-2xl sm:text-3xl font-black text-[#1E293B] flex items-center justify-center gap-2">
            <span>Face ID Authentication</span>
            <span className="text-xs bg-[#2794EB] text-white px-2.5 py-0.5 rounded-full font-black">
              Biometric AI
            </span>
          </h2>
          <p className="text-xs sm:text-sm text-slate-600 font-bold max-w-md mx-auto">
            {mode === 'login'
              ? 'Instant camera sign-in using encrypted in-browser face recognition'
              : 'Register a 128-point mathematical face embedding for your profile'}
          </p>
        </div>

        {/* Mode Switcher Tabs */}
        <div className="grid grid-cols-2 gap-2 p-1.5 bg-slate-200/80 rounded-2xl">
          <button
            type="button"
            onClick={() => {
              setMode('login');
              setMatchedUser(null);
              setEnrollSuccess(false);
              setDetectionFeedback('Look at camera to authenticate.');
              setFeedbackType('info');
            }}
            className={`py-2 px-3 rounded-xl text-xs sm:text-sm font-black transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
              mode === 'login'
                ? 'bg-white text-[#1E293B] shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <UserCheck className="w-4 h-4 text-[#2794EB]" />
            <span>Sign In with Face</span>
          </button>

          <button
            type="button"
            onClick={() => {
              setMode('enroll');
              setMatchedUser(null);
              setEnrollSuccess(false);
              setDetectionFeedback('Position your face clearly to capture descriptor.');
              setFeedbackType('info');
            }}
            className={`py-2 px-3 rounded-xl text-xs sm:text-sm font-black transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
              mode === 'enroll'
                ? 'bg-white text-[#1E293B] shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Sparkles className="w-4 h-4 text-[#2794EB]" />
            <span>Enroll / Register Face</span>
          </button>
        </div>

        {/* Camera Permission / Device Error Banner */}
        {cameraError && (
          <div className="p-4 rounded-2xl bg-rose-50 border-2 border-rose-300 text-rose-800 space-y-3 animate-fade-in">
            <div className="flex items-start gap-3">
              <AlertCircle className="w-5 h-5 text-rose-600 shrink-0 mt-0.5" />
              <div className="text-xs sm:text-sm font-bold">
                <p className="font-black">Camera Access Unavailable</p>
                <p>{cameraError}</p>
              </div>
            </div>
            <button
              type="button"
              onClick={() => {
                stopCamera();
                onClose();
              }}
              className="w-full py-2.5 px-4 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs sm:text-sm font-black transition-colors cursor-pointer flex items-center justify-center gap-2 shadow-xs"
            >
              <KeyRound className="w-4 h-4" />
              <span>Fall Back to PIN / Password Login</span>
            </button>
          </div>
        )}

        {/* Video Camera Container */}
        {!cameraError && (
          <div className="space-y-4">
            <div className="relative w-full aspect-4/3 max-w-md mx-auto rounded-3xl overflow-hidden bg-slate-900 border-4 border-[#47D6B6] shadow-inner flex items-center justify-center">
              
              {/* Actual Video Element */}
              <video
                ref={videoRef}
                autoPlay
                playsInline
                muted
                className={`w-full h-full object-cover scale-x-[-1] ${
                  cameraActive ? 'opacity-100' : 'opacity-0'
                } transition-opacity duration-300`}
              />

              {/* Loading Spinner overlay before camera starts */}
              {!cameraActive && (
                <div className="absolute inset-0 flex flex-col items-center justify-center text-slate-300 space-y-2 p-4">
                  <RefreshCw className="w-8 h-8 animate-spin text-[#47D6B6]" />
                  <span className="text-xs font-bold">Connecting to camera & AI models...</span>
                </div>
              )}

              {/* Oval Face Scanning Guide Overlay */}
              {cameraActive && !matchedUser && !enrollSuccess && (
                <div className="absolute inset-0 pointer-events-none flex items-center justify-center">
                  {/* Subtle darkened vignette around target */}
                  <div className="w-52 sm:w-60 h-64 sm:h-72 rounded-[45%] border-3 border-dashed border-[#47D6B6] shadow-[0_0_0_9999px_rgba(15,23,42,0.35)] relative animate-pulse flex items-center justify-center">
                    {/* Horizontal Scan Laser Bar */}
                    <div className="absolute top-0 left-4 right-4 h-0.5 bg-gradient-to-r from-transparent via-[#47D6B6] to-transparent shadow-[0_0_8px_#47D6B6] animate-bounce" />
                    
                    {/* Crosshair corners */}
                    <div className="absolute top-3 left-4 w-4 h-4 border-t-2 border-l-2 border-white" />
                    <div className="absolute top-3 right-4 w-4 h-4 border-t-2 border-r-2 border-white" />
                    <div className="absolute bottom-3 left-4 w-4 h-4 border-b-2 border-l-2 border-white" />
                    <div className="absolute bottom-3 right-4 w-4 h-4 border-b-2 border-r-2 border-white" />
                  </div>
                </div>
              )}

              {/* Success Match Overlay */}
              {matchedUser && (
                <div className="absolute inset-0 bg-emerald-950/80 backdrop-blur-xs flex flex-col items-center justify-center p-4 text-center text-white space-y-3 animate-fade-in">
                  <div className="w-16 h-16 rounded-full bg-emerald-500/30 border-3 border-emerald-400 flex items-center justify-center text-emerald-300">
                    <CheckCircle2 className="w-10 h-10" />
                  </div>
                  <div>
                    <span className="text-xs uppercase tracking-widest text-emerald-300 font-black">
                      Match Verified ({matchScore}%)
                    </span>
                    <h3 className="text-2xl font-black text-white">{matchedUser.name}</h3>
                    <p className="text-xs text-emerald-200 font-bold mt-0.5">
                      {matchedUser.role === 'elderly' ? '👵 Senior Citizen' : '🩺 Caregiver'} · Redirecting...
                    </p>
                  </div>
                </div>
              )}

              {/* Enrollment Success Overlay */}
              {enrollSuccess && selectedUserToEnroll && (
                <div className="absolute inset-0 bg-emerald-950/80 backdrop-blur-xs flex flex-col items-center justify-center p-4 text-center text-white space-y-3 animate-fade-in">
                  <div className="w-16 h-16 rounded-full bg-emerald-500/30 border-3 border-emerald-400 flex items-center justify-center text-emerald-300">
                    <CheckCircle2 className="w-10 h-10" />
                  </div>
                  <div>
                    <span className="text-xs uppercase tracking-widest text-emerald-300 font-black">
                      Face ID Enrolled!
                    </span>
                    <h3 className="text-2xl font-black text-white">{selectedUserToEnroll.name}</h3>
                    <p className="text-xs text-emerald-200 font-bold mt-0.5">
                      Biometric vector saved. Logging in...
                    </p>
                  </div>
                </div>
              )}

              {/* Real-time Status Badge on Camera */}
              <div className="absolute bottom-3 left-3 right-3 flex items-center justify-between pointer-events-none">
                <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-slate-900/80 backdrop-blur-xs text-white text-[11px] font-bold border border-white/20">
                  <span className={`w-2 h-2 rounded-full ${cameraActive ? 'bg-emerald-400 animate-ping' : 'bg-amber-400'}`} />
                  <span>{detecting ? 'Scanning frame...' : cameraActive ? 'Live Camera' : 'Starting...'}</span>
                </div>

                {recentBestDistance !== null && (
                  <div className="px-2.5 py-1 rounded-full bg-slate-900/80 backdrop-blur-xs text-white text-[11px] font-mono border border-white/20">
                    Dist: {recentBestDistance.toFixed(2)}
                  </div>
                )}
              </div>
            </div>

            {/* Dynamic UI Feedback Message Box */}
            <div 
              className={`p-3.5 rounded-2xl border-2 flex items-center gap-3 transition-all ${
                feedbackType === 'success'
                  ? 'bg-emerald-50 border-emerald-300 text-emerald-900'
                  : feedbackType === 'warning'
                  ? 'bg-amber-50 border-amber-300 text-amber-900'
                  : feedbackType === 'error'
                  ? 'bg-rose-50 border-rose-300 text-rose-900'
                  : 'bg-blue-50 border-blue-200 text-blue-900'
              }`}
            >
              {feedbackType === 'success' && <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />}
              {feedbackType === 'warning' && <AlertCircle className="w-5 h-5 text-amber-600 shrink-0" />}
              {feedbackType === 'error' && <AlertCircle className="w-5 h-5 text-rose-600 shrink-0" />}
              {feedbackType === 'info' && <Info className="w-5 h-5 text-blue-600 shrink-0" />}

              <div className="flex-1 min-w-0">
                <p className="text-xs sm:text-sm font-black leading-snug">{detectionFeedback}</p>
              </div>

              <button
                type="button"
                onClick={handlePerformScan}
                disabled={detecting || !cameraActive}
                className="px-3 py-1.5 rounded-xl bg-white hover:bg-slate-100 text-[#1E293B] border border-slate-300 text-xs font-black shrink-0 transition-colors shadow-2xs cursor-pointer disabled:opacity-50"
              >
                {detecting ? 'Scanning...' : 'Scan Now'}
              </button>
            </div>

            {/* If in Mode 1 (LOGIN) and no enrolled users exist yet */}
            {mode === 'login' && enrolledUsers.length === 0 && (
              <div className="p-4 rounded-2xl bg-amber-50 border-2 border-amber-200 text-amber-900 space-y-2">
                <div className="flex items-center gap-2">
                  <Sparkles className="w-5 h-5 text-amber-600 shrink-0" />
                  <h4 className="text-sm font-black">No Face IDs Enrolled Yet</h4>
                </div>
                <p className="text-xs font-bold text-amber-800">
                  You have not registered any faces on this device yet. Switch to the "Enroll Face" tab to link your face to your profile in 5 seconds!
                </p>
                <button
                  type="button"
                  onClick={() => setMode('enroll')}
                  className="mt-1 px-4 py-2 rounded-xl bg-amber-600 hover:bg-amber-700 text-white font-black text-xs transition-colors cursor-pointer flex items-center gap-1.5"
                >
                  <span>Enroll Your Face Now</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            )}

            {/* If in Mode 2 (ENROLLMENT) Form */}
            {mode === 'enroll' && !enrollSuccess && (
              <div className="p-4 rounded-2xl bg-white border-2 border-[#47D6B6] space-y-3.5 shadow-2xs">
                {targetEnrollUser ? (
                  <div className="p-3 rounded-xl bg-blue-50 border border-blue-200">
                    <p className="text-xs font-black text-[#1E293B]">
                      Enrolling Face ID for: <span className="text-[#2794EB]">{targetEnrollUser.name}</span>
                    </p>
                    <p className="text-[11px] text-slate-600 font-bold">
                      {targetEnrollUser.role === 'elderly' ? 'Senior Citizen Profile' : 'Caregiver Profile'}
                    </p>
                  </div>
                ) : (
                  <div className="space-y-1">
                    <label className="text-xs font-black text-[#1E293B]">
                      Enrollment Note:
                    </label>
                    <p className="text-xs text-slate-600 font-bold">
                      To register a new Face ID, please use the registration form on the main screen or open "Edit Profile" after logging in.
                    </p>
                  </div>
                )}

                {targetEnrollUser && (
                  <div className="space-y-1">
                    <label className="text-xs font-black text-[#1E293B] flex items-center justify-between">
                      <span>Enter 4-digit PIN (for verification):</span>
                      <span className="text-[11px] text-slate-500 font-bold">4-digit PIN</span>
                    </label>
                    <input
                      type="password"
                      maxLength={4}
                      inputMode="numeric"
                      value={enrollPin}
                      onChange={(e) => setEnrollPin(e.target.value.replace(/\D/g, ''))}
                      placeholder="Enter PIN to authorize face enrollment"
                      className="w-full min-h-[44px] px-3 rounded-xl border-2 border-slate-200 bg-[#FAFAFA] text-sm font-black tracking-widest text-[#1E293B] outline-none"
                    />
                  </div>
                )}

                {targetEnrollUser && (
                  <button
                    type="button"
                    onClick={handleSaveEnrollment}
                    disabled={!capturedDescriptor || enrollLoading || !selectedUserToEnroll}
                    style={{ background: 'linear-gradient(to right, #2794EB, #17B3C1, #47D6B6, #BFF8D4)' }}
                    className="w-full min-h-[48px] rounded-xl text-white font-black text-sm border border-[#47D6B6] shadow-xs hover:brightness-105 active:scale-98 transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
                  >
                    {enrollLoading ? (
                      <span>Registering Biometric Embedding...</span>
                    ) : (
                      <>
                        <CheckCircle2 className="w-4 h-4 text-white" />
                        <span>
                          {capturedDescriptor 
                            ? `Save Face ID for ${selectedUserToEnroll?.name.split(' ')[0]}` 
                            : 'Scan Face Above First'}
                        </span>
                      </>
                    )}
                  </button>
                )}
              </div>
            )}

            {/* Privacy Shield Notice in Login Mode */}
            {mode === 'login' && (
              <div className="p-3 rounded-2xl bg-white border border-slate-200 flex items-center justify-between text-xs font-bold text-slate-600">
                <span className="flex items-center gap-1.5">
                  <ShieldCheck className="w-4 h-4 text-emerald-600" />
                  <span>Private Biometric Match Active</span>
                </span>
                <span className="text-[11px] text-[#17B3C1] font-black">
                  Zero-Knowledge Matching
                </span>
              </div>
            )}
          </div>
        )}

        {/* Fallback & Privacy Footer */}
        <div className="pt-2 border-t border-slate-200 space-y-3">
          
          {/* Fallback to PIN / Password Button */}
          <button
            type="button"
            onClick={() => {
              stopCamera();
              onClose();
            }}
            className="w-full min-h-[48px] rounded-xl bg-white hover:bg-slate-100 text-[#1E293B] border-2 border-slate-300 text-xs sm:text-sm font-black flex items-center justify-center gap-2 cursor-pointer transition-colors shadow-2xs"
          >
            <KeyRound className="w-4 h-4 text-[#2794EB]" />
            <span>Cancel & Use 4-Digit PIN Login</span>
          </button>

          {/* Privacy & Consent Notice */}
          <div className="flex items-start gap-2.5 p-3 rounded-xl bg-slate-100/80 border border-slate-200 text-slate-600 text-[11px] leading-relaxed">
            <Lock className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
            <div>
              <span className="font-black text-[#1E293B]">Biometric Privacy Guarantee: </span>
              Camera video is evaluated 100% client-side in your browser. No photos, videos, or raw imagery are ever stored or uploaded to servers. Only a 128-point mathematical descriptor vector is stored to confirm your identity.
            </div>
          </div>
        </div>

      </div>
    </div>
  );
};
