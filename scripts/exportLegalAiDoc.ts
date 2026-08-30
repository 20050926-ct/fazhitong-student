/**
 * 将固定话术导出为 Markdown，供 md_to_docx.py 转为 Word。
 * 运行：npm run export:legal-ai-word
 */
import { mkdirSync, writeFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { buildFixedQuestionsOnlyMarkdown } from '../src/data/legalAiFixedReplies';

const root = path.join(path.dirname(fileURLToPath(import.meta.url)), '..');
const outDir = path.join(root, 'temp');
mkdirSync(outDir, { recursive: true });
const mdPath = path.join(outDir, 'legal-ai-export.md');
writeFileSync(mdPath, buildFixedQuestionsOnlyMarkdown(), 'utf-8');
console.log('[exportLegalAiDoc] Wrote', mdPath);
