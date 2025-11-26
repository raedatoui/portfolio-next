import { Frequency, getContext, PolySynth, Synth } from 'tone';

export interface NervousPoint {
    midi: string;
    pixelation: number;
    pitch: number;
}

type RandFunc = () => number;

class Nervous {
    notes: NervousPoint[];
    currentNote: string;
    synth: PolySynth;
    midiMax: number;
    midiMin: number;

    constructor(detune: number) {
        this.synth = new PolySynth(Synth, {
            oscillator: {
                partials: [0, 2, 3, 4],
            },
            volume: -6,
            detune: -100 * detune,
        }).toDestination();

        this.currentNote = '';
        this.midiMax = 100;
        this.midiMin = 25;
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
        const midiDelta: number = this.midiMax - this.midiMin;
        const numSteps = steps ? steps >>> 0 : midiDelta;

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

        return points.map((p) => ({
            midi: Frequency(this.mapRange(p, min, max, this.midiMin, this.midiMax), 'midi').toNote(),
            pixelation: this.mapRange(p, min, max, 5, 35),
            pitch: this.mapRange(p, min, max, -48, 48),
        }));
    }

    play(note: string): void {
        try {
            const ctx = getContext();
            if (ctx.state !== 'running') {
                ctx.resume();
            }
            this.synth.triggerAttackRelease(note, 0.5, undefined, 0.5);
        } catch (_e) {
            // Ignore audio context errors
        }
    }

    stop(): void {
        this.synth.releaseAll();
    }
}

export default Nervous;
