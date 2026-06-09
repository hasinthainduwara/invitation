import { state } from './state.js';
import { dom } from './dom.js';

export function initAudio() {
    if (state.audioCtx) return;

    try {
        const AudioContext = window.AudioContext || window.webkitAudioContext;
        state.audioCtx = new AudioContext();

        // Create HTML5 audio element playing the custom MP3 file
        const audioElement = new Audio('assets/objects/sound.mp3');
        audioElement.loop = true;
        audioElement.crossOrigin = "anonymous";

        // Route it through the Web Audio context so it obeys AudioContext lifecycle
        const source = state.audioCtx.createMediaElementSource(audioElement);
        const gainNode = state.audioCtx.createGain();
        gainNode.gain.value = 0.5; // adjust volume to be comfortable

        source.connect(gainNode);
        gainNode.connect(state.audioCtx.destination);

        state.audioElement = audioElement;
        state.audioGainNode = gainNode;

        // Play the track
        audioElement.play().catch(err => {
            console.warn("Audio play blocked or failed:", err);
        });

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
        if (state.audioElement) {
            state.audioElement.play().catch(err => console.warn(err));
        }
        state.isAudioPlaying = true;
    } else {
        // If context is running, pause audio and suspend context
        if (state.audioElement) {
            state.audioElement.pause();
        }
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
