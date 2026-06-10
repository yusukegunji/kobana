import type { Metadata } from "next";
import {
  Geist,
  Geist_Mono,
  Bebas_Neue,
  Space_Grotesk,
  Noto_Sans_JP,
} from "next/font/google";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

const bebasNeue = Bebas_Neue({
  variable: "--font-display",
  weight: "400",
  subsets: ["latin"],
});

// メインページ（ステージ）デザイン用フォント
const spaceGrotesk = Space_Grotesk({
  variable: "--font-space-grotesk",
  weight: ["400", "500", "600", "700"],
  subsets: ["latin"],
});

const notoSansJp = Noto_Sans_JP({
  variable: "--font-noto-jp",
  weight: ["400", "500", "700", "800", "900"],
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Kobana - 小噺管理",
  description: "毎日のMTGで披露する小噺の管理サイト",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ja" className="dark">
      <body
        className={`${geistSans.variable} ${geistMono.variable} ${bebasNeue.variable} ${spaceGrotesk.variable} ${notoSansJp.variable} antialiased`}
      >
        {children}
      </body>
    </html>
  );
}
