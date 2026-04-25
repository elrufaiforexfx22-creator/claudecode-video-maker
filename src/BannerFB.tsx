import React from "react";
import { AbsoluteFill } from "remotion";
import { FONT_FAMILY, WHITE } from "./constants";

export type BannerFBProps = {
  headlineLeft: string;
  headlineAccent: string;
  headlineRight: string;
  subline: string;
  footerLine: string;
  // 最底下的長句,陣列每一個元素會獨立成一行;空陣列就不顯示
  tagline: string[];
  primaryColor: string;
};

const BG = "#0F1419";
const SUB_GRAY = "#C5C9D0";

const CANVAS_W = 1640;
const CANVAS_H = 624;

export const BannerFB: React.FC<BannerFBProps> = ({
  headlineLeft,
  headlineAccent,
  headlineRight,
  subline,
  footerLine,
  tagline,
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
      {/* 紅色斜帶 accent — 比 YT 短一點,不會穿過字 */}
      <div
        style={{
          position: "absolute",
          left: -100,
          top: CANVAS_H * 0.18,
          width: CANVAS_W + 200,
          height: 5,
          background: primaryColor,
          opacity: 0.6,
          transform: "rotate(-1.5deg)",
        }}
      />
      <div
        style={{
          position: "absolute",
          left: -100,
          top: CANVAS_H * 0.84,
          width: CANVAS_W + 200,
          height: 2,
          background: primaryColor,
          opacity: 0.3,
          transform: "rotate(-1.5deg)",
        }}
      />

      {/* 中央內容 */}
      <div
        style={{
          position: "absolute",
          inset: 0,
          display: "flex",
          flexDirection: "column",
          justifyContent: "center",
          alignItems: "center",
          gap: 26,
          padding: "0 80px",
        }}
      >
        {/* 主標 */}
        <div
          style={{
            fontSize: 84,
            fontWeight: 900,
            letterSpacing: -2,
            lineHeight: 1,
            display: "flex",
            alignItems: "center",
            gap: 14,
            whiteSpace: "nowrap",
          }}
        >
          {headlineLeft ? <span>{headlineLeft}</span> : null}
          <span
            style={{
              background: primaryColor,
              color: WHITE,
              padding: "6px 22px",
              borderRadius: 12,
            }}
          >
            {headlineAccent}
          </span>
          {headlineRight ? <span>{headlineRight}</span> : null}
        </div>

        {/* 副標 */}
        <div
          style={{
            fontSize: 30,
            fontWeight: 700,
            color: SUB_GRAY,
            letterSpacing: 1,
            whiteSpace: "nowrap",
          }}
        >
          {subline}
        </div>

        {/* 底部強調 tag */}
        <div
          style={{
            fontSize: 32,
            color: WHITE,
            letterSpacing: 5,
            fontWeight: 900,
            display: "flex",
            alignItems: "center",
            gap: 18,
            marginTop: 4,
          }}
        >
          <div
            style={{
              width: 80,
              height: 4,
              background: primaryColor,
            }}
          />
          {footerLine}
          <div
            style={{
              width: 80,
              height: 4,
              background: primaryColor,
            }}
          />
        </div>

        {/* 長句 tagline,放在 footer 底下 */}
        {tagline && tagline.length > 0 ? (
          <div
            style={{
              marginTop: 8,
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              gap: 6,
              fontSize: 22,
              fontWeight: 500,
              color: "#9098A4",
              lineHeight: 1.35,
              letterSpacing: 0.5,
              textAlign: "center",
            }}
          >
            {tagline.map((line, i) => (
              <div key={i}>{line}</div>
            ))}
          </div>
        ) : null}
      </div>
    </AbsoluteFill>
  );
};
