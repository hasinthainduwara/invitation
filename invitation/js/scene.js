import { state } from './state.js';

export function initScene() {
    state.container = document.getElementById('canvas-container');

    state.scene = new THREE.Scene();
    state.scene.fog = new THREE.FogExp2(0x0a0c10, 0.004);

    state.camera = new THREE.PerspectiveCamera(70, window.innerWidth / window.innerHeight, 0.1, 500);
    state.camera.rotation.order = 'YXZ';
    state.renderer = new THREE.WebGLRenderer({ antialias: true, alpha: false, powerPreference: "high-performance" });
    state.renderer.setSize(window.innerWidth, window.innerHeight);
    state.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    state.renderer.shadowMap.enabled = true;
    state.renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    state.renderer.toneMapping = THREE.ACESFilmicToneMapping;
    state.renderer.toneMappingExposure = 1.6;
    state.container.appendChild(state.renderer.domElement);

    state.controls = new THREE.OrbitControls(state.camera, state.renderer.domElement);
    state.controls.enableDamping = true;
    state.controls.dampingFactor = 0.05;
    state.controls.maxPolarAngle = Math.PI / 2 - 0.02;
    state.controls.minDistance = 2;
    state.controls.maxDistance = 60;
    state.controls.target.set(0, 0, 0);

    state.keepGroup = new THREE.Group();
    state.scene.add(state.keepGroup);

    state.sceneCenter = new THREE.Vector3();
    state.sceneSize = new THREE.Vector3();
    state.fireLightPos = new THREE.Vector3(0, 1.8, 0);
    state.boundsMin = new THREE.Vector3(-15, 0, -15);
    state.boundsMax = new THREE.Vector3(15, 15, 15);

    state.camStartPos = new THREE.Vector3();
    state.camEndPos = new THREE.Vector3();
    state.targetStartPos = new THREE.Vector3();
    state.targetEndPos = new THREE.Vector3();
    state.focusStartPos = new THREE.Vector3();
    state.focusEndPos = new THREE.Vector3();
    state.focusStartTarget = new THREE.Vector3();
    state.focusEndTarget = new THREE.Vector3();

    state.clock = new THREE.Clock();

    initLighting();
    initResizeHandler();
}

function initLighting() {
    const ambientLight = new THREE.AmbientLight(0x3a4d6b, 1.2);
    state.scene.add(ambientLight);

    const moonLight = new THREE.DirectionalLight(0x8eb2e6, 1.8);
    moonLight.position.set(25, 45, -15);
    moonLight.castShadow = true;
    moonLight.shadow.mapSize.width = 2048;
    moonLight.shadow.mapSize.height = 2048;
    moonLight.shadow.camera.near = 0.5;
    moonLight.shadow.camera.far = 120;

    const shadowRange = 25;
    moonLight.shadow.camera.left = -shadowRange;
    moonLight.shadow.camera.right = shadowRange;
    moonLight.shadow.camera.top = shadowRange;
    moonLight.shadow.camera.bottom = -shadowRange;
    moonLight.shadow.bias = -0.0008;
    state.scene.add(moonLight);
}

function initResizeHandler() {
    window.addEventListener('resize', () => {
        state.camera.aspect = window.innerWidth / window.innerHeight;
        state.camera.updateProjectionMatrix();
        state.renderer.setSize(window.innerWidth, window.innerHeight);
    });
}
