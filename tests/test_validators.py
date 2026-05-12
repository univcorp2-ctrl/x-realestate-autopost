from src.validators import validate_post


def test_validate_post_accepts_normal_post() -> None:
    text = "Featured property memo\nArea: Nakano\nDetails:\nhttps://example.com/1\n#RealEstateInvestment"
    assert validate_post(text) == []


def test_validate_post_rejects_empty_text() -> None:
    assert "post text is empty" in validate_post("   ")


def test_validate_post_rejects_long_text() -> None:
    assert any("post text is too long" in error for error in validate_post("a" * 281))


def test_validate_post_rejects_too_many_hashtags() -> None:
    assert "too many hashtags" in validate_post("#a #b #c #d")


def test_validate_post_rejects_mentions() -> None:
    assert "mentions are disabled in this MVP" in validate_post("@someone property memo")


def test_validate_post_rejects_url_only_post() -> None:
    assert "URL-only posts are not allowed" in validate_post("https://example.com/1")
