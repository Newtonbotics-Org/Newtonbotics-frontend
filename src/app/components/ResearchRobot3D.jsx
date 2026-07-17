"use client";

import { useRef, useLayoutEffect } from "react";
import Image from "next/image";
import gsap from "gsap";

const RESEARCH_ROBOT_SRC = "/reaserch area image.png";

/**
 * Research Areas figure — Three.js + GSAP full 360° cursor-follow on desktop.
 * Mobile / reduced-motion: static 2D image.
 */
export default function ResearchRobot3D() {
  const canvasHostRef = useRef(null);
  const mobileFloatRef = useRef(null);

  useLayoutEffect(() => {
    const el = mobileFloatRef.current;
    if (!el) return;

    const mm = gsap.matchMedia();
    mm.add(
      {
        isMobile: "(max-width: 1023px)",
        reduceMotion: "(prefers-reduced-motion: reduce)",
      },
      (context) => {
        const { isMobile, reduceMotion } = context.conditions;
        if (!isMobile || reduceMotion) return;

        const tween = gsap.to(el, {
          y: -6,
          duration: 3.2,
          ease: "sine.inOut",
          yoyo: true,
          repeat: -1,
        });
        return () => tween.kill();
      }
    );

    return () => mm.revert();
  }, []);

  useLayoutEffect(() => {
    const host = canvasHostRef.current;
    if (!host) return;

    let disposed = false;
    let renderer;
    let scene;
    let camera;
    let mesh;
    let texture;
    let frameId = 0;
    let floatTween;
    let introTween;
    let removePointer;
    let removeResize;

    const mm = gsap.matchMedia();

    mm.add(
      {
        isDesktop: "(min-width: 1024px)",
        reduceMotion: "(prefers-reduced-motion: reduce)",
      },
      (context) => {
        const { isDesktop, reduceMotion } = context.conditions;
        if (!isDesktop || reduceMotion) return;

        let alive = true;

        (async () => {
          const THREE = await import("three");
          if (!alive || disposed) return;

          const width = host.clientWidth || 280;
          const height = host.clientHeight || 420;

          scene = new THREE.Scene();
          camera = new THREE.PerspectiveCamera(35, width / height, 0.1, 100);
          camera.position.z = 3.4;

          renderer = new THREE.WebGLRenderer({
            antialias: true,
            alpha: true,
            powerPreference: "high-performance",
          });
          renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
          renderer.setSize(width, height, false);
          renderer.setClearColor(0x000000, 0);
          host.appendChild(renderer.domElement);
          renderer.domElement.style.width = "100%";
          renderer.domElement.style.height = "100%";
          renderer.domElement.style.display = "block";
          renderer.domElement.style.pointerEvents = "none";
          renderer.domElement.setAttribute("aria-hidden", "true");

          const loader = new THREE.TextureLoader();
          texture = await new Promise((resolve, reject) => {
            loader.load(
              RESEARCH_ROBOT_SRC,
              (tex) => resolve(tex),
              undefined,
              (err) => reject(err)
            );
          });

          if (!alive || disposed) {
            texture.dispose();
            return;
          }

          texture.colorSpace = THREE.SRGBColorSpace;
          texture.anisotropy = renderer.capabilities.getMaxAnisotropy();

          const imgAspect =
            texture.image && texture.image.width && texture.image.height
              ? texture.image.width / texture.image.height
              : 480 / 720;

          const fitPlaneSize = (cam, aspect, fill = 0.92) => {
            const dist = cam.position.z;
            const vFov = (cam.fov * Math.PI) / 180;
            const visibleH = 2 * Math.tan(vFov / 2) * dist;
            const visibleW = visibleH * cam.aspect;

            let planeH = visibleH * fill;
            let planeW = planeH * aspect;
            if (planeW > visibleW * fill) {
              planeW = visibleW * fill;
              planeH = planeW / aspect;
            }
            return { planeW, planeH };
          };

          const { planeW, planeH } = fitPlaneSize(camera, imgAspect);
          const geometry = new THREE.PlaneGeometry(planeW, planeH);
          const material = new THREE.MeshBasicMaterial({
            map: texture,
            transparent: true,
            side: THREE.DoubleSide,
            depthWrite: false,
          });

          mesh = new THREE.Mesh(geometry, material);
          mesh.rotation.y = 0;
          mesh.scale.set(0.94, 0.94, 0.94);
          material.opacity = 0;
          scene.add(mesh);

          const rotYTo = gsap.quickTo(mesh.rotation, "y", {
            duration: 0.9,
            ease: "power3.out",
          });
          const rotXTo = gsap.quickTo(mesh.rotation, "x", {
            duration: 0.9,
            ease: "power3.out",
          });

          introTween = gsap.to(material, {
            opacity: 1,
            duration: 1.1,
            ease: "power2.out",
          });
          gsap.to(mesh.scale, {
            x: 1,
            y: 1,
            z: 1,
            duration: 1.3,
            ease: "power3.out",
          });

          floatTween = gsap.to(mesh.position, {
            y: 0.04,
            duration: 3.4,
            ease: "sine.inOut",
            yoyo: true,
            repeat: -1,
            delay: 0.5,
          });

          const onPointerMove = (e) => {
            if (!mesh) return;
            const nx = gsap.utils.clamp(0, 1, e.clientX / window.innerWidth);
            const ny = gsap.utils.clamp(0, 1, e.clientY / window.innerHeight);
            rotYTo(gsap.utils.mapRange(0, 1, -Math.PI, Math.PI, nx));
            rotXTo(gsap.utils.mapRange(0, 1, 0.18, -0.18, ny));
          };

          const onResize = () => {
            if (!renderer || !camera || !host || !mesh) return;
            const w = host.clientWidth || 280;
            const h = host.clientHeight || 420;
            camera.aspect = w / h;
            camera.updateProjectionMatrix();
            renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
            renderer.setSize(w, h, false);

            const next = fitPlaneSize(camera, imgAspect);
            mesh.geometry.dispose();
            mesh.geometry = new THREE.PlaneGeometry(next.planeW, next.planeH);
          };

          window.addEventListener("pointermove", onPointerMove, { passive: true });
          window.addEventListener("resize", onResize);
          removePointer = () => window.removeEventListener("pointermove", onPointerMove);
          removeResize = () => window.removeEventListener("resize", onResize);

          const render = () => {
            if (!alive || disposed || !renderer) return;
            frameId = requestAnimationFrame(render);
            renderer.render(scene, camera);
          };
          render();
        })().catch(() => {});

        return () => {
          alive = false;
          cancelAnimationFrame(frameId);
          removePointer?.();
          removeResize?.();
          floatTween?.kill();
          introTween?.kill();
          if (mesh) {
            mesh.geometry?.dispose();
            if (mesh.material) {
              if (Array.isArray(mesh.material)) mesh.material.forEach((m) => m.dispose());
              else mesh.material.dispose();
            }
          }
          texture?.dispose();
          if (renderer) {
            renderer.dispose();
            if (renderer.domElement?.parentNode === host) {
              host.removeChild(renderer.domElement);
            }
          }
          scene = null;
          camera = null;
          mesh = null;
          renderer = null;
          texture = null;
        };
      }
    );

    return () => {
      disposed = true;
      mm.revert();
    };
  }, []);

  return (
    <div className="relative w-full max-w-[16rem] sm:max-w-[18rem] lg:max-w-none flex justify-center lg:justify-start scale-105 lg:scale-110 origin-center lg:origin-left">
      <div ref={mobileFloatRef} className="relative w-full lg:hidden">
        <Image
          src={RESEARCH_ROBOT_SRC}
          alt="NewtonBotics research robotics figure"
          width={480}
          height={720}
          className="w-48 sm:w-56 md:w-64 h-auto object-contain drop-shadow-[0_0_40px_rgba(0,180,255,0.12)] mx-auto"
        />
      </div>

      <div
        ref={canvasHostRef}
        className="relative hidden lg:block w-full aspect-[2/3] min-h-[26rem] xl:min-h-[30rem] drop-shadow-[0_0_40px_rgba(0,180,255,0.12)] pointer-events-none"
        aria-label="Interactive NewtonBotics research robot"
        role="img"
      />
    </div>
  );
}
