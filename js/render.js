// render.js — 读取 data/content.js，渲染全站内容
(function () {
  "use strict";
  var S = window.SITE || {};

  function el(id) { return document.getElementById(id); }
  function esc(s) { return String(s == null ? "" : s).replace(/[&<>"']/g, function (c) {
    return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c];
  }); }

  // —— 基本信息 ——
  if (el("heroName"))    el("heroName").textContent = S.name || "";
  if (el("heroTagline")) el("heroTagline").textContent = S.tagline || "";
  if (el("aboutId"))     el("aboutId").textContent = S.aboutId || "";
  document.title = (S.name ? S.name + " · " : "") + "个人站点";

  // —— 关于：把段落按标点拆成小句，供逐句浮现 ——
  var aboutText = el("aboutText");
  if (aboutText && S.about) {
    var parts = S.about.split(/(?<=[。，；！？、])/); // 保留标点
    aboutText.innerHTML = parts.map(function (p) {
      if (!p.trim()) return "";
      return '<span class="clause"><span class="clause__i">' + esc(p) + "</span></span>";
    }).join("");
  }

  // —— 项目 ——
  var works = el("worksGrid");
  if (works && Array.isArray(S.projects)) {
    works.innerHTML = S.projects.map(function (p) {
      var tags = (p.tags || []).map(function (t) { return "<span>" + esc(t) + "</span>"; }).join("");
      var href = p.demo || p.repo || "#";
      var links = "";
      if (p.demo) links += '<span class="work__link">观看 ↗</span>';
      return '' +
        '<a class="work reveal" href="' + esc(href) + '" target="_blank" rel="noopener">' +
          '<div class="work__cover"><img src="' + esc(p.cover) + '" alt="' + esc(p.title) + ' 封面" loading="lazy"></div>' +
          '<div class="work__body">' +
            '<h3 class="work__title">' + esc(p.title) + '</h3>' +
            '<p class="work__desc">' + esc(p.desc) + '</p>' +
            '<div class="work__tags">' + tags + '</div>' +
            '<div class="work__links">' + links + '</div>' +
          '</div>' +
        '</a>';
    }).join("");
  }

  // —— 文字：三排横向滚动跑马灯（可点击跳转知乎）——
  var marquee = el("writingMarquee");
  if (marquee && Array.isArray(S.articles)) {
    var rows = [[], [], []];
    S.articles.forEach(function (a, i) { rows[i % 3].push(a); });

    function chip(a) {
      return '<a class="chip" href="' + esc(a.url) + '" target="_blank" rel="noopener">' +
               '<span class="chip__t">' + esc(a.title) + '</span>' +
               '<span class="chip__a" aria-hidden="true">↗</span>' +
             '</a>';
    }
    function photoChip(idx) {
      var src = "./assets/images/about-" + (idx + 1) + ".jpg";
      return '<span class="chip chip--photo" aria-hidden="true">' +
               '<img src="' + esc(src) + '" alt="" loading="lazy">' +
             '</span>';
    }
    marquee.innerHTML = rows.map(function (row, idx) {
      var inner = row.map(chip).join("") + photoChip(idx);
      // 复制一份内容实现无缝循环
      var dir = idx === 1 ? " marquee__track--rev" : "";
      return '<div class="marquee__row">' +
               '<div class="marquee__track' + dir + '">' +
                 '<div class="marquee__set">' + inner + '</div>' +
                 '<div class="marquee__set" aria-hidden="true">' + inner + '</div>' +
                 '<div class="marquee__set" aria-hidden="true">' + inner + '</div>' +
               '</div>' +
             '</div>';
    }).join("");
  }

  // —— 影像：三列视频网格（标题/封面由 B 站公开接口补全）——
  var track = el("sharingTrack");
  if (track && Array.isArray(S.videos)) {
    function applyVideoMeta(card, data) {
      if (!card || !data) return;
      var title = data.title || card.getAttribute("data-bvid") || "视频";
      var frame = card.querySelector(".vcard__frame");
      var titleNode = card.querySelector(".vcard__title");
      if (titleNode) titleNode.textContent = title;
      if (frame && data.pic) {
        frame.innerHTML = '<img src="' + esc(data.pic) + '" alt="' + esc(title) + ' 封面" loading="lazy" referrerpolicy="no-referrer">';
      }
    }

    function fetchVideoMeta(card, bvid) {
      var api = "https://api.bilibili.com/x/web-interface/view?bvid=" + encodeURIComponent(bvid);
      var fallbackTimer = setTimeout(function () { applyVideoFallback(card, bvid); }, 1800);
      fetch(api)
        .then(function (res) { return res.json(); })
        .then(function (json) {
          if (json && json.data) {
            clearTimeout(fallbackTimer);
            applyVideoMeta(card, json.data);
          }
          else loadVideoMetaJsonp(card, bvid);
        })
        .catch(function () { loadVideoMetaJsonp(card, bvid); });
    }

    function loadVideoMetaJsonp(card, bvid) {
      var cb = "__biliMeta_" + bvid.replace(/\W/g, "") + "_" + Math.random().toString(36).slice(2);
      window[cb] = function (json) {
        try { if (json && json.data) applyVideoMeta(card, json.data); }
        finally {
          delete window[cb];
          if (script && script.parentNode) script.parentNode.removeChild(script);
        }
      };
      var script = document.createElement("script");
      script.src = "https://api.bilibili.com/x/web-interface/view?bvid=" + encodeURIComponent(bvid) + "&jsonp=jsonp&callback=" + cb;
      script.onerror = function () {
        delete window[cb];
        if (script.parentNode) script.parentNode.removeChild(script);
      };
      document.head.appendChild(script);
    }

    function applyVideoFallback(card, bvid) {
      if (!card || card.querySelector("img")) return;
      var titleNode = card.querySelector(".vcard__title");
      var frame = card.querySelector(".vcard__frame");
      if (titleNode) titleNode.textContent = "B站视频 " + bvid;
      if (frame) {
        var n = Math.abs(bvid.split("").reduce(function (sum, ch) { return sum + ch.charCodeAt(0); }, 0)) % 8 + 1;
        frame.innerHTML = '<img src="./assets/images/about-' + n + '.jpg" alt="' + esc(bvid) + ' 封面" loading="lazy">' +
          '<span class="vcard__loading vcard__loading--fallback">点击观看</span>';
      }
    }

    track.innerHTML = S.videos.map(function (v, i) {
      var href = v.url || ("https://www.bilibili.com/video/" + encodeURIComponent(v.bvid) + "/");
      var title = v.title || ("视频 " + (i + 1));
      return '' +
        '<a class="vcard reveal" href="' + esc(href) + '" target="_blank" rel="noopener" data-bvid="' + esc(v.bvid) + '">' +
          '<div class="vcard__frame">' +
            (v.pic ? '<img src="' + esc(v.pic) + '" alt="' + esc(title) + ' 封面" loading="lazy" referrerpolicy="no-referrer">' : '<span class="vcard__loading">读取封面</span>') +
          '</div>' +
          '<p class="vcard__title">' + esc(title) + '</p>' +
        '</a>';
    }).join("");

    track.querySelectorAll(".vcard[data-bvid]").forEach(function (card) {
      var bvid = card.getAttribute("data-bvid");
      if (!bvid || card.querySelector("img")) return;
      fetchVideoMeta(card, bvid);
    });
  }

  // —— 联络 ——
  var links = el("contactLinks");
  if (links && S.contact) {
    var c = S.contact, items = [];
    if (c.email)    items.push('<li><a href="mailto:' + esc(c.email) + '">' + esc(c.email) + '</a></li>');
    if (c.wechat)   items.push('<li><button class="wx" type="button" data-wx="' + esc(c.wechat) + '">微信 ' + esc(c.wechat) + '</button></li>');
    if (c.zhihu)    items.push('<li><a href="' + esc(c.zhihu) + '" target="_blank" rel="noopener">知乎</a></li>');
    if (c.bilibili) items.push('<li><a href="' + esc(c.bilibili) + '" target="_blank" rel="noopener">哔哩哔哩</a></li>');
    links.innerHTML = items.join("");
    // 微信号点击复制
    links.querySelectorAll(".wx").forEach(function (b) {
      b.addEventListener("click", function () {
        var wx = b.getAttribute("data-wx");
        if (navigator.clipboard) navigator.clipboard.writeText(wx).then(function () {
          var old = b.textContent; b.textContent = "已复制 " + wx;
          setTimeout(function () { b.textContent = old; }, 1600);
        });
      });
    });
  }
  var hint = el("contactHint");
  if (hint && S.contact && S.contact.wechat) hint.textContent = "点击微信号即可复制。";
  var copy = el("contactCopy");
  if (copy) copy.textContent = "© " + new Date().getFullYear() + " " + (S.name || "");
})();
