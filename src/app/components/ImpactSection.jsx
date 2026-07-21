"use client";
import { useState, useEffect, useMemo } from "react";
import Image from "next/image";
import { Rocket, Award, Users, Globe, Star, Calendar } from "lucide-react";
import { API_BASE_URL } from "@/lib/api";

const DEFAULT_ACHIEVEMENTS = [
  { id: "researchProjects", number: "50+", label: "Research Projects", icon: <Rocket className="w-8 h-8" /> },
  { id: "publications", number: "200+", label: "Publications", icon: <Award className="w-8 h-8" /> },
  { id: "labMembers", number: "30+", label: "Lab Members", icon: <Users className="w-8 h-8" /> },
  { id: "industryPartners", number: "15+", label: "Industry Partners", icon: <Globe className="w-8 h-8" /> },
  { id: "awardsWon", number: "25+", label: "Awards Won", icon: <Star className="w-8 h-8" /> },
  { id: "workshopsConducted", number: "100+", label: "Workshops Conducted", icon: <Calendar className="w-8 h-8" /> },
];

export default function ImpactSection() {
  const [metrics, setMetrics] = useState(null);
  const [loadingMetrics, setLoadingMetrics] = useState(false);

  useEffect(() => {
    let isMounted = true;
    const fetchMetrics = async () => {
      try {
        setLoadingMetrics(true);
        const res = await fetch(`${API_BASE_URL}/public/metrics`, { cache: "no-store" });
        if (!res.ok) return;
        const data = await res.json();
        if (isMounted && data.success) {
          setMetrics(data);
        }
      } catch {
        // Backend may be offline in local/dev — keep DEFAULT_ACHIEVEMENTS.
      } finally {
        if (isMounted) setLoadingMetrics(false);
      }
    };
    fetchMetrics();
    return () => {
      isMounted = false;
    };
  }, []);

  const achievements = useMemo(() => {
    const labels = metrics?.data?.labels;
    if (!labels) return DEFAULT_ACHIEVEMENTS;
    return DEFAULT_ACHIEVEMENTS.map((item) => {
      if (item.id === "researchProjects") return { ...item, number: labels.projects || item.number };
      if (item.id === "publications") return { ...item, number: labels.publications || item.number };
      if (item.id === "labMembers") return { ...item, number: labels.labMembers || item.number };
      if (item.id === "industryPartners") return { ...item, number: labels.industryPartners || item.number };
      if (item.id === "awardsWon") return { ...item, number: labels.awardsWon || item.number };
      if (item.id === "workshopsConducted") return { ...item, number: labels.workshopsConducted || item.number };
      return item;
    });
  }, [metrics]);

  return (
    <section className="py-16 md:py-24 relative z-10 bg-black/20 backdrop-blur-[1px]">
      <div className="absolute inset-0 bg-gradient-to-r from-white/[0.02] to-white/[0.02]"></div>
      <div className="container mx-auto px-4 sm:px-6 relative z-10">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8 lg:gap-10 items-center">
          {/* Left — 3/4: heading + impact information */}
          <div className="lg:col-span-3 order-1 lg:order-1">
            <div className="text-center lg:text-left mb-8 sm:mb-10 md:mb-12 section-fade-in">
              <h2 className="text-3xl sm:text-4xl md:text-5xl font-extrabold mb-4 sm:mb-6 bg-clip-text text-transparent bg-gradient-to-r from-white via-red-400 to-white">
                Our Impact
              </h2>
              <p className="text-base sm:text-lg md:text-xl text-white/80 max-w-3xl mx-auto lg:mx-0 px-1">
                Numbers that speak for our commitment to excellence in robotics research and innovation
              </p>
            </div>

            {loadingMetrics ? (
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 sm:gap-4 md:gap-6">
                {[...Array(6)].map((_, index) => (
                  <div key={index} className="bg-white/5 rounded-2xl p-4 sm:p-6 lg:p-8 border border-white/10 animate-pulse">
                    <div className="bg-white/10 p-4 rounded-xl w-12 h-12 sm:w-16 sm:h-16 mx-auto mb-4"></div>
                    <div className="h-8 bg-white/10 rounded mb-2"></div>
                    <div className="h-4 bg-white/10 rounded"></div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 sm:gap-4 md:gap-6">
                {achievements.map((stat, index) => (
                  <div
                    key={index}
                    className="bg-white/5 rounded-2xl p-3.5 sm:p-6 lg:p-8 border border-white/10 text-center group hover:bg-white/10 hover:border-red-500/20 transition-all duration-300 section-fade-in"
                    style={{ animationDelay: `${index * 80}ms` }}
                  >
                    <div className="bg-gradient-to-br from-white/10 to-red-500/10 p-2.5 sm:p-4 rounded-xl w-fit mx-auto mb-2.5 sm:mb-4 group-hover:shadow-lg transition-shadow duration-300 [&>svg]:w-6 [&>svg]:h-6 sm:[&>svg]:w-8 sm:[&>svg]:h-8">
                      {stat.icon}
                    </div>
                    <h3 className="text-xl sm:text-3xl lg:text-4xl font-bold text-red-400 mb-1.5 sm:mb-2">
                      {stat.number}
                    </h3>
                    <p className="text-[11px] sm:text-sm text-white/70 leading-snug">{stat.label}</p>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Right — 1/4: impact figure */}
          <div className="relative flex justify-center lg:justify-end pointer-events-none select-none order-2 lg:order-2 mt-6 lg:mt-0">
            <Image
              src="/our-impact.webp"
              alt="NewtonBotics impact robotics figure"
              width={480}
              height={720}
              className="w-40 sm:w-48 md:w-56 lg:w-full max-w-[14rem] sm:max-w-[16rem] lg:max-w-none h-auto object-contain drop-shadow-[0_0_40px_rgba(0,180,255,0.12)]"
            />
          </div>
        </div>
      </div>
    </section>
  );
}
