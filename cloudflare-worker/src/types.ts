export type PropertyRow = {
  property_id: string;
  status: string;
  area: string;
  station: string;
  walk_min: string;
  price_yen: string;
  gross_yield: string;
  property_type: string;
  summary: string;
  url: string;
  priority: string;
  post_after: string;
};

export type PostedLog = {
  posted_ids: string[];
  posts: Array<{
    property_id: string;
    x_post_id?: string;
    posted_at: string;
    text: string;
    source: string;
  }>;
};

export type RunResult = {
  ok: boolean;
  mode: "preview" | "disabled" | "posted" | "no_candidate";
  source: string;
  property_id?: string;
  text?: string;
  chars?: number;
  x_post_id?: string;
  message?: string;
};
