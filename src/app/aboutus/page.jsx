"use client";
import React, { useState, useEffect } from "react";
import Image from "next/image";
import Link from "next/link";
import { Linkedin, MapPin, ArrowUpRight } from "lucide-react";
import CropFrame from "@/components/lab/CropFrame";
import RemoteImage from "@/components/RemoteImage";
import LabPhotoMosaic from "@/components/lab/LabPhotoMosaic";
import clubData from "../AllDatas/data.json";
import { API_BASE_URL, apiRequest } from "@/lib/api";
import { formatTenureRange, tenureSortValue } from "@/lib/tenureDates";

const MAP_EMBED_SRC =
  "https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3500.1234567890123!2d77.090004!3d28.982852!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x0%3A0x0!2zMjjCsDU4JzU4LjMiTiA3N8KwMDUnMjQuMCJF!5e0!3m2!1sen!2sin!4v1234567890123";
const MAP_LINK =
  "https://www.google.com/maps?ll=28.982852,77.090004&z=13&t=m&hl=en&gl=IN&mapclient=embed&cid=17560836703297234031";

/** Mono section marker rendered as a heading: "[01] How it started ———". */
function SectionHeading({ index, children, rule = true, id }) {
  return (
    <h2
      id={id}
      className="m-0 flex items-center gap-3 font-mono text-xs font-normal uppercase tracking-[0.08em] text-ink-muted"
    >
      <span className="text-signal-text">[{index}]</span>
      <span>{children}</span>
      {rule && <span aria-hidden="true" className="h-px flex-1 bg-line" />}
    </h2>
  );
}

function joinNames(names) {
  if (names.length <= 1) return names.join("");
  return `${names.slice(0, -1).join(", ")} and ${names[names.length - 1]}`;
}

function initials(name = "") {
  return name
    .split(" ")
    .filter(Boolean)
    .map((w) => w[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();
}

const AboutUs = () => {
  // Past leaders (admin-controlled via the admin panel)
  const [pastLeaders, setPastLeaders] = useState([]);

  useEffect(() => {
    let isMounted = true;
    const fetchPastLeaders = async () => {
      try {
        const res = await apiRequest(`${API_BASE_URL}/past-leaders?isActive=true&limit=200`, { cache: 'no-store' });
        if (!res.ok) return;
        const data = await res.json();
        if (isMounted && data.success) setPastLeaders(data.data.items || []);
      } catch (_) {
        // Silently ignore; section stays hidden when nothing loads
      }
    };
    fetchPastLeaders();
    return () => { isMounted = false; };
  }, []);

  const tenureLabel = (l) => formatTenureRange(l.tenureStart, l.tenureEnd);
  const leaderGroups = Object.entries(
    pastLeaders.reduce((acc, l) => {
      const label = tenureLabel(l);
      (acc[label] = acc[label] || []).push(l);
      return acc;
    }, {})
  ).sort((a, b) => tenureSortValue(b[1][0]?.tenureStart) - tenureSortValue(a[1][0]?.tenureStart));

  // Derived data for About content
  const establishedYear = clubData?.clubInfo?.founded;
  const founders = clubData?.clubInfo?.foundedBy || [];
  const mission = clubData?.clubInfo?.mission;
  const vision = clubData?.clubInfo?.vision;
  const foundersData = clubData?.founders || [];
  const achievements = clubData?.achievements || [];
  const coreMembers = clubData?.coreMemberCount || clubData?.coreMembers?.length || 0;
  const equipment = clubData?.labDetails?.equipment || [];
  const facilities = clubData?.labDetails?.facilities || [];

  const whatWeDo = [
    {
      title: "Build",
      body: "Hands-on projects from humanoids to drones, run by student teams with a mentor.",
    },
    {
      title: "Teach",
      body: "20+ workshops and 100+ hours of training for members at every level.",
    },
    {
      title: "Compete",
      body: "National competitions like Technoxian and Nidar.",
    },
    {
      title: "Share",
      body: "A tracked inventory of tools and parts members can borrow for their own builds.",
    },
  ];

  return (
    <main className="nb-dark bg-paper text-ink">
      <header className="nb-blueprint border-b border-line">
        <div className="nb-container flex flex-col gap-6 pb-16 pt-16 sm:pt-24">
          <span className="nb-eyebrow">NewtonBotics / Our story</span>
          <h1
            className="m-0 max-w-[1100px] font-display font-semibold leading-[0.95] tracking-[-0.04em]"
            style={{ fontSize: "clamp(2.75rem, 7vw, 6.5rem)" }}
          >
            Four students, one empty room, and a lot of <span className="text-signal-text">solder</span>.
          </h1>
        </div>
      </header>

      <div className="nb-container pt-14">
        <CropFrame caption="Fig. 01 — From the lab gallery" captionRight="Room 407 · Rishihood University">
          {/* Real photos from the Gallery; if none load, a lab fact sheet instead of a stock image */}
          <LabPhotoMosaic
            fallback={
              <div className="nb-blueprint-sm grid h-[260px] grid-cols-2 content-center gap-px overflow-hidden rounded sm:h-[420px] sm:grid-cols-4 lg:h-[520px]">
                {[
                  [establishedYear, "Founded"],
                  [coreMembers ? `${coreMembers}` : "—", "Core members"],
                  [equipment.length ? `${equipment.length}+` : "—", "Kinds of equipment"],
                  ["407", "Room · Academic Block"],
                ].map(([value, label]) => (
                  <div key={label} className="flex flex-col items-center gap-2 px-4 py-6 text-center">
                    <span className="font-display text-[clamp(2.25rem,5vw,4rem)] font-semibold leading-none tracking-[-0.03em]">
                      {value}
                    </span>
                    <span className="font-mono text-xs uppercase tracking-[0.06em] text-ink-muted">{label}</span>
                  </div>
                ))}
              </div>
            }
          />
        </CropFrame>
      </div>

      {/* How it started */}
      <section className="nb-container flex flex-wrap gap-x-16 gap-y-6 pt-24 sm:pt-28">
        <div className="min-w-0 flex-[1_1_280px]">
          <SectionHeading index="01" rule={false}>
            How it started
          </SectionHeading>
        </div>
        <div className="flex min-w-0 flex-[2_1_560px] flex-col gap-5 text-[17px] leading-[1.7] text-ink-body sm:text-[19px]">
          <p className="m-0">
            NewtonBotics began in {establishedYear} at Rishihood University, when four students from the first batch
            {founders.length > 0 && <> — {joinNames(founders)} —</>} set out to build a hands-on robotics culture from
            the ground up.
          </p>
          <p className="m-0">
            Starting with a small lab and a few kits, the club grew into a collaborative hub for humanoid systems, drone
            technology, computer vision and embedded platforms.
            {coreMembers > 0 && <> Today it&apos;s a lab of {coreMembers} core members.</>}
          </p>
          {achievements.length > 0 && (
            <ul className="m-0 mt-2 flex list-none flex-col border-t border-ink p-0 text-base">
              {achievements.map((a) => (
                <li key={a} className="flex gap-3 border-b border-line py-3.5">
                  <span aria-hidden="true" className="mt-[9px] h-1.5 w-1.5 flex-none rounded-full bg-signal" />
                  <span>{a}</span>
                </li>
              ))}
            </ul>
          )}
        </div>
      </section>

      {/* Mission / vision */}
      <section className="nb-container pt-24 sm:pt-28" aria-label="Mission and vision">
        <div className="grid grid-cols-[repeat(auto-fit,minmax(min(320px,100%),1fr))] gap-4">
          <div className="flex min-h-[280px] flex-col gap-5 rounded-lg bg-ink p-8 text-night-text sm:p-12">
            <h2 className="m-0 font-mono text-xs font-normal uppercase tracking-[0.08em] text-signal-light">Mission</h2>
            <p
              className="m-0 font-display font-semibold leading-[1.15] tracking-[-0.02em]"
              style={{ fontSize: "clamp(1.625rem, 2.6vw, 2.25rem)" }}
            >
              {mission}
            </p>
          </div>
          <div className="flex min-h-[280px] flex-col gap-5 rounded-lg bg-signal p-8 text-ink sm:p-12">
            <h2 className="m-0 font-mono text-xs font-normal uppercase tracking-[0.08em]">Vision</h2>
            <p
              className="m-0 font-display font-semibold leading-[1.15] tracking-[-0.02em]"
              style={{ fontSize: "clamp(1.625rem, 2.6vw, 2.25rem)" }}
            >
              {vision}
            </p>
          </div>
        </div>
      </section>

      {/* What we do */}
      <section className="nb-container flex flex-col gap-10 pt-24 sm:pt-28">
        <SectionHeading index="02">What we do</SectionHeading>
        <div className="grid grid-cols-[repeat(auto-fit,minmax(min(240px,100%),1fr))] border-t border-ink">
          {whatWeDo.map((item) => (
            <div key={item.title} className="flex flex-col gap-3 border-b border-line py-7 pr-7">
              <h3 className="m-0 font-display text-[22px] font-semibold">{item.title}</h3>
              <p className="m-0 text-[15px] leading-relaxed text-ink-muted">{item.body}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Founding team */}
      {foundersData.length > 0 && (
        <section className="nb-container flex flex-col gap-10 pt-24 sm:pt-28">
          <SectionHeading index="03">Founding team{establishedYear ? ` · ${establishedYear}` : ""}</SectionHeading>
          <div className="grid grid-cols-[repeat(auto-fill,minmax(min(260px,100%),1fr))] gap-4">
            {foundersData.map((f) => (
              <article key={f.name} className="nb-card flex flex-col overflow-hidden">
                <Image
                  src={f.image}
                  alt={`Portrait of ${f.name}`}
                  width={400}
                  height={300}
                  sizes="(max-width: 640px) 100vw, 300px"
                  className="block h-[280px] w-full object-cover grayscale contrast-[1.05]"
                />
                <div className="flex flex-col gap-2 px-6 pb-6 pt-5">
                  <h3 className="m-0 font-display text-xl font-semibold">{f.name}</h3>
                  <span className="font-mono text-xs uppercase tracking-[0.04em] text-ink-muted">
                    {[f.role?.trim(), f.batch?.replace(/^Batch,\s*/i, "Batch ")].filter(Boolean).join(" · ")}
                  </span>
                  {f.bio && <p className="m-0 text-sm leading-relaxed text-ink-muted">{f.bio}</p>}
                </div>
              </article>
            ))}
          </div>
        </section>
      )}

      {/* Past leadership (admin-controlled) */}
      {leaderGroups.length > 0 && (
        <section className="nb-container flex flex-col gap-10 pt-24 sm:pt-28">
          <div className="flex flex-col gap-3">
            <SectionHeading index="04">Past leadership</SectionHeading>
            <p className="m-0 max-w-[640px] text-base text-ink-muted">
              Former presidents, vice presidents and leadership team members who shaped NewtonBotics.
            </p>
          </div>

          <ol className="m-0 flex list-none flex-col gap-12 border-l border-line-strong p-0 pl-6 sm:pl-10">
            {leaderGroups.map(([label, leaders]) => (
              <li key={label} className="relative flex flex-col gap-5">
                <span
                  aria-hidden="true"
                  className="absolute -left-[29px] top-1.5 h-2.5 w-2.5 rounded-full bg-signal ring-4 ring-paper sm:-left-[45px]"
                />
                <h3 className="m-0 font-mono text-[13px] font-medium uppercase tracking-[0.06em] text-ink">
                  {label || "Tenure not set"}
                </h3>
                <div className="grid grid-cols-[repeat(auto-fill,minmax(min(280px,100%),1fr))] gap-4">
                  {leaders.map((leader) => (
                    <article key={leader._id} className="nb-card flex flex-col gap-3 p-5">
                      <div className="flex items-center gap-4">
                        {leader.imageUrl ? (
                          <RemoteImage
                            src={leader.imageUrl}
                            displayWidth={56}
                            displayHeight={56}
                            alt=""
                            className="h-14 w-14 flex-none rounded-full object-cover"
                          />
                        ) : (
                          <span
                            aria-hidden="true"
                            className="inline-flex h-14 w-14 flex-none items-center justify-center rounded-full bg-[#E6E7E1] font-display text-[17px] font-semibold"
                          >
                            {initials(leader.fullName)}
                          </span>
                        )}
                        <div className="flex min-w-0 flex-1 flex-col gap-1">
                          <h4 className="m-0 truncate font-display text-lg font-semibold">{leader.fullName}</h4>
                          {leader.position && (
                            <span className="font-mono text-xs uppercase tracking-[0.04em] text-signal-text">
                              {leader.position}
                            </span>
                          )}
                        </div>
                        {leader.linkedinUrl && (
                          <a
                            href={leader.linkedinUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            aria-label={`${leader.fullName} on LinkedIn`}
                            className="inline-flex h-11 w-11 flex-none items-center justify-center rounded-md text-ink-muted hover:text-ink"
                          >
                            <Linkedin size={18} aria-hidden="true" />
                          </a>
                        )}
                      </div>
                      {leader.description && (
                        <p className="m-0 text-sm leading-relaxed text-ink-muted">{leader.description}</p>
                      )}
                    </article>
                  ))}
                </div>
              </li>
            ))}
          </ol>
        </section>
      )}

      {/* Lab */}
      <section className="nb-container flex flex-col gap-10 pb-28 pt-24 sm:pt-28">
        <SectionHeading index={leaderGroups.length > 0 ? "05" : "04"}>The lab</SectionHeading>
        <div className="flex flex-wrap gap-4">
          <div className="relative h-[360px] min-w-0 flex-[2_1_520px] overflow-hidden rounded-lg border border-line bg-[#EEF0EA]">
            <iframe
              src={MAP_EMBED_SRC}
              width="100%"
              height="100%"
              style={{ border: 0 }}
              allowFullScreen=""
              loading="lazy"
              referrerPolicy="no-referrer-when-downgrade"
              title="NewtonBotics Lab Location - Rishihood University"
              className="block h-full w-full"
            />
          </div>
          <div className="flex min-w-0 flex-[1_1_320px] flex-col gap-4 rounded-lg border border-line bg-surface p-8">
            <span className="font-mono text-xs uppercase tracking-[0.08em] text-ink-muted">Visit the lab</span>
            <span className="font-display text-2xl font-semibold leading-tight">Academic Block, Room 407</span>
            <span className="text-[15px] text-ink-muted">Rishihood University</span>
            <a href={MAP_LINK} target="_blank" rel="noopener noreferrer" className="nb-link inline-flex min-h-[44px] items-center gap-1.5 self-start text-sm">
              <MapPin size={16} aria-hidden="true" /> Open in Google Maps
              <ArrowUpRight size={14} aria-hidden="true" />
            </a>
            <Link href="/contact" className="nb-btn nb-btn-primary nb-btn-sm mt-auto h-11 self-start">
              Get in touch
            </Link>
          </div>
        </div>

        {(equipment.length > 0 || facilities.length > 0) && (
          <div className="flex flex-wrap gap-x-16 gap-y-8 border-t border-ink pt-8">
            {equipment.length > 0 && (
              <div className="flex min-w-0 flex-[2_1_480px] flex-col gap-4">
                <h3 className="m-0 font-display text-[22px] font-semibold">Key equipment</h3>
                <ul className="m-0 flex list-none flex-wrap gap-2 p-0">
                  {equipment.map((item) => {
                    const name = typeof item === "string" ? item : item.name;
                    const description = typeof item === "string" ? null : item.description;
                    return (
                      <li key={name} title={description || undefined} className="rounded-md border border-line bg-surface px-3 py-2 text-sm">
                        {name}
                        {description && <span className="nb-sr-only"> — {description}</span>}
                      </li>
                    );
                  })}
                </ul>
              </div>
            )}
            {facilities.length > 0 && (
              <div className="flex min-w-0 flex-[1_1_260px] flex-col gap-4">
                <h3 className="m-0 font-display text-[22px] font-semibold">Facilities</h3>
                <ul className="m-0 flex list-none flex-col p-0 text-[15px] text-ink-muted">
                  {facilities.map((f) => (
                    <li key={f} className="border-b border-line-soft py-2">
                      {f}
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        )}
      </section>
    </main>
  );
};

export default AboutUs;
