/**
 * Entuned First-Run Onboarding Modal
 * Assesses learner experience and instrument interest to adapt starting placement.
 */

import React, { useState } from 'react';
import { Sparkles, Music, Piano, Compass, Check, ArrowRight } from 'lucide-react';
import { UserProgress } from '../../types/music';
import { saveProgress } from '../../utils/storage';
import { sound } from '../../audio/soundEngine';

interface OnboardingModalProps {
  progress: UserProgress;
  isOpen: boolean;
  onComplete: (updated: UserProgress) => void;
}

export const OnboardingModal: React.FC<OnboardingModalProps> = ({
  progress,
  isOpen,
  onComplete,
}) => {
  const [step, setStep] = useState<1 | 2>(1);
  const [selectedLevel, setSelectedLevel] = useState<'beginner' | 'intermediate' | 'advanced'>('beginner');
  const [selectedFocus, setSelectedFocus] = useState<'piano' | 'general' | 'guitar'>('piano');

  if (!isOpen) return null;

  const handleFinish = () => {
    sound.playCheckpointSuccess();

    let startUnit = 1;
    let startLesson = '1-1';
    let completedLessons: string[] = [];

    if (selectedLevel === 'intermediate') {
      startUnit = 2;
      startLesson = '2-1';
      completedLessons = ['1-1', '1-2', '1-3'];
    } else if (selectedLevel === 'advanced') {
      startUnit = 4;
      startLesson = '4-1';
      completedLessons = ['1-1', '1-2', '1-3', '2-1', '2-2', '2-3', '3-1', '3-2'];
    }

    const updated: UserProgress = {
      ...progress,
      onboardingCompleted: true,
      experienceLevel: selectedLevel,
      instrumentFocus: selectedFocus,
      currentUnitId: startUnit,
      currentLessonId: startLesson,
      completedLessonIds: completedLessons,
    };

    saveProgress(updated);
    onComplete(updated);
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-md flex items-center justify-center p-4">
      <div className="w-full max-w-md bg-[#0a1126] border border-[#1d2d52] rounded-2xl shadow-2xl p-6 sm:p-8 space-y-6">
        {/* Step indicator */}
        <div className="flex items-center justify-between text-xs text-[#9faabf]">
          <span className="font-semibold text-cyan-400">Step {step} of 2</span>
          <span>Personalizing Your Path</span>
        </div>

        {step === 1 ? (
          /* Step 1: Experience Level */
          <div className="space-y-4 animate-fadeIn">
            <div className="space-y-1">
              <h2 className="text-2xl font-bold text-[#fcf9f2]">
                What is your experience with music theory?
              </h2>
              <p className="text-xs text-[#ded7cb]">
                We&apos;ll tailor your starting lessons so you never feel bored or overwhelmed.
              </p>
            </div>

            <div className="space-y-2.5 pt-2">
              {[
                {
                  id: 'beginner' as const,
                  title: 'Brand New to Theory',
                  desc: 'Start from absolute scratch with piano keys, notes, and the musical alphabet.',
                },
                {
                  id: 'intermediate' as const,
                  title: 'Know a Little',
                  desc: 'Familiar with basic keyboard notes; ready for sheet music, rhythm, and intervals.',
                },
                {
                  id: 'advanced' as const,
                  title: 'Experienced / Refresher',
                  desc: 'Jump ahead to chord structures, Roman numeral analysis, and modes.',
                },
              ].map((lvl) => {
                const isSelected = selectedLevel === lvl.id;
                return (
                  <button
                    key={lvl.id}
                    type="button"
                    onClick={() => {
                      sound.playSoftTap();
                      setSelectedLevel(lvl.id);
                    }}
                    className={`w-full p-4 rounded-xl border text-left transition-all btn-tactile ${
                      isSelected
                        ? 'bg-[#152347] border-cyan-400 text-white shadow-lg ring-1 ring-cyan-400'
                        : 'bg-[#0f1730] border-[#1f2f54] text-[#ded7cb] hover:bg-[#14203e]'
                    }`}
                  >
                    <div className="font-bold text-sm text-[#fcf9f2]">{lvl.title}</div>
                    <div className="text-xs text-[#8b9bb4] mt-0.5 leading-snug">{lvl.desc}</div>
                  </button>
                );
              })}
            </div>

            <div className="pt-4 flex justify-end">
              <button
                type="button"
                onClick={() => {
                  sound.playSoftTap();
                  setStep(2);
                }}
                className="px-6 py-2.5 text-sm font-semibold text-slate-950 bg-cyan-400 hover:bg-cyan-300 rounded-lg flex items-center gap-2 btn-tactile"
              >
                <span>Next</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        ) : (
          /* Step 2: Instrument / Subject Focus */
          <div className="space-y-4 animate-fadeIn">
            <div className="space-y-1">
              <h2 className="text-2xl font-bold text-[#fcf9f2]">
                What is your primary instrument focus?
              </h2>
              <p className="text-xs text-[#ded7cb]">
                Music theory applies everywhere, but we can customize examples and diagrams for you.
              </p>
            </div>

            <div className="space-y-2.5 pt-2">
              {[
                {
                  id: 'piano' as const,
                  title: 'Piano & Keyboard',
                  icon: Piano,
                  desc: 'Visual keyboard references and two-octave touch interaction.',
                },
                {
                  id: 'general' as const,
                  title: 'General Theory & Composition',
                  icon: Compass,
                  desc: 'Universal harmony, ear training, and songwriting progressions.',
                },
                {
                  id: 'guitar' as const,
                  title: 'Guitar, Bass & Strings',
                  icon: Music,
                  desc: 'Scale formulas, intervals, and harmonic movement across keys.',
                },
              ].map((foc) => {
                const isSelected = selectedFocus === foc.id;
                const Icon = foc.icon;
                return (
                  <button
                    key={foc.id}
                    type="button"
                    onClick={() => {
                      sound.playSoftTap();
                      setSelectedFocus(foc.id);
                    }}
                    className={`w-full p-4 rounded-xl border text-left flex items-start gap-3.5 transition-all btn-tactile ${
                      isSelected
                        ? 'bg-[#152347] border-cyan-400 text-white shadow-lg ring-1 ring-cyan-400'
                        : 'bg-[#0f1730] border-[#1f2f54] text-[#ded7cb] hover:bg-[#14203e]'
                    }`}
                  >
                    <Icon className="w-5 h-5 text-cyan-400 shrink-0 mt-0.5" />
                    <div>
                      <div className="font-bold text-sm text-[#fcf9f2]">{foc.title}</div>
                      <div className="text-xs text-[#8b9bb4] mt-0.5 leading-snug">{foc.desc}</div>
                    </div>
                  </button>
                );
              })}
            </div>

            <div className="pt-4 flex items-center justify-between">
              <button
                type="button"
                onClick={() => setStep(1)}
                className="text-xs text-[#8b9bb4] hover:text-white"
              >
                Back
              </button>

              <button
                type="button"
                onClick={handleFinish}
                className="px-6 py-2.5 text-sm font-semibold text-slate-950 bg-cyan-400 hover:bg-cyan-300 rounded-lg flex items-center gap-2 btn-tactile"
              >
                <span>Start Learning</span>
                <Check className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
