/**
 * Entuned Local Storage Persistence & Gamification Engine
 */

import { UserProgress, MissedConcept, Achievement } from '../types/music';
import { CURRICULUM_UNITS } from '../data/curriculum';

const STORAGE_KEY = 'entuned_user_progress_v2';

const INITIAL_ACHIEVEMENTS: Achievement[] = [
  {
    id: 'first_note',
    title: 'First Harmony',
    description: 'Complete your first music theory lesson',
    icon: 'Music',
    progress: 0,
    maxProgress: 1,
  },
  {
    id: 'keyboard_adept',
    title: 'Keyboard Adept',
    description: 'Master Unit 1: Piano & Note Names',
    icon: 'Keyboard',
    progress: 0,
    maxProgress: 1,
  },
  {
    id: 'streak_3',
    title: 'Consistent Ear',
    description: 'Reach a 3-day practice streak',
    icon: 'Flame',
    progress: 0,
    maxProgress: 3,
  },
  {
    id: 'triad_builder',
    title: 'Chord Architect',
    description: 'Spell 5 chords with perfect accuracy',
    icon: 'Layers',
    progress: 0,
    maxProgress: 5,
  },
  {
    id: 'century_xp',
    title: 'Theory Scholar',
    description: 'Accumulate 100 XP across all units',
    icon: 'Award',
    progress: 0,
    maxProgress: 100,
  },
];

function getDayString(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

function getCalendarDayDifference(from: string, to: string): number {
  if (!from) return Infinity;
  const [fromYear, fromMonth, fromDay] = from.split('-').map(Number);
  const [toYear, toMonth, toDay] = to.split('-').map(Number);
  const fromUtc = Date.UTC(fromYear, fromMonth - 1, fromDay);
  const toUtc = Date.UTC(toYear, toMonth - 1, toDay);
  return Math.round((toUtc - fromUtc) / 86400000);
}

function getWeeklyDays(): { day: string; active: boolean; date: string }[] {
  const days = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
  const now = new Date();
  const currentDayIndex = (now.getDay() + 6) % 7; // Monday = 0
  const monday = new Date(now);
  monday.setDate(now.getDate() - currentDayIndex);

  return days.map((dayName, idx) => {
    const d = new Date(monday);
    d.setDate(monday.getDate() + idx);
    const dateStr = getDayString(d);
    return {
      day: dayName,
      date: dateStr,
      active: false,
    };
  });
}

export function getDefaultProgress(): UserProgress {
  const todayStr = getDayString(new Date());

  return {
    currentUnitId: 1,
    currentLessonId: '1-1',
    completedLessonIds: [],
    completedCheckpointIds: [],
    checkpointScores: {},
    xp: 0,
    streak: 0,
    lastActiveDate: '',
    weeklyActivity: getWeeklyDays(),
    hearts: 5,
    lastHeartRegenTime: Date.now(),
    dailyGoalXp: 20,
    todayXp: 0,
    missedConcepts: [],
    achievements: INITIAL_ACHIEVEMENTS,
    onboardingCompleted: false,
    experienceLevel: 'beginner',
    instrumentFocus: 'piano',
    settings: {
      sfxEnabled: true,
      synthSound: 'felt_piano',
      pianoLabels: 'always',
      reducedMotion: false,
      volume: 0.8,
    },
  };
}

export function loadProgress(): UserProgress {
  if (typeof window === 'undefined') return getDefaultProgress();
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return getDefaultProgress();
    const parsed = JSON.parse(raw) as UserProgress;

    // Reset the daily XP counter on a new local calendar day.
    // Streaks and activity are updated only by an actual completed lesson.
    const todayStr = getDayString(new Date());
    if (parsed.lastActiveDate !== todayStr) {
      parsed.todayXp = 0;
    }

    // Passive heart regen: 1 heart per 20 minutes if under 5
    if (parsed.hearts < 5) {
      const elapsedMins = (Date.now() - (parsed.lastHeartRegenTime || Date.now())) / (1000 * 60);
      const heartsToAdd = Math.floor(elapsedMins / 20);
      if (heartsToAdd > 0) {
        parsed.hearts = Math.min(5, parsed.hearts + heartsToAdd);
        parsed.lastHeartRegenTime = Date.now();
      }
    }

    // Merge in any newly defined achievements
    if (!parsed.achievements || parsed.achievements.length < INITIAL_ACHIEVEMENTS.length) {
      parsed.achievements = INITIAL_ACHIEVEMENTS.map((initA) => {
        const existing = parsed.achievements?.find((a) => a.id === initA.id);
        return existing || initA;
      });
    }

    return parsed;
  } catch (e) {
    console.error('Failed to parse saved progress, resetting to defaults', e);
    return getDefaultProgress();
  }
}

export function saveProgress(progress: UserProgress): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(progress));
  } catch (e) {
    console.error('Failed to save user progress', e);
  }
}

/**
 * Updates progress upon completing a lesson
 */
export function recordLessonCompletion(
  currentProgress: UserProgress,
  lessonId: string,
  xpEarned: number
): UserProgress {
  const alreadyCompleted = currentProgress.completedLessonIds.includes(lessonId);
  const todayStr = getDayString(new Date());
  const dayDifference = getCalendarDayDifference(currentProgress.lastActiveDate, todayStr);
  const nextStreak = currentProgress.lastActiveDate === todayStr
    ? currentProgress.streak
    : dayDifference === 1
      ? currentProgress.streak + 1
      : 1;
  const awardedXp = alreadyCompleted ? 0 : xpEarned;
  const nextCompletedLessons = alreadyCompleted
    ? currentProgress.completedLessonIds
    : [...currentProgress.completedLessonIds, lessonId];
  const nextXp = currentProgress.xp + awardedXp;
  const nextTodayXp = (currentProgress.lastActiveDate === todayStr ? currentProgress.todayXp : 0) + awardedXp;
  const weeklyActivity = getWeeklyDays().map((day) => ({
    ...day,
    active: day.date === todayStr ||
      currentProgress.weeklyActivity.some((previous) => previous.date === day.date && previous.active),
  }));

  // Find next lesson to unlock
  let nextLessonId = currentProgress.currentLessonId;
  let nextUnitId = currentProgress.currentUnitId;

  const currentUnit = CURRICULUM_UNITS.find((u) => u.id === currentProgress.currentUnitId);
  if (currentUnit) {
    const curLessonIdx = currentUnit.lessons.findIndex((l) => l.id === lessonId);
    if (curLessonIdx !== -1 && curLessonIdx < currentUnit.lessons.length - 1) {
      nextLessonId = currentUnit.lessons[curLessonIdx + 1].id;
    }
  }

  // Update achievements
  const updatedAchievements = currentProgress.achievements.map((ach) => {
    if (ach.id === 'first_note') {
      return { ...ach, progress: 1, unlockedAt: ach.unlockedAt || Date.now() };
    }
    if (ach.id === 'century_xp') {
      const p = Math.min(100, nextXp);
      return { ...ach, progress: p, unlockedAt: p >= 100 ? ach.unlockedAt || Date.now() : undefined };
    }
    return ach;
  });

  const updated: UserProgress = {
    ...currentProgress,
    completedLessonIds: nextCompletedLessons,
    currentLessonId: nextLessonId,
    currentUnitId: nextUnitId,
    xp: nextXp,
    todayXp: nextTodayXp,
    streak: nextStreak,
    lastActiveDate: todayStr,
    weeklyActivity,
    achievements: updatedAchievements,
  };

  saveProgress(updated);
  return updated;
}

/**
 * Handle Checkpoint Quiz Results with Dynamic Rollback Penalty
 * "Add check in quizzes at the middle and end of each unit to make sure that the user is on track,
 * if not send them back 1-3 lessons depending on how they did on the quiz."
 */
export interface CheckpointResultOutcome {
  passed: boolean;
  scorePercent: number;
  xpEarned: number;
  rolledBackLessonIds: string[];
  message: string;
  updatedProgress: UserProgress;
}

export function evaluateCheckpointQuiz(
  currentProgress: UserProgress,
  checkpointId: string,
  unitId: number,
  scorePercent: number,
  passThresholdPercent: number,
  isMidUnit: boolean,
  xpReward: number
): CheckpointResultOutcome {
  const unit = CURRICULUM_UNITS.find((u) => u.id === unitId);
  const passed = scorePercent >= passThresholdPercent;
  let rolledBackLessonIds: string[] = [];
  let updatedProgress = { ...currentProgress };

  updatedProgress.checkpointScores = {
    ...updatedProgress.checkpointScores,
    [checkpointId]: scorePercent,
  };

  if (passed) {
    // Checkpoint Passed!
    const alreadyCompleted = updatedProgress.completedCheckpointIds.includes(checkpointId);
    const nextCompletedCheckpoints = Array.from(
      new Set([...updatedProgress.completedCheckpointIds, checkpointId])
    );
    updatedProgress.completedCheckpointIds = nextCompletedCheckpoints;
    if (!alreadyCompleted) {
      updatedProgress.xp += xpReward;
      updatedProgress.todayXp += xpReward;
    }

    // If unit exam passed, unlock next unit
    if (!isMidUnit && unitId < CURRICULUM_UNITS.length) {
      updatedProgress.currentUnitId = unitId + 1;
      const nextUnit = CURRICULUM_UNITS.find((u) => u.id === unitId + 1);
      if (nextUnit && nextUnit.lessons.length > 0) {
        updatedProgress.currentLessonId = nextUnit.lessons[0].id;
      }
    }

    saveProgress(updatedProgress);
    return {
      passed: true,
      scorePercent,
      xpEarned: xpReward,
      rolledBackLessonIds: [],
      message: isMidUnit
        ? 'Checkpoint Cleared! You demonstrated strong mastery of the core concepts.'
        : `Unit ${unitId} Mastered! Outstanding ear and theory execution.`,
      updatedProgress,
    };
  } else {
    // Checkpoint Failed (<70%) -> Roll back 1 to 3 lessons!
    let rollbackCount = 1;
    if (scorePercent < 45) {
      rollbackCount = 3;
    } else if (scorePercent < 60) {
      rollbackCount = 2;
    }

    if (unit) {
      // Find completed lessons in this unit
      const unitLessonIds = unit.lessons.map((l) => l.id);
      const completedInUnit = unitLessonIds.filter((id) =>
        updatedProgress.completedLessonIds.includes(id)
      );

      // Roll back the latest lessons from completion
      const lessonsToRemove = completedInUnit.slice(-rollbackCount);
      rolledBackLessonIds = lessonsToRemove;

      updatedProgress.completedLessonIds = updatedProgress.completedLessonIds.filter(
        (id) => !lessonsToRemove.includes(id)
      );

      // Reset current lesson pointer back to the earliest rolled-back lesson
      if (lessonsToRemove.length > 0) {
        updatedProgress.currentLessonId = lessonsToRemove[0];
        updatedProgress.currentUnitId = unitId;
      }
    }

    saveProgress(updatedProgress);
    return {
      passed: false,
      scorePercent,
      xpEarned: 0,
      rolledBackLessonIds,
      message: `Score: ${scorePercent}%. You need ${passThresholdPercent}% to advance. We've rolled you back ${rolledBackLessonIds.length} lesson${
        rolledBackLessonIds.length > 1 ? 's' : ''
      } to reinforce these foundational ideas.`,
      updatedProgress,
    };
  }
}

/**
 * Record a missed concept during lesson exercises
 */
export function addMissedConcept(
  progress: UserProgress,
  conceptTag: string,
  prompt: string,
  unitId: number
): UserProgress {
  const newConcept: MissedConcept = {
    id: `missed-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
    conceptTag,
    prompt,
    unitId,
    timestamp: Date.now(),
    resolved: false,
  };

  const updated: UserProgress = {
    ...progress,
    missedConcepts: [newConcept, ...progress.missedConcepts.slice(0, 19)], // keep last 20
  };

  saveProgress(updated);
  return updated;
}

export function resolveMissedConcept(
  progress: UserProgress,
  missedConceptId: string
): UserProgress {
  const updated: UserProgress = {
    ...progress,
    missedConcepts: progress.missedConcepts.map((m) =>
      m.id === missedConceptId ? { ...m, resolved: true } : m
    ),
  };
  saveProgress(updated);
  return updated;
}
