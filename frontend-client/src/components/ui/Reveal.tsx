import { useEffect, useRef, type CSSProperties, type ElementType, type ReactNode } from "react";
import { cn } from "@/utils";

interface RevealProps {
  children: ReactNode;
  className?: string;
  /** Délai (ms) avant l'apparition, pour un effet en cascade. */
  delay?: number;
  /** Direction / type d'apparition. */
  variant?: "up" | "left" | "right" | "zoom" | "fade";
  as?: ElementType;
  style?: CSSProperties;
}

/** Enveloppe un bloc : apparaît en fondu glissé quand il entre dans le viewport. */
export function Reveal({ children, className, delay = 0, variant = "up", as: Tag = "div", style }: RevealProps) {
  const ref = useRef<HTMLElement | null>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) {
            (entry.target as HTMLElement).classList.add("is-visible");
            observer.disconnect();
          }
        }
      },
      { threshold: 0.12, rootMargin: "0px 0px -48px 0px" },
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  return (
    <Tag
      ref={ref}
      data-variant={variant}
      className={cn("reveal", className)}
      style={delay ? { ...style, transitionDelay: `${delay}ms` } : style}
    >
      {children}
    </Tag>
  );
}