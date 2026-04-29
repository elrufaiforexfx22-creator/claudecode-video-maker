import React from "react";
import {
  AbsoluteFill,
  interpolate,
  spring,
  useCurrentFrame,
  useVideoConfig,
} from "remotion";
import { PLATFORM_ICONS } from "./icons";
import type { PlatformBadge } from "./types";
import { BLACK, FONT_FAMILY, WHITE } from "../constants";

type Props = {
  accentColor: string;
  titleAccent: string; // e.g. "Claude Code"
  titleSuffix: string; // e.g. "安裝教學"
  subtitle?: string; // optional tagline 副標
  platform?: PlatformBadge; // optional pill below title
  durationFrames?: number; // 整個 intro Sequence 長度,用來算尾巴 fadeOut 時機
};

export const INTRO_DURATION_FRAMES = 60; // 2 秒 @ 30fps;Sequence 沒外傳長度時的 fallback
const FADE_OUT_FRAMES = 10;

export const IntroScene: React.FC<Props> = ({
  accentColor,
  titleAccent,
  titleSuffix,
  subtitle,
  platform,
  durationFrames,
}) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const titleSpring = spring({
    frame,
    fps,
    config: { damping: 14, mass: 0.6 },
  });

  const macChipOpacity = interpolate(frame, [20, 35], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  // fadeOut 改成「Sequence 尾巴的最後 10 frames」,而不是固定 60 frame 就淡掉。
  // 這樣 audio 講到哪 visual 就保留到哪,沒有空白尾巴。
  const fadeOutEnd = durationFrames ?? INTRO_DURATION_FRAMES;
  const fadeOut = interpolate(
    frame,
    [fadeOutEnd - FADE_OUT_FRAMES, fadeOutEnd],
    [1, 0],
    { extrapolateLeft: "clamp", extrapolateRight: "clamp" },
  );

  const PlatformIcon = platform ? PLATFORM_ICONS[platform.icon] : null;

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
        gap: 28,
        opacity: fadeOut,
      }}
    >
      {/* 主標題 */}
      <div
        style={{
          fontSize: 104,
          fontWeight: 900,
          lineHeight: 1.1,
          opacity: titleSpring,
          transform: `translateY(${(1 - titleSpring) * 20}px)`,
          textAlign: "center",
        }}
      >
        <span style={{ color: accentColor }}>{titleAccent}</span>{" "}
        <span>{titleSuffix}</span>
      </div>

      {/* Optional 副標 / tagline */}
      {subtitle ? (
        <div
          style={{
            fontSize: 48,
            fontWeight: 700,
            color: "#444",
            opacity: macChipOpacity,
            transform: `translateY(${(1 - macChipOpacity) * 12}px)`,
            textAlign: "center",
          }}
        >
          {subtitle}
        </div>
      ) : null}

      {/* Platform pill — render only if platform set */}
      {platform && PlatformIcon ? (
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 20,
            padding: "22px 38px",
            background: "rgba(0,0,0,0.06)",
            borderRadius: 999,
            opacity: macChipOpacity,
            transform: `translateY(${(1 - macChipOpacity) * 12}px)`,
          }}
        >
          <PlatformIcon size={68} color={BLACK} />
          <span
            style={{
              fontSize: 80,
              fontWeight: 700,
              letterSpacing: 1,
            }}
          >
            {platform.label}
          </span>
        </div>
      ) : null}
    </AbsoluteFill>
  );
};
