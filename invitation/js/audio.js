import { state } from './state.js';
import { dom } from './dom.js';

export function initAudio() {
    if (state.audioCtx) return;

    try {
        const AudioContext = window.AudioContext || window.webkitAudioContext;
        state.audioCtx = new AudioContext();

        const bufferSize = 2 * state.audioCtx.sampleRate;

        // --- Wind Synthesis (Pink noise through LFO-modulated lowpass filter) ---
        const noiseBuffer = state.audioCtx.createBuffer(1, bufferSize, state.audioCtx.sampleRate);
        const output = noiseBuffer.getChannelData(0);

        let b0, b1, b2, b3, b4, b5, b6;
        b0 = b1 = b2 = b3 = b4 = b5 = b6 = 0.0;
        for (let i = 0; i < bufferSize; i++) {
            const white = Math.random() * 2 - 1;
            b0 = 0.99886 * b0 + white * 0.0555179;
            b1 = 0.99332 * b1 + white * 0.0750759;
            b2 = 0.96900 * b2 + white * 0.1538520;
            b3 = 0.86650 * b3 + white * 0.3104856;
            b4 = 0.55000 * b4 + white * 0.5329522;
            b5 = -0.7616 * b5 - white * 0.0168980;
            output[i] = b0 + b1 + b2 + b3 + b4 + b5 + b6 + white * 0.5362;
            output[i] *= 0.08;
            b6 = white * 0.115926;
        }

        const windSource = state.audioCtx.createBufferSource();
        windSource.buffer = noiseBuffer;
        windSource.loop = true;

        const windFilter = state.audioCtx.createBiquadFilter();
        windFilter.type = 'lowpass';
        windFilter.Q.value = 1.2;

        const lfo = state.audioCtx.createOscillator();
        lfo.frequency.value = 0.12;

        const lfoGain = state.audioCtx.createGain();
        lfoGain.gain.value = 180;

        lfo.connect(lfoGain);
        lfoGain.connect(windFilter.frequency);

        windFilter.frequency.value = 350;

        const windGain = state.audioCtx.createGain();
        windGain.gain.value = 0.1;

        windSource.connect(windFilter);
        windFilter.connect(windGain);
        windGain.connect(state.audioCtx.destination);

        lfo.start();
        windSource.start();

        // --- Fire Hiss/Rumble (Filtered white noise) ---
        const hissBuffer = state.audioCtx.createBuffer(1, bufferSize, state.audioCtx.sampleRate);
        const hissData = hissBuffer.getChannelData(0);
        for (let i = 0; i < bufferSize; i++) {
            hissData[i] = (Math.random() * 2 - 1) * 0.03;
        }

        const fireHissSource = state.audioCtx.createBufferSource();
        fireHissSource.buffer = hissBuffer;
        fireHissSource.loop = true;

        const fireHissFilter = state.audioCtx.createBiquadFilter();
        fireHissFilter.type = 'bandpass';
        fireHissFilter.frequency.value = 600;
        fireHissFilter.Q.value = 0.4;

        const fireHissGain = state.audioCtx.createGain();
        fireHissGain.gain.value = 0.08;

        fireHissSource.connect(fireHissFilter);
        fireHissFilter.connect(fireHissGain);
        fireHissGain.connect(state.audioCtx.destination);

        fireHissSource.start();

        // --- Fire Ember Crackles (Random clicks) ---
        const clickNode = state.audioCtx.createScriptProcessor(4096, 0, 1);
        clickNode.onaudioprocess = function(e) {
            const out = e.outputBuffer.getChannelData(0);
            for (let i = 0; i < out.length; i++) {
                out[i] = 0;
                if (Math.random() < 0.00065) {
                    let amplitude = 0.15 + Math.random() * 0.55;
                    let decay = 0.982;
                    for (let j = 0; j < 350 && (i + j) < out.length; j++) {
                        out[i + j] += (Math.random() * 2 - 1) * amplitude;
                        amplitude *= decay;
                    }
                }
            }
        };

        const fireClickGain = state.audioCtx.createGain();
        fireClickGain.gain.value = 0.22;

        clickNode.connect(fireClickGain);
        fireClickGain.connect(state.audioCtx.destination);

        state.windNode = windGain;
        state.fireNode = fireHissGain;
        state.fireNodeClick = fireClickGain;

        state.isAudioPlaying = true;
        updateAudioButton();
    } catch (e) {
        console.warn("Web Audio API could not initialize:", e);
    }
}

export function toggleAudio() {
    if (!state.audioCtx) {
        initAudio();
        return;
    }

    if (state.audioCtx.state === 'suspended') {
        state.audioCtx.resume();
        state.isAudioPlaying = true;
    } else if (state.audioCtx.state === 'running') {
        state.audioCtx.suspend();
        state.isAudioPlaying = false;
    }
    updateAudioButton();
}

function updateAudioButton() {
    const label = dom.audioToggle.querySelector('.label');
    const icon = dom.audioToggle.querySelector('.icon');
    if (state.isAudioPlaying) {
        label.textContent = "Mute Ambient";
        icon.textContent = "🔊";
    } else {
        label.textContent = "Play Ambient";
        icon.textContent = "🔇";
    }
}

export function initAudioUI() {
    dom.audioToggle.addEventListener('click', toggleAudio);
}
