import React, { useState, useRef, useEffect, useCallback } from 'react';
import { Camera, CheckCircle2, AlertCircle, RefreshCw, X, ShieldCheck, Lock } from 'lucide-react';
import { loadFaceModels, scanFaceFromVideo, FaceDetectionResult } from '../../services/faceRecognitionService';
import { soundEffects } from '../../utils/speechAndAudio';

interface FaceRegistrationScannerProps {
  isOpen: boolean;
  onClose: () => void;
  onFaceCaptured: (descriptor: number[]) => void;
  userName?: string;
}

export const FaceRegistrationScanner: React.FC<FaceRegistrationScannerProps> = ({
  isOpen,
  onClose,
  onFaceCaptured,
  userName = 'User',
}) => {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const isMountedRef = useRef(true);

  const [cameraActive, setCameraActive] = useState(false);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [detecting, setDetecting] = useState(false);
  const [statusMessage, setStatusMessage] = useState('Starting camera & AI models...');
  const [statusType, setStatusType] = useState<'info' | 'success' | 'warning' | 'error'>('info');
  const [captured, setCaptured] = useState(false);

  const stopCamera = useCallback(() => {
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

  useEffect(() => {
    isMountedRef.current = true;
    if (!isOpen) {
      stopCamera();
      return;
    }

    setCaptured(false);
    setCameraError(null);
    setStatusMessage('Loading Face Recognition AI...');
    setStatusType('info');

    const start = async () => {
      try {
        await loadFaceModels();
        if (!isMountedRef.current) return;

        setStatusMessage('Requesting camera access...');
        const stream = await navigator.mediaDevices.getUserMedia({
          video: { width: { ideal: 640 }, height: { ideal: 480 }, facingMode: 'user' },
          audio: false,
        });

        if (!isMountedRef.current) {
          stream.getTracks().forEach((t) => t.stop());
          return;
        }

        streamRef.current = stream;
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          await videoRef.current.play();
          setCameraActive(true);
          setStatusMessage('Center your face in the oval guide.');
        }
      } catch (err: any) {
        if (!isMountedRef.current) return;
        if (err.name === 'NotAllowedError') {
          setCameraError('Camera access was denied in your browser.');
        } else {
          setCameraError(err.message || 'Unable to open camera.');
        }
        setStatusType('error');
      }
    };

    start();

    return () => {
      isMountedRef.current = false;
      stopCamera();
    };
  }, [isOpen, stopCamera]);

  const handleCapture = async () => {
    if (!videoRef.current || !cameraActive || detecting) return;

    try {
      setDetecting(true);
      setStatusMessage('Analyzing facial geometry...');
      setStatusType('info');

      const result: FaceDetectionResult = await scanFaceFromVideo(videoRef.current);
      if (!isMountedRef.current) return;

      if (result.status === 'poor_lighting') {
        setStatusType('warning');
        setStatusMessage(result.message);
        soundEffects.playGentleTap(300);
        return;
      }

      if (result.status === 'no_face') {
        setStatusType('warning');
        setStatusMessage('No face detected. Please face the camera squarely.');
        return;
      }

      if (result.status === 'multiple_faces') {
        setStatusType('warning');
        setStatusMessage('Multiple faces detected. Ensure only you are in frame.');
        return;
      }

      if (result.status === 'face_found' && result.descriptor) {
        setCaptured(true);
        setStatusType('success');
        setStatusMessage('Face biometric descriptor generated successfully (128 values)!');
        soundEffects.playSuccessChime();

        setTimeout(() => {
          if (isMountedRef.current) {
            onFaceCaptured(result.descriptor!);
            stopCamera();
            onClose();
          }
        }, 1000);
      }
    } catch (err: any) {
      setStatusType('error');
      setStatusMessage('Error scanning face. Please try again.');
    } finally {
      if (isMountedRef.current) {
        setDetecting(false);
      }
    }
  };

  // Auto scan every 2 seconds when open
  useEffect(() => {
    if (!isOpen || !cameraActive || captured) return;
    const interval = setInterval(() => {
      handleCapture();
    }, 2000);
    return () => clearInterval(interval);
  }, [isOpen, cameraActive, captured]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-3 bg-slate-900/70 backdrop-blur-sm animate-fade-in">
      <div className="w-full max-w-md bg-[#FAFAFA] rounded-3xl p-5 border-2 border-[#8DE5A6] shadow-xl space-y-4 relative">
        <button
          type="button"
          onClick={() => {
            stopCamera();
            onClose();
          }}
          className="absolute top-4 right-4 p-1.5 rounded-full hover:bg-slate-200 text-slate-500 cursor-pointer"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="text-center space-y-1">
          <h3 className="text-xl font-black text-[#1E293B] flex items-center justify-center gap-2">
            <Camera className="w-5 h-5 text-[#3E82F0]" />
            <span>Face ID Registration</span>
          </h3>
          <p className="text-xs font-bold text-slate-600">
            Scanning biometric embedding for <span className="text-[#3E82F0]">{userName}</span>
          </p>
        </div>

        {cameraError ? (
          <div className="p-4 rounded-2xl bg-rose-50 border border-rose-200 text-rose-800 text-xs font-bold space-y-2">
            <p className="font-black">Camera Unavailable</p>
            <p>{cameraError}</p>
            <button
              type="button"
              onClick={onClose}
              className="w-full py-2 bg-rose-600 text-white rounded-xl font-black mt-2"
            >
              Continue without Face ID
            </button>
          </div>
        ) : (
          <div className="space-y-3">
            <div className="relative w-full aspect-4/3 rounded-2xl overflow-hidden bg-slate-900 border-2 border-[#8DE5A6] flex items-center justify-center">
              <video
                ref={videoRef}
                autoPlay
                playsInline
                muted
                className={`w-full h-full object-cover scale-x-[-1] ${
                  cameraActive ? 'opacity-100' : 'opacity-0'
                }`}
              />

              {!cameraActive && (
                <div className="absolute inset-0 flex flex-col items-center justify-center text-slate-400 text-xs font-bold gap-2">
                  <RefreshCw className="w-6 h-6 animate-spin text-[#8DE5A6]" />
                  <span>Loading camera...</span>
                </div>
              )}

              {cameraActive && !captured && (
                <div className="absolute inset-0 pointer-events-none flex items-center justify-center">
                  <div className="w-44 h-56 rounded-[45%] border-2 border-dashed border-[#8DE5A6] animate-pulse" />
                </div>
              )}

              {captured && (
                <div className="absolute inset-0 bg-emerald-950/80 flex flex-col items-center justify-center text-white text-center p-4">
                  <CheckCircle2 className="w-12 h-12 text-emerald-400 mb-2" />
                  <span className="font-black text-lg">Face Captured!</span>
                  <span className="text-xs text-emerald-200 font-bold">Saving 128-point descriptor...</span>
                </div>
              )}
            </div>

            <div
              className={`p-3 rounded-xl border text-xs font-black flex items-center gap-2 ${
                statusType === 'success'
                  ? 'bg-emerald-50 border-emerald-300 text-emerald-900'
                  : statusType === 'warning'
                  ? 'bg-amber-50 border-amber-300 text-amber-900'
                  : statusType === 'error'
                  ? 'bg-rose-50 border-rose-300 text-rose-900'
                  : 'bg-blue-50 border-blue-200 text-blue-900'
              }`}
            >
              {statusType === 'success' ? (
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
              ) : statusType === 'warning' ? (
                <AlertCircle className="w-4 h-4 text-amber-600 shrink-0" />
              ) : (
                <ShieldCheck className="w-4 h-4 text-blue-600 shrink-0" />
              )}
              <span className="flex-1">{statusMessage}</span>
            </div>

            <div className="flex gap-2">
              <button
                type="button"
                onClick={onClose}
                className="flex-1 py-2.5 rounded-xl border border-slate-300 text-slate-700 text-xs font-black hover:bg-slate-100 transition-colors"
              >
                Skip / Do Later
              </button>
              <button
                type="button"
                onClick={handleCapture}
                disabled={detecting || !cameraActive || captured}
                style={{ background: 'linear-gradient(to right, #C3F2D6, #8DE5A6, #6BC1B8, #3E82F0)' }}
                className="flex-1 py-2.5 rounded-xl text-[#0F172A] text-xs font-black border border-[#6BC1B8] shadow-xs cursor-pointer disabled:opacity-50"
              >
                {detecting ? 'Analyzing...' : 'Capture Face'}
              </button>
            </div>
          </div>
        )}

        <div className="flex items-center gap-2 text-[10px] text-slate-500 font-bold justify-center">
          <Lock className="w-3 h-3 text-emerald-600" />
          <span>Privacy: Only a numerical vector is saved, never photos.</span>
        </div>
      </div>
    </div>
  );
};
