import { state } from './state.js';
import { perf } from './perf.js';

/* Soft round mote with a bright core (alpha mask for each sparkle). */
function makeSparkTexture() {
    const canvas = document.createElement('canvas');
    canvas.width = 32;
    canvas.height = 32;
    const ctx = canvas.getContext('2d');
    const grad = ctx.createRadialGradient(16, 16, 0, 16, 16, 16);
    grad.addColorStop(0.0, 'rgba(255,255,255,1.0)');
    grad.addColorStop(0.3, 'rgba(255,255,255,0.55)');
    grad.addColorStop(1.0, 'rgba(255,255,255,0.0)');
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, 32, 32);
    return new THREE.CanvasTexture(canvas);
}

const VERT = `
    uniform float uScale;
    attribute float aAlpha;
    attribute float aSize;
    attribute vec3 aColor;
    varying float vAlpha;
    varying vec3 vColor;
    void main() {
        vAlpha = aAlpha;
        vColor = aColor;
        vec4 mv = modelViewMatrix * vec4(position, 1.0);
        gl_PointSize = min(aSize * uScale / max(-mv.z, 0.1), 38.0);
        gl_Position = projectionMatrix * mv;
    }
`;

const FRAG = `
    uniform sampler2D uTex;
    varying float vAlpha;
    varying vec3 vColor;
    void main() {
        float a = texture2D(uTex, gl_PointCoord).a;
        gl_FragColor = vec4(vColor, a * vAlpha);
    }
`;

/* Elegant enchanted swirl above the scroll. Sparkles rise, funnel inward
   and twinkle individually; colours blend warm firelight gold with cool
   moonlight blue so the effect sits naturally in the night-blue hall.
   `center` is the scroll's world position, `size` its bounding-box size. */
export function initMagicParticles(center, size) {
    state.magicCenter = center.clone();

    const unit = Math.max(size.x, size.y, size.z) || 1;
    state.magicRadius = unit * 0.55;
    state.magicHeight = unit * 2.4;
    state.magicBaseY = size.y * 0.45;

    const count = perf.magicCount;
    const positions = new Float32Array(count * 3);
    const alphas = new Float32Array(count);
    const sizes = new Float32Array(count);
    const colors = new Float32Array(count * 3);

    const warm = new THREE.Color(0xffcf8a); // firelight gold
    const cool = new THREE.Color(0x9fc2f0); // moonlight blue
    const tmp = new THREE.Color();

    state.magicData = [];

    for (let i = 0; i < count; i++) {
        state.magicData.push({
            angle: Math.random() * Math.PI * 2,
            radius: state.magicRadius * (0.2 + Math.random() * 0.8),
            orbit: (0.5 + Math.random() * 1.0) * (Math.random() < 0.5 ? -1 : 1),
            life: Math.random(),                    // start staggered
            maxLife: 2.6 + Math.random() * 2.4,
            twinkle: Math.random() * Math.PI * 2
        });

        // Mostly warm with occasional cool sparks for a magical shimmer
        tmp.copy(warm).lerp(cool, Math.pow(Math.random(), 1.6) * 0.85);
        colors[i * 3] = tmp.r;
        colors[i * 3 + 1] = tmp.g;
        colors[i * 3 + 2] = tmp.b;

        sizes[i] = unit * (0.10 + Math.random() * 0.16);
    }

    const geo = new THREE.BufferGeometry();
    geo.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    geo.setAttribute('aAlpha', new THREE.BufferAttribute(alphas, 1));
    geo.setAttribute('aSize', new THREE.BufferAttribute(sizes, 1));
    geo.setAttribute('aColor', new THREE.BufferAttribute(colors, 3));

    const mat = new THREE.ShaderMaterial({
        uniforms: {
            uTex: { value: makeSparkTexture() },
            uScale: { value: 620.0 }
        },
        vertexShader: VERT,
        fragmentShader: FRAG,
        transparent: true,
        blending: THREE.AdditiveBlending,
        depthWrite: false,
        depthTest: true
    });

    state.magicPoints = new THREE.Points(geo, mat);
    state.magicPoints.frustumCulled = false;
    state.scene.add(state.magicPoints);

    // Soft aura behind the scroll to make it glow gently
    const glowMat = new THREE.SpriteMaterial({
        map: makeSparkTexture(),
        color: 0xffc070,
        transparent: true,
        opacity: 0.22,
        blending: THREE.AdditiveBlending,
        depthWrite: false,
        fog: false
    });
    const glow = new THREE.Sprite(glowMat);
    glow.scale.setScalar(unit * 2.6);
    glow.position.copy(center).y += size.y * 0.5;
    state.magicGlow = glow;
    state.scene.add(glow);
}

export function updateMagicParticles(delta) {
    if (!state.magicPoints) return;

    const geo = state.magicPoints.geometry;
    const pos = geo.attributes.position.array;
    const al = geo.attributes.aAlpha.array;
    const c = state.magicCenter;
    const now = performance.now();

    for (let i = 0; i < state.magicData.length; i++) {
        const d = state.magicData[i];
        d.life += delta;
        if (d.life > d.maxLife) {
            d.life = 0;
            d.angle = Math.random() * Math.PI * 2;
            d.radius = state.magicRadius * (0.2 + Math.random() * 0.8);
        }

        const t = d.life / d.maxLife;       // 0 -> 1 over its lifetime
        d.angle += d.orbit * delta;

        const r = d.radius * (1 - t * 0.7); // funnel inward as it rises
        pos[i * 3] = c.x + Math.cos(d.angle) * r;
        pos[i * 3 + 1] = c.y + state.magicBaseY + t * state.magicHeight;
        pos[i * 3 + 2] = c.z + Math.sin(d.angle) * r;

        // Fade in quickly, fade out near the top, plus a per-spark twinkle
        let a = Math.min(t / 0.18, 1.0) * (1.0 - Math.max(0, (t - 0.6) / 0.4));
        a *= 0.55 + 0.45 * Math.sin(now * 0.006 + d.twinkle);
        al[i] = a < 0 ? 0 : a;
    }

    geo.attributes.position.needsUpdate = true;
    geo.attributes.aAlpha.needsUpdate = true;

    if (state.magicGlow) {
        const pulse = 0.18 + 0.10 * Math.sin(now * 0.0018);
        state.magicGlow.material.opacity = pulse;
    }
}
