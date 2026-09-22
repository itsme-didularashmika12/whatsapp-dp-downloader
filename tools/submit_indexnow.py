#!/usr/bin/env python3
"""
IndexNow submission — official protocol (https://www.indexnow.org/documentation).

Notifies IndexNow-participating engines (Bing + partners that accept IndexNow)
that our URLs changed. No account or login required; site ownership is proven
by the key file hosted at /{INDEXNOW_KEY}.txt.

Usage:  python3 tools/submit_indexnow.py
Exit 0 on HTTP 200/202 from the IndexNow API.
"""
import json
import sys
import urllib.request
import urllib.error

HOST = "whatsapp-dp-downloader.vercel.app"
INDEXNOW_KEY = "15e946adf1bcbfdf53561b8bf88ce02c"
ENDPOINT = "https://api.indexnow.org/indexnow"


def sitemap_urls():
    import re
    with urllib.request.urlopen(f"https://{HOST}/sitemap.xml", timeout=30) as r:
        return re.findall(r"<loc>(.*?)</loc>", r.read().decode())


def main():
    urls = sitemap_urls()
    payload = {
        "host": HOST,
        "key": INDEXNOW_KEY,
        "keyLocation": f"https://{HOST}/{INDEXNOW_KEY}.txt",
        "urlList": urls,
    }
    req = urllib.request.Request(
        ENDPOINT,
        data=json.dumps(payload).encode(),
        headers={"Content-Type": "application/json", "User-Agent": "wa-dp-downloader-indexnow/1.0"},
        method="POST",
    )
    try:
        with urllib.request.urlopen(req, timeout=30) as r:
            print(f"IndexNow response: HTTP {r.status} — {len(urls)} URL(s) submitted")
            return 0
    except urllib.error.HTTPError as e:
        print(f"IndexNow HTTP {e.code}: {e.read().decode()[:200]}")
        return 1


if __name__ == "__main__":
    sys.exit(main())
