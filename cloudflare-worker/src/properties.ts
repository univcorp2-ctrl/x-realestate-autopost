import type { PropertyRow } from "./types";

export const PROPERTIES: PropertyRow[] = [
  {
    property_id: "TK001",
    status: "ready",
    area: "中野区",
    station: "中野駅",
    walk_min: "12",
    price_yen: "49800000",
    gross_yield: "7.20",
    property_type: "中古区分",
    summary: "駅徒歩圏・価格改定あり",
    url: "https://example.com/1",
    priority: "1",
    post_after: "2026-05-12 09:00"
  },
  {
    property_id: "TK002",
    status: "ready",
    area: "杉並区",
    station: "荻窪駅",
    walk_min: "10",
    price_yen: "43800000",
    gross_yield: "7.50",
    property_type: "中古区分",
    summary: "表面利回り高め・要管理費確認",
    url: "https://example.com/2",
    priority: "2",
    post_after: "2026-05-12 12:00"
  }
];
