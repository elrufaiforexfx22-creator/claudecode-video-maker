import React from "react";
import { AbsoluteFill } from "remotion";
import { FONT_FAMILY, WHITE } from "./constants";

// LinkedIn 個人 profile 橫幅(1584x396,4:1)。FB 的 tagline 排版塞不下,改為參考 BannerYT
// 的 center hook + corner decorations 結構;沒有 tagline,subline 一行帶過。
export type BannerLIProps = {
  headlineLeft: string;
  headlineAccent: string;
  headlineRight: string;
  subline: string;
  footerLine: string;
  decorLeftTop?: string;
  decorRightBottom?: string;
  primaryColor: string;
};

const BG = "#0F1419";
const SUB_GRAY = "#C5C9D0";
const DECOR_GRAY = "#3A4452";

const CANVAS_W = 1584;
const CANVAS_H = 396;

export const BannerLI: React.FC<BannerLIProps> = ({
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
      {/* 紅色斜帶 accent — 4:1 super-wide,角度淺一點 */}
      <div
        style={{
          position: "absolute",
          left: -100,
          top: CANVAS_H * 0.22,
          width: CANVAS_W + 200,
          height: 4,
          background: primaryColor,
          opacity: 0.6,
          transform: "rotate(-1deg)",
        }}
      />
      <div
        style={{
          position: "absolute",
          left: -100,
          top: CANVAS_H * 0.82,
          width: CANVAS_W + 200,
          height: 2,
          background: primaryColor,
          opacity: 0.3,
          transform: "rotate(-1deg)",
        }}
      />

      {/* 左上角裝飾(LinkedIn profile 大頭照會擋左下,這個位置安全) */}
      {decorLeftTop ? (
        <div
          style={{
            position: "absolute",
            left: 60,
            top: 40,
            fontSize: 18,
            color: DECOR_GRAY,
            fontFamily: `"SF Mono", "Menlo", "Consolas", monospace`,
            letterSpacing: 1,
          }}
        >
          {decorLeftTop}
        </div>
      ) : null}

      {/* 右下裝飾 */}
      {decorRightBottom ? (
        <div
          style={{
            position: "absolute",
            right: 60,
            bottom: 36,
            fontSize: 18,
            color: DECOR_GRAY,
            fontFamily: `"SF Mono", "Menlo", "Consolas", monospace`,
            letterSpacing: 1,
          }}
        >
          {decorRightBottom}
        </div>
      ) : null}

      {/* 中央內容(留意 LinkedIn 大頭照覆蓋左側 ~280px,主標稍微偏右一點) */}
      <div
        style={{
          position: "absolute",
          inset: 0,
          paddingLeft: 320,
          paddingRight: 80,
          display: "flex",
          flexDirection: "column",
          justifyContent: "center",
          alignItems: "flex-start",
          gap: 14,
        }}
      >
        {/* 主標 */}
        <div
          style={{
            fontSize: 60,
            fontWeight: 900,
            letterSpacing: -1.5,
            lineHeight: 1,
            display: "flex",
            alignItems: "center",
            gap: 12,
            whiteSpace: "nowrap",
          }}
        >
          {headlineLeft ? <span>{headlineLeft}</span> : null}
          <span
            style={{
              background: primaryColor,
              color: WHITE,
              padding: "4px 16px",
              borderRadius: 10,
            }}
          >
            {headlineAccent}
          </span>
          {headlineRight ? <span>{headlineRight}</span> : null}
        </div>

        {/* 副標 一行帶過 */}
        <div
          style={{
            fontSize: 22,
            fontWeight: 700,
            color: SUB_GRAY,
            letterSpacing: 0.8,
            whiteSpace: "nowrap",
          }}
        >
          {subline}
        </div>

        {/* footer 強調 */}
        <div
          style={{
            fontSize: 20,
            color: WHITE,
            letterSpacing: 4,
            fontWeight: 900,
            display: "flex",
            alignItems: "center",
            gap: 14,
            marginTop: 6,
          }}
        >
          <div
            style={{
              width: 50,
              height: 3,
              background: primaryColor,
            }}
          />
          {footerLine}
        </div>
      </div>
    </AbsoluteFill>
  );
};
