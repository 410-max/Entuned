/**
 * Entuned Progress & Achievements View
 * Tracks XP milestones, level progression, streaks, and unlocked badges.
 */

import React from 'react';
import { Award, Flame, CheckCircle, Zap, ShieldCheck, Sparkles } from 'lucide-react';
import { UserProgress } from '../../types/music';
import { CURRICULUM_UNITS } from '../../data/curriculum';

interface ProgressViewProps {
  progress: UserProgress;
}

export const ProgressView: React.FC<ProgressViewProps> = ({ progress }) => {
  // Compute user level based on XP
  const level = Math.max(1, Math.floor(progress.xp / 45) + 1);
  const nextLevelXp = level * 45;
  const currentLevelProgress = progress.xp % 45;
  const levelProgressPercent = Math.min(100, Math.round((currentLevelProgress / 45) * 100));

  const levelTitles: Record<number, string> = {
    1: 'Curious Ear',
    2: 'Keyboard Explorer',
    3: 'Staff Reader',
    4: 'Interval Specialist',
    5: 'Scale Architect',
    6: 'Harmonic Adept',
    7: 'Theory Scholar',
    8: 'Grand Harmonist',
  };

  const title = levelTitles[Math.min(level, 8)] || 'Master Theorist';

  const completedUnitsCount = CURRICULUM_UNITS.filter((u) =>
    progress.completedCheckpointIds.includes(u.unitExam.id) || u.id < progress.currentUnitId
  ).length;

  return (
    <div className="w-full max-w-4xl mx-auto px-4 sm:px-6 pt-6 pb-24 space-y-8 animate-fadeIn">
      {/* Level & XP Overview Banner */}
      <section className="bg-gradient-to-br from-[#0e1730] to-[#0a1024] border border-[#1b2b54] rounded-2xl p-6 sm:p-8 shadow-xl">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6">
          <div className="space-y-1">
            <span className="text-xs font-semibold uppercase tracking-wider text-cyan-400">
              Level {level}
            </span>
            <h2 className="text-2xl sm:text-3xl font-bold text-[#fcf9f2]">{title}</h2>
            <p className="text-xs text-[#9faabf]">
              {45 - currentLevelProgress} XP until Level {level + 1}
            </p>
          </div>

          <div className="flex items-center gap-6">
            <div className="text-center sm:text-right">
              <span className="text-xs text-[#9faabf] block">Total XP</span>
              <span className="text-2xl font-bold text-cyan-300 font-mono-numbers">
                {progress.xp}
              </span>
            </div>
            <div className="text-center sm:text-right">
              <span className="text-xs text-[#9faabf] block">Streak</span>
              <span className="text-2xl font-bold text-amber-400 font-mono-numbers flex items-center justify-center sm:justify-end gap-1">
                <Flame className="w-5 h-5 fill-amber-500 text-amber-500" />
                {progress.streak}d
              </span>
            </div>
          </div>
        </div>

        {/* Level XP Bar */}
        <div className="w-full h-2.5 bg-[#121c38] rounded-full overflow-hidden border border-[#1d2d52] mt-6">
          <div
            className="h-full bg-gradient-to-r from-cyan-400 to-cyan-300 transition-all duration-300 ease-out"
            style={{ width: `${levelProgressPercent}%` }}
          />
        </div>
      </section>

      {/* Stats Summary Strip */}
      <section className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="p-4 bg-[#0c142b] border border-[#1b2b52] rounded-xl text-center space-y-1">
          <span className="text-xs text-[#9faabf]">Completed Lessons</span>
          <div className="text-2xl font-bold text-[#fcf9f2] font-mono-numbers">
            {progress.completedLessonIds.length}
          </div>
        </div>
        <div className="p-4 bg-[#0c142b] border border-[#1b2b52] rounded-xl text-center space-y-1">
          <span className="text-xs text-[#9faabf]">Units Mastered</span>
          <div className="text-2xl font-bold text-emerald-400 font-mono-numbers">
            {completedUnitsCount} / 8
          </div>
        </div>
        <div className="p-4 bg-[#0c142b] border border-[#1b2b52] rounded-xl text-center space-y-1">
          <span className="text-xs text-[#9faabf]">Checkpoints Cleared</span>
          <div className="text-2xl font-bold text-cyan-300 font-mono-numbers">
            {progress.completedCheckpointIds.length}
          </div>
        </div>
        <div className="p-4 bg-[#0c142b] border border-[#1b2b52] rounded-xl text-center space-y-1">
          <span className="text-xs text-[#9faabf]">Active Daily Goal</span>
          <div className="text-2xl font-bold text-violet-300 font-mono-numbers">
            {progress.dailyGoalXp} XP
          </div>
        </div>
      </section>

      {/* Badges & Achievements */}
      <section className="space-y-4">
        <div>
          <h3 className="text-lg font-bold text-[#fcf9f2]">Achievements & Badges</h3>
          <p className="text-xs text-[#9faabf]">
            Milestones unlocked through deliberate practice and harmonic mastery.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {progress.achievements.map((ach) => {
            const isUnlocked = ach.progress >= ach.maxProgress;
            const pct = Math.min(100, Math.round((ach.progress / ach.maxProgress) * 100));

            return (
              <div
                key={ach.id}
                className={`p-4 rounded-xl border flex items-start gap-4 transition-all ${
                  isUnlocked
                    ? 'bg-[#0e1730] border-cyan-500/40 shadow-sm'
                    : 'bg-[#080d1c] border-[#162340] opacity-75'
                }`}
              >
                <div
                  className={`w-11 h-11 rounded-lg flex items-center justify-center shrink-0 ${
                    isUnlocked
                      ? 'bg-cyan-950 border border-cyan-400 text-cyan-300'
                      : 'bg-[#121c38] border border-[#1d2d52] text-[#556994]'
                  }`}
                >
                  <Award className="w-5 h-5" />
                </div>

                <div className="flex-1 space-y-1.5">
                  <div className="flex items-center justify-between">
                    <h4
                      className={`text-sm font-bold ${
                        isUnlocked ? 'text-[#fcf9f2]' : 'text-[#8b9bb4]'
                      }`}
                    >
                      {ach.title}
                    </h4>
                    {isUnlocked && (
                      <span className="text-[10px] text-emerald-400 font-semibold">
                        Unlocked ✓
                      </span>
                    )}
                  </div>

                  <p className="text-xs text-[#9faabf] leading-snug">{ach.description}</p>

                  <div className="w-full h-1.5 bg-[#121c38] rounded-full overflow-hidden border border-[#1b2b4e]">
                    <div
                      className={`h-full ${
                        isUnlocked ? 'bg-cyan-400' : 'bg-cyan-600'
                      }`}
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </section>
    </div>
  );
};
