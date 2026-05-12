from __future__ import annotations

import csv
import json
import os
from datetime import datetime
from pathlib import Path
from zoneinfo import ZoneInfo

import requests
from requests_oauthlib import OAuth1

from src.text_builder import build_post
from src.validators import validate_post

ROOT = Path(__file__).resolve().parents[1]
CSV_PATH = Path(os.environ.get("PROPERTIES_CSV_PATH", ROOT / "data" / "properties.csv"))
LOG_PATH = Path(os.environ.get("POSTED_LOG_PATH", ROOT / "data" / "posted_log.json"))
JST = ZoneInfo("Asia/Tokyo")


def env_bool(name: str, default: bool) -> bool:
    raw = os.environ.get(name)
    if raw is None:
        return default
    return raw.strip().lower() in {"1", "true", "yes", "y", "on"}


def load_posted_log() -> dict:
    if not LOG_PATH.exists():
        return {"posted_ids": [], "posts": []}
    data = json.loads(LOG_PATH.read_text(encoding="utf-8"))
    data.setdefault("posted_ids", [])
    data.setdefault("posts", [])
    return data


def save_posted_log(log: dict) -> None:
    LOG_PATH.parent.mkdir(parents=True, exist_ok=True)
    LOG_PATH.write_text(json.dumps(log, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")


def load_candidates() -> list[dict[str, str]]:
    with CSV_PATH.open("r", encoding="utf-8-sig", newline="") as f:
        return list(csv.DictReader(f))


def parse_post_after(value: str | None) -> datetime | None:
    if not value or not value.strip():
        return None
    normalized = value.strip().replace("/", "-")
    for fmt in ("%Y-%m-%d %H:%M", "%Y-%m-%dT%H:%M", "%Y-%m-%d"):
        try:
            return datetime.strptime(normalized, fmt).replace(tzinfo=JST)
        except ValueError:
            continue
    raise ValueError(f"invalid post_after: {value}")


def priority_value(row: dict[str, str]) -> int:
    try:
        return int(row.get("priority") or 999)
    except ValueError:
        return 999


def pick_next_candidate(rows: list[dict[str, str]], posted_ids: set[str], now: datetime | None = None) -> dict[str, str] | None:
    now = now or datetime.now(tz=JST)
    ready: list[dict[str, str]] = []
    for row in rows:
        property_id = row.get("property_id", "").strip()
        status = row.get("status", "").strip().lower()
        if status != "ready" or not property_id or property_id in posted_ids:
            continue
        post_after = parse_post_after(row.get("post_after"))
        if post_after and post_after > now:
            continue
        ready.append(row)
    if not ready:
        return None
    ready.sort(key=lambda r: (priority_value(r), parse_post_after(r.get("post_after")) or datetime.min.replace(tzinfo=JST), r.get("property_id", "")))
    return ready[0]


def require_env(name: str) -> str:
    value = os.environ.get(name)
    if not value:
        raise RuntimeError(f"Set GitHub Secret: {name}")
    return value


def post_to_x(text: str) -> dict:
    auth = OAuth1(
        require_env("X_API_KEY"),
        require_env("X_API_SECRET"),
        require_env("X_ACCESS_TOKEN"),
        require_env("X_ACCESS_TOKEN_SECRET"),
    )
    response = requests.post("https://api.x.com/2/tweets", json={"text": text}, auth=auth, timeout=30)
    if response.status_code >= 400:
        raise RuntimeError(f"X API error: {response.status_code} {response.text}")
    return response.json()


def append_success_log(log: dict, row: dict[str, str], text: str, result: dict) -> None:
    property_id = row["property_id"]
    post_id = result.get("data", {}).get("id")
    log.setdefault("posted_ids", [])
    log.setdefault("posts", [])
    if property_id not in log["posted_ids"]:
        log["posted_ids"].append(property_id)
    log["posts"].append({"property_id": property_id, "x_post_id": post_id, "posted_at": datetime.now(tz=JST).isoformat(timespec="seconds"), "text": text})


def main() -> None:
    dry_run = env_bool("DRY_RUN", True)
    enabled = env_bool("AUTOPOST_ENABLED", False)
    log = load_posted_log()
    row = pick_next_candidate(load_candidates(), set(log.get("posted_ids", [])))
    if row is None:
        print("No candidate to post.")
        return
    text = build_post(row)
    errors = validate_post(text)
    if errors:
        raise ValueError("Validation failed: " + " / ".join(errors))
    print("----- POST PREVIEW -----")
    print(text)
    print("------------------------")
    if dry_run:
        print("DRY_RUN=true. Not posted.")
        return
    if not enabled:
        print("AUTOPOST_ENABLED=false. Not posted.")
        return
    result = post_to_x(text)
    append_success_log(log, row, text, result)
    save_posted_log(log)
    print(f"Posted to X. post_id={result.get('data', {}).get('id')}")


if __name__ == "__main__":
    main()
