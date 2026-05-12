from datetime import datetime
from zoneinfo import ZoneInfo

from src.post_x import append_success_log, pick_next_candidate

JST = ZoneInfo("Asia/Tokyo")


def test_pick_next_candidate_skips_future_and_non_ready_rows() -> None:
    rows = [
        {"property_id": "TK001", "status": "ready", "priority": "1", "post_after": "2026-05-12 09:00"},
        {"property_id": "TK002", "status": "ready", "priority": "2", "post_after": "2099-01-01 09:00"},
        {"property_id": "TK003", "status": "review", "priority": "1", "post_after": "2026-05-12 09:00"},
    ]
    picked = pick_next_candidate(rows, posted_ids=set(), now=datetime(2026, 5, 12, 10, 0, tzinfo=JST))
    assert picked is not None
    assert picked["property_id"] == "TK001"


def test_pick_next_candidate_uses_priority_order() -> None:
    rows = [
        {"property_id": "TK001", "status": "ready", "priority": "9", "post_after": ""},
        {"property_id": "TK002", "status": "ready", "priority": "1", "post_after": ""},
    ]
    picked = pick_next_candidate(rows, posted_ids=set(), now=datetime.now(tz=JST))
    assert picked is not None
    assert picked["property_id"] == "TK002"


def test_append_success_log_records_post_once() -> None:
    log = {"posted_ids": ["TK001"], "posts": []}
    append_success_log(log, {"property_id": "TK001"}, "text", {"data": {"id": "12345"}})
    assert log["posted_ids"] == ["TK001"]
    assert log["posts"][0]["x_post_id"] == "12345"
