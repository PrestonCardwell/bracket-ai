import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Bracket AI",
  description: "AI-powered NCAA tournament bracket builder",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="min-h-screen antialiased">{children}</body>
    </html>
  );
}
