import React from "react";
import { spring, useCurrentFrame, useVideoConfig } from "remotion";
import { IconRef, SceneVisual } from "../../types";
import { Icon } from "../../icons";
import { BLACK } from "../../constants";

type Props = Extract<SceneVisual, { type: "crossedItems" }> & {
  accentColor: string;
};

export const CrossedItems: React.FC<Props> = ({
  left,
  right,
  accentColor,
}) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const leftPop = spring({ frame: frame - 8, fps, config: { damping: 12 } });
  const leftCross = spring({
    frame: frame - 18,
    fps,
    config: { damping: 10 },
  });
  const rightPop = spring({ frame: frame - 16, fps, config: { damping: 12 } });
  const rightCross = spring({
    frame: frame - 26,
    fps,
    config: { damping: 10 },
  });

  return (
    <div style={{ display: "flex", gap: 80 }}>
      <CrossedItem
        ref_={left}
        accentColor={accentColor}
        scale={leftPop}
        crossProgress={leftCross}
      />
      <CrossedItem
        ref_={right}
        accentColor={accentColor}
        scale={rightPop}
        crossProgress={rightCross}
      />
    </div>
  );
};

const CrossedItem: React.FC<{
  ref_: IconRef;
  accentColor: string;
  scale: number;
  crossProgress: number;
}> = ({ ref_, accentColor, scale, crossProgress }) => (
  <div
    style={{
      transform: `scale(${scale})`,
      display: "flex",
      flexDirection: "column",
      alignItems: "center",
      gap: 10,
      position: "relative",
    }}
  >
    <Icon ref_={ref_} color={BLACK} accent={accentColor} />
    {ref_.label ? (
      <div style={{ fontSize: 20, fontWeight: 900, letterSpacing: 3 }}>
        {ref_.label}
      </div>
    ) : null}
    <svg
      width="180"
      height="180"
      viewBox="0 0 180 180"
      style={{
        position: "absolute",
        top: -10,
        left: 10,
        pointerEvents: "none",
      }}
    >
      <line
        x1="30"
        y1="30"
        x2={30 + 120 * crossProgress}
        y2={30 + 120 * crossProgress}
        stroke={accentColor}
        strokeWidth="10"
        strokeLinecap="round"
      />
      <line
        x1="150"
        y1="30"
        x2={150 - 120 * crossProgress}
        y2={30 + 120 * crossProgress}
        stroke={accentColor}
        strokeWidth="10"
        strokeLinecap="round"
      />
    </svg>
  </div>
);
