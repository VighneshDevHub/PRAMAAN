import type { Metadata } from "next";
import { Inter, Space_Grotesk, JetBrains_Mono } from "next/font/google";
import { ThemeProvider } from "@/components/ThemeProvider";
import "./globals.css";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  display: "swap",
});

const spaceGrotesk = Space_Grotesk({
  subsets: ["latin"],
  variable: "--font-space",
  display: "swap",
});

const jetbrainsMono = JetBrains_Mono({
  subsets: ["latin"],
  variable: "--font-mono",
  display: "swap",
});

export const metadata: Metadata = {
  title: "PRAMAAN - Integrated Secure Data Erasure & Digital Forensics Platform",
  description: "National Technical Research Organisation (NTRO) - NIST SP 800-88 Rev. 2 Compliant Data Sanitisation & Forensic Recovery Tool",
  icons: {
    icon: "/pramaan-logo.png",
    shortcut: "/pramaan-logo.png",
    apple: "/pramaan-logo.png",
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${inter.variable} ${spaceGrotesk.variable} ${jetbrainsMono.variable}`}>
      <body className="bg-page font-sans text-main antialiased selection:bg-govt-gold/30">
        <ThemeProvider>{children}</ThemeProvider>
      </body>
    </html>
  );
}
