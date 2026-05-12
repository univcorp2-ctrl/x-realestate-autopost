from src.text_builder import build_post, format_yen


def test_format_yen_large_amount() -> None:
    assert format_yen("49800000") == "4,980 man yen"


def test_format_yen_non_number() -> None:
    assert format_yen("ask") == "ask"


def test_build_post_contains_fields() -> None:
    row = {
        "area": "Nakano-ku",
        "station": "Nakano Station",
        "walk_min": "12",
        "price_yen": "49800000",
        "gross_yield": "7.20",
        "summary": "Price updated",
        "url": "https://example.com/1",
    }
    text = build_post(row)
    assert "Nakano-ku" in text
    assert "Nakano Station 12 min walk" in text
    assert "4,980 man yen" in text
    assert "7.20%" in text
    assert "#RealEstateInvestment" in text
