import { GameType, GameLevelProgress, LevelScoreRecord, LevelFinishResult } from '../types';
import { db, cleanForFirestore } from '../lib/firebase';
import { doc, setDoc, getDoc } from 'firebase/firestore';

const PROGRESS_STORAGE_PREFIX = 'smritisaathi_game_progress_v2';

function getStorageKey(userId: string, gameId: GameType): string {
  return `${PROGRESS_STORAGE_PREFIX}_${userId || 'default'}_${gameId}`;
}

/**
 * Returns initial progress with Level 1 unlocked and other levels locked.
 */
export function getDefaultGameProgress(userId: string, gameId: GameType): GameLevelProgress {
  return {
    userId: userId || 'default',
    gameId,
    unlockedLevel: 1,
    completedLevels: [],
    bestScorePerLevel: {},
    lastPlayedLevel: 1,
    updatedAt: new Date().toISOString(),
  };
}

/**
 * Synchronously retrieves game progress from localStorage (fast & immediate).
 */
export function getUserGameProgress(userId: string, gameId: GameType): GameLevelProgress {
  const defaultProg = getDefaultGameProgress(userId, gameId);
  if (typeof window === 'undefined') return defaultProg;

  try {
    const raw = localStorage.getItem(getStorageKey(userId, gameId));
    if (!raw) return defaultProg;
    const parsed = JSON.parse(raw) as GameLevelProgress;
    return {
      userId: parsed.userId || userId,
      gameId: parsed.gameId || gameId,
      unlockedLevel: Math.max(1, Math.min(10, parsed.unlockedLevel || 1)),
      completedLevels: Array.isArray(parsed.completedLevels) ? parsed.completedLevels : [],
      bestScorePerLevel: parsed.bestScorePerLevel || {},
      lastPlayedLevel: parsed.lastPlayedLevel || 1,
      updatedAt: parsed.updatedAt || new Date().toISOString(),
    };
  } catch (err) {
    console.warn('Error reading game progress from localStorage:', err);
    return defaultProg;
  }
}

/**
 * Saves progress immediately to localStorage, and syncs to Firestore in background.
 */
export async function saveUserGameProgress(progress: GameLevelProgress): Promise<void> {
  if (typeof window === 'undefined') return;

  const sanitized: GameLevelProgress = {
    ...progress,
    unlockedLevel: Math.max(1, Math.min(10, progress.unlockedLevel)),
    updatedAt: new Date().toISOString(),
  };

  try {
    localStorage.setItem(getStorageKey(sanitized.userId, sanitized.gameId), JSON.stringify(sanitized));
  } catch (e) {
    console.warn('Could not save game progress to localStorage:', e);
  }

  // Attempt Firestore sync if connected
  try {
    if (db && sanitized.userId) {
      const docRef = doc(db, 'game_progress', `${sanitized.userId}_${sanitized.gameId}`);
      await setDoc(docRef, cleanForFirestore(sanitized), { merge: true });
    }
  } catch (err) {
    // Graceful offline fallback
    console.warn('Firestore game progress sync skipped (operating offline):', err);
  }
}

/**
 * Pulls latest progress from Firestore if available, merging with local storage.
 */
export async function syncUserGameProgressFromRemote(userId: string, gameId: GameType): Promise<GameLevelProgress> {
  const local = getUserGameProgress(userId, gameId);
  try {
    if (db && userId) {
      const docRef = doc(db, 'game_progress', `${userId}_${gameId}`);
      const snap = await getDoc(docRef);
      if (snap.exists()) {
        const remote = snap.data() as GameLevelProgress;
        // Merge taking higher unlocked level & best scores
        const mergedUnlocked = Math.max(local.unlockedLevel, remote.unlockedLevel || 1);
        const mergedCompleted = Array.from(new Set([...local.completedLevels, ...(remote.completedLevels || [])])).sort((a, b) => a - b);
        const mergedScores: Record<number, LevelScoreRecord> = { ...local.bestScorePerLevel };
        
        if (remote.bestScorePerLevel) {
          for (const [lvlKey, rScore] of Object.entries(remote.bestScorePerLevel)) {
            const lvl = Number(lvlKey);
            const lScore = mergedScores[lvl];
            if (!lScore || rScore.score > lScore.score || (rScore.score === lScore.score && rScore.stars > lScore.stars)) {
              mergedScores[lvl] = rScore;
            }
          }
        }

        const merged: GameLevelProgress = {
          userId,
          gameId,
          unlockedLevel: mergedUnlocked,
          completedLevels: mergedCompleted,
          bestScorePerLevel: mergedScores,
          lastPlayedLevel: remote.lastPlayedLevel || local.lastPlayedLevel || 1,
          updatedAt: new Date().toISOString(),
        };

        saveUserGameProgress(merged).catch(() => {});
        return merged;
      }
    }
  } catch (e) {
    // Return local copy on any remote error
  }
  return local;
}

/**
 * Completes a level, updates best score/stars, unlocks next level, and persists changes.
 * Supports passing either a LevelFinishResult object or separate parameters.
 */
export async function recordLevelCompletion(
  userId: string,
  resultOrGameId: LevelFinishResult | GameType,
  levelNum?: number,
  statsInput?: {
    score: number;
    stars: number;
    timeSec: number;
    accuracy: number;
    attempts?: number;
    mistakes?: number;
    winConditionMet: boolean;
  }
): Promise<{ nextUnlocked: boolean; updatedProgress: GameLevelProgress }> {
  let gameId: GameType;
  let level: number;
  let stats: {
    score: number;
    stars: number;
    timeSec: number;
    accuracy: number;
    attempts?: number;
    mistakes?: number;
    winConditionMet: boolean;
  };

  if (typeof resultOrGameId === 'string') {
    gameId = resultOrGameId;
    level = levelNum || 1;
    stats = statsInput || {
      score: 0,
      stars: 0,
      timeSec: 0,
      accuracy: 0,
      winConditionMet: false,
    };
  } else {
    const res = resultOrGameId as LevelFinishResult;
    gameId = res.gameType;
    level = res.level;
    stats = {
      score: res.score,
      stars: res.stars,
      timeSec: res.timeSec,
      accuracy: res.accuracy,
      attempts: res.attempts,
      mistakes: res.mistakes,
      winConditionMet: res.won,
    };
  }

  const current = getUserGameProgress(userId, gameId);

  let nextUnlocked = false;
  const newCompletedLevels = new Set(current.completedLevels);
  let newUnlockedLevel = current.unlockedLevel;

  const existingBest = current.bestScorePerLevel[level];
  const isBetterScore = !existingBest || stats.score > existingBest.score || (stats.score === existingBest.score && stats.stars > existingBest.stars);

  const bestScoreRecord: LevelScoreRecord = isBetterScore
    ? {
        level,
        score: stats.score,
        stars: Math.max(stats.stars, existingBest?.stars || 0),
        timeSec: stats.timeSec,
        accuracy: stats.accuracy,
        attempts: stats.attempts,
        mistakes: stats.mistakes,
        completedAt: new Date().toISOString(),
      }
    : existingBest;

  if (stats.winConditionMet && stats.stars > 0) {
    newCompletedLevels.add(level);
    if (level >= current.unlockedLevel && level < 10) {
      newUnlockedLevel = level + 1;
      nextUnlocked = true;
    }
  }

  const updatedProgress: GameLevelProgress = {
    userId: userId || 'default',
    gameId,
    unlockedLevel: newUnlockedLevel,
    completedLevels: Array.from(newCompletedLevels).sort((a, b) => a - b),
    bestScorePerLevel: {
      ...current.bestScorePerLevel,
      [level]: bestScoreRecord,
    },
    lastPlayedLevel: level,
    updatedAt: new Date().toISOString(),
  };

  await saveUserGameProgress(updatedProgress);

  return {
    nextUnlocked,
    updatedProgress,
  };
}

/**
 * Resets progress for a game back to level 1 for replayability.
 */
export async function resetGameProgress(userId: string, gameId: GameType): Promise<GameLevelProgress> {
  const fresh = getDefaultGameProgress(userId, gameId);
  await saveUserGameProgress(fresh);
  return fresh;
}
