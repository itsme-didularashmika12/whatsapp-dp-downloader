/* ============================================================
   Sponsored links renderer — /assets/ads.js
   ----------------------------------------------------------------
   Compliance-by-design:
   - renders ONLY into pages that contain [data-ads-mount] (one slot)
   - clearly labeled "Advertisement"; links carry rel="sponsored
     nofollow noopener" and open in a new tab on USER CLICK only
   - rotation with per-browser cooldown & reshow windows
   - duplicate-trigger prevention (bound once; click recorded once
     per navigation)
   - tracking stays 100% local (localStorage counters) — nothing is
     transmitted anywhere, and the phone number a user searched is
     never read, stored, or sent to advertisers
   - zero network activity on page load: no fetches, no beacons,
     no iframes, no injected third-party scripts
   - broken/slow destinations can't affect the page: the slot is an
     ordinary outbound link; toggle a link off in ads-config.js
   Usage: <div data-ads-mount></div>
   Debug in console: WADP_ADS.stats() / WADP_ADS.reset()
   ============================================================ */
(function () {
  'use strict';

  var CFG = window.WA_DP_ADS || {};
  var STORE_KEY = 'wadp_ads_v1';
  var NS = 'wadp-ads';

  function readState() {
    try { return JSON.parse(localStorage.getItem(STORE_KEY)) || {}; }
    catch (e) { return {}; }
  }
  function writeState(s) {
    try { localStorage.setItem(STORE_KEY, JSON.stringify(s)); } catch (e) { /* private mode */ }
  }

  function mount() {
    /* one mount per page — deliberately by design */
    return document.querySelector('[data-ads-mount]');
  }

  function render() {
    if (!CFG || CFG.enabled !== true) return;
    var host = mount();
    if (!host) return;
    if (host.dataset.adsRendered === '1') return; // duplicate-render prevention
    host.dataset.adsRendered = '1';

    var st = readState();
    st.impr = st.impr || {}; st.clicks = st.clicks || {}; st.lastShown = st.lastShown || {};
    var now = Date.now();
    var reshowMs = (CFG.reshowHours || 6) * 36e5;
    var coolMs = (CFG.cooldownHours || 72) * 36e5;

    var pool = (CFG.links || []).filter(function (l) {
      if (!l.enabled || !/^https:\/\//.test(l.url)) return false;
      var clicked = st.clicks[l.id];
      if (clicked && now - clicked < coolMs) return false;      // per-user click cooldown
      var shown = st.lastShown[l.id];
      if (shown && now - shown < reshowMs) return false;         // frequency cap
      return true;
    });
    if (!pool.length) { host.remove(); return; }

    /* fair round-robin so every enabled link rotates evenly */
    st.rot = typeof st.rot === 'number' ? st.rot : 0;
    var wants = Math.min(CFG.perPage || 2, pool.length);
    var picks = [];
    for (var i = 0; i < pool.length && picks.length < wants; i++) {
      picks.push(pool[(st.rot + i) % pool.length]);
    }
    st.rot = (st.rot + wants) % Math.max(pool.length, 1);

    var section = document.createElement('section');
    section.className = 'sponsored';
    section.setAttribute('aria-label', 'Advertisement');
    section.setAttribute('data-nosnippet', ''); // keep ad text out of search snippets

    var inner = document.createElement('div');
    inner.className = 'wrap sponsored-inner';

    var tag = document.createElement('span');
    tag.className = 'sponsored-tag';
    tag.textContent = 'Advertisement';
    inner.appendChild(tag);

    var row = document.createElement('div');
    row.className = 'sponsored-row';

    picks.forEach(function (link) {
      st.impr[link.id] = (st.impr[link.id] || 0) + 1;
      st.lastShown[link.id] = now;

      var a = document.createElement('a');
      a.className = 'sponsored-link';
      a.href = link.url;
      a.target = '_blank';
      a.rel = 'sponsored nofollow noopener';
      a.setAttribute('aria-label', 'Sponsored link — opens an external site in a new tab');
      a.setAttribute('data-ad-id', link.id);
      a.innerHTML =
        '<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true">' +
        '<path d="M18 13v6a2 2 0 01-2 2H5a2 2 0 01-2-2V8a2 2 0 012-2h6M15 3h6v6M10 14L21 3"/></svg>' +
        '<span>' + (link.title || 'Sponsored offer') + '</span>';
      a.addEventListener('click', function () {
        var s2 = readState();
        s2.clicks = s2.clicks || {};
        s2.clicks[link.id] = Date.now();
        writeState(s2);
      }, { once: true }); // a single navigation counts once
      row.appendChild(a);
    });

    inner.appendChild(row);

    var note = document.createElement('p');
    note.className = 'sponsored-note';
    note.textContent = 'External partner links. We never share your searches with advertisers.';
    inner.appendChild(note);

    section.appendChild(inner);
    writeState(st);

    var parent = host.parentNode;
    parent.replaceChild(section, host);
  }

  /* owner-facing, local-console stats — no data leaves the browser */
  window.WADP_ADS = {
    stats: function () { return JSON.parse(JSON.stringify(readState())); },
    reset: function () { try { localStorage.removeItem(STORE_KEY); } catch (e) {} }
  };

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', render);
  } else {
    render();
  }
})();
