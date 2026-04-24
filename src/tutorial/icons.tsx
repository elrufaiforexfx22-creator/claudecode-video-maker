import React from "react";
import { AppleLogo } from "./AppleLogo";

// 未來要加 linux / windows 等平台 icon,就在這裡擴展 IconName 聯集
// 和 PLATFORM_ICONS 對應表即可,所有引用點自動跟著擴展。
export type IconName = "apple";

type IconProps = { size: number; color?: string };

export const PLATFORM_ICONS: Record<IconName, React.FC<IconProps>> = {
  apple: AppleLogo,
};
