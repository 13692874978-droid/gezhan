(function () {
  "use strict";

  var button = document.getElementById("siteChatbotButton");
  var panel = document.getElementById("siteChatbotPanel");
  var close = document.getElementById("siteChatbotClose");
  var frame = panel && panel.querySelector(".site-chatbot__frame");
  if (!button || !panel || !close || !frame) return;

  function freshUrl(url) {
    var glue = url.indexOf("?") === -1 ? "?" : "&";
    return url + glue + "site_cache_bust=" + Date.now();
  }

  function setOpen(open) {
    if (open && !frame.src) {
      frame.src = freshUrl(frame.getAttribute("data-src"));
    }
    panel.hidden = !open;
    button.setAttribute("aria-expanded", open ? "true" : "false");
    if (!open) {
      frame.removeAttribute("src");
    }
  }

  button.addEventListener("click", function () {
    setOpen(panel.hidden);
  });
  close.addEventListener("click", function () {
    setOpen(false);
  });
  document.addEventListener("keydown", function (event) {
    if (event.key === "Escape") setOpen(false);
  });
}());
