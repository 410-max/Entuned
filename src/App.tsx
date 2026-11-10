/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { UserProgress, Lesson, UnitCheckpoint } from './types/music';
import { loadProgress, saveProgress } from './utils/storage';
import { sound } from './audio/soundEngine';
import { TopBar } from './components/navigation/TopBar';
import { BottomNav } from './components/navigation/BottomNav';
import { RoadmapView } from './components/roadmap/RoadmapView';
import { PracticeArea } from './components/practice/PracticeArea';
import { ProgressView } from './components/progress/ProgressView';
import { ExerciseHost } from './components/exercises/ExerciseHost';
import { SettingsModal } from './components/settings/SettingsModal';
import { OnboardingModal } from './components/onboarding/OnboardingModal';
import { PianoKeyboard } from './components/piano/PianoKeyboard';

export default function App() {
  const [progress, setProgress] = useState<UserProgress>(() => loadProgress());
  const [activeTab, setActiveTab] = useState<string>('roadmap');
  const [isMuted, setIsMuted] = useState<boolean>(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState<boolean>(false);
  const [showOnboarding, setShowOnboarding] = useState<boolean>(() => !loadProgress().onboardingCompleted);

  // Active interactive exercise session
  const [activeLesson, setActiveLesson] = useState<Lesson | null>(null);
  const [activeCheckpoint, setActiveCheckpoint] = useState<UnitCheckpoint | null>(null);

  // Sync sound engine preferences on mount
  useEffect(() => {
    sound.setSfxEnabled(progress.settings.sfxEnabled);
    sound.setVoice(progress.settings.synthSound);
    sound.setVolume(progress.settings.volume);
  }, [progress.settings]);

  const handleToggleSound = () => {
    const nextMuted = !isMuted;
    setIsMuted(nextMuted);
    sound.setMuted(nextMuted);
  };

  const handleStartLesson = (lesson: Lesson) => {
    setActiveCheckpoint(null);
    setActiveLesson(lesson);
  };

  const handleStartCheckpoint = (checkpoint: UnitCheckpoint) => {
    setActiveLesson(null);
    setActiveCheckpoint(checkpoint);
  };

  const handleCloseExercise = () => {
    setActiveLesson(null);
    setActiveCheckpoint(null);
  };

  const handleFinishExercise = (updatedProgress: UserProgress) => {
    setProgress(updatedProgress);
    saveProgress(updatedProgress);
    setActiveLesson(null);
    setActiveCheckpoint(null);
  };

  return (
    <div className="min-h-screen bg-[#070b16] text-[#f7f5ed] flex flex-col justify-between selection:bg-cyan-500/25 selection:text-cyan-200">
      {/* Top Bar Navigation (Top Bar Contract) */}
      <TopBar
        progress={progress}
        activeTab={activeTab}
        onTabChange={setActiveTab}
        onOpenSettings={() => setIsSettingsOpen(true)}
        onToggleSound={handleToggleSound}
        isMuted={isMuted}
      />

      {/* Main App Content Viewport */}
      <main className="flex-1 w-full pb-16">
        {activeTab === 'roadmap' && (
          <RoadmapView
            progress={progress}
            onStartLesson={handleStartLesson}
            onStartCheckpoint={handleStartCheckpoint}
          />
        )}

        {activeTab === 'practice' && (
          <PracticeArea
            progress={progress}
            onUpdateProgress={setProgress}
          />
        )}

        {activeTab === 'sandbox' && (
          <div className="w-full max-w-4xl mx-auto px-4 sm:px-6 pt-6 pb-24 space-y-6 animate-fadeIn">
            <div className="space-y-1">
              <h2 className="text-2xl font-bold text-[#fcf9f2]">Piano Keyboard Sandbox</h2>
              <p className="text-xs text-[#9faabf]">
                Two-octave responsive synthesizer. Use mouse, touch, or computer keys (A–L).
              </p>
            </div>

            <div className="pt-2">
              <PianoKeyboard
                startOctave={4}
                octavesCount={2}
                showLabels={progress.settings.pianoLabels}
                allowOctaveShift={true}
              />
            </div>
          </div>
        )}

        {activeTab === 'progress' && (
          <ProgressView progress={progress} />
        )}
      </main>

      {/* Tactile Bottom Navigation Bar */}
      <BottomNav
        activeTab={activeTab}
        onTabChange={setActiveTab}
        progress={progress}
        onOpenSettings={() => setIsSettingsOpen(true)}
      />

      {/* Active Interactive Exercise Session Runner */}
      {(activeLesson || activeCheckpoint) && (
        <ExerciseHost
          lesson={activeLesson || undefined}
          checkpoint={activeCheckpoint || undefined}
          progress={progress}
          onClose={handleCloseExercise}
          onFinish={handleFinishExercise}
        />
      )}

      {/* Settings Modal */}
      <SettingsModal
        progress={progress}
        isOpen={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
        onUpdateProgress={setProgress}
      />

      {/* First-Run Onboarding Modal */}
      <OnboardingModal
        progress={progress}
        isOpen={showOnboarding}
        onComplete={(updated) => {
          setProgress(updated);
          setShowOnboarding(false);
        }}
      />
    </div>
  );
}
