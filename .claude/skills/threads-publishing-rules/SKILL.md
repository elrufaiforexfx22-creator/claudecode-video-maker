---
name: threads-publishing-rules
description: Threads (Meta) Publishing API 的關鍵限制與已知踩坑 — token 生命週期、影片 / 圖片 host 要求、mp4 編碼規格(color range / pix_fmt)、ERROR=UNKNOWN 排查流程、字數與速率限制。任何要寫 Threads 自動發佈腳本的 AI 在動工前應該先讀一遍,可以省 4 小時 debug。
---

# Threads Publishing API 完整限制與排查指南

這份是基於實戰一整天的踩坑紀錄。所有「已知不通」「已知通」都有實測。

---

## 1. Token

### Scopes
發佈 post 需要兩個 scope:
- `threads_basic` — 讀自己資料(/me)
- `threads_content_publish` — 發 post(text / image / video / carousel)

### 生命週期(三段)

| 類型 | 取得方式 | 有效期 | 用途 |
|---|---|---|---|
| Short-lived | OAuth 流程結束直接給,或 Graph API Explorer 「Get User Access Token」 | **1 小時** | 馬上拿來換 long-lived,**不要直接拿來發 post** |
| Long-lived | `GET https://graph.threads.net/access_token?grant_type=th_exchange_token&client_secret=<APP_SECRET>&access_token=<SHORT>` | **60 天** | 實際用來發 post 的 |
| Refreshed long-lived | `GET https://graph.threads.net/refresh_access_token?grant_type=th_refresh_token&access_token=<LONG>` | 再 60 天 | 排程 cron 每 ~50 天跑一次,token 永不過期 |

### Token 失效的訊號
```json
{"error":{"message":"Failed to decode","type":"OAuthException","code":190,"fbtrace_id":"..."}}
```
意思:token 過期 / 格式錯 / 屬於別的 app。重新走 OAuth 流程拿新的 short-lived → exchange long-lived。

---

## 2. 三段式發佈流程

### Video / Image
```
1. POST /v1.0/me/threads
   ├─ media_type=VIDEO 或 IMAGE
   ├─ video_url=<HTTPS_URL> 或 image_url=<HTTPS_URL>
   ├─ text=<可選 caption>
   └─ access_token=<LONG_LIVED>
   → 拿 creation_id

2. GET /v1.0/{creation_id}?fields=status,error_message
   ├─ status: IN_PROGRESS / FINISHED / ERROR / EXPIRED / PUBLISHED
   ├─ Video 通常 30 秒 ~ 3 分鐘
   ├─ Image 通常 < 5 秒
   └─ 輪詢直到 FINISHED

3. POST /v1.0/me/threads_publish
   ├─ creation_id=<上面拿到的>
   └─ access_token=<LONG_LIVED>
   → 拿 thread id,可選 GET 拿 permalink
```

### Text-only
跳過 step 2(沒 processing 階段),create container 後直接 publish。

---

## 3. 字數限制

- **單 post 上限 500 字元**(中文 1 字 = 1 字元,emoji 看版本可能算 2)
- 超過 API 直接 reject:
  ```json
  {"error":{"message":"Param text must be at most 500 characters long.","code":100}}
  ```
- 要發長內容:用 reply chain(多個 post 串起來)

---

## 4. URL 要求(Video / Image)

媒體 URL 必須:
- ✅ **HTTPS**(http 直接拒)
- ✅ **公開可下載**(無 OAuth / cookie / referer 要求)
- ✅ Meta server 從 datacenter 抓得到
- ✅ Image 建議副檔名明確(`.jpg` / `.png`),**沒副檔名常被 reject**
- ✅ Video URL 結尾 `.mp4` 是慣例(不是硬性,但通)
- ⚠️ **不要有多層 redirect**(尤其是 redirect 到簽名 URL 帶過期時間的)

### 已知不通的 host(實測)

| Host | 失敗模式 | 推測原因 |
|---|---|---|
| **GitHub Releases** download URL | container 建成功,processing 階段 ERROR=UNKNOWN | 302 → Azure Blob 簽名 URL,Content-Disposition: attachment + Content-Type: application/octet-stream |
| **catbox.moe** | 同上 | Cloudflare workers serve,Meta 可能擋這類 anonymous file host |
| **Google Cloud Storage** 公開 URL | 同上 | 推測類似政策 |
| **Cloudflare R2 預設 `r2.dev` 子網域** | 同上 | Cloudflare 自己警告 r2.dev 是 dev / 速率限制,不適合 production fetch |
| **picsum.photos** | 立即拒 `error_subcode 2207052: 影音素材 URI 不符合我們的規定` | 重定向到隨機檔案,URL 結構非標準 |
| **0x0.st** | 服務本身關閉上傳(2026 起) | — |

### 已知通的 host(實測)

| Host | 確認方式 |
|---|---|
| **Cloudinary**(`res.cloudinary.com/...`) | 用他們的 demo `dog.mp4` 範例 URL,processing FINISHED |
| **Cloudflare R2 + 自訂網域** | R2 bucket 連到自己 Cloudflare 上的網域(如 `cdn.example.com`),走正規 CDN 而不是 r2.dev |

通常 S3 + CloudFront、Vercel public、其他正規 video CDN 也通,但**沒實測別輕信**。

### 修法:把 r2.dev 換成自訂網域
1. R2 bucket → Settings → Custom Domains → Connect Domain
2. 選你 Cloudflare 名下的子網域(如 `videos.example.com`)
3. Cloudflare 自動建 DNS CNAME + SSL,30 秒 ~ 5 分鐘 Active
4. URL 變 `https://videos.example.com/file.mp4`

---

## 5. Video mp4 規格(走 API 必須)

> ⚠️ **重要**:Web UI 手動上傳時 Threads 會做轉碼相容,不挑剔。**API 走 video_url 流程則嚴格**。手動拖傳沒事的 mp4,API 還是可能被拒。

| 屬性 | 必須值 | 備註 |
|---|---|---|
| Container | `mp4` | 不要 mov / webm |
| Video codec | **H.264** | 不要 H.265 / VP9 |
| H.264 profile | High / Main / Baseline 都可 | 實測 profile=100 (High) 通 |
| **`pix_fmt`** | **`yuv420p`** | ❌ **不要 `yuvj420p`**(deprecated,代表 full range) |
| **`color_range`** | **`tv`**(限制範圍 16~235) | ❌ **不要 `pc`**(全範圍 0~255)|
| Audio codec | AAC | |
| Audio sample rate | 48 kHz | |
| Frame rate | 24 ~ 60 fps | |
| Duration | 5 秒 ~ 5 分鐘 | |
| File size | < 1 GB | |
| Resolution | 720p+(常見 1080p / 720p) | 16:9 landscape 通,9:16 portrait 通 |
| Bitrate | 通常 ≥ 500 kbps 為佳 | 過低有時被當損毀,但**也常常 transient** |

### 致命陷阱:Color range

**Remotion(以及多數 screen recorder / OBS / 桌面錄影軟體)預設輸出 `color_range=pc / pix_fmt=yuvj420p`(電腦螢幕全範圍色域)**。 

Meta 的 video processing pipeline 只吃 **TV 限制範圍**(廣電影視標準)。給它 PC range 的 mp4 → ERROR=UNKNOWN,而且不告訴你原因。

### Color range 轉換 ffmpeg 指令

```bash
ffmpeg -i input.mp4 \
  -vf "scale=in_range=full:out_range=tv,format=yuv420p" \
  -c:v libx264 -profile:v high -pix_fmt yuv420p -color_range tv \
  -preset medium -crf 23 \
  -c:a aac -b:a 128k -ar 48000 \
  -movflags +faststart \
  output.mp4
```

關鍵 flag 解釋:
- `-vf "scale=in_range=full:out_range=tv,format=yuv420p"` — 把 pixel value 從 0~255 scale 到 16~235,並強制標準 yuv420p
- `-color_range tv` — 寫進 mp4 metadata flag(讓播放器知道用 TV range 解碼)
- `-movflags +faststart` — 把 moov atom 移到檔頭,Meta 抓檔比較快開始 streaming

### 用 ffprobe 驗證
```bash
ffprobe -v error -select_streams v:0 \
  -show_entries stream=codec_name,profile,pix_fmt,color_range \
  -of default=noprint_wrappers=0 file.mp4
```

期望輸出:
```
codec_name=h264
profile=100  (或 77 / 66)
pix_fmt=yuv420p     ← 不要 yuvj420p
color_range=tv      ← 不要 pc
```

---

## 6. ERROR=UNKNOWN 排查流程

最痛的錯誤。Meta 不告訴你細節,只給 `error_message: "UNKNOWN"`。

按這個順序排除:

### Step 1:確認 token 與權限
試發純文字:
```bash
curl -X POST "https://graph.threads.net/v1.0/me/threads" \
  --data-urlencode "media_type=TEXT" \
  --data-urlencode "text=test" \
  --data-urlencode "access_token=$TOKEN"
# 然後 publish
```
- 通 → token、scope、app 都 OK,**問題在媒體**
- 不通 → token / scope / app 問題,先解決這層

### Step 2:確認 video API 對你 app 開放
用 Cloudinary 的 demo URL(已驗證可通):
```bash
curl -X POST "https://graph.threads.net/v1.0/me/threads" \
  --data-urlencode "media_type=VIDEO" \
  --data-urlencode "video_url=https://res.cloudinary.com/demo/video/upload/dog.mp4" \
  --data-urlencode "access_token=$TOKEN"
# 輪詢 status 直到 FINISHED
```
- FINISHED → video API 通,**問題在你的 host 或你的 mp4**
- ERROR → app 沒 video publishing 權限,去 Meta App Dashboard 確認

### Step 3:替換 host
把同一支 mp4 放到 Cloudinary 上(免費註冊就有):
- Cloudinary 通 → **你的 host 被擋**,改用 R2 + 自訂網域 / Cloudinary / 其他正規 CDN
- Cloudinary 也 ERROR → **mp4 規格有問題**,進 Step 4

### Step 4:檢查 mp4 規格
ffprobe 看 `pix_fmt` 與 `color_range`。99% 是 PC range / yuvj420p,跑上面的 ffmpeg 轉換指令。

### Step 5:重試
有時候是 **transient**。同一個 URL + container 第二次跑會通。腳本應該對 ERROR 自動重試一次(間隔 30 秒以上)。

---

## 7. 完整錯誤對照

| Error message | code | 解讀 | 解決方式 |
|---|---|---|---|
| `Failed to decode` | 190 | Token 過期 / 格式錯 / 屬於別的 app | 重新 OAuth + exchange long-lived |
| `Param text must be at most 500 characters long` | 100 | 字數超 500 | 修剪或分多 post |
| `An unknown error occurred` 帶 `error_subcode: 2207052` | 1 | 媒體 URL 不符規則(常為 redirect / 沒副檔名 / 隨機 hash 路徑) | 換正規 CDN host |
| Container `status=ERROR error_message=UNKNOWN` | — | Meta 不講細節。99% 為 host 問題或 mp4 color range | 跑上面 Step 1~5 |
| `Voice 'X' is not fine-tuned and cannot be used` | — | 這是 ElevenLabs 的錯,不是 Threads。voice ID 還在訓練 | 等 PVC 訓練完,或確認複製到正確 voice ID |

---

## 8. Transient 行為

Meta video pipeline 有時候會**假 ERROR**:
- 同一 URL + container,3 分鐘後重新建一個 container 重試會 FINISHED
- 內容 / 規格沒任何改變

→ 自動發佈腳本應該:
- 第一次 ERROR 不要當真失敗
- 等 30~60 秒
- 重新 create container(不是同一 ID 再 query — 那會永遠 ERROR)
- 第二次 ERROR 才當真,印 log 退出讓人介入

---

## 9. 速率與配額

(Meta 沒公開明確數字,以下為觀察值)

- **App 級別 API rate limit**:每小時 ~200 calls(包含 create + status query + publish)
- **個人帳號發文上限**:約 250 posts / day(Meta 沒明說,觀察值)
- **影片 processing**:不算 API quota,但同時開太多 container Meta 會 throttle

設計腳本時:
- ❌ 不要無限 retry loop(會吃光 quota)
- ❌ 不要 < 5 秒輪詢一次 status
- ✅ 輪詢間隔 5~10 秒
- ✅ 輪詢上限 60 次(等於 5~10 分鐘)
- ✅ 失敗自動重試上限 1 次

---

## 10. Webhook(可選,進階)

不想輪詢 status 的話,可註冊 Threads webhook,container ready 時 Meta push 通知:
- Meta App Dashboard → Webhooks → Threads → Subscribe to `media` events
- 需要公開 HTTPS endpoint 接收 callback
- 適合 production 大量發佈

對個人 / 中小規模發佈,**輪詢就夠了**(實作簡單、debug 容易)。

---

## 11. 建議的 publish 腳本架構

```
1. 從 .env 讀 THREADS_ACCESS_TOKEN
   - 從 cwd 往上走找 .env(支援 monorepo / git worktree)
2. CLI 解析 --url, --caption(媒體)或 --text(純文字)
3. 純文字:create → publish(2 步)
4. 媒體:create → poll(每 5s 上限 60 次)→ publish(3 步)
5. ERROR 自動 retry 1 次(間隔 30 秒)
6. 成功印 permalink
```

實作範例見本專案 `scripts/publish-threads.mjs`。

---

## 12. 不要做的事

- ❌ 把 short-lived token 直接寫進 .env(1 小時就死)
- ❌ 媒體 URL 用 redirect host(GitHub Releases / Dropbox share link / Google Drive share link)
- ❌ 跳過 ffmpeg color range 轉換,直接傳 Remotion / OBS 原生 mp4
- ❌ 看到 ERROR=UNKNOWN 直接告訴使用者「不可能成功」(很常 transient)
- ❌ 用 r2.dev 預設 URL 當 production host
- ❌ 沒檢查字數就 publish text(超 500 直接 reject)
