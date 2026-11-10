/**
 * Entuned Top Bar Navigation Component
 * Adheres strictly to the 1-row, 3-zone Top Bar Contract.
 */

import React from 'react';
import { Flame, Heart, Volume2, VolumeX, Sliders } from 'lucide-react';
import { UserProgress } from '../../types/music';
import { sound } from '../../audio/soundEngine';

interface TopBarProps {
  progress: UserProgress;
  onOpenSettings: () => void;
  activeTab: string;
  onTabChange: (tab: string) => void;
  onToggleSound: () => void;
  isMuted: boolean;
}

export const TopBar: React.FC<TopBarProps> = ({
  progress,
  onOpenSettings,
  activeTab,
  onTabChange,
  onToggleSound,
  isMuted,
}) => {
  return (
    <header className="sticky top-0 z-40 w-full bg-[#070b16]/95 backdrop-blur-md border-b border-[#141f38]">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 h-14 flex items-center justify-between gap-8">
        {/* Zone 1: Single text element wordmark */}
        <div className="flex items-center gap-2 shrink-0">
          <button
            type="button"
            onClick={() => onTabChange('roadmap')}
            className="flex items-center gap-2 text-left focus:outline-none"
            aria-label="Entuned Home"
          >
            {/* Custom geometric logo mark representing tuned musical frequencies */}
            <svg
              width="24"
              height="24"
              viewBox="0 0 24 24"
              fill="none"
              className="text-cyan-400 shrink-0"
            >
              <rect x="2" y="10" width="3" height="8" rx="1.5" fill="currentColor" />
              <rect x="7" y="4" width="3" height="16" rx="1.5" fill="#a78bfa" />
              <rect x="12" y="8" width="3" height="12" rx="1.5" fill="currentColor" />
              <rect x="17" y="2" width="3" height="19" rx="1.5" fill="#a78bfa" />
              <rect x="22" y="12" width="2" height="6" rx="1" fill="currentColor" />
            </svg>
            <span className="text-xl font-bold tracking-tight text-[#fcf9f2] font-display whitespace-nowrap">
              Entuned
            </span>
          </button>
        </div>

        {/* Zone 2: 4 concise single-line nav links (desktop) */}
        <nav className="hidden md:flex items-center gap-6 text-sm font-medium text-[#9faabf]">
          <button
            type="button"
            onClick={() => onTabChange('roadmap')}
            className={`whitespace-nowrap transition-colors hover:text-[#fcf9f2] ${
              activeTab === 'roadmap' ? 'text-cyan-400 font-semibold' : ''
            }`}
          >
            Learning Path
          </button>
          <button
            type="button"
            onClick={() => onTabChange('practice')}
            className={`whitespace-nowrap transition-colors hover:text-[#fcf9f2] relative ${
              activeTab === 'practice' ? 'text-cyan-400 font-semibold' : ''
            }`}
          >
            Practice & Review
            {progress.missedConcepts.filter((m) => !m.resolved).length > 0 && (
              <span className="ml-1.5 text-[10px] font-mono-numbers px-1.5 py-0.2 bg-violet-950 text-violet-300 border border-violet-700/50 rounded-sm">
                {progress.missedConcepts.filter((m) => !m.resolved).length}
              </span>
            )}
          </button>
          <button
            type="button"
            onClick={() => onTabChange('sandbox')}
            className={`whitespace-nowrap transition-colors hover:text-[#fcf9f2] ${
              activeTab === 'sandbox' ? 'text-cyan-400 font-semibold' : ''
            }`}
          >
            Piano & Chords
          </button>
          <button
            type="button"
            onClick={() => onTabChange('progress')}
            className={`whitespace-nowrap transition-colors hover:text-[#fcf9f2] ${
              activeTab === 'progress' ? 'text-cyan-400 font-semibold' : ''
            }`}
          >
            Progress & Badges
          </button>
        </nav>

        {/* Zone 3: 1 primary action cluster (clean unboxed stats & controls) */}
        <div className="flex items-center gap-4 text-xs font-medium shrink-0">
          {/* Streak indicator */}
          <div
            className="flex items-center gap-1.5 text-amber-400"
            title={`${progress.streak}-day streak`}
          >
            <Flame className="w-4 h-4 fill-amber-500 text-amber-500" />
            <span className="font-mono-numbers font-semibold">{progress.streak}</span>
          </div>

          <span className="text-[#1c2c4e] hidden sm:inline" aria-hidden="true">
            ·
          </span>

          {/* XP Total */}
          <div className="flex items-center gap-1 text-cyan-300">
            <span className="font-mono-numbers font-bold text-sm">{progress.xp}</span>
            <span className="text-[11px] text-[#9faabf]">XP</span>
          </div>

          <span className="text-[#1c2c4e] hidden sm:inline" aria-hidden="true">
            ·
          </span>

          {/* Hearts counter */}
          <div
            className="flex items-center gap-1 text-rose-400"
            title={`${progress.hearts} hearts available`}
          >
            <Heart className="w-4 h-4 fill-rose-500 text-rose-500" />
            <span className="font-mono-numbers font-semibold">{progress.hearts}</span>
          </div>

          <span className="text-[#1c2c4e]" aria-hidden="true">
            ·
          </span>

          {/* Mute/Sound toggle */}
          <button
            type="button"
            onClick={() => {
              onToggleSound();
              sound.playSoftTap();
            }}
            className="p-1.5 text-[#9faabf] hover:text-cyan-300 rounded-md transition-colors"
            aria-label={isMuted ? 'Unmute sounds' : 'Mute sounds'}
          >
            {isMuted ? <VolumeX className="w-4 h-4 text-rose-400" /> : <Volume2 className="w-4 h-4" />}
          </button>

          {/* Settings modal button */}
          <button
            type="button"
            onClick={() => {
              onOpenSettings();
              sound.playSoftTap();
            }}
            className="p-1.5 text-[#9faabf] hover:text-[#fcf9f2] rounded-md transition-colors"
            aria-label="Settings"
          >
            <Sliders className="w-4 h-4" />
          </button>
        </div>
      </div>
    </header>
  );
};
