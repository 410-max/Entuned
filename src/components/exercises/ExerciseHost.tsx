/**
 * Entuned Interactive Exercise Host
 * Delivers bite-sized theory lessons, varied interactive exercises,
 * real-time feedback, hearts management, and checkpoint quiz evaluation.
 */

import React, { useState, useEffect, useCallback } from 'react';
import {
  X,
  Heart,
  Volume2,
  CheckCircle2,
  AlertCircle,
  ArrowRight,
  RotateCcw,
  Sparkles,
  Award,
  ChevronRight,
  Lightbulb,
} from 'lucide-react';
import {
  Lesson,
  UnitCheckpoint,
  Exercise,
  MultipleChoiceExercise,
  PianoTapExercise,
  StaffReadExercise,
  ChordSpellExercise,
  IntervalMatchExercise,
  RhythmTapExercise,
  UserProgress,
} from '../../types/music';
import { sound } from '../../audio/soundEngine';
import { PianoKeyboard } from '../piano/PianoKeyboard';
import { StaffVisual } from '../staff/StaffVisual';
import {
  recordLessonCompletion,
  evaluateCheckpointQuiz,
  addMissedConcept,
  CheckpointResultOutcome,
} from '../../utils/storage';

interface ExerciseHostProps {
  lesson?: Lesson;
  checkpoint?: UnitCheckpoint;
  progress: UserProgress;
  onClose: () => void;
  onFinish: (updatedProgress: UserProgress) => void;
}

export const ExerciseHost: React.FC<ExerciseHostProps> = ({
  lesson,
  checkpoint,
  progress,
  onClose,
  onFinish,
}) => {
  const isCheckpoint = !!checkpoint;
  const exercises: Exercise[] = checkpoint ? checkpoint.questions : lesson ? lesson.exercises : [];

  // Step -1 represents the intro reading slide (only for regular lessons with introContent)
  const [currentStep, setCurrentStep] = useState<number>(lesson?.introContent ? -1 : 0);
  const [selectedOption, setSelectedOption] = useState<string | null>(null);
  const [spelledNotes, setSpelledNotes] = useState<string[]>([]);
  const [isAnswerChecked, setIsAnswerChecked] = useState<boolean>(false);
  const [isCorrect, setIsCorrect] = useState<boolean>(false);
  const [currentHearts, setCurrentHearts] = useState<number>(progress.hearts);
  const [correctAnswersCount, setCorrectAnswersCount] = useState<number>(0);
  const [isCompleted, setIsCompleted] = useState<boolean>(false);
  const [checkpointOutcome, setCheckpointOutcome] = useState<CheckpointResultOutcome | null>(null);
  const [showExitConfirm, setShowExitConfirm] = useState<boolean>(false);

  // Rhythm tap exercise state
  const [rhythmMetronomeActive, setRhythmMetronomeActive] = useState<boolean>(false);
  const [rhythmTapTimes, setRhythmTapTimes] = useState<number[]>([]);
  const [rhythmStartTime, setRhythmStartTime] = useState<number | null>(null);
  const rhythmTapCount = rhythmTapTimes.length;

  const currentExercise = currentStep >= 0 && currentStep < exercises.length ? exercises[currentStep] : null;

  // Handle Metronome tick for rhythm exercises
  useEffect(() => {
    if (!rhythmMetronomeActive || !currentExercise || currentExercise.type !== 'rhythm_tap') return;
    const rhythmEx = currentExercise as RhythmTapExercise;
    const intervalMs = (60 / rhythmEx.bpm) * 1000;

    let beat = 0;
    sound.playMetronomeClick(true);
    const timer = setInterval(() => {
      beat = (beat + 1) % rhythmEx.pattern.length;
      sound.playMetronomeClick(beat === 0);
    }, intervalMs);

    return () => clearInterval(timer);
  }, [rhythmMetronomeActive, currentExercise]);

  const handleCheckAnswer = useCallback(
    (forcedCorrect?: boolean, answerVal?: string) => {
      if (!currentExercise || isAnswerChecked) return;

      let correct = false;

      if (typeof forcedCorrect === 'boolean') {
        correct = forcedCorrect;
      } else if (currentExercise.type === 'multiple_choice') {
        const mc = currentExercise as MultipleChoiceExercise;
        const chosen = mc.options.find((o) => o.id === (answerVal || selectedOption));
        correct = !!chosen?.isCorrect;
      } else if (currentExercise.type === 'staff_read') {
        const sr = currentExercise as StaffReadExercise;
        correct = (answerVal || selectedOption) === sr.correctOption;
      } else if (currentExercise.type === 'interval_match') {
        const im = currentExercise as IntervalMatchExercise;
        correct = (answerVal || selectedOption) === im.correctOption;
      } else if (currentExercise.type === 'chord_spell') {
        const cs = currentExercise as ChordSpellExercise;
        correct =
          spelledNotes.length === cs.targetNotes.length &&
          spelledNotes.every((n, i) => n === cs.targetNotes[i]);
      } else if (currentExercise.type === 'rhythm_tap') {
        const rh = currentExercise as RhythmTapExercise;
        const beatMs = 60000 / rh.bpm;
        const expectedBeats = Array.from({ length: rh.measureCount }, (_, measure) =>
          rh.pattern.map((hit, beat) => hit ? (measure * rh.pattern.length + beat) * beatMs : null)
        ).flat().filter((offset): offset is number => offset !== null);
        const toleranceMs = beatMs * 0.28;
        const matched = new Set<number>();
        correct = rhythmStartTime !== null &&
          expectedBeats.length === rh.targetTaps &&
          rhythmTapTimes.length === expectedBeats.length &&
          rhythmTapTimes.every((tapTime) => {
            const offset = tapTime - rhythmStartTime!;
            let closestIndex = -1;
            let closestDistance = Infinity;
            expectedBeats.forEach((expected, index) => {
              const distance = Math.abs(offset - expected);
              if (distance < closestDistance) {
                closestDistance = distance;
                closestIndex = index;
              }
            });
            if (closestDistance > toleranceMs || matched.has(closestIndex)) return false;
            matched.add(closestIndex);
            return true;
          }) && matched.size === expectedBeats.length;
      }

      setIsCorrect(correct);
      setIsAnswerChecked(true);

      if (correct) {
        sound.playCorrect();
        setCorrectAnswersCount((prev) => prev + 1);
      } else {
        sound.playIncorrect();
        // Record concept error
        addMissedConcept(
          progress,
          currentExercise.conceptTag,
          currentExercise.prompt,
          lesson?.unitId || checkpoint?.unitId || 1
        );

        // Deduct heart
        setCurrentHearts((prev) => Math.max(0, prev - 1));
      }
    },
    [
      currentExercise,
      isAnswerChecked,
      selectedOption,
      spelledNotes,
      rhythmTapTimes,
      rhythmStartTime,
      progress,
      lesson,
      checkpoint,
    ]
  );

  // Piano key tap handler during exercises
  const handlePianoNotePress = (note: string) => {
    if (isAnswerChecked || !currentExercise) return;

    if (currentExercise.type === 'piano_tap') {
      const pt = currentExercise as PianoTapExercise;
      const targetMatches = pt.allowAnyOctave
        ? pt.targetNotes.some((t) => t.replace(/\d/, '') === note.replace(/\d/, ''))
        : pt.targetNotes.includes(note);

      handleCheckAnswer(targetMatches);
    } else if (currentExercise.type === 'staff_read') {
      const sr = currentExercise as StaffReadExercise;
      // Extract pure note letter without octave
      const noteLetter = note.replace(/\d/, '');
      const isMatch = noteLetter.startsWith(sr.correctOption);
      setSelectedOption(sr.correctOption);
      handleCheckAnswer(isMatch, sr.correctOption);
    } else if (currentExercise.type === 'chord_spell') {
      const cs = currentExercise as ChordSpellExercise;
      if (spelledNotes.length < cs.targetNotes.length) {
        setSpelledNotes((prev) => [...prev, note]);
      }
    }
  };

  const handleNextStep = () => {
    setIsAnswerChecked(false);
    setSelectedOption(null);
    setSpelledNotes([]);
    setRhythmMetronomeActive(false);
    setRhythmTapTimes([]);
    setRhythmStartTime(null);

    const next = currentStep + 1;
    if (next < exercises.length) {
      setCurrentStep(next);
    } else {
      // Completed all exercises in this session!
      handleSessionComplete();
    }
  };

  const handleSessionComplete = () => {
    const totalCount = exercises.length || 1;
    const finalCorrect = correctAnswersCount + (isCorrect ? 0 : 0); // already counted
    const percent = Math.round((correctAnswersCount / totalCount) * 100);

    if (isCheckpoint && checkpoint) {
      const outcome = evaluateCheckpointQuiz(
        progress,
        checkpoint.id,
        checkpoint.unitId,
        percent,
        checkpoint.requiredPassPercent,
        checkpoint.isMidUnit,
        checkpoint.xpReward
      );
      setCheckpointOutcome(outcome);
      if (outcome.passed) {
        sound.playCheckpointSuccess();
      } else {
        sound.playIncorrect();
      }
    } else if (lesson) {
      sound.playLessonComplete();
      const updated = recordLessonCompletion(progress, lesson.id, lesson.xpReward);
      onFinish(updated);
    }

    setIsCompleted(true);
  };

  const progressPercentage =
    currentStep === -1
      ? 5
      : Math.round(((currentStep + (isAnswerChecked ? 1 : 0.4)) / Math.max(1, exercises.length)) * 100);

  // Keyboard shortcut for multiple choice (1-4) and Enter to check/continue
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (showExitConfirm) return;

      if (e.key === 'Enter') {
        if (currentStep === -1) {
          setCurrentStep(0);
        } else if (isAnswerChecked) {
          handleNextStep();
        } else if (selectedOption) {
          handleCheckAnswer();
        }
      } else if (!isAnswerChecked && currentExercise?.type === 'multiple_choice') {
        const mc = currentExercise as MultipleChoiceExercise;
        const num = parseInt(e.key, 10);
        if (num >= 1 && num <= mc.options.length) {
          const opt = mc.options[num - 1];
          setSelectedOption(opt.id);
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [showExitConfirm, currentStep, isAnswerChecked, selectedOption, currentExercise, handleCheckAnswer]);

  return (
    <div className="fixed inset-0 z-50 bg-[#070b16] text-[#f7f5ed] flex flex-col justify-between overflow-y-auto">
      {/* Top Header Bar */}
      <header className="w-full max-w-3xl mx-auto px-4 py-3 flex items-center justify-between gap-4 shrink-0">
        <button
          type="button"
          onClick={() => setShowExitConfirm(true)}
          className="p-2 text-[#9faabf] hover:text-white rounded-md transition-colors"
          aria-label="Exit lesson"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Progress Bar */}
        <div className="flex-1 max-w-md h-2.5 bg-[#121c38] rounded-full overflow-hidden border border-[#1e2f57]">
          <div
            className="h-full bg-gradient-to-r from-cyan-400 to-cyan-300 transition-all duration-300 ease-out"
            style={{ width: `${progressPercentage}%` }}
          />
        </div>

        {/* Hearts Tracker */}
        <div className="flex items-center gap-1.5 text-xs font-semibold text-rose-400 px-2.5 py-1 bg-[#191325] border border-rose-900/40 rounded-md">
          <Heart className="w-4 h-4 fill-rose-500 text-rose-500" />
          <span className="font-mono-numbers">{currentHearts}</span>
        </div>
      </header>

      {/* Main Interactive Stage */}
      <main className="w-full max-w-2xl mx-auto px-4 py-4 flex-1 flex flex-col justify-center">
        {/* Intro Concept Slide */}
        {currentStep === -1 && lesson?.introContent && (
          <div className="space-y-6 animate-fadeIn">
            <div className="space-y-2">
              <span className="text-xs uppercase tracking-wider text-cyan-400 font-semibold">
                Lesson Concept
              </span>
              <h2 className="text-2xl sm:text-3xl font-bold tracking-tight text-[#fcf9f2]">
                {lesson.introContent.headline}
              </h2>
            </div>

            <p className="text-base sm:text-lg text-[#ded7cb] leading-relaxed">
              {lesson.introContent.body}
            </p>

            {lesson.introContent.tip && (
              <div className="flex items-start gap-3 p-3.5 bg-[#101b38] border border-[#233560] rounded-lg text-sm text-cyan-200">
                <Lightbulb className="w-5 h-5 text-cyan-400 shrink-0 mt-0.5" />
                <span>{lesson.introContent.tip}</span>
              </div>
            )}

            {/* Interactive Preview Diagram */}
            {lesson.introContent.diagramType === 'keyboard' && (
              <div className="pt-2">
                <PianoKeyboard
                  startOctave={4}
                  octavesCount={1}
                  highlightedNotes={lesson.introContent.diagramNotes || ['C4']}
                  showLabels="always"
                  compact
                  allowOctaveShift={false}
                />
              </div>
            )}

            {lesson.introContent.diagramType === 'staff' && (
              <div className="pt-2">
                <StaffVisual
                  clef={lesson.introContent.diagramClef || 'treble'}
                  notes={
                    lesson.introContent.diagramNotes?.map((n) => ({
                      pitch: n.replace(/\d/, ''),
                      octave: parseInt(n.slice(-1), 10) || 4,
                      accidental: n.includes('#') ? 'sharp' : n.includes('b') ? 'flat' : undefined,
                    })) || [{ pitch: 'G', octave: 4 }]
                  }
                  caption="Hear notes on the staff lines"
                />
              </div>
            )}
          </div>
        )}

        {/* Active Exercise Slide */}
        {currentStep >= 0 && currentExercise && !isCompleted && (
          <div className="space-y-6">
            {/* Prompt Header */}
            <div className="space-y-1.5">
              <span className="text-xs font-semibold text-cyan-400 uppercase tracking-wide">
                {currentExercise.conceptTag}
              </span>
              <h2 className="text-xl sm:text-2xl font-bold text-[#fcf9f2] leading-snug">
                {currentExercise.prompt}
              </h2>
              {currentExercise.subtext && (
                <p className="text-sm text-[#9faabf]">{currentExercise.subtext}</p>
              )}
            </div>

            {/* Exercise Type 1: Multiple Choice */}
            {currentExercise.type === 'multiple_choice' && (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
                {(currentExercise as MultipleChoiceExercise).options.map((opt, idx) => {
                  const isSelected = selectedOption === opt.id;
                  return (
                    <button
                      key={opt.id}
                      type="button"
                      disabled={isAnswerChecked}
                      onClick={() => setSelectedOption(opt.id)}
                      className={`relative flex items-center justify-between p-4 text-left rounded-lg border btn-tactile transition-all ${
                        isSelected
                          ? 'bg-[#152347] border-cyan-400 text-white shadow-lg shadow-cyan-950/40 ring-1 ring-cyan-400'
                          : 'bg-[#0f172e] border-[#1f3056] text-[#ded7cb] hover:bg-[#14203e] hover:border-[#2d4477]'
                      }`}
                    >
                      <div className="space-y-0.5">
                        <div className="font-medium text-base">{opt.label}</div>
                        {opt.helper && (
                          <div className="text-xs text-[#9faabf]">{opt.helper}</div>
                        )}
                      </div>
                      <span className="text-xs font-mono text-[#627394] px-1.5 py-0.5 rounded border border-[#223358]">
                        {idx + 1}
                      </span>
                    </button>
                  );
                })}
              </div>
            )}

            {/* Exercise Type 2: Piano Tap */}
            {currentExercise.type === 'piano_tap' && (
              <div className="space-y-3 pt-2">
                <PianoKeyboard
                  startOctave={4}
                  octavesCount={2}
                  interactive={!isAnswerChecked}
                  onNotePress={handlePianoNotePress}
                  showLabels={progress.settings.pianoLabels}
                  highlightedNotes={isAnswerChecked && !isCorrect ? (currentExercise as PianoTapExercise).targetNotes : []}
                  compact={false}
                />
              </div>
            )}

            {/* Exercise Type 3: Staff Read */}
            {currentExercise.type === 'staff_read' && (
              <div className="space-y-4 pt-1">
                <StaffVisual
                  clef={(currentExercise as StaffReadExercise).clef}
                  notes={[
                    {
                      pitch: (currentExercise as StaffReadExercise).displayedNote.pitch,
                      octave: (currentExercise as StaffReadExercise).displayedNote.octave,
                      accidental: (currentExercise as StaffReadExercise).displayedNote.accidental,
                    },
                  ]}
                  caption="Identify this pitch on the staff"
                />

                <div className="grid grid-cols-4 gap-2.5">
                  {(currentExercise as StaffReadExercise).options.map((opt) => {
                    const isSelected = selectedOption === opt;
                    return (
                      <button
                        key={opt}
                        type="button"
                        disabled={isAnswerChecked}
                        onClick={() => setSelectedOption(opt)}
                        className={`py-3 text-lg font-bold rounded-lg border btn-tactile transition-colors ${
                          isSelected
                            ? 'bg-[#152347] border-cyan-400 text-cyan-200 ring-1 ring-cyan-400'
                            : 'bg-[#0f172e] border-[#1f3056] text-[#ded7cb] hover:bg-[#14203e]'
                        }`}
                      >
                        {opt}
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Exercise Type 4: Chord Spell */}
            {currentExercise.type === 'chord_spell' && (
              <div className="space-y-4 pt-2">
                {/* Spelled Notes Tray */}
                <div className="flex items-center justify-center gap-3 p-4 bg-[#0a1022] border border-[#1d2d52] rounded-lg">
                  {(currentExercise as ChordSpellExercise).targetNotes.map((_, i) => {
                    const note = spelledNotes[i];
                    return (
                      <div
                        key={i}
                        className={`w-14 h-14 flex items-center justify-center rounded-md border text-lg font-bold transition-all ${
                          note
                            ? 'bg-cyan-950/80 border-cyan-400 text-cyan-200'
                            : 'bg-[#0f1830] border-dashed border-[#2b3e6c] text-[#556994]'
                        }`}
                      >
                        {note ? note.replace(/\d/, '') : `—`}
                      </div>
                    );
                  })}
                </div>

                {/* Available Note Selector & Clear */}
                <div className="flex flex-wrap justify-center gap-2">
                  {(currentExercise as ChordSpellExercise).availableNotes.map((note) => {
                    const isPicked = spelledNotes.includes(note);
                    return (
                      <button
                        key={note}
                        type="button"
                        disabled={isPicked || isAnswerChecked}
                        onClick={() => {
                          if (spelledNotes.length < (currentExercise as ChordSpellExercise).targetNotes.length) {
                            sound.playNote(note);
                            setSpelledNotes((prev) => [...prev, note]);
                          }
                        }}
                        className="px-3.5 py-2 text-sm font-semibold rounded-md border border-[#233560] bg-[#121c38] text-[#ded7cb] hover:border-cyan-400 hover:text-white disabled:opacity-30 disabled:cursor-not-allowed btn-tactile"
                      >
                        {note.replace(/\d/, '')}
                      </button>
                    );
                  })}
                  <button
                    type="button"
                    disabled={spelledNotes.length === 0 || isAnswerChecked}
                    onClick={() => setSpelledNotes([])}
                    className="flex items-center gap-1 px-3 py-2 text-xs text-[#9faabf] hover:text-white disabled:opacity-30 transition-colors"
                  >
                    <RotateCcw className="w-3.5 h-3.5" />
                    Reset
                  </button>
                </div>
              </div>
            )}

            {/* Exercise Type 5: Interval Match */}
            {currentExercise.type === 'interval_match' && (
              <div className="space-y-4 pt-2">
                <div className="flex items-center justify-center gap-4 p-4 bg-[#0a1022] border border-[#1d2d52] rounded-lg">
                  <div className="text-center">
                    <span className="text-xs text-[#9faabf]">Note A</span>
                    <div className="text-2xl font-bold text-cyan-300">
                      {(currentExercise as IntervalMatchExercise).noteA}
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      const im = currentExercise as IntervalMatchExercise;
                      sound.playNote(im.noteA);
                      setTimeout(() => sound.playNote(im.noteB), 400);
                    }}
                    className="p-3 rounded-full bg-[#14203e] border border-cyan-500/40 text-cyan-300 hover:bg-[#1b2b54] btn-tactile"
                    aria-label="Play interval audio"
                  >
                    <Volume2 className="w-6 h-6" />
                  </button>
                  <div className="text-center">
                    <span className="text-xs text-[#9faabf]">Note B</span>
                    <div className="text-2xl font-bold text-violet-300">
                      {(currentExercise as IntervalMatchExercise).noteB}
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-2.5">
                  {(currentExercise as IntervalMatchExercise).options.map((opt) => {
                    const isSelected = selectedOption === opt;
                    return (
                      <button
                        key={opt}
                        type="button"
                        disabled={isAnswerChecked}
                        onClick={() => setSelectedOption(opt)}
                        className={`p-3.5 text-sm font-semibold rounded-lg border btn-tactile transition-colors ${
                          isSelected
                            ? 'bg-[#152347] border-cyan-400 text-white ring-1 ring-cyan-400'
                            : 'bg-[#0f172e] border-[#1f3056] text-[#ded7cb] hover:bg-[#14203e]'
                        }`}
                      >
                        {opt}
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Exercise Type 6: Rhythm Tap */}
            {currentExercise.type === 'rhythm_tap' && (
              <div className="space-y-4 pt-2 text-center">
                <div className="p-6 bg-[#0a1022] border border-[#1d2d52] rounded-lg space-y-4">
                  <div className="text-sm text-[#ded7cb]">
                    Metronome: <span className="text-cyan-400 font-bold font-mono-numbers">{(currentExercise as RhythmTapExercise).bpm} BPM</span>
                  </div>

                  <div className="flex justify-center gap-3">
                    <button
                      type="button"
                      onClick={() => {
                        if (rhythmMetronomeActive) {
                          setRhythmMetronomeActive(false);
                          setRhythmStartTime(null);
                          setRhythmTapTimes([]);
                        } else {
                          setRhythmTapTimes([]);
                          setRhythmStartTime(Date.now());
                          setRhythmMetronomeActive(true);
                        }
                      }}
                      className={`px-4 py-2 text-xs font-semibold rounded-md border btn-tactile ${
                        rhythmMetronomeActive
                          ? 'bg-cyan-500 text-slate-950 border-cyan-400'
                          : 'bg-[#152347] text-cyan-200 border-[#253966]'
                      }`}
                    >
                      {rhythmMetronomeActive ? 'Stop Click' : 'Start Metronome'}
                    </button>
                  </div>

                  {/* Tactile Big Tap Button */}
                  <div className="pt-2">
                    <button
                      type="button"
                      disabled={!rhythmMetronomeActive || isAnswerChecked}
                      onClick={() => {
                        sound.playSoftTap();
                        setRhythmTapTimes((prev) => [...prev, Date.now()]);
                      }}
                      className="w-28 h-28 mx-auto rounded-full bg-gradient-to-br from-cyan-600 to-cyan-800 active:scale-95 border-2 border-cyan-300 text-white text-base font-bold shadow-xl shadow-cyan-950 flex flex-col items-center justify-center btn-tactile"
                    >
                      <span>{rhythmMetronomeActive ? 'TAP' : 'START METRONOME FIRST'}</span>
                      <span className="text-xs font-normal opacity-80 font-mono-numbers">
                        {rhythmTapCount} / {(currentExercise as RhythmTapExercise).targetTaps}
                      </span>
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Completion Screen */}
        {isCompleted && (
          <div className="space-y-6 text-center animate-fadeIn py-6">
            <div className="w-16 h-16 mx-auto rounded-full bg-[#122244] border border-cyan-400/40 flex items-center justify-center text-cyan-300">
              <Award className="w-8 h-8" />
            </div>

            <div className="space-y-2">
              <h2 className="text-2xl sm:text-3xl font-bold text-[#fcf9f2]">
                {isCheckpoint
                  ? checkpointOutcome?.passed
                    ? 'Checkpoint Cleared!'
                    : 'Review & Strengthen'
                  : 'Lesson Complete!'}
              </h2>
              <p className="text-sm sm:text-base text-[#ded7cb] max-w-md mx-auto">
                {isCheckpoint
                  ? checkpointOutcome?.message
                  : `You earned +${lesson?.xpReward} XP. Consistent daily steps build lifelong musical fluency.`}
              </p>
            </div>

            {/* Checkpoint Rollback Notice */}
            {isCheckpoint && !checkpointOutcome?.passed && checkpointOutcome?.rolledBackLessonIds.length ? (
              <div className="p-4 bg-amber-950/40 border border-amber-700/50 rounded-lg text-left max-w-md mx-auto space-y-2 text-xs text-amber-200">
                <div className="flex items-center gap-2 font-semibold text-amber-300">
                  <AlertCircle className="w-4 h-4" />
                  <span>Review Loop Activated</span>
                </div>
                <p>
                  We rolled back {checkpointOutcome.rolledBackLessonIds.length} lesson(s) in this unit.
                  Complete them again to solidify these principles before re-attempting this checkpoint.
                </p>
              </div>
            ) : null}

            <div className="pt-4 flex justify-center">
              <button
                type="button"
                onClick={() => {
                  if (checkpointOutcome) {
                    onFinish(checkpointOutcome.updatedProgress);
                  } else {
                    onClose();
                  }
                }}
                className="px-6 py-3 text-sm font-semibold text-slate-950 bg-cyan-400 hover:bg-cyan-300 rounded-lg shadow-lg shadow-cyan-950 btn-tactile flex items-center gap-2"
              >
                <span>Continue</span>
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}
      </main>

      {/* Bottom Action / Feedback Drawer */}
      {!isCompleted && (
        <footer
          className={`w-full border-t transition-colors ${
            isAnswerChecked
              ? isCorrect
                ? 'bg-[#081a26] border-emerald-900/60'
                : 'bg-[#1d0e14] border-rose-900/60'
              : 'bg-[#080d1c] border-[#162340]'
          }`}
        >
          <div className="w-full max-w-2xl mx-auto px-4 py-4 flex flex-col sm:flex-row items-center justify-between gap-4">
            {/* Feedback Message */}
            <div className="w-full sm:w-auto flex-1">
              {isAnswerChecked ? (
                <div className="flex items-start gap-3">
                  {isCorrect ? (
                    <CheckCircle2 className="w-6 h-6 text-emerald-400 shrink-0 mt-0.5" />
                  ) : (
                    <AlertCircle className="w-6 h-6 text-rose-400 shrink-0 mt-0.5" />
                  )}
                  <div>
                    <h4
                      className={`text-base font-bold ${
                        isCorrect ? 'text-emerald-300' : 'text-rose-300'
                      }`}
                    >
                      {isCorrect ? 'Accurate!' : 'Needs Review'}
                    </h4>
                    <p className="text-xs text-[#ded7cb] mt-0.5">
                      {currentExercise?.explanation}
                    </p>
                  </div>
                </div>
              ) : currentStep === -1 ? (
                <div className="text-xs text-[#9faabf]">
                  Press Start to begin interactive practice.
                </div>
              ) : (
                <div className="text-xs text-[#9faabf]">
                  {currentExercise?.type === 'piano_tap'
                    ? 'Tap the matching note on the keyboard above'
                    : 'Choose your answer and check'}
                </div>
              )}
            </div>

            {/* Action Button */}
            <div className="w-full sm:w-auto shrink-0 flex justify-end">
              {currentStep === -1 ? (
                <button
                  type="button"
                  onClick={() => setCurrentStep(0)}
                  className="w-full sm:w-auto px-6 py-2.5 text-sm font-semibold text-slate-950 bg-cyan-400 hover:bg-cyan-300 rounded-lg btn-tactile"
                >
                  Start Exercises
                </button>
              ) : isAnswerChecked ? (
                <button
                  type="button"
                  onClick={handleNextStep}
                  className={`w-full sm:w-auto px-6 py-2.5 text-sm font-semibold rounded-lg btn-tactile flex items-center justify-center gap-2 ${
                    isCorrect
                      ? 'bg-emerald-400 text-slate-950 hover:bg-emerald-300'
                      : 'bg-rose-500 text-white hover:bg-rose-400'
                  }`}
                >
                  <span>Continue</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              ) : (
                <button
                  type="button"
                  disabled={
                    currentExercise?.type === 'multiple_choice' ||
                    currentExercise?.type === 'staff_read' ||
                    currentExercise?.type === 'interval_match'
                      ? !selectedOption
                      : currentExercise?.type === 'chord_spell'
                      ? spelledNotes.length !== (currentExercise as ChordSpellExercise).targetNotes.length
                      : currentExercise?.type === 'rhythm_tap'
                      ? !rhythmMetronomeActive || rhythmTapCount === 0
                      : false
                  }
                  onClick={() => handleCheckAnswer()}
                  className="w-full sm:w-auto px-6 py-2.5 text-sm font-semibold text-slate-950 bg-cyan-400 hover:bg-cyan-300 disabled:opacity-40 disabled:cursor-not-allowed rounded-lg btn-tactile"
                >
                  Check Answer
                </button>
              )}
            </div>
          </div>
        </footer>
      )}

      {/* Exit Confirmation Modal */}
      {showExitConfirm && (
        <div className="fixed inset-0 z-50 bg-black/70 flex items-center justify-center p-4">
          <div className="w-full max-w-sm bg-[#0e172e] border border-[#233560] rounded-xl p-5 space-y-4">
            <h3 className="text-lg font-bold text-[#fcf9f2]">Quit this lesson?</h3>
            <p className="text-xs text-[#ded7cb] leading-relaxed">
              Your progress in this session won&apos;t be saved if you leave now. It only takes a couple more minutes!
            </p>
            <div className="flex gap-2 justify-end pt-2">
              <button
                type="button"
                onClick={() => setShowExitConfirm(false)}
                className="px-3.5 py-1.5 text-xs font-semibold text-cyan-300 bg-[#162344] hover:bg-[#1d2d56] rounded-md transition-colors"
              >
                Keep Going
              </button>
              <button
                type="button"
                onClick={() => {
                  setShowExitConfirm(false);
                  onClose();
                }}
                className="px-3.5 py-1.5 text-xs font-semibold text-rose-300 hover:text-rose-200 transition-colors"
              >
                End Lesson
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
