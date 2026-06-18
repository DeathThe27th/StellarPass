import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "StellarPass — ZK Identity for Stellar",
  description: "Prove you're verified. Access every regulated asset on Stellar.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <head>
        <link href="https://fonts.googleapis.com/css2?family=Instrument+Serif:ital@0;1&family=DM+Sans:wght@400;500;600&display=swap" rel="stylesheet" />
      </head>
      <body>{children}</body>
    </html>
  );
}
