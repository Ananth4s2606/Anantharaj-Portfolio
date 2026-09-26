(() => {
  const reduced = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const isTouch = matchMedia('(hover: none), (pointer: coarse)').matches;

  /* ---------------- Animated tech/network background ---------------- */
  function initBGCanvas() {
    if (document.getElementById('bg-canvas')) return;

    const radar = document.createElement('div');
    radar.className = 'bg-radar';
    document.body.prepend(radar);

    const canvas = document.createElement('canvas');
    canvas.id = 'bg-canvas';
    document.body.prepend(canvas);
    const ctx = canvas.getContext('2d');

    let w, h, dpr = Math.min(devicePixelRatio || 1, 2);
    const isSmall = matchMedia('(max-width:700px)').matches;
    const count = isSmall ? 26 : 62;
    const linkDist = isSmall ? 110 : 150;
    const nodes = [];

    function resize() {
      w = innerWidth; h = innerHeight;
      canvas.width = w * dpr; canvas.height = h * dpr;
      canvas.style.width = w + 'px'; canvas.style.height = h + 'px';
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    }
    resize();
    addEventListener('resize', resize, { passive: true });

    for (let i = 0; i < count; i++) {
      nodes.push({
        x: Math.random() * w,
        y: Math.random() * h,
        vx: (Math.random() - 0.5) * 0.18,
        vy: (Math.random() - 0.5) * 0.18,
        r: Math.random() * 1.6 + 0.6,
        hue: Math.random() > 0.6 ? 'p' : 'c'
      });
    }

    function drawFrame() {
      ctx.clearRect(0, 0, w, h);
      for (let i = 0; i < nodes.length; i++) {
        const a = nodes[i];
        for (let j = i + 1; j < nodes.length; j++) {
          const b = nodes[j];
          const dx = a.x - b.x, dy = a.y - b.y;
          const dist = Math.hypot(dx, dy);
          if (dist < linkDist) {
            const alpha = (1 - dist / linkDist) * 0.16;
            ctx.strokeStyle = `rgba(25,230,255,${alpha})`;
            ctx.lineWidth = 1;
            ctx.beginPath();
            ctx.moveTo(a.x, a.y);
            ctx.lineTo(b.x, b.y);
            ctx.stroke();
          }
        }
      }
      nodes.forEach(n => {
        ctx.beginPath();
        ctx.fillStyle = n.hue === 'p' ? 'rgba(155,108,255,.55)' : 'rgba(25,230,255,.6)';
        ctx.shadowColor = n.hue === 'p' ? 'rgba(155,108,255,.8)' : 'rgba(25,230,255,.8)';
        ctx.shadowBlur = 6;
        ctx.arc(n.x, n.y, n.r, 0, Math.PI * 2);
        ctx.fill();
      });
    }

    function step() {
      nodes.forEach(n => {
        n.x += n.vx; n.y += n.vy;
        if (n.x < 0) n.x = w; if (n.x > w) n.x = 0;
        if (n.y < 0) n.y = h; if (n.y > h) n.y = 0;
      });
      drawFrame();
      raf = requestAnimationFrame(step);
    }

    let raf;
    if (reduced) {
      drawFrame();
      radar.style.animation = 'none';
    } else {
      raf = requestAnimationFrame(step);
      document.addEventListener('visibilitychange', () => {
        if (document.hidden) { cancelAnimationFrame(raf); }
        else { raf = requestAnimationFrame(step); }
      });
    }
  }

  /* ---------------- Loader sequence ---------------- */
  function runLoader() {
    const loader = document.getElementById('loader');
    const textEl = document.getElementById('loader-text');
    if (!loader) return;
    if (reduced) { loader.classList.add('fade-out'); setTimeout(() => loader.remove(), 300); return; }

    const lines = ['INITIALIZING SYSTEM...', 'LOADING PORTFOLIO...', 'SYSTEM READY'];
    let i = 0;
    const cycle = setInterval(() => {
      i++;
      if (!textEl) return;
      textEl.classList.add('swap');
      setTimeout(() => {
        if (i < lines.length) textEl.textContent = lines[i];
        textEl.classList.remove('swap');
      }, 200);
      if (i >= lines.length - 1) clearInterval(cycle);
    }, 1000);

    setTimeout(() => {
      loader.classList.add('fade-out');
      setTimeout(() => loader.remove(), 700);
    }, 3200);
  }

  /* ---------------- Scroll reveal (IntersectionObserver) ---------------- */
  function initReveal() {
    const els = document.querySelectorAll('.reveal');
    if (!('IntersectionObserver' in window) || reduced) {
      els.forEach(e => e.classList.add('show'));
      return;
    }
    const io = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          entry.target.classList.add('show');
          io.unobserve(entry.target);
        }
      });
    }, { threshold: 0.15, rootMargin: '0px 0px -60px 0px' });
    els.forEach(e => io.observe(e));
  }

  /* ---------------- Skill bars ---------------- */
  function initSkillBars() {
    const bars = document.querySelectorAll('[data-level]');
    if (!('IntersectionObserver' in window)) {
      bars.forEach(el => el.style.width = el.dataset.level + '%');
      return;
    }
    const io = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          entry.target.style.width = entry.target.dataset.level + '%';
          io.unobserve(entry.target);
        }
      });
    }, { threshold: 0.4 });
    bars.forEach(el => io.observe(el));
  }

  /* ---------------- Navbar: glass on scroll + active link ---------------- */
  function initNav() {
    const nav = document.querySelector('.nav');
    const navLinks = document.querySelectorAll('.nav nav a[href^="#"]');
    const sections = [...document.querySelectorAll('main section[id]')];

    const onScroll = () => {
      if (!nav) return;
      nav.classList.toggle('scrolled', scrollY > 30);
    };
    addEventListener('scroll', onScroll, { passive: true });
    onScroll();

    if ('IntersectionObserver' in window && sections.length) {
      const io = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
          if (entry.isIntersecting) {
            navLinks.forEach(a => a.classList.toggle('active', a.getAttribute('href') === '#' + entry.target.id));
          }
        });
      }, { threshold: 0.4, rootMargin: '-76px 0px -40% 0px' });
      sections.forEach(s => io.observe(s));
    }

    const menu = document.querySelector('.menu');
    const navEl = document.querySelector('.nav nav');
    if (menu && navEl) {
      menu.addEventListener('click', () => {
        const open = navEl.classList.toggle('mobile-open');
        menu.classList.toggle('open', open);
        navEl.style.display = open ? 'flex' : 'none';
        navEl.style.flexDirection = 'column';
        navEl.style.position = 'absolute';
        navEl.style.top = '76px';
        navEl.style.right = '20px';
        navEl.style.background = '#080c13';
        navEl.style.padding = '18px';
        navEl.style.border = '1px solid rgba(255,255,255,.1)';
        navEl.style.borderRadius = '14px';
      });
      navLinks.forEach(a => a.addEventListener('click', () => {
        if (matchMedia('(max-width:900px)').matches) {
          navEl.style.display = 'none';
          menu.classList.remove('open');
        }
      }));
    }
  }

  /* ---------------- Cursor glow + magnetic buttons + card tilt ---------------- */
  function initPointerFX() {
    if (isTouch || reduced) return;
    const glow = document.getElementById('cursor-glow');

    addEventListener('mousemove', (e) => {
      if (glow) {
        glow.style.left = e.clientX + 'px';
        glow.style.top = e.clientY + 'px';
      }
    }, { passive: true });

    document.querySelectorAll('.btn, .resume-btn').forEach(btn => {
      btn.addEventListener('mousemove', (e) => {
        const r = btn.getBoundingClientRect();
        btn.style.setProperty('--mx', ((e.clientX - r.left) / r.width * 100) + '%');
        btn.style.setProperty('--my', ((e.clientY - r.top) / r.height * 100) + '%');
      });
    });

    document.querySelectorAll('.project-feature, .skill-photo').forEach(card => {
      card.addEventListener('mousemove', (e) => {
        const r = card.getBoundingClientRect();
        const px = (e.clientX - r.left) / r.width - 0.5;
        const py = (e.clientY - r.top) / r.height - 0.5;
        card.style.transform = `translateY(-4px) rotateX(${(-py * 4).toFixed(2)}deg) rotateY(${(px * 4).toFixed(2)}deg)`;
      });
      card.addEventListener('mouseleave', () => { card.style.transform = ''; });
    });

    const heroVisual = document.getElementById('hero-visual');
    if (heroVisual) {
      document.querySelector('.hero')?.addEventListener('mousemove', (e) => {
        const r = heroVisual.getBoundingClientRect();
        const px = (e.clientX - r.left - r.width / 2) / r.width;
        const py = (e.clientY - r.top - r.height / 2) / r.height;
        heroVisual.style.transform = `translate(${(px * 14).toFixed(1)}px, ${(py * 14).toFixed(1)}px)`;
      }, { passive: true });
    }
  }

  /* ---------------- Back to top ---------------- */
  function initBackToTop() {
    const btn = document.getElementById('back-to-top');
    if (!btn) return;
    addEventListener('scroll', () => btn.classList.toggle('show', scrollY > 600), { passive: true });
    btn.addEventListener('click', () => scrollTo({ top: 0, behavior: reduced ? 'auto' : 'smooth' }));
  }

  /* ---------------- Resume placeholder + contact form ---------------- */
  function initMisc() {
    document.querySelectorAll('[data-resume]').forEach(a => a.addEventListener('click', e => {
      e.preventDefault();
      alert('Resume will be added soon.');
    }));
    const form = document.getElementById('contact-form');
    if (form) form.addEventListener('submit', e => {
      e.preventDefault();
      const d = new FormData(form);
      location.href = 'mailto:ananth4s2606@gmail.com?subject=' +
        encodeURIComponent('Portfolio contact from ' + d.get('name')) +
        '&body=' + encodeURIComponent(d.get('message') + '\n\nReply to: ' + d.get('email'));
    });
  }

  window.addEventListener('load', () => {
    initBGCanvas();
    runLoader();
    initReveal();
    initSkillBars();
    initNav();
    initPointerFX();
    initBackToTop();
    initMisc();
  });
})();
