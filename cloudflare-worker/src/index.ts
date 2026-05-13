import { buildPost, emptyLog, envBool, pickNextCandidate, validatePost } from "./core";
import { createOAuth1Header } from "./oauth1";
import { PROPERTIES } from "./properties";
import type { PostedLog, RunResult } from "./types";

const LOG_KEY = "posted_log";
const X_CREATE_POST_URL = "https://api.x.com/2/tweets";

type Env = {
  POSTED_LOG: KVNamespace;
  AUTOPOST_ENABLED?: string;
  X_API_KEY?: string;
  X_API_SECRET?: string;
  X_ACCESS_TOKEN?: string;
  X_ACCESS_TOKEN_SECRET?: string;
  ADMIN_TOKEN?: string;
};

function json(data: unknown, init: ResponseInit = {}): Response {
  return new Response(JSON.stringify(data, null, 2), {
    ...init,
    headers: {
      "content-type": "application/json; charset=utf-8",
      ...init.headers
    }
  });
}

function requireSecret(env: Env, name: keyof Env): string {
  const value = env[name];
  if (typeof value !== "string" || value.length === 0) {
    throw new Error(`Cloudflare Secret ${String(name)} が未設定です`);
  }
  return value;
}

function isAuthorized(request: Request, env: Env): boolean {
  const adminToken = env.ADMIN_TOKEN;
  if (!adminToken || adminToken.length < 24) return false;

  const auth = request.headers.get("authorization");
  const xAdminToken = request.headers.get("x-admin-token");
  return auth === `Bearer ${adminToken}` || xAdminToken === adminToken;
}

async function loadPostedLog(env: Env): Promise<PostedLog> {
  const stored = await env.POSTED_LOG.get<PostedLog>(LOG_KEY, "json");
  if (!stored) return emptyLog();
  return {
    posted_ids: Array.isArray(stored.posted_ids) ? stored.posted_ids : [],
    posts: Array.isArray(stored.posts) ? stored.posts : []
  };
}

async function savePostedLog(env: Env, log: PostedLog): Promise<void> {
  await env.POSTED_LOG.put(LOG_KEY, JSON.stringify(log, null, 2));
}

async function postToX(env: Env, text: string): Promise<{ data?: { id?: string; text?: string } }> {
  const authorization = await createOAuth1Header("POST", X_CREATE_POST_URL, {
    apiKey: requireSecret(env, "X_API_KEY"),
    apiSecret: requireSecret(env, "X_API_SECRET"),
    accessToken: requireSecret(env, "X_ACCESS_TOKEN"),
    accessTokenSecret: requireSecret(env, "X_ACCESS_TOKEN_SECRET")
  });

  const response = await fetch(X_CREATE_POST_URL, {
    method: "POST",
    headers: {
      authorization,
      "content-type": "application/json"
    },
    body: JSON.stringify({ text })
  });

  const responseText = await response.text();
  if (!response.ok) {
    throw new Error(`X API error: ${response.status} ${responseText}`);
  }

  return JSON.parse(responseText) as { data?: { id?: string; text?: string } };
}

async function runOnce(env: Env, options: { dryRun: boolean; source: string }): Promise<RunResult> {
  const log = await loadPostedLog(env);
  const candidate = pickNextCandidate(PROPERTIES, log);

  if (!candidate) {
    return { ok: true, mode: "no_candidate", source: options.source, message: "投稿候補がありません" };
  }

  const text = buildPost(candidate);
  const errors = validatePost(text);
  if (errors.length > 0) {
    throw new Error(`Validation failed: ${errors.join(" / ")}`);
  }

  if (options.dryRun) {
    return {
      ok: true,
      mode: "preview",
      source: options.source,
      property_id: candidate.property_id,
      text,
      chars: text.length
    };
  }

  if (!envBool(env.AUTOPOST_ENABLED, false)) {
    return {
      ok: true,
      mode: "disabled",
      source: options.source,
      property_id: candidate.property_id,
      text,
      chars: text.length,
      message: "AUTOPOST_ENABLED=false のため投稿しません"
    };
  }

  const result = await postToX(env, text);
  const postId = result.data?.id;

  if (!log.posted_ids.includes(candidate.property_id)) {
    log.posted_ids.push(candidate.property_id);
  }
  log.posts.push({
    property_id: candidate.property_id,
    x_post_id: postId,
    posted_at: new Date().toISOString(),
    text,
    source: options.source
  });
  await savePostedLog(env, log);

  return {
    ok: true,
    mode: "posted",
    source: options.source,
    property_id: candidate.property_id,
    text,
    chars: text.length,
    x_post_id: postId
  };
}

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    const url = new URL(request.url);

    if (url.pathname === "/health") {
      return json({ ok: true, service: "x-realestate-autopost" });
    }

    if (url.pathname === "/preview") {
      if (!isAuthorized(request, env)) return json({ ok: false, error: "unauthorized" }, { status: 401 });
      const result = await runOnce(env, { dryRun: true, source: "manual-preview" });
      return json(result);
    }

    if (url.pathname === "/run" && request.method === "POST") {
      if (!isAuthorized(request, env)) return json({ ok: false, error: "unauthorized" }, { status: 401 });
      const dryRun = url.searchParams.get("dry_run") !== "false";
      const result = await runOnce(env, { dryRun, source: "manual-run" });
      return json(result);
    }

    return json({
      ok: true,
      routes: [
        "GET /health",
        "GET /preview with Authorization: Bearer <ADMIN_TOKEN>",
        "POST /run?dry_run=true with Authorization: Bearer <ADMIN_TOKEN>",
        "POST /run?dry_run=false with Authorization: Bearer <ADMIN_TOKEN>"
      ]
    });
  },

  async scheduled(event: ScheduledEvent, env: Env, ctx: ExecutionContext): Promise<void> {
    ctx.waitUntil(runOnce(env, { dryRun: false, source: `cron:${event.cron}` }).then(console.log).catch(console.error));
  }
};
