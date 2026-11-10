/**
 * Entuned Bottom Navigation Bar
 * Responsive tactile navigation anchored at the bottom of the screen.
 */

import React from 'react';
import { Compass, RotateCcw, Piano, CircleDot, Trophy, Sliders } from 'lucide-react';
import { UserProgress } from '../../types/music';
import { sound } from '../../audio/soundEngine';

interface BottomNavProps {
  activeTab: string;
  onTabChange: (tab: string) => void;
  progress: UserProgress;
  onOpenSettings: () => void;
}

export const BottomNav: React.FC<BottomNavProps> = ({
  activeTab,
  onTabChange,
  progress,
  onOpenSettings,
}) => {
  const unresolvedMistakes = progress.missedConcepts.filter((m) => !m.resolved).length;

  const navItems = [
    {
      id: 'roadmap',
      label: 'Path',
      icon: Compass,
      badge: null,
    },
    {
      id: 'practice',
      label: 'Practice',
      icon: RotateCcw,
      badge: unresolvedMistakes > 0 ? unresolvedMistakes : null,
    },
    {
      id: 'sandbox',
      label: 'Piano & Chords',
      icon: Piano,
      badge: null,
    },
    {
      id: 'progress',
      label: 'Progress',
      icon: Trophy,
      badge: null,
    },
    {
      id: 'settings',
      label: 'Settings',
      icon: Sliders,
      badge: null,
      isAction: true,
    },
  ];

  return (
    <nav
      className="fixed bottom-0 left-0 right-0 z-30 bg-[#070c1a]/95 backdrop-blur-lg border-t border-[#152342] py-1.5 px-3 max-h-[64px]"
      aria-label="Bottom Navigation"
    >
      <div className="max-w-2xl mx-auto flex items-center justify-around">
        {navItems.map((item) => {
          const isActive = activeTab === item.id;
          const Icon = item.icon;

          return (
            <button
              key={item.id}
              type="button"
              onClick={() => {
                sound.playSoftTap();
                if (item.isAction) {
                  onOpenSettings();
                } else {
                  onTabChange(item.id);
                }
              }}
              className={`relative flex flex-col items-center justify-center py-1 px-3 rounded-lg min-w-[54px] min-h-[44px] transition-all btn-tactile ${
                isActive
                  ? 'text-cyan-400 font-semibold'
                  : 'text-[#8b9bb4] hover:text-[#ded7cb]'
              }`}
              aria-label={item.label}
              aria-current={isActive ? 'page' : undefined}
            >
              <div className="relative">
                <Icon
                  className={`w-5 h-5 transition-transform ${
                    isActive ? 'scale-110 text-cyan-400' : 'text-[#8b9bb4]'
                  }`}
                />
                {item.badge !== null && (
                  <span className="absolute -top-1 -right-2 text-[10px] font-mono-numbers font-bold text-violet-200 bg-violet-600 px-1 rounded-full border border-violet-900 leading-none py-0.5">
                    {item.badge}
                  </span>
                )}
              </div>
              <span
                className={`text-[10px] tracking-tight mt-0.5 whitespace-nowrap ${
                  isActive ? 'text-cyan-300 font-semibold' : 'text-[#8b9bb4]'
                }`}
              >
                {item.label}
              </span>
            </button>
          );
        })}
      </div>
    </nav>
  );
};
