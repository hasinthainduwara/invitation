/* ==========================================================================
   GAME OF THRONES THEMED INVITATION JAVASCRIPT
   ========================================================================== */

document.addEventListener('DOMContentLoaded', () => {
    // DOM Elements
    const introScreen = document.getElementById('intro-screen');
    const sealButton = document.getElementById('seal-button');
    const mainContainer = document.getElementById('main-container');
    const audioToggle = document.getElementById('audio-toggle');

    // Countdown Timer Target Date: Saturday, October 24th, 2026, at 17:00 (5:00 PM)
    const targetDate = new Date('2026-10-24T17:00:00').getTime();

    /* ==========================================================================
       1. INTRO SCREEN & SEAL BREAKING
       ========================================================================== */
    sealButton.addEventListener('click', () => {
        // Play seal break synth sound
        playWaxBreakSound();
        
        // Add class to trigger CSS scaling and unfolding animation
        introScreen.classList.add('unsealing');
        
        // After animations complete, show main container and start soundscape
        setTimeout(() => {
            introScreen.classList.add('unsealed');
            mainContainer.classList.remove('hidden');
            
            // Fade-in the content
            setTimeout(() => {
                mainContainer.classList.add('visible');
                // Display and setup audio button
                audioToggle.classList.remove('hidden');
                initAudio();
                enableAudio();
            }, 50);
        }, 1200);
    });

    /* ==========================================================================
       2. WEB AUDIO API SYNTH AMBIENT ENGINE
       ========================================================================== */
    let audioCtx = null;
    let masterGain = null;
    let droneOsc = null;
    let filterNode = null;
    let chordInterval = null;
    let isMuted = false;

    // Cinematic chord progression (A minor, F major, D minor, G major)
    const chords = [
        [110.00, 130.81, 164.81], // Am (A2, C3, E3)
        [87.31, 130.81, 174.61],  // F (F2, C3, F3)
        [146.83, 174.61, 220.00], // Dm (D3, F3, A3)
        [98.00, 146.83, 196.00]   // G (G2, D3, G3)
    ];
    let chordIndex = 0;

    function initAudio() {
        if (audioCtx) return;
        
        audioCtx = new (window.AudioContext || window.webkitAudioContext)();
        masterGain = audioCtx.createGain();
        masterGain.gain.setValueAtTime(0.001, audioCtx.currentTime); // start silent
        masterGain.connect(audioCtx.destination);
        
        // Low ambient drone
        droneOsc = audioCtx.createOscillator();
        droneOsc.type = 'sawtooth';
        droneOsc.frequency.setValueAtTime(55.0, audioCtx.currentTime); // A1 note
        
        const droneGain = audioCtx.createGain();
        droneGain.gain.setValueAtTime(0.08, audioCtx.currentTime);
        
        filterNode = audioCtx.createBiquadFilter();
        filterNode.type = 'lowpass';
        filterNode.frequency.setValueAtTime(95, audioCtx.currentTime);
        filterNode.Q.setValueAtTime(3.0, audioCtx.currentTime);
        
        droneOsc.connect(filterNode);
        filterNode.connect(droneGain);
        droneGain.connect(masterGain);
        
        droneOsc.start();
        
        // Slow cinematic chords cycle
        playChordCycle();
        chordInterval = setInterval(playChordCycle, 7000);
    }

    function playWaxBreakSound() {
        try {
            const tempCtx = new (window.AudioContext || window.webkitAudioContext)();
            const now = tempCtx.currentTime;
            
            // 1. Low rumble
            const rumble = tempCtx.createOscillator();
            rumble.type = 'triangle';
            rumble.frequency.setValueAtTime(100, now);
            rumble.frequency.exponentialRampToValueAtTime(10, now + 0.6);
            
            const rumbleGain = tempCtx.createGain();
            rumbleGain.gain.setValueAtTime(0.4, now);
            rumbleGain.gain.exponentialRampToValueAtTime(0.001, now + 0.6);
            
            rumble.connect(rumbleGain);
            rumbleGain.connect(tempCtx.destination);
            rumble.start();
            rumble.stop(now + 0.6);
            
            // 2. High snap (wax cracking)
            const snap = tempCtx.createOscillator();
            snap.type = 'sawtooth';
            snap.frequency.setValueAtTime(1200, now);
            snap.frequency.exponentialRampToValueAtTime(600, now + 0.15);
            
            const snapGain = tempCtx.createGain();
            snapGain.gain.setValueAtTime(0.15, now);
            snapGain.gain.exponentialRampToValueAtTime(0.001, now + 0.15);
            
            snap.connect(snapGain);
            snapGain.connect(tempCtx.destination);
            snap.start();
            snap.stop(now + 0.15);
        } catch (e) {
            console.warn("Audio Context not allowed yet", e);
        }
    }

    function playChordCycle() {
        if (!audioCtx || isMuted || audioCtx.state === 'suspended') return;
        
        const now = audioCtx.currentTime;
        const chord = chords[chordIndex];
        chordIndex = (chordIndex + 1) % chords.length;
        
        chord.forEach((freq, idx) => {
            const osc = audioCtx.createOscillator();
            osc.type = 'triangle';
            // Detune slightly for chorusing effect
            osc.frequency.setValueAtTime(freq, now);
            osc.detune.setValueAtTime((Math.random() - 0.5) * 8, now);
            
            const oscGain = audioCtx.createGain();
            // Slow attack and release
            oscGain.gain.setValueAtTime(0.001, now);
            oscGain.gain.linearRampToValueAtTime(0.025, now + 2.5); // fade in
            oscGain.gain.setValueAtTime(0.025, now + 4.5);
            oscGain.gain.exponentialRampToValueAtTime(0.001, now + 6.8); // fade out
            
            osc.connect(oscGain);
            oscGain.connect(masterGain);
            
            osc.start(now);
            osc.stop(now + 7.0);
        });
    }

    function enableAudio() {
        if (!audioCtx) return;
        if (audioCtx.state === 'suspended') {
            audioCtx.resume();
        }
        masterGain.gain.linearRampToValueAtTime(1.0, audioCtx.currentTime + 1.5);
        document.body.classList.remove('audio-muted');
        audioToggle.querySelector('.audio-label').textContent = 'SOUND ON';
        isMuted = false;
    }

    function disableAudio() {
        if (!audioCtx) return;
        masterGain.gain.linearRampToValueAtTime(0.001, audioCtx.currentTime + 0.5);
        document.body.classList.add('audio-muted');
        audioToggle.querySelector('.audio-label').textContent = 'SOUND OFF';
        isMuted = true;
    }

    audioToggle.addEventListener('click', () => {
        if (isMuted) {
            enableAudio();
        } else {
            disableAudio();
        }
    });

    /* ==========================================================================
       3. CANVAS PARTICLE SYSTEM (SNOWFALL)
       ========================================================================== */
    const canvas = document.getElementById('particles-canvas');
    const ctx = canvas.getContext('2d');
    let particles = [];

    function resizeCanvas() {
        canvas.width = window.innerWidth;
        canvas.height = window.innerHeight;
    }
    resizeCanvas();
    window.addEventListener('resize', resizeCanvas);

    class Particle {
        constructor() {
            this.reset();
        }

        reset() {
            this.x = Math.random() * canvas.width;
            this.y = -Math.random() * 50;
            this.speedY = 0.5 + Math.random() * 1.2;
            this.speedX = (Math.random() - 0.5) * 0.6;
            this.size = 1.5 + Math.random() * 3.5;
            this.color = `rgba(255, 255, 255, ${0.4 + Math.random() * 0.5})`;
            this.density = Math.random() * 20;
        }

        update() {
            this.y += this.speedY;
            this.x += this.speedX + Math.sin(this.density) * 0.1;
            this.density += 0.01;
            if (this.y > canvas.height || this.x < 0 || this.x > canvas.width) {
                this.reset();
            }
        }

        draw() {
            ctx.beginPath();
            ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
            ctx.fillStyle = this.color;
            ctx.fill();
        }
    }

    // Initialize 100 particles
    function initParticles() {
        particles = [];
        for (let i = 0; i < 100; i++) {
            particles.push(new Particle());
        }
    }
    initParticles();

    // Loop
    function animate() {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        particles.forEach(p => {
            p.update();
            p.draw();
        });
        requestAnimationFrame(animate);
    }
    requestAnimationFrame(animate);

    /* ==========================================================================
       4. COUNTDOWN TIMER LOGIC
       ========================================================================== */
    const daysEl = document.getElementById('days');
    const hoursEl = document.getElementById('hours');
    const minutesEl = document.getElementById('minutes');
    const secondsEl = document.getElementById('seconds');

    function updateCountdown() {
        const now = new Date().getTime();
        const difference = targetDate - now;

        if (difference < 0) {
            // Feast has started
            document.getElementById('countdown').innerHTML = `<p class="cinzel-heading" style="font-size:1.4rem; color:var(--theme-accent);">The Great Feast Has Commenced</p>`;
            return;
        }

        const days = Math.floor(difference / (1000 * 60 * 60 * 24));
        const hours = Math.floor((difference % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
        const minutes = Math.floor((difference % (1000 * 60 * 60)) / (1000 * 60));
        const seconds = Math.floor((difference % (1000 * 60)) / 1000);

        // Format to double digits
        daysEl.textContent = days < 10 ? '0' + days : days;
        hoursEl.textContent = hours < 10 ? '0' + hours : hours;
        minutesEl.textContent = minutes < 10 ? '0' + minutes : minutes;
        secondsEl.textContent = seconds < 10 ? '0' + seconds : seconds;
    }
    
    updateCountdown();
    setInterval(updateCountdown, 1000);
});
