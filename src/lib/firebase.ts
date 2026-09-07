import { initializeApp, getApps, getApp } from 'firebase/app';
import { 
  getFirestore, 
  collection, 
  doc, 
  getDoc, 
  getDocs, 
  setDoc, 
  updateDoc, 
  deleteDoc, 
  query, 
  where,
  orderBy
} from 'firebase/firestore';
import firebaseConfig from '../../firebase-applet-config.json';
import { 
  User, 
  UserRole, 
  Reminder, 
  MemoryJournalEntry, 
  FamiliarPerson, 
  GameSession 
} from '../types';

// Initialize Firebase App & Custom Database
export const app = getApps().length > 0 ? getApp() : initializeApp(firebaseConfig);

// Initialize Firestore with specific database ID from config
export const db = getFirestore(
  app, 
  firebaseConfig.firestoreDatabaseId && firebaseConfig.firestoreDatabaseId !== '(default)'
    ? firebaseConfig.firestoreDatabaseId 
    : undefined
);

// Collection References
const USERS_COLLECTION = 'users';
const REMINDERS_COLLECTION = 'reminders';
const JOURNALS_COLLECTION = 'journals';
const FAMILY_COLLECTION = 'family_members';
const SESSIONS_COLLECTION = 'game_sessions';
const LINKS_COLLECTION = 'caregiver_links';

// Local storage key for seamless device remembering
const REMEMBERED_USER_KEY = 'smritisaathi_remembered_user';

/**
 * Recursively strips any keys with `undefined` values from an object,
 * because Firestore throws errors on any `undefined` values.
 */
export function cleanForFirestore<T>(data: T): T {
  if (data === null || data === undefined) {
    return data;
  }
  if (Array.isArray(data)) {
    return data
      .filter((item) => item !== undefined)
      .map((item) => cleanForFirestore(item)) as unknown as T;
  }
  if (typeof data === 'object' && data !== null) {
    // Preserve Date or non-plain objects if any, but for plain objects strip undefined
    const cleaned: Record<string, any> = {};
    for (const [key, value] of Object.entries(data)) {
      if (value !== undefined) {
        cleaned[key] = cleanForFirestore(value);
      }
    }
    return cleaned as T;
  }
  return data;
}

// =========================================================================
// 1. User & Authentication Firestore Operations
// =========================================================================

export async function saveUserToFirebase(user: User): Promise<void> {
  // 1. Immediately persist to local device storage so data is never lost even offline
  persistUserLocally(user);

  try {
    const userRef = doc(db, USERS_COLLECTION, user.id);
    const payload = cleanForFirestore({
      ...user,
      updated_at: new Date().toISOString()
    });
    await setDoc(userRef, payload, { merge: true });
  } catch (error) {
    console.error('Error saving user to Firebase:', error);
    throw error;
  }
}

export async function updateUserFaceDescriptor(userId: string, descriptor: number[]): Promise<User | null> {
  try {
    const userRef = doc(db, USERS_COLLECTION, userId);
    const snap = await getDoc(userRef);
    if (snap.exists()) {
      const existing = snap.data() as User;
      const updated: User = {
        ...existing,
        face_descriptor: descriptor,
        face_registered_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      } as any;
      await setDoc(userRef, cleanForFirestore(updated), { merge: true });
      persistUserLocally(updated);
      return updated;
    }
    return null;
  } catch (err) {
    console.warn('Error updating face descriptor in Firebase:', err);
    return null;
  }
}

export async function getUserFromFirebase(userId: string): Promise<User | null> {
  try {
    const userRef = doc(db, USERS_COLLECTION, userId);
    const snap = await getDoc(userRef);
    if (snap.exists()) {
      const u = snap.data() as User;
      persistUserLocally(u);
      return u;
    }
    return null;
  } catch (error) {
    console.warn('Error fetching user from Firebase:', error);
    return null;
  }
}

export async function getAllUsersFromFirebase(): Promise<User[]> {
  try {
    const snap = await getDocs(collection(db, USERS_COLLECTION));
    const list = snap.docs.map((d) => d.data() as User);
    if (list.length > 0) {
      persistMultipleUsersLocally(list);
    }
    return list;
  } catch (error) {
    console.warn('Error fetching all users from Firebase:', error);
    return [];
  }
}

export async function getCaregiversFromFirebase(): Promise<User[]> {
  try {
    const q = query(collection(db, USERS_COLLECTION), where('role', '==', 'caregiver'));
    const snap = await getDocs(q);
    return snap.docs.map((d) => d.data() as User);
  } catch (error) {
    console.warn('Error fetching caregivers from Firebase:', error);
    return [];
  }
}

export async function findUserByCredentials(
  role: UserRole,
  pin: string,
  identifier?: string
): Promise<User | null> {
  try {
    const cleanPin = pin.trim();
    const cleanId = identifier?.trim().toLowerCase();

    const q = query(
      collection(db, USERS_COLLECTION),
      where('role', '==', role),
      where('pin', '==', cleanPin)
    );
    const snap = await getDocs(q);
    const matches = snap.docs.map((d) => d.data() as User);

    if (matches.length === 0) {
      return null;
    }

    if (!cleanId) {
      return matches[0];
    }

    // Match by name, phone, caregiver code, patient ID, or user ID
    const specificMatch = matches.find((u) => 
      u.name.toLowerCase() === cleanId ||
      u.phone?.toLowerCase() === cleanId ||
      u.caregiver_code?.toLowerCase() === cleanId ||
      u.patient_id?.toLowerCase() === cleanId ||
      u.id.toLowerCase() === cleanId
    );

    return specificMatch || matches[0];
  } catch (error) {
    console.warn('Error verifying user in Firebase:', error);
    return null;
  }
}

export async function findCaregiverByCodeOrId(codeOrId: string): Promise<User | null> {
  try {
    const clean = codeOrId.trim().toUpperCase();
    const snap = await getDocs(collection(db, USERS_COLLECTION));
    const allUsers = snap.docs.map((d) => d.data() as User);
    
    const matched = allUsers.find((u) => 
      u.role === 'caregiver' &&
      (u.caregiver_code?.toUpperCase() === clean ||
       u.id.toUpperCase() === clean ||
       u.name.toUpperCase().includes(clean))
    );

    return matched || null;
  } catch (error) {
    console.warn('Error searching caregiver in Firebase:', error);
    return null;
  }
}

export const searchCaregiverByCodeOrName = findCaregiverByCodeOrId;

export async function linkElderlyToCaregiverInFirebase(
  elderlyId: string, 
  caregiver: User
): Promise<User | null> {
  try {
    // 1. Update Elderly Document
    const elderlyRef = doc(db, USERS_COLLECTION, elderlyId);
    const elderlySnap = await getDoc(elderlyRef);
    if (!elderlySnap.exists()) return null;

    const elderlyData = elderlySnap.data() as User;
    const updatedElderly: User = {
      ...elderlyData,
      connected_caregiver_id: caregiver.caregiver_code || caregiver.id,
      connected_caregiver_name: caregiver.name
    };
    await setDoc(elderlyRef, cleanForFirestore(updatedElderly), { merge: true });

    // 2. Record in caregiver_links collection
    const linkId = `link-${caregiver.id}-${elderlyId}`;
    await setDoc(doc(db, LINKS_COLLECTION, linkId), cleanForFirestore({
      id: linkId,
      caregiver_id: caregiver.id,
      caregiver_code: caregiver.caregiver_code || caregiver.id,
      elderly_id: elderlyId,
      relation: 'Primary Care Link',
      created_at: new Date().toISOString()
    }));

    persistUserLocally(updatedElderly);
    return updatedElderly;
  } catch (error) {
    console.error('Error linking elderly to caregiver in Firebase:', error);
    return null;
  }
}

export async function unlinkElderlyFromCaregiverInFirebase(
  elderlyId: string
): Promise<User | null> {
  try {
    const elderlyRef = doc(db, USERS_COLLECTION, elderlyId);
    const elderlySnap = await getDoc(elderlyRef);
    if (!elderlySnap.exists()) return null;

    const elderlyData = elderlySnap.data() as User;
    const updatedElderly: User = {
      ...elderlyData,
      connected_caregiver_id: undefined,
      connected_caregiver_name: undefined,
    };
    await setDoc(elderlyRef, cleanForFirestore(updatedElderly), { merge: true });
    persistUserLocally(updatedElderly);
    return updatedElderly;
  } catch (error) {
    console.error('Error unlinking elderly from caregiver in Firebase:', error);
    return null;
  }
}

export async function getAssignedElderlyIdsForCaregiver(
  caregiverId: string,
  caregiverCode?: string
): Promise<string[]> {
  try {
    const patientIds = new Set<string>();
    const cleanId = caregiverId.trim().toUpperCase();
    const cleanCode = (caregiverCode || '').trim().toUpperCase();

    // 1. Check caregiver_links collection
    try {
      const snap1 = await getDocs(collection(db, LINKS_COLLECTION));
      snap1.docs.forEach((docSnap) => {
        const data = docSnap.data();
        const cid = (data.caregiver_id || '').toUpperCase();
        const ccode = (data.caregiver_code || '').toUpperCase();
        if ((cid && (cid === cleanId || cid === cleanCode)) || (ccode && (ccode === cleanCode || ccode === cleanId))) {
          if (data.elderly_id) {
            patientIds.add(data.elderly_id);
          }
        }
      });
    } catch (e) {
      console.warn('Error reading caregiver_links:', e);
    }

    // 2. Check users collection where connected_caregiver_id matches
    try {
      const usersSnap = await getDocs(
        query(collection(db, USERS_COLLECTION), where('role', '==', 'elderly'))
      );
      usersSnap.docs.forEach((docSnap) => {
        const u = docSnap.data() as User;
        const conn = (u.connected_caregiver_id || '').trim().toUpperCase();
        if (conn && (conn === cleanId || (cleanCode && conn === cleanCode))) {
          patientIds.add(u.id);
        }
      });
    } catch (e) {
      console.warn('Error querying users for assigned caregiver:', e);
    }

    return Array.from(patientIds);
  } catch (error) {
    console.warn('Error getting assigned elderly ids from Firebase:', error);
    return [];
  }
}

// =========================================================================
// 2. Reminders & Daily Routines (User-Specific)
// =========================================================================

export async function getRemindersForUser(userId: string): Promise<Reminder[]> {
  try {
    const q = query(
      collection(db, REMINDERS_COLLECTION),
      where('user_id', '==', userId)
    );
    const snap = await getDocs(q);
    return snap.docs.map((d) => d.data() as Reminder);
  } catch (error) {
    console.warn('Error getting user reminders from Firebase:', error);
    return [];
  }
}

export async function saveReminderToFirebase(reminder: Reminder): Promise<void> {
  try {
    const ref = doc(db, REMINDERS_COLLECTION, reminder.id);
    await setDoc(ref, cleanForFirestore(reminder), { merge: true });
  } catch (error) {
    console.error('Error saving reminder to Firebase:', error);
  }
}

export async function toggleReminderInFirebase(reminderId: string, completed: boolean): Promise<void> {
  try {
    const ref = doc(db, REMINDERS_COLLECTION, reminderId);
    await updateDoc(ref, {
      completed,
      completed_at: completed ? new Date().toISOString() : null
    });
  } catch (error) {
    console.warn('Error toggling reminder in Firebase:', error);
  }
}

export async function deleteReminderFromFirebase(reminderId: string): Promise<void> {
  try {
    await deleteDoc(doc(db, REMINDERS_COLLECTION, reminderId));
  } catch (error) {
    console.warn('Error deleting reminder from Firebase:', error);
  }
}

// =========================================================================
// 3. Memory Journals (User-Specific)
// =========================================================================

export async function getJournalsForUser(userId: string): Promise<MemoryJournalEntry[]> {
  try {
    const q = query(
      collection(db, JOURNALS_COLLECTION),
      where('user_id', '==', userId)
    );
    const snap = await getDocs(q);
    return snap.docs.map((d) => d.data() as MemoryJournalEntry);
  } catch (error) {
    console.warn('Error getting journals from Firebase:', error);
    return [];
  }
}

export async function saveJournalToFirebase(journal: MemoryJournalEntry): Promise<void> {
  try {
    const ref = doc(db, JOURNALS_COLLECTION, journal.id);
    await setDoc(ref, cleanForFirestore(journal), { merge: true });
  } catch (error) {
    console.error('Error saving journal to Firebase:', error);
  }
}

// =========================================================================
// 4. Family Album Members (User-Specific)
// =========================================================================

export async function getFamilyForUser(userId: string): Promise<FamiliarPerson[]> {
  try {
    const q = query(
      collection(db, FAMILY_COLLECTION),
      where('user_id', '==', userId)
    );
    const snap = await getDocs(q);
    return snap.docs.map((d) => d.data() as FamiliarPerson);
  } catch (error) {
    console.warn('Error getting family members from Firebase:', error);
    return [];
  }
}

export async function saveFamilyMemberToFirebase(member: FamiliarPerson): Promise<void> {
  try {
    const ref = doc(db, FAMILY_COLLECTION, member.id);
    await setDoc(ref, cleanForFirestore(member), { merge: true });
  } catch (error) {
    console.error('Error saving family member to Firebase:', error);
  }
}

// =========================================================================
// 5. Game Sessions & Cognitive Tracking (User-Specific)
// =========================================================================

export async function getGameSessionsForUser(userId: string): Promise<GameSession[]> {
  try {
    const q = query(
      collection(db, SESSIONS_COLLECTION),
      where('user_id', '==', userId)
    );
    const snap = await getDocs(q);
    return snap.docs.map((d) => d.data() as GameSession);
  } catch (error) {
    console.warn('Error getting game sessions from Firebase:', error);
    return [];
  }
}

export async function saveGameSessionToFirebase(session: GameSession): Promise<void> {
  try {
    const ref = doc(db, SESSIONS_COLLECTION, session.id);
    await setDoc(ref, cleanForFirestore(session), { merge: true });
  } catch (error) {
    console.error('Error saving game session to Firebase:', error);
  }
}

export const ALL_PROFILES_LOCAL_REGISTRY_KEY = 'smritisaathi_saved_profiles_registry';

/**
 * Permanently stores a profile in the device's persistent profile registry.
 * This registry is NEVER cleared on logout, guaranteeing that all registered
 * profiles are preserved on this device across restarts and sessions.
 */
export function persistUserLocally(user: User): void {
  try {
    if (typeof window === 'undefined' || !user || !user.id) return;
    const existing = getAllLocallySavedUsers();
    const filtered = existing.filter((u) => u.id !== user.id);
    const updated = [user, ...filtered];
    localStorage.setItem(ALL_PROFILES_LOCAL_REGISTRY_KEY, JSON.stringify(updated));
  } catch (e) {
    console.warn('Could not persist profile in local registry:', e);
  }
}

/**
 * Persists multiple profiles into the permanent local registry without duplicates.
 */
export function persistMultipleUsersLocally(users: User[]): void {
  try {
    if (typeof window === 'undefined' || !Array.isArray(users)) return;
    const existing = getAllLocallySavedUsers();
    const map = new Map<string, User>();
    for (const u of existing) {
      if (u && u.id) map.set(u.id, u);
    }
    for (const u of users) {
      if (u && u.id) map.set(u.id, { ...(map.get(u.id) || {}), ...u });
    }
    localStorage.setItem(ALL_PROFILES_LOCAL_REGISTRY_KEY, JSON.stringify(Array.from(map.values())));
  } catch (e) {
    console.warn('Could not persist multiple profiles in local registry:', e);
  }
}

/**
 * Retrieves all profiles ever saved on this device.
 */
export function getAllLocallySavedUsers(): User[] {
  try {
    if (typeof window === 'undefined') return [];
    const raw = localStorage.getItem(ALL_PROFILES_LOCAL_REGISTRY_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    let updated = false;
    parsed.forEach((u) => {
      if (u && u.role === 'elderly' && !u.patient_id) {
        u.patient_id = `PT-${Math.floor(1000 + Math.random() * 9000)}`;
        updated = true;
      }
    });
    if (updated) {
      localStorage.setItem(ALL_PROFILES_LOCAL_REGISTRY_KEY, JSON.stringify(parsed));
    }
    return parsed;
  } catch (e) {
    console.warn('Could not retrieve local profiles registry:', e);
    return [];
  }
}

// =========================================================================
// 6. Seamless Remembering Session (User-Specific Auto-Login & Profile Recall)
// =========================================================================

export function saveRememberedUser(user: User): void {
  try {
    if (typeof window !== 'undefined') {
      localStorage.setItem(REMEMBERED_USER_KEY, JSON.stringify(user));
      // Also ensure it is permanently stored in the all-profiles registry
      persistUserLocally(user);
    }
  } catch (e) {
    console.warn('Could not cache session locally:', e);
  }
}

export function getRememberedUser(): User | null {
  try {
    if (typeof window !== 'undefined') {
      const raw = localStorage.getItem(REMEMBERED_USER_KEY);
      if (raw) {
        return JSON.parse(raw) as User;
      }
    }
  } catch (e) {
    console.warn('Could not read remembered user:', e);
  }
  return null;
}

export function clearRememberedUser(): void {
  try {
    if (typeof window !== 'undefined') {
      localStorage.removeItem(REMEMBERED_USER_KEY);
      // NOTE: We deliberately DO NOT delete smritisaathi_saved_profiles_registry here!
      // All profiles remain stored so users can easily select or switch profiles.
    }
  } catch (e) {
    console.warn('Could not clear remembered user:', e);
  }
}
