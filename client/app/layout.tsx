import type { Metadata } from "next";
import { Nunito } from "next/font/google";
import "./globals.css";


const nunito = Nunito({
  variable: "--font-nunito",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700", "800"],
});

export const metadata: Metadata = {
  title: "Hidden Word Duel",
  description: "Real-time multiplayer word guessing game",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${nunito.variable}  h-full antialiased`}
    >
      <body className="min-h-full flex flex-col" style={{ fontFamily: "var(--font-nunito)" }}>{children}</body>
    </html>
  );
}
