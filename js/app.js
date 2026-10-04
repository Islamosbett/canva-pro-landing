/**
 * Canva Pro Landing Page - Backend Module
 * Handles forms, local storage, analytics, and API integrations
 * Designed for static hosting (GitHub Pages) with serverless backend
 */

const App = (() => {
    // ===== CONFIGURATION =====
    const CONFIG = {
        // Formspree endpoint for contact form (replace with your own)
        FORM_ENDPOINT: 'https://formspree.io/f/your-form-id',
        // Local storage keys
        STORAGE_KEYS: {
            NEWSLETTER: 'canva_pro_subscribers',
            CONTACTS: 'canva_pro_contacts',
            COOKIE_CONSENT: 'canva_pro_cookies',
            ANALYTICS: 'canva_pro_analytics',
            TRIAL_SIGNUPS: 'canva_pro_trials'
        },
        // Toast duration
        TOAST_DURATION: 4000
    };

    // ===== TOAST NOTIFICATIONS =====
    function showToast(message, type = 'success') {
        // Remove existing toasts
        document.querySelectorAll('.toast').forEach(t => t.remove());

        const toast = document.createElement('div');
        toast.className = `toast ${type}`;
        const icons = { success: 'fa-check-circle', error: 'fa-exclamation-circle', info: 'fa-info-circle' };
        toast.innerHTML = `<i class="fas ${icons[type] || icons.info}"></i><span>${message}</span>`;
        document.body.appendChild(toast);

        requestAnimationFrame(() => {
            requestAnimationFrame(() => toast.classList.add('show'));
        });

        setTimeout(() => {
            toast.classList.remove('show');
            setTimeout(() => toast.remove(), 400);
        }, CONFIG.TOAST_DURATION);
    }

    // ===== LOCAL STORAGE DATABASE =====
    const DB = {
        get(key) {
            try {
                return JSON.parse(localStorage.getItem(key)) || [];
            } catch {
                return [];
            }
        },
        set(key, data) {
            localStorage.setItem(key, JSON.stringify(data));
        },
        add(key, entry) {
            const data = this.get(key);
            entry.id = Date.now().toString(36) + Math.random().toString(36).substr(2, 5);
            entry.timestamp = new Date().toISOString();
            data.push(entry);
            this.set(key, data);
            return entry;
        },
        count(key) {
            return this.get(key).length;
        }
    };

    // ===== NEWSLETTER SIGNUP =====
    function handleNewsletterSignup(e) {
        e.preventDefault();
        const form = e.target;
        const emailInput = form.querySelector('input[type="email"]');
        const email = emailInput.value.trim();

        if (!email || !isValidEmail(email)) {
            showToast('Please enter a valid email address', 'error');
            emailInput.focus();
            return;
        }

        // Check for duplicates
        const existing = DB.get(CONFIG.STORAGE_KEYS.NEWSLETTER);
        if (existing.some(s => s.email === email)) {
            showToast('You\'re already subscribed! 🎉', 'info');
            emailInput.value = '';
            return;
        }

        // Save subscriber
        DB.add(CONFIG.STORAGE_KEYS.NEWSLETTER, { email, source: 'landing_page' });

        // Track event
        trackEvent('newsletter_signup', { email });

        showToast('Welcome aboard! Check your inbox for a confirmation 🎉', 'success');
        emailInput.value = '';

        // Animate the button
        const btn = form.querySelector('button');
        btn.textContent = '✓ Subscribed!';
        setTimeout(() => {
            btn.innerHTML = '<i class="fas fa-paper-plane"></i> Subscribe';
        }, 2000);
    }

    // ===== CONTACT FORM =====
    function handleContactForm(e) {
        e.preventDefault();
        const form = e.target;
        const submitBtn = form.querySelector('.form-submit');
        const formData = new FormData(form);
        const data = Object.fromEntries(formData.entries());

        // Validation
        if (!data.name || !data.email || !data.message) {
            showToast('Please fill in all required fields', 'error');
            return;
        }

        if (!isValidEmail(data.email)) {
            showToast('Please enter a valid email address', 'error');
            return;
        }

        // Show loading state
        submitBtn.classList.add('loading');
        submitBtn.disabled = true;

        // Save locally
        DB.add(CONFIG.STORAGE_KEYS.CONTACTS, data);
        trackEvent('contact_form_submit', { name: data.name });

        // Simulate API call (replace with real endpoint)
        setTimeout(() => {
            submitBtn.classList.remove('loading');
            submitBtn.disabled = false;
            showToast('Message sent successfully! We\'ll get back to you soon 📬', 'success');
            form.reset();
            closeModal();
        }, 1500);
    }

    // ===== FREE TRIAL SIGNUP =====
    function handleTrialSignup(e) {
        e.preventDefault();
        const email = prompt('Enter your email to start your free 30-day Canva Pro trial:');

        if (!email) return;

        if (!isValidEmail(email)) {
            showToast('Please enter a valid email address', 'error');
            return;
        }

        DB.add(CONFIG.STORAGE_KEYS.TRIAL_SIGNUPS, { email, plan: 'pro_trial' });
        trackEvent('trial_signup', { email });
        showToast('🚀 Your 30-day free trial has started! Check your email for next steps.', 'success');
    }

    // ===== CONTACT MODAL =====
    function openModal() {
        const overlay = document.getElementById('contactModal');
        if (overlay) {
            overlay.classList.add('active');
            document.body.style.overflow = 'hidden';
            trackEvent('modal_open', { modal: 'contact' });
        }
    }

    function closeModal() {
        const overlay = document.getElementById('contactModal');
        if (overlay) {
            overlay.classList.remove('active');
            document.body.style.overflow = '';
        }
    }

    // ===== FAQ ACCORDION =====
    function initFAQ() {
        document.querySelectorAll('.faq-question').forEach(btn => {
            btn.addEventListener('click', () => {
                const item = btn.closest('.faq-item');
                const answer = item.querySelector('.faq-answer');
                const isActive = item.classList.contains('active');

                // Close all
                document.querySelectorAll('.faq-item').forEach(faq => {
                    faq.classList.remove('active');
                    faq.querySelector('.faq-answer').style.maxHeight = '0';
                });

                // Open clicked (if wasn't active)
                if (!isActive) {
                    item.classList.add('active');
                    answer.style.maxHeight = answer.scrollHeight + 'px';
                    trackEvent('faq_open', { question: btn.textContent.trim() });
                }
            });
        });
    }

    // ===== COOKIE CONSENT =====
    function initCookieBanner() {
        const consent = localStorage.getItem(CONFIG.STORAGE_KEYS.COOKIE_CONSENT);
        if (consent) return;

        setTimeout(() => {
            const banner = document.getElementById('cookieBanner');
            if (banner) banner.classList.add('show');
        }, 2000);
    }

    function acceptCookies() {
        localStorage.setItem(CONFIG.STORAGE_KEYS.COOKIE_CONSENT, 'accepted');
        const banner = document.getElementById('cookieBanner');
        if (banner) banner.classList.remove('show');
        trackEvent('cookie_consent', { action: 'accepted' });
    }

    function declineCookies() {
        localStorage.setItem(CONFIG.STORAGE_KEYS.COOKIE_CONSENT, 'declined');
        const banner = document.getElementById('cookieBanner');
        if (banner) banner.classList.remove('show');
        trackEvent('cookie_consent', { action: 'declined' });
    }

    // ===== ANALYTICS (CLIENT-SIDE) =====
    function trackEvent(eventName, data = {}) {
        const event = {
            event: eventName,
            ...data,
            timestamp: new Date().toISOString(),
            page: window.location.pathname,
            userAgent: navigator.userAgent,
            referrer: document.referrer,
            screenSize: `${window.innerWidth}x${window.innerHeight}`
        };

        const analytics = DB.get(CONFIG.STORAGE_KEYS.ANALYTICS);
        analytics.push(event);

        // Keep only last 500 events
        if (analytics.length > 500) analytics.splice(0, analytics.length - 500);
        DB.set(CONFIG.STORAGE_KEYS.ANALYTICS, analytics);

        console.log(`📊 [Analytics] ${eventName}`, data);
    }

    function trackPageView() {
        trackEvent('page_view', {
            title: document.title,
            url: window.location.href
        });
    }

    // Track section visibility
    function initSectionTracking() {
        const sections = document.querySelectorAll('section[id]');
        const observer = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    trackEvent('section_view', { section: entry.target.id });
                    observer.unobserve(entry.target);
                }
            });
        }, { threshold: 0.3 });

        sections.forEach(section => observer.observe(section));
    }

    // Track CTA button clicks
    function initClickTracking() {
        document.querySelectorAll('.btn-primary, .btn-secondary, .btn-pricing, .nav-cta').forEach(btn => {
            btn.addEventListener('click', (e) => {
                trackEvent('cta_click', {
                    text: btn.textContent.trim(),
                    href: btn.getAttribute('href') || 'none',
                    location: btn.closest('section')?.id || 'nav'
                });
            });
        });
    }

    // ===== SCROLL PROGRESS BAR =====
    function initScrollProgress() {
        const bar = document.createElement('div');
        bar.id = 'scrollProgress';
        bar.style.cssText = `
            position: fixed; top: 0; left: 0; height: 3px; z-index: 10001;
            background: linear-gradient(90deg, #7d2ae8, #00c4cc);
            width: 0%; transition: width 0.1s;
        `;
        document.body.prepend(bar);

        window.addEventListener('scroll', () => {
            const scrolled = (window.scrollY / (document.documentElement.scrollHeight - window.innerHeight)) * 100;
            bar.style.width = `${Math.min(scrolled, 100)}%`;
        });
    }

    // ===== UTILITY =====
    function isValidEmail(email) {
        return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
    }

    // ===== ADMIN DASHBOARD (Console) =====
    function getStats() {
        return {
            subscribers: DB.count(CONFIG.STORAGE_KEYS.NEWSLETTER),
            contacts: DB.count(CONFIG.STORAGE_KEYS.CONTACTS),
            trialSignups: DB.count(CONFIG.STORAGE_KEYS.TRIAL_SIGNUPS),
            totalEvents: DB.count(CONFIG.STORAGE_KEYS.ANALYTICS),
            subscriberList: DB.get(CONFIG.STORAGE_KEYS.NEWSLETTER),
            contactList: DB.get(CONFIG.STORAGE_KEYS.CONTACTS),
            trialList: DB.get(CONFIG.STORAGE_KEYS.TRIAL_SIGNUPS),
            recentEvents: DB.get(CONFIG.STORAGE_KEYS.ANALYTICS).slice(-20)
        };
    }

    // ===== INITIALIZATION =====
    function init() {
        // Track page view
        trackPageView();

        // Initialize components
        initFAQ();
        initCookieBanner();
        initScrollProgress();
        initSectionTracking();
        initClickTracking();

        // Bind newsletter forms
        document.querySelectorAll('.newsletter-form').forEach(form => {
            form.addEventListener('submit', handleNewsletterSignup);
        });

        // Bind contact form
        const contactForm = document.getElementById('contactForm');
        if (contactForm) contactForm.addEventListener('submit', handleContactForm);

        // Bind trial buttons
        document.querySelectorAll('[data-action="trial"]').forEach(btn => {
            btn.addEventListener('click', handleTrialSignup);
        });

        // Bind modal
        document.querySelectorAll('[data-action="contact"]').forEach(btn => {
            btn.addEventListener('click', (e) => {
                e.preventDefault();
                openModal();
            });
        });

        // Close modal on overlay click
        const modalOverlay = document.getElementById('contactModal');
        if (modalOverlay) {
            modalOverlay.addEventListener('click', (e) => {
                if (e.target === modalOverlay) closeModal();
            });
        }

        // Keyboard shortcuts
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape') closeModal();
        });

        // Expose stats to console
        window.CanvaProStats = getStats;
        console.log('%c🎨 Canva Pro Landing Page', 'font-size: 20px; font-weight: bold; color: #7d2ae8;');
        console.log('%cRun CanvaProStats() to view analytics', 'color: #00c4cc;');
    }

    // Run on DOM ready
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }

    // Public API
    return {
        showToast,
        openModal,
        closeModal,
        acceptCookies,
        declineCookies,
        getStats,
        trackEvent
    };
})();
