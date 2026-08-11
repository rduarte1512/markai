"use client";

import { useClerk, useSignIn, useSignUp } from "@clerk/nextjs";
import { useRouter } from "next/navigation";
import { useEffect, useRef } from "react";

export default function SsoCallbackPage() {
  const clerk = useClerk();
  const { signIn } = useSignIn();
  const { signUp } = useSignUp();
  const router = useRouter();
  const hasRun = useRef(false);

  useEffect(() => {
    void (async () => {
      if (!clerk.loaded || hasRun.current) return;
      hasRun.current = true;

      const navigateComplete = () => router.replace("/auth/complete");
      const navigateLogin = () => router.replace("/login?clerk_error=additional_verification");

      const finalizeSignIn = async () => {
        await signIn.finalize({
          navigate: ({ session, decorateUrl }) => {
            if (session?.currentTask) return navigateLogin();
            const url = decorateUrl("/auth/complete");
            if (url.startsWith("http")) window.location.href = url;
            else router.replace(url);
          },
        });
      };

      const finalizeSignUp = async () => {
        await signUp.finalize({
          navigate: ({ session, decorateUrl }) => {
            if (session?.currentTask) return navigateLogin();
            const url = decorateUrl("/auth/complete");
            if (url.startsWith("http")) window.location.href = url;
            else router.replace(url);
          },
        });
      };

      try {
        if (signIn.status === "complete") {
          await finalizeSignIn();
          return;
        }

        if (signUp.isTransferable) {
          await signIn.create({ transfer: true });
          if ((signIn.status as string) === "complete") {
            await finalizeSignIn();
            return;
          }
          return navigateLogin();
        }

        if (
          signIn.status === "needs_first_factor"
          && !signIn.supportedFirstFactors?.every((factor) => factor.strategy === "enterprise_sso")
        ) {
          return navigateLogin();
        }

        if (signIn.isTransferable) {
          await signUp.create({ transfer: true });
          if (signUp.status === "complete") {
            await finalizeSignUp();
            return;
          }
          return navigateLogin();
        }

        if (signUp.status === "complete") {
          await finalizeSignUp();
          return;
        }

        if (signIn.status === "needs_second_factor" || signIn.status === "needs_new_password") {
          return navigateLogin();
        }

        const existingSessionId = signIn.existingSession?.sessionId || signUp.existingSession?.sessionId;
        if (existingSessionId) {
          await clerk.setActive({
            session: existingSessionId,
            navigate: ({ session, decorateUrl }) => {
              if (session?.currentTask) return navigateLogin();
              const url = decorateUrl("/auth/complete");
              if (url.startsWith("http")) window.location.href = url;
              else router.replace(url);
            },
          });
          return;
        }

        navigateComplete();
      } catch (cause) {
        console.error("Clerk SSO callback error:", cause);
        router.replace("/login?clerk_error=sso_failed");
      }
    })();
  }, [clerk, router, signIn, signUp]);

  return <div id="clerk-captcha" aria-label="A concluir autenticação" />;
}
