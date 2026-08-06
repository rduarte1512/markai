import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: {
    default: "MarkAI — Marketing com IA para agências",
    template: "%s | MarkAI",
  },
  description: "Plataforma completa para gerir marcas, criar anúncios, construir funis e trabalhar com um copiloto de marketing com IA.",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="pt">
      <body>{children}</body>
    </html>
  );
}
