import type { Metadata } from "next";
import "./globals.css";
import "./auth-onboarding.css";
import "./premium.css";
import "./studio-v2-core.css";
import "./studio-v2-chrome.css";
import "./studio-v2-workspaces.css";
import "./studio-v2-operations.css";
import "./landing-v3.css";
import "./studio-v3-polish.css";
import "./agent-readability.css";
import "./dashboard-premium.css";
import { ScrollMotion } from "@/components/scroll-motion";

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
      <body><ScrollMotion />{children}</body>
    </html>
  );
}
