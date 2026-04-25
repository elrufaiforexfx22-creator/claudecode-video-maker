/**
 * scripts/publish-threads.mjs
 *
 * 用 Threads Publishing API 原生上傳影片到脆。
 *
 * 注意:Threads API 不接受 binary 直接上傳,要把 mp4 host 在公開 HTTPS URL,
 * Meta server 才會自己去抓。常見:Cloudflare R2 / S3 / Zeabur 靜態站 / GitHub Releases。
 *
 * 用法:
 *   npm run publish:threads -- --url <mp4-public-url> [--caption "貼文文字"]
 *   或
 *   node scripts/publish-threads.mjs --url <url> --caption "..."
 *
 * 環境變數(.env,從 cwd 往上找):
 *   THREADS_ACCESS_TOKEN  Long-lived 60 天 token,參考 docs.threads.com OAuth 流程
 *
 * Threads API 三段式流程:
 *   1. POST /me/threads (media_type=VIDEO, video_url=...) → 拿 creation_id
 *   2. 輪詢 GET /{creation_id}?fields=status 等到 status=FINISHED
 *      (影片大概 30s~3min,取決於檔案大小 + Meta 隊列)
 *   3. POST /me/threads_publish (creation_id=...) → 拿 thread id
 */
import fs from "fs";
import path from "path";

// .env walk-up,跟 voiceover script 同樣行為(讓 worktree 共用 main 的 .env)
function findEnvFile() {
  let dir = process.cwd();
  while (true) {
    const candidate = path.join(dir, ".env");
    if (fs.existsSync(candidate)) return candidate;
    const parent = path.dirname(dir);
    if (parent === dir) return null;
    dir = parent;
  }
}
function loadEnv() {
  const envPath = findEnvFile();
  if (!envPath) return;
  const text = fs.readFileSync(envPath, "utf-8");
  for (const line of text.split("\n")) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;
    const eq = trimmed.indexOf("=");
    if (eq === -1) continue;
    const key = trimmed.slice(0, eq).trim();
    const value = trimmed.slice(eq + 1).trim();
    if (!(key in process.env)) process.env[key] = value;
  }
}
loadEnv();

const TOKEN = process.env.THREADS_ACCESS_TOKEN;
if (!TOKEN) {
  console.error("❌ Missing THREADS_ACCESS_TOKEN in .env");
  process.exit(1);
}

// CLI args 解析(--key value 形式)
const args = process.argv.slice(2);
const opts = {};
for (let i = 0; i < args.length; i++) {
  if (args[i].startsWith("--")) {
    opts[args[i].slice(2)] = args[i + 1];
    i++;
  }
}
const VIDEO_URL = opts.url;
const CAPTION = opts.caption ?? "";

if (!VIDEO_URL) {
  console.error("用法:node scripts/publish-threads.mjs --url <mp4-url> [--caption \"...\"]");
  console.error("例:--url https://your-zeabur-app.zeabur.app/tutorial-ch2.mp4");
  process.exit(1);
}
if (!/^https:\/\//.test(VIDEO_URL)) {
  console.error("❌ video URL 必須是 HTTPS(Meta server 不會抓 http)");
  process.exit(1);
}

const BASE = "https://graph.threads.net/v1.0";
const USER = "me";

async function api(method, pathSeg, params = {}, body = null) {
  const url = new URL(`${BASE}/${pathSeg}`);
  url.searchParams.set("access_token", TOKEN);
  for (const [k, v] of Object.entries(params)) {
    url.searchParams.set(k, v);
  }
  const init = { method };
  if (body) {
    init.headers = { "Content-Type": "application/json" };
    init.body = JSON.stringify(body);
  }
  const resp = await fetch(url, init);
  const text = await resp.text();
  if (!resp.ok) {
    throw new Error(
      `Threads API ${method} ${pathSeg} → ${resp.status}\n${text}`,
    );
  }
  return JSON.parse(text);
}

async function main() {
  console.log("📤 Threads 發佈");
  console.log(`   video: ${VIDEO_URL}`);
  if (CAPTION) console.log(`   caption: ${CAPTION}`);

  // 1. 建立 container
  console.log("\n1. 建立 video container...");
  const createParams = { media_type: "VIDEO", video_url: VIDEO_URL };
  if (CAPTION) createParams.text = CAPTION;
  const created = await api("POST", `${USER}/threads`, createParams);
  const creationId = created.id;
  console.log(`   ✓ creation_id = ${creationId}`);

  // 2. 等 Meta 處理 video(只有影片需要,圖片不用)
  console.log("\n2. 等 Meta 處理影片...");
  const maxAttempts = 60; // 60 × 5s = 5min 上限
  for (let i = 0; i < maxAttempts; i++) {
    await new Promise((r) => setTimeout(r, 5000));
    const s = await api("GET", creationId, {
      fields: "status,error_message",
    });
    process.stdout.write(
      `   [${i + 1}/${maxAttempts}] status=${s.status}${s.error_message ? ` (${s.error_message})` : ""}        \r`,
    );
    if (s.status === "FINISHED") {
      console.log("\n   ✓ 處理完成");
      break;
    }
    if (s.status === "ERROR" || s.status === "EXPIRED") {
      throw new Error(
        `Container ${s.status}: ${s.error_message ?? "(no detail)"}`,
      );
    }
    if (i === maxAttempts - 1) {
      throw new Error("等超過 5 分鐘,Meta 還沒處理完。container 可能要再等等再 publish。");
    }
  }

  // 3. publish
  console.log("\n3. 正式發佈...");
  const published = await api("POST", `${USER}/threads_publish`, {
    creation_id: creationId,
  });
  console.log(`   ✓ thread id = ${published.id}`);

  // 試著抓 permalink
  try {
    const detail = await api("GET", published.id, {
      fields: "permalink,timestamp",
    });
    console.log(`\n🎉 發佈成功!`);
    console.log(`   ${detail.permalink ?? `https://www.threads.net (找你最新的 post,id=${published.id})`}`);
  } catch {
    console.log(`\n🎉 發佈成功,thread id = ${published.id}`);
    console.log("   進 https://www.threads.net 看你最新的 post");
  }
}

main().catch((err) => {
  console.error("\n❌", err.message);
  process.exit(1);
});
