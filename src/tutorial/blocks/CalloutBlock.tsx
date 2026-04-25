import React from "react";
import { CalloutBlock as CalloutBlockType } from "../types";
import { MarkdownLite } from "../markdown-lite";
import { BLACK, FONT_FAMILY } from "../../constants";

type Props = {
  block: CalloutBlockType;
  accentColor: string;
};

const KIND_COLORS: Record<CalloutBlockType["kind"], { bg: string; border: string }> = {
  tip:  { bg: "#FFF8E1", border: "#FFC107" },
  info: { bg: "#E3F2FD", border: "#2196F3" },
  warn: { bg: "#FFEBEE", border: "#F44336" },
};

export const CalloutBlock: React.FC<Props> = ({ block, accentColor }) => {
  const { bg, border } = KIND_COLORS[block.kind];
  const isHero = block.size === "hero";

  if (isHero) {
    // 結尾用 finale 卡片:icon + 文字大字置中,佔半張畫面,觀眾看了 1 秒就懂「結束了」
    return (
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          gap: 32,
          padding: "64px 80px",
          background: bg,
          border: `8px solid ${border}`,
          borderRadius: 24,
          maxWidth: 1400,
          width: "100%",
          minHeight: 360,
          fontFamily: FONT_FAMILY,
          textAlign: "center",
        }}
      >
        <div style={{ fontSize: 120, lineHeight: 1 }}>{block.icon}</div>
        <div
          style={{
            fontSize: 56,
            fontWeight: 800,
            lineHeight: 1.4,
            color: BLACK,
          }}
        >
          <MarkdownLite text={block.text} accentColor={accentColor} />
        </div>
      </div>
    );
  }

  return (
    <div
      style={{
        display: "flex",
        gap: 16,
        padding: "20px 28px",
        background: bg,
        borderLeft: `6px solid ${border}`,
        borderRadius: 8,
        maxWidth: 1400,
        width: "100%",
        fontFamily: FONT_FAMILY,
      }}
    >
      <div style={{ fontSize: 32, lineHeight: 1 }}>{block.icon}</div>
      <div style={{ fontSize: 28, lineHeight: 1.5, color: BLACK, flex: 1 }}>
        <MarkdownLite text={block.text} accentColor={accentColor} />
      </div>
    </div>
  );
};
