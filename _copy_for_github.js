const fs = require('fs');
const path = require('path');

const SRC = process.argv[2];
const DST = process.argv[3];

const EXCLUDE_DIRS = new Set(['node_modules', 'dist', 'temp', '.hbuilderx', 'runtime', '3D法庭资源(请单独上传至网盘)']);
const EXCLUDE_FILES = new Set(['.env', '.env.local', 'cloudflared.exe']);
const MAX_FILE_MB = 99;
const SKIP_DIR_NAMES = new Set(['court-3d']);

let copied = 0, skippedBig = 0, skippedSensitive = 0, bytes = 0;
const bigSkippedList = [];

function ensureDir(p) {
  if (!fs.existsSync(p)) fs.mkdirSync(p, { recursive: true });
}

function copyDir(src, dst) {
  const entries = fs.readdirSync(src, { withFileTypes: true });
  ensureDir(dst);
  for (const e of entries) {
    const s = path.join(src, e.name);
    const d = path.join(dst, e.name);
    if (e.isDirectory()) {
      if (EXCLUDE_DIRS.has(e.name)) continue;
      if (SKIP_DIR_NAMES.has(e.name)) {
        console.log('  SKIP [超大目录] ' + e.name);
        continue;
      }
      copyDir(s, d);
    } else {
      if (EXCLUDE_FILES.has(e.name)) {
        skippedSensitive++;
        console.log('  SKIP [敏感文件] ' + e.name);
        continue;
      }
      const st = fs.statSync(s);
      const mb = st.size / 1024 / 1024;
      if (mb > MAX_FILE_MB) {
        skippedBig++;
        bigSkippedList.push({ name: s, mb: mb.toFixed(2) });
        continue;
      }
      fs.copyFileSync(s, d);
      copied++;
      bytes += st.size;
    }
  }
}

if (fs.existsSync(DST)) {
  fs.rmSync(DST, { recursive: true, force: true, maxRetries: 3 });
}

console.log('开始复制...');
console.log('  源目录:', SRC);
console.log('  目标 :', DST);

copyDir(SRC, DST);
console.log('');
console.log('=== 复制完成 ===');
console.log('  复制文件数 :', copied);
console.log('  总大小     :', (bytes / 1024 / 1024).toFixed(1), 'MB');
console.log('  跳过大文件 :', skippedBig);
console.log('  跳过敏感   :', skippedSensitive);
if (bigSkippedList.length) {
  console.log('');
  console.log('跳过大文件列表（单独上传至网盘即可）:');
  bigSkippedList.forEach(b => console.log('  ', b.mb + ' MB', b.name));
}
