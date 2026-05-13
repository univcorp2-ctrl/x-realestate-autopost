# Cloudflareだけで完結させる運用ガイド

このガイドは、ローカルPCで定期実行せず、GitHubとCloudflareだけでX自動投稿MVPを動かすための手順です。

## 目標構成

```text
GitHub repository
  └─ cloudflare-worker/
       ├─ src/index.ts        実行本体
       ├─ src/properties.ts   物件データ
       └─ wrangler.jsonc      Cloudflare設定
        ↓ push / Git連携
Cloudflare Workers
        ↓ Cron Triggers
1日数回だけ起動
        ↓
Workers KV
投稿済みproperty_idを保存
        ↓
X API POST /2/tweets
```

## 重要なセキュリティ方針

1. APIキー、トークン、SecretはGitHubに絶対に入れない。
2. XのキーはCloudflare WorkersのSecretsにだけ保存する。
3. 手動実行URLは `ADMIN_TOKEN` で保護する。
4. このチャットやメールなどに貼ったXトークンは漏えい扱いにして、X Developer Portalで再発行する。
5. 最初は `AUTOPOST_ENABLED=false` のままプレビューだけ確認する。
6. 投稿開始後も1日2〜3回から開始する。

## 今回追加したCloudflare用ファイル

```text
cloudflare-worker/
  package.json
  tsconfig.json
  wrangler.jsonc
  src/
    index.ts
    core.ts
    oauth1.ts
    properties.ts
    types.ts
  test/
    core.test.ts
```

## Step 1: X Developer Portalでキーを作り直す

このチャットに貼ったキーは使わず、X Developer Portalで再発行してください。

必要なのはOAuth 1.0aの4つです。

```text
X_API_KEY              = Consumer Key / API Key
X_API_SECRET           = Consumer Secret / API Secret
X_ACCESS_TOKEN         = OAuth 1.0a Access Token
X_ACCESS_TOKEN_SECRET  = OAuth 1.0a Access Token Secret
```

X Appの権限は `Read and write` が必要です。投稿だけのMVPではDM権限は不要です。

## Step 2: CloudflareでKVを作る

Cloudflare Dashboardで操作します。

1. Cloudflareにログイン
2. 左メニューで `Workers & Pages` を開く
3. `KV` を開く
4. `Create namespace` を押す
5. 名前を `x_realestate_posted_log` にする
6. 作成後、KV namespace IDをコピーする

## Step 3: GitHub上でwrangler.jsoncを編集する

GitHubで次のファイルを開きます。

```text
cloudflare-worker/wrangler.jsonc
```

この部分を、Step 2でコピーしたKV namespace IDに置き換えます。

```jsonc
"id": "REPLACE_WITH_CLOUDFLARE_KV_NAMESPACE_ID"
```

置き換えたらGitHub上でcommitします。

## Step 4: CloudflareとGitHubリポを接続する

Cloudflare Dashboardで操作します。

1. `Workers & Pages` を開く
2. `Create application` または `Create Worker` を選ぶ
3. GitHub連携を選ぶ
4. リポジトリ `univcorp2-ctrl/x-realestate-autopost` を選ぶ
5. Root directoryを以下にする

```text
cloudflare-worker
```

6. Build commandを以下にする

```bash
npm install && npm run deploy
```

7. Deploy commandを別で聞かれる画面なら、Deploy commandに以下を入れる

```bash
npm run deploy
```

8. 初回デプロイする

## Step 5: CloudflareにSecretsを設定する

Cloudflare Dashboardで対象Workerを開きます。

1. `Settings` を開く
2. `Variables and Secrets` を開く
3. `Add` で以下をSecretとして追加する

```text
X_API_KEY
X_API_SECRET
X_ACCESS_TOKEN
X_ACCESS_TOKEN_SECRET
ADMIN_TOKEN
```

`ADMIN_TOKEN` は手動実行URLを守るための合言葉です。32文字以上のランダム文字列にしてください。

例:

```text
4af39c0b8d7e4c49b0c07d5d6f4b8a22
```

この値もGitHubには入れません。

## Step 6: 最初は投稿停止のまま確認する

`wrangler.jsonc` の初期値は以下です。

```jsonc
"AUTOPOST_ENABLED": "false"
```

この状態ではCronが動いてもXには投稿されません。

## Step 7: 手動プレビューする

WorkerのURLが以下だとします。

```text
https://x-realestate-autopost.<your-subdomain>.workers.dev
```

ブラウザではなく、CloudflareのWorker画面、Postman、curl、またはHTTPクライアントから以下を呼びます。

```bash
curl -H "Authorization: Bearer <ADMIN_TOKEN>" \
  https://x-realestate-autopost.<your-subdomain>.workers.dev/preview
```

返ってくる投稿文は以下のような内容です。

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

## Step 8: dry-runで手動実行する

まだ投稿しません。

```bash
curl -X POST \
  -H "Authorization: Bearer <ADMIN_TOKEN>" \
  https://x-realestate-autopost.<your-subdomain>.workers.dev/run?dry_run=true
```

`mode: "preview"` が返ればOKです。

## Step 9: 実投稿を有効化する

GitHubで `cloudflare-worker/wrangler.jsonc` を編集します。

```jsonc
"AUTOPOST_ENABLED": "true"
```

commitするとCloudflareへ再デプロイされます。

## Step 10: 1回だけテスト投稿する

```bash
curl -X POST \
  -H "Authorization: Bearer <ADMIN_TOKEN>" \
  https://x-realestate-autopost.<your-subdomain>.workers.dev/run?dry_run=false
```

成功するとWorkers KVの `posted_log` に投稿済みログが保存され、同じ `property_id` は再投稿されません。

## Step 11: 定時実行

`wrangler.jsonc` では以下のCronを設定しています。

```jsonc
"crons": [
  "17 0 * * *",
  "23 3 * * *",
  "41 6 * * *"
]
```

Cloudflare WorkersのCronはUTC基準なので、これはJSTで以下です。

```text
09:17
12:23
15:41
```

## 物件を追加・変更する方法

GitHubで以下を編集します。

```text
cloudflare-worker/src/properties.ts
```

新しい物件を追加するときは `property_id` を必ずユニークにしてください。

```ts
{
  property_id: "TK003",
  status: "ready",
  area: "世田谷区",
  station: "三軒茶屋駅",
  walk_min: "8",
  price_yen: "52800000",
  gross_yield: "6.80",
  property_type: "中古区分",
  summary: "駅徒歩圏・賃貸需要確認向き",
  url: "https://example.com/3",
  priority: "1",
  post_after: "2026-05-13 09:00"
}
```

commitするとCloudflareに自動デプロイされます。

## 初心者向けのおすすめ運用

最初の1週間はこの設定がおすすめです。

```text
AUTOPOST_ENABLED=false
```

手動で `/preview` と `/run?dry_run=true` だけ確認します。

問題なければ次に進みます。

```text
AUTOPOST_ENABLED=true
```

その後も物件数が少ないうちは、1日1〜3件に抑えてください。

## トラブル時の見方

Cloudflare Dashboardで対象Workerを開きます。

- `Logs`: エラー確認
- `Metrics`: 実行回数確認
- `Settings > Variables and Secrets`: Secret設定確認
- `KV`: `posted_log` が保存されているか確認

## よくある失敗

### 投稿されない

以下を確認してください。

- `AUTOPOST_ENABLED=true` になっているか
- X Appが `Read and write` 権限か
- Access Tokenを権限変更後に再生成したか
- Cloudflare Secretsの名前が完全一致しているか
- `posted_log` に同じ `property_id` が既に入っていないか

### GitHubにSecretを入れそうになる

入れないでください。X APIキーはCloudflare Secretsだけに保存します。

### 手動URLを他人に叩かれるのが不安

`/preview` と `/run` は `ADMIN_TOKEN` 必須です。`/health` だけ公開でOKです。

## 次に拡張するなら

1. `properties.ts` からD1管理に移行
2. Cloudflare D1に物件テーブルと投稿ログテーブルを作る
3. 管理画面をCloudflare Pagesで作る
4. 画像投稿を追加
5. Slack通知を追加

最初はKVで投稿済みログ、GitHubで物件データ管理のままが一番簡単です。
