import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Prototype Riskanalysis",
  description: "Prototype developed in course of bachelor's thesis",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="de">
      <body>{children}</body>
    </html>
  );
}
