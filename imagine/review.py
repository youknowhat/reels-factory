"""렌더 결과 자동 검수. FAIL 0이어야 통과.

python review.py --post <slug>   (render.py를 먼저 실행)
"""
import argparse
import json
import re
import sys
from pathlib import Path

from PIL import Image

ROOT = Path(__file__).resolve().parent
W, H = 1080, 1350
MAX_SRC_AREA = 0.40
MAX_CHARS = 110
BANNED = ["!", "놀랍게도", "충격", "숨겨진", "AI 시대 필수", "✨", "가지 방법"]
EMOJI = re.compile("[\U0001F300-\U0001FAFF☀-➿]")


def main(slug):
    out = ROOT / "output" / slug
    post_dir = ROOT / "posts" / slug
    post = json.loads((post_dir / "post.json").read_text())
    metrics = json.loads((out / "metrics.json").read_text())["slides"]
    credits = json.loads((post_dir / "credits.json").read_text()) if (post_dir / "credits.json").exists() else []
    caption = (post_dir / "caption.md").read_text() if (post_dir / "caption.md").exists() else ""
    fails, warns = [], []

    pngs = sorted(out.glob("[0-9][0-9].png"))
    if not 6 <= len(pngs) <= 10:
        fails.append(f"장수 {len(pngs)} (6~10)")
    for p in pngs:
        if Image.open(p).size != (W, H):
            fails.append(f"{p.name} 크기 {Image.open(p).size}")

    src_total = 0.0
    for m in metrics:
        tag = f"{m['n']:02d}({m['layout']})"
        if m["overflow"]:
            fails.append(f"{tag} 글자 넘침: {m['overflow']}")
        if m["outside"]:
            fails.append(f"{tag} 안전 여백 밖: {m['outside'][:3]}")
        body = re.sub(r"\s+", "", m["text"])
        if len(body) > MAX_CHARS:
            warns.append(f"{tag} 글자 {len(body)}자 (> {MAX_CHARS})")
        for b in BANNED:
            if b in m["text"]:
                fails.append(f"{tag} 금지어 '{b}'")
        if EMOJI.search(m["text"]):
            fails.append(f"{tag} 이모지")
        for im in m["images"]:
            if not im["loaded"]:
                fails.append(f"{tag} 이미지 로드 실패 {im['src']}")
        area = sum(im["area"] for im in m["images"])
        src_total += area
        if m["images"] and not m["credits"]:
            fails.append(f"{tag} 원본 이미지에 출처 칩 없음")

    ratio = src_total / max(len(metrics), 1)
    if ratio > MAX_SRC_AREA:
        fails.append(f"원본 이미지 면적 {ratio:.0%} (> {MAX_SRC_AREA:.0%}, aggregator 위험)")

    if caption:
        lines = [l for l in caption.splitlines() if l.strip() and not l.startswith("# ")]
        headline = re.sub(r"\s+", " ", post["slides"][0].get("headline", "")).strip()
        if lines and re.sub(r"\s+", " ", lines[0]).strip() != headline:
            warns.append(f"캡션 첫 줄이 1장 헤드라인과 다름: '{lines[0][:30]}' vs '{headline[:30]}'")
        tags = re.findall(r"#\S+", caption)
        if len(tags) > 5:
            fails.append(f"해시태그 {len(tags)}개 (> 5)")
        for c in credits:
            if c.get("publisher", c.get("title", "")) not in caption:
                warns.append(f"캡션에 출처 없음: {c.get('publisher') or c.get('title')}")
    else:
        warns.append("caption.md 없음")

    print(f"[{slug}] 장수 {len(pngs)} · 원본 이미지 면적 평균 {ratio:.0%}")
    for f in fails:
        print("FAIL", f)
    for w in warns:
        print("WARN", w)
    print(f"FAIL {len(fails)} / WARN {len(warns)}")
    return len(fails)


if __name__ == "__main__":
    ap = argparse.ArgumentParser()
    ap.add_argument("--post", required=True)
    sys.exit(1 if main(ap.parse_args().post) else 0)
