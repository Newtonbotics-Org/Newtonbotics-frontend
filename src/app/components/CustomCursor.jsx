"use client";

import { useEffect, useRef, useState } from "react";
import gsap from "gsap";
import { Bot } from "lucide-react";

const INTERACTIVE =
  'a, button, [role="button"], input, textarea, select, label, summary, .cursor-pointer, .nb-cta, [data-cursor="pointer"]';

/**
 * Site-wide custom cursor — robotics Bot icon only.
 * Scales / brightens on interactive targets. Disabled on touch / reduced motion.
 */
export default function CustomCursor() {
  const iconRef = useRef(null);
  const [enabled, setEnabled] = useState(false);

  useEffect(() => {
    const finePointer = window.matchMedia("(pointer: fine)").matches;
    const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (finePointer && !reduceMotion) setEnabled(true);
  }, []);

  useEffect(() => {
    if (!enabled) return;

    const icon = iconRef.current;
    if (!icon) return;

    document.documentElement.classList.add("nb-custom-cursor");

    gsap.set(icon, {
      xPercent: -50,
      yPercent: -50,
      force3D: true,
      opacity: 0,
    });

    const xTo = gsap.quickTo(icon, "x", { duration: 0.12, ease: "power3.out" });
    const yTo = gsap.quickTo(icon, "y", { duration: 0.12, ease: "power3.out" });

    let hovering = false;
    let visible = false;

    const show = () => {
      if (visible) return;
      visible = true;
      gsap.to(icon, { opacity: 1, duration: 0.2, overwrite: "auto" });
    };

    const hide = () => {
      visible = false;
      gsap.to(icon, { opacity: 0, duration: 0.2, overwrite: "auto" });
    };

    const onMove = (e) => {
      show();
      xTo(e.clientX);
      yTo(e.clientY);
    };

    const setHover = (on) => {
      if (hovering === on) return;
      hovering = on;

      gsap.to(icon, {
        scale: on ? 1.3 : 1,
        rotate: on ? -8 : 0,
        duration: 0.28,
        ease: "power2.out",
        overwrite: "auto",
      });

      icon.style.filter = on
        ? "drop-shadow(0 0 10px rgba(239,68,68,1)) drop-shadow(0 0 18px rgba(239,68,68,0.65))"
        : "drop-shadow(0 0 6px rgba(239,68,68,0.85))";
      icon.style.color = on ? "#ffffff" : "#ef4444";
    };

    const onOver = (e) => {
      if (e.target?.closest?.(INTERACTIVE)) setHover(true);
    };

    const onOut = (e) => {
      const leftInteractive = e.target?.closest?.(INTERACTIVE);
      const enteredInteractive = e.relatedTarget?.closest?.(INTERACTIVE);
      if (leftInteractive && !enteredInteractive) setHover(false);
    };

    const onDown = () => {
      gsap.to(icon, { scale: hovering ? 1.1 : 0.85, duration: 0.1, overwrite: "auto" });
    };

    const onUp = () => {
      gsap.to(icon, { scale: hovering ? 1.3 : 1, duration: 0.18, overwrite: "auto" });
    };

    window.addEventListener("pointermove", onMove, { passive: true });
    document.addEventListener("pointerover", onOver, true);
    document.addEventListener("pointerout", onOut, true);
    window.addEventListener("pointerdown", onDown);
    window.addEventListener("pointerup", onUp);
    document.documentElement.addEventListener("mouseleave", hide);
    document.documentElement.addEventListener("mouseenter", show);

    return () => {
      document.documentElement.classList.remove("nb-custom-cursor");
      window.removeEventListener("pointermove", onMove);
      document.removeEventListener("pointerover", onOver, true);
      document.removeEventListener("pointerout", onOut, true);
      window.removeEventListener("pointerdown", onDown);
      window.removeEventListener("pointerup", onUp);
      document.documentElement.removeEventListener("mouseleave", hide);
      document.documentElement.removeEventListener("mouseenter", show);
    };
  }, [enabled]);

  if (!enabled) return null;

  return (
    <div
      ref={iconRef}
      aria-hidden
      className="pointer-events-none fixed top-0 left-0 z-[99999] flex h-7 w-7 items-center justify-center text-red-500 opacity-0"
      style={{
        willChange: "transform",
        filter: "drop-shadow(0 0 6px rgba(239,68,68,0.85))",
      }}
    >
      <Bot className="h-6 w-6" strokeWidth={2.25} absoluteStrokeWidth />
    </div>
  );
}
