import type { Metadata } from "next";
import "./globals.css";
import Header from "@/components/Header";

export const metadata: Metadata = {
  title: "UniMatch - 学生起業マッチングプラットフォーム",
  description: "起業を目指す学生がスキルを持つ仲間を見つけてチームを組む。学生限定の起業マッチング掲示板。",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ja">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&family=Noto+Sans+JP:wght@400;500;600;700&display=swap"
          rel="stylesheet"
        />
      </head>
      <body suppressHydrationWarning>
        <div className="bg-grid" />
        <Header />
        <main style={{ paddingTop: 'var(--header-height)' }}>
          {children}
        </main>
      </body>
    </html>
  );
}
