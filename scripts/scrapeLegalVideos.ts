/**
 * 命令行：从允许域名内的列表页爬取视频链接并写入 data/scraped-videos.json
 * 用法：npm run scrape:legal-videos
 */
import dotenv from 'dotenv';

dotenv.config();
dotenv.config({ path: '.env.local', override: true });

import { crawlLegalVideosFromPages } from '../server/crawlDefaultLegalVideoPages';
import { createLegalSiteAxios } from '../server/legalHttp';

async function main() {
  const http = createLegalSiteAxios();
  const result = await crawlLegalVideosFromPages(http, undefined, 'CLI 爬取');
  console.log(JSON.stringify(result, null, 2));
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
