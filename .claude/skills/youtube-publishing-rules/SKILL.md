---
name: youtube-publishing-rules
description: YouTube Data API v3 發片完整規則 — description 不能含 < > 字元(`>>` `&&` 會被退稿)、Shorts 自動歸類條件、quota 1600/upload、refresh_token 7 天過期沒辦法 cron 自動 refresh、視覺與標題長度限制。任何要寫 YT 自動發片或改 metadata 的 AI 應該先讀。
---

# YouTube Publishing — Data API v3 完整規則

## 1. ⚠️ Description 字元黑名單(最容易踩)

YT API 會 reject 含特定 ASCII 字元的 description,回傳 `invalidDescription`:
- **`<`** 跟 **`>`**(出於 XSS 防護,connector 字元)
- 影響範圍:不能直接貼 shell 指令裡的 `>>`(redirect)、`<file>`(stdin)、HTML-like syntax

### 解法
- 影片用到的 shell 指令 **不要直接貼 description**,改成「指令到 GitHub README 複製」
- 或用 Unicode 替代字元(`≫` U+226B 看起來像 `>>` 但合法)
- 或用敘述式:「把 export 那行 append 到 ~/.zshrc 並 source 一次」

### 其他字元限制
- 長度上限 **5000 字元**(含換行)
- emoji / Unicode box drawing(`──`)/ 中文標點都 OK
- URL 自動 hyperlink(IG 不會,YT 會)

## 2. Title / Tags 規格

| 欄位 | 上限 | 備註 |
|---|---|---|
| Title | 100 字元 | 過長 API 退稿 |
| Description | 5000 字元 | 見上 |
| Tags(個別) | 30 字元 | API 不擋,但 YT UI 會截 |
| Tags(總長度) | 500 字元(所有 tag 加逗號) | 超過 API 退稿 |

## 3. Shorts 自動歸類

YT **沒有 `isShort` API flag**。Shorts 是自動判定:

**符合三條件 → 自動進 Shorts feed:**
1. **垂直比 9:16**(1080×1920 之類,正方形也勉強算)
2. **長度 ≤ 3 分鐘**(2024 起放寬,以前 60s)
3. (推薦,但非必要)title / description 含 `#Shorts`

實作上**直接用 `videos.insert` 上傳垂直短 mp4 就好**,跟一般 video API 路徑完全相同。可加 `--shorts` flag 自動把 `#Shorts` 塞 description 開頭(YT 演算法看 description 前 100 字)。

## 4. Token 生命週期(踩坑警告)

### Testing mode 下 refresh_token 7 天死
- `youtube.upload` scope 是 **restricted scope**,Testing mode 下 refresh_token 只活 7 天
- ⚠️ **用 refresh_token 換 access_token 不會延長 refresh_token 自身的 7 天倒數** — cron 自動 refresh **沒用**
- 拿新 refresh_token 必須重做整套 OAuth(瀏覽器人工同意),不可 headless

### 實務最佳解
- 接受每週手動跑一次 `node scripts/youtube-oauth.mjs`(30 秒)
- 永久不死 → Google verification(送審 4-6 週)或 Workspace + Internal app type

## 5. Quota

- 預設 **每天 10,000 點**
- `videos.insert`(上傳新影片):**1,600 點/支** → 一天最多 6 支
- `videos.update`(改 metadata):50 點/次
- `thumbnails.set`:50 點/次
- 超過要去 Cloud Console 申請 quota(要寫使用情境)

**改 metadata 不算重發** — title / description / tags / category / 縮圖都可透過 `videos.update` + `thumbnails.set` 更新,**只有影片 binary 不能換**(要刪重發)。

## 6. 視覺規格

- 縮圖:JPG / PNG,< 2MB,1280×720 16:9
- 影片:mp4,< 256GB,< 12 小時(個人發片不會碰到上限)
- categoryId 常用:
  - `28` = Science & Technology(本專案 default)
  - `27` = Education
  - `22` = People & Blogs

## 7. API / 腳本邊界

實作走 `scripts/publish-youtube.mjs`(已存在)。**跟 IG/Threads 不同 — YT 直接 binary 上傳,不用先 host**。

### Visibility 預設 private 安全

`--visibility` 不帶就是 private,確認 metadata 都對才改 public。改 visibility 用 `videos.update` 50 quota 點,很便宜。

### 三段操作(本專案 publish-youtube.mjs 的流程)

1. `refresh_token → access_token`(換一小時臨時 token)
2. `POST videos.insert?uploadType=multipart&part=snippet,status`(JSON metadata + 影片 binary)
3. (選填)`POST thumbnails.set` 上自訂縮圖

## 8. 失敗處理

| 錯誤 | 解法 |
|---|---|
| `invalidDescription` | 找 `<` `>` 字元 / 超 5000 字 / 內容違規(政治 / 暴力 / 兒少不宜),最常見 `>>` `<` 在貼 shell 指令時 |
| `invalid_grant` 換 access_token 時 | refresh_token 過期 → 重跑 `youtube-oauth.mjs` |
| `accessNotConfigured` | YouTube Data API v3 沒在 Google Cloud project 啟用 → 去 Cloud Console enable |
| `quotaExceeded` | 今天 quota 用完(發 6 支或大量 update),等 24h 或申請增加 |
| `selfDeclaredMadeForKids` 必填 | metadata 一定要含 `status.selfDeclaredMadeForKids: false`(本專案已固定 false) |

## 9. 跟其他平台共版時

- YT description **可以放完整連結**(IG 不行、脆有字數限制)→ 把 GitHub repo / 圖文教學 / 影片提到的指令(避開 `>>`)都塞 description
- YT title 用 ASCII `|` 沒問題(脆要 `｜`)
- **YT 不用 hashtag 區塊**(IG 規則),tags 走 metadata 欄位即可
