import type { PostedLog, PropertyRow } from "./types";

const JST_OFFSET_HOURS = 9;
const MAX_X_CHARS = 280;
const MAX_HASHTAGS = 3;

export function envBool(value: string | undefined, defaultValue: boolean): boolean {
  if (value === undefined) return defaultValue;
  return ["1", "true", "yes", "y", "on"].includes(value.trim().toLowerCase());
}

export function formatYen(value: string | number | undefined | null): string {
  if (value === undefined || value === null) return "";
  const amount = Number(String(value).replaceAll(",", "").trim());
  if (!Number.isFinite(amount)) return String(value);
  const rounded = Math.floor(amount);
  if (rounded >= 10_000) return `${Math.floor(rounded / 10_000).toLocaleString("ja-JP")}万円`;
  return `${rounded.toLocaleString("ja-JP")}円`;
}

export function buildPost(row: PropertyRow): string {
  return `【注目物件メモ】
エリア：${row.area}
最寄り：${row.station} 徒歩${row.walk_min}分
価格：${formatYen(row.price_yen)}
表面利回り：${row.gross_yield}%
見るポイント：
${row.summary}
詳細：
${row.url}
※掲載情報は投稿時点。利回り・条件は要確認。
#不動産投資`.trim();
}

export function validatePost(text: string): string[] {
  const errors: string[] = [];
  const stripped = text.trim();

  if (!stripped) errors.push("投稿文が空です");
  if (stripped.length > MAX_X_CHARS) errors.push(`投稿文が長すぎます: ${stripped.length}文字`);
  if ((stripped.match(/#/g) ?? []).length > MAX_HASHTAGS) errors.push("ハッシュタグが多すぎます");
  if (stripped.includes("@")) errors.push("MVPではメンション投稿は禁止です");

  const lines = stripped.split(/\r?\n/).map((line) => line.trim()).filter(Boolean);
  const nonUrlLines = lines.filter((line) => !line.startsWith("http://") && !line.startsWith("https://"));
  if (lines.length > 0 && nonUrlLines.length === 0) errors.push("URLだけの投稿は禁止です");

  return errors;
}

export function parseJstDate(value: string): Date | null {
  const trimmed = value.trim();
  if (!trimmed) return null;

  const normalized = trimmed.replaceAll("/", "-").replace("T", " ");
  const match = normalized.match(/^(\d{4})-(\d{2})-(\d{2})(?:\s+(\d{2}):(\d{2}))?$/);
  if (!match) throw new Error(`post_afterの形式が不正です: ${value}`);

  const [, y, m, d, hh = "00", mm = "00"] = match;
  const utcMillis = Date.UTC(Number(y), Number(m) - 1, Number(d), Number(hh) - JST_OFFSET_HOURS, Number(mm));
  return new Date(utcMillis);
}

function priorityValue(row: PropertyRow): number {
  const value = Number(row.priority || "999");
  return Number.isFinite(value) ? value : 999;
}

export function pickNextCandidate(rows: PropertyRow[], log: PostedLog, now = new Date()): PropertyRow | null {
  const postedIds = new Set(log.posted_ids);
  const ready = rows.filter((row) => {
    if (row.status.trim().toLowerCase() !== "ready") return false;
    if (!row.property_id.trim()) return false;
    if (postedIds.has(row.property_id)) return false;
    const postAfter = parseJstDate(row.post_after);
    return !postAfter || postAfter <= now;
  });

  ready.sort((a, b) => {
    const priorityDiff = priorityValue(a) - priorityValue(b);
    if (priorityDiff !== 0) return priorityDiff;
    const aTime = parseJstDate(a.post_after)?.getTime() ?? 0;
    const bTime = parseJstDate(b.post_after)?.getTime() ?? 0;
    if (aTime !== bTime) return aTime - bTime;
    return a.property_id.localeCompare(b.property_id);
  });

  return ready[0] ?? null;
}

export function emptyLog(): PostedLog {
  return { posted_ids: [], posts: [] };
}
