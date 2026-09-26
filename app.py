import json
import os
import subprocess
import threading
import time
from datetime import datetime

import webview

APP_SUPPORT_DIR = os.path.expanduser("~/Library/Application Support/Daybloom")
DATA_FILE = os.path.join(APP_SUPPORT_DIR, "data.json")

os.makedirs(APP_SUPPORT_DIR, exist_ok=True)


def load_tasks():
    try:
        with open(DATA_FILE, "r", encoding="utf-8") as f:
            data = json.load(f)
            return data.get("tasks", []) if isinstance(data, dict) else []
    except (FileNotFoundError, json.JSONDecodeError):
        return []


def save_tasks(tasks):
    with open(DATA_FILE, "w", encoding="utf-8") as f:
        json.dump({"tasks": tasks}, f, indent=2)


def notify(title, when_str):
    """Fire a native macOS notification via Notification Center."""
    safe_title = title.replace('"', '\\"').replace("\\", "\\\\")
    script = (
        f'display notification "It\'s {when_str}. Finish this one and plant a flower." '
        f'with title "Time to bloom: {safe_title}" sound name "Glass"'
    )
    subprocess.run(["osascript", "-e", script], check=False)


class Api:
    """Exposed to the page as window.pywebview.api.<method>(...)"""

    def __init__(self):
        self.tasks = load_tasks()
        self.timers = {}
        self.schedule_all()

    def get_state(self):
        return {"tasks": self.tasks}

    def add_task(self, task):
        new_task = {
            "id": f"{int(time.time() * 1000)}-{os.urandom(3).hex()}",
            "title": (task.get("title") or "").strip(),
            "category": task.get("category", "other"),
            "date": task.get("date"),
            "time": task.get("time", ""),
            "completed": False,
            "completedAt": None,
        }
        self.tasks.append(new_task)
        save_tasks(self.tasks)
        self.schedule_all()
        return {"tasks": self.tasks}

    def complete_task(self, task_id):
        for t in self.tasks:
            if t["id"] == task_id and not t["completed"]:
                t["completed"] = True
                t["completedAt"] = int(time.time() * 1000)
        save_tasks(self.tasks)
        self.schedule_all()
        return {"tasks": self.tasks}

    def uncomplete_task(self, task_id):
        for t in self.tasks:
            if t["id"] == task_id and t["completed"]:
                t["completed"] = False
                t["completedAt"] = None
        save_tasks(self.tasks)
        self.schedule_all()
        return {"tasks": self.tasks}

    def delete_task(self, task_id):
        self.tasks = [t for t in self.tasks if t["id"] != task_id]
        save_tasks(self.tasks)
        self.schedule_all()
        return {"tasks": self.tasks}

    def schedule_all(self):
        for timer in self.timers.values():
            timer.cancel()
        self.timers = {}

        now = time.time()
        for t in self.tasks:
            if t["completed"] or not t.get("time"):
                continue
            try:
                when = datetime.strptime(
                    f"{t['date']} {t['time']}", "%Y-%m-%d %H:%M"
                ).timestamp()
            except (ValueError, KeyError):
                continue
            delay = when - now
            if delay <= 0:
                continue
            timer = threading.Timer(delay, notify, args=(t["title"], t["time"]))
            timer.daemon = True
            timer.start()
            self.timers[t["id"]] = timer


def main():
    api = Api()
    base_dir = os.path.dirname(os.path.abspath(__file__))
    index_path = os.path.join(base_dir, "renderer", "index.html")

    webview.create_window(
        "Daybloom",
        index_path,
        js_api=api,
        width=1180,
        height=760,
        min_size=(880, 600),
        background_color="#EAF0E4",
    )
    webview.start()


if __name__ == "__main__":
    main()
