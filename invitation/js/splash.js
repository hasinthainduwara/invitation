import { state } from './state.js';
import { dom } from './dom.js';

class SplashSnow {
    constructor() {
        this.reset();
    }
    reset() {
        this.x = Math.random() * state.splashCanvas.width;
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
        if (this.y > state.splashCanvas.height || this.x < 0 || this.x > state.splashCanvas.width) {
            this.reset();
        }
    }
    draw() {
        state.splashCtx.beginPath();
        state.splashCtx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
        state.splashCtx.fillStyle = `rgba(235, 220, 185, ${this.alpha})`;
        state.splashCtx.fill();
    }
}

function resizeSplashCanvas() {
    state.splashCanvas.width = window.innerWidth;
    state.splashCanvas.height = window.innerHeight;
}

function animateSplash() {
    if (dom.splashScreen.classList.contains('fade-out')) return;
    state.splashCtx.clearRect(0, 0, state.splashCanvas.width, state.splashCanvas.height);
    state.splashParticles.forEach(p => {
        p.update();
        p.draw();
    });
    requestAnimationFrame(animateSplash);
}

export function initSplash() {
    state.splashCanvas = document.getElementById('splash-particles');
    state.splashCtx = state.splashCanvas.getContext('2d');

    resizeSplashCanvas();
    window.addEventListener('resize', resizeSplashCanvas);

    for (let i = 0; i < 60; i++) {
        state.splashParticles.push(new SplashSnow());
    }

    requestAnimationFrame(animateSplash);
}
