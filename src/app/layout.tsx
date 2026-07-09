import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Our Story",
  description: "A private digital memory book for two people in love",
  viewport: "width=device-width, initial-scale=1, maximum-scale=1, user-scalable=no, viewport-fit=cover",
  themeColor: "#2196F3",
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "Our Story",
  },
  icons: {
    apple: "/apple-touch-icon.png",
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="h-full">
      <head>
        <link
          href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800;900&display=swap"
          rel="stylesheet"
        />
      </head>
      <body className="min-h-screen bg-[#EAF6FF] text-slate-800 font-sans antialiased overflow-x-hidden">
        {children}
      </body>
    </html>
  );
}
