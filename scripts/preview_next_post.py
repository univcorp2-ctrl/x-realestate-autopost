from __future__ import annotations

from src.post_x import load_candidates, load_posted_log, pick_next_candidate
from src.text_builder import build_post
from src.validators import validate_post


def main() -> None:
    log = load_posted_log()
    row = pick_next_candidate(load_candidates(), set(log.get("posted_ids", [])))
    if row is None:
        print("No candidate to post.")
        return
    text = build_post(row)
    errors = validate_post(text)
    print("----- NEXT POST PREVIEW -----")
    print(text)
    print("-----------------------------")
    print(f"chars={len(text)}")
    if errors:
        print("validation_errors=" + " / ".join(errors))
    else:
        print("validation=ok")


if __name__ == "__main__":
    main()
