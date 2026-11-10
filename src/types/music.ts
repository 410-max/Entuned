/**
 * Entuned Music Theory Application Types
 */

export type Clef = 'treble' | 'bass';

export interface NotePitch {
  name: string; // e.g. "C", "D#", "Eb"
  octave: number; // e.g. 4
  midi: number; // e.g. 60 for C4
  freq: number; // e.g. 261.63
  accidental?: 'sharp' | 'flat' | 'natural';
}

export type ExerciseType =
  | 'multiple_choice'
  | 'piano_tap'
  | 'staff_read'
  | 'chord_spell'
  | 'interval_match'
  | 'rhythm_tap';

export interface BaseExercise {
  id: string;
  type: ExerciseType;
  prompt: string;
  subtext?: string;
  conceptTag: string; // e.g. "White Keys", "Treble Spaces", "Major 3rd"
  explanation: string;
  audioPreviewNote?: string; // e.g. "C4"
}

export interface MultipleChoiceExercise extends BaseExercise {
  type: 'multiple_choice';
  options: {
    id: string;
    label: string;
    isCorrect: boolean;
    helper?: string;
  }[];
}

export interface PianoTapExercise extends BaseExercise {
  type: 'piano_tap';
  targetNotes: string[]; // e.g. ["C4"] or multiple if sequence
  hintNote?: string;
  allowAnyOctave?: boolean;
}

export interface StaffReadExercise extends BaseExercise {
  type: 'staff_read';
  clef: Clef;
  displayedNote: {
    pitch: string; // e.g. "G"
    octave: number; // e.g. 4
    accidental?: 'sharp' | 'flat' | 'natural';
  };
  options: string[]; // e.g. ["E", "F", "G", "A"]
  correctOption: string;
  allowPianoInput?: boolean;
}

export interface ChordSpellExercise extends BaseExercise {
  type: 'chord_spell';
  chordName: string; // e.g. "C Major Triad"
  root: string; // "C4"
  formula: string; // "Root - Major 3rd - Perfect 5th"
  targetNotes: string[]; // ["C4", "E4", "G4"]
  availableNotes: string[]; // ["C4", "D4", "Eb4", "E4", "F4", "G4", "Ab4", "A4"]
}

export interface IntervalMatchExercise extends BaseExercise {
  type: 'interval_match';
  noteA: string; // "C4"
  noteB: string; // "G4"
  halfSteps: number;
  intervalName: string; // "Perfect 5th"
  options: string[]; // ["Minor 3rd", "Perfect 4th", "Perfect 5th", "Major 6th"]
  correctOption: string;
}

export interface RhythmTapExercise extends BaseExercise {
  type: 'rhythm_tap';
  bpm: number;
  timeSignature: [number, number]; // [4, 4]
  measureCount: number;
  pattern: number[]; // 1 = hit on beat, 0 = rest. e.g. [1, 1, 0, 1]
  targetTaps: number;
}

export type Exercise =
  | MultipleChoiceExercise
  | PianoTapExercise
  | StaffReadExercise
  | ChordSpellExercise
  | IntervalMatchExercise
  | RhythmTapExercise;

export interface Lesson {
  id: string;
  unitId: number;
  lessonIndex: number;
  title: string;
  description: string;
  estimatedMinutes: number;
  xpReward: number;
  introContent: {
    headline: string;
    body: string;
    tip?: string;
    diagramType?: 'keyboard' | 'staff' | 'intervals' | 'circle_fifths' | 'chords';
    diagramNotes?: string[];
    diagramClef?: Clef;
  };
  exercises: Exercise[];
}

export interface UnitCheckpoint {
  id: string;
  unitId: number;
  title: string;
  isMidUnit: boolean; // true = mid-unit checkpoint (3-4 questions), false = unit mastery exam (5-6 questions)
  requiredPassPercent: number; // e.g. 70
  xpReward: number;
  questions: Exercise[];
  penaltyLessonRollback: number; // 1 to 3 lessons to roll back if user fails < 70%
}

export interface Unit {
  id: number;
  slug: string;
  title: string;
  subtitle: string;
  description: string;
  colorScheme: {
    accent: string;
    glow: string;
    border: string;
  };
  lessons: Lesson[];
  midCheckpoint: UnitCheckpoint;
  unitExam: UnitCheckpoint;
}

export interface MissedConcept {
  id: string;
  conceptTag: string;
  prompt: string;
  unitId: number;
  timestamp: number;
  resolved: boolean;
}

export interface Achievement {
  id: string;
  title: string;
  description: string;
  icon: string;
  unlockedAt?: number;
  progress: number;
  maxProgress: number;
}

export interface UserProgress {
  currentUnitId: number;
  currentLessonId: string;
  completedLessonIds: string[];
  completedCheckpointIds: string[];
  checkpointScores: Record<string, number>; // checkpointId -> percentage (0-100)
  xp: number;
  streak: number;
  lastActiveDate: string; // YYYY-MM-DD
  weeklyActivity: {
    day: string; // Mon, Tue, etc.
    active: boolean;
    date: string;
  }[];
  hearts: number;
  lastHeartRegenTime: number;
  dailyGoalXp: number;
  todayXp: number;
  missedConcepts: MissedConcept[];
  achievements: Achievement[];
  onboardingCompleted: boolean;
  experienceLevel: 'beginner' | 'intermediate' | 'advanced';
  instrumentFocus: 'piano' | 'general' | 'guitar';
  settings: {
    sfxEnabled: boolean;
    synthSound: 'felt_piano' | 'bright_bell' | 'warm_reed';
    pianoLabels: 'always' | 'middle_c' | 'hidden';
    reducedMotion: boolean;
    volume: number;
  };
}
