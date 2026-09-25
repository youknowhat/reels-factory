"""post.json의 image 항목을 posts/<slug>/assets/로 받아온다 (로컬 실행용 — 클라우드 세션은 네트워크가 막혀 있다).

image 항목의 소스 지정(하나만):
  "src": "https://.../photo.jpg"                         이미지 직접 다운로드
  "og":  "https://기사 URL"                              기사의 대표 이미지(og:image)
  "shot": {"url": "https://...", "selector": "figure"}   페이지(또는 요소) 스크린샷
이미 파일이 있으면 건너뛴다(--force로 덮어쓰기). 받은 이미지는 반드시 출처(credits.json key)와 함께 쓴다.

python fetch_assets.py --post <slug> [--force]
"""
import argparse
import json
import re
import urllib.request
from pathlib import Path

ROOT = Path(__file__).resolve().parent
UA = {"User-Agent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 14_0) AppleWebKit/537.36 Chrome/126 Safari/537.36"}


def get(url):
    with urllib.request.urlopen(urllib.request.Request(url, headers=UA), timeout=30) as r:
        return r.read()


def og_image(page_url):
    html = get(page_url).decode("utf-8", "ignore")
    m = re.search(r'<meta[^>]+property=["\']og:image["\'][^>]+content=["\']([^"\']+)', html) or \
        re.search(r'<meta[^>]+content=["\']([^"\']+)["\'][^>]+property=["\']og:image', html)
    if not m:
        raise RuntimeError(f"og:image 없음: {page_url}")
    return m.group(1).replace("&amp;", "&")


def shot(spec, dest):
    from playwright.sync_api import sync_playwright
    with sync_playwright() as pw:
        b = pw.chromium.launch()
        p = b.new_page(viewport={"width": 1080, "height": 1350}, device_scale_factor=2)
        p.goto(spec["url"], wait_until="networkidle")
        (p.locator(spec["selector"]).first if spec.get("selector") else p).screenshot(path=str(dest))
        b.close()


def main(slug, force):
    post_dir = ROOT / "posts" / slug
    assets = post_dir / "assets"
    assets.mkdir(exist_ok=True)
    for n, s in enumerate(json.loads((post_dir / "post.json").read_text())["slides"], 1):
        img = s.get("image")
        if not img:
            continue
        dest = assets / img["file"]
        if dest.exists() and not force:
            print(f"{n:02d} 있음  {dest.name}"); continue
        try:
            if img.get("src"):
                dest.write_bytes(get(img["src"]))
            elif img.get("og"):
                dest.write_bytes(get(og_image(img["og"])))
            elif img.get("shot"):
                shot(img["shot"], dest)
            else:
                print(f"{n:02d} 수동  {dest.name} — {img.get('want', '')}"); continue
            print(f"{n:02d} 받음  {dest.name}")
        except Exception as e:
            print(f"{n:02d} 실패  {dest.name}: {e}")


if __name__ == "__main__":
    ap = argparse.ArgumentParser()
    ap.add_argument("--post", required=True)
    ap.add_argument("--force", action="store_true")
    a = ap.parse_args()
    main(a.post, a.force)
