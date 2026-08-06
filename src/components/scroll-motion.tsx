"use client";

import { useEffect, useRef } from "react";
import { usePathname } from "next/navigation";

const groups = [
  ".landing-v3-product-section .landing-v3-heading",
  ".landing-v3-product-card",
  ".landing-v3-pro-section .pro-copy",
  ".pro-value-stack > *",
  ".landing-v3-workflow .landing-v3-heading",
  ".landing-v3-workflow-grid article",
  ".landing-v3-ai-grid > *",
  ".landing-v3-pricing .landing-v3-heading",
  ".landing-v3-pricing .premium-plan-card",
  ".landing-v3-final .container",
];

export function ScrollMotion() {
  const pathname = usePathname();
  const progressRef = useRef<HTMLElement>(null);

  useEffect(() => {
    if (pathname !== "/") return;
    const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const elements = groups.flatMap((selector) => Array.from(document.querySelectorAll<HTMLElement>(selector)));
    const uniqueElements = Array.from(new Set(elements));

    uniqueElements.forEach((element, index) => {
      element.dataset.scrollReveal = "";
      element.style.setProperty("--reveal-delay", `${Math.min(index % 4, 3) * 90}ms`);
      if (index % 3 === 1) element.dataset.revealDirection = "left";
      if (index % 3 === 2) element.dataset.revealDirection = "right";
    });

    if (reduceMotion) {
      uniqueElements.forEach((element) => element.classList.add("is-visible"));
      return;
    }

    const observer = new IntersectionObserver((entries) => {
      for (const entry of entries) {
        if (entry.isIntersecting) {
          (entry.target as HTMLElement).classList.add("is-visible");
          observer.unobserve(entry.target);
        }
      }
    }, { rootMargin: "0px 0px -8% 0px", threshold: 0.13 });

    uniqueElements.forEach((element) => observer.observe(element));

    let frame = 0;
    function updateScrollEffects() {
      frame = 0;
      const max = Math.max(1, document.documentElement.scrollHeight - window.innerHeight);
      const progress = Math.min(1, Math.max(0, window.scrollY / max));
      if (progressRef.current) progressRef.current.style.transform = `scaleX(${progress})`;
      document.documentElement.style.setProperty("--landing-scroll", `${window.scrollY}px`);
      document.documentElement.style.setProperty("--landing-progress", String(progress));
    }
    function onScroll() {
      if (!frame) frame = window.requestAnimationFrame(updateScrollEffects);
    }
    updateScrollEffects();
    window.addEventListener("scroll", onScroll, { passive: true });

    return () => {
      observer.disconnect();
      window.removeEventListener("scroll", onScroll);
      if (frame) window.cancelAnimationFrame(frame);
    };
  }, [pathname]);

  if (pathname !== "/") return null;
  return <div className="landing-scroll-progress" aria-hidden="true"><i ref={progressRef}/></div>;
}
