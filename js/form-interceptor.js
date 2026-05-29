(function () {
  var HANDLER_URL = "/form_handler.php";
  var RE = /forms\.tilda(cdn|api)\.[a-z]+\/procces/;

  // Intercept XMLHttpRequest (used by Tilda forms)
  var origOpen = XMLHttpRequest.prototype.open;
  XMLHttpRequest.prototype.open = function (method, url) {
    var newUrl = (typeof url === "string" && RE.test(url)) ? HANDLER_URL : url;
    return origOpen.call(this, method, newUrl, arguments[2], arguments[3], arguments[4]);
  };

  // Intercept fetch (fallback for newer Tilda versions)
  if (typeof window.fetch === "function") {
    var origFetch = window.fetch;
    window.fetch = function (resource, init) {
      if (typeof resource === "string" && RE.test(resource)) {
        resource = HANDLER_URL;
      } else if (resource && typeof resource.url === "string" && RE.test(resource.url)) {
        resource = new Request(HANDLER_URL, resource);
      }
      return origFetch.call(this, resource, init);
    };
  }
})();
