import type { Metadata } from "next";
import { ClerkProvider } from "@clerk/nextjs";
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
import "./settings-readability.css";
import "./settings-sidebar-scale.css";
import "./topbar-premium-v2.css";
import "./workspace-management.css";
import "./workspace-editor-v2.css";
import "./agent-tools-media.css";
import "./conversation-actions.css";
import "./sidebar-command-center.css";
import "./checkout-payment-methods.css";
import "./checkout-payment-flow.css";
import "./billing-payment-settings.css";
import { ScrollMotion } from "@/components/scroll-motion";
import { ProductActionLinkBridge } from "@/components/product-action-link-bridge";
import { ConversationActionsBridge } from "@/components/conversation-actions-bridge";

export const metadata: Metadata = {
  title: {
    default: "MarkAI — Marketing OS com IA",
    template: "%s | MarkAI",
  },
  description: "Plataforma premium para gerir marcas, criar anúncios, construir funis e trabalhar com um copiloto de marketing com IA.",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <ClerkProvider>
      <html lang="pt">
        <body><ScrollMotion /><ProductActionLinkBridge /><ConversationActionsBridge />{children}</body>
      </html>
    </ClerkProvider>
  );
}
