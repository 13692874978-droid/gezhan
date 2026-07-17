// scroll.js — Lenis 平滑滚动 + GSAP 逐段揭示 + 关于逐句浮现 + 视频条拖动
window.initScroll = function initScroll() {
  "use strict";
  var reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  // —— Lenis 平滑滚动 ——
  var lenis = null;
  if (typeof Lenis !== "undefined" && !reduceMotion) {
    lenis = new Lenis({
      duration: 1.1,
      easing: function (t) { return Math.min(1, 1.001 - Math.pow(2, -10 * t)); },
      smoothWheel: true
    });
    window.lenisInstance = lenis;
    function raf(time) { lenis.raf(time); requestAnimationFrame(raf); }
    requestAnimationFrame(raf);
  }

  setupWritingMarquee(reduceMotion);

  // —— GSAP + ScrollTrigger ——
  if (typeof gsap !== "undefined" && typeof ScrollTrigger !== "undefined") {
    gsap.registerPlugin(ScrollTrigger);
    if (lenis) lenis.on("scroll", ScrollTrigger.update);

    if (reduceMotion) {
      document.querySelectorAll(".reveal").forEach(function (n) { n.classList.add("is-in"); });
      document.querySelectorAll(".about__text .clause__i").forEach(function (n) { n.style.opacity = 1; n.style.transform = "none"; });
      document.querySelectorAll(".about__moon").forEach(function (n) { n.style.opacity = 1; n.style.transform = "none"; });
      return;
    }

    gsap.set([".hero__overlay .eyebrow", ".hero__name", ".hero__tagline", ".hero__enter", ".hero__rail"], {
      opacity: 0,
      y: 28
    });
    gsap.timeline({ defaults: { ease: "power3.out" } })
      .to(".hero__overlay .eyebrow", { opacity: 1, y: 0, duration: 0.7 }, 0.12)
      .to(".hero__name", { opacity: 1, y: 0, duration: 0.95 }, 0.22)
      .to(".hero__tagline", { opacity: 1, y: 0, duration: 0.8 }, 0.48)
      .to(".hero__enter", { opacity: 1, y: 0, duration: 0.7 }, 0.62)
      .to(".hero__rail", { opacity: 1, y: 0, duration: 0.8 }, 0.72);

    // 单元素揭示
    document.querySelectorAll(".reveal").forEach(function (node) {
      if (node.closest("#about")) return;
      ScrollTrigger.create({
        trigger: node, start: "top 85%", once: true,
        onEnter: function () { node.classList.add("is-in"); }
      });
    });

    // 关于：标题、身份、正文逐句入场
    var clauses = document.querySelectorAll(".about__text .clause__i");
    var aboutHead = document.querySelectorAll("#about .eyebrow, #about .about__id");
    var aboutGhost = document.querySelector("#about .about__ghost");
    var aboutMoon = document.querySelector("#about .about__moon");
    if (clauses.length || aboutHead.length) {
      var aboutTl = null;
      function resetAbout() {
        if (aboutTl) aboutTl.kill();
        gsap.set(aboutHead, { opacity: 0, y: 24, filter: "blur(8px)" });
        gsap.set(clauses, { opacity: 0, y: 26, filter: "blur(10px)" });
        if (aboutGhost) gsap.set(aboutGhost, { opacity: 0, x: 80, zIndex: 0 });
        if (aboutMoon) gsap.set(aboutMoon, { opacity: 0, y: 44, scale: 1.04, zIndex: 1 });
      }
      function playAbout() {
        resetAbout();
        aboutTl = gsap.timeline({ defaults: { ease: "power3.out" } });
        if (aboutMoon) aboutTl.to(aboutMoon, { opacity: 1, y: 0, scale: 1, duration: 0.55 }, 0);
        if (aboutGhost) aboutTl.to(aboutGhost, { opacity: 1, x: 0, duration: 1.2 }, 0.55);
        aboutTl.to(aboutHead, { opacity: 1, y: 0, filter: "blur(0px)", duration: 0.75, stagger: 0.1 }, 0.08)
          .to(clauses, { opacity: 1, y: 0, filter: "blur(0px)", duration: 0.9, stagger: 0.16 }, 0.36);
      }
      resetAbout();
      ScrollTrigger.create({
        trigger: "#about",
        start: "top 68%",
        end: "bottom 20%",
        onEnter: playAbout,
        onEnterBack: playAbout,
        onLeave: resetAbout,
        onLeaveBack: resetAbout
      });
    }

    // 项目卡 stagger
    document.querySelectorAll(".card-grid").forEach(function (grid) {
      var cards = grid.children;
      gsap.set(cards, { opacity: 0, y: 30 });
      ScrollTrigger.create({
        trigger: grid, start: "top 80%", once: true,
        onEnter: function () {
          gsap.to(cards, { opacity: 1, y: 0, duration: 0.8, ease: "power3.out", stagger: 0.08 });
        }
      });
    });

    var contactBits = document.querySelectorAll("#contact .eyebrow, #contact .section__title, #contact .contact__links li, #contact .contact__hint, #contact .contact__copy");
    if (contactBits.length) {
      gsap.set(contactBits, { opacity: 0, y: 34, filter: "blur(8px)" });
      ScrollTrigger.create({
        trigger: "#contact",
        start: "top 72%",
        once: true,
        onEnter: function () {
          gsap.to(contactBits, {
            opacity: 1,
            y: 0,
            filter: "blur(0px)",
            duration: 0.9,
            ease: "power3.out",
            stagger: 0.12
          });
        }
      });
    }

    ScrollTrigger.refresh();
    // iframe 等异步内容加载后刷新位置
    window.addEventListener("load", function () { ScrollTrigger.refresh(); });
    window.addEventListener("pageshow", function () { ScrollTrigger.refresh(); });
  } else {
    document.querySelectorAll(".reveal").forEach(function (n) { n.classList.add("is-in"); });
    document.querySelectorAll(".about__text .clause__i").forEach(function (n) { n.style.opacity = 1; });
  }
};

function setupWritingMarquee(reduceMotion) {
  var marquee = document.getElementById("writingMarquee");
  if (!marquee || reduceMotion) return;

  var tracks = Array.prototype.slice.call(marquee.querySelectorAll(".marquee__track"));
  if (!tracks.length) return;

  var rows = tracks.map(function (track, index) {
    return {
      track: track,
      dir: track.classList.contains("marquee__track--rev") ? 1 : -1,
      x: 0,
      width: 1,
      base: index === 1 ? 34 : 42,
      measured: false
    };
  });

  function measure() {
    rows.forEach(function (row) {
      var set = row.track.querySelector(".marquee__set");
      row.width = Math.max(1, set ? set.scrollWidth : row.track.scrollWidth / 2);
      if (!row.measured && row.dir > 0) row.x = row.width * 0.5;
      row.measured = true;
      row.x = ((row.x % row.width) + row.width) % row.width;
    });
  }
  measure();
  window.addEventListener("resize", measure);

  var boost = 0;
  var lastScrollY = window.scrollY || 0;
  var lastTime = performance.now();
  var dragArmed = false;
  var dragging = false;
  var dragMoved = false;
  var dragStartX = 0;
  var dragLastX = 0;
  var dragVel = 0;

  function addBoost(amount) {
    boost = Math.min(260, boost + Math.abs(amount) * 0.55);
  }

  window.addEventListener("wheel", function (e) {
    addBoost(Math.abs(e.deltaY) > Math.abs(e.deltaX) ? e.deltaY : e.deltaX);
  }, { passive: true });

  var lastTouchY = null;
  window.addEventListener("touchstart", function (e) {
    lastTouchY = e.touches && e.touches.length ? e.touches[0].clientY : null;
  }, { passive: true });
  window.addEventListener("touchmove", function (e) {
    if (dragging) return;
    if (!e.touches || !e.touches.length || lastTouchY == null) return;
    var y = e.touches[0].clientY;
    addBoost(y - lastTouchY);
    lastTouchY = y;
  }, { passive: true });

  if (window.lenisInstance && window.lenisInstance.on) {
    window.lenisInstance.on("scroll", function (e) {
      if (e && typeof e.velocity === "number") addBoost(e.velocity * 4);
    });
  }

  function applyDrag(delta) {
    rows.forEach(function (row) {
      row.x += -delta * row.dir;
      row.x = ((row.x % row.width) + row.width) % row.width;
    });
  }

  marquee.addEventListener("mousedown", function (e) {
    dragArmed = true;
    dragging = false;
    dragMoved = false;
    dragStartX = dragLastX = e.clientX;
    dragVel = 0;
  });

  window.addEventListener("mousemove", function (e) {
    if (!dragArmed) return;
    var dx = e.clientX - dragLastX;
    dragLastX = e.clientX;
    if (!dragging && Math.abs(e.clientX - dragStartX) > 5) {
      dragging = true;
      dragMoved = true;
      marquee.classList.add("is-dragging");
    }
    if (!dragging) return;
    dragVel = dx;
    applyDrag(dx);
    if (e.cancelable) e.preventDefault();
  });

  window.addEventListener("mouseup", function () {
    if (!dragArmed && !dragging) return;
    dragArmed = false;
    if (!dragging) return;
    dragging = false;
    marquee.classList.remove("is-dragging");
    boost = Math.min(900, boost + Math.abs(dragVel) * 32);
  });

  marquee.addEventListener("touchstart", function (e) {
    if (!e.touches || !e.touches.length) return;
    dragArmed = true;
    dragging = false;
    dragMoved = false;
    dragStartX = dragLastX = e.touches[0].clientX;
    dragVel = 0;
  }, { passive: true });

  window.addEventListener("touchmove", function (e) {
    if (!dragArmed || !e.touches || !e.touches.length) return;
    var dx = e.touches[0].clientX - dragLastX;
    dragLastX = e.touches[0].clientX;
    if (!dragging && Math.abs(e.touches[0].clientX - dragStartX) > 5) {
      dragging = true;
      dragMoved = true;
      marquee.classList.add("is-dragging");
    }
    if (!dragging) return;
    dragVel = dx;
    applyDrag(dx);
  }, { passive: true });

  window.addEventListener("touchend", function () {
    if (!dragArmed && !dragging) return;
    dragArmed = false;
    if (!dragging) return;
    dragging = false;
    marquee.classList.remove("is-dragging");
    boost = Math.min(900, boost + Math.abs(dragVel) * 32);
  });

  marquee.addEventListener("click", function (e) {
    if (!dragMoved) return;
    e.preventDefault();
    e.stopPropagation();
    dragMoved = false;
  }, true);

  function frame(now) {
    var dt = Math.min(0.05, (now - lastTime) / 1000 || 0);
    lastTime = now;

    var currentY = window.scrollY || window.pageYOffset || 0;
    var dy = Math.abs(currentY - lastScrollY);
    lastScrollY = currentY;
    addBoost(dy);
    boost *= 0.86;

    rows.forEach(function (row) {
      if (dragging) {
        var offsetDragging = row.dir < 0 ? -row.x : row.x - row.width;
        row.track.style.transform = "translate3d(" + offsetDragging + "px,0,0)";
        return;
      }
      var speed = row.base + boost;
      row.x += row.dir * speed * dt;
      row.x = ((row.x % row.width) + row.width) % row.width;
      var offset = row.dir < 0 ? -row.x : row.x - row.width;
      row.track.style.transform = "translate3d(" + offset + "px,0,0)";
    });

    requestAnimationFrame(frame);
  }
  requestAnimationFrame(frame);
}
