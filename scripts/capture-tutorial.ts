/**
 * scripts/capture-tutorial.ts
 *
 * 爬 claude-code-tutorial.com 第一章「安裝 Claude Code」的步驟內容,
 * 以 blocks[] 有序陣列保留 DOM 順序(paragraph / image / code / callout),
 * 下載所有截圖,輸出到 public/screenshots/tutorial-ch1/。
 *
 * 執行:npm run capture:tutorial
 *
 * Selector 策略(若網站改版需調整這裡):
 *   - 第一章 container:`.chapter[data-chapter="0"]` (第一章 active 的 DOM 區塊)
 *   - chapter heading:該 container 內 `.chapter-header h2` (可能帶 emoji prefix)
 *   - 每步驟:該 container 內 `.step[data-step]`
 *     - title:`.step-title`
 *     - content:`.step-content` 底下各子元素按 DOM 順序轉成 blocks
 *       - <p>              → paragraph
 *       - <img.step-img>   → image
 *       - <div.code-block> → code(取裡面 pre code)
 *       - <div.callout>    → callout(kind = tip / info / warn)
 *
 * 輸出:steps.raw.json(不覆蓋 steps.json,後續 Task 由 post-process 處理)
 */
import { chromium } from "playwright";
import { writeFile, mkdir } from "node:fs/promises";
import { join, extname } from "node:path";

const SOURCE_URL = "https://claude-code-tutorial.com/";
const OUTPUT_DIR = "public/screenshots/tutorial-ch1";
const CHAPTER_HEADING_KEYWORD = "安裝 Claude Code"; // 用來驗證抓到的是正確章節
const EXPECTED_STEP_COUNT = 3;

type Block =
  | { type: "paragraph"; text: string }
  | { type: "image"; src: string; alt: string }
  | { type: "code"; text: string }
  | { type: "callout"; kind: "tip" | "info" | "warn"; icon: string; text: string };

type Step = {
  id: string;
  title: string;
  blocks: Block[];
  pointAt: null; // 階段 2 填
  highlightBox: null; // 階段 3 填
};

function makeSafeTitle(title: string): string {
  return (
    title
      .toLowerCase()
      .replace(/[^\w一-鿿]+/g, "-")
      .replace(/^-|-$/g, "")
      .slice(0, 40) || "step"
  );
}

async function main() {
  await mkdir(OUTPUT_DIR, { recursive: true });

  const browser = await chromium.launch();
  try {
    const page = await browser.newPage({
      viewport: { width: 1440, height: 900 },
    });
    await page.goto(SOURCE_URL, { waitUntil: "networkidle" });

    // 1. 鎖定第一章 container(data-chapter="0")
    //    註:章節是 JS 切換顯示的,部分狀態下會 hidden,只需要 DOM 存在即可。
    const chapter = page.locator('.chapter[data-chapter="0"]');
    await chapter.waitFor({ state: "attached", timeout: 10_000 });

    // 驗證 heading 文字確實包含「安裝 Claude Code」
    const headingText =
      (await chapter.locator(".chapter-header h2").first().textContent()) ?? "";
    if (!headingText.includes(CHAPTER_HEADING_KEYWORD)) {
      throw new Error(
        `章節 heading 不符預期:實際「${headingText.trim()}」,預期包含「${CHAPTER_HEADING_KEYWORD}」`,
      );
    }
    console.log(`章節 heading:${headingText.trim()}`);

    // 2. 強制把章節和所有 step 展開,避免 display:none / collapsed 影響內容讀取。
    //    (網站預設只有第一個 step 是 .open,其他 step body 被 CSS 收起)
    await page.evaluate(() => {
      // 章節本身是 JS 切換 display:none 的;往上走把祖先也打開
      const ch = document.querySelector('.chapter[data-chapter="0"]');
      let node: HTMLElement | null = ch instanceof HTMLElement ? ch : null;
      while (node && node !== document.body) {
        node.style.display = "block";
        node.style.visibility = "visible";
        node.style.opacity = "1";
        node = node.parentElement;
      }
      document.querySelectorAll(".step").forEach((el) => {
        el.classList.add("open");
        if (el instanceof HTMLElement) {
          el.style.display = "block";
        }
      });
      document.querySelectorAll(".step-body").forEach((el) => {
        if (el instanceof HTMLElement) {
          el.style.display = "block";
          el.style.maxHeight = "none";
          el.style.overflow = "visible";
          el.style.opacity = "1";
        }
      });
    });

    // 3. 抓所有 step
    const stepLocators = chapter.locator(".step[data-step]");
    const stepCount = await stepLocators.count();
    console.log(
      `抓到 ${stepCount} 個原始候選,預期 ${EXPECTED_STEP_COUNT} 個。`,
    );

    if (stepCount === 0) {
      throw new Error(
        "沒抓到任何步驟,DOM selector 可能要調整。可在此處加 `await writeFile('/tmp/tutorial.html', await page.content())` 檢查 DOM。",
      );
    }

    // 4. 逐 step 抓 title 並用 block extractor 取 blocks
    const steps: Step[] = [];
    for (let i = 0; i < Math.min(stepCount, EXPECTED_STEP_COUNT); i++) {
      const step = stepLocators.nth(i);

      const title =
        ((await step.locator(".step-title").first().textContent()) ?? "").trim();

      // 用 page.evaluate 走 .step-content 的子元素,按 DOM 順序轉成 blocks
      const blocks: Block[] = await step.evaluate((stepEl) => {
        // tsx 編譯會注入 __name(fn, "fn") 幫匿名箭頭函式命名,但 browser
        // context 沒這個 helper 會噴 ReferenceError。這裡 stub 掉即可。
        (globalThis as unknown as { __name: (fn: unknown) => unknown }).__name =
          (fn) => fn;

        const content = stepEl.querySelector(".step-content");
        if (!content) return [];

        function htmlToMd(el: Element): string {
          let result = "";
          el.childNodes.forEach((node) => {
            if (node.nodeType === 3 /* TEXT */) {
              result += node.textContent ?? "";
            } else if (node.nodeType === 1 /* ELEMENT */) {
              const e = node as Element;
              const tag = e.tagName.toLowerCase();
              const inner = htmlToMd(e);
              if (tag === "strong" || tag === "b") result += `**${inner}**`;
              else if (tag === "code" || tag === "kbd") result += `\`${inner}\``;
              else if (tag === "a") {
                const href = e.getAttribute("href") ?? "";
                result += `[${inner}](${href})`;
              } else if (tag === "br") result += "\n";
              else result += inner; // 不認得的 tag → 只留文字
            }
          });
          // 只壓縮水平空白,保留 <br> 產生的 \n
          return result.replace(/[ \t]+/g, " ").replace(/ *\n */g, "\n").trim();
        }

        const out: Block[] = [];
        Array.from(content.children).forEach((child) => {
          const cls = child.classList;
          const tag = child.tagName.toLowerCase();
          if (tag === "p") {
            const text = htmlToMd(child);
            if (text) out.push({ type: "paragraph", text });
          } else if (tag === "img" && cls.contains("step-img")) {
            out.push({
              type: "image",
              src: (child as HTMLImageElement).src,
              alt: (child as HTMLImageElement).alt ?? "",
            });
          } else if (tag === "div" && cls.contains("code-block")) {
            const codeEl = child.querySelector("pre code");
            if (codeEl?.textContent) {
              out.push({ type: "code", text: codeEl.textContent.trim() });
            }
          } else if (tag === "div" && cls.contains("callout")) {
            const kind: "tip" | "warn" | "info" = cls.contains("tip")
              ? "tip"
              : cls.contains("warn")
                ? "warn"
                : "info";
            const icon =
              child.querySelector(".callout-icon")?.textContent?.trim() ?? "";
            // callout 的文字在第 2 個 <span> 裡(不是 .callout-icon 那個)
            const textSpan = Array.from(child.querySelectorAll("span")).find(
              (s) => !s.classList.contains("callout-icon"),
            );
            const text = textSpan ? htmlToMd(textSpan) : "";
            if (text) out.push({ type: "callout", kind, icon, text });
          }
        });
        return out;
      });

      steps.push({
        id: `ch1-s${i + 1}`,
        title,
        blocks,
        pointAt: null,
        highlightBox: null,
      });
      console.log(
        `  ✓ step ${i + 1}: ${title}(${blocks.length} blocks)`,
      );
    }

    // 5. 全域累計索引下載所有 image block,並改寫 src 為本地相對路徑
    let globalImgIdx = 0;
    for (const step of steps) {
      const safeTitle = makeSafeTitle(step.title);
      let perStepImgCount = 0;
      for (const block of step.blocks) {
        if (block.type !== "image") continue;
        globalImgIdx += 1;
        perStepImgCount += 1;
        const idx = String(globalImgIdx).padStart(2, "0");
        const suffix =
          perStepImgCount === 1
            ? ""
            : `-${String.fromCharCode(96 + perStepImgCount)}`; // -b / -c / ...

        const imgAbsUrl = new URL(block.src, SOURCE_URL).toString();
        const ext = extname(new URL(imgAbsUrl).pathname) || ".png";
        const filename = `${idx}-${safeTitle}${suffix}${ext}`;
        const out = join(OUTPUT_DIR, filename);

        const resp = await page.request.get(imgAbsUrl);
        if (!resp.ok()) {
          throw new Error(`下載失敗 ${imgAbsUrl}: HTTP ${resp.status()}`);
        }
        await writeFile(out, await resp.body());
        block.src = `screenshots/tutorial-ch1/${filename}`;
        console.log(`    ↓ img → ${filename}`);
      }
    }

    const payload = {
      source: SOURCE_URL,
      chapter: headingText.trim(),
      capturedAt: new Date().toISOString(),
      steps,
    };
    await writeFile(
      join(OUTPUT_DIR, "steps.raw.json"),
      JSON.stringify(payload, null, 2),
      "utf8",
    );

    console.log(`\n完成:輸出到 ${OUTPUT_DIR}/steps.raw.json`);
  } finally {
    await browser.close();
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
