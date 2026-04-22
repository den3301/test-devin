/* =============================================================
   AETHERIA — interactions
   ============================================================= */

(() => {
  "use strict";

  const $  = (sel, root = document) => root.querySelector(sel);
  const $$ = (sel, root = document) => [...root.querySelectorAll(sel)];
  const prefersReduced = matchMedia("(prefers-reduced-motion: reduce)").matches;

  /* ------------------------------------------------------------
     Nav — scroll state
     ------------------------------------------------------------ */
  const nav = $("#nav");
  const onScroll = () => {
    if (window.scrollY > 30) nav.classList.add("is-scrolled");
    else nav.classList.remove("is-scrolled");
  };
  onScroll();
  window.addEventListener("scroll", onScroll, { passive: true });

  /* ------------------------------------------------------------
     Cursor aura
     ------------------------------------------------------------ */
  const aura = $("#cursorAura");
  let auraX = -400, auraY = -400, targetX = -400, targetY = -400;
  window.addEventListener("pointermove", (e) => {
    targetX = e.clientX;
    targetY = e.clientY;
  }, { passive: true });
  const auraLoop = () => {
    auraX += (targetX - auraX) * 0.12;
    auraY += (targetY - auraY) * 0.12;
    aura.style.transform = `translate(${auraX}px, ${auraY}px) translate(-50%,-50%)`;
    requestAnimationFrame(auraLoop);
  };
  if (!prefersReduced) requestAnimationFrame(auraLoop);

  /* ------------------------------------------------------------
     Particles (magical embers)
     ------------------------------------------------------------ */
  const canvas = $("#particles");
  const ctx = canvas.getContext("2d");
  let W = 0, H = 0, particles = [];

  const resize = () => {
    const dpr = Math.min(devicePixelRatio || 1, 2);
    W = canvas.width  = innerWidth  * dpr;
    H = canvas.height = innerHeight * dpr;
    canvas.style.width  = innerWidth + "px";
    canvas.style.height = innerHeight + "px";
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.scale(dpr, dpr);
  };
  resize();
  window.addEventListener("resize", resize);

  const rand = (a, b) => a + Math.random() * (b - a);

  const spawn = (count = 70) => {
    particles = [];
    for (let i = 0; i < count; i++) {
      particles.push({
        x: rand(0, innerWidth),
        y: rand(0, innerHeight),
        r: rand(0.4, 2.2),
        vx: rand(-0.12, 0.12),
        vy: rand(-0.45, -0.08),
        life: rand(0.3, 1),
        hue: Math.random() < 0.5 ? 44 : 262,
      });
    }
  };
  spawn();

  const tick = () => {
    ctx.clearRect(0, 0, innerWidth, innerHeight);
    for (const p of particles) {
      p.x += p.vx;
      p.y += p.vy;
      p.life -= 0.002;
      if (p.y < -10 || p.life <= 0) {
        p.x = rand(0, innerWidth);
        p.y = innerHeight + 10;
        p.life = rand(0.5, 1);
        p.vy = rand(-0.45, -0.08);
        p.vx = rand(-0.12, 0.12);
      }
      const alpha = Math.max(0, Math.min(1, p.life));
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
      ctx.fillStyle = `hsla(${p.hue}, 78%, ${p.hue === 44 ? 70 : 68}%, ${alpha * 0.7})`;
      ctx.shadowColor = `hsla(${p.hue}, 80%, 65%, ${alpha * 0.7})`;
      ctx.shadowBlur = 10;
      ctx.fill();
    }
    requestAnimationFrame(tick);
  };
  if (!prefersReduced) requestAnimationFrame(tick);

  /* ------------------------------------------------------------
     Reveal on scroll
     ------------------------------------------------------------ */
  const io = new IntersectionObserver((entries) => {
    entries.forEach((e) => {
      if (e.isIntersecting) {
        e.target.classList.add("is-in");
        io.unobserve(e.target);
      }
    });
  }, { rootMargin: "0px 0px -8% 0px", threshold: 0.05 });
  $$(".reveal").forEach((el) => io.observe(el));

  // also animate individual hero title lines that were styled separately
  $$(".hero__title .line").forEach((el) => io.observe(el));

  /* ------------------------------------------------------------
     Hero parallax (mouse + scroll)
     ------------------------------------------------------------ */
  const heroRoot = $("[data-parallax-root]");
  if (heroRoot) {
    const layers = $$("[data-depth]", heroRoot);
    let mx = 0, my = 0;
    window.addEventListener("pointermove", (e) => {
      mx = (e.clientX / innerWidth  - 0.5);
      my = (e.clientY / innerHeight - 0.5);
    }, { passive: true });

    const loop = () => {
      const sy = Math.min(window.scrollY, innerHeight);
      for (const l of layers) {
        const d = parseFloat(l.dataset.depth || "0.2");
        const tx = mx * d * 40;
        const ty = my * d * 40 + sy * d * 0.6;
        l.style.transform = `translate3d(${tx.toFixed(2)}px, ${ty.toFixed(2)}px, 0)`;
      }
      requestAnimationFrame(loop);
    };
    if (!prefersReduced) requestAnimationFrame(loop);
  }

  /* ------------------------------------------------------------
     Classes tabs
     ------------------------------------------------------------ */
  const tabs = $$(".tab");
  const clazzes = $$(".clazz");
  tabs.forEach((tab) => {
    tab.addEventListener("click", () => {
      const id = tab.dataset.tab;
      tabs.forEach(t => t.classList.toggle("is-active", t === tab));
      clazzes.forEach(c => c.classList.toggle("is-active", c.dataset.class === id));
    });
  });

  /* ------------------------------------------------------------
     Counters
     ------------------------------------------------------------ */
  const counters = $$("[data-count]");
  const counterIO = new IntersectionObserver((entries) => {
    entries.forEach((e) => {
      if (!e.isIntersecting) return;
      const el = e.target;
      const end = parseInt(el.dataset.count, 10);
      const dur = 1600;
      const t0 = performance.now();
      const step = (t) => {
        const p = Math.min(1, (t - t0) / dur);
        const eased = 1 - Math.pow(1 - p, 3);
        el.textContent = Math.round(end * eased).toLocaleString("ru-RU");
        if (p < 1) requestAnimationFrame(step);
      };
      requestAnimationFrame(step);
      counterIO.unobserve(el);
    });
  }, { threshold: 0.4 });
  counters.forEach((c) => counterIO.observe(c));

  /* ------------------------------------------------------------
     Trailer modal
     ------------------------------------------------------------ */
  const modal = $("#trailer");
  const openBtn = $("#trailerBtn");
  const closeBtn = $("#trailerClose");
  const openModal  = () => { modal.classList.add("is-open");  modal.setAttribute("aria-hidden","false"); };
  const closeModal = () => { modal.classList.remove("is-open"); modal.setAttribute("aria-hidden","true"); };
  openBtn && openBtn.addEventListener("click", openModal);
  closeBtn && closeBtn.addEventListener("click", closeModal);
  modal && modal.addEventListener("click", (e) => { if (e.target === modal) closeModal(); });
  document.addEventListener("keydown", (e) => { if (e.key === "Escape") closeModal(); });

  /* ------------------------------------------------------------
     Smooth anchor scroll for safety (in case browser disables)
     ------------------------------------------------------------ */
  $$("a[href^='#']").forEach((a) => {
    a.addEventListener("click", (e) => {
      const id = a.getAttribute("href");
      if (id.length > 1) {
        const target = document.querySelector(id);
        if (target) {
          e.preventDefault();
          target.scrollIntoView({ behavior: "smooth", block: "start" });
        }
      }
    });
  });

  /* ------------------------------------------------------------
     Gallery item mouse-tilt
     ------------------------------------------------------------ */
  $$(".gallery__item").forEach((el) => {
    el.addEventListener("pointermove", (e) => {
      const r = el.getBoundingClientRect();
      const x = (e.clientX - r.left) / r.width  - 0.5;
      const y = (e.clientY - r.top)  / r.height - 0.5;
      el.style.transform = `perspective(900px) rotateX(${(-y * 4).toFixed(2)}deg) rotateY(${(x * 5).toFixed(2)}deg)`;
    });
    el.addEventListener("pointerleave", () => {
      el.style.transform = "";
    });
  });

})();
