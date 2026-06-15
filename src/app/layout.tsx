import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "TexSet — LaTeX Editor",
  description:
    "A fast, self-hosted LaTeX editor with real-time preview. Offline-first, open source, runs anywhere via Docker.",
  keywords: ["latex", "editor", "self-hosted", "docker", "texset", "overleaf alternative"],
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <link rel="icon" href="/TexSet.svg" type="image/svg+xml" />
        <link rel="icon" href="/TexSet.png" type="image/png" />
      </head>
      <body className="antialiased">
        {children}
      </body>
    </html>
  );
}
