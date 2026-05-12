from __future__ import annotations


def format_yen(value: str | int | float | None) -> str:
    if value is None:
        return ""
    try:
        amount = int(float(str(value).replace(",", "").strip()))
    except (TypeError, ValueError):
        return str(value)
    if amount >= 10000:
        return f"{amount // 10000:,} man yen"
    return f"{amount:,} yen"


def build_post(row: dict[str, str]) -> str:
    text = f"""Featured property memo
Area: {row.get('area', '')}
Nearest: {row.get('station', '')} {row.get('walk_min', '')} min walk
Price: {format_yen(row.get('price_yen', ''))}
Gross yield: {row.get('gross_yield', '')}%
Point:
{row.get('summary', '')}
Details:
{row.get('url', '')}
Info is current as of posting. Please verify yield and conditions.
#RealEstateInvestment"""
    return text.strip()
