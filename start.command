#!/bin/bash
# Double-click this file to launch Daybloom.
# First run installs a small, local set of Python packages (a few MB from
# PyPI — not Electron's ~150MB Chromium download). Later runs skip straight
# to opening the app.

cd "$(dirname "$0")"

if [ ! -d ".venv" ]; then
  echo "Setting up Daybloom for the first time..."
  python3 -m venv .venv
fi

source .venv/bin/activate
pip install --quiet --upgrade pip
pip install --quiet -r requirements.txt

python3 app.py
