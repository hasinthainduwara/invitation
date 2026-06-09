/* Device capability tier detection.
   Picks one quality tier at load time and exposes scaled settings so the rest
   of the app can dial back GPU/CPU cost on weak mobile hardware WITHOUT changing
   the look of the scene in any obvious way (same lights, same effects, just
   lighter shadows / fewer redundant particles / lower oversampling). */

function detectTier() {
    const ua = navigator.userAgent || '';
    const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini|Mobile/i.test(ua)
        || (navigator.maxTouchPoints > 1 && /Macintosh/.test(ua)); // iPadOS reports as Mac

    if (!isMobile) return 'high';

    // Rough proxies for raw power. Both are undefined on some browsers, so we
    // fall back to "mid" (safe middle ground) rather than assuming the worst.
    const cores = navigator.hardwareConcurrency || 4;
    const mem = navigator.deviceMemory || 4; // GB, Chrome-only

    if (cores <= 4 || mem <= 3) return 'low';
    return 'mid';
}

const tier = detectTier();

const PRESETS = {
    high: {
        antialias: true,
        pixelRatioCap: 2,
        shadows: true,
        shadowMapSize: 2048,
        softShadows: true,
        emberCount: 90,
        dustCount: 180,
        magicCount: 55
    },
    mid: {
        antialias: true,
        pixelRatioCap: 1.75,
        shadows: true,
        shadowMapSize: 1024,
        softShadows: true,
        emberCount: 60,
        dustCount: 100,
        magicCount: 40
    },
    low: {
        antialias: false,        // MSAA is one of the biggest mobile GPU costs
        pixelRatioCap: 1.25,     // weak GPUs choke on full-res retina buffers
        shadows: true,
        shadowMapSize: 1024,
        softShadows: false,      // single-tap PCF instead of soft 9-tap
        emberCount: 40,
        dustCount: 60,
        magicCount: 28
    }
};

export const perf = Object.assign({ tier, isLowSpec: tier === 'low' }, PRESETS[tier]);

console.log(`[PERF] Device tier: ${tier}`, perf);
