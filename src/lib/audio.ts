import { FeedbackDelay, Gain, Reverb } from 'tone';

let bus: Gain | null = null;

/**
 * Shared effects bus for the hover voices. Every card connects here instead of
 * running its own reverb, so tails from consecutive hovers overlap and blend.
 *
 * Built lazily on first hover: constructing it at module scope would spin up an
 * AudioContext on import, before any user gesture.
 */
export function getAudioBus(): Gain {
    if (!bus) {
        const reverb = new Reverb({ decay: 3.5, wet: 0.28 }).toDestination();
        const delay = new FeedbackDelay({ delayTime: '8n.', feedback: 0.32, wet: 0.22 }).connect(reverb);
        bus = new Gain(0.8).connect(delay);
    }
    return bus;
}
