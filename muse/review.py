#!/usr/bin/env python3
"""
review.py — 렌더 후 자동 검수 (CLAUDE.md 검수 기준). 렌더마다 반드시 실행.
  .venv/bin/python review.py --episode casino_carpet [--video path]
검사: 카메라 이동 예산 / 이동 중 컷 / 자막 읽기 속도 / 컷별 첫·끝 프레임 모션 점수 / 루프 이음새.
산출: output/<ep>/review.md, review_motion_sheet.jpg (컷마다 첫|끝 프레임). FAIL 있으면 exit 1.
"""
import argparse
import importlib
from pathlib import Path

import numpy as np
from PIL import Image, ImageDraw

from run_zoomtale_auto import load_font

ROOT = Path(__file__).resolve().parent
CAM_KEYS = ("mask_reveal", "wipe", "rot_anim", "path", "render")
FX_KEYS = ("tiles", "shake", "blur", "flash", "subcuts", "invert", "split", "bw", "drift", "sat")


def is_camera_move(sh: dict) -> bool:
    z0, z1 = sh.get("z", (1, 1)); f0, f1 = sh.get("f", ((.5, .5), (.5, .5)))
    return abs(z1 - z0) / z0 > 0.02 or abs(f1[0] - f0[0]) + abs(f1[1] - f0[1]) > 0.01 or any(k in sh for k in CAM_KEYS)


def main() -> None:
    ap = argparse.ArgumentParser(); ap.add_argument("--episode", required=True); ap.add_argument("--video", default="")
    a = ap.parse_args()
    ep = importlib.import_module(f"episodes.{a.episode}")
    out_dir = ROOT / "output" / a.episode
    video = a.video or str(out_dir / f"{a.episode}_sfx_only.mp4")
    budget = getattr(ep, "MOTION_BUDGET", 5)
    fails, warns, rows = [], [], []
    moves = [i for i, sh in enumerate(ep.SHOTS) if is_camera_move(sh)]
    if len(moves) > budget:
        fails.append(f"카메라 이동 {len(moves)}회 > 예산 {budget}회: 컷 {moves}")
    for i, sh in enumerate(ep.SHOTS):
        dur = sh["end"] - sh["start"]
        if dur < 0.6 and i < len(ep.SHOTS) - 1:                     # 마지막 정지 꼬리(루프)는 예외
            warns.append(f"컷{i} 길이 {dur:.1f}s < 0.6s")
        if is_camera_move(sh) and i + 1 < len(ep.SHOTS):
            settles = sh.get("ease", "linear") in ("out", "inout") or "path" in sh or "render" in sh or any(k in sh and sh[k].get("time", 99) < dur for k in ("mask_reveal", "wipe"))
            if not settles and ep.SHOTS[i + 1]["src"] != sh["src"]:
                fails.append(f"컷{i} 이동이 끝나기 전에 다른 소스로 컷 (ease={sh.get('ease', 'linear')})")
    prev_dur = None
    for cap in ep.CAPTIONS:
        s, e, txt = cap[:3]
        dur = e - s
        cps = len(txt.replace(" ", "").replace("\n", "")) / dur
        if cps > 7:
            fails.append(f"자막 속도 {cps:.1f}자/s > 7: '{txt}'")
        elif cps > 6:
            warns.append(f"자막 속도 {cps:.1f}자/s: '{txt}'")
        if dur < 2.8:
            fails.append(f"자막 길이 {dur:.1f}s < 2.8s (너무 빨리 지나감): '{txt}'")
        if prev_dur is not None and dur < prev_dur * 0.7:                # 직전 자막보다 30% 넘게 짧아지면 갑자기 빨라진 구간
            warns.append(f"자막 전환 급가속: {prev_dur:.1f}s → {dur:.1f}s: '{txt}'")
        prev_dur = dur
    from moviepy import VideoFileClip
    clip = VideoFileClip(video)

    def frame(t):
        return Image.fromarray(clip.get_frame(min(max(t, 0), clip.duration - 0.05)))

    def small(t):
        return np.asarray(frame(t).convert("L").resize((108, 192)), dtype=np.float32) / 255

    tw, th, pad, per_row = 120, 213, 8, 8
    n = len(ep.SHOTS); nrows = -(-n // per_row)
    sheet = Image.new("RGB", (per_row * (2 * tw + pad) + pad, nrows * (th + 34) + pad), (20, 20, 20))
    d = ImageDraw.Draw(sheet); font = load_font(18)
    for i, sh in enumerate(ep.SHOTS):
        fade_start = ep.TOTAL - 0.3                              # 전역 페이드아웃 시작 — 그 안에서 샘플하면 밝기차를 움직임으로 오판함
        t0 = max(sh["start"] + 0.2 + sh.get("xfade", getattr(ep, "XFADE", 0.0)), 0.3)
        t1 = min(sh["end"] - 0.08, fade_start - 0.02)
        score = 0.0 if t1 <= t0 else float(np.abs(small(t0) - small(t1)).mean())   # 컷이 페이드존에 전부 들어가면 샘플 불가 → STATIC 취급
        fx = [k for k in FX_KEYS if k in sh]
        status = "MOVE" if is_camera_move(sh) else ("FX" if score > 0.06 and fx else ("STATIC" if score <= 0.06 else "UNEXPECTED"))
        if status == "UNEXPECTED":
            fails.append(f"컷{i} 지정되지 않은 움직임 (motion {score:.2f})")
        rows.append(f"| {i} | {sh['src']} | {sh['start']:.1f}-{sh['end']:.1f} | {status} | {score:.2f} | {','.join(fx)} |")
        x = pad + (i % per_row) * (2 * tw + pad); y = pad + (i // per_row) * (th + 34)
        sheet.paste(frame(t0).resize((tw, th)), (x, y)); sheet.paste(frame(t1).resize((tw, th)), (x + tw, y))
        col = (255, 80, 80) if status == "UNEXPECTED" else ((229, 192, 123) if status == "MOVE" else (200, 200, 200))
        d.rectangle((x - 2, y - 2, x + 2 * tw + 1, y + th + 1), outline=col, width=2)
        d.text((x, y + th + 4), f"{i} {sh['src']} {status} {score:.2f}", font=font, fill=col)
    band = np.ones((192, 108), dtype=bool); band[100:156] = False                     # 자막 띠 제외
    seam = float(np.abs(small(0.27) - small(ep.TOTAL - 0.31))[band].mean())
    if seam > 0.08:
        fails.append(f"루프 이음새 차이 {seam:.2f} > 0.08")
    sheet.save(out_dir / "review_motion_sheet.jpg", quality=85)
    md = [f"# 검수 리포트 — {a.episode}", f"- 영상: {video} ({clip.duration:.1f}s)", f"- 카메라 이동 {len(moves)}/{budget}회: 컷 {moves}",
          f"- 루프 이음새 diff {seam:.3f}", "", "| 컷 | src | 구간 | 판정 | motion | 효과 |", "|---|---|---|---|---|---|"] + rows
    md += ["", "## FAIL"] + [f"- {f}" for f in fails] + ["", "## WARN"] + [f"- {w}" for w in warns]
    (out_dir / "review.md").write_text("\n".join(md), encoding="utf-8")
    print(f"moves {len(moves)}/{budget}  seam {seam:.3f}  FAIL {len(fails)}  WARN {len(warns)}")
    for f in fails:
        print("FAIL:", f)
    for w in warns:
        print("WARN:", w)
    raise SystemExit(1 if fails else 0)


if __name__ == "__main__":
    main()
