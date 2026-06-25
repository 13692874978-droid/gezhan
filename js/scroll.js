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
    if (clauses.length || aboutHead.length) {
      gsap.set(aboutHead, { opacity: 0, y: 24, filter: "blur(8px)" });
      gsap.set(clauses, { opacity: 0, y: 26, filter: "blur(10px)" });
      if (aboutGhost) gsap.set(aboutGhost, { opacity: 0, x: 80 });
      ScrollTrigger.create({
        trigger: "#about", start: "top 68%", once: true,
        onEnter: function () {
          var tl = gsap.timeline({ defaults: { ease: "power3.out" } });
          if (aboutGhost) tl.to(aboutGhost, { opacity: 1, x: 0, duration: 1.2 }, 0);
          tl.to(aboutHead, { opacity: 1, y: 0, filter: "blur(0px)", duration: 0.75, stagger: 0.1 }, 0.08)
            .to(clauses, { opacity: 1, y: 0, filter: "blur(0px)", duration: 0.9, stagger: 0.16 }, 0.36);
        }
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

  function addBoost(amount) {
    boost = Math.min(900, boost + Math.abs(amount) * 2.6);
  }

  window.addEventListener("wheel", function (e) {
    addBoost(Math.abs(e.deltaY) > Math.abs(e.deltaX) ? e.deltaY : e.deltaX);
  }, { passive: true });

  var lastTouchY = null;
  window.addEventListener("touchstart", function (e) {
    lastTouchY = e.touches && e.touches.length ? e.touches[0].clientY : null;
  }, { passive: true });
  window.addEventListener("touchmove", function (e) {
    if (!e.touches || !e.touches.length || lastTouchY == null) return;
    var y = e.touches[0].clientY;
    addBoost(y - lastTouchY);
    lastTouchY = y;
  }, { passive: true });

  if (window.lenisInstance && window.lenisInstance.on) {
    window.lenisInstance.on("scroll", function (e) {
      if (e && typeof e.velocity === "number") addBoost(e.velocity * 18);
    });
  }

  function frame(now) {
    var dt = Math.min(0.05, (now - lastTime) / 1000 || 0);
    lastTime = now;

    var currentY = window.scrollY || window.pageYOffset || 0;
    var dy = Math.abs(currentY - lastScrollY);
    lastScrollY = currentY;
    addBoost(dy);
    boost *= 0.92;

    rows.forEach(function (row) {
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
