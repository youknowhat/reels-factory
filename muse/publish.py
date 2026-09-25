#!/usr/bin/env python3
"""
publish.py — 업로드본 만들기 + Google Drive 배포 (모바일 Drive 앱에서 바로 받아 릴스 업로드)
  최초 1회:  rclone config create gdrive drive scope=drive.file   (브라우저 승인, rclone이 만든 파일만 접근)
  사용:      .venv/bin/python publish.py --episode casino_carpet          # output/<slug>/<slug>_sfx_only.mp4 → 업로드본 → Drive
             .venv/bin/python publish.py --path output/zoomtale/final_zoomtale_reel.mp4 --name tulip_bubble
Drive 경로: reels-factory/<slug>/<slug>_upload.mp4  (인스타 권장: H.264 1080x1920 30fps, 6Mbps 캡, AAC 48kHz)
"""
import argparse
import shutil
import subprocess
import sys
from pathlib import Path

import imageio_ffmpeg

ROOT = Path(__file__).resolve().parent
REMOTE = "gdrive:reels-factory"


def make_upload(src: Path, dst: Path) -> Path:
    """인스타 업로드용 재인코딩(그레인 때문에 CRF 대신 비트레이트 캡). 이미 있으면 재사용."""
    if dst.exists() and dst.stat().st_mtime >= src.stat().st_mtime:
        return dst
    ff = imageio_ffmpeg.get_ffmpeg_exe()
    subprocess.run([ff, "-y", "-loglevel", "error", "-i", str(src), "-c:v", "libx264", "-preset", "slow", "-b:v", "6M",
                    "-maxrate", "6.5M", "-bufsize", "12M", "-pix_fmt", "yuv420p", "-profile:v", "high", "-movflags", "+faststart",
                    "-c:a", "aac", "-ar", "48000", "-b:a", "192k", str(dst)], check=True)
    return dst


def drive_ready() -> bool:
    if not shutil.which("rclone"):
        print("rclone 없음: brew install rclone"); return False
    r = subprocess.run(["rclone", "listremotes"], capture_output=True, text=True)
    if "gdrive:" not in r.stdout:
        print("Drive 미연결. 최초 1회 실행(브라우저 승인):  rclone config create gdrive drive scope=drive.file"); return False
    return True


def main() -> None:
    ap = argparse.ArgumentParser()
    ap.add_argument("--episode", help="episodes/<slug> 산출물 기준")
    ap.add_argument("--path", help="임의 mp4 경로")
    ap.add_argument("--name", help="--path 사용 시 Drive 폴더명")
    ap.add_argument("--no-drive", action="store_true", help="업로드본만 만들고 Drive 생략")
    a = ap.parse_args()
    if a.episode:
        src = ROOT / "output" / a.episode / f"{a.episode}_sfx_only.mp4"; name = a.episode
    elif a.path:
        src = Path(a.path).resolve(); name = a.name or src.stem
    else:
        sys.exit("--episode 또는 --path 필요")
    if not src.exists():
        sys.exit(f"원본 없음: {src}")
    up = make_upload(src, src.parent / f"{name}_upload.mp4")
    print(f"업로드본: {up} ({up.stat().st_size / 1048576:.1f} MB)")
    if a.no_drive or not drive_ready():
        return
    dest = f"{REMOTE}/{name}/"
    net = ["--timeout", "60s", "--contimeout", "30s", "--retries", "3", "--low-level-retries", "5"]   # 네트워크가 멈춰도 무한 대기하지 않게
    subprocess.run(["rclone", "copy", str(up), dest, "--drive-chunk-size", "64M", *net], check=True)
    cap_md = src.parent / "caption.md"                          # 인스타 캡션: 복붙용 txt로 같은 폴더에
    if cap_md.exists():
        lines = [l for l in cap_md.read_text(encoding="utf-8").splitlines()
                 if not l.startswith("# ") and not l.startswith("(게시 전 확인")]
        cap_txt = src.parent / f"{name}_caption.txt"
        cap_txt.write_text("\n".join(lines).strip() + "\n", encoding="utf-8")
        subprocess.run(["rclone", "copy", str(cap_txt), dest, *net], check=True)
    listing = subprocess.run(["rclone", "lsf", dest], capture_output=True, text=True).stdout.strip().splitlines()
    print(f"Drive 업로드 완료 → 내 드라이브/reels-factory/{name}/  ({', '.join(listing)})")
    print("모바일: Google Drive 앱 → reels-factory/" + name + " → 파일 ⋮ → 다운로드 → 인스타 릴스에서 선택")


if __name__ == "__main__":
    main()
