from __future__ import annotations

MAX_X_CHARS = 280
MAX_HASHTAGS = 3


def validate_post(text: str) -> list[str]:
    errors: list[str] = []
    stripped = text.strip()
    if not stripped:
        errors.append("投稿文が空です")
    if len(stripped) > MAX_X_CHARS:
        errors.append(f"投稿文が長すぎます: {len(stripped)}文字")
    if stripped.count("#") > MAX_HASHTAGS:
        errors.append("ハッシュタグが多すぎます")
    if "@" in stripped:
        errors.append("MVPではメンション投稿は禁止です")
    lines = [line.strip() for line in stripped.splitlines() if line.strip()]
    non_url_lines = [line for line in lines if not line.startswith(("http://", "https://"))]
    if lines and not non_url_lines:
        errors.append("URLだけの投稿は禁止です")
    return errors
