---
name: tutorial-voiceover-style
description: Tutorial 影片寫 voiceover 的工作順序(先鎖圖再寫配音、先預覽再 render)、內容規範、ElevenLabs 模型 / 速度設定。任何要動 intro / step.voiceovers / outro 字串、或要跑 generate-tutorial-voiceover.ts / render:tutorial 的 AI 都應該先讀。
---

# Tutorial 配音風格與模型規範

這支 skill 規範寫教學片配音字串的三件事:**何時動配音**、**講什麼**、**怎麼合成**。

---

## 1. 工作流程順序

兩條順序規則,合在一起就是教學片完整工作流程。

### 1.1 先鎖圖,後寫配音

**強制順序:** 先把 step 所有 `image` / `code` / `callout` block 鎖定(視覺骨架先定死,圖檔名都填進 `steps.json`)→ 才動 `voiceovers` / `intro.voiceover` / `outro.voiceover` 字串 → 才跑 `generate-tutorial-voiceover.ts`。

**Why:** 內容規則(2.1)要求「畫面上看得到的重點全部要點到」—— 不知道畫面是什麼,寫不出對的配音。圖如果之後再改,配音多半要重寫,ElevenLabs credit 燒兩次。

### 1.2 先 studio 預覽,後 render

**強制順序:** voiceover 生完 → 跑 `npm run dev`(Remotion studio)讓**使用者預覽** → 等使用者明確說 render / ship / 出片 → 才跑 `npm run render:tutorial`。

**Why:** render 一次要 5–10 分鐘,觀眾沒預覽就 render 通常要重來,白燒時間。studio 可以拖時間軸快速檢查 step 對位、配音時序、視覺對焦,先讓使用者過目才合理。AI 不要自己決定 render 時機。

### 1.3 完整 How to apply

1. 排定 step 所有 `image` / `code` / `callout` block,圖檔名填進 `steps.json`(實檔放進 `public/screenshots/<videoName>/`)
2. 對著定好的 block 寫 voiceover 字串
3. 跑 `npx tsx scripts/generate-tutorial-voiceover.ts <videoName>`(只跑改過的 clip,別全部重生燒 credit)
4. 跑 `npm run dev`(Remotion studio),把 URL 給使用者預覽
5. 場景太空就拆 `pageBreak`(用 `tutorial-auto-pagebreak` skill),**不要回頭加配音字數**
6. **等使用者明確說 render / ship / 出片** 才跑 `npm run render:tutorial` —— AI 不要自己 render

`durations.json` 會自動更新,`TutorialComposition` 會根據新長度自動把 Sequence 拉長(`max(預設 frames, audio frames + tail)` 邏輯)。

---

## 2. 內容原則

### 2.1 必講:畫面上看得到的「重點」全部要點到

教學片觀眾常常邊看邊操作,**畫面上有出現的關鍵動作 / 關鍵字 / 警示,配音都要對應講到一次**,不要假設觀眾自己會讀。

「重點」指的是:
- 該頁的**動作指令**(複製、貼上、按 Enter、開哪個選單)
- 該頁的 **行為相關 callout**(會影響觀眾預期的提示):
  - ✅ 念:「沒有輸出是正常的」(否則觀眾會以為失敗)
  - ✅ 念:「看到紅字錯誤的話重跑一次」(行動指引)
- **code 區塊裡的關鍵差異**(不是逐字念,但要讓觀眾知道這行做什麼)
- 該頁出現的**關鍵字**(指令名 / 平台名 / 檔名)

**例外 — 視覺確認型 callout 不用念:**
畫面上純粹是「打開後會看到 X」、「跑完會看到 Y」這種純視覺結果描述、觀眾自己看畫面就知道有沒有達成、不影響觀眾下一步行動的 callout,**可以省略不念**,以免變成在念稿。判斷標準:這句話如果不念,觀眾會做錯事 / 誤判失敗嗎?不會 → 省略。

### 2.2 禁:為了「場景看起來太短」硬塞廢話

不要為了讓 audio 拉長到滿足某種視覺停留時間,而加無資訊量的鋪陳:

- ❌「整個過程大約一到兩分鐘,中間會看到一堆下載進度跑過去,讓它跑完就好。」
  → ✅「下載安裝大概一到兩分鐘,讓它跑完。」(資訊量同,字數砍半)
- ❌「歡迎來到 Claude Code 安裝教學,這集會用 Mac 環境,三個步驟把 Claude Code 裝起來。」
  → ✅「Claude Code 安裝教學,Mac 版。」(intro 通常只要主題 + 平台一句話)
- ❌「下一集,我們來裝幾個讓 Claude Code 跑得更順的開發工具,記得繼續看下去。」
  → ✅「下一集,開發工具安裝教學。」(outro 只要成果 + 下一集是什麼)

### 2.3 場景如果太短

配音講完還剩很多畫面時間,選項:
1. **拆 pageBreak 多塞一張圖** 給配音對應的視覺(用 `tutorial-auto-pagebreak` skill 自動拆)
2. **把 step 拆成多個 step**(每個 step 自己一頁配音)
3. **接受場景就是這麼短** ——『重點講完就切下一場』比『硬塞贅字撐時間』好

絕對 **不要** 反向延長配音去配合視覺。

### 2.4 風格細節

- intro:主題 + 平台 / 受眾,1 句話結束。例:「Claude Code 安裝教學,Mac 版。」
- outro:成果一句 + 下一集標題,可加感嘆詞。例:「恭喜!Claude Code 安裝完成。下一集,開發工具安裝教學。」
- step:第 N 步先講動作,再講警示 / 例外。例:「第三步,設定 PATH 環境變數,讓你之後直接打 claude 就能用。複製指令貼上按 Enter。這行跑完不會有輸出,沒看到紅字就代表設定完成。」

---

## 3. ElevenLabs 模型 / 速度

### 3.1 模型固定 V3(`eleven_v3`)

- ❌ 不要用 `eleven_multilingual_v2`(語氣 / 停頓相對平,讀技術內容像念稿)
- ✅ `eleven_v3` 中文停頓自然、口氣比較像真人講解教學

`scripts/generate-tutorial-voiceover.ts` 的預設值已經是 `eleven_v3`(透過 `ELEVENLABS_MODEL` env override 才換),不要改回 v2 預設。

### 3.2 語速(`ELEVENLABS_SPEED`)

- 範圍 0.5 ~ 2.0,1.0 = 原速
- 教學片**建議 0.85**(略慢於原速,讓觀眾跟得上)
- 設在 `.env` 的 `ELEVENLABS_SPEED=0.85`

### 3.3 個別 clip 重生

只重生有問題的單一 clip,不要每次都全部重生(浪費 ElevenLabs credit):

```bash
# 全部重生
npx tsx scripts/generate-tutorial-voiceover.ts <videoName>

# 只重生某幾個 clip
npx tsx scripts/generate-tutorial-voiceover.ts <videoName> outro
npx tsx scripts/generate-tutorial-voiceover.ts <videoName> ch1-s2-p1 ch1-s2-p2
```
