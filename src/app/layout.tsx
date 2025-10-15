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
        <script
          dangerouslySetInnerHTML={{
            __html: `
              (function() {
                try {
                  const savedDarkMode = localStorage.getItem('darkMode');
                  const isDark = savedDarkMode === 'true';
                  
                  if (isDark) {
                    document.documentElement.classList.add('dark');
                    document.documentElement.style.setProperty('background-color', '#000000', 'important');
                    document.documentElement.style.setProperty('color-scheme', 'dark', 'important');
                  } else {
                    document.documentElement.classList.remove('dark');
                    document.documentElement.style.setProperty('background-color', '#ffffff', 'important');
                    document.documentElement.style.setProperty('color-scheme', 'light', 'important');
                  }
                  
                  // Set body background immediately
                  const setBodyBg = () => {
                    document.body.style.setProperty('background-color', isDark ? '#000000' : '#ffffff', 'important');
                  };
                  
                  if (document.body) {
                    setBodyBg();
                  } else {
                    document.addEventListener('DOMContentLoaded', setBodyBg);
                  }
                } catch (e) {}
              })();
            `,
          }}
        />
        <style
          dangerouslySetInnerHTML={{
            __html: `
              /* Hide content until React loads to prevent flash */
              body { 
                visibility: hidden; 
                background-color: #000000 !important;
              }
              body.loaded { visibility: visible; }
              /* Ensure dark background is applied immediately */
              html { background-color: #000000 !important; }
              html.dark { background-color: #000000 !important; }
            `,
          }}
        />
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
