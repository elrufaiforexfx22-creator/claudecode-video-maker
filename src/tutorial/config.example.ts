import type { TutorialConfig } from "./types";

/**
 * Copy this to `config.ts` and edit for your video.
 * `config.ts` is gitignored so your personal branding stays local.
 * (postinstall 會自動 copy 一份,除非已存在)
 *
 * 浮水印:把圖片丟進 input/images/,取消下面兩行註解並改 import 路徑。
 */
// import watermarkImg from "../../input/images/your-logo.png";

export const TUTORIAL_CONFIG: TutorialConfig = {
  accentColor: "#E63946",
  intro: {
    titleAccent: "Your Topic",
    titleSuffix: "Tutorial",
    platform: { icon: "apple", label: "Mac" },
  },
  // watermark: { src: watermarkImg, size: 80 },  // optional 右下角浮水印
  thumbnail: {
    content: {
      titleParts: ["Audience", "Your Topic", "Value Prop"],
      features: ["Feature 1", "Feature 2", "Feature 3"],
      tagline: "[Your Topic] 最快上手",
      brand: "YOUR_BRAND",
    },
    platformBadge: { icon: "apple", label: "Mac" },
  },
};
