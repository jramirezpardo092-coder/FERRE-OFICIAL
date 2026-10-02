"use client";

import { useEffect, useRef } from "react";

interface Props {
  children: React.ReactNode;
  className?: string;
  variant?: "up" | "left" | "scale";
  stagger?: boolean;
  delay?: number;
}

export default function ScrollReveal({
  children,
  className = "",
  variant = "up",
  stagger = false,
  delay = 0,
}: Props) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      el.classList.add("scroll-visible");
      return;
    }
    el.classList.add("reveal-ready");
    let timer: ReturnType<typeof setTimeout> | undefined;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          if (delay > 0) {
            timer = setTimeout(() => el.classList.add("scroll-visible"), delay);
          } else {
            el.classList.add("scroll-visible");
          }
          observer.unobserve(el);
        }
      },
      { threshold: 0.1, rootMargin: "0px 0px -40px 0px" }
    );

    observer.observe(el);
    return () => {
      observer.disconnect();
      if (timer) clearTimeout(timer);
    };
  }, [delay]);

  const baseClass = stagger
    ? "stagger-children"
    : variant === "left"
      ? "scroll-hidden-left"
      : variant === "scale"
        ? "scroll-hidden-scale"
        : "scroll-hidden";

  return (
    <div ref={ref} className={`${baseClass} ${className}`}>
      {children}
    </div>
  );
}
