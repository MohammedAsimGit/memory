import type { Metadata, Viewport } from "next";
import "./globals.css";
import ThemeProvider from "@/components/layout/ThemeProvider";
import { ThemeScript } from "./theme-script";

export const metadata: Metadata = {
  title: "Our Story",
  description: "A private digital memory book for two people in love",
  manifest: "/manifest.json",
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "Our Story",
  },
  icons: {
    icon: "/icons/icon-192.png",
    apple: "/icons/icon-192.png",
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  viewportFit: "cover",
  themeColor: "#2196F3",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="h-full" suppressHydrationWarning>
      <head>
        <link
          href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800;900&display=swap"
          rel="stylesheet"
        />
        <link rel="apple-touch-icon" href="/icons/icon-192.png" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />
        <meta name="apple-mobile-web-app-title" content="Our Story" />
        <meta name="mobile-web-app-capable" content="yes" />
        <meta name="theme-color" content="#2196F3" />
        <ThemeScript />
      </head>
      <body className="min-h-screen bg-[var(--color-background)] text-[var(--color-foreground)] font-sans antialiased overflow-x-hidden transition-colors duration-300">
        <ThemeProvider>{children}</ThemeProvider>
      </body>
    </html>
  );
}
