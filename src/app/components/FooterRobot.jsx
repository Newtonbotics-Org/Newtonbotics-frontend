"use client";

import { useRef, useLayoutEffect } from "react";
import Image from "next/image";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

gsap.registerPlugin(ScrollTrigger);

/**
 * Premium GSAP animation system for the footer robot PNG only.
 * Does not alter footer layout, typography, links, or spacing.
 */
export default function FooterRobot() {
  const rootRef = useRef(null);
  const scrollLayerRef = useRef(null);
  const parallaxLayerRef = useRef(null);
  const floatLayerRef = useRef(null);
  const introLayerRef = useRef(null);
  const scaleLayerRef = useRef(null);
  const chestOuterRef = useRef(null);
  const chestInnerRef = useRef(null);
  const ledBlueRef = useRef(null);
  const ledRedRef = useRef(null);
  const ledBlueAltRef = useRef(null);
  const ledRedAltRef = useRef(null);
  const visorSweepRef = useRef(null);

  useLayoutEffect(() => {
    const root = rootRef.current;
    const scrollLayer = scrollLayerRef.current;
    const parallaxLayer = parallaxLayerRef.current;
    const floatLayer = floatLayerRef.current;
    const introLayer = introLayerRef.current;
    const scaleLayer = scaleLayerRef.current;

    if (!root || !scrollLayer || !parallaxLayer || !floatLayer || !introLayer || !scaleLayer) {
      return;
    }

    const mm = gsap.matchMedia();

    mm.add(
      {
        isDesktop: "(min-width: 768px)",
        reduceMotion: "(prefers-reduced-motion: reduce)",
      },
      (context) => {
        const { isDesktop, reduceMotion } = context.conditions;
        if (!isDesktop) return;

        if (reduceMotion) {
          gsap.set(introLayer, { opacity: 1, y: 0, scale: 1, rotateX: 0 });
          return;
        }

        const glowTargets = [
          chestOuterRef.current,
          chestInnerRef.current,
          ledBlueRef.current,
          ledRedRef.current,
          ledBlueAltRef.current,
          ledRedAltRef.current,
          visorSweepRef.current,
        ];

        gsap.set(introLayer, {
          opacity: 0,
          y: 120,
          scale: 0.92,
          rotateX: 18,
          transformPerspective: 1200,
          force3D: true,
        });

        gsap.set([scrollLayer, parallaxLayer, floatLayer, scaleLayer, ...glowTargets], {
          force3D: true,
        });

        gsap.set(chestOuterRef.current, {
          opacity: 0.55,
          scale: 1,
          filter: "blur(8px) drop-shadow(0 0 18px rgba(0,180,255,0.65))",
        });
        gsap.set(chestInnerRef.current, {
          opacity: 0.5,
          scale: 1,
          filter: "blur(3px) drop-shadow(0 0 10px rgba(255,40,60,0.7))",
        });
        gsap.set(visorSweepRef.current, { xPercent: -120, opacity: 0 });

        // —— Entrance when footer enters view ——
        const intro = gsap.to(introLayer, {
          opacity: 1,
          y: 0,
          scale: 1,
          rotateX: 0,
          duration: 1.8,
          ease: "power4.out",
          scrollTrigger: {
            trigger: root,
            start: "top 90%",
            once: true,
          },
        });

        // —— Idle floating ——
        const floatTween = gsap.to(floatLayer, {
          y: -12,
          duration: 3.5,
          ease: "sine.inOut",
          yoyo: true,
          repeat: -1,
          delay: 1.8,
        });

        // —— Breathing ——
        const breathTween = gsap.to(scaleLayer, {
          scale: 1.01,
          duration: 2.4,
          ease: "sine.inOut",
          yoyo: true,
          repeat: -1,
          delay: 2.2,
        });

        // —— Chest reactor glow ——
        const chestOuter = gsap.to(chestOuterRef.current, {
          scale: 1.18,
          opacity: 0.85,
          filter: "blur(10px) drop-shadow(0 0 28px rgba(0,180,255,0.95))",
          duration: 1.6,
          ease: "sine.inOut",
          yoyo: true,
          repeat: -1,
          delay: 1.9,
        });

        const chestInner = gsap.to(chestInnerRef.current, {
          scale: 1.22,
          opacity: 0.9,
          filter: "blur(4px) drop-shadow(0 0 14px rgba(255,40,60,0.95))",
          duration: 1.1,
          ease: "sine.inOut",
          yoyo: true,
          repeat: -1,
          delay: 2.0,
        });

        // —— LED pulses (desynced) ——
        const ledBlue = gsap.to(ledBlueRef.current, {
          opacity: 0.95,
          scale: 1.25,
          filter: "blur(2px) drop-shadow(0 0 8px rgba(0,180,255,1))",
          duration: 1.35,
          ease: "sine.inOut",
          yoyo: true,
          repeat: -1,
          delay: 2.1,
        });

        const ledRed = gsap.to(ledRedRef.current, {
          opacity: 0.9,
          scale: 1.3,
          filter: "blur(2px) drop-shadow(0 0 8px rgba(255,40,60,1))",
          duration: 1.85,
          ease: "sine.inOut",
          yoyo: true,
          repeat: -1,
          delay: 2.4,
        });

        const ledBlueAlt = gsap.to(ledBlueAltRef.current, {
          opacity: 0.85,
          scale: 1.2,
          filter: "blur(2px) drop-shadow(0 0 6px rgba(0,200,255,0.9))",
          duration: 2.15,
          ease: "sine.inOut",
          yoyo: true,
          repeat: -1,
          delay: 2.6,
        });

        const ledRedAlt = gsap.to(ledRedAltRef.current, {
          opacity: 0.8,
          scale: 1.28,
          filter: "blur(2px) drop-shadow(0 0 6px rgba(255,50,70,0.9))",
          duration: 1.55,
          ease: "sine.inOut",
          yoyo: true,
          repeat: -1,
          delay: 2.8,
        });

        // —— Helmet reflection sweep ——
        const visorTl = gsap.timeline({
          repeat: -1,
          repeatDelay: 5,
          delay: 3.2,
        });
        visorTl
          .set(visorSweepRef.current, { xPercent: -120, opacity: 0 })
          .to(visorSweepRef.current, {
            xPercent: 40,
            opacity: 0.5,
            duration: 0.55,
            ease: "power2.out",
          })
          .to(visorSweepRef.current, {
            xPercent: 160,
            opacity: 0,
            duration: 0.55,
            ease: "power2.in",
          });

        // —— Mouse parallax ——
        const xTo = gsap.quickTo(parallaxLayer, "x", { duration: 0.7, ease: "power3.out" });
        const yTo = gsap.quickTo(parallaxLayer, "y", { duration: 0.7, ease: "power3.out" });
        const rotYTo = gsap.quickTo(parallaxLayer, "rotateY", {
          duration: 0.85,
          ease: "power3.out",
        });
        const rotXTo = gsap.quickTo(parallaxLayer, "rotateX", {
          duration: 0.85,
          ease: "power3.out",
        });

        let hovering = false;

        const onPointerMove = (e) => {
          const rect = root.getBoundingClientRect();
          const cx = rect.left + rect.width / 2;
          const cy = rect.top + rect.height / 2;
          const nx = gsap.utils.clamp(-1, 1, (e.clientX - cx) / Math.max(rect.width, 80));
          const ny = gsap.utils.clamp(-1, 1, (e.clientY - cy) / Math.max(rect.height, 80));

          const maxRotY = hovering ? 12 : 10;
          const maxRotX = hovering ? 6 : 5;
          const maxX = hovering ? 18 : 15;
          const maxY = hovering ? 12 : 10;

          xTo(nx * maxX);
          yTo(ny * maxY);
          rotYTo(nx * maxRotY);
          rotXTo(-ny * maxRotX);
        };

        // —— Hover ——
        const onEnter = () => {
          hovering = true;
          breathTween.pause();
          chestOuter.pause();
          chestInner.pause();

          gsap.to(scaleLayer, {
            scale: 1.03,
            duration: 0.55,
            ease: "power3.out",
            overwrite: "auto",
          });
          gsap.to(chestOuterRef.current, {
            opacity: 1,
            scale: 1.35,
            filter: "blur(12px) drop-shadow(0 0 40px rgba(0,180,255,1))",
            duration: 0.5,
            ease: "power2.out",
            overwrite: "auto",
          });
          gsap.to(chestInnerRef.current, {
            opacity: 1,
            scale: 1.4,
            filter: "blur(5px) drop-shadow(0 0 22px rgba(255,40,60,1))",
            duration: 0.5,
            ease: "power2.out",
            overwrite: "auto",
          });
        };

        const onLeave = () => {
          hovering = false;

          gsap.to(scaleLayer, {
            scale: 1,
            duration: 0.7,
            ease: "power3.out",
            overwrite: "auto",
            onComplete: () => breathTween.resume(),
          });
          gsap.to(chestOuterRef.current, {
            opacity: 0.55,
            scale: 1,
            filter: "blur(8px) drop-shadow(0 0 18px rgba(0,180,255,0.65))",
            duration: 0.65,
            ease: "power2.out",
            overwrite: "auto",
            onComplete: () => chestOuter.resume(),
          });
          gsap.to(chestInnerRef.current, {
            opacity: 0.5,
            scale: 1,
            filter: "blur(3px) drop-shadow(0 0 10px rgba(255,40,60,0.7))",
            duration: 0.65,
            ease: "power2.out",
            overwrite: "auto",
            onComplete: () => chestInner.resume(),
          });

          xTo(0);
          yTo(0);
          rotYTo(0);
          rotXTo(0);
        };

        window.addEventListener("pointermove", onPointerMove, { passive: true });
        root.addEventListener("pointerenter", onEnter);
        root.addEventListener("pointerleave", onLeave);

        // —— Scroll parallax ——
        const scrollTween = gsap.to(scrollLayer, {
          y: 40,
          rotate: 2,
          ease: "none",
          scrollTrigger: {
            trigger: root.closest("footer") || root,
            start: "top bottom",
            end: "bottom top",
            scrub: 1.2,
          },
        });

        return () => {
          window.removeEventListener("pointermove", onPointerMove);
          root.removeEventListener("pointerenter", onEnter);
          root.removeEventListener("pointerleave", onLeave);
          intro.scrollTrigger?.kill();
          intro.kill();
          floatTween.kill();
          breathTween.kill();
          chestOuter.kill();
          chestInner.kill();
          ledBlue.kill();
          ledRed.kill();
          ledBlueAlt.kill();
          ledRedAlt.kill();
          visorTl.kill();
          scrollTween.scrollTrigger?.kill();
          scrollTween.kill();
        };
      }
    );

    return () => mm.revert();
  }, []);

  return (
    <div
      ref={rootRef}
      className="hidden md:block shrink-0 mt-8 lg:mt-10 pointer-events-auto select-none"
      style={{ perspective: "1400px" }}
    >
      <div ref={scrollLayerRef} className="relative will-change-transform">
        <div
          ref={parallaxLayerRef}
          className="relative will-change-transform"
          style={{ transformStyle: "preserve-3d" }}
        >
          <div ref={floatLayerRef} className="relative will-change-transform">
            <div
              ref={introLayerRef}
              className="relative will-change-transform"
              style={{ transformStyle: "preserve-3d" }}
            >
              <div ref={scaleLayerRef} className="relative will-change-transform inline-block">
                <Image
                  src="/footer image.png"
                  alt="NewtonBotics"
                  width={140}
                  height={140}
                  className="w-28 h-auto lg:w-32 object-contain"
                />

                {/* Chest reactor — blue outer */}
                <div
                  ref={chestOuterRef}
                  aria-hidden
                  className="pointer-events-none absolute left-1/2 top-[41%] -translate-x-1/2 -translate-y-1/2 w-[18%] aspect-square rounded-full"
                  style={{
                    background:
                      "radial-gradient(circle, rgba(0,180,255,0.55) 0%, rgba(0,140,255,0.2) 45%, transparent 70%)",
                    mixBlendMode: "screen",
                  }}
                />

                {/* Chest reactor — red inner */}
                <div
                  ref={chestInnerRef}
                  aria-hidden
                  className="pointer-events-none absolute left-1/2 top-[41%] -translate-x-1/2 -translate-y-1/2 w-[8%] aspect-square rounded-full"
                  style={{
                    background:
                      "radial-gradient(circle, rgba(255,60,80,0.85) 0%, rgba(255,40,60,0.35) 50%, transparent 72%)",
                    mixBlendMode: "screen",
                  }}
                />

                {/* LED accents */}
                <div
                  ref={ledBlueRef}
                  aria-hidden
                  className="pointer-events-none absolute left-[28%] top-[22%] w-1.5 h-1.5 rounded-full opacity-45"
                  style={{
                    background: "rgba(0,190,255,0.9)",
                    mixBlendMode: "screen",
                  }}
                />
                <div
                  ref={ledRedRef}
                  aria-hidden
                  className="pointer-events-none absolute right-[30%] top-[24%] w-1.5 h-1.5 rounded-full opacity-40"
                  style={{
                    background: "rgba(255,45,65,0.95)",
                    mixBlendMode: "screen",
                  }}
                />
                <div
                  ref={ledBlueAltRef}
                  aria-hidden
                  className="pointer-events-none absolute left-[34%] top-[58%] w-1 h-1 rounded-full opacity-40"
                  style={{
                    background: "rgba(0,200,255,0.85)",
                    mixBlendMode: "screen",
                  }}
                />
                <div
                  ref={ledRedAltRef}
                  aria-hidden
                  className="pointer-events-none absolute right-[33%] top-[56%] w-1 h-1 rounded-full opacity-35"
                  style={{
                    background: "rgba(255,50,70,0.9)",
                    mixBlendMode: "screen",
                  }}
                />

                {/* Helmet visor reflective sweep */}
                <div
                  aria-hidden
                  className="pointer-events-none absolute left-[34%] top-[11%] w-[32%] h-[12%] overflow-hidden rounded-[40%]"
                  style={{ mixBlendMode: "screen" }}
                >
                  <div
                    ref={visorSweepRef}
                    className="absolute inset-y-0 w-[35%] -skew-x-12"
                    style={{
                      background:
                        "linear-gradient(90deg, transparent, rgba(180,230,255,0.55), transparent)",
                      filter: "blur(1px)",
                    }}
                  />
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
