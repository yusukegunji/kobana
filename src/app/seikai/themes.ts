// 「それ正解」のお題生成
// お題は必ず「『あ』から始まる動物」の体裁にする。
// ランダムなひらがな1文字 × カテゴリの組み合わせで作る。

// 語頭に使えるひらがな。「ん」「を」と現代語で使わない仮名は除く
const THEME_KANA: readonly string[] = [
  "あ", "い", "う", "え", "お",
  "か", "き", "く", "け", "こ",
  "さ", "し", "す", "せ", "そ",
  "た", "ち", "つ", "て", "と",
  "な", "に", "ぬ", "ね", "の",
  "は", "ひ", "ふ", "へ", "ほ",
  "ま", "み", "む", "め", "も",
  "や", "ゆ", "よ",
  "ら", "り", "る", "れ", "ろ",
  "わ",
];

// どの仮名と組み合わせても答えが出せる程度に広いカテゴリを選ぶ
const THEME_CATEGORIES: readonly string[] = [
  "動物",
  "食べもの",
  "飲みもの",
  "国の名前",
  "日本の地名",
  "スポーツ",
  "有名人",
  "アニメ・マンガのタイトル",
  "映画のタイトル",
  "職業",
  "会社にありそうなもの",
  "コンビニで売っているもの",
  "家にある電化製品",
  "カバンに入っているもの",
  "IT・プログラミング用語",
];

// 同じお題が続くとボタンが効いていないように見えるため、数回だけ引き直す
const MAX_RETRY = 5;

function randomOf(items: readonly string[]): string {
  return items[Math.floor(Math.random() * items.length)];
}

function buildTheme(): string {
  return `「${randomOf(THEME_KANA)}」から始まる${randomOf(THEME_CATEGORIES)}`;
}

// 現在のお題とは違うお題をランダムに1つ返す
export function pickRandomTheme(current: string): string {
  let theme = buildTheme();
  for (let i = 0; i < MAX_RETRY && theme === current; i++) {
    theme = buildTheme();
  }
  return theme;
}
