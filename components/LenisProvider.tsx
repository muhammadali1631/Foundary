"use client";

import { useEffect } from "react";
import { ReactLenis, useLenis } from "lenis/react";

const HEADER_OFFSET = -76;

function AnchorHandler() {
  const lenis = useLenis();

  useEffect(() => {
    if (!lenis) return;

    const onClick = (e: MouseEvent) => {
      const target = e.target as HTMLElement | null;
      const link = target?.closest?.('a[href*="#"]') as HTMLAnchorElement | null;
      if (!link) return;

      const href = link.getAttribute("href") ?? "";
      const [path, hash] = href.split("#");
      if (!hash) return;

      const currentPath = window.location.pathname;
      const inPage =
        path === "" ||
        path === "#" ||
        path === currentPath ||
        path === "/" && (currentPath === "/" || href === "/#top");

      if (!inPage || !hash) return;

      const element = document.getElementById(hash);
      if (!element) return;

      e.preventDefault();
      lenis.scrollTo(element, {
        offset: HEADER_OFFSET,
        duration: 1.2,
        easing: (t) => 1 - Math.pow(1 - t, 4),
      });
      history.replaceState(null, "", `/#${hash}`);
    };

    document.addEventListener("click", onClick);
    return () => document.removeEventListener("click", onClick);
  }, [lenis]);

  return null;
}

export function LenisProvider({ children }: { children: React.ReactNode }) {
  return (
    <ReactLenis
      root
      options={{
        autoRaf: true,
        lerp: 0.15,
        wheelMultiplier: 1,
        smoothWheel: true,
      }}
    >
      <AnchorHandler />
      {children}
    </ReactLenis>
  );
}