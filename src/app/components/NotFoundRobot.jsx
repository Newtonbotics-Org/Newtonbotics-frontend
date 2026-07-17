"use client";

import { useRef, useLayoutEffect } from "react";
import Image from "next/image";
import gsap from "gsap";

/**
 * Cinematic angry-bot GSAP system for the 404 robot.
 */
export default function NotFoundRobot() {
  const rootRef = useRef(null);
  const parallaxLayerRef = useRef(null);
  const floatLayerRef = useRef(null);
  const introLayerRef = useRef(null);
  const scaleLayerRef = useRef(null);
  const shakeLayerRef = useRef(null);
  const imageWrapRef = useRef(null);
  const chestOuterRef = useRef(null);
  const chestInnerRef = useRef(null);
  const ledBlueRef = useRef(null);
  const ledRedRef = useRef(null);
  const ledBlueAltRef = useRef(null);
  const ledRedAltRef = useRef(null);
  const visorSweepRef = useRef(null);
  const sparkRef = useRef(null);

  useLayoutEffect(() => {
    const root = rootRef.current;
    const parallaxLayer = parallaxLayerRef.current;
    const floatLayer = floatLayerRef.current;
    const introLayer = introLayerRef.current;
    const scaleLayer = scaleLayerRef.current;
    const shakeLayer = shakeLayerRef.current;
    const imageWrap = imageWrapRef.current;

    if (
      !root ||
      !parallaxLayer ||
      !floatLayer ||
      !introLayer ||
      !scaleLayer ||
      !shakeLayer ||
      !imageWrap
    ) {
      return;
    }

    const mm = gsap.matchMedia();

    mm.add("(prefers-reduced-motion: reduce)", () => {
      gsap.set(introLayer, { opacity: 1, y: 0, scale: 1, rotateY: 0 });
    });

    mm.add("(prefers-reduced-motion: no-preference)", () => {
      const glowTargets = [
        chestOuterRef.current,
        chestInnerRef.current,
        ledBlueRef.current,
        ledRedRef.current,
        ledBlueAltRef.current,
        ledRedAltRef.current,
        visorSweepRef.current,
        sparkRef.current,
      ];

      gsap.set(introLayer, {
        opacity: 0,
        y: 90,
        scale: 0.55,
        rotateY: -28,
        rotateZ: -8,
        transformPerspective: 1400,
        force3D: true,
      });
      gsap.set([parallaxLayer, floatLayer, scaleLayer, shakeLayer, imageWrap, ...glowTargets], {
        force3D: true,
      });
      gsap.set(sparkRef.current, { opacity: 0, scale: 0.4 });
      gsap.set(chestOuterRef.current, {
        opacity: 0.4,
        scale: 1,
        filter: "blur(10px) drop-shadow(0 0 22px rgba(255,40,60,0.75))",
      });
      gsap.set(chestInnerRef.current, {
        opacity: 0.45,
        scale: 1,
        filter: "blur(3px) drop-shadow(0 0 12px rgba(255,40,60,0.85))",
      });
      gsap.set(visorSweepRef.current, { xPercent: -120, opacity: 0 });
      gsap.set(imageWrap, {
        filter: "drop-shadow(0 12px 28px rgba(239,68,68,0.25))",
      });

      // —— Cinematic slam-in ——
      const introTl = gsap.timeline();
      introTl
        .to(introLayer, {
          opacity: 1,
          y: 0,
          scale: 1.12,
          rotateY: 8,
          rotateZ: 2,
          duration: 0.85,
          ease: "power4.out",
        })
        .to(introLayer, {
          scale: 1,
          rotateY: 0,
          rotateZ: 0,
          duration: 0.55,
          ease: "elastic.out(1, 0.55)",
        })
        .fromTo(
          sparkRef.current,
          { opacity: 0, scale: 0.3 },
          { opacity: 0.9, scale: 1.4, duration: 0.25, ease: "power2.out" },
          "-=0.35"
        )
        .to(sparkRef.current, {
          opacity: 0,
          scale: 2.2,
          duration: 0.55,
          ease: "power2.in",
        });

      // —— Hovering float + slight sway ——
      const floatTween = gsap.to(floatLayer, {
        y: -14,
        duration: 2.8,
        ease: "sine.inOut",
        yoyo: true,
        repeat: -1,
        delay: 1.4,
      });

      const swayTween = gsap.to(floatLayer, {
        rotateZ: 2.5,
        duration: 3.2,
        ease: "sine.inOut",
        yoyo: true,
        repeat: -1,
        delay: 1.5,
      });

      // —— Breathing ——
      const breathTween = gsap.to(scaleLayer, {
        scale: 1.035,
        duration: 2.1,
        ease: "sine.inOut",
        yoyo: true,
        repeat: -1,
        delay: 1.6,
      });

      // —— Angry twitch every few seconds ——
      const angerTl = gsap.timeline({
        repeat: -1,
        delay: 2.8,
        repeatDelay: 3.4,
      });
      angerTl
        .to(shakeLayer, {
          x: 3,
          rotateZ: 1.5,
          duration: 0.05,
          ease: "power1.inOut",
        })
        .to(shakeLayer, { x: -4, rotateZ: -2, duration: 0.06 })
        .to(shakeLayer, { x: 3, rotateZ: 1.2, duration: 0.05 })
        .to(shakeLayer, { x: -2, rotateZ: -0.8, duration: 0.05 })
        .to(shakeLayer, { x: 0, rotateZ: 0, duration: 0.08 })
        .to(
          imageWrap,
          {
            filter: "drop-shadow(0 0 32px rgba(239,68,68,0.75))",
            duration: 0.15,
          },
          0
        )
        .to(imageWrap, {
          filter: "drop-shadow(0 12px 28px rgba(239,68,68,0.25))",
          duration: 0.45,
        })
        .fromTo(
          sparkRef.current,
          { opacity: 0, scale: 0.5 },
          { opacity: 0.75, scale: 1.2, duration: 0.12 },
          0
        )
        .to(sparkRef.current, { opacity: 0, scale: 1.8, duration: 0.35 }, 0.12);

      // —— Chest reactor (angry red-forward) ——
      const chestOuter = gsap.to(chestOuterRef.current, {
        scale: 1.35,
        opacity: 0.95,
        filter: "blur(12px) drop-shadow(0 0 36px rgba(239,68,68,0.95))",
        duration: 1.15,
        ease: "sine.inOut",
        yoyo: true,
        repeat: -1,
        delay: 1.5,
      });

      const chestInner = gsap.to(chestInnerRef.current, {
        scale: 1.4,
        opacity: 1,
        filter: "blur(4px) drop-shadow(0 0 18px rgba(255,40,60,1))",
        duration: 0.85,
        ease: "sine.inOut",
        yoyo: true,
        repeat: -1,
        delay: 1.55,
      });

      // —— LED pulses ——
      const ledBlue = gsap.to(ledBlueRef.current, {
        opacity: 1,
        scale: 1.45,
        filter: "blur(2px) drop-shadow(0 0 10px rgba(0,180,255,1))",
        duration: 1.1,
        ease: "sine.inOut",
        yoyo: true,
        repeat: -1,
        delay: 1.6,
      });

      const ledRed = gsap.to(ledRedRef.current, {
        opacity: 1,
        scale: 1.55,
        filter: "blur(2px) drop-shadow(0 0 12px rgba(255,40,60,1))",
        duration: 0.75,
        ease: "power1.inOut",
        yoyo: true,
        repeat: -1,
        delay: 1.7,
      });

      const ledBlueAlt = gsap.to(ledBlueAltRef.current, {
        opacity: 0.95,
        scale: 1.35,
        filter: "blur(2px) drop-shadow(0 0 8px rgba(0,200,255,0.95))",
        duration: 1.55,
        ease: "sine.inOut",
        yoyo: true,
        repeat: -1,
        delay: 1.8,
      });

      const ledRedAlt = gsap.to(ledRedAltRef.current, {
        opacity: 0.95,
        scale: 1.5,
        filter: "blur(2px) drop-shadow(0 0 10px rgba(255,50,70,1))",
        duration: 0.95,
        ease: "sine.inOut",
        yoyo: true,
        repeat: -1,
        delay: 1.85,
      });

      // —— Visor sweep (faster, more frequent) ——
      const visorTl = gsap.timeline({
        repeat: -1,
        repeatDelay: 2.8,
        delay: 2.2,
      });
      visorTl
        .set(visorSweepRef.current, { xPercent: -130, opacity: 0 })
        .to(visorSweepRef.current, {
          xPercent: 30,
          opacity: 0.75,
          duration: 0.4,
          ease: "power2.out",
        })
        .to(visorSweepRef.current, {
          xPercent: 170,
          opacity: 0,
          duration: 0.45,
          ease: "power2.in",
        });

      // —— Mouse parallax ——
      const xTo = gsap.quickTo(parallaxLayer, "x", { duration: 0.55, ease: "power3.out" });
      const yTo = gsap.quickTo(parallaxLayer, "y", { duration: 0.55, ease: "power3.out" });
      const rotYTo = gsap.quickTo(parallaxLayer, "rotateY", {
        duration: 0.65,
        ease: "power3.out",
      });
      const rotXTo = gsap.quickTo(parallaxLayer, "rotateX", {
        duration: 0.65,
        ease: "power3.out",
      });

      let hovering = false;

      const onPointerMove = (e) => {
        const rect = root.getBoundingClientRect();
        const cx = rect.left + rect.width / 2;
        const cy = rect.top + rect.height / 2;
        const nx = gsap.utils.clamp(-1, 1, (e.clientX - cx) / Math.max(rect.width, 60));
        const ny = gsap.utils.clamp(-1, 1, (e.clientY - cy) / Math.max(rect.height, 60));

        const maxRotY = hovering ? 18 : 14;
        const maxRotX = hovering ? 10 : 7;
        const maxX = hovering ? 18 : 14;
        const maxY = hovering ? 14 : 10;

        xTo(nx * maxX);
        yTo(ny * maxY);
        rotYTo(nx * maxRotY);
        rotXTo(-ny * maxRotX);
      };

      const onEnter = () => {
        hovering = true;
        breathTween.pause();
        angerTl.pause();
        chestOuter.pause();
        chestInner.pause();

        gsap.to(scaleLayer, {
          scale: 1.08,
          duration: 0.4,
          ease: "power3.out",
          overwrite: "auto",
        });
        gsap.to(chestOuterRef.current, {
          opacity: 1,
          scale: 1.55,
          filter: "blur(14px) drop-shadow(0 0 48px rgba(239,68,68,1))",
          duration: 0.4,
          ease: "power2.out",
          overwrite: "auto",
        });
        gsap.to(chestInnerRef.current, {
          opacity: 1,
          scale: 1.65,
          filter: "blur(5px) drop-shadow(0 0 28px rgba(255,40,60,1))",
          duration: 0.4,
          ease: "power2.out",
          overwrite: "auto",
        });
        gsap.to(imageWrap, {
          filter: "drop-shadow(0 0 40px rgba(239,68,68,0.85))",
          duration: 0.4,
          overwrite: "auto",
        });
        gsap.fromTo(
          shakeLayer,
          { x: 0 },
          {
            x: 2,
            duration: 0.04,
            yoyo: true,
            repeat: 7,
            ease: "power1.inOut",
          }
        );
      };

      const onLeave = () => {
        hovering = false;

        gsap.to(scaleLayer, {
          scale: 1,
          duration: 0.55,
          ease: "power3.out",
          overwrite: "auto",
          onComplete: () => {
            breathTween.resume();
            angerTl.resume();
          },
        });
        gsap.to(chestOuterRef.current, {
          opacity: 0.55,
          scale: 1,
          filter: "blur(10px) drop-shadow(0 0 22px rgba(255,40,60,0.75))",
          duration: 0.55,
          ease: "power2.out",
          overwrite: "auto",
          onComplete: () => chestOuter.resume(),
        });
        gsap.to(chestInnerRef.current, {
          opacity: 0.5,
          scale: 1,
          filter: "blur(3px) drop-shadow(0 0 12px rgba(255,40,60,0.85))",
          duration: 0.55,
          ease: "power2.out",
          overwrite: "auto",
          onComplete: () => chestInner.resume(),
        });
        gsap.to(imageWrap, {
          filter: "drop-shadow(0 12px 28px rgba(239,68,68,0.25))",
          duration: 0.55,
          overwrite: "auto",
        });

        xTo(0);
        yTo(0);
        rotYTo(0);
        rotXTo(0);
      };

      window.addEventListener("pointermove", onPointerMove, { passive: true });
      root.addEventListener("pointerenter", onEnter);
      root.addEventListener("pointerleave", onLeave);

      return () => {
        window.removeEventListener("pointermove", onPointerMove);
        root.removeEventListener("pointerenter", onEnter);
        root.removeEventListener("pointerleave", onLeave);
        introTl.kill();
        floatTween.kill();
        swayTween.kill();
        breathTween.kill();
        angerTl.kill();
        chestOuter.kill();
        chestInner.kill();
        ledBlue.kill();
        ledRed.kill();
        ledBlueAlt.kill();
        ledRedAlt.kill();
        visorTl.kill();
      };
    });

    return () => mm.revert();
  }, []);

  return (
    <div
      ref={rootRef}
      className="relative w-24 h-28 sm:w-32 sm:h-36 md:w-40 md:h-44 mb-2 sm:mb-3 shrink-0 pointer-events-auto select-none"
      style={{ perspective: "1400px" }}
    >
      {/* Impact spark */}
      <div
        ref={sparkRef}
        aria-hidden
        className="pointer-events-none absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-[70%] aspect-square rounded-full opacity-0"
        style={{
          background:
            "radial-gradient(circle, rgba(255,255,255,0.85) 0%, rgba(239,68,68,0.55) 35%, transparent 70%)",
          mixBlendMode: "screen",
        }}
      />

      <div
        ref={parallaxLayerRef}
        className="relative w-full h-full will-change-transform"
        style={{ transformStyle: "preserve-3d" }}
      >
        <div ref={floatLayerRef} className="relative w-full h-full will-change-transform">
          <div
            ref={introLayerRef}
            className="relative w-full h-full will-change-transform"
            style={{ transformStyle: "preserve-3d" }}
          >
            <div ref={shakeLayerRef} className="relative w-full h-full will-change-transform">
              <div ref={scaleLayerRef} className="relative w-full h-full will-change-transform">
                <div ref={imageWrapRef} className="relative w-full h-full will-change-transform">
                  <Image
                    src="/footer image.png"
                    alt=""
                    fill
                    className="object-contain"
                    priority
                    sizes="(max-width: 640px) 96px, (max-width: 768px) 128px, 160px"
                  />

                  <div
                    ref={chestOuterRef}
                    aria-hidden
                    className="pointer-events-none absolute left-1/2 top-[41%] -translate-x-1/2 -translate-y-1/2 w-[22%] aspect-square rounded-full"
                    style={{
                      background:
                        "radial-gradient(circle, rgba(239,68,68,0.65) 0%, rgba(239,68,68,0.2) 45%, transparent 70%)",
                      mixBlendMode: "screen",
                    }}
                  />

                  <div
                    ref={chestInnerRef}
                    aria-hidden
                    className="pointer-events-none absolute left-1/2 top-[41%] -translate-x-1/2 -translate-y-1/2 w-[10%] aspect-square rounded-full"
                    style={{
                      background:
                        "radial-gradient(circle, rgba(255,80,100,0.95) 0%, rgba(255,40,60,0.4) 50%, transparent 72%)",
                      mixBlendMode: "screen",
                    }}
                  />

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

                  <div
                    aria-hidden
                    className="pointer-events-none absolute left-[34%] top-[11%] w-[32%] h-[12%] overflow-hidden rounded-[40%]"
                    style={{ mixBlendMode: "screen" }}
                  >
                    <div
                      ref={visorSweepRef}
                      className="absolute inset-y-0 w-[40%] -skew-x-12"
                      style={{
                        background:
                          "linear-gradient(90deg, transparent, rgba(255,200,200,0.7), transparent)",
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
    </div>
  );
}
