---
name: x-publishing-rules
description: ⚠️ DEFERRED 2026-04-27 — 本 channel 暫不發 X。Skill 內容保留(規則參考),但動工前先跟使用者確認真的要做 X 才執行,別自動把 X 列進跨平台發片清單。X (Twitter) 發 thread / single post 完整規則 — 2026-Q1 起 Grok 演算法接管、hashtag 上限 1–2 個、外連結 -30~50% 觸及、Thread 比單推 +63% 曝光。
---

> ⚠️ **DEFERRED 2026-04-27** — 本 channel **暫不發 X**。
> 此 skill 內容保留供未來參考(規則 / 爆款套路 / API 邊界),但**目前 X 不在跨平台發片 pipeline 內**。
> 三平台 = YT + IG + 脆;X 不要自動寫 / 自動列入草稿。動工前先跟使用者確認真的要重啟 X 才執行。

# X (Twitter) Publishing — Thread / Post 完整規則

跟 IG / YT / Threads 是**完全不同邏輯**(hashtag 規則相反、thread 為王、外連結被罰)。寫 X 內容前先把這幾條看一遍。

---

## 1. ⚠️ 演算法核心訊號(2026-01 Grok 接管後)

| 訊號 | 權重 / 影響 |
|---|---|
| **作者回覆留言** | **+75**(等於 150 個 like;**必回**) |
| **Bookmark / Reply** | +13 ~ +25 |
| **Like** | +0.5 |
| **Thread**(>=2 推串接) | **+63% 曝光、3× 互動** vs 單推 |
| **主推有外連結** | **-30~50% 觸及** |
| **負面 / 戰鬥語氣** | Grok NLP 監測,**降推**(就算 engagement 高) |
| **AI 生成感** | 偵測後降推,需「人寫人發」感 |

**最大行動指引:** 發完留 30 分鐘回覆每則留言,觸及會被持續加權。

---

## 2. ⚠️ Hashtag 規則跟 IG 完全相反

| 平台 | 上限 | 位置 | 罰則 |
|---|---|---|---|
| IG | 5 個 | 結尾 1 區塊 | >5 砍掉/擋發 |
| **X** | **1–2 個** | **嵌句中 / 最後一推** | **>2 個 -40% 觸及** |

**規則:**
- **不要 5 個塞滿** —— X 不是 IG,塞多會被演算法直接懲罰
- **不要放推文開頭** —— 演算法判定為 spam 信號
- niche > generic —— `#claudecode` 勝過 `#AI` `#tech`(NLP 已能直接理解內容,通用 tag 不再有用)
- **三平台共版時 X hashtag 段獨立寫**(IG 5 個那組搬過來會被罰)

---

## 3. AI 教學爆款套路(Boris Cherny / Garry Tan 模板)

2026-Q1 兩個現象級 thread 拆解:

**Boris Cherny(Claude Code 作者)2026-01 viral thread:**
- Hook:**反直覺 bold claim**(workflow 簡單到讓觀眾以為是 troll)
- 內容:具體 slash command(`/commit-push-pr`)+ 「one human = small eng team output」框架
- 框架邏輯:讓觀眾覺得「我也可以做到」+「但目前沒做到的人很笨」

**Garry Tan(YC CEO)2026-03 gstack:**
- Hook:多 agent 分角色(CEO / Engineer / QA)
- 配 GitHub repo → 幾小時內 HN #1 + X trending
- 觸發點:**可下載立刻試的 artifact**

**爆款共同元素(必備 4 條):**

1. **Hook 是 bold claim,不是 educational tone** —— 「我用 X 取代了 Y」勝過「來教你 X」
2. **具體**(slash command、prompts、路徑、code snippet)—— 抽象描述沒人看
3. **GitHub repo / 可複製品** —— 給觀眾「立刻試」的入口
4. **Thread 而非單推** —— 有空間展開 workflow,觸及又高 63%

---

## 4. Thread 結構模板

```
T1 (hook)
  反直覺 bold claim,不放任何外連結。
  例:「一個人 + Claude Code = 一個影片產線」

T2 (problem / promise)
  痛點或承諾。
  例:「拍片要錄音 / 剪輯 / 上字 / 上傳三平台,以前一支要 4 hr,現在 4 min」

T3...Tn (steps with concrete artifacts)
  具體 slash command / prompt / 截圖 / code。
  每推 1 個 atomic 點,別塞太多。

T(n-1) (resource link)
  GitHub repo / 文章連結。**不要放 T1**(主推外連結降推 30-50%)。

Tn (CTA + hashtag)
  「想看完整影片留言我貼」+ #claudecode #vibecoding(只 1–2 個 tag)
```

**長度:** 4–8 推一條 thread 比較好讀。15 推以上觀眾掉光。

---

## 5. AI 生成 → 人發 工程

X 對 AI 生成偵測比 IG / 脆 / YT 嚴格。AI 寫的長句在 X 容易被降推。**Workflow:**

1. AI ideation:hook 多種版本、論點清單、例子
2. **人寫實際 tweet** —— 你的聲音才是資產(不能外包)
3. AI editing:幫修語法、砍冗字、加 emoji 散開節奏
4. 風格上加:**破折號 — / 不完整句 / emoji 散開 / 縮寫**(像真人講話節奏)

避免:三句以上連續 GPT-style 流暢段落 → 偵測命中率高。

---

## 6. API / 自動發片邊界

**這專案目前沒有 `scripts/publish-x.mjs`**。要做的話:

### X API v2(2026 現況)
- **Free tier 嚴重縮水** —— 1500 post/月、100 read/月,基本不夠日更
- **Basic** $100/月 —— 3000 post/月、10K read,個人創作者實用區間
- **Pro** $5000/月 —— 不需要

### Endpoints
- `POST /2/tweets` —— text + 可選 media_id
- Media 上傳走 **v1.1 endpoint**(`/1.1/media/upload.json`,還沒 v2 化)
- **Thread = chained replies** —— 後一推 `in_reply_to_tweet_id` 指前一推的 id
- 圖片格式:JPG / PNG / WEBP / GIF;影片 mp4 H.264 + AAC

### Rate limits(Basic)
- 100 post/15-min
- 100 media upload/15-min
- 監控 `x-rate-limit-remaining` header

### 實作建議(以後寫腳本時)
```
node scripts/publish-x.mjs --thread thread.json
```
其中 `thread.json`:
```json
{
  "tweets": [
    { "text": "T1 hook" },
    { "text": "T2 ..." },
    { "text": "T3 ...", "media": ["path/to/PostIG.png"] },
    { "text": "T4 GitHub: https://...", "linkInBody": true },
    { "text": "—\n#claudecode #vibecoding" }
  ]
}
```

---

## 7. 跟其他平台共版策略

不要把 IG / 脆的 caption 直接搬來 X。差異:

| 元素 | IG / 脆 | X |
|---|---|---|
| 結構 | single post + 5 hashtag | thread + 1-2 hashtag |
| 外連結 | OK 放 caption | **不放 T1**(主推降推) |
| 長度 | 1 段內(2200 字) | 4–8 推 thread,各 280 字 |
| Hook | 第一行抓眼球 | 反直覺 bold claim |
| Hashtag | 5 個結尾一區塊 | 1–2 個嵌句中 / 最後一推 |

**共版時:**
- 第一句 hook 可三平台共用
- 內文要重寫(X 用 thread 拆,IG 用 single post 整段)
- Hashtag 段各平台獨立寫,別混

---

## 8. 失敗 / 已知踩坑

- **發完不回留言** → 演算法不加權(reply from author 是 +75 訊號)
- **主推塞 GitHub link** → 觸及砍 30-50%,改放 thread 後段
- **連續 3 推都是 GPT-style 流暢段落** → AI 偵測命中,降推
- **>2 個 hashtag** → -40% 觸及
- **1 thread > 15 推** → 觀眾掉光,改拆兩 thread 分次發
- **負面 / 戰鬥語氣**(就算是行銷常見的 outrage marketing) → Grok 降推
- **Free tier API 試圖日更** → 1500/月配額用完後就斷,改 Basic 才實用
