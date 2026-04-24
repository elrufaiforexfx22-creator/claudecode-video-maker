import React from "react";
import { AbsoluteFill } from "remotion";
import { ThumbnailYT, ThumbnailProps } from "../thumbnails/ThumbnailYT";
import { ThumbnailIG } from "../thumbnails/ThumbnailIG";
import { ThumbnailReel } from "../thumbnails/ThumbnailReel";
import { PLATFORM_ICONS } from "./icons";
import type { PlatformBadge } from "./types";
import { BLACK, FONT_FAMILY } from "../constants";

type BadgeSize = {
  bottom: number;
  right: number;
  logo: number;
  text: number;
  padV: number;
  padH: number;
  gap: number;
};

export type TutorialThumbnailProps = ThumbnailProps & {
  platformBadge?: PlatformBadge;
};

/**
 * 平台膠囊 overlay。沿用主影片的 ThumbnailYT/IG/Reel 完整版型,
 * 在不會擋到任何文字的右下角空位疊一個小標,表明平台歸屬。
 * platformBadge 為空則完全不渲染。
 */
const BadgeOverlay: React.FC<BadgeSize & { platformBadge?: PlatformBadge }> = ({
  platformBadge,
  bottom,
  right,
  logo,
  text,
  padV,
  padH,
  gap,
}) => {
  if (!platformBadge) return null;
  const Icon = PLATFORM_ICONS[platformBadge.icon];
  return (
    <div
      style={{
        position: "absolute",
        bottom,
        right,
        display: "flex",
        alignItems: "center",
        gap,
        padding: `${padV}px ${padH}px`,
        background: "rgba(0,0,0,0.08)",
        borderRadius: 999,
        fontFamily: FONT_FAMILY,
        color: BLACK,
      }}
    >
      <Icon size={logo} color={BLACK} />
      <span style={{ fontSize: text, fontWeight: 700, letterSpacing: 1 }}>
        {platformBadge.label}
      </span>
    </div>
  );
};

export const TutorialThumbnailYT: React.FC<TutorialThumbnailProps> = ({
  platformBadge,
  ...props
}) => (
  <AbsoluteFill>
    <ThumbnailYT {...props} />
    <BadgeOverlay
      platformBadge={platformBadge}
      bottom={52}
      right={56}
      logo={40}
      text={32}
      padV={8}
      padH={18}
      gap={10}
    />
  </AbsoluteFill>
);

export const TutorialThumbnailIG: React.FC<TutorialThumbnailProps> = ({
  platformBadge,
  ...props
}) => (
  <AbsoluteFill>
    <ThumbnailIG {...props} />
    <BadgeOverlay
      platformBadge={platformBadge}
      bottom={56}
      right={60}
      logo={48}
      text={38}
      padV={10}
      padH={22}
      gap={12}
    />
  </AbsoluteFill>
);

export const TutorialThumbnailReel: React.FC<TutorialThumbnailProps> = ({
  platformBadge,
  ...props
}) => (
  <AbsoluteFill>
    <ThumbnailReel {...props} />
    <BadgeOverlay
      platformBadge={platformBadge}
      bottom={72}
      right={60}
      logo={56}
      text={44}
      padV={12}
      padH={26}
      gap={14}
    />
  </AbsoluteFill>
);
