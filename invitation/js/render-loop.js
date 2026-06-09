import { state } from './state.js';
import { updateFireEmbers, updateDustParticles } from './particles.js';
import { updateMoonRays } from './moonrays.js';
import { updateMagicParticles } from './magic.js';
import { updateIntroAnimation, updateFocusAnimation } from './camera.js';
import { updateFirstPersonMovement } from './controls.js';

function updateFocusScroll(delta) {
    const scroll = state.loadedFBX['r1.fbx'];
    if (!scroll) return;

    // Slow turntable spin to draw the eye
    scroll.rotation.y += 0.5 * delta;

    // Gentle magical float
    if (scroll.userData.baseLocalY !== undefined) {
        const t = performance.now() * 0.0015;
        scroll.position.y = scroll.userData.baseLocalY + Math.sin(t) * scroll.userData.bobAmp;
    }
}

const FIRE_DEEP = new THREE.Color(0xff3d00);   // low ebb: deep red-orange
const FIRE_HOT = new THREE.Color(0xffb347);    // flare up: bright amber

function updateFireLights() {
    if (state.fireLights.length === 0) return;

    const time = performance.now() * 0.005;

    state.fireLights.forEach((light, i) => {
        const localTime = time + i * 12.3;
        // Layered flicker: slow sway + fast crackle + a touch of randomness
        const slow = Math.sin(localTime * 3.3) * Math.cos(localTime * 1.5);
        const fast = Math.sin(localTime * 11.0) * 0.4;
        const localNoise = slow * 0.18 + fast * 0.06 + (Math.random() - 0.5) * 0.05;

        light.intensity = 2.0 + localNoise * 1.1;
        light.distance = 11 + localNoise * 2.5;

        // Hotter when it flares, deeper red when it ebbs
        const heat = THREE.MathUtils.clamp(0.5 + localNoise * 2.2, 0, 1);
        light.color.copy(FIRE_DEEP).lerp(FIRE_HOT, heat);

        const core = state.fireCoreMeshes[i];
        if (core) {
            const s = 1.0 + localNoise * 0.18;
            // squash/stretch like a licking flame + tiny vertical bob
            core.scale.set(s, s * (1.0 + Math.abs(fast) * 0.25), s);
            core.position.y = core.userData.baseY + localNoise * 0.04;
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
        updateMoonRays();
        updateMagicParticles(delta);
        updateFocusScroll(delta);

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
