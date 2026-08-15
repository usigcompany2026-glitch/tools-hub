import type { Metadata, Viewport } from "next";
import "./globals.css";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import AddToHomeScreenHint from "@/components/AddToHomeScreenHint";
import RegisterServiceWorker from "@/components/RegisterServiceWorker";

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || "https://tools.usig.ai";

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: {
    default: "USIG Decision Tools",
    template: "%s · USIG Decision Tools",
  },
  description:
    "Three decision tools for real estate investors and brokers — residential deal analysis, commercial underwriting, and financing program matching. Start free, no credit card.",
  manifest: "/manifest.json",
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "USIG Tools",
  },
};

export const viewport: Viewport = {
  themeColor: "#0b3d2e",
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <head>
        <link rel="icon" href="/icons/icon-192.png" type="image/png" />
        <link rel="apple-touch-icon" href="/icons/icon-192.png" />
      </head>
      <body className="flex min-h-screen flex-col font-sans antialiased">
        <AddToHomeScreenHint />
        <Header />
        <main className="flex-1">{children}</main>
        <Footer />
        <RegisterServiceWorker />
      </body>
    </html>
  );
}
