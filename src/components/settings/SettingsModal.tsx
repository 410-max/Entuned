/**
 * Entuned Settings Modal
 * Configures audio preferences, synthesizer timbre, key labels,
 * daily XP targets, and progress reset.
 */

import React, { useState } from 'react';
import { X, Volume2, Sliders, RotateCcw, AlertTriangle, Check } from 'lucide-react';
import { UserProgress } from '../../types/music';
import { sound } from '../../audio/soundEngine';
import { getDefaultProgress, saveProgress } from '../../utils/storage';

interface SettingsModalProps {
  progress: UserProgress;
  isOpen: boolean;
  onClose: () => void;
  onUpdateProgress: (updated: UserProgress) => void;
}

export const SettingsModal: React.FC<SettingsModalProps> = ({
  progress,
  isOpen,
  onClose,
  onUpdateProgress,
}) => {
  const [confirmReset, setConfirmReset] = useState(false);

  if (!isOpen) return null;

  const updateSettings = (partial: Partial<UserProgress['settings']>) => {
    const nextSettings = { ...progress.settings, ...partial };
    if (partial.synthSound) {
      sound.setVoice(partial.synthSound);
      sound.playNote('C4');
    }
    if (partial.sfxEnabled !== undefined) {
      sound.setSfxEnabled(partial.sfxEnabled);
    }
    if (partial.volume !== undefined) {
      sound.setVolume(partial.volume);
    }

    const updated: UserProgress = {
      ...progress,
      settings: nextSettings,
    };
    saveProgress(updated);
    onUpdateProgress(updated);
  };

  const handleSetDailyGoal = (goalXp: number) => {
    const updated: UserProgress = {
      ...progress,
      dailyGoalXp: goalXp,
    };
    saveProgress(updated);
    onUpdateProgress(updated);
  };

  const handleResetAllProgress = () => {
    const fresh = getDefaultProgress();
    fresh.onboardingCompleted = true; // don't force onboarding again
    saveProgress(fresh);
    onUpdateProgress(fresh);
    setConfirmReset(false);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="w-full max-w-md bg-[#0a1124] border border-[#1b2b52] rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Modal Header */}
        <div className="px-6 py-4 border-b border-[#182648] flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Sliders className="w-5 h-5 text-cyan-400" />
            <h3 className="text-lg font-bold text-[#fcf9f2]">Settings</h3>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 text-[#8b9bb4] hover:text-[#fcf9f2] rounded-md transition-colors"
            aria-label="Close settings"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Settings Body */}
        <div className="p-6 overflow-y-auto space-y-6 text-xs text-[#ded7cb]">
          {/* Section 1: Audio & Synthesizer */}
          <div className="space-y-3">
            <span className="text-[11px] font-semibold text-cyan-400 uppercase tracking-wider block">
              Audio & Tone
            </span>

            {/* SFX Toggle */}
            <div className="flex items-center justify-between py-2 border-b border-[#162344]">
              <div>
                <span className="font-medium text-sm text-[#fcf9f2] block">UI Sound Effects</span>
                <span className="text-[#8b9bb4]">Chimes and tactile feedback tones</span>
              </div>
              <button
                type="button"
                onClick={() => updateSettings({ sfxEnabled: !progress.settings.sfxEnabled })}
                className={`w-12 h-6 rounded-full transition-colors relative ${
                  progress.settings.sfxEnabled ? 'bg-cyan-500' : 'bg-[#182544]'
                }`}
              >
                <div
                  className={`w-4 h-4 rounded-full bg-white transition-transform absolute top-1 ${
                    progress.settings.sfxEnabled ? 'right-1' : 'left-1'
                  }`}
                />
              </button>
            </div>

            {/* Synthesizer Timbre Preset */}
            <div className="space-y-2 pt-1">
              <span className="font-medium text-sm text-[#fcf9f2] block">Instrument Sound Preset</span>
              <div className="grid grid-cols-3 gap-2">
                {[
                  { id: 'felt_piano', label: 'Felt Piano' },
                  { id: 'bright_bell', label: 'Bright Bell' },
                  { id: 'warm_reed', label: 'Warm Reed' },
                ].map((timbre) => {
                  const isSelected = progress.settings.synthSound === timbre.id;
                  return (
                    <button
                      key={timbre.id}
                      type="button"
                      onClick={() =>
                        updateSettings({
                          synthSound: timbre.id as 'felt_piano' | 'bright_bell' | 'warm_reed',
                        })
                      }
                      className={`py-2 px-2.5 rounded-lg border text-center transition-colors btn-tactile ${
                        isSelected
                          ? 'bg-[#152347] border-cyan-400 text-cyan-200 ring-1 ring-cyan-400 font-bold'
                          : 'bg-[#0f1730] border-[#1d2d52] text-[#8b9bb4] hover:text-[#fcf9f2]'
                      }`}
                    >
                      {timbre.label}
                    </button>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Section 2: Piano Display Preferences */}
          <div className="space-y-3 pt-2">
            <span className="text-[11px] font-semibold text-cyan-400 uppercase tracking-wider block">
              Piano Keyboard Guides
            </span>
            <div className="grid grid-cols-3 gap-2">
              {[
                { id: 'always', label: 'Show All' },
                { id: 'middle_c', label: 'Middle C' },
                { id: 'hidden', label: 'Blank Keys' },
              ].map((opt) => {
                const isSelected = progress.settings.pianoLabels === opt.id;
                return (
                  <button
                    key={opt.id}
                    type="button"
                    onClick={() =>
                      updateSettings({
                        pianoLabels: opt.id as 'always' | 'middle_c' | 'hidden',
                      })
                    }
                    className={`py-2 px-2.5 rounded-lg border text-center transition-colors btn-tactile ${
                      isSelected
                        ? 'bg-[#152347] border-cyan-400 text-cyan-200 ring-1 ring-cyan-400 font-bold'
                        : 'bg-[#0f1730] border-[#1d2d52] text-[#8b9bb4] hover:text-[#fcf9f2]'
                    }`}
                  >
                    {opt.label}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Section 3: Daily Target */}
          <div className="space-y-3 pt-2">
            <span className="text-[11px] font-semibold text-cyan-400 uppercase tracking-wider block">
              Daily Practice Goal
            </span>
            <div className="grid grid-cols-4 gap-2">
              {[
                { xp: 10, label: 'Casual (10)' },
                { xp: 20, label: 'Regular (20)' },
                { xp: 30, label: 'Serious (30)' },
                { xp: 50, label: 'Intense (50)' },
              ].map((item) => {
                const isSelected = progress.dailyGoalXp === item.xp;
                return (
                  <button
                    key={item.xp}
                    type="button"
                    onClick={() => handleSetDailyGoal(item.xp)}
                    className={`py-2 px-2 rounded-lg border text-center transition-colors btn-tactile ${
                      isSelected
                        ? 'bg-[#152347] border-cyan-400 text-cyan-200 ring-1 ring-cyan-400 font-bold'
                        : 'bg-[#0f1730] border-[#1d2d52] text-[#8b9bb4] hover:text-[#fcf9f2]'
                    }`}
                  >
                    {item.label}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Section 4: Danger Zone - Reset Progress */}
          <div className="pt-4 border-t border-[#182648] space-y-2">
            <span className="text-[11px] font-semibold text-rose-400 uppercase tracking-wider block">
              Data Management
            </span>

            {confirmReset ? (
              <div className="p-3 bg-rose-950/40 border border-rose-800/60 rounded-lg space-y-3">
                <div className="flex items-center gap-2 text-rose-300 font-bold">
                  <AlertTriangle className="w-4 h-4 shrink-0" />
                  <span>Are you sure? This erases all progress and badges.</span>
                </div>
                <div className="flex justify-end gap-2">
                  <button
                    type="button"
                    onClick={() => setConfirmReset(false)}
                    className="px-3 py-1.5 rounded bg-[#152140] text-[#ded7cb] hover:text-white"
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    onClick={handleResetAllProgress}
                    className="px-3 py-1.5 rounded bg-rose-600 hover:bg-rose-500 text-white font-bold"
                  >
                    Yes, Reset
                  </button>
                </div>
              </div>
            ) : (
              <button
                type="button"
                onClick={() => setConfirmReset(true)}
                className="w-full py-2.5 px-3 rounded-lg border border-rose-900/50 bg-rose-950/20 text-rose-300 hover:bg-rose-950/40 text-xs font-semibold flex items-center justify-center gap-2 transition-colors btn-tactile"
              >
                <RotateCcw className="w-4 h-4" />
                <span>Reset All Learning Progress</span>
              </button>
            )}
          </div>
        </div>

        {/* Modal Footer */}
        <div className="p-4 border-t border-[#182648] flex justify-end">
          <button
            type="button"
            onClick={onClose}
            className="px-5 py-2 text-xs font-semibold text-slate-950 bg-cyan-400 hover:bg-cyan-300 rounded-lg btn-tactile"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
};
