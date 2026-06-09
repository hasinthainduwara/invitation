import { state } from './state.js';

function createCircleTexture(r, g, b, alphaScale) {
    const canvas = document.createElement('canvas');
    canvas.width = 16;
    canvas.height = 16;
    const ctx = canvas.getContext('2d');
    const grad = ctx.createRadialGradient(8, 8, 0, 8, 8, 8);
    grad.addColorStop(0, `rgba(${r},${g},${b},${alphaScale})`);
    grad.addColorStop(0.35, `rgba(${r},${Math.round(g * 0.65)},${Math.round(b * 0.2)},${alphaScale * 0.75})`);
    grad.addColorStop(1, 'rgba(0,0,0,0)');
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, 16, 16);
    return new THREE.CanvasTexture(canvas);
}

export function initFireEmbers() {
    const geo = new THREE.BufferGeometry();
    state.emberPositions = new Float32Array(state.emberCount * 3);

    for (let i = 0; i < state.emberCount; i++) {
        resetEmber(i);
    }

    geo.setAttribute('position', new THREE.BufferAttribute(state.emberPositions, 3));

    const mat = new THREE.PointsMaterial({
        size: 0.16,
        map: createCircleTexture(255, 140, 30, 1.0),
        transparent: true,
        blending: THREE.AdditiveBlending,
        depthWrite: false
    });

    state.emberPoints = new THREE.Points(geo, mat);
    state.scene.add(state.emberPoints);
}

function resetEmber(i) {
    const pos = state.fireBowlPositions.length > 0
        ? state.fireBowlPositions[Math.floor(Math.random() * state.fireBowlPositions.length)]
        : state.fireLightPos;

    state.emberPositions[i * 3] = pos.x + (Math.random() - 0.5) * 0.45;
    state.emberPositions[i * 3 + 1] = pos.y + 0.05 + Math.random() * 0.15;
    state.emberPositions[i * 3 + 2] = pos.z + (Math.random() - 0.5) * 0.45;

    state.emberVelocities[i] = new THREE.Vector3(
        (Math.random() - 0.5) * 0.12,
        0.6 + Math.random() * 0.8,
        (Math.random() - 0.5) * 0.12
    );
    state.emberLifes[i] = Math.random() * 0.8 + 0.2;
}

export function updateFireEmbers(delta) {
    if (!state.emberPositions || !state.emberPoints) return;

    const positions = state.emberPoints.geometry.attributes.position.array;

    for (let i = 0; i < state.emberCount; i++) {
        state.emberLifes[i] -= delta * 0.45;

        if (state.emberLifes[i] <= 0) {
            resetEmber(i);
        } else {
            positions[i * 3] += state.emberVelocities[i].x * delta;
            positions[i * 3 + 1] += state.emberVelocities[i].y * delta;
            positions[i * 3 + 2] += state.emberVelocities[i].z * delta;
            state.emberVelocities[i].x += Math.sin(performance.now() * 0.005 + i) * 0.05 * delta;
        }
    }
    state.emberPoints.geometry.attributes.position.needsUpdate = true;
}

export function initDustParticles(center, size) {
    state.boundsMin.set(
        center.x - size.x * 0.6,
        Math.max(0.1, center.y - size.y * 0.6),
        center.z - size.z * 0.6
    );
    state.boundsMax.set(
        center.x + size.x * 0.6,
        center.y + size.y * 0.6,
        center.z + size.z * 0.6
    );

    const geo = new THREE.BufferGeometry();
    state.dustPositions = new Float32Array(state.dustCount * 3);

    for (let i = 0; i < state.dustCount; i++) {
        state.dustPositions[i * 3] = state.boundsMin.x + Math.random() * (state.boundsMax.x - state.boundsMin.x);
        state.dustPositions[i * 3 + 1] = state.boundsMin.y + Math.random() * (state.boundsMax.y - state.boundsMin.y);
        state.dustPositions[i * 3 + 2] = state.boundsMin.z + Math.random() * (state.boundsMax.z - state.boundsMin.z);

        state.dustVelocities[i] = new THREE.Vector3(
            (Math.random() - 0.5) * 0.08,
            (Math.random() - 0.5) * 0.08,
            (Math.random() - 0.5) * 0.08
        );
    }

    geo.setAttribute('position', new THREE.BufferAttribute(state.dustPositions, 3));

    const mat = new THREE.PointsMaterial({
        size: 0.08,
        map: createCircleTexture(220, 235, 255, 0.45),
        transparent: true,
        blending: THREE.AdditiveBlending,
        depthWrite: false
    });

    state.dustPoints = new THREE.Points(geo, mat);
    state.scene.add(state.dustPoints);
}

export function updateDustParticles(delta) {
    if (!state.dustPositions || !state.dustPoints) return;

    const positions = state.dustPoints.geometry.attributes.position.array;

    for (let i = 0; i < state.dustCount; i++) {
        positions[i * 3] += state.dustVelocities[i].x * delta;
        positions[i * 3 + 1] += state.dustVelocities[i].y * delta;
        positions[i * 3 + 2] += state.dustVelocities[i].z * delta;

        if (Math.random() < 0.01) {
            state.dustVelocities[i].x += (Math.random() - 0.5) * 0.02;
            state.dustVelocities[i].y += (Math.random() - 0.5) * 0.02;
            state.dustVelocities[i].z += (Math.random() - 0.5) * 0.02;
            state.dustVelocities[i].clampLength(0.01, 0.06);
        }

        if (positions[i * 3] < state.boundsMin.x) positions[i * 3] = state.boundsMax.x;
        if (positions[i * 3] > state.boundsMax.x) positions[i * 3] = state.boundsMin.x;
        if (positions[i * 3 + 1] < state.boundsMin.y) positions[i * 3 + 1] = state.boundsMax.y;
        if (positions[i * 3 + 1] > state.boundsMax.y) positions[i * 3 + 1] = state.boundsMin.y;
        if (positions[i * 3 + 2] < state.boundsMin.z) positions[i * 3 + 2] = state.boundsMax.z;
        if (positions[i * 3 + 2] > state.boundsMax.z) positions[i * 3 + 2] = state.boundsMin.z;
    }
    state.dustPoints.geometry.attributes.position.needsUpdate = true;
}
