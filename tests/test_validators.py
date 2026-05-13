from src.validators import validate_post


def test_validate_post_accepts_normal_post() -> None:
    text = "【注目物件メモ】\nエリア：中野区\n詳細：\nhttps://example.com/1\n#不動産投資"
    assert validate_post(text) == []


def test_validate_post_rejects_empty_text() -> None:
    assert "投稿文が空です" in validate_post("   ")


def test_validate_post_rejects_long_text() -> None:
    assert any("投稿文が長すぎます" in error for error in validate_post("あ" * 281))


def test_validate_post_rejects_too_many_hashtags() -> None:
    assert "ハッシュタグが多すぎます" in validate_post("#a #b #c #d")


def test_validate_post_rejects_mentions() -> None:
    assert "MVPではメンション投稿は禁止です" in validate_post("@someone 物件メモ")


def test_validate_post_rejects_url_only_post() -> None:
    assert "URLだけの投稿は禁止です" in validate_post("https://example.com/1")
