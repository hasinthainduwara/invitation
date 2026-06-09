import { state } from './state.js';

/* Touch movement via a drag gesture instead of an on-screen D-pad.
   Touch down anywhere on the hall and drag: up walks forward, down walks
   backward, left/right strafe. A small virtual joystick appears under the
   finger for feedback. The further you drag (up to MAX_RADIUS) the faster you
   move, so it reads like an analog stick. A quick tap stays free for the
   raycast interaction handled in interaction.js. */

const DEAD_ZONE = 14;   // px of slack so a tap doesn't nudge you
const MAX_RADIUS = 72;  // px drag for full speed

let mobileControlsEl = null;
let joystickEl = null;
let knobEl = null;
let isTouchDevice = false;

let moveTouchId = null; // identifier of the finger currently driving movement
let originX = 0;
let originY = 0;

export function detectTouch() {
    isTouchDevice = ('ontouchstart' in window) ||
        (navigator.maxTouchPoints > 0) ||
        (window.matchMedia('(hover: none) and (pointer: coarse)').matches);
    return isTouchDevice;
}

function clearMoveInput() {
    state.touchMoveForward = 0;
    state.touchMoveRight = 0;
}

function showJoystick(x, y) {
    if (!joystickEl) return;
    joystickEl.style.left = `${x}px`;
    joystickEl.style.top = `${y}px`;
    joystickEl.classList.remove('hidden');
    if (knobEl) knobEl.style.transform = 'translate(-50%, -50%)';
}

function hideJoystick() {
    if (joystickEl) joystickEl.classList.add('hidden');
}

function handleTouchStart(e) {
    // Only drive movement while exploring on foot; let intro/orbit gestures be.
    if (!state.firstPersonActive || moveTouchId !== null) return;

    const touch = e.changedTouches[0];
    moveTouchId = touch.identifier;
    originX = touch.clientX;
    originY = touch.clientY;
    clearMoveInput();
    showJoystick(originX, originY);
}

function handleTouchMove(e) {
    if (moveTouchId === null) return;
    e.preventDefault(); // suppress page scroll / pull-to-refresh while walking

    for (const touch of e.changedTouches) {
        if (touch.identifier !== moveTouchId) continue;

        let dx = touch.clientX - originX;
        let dy = touch.clientY - originY;
        const dist = Math.hypot(dx, dy);

        if (dist < DEAD_ZONE) {
            clearMoveInput();
            if (knobEl) knobEl.style.transform = 'translate(-50%, -50%)';
            return;
        }

        // Clamp the knob to the ring and scale speed by how far it's pushed.
        const clamped = Math.min(dist, MAX_RADIUS);
        const nx = dx / dist;
        const ny = dy / dist;
        const magnitude = (clamped - DEAD_ZONE) / (MAX_RADIUS - DEAD_ZONE);

        // Screen-up (negative Y) walks forward; screen-right strafes right.
        state.touchMoveForward = -ny * magnitude;
        state.touchMoveRight = nx * magnitude;

        if (knobEl) {
            knobEl.style.transform =
                `translate(calc(-50% + ${nx * clamped}px), calc(-50% + ${ny * clamped}px))`;
        }
        return;
    }
}

function handleTouchEnd(e) {
    for (const touch of e.changedTouches) {
        if (touch.identifier === moveTouchId) {
            moveTouchId = null;
            clearMoveInput();
            hideJoystick();
            return;
        }
    }
}

export function showMobileControls() {
    if (mobileControlsEl) mobileControlsEl.classList.remove('hidden');
}

export function hideMobileControls() {
    if (mobileControlsEl) mobileControlsEl.classList.add('hidden');
    moveTouchId = null;
    clearMoveInput();
    hideJoystick();
}

export function initMobileControls() {
    if (!detectTouch()) return;

    mobileControlsEl = document.getElementById('mobile-controls');
    joystickEl = document.getElementById('touch-joystick');
    knobEl = joystickEl ? joystickEl.querySelector('.touch-knob') : null;

    // Drive movement from raw touches on the WebGL canvas. Tap detection in
    // interaction.js coexists (it ignores anything that moved > 20px).
    const canvasEl = state.renderer.domElement;
    canvasEl.addEventListener('touchstart', handleTouchStart, { passive: true });
    canvasEl.addEventListener('touchmove', handleTouchMove, { passive: false });
    canvasEl.addEventListener('touchend', handleTouchEnd, { passive: true });
    canvasEl.addEventListener('touchcancel', handleTouchEnd, { passive: true });
}
