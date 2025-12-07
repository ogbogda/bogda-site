// Плавная прокрутка, мобильное меню, тема и canvas-звёздное поле
document.addEventListener('DOMContentLoaded', function () {
  // ---------------- Canvas starfield ----------------
  (function initStarfield() {
    const canvas = document.getElementById('starfield');
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    let w = 0, h = 0, stars = [], dpr = window.devicePixelRatio || 1;

    function createStars() {
      stars = [];
      const area = w * h;
      // плотность звёзд (регулируйте)
      let count = Math.floor(area * 0.00012);
      if (window.innerWidth < 600) count = Math.max(12, Math.floor(count * 0.45));
      for (let i = 0; i < count; i++) {
        stars.push({
          x: Math.random() * w,
          y: Math.random() * h,
          z: Math.random(), // глубина 0..1
          size: 0.6 + Math.random() * 1.6,
          speed: 0.2 + Math.random() * 0.9,
          phase: Math.random() * Math.PI * 2
        });
      }
    }

    function resize() {
      dpr = window.devicePixelRatio || 1;
      w = window.innerWidth;
      h = window.innerHeight;
      canvas.width = Math.max(1, Math.floor(w * dpr));
      canvas.height = Math.max(1, Math.floor(h * dpr));
      canvas.style.width = w + 'px';
      canvas.style.height = h + 'px';
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      createStars();
    }

    let last = performance.now();
    function frame(now) {
      const dt = Math.min(60, now - last) / 16.67; // нормализованный дельта
      last = now;

      // фон (мягкий градиент)
      ctx.clearRect(0, 0, w, h);
      const grad = ctx.createLinearGradient(0, 0, 0, h);
      grad.addColorStop(0, 'rgba(255,255,255,0.02)');
      grad.addColorStop(1, 'rgba(0,0,0,0.18)');
      ctx.fillStyle = grad;
      ctx.fillRect(0, 0, w, h);

      // отрисовка звёзд
      for (let i = 0; i < stars.length; i++) {
        const s = stars[i];
        // движение
        s.y += s.speed * 0.4 * dt;
        s.x -= s.speed * 0.03 * dt;
        if (s.y > h + 10) s.y = -10;
        if (s.x < -10) s.x = w + 10;

        // мигание
        s.phase += 0.02 * dt * (0.5 + s.z);
        const tw = (Math.sin(s.phase) + 1) / 2;
        const alpha = 0.25 + tw * (0.7 * s.z + 0.3);

        ctx.beginPath();
        const r = s.size * (0.6 + 0.8 * s.z);
        ctx.fillStyle = `rgba(255,255,255,${alpha.toFixed(3)})`;
        ctx.arc(s.x, s.y, r, 0, Math.PI * 2);
        ctx.fill();
      }

      requestAnimationFrame(frame);
    }

    // Инициализация
    resize();
    window.addEventListener('resize', resize, { passive: true });
    requestAnimationFrame(frame);
  })();

  // ---------------- UI: menu, theme, smooth scroll, form ----------------
  const toggle = document.querySelector('.menu-toggle');
  const nav = document.querySelector('.nav');
  const header = document.querySelector('.site-header');
  const body = document.body;
  const themeToggle = document.querySelector('.theme-toggle');

  const getHeaderHeight = () => (header ? header.offsetHeight : 0);

  // Theme init
  const applyTheme = (theme) => {
    if (theme === 'dark') body.classList.add('theme-dark');
    else body.classList.remove('theme-dark');
    if (themeToggle) themeToggle.setAttribute('aria-pressed', String(theme === 'dark'));
  };

  try {
    const saved = localStorage.getItem('theme');
    if (saved) applyTheme(saved);
    else {
      const prefersDark = window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches;
      applyTheme(prefersDark ? 'dark' : 'light');
    }
  } catch (e) {
    // ignore localStorage errors
  }

  if (themeToggle) {
    themeToggle.addEventListener('click', () => {
      const isDark = body.classList.contains('theme-dark');
      const next = isDark ? 'light' : 'dark';
      applyTheme(next);
      try { localStorage.setItem('theme', next); } catch (e) { }
    });
  }

  // Mobile menu
  if (toggle && nav) {
    toggle.addEventListener('click', () => {
      if (window.innerWidth <= 880) {
        const isOpen = toggle.getAttribute('aria-expanded') === 'true';
        toggle.setAttribute('aria-expanded', String(!isOpen));
        nav.style.display = nav.style.display === 'flex' ? 'none' : 'flex';
        nav.style.flexDirection = 'column';
        nav.style.gap = '12px';
        nav.style.padding = '12px 0';
      }
    });

    toggle.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        toggle.click();
      }
    });
  }

  // Close menu on Escape
  window.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && toggle && nav) {
      if (toggle.getAttribute('aria-expanded') === 'true') {
        toggle.setAttribute('aria-expanded', 'false');
        nav.style.display = 'none';
      }
    }
  });

  // Close menu on nav link click (mobile)
  document.querySelectorAll('.nav a').forEach(a => {
    a.addEventListener('click', () => {
      if (nav && window.innerWidth <= 880) {
        nav.style.display = 'none';
        if (toggle) toggle.setAttribute('aria-expanded', 'false');
      }
    });
  });

  // Smooth scroll for anchor links
  document.querySelectorAll('a[href^="#"]').forEach(anchor => {
    anchor.addEventListener('click', function (e) {
      const href = this.getAttribute('href');
      if (!href || href === '#') return;
      const targetId = href.slice(1);
      const target = document.getElementById(targetId);
      if (!target) return;
      e.preventDefault();
      const headerHeight = getHeaderHeight();
      const top = target.getBoundingClientRect().top + window.pageYOffset - headerHeight - 12;
      window.scrollTo({ top, behavior: 'smooth' });
    });
  });

  // On resize, clean up inline styles when switching to desktop layout
  window.addEventListener('resize', () => {
    if (!nav || !toggle) return;
    if (window.innerWidth > 880) {
      nav.style.display = '';
      nav.style.flexDirection = '';
      nav.style.gap = '';
      nav.style.padding = '';
      toggle.setAttribute('aria-expanded', 'false');
    } else {
      const expanded = toggle.getAttribute('aria-expanded') === 'true';
      if (expanded) {
        nav.style.display = 'flex';
        nav.style.flexDirection = 'column';
        nav.style.gap = '12px';
        nav.style.padding = '12px 0';
      }
    }
  });

  // Footer year
  const yearEl = document.getElementById('year');
  if (yearEl) yearEl.textContent = new Date().getFullYear();

  // Form validation
  const form = document.getElementById('contact-form');
  if (form) {
    const nameInput = form.querySelector('#name');
    const emailInput = form.querySelector('#email');
    const messageInput = form.querySelector('#message');
    const status = document.getElementById('form-status');

    const setError = (input, msg) => {
      const err = input.parentElement.querySelector('.field-error');
      input.setAttribute('aria-invalid', 'true');
      if (err) err.textContent = msg;
    };
    const clearError = (input) => {
      const err = input.parentElement.querySelector('.field-error');
      input.removeAttribute('aria-invalid');
      if (err) err.textContent = '';
    };

    form.addEventListener('submit', (e) => {
      e.preventDefault();
      let valid = true;
      if (!nameInput.value.trim()) {
        setError(nameInput, 'Введите имя');
        valid = false;
      } else {
        clearError(nameInput);
      }
      if (!emailInput.value.trim() || emailInput.value.indexOf('@') === -1) {
        setError(emailInput, 'Введите корректный email (должен содержать @)');
        valid = false;
      } else {
        clearError(emailInput);
      }
      if (!messageInput.value.trim()) {
        setError(messageInput, 'Введите сообщение');
        valid = false;
      } else {
        clearError(messageInput);
      }

      if (!valid) {
        if (status) status.textContent = 'Проверьте поля формы.';
        return;
      }

      // Для демонстрации — показываем сообщение об успешной отправке.
      if (status) status.textContent = 'Сообщение отправлено (локально).';
      form.reset();
    });

    [nameInput, emailInput, messageInput].forEach(inp => {
      if (!inp) return;
      inp.addEventListener('input', () => clearError(inp));
    });
  }
});
