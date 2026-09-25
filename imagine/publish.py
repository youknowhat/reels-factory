"""캐러셀 PNG + 복붙용 캡션을 Google Drive reels-factory/<slug>/ 로 배포.

최초 1회: rclone config create gdrive drive scope=drive.file (브라우저 승인)
사용:     python publish.py --post <slug>   (review.py FAIL 0 이후)
"""
import argparse
import shutil
import subprocess
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parent
REMOTE = "gdrive:reels-factory"
NET = ["--timeout", "60s", "--contimeout", "30s", "--retries", "3", "--low-level-retries", "5"]


def drive_ready() -> bool:
    if not shutil.which("rclone"):
        print("rclone 없음: brew install rclone"); return False
    r = subprocess.run(["rclone", "listremotes"], capture_output=True, text=True)
    if "gdrive:" not in r.stdout:
        print("Drive 미연결. 최초 1회 실행(브라우저 승인):  rclone config create gdrive drive scope=drive.file"); return False
    return True


def caption_txt(slug: str, out: Path) -> Path | None:
    md = ROOT / "posts" / slug / "caption.md"
    if not md.exists():
        return None
    lines = [l for l in md.read_text(encoding="utf-8").splitlines()
             if not l.startswith("# ") and not l.startswith("(게시 전 확인")]
    txt = out / f"{slug}_caption.txt"
    txt.write_text("\n".join(lines).strip() + "\n", encoding="utf-8")
    return txt


def main() -> None:
    ap = argparse.ArgumentParser()
    ap.add_argument("--post", required=True)
    ap.add_argument("--no-drive", action="store_true")
    a = ap.parse_args()
    out = ROOT / "output" / a.post
    pngs = sorted(out.glob("[0-9][0-9].png"))
    if not pngs:
        sys.exit(f"렌더 결과 없음: {out} (render.py 먼저)")
    txt = caption_txt(a.post, out)
    print(f"{len(pngs)}장 + {'캡션' if txt else '캡션 없음'} → {out}")
    if a.no_drive or not drive_ready():
        return
    dest = f"{REMOTE}/{a.post}/"
    subprocess.run(["rclone", "copy", str(out), dest, "--include", "[0-9][0-9].png", *NET], check=True)
    if txt:
        subprocess.run(["rclone", "copy", str(txt), dest, *NET], check=True)
    listing = subprocess.run(["rclone", "lsf", dest], capture_output=True, text=True).stdout.split()
    print(f"Drive 업로드 완료 → 내 드라이브/reels-factory/{a.post}/ ({len(listing)}개)")
    print("모바일: Drive 앱에서 PNG를 순서대로 저장 → 인스타 새 게시물에서 여러 장 선택")


if __name__ == "__main__":
    main()
