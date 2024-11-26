// Performance optimizations using modern JavaScript features
(() => {
    'use strict';

    // Cache DOM elements
    const elements = {
        header: document.querySelector('.header'),
        nav: document.querySelector('.nav'),
        navList: document.querySelector('.nav__list'),
        form: document.querySelector('.contact__form'),
    };

    // Validate required DOM elements exist
    if (!elements.header || !elements.nav || !elements.navList) {
        console.error('Required DOM elements not found. Check your HTML structure.');
        return;
    }

    // Validate utility functions
    const debounce = (fn, delay = 300) => {
        if (typeof fn !== 'function') {
            throw new TypeError('First argument must be a function');
        }
        if (typeof delay !== 'number' || delay < 0) {
            throw new TypeError('Delay must be a positive number');
        }
        let timeoutId;
        return (...args) => {
            clearTimeout(timeoutId);
            timeoutId = setTimeout(() => fn.apply(this, args), delay);
        };
    };

    // Mobile menu setup with event delegation
    const setupMobileMenu = () => {
        if (!elements.nav || !elements.navList) {
            throw new Error('Nav elements required for mobile menu setup');
        }

        const mobileBtn = document.createElement('button');
        mobileBtn.className = 'nav__mobile-btn';
        mobileBtn.setAttribute('aria-label', 'Toggle navigation menu');
        mobileBtn.setAttribute('aria-expanded', 'false');
        mobileBtn.innerHTML = '<span></span><span></span><span></span>';
        
        elements.nav.insertBefore(mobileBtn, elements.navList);

        let isMenuOpen = false;

        // Event delegation for menu clicks
        elements.nav.addEventListener('click', (e) => {
            if (!e || !e.target) return;
            
            const target = e.target.closest('.nav__mobile-btn, .nav__link');
            if (!target) return;

            if (target.classList.contains('nav__mobile-btn')) {
                isMenuOpen = !isMenuOpen;
                elements.navList.classList.toggle('nav__list--active');
                mobileBtn.classList.toggle('nav__mobile-btn--active');
                mobileBtn.setAttribute('aria-expanded', isMenuOpen.toString());
                document.body.style.overflow = isMenuOpen ? 'hidden' : '';
            } else if (target.classList.contains('nav__link') && window.innerWidth < 768) {
                elements.navList.classList.remove('nav__list--active');
                mobileBtn.classList.remove('nav__mobile-btn--active');
                mobileBtn.setAttribute('aria-expanded', 'false');
                document.body.style.overflow = '';
                isMenuOpen = false;
            }
        });
    };

    // Optimized smooth scroll with IntersectionObserver
    const setupSmoothScroll = () => {
        const navLinks = document.querySelectorAll('.nav__link, .hero__cta');
        if (!navLinks.length) {
            console.warn('No navigation links found for smooth scroll');
            return;
        }

        if (!elements.header) {
            throw new Error('Header element required for smooth scroll');
        }

        const headerHeight = elements.header.offsetHeight;

        navLinks.forEach(link => {
            if (!link) return;
            
            link.addEventListener('click', (e) => {
                if (!e) return;
                
                const href = link.getAttribute('href');
                if (!href) return;
                
                if (href.startsWith('#')) {
                    e.preventDefault();
                    const target = document.querySelector(href);
                    if (target) {
                        const top = target.offsetTop - headerHeight;
                        window.scrollTo({
                            top,
                            behavior: 'smooth'
                        });
                    }
                }
            }, { passive: false });
        });
    };

    // Optimized lazy loading with IntersectionObserver
    const setupLazyLoading = () => {
        if (!('IntersectionObserver' in window)) {
            console.warn('IntersectionObserver not supported');
            return;
        }

        const imageObserver = new IntersectionObserver((entries, observer) => {
            if (!entries || !observer) return;

            entries.forEach(entry => {
                if (!entry || !entry.isIntersecting) return;

                const img = entry.target;
                if (!img) return;

                const sources = img.parentElement?.querySelectorAll('source');

                // Load sources first (if any)
                if (sources) {
                    sources.forEach(source => {
                        if (!source) return;
                        if (source.dataset.srcset) {
                            source.srcset = source.dataset.srcset;
                            delete source.dataset.srcset;
                        }
                    });
                }

                // Then load the img
                if (img.dataset.src) {
                    img.src = img.dataset.src;
                    delete img.dataset.src;
                }

                img.classList.add('loaded');
                observer.unobserve(img);
            });
        }, {
            rootMargin: '50px 0px',
            threshold: 0.01
        });

        const lazyImages = document.querySelectorAll('img[data-src]');
        if (!lazyImages.length) {
            console.warn('No lazy-loaded images found');
            return;
        }

        lazyImages.forEach(img => {
            if (!img) return;
            imageObserver.observe(img);
        });
    };

    // Optimized form validation with efficient error handling
    const setupFormValidation = () => {
        if (!elements.form) {
            console.warn('Contact form not found');
            return;
        }

        const validateField = (field) => {
            if (!field) return false;

            const value = field.value?.trim();
            if (typeof value !== 'string') return false;
            
            const fieldType = field.type;
            const minLength = parseInt(field.dataset.minLength) || 0;
            
            // Remove existing error
            field.classList.remove('error');
            const errorEl = field.parentElement?.querySelector('.error-message');
            if (errorEl) errorEl.remove();

            // Validation rules
            let isValid = true;
            let errorMessage = '';

            if (!value) {
                isValid = false;
                errorMessage = 'This field is required';
            } else {
                switch (fieldType) {
                    case 'email':
                        isValid = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
                        errorMessage = 'Please enter a valid email';
                        break;
                    default:
                        isValid = value.length >= minLength;
                        errorMessage = `Minimum ${minLength} characters required`;
                }
            }

            if (!isValid && field.parentElement) {
                field.classList.add('error');
                const error = document.createElement('span');
                error.className = 'error-message';
                error.textContent = errorMessage;
                field.parentElement.appendChild(error);
            }

            return isValid;
        };

        // Efficient form submission with minimal reflows
        elements.form.addEventListener('submit', async (e) => {
            if (!e) return;
            e.preventDefault();
            
            const fields = elements.form.querySelectorAll('input, textarea');
            if (!fields.length) return;

            const formData = new FormData(elements.form);
            let isValid = true;

            // Batch validation to minimize reflows
            requestAnimationFrame(() => {
                fields.forEach(field => {
                    if (!validateField(field)) isValid = false;
                });

                if (isValid && typeof submitForm === 'function') {
                    submitForm(Object.fromEntries(formData));
                }
            });
        });

        // Efficient real-time validation with debounce
        elements.form.addEventListener('input', debounce(e => {
            if (!e || !e.target) return;
            if (e.target.matches('input, textarea')) {
                validateField(e.target);
            }
        }, 300));
    };

    // Optimized header scroll handling with requestAnimationFrame
    const setupHeaderScroll = () => {
        if (!elements.header) {
            console.warn('Header element required for scroll handling');
            return;
        }

        let lastScroll = 0;
        let ticking = false;

        window.addEventListener('scroll', () => {
            if (!ticking) {
                requestAnimationFrame(() => {
                    const currentScroll = window.scrollY;
                    if (typeof currentScroll !== 'number') return;

                    // Efficient classList manipulation
                    const headerClasses = elements.header.classList;
                    
                    if (currentScroll <= 0) {
                        headerClasses.remove('header--hidden', 'header--scrolled');
                    } else {
                        if (currentScroll > lastScroll && currentScroll > 100) {
                            headerClasses.add('header--hidden');
                        } else {
                            headerClasses.remove('header--hidden');
                        }
                        
                        headerClasses.toggle('header--scrolled', currentScroll > 50);
                    }

                    lastScroll = currentScroll;
                    ticking = false;
                });
                ticking = true;
            }
        }, { passive: true });
    };

    // Initialize features when DOM is ready
    const init = () => {
        try {
            setupMobileMenu();
            setupSmoothScroll();
            setupLazyLoading();
            setupFormValidation();
            setupHeaderScroll();
        } catch (error) {
            console.error('Initialization error:', error.message);
        }
    };

    // Efficient DOM ready check
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }
})();