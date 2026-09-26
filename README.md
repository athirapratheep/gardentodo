# Daybloom (native macOS version)

A local desktop day-planner. Plan your day, get a real macOS notification
when a task is due, and every task you finish plants a flower in your
garden. Runs as an actual window — no browser tab, no cloud, no account.

This version uses **pywebview** instead of Electron: it opens a native
window using WebKit, the same engine built into Safari, so there's no
150MB browser binary to download. The only install is a small set of
Python packages from PyPI.

## Requirements

- macOS
- Python 3 (already installed on every Mac — check with `python3 --version`
  in Terminal)

## Run it

**Easiest:** double-click `start.command` in Finder.

The first time, macOS will likely block it with a "cannot be opened
because it is from an unidentified developer" warning, since it's an
unsigned script. To allow it once: right-click (or Control-click)
`start.command` → **Open** → **Open** again in the dialog that appears.
After that first time, double-clicking works normally.

**Or from Terminal:**

```bash
cd daybloom-native
./start.command
```

The first run creates a small local Python environment and installs
`pywebview` (a few MB, from PyPI — not GitHub release binaries, so it
should work fine even on networks that blocked the Electron download).
Every run after that starts in a second or two.

A native window titled "Daybloom" opens. That's the whole app.

## How it works

- **Plan a day** — Today / Tomorrow buttons or the date picker at the top,
  then add tasks with an optional time and a category.
- **Get reminded** — tasks with a time schedule a real macOS Notification
  Center alert (top-right of your screen) while the app is open.
- **Grow your garden** — tap the circle next to a task to mark it done. A
  flower plants itself in the garden, shaped and colored by category.
- **Your data** — saved to
  `~/Library/Application Support/Daybloom/data.json`, so it persists
  between launches.

## Notes on notifications

The first time a notification tries to fire, macOS may ask for permission
under the name "Python" or "Script Editor" (since `osascript` sends it).
Allow it in the prompt, or turn it on later in **System Settings →
Notifications**. Notifications only fire while the app window is open —
there's no background service.

## Customizing

- Categories and flower colors: the `CATEGORIES` object at the top of
  `renderer/app.js`.
- Flower shapes: the `flowerSVG` function in the same file.
- Look and feel: `renderer/style.css`.
- Data/notification logic: `app.py`.

## Optional: a real double-clickable .app bundle

If you'd rather have an actual `Daybloom.app` in your Applications folder
(with its own icon, no Terminal-style window flashing on launch), you can
package it with `pyinstaller`:

```bash
source .venv/bin/activate
pip install pyinstaller
pyinstaller --windowed --name Daybloom --add-data "renderer:renderer" app.py
```

The finished app appears in `dist/Daybloom.app` — drag it into
`/Applications`. This step is optional; `start.command` works fine on its
own.
