/* ═══════════════════════════════════════════════════════════════
   AYACH YOUSSEF — PORTFOLIO  script.js  v3
   Modules:
     1. Loader
     2. Navigation  (scroll · mobile · light/dark switching)
     3. Scroll Reveal
     4. Counter Animation
     5. Smooth Scroll
     6. Project Items  (keyboard + touch expand)
     7. Contact Form
     8. Photo Placeholder
     9. Hero Parallax  (desktop only)
    10. Active Nav Highlight
═══════════════════════════════════════════════════════════════ */

'use strict';

/* ──────────────────────────────────────────────────────────────
   UTILITIES
────────────────────────────────────────────────────────────── */
const qs  = (sel, ctx = document) => ctx.querySelector(sel);
const qsa = (sel, ctx = document) => [...ctx.querySelectorAll(sel)];

function onReady(fn) {
  if (document.readyState !== 'loading') fn();
  else document.addEventListener('DOMContentLoaded', fn);
}

/* RAF throttle — limits a callback to once per animation frame */
function rafThrottle(fn) {
  let scheduled = false;
  return (...args) => {
    if (scheduled) return;
    scheduled = true;
    requestAnimationFrame(() => {
      fn(...args);
      scheduled = false;
    });
  };
}

/* Clamp a number between min and max */
const clamp = (val, min, max) => Math.min(Math.max(val, min), max);

/* Easing: ease-out cubic */
const easeOutCubic = t => 1 - Math.pow(1 - t, 3);


/* ══════════════════════════════════════════════════════════════
   1. LOADER
   • Fills the bar, then fades the overlay out
   • Adds .loaded to <body> so CSS animations trigger correctly
══════════════════════════════════════════════════════════════ */
(function initLoader() {
  const loader = qs('#loader');
  if (!loader) return;

  /* Minimum display time so it never flickers on fast connections */
  const MIN_MS = 1200;
  const start  = performance.now();

  function dismiss() {
    const elapsed = performance.now() - start;
    const delay   = Math.max(0, MIN_MS - elapsed);

    setTimeout(() => {
      loader.classList.add('done');
      document.body.classList.add('loaded');

      /* Remove from DOM after transition ends */
      loader.addEventListener('transitionend', () => {
        loader.remove();
      }, { once: true });
    }, delay);
  }

  /* Dismiss once page assets are loaded */
  if (document.readyState === 'complete') {
    dismiss();
  } else {
    window.addEventListener('load', dismiss, { once: true });
    /* Failsafe: dismiss after 3.5s regardless */
    setTimeout(dismiss, 3500);
  }
})();


/* ══════════════════════════════════════════════════════════════
   2. NAVIGATION
   2a. Scroll shadow
   2b. Light / dark background switching (hero & contact are dark,
       all middle sections are ivory)
   2c. Active link highlight on scroll
   2d. Mobile hamburger menu
══════════════════════════════════════════════════════════════ */
(function initNav() {
  const nav       = qs('#nav');
  const hamburger = qs('#hamburger');
  const navLinks  = qs('#navLinks');
  if (!nav) return;

  /* ── 2a. Scroll shadow ── */
  const onScroll = rafThrottle(() => {
    nav.classList.toggle('scrolled', window.scrollY > 60);
    updateNavTheme();
  });

  window.addEventListener('scroll', onScroll, { passive: true });

  /* ── 2b. Light / dark theme based on background of current section ── */
  /*
    Sections with dark backgrounds: #home, #contact
    Sections with light backgrounds: everything else
  */
  const darkSections = new Set(['home', 'contact']);

  function updateNavTheme() {
    /* Find the section whose top is closest to the nav bottom */
    const navBottom = nav.getBoundingClientRect().bottom;
    let currentId   = 'home';

    qsa('section[id]').forEach(sec => {
      const { top } = sec.getBoundingClientRect();
      if (top <= navBottom + 20) {
        currentId = sec.id;
      }
    });

    if (darkSections.has(currentId)) {
      nav.classList.remove('on-light');
    } else {
      nav.classList.add('on-light');
      /* When on light, also ensure hamburger lines are dark */
      if (hamburger) {
        qsa('span', hamburger).forEach(s => {
          s.style.background = navLinks.classList.contains('open')
            ? '' /* keep ivory while menu is open */
            : 'var(--text-dark)';
        });
      }
    }

    /* Reset hamburger lines to ivory when on dark section */
    if (darkSections.has(currentId) && hamburger) {
      qsa('span', hamburger).forEach(s => {
        s.style.background = '';
      });
    }
  }

  /* Initial call */
  updateNavTheme();

  /* ── 2c. Active link highlight ── */
  const navLinkEls = qsa('.nav-link', nav);

  const sectionObserver = new IntersectionObserver(entries => {
    entries.forEach(entry => {
      if (!entry.isIntersecting) return;
      const id = entry.target.id;
      navLinkEls.forEach(link => {
        const active = link.getAttribute('href') === `#${id}`;
        link.style.opacity = active ? '1' : '';
        /* Underline via inline style shortcut */
        if (active) {
          link.dataset.active = 'true';
        } else {
          delete link.dataset.active;
        }
      });
    });
  }, {
    threshold: 0.35,
    rootMargin: `-${nav.offsetHeight}px 0px 0px 0px`,
  });

  qsa('section[id]').forEach(s => sectionObserver.observe(s));

  /* ── 2d. Mobile hamburger ── */
  if (!hamburger || !navLinks) return;

  function openMenu() {
    navLinks.classList.add('open');
    hamburger.classList.add('open');
    hamburger.setAttribute('aria-expanded', 'true');
    document.body.style.overflow = 'hidden';
  }

  function closeMenu() {
    navLinks.classList.remove('open');
    hamburger.classList.remove('open');
    hamburger.setAttribute('aria-expanded', 'false');
    document.body.style.overflow = '';
    /* Restore hamburger line colours */
    qsa('span', hamburger).forEach(s => { s.style.background = ''; });
  }

  hamburger.addEventListener('click', () => {
    if (navLinks.classList.contains('open')) closeMenu();
    else openMenu();
  });

  /* Close on nav link click */
  navLinkEls.forEach(link => {
    link.addEventListener('click', closeMenu);
  });

  /* Close on outside click */
  document.addEventListener('click', e => {
    if (
      navLinks.classList.contains('open') &&
      !nav.contains(e.target)
    ) {
      closeMenu();
    }
  });

  /* Close on Escape */
  document.addEventListener('keydown', e => {
    if (e.key === 'Escape' && navLinks.classList.contains('open')) {
      closeMenu();
      hamburger.focus();
    }
  });
})();


/* ══════════════════════════════════════════════════════════════
   3. SCROLL REVEAL
   • Watches every .reveal element
   • Adds .visible when it enters the viewport
   • Respects prefers-reduced-motion (reveals everything instantly)
══════════════════════════════════════════════════════════════ */
(function initReveal() {
  const els = qsa('.reveal');
  if (!els.length) return;

  /* If user prefers reduced motion, show everything immediately */
  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
    els.forEach(el => el.classList.add('visible'));
    return;
  }

  const observer = new IntersectionObserver(entries => {
    entries.forEach(entry => {
      if (!entry.isIntersecting) return;
      entry.target.classList.add('visible');
      observer.unobserve(entry.target);
    });
  }, {
    threshold: 0.1,
    rootMargin: '0px 0px -50px 0px',
  });

  els.forEach(el => observer.observe(el));
})();


/* ══════════════════════════════════════════════════════════════
   4. COUNTER ANIMATION
   • Triggers when the stat number scrolls into view
   • Uses requestAnimationFrame for smooth easing
══════════════════════════════════════════════════════════════ */
(function initCounters() {
  const counters = qsa('.stat-num[data-target]');
  if (!counters.length) return;

  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
    counters.forEach(el => {
      el.textContent = el.dataset.target;
    });
    return;
  }

  function animateCounter(el) {
    const target   = parseInt(el.dataset.target, 10);
    const duration = 1600; /* ms */
    const startTs  = performance.now();

    function tick(now) {
      const elapsed  = now - startTs;
      const progress = clamp(elapsed / duration, 0, 1);
      const value    = Math.round(easeOutCubic(progress) * target);

      el.textContent = value;

      if (progress < 1) {
        requestAnimationFrame(tick);
      } else {
        el.textContent = target; /* ensure we land exactly on target */
      }
    }

    requestAnimationFrame(tick);
  }

  const observer = new IntersectionObserver(entries => {
    entries.forEach(entry => {
      if (!entry.isIntersecting) return;
      animateCounter(entry.target);
      observer.unobserve(entry.target);
    });
  }, { threshold: 0.6 });

  counters.forEach(c => observer.observe(c));
})();


/* ══════════════════════════════════════════════════════════════
   5. SMOOTH SCROLL
   • Intercepts all same-page anchor clicks
   • Offsets for fixed nav height
   • Falls back gracefully if target doesn't exist
══════════════════════════════════════════════════════════════ */
(function initSmoothScroll() {
  document.addEventListener('click', e => {
    const anchor = e.target.closest('a[href^="#"]');
    if (!anchor) return;

    const targetId = anchor.getAttribute('href').slice(1);
    if (!targetId) {
      /* href="#" — scroll to very top */
      e.preventDefault();
      window.scrollTo({ top: 0, behavior: 'smooth' });
      return;
    }

    const target = document.getElementById(targetId);
    if (!target) return;

    e.preventDefault();

    const navH   = qs('#nav')?.offsetHeight ?? 70;
    const top    = target.getBoundingClientRect().top + window.scrollY - navH;

    window.scrollTo({ top: Math.max(0, top), behavior: 'smooth' });
  });
})();


/* ══════════════════════════════════════════════════════════════
   6. PROJECT ITEMS
   • The description inside each .project-item expands on hover
     via CSS (grid-template-rows), so no extra JS needed for that.
   • This module adds keyboard accessibility:
     Enter / Space on a focused .project-link also reveals desc
   • Touch devices: first tap reveals, second tap navigates
══════════════════════════════════════════════════════════════ */
(function initProjects() {
  const items = qsa('.project-item');
  if (!items.length) return;

  /* Stagger entrance delays */
  items.forEach((item, i) => {
    item.style.transitionDelay = `${i * 0.06}s`;
  });

  /* Touch support: single tap = expand, double tap = navigate */
  const isTouchDevice = window.matchMedia('(hover: none)').matches;
  if (!isTouchDevice) return;

  items.forEach(item => {
    const link = qs('.project-link', item);
    if (!link) return;

    let tapped = false;

    link.addEventListener('click', e => {
      if (!tapped) {
        e.preventDefault();
        tapped = true;

        /* Collapse all others */
        items.forEach(other => {
          if (other !== item) {
            qs('.project-link', other)?.classList.remove('touch-expanded');
          }
        });

        link.classList.add('touch-expanded');

        /* Reset after 4 seconds of inactivity */
        setTimeout(() => { tapped = false; }, 4000);
      }
      /* Second tap: let the click navigate to GitHub */
    });
  });
})();


/* ══════════════════════════════════════════════════════════════
   7. CONTACT FORM
   • Client-side validation (name, email, subject, message)
   • Visual error states on invalid fields
   • Success state on submit button
   • Resets after 5 seconds
══════════════════════════════════════════════════════════════ */
(function initContactForm() {
  const form      = qs('#contactForm');
  const submitBtn = qs('#submitBtn');
  if (!form || !submitBtn) return;

  const fields = {
    name:    qs('#f-name',    form),
    email:   qs('#f-email',   form),
    subject: qs('#f-subject', form),
    message: qs('#f-message', form),
  };

  /* Simple email regex */
  const emailRe = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

  function setError(input, msg) {
    if (!input) return;
    input.style.borderColor = '#c0392b';
    input.setAttribute('aria-invalid', 'true');

    /* Show inline message if a .form-hint sibling exists */
    const hint = input.parentElement?.querySelector('.form-hint');
    if (hint) { hint.textContent = msg; hint.style.color = '#e57373'; }

    /* Clear on next input */
    input.addEventListener('input', () => {
      input.style.borderColor = '';
      input.removeAttribute('aria-invalid');
      if (hint) { hint.textContent = ''; }
    }, { once: true });
  }

  function validate() {
    let valid = true;

    if (!fields.name?.value.trim()) {
      setError(fields.name, 'Please enter your name.');
      valid = false;
    }
    if (!fields.email?.value.trim() || !emailRe.test(fields.email.value.trim())) {
      setError(fields.email, 'Please enter a valid email address.');
      valid = false;
    }
    if (!fields.subject?.value.trim()) {
      setError(fields.subject, 'Please enter a subject.');
      valid = false;
    }
    if (!fields.message?.value.trim()) {
      setError(fields.message, 'Please write a message.');
      valid = false;
    }

    return valid;
  }

  function resetForm() {
    Object.values(fields).forEach(f => {
      if (f) {
        f.value = '';
        f.style.borderColor = '';
        f.removeAttribute('aria-invalid');
      }
    });
    form.querySelectorAll('.form-hint').forEach(h => { h.textContent = ''; });
  }

  submitBtn.addEventListener('click', () => {
    if (!validate()) {
      /* Shake the button */
      submitBtn.classList.add('shake');
      submitBtn.addEventListener('animationend', () => {
        submitBtn.classList.remove('shake');
      }, { once: true });
      return;
    }

    /* ── Success state ── */
    const textEl  = qs('.fsb-text', submitBtn);
    const arrowEl = qs('.fsb-arrow', submitBtn);

    submitBtn.disabled = true;
    submitBtn.classList.add('success');
    if (textEl)  textEl.textContent  = 'Message Sent — Thank you!';
    if (arrowEl) arrowEl.textContent = '✓';

    /* Reset after 5 s */
    setTimeout(() => {
      submitBtn.disabled = false;
      submitBtn.classList.remove('success');
      if (textEl)  textEl.textContent  = 'Send Message';
      if (arrowEl) arrowEl.textContent = '→';
      resetForm();
    }, 5000);
  });

  /* Also submit on Enter inside textarea (Ctrl/Cmd + Enter) */
  fields.message?.addEventListener('keydown', e => {
    if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) {
      submitBtn.click();
    }
  });
})();


/* ══════════════════════════════════════════════════════════════
   8. PROFILE PHOTO PLACEHOLDER
   • Hides the placeholder when a real image src is provided
   • Shows placeholder on image load error
══════════════════════════════════════════════════════════════ */
(function initPhoto() {
  const img         = qs('#profilePhoto');
  const placeholder = qs('#photoPlaceholder');
  if (!img || !placeholder) return;

  function showImage() {
    img.style.display   = 'block';
    placeholder.style.display = 'none';
  }

  function showPlaceholder() {
    img.style.display   = 'none';
    placeholder.style.display = 'flex';
  }

  /* Check initial src */
  const src = img.getAttribute('src');
  if (!src || src.trim() === '') {
    showPlaceholder();
    return;
  }

  img.addEventListener('load', () => {
    if (img.naturalWidth > 0) showImage();
    else showPlaceholder();
  }, { once: true });

  img.addEventListener('error', showPlaceholder, { once: true });

  /* Trigger if already cached */
  if (img.complete) {
    if (img.naturalWidth > 0) showImage();
    else showPlaceholder();
  }
})();


/* ══════════════════════════════════════════════════════════════
   9. HERO PARALLAX  (desktop / pointer: fine only)
   • Hero name block drifts upward slightly on scroll
   • Stopped once the hero is out of view for performance
══════════════════════════════════════════════════════════════ */
(function initParallax() {
  /* Skip on touch devices and reduced motion */
  if (!window.matchMedia('(pointer: fine) and (min-width: 900px)').matches) return;
  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;

  const nameBlock  = qs('.hero-name-block');
  const heroLower  = qs('.hero-lower');
  const heroStatus = qs('.hero-status');
  if (!nameBlock) return;

  const hero      = qs('.hero');
  const heroH     = () => hero?.offsetHeight ?? window.innerHeight;

  const onScroll = rafThrottle(() => {
    const sy = window.scrollY;
    if (sy > heroH()) return; /* skip when hero is fully scrolled past */

    const factor = sy / heroH();

    /* Name drifts up */
    nameBlock.style.transform = `translateY(${sy * 0.08}px)`;

    /* Status and lower fade out gently */
    if (heroStatus) heroStatus.style.opacity = `${clamp(1 - factor * 3, 0, 1)}`;
    if (heroLower)  heroLower.style.opacity  = `${clamp(1 - factor * 2.5, 0, 1)}`;
  });

  window.addEventListener('scroll', onScroll, { passive: true });
})();


/* ══════════════════════════════════════════════════════════════
   10. FORM BUTTON — shake keyframe injected via JS
   (avoids adding non-essential CSS to style.css)
══════════════════════════════════════════════════════════════ */
(function injectShakeKeyframe() {
  const style = document.createElement('style');
  style.textContent = `
    @keyframes shake {
      0%, 100% { transform: translateX(0); }
      20%       { transform: translateX(-6px); }
      40%       { transform: translateX(6px); }
      60%       { transform: translateX(-4px); }
      80%       { transform: translateX(4px); }
    }
    .form-submit-btn.shake {
      animation: shake 0.4s var(--ease-out);
    }
    /* Touch-expanded project on mobile */
    .project-link.touch-expanded .pi-desc {
      grid-template-rows: 1fr !important;
      margin-top: 1rem !important;
    }
  `;
  document.head.appendChild(style);
})();


/* ══════════════════════════════════════════════════════════════
   INIT — run everything once the DOM is ready
══════════════════════════════════════════════════════════════ */
onReady(() => {
  /* Stagger marquee items just a touch on first load */
  const marquee = qs('.marquee-band');
  if (marquee) {
    marquee.style.opacity = '0';
    marquee.style.transition = 'opacity 0.6s ease';
    /* Reveal after loader finishes */
    setTimeout(() => {
      marquee.style.opacity = '1';
    }, 1400);
  }
});