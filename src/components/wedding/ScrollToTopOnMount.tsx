"use client";

import { useLayoutEffect } from "react";

export function ScrollToTopOnMount() {
  useLayoutEffect(() => {
    const scrollToTop = () => window.scrollTo({ top: 0, left: 0, behavior: "instant" });
    scrollToTop();

    const frame = requestAnimationFrame(scrollToTop);
    return () => cancelAnimationFrame(frame);
  }, []);

  return null;
}
