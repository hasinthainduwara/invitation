/* ==========================================================================
   GAME OF THRONES THEMED GALLERY JAVASCRIPT
   ========================================================================== */

document.addEventListener('DOMContentLoaded', () => {
    // DOM Elements
    const filterButtons = document.querySelectorAll('.filter-btn');
    const galleryCards = document.querySelectorAll('.gallery-card');
    
    // Lightbox Elements
    const lightbox = document.getElementById('lightbox');
    const lightboxImg = document.getElementById('lightbox-img');
    const lightboxTitle = document.getElementById('lightbox-title');
    const lightboxDesc = document.getElementById('lightbox-desc');
    const lightboxClose = document.getElementById('lightbox-close');
    const lightboxPrev = document.getElementById('lightbox-prev');
    const lightboxNext = document.getElementById('lightbox-next');

    // State
    let visibleCards = Array.from(galleryCards);
    let currentIndex = 0;

    /* ==========================================================================
       1. GALLERY CATEGORY FILTERING
       ========================================================================== */
    filterButtons.forEach(btn => {
        btn.addEventListener('click', () => {
            const filter = btn.getAttribute('data-filter');
            
            // Toggle active filter button class
            filterButtons.forEach(b => b.classList.remove('active'));
            btn.classList.add('active');

            // Hide/Show cards
            galleryCards.forEach(card => {
                const category = card.getAttribute('data-category');
                if (filter === 'all' || category === filter) {
                    card.classList.remove('hidden');
                } else {
                    card.classList.add('hidden');
                }
            });

            // Update visible cards list for lightbox navigation
            visibleCards = Array.from(galleryCards).filter(card => !card.classList.contains('hidden'));
        });
    });

    /* ==========================================================================
       2. LIGHTBOX INTERACTIVITY
       ========================================================================== */
    function openLightbox(index) {
        if (visibleCards.length === 0) return;
        currentIndex = index;
        const card = visibleCards[currentIndex];

        const src = card.getAttribute('data-src');
        const title = card.getAttribute('data-title');
        const desc = card.getAttribute('data-desc');

        lightboxImg.src = src;
        lightboxTitle.textContent = title;
        lightboxDesc.textContent = desc;

        lightbox.classList.add('visible');
    }

    function closeLightbox() {
        lightbox.classList.remove('visible');
    }

    function showNext() {
        if (visibleCards.length <= 1) return;
        let nextIndex = (currentIndex + 1) % visibleCards.length;
        openLightbox(nextIndex);
    }

    function showPrev() {
        if (visibleCards.length <= 1) return;
        let prevIndex = (currentIndex - 1 + visibleCards.length) % visibleCards.length;
        openLightbox(prevIndex);
    }

    // Add event listeners to cards for opening lightbox
    galleryCards.forEach(card => {
        card.addEventListener('click', () => {
            // Find current card's index in the filtered visible list
            const index = visibleCards.indexOf(card);
            if (index !== -1) {
                openLightbox(index);
            }
        });
    });

    // Lightbox Controls
    lightboxClose.addEventListener('click', closeLightbox);
    lightboxNext.addEventListener('click', showNext);
    lightboxPrev.addEventListener('click', showPrev);

    // Close on background click
    lightbox.addEventListener('click', (e) => {
        if (e.target === lightbox) {
            closeLightbox();
        }
    });

    // Keyboard Navigation
    document.addEventListener('keydown', (e) => {
        if (!lightbox.classList.contains('visible')) return;

        if (e.key === 'Escape') {
            closeLightbox();
        } else if (e.key === 'ArrowRight') {
            showNext();
        } else if (e.key === 'ArrowLeft') {
            showPrev();
        }
    });

    /* ==========================================================================
       3. BACKGROUND MUSIC
       ========================================================================== */
    const bgMusic = document.getElementById('bg-music');
    const musicToggle = document.getElementById('music-toggle');
    let musicStarted = false;

    function updateMusicUI() {
        const playing = bgMusic && !bgMusic.paused;
        musicToggle.classList.toggle('playing', playing);
        musicToggle.classList.toggle('muted', !playing);
    }

    function startMusic() {
        if (!bgMusic) return;
        const p = bgMusic.play();
        if (p && p.then) {
            p.then(() => { musicStarted = true; updateMusicUI(); }).catch(updateMusicUI);
        } else {
            musicStarted = true;
            updateMusicUI();
        }
    }

    // Try to autoplay; most browsers require a user gesture first.
    startMusic();

    function cleanupGesture() {
        window.removeEventListener('pointerdown', firstGesture);
        window.removeEventListener('keydown', firstGesture);
    }
    function firstGesture(e) {
        // Let the toggle button manage its own clicks
        if (e.target && e.target.closest && e.target.closest('#music-toggle')) {
            cleanupGesture();
            return;
        }
        if (!musicStarted) startMusic();
        cleanupGesture();
    }
    window.addEventListener('pointerdown', firstGesture);
    window.addEventListener('keydown', firstGesture);

    musicToggle.addEventListener('click', () => {
        if (bgMusic.paused) {
            bgMusic.play();
            musicStarted = true;
        } else {
            bgMusic.pause();
        }
        updateMusicUI();
    });

    bgMusic.addEventListener('play', updateMusicUI);
    bgMusic.addEventListener('pause', updateMusicUI);
    updateMusicUI();

    /* ==========================================================================
       4. CANVAS PARTICLE SYSTEM (SNOWFALL)
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
            this.speedY = 0.3 + Math.random() * 0.9;
            this.speedX = (Math.random() - 0.5) * 0.4;
            this.size = 1 + Math.random() * 3;
            this.color = `rgba(255, 255, 255, ${0.25 + Math.random() * 0.35})`;
            this.density = Math.random() * 20;
        }

        update() {
            this.y += this.speedY;
            this.x += this.speedX + Math.sin(this.density) * 0.08;
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

    // Initialize particles
    function initParticles() {
        particles = [];
        for (let i = 0; i < 70; i++) {
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
});
