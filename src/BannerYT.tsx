import React from "react";
import { AbsoluteFill } from "remotion";
import { FONT_FAMILY, WHITE } from "./constants";

export type BannerYTProps = {
  // 中央主標(放在 mobile-safe 1546x423 區),顯眼的 hook
  headlineLeft: string; // 例:「一鍵生成」
  headlineAccent: string; // 例:「影片」(紅色 chip 包起來)
  headlineRight: string; // 例:「懶人工具」
  // 副標(整合的工具 / 流程,放主標下面)
  subline: string; // 例:「Claude Code × Remotion × ElevenLabs × 自動發片到 YT / IG / Threads」
  // 底部小字(channel slogan / handle)
  footerLine: string; // 例:「OPEN SOURCE · alex_wang.dev」
  // 兩側裝飾(desktop / TV 才看得到,mobile 不顯示),要關就設空字串
  decorLeftTop?: string; // 左上角小字
  decorRightBottom?: string; // 右下角小字
  primaryColor: string; // 跟其他縮圖共用的 brand 顏色
};

const BG = "#0F1419";
const SUB_GRAY = "#C5C9D0";
const DECOR_GRAY = "#3A4452";

// YouTube banner safe-area:中間 1546x423 是 mobile 也看得到的區
const SAFE_W = 1546;
const SAFE_H = 423;
const CANVAS_W = 2560;
const CANVAS_H = 1440;

export const BannerYT: React.FC<BannerYTProps> = ({
  headlineLeft,
  headlineAccent,
  headlineRight,
  subline,
  footerLine,
  decorLeftTop,
  decorRightBottom,
  primaryColor,
}) => {
  return (
    <AbsoluteFill
      style={{
        backgroundColor: BG,
        fontFamily: FONT_FAMILY,
        color: WHITE,
      }}
    >
      {/* 背景紅色 accent 斜帶,加點視覺重量 */}
      <div
        style={{
          position: "absolute",
          left: -200,
          top: CANVAS_H * 0.35,
          width: CANVAS_W + 400,
          height: 6,
          background: primaryColor,
          opacity: 0.6,
          transform: "rotate(-2deg)",
        }}
      />
      <div
        style={{
          position: "absolute",
          left: -200,
          top: CANVAS_H * 0.68,
          width: CANVAS_W + 400,
          height: 2,
          background: primaryColor,
          opacity: 0.3,
          transform: "rotate(-2deg)",
        }}
      />

      {/* 左上裝飾 — 終端機風格 */}
      {decorLeftTop ? (
        <div
          style={{
            position: "absolute",
            left: 100,
            top: 110,
            fontSize: 36,
            color: DECOR_GRAY,
            fontFamily: `"SF Mono", "Menlo", "Consolas", monospace`,
            letterSpacing: 1,
          }}
        >
          {decorLeftTop}
        </div>
      ) : null}

      {/* 右下裝飾 — 流向多平台 */}
      {decorRightBottom ? (
        <div
          style={{
            position: "absolute",
            right: 100,
            bottom: 110,
            fontSize: 36,
            color: DECOR_GRAY,
            fontFamily: `"SF Mono", "Menlo", "Consolas", monospace`,
            letterSpacing: 1,
          }}
        >
          {decorRightBottom}
        </div>
      ) : null}

      {/* 中央 mobile-safe 區 */}
      <div
        style={{
          position: "absolute",
          left: (CANVAS_W - SAFE_W) / 2,
          top: (CANVAS_H - SAFE_H) / 2,
          width: SAFE_W,
          height: SAFE_H,
          display: "flex",
          flexDirection: "column",
          justifyContent: "center",
          alignItems: "center",
          gap: 36,
        }}
      >
        {/* 主標 */}
        <div
          style={{
            fontSize: 120,
            fontWeight: 900,
            letterSpacing: -3,
            lineHeight: 1,
            display: "flex",
            alignItems: "center",
            gap: 18,
            whiteSpace: "nowrap",
          }}
        >
          {headlineLeft ? <span>{headlineLeft}</span> : null}
          <span
            style={{
              background: primaryColor,
              color: WHITE,
              padding: "8px 28px",
              borderRadius: 16,
            }}
          >
            {headlineAccent}
          </span>
          {headlineRight ? <span>{headlineRight}</span> : null}
        </div>

        {/* 副標 */}
        <div
          style={{
            fontSize: 38,
            fontWeight: 700,
            color: SUB_GRAY,
            letterSpacing: 1,
            whiteSpace: "nowrap",
          }}
        >
          {subline}
        </div>

        {/* 底部 tag — 強調用 */}
        <div
          style={{
            fontSize: 42,
            color: WHITE,
            letterSpacing: 6,
            fontWeight: 900,
            display: "flex",
            alignItems: "center",
            gap: 22,
            marginTop: 12,
          }}
        >
          <div
            style={{
              width: 110,
              height: 5,
              background: primaryColor,
            }}
          />
          {footerLine}
          <div
            style={{
              width: 110,
              height: 5,
              background: primaryColor,
            }}
          />
        </div>
      </div>
    </AbsoluteFill>
  );
};
