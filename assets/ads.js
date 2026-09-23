/* ============================================================
   Sponsored links renderer — /assets/ads.js
   ------------------------------------------------------------
   Compliance-by-design:
   - renders ONLY into explicit slots: [data-ads-mount] (block, one
     per page) and [data-ads-inline] (labeled inline link, guides)
   - clearly labeled "Advertisement"/"Sponsored"; every anchor is a
     plain outbound <a href=DIRECT_URL target=_blank
     rel="sponsored nofollow noopener"> — native navigation, ZERO
     preventDefault() anywhere in this file
   - rotation with per-browser reshow window + click cooldown
   - labeled dual action: window.WADP_ADS.openSponsored('download')
     is available to the REAL Download button only; it opens ONE
     direct URL in a new tab via a real user gesture, honouring the
     minInterval guard. It is never called at page load, never on
     unrelated clicks, never without a deliberate user click.
   - duplicate-trigger prevention (render flag; single click record)
   - tracking stays 100% local (localStorage counters) — nothing is
     transmitted anywhere; the searched phone number is never read,
     stored, or sent to advertisers
   - zero network activity on page load: no fetches, no beacons,
     no iframes, no injected third-party scripts
   - broken/slow destinations can't affect the page: everything is
     an ordinary outbound link; toggle a link off in ads-config.js
   Usage: <div data-ads-mount></div>   <div data-ads-inline></div>
   Debug in console: WADP_ADS.stats() / WADP_ADS.reset()
   ============================================================ */
(function () {
  'use strict';

  var CFG = window.WA_DP_ADS || {};
  var STORE_KEY = 'wadp_ads_v1';

  function readState() {
    try { return JSON.parse(localStorage.getItem(STORE_KEY)) || {}; }
    catch (e) { return {}; }
  }
  function writeState(s) {
    try { localStorage.setItem(STORE_KEY, JSON.stringify(s)); } catch (e) { /* private mode */ }
  }

  /* links eligible for this browser right now.
     With applyReshow: excludes links shown to this browser recently
     (frequency cap for anything we RENDER). The download dual-action
     is user-triggered on a discovered result, so only the click
     cooldown applies there. */
  function poolFor(st, now, applyReshow) {
    var reshowMs = (CFG.reshowHours || 6) * 36e5;
    var coolMs = (CFG.cooldownHours || 72) * 36e5;
    return (CFG.links || []).filter(function (l) {
      if (!l.enabled || !/^https:\/\//.test(l.url)) return false;
      var clicked = st.clicks[l.id];
      if (clicked && now - clicked < coolMs) return false;
      if (applyReshow) {
        var shown = st.lastShown[l.id];
        if (shown && now - shown < reshowMs) return false;
      }
      return true;
    });
  }

  function nextPicks(pool, st, n) {
    if (!pool.length || n < 1) return [];
    var rot = typeof st.rot === 'number' ? st.rot : 0;
    var picks = [];
    for (var i = 0; picks.length < n && i < pool.length; i++) {
      picks.push(pool[(rot + i) % pool.length]);
    }
    st.rot = (rot + n) % pool.length;
    return picks;
  }

  /* ONE anchor builder used by every surface — identical compliance
     attributes everywhere. */
  function makeAnchor(link) {
    var a = document.createElement('a');
    a.className = 'sponsored-link';
    a.href = link.url;
    a.target = '_blank';
    a.rel = 'sponsored nofollow noopener';
    a.setAttribute('data-ad-id', link.id);
    a.setAttribute('aria-label', 'Sponsored link — opens an external site in a new tab');
    a.addEventListener('click', function () {
      var s2 = readState();
      s2.clicks = s2.clicks || {};
      s2.clicks[link.id] = Date.now();
      writeState(s2);
    }, { once: true }); /* navigation itself is never prevented */
    return a;
  }

  var ICON = '<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true">' +
             '<path d="M18 13v6a2 2 0 01-2 2H5a2 2 0 01-2-2V8a2 2 0 012-2h6M15 3h6v6M10 14L21 3"/></svg>';

  function render() {
    if (!CFG || CFG.enabled !== true) return;
    var st = readState();
    st.impr = st.impr || {}; st.clicks = st.clicks || {}; st.lastShown = st.lastShown || {};
    var now = Date.now();
    var pool = poolFor(st, now, true);

    /* ---------- block placements ---------- */
    var host = document.querySelector('[data-ads-mount]');
    if (host && host.dataset.adsRendered === '1') host = null; // duplicate-render prevention
    if (host && !pool.length) { host.remove(); host = null; }
    if (host) {
      host.dataset.adsRendered = '1';
      var picks = nextPicks(pool, st, Math.min(CFG.perPage || 2, pool.length));

      var section = document.createElement('section');
      section.className = 'sponsored';
      section.setAttribute('aria-label', 'Advertisement');
      section.setAttribute('data-nosnippet', '');

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
        var a = makeAnchor(link);
        a.innerHTML = ICON + '<span>' + (link.title || 'Sponsored offer') + '</span>';
        row.appendChild(a);
      });
      inner.appendChild(row);

      var note = document.createElement('p');
      note.className = 'sponsored-note';
      note.textContent = 'External partner links. We never share your searches with advertisers.';
      inner.appendChild(note);

      section.appendChild(inner);
      host.parentNode.replaceChild(section, host);
    }

    /* ---------- labeled inline placements (guides) ---------- */
    if (CFG.inlineSlots !== false) {
      var slots = document.querySelectorAll('[data-ads-inline]');
      for (var si = 0; si < slots.length; si++) {
        var slot = slots[si];
        if (slot.dataset.adsRendered === '1') continue;
        slot.dataset.adsRendered = '1';
        if (!pool.length) { slot.remove(); continue; }
        var pick = nextPicks(pool, st, 1)[0];
        st.impr[pick.id] = (st.impr[pick.id] || 0) + 1;
        st.lastShown[pick.id] = now;

        var p = document.createElement('p');
        p.className = 'sponsored-inline';
        p.setAttribute('data-nosnippet', '');

        var t = document.createElement('span');
        t.className = 'sponsored-tag';
        t.textContent = 'Sponsored';
        p.appendChild(t);
        p.appendChild(document.createTextNode(' '));

        var link = makeAnchor(pick);
        link.className = 'sponsored-inline-link';
        link.innerHTML = ICON + '<span>' + (pick.title || 'Special offer from our partners') + '</span>';
        p.appendChild(link);

        p.appendChild(document.createTextNode(' — external partner link, opens in a new tab.'));
        slot.parentNode.replaceChild(p, slot);
      }
    }

    writeState(st);
  }

  /* Labeled dual action for the REAL Download button only.
     - at most one partner tab per `minIntervalMinutes` per browser
     - honours per-link click cooldown; records the click
     - window.open happens synchronously inside the user's click
     Never auto-fires at load; never fires on unrelated clicks. */
  function openSponsored(source) {
    if (!CFG || CFG.enabled !== true) return null;
    if (source === 'download') {
      var od = CFG.openOnDownload || {};
      if (od.enabled !== true) return null;
    }
    var st = readState();
    st.clicks = st.clicks || {}; st.rot = typeof st.rot === 'number' ? st.rot : 0;
    var now = Date.now();
    var minGap = ((CFG.openOnDownload || {}).minIntervalMinutes || 0) * 6e4;
    if (st.lastDual && now - st.lastDual < minGap) return null;
    var pool = poolFor(st, now, false);
    if (!pool.length) return null;
    var pick = nextPicks(pool, st, 1)[0];
    st.clicks[pick.id] = now;
    st.lastDual = now;
    writeState(st);
    return window.open(pick.url, '_blank', 'noopener,noreferrer');
  }

  /* owner-facing, local-console stats — no data leaves the browser */
  window.WADP_ADS = {
    stats: function () { return JSON.parse(JSON.stringify(readState())); },
    reset: function () { try { localStorage.removeItem(STORE_KEY); } catch (e) {} },
    openSponsored: openSponsored
  };

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', render);
  } else {
    render();
  }
})();
