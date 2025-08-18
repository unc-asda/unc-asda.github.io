/* =========================
   NAV + SMOOTH SCROLL
========================= */
(function () {
    function initNav() {
        const nav = document.querySelector('nav');
        if (!nav) return;

        const hamburger = nav.querySelector('.hamburger');
        const navLinks  = nav.querySelector('.nav-links');

        if (hamburger && navLinks) {
            hamburger.addEventListener('click', () => {
                navLinks.classList.toggle('active');
                hamburger.classList.toggle('active');
            });

            // Close mobile menu when clicking outside nav
            document.addEventListener('click', (e) => {
                if (!e.target.closest('nav')) {
                    navLinks.classList.remove('active');
                    hamburger.classList.remove('active');
                }
            });
        }

        // Smooth scrolling for in-page anchors only (ignore bare "#")
        document.querySelectorAll('a[href^="#"]').forEach((a) => {
            a.addEventListener('click', (e) => {
                const href = a.getAttribute('href');
                if (!href || href === '#') return; // e.g., dropdown toggles
                const target = document.querySelector(href);
                if (target) {
                    e.preventDefault();
                    target.scrollIntoView({ behavior: 'smooth' });
                }
            });
        });
    }

    // Run now if DOM is ready, and also when header/footer partials finish loading
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', initNav, { once: true });
    } else {
        initNav();
    }
    document.addEventListener('partials:loaded', initNav, { once: true });
})();

/* =========================
   GALLERY (Jekyll-sourced)
   - Expects a hidden #gallery-source filled by Liquid with <img src="...">
   - Builds a scroll-snap carousel, shuffles images each load
========================= */
(function () {
    const track   = document.getElementById('gallery-track');
    if (!track) return; // Only on pages that have the gallery

    const dotsEl  = document.getElementById('gallery-dots');
    const prevBtn = document.querySelector('.gallery__btn--prev');
    const nextBtn = document.querySelector('.gallery__btn--next');
    const prefersReduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    let slides = [];
    let slideWidth = 0;
    let autoplayTimer = null;
    let currentIndex = 0;

    function shuffle(arr) {
        for (let i = arr.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [arr[i], arr[j]] = [arr[j], arr[i]];
        }
        return arr;
    }

    async function loadImages() {
        try {
            const srcContainer = document.getElementById('gallery-source');
            if (!srcContainer) return;

            // Collect srcs produced by Jekyll, then shuffle
            let imgs = Array.from(srcContainer.querySelectorAll('img')).map((img) => img.getAttribute('src'));
            if (!imgs.length) return;

            shuffle(imgs);

            // Build slides
            const frag = document.createDocumentFragment();
            imgs.forEach((src) => {
                const item = document.createElement('div');
                item.className = 'gallery__slide';
                const img = document.createElement('img');
                img.loading = 'lazy';
                img.decoding = 'async';
                img.src = src;
                img.alt = 'UNC ASDA gallery image';
                item.appendChild(img);
                frag.appendChild(item);
            });
            track.innerHTML = '';
            track.appendChild(frag);

            slides = Array.from(track.children);
            if (!slides.length) return;

            buildDots();

            // Measure one slide after layout; add the 12px CSS gap used in .gallery__track
            requestAnimationFrame(() => {
                const rect = slides[0].getBoundingClientRect();
                slideWidth = rect.width + 12;
                goTo(0);
            });

            // Controls & listeners
            prevBtn && prevBtn.addEventListener('click', prev);
            nextBtn && nextBtn.addEventListener('click', next);
            track.addEventListener('scroll', onScroll, { passive: true });

            // Pause autoplay on hover
            ['mouseenter', 'focusin'].forEach((ev) => {
                track.addEventListener(ev, pauseAutoplay);
                prevBtn && prevBtn.addEventListener(ev, pauseAutoplay);
                nextBtn && nextBtn.addEventListener(ev, pauseAutoplay);
            });
            ['mouseleave', 'focusout'].forEach((ev) => {
                track.addEventListener(ev, resumeAutoplay);
                prevBtn && prevBtn.addEventListener(ev, resumeAutoplay);
                nextBtn && nextBtn.addEventListener(ev, resumeAutoplay);
            });

            // Keyboard arrows
            track.setAttribute('tabindex', '0');
            track.addEventListener('keydown', (e) => {
                if (e.key === 'ArrowRight') next();
                if (e.key === 'ArrowLeft') prev();
            });

            if (!prefersReduced && slides.length > 1) startAutoplay();
        } catch (err) {
            console.error('Gallery init failed:', err);
        }
    }

    function buildDots() {
        if (!dotsEl) return;
        dotsEl.innerHTML = '';
        slides.forEach((_, i) => {
            const b = document.createElement('button');
            b.className = 'gallery__dot';
            b.type = 'button';
            b.setAttribute('aria-label', `Go to image ${i + 1}`);
            b.addEventListener('click', () => goTo(i));
            dotsEl.appendChild(b);
        });
        updateDots(0);
    }

    function updateDots(i) {
        if (!dotsEl) return;
        Array.from(dotsEl.children).forEach((dot, idx) => {
            dot.setAttribute('aria-current', String(idx === i));
        });
    }

    function goTo(i) {
        if (!slides.length) return;
        currentIndex = (i + slides.length) % slides.length;
        track.scrollTo({ left: currentIndex * slideWidth, behavior: 'smooth' });
        updateDots(currentIndex);
    }

    function next() { goTo(currentIndex + 1); }
    function prev() { goTo(currentIndex - 1); }

    function onScroll() {
        const i = Math.round(track.scrollLeft / Math.max(1, slideWidth));
        if (i !== currentIndex) {
            currentIndex = i;
            updateDots(currentIndex);
        }
    }

    function startAutoplay() {
        clearInterval(autoplayTimer);
        autoplayTimer = setInterval(next, 3500);
    }
    function pauseAutoplay() { clearInterval(autoplayTimer); }
    function resumeAutoplay() { if (!prefersReduced && slides.length > 1) startAutoplay(); }

    loadImages();
})();
