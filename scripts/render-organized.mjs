import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { spawnSync } from 'child_process';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const projectRoot = path.join(__dirname, '..');

// 確保輸出目錄結構存在
const dirs = [
  'output/videos',
  'output/thumbnails/yt',
  'output/thumbnails/ig',
  'output/thumbnails/reel',
];

dirs.forEach(dir => {
  const fullPath = path.join(projectRoot, dir);
  if (!fs.existsSync(fullPath)) {
    fs.mkdirSync(fullPath, { recursive: true });
  }
});

// 取得 content file (第一個參數，預設 content.ts)
const contentFile = process.argv[2] || 'content.ts';
const contentPath = path.join(projectRoot, 'src', contentFile);

// 讀取 videoName
const contentText = fs.readFileSync(contentPath, 'utf-8');
const videoNameMatch = contentText.match(/videoName:\s*["']([^"']+)["']/);
if (!videoNameMatch || !videoNameMatch[1]) {
  console.error(`無法從 ${contentFile} 找到 videoName`);
  process.exit(1);
}

const videoName = videoNameMatch[1];
console.log(`\n🎬 開始渲染: ${videoName}\n`);

try {
  // 渲染影片
  console.log('📹 渲染影片...');
  const renderResult = spawnSync('bash', ['-c', `echo "\\n" | npx remotion render --composition "${videoName}" -o output/videos/${videoName}.mp4`], {
    cwd: projectRoot,
    stdio: 'inherit'
  });

  if (renderResult.status === 0) {
    console.log(`✅ 影片完成: output/videos/${videoName}.mp4\n`);
  } else {
    console.log(`⚠️ 影片渲染可能有問題\n`);
  }

  // 渲染縮圖
  const thumbFormats = [
    { id: 'ThumbnailYT', dir: 'yt', label: 'YouTube' },
    { id: 'ThumbnailIG', dir: 'ig', label: 'Instagram' },
    { id: 'ThumbnailReel', dir: 'reel', label: 'Reel' },
  ];

  for (const thumb of thumbFormats) {
    try {
      console.log(`🖼️  渲染 ${thumb.label} 縮圖...`);
      const stillResult = spawnSync('bash', ['-c', `echo "\\n" | npx remotion still --composition "${thumb.id}" -o output/thumbnails/${thumb.dir}/${videoName}.png`], {
        cwd: projectRoot,
        stdio: 'inherit'
      });

      if (stillResult.status === 0) {
        console.log(`✅ 縮圖完成: output/thumbnails/${thumb.dir}/${videoName}.png\n`);
      }
    } catch (e) {
      console.log(`⊘ 跳過 ${thumb.label}\n`);
    }
  }

  console.log(`🎉 ${videoName} 全部完成！\n`);
  process.exit(0);
} catch (error) {
  console.error('\n❌ 渲染失敗:', error.message);
  process.exit(1);
}
