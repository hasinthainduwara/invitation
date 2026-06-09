/* Shared application state passed between modules */
export const state = {
    // Audio
    audioCtx: null,
    windNode: null,
    fireNode: null,
    fireNodeClick: null,
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

    // First-person controls
    firstPersonActive: false,
    cameraYaw: 0,
    cameraPitch: 0,
    eyeLevelY: 4.0,
    keysPressed: {},
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
    emberCount: 90,
    emberVelocities: [],
    emberLifes: [],
    dustPoints: null,
    dustPositions: null,
    dustCount: 180,
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
