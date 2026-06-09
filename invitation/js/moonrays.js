import { state } from './state.js';

/* Soft vertical gradient used as the beam alpha mask.
   Bright near the source (top) and fading to nothing at the floor,
   with both ends feathered so the shaft has no hard caps. */
function makeBeamTexture() {
    const canvas = document.createElement('canvas');
    canvas.width = 8;
    canvas.height = 128;
    const ctx = canvas.getContext('2d');
    const grad = ctx.createLinearGradient(0, 0, 0, 128);
    grad.addColorStop(0.0, 'rgba(255,255,255,0.0)');   // top edge feather
    grad.addColorStop(0.12, 'rgba(255,255,255,0.85)'); // moon source
    grad.addColorStop(0.55, 'rgba(255,255,255,0.35)');
    grad.addColorStop(1.0, 'rgba(255,255,255,0.0)');   // dissolves before the floor
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, 8, 128);
    return new THREE.CanvasTexture(canvas);
}

/* Builds a handful of bluish light shafts angled to match the moonlight
   coming from scene.js (position 25, 45, -15 -> origin). */
export function initMoonRays(center, size) {
    const group = new THREE.Group();
    group.name = 'MoonRays';

    const tex = makeBeamTexture();

    // Direction the moonlight travels (downward into the hall) and its inverse (toward the moon).
    const toMoon = new THREE.Vector3(25, 45, -15).normalize();
    const up = new THREE.Vector3(0, 1, 0);
    const quat = new THREE.Quaternion().setFromUnitVectors(up, toMoon);

    const beamLength = size.y * 1.8;
    const radiusTop = Math.max(size.x, size.z) * 0.02;   // narrow at the source
    const radiusBottom = Math.max(size.x, size.z) * 0.13; // spreads as it enters the room

    // A few shafts staggered down the central aisle with slight lateral offsets.
    const placements = [
        { x: -size.x * 0.10, z: size.z * 0.28, o: 0.10 },
        { x: size.x * 0.14, z: size.z * 0.05, o: 0.13 },
        { x: -size.x * 0.06, z: -size.z * 0.18, o: 0.11 },
        { x: size.x * 0.08, z: -size.z * 0.38, o: 0.09 }
    ];

    placements.forEach((p, i) => {
        const geo = new THREE.CylinderGeometry(radiusTop, radiusBottom, beamLength, 12, 1, true);
        const mat = new THREE.MeshBasicMaterial({
            map: tex,
            color: 0x9fc2f0,
            transparent: true,
            opacity: p.o,
            blending: THREE.AdditiveBlending,
            depthWrite: false,
            side: THREE.DoubleSide,
            fog: false
        });

        const beam = new THREE.Mesh(geo, mat);
        beam.name = `MoonRay_${i}`;

        // Anchor the shaft to a point on the floor and push it up toward the moon.
        const floorPoint = new THREE.Vector3(center.x + p.x, 0, center.z + p.z);
        const beamCenter = floorPoint.clone().add(toMoon.clone().multiplyScalar(beamLength * 0.42));
        beam.position.copy(beamCenter);
        beam.quaternion.copy(quat);

        beam.userData.baseOpacity = p.o;
        beam.userData.phase = i * 1.7;

        group.add(beam);
        state.moonRays.push(beam);
    });

    state.scene.add(group);
}

/* Gentle shimmer so the shafts feel alive as dust drifts through them. */
export function updateMoonRays() {
    if (state.moonRays.length === 0) return;
    const t = performance.now() * 0.0006;
    for (const beam of state.moonRays) {
        const flicker = Math.sin(t + beam.userData.phase) * 0.5 + Math.sin(t * 2.3 + beam.userData.phase) * 0.2;
        beam.material.opacity = beam.userData.baseOpacity * (1.0 + flicker * 0.18);
    }
}
