"use client";

import { useRef, useLayoutEffect } from "react";
import Link from "next/link";
import { ArrowRight } from "lucide-react";
import gsap from "gsap";
import NotFoundRobot from "./components/NotFoundRobot";

export default function NotFound() {
  const pageRef = useRef(null);
  const fourLeftRef = useRef(null);
  const fourRightRef = useRef(null);
  const titleRef = useRef(null);
  const copyRef = useRef(null);
  const ctaRef = useRef(null);

  useLayoutEffect(() => {
    const page = pageRef.current;
    if (!page) return;

    const mm = gsap.matchMedia();

    mm.add("(prefers-reduced-motion: reduce)", () => {
      gsap.set(
        [fourLeftRef.current, fourRightRef.current, titleRef.current, copyRef.current, ctaRef.current],
        { opacity: 1, x: 0, y: 0, scale: 1 }
      );
    });

    mm.add("(prefers-reduced-motion: no-preference)", () => {
      gsap.set(fourLeftRef.current, { opacity: 0, x: -60, rotate: -12, scale: 0.8 });
      gsap.set(fourRightRef.current, { opacity: 0, x: 60, rotate: 12, scale: 0.8 });
      gsap.set(titleRef.current, { opacity: 0, y: 28 });
      gsap.set(copyRef.current, { opacity: 0, y: 20 });
      gsap.set(ctaRef.current, { opacity: 0, y: 16, scale: 0.94 });

      const tl = gsap.timeline({ defaults: { ease: "power4.out" } });

      tl.to(fourLeftRef.current, {
        opacity: 1,
        x: 0,
        rotate: 0,
        scale: 1,
        duration: 1,
      }, 0.15)
        .to(fourRightRef.current, {
          opacity: 1,
          x: 0,
          rotate: 0,
          scale: 1,
          duration: 1,
        }, 0.15)
        .to(titleRef.current, {
          opacity: 1,
          y: 0,
          duration: 0.85,
        }, 0.85)
        .to(copyRef.current, {
          opacity: 1,
          y: 0,
          duration: 0.75,
        }, 1.05)
        .to(ctaRef.current, {
          opacity: 1,
          y: 0,
          scale: 1,
          duration: 0.7,
          ease: "back.out(1.6)",
        }, 1.25);

      // Subtle idle pulse on the flanking 4s
      const leftPulse = gsap.to(fourLeftRef.current, {
        y: -6,
        duration: 2.6,
        ease: "sine.inOut",
        yoyo: true,
        repeat: -1,
        delay: 1.6,
      });
      const rightPulse = gsap.to(fourRightRef.current, {
        y: -6,
        duration: 2.6,
        ease: "sine.inOut",
        yoyo: true,
        repeat: -1,
        delay: 1.85,
      });

      // Soft red glow pulse on "angry"
      const angry = titleRef.current?.querySelector("[data-angry]");
      let angryTween;
      if (angry) {
        angryTween = gsap.to(angry, {
          textShadow: "0 0 18px rgba(239,68,68,0.55)",
          duration: 1.2,
          ease: "sine.inOut",
          yoyo: true,
          repeat: -1,
          delay: 1.4,
        });
      }

      return () => {
        tl.kill();
        leftPulse.kill();
        rightPulse.kill();
        angryTween?.kill();
      };
    });

    return () => mm.revert();
  }, []);

  return (
    <main
      ref={pageRef}
      className="relative min-h-[calc(100vh-8rem)] flex items-center justify-center bg-white px-6 py-16 overflow-hidden"
    >
      <div className="text-center max-w-xl mx-auto">
        <div className="flex items-end justify-center gap-1 sm:gap-2 select-none">
          <span
            ref={fourLeftRef}
            className="text-[7rem] sm:text-[9rem] md:text-[11rem] leading-none font-extrabold text-neutral-700 tracking-tight will-change-transform"
            aria-hidden="true"
          >
            4
          </span>
          <NotFoundRobot />
          <span
            ref={fourRightRef}
            className="text-[7rem] sm:text-[9rem] md:text-[11rem] leading-none font-extrabold text-neutral-700 tracking-tight will-change-transform"
            aria-hidden="true"
          >
            4
          </span>
        </div>

        <h1
          ref={titleRef}
          className="mt-4 sm:mt-6 text-3xl sm:text-4xl md:text-5xl font-extrabold text-neutral-900 tracking-tight"
        >
          You have made me{" "}
          <span data-angry className="text-red-500">
            angry
          </span>
          .
        </h1>

        <p
          ref={copyRef}
          className="mt-3 sm:mt-4 text-base sm:text-lg text-neutral-600 leading-relaxed"
        >
          This page is not in our system.
          <br className="hidden sm:block" />
          Please return to the homepage.
        </p>

        <div ref={ctaRef} className="mt-8 sm:mt-10 flex justify-center">
          <Link href="/DashBoard" className="inline-block">
            <div className="nb-cta nb-chamfer-lg bg-gradient-to-r from-red-500 to-red-600 text-white px-8 py-4 text-lg font-semibold hover:scale-[1.03] active:scale-[0.97] transition-all duration-200 flex items-center justify-center gap-2 group shadow-lg shadow-red-500/30 hover:shadow-red-500/50">
              Visit Home
              <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
            </div>
          </Link>
        </div>
      </div>
    </main>
  );
}
