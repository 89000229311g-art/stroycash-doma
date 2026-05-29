(function () {
  var HANDLER_URL = "/form_handler.php";
  var RE = /forms\.tilda(cdn|api)\.[a-z]+\/procces/;

  // ── Layer 1: XHR interceptor ──────────────────────────────────────────────
  var nativeOpen = XMLHttpRequest.prototype.open;
  XMLHttpRequest.prototype.open = function (method, url) {
    if (typeof url === "string" && RE.test(url)) {
      url = HANDLER_URL;
    }
    return nativeOpen.call(this, method, url, arguments[2], arguments[3], arguments[4]);
  };

  // ── Layer 2: fetch interceptor ────────────────────────────────────────────
  if (typeof window.fetch === "function") {
    var nativeFetch = window.fetch;
    window.fetch = function (input, init) {
      var url = typeof input === "string" ? input : (input && input.url);
      if (url && RE.test(url)) {
        input = typeof input === "string" ? HANDLER_URL : new Request(HANDLER_URL, input);
      }
      return nativeFetch.call(this, input, init);
    };
  }

  // ── Layer 3: override window.tildaForm.send ───────────────────────────────
  function installSendOverride() {
    if (!window.tildaForm || typeof window.tildaForm.send !== "function") return false;

    window.tildaForm.send = function (form, btnSubmit, formType, formKey) {
      // tilda-forms passes form as Element; tilda-zero-forms does too
      if (form && !(form instanceof Element) && form[0]) form = form[0];
      if (btnSubmit && !(btnSubmit instanceof Element) && btnSubmit[0]) btnSubmit = btnSubmit[0];

      var data = new FormData(form);

      if (btnSubmit) {
        btnSubmit.classList.add("t-btn_sending");
        btnSubmit.tildaSendingStatus = "1";
      }

      var xhr = new XMLHttpRequest();
      nativeOpen.call(xhr, "POST", HANDLER_URL, true);
      xhr.setRequestHeader("Accept", "application/json, text/plain, */*");

      xhr.onreadystatechange = function () {
        if (xhr.readyState !== 4) return;

        if (btnSubmit) {
          btnSubmit.classList.remove("t-btn_sending");
          btnSubmit.tildaSendingStatus = "0";
        }

        var resp = {};
        try { resp = JSON.parse(xhr.responseText); } catch (e) {}

        if (xhr.status >= 200 && xhr.status < 300 && resp.answer) {
          var successUrl = form.getAttribute("data-success-url") || "";
          var successCb  = form.getAttribute("data-success-callback") || "";
          if (window.tildaForm.successEnd) {
            window.tildaForm.successEnd(form, successUrl, successCb);
          } else {
            var successBox = form.querySelector(".t-form__successbox, .js-successbox");
            var inputsBox  = form.querySelector(".t-form__inputsbox");
            if (successBox) successBox.style.display = "block";
            if (inputsBox)  inputsBox.style.display  = "none";
          }
        } else {
          var errText = (resp && resp.error) || "Ошибка отправки. Позвоните: +7 (343) 242-42-43";
          // T396 zero forms use popup errors
          var isPopupError = form.getAttribute("data-error-popup") === "y";
          if (isPopupError && window.tildaForm.showErrorInPopup) {
            window.tildaForm.showErrorInPopup(form, [errText]);
          } else {
            var errBoxes = form.querySelectorAll(
              ".t-form__errorbox-wrapper, .t-form__error, .js-errorbox, .js-errorbox-all"
            );
            errBoxes.forEach(function (el) {
              el.innerHTML = errText;
              el.style.display = "block";
            });
          }
        }
      };

      xhr.send(data);
      return false;
    };

    return true;
  }

  // Poll until tildaForm.send is available, then override it.
  // Re-check periodically in case an async script resets it.
  var pollCount = 0;
  var overrideInstalled = false;
  var poll = setInterval(function () {
    if (++pollCount > 200) { clearInterval(poll); return; }
    var installed = installSendOverride();
    if (installed && !overrideInstalled) {
      overrideInstalled = true;
      // Keep polling briefly to catch any late re-assignment by async scripts
    }
    if (overrideInstalled && pollCount > 50) {
      clearInterval(poll);
    }
  }, 100);

}());
