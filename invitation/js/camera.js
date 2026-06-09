import { state } from './state.js';
import { dom } from './dom.js';
import { initAudio } from './audio.js';
import { syncYawPitchFromCamera, applyFirstPersonRotation } from './controls.js';
import { showMobileControls } from './mobile-controls.js';

export function enableFirstPersonView(position) {
    state.firstPersonActive = true;
    state.controls.enabled = false;

    if (position) {
        state.camera.position.copy(position);
    }

    state.camera.position.y = state.eyeLevelY;
    applyFirstPersonRotation();

    // Show mobile D-pad on touch devices
    showMobileControls();
}

export function enterTheKeep() {
    initAudio();

    dom.splashScreen.classList.add('fade-out');
    dom.uiOverlay.classList.add('visible');

    const maxDim = Math.max(state.sceneSize.x, state.sceneSize.y, state.sceneSize.z);

    state.camStartPos.set(
        state.sceneCenter.x,
        state.sceneCenter.y + state.sceneSize.y * 0.6,
        state.sceneCenter.z + maxDim * 0.9
    );
    state.camEndPos.set(
        state.sceneCenter.x,
        state.sceneCenter.y - state.sceneSize.y * 0.30,
        state.sceneCenter.z + state.sceneSize.z * 0.35
    );

    state.targetStartPos.copy(state.sceneCenter);
    state.targetEndPos.set(state.sceneCenter.x, state.fireLightPos.y, state.sceneCenter.z - state.sceneSize.z * 0.1);

    state.camera.position.copy(state.camStartPos);
    state.controls.target.copy(state.targetStartPos);
    state.controls.update();

    state.introStartTime = performance.now();
    state.introAnimationActive = true;
}

export function animateFocusToPoint(targetPoint, objectName) {
    state.focusStartPos.copy(state.camera.position);
    state.focusStartTarget.copy(state.controls.target);
    state.focusEndTarget.copy(targetPoint);

    const dir = new THREE.Vector3().subVectors(state.camera.position, targetPoint).normalize();

    const maxDim = Math.max(state.sceneSize.x, state.sceneSize.y, state.sceneSize.z);
    let dist = maxDim * 0.35;

    if (objectName.includes('Bowl')) {
        dist = maxDim * 0.18;
    } else if (objectName.includes('1.fbx') || objectName === '1') {
        dist = maxDim * 0.25;
    }

    state.focusEndPos.copy(targetPoint).addScaledVector(dir, dist);
    state.focusEndPos.y = state.eyeLevelY;

    state.focusStartTime = performance.now();
    state.focusAnimationActive = true;
    state.introAnimationActive = false;
    state.firstPersonActive = false;
}

export function updateIntroAnimation() {
    if (!state.introAnimationActive) return;

    const now = performance.now();
    const elapsed = (now - state.introStartTime) / state.introDuration;

    if (elapsed >= 1) {
        state.introAnimationActive = false;
        syncYawPitchFromCamera();
        enableFirstPersonView(state.camEndPos);
    } else {
        const t = 1 - Math.pow(1 - elapsed, 3);
        state.camera.position.lerpVectors(state.camStartPos, state.camEndPos, t);
        state.controls.target.lerpVectors(state.targetStartPos, state.targetEndPos, t);
        state.camera.lookAt(state.controls.target);
    }
}

export function updateFocusAnimation() {
    if (!state.focusAnimationActive) return;

    const now = performance.now();
    const elapsed = (now - state.focusStartTime) / state.focusDuration;

    if (elapsed >= 1) {
        state.focusAnimationActive = false;
        syncYawPitchFromCamera();
        enableFirstPersonView(state.focusEndPos);
    } else {
        const t = 1 - Math.pow(1 - elapsed, 5);
        state.camera.position.lerpVectors(state.focusStartPos, state.focusEndPos, t);
        state.controls.target.lerpVectors(state.focusStartTarget, state.focusEndTarget, t);
        state.camera.lookAt(state.controls.target);
    }
}