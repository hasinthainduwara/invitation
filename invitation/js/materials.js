import { state } from './state.js';

export function initMaterials() {
    state.floorMaterial = new THREE.MeshStandardMaterial({
        color: 0x1b1917,
        roughness: 0.85,
        metalness: 0.1,
        flatShading: false
    });

    state.stoneMaterial = new THREE.MeshStandardMaterial({
        color: 0x3d352e,
        roughness: 0.92,
        metalness: 0.05,
        flatShading: false,
        side: THREE.DoubleSide
    });

    state.roofMaterial = new THREE.MeshStandardMaterial({
        color: 0x24201c,
        roughness: 0.78,
        metalness: 0.15,
        flatShading: false,
        side: THREE.DoubleSide
    });

    state.ironMaterial = new THREE.MeshStandardMaterial({
        color: 0x1c1a18,
        roughness: 0.45,
        metalness: 0.82,
        flatShading: false
    });

    state.fireCoreMaterial = new THREE.MeshBasicMaterial({
        color: 0xff7320,
        transparent: true,
        opacity: 0.95
    });

    // The scroll (r1.fbx): radiant, polished gold that glows in the dark hall
    state.scrollMaterial = new THREE.MeshStandardMaterial({
        color: 0xffd27a,
        emissive: 0xffab2e,
        emissiveIntensity: 0.9,
        roughness: 0.3,
        metalness: 0.95
    });
}

export function getMaterialForFBX(fileName) {
    const name = fileName.toLowerCase();
    if (name.includes('r1')) return state.scrollMaterial; // must precede the '1.fbx' check below
    if (name.includes('floor')) return state.floorMaterial;
    if (name.includes('wall1')) return state.wallMaterial;
    if (name.includes('wall')) return state.stoneMaterial;
    if (name.includes('column') || name.includes('1.fbx') || name === '1') return state.stoneMaterial;
    if (name.includes('top')) return state.roofMaterial;
    if (name.includes('bowl') || name.includes('fire')) return state.ironMaterial;
    return state.stoneMaterial;
}
