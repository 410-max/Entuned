/**
 * Entuned Visual Learning Roadmap & Dashboard View
 * Duolingo-style progression with units, curved path nodes,
 * mid-unit checkpoints, unit exams, and daily goal tracker.
 */

import React, { useState } from 'react';
import {
  Check,
  Lock,
  Play,
  Award,
  Sparkles,
  ArrowRight,
  ShieldCheck,
  ChevronDown,
  ChevronUp,
  Target,
  Flame,
} from 'lucide-react';
import { Unit, Lesson, UnitCheckpoint, UserProgress } from '../../types/music';
import { CURRICULUM_UNITS } from '../../data/curriculum';
import { sound } from '../../audio/soundEngine';

interface RoadmapViewProps {
  progress: UserProgress;
  onStartLesson: (lesson: Lesson) => void;
  onStartCheckpoint: (checkpoint: UnitCheckpoint) => void;
}

export const RoadmapView: React.FC<RoadmapViewProps> = ({
  progress,
  onStartLesson,
  onStartCheckpoint,
}) => {
  const [expandedUnitId, setExpandedUnitId] = useState<number>(progress.currentUnitId);

  // Find currently active lesson object
  const currentUnit =
    CURRICULUM_UNITS.find((u) => u.id === progress.currentUnitId) || CURRICULUM_UNITS[0];
  const currentLesson =
    currentUnit.lessons.find((l) => l.id === progress.currentLessonId) || currentUnit.lessons[0];

  const dailyGoalPercent = Math.min(
    100,
    Math.round((progress.todayXp / Math.max(1, progress.dailyGoalXp)) * 100)
  );

  return (
    <div className="w-full max-w-4xl mx-auto px-4 sm:px-6 pt-6 pb-24 space-y-8 animate-fadeIn">
      {/* =========================================================================
          DASHBOARD HERO: GREETING, CONTINUE CARD, DAILY GOAL & WEEKLY STREAK
         ========================================================================= */}
      <section className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Continue Learning Action Card (2 columns on desktop) */}
        <div className="md:col-span-2 bg-[#0c142b] border border-[#1b2b52] rounded-xl p-5 sm:p-6 flex flex-col justify-between gap-4 shadow-xl relative overflow-hidden">
          <div className="space-y-2 relative z-10">
            <div className="flex items-center gap-2 text-xs font-medium text-cyan-400">
              <span>Unit {currentUnit.id}</span>
              <span aria-hidden="true">·</span>
              <span>Lesson {currentLesson.lessonIndex} of {currentUnit.lessons.length}</span>
            </div>

            <h2 className="text-xl sm:text-2xl font-bold tracking-tight text-[#fcf9f2]">
              {currentLesson.title}
            </h2>

            <p className="text-xs sm:text-sm text-[#ded7cb] leading-relaxed max-w-lg">
              {currentLesson.description}
            </p>
          </div>

          <div className="flex flex-wrap items-center justify-between gap-4 pt-2 border-t border-[#19274a] relative z-10">
            <div className="text-xs text-[#9faabf]">
              <span>Reward: </span>
              <span className="text-cyan-300 font-semibold font-mono-numbers">
                +{currentLesson.xpReward} XP
              </span>
              <span className="mx-2">·</span>
              <span>~{currentLesson.estimatedMinutes} min</span>
            </div>

            <button
              type="button"
              onClick={() => {
                sound.playSoftTap();
                onStartLesson(currentLesson);
              }}
              className="px-5 py-2.5 text-sm font-semibold text-slate-950 bg-cyan-400 hover:bg-cyan-300 rounded-lg shadow-md shadow-cyan-950 flex items-center gap-2 btn-tactile"
            >
              <span>Continue Learning</span>
              <Play className="w-4 h-4 fill-slate-950" />
            </button>
          </div>

          {/* Decorative subtle background musical curve */}
          <div className="absolute -right-8 -bottom-10 opacity-5 pointer-events-none text-cyan-300">
            <svg width="220" height="220" viewBox="0 0 100 100" fill="currentColor">
              <path d="M20 80 Q 50 10 80 80 T 140 80" />
            </svg>
          </div>
        </div>

        {/* Daily Goal & Weekly Activity Tracker (1 column on desktop) */}
        <div className="bg-[#0c142b] border border-[#1b2b52] rounded-xl p-5 flex flex-col justify-between gap-4 shadow-xl">
          <div className="space-y-3">
            <div className="flex items-center justify-between text-xs">
              <span className="text-[#ded7cb] font-medium">Daily Goal</span>
              <span className="font-mono-numbers font-semibold text-cyan-300">
                {progress.todayXp} / {progress.dailyGoalXp} XP
              </span>
            </div>

            {/* Daily Goal Progress Bar */}
            <div className="w-full h-2 bg-[#121c38] rounded-full overflow-hidden border border-[#1d2d52]">
              <div
                className="h-full bg-gradient-to-r from-cyan-400 to-cyan-300 transition-all duration-300 ease-out"
                style={{ width: `${dailyGoalPercent}%` }}
              />
            </div>

            {dailyGoalPercent >= 100 ? (
              <div className="text-[11px] text-emerald-300 flex items-center gap-1 font-medium">
                <Check className="w-3.5 h-3.5" />
                <span>Daily goal reached! Keep going!</span>
              </div>
            ) : (
              <div className="text-[11px] text-[#9faabf]">
                {progress.dailyGoalXp - progress.todayXp} XP left to hit today&apos;s goal.
              </div>
            )}
          </div>

          {/* Weekly Heatmap / Activity Strip */}
          <div className="pt-3 border-t border-[#19274a] space-y-2">
            <div className="flex items-center justify-between text-[11px] text-[#9faabf]">
              <span>Weekly Streak</span>
              <span className="flex items-center gap-1 text-amber-400 font-semibold">
                <Flame className="w-3 h-3 fill-amber-500" />
                <span className="font-mono-numbers">{progress.streak} days</span>
              </span>
            </div>

            <div className="grid grid-cols-7 gap-1.5 text-center">
              {progress.weeklyActivity.map((dayItem, idx) => (
                <div key={idx} className="flex flex-col items-center gap-1">
                  <span className="text-[10px] text-[#8090b2]">{dayItem.day}</span>
                  <div
                    className={`w-6 h-6 rounded flex items-center justify-center text-[10px] font-mono-numbers transition-colors ${
                      dayItem.active
                        ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-400/50 font-bold'
                        : 'bg-[#101830] text-[#4d5e82] border border-[#1a2748]'
                    }`}
                  >
                    {dayItem.active ? '✓' : '·'}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* =========================================================================
          CURRICULUM UNITS & ROADMAP PATH
         ========================================================================= */}
      <section className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-lg font-bold text-[#fcf9f2]">Curriculum Roadmap</h3>
            <p className="text-xs text-[#9faabf]">
              Progress sequentially through all 8 units. Checkpoints test and anchor your skills.
            </p>
          </div>
          <span className="text-xs text-[#9faabf] font-mono-numbers">
            {progress.completedLessonIds.length} lessons mastered
          </span>
        </div>

        <div className="space-y-6">
          {CURRICULUM_UNITS.map((unit) => {
            const isUnlocked = unit.id <= progress.currentUnitId;
            const isCurrent = unit.id === progress.currentUnitId;
            const isCompleted =
              progress.completedCheckpointIds.includes(unit.unitExam.id) ||
              unit.id < progress.currentUnitId;
            const isExpanded = expandedUnitId === unit.id;

            // Completed lessons in this unit
            const unitLessonIds = unit.lessons.map((l) => l.id);
            const unitCompletedCount = unitLessonIds.filter((id) =>
              progress.completedLessonIds.includes(id)
            ).length;

            return (
              <div
                key={unit.id}
                className={`rounded-xl border transition-all ${
                  isCurrent
                    ? 'bg-[#0a1126] border-cyan-500/40 shadow-xl'
                    : isUnlocked
                    ? 'bg-[#090f22] border-[#18284c]'
                    : 'bg-[#070b1a]/60 border-[#121c35] opacity-75'
                }`}
              >
                {/* Unit Header Bar */}
                <button
                  type="button"
                  onClick={() => {
                    sound.playSoftTap();
                    setExpandedUnitId(isExpanded ? 0 : unit.id);
                  }}
                  className="w-full p-4 sm:p-5 flex items-center justify-between text-left focus:outline-none"
                  aria-expanded={isExpanded}
                >
                  <div className="space-y-1">
                    <div className="flex items-center gap-2 text-xs font-semibold">
                      <span
                        className={
                          isCurrent
                            ? 'text-cyan-400'
                            : isCompleted
                            ? 'text-emerald-400'
                            : 'text-[#8b9bb4]'
                        }
                      >
                        Unit {unit.id}
                      </span>
                      <span aria-hidden="true" className="text-[#3b4b6f]">
                        ·
                      </span>
                      <span className="text-[#ded7cb]">{unit.subtitle}</span>
                    </div>

                    <h4 className="text-lg sm:text-xl font-bold text-[#fcf9f2]">
                      {unit.title}
                    </h4>

                    <p className="text-xs text-[#9faabf] hidden sm:block max-w-xl">
                      {unit.description}
                    </p>
                  </div>

                  <div className="flex items-center gap-3 shrink-0 ml-4">
                    <span className="text-xs text-[#8090b2] font-mono-numbers hidden sm:inline">
                      {unitCompletedCount}/{unit.lessons.length}
                    </span>

                    {isCompleted ? (
                      <div className="w-7 h-7 rounded-full bg-emerald-950 border border-emerald-500/50 flex items-center justify-center text-emerald-400">
                        <Check className="w-4 h-4" />
                      </div>
                    ) : isUnlocked ? (
                      <div className="w-7 h-7 rounded-full bg-cyan-950 border border-cyan-400/50 flex items-center justify-center text-cyan-300">
                        <Sparkles className="w-4 h-4" />
                      </div>
                    ) : (
                      <div className="w-7 h-7 rounded-full bg-[#121c38] border border-[#233560] flex items-center justify-center text-[#67789c]">
                        <Lock className="w-3.5 h-3.5" />
                      </div>
                    )}

                    {isExpanded ? (
                      <ChevronUp className="w-5 h-5 text-[#8b9bb4]" />
                    ) : (
                      <ChevronDown className="w-5 h-5 text-[#8b9bb4]" />
                    )}
                  </div>
                </button>

                {/* Expanded Unit Path Nodes */}
                {isExpanded && (
                  <div className="px-4 sm:px-6 pb-6 pt-2 border-t border-[#152344]">
                    <div className="max-w-md mx-auto py-4 flex flex-col items-center gap-6 relative">
                      {/* Central vertical connecting line */}
                      <div
                        className="absolute top-6 bottom-6 w-0.5 bg-[#1b2b52] z-0"
                        aria-hidden="true"
                      />

                      {/* Lesson Nodes & Checkpoints */}
                      {unit.lessons.map((lesson, lIdx) => {
                        const isLessonComplete = progress.completedLessonIds.includes(lesson.id);
                        const isLessonCurrent =
                          progress.currentLessonId === lesson.id &&
                          progress.currentUnitId === unit.id;
                        const isLessonLocked = !isUnlocked || (!isLessonComplete && !isLessonCurrent);

                        // Horizontal wiggle for playful path effect
                        const xOffset = lIdx % 2 === 0 ? '-translate-x-6' : 'translate-x-6';

                        return (
                          <React.Fragment key={lesson.id}>
                            {/* Insert Mid-Unit Checkpoint midway through lessons */}
                            {lIdx === Math.floor(unit.lessons.length / 2) && (
                              <div className="relative z-10 flex flex-col items-center gap-1.5 my-2">
                                <button
                                  type="button"
                                  onClick={() => {
                                    sound.playSoftTap();
                                    onStartCheckpoint(unit.midCheckpoint);
                                  }}
                                  className={`w-14 h-14 rounded-2xl rotate-45 border flex items-center justify-center btn-tactile transition-all ${
                                    progress.completedCheckpointIds.includes(unit.midCheckpoint.id)
                                      ? 'bg-emerald-950 border-emerald-400 text-emerald-300 shadow-lg shadow-emerald-950/40'
                                      : 'bg-[#152142] border-cyan-400 text-cyan-300 hover:bg-[#1a2a54] shadow-lg shadow-cyan-950/40'
                                  }`}
                                  aria-label={`Start ${unit.midCheckpoint.title}`}
                                >
                                  <div className="-rotate-45 flex items-center justify-center">
                                    <Target className="w-6 h-6" />
                                  </div>
                                </button>
                                <div className="text-center mt-1">
                                  <span className="text-[11px] font-semibold text-cyan-300 block">
                                    Mid-Unit Checkpoint
                                  </span>
                                  <span className="text-[10px] text-[#8090b2]">
                                    Pass $\ge$ 70% to continue
                                  </span>
                                </div>
                              </div>
                            )}

                            {/* Standard Lesson Node */}
                            <div className={`relative z-10 flex flex-col items-center ${xOffset}`}>
                              <button
                                type="button"
                                disabled={isLessonLocked}
                                onClick={() => {
                                  sound.playSoftTap();
                                  onStartLesson(lesson);
                                }}
                                className={`w-14 h-14 rounded-full border-2 flex items-center justify-center btn-tactile transition-all ${
                                  isLessonComplete
                                    ? 'bg-emerald-950 border-emerald-400 text-emerald-300'
                                    : isLessonCurrent
                                    ? 'bg-cyan-500 border-cyan-300 text-slate-950 shadow-xl shadow-cyan-500/30 scale-105'
                                    : 'bg-[#0f1730] border-[#223560] text-[#556994] opacity-50 cursor-not-allowed'
                                }`}
                                aria-label={`Start lesson: ${lesson.title}`}
                              >
                                {isLessonComplete ? (
                                  <Check className="w-6 h-6 stroke-[2.5]" />
                                ) : isLessonCurrent ? (
                                  <Play className="w-6 h-6 fill-slate-950 ml-0.5" />
                                ) : (
                                  <Lock className="w-5 h-5" />
                                )}
                              </button>

                              <div className="text-center mt-1 max-w-[130px]">
                                <span className="text-xs font-semibold text-[#ded7cb] line-clamp-1">
                                  {lesson.title}
                                </span>
                                <span className="text-[10px] text-[#8090b2] font-mono-numbers">
                                  +{lesson.xpReward} XP
                                </span>
                              </div>
                            </div>
                          </React.Fragment>
                        );
                      })}

                      {/* Unit End Mastery Exam Node */}
                      <div className="relative z-10 flex flex-col items-center gap-1.5 mt-2">
                        <button
                          type="button"
                          onClick={() => {
                            sound.playSoftTap();
                            onStartCheckpoint(unit.unitExam);
                          }}
                          className={`w-16 h-16 rounded-2xl border-2 flex items-center justify-center btn-tactile transition-all ${
                            progress.completedCheckpointIds.includes(unit.unitExam.id)
                              ? 'bg-amber-950 border-amber-400 text-amber-300 shadow-xl shadow-amber-950/40'
                              : 'bg-[#152347] border-amber-500/70 text-amber-300 hover:bg-[#1c2e5c]'
                          }`}
                          aria-label={`Start ${unit.unitExam.title}`}
                        >
                          <ShieldCheck className="w-8 h-8" />
                        </button>
                        <div className="text-center">
                          <span className="text-xs font-bold text-amber-300 block">
                            Unit {unit.id} Exam
                          </span>
                          <span className="text-[10px] text-[#8090b2]">
                            +{unit.unitExam.xpReward} XP · Unlocks Unit {unit.id + 1}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </section>
    </div>
  );
};
