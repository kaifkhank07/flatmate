import type { Metadata } from "next";
import { brand } from "@/brand.config";
import BrandStyle from "@/components/brand-style";
import { ToastProvider } from "@/lib/toast";
import "./globals.css";
import "quill/dist/quill.snow.css";

export const metadata: Metadata = {
  title: `${brand.name} — Admin`,
  description: brand.tagline,
  icons: {
    icon: brand.logo.dark, 
  },
};

export const viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 5,
  themeColor: brand.colors.primary,
};

/**
 * Fonts load via <link> rather than next/font so the project builds
 * offline / in air-gapped CI. To use next/font instead, swap these links
 * for `import { Inter } from "next/font/google"` and set the html className.
 */
export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" data-theme="light">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="" />
        <link
          href="https://fonts.googleapis.com/css2?family=Inter:wght@400..800&family=Instrument+Serif:ital@0;1&display=swap"
          rel="stylesheet"
        />
      </head>
      <body>
        <BrandStyle />
        <ToastProvider>{children}</ToastProvider>
      </body>
    </html>
  );
}
