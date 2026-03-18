import type { KobanashiStatus } from "./types";

export const STATUS_OPTIONS: { value: KobanashiStatus; label: string }[] = [
  { value: "未対応", label: "未対応" },
  { value: "対応済", label: "対応済" },
  { value: "凍結", label: "凍結" },
  { value: "対応不要", label: "対応不要" },
];

export const STATUS_COLORS: Record<KobanashiStatus, string> = {
  未対応: "bg-yellow-900/40 text-yellow-300",
  対応済: "bg-green-900/40 text-green-300",
  凍結: "bg-blue-900/40 text-blue-300",
  対応不要: "bg-gray-800/40 text-gray-400",
};
