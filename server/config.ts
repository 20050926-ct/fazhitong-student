export const PORT = Number(process.env.PORT) || 3000;

export const LEGAL_SCRAPE_LIST_URL =
  process.env.LEGAL_SCRAPE_LIST_URL ||
  "http://legalinfo.moj.gov.cn/index/zxxp/wsp/index.html";

export const LEGAL_SITE_ORIGIN =
  process.env.LEGAL_SITE_ORIGIN || "http://legalinfo.moj.gov.cn/";
