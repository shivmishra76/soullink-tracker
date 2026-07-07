import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "SoulLink Tracker",
  description: "Configurable multiplayer Pokemon Soul Link Nuzlocke tracker",
  icons: {
    icon: "/icon.svg"
  }
};

export default function RootLayout({
  children
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="dark">
      <body>{children}</body>
    </html>
  );
}
