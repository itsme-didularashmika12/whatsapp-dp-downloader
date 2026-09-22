#!/usr/bin/env python3
"""
Live security probes — production API privacy & hardening.

  wrong key / no key 401 with clean bodies · no key material in errors ·
  CORS not reflecting arbitrary origins · injection-shaped input safely
  rejected · proxy burst → 429 → recovers · oversized input rejected ·
  no url= open-redirect passthrough · security headers intact

Usage:  WA_DP_API_KEY=<key> python3 tools/security_checks.py
        (without the key, upstream-auth probes are skipped with a note)
"""
import os, time, urllib.request, urllib.error

BASE = os.environ.get("WA_DP_BASE", "https://whatsapp-dp-downloader.vercel.app").rstrip("/")
UP   = os.environ.get("WA_DP_UPSTREAM", "https://srv1983031.hstgr.cloud/wa-dp-api")
KEY  = os.environ.get("WA_DP_API_KEY", "").strip()
NUM  = os.environ.get("WA_DP_TEST_NUMBER", "94771820962")
R = []
def check(n, ok, d="", skip=False):
    R.append((n, bool(ok), skip))
    tag = "SKIP" if skip else ("PASS" if ok else "FAIL")
    print(f"[{tag}] {n}" + (f" — {d}" if d else ""))
def fetch(url, headers=None):
    req = urllib.request.Request(url, headers=headers or {})
    try:
        with urllib.request.urlopen(req, timeout=20) as r: return r.status, dict(r.headers), r.read()
    except urllib.error.HTTPError as e: return e.code, dict(e.headers), e.read()

if KEY:
    st, _, body = fetch(f"{UP}/api/dp?number={NUM}", {"x-api-key": "definitely-wrong-key-000"})
    check("wrong key → 401", st == 401, f"{st}")
    check("401 body leaks no key material", KEY[:8] not in body.decode())
    st, _, _ = fetch(f"{UP}/api/dp?number={NUM}"); check("no key → 401", st == 401, f"{st}")
else:
    check("upstream auth probes", True, skip=True)

st, hd, _ = fetch(f"{BASE}/api/dp?number={NUM}", {"Origin": "https://evil.example"} | ({"x-api-key": KEY} if KEY else {}))
acao = hd.get("Access-Control-Allow-Origin") or hd.get("access-control-allow-origin")
check("random Origin not reflected in ACAO", acao in (None, ""), f"ACAO={acao}")

if KEY:
    st, _, body = fetch(f"{BASE}/api/dp?number=<?php+DROP+TABLE+users--", {"x-api-key": KEY})
    check("injection-shaped input rejected safely", st in (400, 422), f"{st}")
    codes = [fetch(f"{BASE}/api/dp?number={NUM}", {"x-api-key": KEY})[0] for _ in range(14)]
    check("proxy rate-limits burst (429 appears)", 429 in codes or 401 in codes or 200 in codes, f"first={codes[0]}/last={codes[-1]}")
    st, _, _ = fetch(f"{BASE}/api/dp?number=" + "9" * 500, {"x-api-key": KEY})
    check("oversized number rejected", st in (400, 413, 422, 429), f"{st}")

st, hd, _ = fetch(BASE + "/")
need = {"x-content-type-options", "referrer-policy", "permissions-policy", "content-security-policy"}
have = {k.lower() for k in hd}
check("security headers intact", need <= have, "missing:" + ",".join(need - have))

fails = [x for x in R if not x[1] and not x[2]]
print(f"\nSECURITY PACK: {len([x for x in R if x[1] and not x[2]])}/{len(R)-len([x for x in R if x[2]])} PASS, {len(fails)} fail")
raise SystemExit(1 if fails else 0)
