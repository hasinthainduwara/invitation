import { initDom } from './dom.js';
import { initAudioUI } from './audio.js';
import { initMaterials } from './materials.js';
import { initScene } from './scene.js';
import { initControls } from './controls.js';
import { initFbxLoader } from './fbx-loader.js';
import { initInteraction } from './interaction.js';
import { initUI } from './ui.js';
import { initSplash } from './splash.js';
import { startRenderLoop } from './render-loop.js';
import { initMobileControls } from './mobile-controls.js';

document.addEventListener('DOMContentLoaded', () => {
    initDom();
    initScene();
    initMaterials();
    initControls();
    initAudioUI();
    initFbxLoader();
    initInteraction();
    initUI();
    initSplash();
    initMobileControls();
    startRenderLoop();
});

