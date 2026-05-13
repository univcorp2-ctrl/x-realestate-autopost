from __future__ import annotations


def format_yen(value: str | int | float | None) -> str:
    if value is None:
        return ""
    try:
        amount = int(float(str(value).replace(",", "").strip()))
    except (TypeError, ValueError):
        return str(value)
    if amount >= 10000:
        return f"{amount // 10000:,}万円"
    return f"{amount:,}円"


def build_post(row: dict[str, str]) -> str:
    text = f"""【注目物件メモ】
エリア：{row.get('area', '')}
最寄り：{row.get('station', '')} 徒歩{row.get('walk_min', '')}分
価格：{format_yen(row.get('price_yen', ''))}
表面利回り：{row.get('gross_yield', '')}%
見るポイント：
{row.get('summary', '')}
詳細：
{row.get('url', '')}
※掲載情報は投稿時点。利回り・条件は要確認。
#不動産投資"""
    return text.strip()
