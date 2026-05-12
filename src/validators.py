from __future__ import annotations

MAX_X_CHARS = 280
MAX_HASHTAGS = 3


def validate_post(text: str) -> list[str]:
    errors: list[str] = []
    stripped = text.strip()
    if not stripped:
        errors.append("post text is empty")
    if len(stripped) > MAX_X_CHARS:
        errors.append(f"post text is too long: {len(stripped)} chars")
    if stripped.count("#") > MAX_HASHTAGS:
        errors.append("too many hashtags")
    if "@" in stripped:
        errors.append("mentions are disabled in this MVP")
    lines = [line.strip() for line in stripped.splitlines() if line.strip()]
    non_url_lines = [line for line in lines if not line.startswith(("http://", "https://"))]
    if lines and not non_url_lines:
        errors.append("URL-only posts are not allowed")
    return errors
