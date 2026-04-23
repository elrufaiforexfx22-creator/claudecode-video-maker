import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

// 檢查是否提供了 content 檔案名稱參數
const contentFile = process.argv[2] || 'content.ts';
const contentPath = path.join(__dirname, '../src', contentFile);

// 讀取 content 檔案並用正則表達式抽出 videoName
const content = fs.readFileSync(contentPath, 'utf-8');
const match = content.match(/videoName:\s*["']([^"']+)["']/);

if (match && match[1]) {
  console.log(match[1]);
} else {
  console.error(`無法從 ${contentFile} 找到 videoName`);
  process.exit(1);
}
