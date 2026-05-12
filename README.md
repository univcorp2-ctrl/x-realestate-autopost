# X Real Estate Autopost MVP

Python MVP for posting one ready, unposted real estate property to X using the official X API.

## What it does

- Reads `data/properties.csv`
- Skips already posted `property_id` values in `data/posted_log.json`
- Picks one `status=ready` property per run
- Builds deterministic post text
- Validates length, hashtags, mentions, and URL-only posts
- Supports `DRY_RUN=true`
- Supports emergency stop with `AUTOPOST_ENABLED=false`
- Updates `posted_log.json` only after a successful X API response

## Local setup

```bash
python -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
pytest -q
DRY_RUN=true AUTOPOST_ENABLED=false python -m src.post_x
```

## Required secrets

Set these in GitHub Actions or your environment:

- `X_API_KEY`
- `X_API_SECRET`
- `X_ACCESS_TOKEN`
- `X_ACCESS_TOKEN_SECRET`

## GitHub Actions workflow

If your GitHub token has workflow write permission, create `.github/workflows/post-to-x.yml` with this content:

```yaml
name: Post real estate content to X

on:
  workflow_dispatch:
    inputs:
      dry_run:
        description: "true means preview only"
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
      - run: python -m src.post_x
      - run: |
          git config user.name "x-autopost-bot"
          git config user.email "x-autopost-bot@example.com"
          git add data/posted_log.json
          git diff --cached --quiet || git commit -m "Update posted log"
          git push
```
