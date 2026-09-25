#!/bin/zsh
# 최초 1회: Python 3.12 venv + 의존성 (ffmpeg는 imageio-ffmpeg에 번들되어 별도 설치 불필요)
set -e
cd "$(dirname "$0")"
PY=$(command -v python3.12 || echo /opt/homebrew/bin/python3.12)
[ -x "$PY" ] || brew install python@3.12
"$PY" -m venv .venv
.venv/bin/pip install -q --upgrade pip
.venv/bin/pip install -q -r requirements.txt
[ -f .env ] || cp .env.example .env
echo "ready → .venv/bin/python vd_engine.py --episode casino_carpet --seconds 6"
