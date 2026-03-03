"use client";

import React, { useEffect, useRef } from "react";

type AnimationDirection =
  | "fade-up"
  | "fade-down"
  | "fade-left"
  | "fade-right"
  | "zoom-in";

interface AnimatedSectionProps {
  children: React.ReactNode;
  className?: string;
  animation?: AnimationDirection;
  delay?: 0 | 100 | 200 | 300 | 400 | 500 | 600;
  as?: React.ElementType;
  threshold?: number;
}

/**
 * Wraps any content and animates it into view when it enters the viewport.
 * Uses the CSS classes defined in globals.css (.scroll-animate, .is-visible, etc.)
 */
export default function AnimatedSection({
  children,
  className = "",
  animation = "fade-up",
  delay = 0,
  as: Tag = "div",
  threshold = 0.15,
}: AnimatedSectionProps) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          entry.target.classList.add("is-visible");
          observer.unobserve(entry.target);
        }
      },
      { threshold },
    );

    observer.observe(el);
    return () => observer.disconnect();
  }, [threshold]);

  const delayClass = delay > 0 ? `delay-${delay}` : "";

  return (
    <Tag
      ref={ref}
      className={`scroll-animate ${animation} ${delayClass} ${className}`.trim()}
    >
      {children}
    </Tag>
  );
}
