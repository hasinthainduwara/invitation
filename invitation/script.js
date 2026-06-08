/* ==========================================================================
   GAME OF THRONES THEMED 3D INTERACTIVE INVITATION SCRIPT
   ========================================================================== */

document.addEventListener('DOMContentLoaded', () => {
    // DOM Elements
    const splashScreen = document.getElementById('splash-screen');
    const progressBar = document.getElementById('progress-bar');
    const loadingText = document.getElementById('loading-text');
    const loadingPercentage = document.getElementById('loading-percentage');
    const enterBtn = document.getElementById('enter-btn');
    const progressWrapper = document.querySelector('.progress-wrapper');
    
    const uiOverlay = document.getElementById('ui-overlay');
    const audioToggle = document.getElementById('audio-toggle');
    const scrollToggle = document.getElementById('scroll-toggle');
    const controlsToggle = document.getElementById('controls-toggle');
    
    const helpCard = document.getElementById('help-card');
    const helpClose = document.getElementById('help-close');
    
    const objectCard = document.getElementById('object-card');
    const objectTitle = document.getElementById('object-title');
    const objectDescription = document.getElementById('object-description');
    const objectClose = document.getElementById('object-close');
    
    const scrollOverlay = document.getElementById('scroll-overlay');
    const btnRsvpTrigger = document.getElementById('btn-rsvp-trigger');
    
    const rsvpModal = document.getElementById('rsvp-modal');
    const rsvpClose = document.getElementById('rsvp-close');
    const rsvpForm = document.getElementById('rsvp-form');
    const rsvpSuccess = document.getElementById('rsvp-success');
    const rsvpSuccessText = document.getElementById('rsvp-success-text');

    /* ==========================================================================
       1. WEB AUDIO API SYNTHESIS (WIND & FIRE SOUNDS)
       ========================================================================== */
    let audioCtx = null;
    let windNode = null;
    let fireNode = null;
    let fireNodeClick = null;
    let isAudioPlaying = false;

    function initAudio() {
        if (audioCtx) return;
        
        try {
            const AudioContext = window.AudioContext || window.webkitAudioContext;
            audioCtx = new AudioContext();
            
            const bufferSize = 2 * audioCtx.sampleRate;
            
            // --- Wind Synthesis (Pink noise through LFO-modulated lowpass filter) ---
            const noiseBuffer = audioCtx.createBuffer(1, bufferSize, audioCtx.sampleRate);
            const output = noiseBuffer.getChannelData(0);
            
            let b0, b1, b2, b3, b4, b5, b6;
            b0 = b1 = b2 = b3 = b4 = b5 = b6 = 0.0;
            for (let i = 0; i < bufferSize; i++) {
                const white = Math.random() * 2 - 1;
                b0 = 0.99886 * b0 + white * 0.0555179;
                b1 = 0.99332 * b1 + white * 0.0750759;
                b2 = 0.96900 * b2 + white * 0.1538520;
                b3 = 0.86650 * b3 + white * 0.3104856;
                b4 = 0.55000 * b4 + white * 0.5329522;
                b5 = -0.7616 * b5 - white * 0.0168980;
                output[i] = b0 + b1 + b2 + b3 + b4 + b5 + b6 + white * 0.5362;
                output[i] *= 0.08; // scale volume
                b6 = white * 0.115926;
            }
            
            const windSource = audioCtx.createBufferSource();
            windSource.buffer = noiseBuffer;
            windSource.loop = true;
            
            const windFilter = audioCtx.createBiquadFilter();
            windFilter.type = 'lowpass';
            windFilter.Q.value = 1.2;
            
            const lfo = audioCtx.createOscillator();
            lfo.frequency.value = 0.12; // Modulate wind pitch very slowly
            
            const lfoGain = audioCtx.createGain();
            lfoGain.gain.value = 180; // filter range variance
            
            lfo.connect(lfoGain);
            lfoGain.connect(windFilter.frequency);
            
            windFilter.frequency.value = 350;
            
            const windGain = audioCtx.createGain();
            windGain.gain.value = 0.1; // Soft background breeze
            
            windSource.connect(windFilter);
            windFilter.connect(windGain);
            windGain.connect(audioCtx.destination);
            
            lfo.start();
            windSource.start();
            
            // --- Fire Hiss/Rumble (Filtered white noise) ---
            const hissBuffer = audioCtx.createBuffer(1, bufferSize, audioCtx.sampleRate);
            const hissData = hissBuffer.getChannelData(0);
            for (let i = 0; i < bufferSize; i++) {
                hissData[i] = (Math.random() * 2 - 1) * 0.03;
            }
            
            const fireHissSource = audioCtx.createBufferSource();
            fireHissSource.buffer = hissBuffer;
            fireHissSource.loop = true;
            
            const fireHissFilter = audioCtx.createBiquadFilter();
            fireHissFilter.type = 'bandpass';
            fireHissFilter.frequency.value = 600;
            fireHissFilter.Q.value = 0.4;
            
            const fireHissGain = audioCtx.createGain();
            fireHissGain.gain.value = 0.08;
            
            fireHissSource.connect(fireHissFilter);
            fireHissFilter.connect(fireHissGain);
            fireHissGain.connect(audioCtx.destination);
            
            fireHissSource.start();
            
            // --- Fire Ember Crackles (Random clicks) ---
            // ScriptProcessor node to generate random crackle impulses
            const clickNode = audioCtx.createScriptProcessor(4096, 0, 1);
            clickNode.onaudioprocess = function(e) {
                const out = e.outputBuffer.getChannelData(0);
                for (let i = 0; i < out.length; i++) {
                    out[i] = 0;
                    if (Math.random() < 0.00065) {
                        let amplitude = 0.15 + Math.random() * 0.55;
                        let decay = 0.982;
                        // Inject click impulse that decays quickly
                        for (let j = 0; j < 350 && (i + j) < out.length; j++) {
                            out[i + j] += (Math.random() * 2 - 1) * amplitude;
                            amplitude *= decay;
                        }
                    }
                }
            };
            
            const fireClickGain = audioCtx.createGain();
            fireClickGain.gain.value = 0.22;
            
            clickNode.connect(fireClickGain);
            fireClickGain.connect(audioCtx.destination);
            
            windNode = windGain;
            fireNode = fireHissGain;
            fireNodeClick = fireClickGain;
            
            isAudioPlaying = true;
            updateAudioButton();
        } catch(e) {
            console.warn("Web Audio API could not initialize:", e);
        }
    }

    function toggleAudio() {
        if (!audioCtx) {
            initAudio();
            return;
        }
        
        if (audioCtx.state === 'suspended') {
            audioCtx.resume();
            isAudioPlaying = true;
        } else if (audioCtx.state === 'running') {
            audioCtx.suspend();
            isAudioPlaying = false;
        }
        updateAudioButton();
    }

    function updateAudioButton() {
        const label = audioToggle.querySelector('.label');
        const icon = audioToggle.querySelector('.icon');
        if (isAudioPlaying) {
            label.textContent = "Mute Ambient";
            icon.textContent = "🔊";
        } else {
            label.textContent = "Play Ambient";
            icon.textContent = "🔇";
        }
    }

    audioToggle.addEventListener('click', toggleAudio);

    /* ==========================================================================
       2. THREE.JS 3D KEEP SETUP
       ========================================================================== */
    const container = document.getElementById('canvas-container');
    
    // Scene, Camera, Renderer
    const scene = new THREE.Scene();
    scene.fog = new THREE.FogExp2(0x0a0c10, 0.004); // Very subtle atmospheric fog
    
    const camera = new THREE.PerspectiveCamera(50, window.innerWidth / window.innerHeight, 0.1, 500);
    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: false, powerPreference: "high-performance" });
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.6;
    container.appendChild(renderer.domElement);

    // OrbitControls
    const controls = new THREE.OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;
    controls.dampingFactor = 0.05;
    controls.maxPolarAngle = Math.PI / 2 - 0.02; // Prevent camera going below floor level
    controls.minDistance = 2;
    controls.maxDistance = 60;
    controls.target.set(0, 0, 0);

    // First-Person Controls State Variables
    let cameraYaw = 0;
    let cameraPitch = 0;
    let eyeLevelY = 4.0; // Dynamic default, calibrated based on keep height
    const keysPressed = {};
    let isLookDragging = false;
    let prevPointerX = 0;
    let prevPointerY = 0;

    // Mathematically extract yaw and pitch from the camera's current rotation matrix/quaternion
    function syncYawPitchFromCamera() {
        const dir = new THREE.Vector3(0, 0, -1).applyQuaternion(camera.quaternion);
        cameraYaw = Math.atan2(dir.x, -dir.z);
        // Clamp to avoid NaN in Math.asin
        cameraPitch = Math.asin(Math.max(-0.999, Math.min(0.999, dir.y)));
    }

    // Keyboard Movement Event Listeners
    window.addEventListener('keydown', (e) => {
        // Prevent camera movement when typing in RSVP modal input fields
        if (document.activeElement && (
            document.activeElement.tagName === 'INPUT' ||
            document.activeElement.tagName === 'TEXTAREA' ||
            document.activeElement.tagName === 'SELECT'
        )) {
            return;
        }
        const key = e.key.toLowerCase();
        if (['w', 'a', 's', 'd', 'arrowup', 'arrowdown', 'arrowleft', 'arrowright'].includes(key)) {
            keysPressed[key] = true;
        }
    });

    window.addEventListener('keyup', (e) => {
        const key = e.key.toLowerCase();
        keysPressed[key] = false;
    });

    window.addEventListener('blur', () => {
        // Clear all keys on focus loss to prevent stuck keys
        for (let key in keysPressed) {
            keysPressed[key] = false;
        }
    });

    // Pointer Dragging to Look-Around (Mouse + Touch)
    const canvasElement = renderer.domElement;
    
    canvasElement.addEventListener('pointerdown', (e) => {
        // Disable during active cinematic or focus camera animations
        if (introAnimationActive || focusAnimationActive) return;
        if (e.button !== 0) return; // Only trigger look-around with left mouse click drag
        
        isLookDragging = true;
        prevPointerX = e.clientX;
        prevPointerY = e.clientY;
        
        // Synchronize yaw/pitch to current look vector before starting drag to avoid camera jumping
        syncYawPitchFromCamera();
    });

    window.addEventListener('pointermove', (e) => {
        if (!isLookDragging) return;
        
        const dx = e.clientX - prevPointerX;
        const dy = e.clientY - prevPointerY;
        
        prevPointerX = e.clientX;
        prevPointerY = e.clientY;
        
        // Fine-tuned drag looking sensitivity
        const sensitivity = 0.0025;
        cameraYaw -= dx * sensitivity;
        cameraPitch -= dy * sensitivity;
        
        // Restrict looking straight up or straight down to prevent camera flipping
        cameraPitch = Math.max(-Math.PI / 2 + 0.08, Math.min(Math.PI / 2 - 0.08, cameraPitch));
    });

    window.addEventListener('pointerup', () => {
        isLookDragging = false;
    });

    window.addEventListener('pointercancel', () => {
        isLookDragging = false;
    });

    // Parent group for loaded 3D meshes
    const keepGroup = new THREE.Group();
    scene.add(keepGroup);

    /* ==========================================================================
       3. MATERIAL SYSTEM
       ========================================================================== */
    // Custom procedural materials for premium, slate-stone castle vibe
    const floorMaterial = new THREE.MeshStandardMaterial({
        color: 0x1b1917,      // Deep basalt grey
        roughness: 0.85,
        metalness: 0.1,
        flatShading: false
    });

    const stoneMaterial = new THREE.MeshStandardMaterial({
        color: 0x3d352e,      // Ancient rough stone
        roughness: 0.92,
        metalness: 0.05,
        flatShading: false,
        side: THREE.DoubleSide
    });

    const roofMaterial = new THREE.MeshStandardMaterial({
        color: 0x24201c,      // Dark grey roof slates
        roughness: 0.78,
        metalness: 0.15,
        flatShading: false,
        side: THREE.DoubleSide
    });

    const ironMaterial = new THREE.MeshStandardMaterial({
        color: 0x1c1a18,      // Wrought iron/coal pedestal
        roughness: 0.45,
        metalness: 0.82,
        flatShading: false
    });

    // Fire core (glowing block inside the FireBowl)
    const fireCoreMaterial = new THREE.MeshBasicMaterial({
        color: 0xff6600,
        transparent: true,
        opacity: 0.95
    });

    function getMaterialForFBX(fileName) {
        const name = fileName.toLowerCase();
        if (name.includes('floor')) return floorMaterial;
        if (name.includes('wall1')) return wallMaterial;
        if (name.includes('wall')) return stoneMaterial;
        if (name.includes('column') || name.includes('1.fbx') || name === '1') return stoneMaterial;
        if (name.includes('top')) return roofMaterial;
        if (name.includes('bowl') || name.includes('fire')) return ironMaterial;
        return stoneMaterial;
    }

    /* ==========================================================================
       4. LIGHTING RIG
       ========================================================================== */
    // Deep blue ambient cold stone fill — strong enough to see all geometry
    const ambientLight = new THREE.AmbientLight(0x3a4d6b, 1.2);
    scene.add(ambientLight);

    // Directional Moonlight casting shadows
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
    scene.add(moonLight);

    // Dynamic Flickering Hearth Lights
    const fireLights = [];
    const fireCoreMeshes = [];
    const fireBowlPositions = [];
    let fireLightPos = new THREE.Vector3(0, 1.8, 0); // fallback position

    /* ==========================================================================
       5. PARTICLE SYSTEMS
       ========================================================================== */
    // Helper to generate a soft circular alpha texture for particles
    function createCircleTexture(r, g, b, alphaScale) {
        const canvas = document.createElement('canvas');
        canvas.width = 16;
        canvas.height = 16;
        const ctx = canvas.getContext('2d');
        const grad = ctx.createRadialGradient(8, 8, 0, 8, 8, 8);
        grad.addColorStop(0, `rgba(${r},${g},${b},${alphaScale})`);
        grad.addColorStop(0.35, `rgba(${r},${Math.round(g*0.65)},${Math.round(b*0.2)},${alphaScale*0.75})`);
        grad.addColorStop(1, 'rgba(0,0,0,0)');
        ctx.fillStyle = grad;
        ctx.fillRect(0, 0, 16, 16);
        return new THREE.CanvasTexture(canvas);
    }

    // A. Fire Embers Rising from Hearth
    let emberPoints = null;
    let emberPositions = null;
    const emberCount = 90;
    const emberVelocities = [];
    const emberLifes = [];

    function initFireEmbers() {
        const geo = new THREE.BufferGeometry();
        emberPositions = new Float32Array(emberCount * 3);
        
        for (let i = 0; i < emberCount; i++) {
            resetEmber(i);
        }

        geo.setAttribute('position', new THREE.BufferAttribute(emberPositions, 3));
        
        const mat = new THREE.PointsMaterial({
            size: 0.16,
            map: createCircleTexture(255, 140, 30, 1.0),
            transparent: true,
            blending: THREE.AdditiveBlending,
            depthWrite: false
        });

        emberPoints = new THREE.Points(geo, mat);
        scene.add(emberPoints);
    }

    function resetEmber(i) {
        // Spawn around a random fire bowl position
        const pos = fireBowlPositions.length > 0 
            ? fireBowlPositions[Math.floor(Math.random() * fireBowlPositions.length)] 
            : fireLightPos;

        emberPositions[i * 3] = pos.x + (Math.random() - 0.5) * 0.45;
        emberPositions[i * 3 + 1] = pos.y + 0.05 + Math.random() * 0.15;
        emberPositions[i * 3 + 2] = pos.z + (Math.random() - 0.5) * 0.45;

        // Rise up with variable speeds, sway sideways
        emberVelocities[i] = new THREE.Vector3(
            (Math.random() - 0.5) * 0.12,
            0.6 + Math.random() * 0.8,
            (Math.random() - 0.5) * 0.12
        );
        emberLifes[i] = Math.random() * 0.8 + 0.2; // Remaining lifespan percentage
    }

    function updateFireEmbers(delta) {
        if (!emberPositions || !emberPoints) return;

        const positions = emberPoints.geometry.attributes.position.array;
        
        for (let i = 0; i < emberCount; i++) {
            emberLifes[i] -= delta * 0.45; // age factor
            
            if (emberLifes[i] <= 0) {
                resetEmber(i);
            } else {
                // Apply velocity
                positions[i * 3] += emberVelocities[i].x * delta;
                positions[i * 3 + 1] += emberVelocities[i].y * delta;
                positions[i * 3 + 2] += emberVelocities[i].z * delta;

                // Add drifting motion
                emberVelocities[i].x += Math.sin(performance.now() * 0.005 + i) * 0.05 * delta;
            }
        }
        emberPoints.geometry.attributes.position.needsUpdate = true;
    }

    // B. Atmospheric Castle Dust Motes
    let dustPoints = null;
    let dustPositions = null;
    const dustCount = 180;
    const dustVelocities = [];
    let boundsMin = new THREE.Vector3(-15, 0, -15);
    let boundsMax = new THREE.Vector3(15, 15, 15);

    function initDustParticles(center, size) {
        // Set volume bounds based on loaded group sizing
        boundsMin.set(
            center.x - size.x * 0.6,
            Math.max(0.1, center.y - size.y * 0.6),
            center.z - size.z * 0.6
        );
        boundsMax.set(
            center.x + size.x * 0.6,
            center.y + size.y * 0.6,
            center.z + size.z * 0.6
        );

        const geo = new THREE.BufferGeometry();
        dustPositions = new Float32Array(dustCount * 3);

        for (let i = 0; i < dustCount; i++) {
            dustPositions[i * 3] = boundsMin.x + Math.random() * (boundsMax.x - boundsMin.x);
            dustPositions[i * 3 + 1] = boundsMin.y + Math.random() * (boundsMax.y - boundsMin.y);
            dustPositions[i * 3 + 2] = boundsMin.z + Math.random() * (boundsMax.z - boundsMin.z);

            dustVelocities[i] = new THREE.Vector3(
                (Math.random() - 0.5) * 0.08,
                (Math.random() - 0.5) * 0.08,
                (Math.random() - 0.5) * 0.08
            );
        }

        geo.setAttribute('position', new THREE.BufferAttribute(dustPositions, 3));

        const mat = new THREE.PointsMaterial({
            size: 0.08,
            map: createCircleTexture(220, 235, 255, 0.45),
            transparent: true,
            blending: THREE.AdditiveBlending,
            depthWrite: false
        });

        dustPoints = new THREE.Points(geo, mat);
        scene.add(dustPoints);
    }

    function updateDustParticles(delta) {
        if (!dustPositions || !dustPoints) return;

        const positions = dustPoints.geometry.attributes.position.array;

        for (let i = 0; i < dustCount; i++) {
            positions[i * 3] += dustVelocities[i].x * delta;
            positions[i * 3 + 1] += dustVelocities[i].y * delta;
            positions[i * 3 + 2] += dustVelocities[i].z * delta;

            // Soft drift change
            if (Math.random() < 0.01) {
                dustVelocities[i].x += (Math.random() - 0.5) * 0.02;
                dustVelocities[i].y += (Math.random() - 0.5) * 0.02;
                dustVelocities[i].z += (Math.random() - 0.5) * 0.02;
                dustVelocities[i].clampLength(0.01, 0.06);
            }

            // Boundary wrapping
            if (positions[i * 3] < boundsMin.x) positions[i * 3] = boundsMax.x;
            if (positions[i * 3] > boundsMax.x) positions[i * 3] = boundsMin.x;
            if (positions[i * 3 + 1] < boundsMin.y) positions[i * 3 + 1] = boundsMax.y;
            if (positions[i * 3 + 1] > boundsMax.y) positions[i * 3 + 1] = boundsMin.y;
            if (positions[i * 3 + 2] < boundsMin.z) positions[i * 3 + 2] = boundsMax.z;
            if (positions[i * 3 + 2] > boundsMax.z) positions[i * 3 + 2] = boundsMin.z;
        }
        dustPoints.geometry.attributes.position.needsUpdate = true;
    }

    /* ==========================================================================
       6. FBX LOADING SEQUENCE
       ========================================================================== */
    const loadingManager = new THREE.LoadingManager();
    const fbxLoader = new THREE.FBXLoader(loadingManager);

    // Texture loader using the same loading manager
    const textureLoader = new THREE.TextureLoader(loadingManager);
    const wallTexture = textureLoader.load('assets/objects/wall1_DefaultMaterial_BaseColor.png');
    wallTexture.encoding = THREE.sRGBEncoding;

    const wallMaterial = new THREE.MeshStandardMaterial({
        map: wallTexture,
        roughness: 0.85,
        metalness: 0.1,
        side: THREE.DoubleSide
    });

    const fbxFiles = [
        'Floor2.fbx',
        'wall1.fbx',
        'Column1.fbx',
        'BigColumn.fbx',
        '1.fbx',
        'top2.fbx',
        'FireBowl.fbx'
    ];

    let sceneBounds = null;
    let sceneCenter = new THREE.Vector3();
    let sceneSize = new THREE.Vector3();

    loadingManager.onProgress = (url, itemsLoaded, itemsTotal) => {
        const percentage = Math.round((itemsLoaded / itemsTotal) * 100);
        progressBar.style.width = `${percentage}%`;
        loadingPercentage.textContent = `${percentage}%`;
        
        const filename = url.substring(url.lastIndexOf('/') + 1);
        if (filename) {
            loadingText.textContent = `Fortifying ${filename}...`;
        }
    };

    loadingManager.onLoad = () => {
        loadingText.textContent = "Great Keep Prepared.";
        loadingPercentage.textContent = "100%";
        
        // Wait a small moment to let progress transition finish smoothly
        setTimeout(() => {
            progressWrapper.classList.add('fade-out');
            enterBtn.classList.remove('hidden');
            enterBtn.style.animation = "fadeInLettering 1s ease forwards";
        }, 300);

        // Assemble hall from loaded FBX objects, then calibrate scene
        assembleHall();
        calibrateScene();
    };

    loadingManager.onError = (url) => {
        console.warn(`Error loading asset: ${url}`);
        // Only trigger UI error for critical model files (like .fbx)
        if (url.toLowerCase().endsWith('.fbx')) {
            loadingText.textContent = "Error stoking the hearth. Check console.";
        }
    };

    // Store loaded FBX objects by name for assembly
    const loadedFBX = {};
    let loadedCount = 0;

    // Load each file and feed it to the Group
    fbxFiles.forEach((file) => {
        fbxLoader.load(`assets/objects/${file}`, (fbx) => {
            fbx.name = file;
            fbx.userData = { fileName: file };
            
            fbx.traverse((child) => {
                if (child.isMesh) {
                    child.castShadow = true;
                    child.receiveShadow = true;
                    child.userData = { fileName: file };
                    
                    // Assign themed textures/colors
                    child.material = getMaterialForFBX(file);
                }
            });
            
            // Center each FBX object's geometry at the origin
            // (each FBX was exported at its Blender world position, causing huge offsets)
            const box = new THREE.Box3().setFromObject(fbx);
            const center = new THREE.Vector3();
            box.getCenter(center);
            
            // Shift all children so the geometry is centered at (0,0,0)
            fbx.position.set(-center.x, -center.y, -center.z);
            
            // Wrap in a container group so we can position the centered object
            const container = new THREE.Group();
            container.name = file;
            container.userData = { fileName: file };
            container.add(fbx);
            
            // Store size info for assembly
            const size = new THREE.Vector3();
            box.getSize(size);
            container.userData.originalSize = size;
            container.userData.originalCenter = center.clone();
            
            loadedFBX[file] = container;
            loadedCount++;
            
            console.log(`[FBX LOADED] ${file}: size=(${size.x.toFixed(1)}, ${size.y.toFixed(1)}, ${size.z.toFixed(1)})`);
        }, undefined, (err) => {
            console.error(`Failed to load ${file}:`, err);
        });
    });

    function assembleHall() {
        // All FBX objects have been centered at (0,0,0) in their container.
        // Now we position each piece relative to the floor center to form the hall.
        //
        // Object sizes (from FBX debug):
        //   Floor2:    2473 x  52 x 4047 (wide floor slab)
        //   wall1:     1169 x 1169 x  55 (square wall panel)
        //   Column1:    163 x 1169 x 163 (thin tall column) 
        //   BigColumn:  553 x 1331 x 332 (large column)
        //   1.fbx:      256 x  316 x 256 (pedestal block)
        //   top2:      2056 x 1520 x 4493 (arched roof vault)
        //   FireBowl:    52 x   54 x  34 (fire bowl)

        const floor = loadedFBX['Floor2.fbx'];
        const wall = loadedFBX['wall1.fbx'];
        const column1 = loadedFBX['Column1.fbx'];
        const bigColumn = loadedFBX['BigColumn.fbx'];
        const pillar = loadedFBX['1.fbx'];
        const roof = loadedFBX['top2.fbx'];
        const fireBowl = loadedFBX['FireBowl.fbx'];

        const floorSize = floor.userData.originalSize;
        const wallSize = wall.userData.originalSize;
        const col1Size = column1.userData.originalSize;
        const bigColSize = bigColumn.userData.originalSize;
        const pillarSize = pillar.userData.originalSize;
        const roofSize = roof.userData.originalSize;
        const bowlSize = fireBowl.userData.originalSize;

        // 1. FLOOR — centered at origin, top surface at Y=0
        floor.position.set(0, -floorSize.y / 2, 0);
        keepGroup.add(floor);

        // Floor half-extents
        const halfFloorX = floorSize.x / 2;
        const halfFloorZ = floorSize.z / 2;

        // 2. WALLS & COLUMNS ARRANGEMENT
        // Columns: 8 total (4 on each side, at Z = 1800, 600, -600, -1800)
        // Side Walls: 6 total (3 on each side, at Z = 1200, 0, -1200)
        // Back Walls: 3 total (sealing the back at Z = -1966)
        
        const bigColInsetX = halfFloorX * 0.85; // ~1051
        const sideWallInsetX = bigColInsetX; // align with columns along X
        
        const zColumnPositions = [1800, 600, -600, -1800];
        const zSideWallPositions = [1200, 0, -1200];
        
        // Place Big Columns on both sides
        zColumnPositions.forEach((zPos, index) => {
            // Left Side Column
            const colL = bigColumn.clone();
            colL.name = `BigColumn_Left_${index}`;
            colL.userData = { fileName: 'BigColumn.fbx' };
            colL.position.set(-bigColInsetX, bigColSize.y / 2, zPos);
            keepGroup.add(colL);

            // Right Side Column
            const colR = bigColumn.clone();
            colR.name = `BigColumn_Right_${index}`;
            colR.userData = { fileName: 'BigColumn.fbx' };
            colR.position.set(bigColInsetX, bigColSize.y / 2, zPos);
            keepGroup.add(colR);
        });

        // Place Side Wall Panels on both sides
        zSideWallPositions.forEach((zPos, index) => {
            // Left Side Wall (rotated -90 degrees to face inwards)
            const wallL = wall.clone();
            wallL.name = `SideWall_Left_${index}`;
            wallL.userData = { fileName: 'wall1.fbx' };
            wallL.position.set(-sideWallInsetX, wallSize.y / 2, zPos);
            wallL.rotation.y = -Math.PI / 2;
            keepGroup.add(wallL);

            // Right Side Wall (rotated 90 degrees to face inwards)
            const wallR = wall.clone();
            wallR.name = `SideWall_Right_${index}`;
            wallR.userData = { fileName: 'wall1.fbx' };
            wallR.position.set(sideWallInsetX, wallSize.y / 2, zPos);
            wallR.rotation.y = Math.PI / 2;
            keepGroup.add(wallR);
        });

        // Place Back Wall Panels (3 wall panels to fully close the back)
        // Offset left and right back walls slightly along Z to prevent z-fighting in the overlap regions
        const backWallZ = -1966;
        
        const wallB_Center = wall.clone();
        wallB_Center.name = 'BackWall_Center';
        wallB_Center.userData = { fileName: 'wall1.fbx' };
        wallB_Center.position.set(0, wallSize.y / 2, backWallZ);
        keepGroup.add(wallB_Center);

        const wallB_Left = wall.clone();
        wallB_Left.name = 'BackWall_Left';
        wallB_Left.userData = { fileName: 'wall1.fbx' };
        wallB_Left.position.set(-700, wallSize.y / 2, backWallZ + 2); // 2 units offset to prevent z-fighting
        keepGroup.add(wallB_Left);

        const wallB_Right = wall.clone();
        wallB_Right.name = 'BackWall_Right';
        wallB_Right.userData = { fileName: 'wall1.fbx' };
        wallB_Right.position.set(700, wallSize.y / 2, backWallZ + 2); // 2 units offset to prevent z-fighting
        keepGroup.add(wallB_Right);

        // 3. COLUMN1 (thin columns) — placed at front-left and front-right of the floor
        //    We'll place 4 columns forming two rows
        const colInsetX = halfFloorX * 0.3;  // 30% inset from edges
        const colInsetZ = halfFloorZ * 0.35;
        
        // Front-left column
        const col1 = column1.clone();
        col1.name = 'Column1.fbx';
        col1.userData = { fileName: 'Column1.fbx' };
        col1.position.set(-colInsetX, col1Size.y / 2, colInsetZ);
        keepGroup.add(col1);
        
        // Front-right column
        const col2 = column1.clone();
        col2.name = 'Column1.fbx';
        col2.userData = { fileName: 'Column1.fbx' };
        col2.position.set(colInsetX, col1Size.y / 2, colInsetZ);
        keepGroup.add(col2);

        // Back-left column
        const col3 = column1.clone();
        col3.name = 'Column1.fbx';
        col3.userData = { fileName: 'Column1.fbx' };
        col3.position.set(-colInsetX, col1Size.y / 2, -colInsetZ);
        keepGroup.add(col3);

        // Back-right column
        const col4 = column1.clone();
        col4.name = 'Column1.fbx';
        col4.userData = { fileName: 'Column1.fbx' };
        col4.position.set(colInsetX, col1Size.y / 2, -colInsetZ);
        keepGroup.add(col4);

        // 5. ROOF — centered above the hall, resting on top of the columns
        roof.position.set(0, col1Size.y + roofSize.y / 2, 0);
        keepGroup.add(roof);

        // 6. PEDESTAL (1.fbx) — centered on the floor (without fire bowl)
        pillar.position.set(0, pillarSize.y / 2, 0);
        keepGroup.add(pillar);

        // 7. FIREBOWLS — placed on the inner side of each of the 8 big columns
        zColumnPositions.forEach((zPos, index) => {
            // Left Side Fire Bowl
            const bowlL = fireBowl.clone();
            bowlL.name = `FireBowl_Left_${index}`;
            bowlL.userData = { fileName: 'FireBowl.fbx' };
            bowlL.position.set(-740, bowlSize.y / 2, zPos);
            keepGroup.add(bowlL);

            // Right Side Fire Bowl
            const bowlR = fireBowl.clone();
            bowlR.name = `FireBowl_Right_${index}`;
            bowlR.userData = { fileName: 'FireBowl.fbx' };
            bowlR.position.set(740, bowlSize.y / 2, zPos);
            keepGroup.add(bowlR);
        });

        console.log('[ASSEMBLY] Hall assembled with all components positioned relative to floor.');
    }

    function calibrateScene() {
        // Compute combined bounding box
        sceneBounds = new THREE.Box3().setFromObject(keepGroup);
        sceneBounds.getCenter(sceneCenter);
        sceneBounds.getSize(sceneSize);

        console.log("Original Keep Hall bounds size:", sceneSize, "Center:", sceneCenter);

        // Calculate dynamic scale factor so max dimension is 45 units
        const maxDim = Math.max(sceneSize.x, sceneSize.y, sceneSize.z);
        const targetMaxDim = 45.0;
        const scaleFactor = targetMaxDim / maxDim;
        
        keepGroup.scale.set(scaleFactor, scaleFactor, scaleFactor);

        // Adjust keep alignment so center of hall is at global (0, y, 0)
        // We multiply center by scaleFactor because group meshes are scaled
        keepGroup.position.x = -sceneCenter.x * scaleFactor;
        keepGroup.position.z = -sceneCenter.z * scaleFactor;
        // Keep bottom at ground level (y=0)
        keepGroup.position.y = -sceneBounds.min.y * scaleFactor;

        // Recompute bounds after shifts
        sceneBounds.setFromObject(keepGroup);
        sceneBounds.getCenter(sceneCenter);
        sceneBounds.getSize(sceneSize);

        console.log("Scaled Keep Hall bounds size:", sceneSize, "Center:", sceneCenter);

        // Clear and rebuild fire light configurations for all 8 side fire bowls
        fireLights.length = 0;
        fireCoreMeshes.length = 0;
        fireBowlPositions.length = 0;

        keepGroup.traverse((child) => {
            if (child.name && child.name.startsWith('FireBowl')) {
                const bowlBox = new THREE.Box3().setFromObject(child);
                const bowlCenter = new THREE.Vector3();
                bowlBox.getCenter(bowlCenter);
                
                const fireHeight = bowlBox.max.y + 0.15;
                const pos = new THREE.Vector3(bowlCenter.x, fireHeight, bowlCenter.z);
                fireBowlPositions.push(pos);

                // Create flickering point light
                // Disable castShadow to keep rendering extremely fast with 8 point lights
                const light = new THREE.PointLight(0xff5500, 2.0, 18, 1.5);
                light.position.copy(pos);
                light.castShadow = false;
                scene.add(light);
                fireLights.push(light);

                // Add a small glowing sphere representing fire coals
                const geo = new THREE.SphereGeometry(0.20, 16, 16);
                const core = new THREE.Mesh(geo, fireCoreMaterial);
                core.position.copy(pos).y -= 0.06;
                scene.add(core);
                fireCoreMeshes.push(core);
            }
        });

        // Set fallback fireLightPos to the first fire bowl position if available
        if (fireBowlPositions.length > 0) {
            fireLightPos.copy(fireBowlPositions[0]);
        } else {
            fireLightPos.set(0, sceneSize.y * 0.18, 0);
        }

        // Initialize the Fire Embers Particle System once
        initFireEmbers();

        // Initialize atmospheric castle dust motes within keep dimensions
        initDustParticles(sceneCenter, sceneSize);

        // Calculate dynamic eye level height (eye level is slightly below center)
        eyeLevelY = sceneCenter.y - sceneSize.y * 0.15;

        // Restrict OrbitControls pan/zoom limits based on scaled keep size
        controls.target.copy(sceneCenter);
        controls.minDistance = 2.0; // Close zoom
        controls.maxDistance = targetMaxDim * 1.5; // Zoom out limit
        controls.update();

        // Enable enter action
        enterBtn.addEventListener('click', enterTheKeep);
    }

    /* ==========================================================================
       7. DYNAMIC CAMERA ANIMATIONS
       ========================================================================== */
    let introAnimationActive = false;
    let introStartTime = 0;
    const introDuration = 3200; // ms

    const camStartPos = new THREE.Vector3();
    const camEndPos = new THREE.Vector3();
    const targetStartPos = new THREE.Vector3();
    const targetEndPos = new THREE.Vector3();

    function enterTheKeep() {
        // Init synthesized audio
        initAudio();

        // Fade out Splash Screen
        splashScreen.classList.add('fade-out');
        uiOverlay.classList.add('visible');

        // Cinematic Entry Camera parameters
        const maxDim = Math.max(sceneSize.x, sceneSize.y, sceneSize.z);
        
        // Start from outside the hall entrance, looking in
        camStartPos.set(
            sceneCenter.x,
            sceneCenter.y + sceneSize.y * 0.6,
            sceneCenter.z + maxDim * 0.9
        );
        // End inside the hall at eye level, a moderate distance from the hearth
        camEndPos.set(
            sceneCenter.x,
            sceneCenter.y - sceneSize.y * 0.15,
            sceneCenter.z + sceneSize.z * 0.35
        );
        
        targetStartPos.copy(sceneCenter);
        targetEndPos.set(sceneCenter.x, fireLightPos.y, sceneCenter.z - sceneSize.z * 0.1);

        camera.position.copy(camStartPos);
        controls.target.copy(targetStartPos);
        controls.update();

        // Trigger loop animation switch
        introStartTime = performance.now();
        introAnimationActive = true;
    }

    // Smooth Click-to-Focus Object Animation state
    let focusAnimationActive = false;
    let focusStartTime = 0;
    const focusDuration = 1000; // ms
    const focusStartPos = new THREE.Vector3();
    const focusEndPos = new THREE.Vector3();
    const focusStartTarget = new THREE.Vector3();
    const focusEndTarget = new THREE.Vector3();

    function animateFocusToPoint(targetPoint, objectName) {
        focusStartPos.copy(camera.position);
        focusStartTarget.copy(controls.target);
        
        focusEndTarget.copy(targetPoint);
        
        // Push camera back along vector from hit mesh to camera
        const dir = new THREE.Vector3().subVectors(camera.position, targetPoint).normalize();
        
        // Focus distance scales with scene size
        const maxDim = Math.max(sceneSize.x, sceneSize.y, sceneSize.z);
        let dist = maxDim * 0.35;
        
        // FireBowl and smaller objects need a closer focus
        if (objectName.includes('Bowl')) {
            dist = maxDim * 0.18;
        } else if (objectName.includes('1.fbx') || objectName === '1') {
            dist = maxDim * 0.25;
        }
        
        focusEndPos.copy(targetPoint).addScaledVector(dir, dist);
        // Keep camera above floor level
        focusEndPos.y = Math.max(targetPoint.y + 1, focusEndPos.y);

        focusStartTime = performance.now();
        focusAnimationActive = true;
        introAnimationActive = false; // Override intro
    }

    /* ==========================================================================
       8. RAYCASTING & INTERACTION LOGIC
       ========================================================================== */
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

    function displayObjectDetails(fileName, point) {
        let title = "Ancient Architecture";
        let desc = "A piece of the Great Keep of the Realm, constructed with stone from Valyria.";

        const name = fileName.toLowerCase();
        if (name.includes('floor')) {
            title = "The Basalt Floor";
            desc = "A grand tiled floor composed of dark volcanic basalt. Worn smooth by the boots of countless knights, heralds, and lords who have sworn oaths of fealty in these halls.";
        } else if (name.includes('wall')) {
            title = "Walls of the Great Keep";
            desc = "Heavy stone brick barricades lined with ancient timber moldings. Built extra thick to lock in the stoke heat and withstand siege engines during the freezing winters.";
        } else if (name.includes('column') || name.includes('1.fbx') || name === '1') {
            title = "Pillars of the Ancients";
            desc = "Massive hand-sculpted granite pillars that frame the aisle. Each capital and base is trimmed with polished iron rings, holding up the vast vaulted ceiling.";
        } else if (name.includes('top')) {
            title = "The Arched Shingle Vault";
            desc = "An interlocking roof dome structured from overlapping slate tiles. Designed by master masons to echo court trumpets and focus daylight down onto the assembly floor.";
        } else if (name.includes('bowl') || name.includes('fire')) {
            title = "Hearth of Dragonglass";
            desc = "A forged black-iron firebowl stoking a deep orange flame. A centerpiece of the court, it burns constantly using magical coal as a sign of warm sanctuary.";
        }

        objectTitle.textContent = title.toUpperCase();
        objectDescription.textContent = desc;
        
        // Hide help if open
        helpCard.classList.add('hidden');
        // Show info card
        objectCard.classList.remove('hidden');

        // Smoothly focus camera onto clicked point
        animateFocusToPoint(point, fileName);
    }

    window.addEventListener('mousedown', (e) => {
        // Ignore clicks on HTML overlay containers
        if (e.target.closest('#ui-overlay') || e.target.closest('#splash-screen')) return;

        // Calculate normalized device coordinates
        mouse.x = (e.clientX / window.innerWidth) * 2 - 1;
        mouse.y = -(e.clientY / window.innerHeight) * 2 + 1;

        raycaster.setFromCamera(mouse, camera);
        
        // Intersect meshes inside keepGroup
        const intersects = raycaster.intersectObjects(keepGroup.children, true);

        if (intersects.length > 0) {
            const hitObj = intersects[0].object;
            const fbxFile = getFBXName(hitObj);
            displayObjectDetails(fbxFile, intersects[0].point);
        }
    });

    // Close cards logic
    objectClose.addEventListener('click', () => objectCard.classList.add('hidden'));
    helpClose.addEventListener('click', () => helpCard.classList.add('hidden'));
    
    // Toggle Help Overlay
    controlsToggle.addEventListener('click', () => {
        objectCard.classList.add('hidden');
        helpCard.classList.toggle('hidden');
    });

    /* ==========================================================================
       9. PARCHMENT SCROLL & RSVP INTERACTIONS
       ========================================================================== */
    // Open/Close Scroll Invitation
    scrollToggle.addEventListener('click', () => {
        const isHidden = scrollOverlay.classList.contains('hidden');
        if (isHidden) {
            scrollOverlay.classList.remove('hidden');
            scrollToggle.textContent = "Close Summons";
        } else {
            scrollOverlay.classList.add('hidden');
            scrollToggle.textContent = "Read Summons";
        }
    });

    // Close scroll on outer background click
    scrollOverlay.addEventListener('click', (e) => {
        if (e.target === scrollOverlay) {
            scrollOverlay.classList.add('hidden');
            scrollToggle.textContent = "Read Summons";
        }
    });

    // Trigger RSVP Modal inside scroll
    btnRsvpTrigger.addEventListener('click', () => {
        scrollOverlay.classList.add('hidden');
        scrollToggle.textContent = "Read Summons";
        
        rsvpModal.classList.remove('hidden');
        rsvpForm.classList.remove('hidden');
        rsvpSuccess.classList.add('hidden');
    });

    // Close RSVP Modal
    rsvpClose.addEventListener('click', () => rsvpModal.classList.add('hidden'));
    rsvpModal.addEventListener('click', (e) => {
        if (e.target === rsvpModal) rsvpModal.classList.add('hidden');
    });

    // RSVP Form Submission
    rsvpForm.addEventListener('submit', (e) => {
        e.preventDefault();
        
        const guestName = document.getElementById('rsvp-name').value;
        const selectedHouse = document.getElementById('rsvp-house');
        const houseText = selectedHouse.options[selectedHouse.selectedIndex].text;
        const status = document.querySelector('input[name="rsvp-status"]:checked').value;
        
        // Hide inputs, animate checkmark
        rsvpForm.classList.add('hidden');
        rsvpSuccess.classList.remove('hidden');
        
        if (status === 'accept') {
            rsvpSuccessText.textContent = `A raven is sent to ${houseText}. The roster has been marked for the arrival of ${guestName}.`;
        } else {
            rsvpSuccessText.textContent = `Regrets have been received from ${guestName}. Your absence has been chronicled in the scrolls of ${houseText}.`;
        }
    });

    /* ==========================================================================
       10. SPLASH BACKGROUND CANVAS PARTICLES (SNOW FALL)
       ========================================================================== */
    const splashCanvas = document.getElementById('splash-particles');
    const splashCtx = splashCanvas.getContext('2d');
    let splashParticles = [];

    function resizeSplashCanvas() {
        splashCanvas.width = window.innerWidth;
        splashCanvas.height = window.innerHeight;
    }
    
    resizeSplashCanvas();
    window.addEventListener('resize', resizeSplashCanvas);

    class SplashSnow {
        constructor() {
            this.reset();
        }
        reset() {
            this.x = Math.random() * splashCanvas.width;
            this.y = -Math.random() * 50;
            this.size = 1 + Math.random() * 2.8;
            this.speedY = 0.5 + Math.random() * 0.9;
            this.speedX = (Math.random() - 0.5) * 0.4;
            this.alpha = 0.2 + Math.random() * 0.45;
            this.angle = Math.random() * 10;
        }
        update() {
            this.y += this.speedY;
            this.x += this.speedX + Math.sin(this.angle) * 0.08;
            this.angle += 0.01;
            if (this.y > splashCanvas.height || this.x < 0 || this.x > splashCanvas.width) {
                this.reset();
            }
        }
        draw() {
            splashCtx.beginPath();
            splashCtx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
            splashCtx.fillStyle = `rgba(235, 220, 185, ${this.alpha})`;
            splashCtx.fill();
        }
    }

    // Populate particles
    for (let i = 0; i < 60; i++) {
        splashParticles.push(new SplashSnow());
    }

    function animateSplash() {
        if (splashScreen.classList.contains('fade-out')) return; // Stop after entering
        splashCtx.clearRect(0, 0, splashCanvas.width, splashCanvas.height);
        splashParticles.forEach(p => {
            p.update();
            p.draw();
        });
        requestAnimationFrame(animateSplash);
    }
    requestAnimationFrame(animateSplash);

    /* ==========================================================================
       11. RENDER & UPDATE ANIMATION LOOP
       ========================================================================== */
    const clock = new THREE.Clock();
    
    function renderLoop() {
        requestAnimationFrame(renderLoop);

        const delta = Math.min(clock.getDelta(), 0.1); // Clamp delta to prevent big jumps

        // Update particle systems
        updateFireEmbers(delta);
        updateDustParticles(delta);

        // A. Hearth Flicker Light effect for all side fire lights
        if (fireLights.length > 0) {
            const time = performance.now() * 0.005;
            
            fireLights.forEach((light, i) => {
                const localTime = time + i * 12.3;
                const localNoise = Math.sin(localTime * 3.3) * Math.cos(localTime * 1.5) * 0.18 + (Math.random() - 0.5) * 0.05;
                
                light.intensity = 1.8 + localNoise * 0.8;
                light.distance = 18 + localNoise * 3;

                const core = fireCoreMeshes[i];
                if (core) {
                    const s = 1.0 + localNoise * 0.12;
                    core.scale.set(s, s, s);
                }
            });
        }

        // B. Dynamic Cinematic Intro Camera Animation
        if (introAnimationActive) {
            const now = performance.now();
            const elapsed = (now - introStartTime) / introDuration;
            
            if (elapsed >= 1) {
                introAnimationActive = false;
                camera.position.copy(camEndPos);
                controls.target.copy(targetEndPos);
                
                // Transition into first-person controls mode
                controls.enabled = false;
                syncYawPitchFromCamera();
            } else {
                // Cubic ease-out
                const t = 1 - Math.pow(1 - elapsed, 3);
                
                camera.position.lerpVectors(camStartPos, camEndPos, t);
                controls.target.lerpVectors(targetStartPos, targetEndPos, t);
            }
            camera.lookAt(controls.target);
        }

        // C. Smooth Focus-to-Object Animation
        if (focusAnimationActive) {
            const now = performance.now();
            const elapsed = (now - focusStartTime) / focusDuration;

            if (elapsed >= 1) {
                focusAnimationActive = false;
                camera.position.copy(focusEndPos);
                controls.target.copy(focusEndTarget);
                
                // Sync first-person angles once focused so movement feels continuous
                syncYawPitchFromCamera();
            } else {
                // Quintic ease-out
                const t = 1 - Math.pow(1 - elapsed, 5);
                camera.position.lerpVectors(focusStartPos, focusEndPos, t);
                controls.target.lerpVectors(focusStartTarget, focusEndTarget, t);
            }
            camera.lookAt(controls.target);
        }

        // D. First-Person Camera Navigation (WASD walking and mouse drag look-around)
        if (!introAnimationActive && !focusAnimationActive) {
            // 1. Walk movement based on keyboard keys
            const forward = new THREE.Vector3(
                Math.sin(cameraYaw),
                0,
                -Math.cos(cameraYaw)
            ).normalize();
            
            const right = new THREE.Vector3(
                Math.cos(cameraYaw),
                0,
                Math.sin(cameraYaw)
            ).normalize();

            const moveDir = new THREE.Vector3(0, 0, 0);
            
            if (keysPressed['w'] || keysPressed['arrowup']) moveDir.add(forward);
            if (keysPressed['s'] || keysPressed['arrowdown']) moveDir.sub(forward);
            if (keysPressed['d'] || keysPressed['arrowright']) moveDir.add(right);
            if (keysPressed['a'] || keysPressed['arrowleft']) moveDir.sub(right);
            
            if (moveDir.lengthSq() > 0) {
                moveDir.normalize();
                
                // Walking speed
                const moveSpeed = 12.0; 
                camera.position.addScaledVector(moveDir, moveSpeed * delta);
                
                // Outer wall collision bounds (clamping camera inside the room)
                const clampX = sceneSize.x * 0.45;
                const clampZ = sceneSize.z * 0.45;
                camera.position.x = Math.max(sceneCenter.x - clampX, Math.min(sceneCenter.x + clampX, camera.position.x));
                camera.position.z = Math.max(sceneCenter.z - clampZ, Math.min(sceneCenter.z + clampZ, camera.position.z));
                
                // Return camera height back to calibrated eye level
                camera.position.y += (eyeLevelY - camera.position.y) * 0.05;
            }

            // 2. Hearth fireplace collision check (prevent walking directly through the fire)
            const hearthCenter = new THREE.Vector3(0, camera.position.y, 0);
            const distToHearth = camera.position.distanceTo(hearthCenter);
            if (distToHearth < 2.0) {
                const pushDir = new THREE.Vector3().subVectors(camera.position, hearthCenter);
                pushDir.y = 0;
                pushDir.normalize();
                camera.position.x = pushDir.x * 2.0;
                camera.position.z = pushDir.z * 2.0;
            }

            // 3. Rotation update from Yaw & Pitch
            const targetDirection = new THREE.Vector3(
                Math.sin(cameraYaw) * Math.cos(cameraPitch),
                Math.sin(cameraPitch),
                -Math.cos(cameraYaw) * Math.cos(cameraPitch)
            );
            
            const targetPoint = new THREE.Vector3().copy(camera.position).add(targetDirection);
            camera.lookAt(targetPoint);
            
            // Keep OrbitControls target in sync in case it gets re-enabled or used by other features
            controls.target.copy(targetPoint);
        }

        // Make sure OrbitControls only updates when active/enabled
        if (controls.enabled) {
            controls.update();
        }
        renderer.render(scene, camera);
    }
    requestAnimationFrame(renderLoop);

    // Responsive Canvas Resize
    window.addEventListener('resize', () => {
        camera.aspect = window.innerWidth / window.innerHeight;
        camera.updateProjectionMatrix();
        renderer.setSize(window.innerWidth, window.innerHeight);
    });
});
