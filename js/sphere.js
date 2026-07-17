// sphere.js — 首屏滚动文字球
window.initSphere = function initSphere() {
  "use strict";

  var canvas = document.getElementById("sphere-canvas");
  if (!canvas || typeof THREE === "undefined") return;

  var hero = document.getElementById("hero") || canvas;
  var reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  var words = (window.SITE && window.SITE.sphereWords) || [
    "Philosophy", "Artificial Intelligence", "Literature", "Theory",
    "Criticism", "Thinking", "Sharing", "Freedom"
  ];
  var repeatedWords = [];
  for (var r = 0; r < 5; r += 1) repeatedWords = repeatedWords.concat(words);

  var renderer = new THREE.WebGLRenderer({ canvas: canvas, alpha: true, antialias: true });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
  renderer.outputEncoding = THREE.sRGBEncoding;

  var scene = new THREE.Scene();
  var camera = new THREE.PerspectiveCamera(38, 1, 0.1, 100);
  camera.position.set(0, 0, 12);

  var sphere = new THREE.Group();
  scene.add(sphere);

  function makeTextTexture(text) {
    var textureCanvas = document.createElement("canvas");
    var ctx = textureCanvas.getContext("2d");
    var dpr = 2;
    textureCanvas.width = 512 * dpr;
    textureCanvas.height = 128 * dpr;
    ctx.scale(dpr, dpr);
    ctx.clearRect(0, 0, 512, 128);
    ctx.font = "500 34px 'IBM Plex Mono', 'SFMono-Regular', Menlo, monospace";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.shadowColor = "rgba(76, 125, 255, 0.45)";
    ctx.shadowBlur = 18;
    ctx.fillStyle = "rgba(236, 231, 221, 0.92)";
    ctx.fillText(text, 256, 64);
    var texture = new THREE.CanvasTexture(textureCanvas);
    texture.encoding = THREE.sRGBEncoding;
    texture.needsUpdate = true;
    return texture;
  }

  function addWord(text, index, total) {
    var i = index + 0.5;
    var phi = Math.acos(1 - 2 * i / total);
    var theta = Math.PI * (1 + Math.sqrt(5)) * i;
    var radius = 3.5;
    var sprite = new THREE.Sprite(new THREE.SpriteMaterial({
      map: makeTextTexture(text),
      transparent: true,
      depthWrite: false,
      opacity: 0.88
    }));
    sprite.position.set(
      radius * Math.cos(theta) * Math.sin(phi),
      radius * Math.sin(theta) * Math.sin(phi),
      radius * Math.cos(phi)
    );
    var scale = text.length > 16 ? 1.75 : 1.35;
    sprite.scale.set(scale * 2.2, scale * 0.55, 1);
    sphere.add(sprite);
  }

  repeatedWords.forEach(function (word, index) {
    addWord(word, index, repeatedWords.length);
  });

  var wireMaterial = new THREE.MeshBasicMaterial({
    color: 0x4c7dff,
    transparent: true,
    opacity: 0.09,
    wireframe: true
  });
  var wire = new THREE.Mesh(new THREE.SphereGeometry(3.58, 32, 18), wireMaterial);
  sphere.add(wire);

  var rotX = -0.12;
  var rotY = 0.22;
  var velX = 0;
  var velY = reduceMotion ? 0 : 0.0032;
  var dragging = false;
  var lastX = 0;
  var lastY = 0;

  function canStartDrag(e) {
    var target = e.target;
    if (target && target.closest && target.closest("a, button, .hero__overlay, .hero__rail, .topbar, .fullmenu")) return false;
    var p = e.touches ? e.touches[0] : e;
    var rect = canvas.getBoundingClientRect();
    var localX = p.clientX - rect.left;
    return localX > rect.width * 0.28;
  }

  function pointerDown(e) {
    if (!canStartDrag(e)) return;
    dragging = true;
    var p = e.touches ? e.touches[0] : e;
    lastX = p.clientX;
    lastY = p.clientY;
    velX = 0;
    velY = 0;
    document.body.classList.add("sphere-dragging");
    if (e.cancelable) e.preventDefault();
  }

  function pointerMove(e) {
    if (!dragging) return;
    var p = e.touches ? e.touches[0] : e;
    var dx = p.clientX - lastX;
    var dy = p.clientY - lastY;
    lastX = p.clientX;
    lastY = p.clientY;
    rotY += dx * 0.006;
    rotX += dy * 0.004;
    velY = dx * 0.001;
    velX = dy * 0.0007;
    if (e.cancelable) e.preventDefault();
  }

  function pointerUp() {
    dragging = false;
    document.body.classList.remove("sphere-dragging");
  }

  hero.addEventListener("mousedown", pointerDown);
  window.addEventListener("mousemove", pointerMove);
  window.addEventListener("mouseup", pointerUp);
  window.addEventListener("mouseleave", pointerUp);
  hero.addEventListener("touchstart", pointerDown, { passive: false });
  window.addEventListener("touchmove", pointerMove, { passive: false });
  window.addEventListener("touchend", pointerUp);
  window.addEventListener("touchcancel", pointerUp);

  function resize() {
    var rect = canvas.getBoundingClientRect();
    var w = rect.width || window.innerWidth;
    var h = rect.height || window.innerHeight;
    renderer.setSize(w, h, false);
    camera.aspect = w / h;
    camera.updateProjectionMatrix();

    var halfH = Math.tan((38 * Math.PI / 180) / 2) * camera.position.z;
    var halfW = halfH * camera.aspect;
    sphere.position.x = halfW * 0.36;
    sphere.position.y = -0.05;
    sphere.scale.setScalar(1.04);
  }
  window.addEventListener("resize", resize);
  resize();

  var visible = true;
  if ("IntersectionObserver" in window) {
    new IntersectionObserver(function (entries) {
      visible = entries[0].isIntersecting;
    }, { threshold: 0.01 }).observe(canvas);
  }

  function animate() {
    requestAnimationFrame(animate);
    if (!visible) return;

    if (!dragging) {
      rotY += velY;
      rotX += velX;
      velY += ((reduceMotion ? 0 : 0.0032) - velY) * 0.02;
      velX += (0 - velX) * 0.03;
    }
    rotX = Math.max(-0.85, Math.min(0.85, rotX));
    sphere.rotation.x = rotX;
    sphere.rotation.y = rotY;
    sphere.rotation.z += reduceMotion ? 0 : 0.0007;
    renderer.render(scene, camera);
  }
  animate();
};
