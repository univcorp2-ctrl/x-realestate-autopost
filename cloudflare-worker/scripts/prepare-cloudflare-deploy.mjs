import { readFile, writeFile } from "node:fs/promises";

const accountId = process.env.CLOUDFLARE_ACCOUNT_ID;
const apiToken = process.env.CLOUDFLARE_API_TOKEN;
const namespaceTitle = process.env.CLOUDFLARE_KV_NAMESPACE_TITLE || "x_realestate_posted_log";

if (!accountId) {
  throw new Error("CLOUDFLARE_ACCOUNT_ID GitHub Secret is required");
}

if (!apiToken) {
  throw new Error("CLOUDFLARE_API_TOKEN GitHub Secret is required");
}

const baseUrl = `https://api.cloudflare.com/client/v4/accounts/${accountId}/storage/kv/namespaces`;
const headers = {
  authorization: `Bearer ${apiToken}`,
  "content-type": "application/json"
};

async function cloudflareFetch(url, init = {}) {
  const response = await fetch(url, {
    ...init,
    headers: { ...headers, ...(init.headers || {}) }
  });
  const data = await response.json().catch(() => ({}));
  if (!response.ok || data.success === false) {
    const errors = Array.isArray(data.errors) ? data.errors.map((e) => e.message).join(" / ") : response.statusText;
    throw new Error(`Cloudflare API error: ${response.status} ${errors}`);
  }
  return data;
}

async function listNamespaces() {
  const all = [];
  let page = 1;

  while (true) {
    const url = `${baseUrl}?per_page=100&page=${page}`;
    const data = await cloudflareFetch(url);
    all.push(...(data.result || []));

    const info = data.result_info;
    if (!info || page >= info.total_pages) break;
    page += 1;
  }

  return all;
}

async function ensureNamespace() {
  const existing = (await listNamespaces()).find((namespace) => namespace.title === namespaceTitle);
  if (existing) {
    console.log(`Using existing KV namespace: ${namespaceTitle}`);
    return existing.id;
  }

  const data = await cloudflareFetch(baseUrl, {
    method: "POST",
    body: JSON.stringify({ title: namespaceTitle })
  });

  console.log(`Created KV namespace: ${namespaceTitle}`);
  return data.result.id;
}

const namespaceId = await ensureNamespace();
const source = await readFile("wrangler.jsonc", "utf8");
const generated = source.replace("REPLACE_WITH_CLOUDFLARE_KV_NAMESPACE_ID", namespaceId);

if (generated.includes("REPLACE_WITH_CLOUDFLARE_KV_NAMESPACE_ID")) {
  throw new Error("Failed to replace KV namespace placeholder in wrangler.jsonc");
}

await writeFile("wrangler.generated.jsonc", generated, "utf8");
console.log("Generated wrangler.generated.jsonc for deployment");
