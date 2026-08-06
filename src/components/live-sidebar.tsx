"use client";

import { useCallback, useEffect, useState } from "react";
import { Sidebar } from "@/components/sidebar";
import type { PlanKey } from "@/lib/types";

type BalanceResponse = {
  balance?: number;
};

export function LiveSidebar({
  plan,
  balance,
  allowance,
}: {
  plan: PlanKey;
  balance: number;
  allowance: number;
}) {
  const [liveBalance, setLiveBalance] = useState(balance);

  useEffect(() => {
    setLiveBalance(balance);
  }, [balance]);

  const refreshBalance = useCallback(async () => {
    try {
      const response = await fetch("/api/credits/balance", {
        method: "GET",
        cache: "no-store",
        headers: { Accept: "application/json" },
      });
      if (!response.ok) return;

      const data = (await response.json()) as BalanceResponse;
      const nextBalance = Number(data.balance);
      if (Number.isFinite(nextBalance)) setLiveBalance(nextBalance);
    } catch {
      // Keep the last known balance if the network is temporarily unavailable.
    }
  }, []);

  useEffect(() => {
    let timer: number | undefined;

    const schedule = () => {
      timer = window.setTimeout(async () => {
        if (document.visibilityState === "visible") await refreshBalance();
        schedule();
      }, 3000);
    };

    function handleVisibility() {
      if (document.visibilityState === "visible") void refreshBalance();
    }

    function handleCreditEvent(event: Event) {
      const detail = (event as CustomEvent<{ balance?: number }>).detail;
      const nextBalance = Number(detail?.balance);
      if (Number.isFinite(nextBalance)) setLiveBalance(nextBalance);
      else void refreshBalance();
    }

    void refreshBalance();
    schedule();
    window.addEventListener("focus", refreshBalance);
    window.addEventListener("markai:credits-updated", handleCreditEvent);
    document.addEventListener("visibilitychange", handleVisibility);

    return () => {
      if (timer) window.clearTimeout(timer);
      window.removeEventListener("focus", refreshBalance);
      window.removeEventListener("markai:credits-updated", handleCreditEvent);
      document.removeEventListener("visibilitychange", handleVisibility);
    };
  }, [refreshBalance]);

  return <Sidebar plan={plan} balance={liveBalance} allowance={allowance} />;
}
