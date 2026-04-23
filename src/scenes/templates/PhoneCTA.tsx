import React from "react";
import { spring, useCurrentFrame, useVideoConfig } from "remotion";
import { SceneVisual } from "../../types";
import { Icon } from "../../icons";
import { BLACK, WHITE } from "../../constants";

type Props = Extract<SceneVisual, { type: "phoneCTA" }> & {
  accentColor: string;
};

export const PhoneCTA: React.FC<Props> = ({
  senderName,
  senderInitial,
  messagePreview,
  ctaText,
  accentColor,
}) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const phonePop = spring({ frame: frame - 8, fps, config: { damping: 12 } });
  const notifPop = spring({ frame: frame - 24, fps, config: { damping: 10 } });
  const ctaPop = spring({ frame: frame - 40, fps, config: { damping: 12 } });

  const pulse = 1 + Math.sin(frame / 6) * 0.04;
  const arrowShift = Math.sin(frame / 5) * 6;

  return (
    <div style={{ display: "flex", alignItems: "center", gap: 50 }}>
      <div style={{ transform: `scale(${phonePop})`, position: "relative" }}>
        <Icon
          ref_={{ kind: "builtin", name: "phone" }}
          color={BLACK}
          accent={accentColor}
          size={180}
        />
        <div
          style={{
            position: "absolute",
            top: 44,
            left: 20,
            right: 20,
            transform: `scale(${notifPop})`,
            transformOrigin: "center top",
            background: WHITE,
            border: `4px solid ${BLACK}`,
            borderRadius: 12,
            padding: "10px 12px",
            display: "flex",
            alignItems: "center",
            gap: 10,
          }}
        >
          <div
            style={{
              width: 28,
              height: 28,
              borderRadius: 14,
              background: accentColor,
              color: WHITE,
              fontSize: 16,
              fontWeight: 900,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontFamily: "Arial, sans-serif",
            }}
          >
            {senderInitial}
          </div>
          <div style={{ flex: 1 }}>
            <div
              style={{
                fontSize: 12,
                fontWeight: 900,
                color: BLACK,
                letterSpacing: 1,
              }}
            >
              {senderName}
            </div>
            <div style={{ fontSize: 11, color: BLACK, opacity: 0.7 }}>
              {messagePreview}
            </div>
          </div>
        </div>
      </div>

      <div
        style={{
          fontSize: 40,
          color: accentColor,
          transform: `translateX(${-arrowShift}px)`,
          fontWeight: 900,
        }}
      >
        ←
      </div>

      <div
        style={{
          transform: `scale(${ctaPop * pulse})`,
          background: accentColor,
          color: WHITE,
          padding: "22px 40px",
          borderRadius: 16,
          fontSize: 32,
          fontWeight: 900,
          letterSpacing: 2,
          boxShadow: `6px 6px 0 ${BLACK}`,
        }}
      >
        {ctaText}
      </div>
    </div>
  );
};
