import React from "react";
import { RichText } from "../types";

// Parse "[bracketed]" segments into accent-colored spans, and \n into <br/>.
//   "Made with [Claude] + [Remotion]\n快速生成"
// →  Made with <span color>Claude</span> + <span color>Remotion</span><br/>快速生成
export const parseHighlights = (
  text: RichText,
  accentColor: string,
): React.ReactNode => {
  const lines = text.split("\n");
  return lines.map((line, lineIdx) => {
    const parts = line.split(/(\[[^\]]+\])/g);
    return (
      <React.Fragment key={lineIdx}>
        {parts.map((part, i) => {
          if (part.startsWith("[") && part.endsWith("]")) {
            return (
              <span key={i} style={{ color: accentColor }}>
                {part.slice(1, -1)}
              </span>
            );
          }
          return <React.Fragment key={i}>{part}</React.Fragment>;
        })}
        {lineIdx < lines.length - 1 ? <br /> : null}
      </React.Fragment>
    );
  });
};
