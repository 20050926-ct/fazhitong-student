/**
 * 控制服务端可请求的外部域名（防 SSRF），用于文章代理、自定义爬取等。
 *
 * - 默认：常见法务站点 + 任意 `*.gov.cn` / `*.org.cn` / `*.edu.cn`
 * - 严格：设置环境变量 `LEGAL_SCRAPE_STRICT=true` 时，仅允许内置列表 + `LEGAL_SCRAPE_EXTRA_HOSTS`
 * - 额外域名：`LEGAL_SCRAPE_EXTRA_HOSTS=foo.com,bar.org`（逗号分隔）
 */

function normHost(h: string): string {
  return h.trim().toLowerCase().replace(/^www\./, "");
}

function parseExtraHosts(): Set<string> {
  const raw = process.env.LEGAL_SCRAPE_EXTRA_HOSTS || "";
  const set = new Set<string>();
  for (const p of raw.split(/[,;\s]+/)) {
    const t = normHost(p);
    if (t) set.add(t);
  }
  return set;
}

const BUILTIN_HOSTS = new Set(
  [
    "legalinfo.moj.gov.cn",
    "moj.gov.cn",
    "court.gov.cn",
    "chinacourt.org",
    "npc.gov.cn",
    "acla.org.cn",
    "legaldaily.com.cn",
    "people.com.cn",
    "xinhuanet.com",
    "news.cn",
    "cctv.com",
    "china.com.cn",
  ].map(normHost)
);

function isStrict(): boolean {
  return process.env.LEGAL_SCRAPE_STRICT === "true";
}

function isCnInstitutionalHost(host: string): boolean {
  return /\.(gov|org|edu)\.cn$/i.test(host);
}

function matchesHostSet(host: string, set: Set<string>): boolean {
  const n = normHost(host);
  if (set.has(n)) return true;
  for (const allowed of set) {
    if (n.endsWith(`.${allowed}`)) return true;
  }
  return false;
}

export function assertAllowedExternalUrl(raw: string): URL {
  const trimmed = raw?.trim();
  if (!trimmed) {
    throw new Error("URL 不能为空");
  }
  let u: URL;
  try {
    u = new URL(trimmed);
  } catch {
    throw new Error("无效的 URL");
  }
  if (u.protocol !== "http:" && u.protocol !== "https:") {
    throw new Error("仅支持 http(s) 协议");
  }
  const host = u.hostname.toLowerCase();
  const base = normHost(host);

  if (matchesHostSet(base, BUILTIN_HOSTS) || matchesHostSet(host, BUILTIN_HOSTS)) {
    return u;
  }

  const extras = parseExtraHosts();
  if (matchesHostSet(base, extras) || matchesHostSet(host, extras)) {
    return u;
  }

  if (!isStrict() && isCnInstitutionalHost(host)) {
    return u;
  }

  throw new Error(
    `域名未在允许范围：${host}。可将站点加入环境变量 LEGAL_SCRAPE_EXTRA_HOSTS，或确保为 .gov.cn / .org.cn / .edu.cn（若已设 LEGAL_SCRAPE_STRICT=true 则仅允许内置+EXTRA 列表）。`
  );
}
