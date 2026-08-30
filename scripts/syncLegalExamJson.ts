import { mkdirSync, writeFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { LEGAL_EXAM_QUESTIONS_BANK } from '../src/data/legalExamQuestions';

const root = path.join(path.dirname(fileURLToPath(import.meta.url)), '..');
const publicDir = path.join(root, 'public', 'data');
const dataDir = path.join(root, 'data');

mkdirSync(publicDir, { recursive: true });
mkdirSync(dataDir, { recursive: true });

const json = JSON.stringify(LEGAL_EXAM_QUESTIONS_BANK, null, 2);
writeFileSync(path.join(publicDir, 'legal-exam-questions.json'), json, 'utf-8');
writeFileSync(path.join(dataDir, 'legal-exam-questions.json'), json, 'utf-8');

console.log(`Wrote ${LEGAL_EXAM_QUESTIONS_BANK.length} questions to public/data and data/`);
