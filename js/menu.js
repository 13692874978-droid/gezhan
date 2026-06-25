// menu.js — 全屏菜单开合 + 锚点平滑跳转
window.initMenu = function initMenu() {
  "use strict";
  var toggle = document.getElementById("menuToggle");
  var menu = document.getElementById("fullMenu");
  if (!toggle || !menu) return;

  function setOpen(open) {
    document.body.classList.toggle("menu-open", open);
    toggle.setAttribute("aria-expanded", open ? "true" : "false");
    toggle.setAttribute("aria-label", open ? "关闭菜单" : "打开菜单");
    menu.setAttribute("aria-hidden", open ? "false" : "true");
    if (window.lenisInstance) {
      open ? window.lenisInstance.stop() : window.lenisInstance.start();
    }
  }

  toggle.addEventListener("click", function () {
    setOpen(!document.body.classList.contains("menu-open"));
  });

  document.addEventListener("keydown", function (e) {
    if (e.key === "Escape" && document.body.classList.contains("menu-open")) setOpen(false);
  });

  // 平滑跳转（所有 data-link）
  function smoothTo(target) {
    var node = document.querySelector(target);
    if (!node) return;
    if (window.lenisInstance) {
      window.lenisInstance.scrollTo(node, { offset: 0, duration: 1.1 });
    } else {
      node.scrollIntoView({ behavior: "smooth" });
    }
  }

  document.querySelectorAll("[data-link]").forEach(function (a) {
    a.addEventListener("click", function (e) {
      var href = a.getAttribute("href") || "";
      if (href.charAt(0) !== "#") return;
      e.preventDefault();
      if (document.body.classList.contains("menu-open")) setOpen(false);
      // 等菜单收起动画稍微开始后再滚动
      setTimeout(function () { smoothTo(href); }, document.body.classList.contains("menu-open") ? 0 : 10);
    });
  });
};
