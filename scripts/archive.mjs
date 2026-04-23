// Archive current src/content.ts → src/videos-archive/<videoName>.ts
// 在切換影片主題前先跑這個,舊影片就會被保留下來,不會被覆蓋。
//
// 用法:
//   npm run archive                 # 自動讀 content.ts 的 videoName 當檔名
//   npm run archive -- custom-name  # 指定自訂檔名

import { existsSync, readFileSync, copyFileSync, mkdirSync } from "node:fs";
import { join } from "node:path";

const root = process.cwd();
const contentPath = join(root, "src", "content.ts");
const archiveDir = join(root, "src", "videos-archive");

if (!existsSync(contentPath)) {
  console.error("✗ src/content.ts 不存在,沒東西可以歸檔");
  process.exit(1);
}

const contentText = readFileSync(contentPath, "utf-8");
const videoNameMatch = contentText.match(/videoName:\s*["']([^"']+)["']/);

const customName = process.argv[2];
const archiveName = customName || videoNameMatch?.[1];

if (!archiveName) {
  console.error("✗ 讀不到 meta.videoName,也沒給自訂名稱");
  process.exit(1);
}

if (!existsSync(archiveDir)) {
  mkdirSync(archiveDir, { recursive: true });
}

const target = join(archiveDir, `${archiveName}.ts`);

if (existsSync(target)) {
  console.error(`✗ 已有 ${target} — 先改個名字或手動處理,避免覆蓋備份`);
  process.exit(1);
}

copyFileSync(contentPath, target);
console.log(`✓ 已歸檔: src/videos-archive/${archiveName}.ts`);
console.log(`  現在可以安心改寫 src/content.ts 了`);
