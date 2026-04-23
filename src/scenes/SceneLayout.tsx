import React from "react";
import { AbsoluteFill, useCurrentFrame, interpolate } from "remotion";
import { BLACK, FONT_FAMILY, GRAY, WHITE } from "../constants";
import { VideoContent } from "../types";

export const SceneLayout: React.FC<{
  brand: VideoContent["brand"];
  sceneNumber: number;
  totalScenes: number;
  sceneDuration: number;
  children: React.ReactNode;
}> = ({ brand, sceneNumber, totalScenes, sceneDuration, children }) => {
  const frame = useCurrentFrame();

  const safeDuration =
    typeof sceneDuration === "number" &&
    Number.isFinite(sceneDuration) &&
    sceneDuration > 0
      ? sceneDuration
      : 120;

  const fadeIn = interpolate(frame, [0, 8], [0, 1], {
    extrapolateRight: "clamp",
  });
  const fadeOut = interpolate(
    frame,
    [safeDuration - 12, safeDuration],
    [1, 0],
    { extrapolateLeft: "clamp" },
  );

  const opacity = Math.min(fadeIn, fadeOut);

  return (
    <AbsoluteFill
      style={{
        backgroundColor: WHITE,
        color: BLACK,
        fontFamily: FONT_FAMILY,
        opacity,
      }}
    >
      {children}
      <div
        style={{
          position: "absolute",
          bottom: 40,
          right: 60,
          fontSize: 22,
          color: GRAY,
          letterSpacing: 6,
          fontWeight: 700,
        }}
      >
        {String(sceneNumber).padStart(2, "0")}{" "}
        <span style={{ color: "#DDDDDD" }}>/</span>{" "}
        {String(totalScenes).padStart(2, "0")}
      </div>
      <div
        style={{
          position: "absolute",
          bottom: 40,
          left: 60,
          fontSize: 20,
          color: GRAY,
          letterSpacing: 4,
          fontWeight: 700,
        }}
      >
        {brand.name}
        {brand.subtitle ? (
          <>
            <span style={{ color: "#DDDDDD" }}> · </span>
            {brand.subtitle}
          </>
        ) : null}
      </div>
    </AbsoluteFill>
  );
};
