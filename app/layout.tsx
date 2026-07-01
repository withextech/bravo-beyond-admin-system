import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Bravo & Beyond Admin System",
  description: "Internal admin system for Bravo & Beyond operations and website CMS.",
  icons: {
    icon: "/favicon.ico"
  }
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
