// KOBANASHI メインページ — 共有のプレゼンテーション部品とユーティリティ

const AVATAR_PALETTE = [
  "#ff9f1c",
  "#2ec27e",
  "#3aa0f0",
  "#9c84fb",
  "#ff6fae",
  "#2dd4c4",
  "#ff6b5e",
];

// 名前から決定的にアバター色を選ぶ（デザインの avatarColor を移植）
export function avatarColor(name: string): string {
  let h = 0;
  for (let i = 0; i < name.length; i++) {
    h = (h * 31 + name.charCodeAt(i)) >>> 0;
  }
  return AVATAR_PALETTE[h % AVATAR_PALETTE.length];
}

// 実データには小噺の種別が無いため、タイトルから推定する
// （「フリートーク」はフリートーク、それ以外はカキトケツアナ＝起承転結のある小噺）
export type TalkType = "free" | "kaki";
export function talkType(title: string): TalkType {
  return title.trim() === "フリートーク" ? "free" : "kaki";
}

interface AvatarProps {
  name: string;
  initial?: string;
  size?: number;
  radius?: number;
}

export function Avatar({ name, initial, size = 44, radius = 13 }: AvatarProps) {
  const c = avatarColor(name);
  const ch = initial || (name || "?").trim()[0];
  return (
    <div
      className="avatar"
      style={{
        width: size,
        height: size,
        borderRadius: radius,
        fontSize: size * 0.4,
        background: `linear-gradient(160deg, ${c}, color-mix(in oklab, ${c} 62%, #000))`,
      }}
    >
      {ch}
    </div>
  );
}

export function TypeTag({ type }: { type: TalkType }) {
  if (type === "kaki") {
    return <span className="tag tag-kaki">カキトケツアナ</span>;
  }
  return <span className="tag tag-free">フリートーク</span>;
}

const LOGO_COLORS = [
  "#3aa0f0",
  "#ff9f1c",
  "#2ec27e",
  "#3aa0f0",
  "#9c84fb",
  "#ff9f1c",
  "#3aa0f0",
  "#ff9f1c",
  "#3aa0f0",
];

export function BrandLogo() {
  const letters = "KOBANASHI".split("");
  return (
    <div className="brand">
      <div className="logo">
        {letters.map((ch, i) => (
          <span
            key={i}
            className="lt"
            style={{
              background: `linear-gradient(160deg, ${LOGO_COLORS[i]}, color-mix(in oklab, ${LOGO_COLORS[i]} 68%, #000))`,
            }}
          >
            {ch}
          </span>
        ))}
      </div>
      <div className="tagline">今 日 も す べ ら な い</div>
    </div>
  );
}
