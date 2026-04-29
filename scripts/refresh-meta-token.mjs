#!/usr/bin/env node
/**
 * Refresh Meta Graph API long-lived token.
 *
 * 用法(本機 dry-run):
 *   node scripts/refresh-meta-token.mjs            # 預設 threads
 *   PLATFORM=instagram node scripts/refresh-meta-token.mjs
 *
 * 用法(GitHub Actions):
 *   env: THREADS_ACCESS_TOKEN=${{ secrets.THREADS_ACCESS_TOKEN }}
 *        GH_TOKEN=${{ secrets.GITHUB_TOKEN }}
 *
 * 退出碼:0 成功 / 1 失敗
 */
import { execSync } from "node:child_process";
import { readFileSync, existsSync } from "node:fs";
import { join, dirname } from "node:path";

const PLATFORM = process.env.PLATFORM || "threads";
const HOST =
  PLATFORM === "instagram" ? "graph.instagram.com" : "graph.threads.net";
const GRANT_TYPE =
  PLATFORM === "instagram" ? "ig_refresh_token" : "th_refresh_token";
const TOKEN_ENV =
  PLATFORM === "instagram" ? "IG_ACCESS_TOKEN" : "THREADS_ACCESS_TOKEN";

function findEnv() {
  let dir = process.cwd();
  while (true) {
    const f = join(dir, ".env");
    if (existsSync(f)) return f;
    const parent = dirname(dir);
    if (parent === dir) return null;
    dir = parent;
  }
}

function loadEnv() {
  if (process.env[TOKEN_ENV]) return;
  const f = findEnv();
  if (!f) throw new Error("找不到 .env");
  for (const line of readFileSync(f, "utf-8").split("\n")) {
    const m = line.match(/^([A-Z_]+)=(.*)$/);
    if (m && !process.env[m[1]]) process.env[m[1]] = m[2];
  }
}

async function refresh(token) {
  const url = `https://${HOST}/refresh_access_token?grant_type=${GRANT_TYPE}&access_token=${token}`;
  const res = await fetch(url);
  if (!res.ok) {
    const body = await res.text();
    throw new Error(`Refresh API 失敗 ${res.status}: ${body}`);
  }
  return res.json();
}

function writeBackToGitHubSecret(newToken) {
  if (!process.env.GH_TOKEN) {
    console.log("ℹ️  本機跑,跳過 GitHub secret 寫回(只有 GH Actions 環境才會寫)");
    return;
  }
  execSync(`gh secret set ${TOKEN_ENV} --body "${newToken}"`, {
    stdio: "inherit",
    env: { ...process.env, GH_TOKEN: process.env.GH_TOKEN },
  });
  console.log(`✓ Updated GitHub secret: ${TOKEN_ENV}`);
}

(async () => {
  loadEnv();
  const token = process.env[TOKEN_ENV];
  if (!token) {
    console.error(`❌ 沒有 ${TOKEN_ENV},先跑 exchange 拿 long token`);
    process.exit(1);
  }

  console.log(`✓ Refreshing ${PLATFORM} token...`);
  const out = await refresh(token);
  console.log(
    `✓ New token expires_in: ${out.expires_in}s (≈ ${Math.round(out.expires_in / 86400)} days)`,
  );

  writeBackToGitHubSecret(out.access_token);

  console.log("✓ Done");
})().catch((e) => {
  console.error("❌", e.message);
  process.exit(1);
});
