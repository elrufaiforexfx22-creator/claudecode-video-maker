/**
 * scripts/render-tutorial.mjs
 *
 * 渲染 tutorial 影片(`videoName` 從 src/tutorial/config.ts 讀)+ 3 張縮圖。
 * 對應 render-organized.mjs(短片管線)。
 *
 * 用法:
 *   npm run render:tutorial
 *   或在 worktree 裡:node scripts/render-tutorial.mjs
 *
 * 輸出:
 *   output/<videoName>.mp4
 *   output/<videoName>-yt.png
 *   output/<videoName>-ig.png
 *   output/<videoName>-reel.png
 */
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import { spawnSync } from "child_process";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const projectRoot = path.join(__dirname, "..");

const outputDir = path.join(projectRoot, "output");
if (!fs.existsSync(outputDir)) {
  fs.mkdirSync(outputDir, { recursive: true });
}

// 從 src/tutorial/config.ts 讀 videoName
const configPath = path.join(projectRoot, "src", "tutorial", "config.ts");
if (!fs.existsSync(configPath)) {
  console.error("找不到 src/tutorial/config.ts。先 npm install 跑 postinstall。");
  process.exit(1);
}
const configText = fs.readFileSync(configPath, "utf-8");
const m = configText.match(/videoName:\s*["']([^"']+)["']/);
if (!m || !m[1]) {
  console.error("無法從 src/tutorial/config.ts 抓到 videoName");
  process.exit(1);
}
const videoName = m[1];

console.log(`\n🎬 開始渲染 tutorial: ${videoName}\n`);

function runRemotion(subcommand, compositionId, outputPath) {
  return spawnSync(
    "npx",
    ["remotion", subcommand, compositionId, outputPath],
    { cwd: projectRoot, stdio: "inherit" },
  );
}

// 1. 影片
console.log("📹 渲染影片...");
const videoOut = `output/${videoName}.mp4`;
const renderResult = runRemotion("render", videoName, videoOut);
if (renderResult.status !== 0) {
  console.error(`❌ 影片渲染失敗 (exit ${renderResult.status})`);
  process.exit(1);
}
console.log(`✅ ${videoOut}\n`);

// 2. 縮圖 3 張(composition id 對應 src/Root.tsx 的 Still 註冊)
const thumbs = [
  { compSuffix: "ThumbnailYT", fileSuffix: "yt", label: "YouTube" },
  { compSuffix: "ThumbnailIG", fileSuffix: "ig", label: "Instagram" },
  { compSuffix: "ThumbnailReel", fileSuffix: "reel", label: "Reel" },
];
for (const t of thumbs) {
  const compId = `${videoName}-${t.compSuffix}`;
  const out = `output/${videoName}-${t.fileSuffix}.png`;
  console.log(`🖼  ${t.label} 縮圖...`);
  const r = runRemotion("still", compId, out);
  if (r.status !== 0) {
    console.error(`⚠️ ${t.label} 縮圖失敗 (exit ${r.status})`);
  } else {
    console.log(`✅ ${out}`);
  }
}

console.log("\n🎉 全部完成。");
