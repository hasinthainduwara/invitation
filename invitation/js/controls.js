import { state } from './state.js';

const LOOK_SENSITIVITY = 0.0025;

export function syncYawPitchFromCamera() {
    const dir = new THREE.Vector3(0, 0, -1).applyQuaternion(state.camera.quaternion);
    state.cameraYaw = Math.atan2(dir.x, -dir.z);
    state.cameraPitch = Math.asin(Math.max(-0.999, Math.min(0.999, dir.y)));
}

export function applyFirstPersonRotation() {
    state.camera.rotation.order = 'YXZ';
    state.camera.rotation.y = state.cameraYaw;
    state.camera.rotation.x = state.cameraPitch;
    state.camera.rotation.z = 0;
}

function clampPitch() {
    state.cameraPitch = Math.max(-Math.PI / 2 + 0.08, Math.min(Math.PI / 2 - 0.08, state.cameraPitch));
}

function handleLookDelta(dx, dy) {
    state.cameraYaw -= dx * LOOK_SENSITIVITY;
    state.cameraPitch -= dy * LOOK_SENSITIVITY;
    clampPitch();
}

export function initControls() {
    window.addEventListener('keydown', (e) => {
        if (document.activeElement && (
            document.activeElement.tagName === 'INPUT' ||
            document.activeElement.tagName === 'TEXTAREA' ||
            document.activeElement.tagName === 'SELECT'
        )) {
            return;
        }
        const key = e.key.toLowerCase();
        if (['w', 'a', 's', 'd', 'arrowup', 'arrowdown', 'arrowleft', 'arrowright'].includes(key)) {
            state.keysPressed[key] = true;
        }
    });

    window.addEventListener('keyup', (e) => {
        const key = e.key.toLowerCase();
        state.keysPressed[key] = false;
    });

    window.addEventListener('blur', () => {
        for (let key in state.keysPressed) {
            state.keysPressed[key] = false;
        }
    });
}

export function updateFirstPersonMovement(delta) {
    if (!state.firstPersonActive) return;

    const forward = new THREE.Vector3(
        Math.sin(state.cameraYaw),
        0,
        -Math.cos(state.cameraYaw)
    ).normalize();

    const right = new THREE.Vector3(
        Math.cos(state.cameraYaw),
        0,
        Math.sin(state.cameraYaw)
    ).normalize();

    const moveDir = new THREE.Vector3(0, 0, 0);

    if (state.keysPressed['w'] || state.keysPressed['arrowup']) moveDir.add(forward);
    if (state.keysPressed['s'] || state.keysPressed['arrowdown']) moveDir.sub(forward);
    if (state.keysPressed['d'] || state.keysPressed['arrowright']) moveDir.add(right);
    if (state.keysPressed['a'] || state.keysPressed['arrowleft']) moveDir.sub(right);

    if (moveDir.lengthSq() > 0) {
        moveDir.normalize();

        const moveSpeed = 12.0;
        state.camera.position.addScaledVector(moveDir, moveSpeed * delta);

        const clampX = state.sceneSize.x * 0.45;
        const clampZ = state.sceneSize.z * 0.45;
        state.camera.position.x = Math.max(state.sceneCenter.x - clampX, Math.min(state.sceneCenter.x + clampX, state.camera.position.x));
        state.camera.position.z = Math.max(state.sceneCenter.z - clampZ, Math.min(state.sceneCenter.z + clampZ, state.camera.position.z));
    }

    // Keep camera locked at eye height in first-person mode
    state.camera.position.y = state.eyeLevelY;

    const hearthCenter = new THREE.Vector3(state.sceneCenter.x, state.camera.position.y, state.sceneCenter.z);
    const distToHearth = state.camera.position.distanceTo(hearthCenter);
    if (distToHearth < 2.0) {
        const pushDir = new THREE.Vector3().subVectors(state.camera.position, hearthCenter);
        pushDir.y = 0;
        pushDir.normalize();
        state.camera.position.x = hearthCenter.x + pushDir.x * 2.0;
        state.camera.position.z = hearthCenter.z + pushDir.z * 2.0;
    }

    applyFirstPersonRotation();
}
