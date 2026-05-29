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

  // ── Layer 3: override window.tildaForm.send (most reliable) ──────────────
  // Poll until Tilda initialises its form object, then wrap send().
  var pollCount = 0;
  var poll = setInterval(function () {
    pollCount++;
    if (pollCount > 100) { clearInterval(poll); return; } // give up after 10 s

    if (!window.tildaForm || typeof window.tildaForm.send !== "function") return;
    clearInterval(poll);

    var originalSend = window.tildaForm.send;

    window.tildaForm.send = function (form, btnSubmit, formType, formKey) {
      // Gather form data
      var data = new FormData(form);

      // Reset button state & show loading
      if (btnSubmit) btnSubmit.classList.add("t-btn_sending");

      var xhr = new XMLHttpRequest();
      nativeOpen.call(xhr, "POST", HANDLER_URL, true);
      xhr.setRequestHeader("Accept", "application/json, text/plain, */*");

      xhr.onreadystatechange = function () {
        if (xhr.readyState !== 4) return;

        if (btnSubmit) btnSubmit.classList.remove("t-btn_sending");

        var resp = {};
        try { resp = JSON.parse(xhr.responseText); } catch (e) {}

        if (xhr.status >= 200 && xhr.status < 300 && resp.answer) {
          // Show Tilda success box
          var successBox = form.querySelector(".js-successbox");
          var inputsBox  = form.querySelector(".t-form__inputsbox");
          if (successBox) {
            successBox.innerHTML = resp.answer;
            successBox.style.display = "block";
          }
          if (inputsBox) inputsBox.style.display = "none";

          // Fire Tilda's own success callback if configured
          var cb = form.getAttribute("data-success-callback");
          if (cb && typeof window[cb] === "function") {
            window[cb](form, { answer: resp.answer });
          }
        } else {
          // Show error inside the form's error box
          var errText = (resp && resp.error) || "Ошибка отправки. Позвоните: +7 (343) 242-42-43";
          var errBox  = form.querySelector(".t-form__error") ||
                        form.querySelector(".js-errorbox");
          if (errBox) { errBox.innerHTML = errText; errBox.style.display = "block"; }
        }
      };

      xhr.send(data);
      return false; // prevent Tilda's own submission
    };
  }, 100);

}());
