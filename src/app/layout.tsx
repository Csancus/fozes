import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { BottomNav } from "@/components/BottomNav";
import { Sidebar } from "@/components/Sidebar";
import { AppShell } from "@/components/AppShell";
import { themeInitScript } from "@/lib/theme-script";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Élet Portál",
  description: "Főzés, költségek és bakancslista egy helyen.",
};

export const viewport = {
  themeColor: "#18181b",
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="hu"
      // Üveges csempe minden témaszínnél alapból (Story 8.3).
      data-style="csempe"
      // A téma-script (data-theme / data-mode) hidratálás előtt írja át a <html>-t.
      suppressHydrationWarning
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <head>
        <script dangerouslySetInnerHTML={{ __html: themeInitScript }} />
      </head>
      <body className="min-h-full">
        <Sidebar />
        <AppShell>{children}</AppShell>
        <BottomNav />
      </body>
    </html>
  );
}
