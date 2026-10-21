// EcoMind System — інтерактив сторінки

(() => {
  const header = document.getElementById('header');
  const burger = document.getElementById('burger');
  const nav = document.getElementById('nav');

  // Шапка: фон після початку скролу
  const onScroll = () => header.classList.toggle('is-scrolled', window.scrollY > 12);
  onScroll();
  window.addEventListener('scroll', onScroll, { passive: true });

  // Мобільне меню
  const setMenu = (open) => {
    nav.classList.toggle('is-open', open);
    burger.setAttribute('aria-expanded', String(open));
    burger.setAttribute('aria-label', open ? 'Закрити меню' : 'Відкрити меню');
    document.body.style.overflow = open ? 'hidden' : '';
  };
  burger.addEventListener('click', () => setMenu(!nav.classList.contains('is-open')));
  nav.querySelectorAll('a').forEach((link) => link.addEventListener('click', () => setMenu(false)));
  document.addEventListener('keydown', (e) => { if (e.key === 'Escape') setMenu(false); });

  // Перший екран показуємо одразу, без очікування скролу
  document.querySelectorAll('.hero .reveal').forEach((el, i) => {
    el.style.transitionDelay = `${i * 90}ms`;
    setTimeout(() => el.classList.add('is-visible'), 30);
  });

  // Легкий паралакс фото на першому екрані (лише десктоп і без «зменшення руху»)
  const heroImg = document.querySelector('.hero__photo img');
  const calm = window.matchMedia('(prefers-reduced-motion: reduce)');
  const wide = window.matchMedia('(min-width: 901px)');
  if (heroImg) {
    let ticking = false;
    const parallax = () => {
      ticking = false;
      const y = (!calm.matches && wide.matches) ? Math.min(window.scrollY, window.innerHeight) * 0.12 : 0;
      heroImg.style.setProperty('--parallax', `${y.toFixed(1)}px`);
    };
    window.addEventListener('scroll', () => {
      if (!ticking) { ticking = true; requestAnimationFrame(parallax); }
    }, { passive: true });
  }

  // Підхід EcoMind: наведення чи фокус на рівні тихо підсвічує його коло на схемі
  const approachBody = document.querySelector('.approach__body');
  if (approachBody) {
    const levels = [...approachBody.querySelectorAll('.level')];
    const setLevel = (n) => {
      approachBody.dataset.active = n;
      levels.forEach((el) => el.classList.toggle('is-active', el.dataset.level === n));
    };
    levels.forEach((el) => {
      el.addEventListener('mouseenter', () => setLevel(el.dataset.level));
      el.addEventListener('focus', () => setLevel(el.dataset.level));
      el.addEventListener('mouseleave', () => setLevel('0'));
      el.addEventListener('blur', () => setLevel('0'));
    });
  }

  // Сигнали на схемах «Було / Стало»: запускаються по черзі, коли схема вже намальована
  const startSignals = (card) => {
    if (calm.matches) return;
    card.querySelectorAll('.shift__signals').forEach((group) => {
      const motions = group.querySelectorAll('animateMotion');
      if (!motions.length || typeof motions[0].beginElement !== 'function') return;
      group.classList.add('is-running');
      motions.forEach((m, i) => {
        const offset = (parseFloat(m.getAttribute('dur')) * 1000 / motions.length) * i;
        setTimeout(() => {
          m.beginElement();
          m.parentNode.style.opacity = '1';
        }, 1900 + offset);
      });
    });
  };

  // Цифри в «Про мене» плавно нараховуються від нуля
  const countUp = (root) => {
    if (calm.matches) return;
    root.querySelectorAll('[data-count]').forEach((el) => {
      const target = Number(el.dataset.count);
      const start = performance.now();
      const step = (now) => {
        const t = Math.min((now - start) / 1400, 1);
        el.textContent = Math.round(target * (1 - Math.pow(1 - t, 3)));
        if (t < 1) requestAnimationFrame(step);
      };
      el.textContent = '0';
      requestAnimationFrame(step);
    });
  };

  // Поява решти блоків при скролі
  const items = document.querySelectorAll('main > :not(.hero) .reveal');
  if (!('IntersectionObserver' in window)) {
    items.forEach((el) => el.classList.add('is-visible'));
    return;
  }
  const io = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
      if (!entry.isIntersecting) return;
      entry.target.classList.add('is-visible');
      startSignals(entry.target);
      countUp(entry.target);
      io.unobserve(entry.target);
    });
  }, { threshold: 0.15, rootMargin: '0px 0px -40px 0px' });

  items.forEach((el, i) => {
    // невелика затримка для елементів, що з'являються разом
    el.style.transitionDelay = `${Math.min(i % 4, 3) * 90}ms`;
    io.observe(el);
  });
})();
