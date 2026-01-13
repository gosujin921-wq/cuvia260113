import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "CUVIA Pro - 통합 관제 시스템",
  description: "CUVIA 통합 시나리오 v1.2 - 사람 주도 + AI Agent 협업형 관제 시스템",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" style={{ width: '100vw', height: '100vh', maxHeight: '100vh', margin: 0, padding: 0, overflow: 'hidden', position: 'fixed', top: 0, left: 0, right: 0, bottom: 0 }}>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
        style={{ width: '100vw', height: '100vh', maxHeight: '100vh', margin: 0, padding: 0, overflow: 'hidden', position: 'fixed', top: 0, left: 0, right: 0, bottom: 0 }}
      >
        {children}
      </body>
    </html>
  );
}
