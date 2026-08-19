import type { Metadata } from "next";
import { Inter, Space_Mono } from "next/font/google";
import "./globals.css";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
});

const spaceMono = Space_Mono({
  weight: ["400", "700"],
  subsets: ["latin"],
  variable: "--font-space-mono",
});

export const metadata: Metadata = {
  title: "ORBITAL SHIELD — Space Weather & Satellite Mission Risk Platform",
  description: "AI-Powered mission-aware space weather intelligence and satellite digital twin for ISRO Space Hackathon.",
  keywords: ["space weather", "solar flare prediction", "geomagnetic storm", "satellite risk", "ISRO", "digital twin"]
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="dark">
      <body
        className={`${inter.variable} ${spaceMono.variable} font-sans antialiased bg-slate-950 text-slate-100 min-h-screen flex flex-col selection:bg-cyan-500/30 selection:text-cyan-200`}
      >
        {/* Background Scanline & Cosmic Star Grid */}
        <div className="fixed inset-0 pointer-events-none bg-[radial-gradient(ellipse_80%_80%_at_50%_-20%,rgba(14,165,233,0.15),rgba(255,255,255,0))] z-0" />
        <div className="fixed inset-0 pointer-events-none bg-[linear-gradient(to_right,#1e293b0a_1px,transparent_1px),linear-gradient(to_bottom,#1e293b0a_1px,transparent_1px)] bg-[size:4rem_4rem] z-0" />

        <div className="relative z-10 flex-1 flex flex-col">
          {children}
        </div>
      </body>
    </html>
  );
}
