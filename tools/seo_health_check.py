#!/usr/bin/env python3
"""
SEO + production health check — whatsapp-dp-downloader.vercel.app
------------------------------------------------------------------
Lightweight periodic monitor. Checks every sitemap URL plus core surfaces:

  status codes · canonicals · titles/descriptions (uniqueness) · H1 count ·
  robots meta · JSON-LD validity · internal links · sitemap/robots sanity ·
  security headers · basic perf · API health · optional lookup contract

Usage:  python3 tools/seo_health_check.py [base_url]
Env:    WA_DP_API_KEY=<key> enables the authenticated upstream checks
        (everything else runs without it and those checks report SKIP).

Exit code 0 = all checks passed (or skipped), 1 = at least one FAIL.
"""
import json
import os
import re
import sys
import time
import urllib.request
import urllib.error
from html.parser import HTMLParser

BASE = (sys.argv[1] if len(sys.argv) > 1 else "https://whatsapp-dp-downloader.vercel.app").rstrip("/")
API_KEY = os.environ.get("WA_DP_API_KEY", "").strip()
RESULTS = []


def check(name, ok, detail="", warn=False, skip=False):
    RESULTS.append((name, ok, warn, skip))
    if skip:
        print(f"[SKIP] {name}")
    else:
        print(f"[{'WARN' if (not ok and warn) else 'PASS' if ok else 'FAIL'}] {name}" + (f" — {detail}" if detail else ""))


def fetch(url, headers=None, timeout=30, method="GET"):
    req = urllib.request.Request(url, headers=headers or {}, method=method)
    try:
        with urllib.request.urlopen(req, timeout=timeout) as r:
            return r.status, dict(r.headers), r.read()
    except urllib.error.HTTPError as e:
        return e.code, dict(e.headers), e.read()
    except Exception as e:
        return 0, {}, str(e).encode()


class Page(HTMLParser):
    def __init__(self):
        super().__init__()
        self.titles, self.descs, self.canon, self.robots = [], [], [], []
        self.h1, self.hrefs, self.srcs, self.jsonld = 0, [], [], []

    def handle_starttag(self, tag, attrs):
        a = dict(attrs)
        if tag == "title": self._t = True
        if tag == "h1": self.h1 += 1
        if tag == "meta" and a.get("name") == "description": self.descs.append(a.get("content", ""))
        if tag == "meta" and a.get("name") == "robots": self.robots.append(a.get("content", ""))
        if tag == "link" and "canonical" in (a.get("rel") or ""): self.canon.append(a.get("href", ""))
        if tag == "a" and a.get("href"): self.hrefs.append(a["href"])
        if tag in ("img", "script") and a.get("src"): self.srcs.append(a["src"])
        if tag == "script" and a.get("type") == "application/ld+json": self._j = True

    def __init_subclass__(cls): pass

    def handle_startendtag(self, tag, attrs):
        self.handle_starttag(tag, attrs)

    _t = _j = False
    def handle_data(self, d):
        if self._t: self.titles.append(d.strip())
        if self._j: self.jsonld.append(d)
    def handle_endtag(self, tag):
        if tag == "title": self._t = False
        if tag == "script": self._j = False


def get(path):
    st, hd, body = fetch(BASE + path)
    p = Page(); p.feed(body.decode("utf-8", "replace"))
    return st, hd, body, p


def main():
    print(f"\n== SEO health check — {BASE} ==\n")
    st, _, sm = fetch(BASE + "/sitemap.xml")
    locs = re.findall(r"<loc>(.*?)</loc>", sm.decode())
    check("sitemap reachable", st == 200, f"{len(locs)} URLs")
    check("sitemap all canonical-https on host",
          all(u.startswith(BASE) for u in locs) and len(locs) == len(set(locs)))

    st, _, rb = fetch(BASE + "/robots.txt")
    check("robots reachable + Sitemap line + /api/ blocked",
          st == 200 and f"Sitemap: {BASE}/sitemap.xml" in rb.decode() and "Disallow: /api/" in rb.decode())

    titles, descs = [], []
    links_of = {}
    for u in locs:
        path = u.replace(BASE, "") or "/"
        t0 = time.time(); st, hd, body, p = get(path); dt = time.time() - t0
        check(f"{path} 200", st == 200, f"{st}")
        check(f"{path} canonical", p.canon == [u], str(p.canon))
        check(f"{path} one H1", p.h1 == 1, f"{p.h1}")
        check(f"{path} title present", bool(p.titles and p.titles[0]))
        check(f"{path} description present", bool(p.descs and p.descs[0]))
        check(f"{path} not accidentally noindex", not any("noindex" in r for r in p.robots))
        try:
            for b in p.jsonld: json.loads(b)
            check(f"{path} JSON-LD valid", True)
        except Exception as e:
            check(f"{path} JSON-LD valid", False, str(e))
        check(f"{path} fetch < 2.5s", dt < 2.5, f"{dt:.2f}s", warn=True)
        titles.append(p.titles[0] if p.titles else "")
        descs.append(p.descs[0] if p.descs else "")
        links_of[path] = {
            h.split("#")[0].split("?")[0] for h in p.hrefs + p.srcs
            if h.startswith("/") and not h.startswith("//")
        } - {path}

    check("unique titles", len(set(titles)) == len(locs), f"{len(set(titles))}/{len(locs)}")
    check("unique descriptions", len(set(descs)) == len(locs), f"{len(set(descs))}/{len(locs)}")

    broken = {f"{p} → {l}" for p, ls in links_of.items() for l in ls
              if not l.startswith("/#") and fetch(BASE + l, timeout=15)[0] >= 400}
    check("no broken internal links", not broken, "; ".join(sorted(broken)) or "ok")
    for u in locs:
        path = u.replace(BASE, "") or "/"
        backlink = any(path in ls for p, ls in links_of.items() if p != path)
        check(f"{path} internally linked", backlink or path == "/", warn=True)

    st, hd, _ = fetch(BASE + "/")
    hdrs = {k.lower() for k in hd}
    need = {"x-content-type-options", "referrer-policy", "permissions-policy", "content-security-policy"}
    check("security headers present", need <= hdrs, "missing: " + ",".join(sorted(need - hdrs)))

    st, _, b = fetch(BASE + "/api/health")
    try:
        h = json.loads(b)
        check("API health: engine online", h.get("ok") and h.get("sessions_open", 0) >= 1, json.dumps(h))
    except Exception:
        check("API health: engine online", False, b[:100].decode())

    if API_KEY:
        st, _, _ = fetch(f"{UPSTREAM}/api/dp?number=94771820962")
        check("upstream rejects keyless (401)", st == 401, f"{st}")
    else:
        check("upstream auth checks", True, skip=True)

    fails = [r for r in RESULTS if not r[1] and not r[2] and not r[3]]
    warns = [r for r in RESULTS if not r[1] and r[2]]
    print(f"\n== SUMMARY: {len([r for r in RESULTS if r[1]])} pass, {len(warns)} warn, {len(fails)} fail ==")
    for w in warns: print("   warn:", w[0])
    for f in fails: print("   FAIL:", f[0])
    return 1 if fails else 0


UPSTREAM = "https://srv1983031.hstgr.cloud/wa-dp-api"
if __name__ == "__main__":
    sys.exit(main())
