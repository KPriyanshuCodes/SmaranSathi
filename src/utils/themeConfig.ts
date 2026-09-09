import { UIThemePalette, UILayoutMode } from '../types';

export interface ThemeDefinition {
  id: UIThemePalette;
  name: string;
  region: string;
  colors: string[];
  bgClass: string;
  bgHex: string;
  headerGradient: string;
  headerBorder: string;
  cardBorder: string;
  accentColor: string;
  textColor: string;
  description: string;
  clinicalRationale: string;
  previewClass: string;
}

export const THEME_CONFIGS: Record<UIThemePalette, ThemeDefinition> = {
  default: {
    id: 'default',
    name: 'Azure Seafoam Mint',
    region: 'North East Heritage Modern',
    colors: ['#2794EB', '#17B3C1', '#47D6B6', '#BFF8D4'],
    bgClass: 'bg-[#F8FAFC]',
    bgHex: '#F8FAFC',
    headerGradient: 'linear-gradient(to right, #2794EB, #17B3C1, #47D6B6, #BFF8D4)',
    headerBorder: '#47D6B6',
    cardBorder: 'border-[#47D6B6]',
    accentColor: '#2794EB',
    textColor: 'text-[#1E293B]',
    description: 'Vibrant azure sky blue, peacock teal, turquoise seafoam, and pastel mint.',
    clinicalRationale: 'Harmonious blue-to-mint gradient designed for cognitive focus, visual clarity, and calm circadian stimulation.',
    previewClass: 'from-[#2794EB] via-[#17B3C1] to-[#47D6B6]',
  },
  terracotta: {
    id: 'terracotta',
    name: 'Majuli Sunset & Terracotta',
    region: 'River Island & Eri Silk',
    colors: ['#FED7AA', '#FDBA74', '#FB923C', '#EA580C'],
    bgClass: 'bg-[#FFFBEB]',
    bgHex: '#FFFBEB',
    headerGradient: 'linear-gradient(to right, #FED7AA, #FDBA74, #FB923C, #EA580C)',
    headerBorder: '#FB923C',
    cardBorder: 'border-[#FDBA74]',
    accentColor: '#EA580C',
    textColor: 'text-stone-900',
    description: 'Warm river clay, golden Muga silk, and sandstone warmth. Familiar, comforting, and grounded.',
    clinicalRationale: 'Warm earth tones resonate with traditional rural households, reducing institutional anxiety.',
    previewClass: 'from-[#FED7AA] via-[#FDBA74] to-[#EA580C]',
  },
  pine: {
    id: 'pine',
    name: 'Shillong Pine & Slate',
    region: 'Meghalaya Highlands',
    colors: ['#A7F3D0', '#6EE7B7', '#10B981', '#047857'],
    bgClass: 'bg-[#F0FDF4]',
    bgHex: '#F0FDF4',
    headerGradient: 'linear-gradient(to right, #A7F3D0, #6EE7B7, #10B981, #047857)',
    headerBorder: '#10B981',
    cardBorder: 'border-[#6EE7B7]',
    accentColor: '#047857',
    textColor: 'text-slate-900',
    description: 'Deep pine needles, cool mountain mist, and hospital-grade crisp slate typography.',
    clinicalRationale: 'High optical clarity and deep greens enhance text legibility for cataract-affected vision.',
    previewClass: 'from-[#A7F3D0] via-[#6EE7B7] to-[#047857]',
  },
  sundown: {
    id: 'sundown',
    name: 'Sundowning Amber Glow',
    region: 'Circadian Evening Care',
    colors: ['#FDE68A', '#F59E0B', '#D97706', '#78350F'],
    bgClass: 'bg-[#18181B]',
    bgHex: '#18181B',
    headerGradient: 'linear-gradient(to right, #78350F, #92400E, #B45309, #D97706)',
    headerBorder: '#B45309',
    cardBorder: 'border-amber-600/60',
    accentColor: '#F59E0B',
    textColor: 'text-amber-100',
    description: '590nm warm amber spectrum with deep charcoal background. Eliminates melatonin-disrupting blue light.',
    clinicalRationale: 'Scientifically proven to calm twilight restlessness (Sundowning syndrome) and promote restful sleep.',
    previewClass: 'from-[#78350F] via-[#B45309] to-[#F59E0B]',
  },
  dzukou: {
    id: 'dzukou',
    name: 'Dzukou Valley Lily',
    region: 'Nagaland & Manipur Alpine',
    colors: ['#E9D5FF', '#D8B4FE', '#C084FC', '#7E22CE'],
    bgClass: 'bg-[#FAF5FF]',
    bgHex: '#FAF5FF',
    headerGradient: 'linear-gradient(to right, #E9D5FF, #D8B4FE, #C084FC, #7E22CE)',
    headerBorder: '#C084FC',
    cardBorder: 'border-[#D8B4FE]',
    accentColor: '#7E22CE',
    textColor: 'text-slate-900',
    description: 'Soft alpine violet, mountain lilac, and calming rhododendron blossoms.',
    clinicalRationale: 'Gentle lavender spectrum reduces agitation, eases respiration, and stabilizes emotional memory.',
    previewClass: 'from-[#E9D5FF] via-[#C084FC] to-[#7E22CE]',
  },
  kanchenjunga: {
    id: 'kanchenjunga',
    name: 'Kanchenjunga Sunrise',
    region: 'Sikkim Himalayan Dawn',
    colors: ['#FECDD3', '#FDA4AF', '#F43F5E', '#1E1B4B'],
    bgClass: 'bg-[#FFF1F2]',
    bgHex: '#FFF1F2',
    headerGradient: 'linear-gradient(to right, #FECDD3, #FDA4AF, #F43F5E, #1E1B4B)',
    headerBorder: '#FDA4AF',
    cardBorder: 'border-[#FDA4AF]',
    accentColor: '#E11D48',
    textColor: 'text-slate-900',
    description: 'Himalayan rose dawn, morning snow warmth, and deep royal indigo precision.',
    clinicalRationale: 'Gentle warm rose boosts daytime alertness and creates an affectionate, friendly atmosphere.',
    previewClass: 'from-[#FECDD3] via-[#F43F5E] to-[#1E1B4B]',
  },
  monochrome: {
    id: 'monochrome',
    name: 'Clinical High-Contrast AAA',
    region: 'Accessibility Certified Spec',
    colors: ['#FFFFFF', '#E4E4E7', '#71717A', '#09090B'],
    bgClass: 'bg-[#FFFFFF]',
    bgHex: '#FFFFFF',
    headerGradient: 'linear-gradient(to right, #09090B, #18181B, #27272A, #09090B)',
    headerBorder: '#52525B',
    cardBorder: 'border-slate-900',
    accentColor: '#09090B',
    textColor: 'text-black',
    description: 'Maximum 21:1 WCAG AAA contrast ratio with bold geometric borders and zero color ambiguity.',
    clinicalRationale: 'Engineered for advanced glaucoma, severe macular degeneration, and extreme visual impairment.',
    previewClass: 'from-black via-zinc-800 to-black',
  },
};
