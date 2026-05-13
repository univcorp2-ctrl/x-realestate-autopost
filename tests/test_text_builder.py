from src.text_builder import build_post, format_yen


def test_format_yen_large_amount() -> None:
    assert format_yen("49800000") == "4,980万円"


def test_format_yen_non_number() -> None:
    assert format_yen("価格相談") == "価格相談"


def test_build_post_contains_fields() -> None:
    row = {
        "area": "中野区",
        "station": "中野駅",
        "walk_min": "12",
        "price_yen": "49800000",
        "gross_yield": "7.20",
        "summary": "駅徒歩圏・価格改定あり",
        "url": "https://example.com/1",
    }
    text = build_post(row)
    assert "中野区" in text
    assert "中野駅 徒歩12分" in text
    assert "4,980万円" in text
    assert "7.20%" in text
    assert "#不動産投資" in text
