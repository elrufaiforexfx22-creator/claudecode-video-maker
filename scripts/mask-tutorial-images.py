#!/usr/bin/env python3
"""
scripts/mask-tutorial-images.py

把 tutorial 截圖裡的個資(App 名 / Threads handle / 顯示名 / 大頭照 / post 內容)
用色塊蓋掉,輸出到指定資料夾。

用法:
    .venv/bin/python scripts/mask-tutorial-images.py \\
        --input input/images \\
        --output .worktrees/tutorial-threads-api/public/screenshots/tutorial-threads-api \\
        --config scripts/mask-tutorial-images.config.json

Config JSON 結構(每個 image filename 一個 entry):
{
  "<input-filename>.png": {
    "out": "<output-filename>.png",
    "ocr_mask": ["n8n_threads_0927", "meme.friend.s"],   // OCR 找這些字串遮掉
    "manual_mask": [                                       // 額外手動 bbox(大頭照、無法 OCR 的)
      {"x1": 60, "y1": 200, "x2": 100, "y2": 240, "color": "#000000"}
    ]
  }
}
"""
import argparse
import json
import sys
from pathlib import Path

from PIL import Image, ImageDraw
import pytesseract


def find_text_bboxes(img_path: Path, targets: list[str]) -> list[tuple[int, int, int, int]]:
    """OCR 整張圖,回傳所有命中 targets(子字串)的 bbox(x1, y1, x2, y2)。"""
    img = Image.open(img_path)
    data = pytesseract.image_to_data(
        img,
        lang="chi_tra+eng",
        output_type=pytesseract.Output.DICT,
    )
    matches: list[tuple[int, int, int, int]] = []
    for i, raw in enumerate(data["text"]):
        text = (raw or "").strip()
        if not text:
            continue
        for target in targets:
            # 子字串匹配,涵蓋 OCR 可能少幾個字元
            if target in text or text in target or target.replace(".", "") in text.replace(".", ""):
                x = data["left"][i]
                y = data["top"][i]
                w = data["width"][i]
                h = data["height"][i]
                # 邊界各放大 4px 確保完全蓋住
                matches.append((max(0, x - 4), max(0, y - 4), x + w + 4, y + h + 4))
                break
    return matches


def mask_image(
    in_path: Path,
    out_path: Path,
    ocr_targets: list[str],
    manual_masks: list[dict],
):
    img = Image.open(in_path).convert("RGBA")
    overlay = Image.new("RGBA", img.size, (0, 0, 0, 0))
    draw = ImageDraw.Draw(overlay)

    # 1. OCR-driven masks
    auto_count = 0
    if ocr_targets:
        for bbox in find_text_bboxes(in_path, ocr_targets):
            draw.rectangle(bbox, fill=(0, 0, 0, 255))
            auto_count += 1

    # 2. Manual masks(大頭照、OCR 抓不到的東西)
    manual_count = 0
    for m in manual_masks:
        color = m.get("color", "#000000")
        if color.startswith("#"):
            r = int(color[1:3], 16)
            g = int(color[3:5], 16)
            b = int(color[5:7], 16)
            fill = (r, g, b, 255)
        else:
            fill = (0, 0, 0, 255)
        bbox = (m["x1"], m["y1"], m["x2"], m["y2"])
        draw.rectangle(bbox, fill=fill)
        manual_count += 1

    out_img = Image.alpha_composite(img, overlay).convert("RGB")
    out_path.parent.mkdir(parents=True, exist_ok=True)
    out_img.save(out_path, format="PNG")
    print(f"  ✓ {in_path.name} → {out_path.name}  (OCR: {auto_count} / manual: {manual_count})")


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("--input", required=True, help="原圖資料夾")
    parser.add_argument("--output", required=True, help="輸出資料夾")
    parser.add_argument("--config", required=True, help="JSON 設定檔")
    args = parser.parse_args()

    in_dir = Path(args.input)
    out_dir = Path(args.output)
    config_path = Path(args.config)

    if not config_path.exists():
        print(f"❌ config 不存在:{config_path}", file=sys.stderr)
        sys.exit(1)

    cfg = json.loads(config_path.read_text(encoding="utf-8"))
    print(f"處理 {len(cfg)} 張圖,輸出到 {out_dir}\n")

    for filename, opts in cfg.items():
        in_path = in_dir / filename
        if not in_path.exists():
            print(f"  ✗ 找不到 {in_path}", file=sys.stderr)
            continue
        out_path = out_dir / opts["out"]
        mask_image(
            in_path,
            out_path,
            ocr_targets=opts.get("ocr_mask", []),
            manual_masks=opts.get("manual_mask", []),
        )


if __name__ == "__main__":
    main()
