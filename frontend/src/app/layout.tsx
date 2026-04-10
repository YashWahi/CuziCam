import type { Metadata } from "next";
import { DM_Sans, Space_Mono, Instrument_Serif } from "next/font/google";
import { Providers } from "./providers";
import "./globals.css";

const dmSans = DM_Sans({
  subsets: ["latin"],
  variable: "--font-dm-sans",
});

const spaceMono = Space_Mono({
  subsets: ["latin"],
  weight: ["400", "700"],
  variable: "--font-space-mono",
});

const instrumentSerif = Instrument_Serif({
  subsets: ["latin"],
  weight: "400",
  variable: "--font-instrument-serif",
  style: ["normal", "italic"],
});

export const metadata: Metadata = {
  title: "CuziCam | Find your people.",
  description: "Exclusive real-time anonymous video and text chat platform for verified college students.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={`${dmSans.variable} ${spaceMono.variable} ${instrumentSerif.variable}`}>
      <body>
        {/* SVG Texture overlay */}
        <div className="noise-overlay" />
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}

