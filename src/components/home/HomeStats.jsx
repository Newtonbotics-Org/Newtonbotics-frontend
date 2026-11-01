"use client";
import { useEffect, useState } from "react";
import { API_BASE_URL } from "@/lib/api";
import clubData from "@/app/AllDatas/data.json";

export default function HomeStats() {
  const [labels, setLabels] = useState(null);

  useEffect(() => {
    let alive = true;
    fetch(`${API_BASE_URL}/public/metrics`, { cache: "no-store" })
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => alive && setLabels(data?.data?.labels || null))
      .catch(() => {});
    return () => {
      alive = false;
    };
  }, []);

  const stats = [
    { value: labels?.labMembers || String(clubData.coreMemberCount || 25), label: "core members" },
    { value: labels?.workshopsConducted || "20+", label: "workshops & events run" },
    { value: "100+", label: "hours of hands-on training" },
    { value: "2nd", label: "place, Technoxian 2024" },
  ];

  return (
    <dl className="m-0 grid grid-cols-2 overflow-hidden rounded-lg border border-line bg-surface lg:grid-cols-4">
      {stats.map((s, i) => (
        <div
          key={s.label}
          className={`flex flex-col-reverse gap-1.5 p-5 sm:p-7 ${i % 2 === 0 ? "border-r border-line" : ""} ${
            i < 2 ? "border-b border-line lg:border-b-0" : ""
          } ${i === 1 ? "lg:border-r" : ""}`}
        >
          <dt className="text-sm text-ink-muted">{s.label}</dt>
          <dd className="m-0 font-display text-[36px] font-semibold leading-none tracking-[-0.03em] sm:text-[48px]">
            {s.value}
          </dd>
        </div>
      ))}
    </dl>
  );
}
