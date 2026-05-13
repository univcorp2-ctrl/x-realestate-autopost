# 本番テスト準備と実行手順

このリポジトリには、Cloudflare Workersへ自動デプロイするGitHub Actionsを追加済みです。

```text
.github/workflows/deploy-cloudflare-worker.yml
```

このworkflowは以下を自動で行います。

1. Node.jsセットアップ
2. `npm install`
3. TypeScript型チェック
4. Vitest実行
5. Cloudflare KV namespace `x_realestate_posted_log` の自動作成/取得
6. `wrangler.generated.jsonc` の生成
7. Cloudflare Workersへデプロイ

## あなた側で必要な設定

チャットには絶対に貼らず、GitHubまたはCloudflareの管理画面に直接入れてください。

### 1. GitHub Secretsに入れるもの

GitHubリポジトリで以下を設定します。

場所:

```text
GitHub repo
→ Settings
→ Secrets and variables
→ Actions
→ New repository secret
```

必要なSecret:

```text
CLOUDFLARE_ACCOUNT_ID
CLOUDFLARE_API_TOKEN
```

`CLOUDFLARE_API_TOKEN` はCloudflareで作成します。権限は最小限にします。

推奨:

```text
Account: 対象アカウントだけ
Permissions:
- Workers Scripts: Edit
- Workers KV Storage: Edit
```

もし権限不足で失敗する場合は、Cloudflare公式の `Edit Cloudflare Workers` テンプレートを使ってください。

### 2. Cloudflare Worker Secretsに入れるもの

CloudflareのWorkerデプロイ後、対象Workerで以下をSecretとして設定します。

場所:

```text
Cloudflare Dashboard
→ Workers & Pages
→ x-realestate-autopost
→ Settings
→ Variables and Secrets
→ Add
```

必要なSecret:

```text
X_API_KEY
X_API_SECRET
X_ACCESS_TOKEN
X_ACCESS_TOKEN_SECRET
ADMIN_TOKEN
```

`ADMIN_TOKEN` は `/preview` と `/run` を守るための合言葉です。32文字以上のランダム値にしてください。

例:

```text
openssl rand -hex 32
```

### 3. X Developer Portalで必要なこと

前にチャットへ貼ったXキーは漏えい扱いにして、必ず再発行してください。

必要なのはOAuth 1.0aの4つです。

```text
Consumer Key / API Key
Consumer Secret / API Secret
OAuth 1.0a Access Token
OAuth 1.0a Access Token Secret
```

X Appの権限は `Read and write` にしてください。権限変更後はAccess Tokenを再発行してください。

Bearer Token、OAuth 2.0 Client ID、OAuth 2.0 Client SecretはこのMVPでは使いません。

## 本番テストの安全手順

### Step 1: 本番投稿用の物件に差し替える

本番Xアカウントでは、`https://example.com/1` のまま投稿しないでください。

GitHubで以下を編集します。

```text
cloudflare-worker/src/properties.ts
```

本番テスト用に1件だけ `status: "ready"` にします。他は `status: "review"` にしてください。

### Step 2: deploy workflowを実行する

GitHubで以下を開きます。

```text
Actions
→ Deploy Cloudflare Worker
→ Run workflow
```

成功するとCloudflareにWorkerが作られます。

### Step 3: Cloudflare Worker Secretsを設定する

Cloudflare側で以下を設定します。

```text
X_API_KEY
X_API_SECRET
X_ACCESS_TOKEN
X_ACCESS_TOKEN_SECRET
ADMIN_TOKEN
```

設定後、もう一度 `Deploy Cloudflare Worker` workflowを実行してください。

### Step 4: health確認

Worker URLを確認して実行します。

```bash
curl https://x-realestate-autopost.<your-subdomain>.workers.dev/health
```

期待値:

```json
{
  "ok": true,
  "service": "x-realestate-autopost"
}
```

### Step 5: preview確認

```bash
curl -H "Authorization: Bearer <ADMIN_TOKEN>" \
  https://x-realestate-autopost.<your-subdomain>.workers.dev/preview
```

期待値:

```text
mode: "preview"
chars: 280以下
text: 投稿予定文
```

### Step 6: dry-run確認

```bash
curl -X POST \
  -H "Authorization: Bearer <ADMIN_TOKEN>" \
  https://x-realestate-autopost.<your-subdomain>.workers.dev/run?dry_run=true
```

この時点では投稿されません。

### Step 7: disabled guard確認

初期状態では `AUTOPOST_ENABLED=false` です。

```bash
curl -X POST \
  -H "Authorization: Bearer <ADMIN_TOKEN>" \
  https://x-realestate-autopost.<your-subdomain>.workers.dev/run?dry_run=false
```

期待値:

```text
mode: "disabled"
```

### Step 8: 1回だけ実投稿する

GitHubで以下を編集します。

```text
cloudflare-worker/wrangler.jsonc
```

```jsonc
"AUTOPOST_ENABLED": "true"
```

commitするとデプロイworkflowが走ります。

デプロイ成功後、以下を1回だけ実行します。

```bash
curl -X POST \
  -H "Authorization: Bearer <ADMIN_TOKEN>" \
  https://x-realestate-autopost.<your-subdomain>.workers.dev/run?dry_run=false
```

期待値:

```text
mode: "posted"
x_post_id: 値あり
```

### Step 9: すぐ停止する

実投稿成功後、必ず以下へ戻してください。

```jsonc
"AUTOPOST_ENABLED": "false"
```

commitして再デプロイします。

### Step 10: 投稿済みログ確認

Cloudflare KVで `posted_log` を確認します。

期待値:

```text
posted_ids に property_id が入っている
posts に x_post_id が入っている
```

## 失敗時の見方

### GitHub Actionsが失敗する

- `CLOUDFLARE_ACCOUNT_ID` が正しいか
- `CLOUDFLARE_API_TOKEN` が正しいか
- API TokenにWorkers編集権限があるか
- API TokenにKV編集権限があるか

### /preview が401になる

- `ADMIN_TOKEN` がCloudflare Worker Secretに設定されているか
- Authorizationヘッダーが `Bearer <ADMIN_TOKEN>` になっているか

### X投稿が失敗する

- X Appが `Read and write` 権限か
- 権限変更後にAccess Tokenを再発行したか
- `X_API_KEY` などのSecret名が完全一致しているか
- 以前チャットに貼った古いキーを使っていないか

## 完了報告テンプレ

```text
本番テスト結果:
- Deploy Cloudflare Worker workflow: pass / fail
- Worker URL:
- /health: pass / fail
- /preview: pass / fail
- /run?dry_run=true: pass / fail
- disabled guard: pass / fail
- 実投稿: pass / fail
- x_post_id:
- KV posted_log保存: pass / fail
- AUTOPOST_ENABLED=falseへ戻した: yes / no
- Secret漏えいログなし: yes / no
- 問題点:
```
