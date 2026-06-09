import { perf } from './perf.js';

/* Shared application state passed between modules */
export const state = {
    // Audio
    audioCtx: null,
    audioElement: null,
    audioGainNode: null,
    isAudioPlaying: false,

    // Three.js core
    scene: null,
    camera: null,
    renderer: null,
    controls: null,
    keepGroup: null,
    container: null,

    // Scene bounds
    sceneBounds: null,
    sceneCenter: null,
    sceneSize: null,

    // Materials
    floorMaterial: null,
    stoneMaterial: null,
    roofMaterial: null,
    ironMaterial: null,
    fireCoreMaterial: null,
    wallMaterial: null,

    // Lighting & fire
    fireLights: [],
    fireCoreMeshes: [],
    fireBowlPositions: [],
    fireLightPos: null,

    // Moon rays (volumetric light shafts)
    moonRays: [],

    // Magic sparkles above the scroll
    magicPoints: null,
    magicData: null,
    magicCenter: null,
    magicGlow: null,
    magicRadius: 0,
    magicHeight: 0,
    magicBaseY: 0,

    // First-person controls
    firstPersonActive: false,
    cameraYaw: 0,
    cameraPitch: 0,
    eyeLevelY: 4.0,
    keysPressed: {},
    // Analog drag-to-move input from touch devices (-1..1 each)
    touchMoveForward: 0,
    touchMoveRight: 0,
    isLookDragging: false,
    isPointerLocked: false,
    prevPointerX: 0,
    prevPointerY: 0,

    // Camera animations
    introAnimationActive: false,
    introStartTime: 0,
    introDuration: 3200,
    camStartPos: null,
    camEndPos: null,
    targetStartPos: null,
    targetEndPos: null,
    focusAnimationActive: false,
    focusStartTime: 0,
    focusDuration: 1000,
    focusStartPos: null,
    focusEndPos: null,
    focusStartTarget: null,
    focusEndTarget: null,

    // Particles
    emberPoints: null,
    emberPositions: null,
    emberCount: perf.emberCount,
    emberVelocities: [],
    emberLifes: [],
    dustPoints: null,
    dustPositions: null,
    dustCount: perf.dustCount,
    dustVelocities: [],
    boundsMin: null,
    boundsMax: null,

    // FBX loading
    loadedFBX: {},
    loadedCount: 0,

    // Splash
    splashParticles: [],
    splashCanvas: null,
    splashCtx: null,

    // Render
    clock: null
};
