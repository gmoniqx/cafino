import type { Metadata, Viewport } from "next";
import { Fraunces, Geist_Mono, Manrope } from "next/font/google";
import Script from "next/script";
import "./globals.css";
import { PwaRegistrar } from "@/components/pwa/PwaRegistrar";

const bodySans = Manrope({
  variable: "--font-body",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
});

const displaySerif = Fraunces({
  variable: "--font-display",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
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
    icon: "/download.png",
    apple: "/download.png",
    shortcut: "/download.png",
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
  themeColor: "#9a5a3c",
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
      <head>
        <Script id="performance-api-shim" strategy="beforeInteractive">
          {`(function(){
            if (typeof window === "undefined" || !window.performance) return;
            if (typeof window.performance.clearMarks !== "function") {
              window.performance.clearMarks = function() {};
            }
            if (typeof window.performance.clearMeasures !== "function") {
              window.performance.clearMeasures = function() {};
            }
          })();`}
        </Script>
      </head>
      <body className="min-h-full flex flex-col">
        <PwaRegistrar />
        {children}
      </body>
    </html>
  );
}
