import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Notion Clone",
  description: "A Notion-style notes app with a Claude-powered AI panel.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
