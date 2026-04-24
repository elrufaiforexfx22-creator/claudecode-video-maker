---
name: tutorial-auto-pagebreak
description: Use when editing a Remotion tutorial steps.json with voiceovers[] and blocks[] per step, and pageBreak markers are missing, out of sync with voiceovers.length, or being added by hand.
---

# Tutorial Auto PageBreak

## Overview

在這個 Remotion tutorial 管線中,每個 step 會被切成多「頁」,每頁對應一段 voiceover。**`pages.length` 必須等於 `voiceovers.length`**,否則 `pageAudioDurationsFor()` 取不到對應音訊,頁會提早切掉或音訊被截斷。

本 skill 把「依 `voiceovers.length` 自動插 `pageBreak`」寫成確定性算法,讓人類只寫腳本,分鏡自動生成。

## Core Rule

- **頁數 = `voiceovers.length`**。永遠。
- `voiceovers.length <= 1` → skip,不做事。
- 跑完後,`blocks[]` 裡非-`pageBreak` 元素的**順序與內容完全不變**。
- **冪等**:對同一 step 跑兩次結果相同。

**違反鐵律就是違反精神**:不要為了「看起來比較自然」私自塞/刪 block,skill 只動 pageBreak。

## When to Use

- 正在編輯 `public/screenshots/tutorial-ch1/steps.json`(或同結構的 tutorial data)
- 使用者改了 `voiceovers[]` 腳本,要同步重建分鏡
- 頁數跟配音數對不起來 → 音訊被切、動畫提早結束
- 在跑 `voiceover:tutorial` 或 render 前的最後一步

## When NOT to Use

- 單段 voiceover 的 step(`voiceovers.length <= 1`)
- 非 tutorial 的 composition(如 `src/content.ts`, scenes 不走 blocks/pageBreak 模型)
- 資料結構沒有 `voiceovers[]` + `blocks[]` + `type: "pageBreak"`

## Algorithm — 自然斷點 + 均勻目標

**價值序**:單頁資訊完整 → 不太擠 → 留白。**不追求塊數平均**。

### 步驟

1. **Strip** 既有 `pageBreak`(先乾淨化 → 保證冪等)
2. 若 `blocks.length < N`(`N = voiceovers.length`)→ `console.warn` + skip(不硬切)
3. 計算 **N-1 個均勻目標斷點**:`targets[i] = floor(len * (i+1) / N) - 1`,i ∈ [0, N-2]
4. 對每個 target,從 `[t-MAX_DRIFT, t+MAX_DRIFT]` 範圍內(`MAX_DRIFT = 2`)**挑「最佳斷點」**:
   1. **優先**:`image` / `code` / `callout` 之後(這三個是「資訊單位收尾」)
   2. 同級下:**離 target 最近**
   3. 平手:**偏右邊**(index 較大)
   4. 已被用過的 index 不可再選(每個 target 各自的斷點必須不同)
   5. **排除尾端 block**(`idx === len - 1`)當斷點
   6. 範圍內都沒自然斷點 → 就切在 target(可能切在 paragraph 之間,接受)
5. **尾頁反空洞**:若最後一頁只剩 **1 個非-image block**,且把最後一個斷點往前挪 1 格不會踩到上一個斷點且不會讓它變成尾端 → 挪。image 單獨成為尾頁反而有「reveal」效果,不挪。
6. 依 `breakAfter[]` 在每個 index 後插 `pageBreak`

### 為什麼這樣設計

| 原則 | 對應規則 |
|---|---|
| **單頁資訊完整** | 優先在 `image`/`code`/`callout` 後斷 — 這些是 beat 的收尾,斷在這裡不會切開「explain→show」的配對 |
| **不在連續 paragraph 中切** | 自然斷點優先;真的沒有才允許切在 paragraph 之間 |
| **不太擠** | 均勻目標作為起點;MAX_DRIFT 限制不能離目標太遠,避免某頁暴擠 |
| **留白** | 尾頁反空洞規則;image 尾頁保留 |

### 邊界

| 狀況 | 行為 |
|---|---|
| `voiceovers` 缺或 length ≤ 1 | return step 原樣 |
| `blocks.length < N` | `console.warn`,return step(去掉既有 pageBreak) |
| 尾端 image | 不能當斷點(會空尾頁) |
| 既有 `pageBreak` | 一律 strip 後重算 |
| 自然斷點一個都找不到 | 切在 target(paragraph 中間),不擋 |

## Reference Implementation

```typescript
import type { Block, TutorialStep } from "../../src/tutorial/types";

const MAX_DRIFT = 2;
const NATURAL_CLOSERS = new Set<Block["type"]>(["image", "code", "callout"]);

function isNaturalCloser(block: Block): boolean {
  return NATURAL_CLOSERS.has(block.type);
}

function pickBreakpoint(
  clean: Block[],
  target: number,
  used: Set<number>,
): number {
  // 範圍內所有合法候選:idx ∈ [t-DRIFT, t+DRIFT],排除尾端與已用
  type Cand = { idx: number; natural: boolean; dist: number };
  const cands: Cand[] = [];
  for (let d = 0; d <= MAX_DRIFT; d++) {
    for (const sign of d === 0 ? [0] : [1, -1]) {
      const idx = target + sign * d;
      if (idx < 0 || idx >= clean.length - 1) continue; // 不可為尾端
      if (used.has(idx)) continue;
      cands.push({
        idx,
        natural: isNaturalCloser(clean[idx]),
        dist: Math.abs(idx - target),
      });
    }
  }
  if (cands.length === 0) return target; // 保底
  // 排序:natural 優先(true 先)→ dist 小 → idx 大(偏右)
  cands.sort(
    (a, b) =>
      Number(b.natural) - Number(a.natural) ||
      a.dist - b.dist ||
      b.idx - a.idx,
  );
  return cands[0].idx;
}

export function autoInsertPageBreaks(step: TutorialStep): TutorialStep {
  const vos = step.voiceovers;
  if (!vos || vos.length <= 1) return step;
  const N = vos.length;

  // 1. strip existing pageBreaks
  const clean = step.blocks.filter((b) => b.type !== "pageBreak");

  // 2. 不夠切 → skip + warn
  if (clean.length < N) {
    console.warn(
      `[pagebreak] step "${step.id}": ${clean.length} blocks < ${N} voiceovers — skip`,
    );
    return { ...step, blocks: clean };
  }

  // 3. 均勻目標
  const targets = Array.from(
    { length: N - 1 },
    (_, i) => Math.floor((clean.length * (i + 1)) / N) - 1,
  );

  // 4. 對每個 target 挑最佳斷點
  const used = new Set<number>();
  const breakAfter: number[] = [];
  for (const t of targets) {
    const chosen = pickBreakpoint(clean, t, used);
    used.add(chosen);
    breakAfter.push(chosen);
  }
  breakAfter.sort((a, b) => a - b); // pickBreakpoint 可能回傳亂序

  // 5. 尾頁反空洞:最後一頁只剩 1 個非 image block → 把最後斷點往前挪
  const lastBreak = breakAfter[breakAfter.length - 1];
  const lastPageStart = lastBreak + 1;
  const lastPageSize = clean.length - lastPageStart;
  const lastBlock = clean[lastPageStart];
  const prevBreak =
    breakAfter.length > 1 ? breakAfter[breakAfter.length - 2] : -1;
  if (
    lastPageSize === 1 &&
    lastBlock &&
    lastBlock.type !== "image" &&
    lastBreak - 1 > prevBreak &&
    lastBreak - 1 < clean.length - 1
  ) {
    breakAfter[breakAfter.length - 1] = lastBreak - 1;
  }

  // 6. 插入 pageBreak
  const breakSet = new Set(breakAfter);
  const out: Block[] = [];
  for (let i = 0; i < clean.length; i++) {
    out.push(clean[i]);
    if (breakSet.has(i)) out.push({ type: "pageBreak" });
  }
  return { ...step, blocks: out };
}

export function autoInsertAllSteps<T extends { steps: TutorialStep[] }>(
  data: T,
): T {
  return { ...data, steps: data.steps.map(autoInsertPageBreaks) };
}
```

## Usage Pattern

呼叫端(腳本或 CLI 指令)負責 I/O,skill 只管「怎麼算」:

1. 讀目標 JSON(如 `public/screenshots/tutorial-ch1/steps.json`)
2. 對 `data.steps` 每個 step 套 `autoInsertPageBreaks`
3. 寫回 / 印 diff / 輸出到新路徑 —— **由呼叫者決定**,skill 不規定
4. **其他欄位一律不動**:`id` / `title` / `voiceovers` / `pointAt` / `highlightBox` / image `src` / callout 內容 / code text 等全部保留原樣

## Invariants(驗證 skill 跑對的檢查點)

- `splitIntoPages(step.blocks).length === step.voiceovers.length`(若 step 合資格)
- `step.blocks.filter(b => b.type !== "pageBreak")` 跑前跑後完全相等(順序 + 內容)
- `autoInsertPageBreaks(autoInsertPageBreaks(step))` === `autoInsertPageBreaks(step)`

## Common Mistakes

| 錯誤 | 為什麼錯 / 怎麼修 |
|---|---|
| 保留舊 pageBreak 又加新的 | 必須先 strip 再重算,否則頁數爆炸 |
| 在最後一個 block 後插 break | 會生空尾頁,`pageDurationFrames` 拿空 blocks 算出 0 頁時間 |
| 動到 `voiceovers[]` 文字 | 本 skill **只動 `blocks[]` 排序**,腳本改動是另一件事 |
| `blocks.length < N` 時硬切 | 每頁可能變 0 block,應 skip + warn 要求人類補內容或刪 VO |
| 把算法擴大到「靠 LLM 判斷語意分頁」 | 越界。本 skill 是確定性 fallback。需要 LLM 版請另開 skill |

## Red Flags — Stop and Ask

- 使用者跑完 skill 後**手動把某個 pageBreak 拔掉** → 算法對這 step 不適用,先問再調
- 資料結構不是 `voiceovers[]` + `blocks[]` + `type: "pageBreak"` → skill 不適用
- 被要求「依腳本字數加權分塊」或「用 Claude API 判斷語意」 → 超出範圍,另立 skill

## 相關檔案(這個 skill 用到的專案常數)

- `src/tutorial/types.ts` — `Block` / `TutorialStep` 型別
- `src/tutorial/StepScene.tsx:34-45` — `splitIntoPages` 是消費者,pageBreak 在這被切
- `src/tutorial/TutorialComposition.tsx:22-32` — `pageAudioDurationsFor` 用 `pages.length` 對 `voiceovers.length`,本 skill 就是為了保證這兩個相等
