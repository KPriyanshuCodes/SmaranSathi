import React, { useState } from 'react';
import { 
  Palette, 
  Layout, 
  Sliders, 
  Layers, 
  Check, 
  Sparkles, 
  Volume2, 
  ShieldCheck, 
  X, 
  Smartphone, 
  Monitor, 
  Sun, 
  Moon, 
  Eye, 
  Heart, 
  Info,
  Play,
  RotateCcw,
  Zap,
  Activity,
  Award
} from 'lucide-react';
import { UILayoutMode, UIThemePalette, UITextScale, UIUXSettings } from '../../types';
import { soundEffects, speakText } from '../../utils/speechAndAudio';

interface DesignLayoutStudioModalProps {
  isOpen: boolean;
  onClose: () => void;
  settings: UIUXSettings;
  onUpdateSettings: (newSettings: Partial<UIUXSettings>) => void;
  currentRole: 'elderly' | 'caregiver';
}

export const DesignLayoutStudioModal: React.FC<DesignLayoutStudioModalProps> = ({
  isOpen,
  onClose,
  settings,
  onUpdateSettings,
  currentRole
}) => {
  const [activeTab, setActiveTab] = useState<'layouts' | 'themes' | 'accessibility' | 'components'>('layouts');
  const [sosHoldProgress, setSosHoldProgress] = useState<number>(0);
  const [sosHeldSuccess, setSosHeldSuccess] = useState<boolean>(false);
  const [previewChimePlayed, setPreviewChimePlayed] = useState<boolean>(false);

  if (!isOpen) return null;

  // Layout Archetypes
  const layoutOptions: {
    id: UILayoutMode;
    title: string;
    subtitle: string;
    badge: string;
    description: string;
    bestFor: string;
    features: string[];
    previewType: 'tactile' | 'bento' | 'split' | 'zen';
  }[] = [
    {
      id: 'standard',
      title: 'Tactile Senior Tablet',
      subtitle: 'Single-Focus Linear Hierarchy',
      badge: 'Senior Primary',
      description: 'Maximized touch boundaries (64px+) and distraction-free linear stack. Every button features high-contrast borders and dual audio-visual confirmation.',
      bestFor: 'Mild-to-moderate dementia, cognitive fatigue, assisted tablet use',
      features: [
        'Fitts\'s Law 64px touch targets',
        'Direct zero-menu linear layout',
        'Large voice readout trigger',
        'High optical contrast card borders'
      ],
      previewType: 'tactile'
    },
    {
      id: 'bento',
      title: 'Bento Grid Architecture',
      subtitle: 'Modular Ergonomic Matrix',
      badge: 'Modern & Adaptive',
      description: 'Contemporary asymmetric card grid presenting daily vitals, scheduled reminders, brain exercises, and cultural soundscapes in balanced visual harmony.',
      bestFor: 'Active aging, caregivers, desktop and wide-screen tablet displays',
      features: [
        '4-Quadrant ergonomic grid',
        'Micro-status cards with live badges',
        'Rapid one-touch task switching',
        'Balanced white space & visual hierarchy'
      ],
      previewType: 'bento'
    },
    {
      id: 'split',
      title: 'Clinical Split Console',
      subtitle: 'Dual-Pane Telemetry & Care',
      badge: 'Caregiver Command',
      description: 'Side-by-side cockpit: Senior active cognitive state and routine tracker on the left; real-time clinical notes, medication adherence, and alerts on the right.',
      bestFor: 'Clinical visits, family caregivers, remote telemetry monitoring',
      features: [
        'Dual-pane synchronized view',
        'Real-time cognitive progress curves',
        'Instant medication check-off',
        'Quick-action caregiver hotline'
      ],
      previewType: 'split'
    },
    {
      id: 'zen',
      title: 'Zen Calming / Sundowning',
      subtitle: 'Low-Stimulation Anti-Agitation',
      badge: 'Evening Comfort',
      description: 'Engineered specifically for evening sundowning confusion. Replaces complex grids with a solitary calming card, warm amber hue, and peaceful nature audio.',
      bestFor: 'Evening sundowning hours (4 PM - 8 PM), agitated seniors, sensory overload',
      features: [
        'Single-focus distraction-free card',
        'Low-blue warm ambient spectrum',
        'Subtle ambient nature soundscape',
        'Zero alarming colors or red warnings'
      ],
      previewType: 'zen'
    }
  ];

  // Theme Palettes
  const themeOptions: {
    id: UIThemePalette;
    name: string;
    region: string;
    colors: string[];
    bgPreview: string;
    description: string;
    clinicalRationale: string;
  }[] = [
    {
      id: 'default',
      name: 'Kaziranga Riverfront',
      region: 'Assam Brahmaputra Valley',
      colors: ['#C3F2D6', '#8DE5A6', '#6BC1B8', '#3E82F0'],
      bgPreview: 'bg-[#F8FAFC]',
      description: 'Fresh tea mint, jade leaf, and Brahmaputra sky blue. Uplifting, clean, and optimistic.',
      clinicalRationale: 'Cool greens and blues reduce stress hormones (cortisol) and encourage daytime focus.'
    },
    {
      id: 'terracotta',
      name: 'Majuli Sunset & Terracotta',
      region: 'River Island & Eri Silk',
      colors: ['#FED7AA', '#FDBA74', '#FB923C', '#EA580C'],
      bgPreview: 'bg-[#FFFBEB]',
      description: 'Warm river clay, golden Muga silk, and sandstone warmth. Familiar, comforting, and grounded.',
      clinicalRationale: 'Warm earth tones resonate with traditional rural North-Eastern households, reducing institutional anxiety.'
    },
    {
      id: 'pine',
      name: 'Shillong Pine & Slate',
      region: 'Meghalaya Highlands',
      colors: ['#A7F3D0', '#6EE7B7', '#10B981', '#047857'],
      bgPreview: 'bg-[#F0FDF4]',
      description: 'Deep pine needles, cool mountain mist, and hospital-grade crisp slate typography.',
      clinicalRationale: 'High optical clarity and deep greens enhance text legibility for cataract-affected vision.'
    },
    {
      id: 'sundown',
      name: 'Sundowning Amber Glow',
      region: 'Circadian Evening Care',
      colors: ['#FDE68A', '#F59E0B', '#D97706', '#B45309'],
      bgPreview: 'bg-[#18181B]',
      description: '590nm warm amber spectrum with deep charcoal background. Completely eliminates melatonin-disrupting blue light.',
      clinicalRationale: 'Scientifically proven to calm twilight restlessness (Sundowning syndrome) and promote restful sleep.'
    }
  ];

  const handleApplyLayout = (mode: UILayoutMode) => {
    soundEffects.playGentleTap(520);
    onUpdateSettings({ layoutMode: mode });
  };

  const handleApplyTheme = (theme: UIThemePalette) => {
    soundEffects.playSuccessChime();
    onUpdateSettings({ themePalette: theme });
  };

  // SOS Hold Demo
  const startSosHold = () => {
    setSosHeldSuccess(false);
    let cur = 0;
    const interval = setInterval(() => {
      cur += 10;
      if (cur >= 100) {
        clearInterval(interval);
        setSosHoldProgress(100);
        setSosHeldSuccess(true);
        soundEffects.playGentleEncouragement();
        speakText('Emergency alarm activated. Caregiver notified.', 'en');
      } else {
        setSosHoldProgress(cur);
      }
    }, 100);

    const cancelHold = () => {
      clearInterval(interval);
      setSosHoldProgress(0);
      window.removeEventListener('mouseup', cancelHold);
      window.removeEventListener('touchend', cancelHold);
    };

    window.addEventListener('mouseup', cancelHold);
    window.addEventListener('touchend', cancelHold);
  };

  return (
    <div 
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-black/60 backdrop-blur-sm overflow-y-auto animate-fadeIn"
      role="dialog"
      aria-modal="true"
      aria-labelledby="design-studio-title"
    >
      <div className="bg-white rounded-3xl shadow-2xl border-4 border-[#6BC1B8]/50 max-w-5xl w-full max-h-[92vh] flex flex-col overflow-hidden text-[#1E293B]">
        {/* Modal Header */}
        <div 
          style={{ background: 'linear-gradient(to right, #C3F2D6, #8DE5A6, #6BC1B8, #3E82F0)' }}
          className="px-6 py-4 border-b-2 border-[#6BC1B8]/40 flex items-center justify-between shrink-0"
        >
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-white/95 flex items-center justify-center shadow-md text-[#3E82F0]">
              <Palette className="w-7 h-7" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 id="design-studio-title" className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
                  UI/UX Design Studio & Layouts
                </h2>
                <span className="text-[11px] font-black uppercase px-2.5 py-0.5 rounded-full bg-white/90 text-blue-900 border border-blue-200">
                  Interactive Lab
                </span>
              </div>
              <p className="text-xs sm:text-sm font-bold text-slate-800">
                Explore custom layouts, regional color palettes, and dementia-focused accessibility ergonomics.
              </p>
            </div>
          </div>

          <button
            onClick={() => {
              soundEffects.playGentleTap();
              onClose();
            }}
            className="w-10 h-10 rounded-full bg-white/90 hover:bg-white text-slate-700 hover:text-red-600 flex items-center justify-center transition-colors shadow-sm cursor-pointer"
            aria-label="Close Design Studio"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Studio Navigation Tabs */}
        <div className="px-6 pt-3 pb-1 border-b border-slate-200 bg-slate-50 flex items-center gap-2 overflow-x-auto shrink-0">
          <button
            onClick={() => {
              soundEffects.playGentleTap();
              setActiveTab('layouts');
            }}
            className={`px-4 py-2.5 rounded-xl font-black text-xs sm:text-sm flex items-center gap-2 transition-all cursor-pointer ${
              activeTab === 'layouts'
                ? 'bg-white text-[#3E82F0] shadow-sm border-2 border-[#3E82F0]'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/60'
            }`}
          >
            <Layout className="w-4 h-4" />
            <span>Layout Archetypes ({layoutOptions.length})</span>
          </button>

          <button
            onClick={() => {
              soundEffects.playGentleTap();
              setActiveTab('themes');
            }}
            className={`px-4 py-2.5 rounded-xl font-black text-xs sm:text-sm flex items-center gap-2 transition-all cursor-pointer ${
              activeTab === 'themes'
                ? 'bg-white text-[#3E82F0] shadow-sm border-2 border-[#3E82F0]'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/60'
            }`}
          >
            <Palette className="w-4 h-4" />
            <span>Regional Themes ({themeOptions.length})</span>
          </button>

          <button
            onClick={() => {
              soundEffects.playGentleTap();
              setActiveTab('accessibility');
            }}
            className={`px-4 py-2.5 rounded-xl font-black text-xs sm:text-sm flex items-center gap-2 transition-all cursor-pointer ${
              activeTab === 'accessibility'
                ? 'bg-white text-[#3E82F0] shadow-sm border-2 border-[#3E82F0]'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/60'
            }`}
          >
            <Sliders className="w-4 h-4" />
            <span>Sensory & Accessibility Controls</span>
          </button>

          <button
            onClick={() => {
              soundEffects.playGentleTap();
              setActiveTab('components');
            }}
            className={`px-4 py-2.5 rounded-xl font-black text-xs sm:text-sm flex items-center gap-2 transition-all cursor-pointer ${
              activeTab === 'components'
                ? 'bg-white text-[#3E82F0] shadow-sm border-2 border-[#3E82F0]'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/60'
            }`}
          >
            <Layers className="w-4 h-4" />
            <span>Component Anatomy & Specimen</span>
          </button>
        </div>

        {/* Tab Content Area */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {/* TAB 1: LAYOUT ARCHETYPES */}
          {activeTab === 'layouts' && (
            <div className="space-y-6">
              <div className="bg-blue-50 border-2 border-blue-200 rounded-2xl p-4 flex items-start gap-3">
                <Info className="w-5 h-5 text-blue-600 shrink-0 mt-0.5" />
                <div className="text-xs sm:text-sm text-blue-950 font-medium">
                  <strong>Click "Apply to Active Interface"</strong> on any layout below to immediately rebuild the applet screen. All layouts respect clinical dementia ergonomics with zero accidental data loss.
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {layoutOptions.map((layout) => {
                  const isActive = settings.layoutMode === layout.id;
                  return (
                    <div
                      key={layout.id}
                      className={`p-6 rounded-3xl border-3 transition-all flex flex-col justify-between ${
                        isActive
                          ? 'border-[#3E82F0] bg-blue-50/40 shadow-lg ring-4 ring-blue-100'
                          : 'border-slate-200 bg-white hover:border-slate-300 shadow-sm'
                      }`}
                    >
                      <div>
                        {/* Header info */}
                        <div className="flex items-center justify-between gap-2 mb-2">
                          <span className="text-xs font-black uppercase px-2.5 py-0.5 rounded-full bg-slate-900 text-white">
                            {layout.badge}
                          </span>
                          {isActive && (
                            <span className="flex items-center gap-1 text-xs font-black text-emerald-700 bg-emerald-100 px-3 py-0.5 rounded-full">
                              <Check className="w-3.5 h-3.5" /> Active Layout
                            </span>
                          )}
                        </div>

                        <h3 className="text-xl font-black text-slate-900 leading-snug">
                          {layout.title}
                        </h3>
                        <p className="text-xs font-bold text-[#3E82F0] mb-3">
                          {layout.subtitle}
                        </p>

                        <p className="text-xs sm:text-sm text-slate-700 font-medium mb-4 leading-relaxed">
                          {layout.description}
                        </p>

                        {/* Visual Wireframe Preview Box */}
                        <div className="p-3 bg-slate-100 rounded-2xl border-2 border-slate-200 mb-4">
                          <span className="text-[10px] font-black uppercase text-slate-500 block mb-1.5">
                            Visual Layout Architecture
                          </span>
                          {layout.previewType === 'tactile' && (
                            <div className="space-y-1.5">
                              <div className="h-6 bg-blue-200 rounded-lg flex items-center justify-center text-[10px] font-bold text-blue-900">
                                🌸 Elder Welcome Banner & Voice Guide
                              </div>
                              <div className="grid grid-cols-2 gap-1.5">
                                <div className="h-10 bg-emerald-100 border border-emerald-300 rounded-lg flex items-center justify-center text-[10px] font-bold text-emerald-900">
                                  🎮 Large Game 1
                                </div>
                                <div className="h-10 bg-amber-100 border border-amber-300 rounded-lg flex items-center justify-center text-[10px] font-bold text-amber-900">
                                  🧩 Large Game 2
                                </div>
                              </div>
                              <div className="h-7 bg-white border border-slate-300 rounded-lg flex items-center justify-center text-[10px] font-bold text-slate-700">
                                ⏰ Today's Scheduled Reminders
                              </div>
                            </div>
                          )}

                          {layout.previewType === 'bento' && (
                            <div className="grid grid-cols-3 gap-1.5 h-24">
                              <div className="col-span-2 bg-blue-100 border border-blue-300 rounded-lg p-1.5 flex flex-col justify-between">
                                <span className="text-[9px] font-bold text-blue-900">🎯 Cognitive Index & Trends</span>
                                <div className="h-2 bg-blue-300 rounded-full w-3/4"></div>
                              </div>
                              <div className="bg-emerald-100 border border-emerald-300 rounded-lg p-1.5 flex flex-col justify-center items-center text-center">
                                <span className="text-[11px] font-black text-emerald-900">88%</span>
                                <span className="text-[8px] font-bold text-emerald-700">Adherence</span>
                              </div>
                              <div className="bg-amber-100 border border-amber-300 rounded-lg p-1.5 text-[9px] font-bold text-amber-900 flex items-center justify-center">
                                ⏰ Routine
                              </div>
                              <div className="col-span-2 bg-purple-100 border border-purple-300 rounded-lg p-1.5 text-[9px] font-bold text-purple-900 flex items-center justify-center">
                                🎵 Cultural Soundscapes
                              </div>
                            </div>
                          )}

                          {layout.previewType === 'split' && (
                            <div className="grid grid-cols-2 gap-2 h-24">
                              <div className="bg-white border border-blue-300 rounded-lg p-1.5 flex flex-col justify-between">
                                <span className="text-[9px] font-black text-blue-900">Left: Senior State</span>
                                <div className="space-y-1">
                                  <div className="h-2 bg-slate-200 rounded w-full"></div>
                                  <div className="h-2 bg-blue-200 rounded w-4/5"></div>
                                </div>
                                <span className="text-[8px] font-bold text-slate-500">Live Cognitive Feed</span>
                              </div>
                              <div className="bg-slate-50 border border-slate-300 rounded-lg p-1.5 flex flex-col justify-between">
                                <span className="text-[9px] font-black text-slate-900">Right: Clinical Care</span>
                                <div className="space-y-1">
                                  <div className="h-2 bg-emerald-200 rounded w-full"></div>
                                  <div className="h-2 bg-emerald-200 rounded w-2/3"></div>
                                </div>
                                <span className="text-[8px] font-bold text-slate-500">Meds & SOS Channel</span>
                              </div>
                            </div>
                          )}

                          {layout.previewType === 'zen' && (
                            <div className="h-24 bg-amber-950/90 border border-amber-700 rounded-lg p-2.5 flex flex-col justify-center items-center text-center space-y-1 text-amber-100">
                              <Moon className="w-5 h-5 text-amber-400" />
                              <span className="text-[10px] font-black text-amber-200">
                                Single Calming Card · Warm 590nm Ambient Glow
                              </span>
                              <span className="text-[8px] text-amber-300">
                                Soft bamboo flute & gentle memory recall
                              </span>
                            </div>
                          )}
                        </div>

                        {/* Feature bullets */}
                        <ul className="space-y-1 mb-4">
                          {layout.features.map((feat, idx) => (
                            <li key={idx} className="text-xs text-slate-600 flex items-center gap-1.5 font-medium">
                              <Sparkles className="w-3 h-3 text-[#3E82F0] shrink-0" />
                              <span>{feat}</span>
                            </li>
                          ))}
                        </ul>

                        <p className="text-[11px] text-slate-500 italic mb-4">
                          <strong>Clinical Recommendation:</strong> {layout.bestFor}
                        </p>
                      </div>

                      <button
                        onClick={() => handleApplyLayout(layout.id)}
                        disabled={isActive}
                        className={`w-full py-2.5 px-4 rounded-xl font-black text-xs sm:text-sm flex items-center justify-center gap-2 transition-all cursor-pointer ${
                          isActive
                            ? 'bg-slate-200 text-slate-500 cursor-default'
                            : 'bg-[#1E293B] hover:bg-[#3E82F0] text-white shadow-md active:scale-98'
                        }`}
                      >
                        {isActive ? (
                          <>
                            <Check className="w-4 h-4" /> Currently Applied
                          </>
                        ) : (
                          <>
                            <Zap className="w-4 h-4" /> Apply This Layout
                          </>
                        )}
                      </button>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* TAB 2: REGIONAL THEMES */}
          {activeTab === 'themes' && (
            <div className="space-y-6">
              <div className="bg-emerald-50 border-2 border-emerald-200 rounded-2xl p-4 flex items-start gap-3">
                <Palette className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
                <div className="text-xs sm:text-sm text-emerald-950 font-medium">
                  Regional color schemes are culturally tuned to North-Eastern flora, river ecosystems, and circadian light science. Selecting a theme transforms navigation bars, buttons, card borders, and accents instantly.
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {themeOptions.map((theme) => {
                  const isCurrentTheme = settings.themePalette === theme.id;
                  return (
                    <div
                      key={theme.id}
                      className={`p-6 rounded-3xl border-3 transition-all flex flex-col justify-between ${
                        isCurrentTheme
                          ? 'border-[#3E82F0] bg-blue-50/30 shadow-lg ring-4 ring-blue-100'
                          : 'border-slate-200 bg-white hover:border-slate-300 shadow-sm'
                      }`}
                    >
                      <div>
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-[11px] font-black uppercase text-slate-500 tracking-wider">
                            {theme.region}
                          </span>
                          {isCurrentTheme && (
                            <span className="text-xs font-black text-emerald-700 bg-emerald-100 px-2.5 py-0.5 rounded-full flex items-center gap-1">
                              <Check className="w-3 h-3" /> Active Theme
                            </span>
                          )}
                        </div>

                        <h3 className="text-xl font-black text-slate-900 mb-1">
                          {theme.name}
                        </h3>

                        {/* Swatch preview bar */}
                        <div className="flex items-center gap-2 my-3 p-2 bg-slate-100 rounded-2xl">
                          {theme.colors.map((c, i) => (
                            <div
                              key={i}
                              className="flex-1 h-8 rounded-xl shadow-xs border border-white/60 flex items-center justify-center text-[9px] font-bold text-slate-800"
                              style={{ backgroundColor: c }}
                            >
                              {c}
                            </div>
                          ))}
                        </div>

                        <p className="text-xs sm:text-sm text-slate-700 font-medium mb-3">
                          {theme.description}
                        </p>

                        <div className="bg-slate-50 p-3 rounded-xl border border-slate-200 mb-4">
                          <span className="text-[10px] font-black text-slate-500 uppercase block mb-0.5">
                            Clinical & Ergonomic Impact
                          </span>
                          <p className="text-xs text-slate-600 font-medium leading-relaxed">
                            {theme.clinicalRationale}
                          </p>
                        </div>
                      </div>

                      <button
                        onClick={() => handleApplyTheme(theme.id)}
                        disabled={isCurrentTheme}
                        className={`w-full py-2.5 px-4 rounded-xl font-black text-xs sm:text-sm flex items-center justify-center gap-2 transition-all cursor-pointer ${
                          isCurrentTheme
                            ? 'bg-slate-200 text-slate-500 cursor-default'
                            : 'bg-slate-900 hover:bg-[#3E82F0] text-white shadow-md active:scale-98'
                        }`}
                      >
                        {isCurrentTheme ? (
                          <>
                            <Check className="w-4 h-4" /> Applied
                          </>
                        ) : (
                          <>
                            <Palette className="w-4 h-4" /> Apply This Color Palette
                          </>
                        )}
                      </button>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* TAB 3: ACCESSIBILITY & SENSORY SCALING */}
          {activeTab === 'accessibility' && (
            <div className="space-y-6">
              {/* Text scaling */}
              <div className="p-6 rounded-3xl bg-slate-50 border-2 border-slate-200">
                <div className="flex items-center justify-between mb-3">
                  <div>
                    <h3 className="text-lg font-black text-slate-900 flex items-center gap-2">
                      <Eye className="w-5 h-5 text-[#3E82F0]" />
                      <span>Typography Scaling (Fitts's Law Hitboxes)</span>
                    </h3>
                    <p className="text-xs font-bold text-slate-600">
                      Scales all application fonts and automatically expands touch bounding boxes for seniors with hand tremors.
                    </p>
                  </div>
                  <span className="text-xs font-black uppercase px-2.5 py-1 rounded-full bg-blue-100 text-blue-900">
                    Active: {settings.textScale.toUpperCase()}
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  {(['normal', 'large', 'xlarge'] as UITextScale[]).map((scale) => (
                    <button
                      key={scale}
                      onClick={() => {
                        soundEffects.playGentleTap();
                        onUpdateSettings({ textScale: scale });
                      }}
                      className={`p-4 rounded-2xl border-2 text-left transition-all cursor-pointer ${
                        settings.textScale === scale
                          ? 'border-[#3E82F0] bg-white shadow-md ring-2 ring-blue-100'
                          : 'border-slate-200 bg-white/70 hover:bg-white'
                      }`}
                    >
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-xs font-black uppercase text-slate-900">
                          {scale === 'normal' ? 'Standard 100%' : scale === 'large' ? 'Senior Large 112%' : 'Senior XL 125%'}
                        </span>
                        {settings.textScale === scale && <Check className="w-4 h-4 text-emerald-600" />}
                      </div>
                      <p className={`font-bold text-slate-700 ${
                        scale === 'normal' ? 'text-sm' : scale === 'large' ? 'text-base' : 'text-lg'
                      }`}>
                        নমস্কাৰ · স্মৃতিসাথী
                      </p>
                      <span className="text-[10px] text-slate-500 block mt-1">
                        {scale === 'normal' ? 'Default density' : scale === 'large' ? 'Recommended for 65+' : 'Recommended for low vision'}
                      </span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Toggles */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {/* High Contrast */}
                <div className="p-5 rounded-3xl bg-slate-50 border-2 border-slate-200 flex flex-col justify-between">
                  <div>
                    <h4 className="text-sm font-black text-slate-900 mb-1 flex items-center gap-2">
                      <Sun className="w-4 h-4 text-amber-500" />
                      <span>Ultra High Contrast (WCAG AAA)</span>
                    </h4>
                    <p className="text-xs text-slate-600 font-medium mb-3">
                      Forces pure deep black typography and 2.5px solid borders to maximize edge clarity for cataract-impaired vision.
                    </p>
                  </div>
                  <button
                    onClick={() => {
                      soundEffects.playGentleTap();
                      onUpdateSettings({ highContrast: !settings.highContrast });
                    }}
                    className={`w-full py-2 px-3 rounded-xl font-black text-xs flex items-center justify-center gap-2 transition-all cursor-pointer ${
                      settings.highContrast
                        ? 'bg-emerald-600 text-white shadow-sm'
                        : 'bg-white border-2 border-slate-300 text-slate-700 hover:bg-slate-100'
                    }`}
                  >
                    {settings.highContrast ? '✓ High Contrast Enabled' : 'Enable High Contrast'}
                  </button>
                </div>

                {/* Haptic & Audio */}
                <div className="p-5 rounded-3xl bg-slate-50 border-2 border-slate-200 flex flex-col justify-between">
                  <div>
                    <h4 className="text-sm font-black text-slate-900 mb-1 flex items-center gap-2">
                      <Volume2 className="w-4 h-4 text-blue-500" />
                      <span>Dual-Sensory Audio Chimes</span>
                    </h4>
                    <p className="text-xs text-slate-600 font-medium mb-3">
                      Plays soothing frequency-tuned audio chimes on every button touch, assuring the patient that their touch registered.
                    </p>
                  </div>
                  <button
                    onClick={() => {
                      soundEffects.playSuccessChime();
                      onUpdateSettings({ hapticAudio: !settings.hapticAudio });
                    }}
                    className={`w-full py-2 px-3 rounded-xl font-black text-xs flex items-center justify-center gap-2 transition-all cursor-pointer ${
                      settings.hapticAudio
                        ? 'bg-emerald-600 text-white shadow-sm'
                        : 'bg-white border-2 border-slate-300 text-slate-700 hover:bg-slate-100'
                    }`}
                  >
                    {settings.hapticAudio ? '✓ Audio Chimes Active' : 'Enable Audio Feedback'}
                  </button>
                </div>

                {/* Reduced Motion */}
                <div className="p-5 rounded-3xl bg-slate-50 border-2 border-slate-200 flex flex-col justify-between">
                  <div>
                    <h4 className="text-sm font-black text-slate-900 mb-1 flex items-center gap-2">
                      <Activity className="w-4 h-4 text-purple-500" />
                      <span>Zero-Dizziness Reduced Motion</span>
                    </h4>
                    <p className="text-xs text-slate-600 font-medium mb-3">
                      Replaces zooming and sliding animations with gentle instant fades, preventing vestibular disorientation.
                    </p>
                  </div>
                  <button
                    onClick={() => {
                      soundEffects.playGentleTap();
                      onUpdateSettings({ reducedMotion: !settings.reducedMotion });
                    }}
                    className={`w-full py-2 px-3 rounded-xl font-black text-xs flex items-center justify-center gap-2 transition-all cursor-pointer ${
                      settings.reducedMotion
                        ? 'bg-emerald-600 text-white shadow-sm'
                        : 'bg-white border-2 border-slate-300 text-slate-700 hover:bg-slate-100'
                    }`}
                  >
                    {settings.reducedMotion ? '✓ Reduced Motion Active' : 'Enable Reduced Motion'}
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* TAB 4: COMPONENT ANATOMY & SPECIMEN */}
          {activeTab === 'components' && (
            <div className="space-y-6">
              <div className="bg-slate-50 border-2 border-slate-200 rounded-2xl p-4 flex items-start gap-3">
                <Layers className="w-5 h-5 text-[#3E82F0] shrink-0 mt-0.5" />
                <div className="text-xs sm:text-sm text-slate-800 font-medium">
                  <strong>Interactive UI Component Specimen</strong>: Try interacting with the specialized dementia-care UI elements below to understand the clinical interaction design behind them.
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* 1. Fitts's Law Button Test */}
                <div className="p-5 rounded-3xl bg-white border-2 border-slate-200 shadow-sm">
                  <div className="flex items-center justify-between mb-2">
                    <h4 className="text-sm font-black text-slate-900">
                      1. Fitts's Law 64px Touch Target vs 36px
                    </h4>
                    <span className="text-[10px] font-bold bg-blue-100 text-blue-800 px-2 py-0.5 rounded-full">
                      Anti-Tremor
                    </span>
                  </div>
                  <p className="text-xs text-slate-600 font-medium mb-3">
                    Standard web buttons are 36px tall, causing mis-clicks for seniors with Parkinson's or tremors. Our elderly controls are minimum 64px with 20px padding.
                  </p>

                  <div className="space-y-3 p-3 bg-slate-50 rounded-2xl border border-slate-200">
                    <div>
                      <span className="text-[10px] text-slate-500 font-bold block mb-1">
                        Elderly Target (64px height, high contrast, tactile)
                      </span>
                      <button
                        onClick={() => {
                          soundEffects.playGentleTap(520);
                          setPreviewChimePlayed(true);
                        }}
                        className="w-full min-h-[64px] px-6 py-3 rounded-2xl bg-gradient-to-r from-[#C3F2D6] to-[#8DE5A6] text-[#0F172A] font-black text-base border-2 border-[#6BC1B8] shadow-md flex items-center justify-between active:scale-98 cursor-pointer"
                      >
                        <span className="flex items-center gap-2">
                          <Sparkles className="w-5 h-5 text-emerald-700" />
                          <span>স্মৃতি খেলক (Play Memory Game)</span>
                        </span>
                        <span className="text-xs bg-white/80 px-2.5 py-1 rounded-full text-emerald-800">
                          Touch to Test
                        </span>
                      </button>
                    </div>

                    {previewChimePlayed && (
                      <p className="text-[11px] font-bold text-emerald-700 flex items-center gap-1">
                        <Check className="w-3.5 h-3.5" /> Audio Chime & Visual Haptic verified!
                      </p>
                    )}
                  </div>
                </div>

                {/* 2. Accident-Proof SOS Button */}
                <div className="p-5 rounded-3xl bg-white border-2 border-slate-200 shadow-sm">
                  <div className="flex items-center justify-between mb-2">
                    <h4 className="text-sm font-black text-slate-900">
                      2. Accident-Proof SOS Emergency Beacon
                    </h4>
                    <span className="text-[10px] font-bold bg-red-100 text-red-800 px-2 py-0.5 rounded-full">
                      Zero False Panic
                    </span>
                  </div>
                  <p className="text-xs text-slate-600 font-medium mb-3">
                    Instant one-tap SOS buttons cause frequent false panics. We utilize an animated 1-second press-and-hold confirmation bar.
                  </p>

                  <div className="p-3 bg-slate-50 rounded-2xl border border-slate-200 text-center">
                    <button
                      onMouseDown={startSosHold}
                      onTouchStart={startSosHold}
                      className="w-full min-h-[60px] relative overflow-hidden px-6 py-3 rounded-2xl bg-red-600 hover:bg-red-700 text-white font-black text-base shadow-md select-none cursor-pointer"
                    >
                      {/* Progress filling */}
                      <div 
                        className="absolute inset-0 bg-red-800/80 transition-all duration-75"
                        style={{ width: `${sosHoldProgress}%` }}
                      />
                      <span className="relative z-10 flex items-center justify-center gap-2">
                        <ShieldCheck className="w-5 h-5" />
                        <span>{sosHeldSuccess ? '🚨 Alert Sent to Caregiver!' : 'Press & Hold 1s for SOS'}</span>
                      </span>
                    </button>

                    <p className="text-[10px] text-slate-500 font-bold mt-2">
                      {sosHeldSuccess ? 'Simulated caregiver push notification sent.' : 'Press down and hold button to test the safe hold mechanic.'}
                    </p>
                  </div>
                </div>

                {/* 3. Dual-Sensory Routine Reminder */}
                <div className="p-5 rounded-3xl bg-white border-2 border-slate-200 shadow-sm">
                  <div className="flex items-center justify-between mb-2">
                    <h4 className="text-sm font-black text-slate-900">
                      3. Dual-Sensory Reminder Card
                    </h4>
                    <span className="text-[10px] font-bold bg-purple-100 text-purple-800 px-2 py-0.5 rounded-full">
                      Visual + Voice
                    </span>
                  </div>
                  <p className="text-xs text-slate-600 font-medium mb-3">
                    Memory loss impairs written text comprehension. Each scheduled item features speech readout in the senior's native dialect.
                  </p>

                  <div className="p-4 rounded-2xl bg-purple-50 border-2 border-purple-200 flex items-center justify-between gap-3">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-black text-purple-900">💊 08:30 AM</span>
                        <span className="text-[10px] bg-purple-200 text-purple-900 px-2 py-0.5 rounded-full font-bold">Daily</span>
                      </div>
                      <h5 className="text-sm font-black text-slate-900 mt-0.5">
                        Amlodipine 5mg & Morning Tea
                      </h5>
                      <p className="text-xs text-slate-600">
                        Take after breakfast with warm water.
                      </p>
                    </div>

                    <button
                      onClick={() => {
                        soundEffects.playGentleTap();
                        speakText('Time for morning medicine: Amlodipine with warm water.', 'en');
                      }}
                      className="px-3 py-2 rounded-xl bg-purple-600 hover:bg-purple-700 text-white text-xs font-black flex items-center gap-1.5 shrink-0 shadow-sm cursor-pointer"
                    >
                      <Volume2 className="w-4 h-4" />
                      <span>Speak</span>
                    </button>
                  </div>
                </div>

                {/* 4. Multilingual Cultural Typography */}
                <div className="p-5 rounded-3xl bg-white border-2 border-slate-200 shadow-sm">
                  <div className="flex items-center justify-between mb-2">
                    <h4 className="text-sm font-black text-slate-900">
                      4. Regional Multilingual Glyphs
                    </h4>
                    <span className="text-[10px] font-bold bg-amber-100 text-amber-800 px-2 py-0.5 rounded-full">
                      Cultural Grounding
                    </span>
                  </div>
                  <p className="text-xs text-slate-600 font-medium mb-3">
                    Dementia patients often regress to their native childhood dialect. We support high-legibility native unicode typefaces:
                  </p>

                  <div className="grid grid-cols-2 gap-2 text-center">
                    <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-200">
                      <span className="text-[10px] text-slate-500 font-bold block">অসমীয়া (Assamese)</span>
                      <span className="text-sm font-black text-slate-800">স্মৃতিসাথী</span>
                    </div>
                    <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-200">
                      <span className="text-[10px] text-slate-500 font-bold block">Khasi (Meghalaya)</span>
                      <span className="text-sm font-black text-slate-800">Kynmaw</span>
                    </div>
                    <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-200">
                      <span className="text-[10px] text-slate-500 font-bold block">মৈতৈলোন্ (Meitei)</span>
                      <span className="text-sm font-black text-slate-800">নীংশিংবা</span>
                    </div>
                    <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-200">
                      <span className="text-[10px] text-slate-500 font-bold block">हिन्दी (Hindi)</span>
                      <span className="text-sm font-black text-slate-800">स्मरण साथी</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Modal Footer with Active Summary & Dismiss */}
        <div className="px-6 py-4 bg-slate-100 border-t border-slate-200 flex flex-wrap items-center justify-between gap-3 shrink-0">
          <div className="flex items-center gap-3 text-xs font-bold text-slate-700">
            <span className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-blue-500"></span>
              <span>Layout: <strong>{layoutOptions.find(l => l.id === settings.layoutMode)?.title || settings.layoutMode}</strong></span>
            </span>
            <span>•</span>
            <span className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-500"></span>
              <span>Theme: <strong>{themeOptions.find(t => t.id === settings.themePalette)?.name || settings.themePalette}</strong></span>
            </span>
            <span>•</span>
            <span>Text Scale: <strong>{settings.textScale.toUpperCase()}</strong></span>
          </div>

          <button
            onClick={() => {
              soundEffects.playSuccessChime();
              onClose();
            }}
            className="px-6 py-2.5 rounded-xl bg-[#1E293B] hover:bg-[#3E82F0] text-white font-black text-xs sm:text-sm shadow-md transition-all cursor-pointer"
          >
            Done & Apply
          </button>
        </div>
      </div>
    </div>
  );
};
