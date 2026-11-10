/**
 * Entuned SVG Sheet Music Notation Visualizer
 * Accurate staff notation rendering with Treble & Bass clefs,
 * ledger lines, stems, accidentals, and interactive audio playback.
 */

import React from 'react';
import { Volume2 } from 'lucide-react';
import { Clef } from '../../types/music';
import { sound } from '../../audio/soundEngine';

export interface NoteDisplayItem {
  pitch: string; // e.g. "C", "F#", "Eb"
  octave: number; // e.g. 4
  accidental?: 'sharp' | 'flat' | 'natural';
  color?: string;
  label?: string;
}

interface StaffVisualProps {
  clef?: Clef;
  notes?: NoteDisplayItem[];
  timeSignature?: [number, number]; // e.g. [4, 4]
  width?: number;
  height?: number;
  interactive?: boolean;
  onNoteClick?: (note: NoteDisplayItem) => void;
  showPlayButton?: boolean;
  className?: string;
  caption?: string;
}

// Semitone step index relative to baseline reference
const PITCH_DIATONIC_INDEX: Record<string, number> = {
  C: 0,
  D: 1,
  E: 2,
  F: 3,
  G: 4,
  A: 5,
  B: 6,
};

/**
 * Calculates vertical Y coordinate on staff:
 * Bottom line (Line 1) is at y = staffTop + 4 * lineSpacing.
 * Top line (Line 5) is at y = staffTop.
 * Each diatonic step is half a lineSpacing.
 */
function getNoteStaffStep(pitch: string, octave: number, clef: Clef): number {
  const purePitch = pitch.replace(/[#b]/g, '');
  const diatonicOffset = PITCH_DIATONIC_INDEX[purePitch] ?? 0;
  const totalDiatonic = octave * 7 + diatonicOffset;

  if (clef === 'treble') {
    // E4 is line 1 (step 0). Total diatonic of E4: 4*7 + 2 = 30.
    return totalDiatonic - 30;
  } else {
    // G2 is line 1 (step 0) in Bass Clef. Total diatonic of G2: 2*7 + 4 = 18.
    return totalDiatonic - 18;
  }
}

export const StaffVisual: React.FC<StaffVisualProps> = ({
  clef = 'treble',
  notes = [{ pitch: 'C', octave: 4 }],
  timeSignature,
  width = 380,
  height = 160,
  interactive = false,
  onNoteClick,
  showPlayButton = true,
  className = '',
  caption,
}) => {
  const lineSpacing = 14;
  const staffTop = height / 2 - 2 * lineSpacing; // Center 5 lines vertically
  const staffBottom = staffTop + 4 * lineSpacing;

  const staffLines = [0, 1, 2, 3, 4].map((i) => staffTop + i * lineSpacing);

  const handlePlayNotes = () => {
    if (!notes.length) return;
    if (notes.length === 1) {
      const n = notes[0];
      const acc = n.accidental === 'sharp' ? '#' : n.accidental === 'flat' ? 'b' : '';
      sound.playNote(`${n.pitch.replace(/[#b]/g, '')}${acc}${n.octave}`);
    } else {
      const fullNotes = notes.map((n) => {
        const acc = n.accidental === 'sharp' ? '#' : n.accidental === 'flat' ? 'b' : '';
        return `${n.pitch.replace(/[#b]/g, '')}${acc}${n.octave}`;
      });
      sound.playChord(fullNotes, true);
    }
  };

  // Compute spacing for notes across the staff
  const startX = timeSignature ? 115 : 90;
  const noteSpacing = notes.length > 1 ? Math.min(60, (width - startX - 40) / notes.length) : 50;

  return (
    <div className={`relative flex flex-col items-center bg-[#090f20] border border-[#1b2b4e] rounded-lg p-3 shadow-inner ${className}`}>
      {/* Top utility row: Clef indicator & Audio listen button */}
      <div className="w-full flex items-center justify-between px-2 mb-1 text-xs text-[#9faabf]">
        <span className="font-medium text-[#ded7cb]">
          {clef === 'treble' ? 'Treble Clef (G)' : 'Bass Clef (F)'}
        </span>
        {showPlayButton && notes.length > 0 && (
          <button
            type="button"
            onClick={handlePlayNotes}
            className="flex items-center gap-1.5 px-2.5 py-1 text-xs font-medium text-cyan-300 hover:text-cyan-200 bg-[#121c38] hover:bg-[#18264c] border border-[#233560] rounded-md transition-colors btn-tactile"
            aria-label="Play notes on staff"
          >
            <Volume2 className="w-3.5 h-3.5 text-cyan-400" />
            <span>Hear Pitch</span>
          </button>
        )}
      </div>

      {/* SVG Canvas */}
      <div className="w-full overflow-x-auto flex justify-center">
        <svg
          viewBox={`0 0 ${width} ${height}`}
          className="w-full max-w-[440px] select-none"
          style={{ minHeight: `${height}px` }}
        >
          {/* Staff 5 horizontal lines */}
          {staffLines.map((y, idx) => (
            <line
              key={idx}
              x1="20"
              y1={y}
              x2={width - 20}
              y2={y}
              stroke="#384c75"
              strokeWidth="1.5"
              strokeLinecap="round"
            />
          ))}

          {/* Left vertical bar line */}
          <line
            x1="20"
            y1={staffTop}
            x2="20"
            y2={staffBottom}
            stroke="#476093"
            strokeWidth="2"
          />

          {/* Clef Drawing */}
          {clef === 'treble' ? (
            <g transform={`translate(28, ${staffTop - 18}) scale(0.065)`}>
              {/* Simplified high-fidelity SVG Treble Clef Path */}
              <path
                d="M322 710c-3-24-15-46-37-64-19-15-43-26-72-33-30-7-62-11-96-11-47 0-90 8-128 24-38 17-68 40-91 71-23 31-34 68-34 110 0 46 13 86 39 120 26 34 62 60 108 78 46 18 99 27 159 27 49 0 94-8 135-24 41-16 74-38 99-66 25-28 38-60 38-96 0-32-11-61-33-87-22-26-53-46-93-60-40-14-87-21-141-21-41 0-77 6-108 18-31 12-54 28-69 48-15 20-23 42-23 66 0 28 11 51 33 69 22 18 51 27 87 27 34 0 62-8 84-24 22-16 33-37 33-63 0-19-6-34-18-45-12-11-28-17-48-17-15 0-27 4-36 12-9 8-14 18-14 30 0 11 4 20 12 27 8 7 18 10 30 10 10 0 19-3 27-9 8-6 12-14 12-24 0-7-3-13-9-17-6-4-13-6-21-6-6 0-11 2-15 6-4 4-6 9-6 15 0 8 5 14 15 18 10 4 22 6 36 6 22 0 40-7 54-21 14-14 21-32 21-54 0-31-13-57-39-78-26-21-61-31-105-31-48 0-89 12-123 36-34 24-51 55-51 93 0 43 19 79 57 108 38 29 88 43 150 43 57 0 106-12 147-36 41-24 71-57 90-99 19-42 29-89 29-141 0-47-9-92-27-135-18-43-44-80-78-111-34-31-75-55-123-72-48-17-101-25-159-25-66 0-125 11-177 33-52 22-94 53-126 93-32 40-48 87-48 141 0 49 14 93 42 132 28 39 67 69 117 90 50 21 108 31 174 31 63 0 120-10 171-30 51-20 92-49 123-87 31-38 47-83 47-135z"
                fill="#00f0ff"
                opacity="0.9"
              />
            </g>
          ) : (
            <g transform={`translate(28, ${staffTop + 6}) scale(0.85)`}>
              {/* Bass Clef Path */}
              <path
                d="M4 14 C4 6, 12 0, 20 0 C28 0, 36 6, 36 15 C36 28, 22 42, 6 48 L4 44 C18 39, 28 28, 28 17 C28 9, 23 5, 17 5 C11 5, 7 9, 7 14 C7 17, 9 19, 12 19 C14 19, 16 17, 16 15 C16 13, 14 11, 12 11"
                fill="#00f0ff"
                opacity="0.9"
              />
              {/* Bass Clef two dots on line 4 (F line) */}
              <circle cx="34" cy="10" r="2.5" fill="#00f0ff" />
              <circle cx="34" cy="22" r="2.5" fill="#00f0ff" />
            </g>
          )}

          {/* Time Signature (if provided) */}
          {timeSignature && (
            <g transform={`translate(74, ${staffTop + 2 * lineSpacing})`}>
              <text
                x="0"
                y="-3"
                fill="#f7f5ed"
                fontSize="24"
                fontWeight="bold"
                fontFamily="var(--font-display)"
                textAnchor="middle"
              >
                {timeSignature[0]}
              </text>
              <text
                x="0"
                y="24"
                fill="#f7f5ed"
                fontSize="24"
                fontWeight="bold"
                fontFamily="var(--font-display)"
                textAnchor="middle"
              >
                {timeSignature[1]}
              </text>
            </g>
          )}

          {/* Notes Rendering */}
          {notes.map((noteItem, idx) => {
            const step = getNoteStaffStep(noteItem.pitch, noteItem.octave, clef);
            const noteY = staffBottom - step * (lineSpacing / 2);
            const noteX = startX + idx * noteSpacing;
            const stemPointsDown = step >= 4; // Above middle line

            // Ledger Lines logic
            const ledgerLines: number[] = [];
            if (step < 0) {
              // Below staff: e.g. step -2 (C4 in treble) -> line at step -2
              for (let s = -2; s >= step; s -= 2) {
                ledgerLines.push(staffBottom - s * (lineSpacing / 2));
              }
            } else if (step > 8) {
              // Above staff: e.g. step 10 (A5 in treble) -> line at step 10
              for (let s = 10; s <= step; s += 2) {
                ledgerLines.push(staffBottom - s * (lineSpacing / 2));
              }
            }

            const noteColor = noteItem.color || '#f7f5ed';

            return (
              <g
                key={idx}
                className={interactive ? 'cursor-pointer hover:opacity-85' : ''}
                onClick={() => onNoteClick && onNoteClick(noteItem)}
              >
                {/* Ledger Lines */}
                {ledgerLines.map((ly, lIdx) => (
                  <line
                    key={lIdx}
                    x1={noteX - 14}
                    y1={ly}
                    x2={noteX + 14}
                    y2={ly}
                    stroke="#506b9b"
                    strokeWidth="1.8"
                  />
                ))}

                {/* Accidental Sign */}
                {noteItem.accidental === 'sharp' && (
                  <text
                    x={noteX - 16}
                    y={noteY + 4}
                    fill="#00f0ff"
                    fontSize="18"
                    fontWeight="bold"
                    textAnchor="middle"
                  >
                    ♯
                  </text>
                )}
                {noteItem.accidental === 'flat' && (
                  <text
                    x={noteX - 16}
                    y={noteY + 4}
                    fill="#00f0ff"
                    fontSize="18"
                    fontWeight="bold"
                    textAnchor="middle"
                  >
                    ♭
                  </text>
                )}
                {noteItem.accidental === 'natural' && (
                  <text
                    x={noteX - 15}
                    y={noteY + 5}
                    fill="#00f0ff"
                    fontSize="18"
                    fontWeight="bold"
                    textAnchor="middle"
                  >
                    ♮
                  </text>
                )}

                {/* Notehead (slanted oval) */}
                <ellipse
                  cx={noteX}
                  cy={noteY}
                  rx="7.5"
                  ry="5.2"
                  transform={`rotate(-22 ${noteX} ${noteY})`}
                  fill={noteColor}
                  stroke="#0b1328"
                  strokeWidth="1"
                />

                {/* Stem */}
                <line
                  x1={stemPointsDown ? noteX - 6.5 : noteX + 6.5}
                  y1={noteY}
                  x2={stemPointsDown ? noteX - 6.5 : noteX + 6.5}
                  y2={stemPointsDown ? noteY + 36 : noteY - 36}
                  stroke={noteColor}
                  strokeWidth="1.8"
                />

                {/* Optional Pitch Label under staff */}
                {noteItem.label && (
                  <text
                    x={noteX}
                    y={height - 10}
                    fill="#a78bfa"
                    fontSize="12"
                    fontWeight="600"
                    textAnchor="middle"
                    fontFamily="var(--font-display)"
                  >
                    {noteItem.label}
                  </text>
                )}
              </g>
            );
          })}

          {/* End double bar line */}
          <line
            x1={width - 25}
            y1={staffTop}
            x2={width - 25}
            y2={staffBottom}
            stroke="#384c75"
            strokeWidth="1.5"
          />
          <line
            x1={width - 20}
            y1={staffTop}
            x2={width - 20}
            y2={staffBottom}
            stroke="#476093"
            strokeWidth="3.5"
          />
        </svg>
      </div>

      {caption && (
        <div className="mt-1 text-xs text-[#ded7cb] text-center font-medium">
          {caption}
        </div>
      )}
    </div>
  );
};
