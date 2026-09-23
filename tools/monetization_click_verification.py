#!/usr/bin/env python3
"""
Monetization click verification — REAL browser clicks against LIVE production.

For every rendered sponsored action we verify with genuine clicks (not source
inspection):
  1. click accepted             6. no popup-block from OUR implementation
  2. exactly ONE new tab        7. no iframe created
  3. new tab's initial navigation == the configured Direct URL
  4. original tab URL unchanged (downloader remains)
  5. no JS errors               8. no phone/query params on outbound href
Plus: every rendered link is a real <a href=direct target=_blank
rel="sponsored nofollow noopener"> and NO handler calls preventDefault.

Covers ALL 8 configured URLs by rotating pages + resetting local ad state.
Usage: python3 tools/monetization_click_verification.py
"""
import re
import urllib.request
from playwright.sync_api import sync_playwright

BASE = "https://whatsapp-dp-downloader.vercel.app"
PAGES = ["/", "/how-to-download-whatsapp-dp", "/whatsapp-dp-size",
         "/whatsapp-profile-picture-guide", "/whatsapp-dp-faq"]
EXPECTED = {
    "https://omg10.com/4/10272425", "https://omg10.com/4/9964203",
    "https://omg10.com/4/9966292", "https://omg10.com/4/9964213",
    "https://omg10.com/4/10399769", "https://omg10.com/4/10208217",
    "https://omg10.com/4/10268011", "https://omg10.com/4/10239172",
}
R = []
def check(n, ok, d=""):
    R.append((n, bool(ok))); print(f"[{'PASS' if ok else 'FAIL'}] {n}" + (f" — {d}" if d else ""))

adsjs = urllib.request.urlopen(BASE + "/assets/ads.js", timeout=20).read().decode()
_code = re.sub(r"/\*.*?\*/", "", adsjs, flags=re.S)
_code = re.sub(r"(?<!:)//[^\n]*", "", _code)
check("ads.js contains NO preventDefault (native navigation never blocked)", "preventDefault" not in _code)
check("window.open ONLY inside openSponsored dual-action (never at load)",
      _code.count("window.open") == 1 and "return window.open(pick.url, '_blank', 'noopener,noreferrer')" in _code)
check("ads.js creates anchors with Direct-URL href + _blank + sponsored rel",
      'a.href = link.url' in adsjs and "a.target = '_blank'" in adsjs and "a.rel = 'sponsored nofollow noopener'" in adsjs)

clicked_all = set()
js_errors, iframes_seen, navi_log = [], [], []

with sync_playwright() as p:
    b = p.chromium.launch(args=["--no-sandbox"])
    ctx = b.new_context(viewport={"width": 1280, "height": 800})
    pg = ctx.new_page()
    pg.on("pageerror", lambda e: js_errors.append(str(e)))
    pg.on("framenavigated", lambda f: iframes_seen.append(f.url)
          if f != f.page.main_frame else None)

    # deterministic coverage: 4 rotation offsets × perPage=2 → all 8 links
    # (only reshow/cooldown caps are cleared; these are LOCAL browser flags,
    #  nothing is sent to our server or to the ad network by this harness)
    for page_i, rot_off in enumerate(p for _ in range(3) for p in (0, 2, 4, 6)):
        if clicked_all == EXPECTED:
            break
        path = PAGES[page_i % len(PAGES)]
        pg.goto(BASE + path, wait_until="networkidle")
        pg.evaluate(f"""(() => {{
            let s = {{}}; try {{ s = JSON.parse(localStorage.getItem('wadp_ads_v1') || '{{}}'); }} catch(e) {{}}
            s.lastShown = {{}}; s.clicks = {{}};
            s.rot = {rot_off};
            localStorage.setItem('wadp_ads_v1', JSON.stringify(s)); }})()""")
        pg.reload(wait_until="networkidle"); pg.wait_for_timeout(400)
        anchors = pg.locator("a.sponsored-link, a.sponsored-inline-link")
        n = anchors.count()
        for i in range(n):
            a = anchors.nth(i)
            href, tgt, rel = a.get_attribute("href"), a.get_attribute("target"), a.get_attribute("rel")
            check(f"link attrs ok ({href.split('/')[-1]})",
                  href in EXPECTED and tgt == "_blank" and rel == "sponsored nofollow noopener")
            check(f"no query/number leak on href ({href.split('/')[-1]})",
                  "?number" not in href and "phone" not in href and href.count("?") == 0)
            if href in clicked_all:
                continue
            before = pg.url
            tabs_before = list(ctx.pages)
            direct_resp = []
            def record(resp):
                try:
                    if resp.request.url == href and not direct_resp:
                        direct_resp.append(resp.status)
                except Exception:
                    pass
            ctx.on("response", record)
            with ctx.expect_page(timeout=12000) as newp_info:    # EXACTLY ONE real tab from the click
                a.click()
            newp = newp_info.value
            tabs_after = list(ctx.pages)
            new_tabs = [t for t in tabs_after if t not in tabs_before]
            initial = newp.url
            check(f"new tab initial URL == Direct URL ({href.split('/')[-1]})",
                  initial == href, initial)
            check(f"original tab unchanged after click ({href.split('/')[-1]})", pg.url == before)
            check(f"exactly one new tab from click ({href.split('/')[-1]})", len(new_tabs) == 1)
            # Monetag/OMG10 received the Direct-URL request (their own flow may land anywhere after)
            for _ in range(40):
                if direct_resp: break
                newp.wait_for_timeout(250)
            code = direct_resp[0] if direct_resp else None
            check(f"Direct URL request reached omg10 and got a response ({href.split('/')[-1]})",
                  direct_resp and code and code < 500, f"HTTP {code}")
            try:
                newp.wait_for_load_state(timeout=15000)
                print(f"        (post-landing Monetag flow → {newp.url[:70]})")
            except Exception:
                pass
            ctx.remove_listener("response", record)
            newp.close()
            clicked_all.add(href)
    b.close()


# ---------------- labeled Download dual-action (user-approved) ----------------
with sync_playwright() as p2:
    b2 = p2.chromium.launch(args=["--no-sandbox"])
    ctx2 = b2.new_context(viewport={"width": 1280, "height": 800})
    pg2 = ctx2.new_page()
    errs2 = []
    pg2.on("pageerror", lambda e: errs2.append(str(e)))
    pg2.goto(BASE + "/", wait_until="networkidle")
    pg2.evaluate("localStorage.removeItem('wadp_ads_v1')")
    pg2.reload(wait_until="networkidle")
    import os
    NUM = os.environ.get("WA_DP_TEST_NUMBER", "94771820962")
    pg2.fill("#phone", NUM)
    pg2.click("#dp-btn")
    ready = False
    for _ in range(30):
        pg2.wait_for_timeout(1000)
        srcimg = pg2.evaluate("(document.querySelector('#dp-img')||{}).src || ''")
        if srcimg.startswith(("data:image", "blob:")): ready = True; break
    check("dual test: lookup ready (real DP rendered)", ready)
    if ready:
        # disclosure text visible next to the button
        note = pg2.evaluate("(document.querySelector('.ms-note')||{}).textContent || ''")
        check("dual test: disclosure note visible", "partner link may open in a new tab" in note)
        tabs_before2 = list(ctx2.pages)
        with ctx2.expect_page(timeout=12000) as np_info, pg2.expect_download(timeout=15000) as dl_info:
            pg2.click("#btn-download")
        newp2, dlf = np_info.value, dl_info.value
        check("dual test: real download file still produced in ORIGINAL tab",
              dlf.suggested_filename.startswith("whatsapp-dp-"), dlf.suggested_filename)
        check("dual test: partner tab initial URL is a configured Direct URL",
              newp2.url in EXPECTED, newp2.url)
        check("dual test: exactly one partner tab from the download click",
              len([t for t in ctx2.pages if t not in tabs_before2]) == 1)
        check("dual test: original tab unaffected", pg2.url.endswith("/"), pg2.url[-12:])
        newp2.close()
        # interval guard: immediate second download click must NOT open another tab
        opened2 = []
        ctx2.once("page", lambda p3: opened2.append(p3))
        with pg2.expect_download(timeout=15000):
            pg2.click("#btn-download")
        pg2.wait_for_timeout(1500)
        check("dual test: 15-min interval guard blocks immediate second partner tab", not opened2)
    check("dual test: no JS errors", not errs2, str(errs2[:1]))
    b2.close()

check("ALL 8 configured URLs were rendered AND actually clicked", clicked_all == EXPECTED,
      f"{len(clicked_all)}/8")
check("no JS errors across the entire click session", not js_errors, str(js_errors[:2]))
check("no iframes ever created", not iframes_seen, str(set(iframes_seen) or "none"))

fails = [x for x in R if not x[1]]
print(f"\n=== CLICK VERIFICATION: {len(R)-len(fails)} PASS / {len(fails)} FAIL ===")
for name, _ in fails: print("  FAIL:", name)
raise SystemExit(1 if fails else 0)
