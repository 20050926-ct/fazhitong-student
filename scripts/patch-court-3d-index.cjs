/**
 * Re-inject WebGL shell (orientation stub + preload hints) after Unity overwrites index.html.
 * Run: node scripts/patch-court-3d-index.cjs
 * After re-exporting WebGL, run `npm run patch:court-3d` so framework orientation fixes apply too.
 */
const fs = require('fs');
const path = require('path');

const marker = '<!-- court-web-performance -->';
const inject = `    ${marker}
    <script src="screen-orientation-stub.js"></script>
    <link rel="preload" href="Build/court-3d.loader.js" as="script" crossorigin>
    <link rel="preload" href="Build/court-3d.wasm.gz" as="fetch" type="application/wasm" crossorigin fetchpriority="high">
    <link rel="preload" href="Build/court-3d.framework.js.gz" as="script" crossorigin>
    <link rel="preload" href="Build/court-3d.data.gz" as="fetch" crossorigin>
`;

const indexPath = path.join(__dirname, '..', 'public', 'court-3d', 'index.html');
let html = fs.readFileSync(indexPath, 'utf8');

if (html.includes(marker)) {
  console.log('[patch-court-3d-index] Already patched.');
  process.exit(0);
}

html = html.replace(
  /\s*<script\s+src="screen-orientation-stub\.js"\s*>\s*<\/script>\s*<!--\s*court-orientation-stub\s*-->\s*\n?/gi,
  '\n',
);

const headOpen = html.indexOf('<head>');
if (headOpen === -1) {
  console.error('[patch-court-3d-index] No <head> found.');
  process.exit(1);
}

const insertAt = headOpen + '<head>'.length;
html = html.slice(0, insertAt) + '\n' + inject + html.slice(insertAt);

if (!html.includes('enableStreamingDownload')) {
  html = html.replace(
    /(productVersion:\s*("[^"]*"|'[^']*')\s*,)/,
    '$1\n        enableStreamingDownload: true,',
  );
}

fs.writeFileSync(indexPath, html, 'utf8');
console.log('[patch-court-3d-index] Patched', indexPath);
