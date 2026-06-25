// main.js — 入口：依次初始化各模块
(function () {
  "use strict";
  document.documentElement.classList.remove("no-js");

  function boot() {
    try { if (window.initScroll)  window.initScroll();  } catch (e) { console.error("scroll", e); }
    try { if (window.initSphere)  window.initSphere();  } catch (e) { console.error("sphere", e); }
    try { if (window.initMenu)    window.initMenu();    } catch (e) { console.error("menu", e); }
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", boot);
  } else {
    boot();
  }
})();
