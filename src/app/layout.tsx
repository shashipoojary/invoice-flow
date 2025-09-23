import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
  display: "swap",
});

export const metadata: Metadata = {
  title: "InvoiceFlow - The Fastest Way for Freelancers to Get Paid",
  description: "60-second invoicing for freelancers, designers, developers, and contractors. Simple, fast, and professional.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <head>
        {/* Preload critical logo icon images for faster LCP */}
        <link rel="preload" href="/logo-icon-black.png" as="image" type="image/png" />
        <link rel="preload" href="/logo-icon-white.png" as="image" type="image/png" />
      </head>
      <body
        className={`${inter.variable} antialiased`}
        suppressHydrationWarning
      >
        {children}
      </body>
    </html>
  );
}
