# Claude Videos — 給 Claude Code 的工作規則

## 🛡️ 動 `src/content.ts` 前必做(防呆)

**這條規則是為了避免舊影片被誤覆蓋。**

1. **先 Read `src/content.ts`**,看現在的 `meta.videoName` 和場景主題。
2. 判斷使用者這次的需求屬於哪種:
   - **同主題微調**(改字、改色、改場景順序、改秒數、換配音腳本)→ 可以直接改 `content.ts`
   - **換主題 / 新影片**(主題、brand、場景結構完全不同)→ **必須先跑 `npm run archive`**,再改寫 `content.ts`
3. 不確定算哪種 → **停下來問使用者**,不要猜。
4. 改完後回報一句:「舊的 `<videoName>` 已歸檔到 `src/videos-archive/`,新的 `content.ts` 主題是 `<新 videoName>`」,讓使用者確認。

## 📁 從備份取回舊影片

使用者說「把 `src/videos-archive/<name>.ts` 搬回 `content.ts`」時的流程:
1. 如果現在的 `content.ts` 還沒歸檔 → 先 `npm run archive`
2. 然後把 archive 檔案複製到 `src/content.ts`(可用 `cp` 或 Read + Write)
3. 回報搬回完成

## 🎨 影片內容邏輯 cheat sheet

- **整支影片 = `src/content.ts` 一個檔案**,包含 meta / brand / scenes / voiceover / bgm / thumbnails。
- `meta.videoName` 是輸出檔名來源 —— 同一 content 檔改 videoName 也能做版本分支,但換主題還是要先 archive。
- 場景視覺類型:`iconPair` / `crossedItems` / `terminal` / `phoneCTA` / `centerText`。新增類型要改 `src/types.ts` 的 `SceneVisual` 和 `src/scenes/SceneRenderer.tsx`。
- 文字用 `[中括號]` 包住會自動套主色 highlight。

## 🗣️ 語言慣例

- 回應、commit、檔案內的使用者可見文案:**繁體中文**。
- 程式碼 / 識別字 / 路徑:英文。
- Git commit 遵循 Conventional Commits,訊息用繁中解釋「為什麼這樣改」。

## 🚫 不要做的事

- 不要覆蓋 `src/content.ts` 而沒先 archive(除非使用者明確說「直接覆蓋」)。
- 不要動 `src/content.example.ts`(那是給新 clone 者的範本,會被追蹤進 git)。
- 不要把 `src/videos-archive/` 的內容推上 git(已 gitignore,不要硬加)。
- 不要每次都新建 composition / 新 content 檔,除非使用者明確要求「雙軌並存」。單檔 + archive 是本專案的預設架構。
