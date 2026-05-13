import { describe, expect, it } from "vitest";
import { buildPost, emptyLog, formatYen, parseJstDate, pickNextCandidate, validatePost } from "../src/core";
import { PROPERTIES } from "../src/properties";

describe("core", () => {
  it("formats yen as man-yen", () => {
    expect(formatYen("49800000")).toBe("4,980万円");
  });

  it("builds Japanese post text", () => {
    const text = buildPost(PROPERTIES[0]);
    expect(text).toContain("【注目物件メモ】");
    expect(text).toContain("中野区");
    expect(text).toContain("中野駅 徒歩12分");
    expect(text).toContain("4,980万円");
    expect(text).toContain("#不動産投資");
  });

  it("validates normal post", () => {
    expect(validatePost(buildPost(PROPERTIES[0]))).toEqual([]);
  });

  it("rejects mention posts", () => {
    expect(validatePost("@someone テスト投稿")).toContain("MVPではメンション投稿は禁止です");
  });

  it("parses JST date as UTC instant", () => {
    expect(parseJstDate("2026-05-12 09:00")?.toISOString()).toBe("2026-05-12T00:00:00.000Z");
  });

  it("picks first ready candidate", () => {
    const candidate = pickNextCandidate(PROPERTIES, emptyLog(), new Date("2026-05-12T01:00:00.000Z"));
    expect(candidate?.property_id).toBe("TK001");
  });
});
