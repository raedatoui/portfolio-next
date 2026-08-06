import { Chorus, Distortion, Filter, Frequency, getContext, PingPongDelay, PolySynth, Synth, Vibrato } from 'tone';
import { getAudioBus } from '@/lib/audio';

type VoiceEffect = Chorus | Vibrato | Distortion | PingPongDelay;

const EFFECT_KINDS = ['none', 'chorus', 'vibrato', 'distortion', 'pingpong'] as const;
type EffectKind = (typeof EFFECT_KINDS)[number];

export interface NervousPoint {
    /** Index into the mode's degrees, 0..MAX_DEGREE. Not a MIDI note. */
    degree: number;
    pixelation: number;
    /** 0..1 — how far the walk jumped to get here. Drives velocity and the rest gate. */
    accent: number;
}

type RandFunc = () => number;

/** Dorian degrees. Every voice draws from this one collection so overlapping tails stay consonant. */
const MODE = [0, 2, 3, 5, 7, 9, 10];
const ROOT_MIDI = 38; // D2
const OCTAVE_SPAN = 3;
const MAX_DEGREE = OCTAVE_SPAN * MODE.length;

interface VoicePreset {
    partials: number[];
    envelope: { attack: number; decay: number; sustain: number; release: number };
    filterType: 'lowpass' | 'bandpass';
    Q: number;
    volume: number;
}

/**
 * Harmonic recipes. `partials` is the amplitude of each harmonic, so every note
 * is this many sine waves summed — additive synthesis, not a single oscillator.
 *
 * A recipe is drawn from this table at the top of every lap, so the tone keeps
 * moving while the sequence repeats.
 */
const VOICES: VoicePreset[] = [
    // The original: fundamental muted, hollow and metallic.
    {
        partials: [0, 2, 3, 4],
        envelope: { attack: 0.005, decay: 0.1, sustain: 0.3, release: 1 },
        filterType: 'lowpass',
        Q: 1,
        volume: -9,
    },
    // Warm and saw-like, plucked.
    {
        partials: [1, 0.5, 0.25, 0.12, 0.06],
        envelope: { attack: 0.004, decay: 0.25, sustain: 0.1, release: 0.9 },
        filterType: 'lowpass',
        Q: 2,
        volume: -11,
    },
    // Odd harmonics only — hollow, clarinet-ish.
    {
        partials: [1, 0, 0.4, 0, 0.2, 0, 0.1],
        envelope: { attack: 0.03, decay: 0.2, sustain: 0.4, release: 1.4 },
        filterType: 'lowpass',
        Q: 1,
        volume: -10,
    },
    // Bell-like: uneven partials, fast decay, long tail.
    {
        partials: [1, 0.3, 0.7, 0.1, 0.4],
        envelope: { attack: 0.002, decay: 0.6, sustain: 0.05, release: 1.8 },
        filterType: 'bandpass',
        Q: 0.7,
        volume: -8,
    },
    // Reedy: second harmonic dominant, short and biting.
    {
        partials: [0.6, 1, 0.2, 0.05],
        envelope: { attack: 0.008, decay: 0.15, sustain: 0.2, release: 0.7 },
        filterType: 'lowpass',
        Q: 3,
        volume: -13,
    },
];

class Nervous {
    notes: NervousPoint[];
    synth: PolySynth | null;
    filter: Filter | null;
    effect: VoiceEffect | null;
    /** Which degree of MODE this voice centers on — its tonal center within the shared collection. */
    rootDegree: number;
    /** How many notes a chord stacks here. Steps up every third tile. */
    chordTones: number;
    drift: number;

    constructor(voiceIndex: number) {
        this.synth = null;
        this.filter = null;
        this.effect = null;
        // Each tile sits one scale degree above its neighbour, climbing two octaves
        // before wrapping — so tiles next to each other are next to each other sonically.
        this.rootDegree = voiceIndex % (MODE.length * 2);
        // Density moves in threes, so neighbours mostly match and the grid thickens gradually.
        this.chordTones = 1 + Math.floor((voiceIndex % 9) / 3);
        // A few cents either way keeps each card individual without pulling it out of tune.
        this.drift = ((voiceIndex % 5) - 2) * 5;
        this.notes = this.randomWalk();
    }

    boxMullerRandom(): RandFunc {
        let phase = 0;
        let RAND_MAX: number;
        let array: Uint32Array;
        let random: RandFunc;
        let x1 = 0;
        let x2 = 0;
        let w = 0;
        let z = 0;

        if (window.crypto && typeof window.crypto.getRandomValues === 'function') {
            RAND_MAX = 2 ** 32 - 1;
            array = new Uint32Array(1);
            random = () => {
                window.crypto.getRandomValues(array);
                return array[0] / RAND_MAX;
            };
        } else {
            random = Math.random;
        }

        return () => {
            if (!phase) {
                do {
                    const rx1: number = random();
                    const rx2: number = random();
                    x1 = 2.0 * rx1 - 1.0;
                    x2 = 2.0 * rx2 - 1.0;
                    w = x1 * x1 + x2 * x2;
                } while (w >= 1.0);

                w = Math.sqrt((-2.0 * Math.log(w)) / w);
                z = x1 * w;
            } else {
                z = x2 * w;
            }

            phase ^= 1;
            return z;
        };
    }

    mapRange(v: number, inMin: number, inMax: number, outMin: number, outMax: number): number {
        return Math.floor(((v - inMin) * (outMax - outMin)) / (inMax - inMin) + outMin);
    }

    randomWalk(steps?: number, randFunc?: RandFunc): NervousPoint[] {
        const numSteps = steps ? steps >>> 0 : 75;

        const actualRandFunc = typeof randFunc === 'function' ? randFunc : this.boxMullerRandom();

        const points: number[] = [];
        let value = 0;

        for (let t = 0; t < numSteps; t += 1) {
            value += actualRandFunc();
            points.push(value);
            if (t > 1) points.push(points[t - 2]);
        }

        const max = Math.max(...points);
        const min = Math.min(...points);

        let maxDelta = 0;
        for (let i = 1; i < points.length; i += 1) {
            maxDelta = Math.max(maxDelta, Math.abs(points[i] - points[i - 1]));
        }

        return points.map((p, i) => ({
            degree: this.mapRange(p, min, max, 0, MAX_DEGREE),
            pixelation: this.mapRange(p, min, max, 5, 35),
            accent: maxDelta > 0 ? Math.min(1, Math.abs(p - points[i > 0 ? i - 1 : 0]) / maxDelta) : 0,
        }));
    }

    degreeToMidi(degree: number): number {
        const d = degree + this.rootDegree;
        const octave = Math.floor(d / MODE.length);
        const step = ((d % MODE.length) + MODE.length) % MODE.length;
        return ROOT_MIDI + octave * 12 + MODE[step];
    }

    createEffect(kind: EffectKind): VoiceEffect | null {
        switch (kind) {
            case 'chorus':
                return new Chorus({ frequency: 1.2, delayTime: 3, depth: 0.6, wet: 0.5 }).start();
            case 'vibrato':
                return new Vibrato({ frequency: 4.5, depth: 0.12 });
            case 'distortion':
                return new Distortion({ distortion: 0.25, wet: 0.35 });
            case 'pingpong':
                return new PingPongDelay({ delayTime: '16n', feedback: 0.35, wet: 0.4 });
            default:
                return null;
        }
    }

    /**
     * Swaps in a randomly chosen effect. Called on hover start rather than mid-lap,
     * because replacing the node means tearing the old one down and anything still
     * ringing through it would be cut off.
     */
    rollEffect(): void {
        if (!this.filter) return;

        this.filter.disconnect();
        this.effect?.dispose();
        this.effect = this.createEffect(EFFECT_KINDS[Math.floor(Math.random() * EFFECT_KINDS.length)]);
        this.filter.connect(this.effect ?? getAudioBus());
        this.effect?.connect(getAudioBus());
    }

    /** A random recipe from the table, with each harmonic's amplitude nudged so no two rolls match. */
    pickTone(): VoicePreset {
        const tone = VOICES[Math.floor(Math.random() * VOICES.length)];
        return {
            ...tone,
            partials: tone.partials.map((p) => (p === 0 ? 0 : p * (0.75 + Math.random() * 0.5))),
        };
    }

    /**
     * Re-rolls the harmonics, envelope and filter. Called at the top of every lap,
     * so the tone keeps moving while the sequence repeats. Uses `set` rather than
     * rebuilding the chain, so notes still ringing from the last lap aren't cut off.
     */
    reshape(): void {
        if (!this.synth || !this.filter) return;
        const tone = this.pickTone();
        this.synth.set({
            oscillator: { partials: tone.partials },
            envelope: tone.envelope,
            volume: tone.volume,
        });
        this.filter.set({ type: tone.filterType, Q: tone.Q });
    }

    /** Built on first hover so idle cards hold no audio nodes. */
    ensureVoice(): void {
        if (this.synth) return;

        const tone = this.pickTone();

        this.filter = new Filter({ type: tone.filterType, frequency: 1400, Q: tone.Q });
        this.rollEffect();

        this.synth = new PolySynth(Synth, {
            oscillator: {
                partials: tone.partials,
            },
            envelope: tone.envelope,
            volume: tone.volume,
            detune: this.drift,
        }).connect(this.filter);
        // Envelope releases outlast the gap between steps at high rates. Cap the
        // stack so the top of the slider steals voices instead of drowning in them.
        this.synth.maxPolyphony = 24;
    }

    /**
     * `intensity` (0..1) is how long the hover has been held. It opens the rest
     * gate, the register ceiling, the filter and the chance of a chord, so the
     * phrase builds instead of arriving all at once.
     *
     * `stepSeconds` is the gap until the next step, from the FPS slider. Note
     * length tracks it so the slider changes the articulation, not just the count.
     *
     * Returns whether a note actually sounded, so the caller can hold the image
     * still on a rest rather than pixelating against silence.
     */
    play(point: NervousPoint, intensity: number, stepSeconds: number): boolean {
        try {
            const ctx = getContext();
            if (ctx.state !== 'running') {
                ctx.resume();
            }

            this.ensureVoice();
            if (!this.synth || !this.filter) return false;

            // Rests thin out as the hover holds. Open enough at the start that the first step sounds.
            if (point.accent < 0.3 - intensity * 0.25) return false;

            this.filter.frequency.rampTo(1400 + intensity * 4600, 0.15);

            // Starts pinned to the bottom of the range, climbs to the full span.
            const ceiling = Math.round(MAX_DEGREE * (0.45 + intensity * 0.55));
            const degree = Math.min(point.degree, ceiling);

            // Thirds stacked in degrees, so the chord is diatonic by construction. How
            // many tones stack is fixed per tile; intensity decides whether it fires.
            const span = (this.chordTones - 1) * 2;
            const root = degree + span > MAX_DEGREE ? MAX_DEGREE - span : degree;
            const stacked = Math.random() < intensity * 0.5 && this.chordTones > 1;
            const degrees = stacked ? Array.from({ length: this.chordTones }, (_, i) => root + i * 2) : [degree];
            const notes = degrees.map((d) => Frequency(this.degreeToMidi(d), 'midi').toNote());

            const velocity = 0.25 + point.accent * 0.35 + intensity * 0.2;
            // Slow settings sustain, fast ones pluck. Clamped so neither end runs away.
            const duration = Math.min(1.2, Math.max(0.04, stepSeconds * (1.8 - intensity)));

            this.synth.triggerAttackRelease(notes, duration, undefined, velocity);
            return true;
        } catch (_e) {
            // Ignore audio context errors
            return false;
        }
    }

    stop(): void {
        this.synth?.releaseAll();
    }

    dispose(): void {
        this.synth?.dispose();
        this.filter?.dispose();
        this.effect?.dispose();
        this.synth = null;
        this.filter = null;
        this.effect = null;
    }
}

export default Nervous;
