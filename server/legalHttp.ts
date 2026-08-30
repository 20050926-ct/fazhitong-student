import axios, { type AxiosInstance } from "axios";
import { assertAllowedExternalUrl } from "./externalUrlAllowlist";

const DEFAULT_UA =
  "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36";

export function createLegalSiteAxios(): AxiosInstance {
  return axios.create({
    timeout: 20_000,
    headers: { "User-Agent": DEFAULT_UA },
    maxRedirects: 5,
    validateStatus: (s) => s >= 200 && s < 400,
  });
}

/** 文章正文代理等：与自定义爬取共用域名白名单 */
export function assertLegalArticleUrl(raw: string): URL {
  return assertAllowedExternalUrl(raw);
}

/**
 * 法治网 HTTPS 证书曾出现过期，浏览器仍可能访问；Node 抓取会失败。
 * 对 *.legaldaily.com.cn 统一改用 http 拉取正文。
 */
export function normalizeArticleFetchUrl(url: URL): URL {
  const u = new URL(url.href);
  const h = u.hostname.toLowerCase();
  if (h === "legaldaily.com.cn" || h.endsWith(".legaldaily.com.cn")) {
    if (u.protocol === "https:") u.protocol = "http:";
  }
  return u;
}
