import { state } from './state.js';
import { dom } from './dom.js';

const raycaster = new THREE.Raycaster();
const mouse = new THREE.Vector2();

function getFBXName(mesh) {
    let node = mesh;
    while (node) {
        if (node.userData && node.userData.fileName) {
            return node.userData.fileName;
        }
        node = node.parent;
    }
    return mesh.name || '';
}

export function initInteraction() {
    function openScroll() {
        dom.scrollOverlay.classList.remove('hidden');
        dom.scrollToggle.textContent = "Close Summons";
    }

    function handleSceneClick(clientX, clientY, isLocked) {
        if (isLocked) {
            mouse.set(0, 0);
        } else {
            mouse.x = (clientX / window.innerWidth) * 2 - 1;
            mouse.y = -(clientY / window.innerHeight) * 2 + 1;
        }

        raycaster.setFromCamera(mouse, state.camera);
        const intersects = raycaster.intersectObjects(state.keepGroup.children, true);

        // Check if any hit object belongs to r1.fbx (the scroll) or the pedestal it sits on (1.fbx)
        const hitR1 = intersects.find(i => {
            const name = getFBXName(i.object).toLowerCase();
            return name === 'r1.fbx' || name === '1.fbx' || name === '1';
        });

        if (hitR1) {
            if (isLocked) document.exitPointerLock();
            openScroll();
            return true;
        }

        // Not aiming at the scroll while locked: release the mouse
        if (isLocked) {
            document.exitPointerLock();
            return true;
        }

        return false;
    }

    // Desktop: mousedown
    window.addEventListener('mousedown', (e) => {
        if (e.target.closest('#ui-overlay') || e.target.closest('#splash-screen')) return;
        if (e.target.closest('#mobile-controls')) return;

        const locked = !!document.pointerLockElement;
        handleSceneClick(e.clientX, e.clientY, locked);
    });

    // Mobile: touchend on canvas (touchstart would conflict with drag-to-look)
    const canvasEl = state.renderer.domElement;
    let touchStartTime = 0;
    let touchStartX = 0;
    let touchStartY = 0;

    canvasEl.addEventListener('touchstart', (e) => {
        if (e.touches.length === 1) {
            touchStartTime = Date.now();
            touchStartX = e.touches[0].clientX;
            touchStartY = e.touches[0].clientY;
        }
    }, { passive: true });

    canvasEl.addEventListener('touchend', (e) => {
        // Only treat as a tap if it was short and didn't move much (not a drag-to-look)
        const elapsed = Date.now() - touchStartTime;
        const touch = e.changedTouches[0];
        const dx = Math.abs(touch.clientX - touchStartX);
        const dy = Math.abs(touch.clientY - touchStartY);

        if (elapsed < 350 && dx < 20 && dy < 20) {
            handleSceneClick(touch.clientX, touch.clientY, false);
        }
    }, { passive: true });

    dom.objectClose.addEventListener('click', () => dom.objectCard.classList.add('hidden'));
    dom.helpClose.addEventListener('click', () => dom.helpCard.classList.add('hidden'));

    dom.controlsToggle.addEventListener('click', () => {
        dom.objectCard.classList.add('hidden');
        dom.helpCard.classList.toggle('hidden');
    });
}

