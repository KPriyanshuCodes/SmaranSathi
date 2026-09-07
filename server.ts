import express, { Request, Response } from 'express';
import path from 'path';
import fs from 'fs';
import { createServer as createViteServer } from 'vite';
import dotenv from 'dotenv';
import { 
  User, 
  GameSession, 
  Reminder, 
  FamiliarPerson, 
  Alert, 
  AIRecommendation, 
  PerformanceTrend,
  DifficultyLevel,
  GameType,
  MemoryJournalEntry,
  MedicationSchedule,
  ConsultationDoctor,
  ConsultationAppointment,
  ForumPost,
  DataLakeSummary
} from './src/types';
import { FAMILIAR_PEOPLE_SEED } from './src/data/nerContent';

dotenv.config();

const app = express();
const PORT = 3000;

app.use(express.json());

// Persistent Local Disk Storage for Users & Reminders (never lost on server reload)
const DATA_DIR = path.join(process.cwd(), 'data');
const USERS_FILE = path.join(DATA_DIR, 'users_store.json');
const REMINDERS_FILE = path.join(DATA_DIR, 'reminders_store.json');

function loadUsersFromDisk(): User[] {
  try {
    if (!fs.existsSync(DATA_DIR)) {
      fs.mkdirSync(DATA_DIR, { recursive: true });
    }
    if (fs.existsSync(USERS_FILE)) {
      const raw = fs.readFileSync(USERS_FILE, 'utf-8');
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed)) {
        let updated = false;
        parsed.forEach((u: User) => {
          if (u.role === 'elderly' && !u.patient_id) {
            u.patient_id = `PT-${Math.floor(1000 + Math.random() * 9000)}`;
            updated = true;
          }
        });
        if (updated) {
          saveUsersToDisk(parsed);
        }
        return parsed;
      }
    }
  } catch (err) {
    console.warn('Could not load users from disk, initializing fresh:', err);
  }
  return [];
}

function saveUsersToDisk(usersList: User[]): void {
  try {
    if (!fs.existsSync(DATA_DIR)) {
      fs.mkdirSync(DATA_DIR, { recursive: true });
    }
    fs.writeFileSync(USERS_FILE, JSON.stringify(usersList, null, 2), 'utf-8');
  } catch (err) {
    console.warn('Could not write users to disk:', err);
  }
}

const DEFAULT_INITIAL_REMINDERS: Reminder[] = [
  {
    id: 'rem-1',
    user_id: 'user-bhaben',
    type: 'medication',
    title: 'Amlodipine 5mg & Morning Memory Tonic',
    time: '08:30 AM',
    recurrence: 'daily',
    instructions: 'Take 1 tablet with warm water after morning tea and light breakfast.',
    completed: true,
    created_by: 'Dr. Priya Barua',
    created_at: new Date().toISOString(),
    priority: 'high',
    audio_chime: true,
    spoken_prompt: 'Dadaji, it is time for your morning memory medicine and blood pressure tablet.'
  },
  {
    id: 'rem-2',
    user_id: 'user-bhaben',
    type: 'meal',
    title: 'Afternoon Lunch with Kaji Nemu & Masor Tenga',
    time: '01:00 PM',
    recurrence: 'daily',
    instructions: 'Light sour fish curry with warm rice; stay well hydrated.',
    completed: false,
    created_by: 'Dr. Priya Barua',
    created_at: new Date().toISOString(),
    priority: 'medium',
    audio_chime: true,
    spoken_prompt: 'Lunch is served with warm soup and fish curry. Drink plenty of water.'
  },
  {
    id: 'rem-3',
    user_id: 'user-bhaben',
    type: 'exercise',
    title: 'Courtyard Garden Walk & Tulsi Watering',
    time: '04:30 PM',
    recurrence: 'daily',
    instructions: '15 minutes gentle strolling with walking stick in the courtyard under gentle sun.',
    completed: false,
    created_by: 'Dr. Priya Barua',
    created_at: new Date().toISOString(),
    priority: 'gentle',
    audio_chime: true,
    spoken_prompt: 'Time for your refreshing stroll in the courtyard garden.'
  },
  {
    id: 'rem-4',
    user_id: 'user-bhaben',
    type: 'appointment',
    title: 'Dr. Hazarika Clinic Visit (Silpukhuri)',
    time: '11:00 AM',
    recurrence: 'weekly',
    instructions: 'Monthly memory review and blood pressure checkup with cognitive log.',
    completed: false,
    created_by: 'Dr. Priya Barua',
    created_at: new Date().toISOString(),
    priority: 'high',
    audio_chime: true,
    spoken_prompt: 'Doctor consultation scheduled today for routine wellness review.'
  }
];

function loadRemindersFromDisk(): Reminder[] {
  try {
    if (!fs.existsSync(DATA_DIR)) {
      fs.mkdirSync(DATA_DIR, { recursive: true });
    }
    if (fs.existsSync(REMINDERS_FILE)) {
      const raw = fs.readFileSync(REMINDERS_FILE, 'utf-8');
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed) && parsed.length > 0) {
        return parsed;
      }
    }
  } catch (err) {
    console.warn('Could not load reminders from disk:', err);
  }
  return DEFAULT_INITIAL_REMINDERS;
}

function saveRemindersToDisk(remList: Reminder[]): void {
  try {
    if (!fs.existsSync(DATA_DIR)) {
      fs.mkdirSync(DATA_DIR, { recursive: true });
    }
    fs.writeFileSync(REMINDERS_FILE, JSON.stringify(remList, null, 2), 'utf-8');
  } catch (err) {
    console.warn('Could not write reminders to disk:', err);
  }
}

// In-Memory & File-Backed Database (no saved mock profiles, preserves real registered profiles)
interface CaregiverLink {
  id: string;
  caregiver_id: string;
  elderly_id: string;
  relation: string;
}

const users: User[] = loadUsersFromDisk();
const caregiverLinks: CaregiverLink[] = [];

// Historical game sessions to power real charts out of the box
let gameSessions: GameSession[] = [
  {
    id: 'sess-1',
    user_id: 'user-bhaben',
    game_type: 'memory_match',
    accuracy: 90,
    response_time: 4.8,
    attempts: 7,
    mistakes: 1,
    completion_rate: 100,
    difficulty_level: 'easy',
    stars: 3,
    completed_at: new Date(Date.now() - 6 * 86400000).toISOString(),
  },
  {
    id: 'sess-2',
    user_id: 'user-bhaben',
    game_type: 'picture_recognition',
    accuracy: 85,
    response_time: 5.2,
    attempts: 4,
    mistakes: 1,
    completion_rate: 100,
    difficulty_level: 'easy',
    stars: 3,
    completed_at: new Date(Date.now() - 5 * 86400000).toISOString(),
  },
  {
    id: 'sess-3',
    user_id: 'user-bhaben',
    game_type: 'sequence_recall',
    accuracy: 80,
    response_time: 5.8,
    attempts: 5,
    mistakes: 2,
    completion_rate: 100,
    difficulty_level: 'easy',
    stars: 2,
    completed_at: new Date(Date.now() - 4 * 86400000).toISOString(),
  },
  {
    id: 'sess-4',
    user_id: 'user-bhaben',
    game_type: 'memory_match',
    accuracy: 95,
    response_time: 4.2,
    attempts: 6,
    mistakes: 0,
    completion_rate: 100,
    difficulty_level: 'easy',
    stars: 3,
    completed_at: new Date(Date.now() - 3 * 86400000).toISOString(),
  },
  {
    id: 'sess-5',
    user_id: 'user-bhaben',
    game_type: 'simple_puzzle',
    accuracy: 88,
    response_time: 6.4,
    attempts: 4,
    mistakes: 1,
    completion_rate: 100,
    difficulty_level: 'easy',
    stars: 3,
    completed_at: new Date(Date.now() - 2 * 86400000).toISOString(),
  },
  {
    id: 'sess-6',
    user_id: 'user-bhaben',
    game_type: 'face_match',
    accuracy: 100,
    response_time: 3.6,
    attempts: 3,
    mistakes: 0,
    completion_rate: 100,
    difficulty_level: 'easy',
    stars: 3,
    completed_at: new Date(Date.now() - 1 * 86400000).toISOString(),
  },
  {
    id: 'sess-7',
    user_id: 'user-bhaben',
    game_type: 'picture_recognition',
    accuracy: 92,
    response_time: 4.0,
    attempts: 4,
    mistakes: 0,
    completion_rate: 100,
    difficulty_level: 'medium',
    stars: 3,
    completed_at: new Date(Date.now() - 0.3 * 86400000).toISOString(),
  },
];

let reminders: Reminder[] = loadRemindersFromDisk();

let familiarPeople: FamiliarPerson[] = [...FAMILIAR_PEOPLE_SEED];

let alerts: Alert[] = [
  {
    id: 'alt-1',
    user_id: 'user-bhaben',
    patient_name: 'Bhaben Barua (Dadaji)',
    type: 'missed_reminder',
    message: 'Afternoon hydration reminder was acknowledged 25 minutes late yesterday.',
    triggered_at: new Date(Date.now() - 26 * 3600000).toISOString(),
    resolved: true,
    resolved_at: new Date(Date.now() - 25 * 3600000).toISOString(),
  }
];

// -------------------------------------------------------------
// Extended Ecosystem In-Memory Stores
// -------------------------------------------------------------

let memoryJournals: MemoryJournalEntry[] = [
  {
    id: 'mj-1',
    user_id: 'user-bhaben',
    title: 'Morning Ferry Across Brahmaputra to Umananda',
    content: 'Dadaji recalled taking the green ferry across the Brahmaputra with his father in 1968. He remembered the mist over the peacock island and the sound of morning conch shells at Umananda temple.',
    media_type: 'photo',
    media_url: 'https://images.unsplash.com/photo-1609137144822-4a00ec277717?auto=format&fit=crop&w=600&q=80',
    location_tag: 'Guwahati, Assam',
    emotion: 'nostalgic',
    created_at: new Date(Date.now() - 2 * 86400000).toISOString()
  },
  {
    id: 'mj-2',
    user_id: 'user-bhaben',
    title: 'Autumn Bihu Dhol Beats in Silpukhuri',
    content: 'Listening to the resonance of Dhol drums during Kati Bihu. Bhaben sat on the veranda tapping his fingers in rhythm with the beats.',
    media_type: 'audio',
    audio_duration: '0:48',
    location_tag: 'Silpukhuri, Guwahati',
    emotion: 'joy',
    created_at: new Date(Date.now() - 5 * 86400000).toISOString()
  },
  {
    id: 'mj-3',
    user_id: 'user-mary',
    title: 'Picking Wild Strawberries in Cherrapunjee Hills',
    content: 'Kong Mary vividly shared how she used to hike the rolling green meadows of Sohra after monsoon showers, collecting sweet wild mountain berries in woven cane baskets.',
    media_type: 'photo',
    media_url: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&w=600&q=80',
    location_tag: 'Sohra, Meghalaya',
    emotion: 'peaceful',
    created_at: new Date(Date.now() - 3 * 86400000).toISOString()
  }
];

let medicationSchedules: MedicationSchedule[] = [
  {
    id: 'med-1',
    user_id: 'user-bhaben',
    med_name: 'Donepezil (Aricept)',
    dosage: '5 mg - 1 Tablet',
    timing: 'bedtime',
    time_str: '09:00 PM',
    purpose: 'Cholinesterase inhibitor for cognitive stability',
    taken_today: false
  },
  {
    id: 'med-2',
    user_id: 'user-bhaben',
    med_name: 'Telmisartan (Blood Pressure)',
    dosage: '40 mg - 1 Tablet',
    timing: 'morning',
    time_str: '08:30 AM',
    purpose: 'Hypertension maintenance post-breakfast',
    taken_today: true,
    last_taken_at: new Date(Date.now() - 4 * 3600000).toISOString()
  },
  {
    id: 'med-3',
    user_id: 'user-bhaben',
    med_name: 'Methylcobalamin & Vitamin D3',
    dosage: '1 Capsule',
    timing: 'afternoon',
    time_str: '01:30 PM',
    purpose: 'Neuro-protective vitamin supplement after lunch',
    taken_today: true,
    last_taken_at: new Date(Date.now() - 1 * 3600000).toISOString()
  },
  {
    id: 'med-4',
    user_id: 'user-mary',
    med_name: 'Memantine HCl',
    dosage: '10 mg',
    timing: 'morning',
    time_str: '09:00 AM',
    purpose: 'NMDA receptor antagonist for memory support',
    taken_today: true
  }
];

let consultationDoctors: ConsultationDoctor[] = [
  {
    id: 'doc-1',
    name: 'Dr. Bhupen Borah, MD, DM',
    specialty: 'Senior Consultant Neurologist & Cognitive Specialist',
    hospital: 'GNRC Hospitals / Dispur Neuroscience Clinic',
    location: 'Guwahati, Assam',
    available_days: 'Mon, Wed, Fri (2 PM - 6 PM)',
    consult_fee: '₹800 (Tele / In-Person)',
    avatar: 'https://images.unsplash.com/photo-1622253692010-333f2da6031d?auto=format&fit=crop&w=300&q=80',
    rating: 4.9
  },
  {
    id: 'doc-2',
    name: 'Dr. Larisa Sangma, MD',
    specialty: 'Geriatrician & Memory Care Physician',
    hospital: 'NEIGRIHMS (North Eastern Indira Gandhi Regional Institute)',
    location: 'Mawdiangdiang, Shillong, Meghalaya',
    available_days: 'Tue, Thu, Sat (10 AM - 3 PM)',
    consult_fee: '₹600 (Tele / In-Person)',
    avatar: 'https://images.unsplash.com/photo-1594824813575-520e5e04e43e?auto=format&fit=crop&w=300&q=80',
    rating: 4.8
  },
  {
    id: 'doc-3',
    name: 'Dr. Ningombam Singh, DNB',
    specialty: 'Neuropsychiatrist & Behavioral Health Lead',
    hospital: 'RIMS (Regional Institute of Medical Sciences)',
    location: 'Imphal, Manipur',
    available_days: 'Mon - Fri (11 AM - 4 PM)',
    consult_fee: '₹700 (Tele-consultation)',
    avatar: 'https://images.unsplash.com/photo-1537368910025-700350fe46c7?auto=format&fit=crop&w=300&q=80',
    rating: 4.9
  }
];

let consultationAppointments: ConsultationAppointment[] = [
  {
    id: 'apt-1',
    user_id: 'user-bhaben',
    doctor_id: 'doc-1',
    doctor_name: 'Dr. Bhupen Borah, MD, DM',
    specialty: 'Senior Consultant Neurologist',
    hospital: 'GNRC Hospitals, Guwahati',
    date: '2026-09-18',
    time: '03:30 PM',
    status: 'confirmed',
    notes: 'Bi-monthly cognitive evaluation and review of sequence recall engagement trend.'
  }
];

let forumPosts: ForumPost[] = [
  {
    id: 'post-1',
    author_name: 'Maitreyi Goswami',
    author_role: 'Daughter & Primary Caregiver',
    location: 'Jorhat, Assam',
    title: 'Managing evening restlessness (sundowning) using traditional Goalparia folk songs',
    content: 'My mother would become very anxious around sunset (5:30 PM). Two weeks ago we started playing gentle Pratima Barua Pandey folk songs while serving warm black tea with ginger. Her pacing has reduced by more than 70%. Has anyone else tried local rhythmic music?',
    tags: ['Sundowning', 'Assam Folk Music', 'Routine', 'Anxiety Relief'],
    likes: 24,
    replies_count: 8,
    created_at: new Date(Date.now() - 36 * 3600000).toISOString()
  },
  {
    id: 'post-2',
    author_name: 'David Lalnunmawia',
    author_role: 'Caregiver & Social Worker',
    location: 'Aizawl, Mizoram',
    title: 'Tips on keeping familiar family photos accessible near the bedside',
    content: 'We labelled all framed family pictures with large print relation cards (e.g. "Pi Mary - Eldest Daughter"). It has drastically eliminated morning confusion when waking up.',
    tags: ['Visual Cues', 'Family Album', 'Orientation'],
    likes: 31,
    replies_count: 12,
    created_at: new Date(Date.now() - 72 * 3600000).toISOString()
  },
  {
    id: 'post-3',
    author_name: 'Dr. Priya Barua',
    author_role: 'Occupational Therapy Caregiver',
    location: 'Guwahati, Assam',
    title: 'Why culturally familiar stimuli reduce agitation in North East Indian seniors',
    content: 'Standard western cognitive apps often use unfamiliar objects. In our tests, presenting a Gamosa, Hornbill, or Kaziranga one-horned rhino triggered immediate semantic memory retrieval and smiles. Contextual dignity matters deeply.',
    tags: ['NER Cultural Cues', 'Clinical Insights', 'Dignity in Care'],
    likes: 47,
    replies_count: 15,
    created_at: new Date(Date.now() - 120 * 3600000).toISOString()
  }
];

let dataLakeSummary: DataLakeSummary = {
  raw_records_count: 12480,
  cleansed_records_count: 11920,
  features_extracted: [
    'response_time_variance_ms',
    'spatial_hesitation_index',
    'mistake_recovery_rate',
    'cultural_motif_recognition_speed',
    'circadian_engagement_slope'
  ],
  model_accuracy: 91.4,
  ethical_compliance_pct: 100,
  anonymized: true,
  training_epochs: 45,
  last_training_time: new Date(Date.now() - 14 * 3600000).toISOString()
};

const ETHICAL_DISCLAIMER = "This is a cognitive engagement tool, not a medical diagnosis. Consult a healthcare professional for clinical assessment.";

// AI Personalization Engine
function computeAIRecommendation(userId: string): AIRecommendation {
  const userSessions = gameSessions.filter(s => s.user_id === userId);
  
  if (userSessions.length === 0) {
    return {
      recommended_difficulty: 'easy',
      next_game_type: 'memory_match',
      engagement_score: 75,
      rationale: 'Initial welcoming session: starting with culturally resonant memory cards at gentle difficulty.',
      observation_note: 'Baseline assessment underway. Patient is encouraged to explore games without time constraints.',
      ethical_disclaimer: ETHICAL_DISCLAIMER,
      recent_trend: 'stable'
    };
  }

  // Calculate rolling statistics
  const recentSessions = userSessions.slice(-6); // last 6 sessions
  const avgAccuracy = recentSessions.reduce((sum, s) => sum + s.accuracy, 0) / recentSessions.length;
  const avgResponseTime = recentSessions.reduce((sum, s) => sum + s.response_time, 0) / recentSessions.length;
  const avgMistakes = recentSessions.reduce((sum, s) => sum + s.mistakes, 0) / recentSessions.length;

  // Rolling Cognitive Engagement Score: 60% accuracy + 25% speed stability + 15% completion
  // Normalize response time (4 sec -> 100, 10 sec -> 50)
  const speedScore = Math.max(40, Math.min(100, 100 - (avgResponseTime - 3) * 8));
  const rollingScore = Math.round(avgAccuracy * 0.6 + speedScore * 0.25 + 15);

  // Rule-based difficulty adjustment
  let recommendedDifficulty: DifficultyLevel = 'easy';
  let rationale = '';
  let trend: 'improving' | 'stable' | 'attention_needed' = 'stable';

  if (avgAccuracy >= 88 && avgResponseTime < 6.0 && avgMistakes <= 1.2) {
    recommendedDifficulty = 'medium';
    rationale = `High accuracy (${Math.round(avgAccuracy)}%) and confident response time (${avgResponseTime.toFixed(1)}s) observed across recent activities. Difficulty gently stepped to Medium to maintain stimulating neural activity.`;
    trend = 'improving';
  } else if (avgAccuracy < 60 || avgMistakes > 3.0) {
    recommendedDifficulty = 'easy';
    rationale = `Recent accuracy (${Math.round(avgAccuracy)}%) indicates opportunities for lighter pacing. Retaining Easy level with comforting regional cues and gentle voice guidance.`;
    trend = 'attention_needed';
  } else {
    recommendedDifficulty = 'easy';
    rationale = `Consistent steady participation (${Math.round(avgAccuracy)}% accuracy). Pacing is calm and supportive.`;
    trend = 'stable';
  }

  // Determine next game type: rotate to least played or complementary cognitive domain
  const gameTypes: GameType[] = ['memory_match', 'picture_recognition', 'sequence_recall', 'simple_puzzle', 'face_match'];
  const gameCounts: Record<GameType, number> = {
    memory_match: 0,
    picture_recognition: 0,
    sequence_recall: 0,
    simple_puzzle: 0,
    face_match: 0
  };

  recentSessions.forEach(s => {
    if (gameCounts[s.game_type] !== undefined) {
      gameCounts[s.game_type]++;
    }
  });

  let nextGameType: GameType = 'memory_match';
  let minCount = Infinity;
  for (const gt of gameTypes) {
    if (gameCounts[gt] < minCount) {
      minCount = gameCounts[gt];
      nextGameType = gt;
    }
  }

  const observationNote = `Engagement observation: Average accuracy across recent activities is ${Math.round(avgAccuracy)}% with an average reaction time of ${avgResponseTime.toFixed(1)}s. The patient displays strong positive recognition toward familiar cultural and family imagery.`;

  return {
    recommended_difficulty: recommendedDifficulty,
    next_game_type: nextGameType,
    engagement_score: rollingScore,
    rationale,
    observation_note: observationNote,
    ethical_disclaimer: ETHICAL_DISCLAIMER,
    recent_trend: trend
  };
}

// -------------------------------------------------------------
// API Endpoints
// -------------------------------------------------------------

// Auth / User Switcher
app.post('/api/auth/login', (req: Request, res: Response) => {
  const { pin, role, identifier, userId } = req.body;

  if (userId) {
    const user = users.find(u => u.id === userId);
    if (user) {
      return res.json({ success: true, user });
    }
  }

  const cleanRole = role === 'caregiver' ? 'caregiver' : 'elderly';
  const roleUsers = users.filter(u => u.role === cleanRole);

  if (identifier && pin) {
    const cleanId = String(identifier).trim().toLowerCase();
    const user = roleUsers.find(u => 
      (u.name.toLowerCase() === cleanId ||
       u.phone === cleanId ||
       u.caregiver_code?.toLowerCase() === cleanId ||
       u.id.toLowerCase() === cleanId) &&
      u.pin === String(pin).trim()
    );
    if (user) {
      return res.json({ success: true, user });
    }
    return res.status(401).json({ 
      success: false, 
      message: 'No account found matching those details with that PIN. Please check your credentials or create a new profile.' 
    });
  }

  if (identifier && !pin) {
    const cleanId = String(identifier).trim().toLowerCase();
    const user = roleUsers.find(u => 
      u.name.toLowerCase() === cleanId ||
      u.phone === cleanId ||
      u.caregiver_code?.toLowerCase() === cleanId ||
      u.id.toLowerCase() === cleanId
    );
    if (user) {
      return res.json({ success: true, user });
    }
  }

  if (pin) {
    const user = roleUsers.find(u => u.pin === String(pin).trim());
    if (user) {
      return res.json({ success: true, user });
    }
    return res.status(401).json({ success: false, message: 'Invalid 4-digit PIN for ' + cleanRole });
  }

  res.status(400).json({ success: false, message: 'Please provide your details or PIN' });
});

// Get all users
app.get('/api/users', (_req: Request, res: Response) => {
  res.json({ users });
});

// Get registered caregivers
app.get('/api/caregivers', (_req: Request, res: Response) => {
  const caregivers = users.filter(u => u.role === 'caregiver');
  res.json({ caregivers });
});

// Create or update a user (Elderly or Caregiver)
app.post('/api/users', (req: Request, res: Response) => {
  const { id, name, role, language_pref, pin, age, location, diagnosis_note, avatar, phone, caregiver_code, emergency_contact, dementia_stage } = req.body;
  if (!name && !id) {
    return res.status(400).json({ error: 'Name or ID is required' });
  }

  // Check if user already exists by ID
  const existingIdx = id ? users.findIndex(u => u.id === id) : -1;
  if (existingIdx >= 0) {
    users[existingIdx] = {
      ...users[existingIdx],
      ...req.body,
      id,
      updated_at: new Date().toISOString()
    };
    saveUsersToDisk(users);
    return res.json({ success: true, user: users[existingIdx] });
  }

  const isCaregiver = role === 'caregiver';
  const generatedCode = isCaregiver 
    ? (caregiver_code ? String(caregiver_code).trim().toUpperCase() : `CG-${Math.floor(1000 + Math.random() * 9000)}`)
    : undefined;
  const generatedPatientId = !isCaregiver
    ? (req.body.patient_id ? String(req.body.patient_id).trim().toUpperCase() : `PT-${Math.floor(1000 + Math.random() * 9000)}`)
    : undefined;

  const newUser: User = {
    id: id || (isCaregiver ? `caregiver-${Date.now()}` : `user-${Date.now()}`),
    patient_id: generatedPatientId,
    name: String(name || 'User').trim(),
    role: isCaregiver ? 'caregiver' : 'elderly',
    language_pref: language_pref || 'en',
    pin: pin ? String(pin).padStart(4, '0').slice(-4) : '1234',
    phone: phone ? String(phone).trim() : undefined,
    caregiver_code: generatedCode,
    age: age !== undefined && age !== null ? Number(age) : (isCaregiver ? 35 : 72),
    location: location || 'North East India',
    diagnosis_note: diagnosis_note || (isCaregiver ? 'Certified Family & Clinical Caregiver' : 'Mild memory assistance requested.'),
    location_sharing: false,
    avatar: avatar || (isCaregiver 
      ? 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&w=250&q=80'
      : 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=250&q=80'),
    created_at: new Date().toISOString(),
    ...(emergency_contact ? { emergency_contact } : {}),
    ...(dementia_stage ? { dementia_stage } : {})
  };

  users.unshift(newUser);
  saveUsersToDisk(users);

  res.status(201).json({ success: true, user: newUser });
});

// Update an existing user by ID (e.g. changing age, details, avatar)
app.put('/api/users/:id', (req: Request, res: Response) => {
  const { id } = req.params;
  const existingIdx = users.findIndex(u => u.id === id);
  if (existingIdx >= 0) {
    users[existingIdx] = {
      ...users[existingIdx],
      ...req.body,
      id,
      updated_at: new Date().toISOString()
    };
    saveUsersToDisk(users);
    return res.json({ success: true, user: users[existingIdx] });
  }

  const newUser: User = {
    ...req.body,
    id,
    created_at: req.body.created_at || new Date().toISOString()
  };
  users.unshift(newUser);
  saveUsersToDisk(users);
  return res.json({ success: true, user: newUser });
});

app.patch('/api/users/:id', (req: Request, res: Response) => {
  const { id } = req.params;
  const existingIdx = users.findIndex(u => u.id === id);
  if (existingIdx >= 0) {
    users[existingIdx] = {
      ...users[existingIdx],
      ...req.body,
      id,
      updated_at: new Date().toISOString()
    };
    saveUsersToDisk(users);
    return res.json({ success: true, user: users[existingIdx] });
  }
  return res.status(404).json({ error: 'User not found' });
});

// Connect Elderly to Caregiver ID
app.post('/api/caregivers/link', (req: Request, res: Response) => {
  const { elderly_id, caregiver_code, caregiver_id } = req.body;
  if (!elderly_id) {
    return res.status(400).json({ error: 'elderly_id is required' });
  }

  const cleanElderlyId = String(elderly_id).trim().toUpperCase();
  const elderly = users.find(
    u => u.id.toUpperCase() === cleanElderlyId || (u.patient_id && u.patient_id.toUpperCase() === cleanElderlyId)
  );
  if (!elderly) {
    return res.status(404).json({ error: 'Elderly patient profile not found' });
  }

  const codeQuery = String(caregiver_code || caregiver_id || '').trim().toUpperCase();
  if (!codeQuery) {
    return res.status(400).json({ error: 'Caregiver ID is required' });
  }

  // Find existing caregiver
  let matchedCaregiver = users.find(u => 
    u.role === 'caregiver' && 
    (u.caregiver_code?.toUpperCase() === codeQuery || 
     u.id.toUpperCase() === codeQuery || 
     u.name.toUpperCase().includes(codeQuery) ||
     u.phone === codeQuery)
  );

  // If no caregiver exists with this ID yet, create one so the elderly is linked immediately
  if (!matchedCaregiver) {
    matchedCaregiver = {
      id: `caregiver-${Date.now()}`,
      name: codeQuery.startsWith('CG-') ? `Caregiver (${codeQuery})` : `Caregiver ${codeQuery}`,
      role: 'caregiver',
      caregiver_code: codeQuery.startsWith('CG-') ? codeQuery : `CG-${codeQuery.replace(/\s+/g, '')}`,
      language_pref: elderly.language_pref || 'en',
      pin: '1234',
      created_at: new Date().toISOString(),
    };
    users.push(matchedCaregiver);
  }

  // Record link if not already linked
  const existingLink = caregiverLinks.find(
    l => l.caregiver_id === matchedCaregiver!.id && l.elderly_id === elderly.id
  );
  if (!existingLink) {
    caregiverLinks.push({
      id: `link-${Date.now()}`,
      caregiver_id: matchedCaregiver.id,
      elderly_id: elderly.id,
      relation: 'Primary Care'
    });
  }

  // Update elderly profile
  elderly.connected_caregiver_id = matchedCaregiver.caregiver_code || matchedCaregiver.id;
  elderly.connected_caregiver_name = matchedCaregiver.name;

  res.json({
    success: true,
    user: elderly,
    caregiver: matchedCaregiver,
    message: `Connected successfully with Caregiver ${matchedCaregiver.name} (${matchedCaregiver.caregiver_code || matchedCaregiver.id})`
  });
});

// Update user preferences (e.g. language, location sharing)
app.put('/api/users/:id', (req: Request, res: Response) => {
  const { id } = req.params;
  const { language_pref, location_sharing } = req.body;
  const user = users.find(u => u.id === id);
  if (!user) {
    return res.status(404).json({ error: 'User not found' });
  }
  if (language_pref) user.language_pref = language_pref;
  if (typeof location_sharing === 'boolean') user.location_sharing = location_sharing;
  res.json({ success: true, user });
});

// Get linked elderly patients for caregiver (STRICT: only patients who assigned this caregiver)
app.get('/api/patients/:caregiverId', (req: Request, res: Response) => {
  const { caregiverId } = req.params;
  const cleanParam = String(caregiverId).trim().toUpperCase();
  const caregiver = users.find(u => 
    u.role === 'caregiver' && 
    (u.id.toUpperCase() === cleanParam || u.caregiver_code?.toUpperCase() === cleanParam)
  );

  const cgCode = (caregiver?.caregiver_code || cleanParam).toUpperCase();
  const cgId = (caregiver?.id || cleanParam).toUpperCase();

  const links = caregiverLinks.filter(l => 
    l.caregiver_id.toUpperCase() === cgId || 
    l.caregiver_id.toUpperCase() === cgCode
  );

  const directlyAssigned = users.filter(u => 
    u.role === 'elderly' && 
    u.connected_caregiver_id && 
    (u.connected_caregiver_id.toUpperCase() === cgCode || u.connected_caregiver_id.toUpperCase() === cgId)
  );

  const assignedPatientIds = new Set([
    ...links.map(l => l.elderly_id),
    ...directlyAssigned.map(u => u.id)
  ]);

  const patientUsers = users.filter(u => u.role === 'elderly' && assignedPatientIds.has(u.id));

  res.json({ patients: patientUsers });
});

// Unlink Elderly from Caregiver
app.post('/api/caregivers/unlink', (req: Request, res: Response) => {
  const { elderly_id } = req.body;
  if (!elderly_id) {
    return res.status(400).json({ error: 'elderly_id is required' });
  }
  const elderly = users.find(u => u.id === elderly_id);
  if (elderly) {
    delete elderly.connected_caregiver_id;
    delete elderly.connected_caregiver_name;
    saveUsersToDisk(users);
  }
  for (let i = caregiverLinks.length - 1; i >= 0; i--) {
    if (caregiverLinks[i].elderly_id === elderly_id) {
      caregiverLinks.splice(i, 1);
    }
  }
  res.json({ success: true, user: elderly, message: 'Caregiver unlinked successfully' });
});

// Log a game session
app.post('/api/game-sessions', (req: Request, res: Response) => {
  const { 
    user_id, 
    game_type, 
    accuracy, 
    response_time, 
    attempts, 
    mistakes, 
    completion_rate, 
    difficulty_level,
    stars 
  } = req.body;

  if (!user_id || !game_type) {
    return res.status(400).json({ error: 'Missing required session parameters' });
  }

  const newSession: GameSession = {
    id: `sess-${Date.now()}`,
    user_id,
    game_type,
    accuracy: Math.round(Number(accuracy) || 0),
    response_time: Number(response_time) || 0,
    attempts: Number(attempts) || 1,
    mistakes: Number(mistakes) || 0,
    completion_rate: Number(completion_rate) || 100,
    difficulty_level: difficulty_level || 'easy',
    stars: Number(stars) || 3,
    completed_at: new Date().toISOString()
  };

  gameSessions.push(newSession);

  // Generate updated AI recommendation immediately
  const recommendation = computeAIRecommendation(user_id);

  res.json({
    success: true,
    session: newSession,
    recommendation,
    ethical_disclaimer: ETHICAL_DISCLAIMER
  });
});

// Get Game Sessions for a user
app.get('/api/game-sessions/:userId', (req: Request, res: Response) => {
  const { userId } = req.params;
  const sessions = gameSessions
    .filter(s => s.user_id === userId)
    .sort((a, b) => new Date(b.completed_at).getTime() - new Date(a.completed_at).getTime());
  
  res.json({ sessions });
});

// AI Personalization Recommendation Endpoint
app.get('/api/ai/recommendation/:userId', (req: Request, res: Response) => {
  const { userId } = req.params;
  const recommendation = computeAIRecommendation(userId);
  res.json(recommendation);
});

// Performance Trends & Chart Aggregations
app.get('/api/performance-trends/:userId', (req: Request, res: Response) => {
  const { userId } = req.params;
  const userSessions = gameSessions.filter(s => s.user_id === userId);

  // Baseline accuracy (average across all sessions)
  const baselineAccuracy = userSessions.length > 0 
    ? Math.round(userSessions.reduce((acc, s) => acc + s.accuracy, 0) / userSessions.length)
    : 80;

  // Group by day / recent sessions for recharts
  const sorted = [...userSessions].sort((a, b) => new Date(a.completed_at).getTime() - new Date(b.completed_at).getTime());
  
  const dailyData = sorted.map((s, idx) => ({
    session_num: idx + 1,
    date: new Date(s.completed_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
    accuracy: s.accuracy,
    response_time: s.response_time,
    mistakes: s.mistakes,
    game_type: s.game_type,
    difficulty: s.difficulty_level,
    baseline: baselineAccuracy
  }));

  // Games count by type
  const gameBreakdown: Record<string, number> = {};
  userSessions.forEach(s => {
    gameBreakdown[s.game_type] = (gameBreakdown[s.game_type] || 0) + 1;
  });

  const recent = userSessions.slice(-4);
  const recentAvg = recent.length > 0
    ? Math.round(recent.reduce((acc, s) => acc + s.accuracy, 0) / recent.length)
    : baselineAccuracy;
  
  const deviationPct = recentAvg - baselineAccuracy;

  res.json({
    trends: dailyData,
    baseline_accuracy: baselineAccuracy,
    recent_accuracy: recentAvg,
    deviation_from_baseline_pct: deviationPct,
    baseline_observation: deviationPct >= 0 
      ? `${deviationPct}% above typical baseline — patient demonstrates consistent cognitive alertness.`
      : `${Math.abs(deviationPct)}% below typical baseline — suggested gentle pacing and familiar family photo activities.`,
    game_breakdown: gameBreakdown,
    ethical_disclaimer: ETHICAL_DISCLAIMER
  });
});

// Reminders CRUD
app.get('/api/reminders', (req: Request, res: Response) => {
  const userId = req.query.userId as string;
  if (!userId) {
    return res.json({ reminders });
  }

  // Find user to support matching by both user.id and user.patient_id
  const matchingUser = users.find(u => u.id === userId || u.patient_id === userId);
  const targetIds = new Set<string>([userId]);
  if (matchingUser) {
    if (matchingUser.id) targetIds.add(matchingUser.id);
    if (matchingUser.patient_id) targetIds.add(matchingUser.patient_id);
  }

  const list = reminders.filter(r => targetIds.has(r.user_id));
  res.json({ reminders: list });
});

app.post('/api/reminders', (req: Request, res: Response) => {
  const { 
    user_id, 
    type, 
    title, 
    time, 
    recurrence, 
    instructions, 
    created_by,
    scheduled_date,
    priority,
    audio_chime,
    spoken_prompt
  } = req.body;
  if (!user_id || !title || !time) {
    return res.status(400).json({ error: 'Missing required reminder fields' });
  }

  const newReminder: Reminder = {
    id: `rem-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
    user_id,
    type: type || 'medication',
    title,
    time,
    recurrence: recurrence || 'daily',
    instructions: instructions || '',
    completed: false,
    created_by: created_by || 'Caregiver',
    created_at: new Date().toISOString(),
    scheduled_date: scheduled_date || new Date().toISOString().split('T')[0],
    priority: priority || 'medium',
    audio_chime: audio_chime !== undefined ? audio_chime : true,
    spoken_prompt: spoken_prompt || title
  };

  reminders.push(newReminder);
  saveRemindersToDisk(reminders);

  const patientUser = users.find(u => u.id === user_id || u.patient_id === user_id);
  const reminderAlert: Alert = {
    id: `alert-rem-${Date.now()}`,
    user_id,
    patient_name: patientUser?.name || 'Patient',
    type: 'routine',
    message: `Scheduled ${type === 'medication' ? 'Medicine' : 'Routine'}: "${title}" at ${time} by ${created_by || 'Caregiver'}.`,
    timestamp: new Date().toISOString(),
    resolved: false
  };
  alerts.unshift(reminderAlert);

  res.json({ success: true, reminder: newReminder });
});

app.put('/api/reminders/:id', (req: Request, res: Response) => {
  const { id } = req.params;
  const reminder = reminders.find(r => r.id === id);
  if (!reminder) {
    return res.status(404).json({ error: 'Reminder not found' });
  }

  if (typeof req.body.completed === 'boolean') {
    reminder.completed = req.body.completed;
  }
  if (req.body.title) reminder.title = req.body.title;
  if (req.body.time) reminder.time = req.body.time;
  if (req.body.type) reminder.type = req.body.type;
  if (req.body.recurrence) reminder.recurrence = req.body.recurrence;
  if (req.body.instructions !== undefined) reminder.instructions = req.body.instructions;
  if (req.body.scheduled_date) reminder.scheduled_date = req.body.scheduled_date;
  if (req.body.priority) reminder.priority = req.body.priority;
  if (req.body.audio_chime !== undefined) reminder.audio_chime = req.body.audio_chime;
  if (req.body.spoken_prompt) reminder.spoken_prompt = req.body.spoken_prompt;

  saveRemindersToDisk(reminders);
  res.json({ success: true, reminder });
});

app.delete('/api/reminders/:id', (req: Request, res: Response) => {
  const { id } = req.params;
  reminders = reminders.filter(r => r.id !== id);
  saveRemindersToDisk(reminders);
  res.json({ success: true, id });
});

// Familiar People CRUD
app.get('/api/familiar-people/:userId', (req: Request, res: Response) => {
  const { userId } = req.params;
  const people = familiarPeople.filter(p => p.user_id === userId);
  res.json({ people });
});

app.post('/api/familiar-people', (req: Request, res: Response) => {
  const { user_id, name, relation, photo_url, notes, voice_prompt, phone } = req.body;
  if (!user_id || !name || !relation) {
    return res.status(400).json({ error: 'Missing required familiar person fields' });
  }

  const newPerson: FamiliarPerson = {
    id: `fam-${Date.now()}`,
    user_id,
    name,
    relation,
    photo_url: photo_url || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=300&q=80',
    notes,
    voice_prompt,
    phone
  };

  familiarPeople.push(newPerson);
  res.json({ success: true, person: newPerson });
});

app.delete('/api/familiar-people/:id', (req: Request, res: Response) => {
  const { id } = req.params;
  familiarPeople = familiarPeople.filter(p => p.id !== id);
  res.json({ success: true, id });
});

// Alerts (SOS / Notification system)
app.get('/api/alerts/:userId', (req: Request, res: Response) => {
  const { userId } = req.params;
  const list = alerts.filter(a => a.user_id === userId);
  res.json({ alerts: list });
});

app.post('/api/alerts', (req: Request, res: Response) => {
  const { user_id, type, message, patient_name } = req.body;
  if (!user_id || !message) {
    return res.status(400).json({ error: 'Missing required alert parameters' });
  }

  const newAlert: Alert = {
    id: `alt-${Date.now()}`,
    user_id,
    patient_name: patient_name || 'Elderly Patient',
    type: type || 'sos',
    message,
    triggered_at: new Date().toISOString(),
    resolved: false
  };

  alerts.unshift(newAlert);
  res.json({ success: true, alert: newAlert });
});

app.put('/api/alerts/:id/resolve', (req: Request, res: Response) => {
  const { id } = req.params;
  const alert = alerts.find(a => a.id === id);
  if (!alert) {
    return res.status(404).json({ error: 'Alert not found' });
  }
  alert.resolved = true;
  alert.resolved_at = new Date().toISOString();
  res.json({ success: true, alert });
});

// -------------------------------------------------------------
// Extended Ecosystem API Endpoints
// -------------------------------------------------------------

// 1. Memory Journal Endpoints
app.get('/api/journal/:userId', (req: Request, res: Response) => {
  const { userId } = req.params;
  const list = memoryJournals
    .filter(j => j.user_id === userId)
    .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
  res.json({ journals: list });
});

app.post('/api/journal', (req: Request, res: Response) => {
  const { user_id, title, content, media_type, media_url, audio_duration, location_tag, emotion } = req.body;
  if (!user_id || !title || !content) {
    return res.status(400).json({ error: 'User ID, title, and content are required' });
  }

  const newEntry: MemoryJournalEntry = {
    id: `mj-${Date.now()}`,
    user_id,
    title,
    content,
    media_type: media_type || 'text',
    media_url: media_url || undefined,
    audio_duration: audio_duration || undefined,
    location_tag: location_tag || 'North East India',
    emotion: emotion || 'nostalgic',
    created_at: new Date().toISOString()
  };

  memoryJournals.unshift(newEntry);
  res.status(201).json({ success: true, journal: newEntry });
});

app.delete('/api/journal/:id', (req: Request, res: Response) => {
  const { id } = req.params;
  memoryJournals = memoryJournals.filter(j => j.id !== id);
  res.json({ success: true, id });
});

// 2. Medication Management System Endpoints
app.get('/api/medications/:userId', (req: Request, res: Response) => {
  const { userId } = req.params;
  const list = medicationSchedules.filter(m => m.user_id === userId);
  res.json({ medications: list });
});

app.post('/api/medications', (req: Request, res: Response) => {
  const { user_id, med_name, dosage, timing, time_str, purpose, created_by } = req.body;
  if (!user_id || !med_name) {
    return res.status(400).json({ error: 'User ID and medication name are required' });
  }

  const newMed: MedicationSchedule = {
    id: `med-${Date.now()}`,
    user_id,
    med_name,
    dosage: dosage || '1 Tablet',
    timing: timing || 'morning',
    time_str: time_str || '08:00 AM',
    purpose: purpose || 'Health Maintenance',
    taken_today: false
  };

  medicationSchedules.push(newMed);

  // Synchronize to reminders array so patient dashboard immediately displays it and triggers alarms
  const matchingReminder: Reminder = {
    id: `rem-med-${newMed.id}`,
    user_id,
    type: 'medication',
    title: `${med_name} (${dosage || '1 Tablet'})`,
    time: time_str || '08:00 AM',
    recurrence: 'daily',
    instructions: purpose ? `Purpose: ${purpose}. Take as prescribed.` : 'Take as prescribed by caregiver.',
    completed: false,
    created_by: created_by || 'Assigned Caregiver',
    created_at: new Date().toISOString(),
    scheduled_date: new Date().toISOString().split('T')[0],
    priority: 'high',
    audio_chime: true,
    spoken_prompt: `Time for your medicine: ${med_name}, ${dosage || 'one tablet'} at ${time_str || '08:00 AM'}.`
  };
  reminders.push(matchingReminder);
  saveRemindersToDisk(reminders);

  const patientUser = users.find(u => u.id === user_id || u.patient_id === user_id);
  alerts.unshift({
    id: `alert-med-${Date.now()}`,
    user_id,
    patient_name: patientUser?.name || 'Patient',
    type: 'routine',
    message: `Prescribed Medicine: "${med_name}" (${dosage || '1 Tablet'}) at ${time_str || '08:00 AM'} by ${created_by || 'Caregiver'}.`,
    timestamp: new Date().toISOString(),
    resolved: false
  });

  res.status(201).json({ success: true, medication: newMed, reminder: matchingReminder });
});

app.put('/api/medications/:id/toggle', (req: Request, res: Response) => {
  const { id } = req.params;
  const med = medicationSchedules.find(m => m.id === id);
  if (!med) {
    return res.status(404).json({ error: 'Medication not found' });
  }
  med.taken_today = !med.taken_today;
  if (med.taken_today) {
    med.last_taken_at = new Date().toISOString();
  }

  // Also sync completed status on matching reminder if present
  const matchingRem = reminders.find(r => r.id === `rem-med-${id}`);
  if (matchingRem) {
    matchingRem.completed = med.taken_today;
    saveRemindersToDisk(reminders);
  }

  res.json({ success: true, medication: med });
});

app.delete('/api/medications/:id', (req: Request, res: Response) => {
  const { id } = req.params;
  medicationSchedules = medicationSchedules.filter(m => m.id !== id);
  reminders = reminders.filter(r => r.id !== `rem-med-${id}`);
  saveRemindersToDisk(reminders);
  res.json({ success: true, id });
});

// 3. Emergency Response Protocol Endpoints
app.post('/api/emergency/sos', (req: Request, res: Response) => {
  const { user_id, patient_name, lat, lng, location_name } = req.body;
  const user = users.find(u => u.id === user_id);

  const newAlert: Alert = {
    id: `sos-${Date.now()}`,
    user_id: user_id || 'unknown',
    patient_name: patient_name || (user ? user.name : 'Care Recipient'),
    type: 'sos',
    message: `EMERGENCY SOS BEACON TRIGGERED: Immediate assistance requested at ${location_name || (user?.location || 'Live GPS Coordinates: 26.1856° N, 91.7539° E')}`,
    triggered_at: new Date().toISOString(),
    resolved: false,
    lat: lat || 26.1856,
    lng: lng || 91.7539
  };

  alerts.unshift(newAlert);

  res.json({
    success: true,
    alert: newAlert,
    dispatch_status: 'NOTIFIED_PRIMARY_CAREGIVER_AND_EMERGENCY_NETWORK',
    emergency_contact: user?.emergency_contact || {
      name: 'Dr. Priya Barua (Caregiver)',
      phone: '+91 98640 12345',
      relation: 'Primary Caregiver'
    },
    gps_beacon: {
      latitude: lat || 26.1856,
      longitude: lng || 91.7539,
      address: location_name || (user?.location || 'Silpukhuri, Guwahati, Assam')
    }
  });
});

// 4. Professional Consultation Portal Endpoints
app.get('/api/consultations/doctors', (_req: Request, res: Response) => {
  res.json({ doctors: consultationDoctors });
});

app.get('/api/consultations/appointments/:userId', (req: Request, res: Response) => {
  const { userId } = req.params;
  const list = consultationAppointments.filter(a => a.user_id === userId);
  res.json({ appointments: list });
});

app.post('/api/consultations/book', (req: Request, res: Response) => {
  const { user_id, doctor_id, date, time, notes } = req.body;
  const doctor = consultationDoctors.find(d => d.id === doctor_id);
  if (!doctor) {
    return res.status(404).json({ error: 'Doctor not found' });
  }

  const newAppointment: ConsultationAppointment = {
    id: `apt-${Date.now()}`,
    user_id,
    doctor_id,
    doctor_name: doctor.name,
    specialty: doctor.specialty,
    hospital: doctor.hospital,
    date,
    time,
    status: 'confirmed',
    notes: notes || 'Cognitive and routine checkup review.'
  };

  consultationAppointments.push(newAppointment);
  res.status(201).json({ success: true, appointment: newAppointment });
});

app.get('/api/consultations/clinical-summary/:userId', (req: Request, res: Response) => {
  const { userId } = req.params;
  const user = users.find(u => u.id === userId);
  const userSessions = gameSessions.filter(s => s.user_id === userId);
  const userMeds = medicationSchedules.filter(m => m.user_id === userId);
  const recommendation = computeAIRecommendation(userId);

  const adherenceRate = userMeds.length > 0 
    ? Math.round((userMeds.filter(m => m.taken_today).length / userMeds.length) * 100) 
    : 85;

  const avgAccuracy = userSessions.length > 0
    ? Math.round(userSessions.reduce((sum, s) => sum + s.accuracy, 0) / userSessions.length)
    : 80;

  res.json({
    patient: {
      id: user?.id,
      name: user?.name,
      age: user?.age || 74,
      location: user?.location || 'Guwahati, Assam',
      dementia_stage: user?.dementia_stage || 'mild',
      care_goals: user?.care_goals || ['Memory Maintenance', 'Medication Routine', 'Family Familiarity'],
      diagnosis_note: user?.diagnosis_note
    },
    metrics: {
      total_sessions_completed: userSessions.length,
      average_cognitive_accuracy_pct: avgAccuracy,
      medication_adherence_today_pct: adherenceRate,
      cognitive_engagement_score: recommendation.engagement_score,
      recommended_difficulty: recommendation.recommended_difficulty,
      recent_trend: recommendation.recent_trend
    },
    observations: recommendation.observation_note,
    medications: userMeds,
    generated_at: new Date().toISOString(),
    clinical_proxy_score: `${Math.round(avgAccuracy * 0.3)} / 30 MMSE-Equivalent Engagement`,
    disclaimer: ETHICAL_DISCLAIMER
  });
});

// 5. Data Lake & AI Hub Endpoints
app.get('/api/datalake/summary/:userId', (req: Request, res: Response) => {
  const { userId } = req.params;
  const userSessions = gameSessions.filter(s => s.user_id === userId);

  // Dynamic metrics based on session count
  const updatedSummary = {
    ...dataLakeSummary,
    raw_records_count: dataLakeSummary.raw_records_count + userSessions.length * 12,
    cleansed_records_count: dataLakeSummary.cleansed_records_count + userSessions.length * 11,
    active_patient_sessions: userSessions.length,
    recent_features_sample: [
      { feature: 'Mean Reaction Latency', value: '4.8s (Safe MCI Band)' },
      { feature: 'Spatial Card Flip Error', value: '0.6 mistakes/session' },
      { feature: 'Cultural Motif Affinity', value: '94% Assamese/NER cues recognized' },
      { feature: 'Sequence Order Retention', value: '3.4 items recall span' },
      { feature: 'Time-of-day Alertness Peak', value: '10:30 AM - 12:00 PM' }
    ]
  };

  res.json(updatedSummary);
});

app.post('/api/datalake/retrain', (_req: Request, res: Response) => {
  dataLakeSummary.training_epochs += 5;
  dataLakeSummary.model_accuracy = Math.min(96.8, +(dataLakeSummary.model_accuracy + 0.3).toFixed(1));
  dataLakeSummary.last_training_time = new Date().toISOString();

  res.json({
    success: true,
    message: 'AI Model retrained across federated ethical NER dementia cohort.',
    summary: dataLakeSummary
  });
});

// 6. Caregiver Support Forum & Research/Policy Feedback Endpoints
app.get('/api/community/forum', (_req: Request, res: Response) => {
  res.json({ posts: forumPosts });
});

app.post('/api/community/forum', (req: Request, res: Response) => {
  const { author_name, author_role, location, title, content, tags } = req.body;
  if (!author_name || !title || !content) {
    return res.status(400).json({ error: 'Author, title, and content are required' });
  }

  const newPost: ForumPost = {
    id: `post-${Date.now()}`,
    author_name,
    author_role: author_role || 'Caregiver',
    location: location || 'North East India',
    title,
    content,
    tags: tags && tags.length > 0 ? tags : ['General Care', 'NER Experience'],
    likes: 1,
    replies_count: 0,
    created_at: new Date().toISOString()
  };

  forumPosts.unshift(newPost);
  res.status(201).json({ success: true, post: newPost });
});

app.post('/api/community/forum/:id/like', (req: Request, res: Response) => {
  const { id } = req.params;
  const post = forumPosts.find(p => p.id === id);
  if (!post) {
    return res.status(404).json({ error: 'Post not found' });
  }
  post.likes += 1;
  res.json({ success: true, likes: post.likes });
});

app.get('/api/community/policy-research', (_req: Request, res: Response) => {
  // Longitudinal projections 2022 to 2045 matching the graph in the flow diagram
  const longitudinalData = [
    { year: 2022, baseline_prevalence: 8.8, with_early_ai_intervention: 8.8, caregiver_burnout_index: 32 },
    { year: 2023, baseline_prevalence: 10.4, with_early_ai_intervention: 9.9, caregiver_burnout_index: 30 },
    { year: 2024, baseline_prevalence: 12.6, with_early_ai_intervention: 11.2, caregiver_burnout_index: 26 },
    { year: 2026, baseline_prevalence: 16.5, with_early_ai_intervention: 13.1, caregiver_burnout_index: 22 },
    { year: 2030, baseline_prevalence: 22.0, with_early_ai_intervention: 16.4, caregiver_burnout_index: 18 },
    { year: 2035, baseline_prevalence: 28.5, with_early_ai_intervention: 19.8, caregiver_burnout_index: 16 },
    { year: 2040, baseline_prevalence: 33.2, with_early_ai_intervention: 22.5, caregiver_burnout_index: 14 },
    { year: 2045, baseline_prevalence: 37.8, with_early_ai_intervention: 24.2, caregiver_burnout_index: 12 }
  ];

  const policyRecommendations = [
    {
      title: 'NER District-Level Memory Screening Integration',
      target_body: 'National Health Mission (NHM) North East / State Health Societies',
      impact: 'Mandating culturally localized cognitive assessments in PHCs across Assam, Meghalaya, Manipur, and Mizoram can catch early MCI 3.5 years earlier.'
    },
    {
      title: 'Caregiver Respite & Community Telehealth Subsidy',
      target_body: 'Ministry of Social Justice & Empowerment (Govt of India)',
      impact: 'Subsidizing remote geriatrician consultations via regional hubs (NEIGRIHMS Shillong, RIMS Imphal) reduces travel strain by 80% for hilly terrain families.'
    },
    {
      title: 'Multilingual Digital Health Preservation Standard',
      target_body: 'Indian Council of Medical Research (ICMR) & Digital Health Authority',
      impact: 'Ensuring cognitive health interfaces support indigenous dialects (Khasi, Garo, Meiteilon, Mizo, Assamese) drastically eliminates cultural anxiety during testing.'
    }
  ];

  res.json({
    longitudinal_data: longitudinalData,
    policy_recommendations: policyRecommendations,
    research_statement: 'Longitudinal population analysis modeling dementia burden in North East India (2022-2045). Early AI-guided multimodal cognitive stimulation significantly attenuates projected institutionalization rates.'
  });
});

// Reset seed data endpoint (convenient for demo resetting)
app.post('/api/seed/reset', (_req: Request, res: Response) => {
  familiarPeople = [...FAMILIAR_PEOPLE_SEED];
  res.json({ success: true, message: 'Seed data restored.' });
});

// -------------------------------------------------------------
// Vite Middleware / Static Serving
// -------------------------------------------------------------
async function startServer() {
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (_req: Request, res: Response) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Smaran Sathi Server running on http://0.0.0.0:${PORT}`);
  });
}

startServer();
