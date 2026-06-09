import { state } from './state.js';

const dirToKey = {
    up: 'arrowup',
    down: 'arrowdown',
    left: 'arrowleft',
    right: 'arrowright'
};

let mobileControlsEl = null;
let lookHintEl = null;
let isTouchDevice = false;
const activeTouches = new Map(); // touchId -> dir

export function detectTouch() {
    isTouchDevice = ('ontouchstart' in window) ||
        (navigator.maxTouchPoints > 0) ||
        (window.matchMedia('(hover: none) and (pointer: coarse)').matches);
    return isTouchDevice;
}

function pressDir(dir) {
    const key = dirToKey[dir];
    if (key) state.keysPressed[key] = true;
}

function releaseDir(dir) {
    const key = dirToKey[dir];
    if (key) state.keysPressed[key] = false;
}

function getDirFromElement(el) {
    if (!el) return null;
    const btn = el.closest('.dpad-btn');
    if (!btn) return null;
    return btn.dataset.dir || null;
}

function updateButtonVisuals() {
    const activeDirs = new Set(activeTouches.values());
    const buttons = document.querySelectorAll('.dpad-btn');
    buttons.forEach(btn => {
        const dir = btn.dataset.dir;
        if (activeDirs.has(dir)) {
            btn.classList.add('pressed');
        } else {
            btn.classList.remove('pressed');
        }
    });
}

function handleTouchStart(e) {
    e.preventDefault();
    for (const touch of e.changedTouches) {
        const dir = getDirFromElement(document.elementFromPoint(touch.clientX, touch.clientY));
        if (dir) {
            activeTouches.set(touch.identifier, dir);
            pressDir(dir);
        }
    }
    updateButtonVisuals();
}

function handleTouchMove(e) {
    e.preventDefault();
    for (const touch of e.changedTouches) {
        const dir = getDirFromElement(document.elementFromPoint(touch.clientX, touch.clientY));
        const prevDir = activeTouches.get(touch.identifier);

        if (prevDir && prevDir !== dir) {
            releaseDir(prevDir);
        }
        if (dir) {
            activeTouches.set(touch.identifier, dir);
            pressDir(dir);
        } else {
            activeTouches.delete(touch.identifier);
        }
    }
    updateButtonVisuals();
}

function handleTouchEnd(e) {
    e.preventDefault();
    for (const touch of e.changedTouches) {
        const dir = activeTouches.get(touch.identifier);
        if (dir) {
            releaseDir(dir);
            activeTouches.delete(touch.identifier);
        }
    }
    updateButtonVisuals();
}

export function showMobileControls() {
    if (mobileControlsEl) {
        mobileControlsEl.classList.remove('hidden');
    }
}

export function hideMobileControls() {
    if (mobileControlsEl) {
        mobileControlsEl.classList.add('hidden');
    }
}

export function initMobileControls() {
    if (!detectTouch()) return;

    mobileControlsEl = document.getElementById('mobile-controls');

    if (!mobileControlsEl) return;

    const dpad = document.getElementById('dpad');
    if (dpad) {
        dpad.addEventListener('touchstart', handleTouchStart, { passive: false });
        dpad.addEventListener('touchmove', handleTouchMove, { passive: false });
        dpad.addEventListener('touchend', handleTouchEnd, { passive: false });
        dpad.addEventListener('touchcancel', handleTouchEnd, { passive: false });
    }
}
