/**
 * Deferred third-party bootstrap (Zoho SalesIQ, Mailchimp).
 * Loaded as an external script so strict CSP (vercel.json) does not block inline handlers.
 */
(function () {
  window.$zoho = window.$zoho || {};
  window.$zoho.salesiq = window.$zoho.salesiq || {};
  window.$zoho.salesiq.values = window.$zoho.salesiq.values || {};

  // Stamp visitor field before the widget script loads (Zoho calls ready() once).
  window.$zoho.salesiq.ready = function () {
    try {
      if (window.$zoho.salesiq.visitor && typeof window.$zoho.salesiq.visitor.info === 'function') {
        window.$zoho.salesiq.visitor.info({
          'Portal Source': 'MPB Health',
        });
      }
    } catch (_err) {
      // Non-fatal — chat widget should still load if info() fails.
    }
  };

  function isProductionHostname() {
    var hostname = window.location.hostname;
    return hostname === 'mpb.health' || hostname === 'www.mpb.health';
  }

  function loadThirdPartyScripts() {
    if (!isProductionHostname()) {
      return;
    }

    var d = document;
    var s = d.createElement('script');
    s.type = 'text/javascript';
    s.id = 'zsiqscript';
    s.defer = true;
    s.src = 'https://salesiq.zohopublic.com/widget?wc=siq341f0a21deffa52db946003babb9a87b';
    var t = d.getElementsByTagName('script')[0];
    t.parentNode.insertBefore(s, t);

    !function (c, h, i, m, p) {
      m = c.createElement(h);
      p = c.getElementsByTagName(h)[0];
      m.async = 1;
      m.src = i;
      p.parentNode.insertBefore(m, p);
    }(
      document,
      'script',
      'https://chimpstatic.com/mcjs-connected/js/users/6c93f6cc2c451ffa2accc8784/188d44b94b277adffffa6d9a3.js'
    );
  }

  if ('requestIdleCallback' in window) {
    requestIdleCallback(loadThirdPartyScripts);
  } else {
    setTimeout(loadThirdPartyScripts, 2000);
  }
})();
