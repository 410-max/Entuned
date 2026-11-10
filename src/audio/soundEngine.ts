/**
 * Entuned Web Audio API Synthesizer & Sound Engine
 * Provides authentic synthesized piano pitches and delightful UI feedback audio.
 */

// Note to MIDI number mapping
const NOTE_OFFSETS: Record<string, number> = {
  C: 0,
  'C#': 1,
  Db: 1,
  D: 2,
  'D#': 3,
  Eb: 3,
  E: 4,
  F: 5,
  'F#': 6,
  Gb: 6,
  G: 7,
  'G#': 8,
  Ab: 8,
  A: 9,
  'A#': 10,
  Bb: 10,
  B: 11,
};

export function noteToMidi(noteStr: string): number {
  // Matches e.g. "C4", "F#3", "Bb5"
  const match = noteStr.match(/^([A-G][b#]?)(-?\d+)$/);
  if (!match) return 60; // default C4
  const pitch = match[1];
  const octave = parseInt(match[2], 10);
  const offset = NOTE_OFFSETS[pitch] ?? 0;
  return (octave + 1) * 12 + offset;
}

export function midiToFreq(midi: number): number {
  return 440 * Math.pow(2, (midi - 69) / 12);
}

export function noteToFreq(noteStr: string): number {
  return midiToFreq(noteToMidi(noteStr));
}

class SoundEngine {
  private ctx: AudioContext | null = null;
  private isMuted: boolean = false;
  private sfxEnabled: boolean = true;
  private masterGain: GainNode | null = null;
  private volume: number = 0.7;
  private currentVoice: 'felt_piano' | 'bright_bell' | 'warm_reed' = 'felt_piano';
  private activeVoices: Map<string, { stop: () => void }> = new Map();

  private getContext(): AudioContext | null {
    if (typeof window === 'undefined') return null;
    if (!this.ctx) {
      const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      if (AudioCtx) {
        this.ctx = new AudioCtx();
        this.masterGain = this.ctx.createGain();
        this.masterGain.gain.setValueAtTime(this.isMuted ? 0 : this.volume, this.ctx.currentTime);
        this.masterGain.connect(this.ctx.destination);
      }
    }
    if (this.ctx && this.ctx.state === 'suspended') {
      this.ctx.resume().catch(() => {});
    }
    return this.ctx;
  }

  public setMuted(muted: boolean) {
    this.isMuted = muted;
    if (this.masterGain && this.ctx) {
      this.masterGain.gain.setValueAtTime(muted ? 0 : this.volume, this.ctx.currentTime);
    }
  }

  public setSfxEnabled(enabled: boolean) {
    this.sfxEnabled = enabled;
  }

  public setVoice(voice: 'felt_piano' | 'bright_bell' | 'warm_reed') {
    this.currentVoice = voice;
  }

  public setVolume(vol: number) {
    this.volume = Math.max(0, Math.min(1, vol));
    if (this.masterGain && this.ctx) {
      this.masterGain.gain.setValueAtTime(this.isMuted ? 0 : this.volume, this.ctx.currentTime);
    }
  }

  /**
   * Synthesize an authentic acoustic felt piano note or alternative timbre
   */
  public playNote(note: string, durationSec: number = 1.4): void {
    if (this.isMuted) return;
    const ctx = this.getContext();
    if (!ctx || !this.masterGain) return;

    const freq = noteToFreq(note);
    const now = ctx.currentTime;

    // Cut off previously ringing instance of same note
    if (this.activeVoices.has(note)) {
      this.activeVoices.get(note)?.stop();
      this.activeVoices.delete(note);
    }

    if (this.currentVoice === 'bright_bell') {
      this.playBellVoice(ctx, freq, now, durationSec, note);
    } else if (this.currentVoice === 'warm_reed') {
      this.playReedVoice(ctx, freq, now, durationSec, note);
    } else {
      this.playFeltPianoVoice(ctx, freq, now, durationSec, note);
    }
  }

  private playFeltPianoVoice(
    ctx: AudioContext,
    freq: number,
    now: number,
    duration: number,
    noteKey: string
  ) {
    if (!this.masterGain) return;

    // Piano note synthesis: Additive modeling with low-pass filter dampening
    const osc1 = ctx.createOscillator(); // Fundamental (sine/triangle blend)
    const osc2 = ctx.createOscillator(); // 1st harmonic (2x)
    const osc3 = ctx.createOscillator(); // 2nd harmonic (3x subtle)

    const gain1 = ctx.createGain();
    const gain2 = ctx.createGain();
    const gain3 = ctx.createGain();
    const filter = ctx.createBiquadFilter();

    osc1.type = 'triangle';
    osc1.frequency.setValueAtTime(freq, now);

    osc2.type = 'sine';
    osc2.frequency.setValueAtTime(freq * 2, now);

    osc3.type = 'sine';
    osc3.frequency.setValueAtTime(freq * 3, now);

    // Filter mimics soundboard and felt dampening
    filter.type = 'lowpass';
    const cutoff = Math.min(6500, freq * 4.5);
    filter.frequency.setValueAtTime(cutoff, now);
    filter.frequency.exponentialRampToValueAtTime(Math.max(120, freq * 1.2), now + duration);

    // Envelopes: Fast attack (5ms), natural piano exponential decay
    const attack = 0.006;
    gain1.gain.setValueAtTime(0.0001, now);
    gain1.gain.linearRampToValueAtTime(0.45, now + attack);
    gain1.gain.exponentialRampToValueAtTime(0.0001, now + duration);

    gain2.gain.setValueAtTime(0.0001, now);
    gain2.gain.linearRampToValueAtTime(0.18, now + attack);
    gain2.gain.exponentialRampToValueAtTime(0.0001, now + duration * 0.7);

    gain3.gain.setValueAtTime(0.0001, now);
    gain3.gain.linearRampToValueAtTime(0.06, now + attack);
    gain3.gain.exponentialRampToValueAtTime(0.0001, now + duration * 0.4);

    osc1.connect(gain1);
    osc2.connect(gain2);
    osc3.connect(gain3);

    gain1.connect(filter);
    gain2.connect(filter);
    gain3.connect(filter);

    filter.connect(this.masterGain);

    osc1.start(now);
    osc2.start(now);
    osc3.start(now);

    const stopTime = now + duration + 0.05;
    osc1.stop(stopTime);
    osc2.stop(stopTime);
    osc3.stop(stopTime);

    this.activeVoices.set(noteKey, {
      stop: () => {
        try {
          const cut = ctx.currentTime;
          gain1.gain.cancelScheduledValues(cut);
          gain1.gain.linearRampToValueAtTime(0.0001, cut + 0.05);
          osc1.stop(cut + 0.06);
          osc2.stop(cut + 0.06);
          osc3.stop(cut + 0.06);
        } catch {
          // ignore already stopped
        }
      },
    });
  }

  private playBellVoice(
    ctx: AudioContext,
    freq: number,
    now: number,
    duration: number,
    noteKey: string
  ) {
    if (!this.masterGain) return;
    const osc = ctx.createOscillator();
    const sub = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.type = 'sine';
    osc.frequency.setValueAtTime(freq, now);

    sub.type = 'sine';
    sub.frequency.setValueAtTime(freq * 2.76, now); // Metallic chime ratio

    gain.gain.setValueAtTime(0.001, now);
    gain.gain.linearRampToValueAtTime(0.35, now + 0.004);
    gain.gain.exponentialRampToValueAtTime(0.0001, now + duration * 1.2);

    osc.connect(gain);
    sub.connect(gain);
    gain.connect(this.masterGain);

    osc.start(now);
    sub.start(now);
    const stopTime = now + duration * 1.2 + 0.05;
    osc.stop(stopTime);
    sub.stop(stopTime);

    this.activeVoices.set(noteKey, {
      stop: () => {
        try {
          osc.stop();
          sub.stop();
        } catch {}
      },
    });
  }

  private playReedVoice(
    ctx: AudioContext,
    freq: number,
    now: number,
    duration: number,
    noteKey: string
  ) {
    if (!this.masterGain) return;
    const osc = ctx.createOscillator();
    const filter = ctx.createBiquadFilter();
    const gain = ctx.createGain();

    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(freq, now);

    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(Math.min(2200, freq * 3), now);

    gain.gain.setValueAtTime(0.001, now);
    gain.gain.linearRampToValueAtTime(0.25, now + 0.02);
    gain.gain.exponentialRampToValueAtTime(0.0001, now + duration);

    osc.connect(filter);
    filter.connect(gain);
    gain.connect(this.masterGain);

    osc.start(now);
    osc.stop(now + duration + 0.05);

    this.activeVoices.set(noteKey, {
      stop: () => {
        try {
          osc.stop();
        } catch {}
      },
    });
  }

  /**
   * Arpeggiate multiple notes sequentially (e.g. for chords)
   */
  public playChord(notes: string[], arpeggiate: boolean = true): void {
    if (this.isMuted) return;
    notes.forEach((note, idx) => {
      const delay = arpeggiate ? idx * 0.12 : 0;
      setTimeout(() => {
        this.playNote(note, 1.8);
      }, delay * 1000);
    });
  }

  /**
   * UI Delight Sound Effects
   */
  public playCorrect(): void {
    if (this.isMuted || !this.sfxEnabled) return;
    const ctx = this.getContext();
    if (!ctx || !this.masterGain) return;

    const now = ctx.currentTime;
    // Pleasant ascending chime: G5 (784Hz) -> C6 (1046.5Hz)
    const osc1 = ctx.createOscillator();
    const osc2 = ctx.createOscillator();
    const gain = ctx.createGain();

    osc1.type = 'sine';
    osc1.frequency.setValueAtTime(783.99, now);
    osc1.frequency.setValueAtTime(1046.5, now + 0.09);

    osc2.type = 'triangle';
    osc2.frequency.setValueAtTime(1567.98, now); // overtone
    osc2.frequency.setValueAtTime(2093.0, now + 0.09);

    gain.gain.setValueAtTime(0.0001, now);
    gain.gain.linearRampToValueAtTime(0.28, now + 0.015);
    gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.45);

    osc1.connect(gain);
    osc2.connect(gain);
    gain.connect(this.masterGain);

    osc1.start(now);
    osc2.start(now);
    osc1.stop(now + 0.5);
    osc2.stop(now + 0.5);
  }

  public playIncorrect(): void {
    if (this.isMuted || !this.sfxEnabled) return;
    const ctx = this.getContext();
    if (!ctx || !this.masterGain) return;

    const now = ctx.currentTime;
    // Gentle warm low dual tone (no grating harsh buzzer)
    const osc1 = ctx.createOscillator();
    const osc2 = ctx.createOscillator();
    const filter = ctx.createBiquadFilter();
    const gain = ctx.createGain();

    osc1.type = 'triangle';
    osc1.frequency.setValueAtTime(185.0, now); // F#3
    osc1.frequency.linearRampToValueAtTime(164.81, now + 0.22); // E3

    osc2.type = 'sine';
    osc2.frequency.setValueAtTime(123.47, now); // B2

    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(450, now);

    gain.gain.setValueAtTime(0.001, now);
    gain.gain.linearRampToValueAtTime(0.24, now + 0.02);
    gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.35);

    osc1.connect(filter);
    osc2.connect(filter);
    filter.connect(gain);
    gain.connect(this.masterGain);

    osc1.start(now);
    osc2.start(now);
    osc1.stop(now + 0.38);
    osc2.stop(now + 0.38);
  }

  public playLessonComplete(): void {
    if (this.isMuted || !this.sfxEnabled) return;
    const notes = ['C5', 'E5', 'G5', 'C6'];
    notes.forEach((n, idx) => {
      setTimeout(() => {
        this.playNote(n, 1.8);
      }, idx * 140);
    });
  }

  public playCheckpointSuccess(): void {
    if (this.isMuted || !this.sfxEnabled) return;
    const chords = [
      { notes: ['F4', 'A4', 'C5'], delay: 0 },
      { notes: ['G4', 'B4', 'D5'], delay: 240 },
      { notes: ['C5', 'E5', 'G5', 'C6'], delay: 520 },
    ];
    chords.forEach(({ notes, delay }) => {
      setTimeout(() => {
        this.playChord(notes, false);
      }, delay);
    });
  }

  public playMetronomeClick(isAccent: boolean): void {
    if (this.isMuted || !this.sfxEnabled) return;
    const ctx = this.getContext();
    if (!ctx || !this.masterGain) return;

    const now = ctx.currentTime;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.type = isAccent ? 'sine' : 'triangle';
    osc.frequency.setValueAtTime(isAccent ? 1200 : 800, now);

    gain.gain.setValueAtTime(0.001, now);
    gain.gain.linearRampToValueAtTime(isAccent ? 0.35 : 0.2, now + 0.002);
    gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.04);

    osc.connect(gain);
    gain.connect(this.masterGain);

    osc.start(now);
    osc.stop(now + 0.045);
  }

  public playSoftTap(): void {
    if (this.isMuted || !this.sfxEnabled) return;
    const ctx = this.getContext();
    if (!ctx || !this.masterGain) return;

    const now = ctx.currentTime;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.type = 'sine';
    osc.frequency.setValueAtTime(320, now);

    gain.gain.setValueAtTime(0.001, now);
    gain.gain.linearRampToValueAtTime(0.08, now + 0.003);
    gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.03);

    osc.connect(gain);
    gain.connect(this.masterGain);

    osc.start(now);
    osc.stop(now + 0.035);
  }
}

export const sound = new SoundEngine();
