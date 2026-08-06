import type { Metadata } from "next";
import "./globals.css";
import "./auth-onboarding.css";
import "./premium.css";

export const metadata: Metadata = {
  title: {
    default: "MarkAI — Marketing OS com IA",
    template: "%s | MarkAI",
  },
  description: "Plataforma premium para gerir marcas, criar anúncios, construir funis e trabalhar com um copiloto de marketing com IA.",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="pt">
      <body>{children}</body>
    </html>
  );
}
