---
name: tutorial-voiceover-style
description: Tutorial 影片(public/screenshots/<videoName>/steps.json)寫 voiceover 文字的內容規範,以及 ElevenLabs 模型 / 速度設定。任何要動 intro / step.voiceovers / outro 字串、或要跑 generate-tutorial-voiceover.ts 的 AI 都應該先讀。
---

# Tutorial 配音風格與模型規範

這支 skill 規範寫教學片配音字串的兩件事:**講什麼**、**怎麼合成**。

---

## 1. 內容原則

### 1.1 必講:畫面上看得到的「重點」全部要點到

教學片觀眾常常邊看邊操作,**畫面上有出現的關鍵動作 / 關鍵字 / 警示,配音都要對應講到一次**,不要假設觀眾自己會讀。

「重點」指的是:
- 該頁的**動作指令**(複製、貼上、按 Enter、開哪個選單)
- 該頁的 **callout 警示內容**(例如「沒有輸出是正常的」、「會看到紅字錯誤就重跑」)
- **code 區塊裡的關鍵差異**(不是逐字念,但要讓觀眾知道這行做什麼)
- 該頁出現的**關鍵字**(指令名 / 平台名 / 檔名)

### 1.2 禁:為了「場景看起來太短」硬塞廢話

不要為了讓 audio 拉長到滿足某種視覺停留時間,而加無資訊量的鋪陳:

- ❌「整個過程大約一到兩分鐘,中間會看到一堆下載進度跑過去,讓它跑完就好。」
  → ✅「下載安裝大概一到兩分鐘,讓它跑完。」(資訊量同,字數砍半)
- ❌「歡迎來到 Claude Code 安裝教學,這集會用 Mac 環境,三個步驟把 Claude Code 裝起來。」
  → ✅「Claude Code 安裝教學,Mac 版。」(intro 通常只要主題 + 平台一句話)
- ❌「下一集,我們來裝幾個讓 Claude Code 跑得更順的開發工具,記得繼續看下去。」
  → ✅「下一集,開發工具安裝教學。」(outro 只要成果 + 下一集是什麼)

### 1.3 場景如果太短

配音講完還剩很多畫面時間,選項:
1. **拆 pageBreak 多塞一張圖** 給配音對應的視覺(用 `tutorial-auto-pagebreak` skill 自動拆)
2. **把 step 拆成多個 step**(每個 step 自己一頁配音)
3. **接受場景就是這麼短** ——『重點講完就切下一場』比『硬塞贅字撐時間』好

絕對 **不要** 反向延長配音去配合視覺。

### 1.4 風格細節

- intro:主題 + 平台 / 受眾,1 句話結束。例:「Claude Code 安裝教學,Mac 版。」
- outro:成果一句 + 下一集標題,可加感嘆詞。例:「恭喜!Claude Code 安裝完成。下一集,開發工具安裝教學。」
- step:第 N 步先講動作,再講警示 / 例外。例:「第三步,設定 PATH 環境變數,讓你之後直接打 claude 就能用。複製指令貼上按 Enter。這行跑完不會有輸出,沒看到紅字就代表設定完成。」

---

## 2. ElevenLabs 模型 / 速度

### 2.1 模型固定 V3(`eleven_v3`)

- ❌ 不要用 `eleven_multilingual_v2`(語氣 / 停頓相對平,讀技術內容像念稿)
- ✅ `eleven_v3` 中文停頓自然、口氣比較像真人講解教學

`scripts/generate-tutorial-voiceover.ts` 的預設值已經是 `eleven_v3`(透過 `ELEVENLABS_MODEL` env override 才換),不要改回 v2 預設。

### 2.2 語速(`ELEVENLABS_SPEED`)

- 範圍 0.5 ~ 2.0,1.0 = 原速
- 教學片**建議 0.85**(略慢於原速,讓觀眾跟得上)
- 設在 `.env` 的 `ELEVENLABS_SPEED=0.85`

### 2.3 個別 clip 重生

只重生有問題的單一 clip,不要每次都全部重生(浪費 ElevenLabs credit):

```bash
# 全部重生
npx tsx scripts/generate-tutorial-voiceover.ts <videoName>

# 只重生某幾個 clip
npx tsx scripts/generate-tutorial-voiceover.ts <videoName> outro
npx tsx scripts/generate-tutorial-voiceover.ts <videoName> ch1-s2-p1 ch1-s2-p2
```

---

## 3. 寫完之後

1. 把更新的 `voiceovers` / `intro.voiceover` / `outro.voiceover` 字串存到 `public/screenshots/<videoName>/steps.json`
2. 跑 `npx tsx scripts/generate-tutorial-voiceover.ts <videoName>`(只跑改過的 clip)
3. 重整 Remotion studio 預覽(`npx remotion studio`)
4. 場景太空就拆 pageBreak,**不要回頭加字數**

`durations.json` 會自動更新,`TutorialComposition` 會根據新長度自動把 Sequence 拉長(`max(預設 frames, audio frames + tail)` 邏輯)。
