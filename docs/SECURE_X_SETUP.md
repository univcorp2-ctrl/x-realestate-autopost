# Secure X API setup

## Important

Never commit API keys, access tokens, bearer tokens, client secrets, or `.env` files.

If a token was pasted into chat, issue trackers, commit history, logs, screenshots, or email, treat it as exposed. Revoke it in the X Developer Portal and generate a fresh token before production use.

## Credentials used by this MVP

This MVP posts with OAuth 1.0a user context. Set only these four values as GitHub Actions Secrets:

- `X_API_KEY` = Consumer Key / API Key
- `X_API_SECRET` = Consumer Secret / API Secret
- `X_ACCESS_TOKEN` = OAuth 1.0a Access Token
- `X_ACCESS_TOKEN_SECRET` = OAuth 1.0a Access Token Secret

The current MVP does not use these values for posting:

- Bearer Token
- OAuth 2.0 Client ID
- OAuth 2.0 Client Secret

## GitHub Secrets setup

1. Open the repository on GitHub.
2. Go to `Settings > Secrets and variables > Actions`.
3. Open `Secrets`.
4. Add the four OAuth 1.0a secrets above.
5. Open `Variables`.
6. Add `AUTOPOST_ENABLED=false` first.

Start with `AUTOPOST_ENABLED=false` and `DRY_RUN=true` until preview output is confirmed.

## Local dry-run test

```bash
python -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
pytest -q
python -m scripts.preview_next_post
DRY_RUN=true AUTOPOST_ENABLED=false python -m src.post_x
```

## Real test post

After rotating exposed tokens and setting fresh GitHub Secrets:

```bash
DRY_RUN=false AUTOPOST_ENABLED=true python -m src.post_x
```

Only run the real command after confirming the preview text. A successful post updates `data/posted_log.json`.

## Recommended GitHub Actions workflow

Create `.github/workflows/post-to-x.yml` only from a token/account that has workflow write permission.

```yaml
name: Post real estate content to X

on:
  workflow_dispatch:
    inputs:
      dry_run:
        description: "trueなら投稿せずプレビューのみ"
        required: true
        default: "true"
  schedule:
    - cron: "17 0 * * *"
    - cron: "23 3 * * *"
    - cron: "41 6 * * *"

concurrency:
  group: x-realestate-autopost
  cancel-in-progress: false

permissions:
  contents: write

jobs:
  post:
    runs-on: ubuntu-latest
    env:
      AUTOPOST_ENABLED: ${{ vars.AUTOPOST_ENABLED || 'false' }}
      DRY_RUN: ${{ github.event.inputs.dry_run || 'false' }}
      X_API_KEY: ${{ secrets.X_API_KEY }}
      X_API_SECRET: ${{ secrets.X_API_SECRET }}
      X_ACCESS_TOKEN: ${{ secrets.X_ACCESS_TOKEN }}
      X_ACCESS_TOKEN_SECRET: ${{ secrets.X_ACCESS_TOKEN_SECRET }}
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-python@v5
        with:
          python-version: "3.11"
      - run: python -m pip install --upgrade pip
      - run: pip install -r requirements.txt
      - run: pytest -q
      - run: python -m scripts.preview_next_post
      - run: python -m src.post_x
      - run: |
          git config user.name "x-autopost-bot"
          git config user.email "x-autopost-bot@example.com"
          git add data/posted_log.json
          git diff --cached --quiet || git commit -m "Update posted log"
          git push
```
