// =====================================================
// AERIE — Site Script
// =====================================================

const nav       = document.getElementById('nav');
const navToggle = document.getElementById('navToggle');
const navLinks  = document.getElementById('navLinks');

// ── Theme (dark / light) ───────────────────────────
(function initTheme() {
    const root = document.documentElement;
    const stored = localStorage.getItem('aerie-theme');
    const preferred = stored || (window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light');
    root.setAttribute('data-theme', preferred);

    const themeToggle = document.getElementById('themeToggle');
    if (themeToggle) {
        themeToggle.addEventListener('click', () => {
            const next = root.getAttribute('data-theme') === 'dark' ? 'light' : 'dark';
            root.setAttribute('data-theme', next);
            localStorage.setItem('aerie-theme', next);
        });
    }
})();

// ── Language switcher ──────────────────────────────
(function initLanguage() {
    if (typeof AERIE_I18N === 'undefined') return;

    const supported = Object.keys(AERIE_I18N);
    const stored = localStorage.getItem('aerie-lang');
    const browserLang = (navigator.language || 'en').slice(0, 2);
    let current = stored || (supported.includes(browserLang) ? browserLang : 'en');
    if (!supported.includes(current)) current = 'en';

    function applyLanguage(lang) {
        const dict = AERIE_I18N[lang];
        if (!dict) return;
        document.querySelectorAll('[data-i18n]').forEach(el => {
            const key = el.getAttribute('data-i18n');
            if (dict[key] !== undefined) el.textContent = dict[key];
        });
        document.querySelectorAll('[data-i18n-placeholder]').forEach(el => {
            const key = el.getAttribute('data-i18n-placeholder');
            if (dict[key] !== undefined) el.setAttribute('placeholder', dict[key]);
        });
        document.documentElement.setAttribute('lang', lang);
        current = lang;
        localStorage.setItem('aerie-lang', lang);

        const langCodeEl = document.getElementById('langCode');
        if (langCodeEl) langCodeEl.textContent = lang.toUpperCase();
        document.querySelectorAll('#langMenu li').forEach(li => {
            li.setAttribute('aria-selected', li.getAttribute('data-lang') === lang ? 'true' : 'false');
        });
    }

    const langSwitch = document.getElementById('langSwitch');
    const langBtn    = document.getElementById('langBtn');
    const langMenu   = document.getElementById('langMenu');

    if (langBtn && langMenu && langSwitch) {
        langBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            const open = langSwitch.classList.toggle('open');
            langBtn.setAttribute('aria-expanded', open);
        });
        langMenu.querySelectorAll('li').forEach(li => {
            li.addEventListener('click', () => {
                applyLanguage(li.getAttribute('data-lang'));
                langSwitch.classList.remove('open');
                langBtn.setAttribute('aria-expanded', 'false');
            });
        });
        document.addEventListener('click', () => {
            langSwitch.classList.remove('open');
            langBtn.setAttribute('aria-expanded', 'false');
        });
    }

    window.aerieT = (key) => (AERIE_I18N[current] && AERIE_I18N[current][key]) || AERIE_I18N.en[key] || key;

    applyLanguage(current);
})();

// ── Spotlight cursor-glow on cards ─────────────────
document.querySelectorAll('.spotlight').forEach(card => {
    card.addEventListener('mousemove', (e) => {
        const rect = card.getBoundingClientRect();
        card.style.setProperty('--mx', `${e.clientX - rect.left}px`);
        card.style.setProperty('--my', `${e.clientY - rect.top}px`);
    });
});

// ── Hero ambient cursor glow ────────────────────────
const heroEl = document.querySelector('.hero');
if (heroEl) {
    heroEl.addEventListener('mousemove', (e) => {
        const rect = heroEl.getBoundingClientRect();
        heroEl.style.setProperty('--hx', `${((e.clientX - rect.left) / rect.width) * 100}%`);
        heroEl.style.setProperty('--hy', `${((e.clientY - rect.top) / rect.height) * 100}%`);
    });
}

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
registerAnimations('.about__content');
registerAnimations('.about__visual');
registerAnimations('.contact__form-wrap');
registerAnimations('.contact__info-card');
registerAnimations('.section-header');

// ── Contact Form ───────────────────────────────────
const form      = document.getElementById('contactForm');
const submitBtn = document.getElementById('submitBtn');

if (form) {
    form.addEventListener('submit', (e) => {
        e.preventDefault();

        const originalText = submitBtn.textContent;
        const t = window.aerieT || ((k) => k);
        submitBtn.textContent = t('form_sending');
        submitBtn.disabled = true;
        submitBtn.style.opacity = '0.8';

        // Simulate submission (replace with real API call)
        setTimeout(() => {
            submitBtn.textContent = t('form_sent');
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
}

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
