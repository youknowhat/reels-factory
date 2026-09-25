"""post.json → output/<slug>/NN.png + contact.jpg + metrics.json

python render.py --post <slug> [--theme magazine] [--out <dir>]
"""
import argparse
import json
import re
from pathlib import Path

from jinja2 import Environment, FileSystemLoader, select_autoescape
from markupsafe import Markup, escape
from PIL import Image
from playwright.sync_api import sync_playwright

ROOT = Path(__file__).resolve().parent
W, H = 1080, 1350
SAFE_Y = 50


def rich(t):
    """escape → **강조** → <b>, 줄바꿈 → <br>"""
    h = str(escape(t or ""))
    h = re.sub(r"\*\*(.+?)\*\*", r"<b>\1</b>", h, flags=re.S)
    return Markup(h.replace("\n", "<br>"))

MEASURE_JS = """
() => {
  const S = document.querySelector('.slide').getBoundingClientRect();
  const out = {overflow: [], outside: [], images: [], credits: 0};
  for (const el of document.querySelectorAll('.slide *')) {
    if (el.closest('.bleed')) continue;
    const t = (el.childNodes.length && [...el.childNodes].some(n => n.nodeType === 3 && n.textContent.trim()));
    if (!t) continue;
    if (el.scrollWidth > el.clientWidth + 2 || el.scrollHeight > el.clientHeight + 2) {
      const cs = getComputedStyle(el);
      if (cs.overflow !== 'visible' || cs.textOverflow === 'ellipsis') out.overflow.push(el.textContent.trim().slice(0, 30));
    }
    const r = el.getBoundingClientRect();
    if (r.width && (r.top < S.top + %d || r.bottom > S.bottom - %d || r.left < S.left || r.right > S.right))
      out.outside.push(el.textContent.trim().slice(0, 30));
  }
  for (const im of document.querySelectorAll('img.src')) {
    const r = im.getBoundingClientRect();
    const w = Math.max(0, Math.min(r.right, S.right) - Math.max(r.left, S.left));
    const h = Math.max(0, Math.min(r.bottom, S.bottom) - Math.max(r.top, S.top));
    out.images.push({src: im.getAttribute('src'), area: w * h / (S.width * S.height), loaded: im.complete && im.naturalWidth > 0});
  }
  out.credits = document.querySelectorAll('.credit').length;
  return out;
}
""" % (SAFE_Y, SAFE_Y)


def _chromium_path():
    """클라우드 세션은 프리인스톨 Chromium 버전이 playwright pip 패키지와 어긋날 수 있다."""
    for base in (Path("/opt/pw-browsers"),):
        if base.is_dir():
            for d in sorted(base.glob("chromium-*")):
                exe = d / "chrome-linux" / "chrome"
                if exe.exists():
                    return str(exe)
    return None


def contact_sheet(pngs, dest, cols=4, tw=360):
    th = int(tw * H / W)
    rows = (len(pngs) + cols - 1) // cols
    gap = 16
    sheet = Image.new("RGB", (cols * tw + (cols + 1) * gap, rows * th + (rows + 1) * gap), (40, 40, 40))
    for i, p in enumerate(pngs):
        im = Image.open(p).convert("RGB").resize((tw, th), Image.LANCZOS)
        sheet.paste(im, (gap + (i % cols) * (tw + gap), gap + (i // cols) * (th + gap)))
    sheet.save(dest, quality=90)


def render(slug, theme=None, out=None):
    post_dir = ROOT / "posts" / slug
    post = json.loads((post_dir / "post.json").read_text())
    theme = theme or post.get("theme", "magazine")
    out = Path(out).resolve() if out else ROOT / "output" / slug
    html_dir = out / "html"
    html_dir.mkdir(parents=True, exist_ok=True)

    env = Environment(loader=FileSystemLoader(ROOT / "templates"), autoescape=select_autoescape(["html"]))
    env.filters["rich"] = rich
    credits = {c["key"]: c for c in json.loads((post_dir / "credits.json").read_text())} if (post_dir / "credits.json").exists() else {}
    total = len(post["slides"])
    pngs, metrics = [], []
    with sync_playwright() as pw:
        browser = pw.chromium.launch(executable_path=_chromium_path())
        page = browser.new_page(viewport={"width": W, "height": H}, device_scale_factor=1)
        for i, s in enumerate(post["slides"], 1):
            html = env.get_template(f"layouts/{s['layout']}.html").render(
                s=s, post=post, n=i, total=total, theme=theme, credits=credits,
                root=ROOT.as_uri(), assets=(post_dir / "assets").as_uri())
            f = html_dir / f"{i:02d}.html"
            f.write_text(html)
            page.goto(f.as_uri())
            page.evaluate("document.fonts.ready")
            page.wait_for_load_state("networkidle")
            m = page.evaluate(MEASURE_JS)
            m.update(n=i, layout=s["layout"], text=page.inner_text(".slide"))
            metrics.append(m)
            png = out / f"{i:02d}.png"
            page.screenshot(path=str(png), clip={"x": 0, "y": 0, "width": W, "height": H})
            pngs.append(png)
        browser.close()
    contact_sheet(pngs, out / "contact.jpg")
    (out / "metrics.json").write_text(json.dumps({"theme": theme, "slides": metrics}, ensure_ascii=False, indent=1))
    print(f"{len(pngs)} slides -> {out}")
    return out


if __name__ == "__main__":
    ap = argparse.ArgumentParser()
    ap.add_argument("--post", required=True)
    ap.add_argument("--theme")
    ap.add_argument("--out")
    a = ap.parse_args()
    render(a.post, a.theme, a.out)
