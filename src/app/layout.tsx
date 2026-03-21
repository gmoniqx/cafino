import type { Metadata, Viewport } from "next";
import { Cormorant_Garamond, Geist_Mono, Jost } from "next/font/google";
import "./globals.css";
import { PwaRegistrar } from "@/components/pwa/PwaRegistrar";

const bodySans = Jost({
  variable: "--font-sans",
  subsets: ["latin"],
  weight: ["300", "400", "500"],
});

const displaySerif = Cormorant_Garamond({
  variable: "--font-display",
  subsets: ["latin"],
  weight: ["300", "400"],
  style: ["normal", "italic"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Cafino",
  description: "Cafino is a mobile-first coffee tracking app with calendar logs, trends, and clean daily insights.",
  manifest: "/manifest.webmanifest",
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "Cafino",
  },
  formatDetection: {
    telephone: false,
  },
  icons: {
    icon: "/download.jpg",
    apple: "/download.jpg",
    shortcut: "/download.jpg",
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
  themeColor: "#8f7648",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${bodySans.variable} ${displaySerif.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">
        <PwaRegistrar />
        {children}
      </body>
    </html>
  );
}
