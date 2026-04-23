import { loadFont } from "@remotion/google-fonts/NotoSansTC";

const { fontFamily: notoSansTC } = loadFont("normal", {
  weights: ["400", "700", "900"],
});

// Font stack covers Latin + Traditional Chinese + Japanese fallbacks.
// If your video is English-only you can replace this with anything.
export const FONT_FAMILY = `${notoSansTC}, "PingFang TC", "Microsoft JhengHei", system-ui, sans-serif`;

// Color tokens used by scene templates. Accent (red by default) is
// content-driven via content.brand.primaryColor — these are the
// neutral colors templates rely on.
export const BLACK = "#111111";
export const GRAY = "#A0A0A0";
export const WHITE = "#FFFFFF";
