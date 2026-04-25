---
name: instagram-publishing-rules
description: Instagram Reels / Posts 自動發片完整規則 — 2025-12 起 hashtag 5 個上限、caption 關鍵字權重、branded tag 策略、API 操作邊界(host 要求、cover 必須 JPG、不能 DELETE)、token 生命週期。任何要寫 IG 自動發片 / 改 caption / 設計 hashtag 組合的 AI 應該先讀。
---

# Instagram Publishing — 自動發片 / Reels 完整規則

## 1. ⚠️ Hashtag 5 個上限(2025-12-18 起)

Meta 官方公告 2025-12-18 起,**Posts 跟 Reels 都強制限制最多 5 個 hashtag**。塞超過,**多的會被自動砍掉、或直接擋發**。caption 內或留言內都計入這 5 個。

**理由(Meta 自己講):** AI 演算法現在主要靠 caption 文字 + 畫面 + audio 直接理解內容,hashtag 退化成輔助訊號;一堆通用 tag 反而傷觸及。

### 5 個 tag 怎麼選(這專案的 template)

| 槽位 | 用途 | 例子 |
|---|---|---|
| 1 | **主題鎖定**(影片講什麼) | `#claudecode` / `#Remotion` / `#ElevenLabs` |
| 2 | **大類入口流量**(該主題的熱門父類) | `#vibecoding` / `#aitools` / `#自動化` |
| 3 | **受眾標籤**(誰會想看) | `#一人公司` / `#自媒體經營` / `#工程師日常` |
| 4 | **系列分類**(這頻道內部分類) | `#日更拍片` / `#ClaudeCode教學` |
| 5 | **branded / 個人 tag**(固定一個) | `#日更拍片神器` ← **本專案固定用這個** |

**規則:**
- 每支影片**獨立挑前 4 格**(別整個系列共用同一組)
- **第 5 格永遠 `#日更拍片神器`** — 累積系列、方便觀眾 follow tag、自己統計流量
- 不要塞無關但流量大的 tag(像 `#台灣` `#follow`),會被歸到不對的圈 → 演算法降推
- ⚠️ **5 格 keyword 不能重疊** — Meta AI 演算法看 hashtag **語意而非字串**,如果有 2 格共用同個 keyword(例:slot 4 `#日更拍片` + slot 5 `#日更拍片神器`、或 slot 1 `#claudecode` + slot 4 `#ClaudeCode教學`)會被當成同一個訊號,等於只用了 4 格。每格找完全不同 keyword 的角度:
  - slot 1 講「用什麼工具」(例 `#claudecode`)
  - slot 2 講「屬於哪個大類」(例 `#vibecoding` / `#aitools`)
  - slot 3 講「誰會看」(例 `#一人公司`)
  - slot 4 講「平台 / 形式 / 系列」(例 `#Mac教學`)
  - slot 5 是 branded(例 `#日更拍片神器`)
  選完先檢查:把 5 個 hashtag 並排,有沒有兩個共用 ≥ 3 字的 keyword?有就換掉。

## 2. Caption 寫法

5 個 tag 不夠用,**caption 文字本身就是 SEO**。重點:

- **前 125 字元很重要**(IG feed 預設 truncate 在這),關鍵字塞進前 3 行
- Reels 的 caption 上限 2200 字,但 **80% 觀眾只看開頭**
- 善用換行 + emoji 開段(😀 📌 🎬)幫助 scanability
- 寫法:**「主題 + 關鍵字密集」**,類似 SEO 的 H1
- 結尾 5 個 hashtag 用一個 `—` 跟正文分開,視覺乾淨

## 3. API / 腳本邊界

實作走 `scripts/publish-instagram.mjs`(已存在)。注意事項:

### 走新線(Instagram API with Instagram Login)
- BASE: `https://graph.instagram.com/v25.0`(不是 graph.facebook.com)
- IG_USER_ID 用 `me`(在新線下),或填 /me 回傳的 `id`(不是 user_id)
- 必要 scope:`instagram_business_basic` + `instagram_business_content_publish`

### 影片 / 圖片 host
- mp4 必須 **public HTTPS**(本專案用 `https://starjobtw.com/<file>` Cloudflare R2)
- mp4 編碼:`yuv420p` + `color range tv`(跟 Threads 同地雷,用 ffmpeg re-encode)
- cover 縮圖**必須是 JPG**(不是 PNG)— 用 PIL 從 reel.png 轉
- 規格:垂直 9:16(1080×1920),3s ~ 15min,< 1GB

### 三段式發片流程
1. `POST /me/media`(media_type=REELS, video_url, cover_url, caption, share_to_feed=true)
2. 輪詢 `GET /<creation_id>?fields=status_code` 等到 `FINISHED`(通常 30s ~ 3min)
3. `POST /me/media_publish` (creation_id)

### ⚠️ 不能做的事
- **API 不能 DELETE Reels** — 發錯只能進 IG App 手動刪
- API 不能 EDIT caption / cover(要改只能刪掉重發)
- 一天 publish 上限 50 則(24h rolling)
- Token 60 天會過期,要重 OAuth(沒有 refresh endpoint)

## 4. 跟其他平台共版時的注意

- 三平台同步發(YT / IG / 脆)時,**caption 主體可以共用,但 hashtag 段只塞 IG 版**(脆不需要、YT 用 description tags)
- IG caption 含 URL 不會自動 hyperlink(只有 bio 會),但觀眾還是看得到文字 → 想被點到的連結建議放在 caption 中段而不是末尾(IG App 會 truncate)
- 共版第一句要強(吸引點開)

## 5. 失敗處理

- `ERROR=UNKNOWN` 在 polling 階段:多半是 mp4 編碼不符,重 ffmpeg
- `code: 190 Invalid OAuth`: token 過期或來源錯,重 OAuth(走新線記得 host 用 graph.instagram.com)
- `Application does not have permission`: scope 缺,重 OAuth 補勾
