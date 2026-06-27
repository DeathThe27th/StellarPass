import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";

const geist = Geist({ subsets: ["latin"], variable: "--font-geist", display: "swap" });
const geistMono = Geist_Mono({ subsets: ["latin"], variable: "--font-geist-mono", display: "swap" });

export const metadata: Metadata = {
  title: "StellarPass · ZK identity for Stellar",
  description:
    "Prove you're verified. Access every regulated asset on Stellar. One zero-knowledge proof, verified on-chain, with your identity kept private.",
  openGraph: {
    title: "StellarPass · ZK identity for Stellar",
    description:
      "One zero-knowledge proof, verified on-chain. Access every regulated asset on Stellar with your identity kept private.",
    type: "website",
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${geist.variable} ${geistMono.variable}`}>
      <body>{children}</body>
    </html>
  );
}
