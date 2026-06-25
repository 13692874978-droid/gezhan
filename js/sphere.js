// sphere.js — 首屏签名元素：由英文词构成、自转、可拖拽带惯性的 3D 文字球
window.initSphere = function initSphere() {
  "use strict";
  var canvas = document.getElementById("sphere-canvas");
  if (!canvas || typeof THREE === "undefined") return;

  var reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  var S = window.SITE || {};
  var baseWords = (S.sphereWords && S.sphereWords.length)
    ? S.sphereWords
    : ["Philosophy", "Literature", "Theory", "Criticism", "Thinking", "Sharing", "Freedom"];

  var isSmall = window.innerWidth < 640;
  var repeat = isSmall ? 7 : 11;           // 每词重复次数
  var words = [];
  for (var r = 0; r < repeat; r++) {
    for (var i = 0; i < baseWords.length; i++) words.push(baseWords[i]);
  }
  // 适度打散，避免相同词扎堆
  for (var k = words.length - 1; k > 0; k--) {
    var j = Math.floor(Math.random() * (k + 1));
    var t = words[k]; words[k] = words[j]; words[j] = t;
  }

  var COLORS = { paper: "#ECE7DD", halo: "#9C8CF5", ink: "#0C0C10" };

  var renderer = new THREE.WebGLRenderer({ canvas: canvas, alpha: true, antialias: true });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));

  var scene = new THREE.Scene();
  var camera = new THREE.PerspectiveCamera(55, 1, 0.1, 100);
  camera.position.z = 13;

  var group = new THREE.Group();
  scene.add(group);

  var RADIUS = isSmall ? 6.4 : 8.8;

  // 用 Canvas 画词 → 贴图 → Sprite
  function makeWordTexture(text) {
    var dpr = Math.min(window.devicePixelRatio || 1, 2);
    var fontPx = 46;
    var pad = 28;
    var lineH = fontPx * 1.1;
    var c = document.createElement("canvas");
    var ctx = c.getContext("2d");
    var font = "500 " + fontPx + "px 'IBM Plex Mono', monospace";
    ctx.font = font;

    // 较长的多词短语（如 ARTIFICIAL INTELLIGENCE）拆成两行，避免变成横幅
    var label = text.toUpperCase();
    var lines = [label];
    if (label.indexOf(" ") > -1 && label.length > 11) lines = label.split(/\s+/);

    var maxLineW = 0;
    lines.forEach(function (l) { maxLineW = Math.max(maxLineW, ctx.measureText(l).width); });
    var w = Math.ceil(maxLineW) + pad * 2;
    var h = Math.ceil(lineH * lines.length) + pad * 2;

    c.width = w * dpr; c.height = h * dpr;
    ctx.scale(dpr, dpr);
    ctx.font = font;
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillStyle = COLORS.paper;
    var startY = h / 2 - (lines.length - 1) * lineH / 2;
    lines.forEach(function (l, i) { ctx.fillText(l, w / 2, startY + i * lineH); });

    var tex = new THREE.CanvasTexture(c);
    tex.minFilter = THREE.LinearFilter;
    tex.needsUpdate = true;
    return { tex: tex, aspect: w / h };
  }

  var sprites = [];
  var N = words.length;
  var offset = 2 / N;
  var increment = Math.PI * (3 - Math.sqrt(5)); // golden angle

  for (var n = 0; n < N; n++) {
    var made = makeWordTexture(words[n]);
    var mat = new THREE.SpriteMaterial({
      map: made.tex, transparent: true, depthTest: false, depthWrite: false
    });
    var sp = new THREE.Sprite(mat);
    // Fibonacci sphere 均匀分布
    var y = n * offset - 1 + offset / 2;
    var rad = Math.sqrt(Math.max(0, 1 - y * y));
    var phi = n * increment;
    sp.position.set(Math.cos(phi) * rad * RADIUS, y * RADIUS, Math.sin(phi) * rad * RADIUS);
    var scale = isSmall ? 1.02 : 1.16;
    sp.scale.set(scale * made.aspect, scale, 1);
    group.add(sp);
    sprites.push(sp);
  }

  // —— 拖拽 + 惯性 ——
  var rotX = 0.18, rotY = 0;
  var velX = 0, velY = reduceMotion ? 0 : 0.0052;
  var autoY = reduceMotion ? 0 : 0.0052;
  var dragging = false, lastX = 0, lastY = 0;

  function pointerDown(e) {
    dragging = true;
    var p = e.touches ? e.touches[0] : e;
    lastX = p.clientX; lastY = p.clientY;
    velX = velY = 0;
  }
  function pointerMove(e) {
    if (!dragging) return;
    var p = e.touches ? e.touches[0] : e;
    var dx = p.clientX - lastX, dy = p.clientY - lastY;
    lastX = p.clientX; lastY = p.clientY;
    rotY += dx * 0.005;
    rotX += dy * 0.005;
    velY = dx * 0.001;
    velX = dy * 0.001;
    if (e.cancelable) e.preventDefault();
  }
  function pointerUp() { dragging = false; }

  canvas.addEventListener("mousedown", pointerDown);
  window.addEventListener("mousemove", pointerMove);
  window.addEventListener("mouseup", pointerUp);
  canvas.addEventListener("touchstart", pointerDown, { passive: true });
  canvas.addEventListener("touchmove", pointerMove, { passive: false });
  canvas.addEventListener("touchend", pointerUp);

  // —— 尺寸 + 把球偏到右侧（与左下的名字呼应）——
  function resize() {
    var rect = canvas.getBoundingClientRect();
    var w = rect.width || window.innerWidth;
    var h = rect.height || window.innerHeight;
    renderer.setSize(w, h, false);
    camera.aspect = w / h;
    camera.updateProjectionMatrix();

    var halfH = Math.tan((55 * Math.PI / 180) / 2) * camera.position.z;
    var halfW = halfH * camera.aspect;
    // 窄屏居中略偏；宽屏明显靠右，像参考页一样占据首屏右侧大面积。
    group.position.x = (w < 760) ? halfW * 0.16 : halfW * 0.42;
  }
  window.addEventListener("resize", resize);
  resize();

  // —— 可见性：不可见时暂停渲染 ——
  var visible = true;
  if ("IntersectionObserver" in window) {
    new IntersectionObserver(function (entries) {
      visible = entries[0].isIntersecting;
    }, { threshold: 0.01 }).observe(canvas);
  }

  // 整体压暗：基色比 paper 暗很多，紫光只做极轻点缀，避免与名字相冲
  var dimColor = new THREE.Color(0x6c6860);
  var haloColor = new THREE.Color(0x9c8cf5);

  function animate() {
    requestAnimationFrame(animate);
    if (!visible) return;

    if (!dragging) {
      rotY += velY; rotX += velX;
      // 惯性衰减，回归自转
      velY += (autoY - velY) * 0.03;
      velX += (0 - velX) * 0.05;
    }
    rotX = Math.max(-0.9, Math.min(0.9, rotX));
    group.rotation.y = rotY;
    group.rotation.x = rotX;

    // 景深辉光：按世界坐标 z 调透明度与颜色
    for (var i = 0; i < sprites.length; i++) {
      var sp = sprites[i];
      var wp = sp.position.clone().applyMatrix4(group.matrixWorld);
      var depth = (wp.z + RADIUS) / (2 * RADIUS); // 0 后 → 1 前
      sp.material.opacity = 0.08 + depth * 0.48;
      var mix = Math.pow(depth, 3) * 0.36;
      sp.material.color.copy(dimColor).lerp(haloColor, mix);
    }
    renderer.render(scene, camera);
  }
  animate();
};
