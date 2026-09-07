export type UserRole = 'elderly' | 'caregiver';

export type RegionalLanguage = 'en' | 'as' | 'kha' | 'mni' | 'hi';

export type DementiaStage = 'early' | 'mild' | 'moderate' | 'healthy_aging';

export interface User {
  id: string;
  patient_id?: string;
  name: string;
  role: UserRole;
  language_pref: RegionalLanguage;
  pin: string;
  phone?: string;
  caregiver_code?: string;
  connected_caregiver_id?: string;
  connected_caregiver_name?: string;
  age?: number;
  location?: string;
  diagnosis_note?: string;
  location_sharing?: boolean;
  avatar?: string;
  created_at: string;
  dementia_stage?: DementiaStage;
  care_goals?: string[];
  emergency_contact?: {
    name: string;
    phone: string;
    relation: string;
  };
  onboarded?: boolean;
  face_descriptor?: number[] | null;
  face_registered_at?: string | null;
}

export interface CaregiverLink {
  id: string;
  caregiver_id: string;
  elderly_id: string;
  relation: string;
}

export type GameType = 
  | 'memory_match' 
  | 'sequence_recall' 
  | 'picture_recognition' 
  | 'simple_puzzle' 
  | 'face_match';

export type DifficultyLevel = 'easy' | 'medium' | 'hard';

export interface GameSession {
  id: string;
  user_id: string;
  game_type: GameType;
  accuracy: number; // 0 to 100 percentage
  response_time: number; // average response time in seconds
  attempts: number;
  mistakes: number;
  completion_rate: number; // 0 to 100
  difficulty_level: DifficultyLevel;
  stars: number; // 1, 2, or 3
  completed_at: string;
}

export interface PerformanceTrend {
  user_id: string;
  period: string; // e.g., 'Week of Oct 12' or '2026-09-01'
  avg_accuracy: number;
  avg_response_time: number;
  engagement_score: number; // 0 to 100 rolling score
  games_count: number;
  baseline_accuracy: number;
  deviation_from_baseline_pct: number;
}

export type ReminderType = 
  | 'medication' 
  | 'meal' 
  | 'appointment' 
  | 'exercise' 
  | 'hydration' 
  | 'memory_game' 
  | 'family_call' 
  | 'chai_time';

export type RecurrenceType = 
  | 'daily' 
  | 'weekly' 
  | 'as_needed' 
  | 'weekdays' 
  | 'specific_time';

export type ReminderPriority = 'high' | 'medium' | 'gentle';

export interface Reminder {
  id: string;
  user_id: string;
  type: ReminderType;
  title: string;
  time: string; // "08:30 AM"
  recurrence: RecurrenceType;
  instructions?: string;
  completed: boolean;
  created_by: string;
  created_at: string;
  scheduled_date?: string;
  priority?: ReminderPriority;
  audio_chime?: boolean;
  spoken_prompt?: string;
}

export interface FamiliarPerson {
  id: string;
  user_id: string;
  name: string;
  relation: string;
  photo_url: string;
  notes?: string;
  voice_prompt?: string;
  phone?: string;
}

export type AlertType = 'sos' | 'missed_reminder' | 'deviation';

export interface Alert {
  id: string;
  user_id: string;
  patient_name?: string;
  type: AlertType;
  message: string;
  triggered_at: string;
  resolved: boolean;
  resolved_at?: string;
  lat?: number;
  lng?: number;
}

export interface AIRecommendation {
  recommended_difficulty: DifficultyLevel;
  next_game_type: GameType;
  engagement_score: number;
  rationale: string;
  observation_note: string;
  ethical_disclaimer: string;
  recent_trend: 'improving' | 'stable' | 'attention_needed';
}

export interface CulturalItem {
  id: string;
  name: Record<RegionalLanguage, string>;
  category: 'fruit' | 'animal' | 'festival' | 'craft' | 'monument' | 'attire';
  image_url: string;
  state_origin: string; // Assam, Meghalaya, Manipur, Nagaland, etc.
  description: Record<RegionalLanguage, string>;
}

// -------------------------------------------------------------
// Ecosystem Extended Types
// -------------------------------------------------------------

export interface MemoryJournalEntry {
  id: string;
  user_id: string;
  title: string;
  content: string;
  media_type: 'text' | 'audio' | 'photo' | 'video';
  media_url?: string;
  audio_duration?: string;
  location_tag?: string;
  emotion: 'joy' | 'peaceful' | 'nostalgic' | 'reflective';
  created_at: string;
}

export interface MedicationSchedule {
  id: string;
  user_id: string;
  med_name: string;
  dosage: string;
  timing: 'morning' | 'afternoon' | 'evening' | 'bedtime';
  time_str: string;
  purpose: string;
  taken_today: boolean;
  last_taken_at?: string;
}

export interface ConsultationDoctor {
  id: string;
  name: string;
  specialty: string;
  hospital: string;
  location: string;
  available_days: string;
  consult_fee: string;
  avatar: string;
  rating: number;
}

export interface ConsultationAppointment {
  id: string;
  user_id: string;
  doctor_id: string;
  doctor_name: string;
  specialty: string;
  hospital: string;
  date: string;
  time: string;
  status: 'confirmed' | 'completed' | 'scheduled';
  notes: string;
}

export interface ForumPost {
  id: string;
  author_name: string;
  author_role: string;
  location: string;
  title: string;
  content: string;
  tags: string[];
  likes: number;
  replies_count: number;
  created_at: string;
}

export interface DataLakeSummary {
  raw_records_count: number;
  cleansed_records_count: number;
  features_extracted: string[];
  model_accuracy: number;
  ethical_compliance_pct: number;
  anonymized: boolean;
  training_epochs: number;
  last_training_time: string;
}

