import { state } from './state.js';
import { updateFireEmbers, updateDustParticles } from './particles.js';
import { updateIntroAnimation, updateFocusAnimation } from './camera.js';
import { updateFirstPersonMovement } from './controls.js';

function updateFireLights() {
    if (state.fireLights.length === 0) return;

    const time = performance.now() * 0.005;

    state.fireLights.forEach((light, i) => {
        const localTime = time + i * 12.3;
        const localNoise = Math.sin(localTime * 3.3) * Math.cos(localTime * 1.5) * 0.18 + (Math.random() - 0.5) * 0.05;

        light.intensity = 1.8 + localNoise * 0.8;
        light.distance = 18 + localNoise * 3;

        const core = state.fireCoreMeshes[i];
        if (core) {
            const s = 1.0 + localNoise * 0.12;
            core.scale.set(s, s, s);
        }
    });
}

export function startRenderLoop() {
    function renderLoop() {
        requestAnimationFrame(renderLoop);

        const delta = Math.min(state.clock.getDelta(), 0.1);

        updateFireEmbers(delta);
        updateDustParticles(delta);
        updateFireLights();

        updateIntroAnimation();
        updateFocusAnimation();

        if (!state.introAnimationActive && !state.focusAnimationActive) {
            updateFirstPersonMovement(delta);
        }

        if (state.controls.enabled) {
            state.controls.update();
        }
        state.renderer.render(state.scene, state.camera);
    }

    requestAnimationFrame(renderLoop);
}
