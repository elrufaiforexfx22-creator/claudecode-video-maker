import React from "react";
import { spring, useCurrentFrame, useVideoConfig } from "remotion";
import { IconRef, SceneVisual } from "../../types";
import { Icon } from "../../icons";
import { BLACK } from "../../constants";

type Props = Extract<SceneVisual, { type: "iconPair" }> & {
  accentColor: string;
};

export const IconPair: React.FC<Props> = ({
  left,
  right,
  connector,
  accentColor,
}) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const leftPop = spring({
    frame: frame - 8,
    fps,
    config: { damping: 12, mass: 0.5 },
  });
  const rightPop = spring({
    frame: frame - 14,
    fps,
    config: { damping: 12, mass: 0.5 },
  });
  const connectorPop = spring({
    frame: frame - 22,
    fps,
    config: { damping: 10, mass: 0.4 },
  });

  return (
    <div style={{ display: "flex", alignItems: "center", gap: 36 }}>
      <Item ref_={left} accentColor={accentColor} scale={leftPop} />
      {connector ? (
        <div
          style={{
            fontSize: 72,
            fontWeight: 900,
            color: BLACK,
            transform: `scale(${connectorPop})`,
          }}
        >
          {connector}
        </div>
      ) : null}
      <Item ref_={right} accentColor={accentColor} scale={rightPop} />
    </div>
  );
};

const Item: React.FC<{
  ref_: IconRef;
  accentColor: string;
  scale: number;
}> = ({ ref_, accentColor, scale }) => (
  <div
    style={{
      transform: `scale(${scale})`,
      display: "flex",
      flexDirection: "column",
      alignItems: "center",
      gap: 14,
    }}
  >
    <Icon ref_={ref_} color={BLACK} accent={accentColor} />
    {ref_.label ? (
      <div style={{ fontSize: 22, fontWeight: 900, letterSpacing: 3 }}>
        {ref_.label}
      </div>
    ) : null}
  </div>
);
