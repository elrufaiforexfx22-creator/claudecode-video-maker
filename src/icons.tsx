import React from "react";
import { IconName, IconRef } from "./types";

// ---------------------------------------------------------------
// Built-in SVG icons. Add your own by extending IconName in
// types.ts and adding a case here.
// ---------------------------------------------------------------

type IconProps = {
  size?: number;
  color: string; // black/foreground color
  accent: string; // brand accent color
  bg?: string;
};

const BoxFrame: React.FC<{
  size: number;
  color: string;
  bg: string;
  children: React.ReactNode;
}> = ({ size, color, bg, children }) => (
  <svg width={size} height={size} viewBox="0 0 160 160">
    <rect
      x="6"
      y="6"
      width="148"
      height="148"
      rx="24"
      fill={bg}
      stroke={color}
      strokeWidth="6"
    />
    {children}
  </svg>
);

const ICONS: Record<IconName, React.FC<IconProps>> = {
  claudeCode: ({ size = 160, color, accent, bg = "#fff" }) => (
    <BoxFrame size={size} color={color} bg={bg}>
      <path
        d="M 40 110 L 56 70 L 72 110 M 46 94 L 66 94"
        stroke={color}
        strokeWidth="6"
        strokeLinecap="round"
        strokeLinejoin="round"
        fill="none"
      />
      <path
        d="M 90 70 L 90 110 L 120 110"
        stroke={accent}
        strokeWidth="6"
        strokeLinecap="round"
        strokeLinejoin="round"
        fill="none"
      />
      <text
        x="80"
        y="140"
        textAnchor="middle"
        fontSize="14"
        fontWeight="900"
        fill={color}
        letterSpacing="2"
        fontFamily="Arial, sans-serif"
      >
        CLAUDE CODE
      </text>
    </BoxFrame>
  ),

  remotion: ({ size = 160, color, accent, bg = "#fff" }) => (
    <BoxFrame size={size} color={color} bg={bg}>
      <polygon
        points="66,54 112,80 66,106"
        fill={accent}
        stroke={color}
        strokeWidth="5"
        strokeLinejoin="round"
      />
      <text
        x="80"
        y="140"
        textAnchor="middle"
        fontSize="14"
        fontWeight="900"
        fill={color}
        letterSpacing="2"
        fontFamily="Arial, sans-serif"
      >
        REMOTION
      </text>
    </BoxFrame>
  ),

  editor: ({ size = 160, color, bg = "#fff" }) => (
    <svg width={size} height={(size * 140) / 160} viewBox="0 0 160 140">
      <rect
        x="6"
        y="6"
        width="148"
        height="108"
        rx="10"
        fill={bg}
        stroke={color}
        strokeWidth="5"
      />
      <rect x="14" y="14" width="132" height="24" rx="4" fill={color} opacity="0.15" />
      <rect x="14" y="48" width="80" height="58" rx="4" fill={color} opacity="0.1" />
      <polygon points="42,62 42,92 64,77" fill={color} />
      <rect x="102" y="48" width="44" height="26" rx="4" fill={color} opacity="0.1" />
      <rect x="102" y="80" width="44" height="26" rx="4" fill={color} opacity="0.1" />
      <rect x="60" y="120" width="40" height="10" rx="2" fill={color} />
    </svg>
  ),

  code: ({ size = 160, color, bg = "#fff" }) => (
    <svg width={size} height={(size * 140) / 160} viewBox="0 0 160 140">
      <rect
        x="6"
        y="6"
        width="148"
        height="108"
        rx="10"
        fill={bg}
        stroke={color}
        strokeWidth="5"
      />
      <circle cx="22" cy="22" r="4" fill={color} opacity="0.4" />
      <circle cx="36" cy="22" r="4" fill={color} opacity="0.4" />
      <circle cx="50" cy="22" r="4" fill={color} opacity="0.4" />
      <path
        d="M 40 60 L 22 78 L 40 96"
        stroke={color}
        strokeWidth="6"
        strokeLinecap="round"
        strokeLinejoin="round"
        fill="none"
      />
      <path
        d="M 120 60 L 138 78 L 120 96"
        stroke={color}
        strokeWidth="6"
        strokeLinecap="round"
        strokeLinejoin="round"
        fill="none"
      />
      <line
        x1="76"
        y1="54"
        x2="92"
        y2="100"
        stroke={color}
        strokeWidth="6"
        strokeLinecap="round"
      />
      <rect x="60" y="120" width="40" height="10" rx="2" fill={color} />
    </svg>
  ),

  animation: ({ size = 160, color, accent, bg = "#fff" }) => {
    // Note: this is a static rendering used inside scene templates;
    // the IconPair template animates a wrapper around this.
    return (
      <svg width={size} height={(size * 140) / 160} viewBox="0 0 180 160">
        <rect
          x="6"
          y="6"
          width="168"
          height="128"
          rx="14"
          fill={bg}
          stroke={color}
          strokeWidth="5"
        />
        <rect x="30" y="60" width="30" height="30" rx="4" fill={accent} />
        <circle cx="90" cy="70" r="18" fill={color} />
        <polygon points="140,55 160,95 120,95" fill={accent} />
      </svg>
    );
  },

  voice: ({ size = 160, color, accent, bg = "#fff" }) => {
    const bars = 9;
    const centerX = 90;
    const barWidth = 10;
    const gap = 6;
    const totalWidth = bars * (barWidth + gap) - gap;
    const startX = centerX - totalWidth / 2;
    return (
      <svg width={size} height={(size * 140) / 160} viewBox="0 0 180 160">
        <rect
          x="6"
          y="6"
          width="168"
          height="128"
          rx="14"
          fill={bg}
          stroke={color}
          strokeWidth="5"
        />
        {Array.from({ length: bars }).map((_, i) => {
          const heights = [40, 60, 30, 70, 50, 80, 35, 55, 45];
          const h = heights[i];
          return (
            <rect
              key={i}
              x={startX + i * (barWidth + gap)}
              y={70 - h / 2}
              width={barWidth}
              height={h}
              rx="3"
              fill={i === 3 || i === 5 ? accent : color}
            />
          );
        })}
      </svg>
    );
  },

  phone: ({ size = 180, color, bg = "#fff" }) => (
    <svg
      width={size}
      height={(size * 260) / 180}
      viewBox="0 0 180 260"
    >
      <rect
        x="10"
        y="10"
        width="160"
        height="240"
        rx="24"
        fill={bg}
        stroke={color}
        strokeWidth="6"
      />
      <rect x="70" y="20" width="40" height="8" rx="4" fill={color} />
      <rect
        x="22"
        y="40"
        width="136"
        height="190"
        rx="8"
        fill={color}
        opacity="0.05"
      />
      <rect x="64" y="238" width="52" height="6" rx="3" fill={color} />
    </svg>
  ),

  terminal: ({ size = 160, color, bg = "#fff" }) => (
    <svg width={size} height={(size * 140) / 160} viewBox="0 0 160 140">
      <rect
        x="6"
        y="6"
        width="148"
        height="108"
        rx="10"
        fill={bg}
        stroke={color}
        strokeWidth="5"
      />
      <rect x="6" y="6" width="148" height="22" rx="10" fill={color} />
      <text x="80" y="80" textAnchor="middle" fontSize="56" fill={color}>
        $_
      </text>
    </svg>
  ),

  rocket: ({ size = 160, color, accent, bg = "#fff" }) => (
    <BoxFrame size={size} color={color} bg={bg}>
      <path
        d="M 80 30 C 100 50 110 80 100 110 L 60 110 C 50 80 60 50 80 30 Z"
        fill={accent}
        stroke={color}
        strokeWidth="5"
      />
      <circle cx="80" cy="70" r="10" fill={bg} stroke={color} strokeWidth="4" />
      <path d="M 60 110 L 50 130 L 70 120 Z" fill={color} />
      <path d="M 100 110 L 110 130 L 90 120 Z" fill={color} />
    </BoxFrame>
  ),

  spark: ({ size = 160, color, accent, bg = "#fff" }) => (
    <BoxFrame size={size} color={color} bg={bg}>
      <polygon
        points="80,30 92,72 130,80 92,88 80,130 68,88 30,80 68,72"
        fill={accent}
        stroke={color}
        strokeWidth="4"
        strokeLinejoin="round"
      />
    </BoxFrame>
  ),

  chat: ({ size = 160, color, accent, bg = "#fff" }) => (
    <BoxFrame size={size} color={color} bg={bg}>
      <rect
        x="30"
        y="44"
        width="100"
        height="60"
        rx="12"
        fill={accent}
        stroke={color}
        strokeWidth="4"
      />
      <path d="M 60 104 L 70 118 L 80 104 Z" fill={accent} stroke={color} strokeWidth="4" />
      <circle cx="60" cy="74" r="5" fill={color} />
      <circle cx="80" cy="74" r="5" fill={color} />
      <circle cx="100" cy="74" r="5" fill={color} />
    </BoxFrame>
  ),
};

export const Icon: React.FC<{
  ref_: IconRef;
  size?: number;
  color: string;
  accent: string;
  bg?: string;
}> = ({ ref_, size, color, accent, bg }) => {
  if (ref_.kind === "emoji") {
    return (
      <div
        style={{
          fontSize: size ?? 120,
          lineHeight: 1,
          width: size ?? 160,
          height: size ?? 160,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        {ref_.char}
      </div>
    );
  }
  const Comp = ICONS[ref_.name];
  return <Comp size={size} color={color} accent={accent} bg={bg} />;
};
