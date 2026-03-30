import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "個別相談 お申し込みフォーム｜ワンボディウェルネス",
  description:
    "ワンボディウェルネス 個別相談のお申し込みフォームです。ご希望の日時をお選びのうえ、必要事項をご記入ください。",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ja">
      <body className="min-h-screen bg-gray-50">
        {children}
      </body>
    </html>
  );
}
