"use client";
import React, { useState, useEffect } from "react";
import Image from "next/image";
import { motion } from "framer-motion";
import {
  Users,
  Building,
  Trophy,
  Wrench,
  Star,
  Calendar,
  BookOpen,
  Rocket,
  Linkedin,
  Crown,
} from "lucide-react";
// Navbar is provided by root layout
import clubData from "../AllDatas/data.json";
import { API_BASE_URL } from "@/lib/api";
import { formatTenureRange, tenureSortValue } from "@/lib/tenureDates";

const AboutUs = () => {

  // Past leaders (admin-controlled via the admin panel)
  const [pastLeaders, setPastLeaders] = useState([]);

  useEffect(() => {
    let isMounted = true;
    const fetchPastLeaders = async () => {
      try {
        const res = await fetch(`${API_BASE_URL}/past-leaders?isActive=true&limit=200`, { cache: 'no-store' });
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

  const completed = clubData?.projects?.completed || [];
  const ongoing = clubData?.projects?.ongoing || [];
  const upcomingProjects = clubData?.projects?.upcoming || [];
  const highlighted = clubData?.projects?.highlighted || [];
  const allProjects = [...completed, ...ongoing, ...upcomingProjects, ...highlighted];
  const projectsShowcased = new Set(allProjects.map((p) => p.id)).size || allProjects.length;

  const workshopsCount = (clubData?.workshops?.past?.length || 0) + (clubData?.workshops?.upcoming?.length || 0);
  const eventsUpcoming = clubData?.events?.upcoming?.length || 0;
  const achievementsCount = clubData?.achievements?.length || 0;
  const coreMembers = clubData?.coreMemberCount || clubData?.coreMembers?.length || 0;

  return (
    <div className="min-h-screen bg-black text-white font-sans py-12 px-4 sm:px-6 lg:px-8">

      {/* Header Section (simple like other pages) */}
      <motion.div
        className="max-w-7xl mx-auto mb-12 text-center"
        initial={{ opacity: 0, y: -50 }}
        whileInView={{ opacity: 1, y: 0 }}
        transition={{ duration: 1 }}
        viewport={{ once: true }}
      >
        <h1 className="text-4xl md:text-5xl font-bold mb-2 font-display bg-clip-text text-transparent bg-gradient-to-r from-red-500 to-red-600">
          About NewtonBotics
        </h1>
        <p className="text-base text-white/70 mb-4 font-medium">
          Rishihood University
        </p>
        <p className="text-lg text-white/80 max-w-2xl mx-auto">
          Innovating the future through cutting-edge robotics and technology.
        </p>
      </motion.div>

      {/* Our Story */}
      <section className="max-w-7xl mx-auto mb-12">
        <div className="grid md:grid-cols-2 gap-6">
          <div className="bg-white/5 backdrop-blur-lg rounded-xl p-6 border border-white/10">
            <h3 className="text-xl font-bold mb-3 font-display flex items-center gap-2">
              <Calendar className="w-5 h-5 text-red-500" /> Established
            </h3>
            <p className="text-white/80">Founded in <span className="text-red-400 font-semibold">{establishedYear}</span> at Rishihood University.</p>
          </div>
          <div className="bg-white/5 backdrop-blur-lg rounded-xl p-6 border border-white/10">
            <h3 className="text-xl font-bold mb-3 font-display flex items-center gap-2">
              <Users className="w-5 h-5 text-red-500" /> Founded By
            </h3>
            <p className="text-white/80">{founders.join(", ")}</p>
          </div>
          <div className="bg-white/5 backdrop-blur-lg rounded-xl p-6 border border-white/10">
            <h3 className="text-xl font-bold mb-3 font-display flex items-center gap-2">
              <BookOpen className="w-5 h-5 text-red-500" /> Mission
            </h3>
            <p className="text-white/80">{mission}</p>
          </div>
          <div className="bg-white/5 backdrop-blur-lg rounded-xl p-6 border border-white/10">
            <h3 className="text-xl font-bold mb-3 font-display flex items-center gap-2">
              <Star className="w-5 h-5 text-red-500" /> Vision
            </h3>
            <p className="text-white/80">{vision}</p>
          </div>
        </div>
      </section>

      {/* History Section */}
      <section className="max-w-7xl mx-auto mb-12">
        <h2 className="text-3xl font-bold mb-6 font-display">Our History</h2>
        <div className="bg-white/5 backdrop-blur-lg rounded-xl p-6 border border-white/10 leading-relaxed text-white/80">
          <p className="mb-4">
            NewtonBotics was established in <span className="text-red-400 font-semibold">2024</span> by four pioneering members of the
            first batch at Rishihood University — driven by a shared vision to build a hands-on robotics culture from the ground up.
            Starting with a small lab and a few kits, the founders grew the club into a collaborative hub for humanoid systems,
            drone technology, computer vision, and embedded platforms. Today, NewtonBotics hosts workshops, drives competitive teams,
            and contributes research aligned with our mission to empower learners through real-world robotics.
          </p>
          <p>
            Our journey continues as we partner with industry, publish research, and mentor the next wave of innovators who will shape
            the future of intelligent machines.
          </p>
        </div>
      </section>

      {/* Founders Section */}
      <section className="max-w-7xl mx-auto mb-12">
        <h2 className="text-3xl font-bold mb-6 font-display">Founding Team (2024)</h2>
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {foundersData.map((f, idx) => (
            <div key={idx} className="bg-white/5 backdrop-blur-lg rounded-xl p-6 border border-white/10 text-center hover:bg-white/10 transition-colors">
              <div className="relative w-28 h-28 mx-auto mb-4 rounded-full overflow-hidden bg-white/10">
                {/* Using Next/Image would be ideal, but keep div for simplicity */}
                <img src={f.image} alt={f.name} className="w-full h-full object-cover" />
              </div>
              <h3 className="text-lg font-bold font-display">{f.name}</h3>
              <p className="text-sm text-white/60">{f.role} • {f.batch}</p>
              <p className="text-sm text-white/80 mt-3 leading-relaxed">{f.bio}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Past Leadership Team (admin-controlled, below founding team) */}
      {leaderGroups.length > 0 && (
        <section className="max-w-7xl mx-auto mb-12">
          <h2 className="text-3xl font-bold mb-2 font-display flex items-center gap-3">
            <Crown className="w-8 h-8 text-red-500" /> Past Leadership Team
          </h2>
          <p className="text-white/60 mb-8">
            Former presidents, vice presidents, and leadership team members who shaped NewtonBotics.
          </p>

          <div className="relative ml-3 md:ml-4 border-l-2 border-red-500/30 space-y-12 pl-8 md:pl-12">
            {leaderGroups.map(([label, leaders]) => (
              <div key={label} className="relative">
                {/* Timeline node */}
                <span className="absolute -left-[41px] md:-left-[57px] top-1 w-4 h-4 rounded-full bg-red-500 ring-4 ring-red-500/20"></span>
                <h3 className="text-xl md:text-2xl font-bold text-red-400 mb-5 font-display">{label}</h3>

                <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
                  {leaders.map((leader) => (
                    <div
                      key={leader._id}
                      className="bg-white/5 backdrop-blur-lg rounded-xl p-5 border border-white/10 hover:bg-white/10 hover:border-red-500/20 transition-colors"
                    >
                      <div className="flex items-center gap-4">
                        <div className="relative w-16 h-16 rounded-full overflow-hidden bg-white/10 flex-shrink-0 flex items-center justify-center">
                          {leader.imageUrl ? (
                            <img src={leader.imageUrl} alt={leader.fullName} className="w-full h-full object-cover" />
                          ) : (
                            <span className="text-xl font-bold text-white/60">
                              {leader.fullName?.split(' ').map((w) => w[0]).slice(0, 2).join('')}
                            </span>
                          )}
                        </div>
                        <div className="min-w-0">
                          <h4 className="text-lg font-bold font-display truncate">{leader.fullName}</h4>
                          <p className="text-sm text-red-400 font-medium">{leader.position}</p>
                          <p className="text-xs text-white/50 mt-0.5">{tenureLabel(leader)}</p>
                        </div>
                        {leader.linkedinUrl && (
                          <a
                            href={leader.linkedinUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            aria-label={`${leader.fullName} on LinkedIn`}
                            className="ml-auto text-blue-400 hover:text-blue-300 flex-shrink-0"
                          >
                            <Linkedin className="w-5 h-5" />
                          </a>
                        )}
                      </div>
                      {leader.description && (
                        <p className="text-sm text-white/70 mt-3 leading-relaxed">{leader.description}</p>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Lab Details Section */}
      <section className="py-16 bg-black">
        <div className="container mx-auto px-4">
          <motion.div
            initial={{ opacity: 0, x: -50 }}
            whileInView={{ opacity: 1, x: 0 }}
            className="flex items-center mb-8"
          >
            <Building className="w-12 h-12 text-red-500 mr-4" />
            <h2 className="text-3xl font-bold font-display">
              Our Robotics Lab
            </h2>
          </motion.div>

          <div className="grid md:grid-cols-2 gap-8">
            <motion.div
              initial={{ opacity: 0, y: 50 }}
              whileInView={{ opacity: 1, y: 0 }}
              className="bg-white/5 backdrop-blur-lg p-6 rounded-lg border border-white/10"
            >
              <h3 className="text-2xl font-semibold mb-4 font-display">
                Location
              </h3>
              <div className="space-y-3">
                <p className="text-white/80">
                  <span className="text-red-400 font-semibold">A (Academic) Block, Room 407</span>
                </p>
                <p className="text-white/80">
                  Located on the Fourth Floor of the Academic Block at Rishihood University
                </p>
                
                {/* Small Embedded Map */}
                <div className="mt-4">
                  <div className="relative w-full h-48 rounded-lg overflow-hidden border border-white/20">
                    <iframe
                      src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3500.1234567890123!2d77.090004!3d28.982852!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x0%3A0x0!2zMjjCsDU4JzU4LjMiTiA3N8KwMDUnMjQuMCJF!5e0!3m2!1sen!2sin!4v1234567890123"
                      width="100%"
                      height="100%"
                      style={{ border: 0 }}
                      allowFullScreen=""
                      loading="lazy"
                      referrerPolicy="no-referrer-when-downgrade"
                      title="NewtonBotics Lab Location - Rishihood University"
                      className="w-full h-full"
                    ></iframe>
                  </div>
                  <div className="mt-2 text-center">
                    <a 
                      href="https://www.google.com/maps?ll=28.982852,77.090004&z=13&t=m&hl=en&gl=IN&mapclient=embed&cid=17560836703297234031"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-red-400 hover:text-red-300 text-sm font-medium transition-colors inline-flex items-center gap-1"
                    >
                      <Building className="w-4 h-4" />
                      Open in Google Maps
                    </a>
                  </div>
                </div>
              </div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 50 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="bg-white/5 backdrop-blur-lg p-6 rounded-lg border border-white/10"
            >
              <h3 className="text-2xl font-semibold mb-4 font-display">
                Key Equipment
              </h3>
              <ul className="list-disc list-inside text-white/80">
                {clubData.labDetails.equipment.map((item, index) => (
                  <li key={index}>
                    {typeof item === "string" ? item : item.name}
                  </li>
                ))}
              </ul>
            </motion.div>
          </div>
        </div>
      </section>

    </div>
  );
};

export default AboutUs;
