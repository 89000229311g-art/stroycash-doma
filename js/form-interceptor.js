(function () {
  "use strict";

  var HANDLER_URL = "/form_handler.php";

  /* ── Попап "Спасибо" ─────────────────────────────────────────────────────── */
  function showThankYou() {
    var overlay = document.createElement("div");
    overlay.id = "sc-thankyou";
    overlay.style.cssText = [
      "position:fixed;top:0;left:0;right:0;bottom:0",
      "z-index:2147483647",
      "background:rgba(255,255,255,0.96)",
      "display:flex;align-items:center;justify-content:center",
      "animation:scFadeIn .25s ease"
    ].join(";");

    overlay.innerHTML =
      '<style>' +
      '@keyframes scFadeIn{from{opacity:0}to{opacity:1}}' +
      '#sc-thankyou-box{text-align:center;padding:48px 32px;max-width:420px;background:#fff;border-radius:8px;box-shadow:0 8px 40px rgba(0,0,0,.12)}' +
      '#sc-thankyou-box .sc-check{font-size:56px;line-height:1;margin-bottom:16px;color:#2ab26e}' +
      '#sc-thankyou-box h2{margin:0 0 10px;font-size:24px;font-weight:700;color:#111}' +
      '#sc-thankyou-box p{margin:0 0 28px;font-size:16px;color:#555;line-height:1.5}' +
      '#sc-thankyou-btn{display:inline-block;padding:13px 36px;background:#e63000;color:#fff;border:none;border-radius:4px;font-size:16px;cursor:pointer;font-family:inherit}' +
      '#sc-thankyou-btn:hover{background:#cc2a00}' +
      '</style>' +
      '<div id="sc-thankyou-box">' +
        '<div class="sc-check">✓</div>' +
        '<h2>Спасибо!</h2>' +
        '<p>Ваша заявка принята.<br>Мы свяжемся с вами в ближайшее время.</p>' +
        '<button id="sc-thankyou-btn">Закрыть</button>' +
      '</div>';

    document.body.appendChild(overlay);

    var btn = overlay.querySelector("#sc-thankyou-btn");
    btn.onclick = function () { overlay.remove(); };
    overlay.onclick = function (e) { if (e.target === overlay) overlay.remove(); };
  }

  /* ── Отправка формы ──────────────────────────────────────────────────────── */
  function submitForm(form, submitBtn) {
    if (submitBtn) {
      submitBtn.classList.add("t-btn_sending");
      submitBtn.disabled = true;
    }

    var xhr = new XMLHttpRequest();
    xhr.open("POST", HANDLER_URL, true);
    xhr.setRequestHeader("Accept", "application/json");

    xhr.onreadystatechange = function () {
      if (xhr.readyState !== 4) return;

      if (submitBtn) {
        submitBtn.classList.remove("t-btn_sending");
        submitBtn.disabled = false;
      }

      var data = {};
      try { data = JSON.parse(xhr.responseText); } catch (e) {}

      if (data.answer) {
        showThankYou();
      } else {
        alert(data.error || "Ошибка отправки. Позвоните: +7 (343) 242-42-43");
      }
    };

    xhr.send(new FormData(form));
  }

  /* ── Перехват window.tildaForm.send ─────────────────────────────────────── */
  /* Tilda вызывает tildaForm.send после своей валидации. Заменяем на нашу     */
  /* отправку — никаких обращений к серверам Tilda.                             */
  function hookTildaSend() {
    if (!window.tildaForm || typeof window.tildaForm.send !== "function") return false;

    window.tildaForm.send = function (form, btn) {
      /* Tilda может передать jQuery-обёртку вместо DOM-элемента */
      if (form && !(form instanceof Element) && form[0]) form = form[0];
      if (btn  && !(btn  instanceof Element) && btn[0])  btn  = btn[0];
      submitForm(form, btn);
      return false;
    };

    return true;
  }

  /* Ждём загрузки tilda-forms.js (он async) и ставим перехват.              */
  /* Проверяем 200 раз × 50 мс = 10 секунд.                                  */
  var attempts = 0;
  var poller = setInterval(function () {
    if (++attempts > 200) { clearInterval(poller); return; }
    if (hookTildaSend()) { clearInterval(poller); }
  }, 50);

  /* ── Запасной перехват: XHR на уровне прототипа ─────────────────────────── */
  /* Если tildaForm.send не был перехвачен вовремя, ловим XHR напрямую.       */
  var _open = XMLHttpRequest.prototype.open;
  XMLHttpRequest.prototype.open = function (method, url) {
    if (typeof url === "string" && /tilda(cdn|api).*\/procces/i.test(url)) {
      url = HANDLER_URL;
    }
    return _open.apply(this, arguments);
  };

  /* ── Запасной перехват: fetch ────────────────────────────────────────────── */
  if (typeof window.fetch === "function") {
    var _fetch = window.fetch;
    window.fetch = function (input, init) {
      var url = typeof input === "string" ? input : (input && input.url) || "";
      if (/tilda(cdn|api).*\/procces/i.test(url)) {
        input = typeof input === "string" ? HANDLER_URL : new Request(HANDLER_URL, input);
      }
      return _fetch.call(this, input, init);
    };
  }

}());
