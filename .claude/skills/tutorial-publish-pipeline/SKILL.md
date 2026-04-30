---
name: tutorial-publish-pipeline
description: 教學影片 render + publish 跨平台 pipeline 共用規則 — 5 階段管線(工作目錄→對話⇆預覽→後製→發佈,對話⇆預覽 內部 iterative)/ 雙 mp4(16:9 + 9:16)/ 字幕用 Remotion 元件 / BGM/縮圖/配音 全 Remotion 自動 / YT 章節 / 全平台 public 預設 / 文案全形指令半形。任何要 render 教學影片或 publish 到 YT/IG/脆 的 AI 動工前先讀。
---

# Tutorial Publish Pipeline — 跨平台規則

> 給 Claude Videos 專案的教學片管線(`src/tutorial/` + `public/screenshots/<name>/steps.json` 流程)。短片管線(`src/content.ts`)不適用,但 publish API 部分相同。
>
> 跟其他 skill 的關係:這份是「影片本體 + 跨平台 publish 流程」共用層;細部 token / API 限制看 `youtube-publishing-rules` / `instagram-publishing-rules` / `threads-publishing-rules` / `threads-algorithm-rules`。

---

## 0. 整套管線心智模型(macro 線性 5 階段 + 對話/預覽 內部 iterative)

```
工作目錄 → 對話 ⇆ 預覽 → 後製 → 發佈
                                │
                                └─ 字幕 / BGM / 縮圖 / 配音(全自動)
```

- **macro 順序線性**:5 階段先後不可換(不能先後製再對話)
- **對話 ⇆ 預覽 內部 iterative**:預覽不滿意回對話改劇本,熱重載立刻看,反覆來回直到滿意才推到後製

詳細各階段:

- **工作目錄** = `git worktree add` 開新分支,主目錄不亂、多支同時改不衝突(細節見 CLAUDE.md)
- **對話** = 跟 Claude Code 講「拍 X 主題」,AI 寫 `steps.json`(blocks + voiceover 文字)+ 配 `config.ts`(brand / intro / outro / thumbnail)
- **預覽** = `npm run dev` 開 Remotion Studio,改 steps.json 熱重載立刻看效果;**這層跟對話 iterative**,不滿意回對話階段改劇本再來
- **後製**(0 人介入,Remotion 一次合成)= 4 項自動產出:
  - **字幕** = `<SubtitleOverlay>` 元件(`src/tutorial/SubtitleOverlay.tsx`),React 直接畫進 frame,**不經 ffmpeg burn-in**(細節見 §3)
  - **BGM** = `<Audio src="music/bgm.mp3" loop volume={0.2}>` 在 `TutorialComposition` 直接放,render 時 mix
  - **縮圖** = `<Still>` composition(Root.tsx 註冊 `ThumbnailYT/IG/Reel`),跟影片同源 `config.ts.thumbnail`,render 時順便產 PNG
  - **配音** = `npm run voiceover:tutorial` 用 ElevenLabs V3 產 wav → `public/voiceover/<name>/`;Remotion `<Audio>` 引用
- **發佈** = 一行 `node scripts/publish-tutorial.mjs` 同時上 YT(16:9) + IG Reel(9:16) + 脆(9:16 inline)

**架構意義**:對話階段 AI 已把後製 4 項全配置好,後製階段純機器跑、人不介入。**配音不是獨立步驟,跟字幕/BGM/縮圖並列在後製階段**。

---

## 1. Render 一律出兩支 mp4(16:9 + 9:16)

每次 `npm run render:tutorial` 必須輸出:
- `output/<videoName>.mp4` = **1920×1080**(YT 用)
- `output/<videoName>-reel.mp4` = **1080×1920**(IG Reel / 脆 inline 用)

實作:`src/Root.tsx` 註冊**兩個 composition**,都用同一個 `TutorialComposition` 元件(尺寸換):
```tsx
<Composition id={videoName} component={TutorialComposition} width={1920} height={1080} ... />
<Composition id={`${videoName}-Reel`} component={TutorialComposition} width={1080} height={1920} ... />
```
`scripts/render-tutorial.mjs` 跑兩次 `npx remotion render`(先 16:9,再 9:16)。

**理由**:每支教學影片都要跨平台,YT 橫式 / IG/脆 直式必備兩個版本。

### Render 速度優化

預設 sequential 跑兩支 ~20 分鐘。可優化:
- **Parallel**(`Promise.all` 同時 spawn 兩個 render):~13-14 分鐘(CPU 競爭 → speedup ~1.3x)
- **concurrency 提升**(`npx remotion render --concurrency 4`):每幀並行度 ↑,加快 30%。WSL2 記憶體緊張時降回 2x 避免 OOM
- **GPU encoder**(NVIDIA NVENC):~5 分鐘。WSL2 沒直接 GPU access,跳過

最簡 parallel 寫法用 `concurrently` npm package:
```bash
npx concurrently \
  "npx remotion render <name> output/<name>.mp4" \
  "npx remotion render <name>-Reel output/<name>-reel.mp4"
```

---

## 2. 9:16 直式 layout 內容**垂直置中**(易踩坑)

`StepScene` / `IntroScene` / `OutroScene` 預設給 16:9(內容高 ~700px)設計;放進 1920 高的 9:16 容器,下方會有 **1200px+ 空白**。

### 正確位置:PageContent **外層 main container**

```tsx
import { useVideoConfig } from "remotion";

const { fps, width, height } = useVideoConfig();
const isReel = height > width;

// PageContent 外層 div(flex column + alignItems center 那個,包整頁的最外層):
<div style={{
  display: "flex",
  flexDirection: "column",
  alignItems: "center",                                // cross axis: horizontal center(原)
  justifyContent: isReel ? "center" : "flex-start",    // ← 加這行
  // ... padding / gap / etc
}}>
```

橫式維持 `flex-start`(原 layout 不破壞),直式改 `center`。

### Flex axis 速查(避免再加錯位置)

| Direction | main axis | cross axis | justifyContent 控 | alignItems 控 |
|---|---|---|---|---|
| `column` | vertical | horizontal | 垂直 | 水平 |
| `row`(預設) | horizontal | vertical | 水平 | 垂直 |

PageContent 是 flex column → `justifyContent` 控**垂直** → `isReel ? center` 才會垂直置中。

### 錯誤位置(實測踩過)

- **加在 blocks.map 內的 wrapper**(`display: flex` 但 row direction)→ 那 justifyContent 控 horizontal,跟「垂直置中」無關
- **hard-code 9:16 layout 寫死 fontSize / spacing / max-width** → 會破壞 16:9 共用元件

---

## 3. 字幕用 Remotion 元件渲染(不是 ffmpeg burn-in)

教學影片**所有平台**都要字幕,實作是 **Remotion `<SubtitleOverlay>` 元件**(`src/tutorial/SubtitleOverlay.tsx`),render 階段 React 直接畫進 frame。**不經 ffmpeg post-process,沒有 SRT 檔產生。**

**架構**:
- `TutorialComposition.tsx` 最上層放 `<SubtitleOverlay introText outroText steps durations />`
- 元件讀 steps.json 的 `voiceovers[]` + `public/voiceover/<name>/durations.json`,內部 `splitIntoSentences` 按 `。` 切句,按字數比例 + `MIN_DUR=1.5s` 算每句 from/to
- 用 `useCurrentFrame()` + `t = frame/fps` 找當前句子,用 `<AbsoluteFill>` 在底部畫白字 + 黑底半透明 + 4 方向陰影
- 16:9 fontSize 32 / 9:16 fontSize 42(`isReel = height > width`)

**為什麼不 ffmpeg burn-in**:
- ffmpeg burn-in 需要先 render mp4 → 算 SRT → 再跑一次 ffmpeg(double pass)
- Remotion 元件 render 一次到位,改 voiceover 文字熱重載立刻看效果
- 字體/顏色/位置全用 React inline style 控,不用查 ffmpeg `force_style` 文法

**為什麼仍然「跨平台一致」**:雖然不用 ffmpeg,但元件畫的字也是 mp4 frame 的一部分(Remotion 渲染合成),YT/IG/脆 看到的都是同一支 mp4,效果跟 hardcoded 一樣 — 不依賴各平台 caption API,觀眾關靜音也看得到。

---

## 4. YT description 必含影片章節

**每支教學片**的 YT description 必須有 chapter 區塊:

```
═══════ 影片章節 ═══════

0:00 第一個章節名
0:22 第二個章節名
...
2:29 結尾
```

YT 規則:
- 第一個 chapter **必須 0:00**
- 至少 3 個 chapter(我們通常 7-10 個)
- **每兩個 chapter 間距 ≥ 10 秒**(< 10s 會被 reject 不顯示)

時間戳算法:
- 從 `public/voiceover/<name>/durations.json` 累加 voiceover wav 長度
- 加 ~1s buffer 給每個 step 的 spring 動畫
- 太短的 step(< 10s)合併進相鄰 chapter

---

## 5. 全平台 publish 預設 **public**

**規則**:YT / IG / 脆 一律 public,不用 private 預設。

```js
// publish-youtube.mjs / publish-instagram.mjs / publish-threads.mjs
const VISIBILITY = opts.visibility ?? "public";  // 預設 public(專案規則)
```

**理由**:日更頻道每次發片就是公開,不需要 private 預發確認。如果某次想 private,顯式給 `--visibility private`。

---

## 6. 文案全形標點 / 指令半形

**中文段落**(voiceover / paragraph / callout / description / caption / hashtag tagline)→ **全形標點**:
- 逗號 `,` →「,」(U+FF0C)
- 句號 `.` →「。」(U+3002)
- 冒號 `:` →「:」(U+FF1A)
- 括號 `()` →「()」(U+FF08 / U+FF09)
- 驚嘆號 `!` →「!」(U+FF01)

**Code / URL / 變數名 / yaml / JSON / shell** → **維持半形**(觀眾要複製貼上跑指令)。

混合行(如 `cron 設 '0 0 1 * *'(每月 1 號 = 30 天頻率)`)分開處理:中文括號全形,cron syntax `'0 0 1 * *'` 半形。

**YT description 額外規則**:
- 不能含 `<` 或 `>`(`youtube-publishing-rules` skill)
- placeholder 用全形書名號 `〈〉`(替代 `<>`)
- shell `&&` 可保留(YT 不擋這個,擋的只有 `<>`)

---

## 7. 脆 publish pattern(教學影片)

**主貼文**(`publish-threads.mjs`):
- **上傳 9:16 mp4**(inline 播放,觀眾不離開脆)
- 文字內容:實質教學(三步驟之類,不是「去看影片」廢話)
- **❌ 零外連結 — 包括 instagram.com URL**(2026-04-29 數據:有外連結平均 ~276 views,沒外連結平均 ~4,022 views,~14 倍差距;R6 不分 Meta 自家)
- 結尾用文字引導:「想試的留言告訴我」「想看完整版留言+1」等(刺激留言互動,不承諾外連結)

**❌ 不要在第一則留言放 YT/IG/repo 連結**(2026-04-29 規則):
- 主貼文 + 自己第一則 reply 演算法可能整體看,reply 含外連結會把整個 thread reach 拖下來
- 第一則 reply 也是 P1 紅利期內(發後 0-3h),這時放連結 = 把外連結信號給最敏感的時段

**自己第一個留言**(發完主貼文 30 秒內接,P3 自己回留言演算法加分):
- **純文字 engagement hook**,例:「卡關的留言問,我會回」「想試的人留言+1 我看到再給連結」
- ❌ 不放 URL(IG/YT/repo 都不放)

**連結要放,延後到 P1 紅利期過**(發後 3-6 小時)後另發 reply:
- 主貼文 reach 已穩定,演算法評分結束,這時補連結對主貼文 reach 影響小
- 如果有觀眾留言問了 → 直接回那則留言(對話式),不用主動補

**發後 3 小時策略**(P1 紅利期,`threads-algorithm-rules` skill):
- 優先回:有實質案例 / 反駁 / 延伸的留言
- 不用回:「+1」「同意」純表情

---

## 8. 發布順序

```
1. YT publish(16:9 mp4 + 全形 description + chapters)→ 拿 YT URL
2. IG Reel publish(9:16 mp4 + caption + 5 hashtag)→ 拿 IG_REEL_URL
3. 脆 publish(9:16 mp4 + 主貼文純文字無外連結)→ 拿 thread_id
4. 脆第一則留言(發後 30 秒內,純文字 engagement hook,**不放任何 URL**)
5. 連結 reply 延後 ≥ 3 小時(P1 紅利期過再發,放 IG/YT/repo);或被觀眾留言問了再對話式回
```

YT 先發理由:description 字元上限最寬鬆(5000)、章節對齊有彈性、URL 給後面平台引用。

---

## 9. 列點對齊規則(16:9 居中對齊 / 9:16 縮排 + 兩層階梯)

**所有列點(1/2/3/4 + 項目符號)一律垂直對齊在同一線**,但對齊位置因 ratio 不同:

### 16:9(橫式)

- paragraph wrapper:`justifyContent: center`(居中,跟 callout/code 同層)
- **Paragraph 元件 `width: 100%` + `maxWidth: 1400`** — 強制撐到固定寬,每個 paragraph 起點一致
- **不縮排**(避免列點貼左、右側大空白「跑到外面」感)

### 9:16(直式)

- paragraph wrapper:`justifyContent: flex-start` + `paddingLeft: 60`(縮排,跟標題形成兩層階梯)
- Paragraph 元件同樣 `width: 100%` + `maxWidth: 1400`
- 用 `isReel = height > width` 條件啟動

### 共通

- callout / code / image:始終 `justifyContent: center`(不受 isParagraph 影響)
- Paragraph `textAlign: left`

### 正確實作

```tsx
// StepScene.tsx blocks.map wrapper
const isParagraph = block.type === "paragraph";
const indentParagraph = isParagraph && isReel;  // 只 9:16 縮排
<div style={{
  width: "100%",
  display: "flex",
  justifyContent: indentParagraph ? "flex-start" : "center",
  paddingLeft: indentParagraph ? 60 : 0,
  boxSizing: "border-box",
}}>
  <BlockRenderer block={block} ... />
</div>

// Paragraph.tsx 元件 — width 100% 是關鍵,沒這個列點起點不一致
<div style={{
  textAlign: "left",
  width: "100%",
  maxWidth: 1400,
  // ... fontSize / color / etc
}}>
```

### 錯誤位置(實測踩過)

- ❌ **Paragraph 加 `marginLeft / alignSelf`** — 被父 wrapper justifyContent center 覆蓋
- ❌ **PageContent `alignItems: flex-start`** — 破壞 callout / code 居中
- ❌ **16:9 也 paddingLeft 60** — 列點貼左、右側大空白「跑到外面」
- ❌ **沒 Paragraph `width: 100%`** — 居中模式下短句長句起點不同,列點歪斜

### 理由

- 16:9 寬畫面右側若空大塊看起來不對勁 → 居中
- 但居中模式下若 paragraph 寬度依內容變化 → 列點歪斜 → 用 width 100% 強制統一
- 9:16 直式寬度窄,paragraph 撐滿 → 縮排 60 才有「兩層階梯」感

---

## 10. 共用基礎更新流程

**改動 main 的 scripts/ / src/tutorial/ / src/Root.tsx 等共用元件後**:
1. main commit + push
2. **既有 worktree 各自跑 `git merge main`** 才會拿到新改動
3. 新 worktree(`git worktree add ... -b video/<new> main`)自動繼承

實際工作:每次跨 worktree 開新影片前先在 main pull 最新,worktree merge main。

---

## 11. 不在當前 scope(YAGNI)

- Word-level 字幕(隨講字 highlight)→ 整段字幕夠用,word timing 太貴
- Auto-generated 縮圖(從影片 frame 截)→ 已有 `<videoName>-yt.png` Still composition
- 多語言字幕 → 中文一支
- 影片廣告插入 → YT 自動處理
