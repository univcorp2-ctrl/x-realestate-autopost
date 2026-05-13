# X Real Estate Autopost MVP

不動産物件リストから未投稿の `ready` 物件を1件だけ選び、X公式APIで投稿するMVPです。

Repo: https://github.com/univcorp2-ctrl/x-realestate-autopost

## What it does

- `data/properties.csv` を読む
- `data/posted_log.json` の `property_id` で二重投稿を防ぐ
- 1回の実行で `status=ready` の未投稿物件を1件だけ選ぶ
- テンプレートで投稿文を生成
- 280文字、ハッシュタグ数、メンション、URLだけ投稿を検証
- `DRY_RUN=true` なら投稿せずプレビュー
- `AUTOPOST_ENABLED=false` なら実投稿しない
- 投稿成功時だけ `posted_log.json` を更新

## Current sample post

現在の初期CSVでは、最初の投稿候補は以下です。

```text
【注目物件メモ】
エリア：中野区
最寄り：中野駅 徒歩12分
価格：4,980万円
表面利回り：7.20%
見るポイント：
駅徒歩圏・価格改定あり
詳細：
https://example.com/1
※掲載情報は投稿時点。利回り・条件は要確認。
#不動産投資
```

## Local setup

```bash
python -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
pytest -q
python -m scripts.preview_next_post
DRY_RUN=true AUTOPOST_ENABLED=false python -m src.post_x
```

## Required GitHub Secrets

このMVPはOAuth 1.0a user contextで投稿します。GitHubには以下4つだけをSecretsとして設定してください。

- `X_API_KEY`
- `X_API_SECRET`
- `X_ACCESS_TOKEN`
- `X_ACCESS_TOKEN_SECRET`

Bearer Token、OAuth 2.0 Client ID、OAuth 2.0 Client SecretはこのMVPの投稿処理では使いません。

詳細は `docs/SECURE_X_SETUP.md` を参照してください。
