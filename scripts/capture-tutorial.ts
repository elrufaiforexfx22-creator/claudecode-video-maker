/**
 * scripts/capture-tutorial.ts
 *
 * 爬 claude-code-tutorial.com 指定章節的步驟內容,
 * 以 blocks[] 有序陣列保留 DOM 順序(paragraph / image / code / callout),
 * 下載所有截圖,輸出到 public/screenshots/<name>/。
 *
 * 用法:
 *   tsx scripts/capture-tutorial.ts <video-name> <chapter-idx>
 *
 *   <video-name>  輸出資料夾名,需以 chN 結尾(N 用來組 step id 前綴)
 *                 例:tutorial-ch2 → step id = ch2-s1, ch2-s2, ...
 *   <chapter-idx> 0-indexed,對應網站 .chapter[data-chapter="N"]
 *                 (站上 ch1 安裝 = 0,ch2 開發工具 = 1,以此類推)
 *
 * 例:tsx scripts/capture-tutorial.ts tutorial-ch2 1
 *
 * Selector 策略(若網站改版需調整這裡):
 *   - 章節 container:`.chapter[data-chapter="<idx>"]`
 *   - chapter heading:該 container 內 `.chapter-header h2`
 *   - 每步驟:該 container 內 `.step[data-step]`
 *     - title:`.step-title`
 *     - content:`.step-content` 底下各子元素按 DOM 順序轉成 blocks
 *       - <p>              → paragraph
 *       - <img.step-img>   → image
 *       - <div.code-block> → code(取裡面 pre code)
 *       - <div.callout>    → callout(kind = tip / info / warn)
 *
 * 輸出:steps.raw.json(不覆蓋 steps.json,後續由人工/Skill 加 voiceovers[] + pageBreak)
 */
import { chromium } from "playwright";
import { writeFile, mkdir } from "node:fs/promises";
import { join, extname } from "node:path";

const SOURCE_URL = "https://claude-code-tutorial.com/";

const [name, chapterIdxStr] = process.argv.slice(2);
if (!name || !chapterIdxStr) {
  console.error(
    "用法:tsx scripts/capture-tutorial.ts <video-name> <chapter-idx>",
  );
  console.error("例:tsx scripts/capture-tutorial.ts tutorial-ch2 1");
  process.exit(1);
}
const chapterIdx = Number(chapterIdxStr);
if (!Number.isInteger(chapterIdx) || chapterIdx < 0) {
  console.error(`chapter-idx 必須為非負整數,實際:${chapterIdxStr}`);
  process.exit(1);
}
const idPrefixMatch = name.match(/ch(\d+)$/);
if (!idPrefixMatch) {
  console.error("video-name 必須以 'chN' 結尾(N = 數字),用來組 step id 前綴");
  process.exit(1);
}
const idPrefix = `ch${idPrefixMatch[1]}`;
const OUTPUT_DIR = `public/screenshots/${name}`;

type Block =
  | { type: "paragraph"; text: string }
  | { type: "image"; src: string; alt: string }
  | { type: "code"; text: string }
  | { type: "callout"; kind: "tip" | "info" | "warn"; icon: string; text: string };

type Step = {
  id: string;
  title: string;
  blocks: Block[];
  pointAt: null;
  highlightBox: null;
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

    // 1. 鎖定指定章節 container
    const chapter = page.locator(`.chapter[data-chapter="${chapterIdx}"]`);
    await chapter.waitFor({ state: "attached", timeout: 10_000 });

    const headingText =
      (await chapter.locator(".chapter-header h2").first().textContent()) ?? "";
    console.log(`章節 heading:${headingText.trim()}`);

    // 2. 強制把章節和所有 step 展開
    await page.evaluate((idx) => {
      const ch = document.querySelector(`.chapter[data-chapter="${idx}"]`);
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
    }, chapterIdx);

    // 3. 抓所有 step
    const stepLocators = chapter.locator(".step[data-step]");
    const stepCount = await stepLocators.count();
    console.log(`抓到 ${stepCount} 個 step。`);

    if (stepCount === 0) {
      throw new Error(
        "沒抓到任何步驟,DOM selector 可能要調整。",
      );
    }

    // 4. 逐 step 抓 title 並取 blocks
    const steps: Step[] = [];
    for (let i = 0; i < stepCount; i++) {
      const step = stepLocators.nth(i);

      const title =
        ((await step.locator(".step-title").first().textContent()) ?? "").trim();

      const blocks: Block[] = await step.evaluate((stepEl) => {
        // tsx 編譯會注入 __name(fn, "fn"),browser context 沒這個 helper 會噴。
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
              else result += inner;
            }
          });
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
        id: `${idPrefix}-s${i + 1}`,
        title,
        blocks,
        pointAt: null,
        highlightBox: null,
      });
      console.log(`  ✓ step ${i + 1}: ${title}(${blocks.length} blocks)`);
    }

    // 5. 全域累計索引下載所有 image,並改寫 src 為本地相對路徑
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
            : `-${String.fromCharCode(96 + perStepImgCount)}`;

        const imgAbsUrl = new URL(block.src, SOURCE_URL).toString();
        const ext = extname(new URL(imgAbsUrl).pathname) || ".png";
        const filename = `${idx}-${safeTitle}${suffix}${ext}`;
        const out = join(OUTPUT_DIR, filename);

        const resp = await page.request.get(imgAbsUrl);
        if (!resp.ok()) {
          throw new Error(`下載失敗 ${imgAbsUrl}: HTTP ${resp.status()}`);
        }
        await writeFile(out, await resp.body());
        block.src = `screenshots/${name}/${filename}`;
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
