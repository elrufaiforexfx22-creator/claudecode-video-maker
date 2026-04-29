import React from "react";
import {
  AbsoluteFill,
  interpolate,
  spring,
  useCurrentFrame,
  useVideoConfig,
} from "remotion";
import { BLACK, FONT_FAMILY, WHITE } from "../constants";

type Props = {
  accentColor: string;
  title: string; // 例:「恭喜!安裝完成」
  subtitle?: string; // 例:「請看下一集」
  nextChapter?: string; // 例:「開發工具安裝教學」(會用紅色 chip 包起來)
  durationFrames?: number; // 整個 outro Sequence 長度,用來算尾巴 fadeOut 時機
};

export const OUTRO_DURATION_FRAMES = 90; // 3 秒 @ 30fps;Sequence 沒外傳長度時的 fallback
const FADE_OUT_FRAMES = 12;

export const OutroScene: React.FC<Props> = ({
  accentColor,
  title,
  subtitle,
  nextChapter,
  durationFrames,
}) => {
  const frame = useCurrentFrame();
  const { fps, width, height } = useVideoConfig();
  // 9:16 直式時主標改垂直堆疊(✓ 在上 title 在下),字體縮小避免跑版
  const isReel = height > width;

  const titleSpring = spring({
    frame,
    fps,
    config: { damping: 14, mass: 0.6 },
  });

  const subtitleOpacity = interpolate(frame, [18, 32], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  const chipSpring = spring({
    frame: frame - 24,
    fps,
    config: { damping: 12, mass: 0.7 },
  });

  const fadeOutEnd = durationFrames ?? OUTRO_DURATION_FRAMES;
  const fadeOut = interpolate(
    frame,
    [fadeOutEnd - FADE_OUT_FRAMES, fadeOutEnd],
    [1, 0],
    { extrapolateLeft: "clamp", extrapolateRight: "clamp" },
  );

  return (
    <AbsoluteFill
      style={{
        background: WHITE,
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        fontFamily: FONT_FAMILY,
        color: BLACK,
        gap: 40,
        opacity: fadeOut,
      }}
    >
      {/* 主標 — checkmark + title,spring fade-in。
          9:16 直式垂直堆疊(✓ 在上 title 在下),字體縮小避免跑版;
          16:9 維持橫排(原 layout)。 */}
      <div
        style={{
          display: "flex",
          flexDirection: isReel ? "column" : "row",
          alignItems: "center",
          gap: isReel ? 32 : 28,
          opacity: titleSpring,
          transform: `translateY(${(1 - titleSpring) * 20}px)`,
          maxWidth: "90%",
        }}
      >
        <div
          style={{
            width: isReel ? 120 : 96,
            height: isReel ? 120 : 96,
            borderRadius: "50%",
            background: accentColor,
            color: WHITE,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            fontSize: isReel ? 80 : 64,
            fontWeight: 900,
            lineHeight: 1,
            flexShrink: 0,
          }}
        >
          ✓
        </div>
        <div
          style={{
            fontSize: isReel ? 64 : 104,
            fontWeight: 900,
            lineHeight: 1.2,
            textAlign: "center",
          }}
        >
          {title}
        </div>
      </div>

      {/* 副標 + 下一集 chip,排成一橫排 */}
      {subtitle || nextChapter ? (
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 24,
            flexWrap: "wrap",
            justifyContent: "center",
            maxWidth: "85%",
          }}
        >
          {subtitle ? (
            <span
              style={{
                fontSize: 56,
                fontWeight: 700,
                color: "#444",
                opacity: subtitleOpacity,
                transform: `translateY(${(1 - subtitleOpacity) * 12}px)`,
              }}
            >
              {subtitle}
            </span>
          ) : null}
          {nextChapter ? (
            <span
              style={{
                fontSize: 56,
                fontWeight: 900,
                background: accentColor,
                color: WHITE,
                padding: "14px 36px",
                borderRadius: 18,
                opacity: chipSpring,
                transform: `translateY(${(1 - chipSpring) * 18}px) scale(${0.92 + chipSpring * 0.08})`,
                whiteSpace: "nowrap",
              }}
            >
              {nextChapter}
            </span>
          ) : null}
        </div>
      ) : null}
    </AbsoluteFill>
  );
};
