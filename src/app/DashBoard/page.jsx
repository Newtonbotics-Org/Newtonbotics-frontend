"use client";
import { useState, useEffect } from "react";
import Link from "next/link";
import { ArrowRight, X } from "lucide-react";
import SectionLabel from "@/components/lab/SectionLabel";
import LatestBar from "@/components/home/LatestBar";
import HomeStats from "@/components/home/HomeStats";
import HomeResearch from "@/components/home/HomeResearch";
import HomeProjects from "@/components/home/HomeProjects";
import HomeEvents from "@/components/home/HomeEvents";
import HeroRobot3D, { cueRobot } from "@/components/home/HeroRobot3D";
import ScrambleWord from "@/components/home/ScrambleWord";
import LabPhotoMosaic from "@/components/lab/LabPhotoMosaic";

const LAB_EQUIPMENT = [
  ["3D printers", "Prototyping robot parts"],
  ["Arduino, ESP32 & STM32 boards", "Microcontrollers"],
  ["Raspberry Pi 4", "AI & IoT compute"],
  ["LiDAR, IMU & sensor kits", "Perception"],
  ["Servos, steppers & drivers", "Actuation"],
  ["Drone components", "Aerial builds"],
  ["Oscilloscopes & multimeters", "Test & measurement"],
  ["Soldering stations", "Electronics bench"],
];

const MILESTONES = [
  { year: "2024", title: "Lab founded", text: "Started by four CS-AI students from the 2023 batch.", dot: "bg-night-text" },
  { year: "2024", title: "2nd prize, Technoxian", text: "First podium finish at the Technoxian robotics championship.", dot: "bg-signal" },
  { year: "2025", title: "Nidar 2025", text: "Selected to compete in the national drone challenge.", dot: "bg-night-text" },
  { year: "Today", title: "A growing core team", text: "20+ workshops and 100+ hours of training delivered.", dot: "border-2 border-ink bg-paper" },
];

// What the lab's robots do: hexapods walk, drones fly, AI thinks, swarms swarm, arms grab
const HERO_VERBS = ["WALK.", "FLY.", "THINK.", "SWARM.", "GRAB."];

const HomePage = () => {
  const [roleNotice, setRoleNotice] = useState(null);

  useEffect(() => {
    try {
      const raw = localStorage.getItem("nb_role_notice");
      if (raw) {
        setRoleNotice(JSON.parse(raw));
        localStorage.removeItem("nb_role_notice");
      }
    } catch (_) {}
  }, []);

  // Auto-dismiss role notice after 5 seconds
  useEffect(() => {
    if (!roleNotice) return;
    const timeoutId = setTimeout(() => setRoleNotice(null), 5000);
    return () => clearTimeout(timeoutId);
  }, [roleNotice]);

  return (
    <main className="nb-dark bg-paper text-ink" itemScope itemType="https://schema.org/WebPage">
      {roleNotice && (
        <div
          role="status"
          className="fixed left-1/2 top-24 z-50 w-[min(92%,26rem)] -translate-x-1/2 rounded-lg border border-line bg-surface px-4 py-3 pr-10 text-sm shadow-[0_12px_32px_rgba(14,16,19,0.16)]"
        >
          <button
            type="button"
            onClick={() => setRoleNotice(null)}
            aria-label="Dismiss notification"
            className="absolute right-2 top-2 inline-flex h-7 w-7 items-center justify-center rounded text-ink-muted hover:bg-paper hover:text-ink"
          >
            <X size={16} aria-hidden="true" />
          </button>
          {roleNotice.message || (
            <>
              Your requested role <strong>{roleNotice.requestedRole}</strong> is not pre-approved. You have been
              registered as <strong>{roleNotice.assignedRole}</strong>.
            </>
          )}
        </div>
      )}

      {/* First screen: the hero slides up under the floating glass navbar and fills the viewport on desktop */}
      <div className="-mt-[var(--nb-nav-height,72px)] lg:flex lg:h-[100svh] lg:min-h-[640px] lg:flex-col">

      {/* Hero */}
      <section
        className="relative isolate overflow-hidden text-night-text lg:min-h-0 lg:flex-1"
        style={{
          // Black with a faint blueprint grid; top padding keeps the copy clear of the glass navbar
          paddingTop: "var(--nb-nav-height, 72px)",
          backgroundColor: "#0E1013",
          backgroundImage:
            "linear-gradient(rgba(233,234,230,0.04) 1px, transparent 1px), linear-gradient(90deg, rgba(233,234,230,0.04) 1px, transparent 1px)",
          backgroundSize: "48px 48px",
        }}
        itemScope
        itemType="https://schema.org/Organization"
      >
        <div className="nb-container relative grid grid-cols-1 items-center gap-6 pb-12 pt-6 sm:pt-8 lg:h-full lg:grid-cols-[1.1fr_0.9fr] lg:gap-10 lg:py-[clamp(20px,4vh,48px)]">
          {/* Below lg this wrapper dissolves (`contents`) so the robot can sit between the headline and the copy:
              headline → robot → description → CTAs */}
          <div className="contents lg:relative lg:z-10 lg:flex lg:min-w-0 lg:flex-col lg:gap-[clamp(14px,3.2vh,32px)]">
            <h1
              className="order-1 m-0 font-display font-bold uppercase leading-[0.92] tracking-[-0.03em] lg:order-none"
              style={{ fontSize: "clamp(42px, min(7.4vw, 11.5vh), 104px)" }}
            >
              <span className="sr-only">
                <span itemProp="name">NewtonBotics</span> — we build robots that walk, fly, think, swarm and grab.
              </span>
              <span aria-hidden="true">
                We build
                <br />
                robots that
                <br />
                <ScrambleWord
                  words={HERO_VERBS}
                  className="bg-gradient-to-r from-signal to-signal-light bg-clip-text text-transparent drop-shadow-[0_0_24px_rgba(255,90,31,0.35)]"
                />
              </span>
            </h1>

            <p className="order-3 m-0 max-w-[520px] text-base leading-relaxed text-night-soft sm:text-lg lg:order-none" itemProp="description">
              <span className="mb-2 block font-mono text-xs uppercase tracking-[0.14em] text-signal-light">
                Robotics lab · NST × Rishihood University · Est. 2024
              </span>
              The student robotics lab at Rishihood University. We take ideas from a sketch on a whiteboard to a
              national podium — and we&apos;ll teach you how, even if you&apos;ve never held a soldering iron.
            </p>

            <div className="order-4 flex items-center gap-2 sm:flex-wrap sm:gap-3 lg:order-none">
              <Link
                href="/Projects"
                onMouseEnter={() => cueRobot("point")}
                onFocus={() => cueRobot("point")}
                className="group inline-flex h-[46px] flex-[1.4] sm:h-[52px] items-center justify-center gap-2 rounded-full border border-signal px-4 font-mono sm:flex-none sm:gap-3 sm:px-7 whitespace-nowrap text-[11px] font-semibold uppercase tracking-[0.06em] min-[400px]:text-xs min-[400px]:tracking-[0.12em] text-night-text no-underline shadow-[0_0_0_0_rgba(255,90,31,0)] transition-all hover:bg-signal hover:text-night hover:shadow-[0_0_32px_rgba(255,90,31,0.45)]"
              >
                Explore projects
                <ArrowRight size={16} aria-hidden="true" className="text-signal transition-transform group-hover:translate-x-1 group-hover:text-night" />
              </Link>
              <Link
                href="/auth?tab=signup"
                onMouseEnter={() => cueRobot("celebrate")}
                onFocus={() => cueRobot("celebrate")}
                className="inline-flex h-[46px] flex-1 items-center sm:h-[52px] justify-center rounded-full border border-night-line-strong px-4 font-mono sm:flex-none sm:px-6 whitespace-nowrap text-[11px] font-semibold uppercase tracking-[0.06em] min-[400px]:text-xs min-[400px]:tracking-[0.12em] text-night-soft no-underline transition-colors hover:text-night-text lg:border-transparent lg:px-5 lg:text-night-muted"
              >
                Join the lab
              </Link>
            </div>

            <div className="order-5 hidden flex-wrap items-center gap-x-4 gap-y-2 font-mono text-[11px] uppercase tracking-[0.14em] text-night-muted sm:flex lg:order-none">
              <span>Design</span>
              <span aria-hidden="true" className="h-3 w-px bg-night-line-strong" />
              <span>Prototype</span>
              <span aria-hidden="true" className="h-3 w-px bg-night-line-strong" />
              <span>Compete</span>
              <Link
                href="/contact"
                className="ml-auto hidden items-center gap-2 text-night-soft no-underline hover:text-night-text lg:inline-flex"
              >
                <span className="h-2 w-2 animate-pulse rounded-full bg-signal" aria-hidden="true" />
                Open lab · Room 407
              </Link>
            </div>
          </div>

          {/* Mascot — live 3D render. Below lg: between the headline and the description. Large screens: fills the
              right of the hero behind the copy. The glow lives inside this box so it always sits behind the robot. */}
          <div className="pointer-events-none relative order-2 mx-auto -my-2 h-[min(40svh,340px)] w-full max-w-[480px] sm:h-[460px] lg:absolute lg:inset-y-0 lg:right-[-8%] lg:order-none lg:mx-0 lg:my-0 lg:h-auto lg:w-[64%] lg:max-w-none">
            <div
              aria-hidden="true"
              className="absolute left-1/2 top-1/2 -z-10 aspect-square w-[130%] max-w-[760px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-[radial-gradient(circle,rgba(255,90,31,0.28)_0%,rgba(255,90,31,0.07)_40%,transparent_70%)]"
            />
            <HeroRobot3D
              className="absolute inset-0"
              style={{
                maskImage: "radial-gradient(ellipse 62% 96% at 50% 48%, #000 70%, transparent 100%)",
                WebkitMaskImage: "radial-gradient(ellipse 62% 96% at 50% 48%, #000 70%, transparent 100%)",
              }}
            />
          </div>
        </div>
      </section>
      </div>

      <LatestBar />

      <div className="nb-container pt-12 sm:pt-16">
        <HomeStats />
      </div>

      <HomeResearch />
      <HomeProjects />

      {/* The lab */}
      <section className="mt-24 border-y border-line bg-surface text-ink sm:mt-28" aria-labelledby="home-lab">
        <div className="nb-container flex flex-col gap-12 py-24 sm:py-28">
          <SectionLabel index="03">
            The lab
          </SectionLabel>
          <div className="flex flex-wrap items-start gap-14">
            <div className="flex min-w-0 flex-[1_1_460px] flex-col gap-6">
              <h2 id="home-lab" className="nb-h2 m-0">
                A real workshop, open to every student.
              </h2>
              <p className="m-0 max-w-[520px] text-[17px] leading-relaxed text-ink-muted">
                Prototype parts on the 3D printers, wire up circuits at the soldering benches and test on real
                instruments. Members book equipment through the lab inventory.
              </p>
              <div className="flex flex-wrap gap-3">
                <Link href="/Inventory" className="nb-btn nb-btn-accent">
                  Browse lab inventory
                </Link>
                <Link href="/contact" className="nb-btn nb-btn-secondary">
                  Plan a visit
                </Link>
              </div>
              {/* A real lab photo from the Gallery; hidden rather than replaced by a stock image */}
              <LabPhotoMosaic count={1} size="sm" className="mt-4 rounded-md border border-line" />
            </div>
            <dl className="m-0 min-w-0 flex-[1_1_460px] border-t border-ink">
              {LAB_EQUIPMENT.map(([name, use]) => (
                <div key={name} className="flex flex-wrap justify-between gap-4 border-b border-line py-[18px]">
                  <dt className="font-display text-lg font-medium">{name}</dt>
                  <dd className="m-0 font-mono text-[13px] text-ink-muted">{use}</dd>
                </div>
              ))}
            </dl>
          </div>
        </div>
      </section>

      <HomeEvents />

      {/* Milestones */}
      <section className="nb-container flex flex-col gap-10 pt-24 sm:pt-28" aria-labelledby="home-milestones">
        <SectionLabel index="05">
          <span id="home-milestones">Milestones</span>
        </SectionLabel>
        <ol className="m-0 grid list-none grid-cols-[repeat(auto-fit,minmax(240px,1fr))] border-t-2 border-ink p-0">
          {MILESTONES.map((m) => (
            <li key={m.title} className="relative flex flex-col gap-2.5 pb-6 pr-6 pt-6">
              <span aria-hidden="true" className={`absolute -top-[7px] left-0 h-3 w-3 rounded-full ${m.dot}`} />
              <span className="mt-2 font-mono text-[13px] text-ink-muted">{m.year}</span>
              <span className="font-display text-xl font-semibold">{m.title}</span>
              <span className="text-[15px] leading-relaxed text-ink-muted">{m.text}</span>
            </li>
          ))}
        </ol>
      </section>

      {/* Calls to action */}
      <section className="nb-container py-24 sm:py-28">
        <div className="flex flex-wrap gap-4">
          <div className="flex min-w-0 flex-[1_1_420px] flex-col gap-5 rounded-lg bg-signal p-8 sm:p-12">
            <span className="font-mono text-xs uppercase tracking-[0.08em]">Have an idea?</span>
            <span
              className="font-display font-semibold leading-[1.1] tracking-[-0.02em]"
              style={{ fontSize: "clamp(28px, 3vw, 40px)" }}
            >
              Pitch a robot. We&apos;ll help you build it.
            </span>
            <Link href="/projectRequest" className="nb-btn nb-btn-primary mt-2 self-start">
              Submit a project request
            </Link>
          </div>
          <div className="nb-card flex min-w-0 flex-[1_1_420px] flex-col gap-5 p-8 sm:p-12">
            <span className="nb-eyebrow">Become a member</span>
            <span
              className="font-display font-semibold leading-[1.1] tracking-[-0.02em]"
              style={{ fontSize: "clamp(28px, 3vw, 40px)" }}
            >
              No experience needed. Just curiosity.
            </span>
            <Link href="/auth?tab=signup" className="nb-btn nb-btn-outline mt-2 self-start">
              Create an account
            </Link>
          </div>
        </div>
      </section>
    </main>
  );
};

export default HomePage;
