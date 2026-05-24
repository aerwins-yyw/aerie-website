// =====================================================
// AERIE — Site Script
// =====================================================

const nav       = document.getElementById('nav');
const navToggle = document.getElementById('navToggle');
const navLinks  = document.getElementById('navLinks');

// Sticky nav shadow on scroll
window.addEventListener('scroll', () => {
    nav.classList.toggle('scrolled', window.scrollY > 40);
}, { passive: true });

// Mobile menu
navToggle.addEventListener('click', () => {
    const open = navLinks.classList.toggle('open');
    navToggle.setAttribute('aria-expanded', open);
});

// Close mobile menu on any nav link click
navLinks.querySelectorAll('a').forEach(link => {
    link.addEventListener('click', () => navLinks.classList.remove('open'));
});

// ── Scroll Animations ──────────────────────────────
const animObserver = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
        if (entry.isIntersecting) {
            entry.target.classList.add('visible');
            animObserver.unobserve(entry.target);
        }
    });
}, { threshold: 0.1, rootMargin: '0px 0px -40px 0px' });

// Add animation class with stagger to grid items
function registerAnimations(selector, stagger = false) {
    const els = document.querySelectorAll(selector);
    els.forEach((el, i) => {
        el.classList.add('anim');
        if (stagger) el.style.transitionDelay = `${i * 80}ms`;
        animObserver.observe(el);
    });
}

registerAnimations('.pillar-card',     true);
registerAnimations('.audience-card',   true);
registerAnimations('.service-item',    true);
registerAnimations('.about__content');
registerAnimations('.about__visual');
registerAnimations('.contact__form-wrap');
registerAnimations('.contact__info-card');
registerAnimations('.section-header');

// ── Contact Form ───────────────────────────────────
const form      = document.getElementById('contactForm');
const submitBtn = document.getElementById('submitBtn');

form.addEventListener('submit', (e) => {
    e.preventDefault();

    const originalText = submitBtn.textContent;
    submitBtn.textContent = 'Sending...';
    submitBtn.disabled = true;
    submitBtn.style.opacity = '0.8';

    // Simulate submission (replace with real API call)
    setTimeout(() => {
        submitBtn.textContent = 'Message Sent!';
        submitBtn.style.background = '#22c55e';
        submitBtn.style.opacity = '1';

        setTimeout(() => {
            submitBtn.textContent = originalText;
            submitBtn.style.background = '';
            submitBtn.disabled = false;
            form.reset();
        }, 3000);
    }, 1000);
});

// ── Smooth active link highlight ──────────────────
const sections = document.querySelectorAll('section[id]');
const navLinkEls = document.querySelectorAll('.nav__link:not(.nav__link--cta)');

const sectionObserver = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
        if (entry.isIntersecting) {
            navLinkEls.forEach(link => {
                link.classList.toggle(
                    'nav__link--active',
                    link.getAttribute('href') === `#${entry.target.id}`
                );
            });
        }
    });
}, { threshold: 0.4 });

sections.forEach(sec => sectionObserver.observe(sec));
