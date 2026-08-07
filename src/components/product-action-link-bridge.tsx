"use client";

import { useEffect } from "react";

export function ProductActionLinkBridge() {
  useEffect(() => {
    function handleClick(event: MouseEvent) {
      const target = event.target instanceof Element ? event.target.closest(".v4-hero-actions a") : null;
      if (!(target instanceof HTMLAnchorElement)) return;
      if (!target.textContent?.toLowerCase().includes("produto em ação")) return;

      event.preventDefault();
      window.location.assign("/produto-em-acao");
    }

    function syncHref() {
      const target = document.querySelector<HTMLAnchorElement>(".v4-hero-actions a[href='#demo']");
      if (target) target.href = "/produto-em-acao";
    }

    syncHref();
    document.addEventListener("click", handleClick, true);
    return () => document.removeEventListener("click", handleClick, true);
  }, []);

  return null;
}
