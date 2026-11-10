/**
 * Entuned Practice & Exploration Area
 * Revisits missed concepts, interactive Circle of Fifths,
 * Chord Detective Sandbox, and Flashcard Note Speed Drill.
 */

import React, { useState } from 'react';
import {
  RotateCcw,
  CheckCircle2,
  Piano,
  CircleDot,
  Volume2,
  Zap,
  ArrowRight,
  BookOpen,
  Sparkles,
} from 'lucide-react';
import { UserProgress } from '../../types/music';
import { PianoKeyboard } from '../piano/PianoKeyboard';
import { StaffVisual } from '../staff/StaffVisual';
import { sound, noteToMidi } from '../../audio/soundEngine';
import { resolveMissedConcept } from '../../utils/storage';

interface PracticeAreaProps {
  progress: UserProgress;
  onUpdateProgress: (updated: UserProgress) => void;
}

// Circle of Fifths definitions
interface CircleKeyInfo {
  major: string;
  minor: string;
  accidentals: string;
  sharpsCount: number; // positive = sharps, negative = flats
  scaleNotes: string[];
}

const CIRCLE_KEYS: CircleKeyInfo[] = [
  { major: 'C', minor: 'Am', accidentals: 'Natural (0)', sharpsCount: 0, scaleNotes: ['C4', 'D4', 'E4', 'F4', 'G4', 'A4', 'B4'] },
  { major: 'G', minor: 'Em', accidentals: '1 Sharp (F♯)', sharpsCount: 1, scaleNotes: ['G4', 'A4', 'B4', 'C5', 'D5', 'E5', 'F#5'] },
  { major: 'D', minor: 'Bm', accidentals: '2 Sharps (F♯, C♯)', sharpsCount: 2, scaleNotes: ['D4', 'E4', 'F#4', 'G4', 'A4', 'B4', 'C#5'] },
  { major: 'A', minor: 'F♯m', accidentals: '3 Sharps (F♯, C♯, G♯)', sharpsCount: 3, scaleNotes: ['A4', 'B4', 'C#5', 'D5', 'E5', 'F#5', 'G#5'] },
  { major: 'E', minor: 'C♯m', accidentals: '4 Sharps (F♯, C♯, G♯, D♯)', sharpsCount: 4, scaleNotes: ['E4', 'F#4', 'G#4', 'A4', 'B4', 'C#5', 'D#5'] },
  { major: 'B', minor: 'G♯m', accidentals: '5 Sharps', sharpsCount: 5, scaleNotes: ['B4', 'C#5', 'D#5', 'E5', 'F#5', 'G#5', 'A#5'] },
  { major: 'F♯', minor: 'D♯m', accidentals: '6 Sharps', sharpsCount: 6, scaleNotes: ['F#4', 'G#4', 'A#4', 'B4', 'C#5', 'D#5', 'E#5'] },
  { major: 'D♭', minor: 'B♭m', accidentals: '5 Flats', sharpsCount: -5, scaleNotes: ['Db4', 'Eb4', 'F4', 'Gb4', 'Ab4', 'Bb4', 'C5'] },
  { major: 'A♭', minor: 'Fm', accidentals: '4 Flats', sharpsCount: -4, scaleNotes: ['Ab4', 'Bb4', 'C5', 'Db5', 'Eb5', 'F5', 'G5'] },
  { major: 'E♭', minor: 'Cm', accidentals: '3 Flats (B♭, E♭, A♭)', sharpsCount: -3, scaleNotes: ['Eb4', 'F4', 'G4', 'Ab4', 'Bb4', 'C5', 'D5'] },
  { major: 'B♭', minor: 'Gm', accidentals: '2 Flats (B♭, E♭)', sharpsCount: -2, scaleNotes: ['Bb4', 'C5', 'D5', 'Eb5', 'F5', 'G5', 'A5'] },
  { major: 'F', minor: 'Dm', accidentals: '1 Flat (B♭)', sharpsCount: -1, scaleNotes: ['F4', 'G4', 'A4', 'Bb4', 'C5', 'D5', 'E5'] },
];

export const PracticeArea: React.FC<PracticeAreaProps> = ({
  progress,
  onUpdateProgress,
}) => {
  const [activePracticeTab, setActivePracticeTab] = useState<'mistakes' | 'circle' | 'sandbox' | 'flashcards'>('mistakes');

  // Sandbox state
  const [activeNotes, setActiveNotes] = useState<string[]>(['C4', 'E4', 'G4']);
  const [selectedCircleKey, setSelectedCircleKey] = useState<CircleKeyInfo>(CIRCLE_KEYS[0]);

  // Flashcard Drill state
  const flashcardPool = [
    { clef: 'treble' as const, pitch: 'E', octave: 4, name: 'E4' },
    { clef: 'treble' as const, pitch: 'G', octave: 4, name: 'G4' },
    { clef: 'treble' as const, pitch: 'B', octave: 4, name: 'B4' },
    { clef: 'treble' as const, pitch: 'D', octave: 5, name: 'D5' },
    { clef: 'treble' as const, pitch: 'F', octave: 5, name: 'F5' },
    { clef: 'treble' as const, pitch: 'C', octave: 4, name: 'C4' },
    { clef: 'treble' as const, pitch: 'A', octave: 4, name: 'A4' },
    { clef: 'bass' as const, pitch: 'G', octave: 2, name: 'G2' },
    { clef: 'bass' as const, pitch: 'D', octave: 3, name: 'D3' },
    { clef: 'bass' as const, pitch: 'F', octave: 3, name: 'F3' },
    { clef: 'bass' as const, pitch: 'C', octave: 3, name: 'C3' },
  ];
  const [drillIndex, setDrillIndex] = useState(0);
  const [drillFeedback, setDrillFeedback] = useState<string | null>(null);

  const currentFlashcard = flashcardPool[drillIndex % flashcardPool.length];

  const unresolvedMistakes = progress.missedConcepts.filter((m) => !m.resolved);

  // Simple chord detection algorithm
  const detectChordName = (notes: string[]): { name: string; formula: string } => {
    if (notes.length === 0) return { name: 'Tap keys to detect chords', formula: '—' };
    if (notes.length === 1) return { name: `${notes[0].replace(/\d/, '')} Single Note`, formula: 'Root' };
    if (notes.length === 2) return { name: `${notes[0].replace(/\d/, '')} - ${notes[1].replace(/\d/, '')} Interval`, formula: 'Two-note harmony' };

    const sorted = [...notes].sort((a, b) => noteToMidi(a) - noteToMidi(b));
    const root = sorted[0].replace(/\d/, '');
    const midis = sorted.map((n) => noteToMidi(n) - noteToMidi(sorted[0]));

    if (midis.includes(4) && midis.includes(7)) {
      if (midis.includes(10)) return { name: `${root} Dominant 7th (${root}7)`, formula: 'Root - Maj 3rd - Perf 5th - Min 7th' };
      if (midis.includes(11)) return { name: `${root} Major 7th (${root}maj7)`, formula: 'Root - Maj 3rd - Perf 5th - Maj 7th' };
      return { name: `${root} Major Triad`, formula: 'Root - Major 3rd (4) - Perfect 5th (7)' };
    }
    if (midis.includes(3) && midis.includes(7)) {
      if (midis.includes(10)) return { name: `${root} Minor 7th (${root}m7)`, formula: 'Root - Min 3rd - Perf 5th - Min 7th' };
      return { name: `${root} Minor Triad`, formula: 'Root - Minor 3rd (3) - Perfect 5th (7)' };
    }
    if (midis.includes(3) && midis.includes(6)) {
      return { name: `${root} Diminished Triad`, formula: 'Root - Minor 3rd (3) - Diminished 5th (6)' };
    }
    if (midis.includes(4) && midis.includes(8)) {
      return { name: `${root} Augmented Triad`, formula: 'Root - Major 3rd (4) - Augmented 5th (8)' };
    }

    return { name: `${root} Voicing`, formula: `${notes.map((n) => n.replace(/\d/, '')).join(' · ')}` };
  };

  const chordDetection = detectChordName(activeNotes);

  const toggleNote = (note: string) => {
    setActiveNotes((prev) => {
      if (prev.includes(note)) {
        return prev.filter((n) => n !== note);
      } else {
        if (prev.length >= 4) {
          return [...prev.slice(1), note];
        }
        return [...prev, note];
      }
    });
  };

  return (
    <div className="w-full max-w-4xl mx-auto px-4 sm:px-6 pt-6 pb-24 space-y-6 animate-fadeIn">
      {/* Header & Segmented Tab Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-[#fcf9f2]">Practice & Review Lab</h2>
          <p className="text-xs text-[#9faabf]">
            Revisit missed questions, explore keys on the Circle of 5ths, or detect chords.
          </p>
        </div>

        {/* Interactive Segmented Tabs (Functional Buttons) */}
        <div className="flex items-center gap-1 p-1 bg-[#0d162e] border border-[#1d2d52] rounded-lg">
          <button
            type="button"
            onClick={() => setActivePracticeTab('mistakes')}
            className={`px-3 py-1.5 text-xs font-semibold rounded-md transition-colors btn-tactile ${
              activePracticeTab === 'mistakes'
                ? 'bg-[#1a294e] text-cyan-300 shadow-sm'
                : 'text-[#8b9bb4] hover:text-[#ded7cb]'
            }`}
          >
            Mistakes ({unresolvedMistakes.length})
          </button>
          <button
            type="button"
            onClick={() => setActivePracticeTab('circle')}
            className={`px-3 py-1.5 text-xs font-semibold rounded-md transition-colors btn-tactile ${
              activePracticeTab === 'circle'
                ? 'bg-[#1a294e] text-cyan-300 shadow-sm'
                : 'text-[#8b9bb4] hover:text-[#ded7cb]'
            }`}
          >
            Circle of 5ths
          </button>
          <button
            type="button"
            onClick={() => setActivePracticeTab('sandbox')}
            className={`px-3 py-1.5 text-xs font-semibold rounded-md transition-colors btn-tactile ${
              activePracticeTab === 'sandbox'
                ? 'bg-[#1a294e] text-cyan-300 shadow-sm'
                : 'text-[#8b9bb4] hover:text-[#ded7cb]'
            }`}
          >
            Chord Detective
          </button>
          <button
            type="button"
            onClick={() => setActivePracticeTab('flashcards')}
            className={`px-3 py-1.5 text-xs font-semibold rounded-md transition-colors btn-tactile ${
              activePracticeTab === 'flashcards'
                ? 'bg-[#1a294e] text-cyan-300 shadow-sm'
                : 'text-[#8b9bb4] hover:text-[#ded7cb]'
            }`}
          >
            Staff Drill
          </button>
        </div>
      </div>

      {/* =========================================================================
          TAB 1: MISTAKE REVIEW QUEUE
         ========================================================================= */}
      {activePracticeTab === 'mistakes' && (
        <section className="space-y-4">
          {unresolvedMistakes.length === 0 ? (
            <div className="p-8 text-center bg-[#0a1124] border border-[#1a284c] rounded-xl space-y-3">
              <div className="w-12 h-12 mx-auto rounded-full bg-emerald-950 border border-emerald-500/40 flex items-center justify-center text-emerald-400">
                <CheckCircle2 className="w-6 h-6" />
              </div>
              <h3 className="text-lg font-bold text-[#fcf9f2]">No Missed Concepts!</h3>
              <p className="text-xs text-[#ded7cb] max-w-sm mx-auto">
                You have demonstrated clean execution across your lessons. If you miss questions in future exercises, they will appear here for targeted drills.
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              <div className="text-xs text-[#9faabf]">
                Click &quot;Resolve Concept&quot; once you have reinforced the theoretical rule.
              </div>

              {unresolvedMistakes.map((miss) => (
                <div
                  key={miss.id}
                  className="p-4 bg-[#0c142b] border border-[#1c2c52] rounded-xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 shadow-sm"
                >
                  <div className="space-y-1">
                    <span className="text-[11px] font-semibold text-rose-400 uppercase tracking-wide">
                      {miss.conceptTag} · Unit {miss.unitId}
                    </span>
                    <h4 className="text-sm sm:text-base font-bold text-[#fcf9f2]">
                      {miss.prompt}
                    </h4>
                  </div>

                  <button
                    type="button"
                    onClick={() => {
                      sound.playCorrect();
                      const updated = resolveMissedConcept(progress, miss.id);
                      onUpdateProgress(updated);
                    }}
                    className="px-3.5 py-1.5 text-xs font-semibold text-emerald-300 bg-emerald-950/60 border border-emerald-700/50 hover:bg-emerald-900/60 rounded-md transition-colors btn-tactile shrink-0"
                  >
                    Mark Reviewed ✓
                  </button>
                </div>
              ))}
            </div>
          )}
        </section>
      )}

      {/* =========================================================================
          TAB 2: INTERACTIVE CIRCLE OF FIFTHS
         ========================================================================= */}
      {activePracticeTab === 'circle' && (
        <section className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Key Clock Wheel */}
          <div className="md:col-span-2 bg-[#0a1124] border border-[#192748] rounded-xl p-5 shadow-xl space-y-4">
            <div className="flex items-center justify-between text-xs text-[#9faabf]">
              <span className="font-semibold text-cyan-300">Clockwise: Ascending 5ths (+Sharps)</span>
              <span>Counter-clockwise: 4ths (+Flats)</span>
            </div>

            <div className="grid grid-cols-3 sm:grid-cols-4 gap-2.5">
              {CIRCLE_KEYS.map((k) => {
                const isSelected = selectedCircleKey.major === k.major;
                return (
                  <button
                    key={k.major}
                    type="button"
                    onClick={() => {
                      setSelectedCircleKey(k);
                      sound.playChord([k.scaleNotes[0], k.scaleNotes[2], k.scaleNotes[4]], true);
                    }}
                    className={`p-3 rounded-lg border text-center btn-tactile transition-all ${
                      isSelected
                        ? 'bg-[#152347] border-cyan-400 text-white shadow-lg ring-1 ring-cyan-400'
                        : 'bg-[#0f1730] border-[#1f2f54] text-[#ded7cb] hover:bg-[#14203e]'
                    }`}
                  >
                    <div className="text-lg font-bold text-[#fcf9f2]">{k.major}</div>
                    <div className="text-xs text-violet-300 font-medium">{k.minor}</div>
                    <div className="text-[10px] text-[#7888aa] mt-1">{k.accidentals}</div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Key Details Card */}
          <div className="bg-[#0c142b] border border-[#1b2b52] rounded-xl p-5 space-y-5 flex flex-col justify-between shadow-xl">
            <div className="space-y-4">
              <div>
                <span className="text-[11px] text-cyan-400 uppercase font-semibold">
                  Selected Key Signature
                </span>
                <h3 className="text-2xl font-bold text-[#fcf9f2]">
                  {selectedCircleKey.major} Major
                </h3>
                <span className="text-xs text-violet-300">
                  Relative Minor: {selectedCircleKey.minor}
                </span>
              </div>

              <div className="space-y-2 text-xs">
                <div className="flex justify-between py-1.5 border-b border-[#18274a]">
                  <span className="text-[#9faabf]">Accidentals</span>
                  <span className="font-semibold text-[#fcf9f2]">
                    {selectedCircleKey.accidentals}
                  </span>
                </div>
                <div className="flex justify-between py-1.5 border-b border-[#18274a]">
                  <span className="text-[#9faabf]">Tonic (I) Chord</span>
                  <span className="font-semibold text-cyan-300">
                    {selectedCircleKey.major} Major
                  </span>
                </div>
                <div className="flex justify-between py-1.5 border-b border-[#18274a]">
                  <span className="text-[#9faabf]">Dominant (V)</span>
                  <span className="font-semibold text-amber-300">
                    {selectedCircleKey.scaleNotes[4]?.replace(/\d/, '')} Major
                  </span>
                </div>
              </div>
            </div>

            <button
              type="button"
              onClick={() => {
                // Play tonic triad
                const notes = [
                  selectedCircleKey.scaleNotes[0],
                  selectedCircleKey.scaleNotes[2],
                  selectedCircleKey.scaleNotes[4],
                ];
                sound.playChord(notes, true);
              }}
              className="w-full py-2.5 px-4 text-xs font-semibold text-slate-950 bg-cyan-400 hover:bg-cyan-300 rounded-lg flex items-center justify-center gap-2 btn-tactile"
            >
              <Volume2 className="w-4 h-4" />
              <span>Hear Tonic Triad</span>
            </button>
          </div>
        </section>
      )}

      {/* =========================================================================
          TAB 3: PIANO CHORD DETECTIVE SANDBOX
         ========================================================================= */}
      {activePracticeTab === 'sandbox' && (
        <section className="space-y-6">
          <div className="p-4 bg-[#0a1124] border border-[#192748] rounded-xl flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="space-y-1 text-center sm:text-left">
              <span className="text-xs font-semibold text-cyan-400 uppercase">
                Detected Harmony
              </span>
              <h3 className="text-2xl font-bold text-[#fcf9f2]">{chordDetection.name}</h3>
              <p className="text-xs text-[#9faabf]">{chordDetection.formula}</p>
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => sound.playChord(activeNotes, true)}
                className="px-3.5 py-2 text-xs font-semibold text-cyan-300 bg-[#14203e] border border-cyan-500/40 hover:bg-[#1a2c54] rounded-lg flex items-center gap-1.5 btn-tactile"
              >
                <Volume2 className="w-4 h-4" />
                <span>Arpeggiate</span>
              </button>
              <button
                type="button"
                onClick={() => setActiveNotes([])}
                className="px-3 py-2 text-xs text-[#9faabf] hover:text-white rounded-lg transition-colors"
              >
                Clear
              </button>
            </div>
          </div>

          {/* Quick Chord Preset Buttons */}
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-xs text-[#9faabf] mr-1">Quick Presets:</span>
            {[
              { label: 'C Maj', notes: ['C4', 'E4', 'G4'] },
              { label: 'A Min', notes: ['A4', 'C5', 'E5'] },
              { label: 'F Maj', notes: ['F4', 'A4', 'C5'] },
              { label: 'G7', notes: ['G4', 'B4', 'D5', 'F5'] },
              { label: 'D Min', notes: ['D4', 'F4', 'A4'] },
              { label: 'E Min', notes: ['E4', 'G4', 'B4'] },
            ].map((preset) => (
              <button
                key={preset.label}
                type="button"
                onClick={() => {
                  setActiveNotes(preset.notes);
                  sound.playChord(preset.notes, true);
                }}
                className="px-2.5 py-1 text-xs font-medium rounded-md border border-[#233560] bg-[#101b38] text-[#ded7cb] hover:border-cyan-400 hover:text-cyan-200 btn-tactile"
              >
                {preset.label}
              </button>
            ))}
          </div>

          {/* 2-Octave Keyboard for Sandbox Play */}
          <div className="pt-2">
            <PianoKeyboard
              startOctave={4}
              octavesCount={2}
              highlightedNotes={activeNotes}
              onNotePress={toggleNote}
              showLabels="always"
            />
          </div>
        </section>
      )}

      {/* =========================================================================
          TAB 4: RAPID STAFF NOTE FLASHCARD SPEED DRILL
         ========================================================================= */}
      {activePracticeTab === 'flashcards' && (
        <section className="max-w-lg mx-auto space-y-6">
          <div className="text-center space-y-1">
            <h3 className="text-xl font-bold text-[#fcf9f2]">Staff Speed Drill</h3>
            <p className="text-xs text-[#9faabf]">
              Identify the note as fast as possible to build instant sight-reading reflex.
            </p>
          </div>

          <StaffVisual
            clef={currentFlashcard.clef}
            notes={[{ pitch: currentFlashcard.pitch, octave: currentFlashcard.octave }]}
            caption="What note is this?"
          />

          <div className="grid grid-cols-4 gap-2.5">
            {['C', 'D', 'E', 'F', 'G', 'A', 'B'].map((letter) => (
              <button
                key={letter}
                type="button"
                onClick={() => {
                  if (letter === currentFlashcard.pitch) {
                    sound.playCorrect();
                    setDrillFeedback('Correct!');
                    setTimeout(() => {
                      setDrillFeedback(null);
                      setDrillIndex((prev) => prev + 1);
                    }, 350);
                  } else {
                    sound.playIncorrect();
                    setDrillFeedback(`That note is ${currentFlashcard.pitch}`);
                  }
                }}
                className="py-3 text-lg font-bold rounded-lg border border-[#1f3056] bg-[#0f172e] text-[#fcf9f2] hover:bg-[#152347] hover:border-cyan-400 btn-tactile"
              >
                {letter}
              </button>
            ))}
          </div>

          {drillFeedback && (
            <div className="text-center text-sm font-semibold text-cyan-300 animate-fadeIn">
              {drillFeedback}
            </div>
          )}
        </section>
      )}
    </div>
  );
};
