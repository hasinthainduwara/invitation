import { state } from './state.js';
import { dom } from './dom.js';
import { getMaterialForFBX } from './materials.js';
import { initFireEmbers, initDustParticles } from './particles.js';
import { enterTheKeep } from './camera.js';

const fbxFiles = [
    'Floor2.fbx',
    'wall1.fbx',
    'Column1.fbx',
    'BigColumn.fbx',
    '1.fbx',
    'top2.fbx',
    'FireBowl.fbx'
];

export function initFbxLoader() {
    const loadingManager = new THREE.LoadingManager();
    const fbxLoader = new THREE.FBXLoader(loadingManager);
    const textureLoader = new THREE.TextureLoader(loadingManager);
    const wallTexture = textureLoader.load('assets/objects/wall1_DefaultMaterial_BaseColor.png');
    wallTexture.encoding = THREE.sRGBEncoding;

    state.wallMaterial = new THREE.MeshStandardMaterial({
        map: wallTexture,
        roughness: 0.85,
        metalness: 0.1,
        side: THREE.DoubleSide
    });

    loadingManager.onProgress = (url, itemsLoaded, itemsTotal) => {
        const percentage = Math.round((itemsLoaded / itemsTotal) * 100);
        dom.progressBar.style.width = `${percentage}%`;
        dom.loadingPercentage.textContent = `${percentage}%`;

        const filename = url.substring(url.lastIndexOf('/') + 1);
        if (filename) {
            dom.loadingText.textContent = `Fortifying ${filename}...`;
        }
    };

    loadingManager.onLoad = () => {
        dom.loadingText.textContent = "Great Keep Prepared.";
        dom.loadingPercentage.textContent = "100%";

        setTimeout(() => {
            dom.progressWrapper.classList.add('fade-out');
            dom.enterBtn.classList.remove('hidden');
            dom.enterBtn.style.animation = "fadeInLettering 1s ease forwards";
        }, 300);

        assembleHall();
        calibrateScene();
    };

    loadingManager.onError = (url) => {
        console.warn(`Error loading asset: ${url}`);
        if (url.toLowerCase().endsWith('.fbx')) {
            dom.loadingText.textContent = "Error stoking the hearth. Check console.";
        }
    };

    fbxFiles.forEach((file) => {
        fbxLoader.load(`assets/objects/${file}`, (fbx) => {
            fbx.name = file;
            fbx.userData = { fileName: file };

            fbx.traverse((child) => {
                if (child.isMesh) {
                    child.castShadow = true;
                    child.receiveShadow = true;
                    child.userData = { fileName: file };
                    child.material = getMaterialForFBX(file);
                }
            });

            const box = new THREE.Box3().setFromObject(fbx);
            const center = new THREE.Vector3();
            box.getCenter(center);

            fbx.position.set(-center.x, -center.y, -center.z);

            const container = new THREE.Group();
            container.name = file;
            container.userData = { fileName: file };
            container.add(fbx);

            const size = new THREE.Vector3();
            box.getSize(size);
            container.userData.originalSize = size;
            container.userData.originalCenter = center.clone();

            state.loadedFBX[file] = container;
            state.loadedCount++;

            console.log(`[FBX LOADED] ${file}: size=(${size.x.toFixed(1)}, ${size.y.toFixed(1)}, ${size.z.toFixed(1)})`);
        }, undefined, (err) => {
            console.error(`Failed to load ${file}:`, err);
        });
    });
}

function assembleHall() {
    const floor = state.loadedFBX['Floor2.fbx'];
    const wall = state.loadedFBX['wall1.fbx'];
    const column1 = state.loadedFBX['Column1.fbx'];
    const bigColumn = state.loadedFBX['BigColumn.fbx'];
    const pillar = state.loadedFBX['1.fbx'];
    const roof = state.loadedFBX['top2.fbx'];
    const fireBowl = state.loadedFBX['FireBowl.fbx'];

    const floorSize = floor.userData.originalSize;
    const wallSize = wall.userData.originalSize;
    const col1Size = column1.userData.originalSize;
    const bigColSize = bigColumn.userData.originalSize;
    const pillarSize = pillar.userData.originalSize;
    const roofSize = roof.userData.originalSize;
    const bowlSize = fireBowl.userData.originalSize;

    floor.position.set(0, -floorSize.y / 2, 0);
    state.keepGroup.add(floor);

    const halfFloorX = floorSize.x / 2;
    const halfFloorZ = floorSize.z / 2;

    const bigColInsetX = halfFloorX * 0.85;
    const sideWallInsetX = bigColInsetX;

    const zColumnPositions = [1800, 600, -600, -1800];
    const zSideWallPositions = [1200, 0, -1200];

    zColumnPositions.forEach((zPos, index) => {
        const colL = bigColumn.clone();
        colL.name = `BigColumn_Left_${index}`;
        colL.userData = { fileName: 'BigColumn.fbx' };
        colL.position.set(-bigColInsetX, bigColSize.y / 2, zPos);
        state.keepGroup.add(colL);

        const colR = bigColumn.clone();
        colR.name = `BigColumn_Right_${index}`;
        colR.userData = { fileName: 'BigColumn.fbx' };
        colR.position.set(bigColInsetX, bigColSize.y / 2, zPos);
        state.keepGroup.add(colR);
    });

    zSideWallPositions.forEach((zPos, index) => {
        const wallL = wall.clone();
        wallL.name = `SideWall_Left_${index}`;
        wallL.userData = { fileName: 'wall1.fbx' };
        wallL.position.set(-sideWallInsetX, wallSize.y / 2, zPos);
        wallL.rotation.y = -Math.PI / 2;
        state.keepGroup.add(wallL);

        const wallR = wall.clone();
        wallR.name = `SideWall_Right_${index}`;
        wallR.userData = { fileName: 'wall1.fbx' };
        wallR.position.set(sideWallInsetX, wallSize.y / 2, zPos);
        wallR.rotation.y = Math.PI / 2;
        state.keepGroup.add(wallR);
    });

    const backWallZ = -1966;

    const wallB_Center = wall.clone();
    wallB_Center.name = 'BackWall_Center';
    wallB_Center.userData = { fileName: 'wall1.fbx' };
    wallB_Center.position.set(0, wallSize.y / 2, backWallZ);
    state.keepGroup.add(wallB_Center);

    const wallB_Left = wall.clone();
    wallB_Left.name = 'BackWall_Left';
    wallB_Left.userData = { fileName: 'wall1.fbx' };
    wallB_Left.position.set(-700, wallSize.y / 2, backWallZ + 2);
    state.keepGroup.add(wallB_Left);

    const wallB_Right = wall.clone();
    wallB_Right.name = 'BackWall_Right';
    wallB_Right.userData = { fileName: 'wall1.fbx' };
    wallB_Right.position.set(700, wallSize.y / 2, backWallZ + 2);
    state.keepGroup.add(wallB_Right);

    const colInsetX = halfFloorX * 0.3;
    const colInsetZ = halfFloorZ * 0.35;

    const col1 = column1.clone();
    col1.name = 'Column1.fbx';
    col1.userData = { fileName: 'Column1.fbx' };
    col1.position.set(-colInsetX, col1Size.y / 2, colInsetZ);
    state.keepGroup.add(col1);

    const col2 = column1.clone();
    col2.name = 'Column1.fbx';
    col2.userData = { fileName: 'Column1.fbx' };
    col2.position.set(colInsetX, col1Size.y / 2, colInsetZ);
    state.keepGroup.add(col2);

    const col3 = column1.clone();
    col3.name = 'Column1.fbx';
    col3.userData = { fileName: 'Column1.fbx' };
    col3.position.set(-colInsetX, col1Size.y / 2, -colInsetZ);
    state.keepGroup.add(col3);

    const col4 = column1.clone();
    col4.name = 'Column1.fbx';
    col4.userData = { fileName: 'Column1.fbx' };
    col4.position.set(colInsetX, col1Size.y / 2, -colInsetZ);
    state.keepGroup.add(col4);

    roof.position.set(0, col1Size.y + roofSize.y / 2, 0);
    state.keepGroup.add(roof);

    pillar.position.set(0, pillarSize.y / 2, 0);
    state.keepGroup.add(pillar);

    zColumnPositions.forEach((zPos, index) => {
        const bowlL = fireBowl.clone();
        bowlL.name = `FireBowl_Left_${index}`;
        bowlL.userData = { fileName: 'FireBowl.fbx' };
        bowlL.position.set(-760, bowlSize.y / 2 + 800, zPos);
        state.keepGroup.add(bowlL);

        const bowlR = fireBowl.clone();
        bowlR.name = `FireBowl_Right_${index}`;
        bowlR.userData = { fileName: 'FireBowl.fbx' };
        bowlR.position.set(740, bowlSize.y / 2 + 800, zPos);
        state.keepGroup.add(bowlR);
    });

    console.log('[ASSEMBLY] Hall assembled with all components positioned relative to floor.');
}

function calibrateScene() {
    state.sceneBounds = new THREE.Box3().setFromObject(state.keepGroup);
    state.sceneBounds.getCenter(state.sceneCenter);
    state.sceneBounds.getSize(state.sceneSize);

    console.log("Original Keep Hall bounds size:", state.sceneSize, "Center:", state.sceneCenter);

    const maxDim = Math.max(state.sceneSize.x, state.sceneSize.y, state.sceneSize.z);
    const targetMaxDim = 45.0;
    const scaleFactor = targetMaxDim / maxDim;

    state.keepGroup.scale.set(scaleFactor, scaleFactor, scaleFactor);
    state.keepGroup.position.x = -state.sceneCenter.x * scaleFactor;
    state.keepGroup.position.z = -state.sceneCenter.z * scaleFactor;
    state.keepGroup.position.y = -state.sceneBounds.min.y * scaleFactor;

    state.sceneBounds.setFromObject(state.keepGroup);
    state.sceneBounds.getCenter(state.sceneCenter);
    state.sceneBounds.getSize(state.sceneSize);

    console.log("Scaled Keep Hall bounds size:", state.sceneSize, "Center:", state.sceneCenter);

    state.fireLights.length = 0;
    state.fireCoreMeshes.length = 0;
    state.fireBowlPositions.length = 0;

    state.keepGroup.traverse((child) => {
        if (child.name && child.name.startsWith('FireBowl')) {
            const bowlBox = new THREE.Box3().setFromObject(child);
            const bowlCenter = new THREE.Vector3();
            bowlBox.getCenter(bowlCenter);

            const fireHeight = bowlBox.max.y + 0.15;
            const pos = new THREE.Vector3(bowlCenter.x, fireHeight, bowlCenter.z);
            state.fireBowlPositions.push(pos);

            const light = new THREE.PointLight(0xff5500, 2.0, 18, 1.5);
            light.position.copy(pos);
            light.castShadow = false;
            state.scene.add(light);
            state.fireLights.push(light);

            const geo = new THREE.SphereGeometry(0.20, 16, 16);
            const core = new THREE.Mesh(geo, state.fireCoreMaterial);
            core.position.copy(pos).y -= 0.06;
            state.scene.add(core);
            state.fireCoreMeshes.push(core);
        }
    });

    if (state.fireBowlPositions.length > 0) {
        state.fireLightPos.copy(state.fireBowlPositions[0]);
    } else {
        state.fireLightPos.set(0, state.sceneSize.y * 0.18, 0);
    }

    initFireEmbers();
    initDustParticles(state.sceneCenter, state.sceneSize);

    state.eyeLevelY = state.sceneCenter.y - state.sceneSize.y * 0.30;

    state.controls.target.copy(state.sceneCenter);
    state.controls.minDistance = 2.0;
    state.controls.maxDistance = targetMaxDim * 1.5;
    state.controls.update();

    dom.enterBtn.addEventListener('click', enterTheKeep);
}