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
  platform?: PlatformBadge; // optional pill below title
};

export const INTRO_DURATION_FRAMES = 60; // 2 秒 @ 30fps

export const IntroScene: React.FC<Props> = ({
  accentColor,
  titleAccent,
  titleSuffix,
  platform,
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

  const fadeOut = interpolate(
    frame,
    [INTRO_DURATION_FRAMES - 10, INTRO_DURATION_FRAMES],
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
