/**
 * Entuned Interactive Piano Keyboard Component
 * Accurate 2-octave responsive keyboard with Web Audio integration,
 * target note highlighting, touch support, and keyboard mapping.
 */

import React, { useState, useEffect, useCallback } from 'react';
import { sound } from '../../audio/soundEngine';

interface PianoKeyboardProps {
  startOctave?: number; // default 4 (C4 to B5)
  octavesCount?: number; // default 2
  highlightedNotes?: string[]; // e.g. ["C4", "E4", "G4"]
  activeNotes?: string[]; // keys currently depressed
  onNotePress?: (note: string) => void;
  interactive?: boolean;
  showLabels?: 'always' | 'middle_c' | 'hidden';
  compact?: boolean;
  className?: string;
  allowOctaveShift?: boolean;
}

interface KeyDef {
  note: string; // e.g. "C4"
  pitch: string; // "C"
  octave: number; // 4
  isBlack: boolean;
  whiteIndex?: number;
  label: string;
}

const WHITE_PITCHES = ['C', 'D', 'E', 'F', 'G', 'A', 'B'];
const BLACK_MAP: Record<number, string | null> = {
  0: 'C#', // between C and D
  1: 'D#', // between D and E
  2: null, // between E and F (no black key)
  3: 'F#', // between F and G
  4: 'G#', // between G and A
  5: 'A#', // between A and B
  6: null, // between B and C (no black key)
};

export const PianoKeyboard: React.FC<PianoKeyboardProps> = ({
  startOctave: initialStartOctave = 4,
  octavesCount = 2,
  highlightedNotes = [],
  activeNotes = [],
  onNotePress,
  interactive = true,
  showLabels = 'always',
  compact = false,
  className = '',
  allowOctaveShift = true,
}) => {
  const [octaveShift, setOctaveShift] = useState(0);
  const [localActiveNotes, setLocalActiveNotes] = useState<Set<string>>(new Set());

  const currentStartOctave = initialStartOctave + octaveShift;

  // Build the list of white and black keys for the configured octaves
  const whiteKeys: KeyDef[] = [];
  const blackKeys: { key: KeyDef; whiteIndex: number }[] = [];

  let globalWhiteIndex = 0;
  for (let o = 0; o < octavesCount; o++) {
    const oct = currentStartOctave + o;
    WHITE_PITCHES.forEach((pitch, pIndex) => {
      const note = `${pitch}${oct}`;
      whiteKeys.push({
        note,
        pitch,
        octave: oct,
        isBlack: false,
        whiteIndex: globalWhiteIndex,
        label: pitch,
      });

      const blackPitch = BLACK_MAP[pIndex];
      if (blackPitch) {
        const blackNote = `${blackPitch}${oct}`;
        blackKeys.push({
          key: {
            note: blackNote,
            pitch: blackPitch,
            octave: oct,
            isBlack: true,
            label: blackPitch,
          },
          whiteIndex: globalWhiteIndex,
        });
      }
      globalWhiteIndex++;
    });
  }

  const handleKeyPress = useCallback(
    (note: string) => {
      if (!interactive) return;
      sound.playNote(note);
      setLocalActiveNotes((prev) => new Set(prev).add(note));
      if (onNotePress) {
        onNotePress(note);
      }
      setTimeout(() => {
        setLocalActiveNotes((prev) => {
          const next = new Set(prev);
          next.delete(note);
          return next;
        });
      }, 350);
    },
    [interactive, onNotePress]
  );

  // Keyboard shortcut binding for the lower octave (A to K keys)
  useEffect(() => {
    if (!interactive) return;

    const keyMap: Record<string, string> = {
      a: `C${currentStartOctave}`,
      w: `C#${currentStartOctave}`,
      s: `D${currentStartOctave}`,
      e: `D#${currentStartOctave}`,
      d: `E${currentStartOctave}`,
      f: `F${currentStartOctave}`,
      t: `F#${currentStartOctave}`,
      g: `G${currentStartOctave}`,
      y: `G#${currentStartOctave}`,
      h: `A${currentStartOctave}`,
      u: `A#${currentStartOctave}`,
      j: `B${currentStartOctave}`,
      k: `C${currentStartOctave + 1}`,
      o: `C#${currentStartOctave + 1}`,
      l: `D${currentStartOctave + 1}`,
      p: `D#${currentStartOctave + 1}`,
      ';': `E${currentStartOctave + 1}`,
    };

    const onKeyDown = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) {
        return;
      }
      const note = keyMap[e.key.toLowerCase()];
      if (note && !e.repeat) {
        handleKeyPress(note);
      }
    };

    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [interactive, currentStartOctave, handleKeyPress]);

  const totalWhite = whiteKeys.length;
  // Percentage width per white key
  const whiteKeyWidthPercent = 100 / totalWhite;

  return (
    <div className={`relative w-full select-none ${className}`}>
      {allowOctaveShift && (
        <div className="flex items-center justify-between mb-2 text-xs text-[#ded7cb]">
          <div className="flex items-center gap-1.5 font-medium">
            <span className="text-[#9faabf]">Range:</span>
            <span className="text-cyan-400 font-mono-numbers">
              C{currentStartOctave} – B{currentStartOctave + octavesCount - 1}
            </span>
            <span className="text-[#9faabf] text-[11px] hidden sm:inline ml-2">
              (Use A–L keys or click/tap)
            </span>
          </div>

          <div className="flex items-center gap-1 bg-[#101932] border border-[#1d2d52] rounded-md p-0.5">
            <button
              type="button"
              onClick={() => setOctaveShift((prev) => Math.max(-2, prev - 1))}
              disabled={octaveShift <= -2}
              className="px-2 py-0.5 text-xs text-[#ded7cb] hover:text-white disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
              aria-label="Shift octave down"
            >
              -8va
            </button>
            <span className="text-[10px] text-[#6b7b9e] px-1">|</span>
            <button
              type="button"
              onClick={() => setOctaveShift(0)}
              className="px-1.5 py-0.5 text-[11px] text-[#ded7cb] hover:text-cyan-300 transition-colors"
            >
              Reset
            </button>
            <span className="text-[10px] text-[#6b7b9e] px-1">|</span>
            <button
              type="button"
              onClick={() => setOctaveShift((prev) => Math.min(2, prev + 1))}
              disabled={octaveShift >= 2}
              className="px-2 py-0.5 text-xs text-[#ded7cb] hover:text-white disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
              aria-label="Shift octave up"
            >
              +8va
            </button>
          </div>
        </div>
      )}

      {/* Keyboard Bed */}
      <div className="relative overflow-x-auto pb-1 touch-pan-x">
        <div
          className={`relative flex bg-[#090e1c] p-1.5 sm:p-2 rounded-lg border border-[#1c2a4b] shadow-2xl ${
            compact ? 'h-36 sm:h-44 min-w-[500px]' : 'h-44 sm:h-56 min-w-[580px] sm:min-w-[680px]'
          }`}
          style={{ width: '100%' }}
        >
          {/* White Keys */}
          {whiteKeys.map((k) => {
            const isHighlighted = highlightedNotes.includes(k.note);
            const isActive = localActiveNotes.has(k.note) || activeNotes.includes(k.note);
            const isMiddleC = k.note === 'C4';

            let labelVisible = false;
            if (showLabels === 'always') labelVisible = true;
            else if (showLabels === 'middle_c' && isMiddleC) labelVisible = true;

            return (
              <button
                key={k.note}
                type="button"
                onClick={() => handleKeyPress(k.note)}
                className={`relative h-full flex flex-col justify-end items-center pb-2.5 rounded-b-md transition-colors border-r border-[#cbd5e1]/40 last:border-r-0 ${
                  isActive
                    ? 'bg-cyan-200 text-slate-900 shadow-inner'
                    : isHighlighted
                    ? 'bg-cyan-50 text-cyan-950 ring-2 ring-cyan-400 ring-inset'
                    : 'bg-[#faf7f2] hover:bg-[#ede8df] text-slate-800'
                }`}
                style={{
                  width: `${whiteKeyWidthPercent}%`,
                  boxShadow: isActive
                    ? 'inset 0 3px 6px rgba(0,0,0,0.3)'
                    : '0 4px 6px -1px rgba(0, 0, 0, 0.4), 0 2px 4px -1px rgba(0, 0, 0, 0.2)',
                }}
                aria-label={`Piano key ${k.note}`}
              >
                {/* Subtle middle C dot anchor */}
                {isMiddleC && (
                  <span
                    className="absolute top-3 w-2 h-2 rounded-full bg-cyan-600/70 pointer-events-none"
                    title="Middle C (C4)"
                  />
                )}

                {labelVisible && (
                  <span
                    className={`text-[11px] sm:text-xs font-semibold tracking-tight transition-transform ${
                      isActive ? 'translate-y-0.5' : ''
                    } ${isMiddleC ? 'text-cyan-700 font-bold' : 'text-slate-600'}`}
                  >
                    {k.label}
                    <span className="text-[9px] opacity-70 ml-0.5 font-normal">{k.octave}</span>
                  </span>
                )}
              </button>
            );
          })}

          {/* Black Keys */}
          {blackKeys.map(({ key: k, whiteIndex }) => {
            const isHighlighted = highlightedNotes.includes(k.note);
            const isActive = localActiveNotes.has(k.note) || activeNotes.includes(k.note);

            // Black key width is roughly 60% of white key width
            // Center is aligned with the right edge of the corresponding white key
            const leftPercent = (whiteIndex + 1) * whiteKeyWidthPercent - whiteKeyWidthPercent * 0.3;
            const blackWidthPercent = whiteKeyWidthPercent * 0.6;

            const labelVisible = showLabels === 'always';

            return (
              <button
                key={k.note}
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  handleKeyPress(k.note);
                }}
                className={`absolute top-1.5 sm:top-2 h-[58%] z-10 flex flex-col justify-end items-center pb-2 rounded-b-[4px] transition-all border border-[#000]/60 ${
                  isActive
                    ? 'bg-cyan-400 text-slate-950 shadow-inner'
                    : isHighlighted
                    ? 'bg-cyan-600 text-white ring-2 ring-cyan-300'
                    : 'bg-[#151c2d] hover:bg-[#202b45] text-cyan-200'
                }`}
                style={{
                  left: `${leftPercent}%`,
                  width: `${blackWidthPercent}%`,
                  boxShadow: isActive
                    ? 'inset 0 2px 4px rgba(0,0,0,0.6)'
                    : '0 6px 10px rgba(0,0,0,0.7), inset 0 -3px 4px rgba(255,255,255,0.08)',
                }}
                aria-label={`Piano key ${k.note}`}
              >
                {labelVisible && (
                  <span
                    className={`text-[9px] sm:text-[10px] font-medium leading-none mb-1 pointer-events-none ${
                      isActive ? 'text-slate-950 font-bold' : 'text-cyan-300/80'
                    }`}
                  >
                    {k.label.replace('#', '♯')}
                  </span>
                )}
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
};
