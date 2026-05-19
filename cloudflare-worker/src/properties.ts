import type { PropertyRow } from "./types";

// 出典: Apartment_Investment_Master.xlsx (2026-05-19更新)
// 対象: 表面利回り9%以上の新築アパート用地 (東京都内)
// price_yen = 総事業費(円), gross_yield = 表面利回り(購入時)
export const PROPERTIES: PropertyRow[] = [
  {
    property_id: "ITABASHI-NERIMA-20260519",
    status: "ready",
    area: "板橋区",
    station: "東武東上線・東武練馬",
    walk_min: "10",
    price_yen: "90836823",
    gross_yield: "11.1",
    property_type: "新築アパート用地",
    summary: "土地2,680万・9戸想定・家賃9万/戸",
    url: "https://suumo.jp/tochi/tokyo/sc_itabashi/nc_20440835/",
    priority: "1",
    post_after: "2026-05-19 09:00"
  },
  {
    property_id: "ITABASHI-TOKIWADAI-20260519",
    status: "ready",
    area: "板橋区",
    station: "東武東上線・ときわ台",
    walk_min: "10",
    price_yen: "79293670",
    gross_yield: "10.2",
    property_type: "新築アパート用地",
    summary: "土地3,100万・6戸・1戸賃料10.9万",
    url: "https://www.athome.co.jp/tochi/1110031118/",
    priority: "2",
    post_after: "2026-05-20 09:00"
  },
  {
    property_id: "SUMIDA-YAHIRO-20260519",
    status: "ready",
    area: "墨田区",
    station: "京成押上線・八広",
    walk_min: "8",
    price_yen: "58270750",
    gross_yield: "10.0",
    property_type: "新築アパート用地",
    summary: "土地3,800万・6戸・容積率500%",
    url: "https://www.athome.co.jp/tochi/6989205752/",
    priority: "3",
    post_after: "2026-05-21 09:00"
  },
  {
    property_id: "TACHIKAWA-SUNAGAWA-20260519",
    status: "ready",
    area: "立川市",
    station: "西武拝島線・武蔵砂川",
    walk_min: "8",
    price_yen: "55353126",
    gross_yield: "9.8",
    property_type: "新築アパート用地",
    summary: "土地2,330万・15戸・157㎡広い敷地",
    url: "https://picks-agent.terass.com/search/land/reins/100138384048",
    priority: "4",
    post_after: "2026-05-22 09:00"
  },
  {
    property_id: "OTA-UMEYASHIKI-20260519",
    status: "ready",
    area: "大田区",
    station: "京急本線・梅屋敷",
    walk_min: "7",
    price_yen: "54818251",
    gross_yield: "9.8",
    property_type: "新築アパート用地",
    summary: "土地2,880万・9戸・蒲田近接・家賃9.8万",
    url: "https://suumo.jp/tochi/tokyo/sc_ota/nc_78219179/",
    priority: "5",
    post_after: "2026-05-23 09:00"
  },
  {
    property_id: "FUCHU-TAMAREIEN-20260519",
    status: "ready",
    area: "府中市",
    station: "京王線・多磨霊園",
    walk_min: "5",
    price_yen: "76163751",
    gross_yield: "9.0",
    property_type: "新築アパート用地",
    summary: "土地3,980万・15戸・191㎡・駅5分圏",
    url: "https://picks-agent.terass.com/search/land/reins/100136943166",
    priority: "6",
    post_after: "2026-05-24 09:00"
  },
];
