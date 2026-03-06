import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "memefinder",
  description: "Find every meme. Trending, classic, all sources.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
