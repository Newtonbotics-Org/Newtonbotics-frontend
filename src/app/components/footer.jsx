"use client";
import { Instagram, Linkedin, Mail, MapPin } from "lucide-react";
import Link from "next/link";
import Image from "next/image";
import clubData from "../AllDatas/data.json";
import { NEWTONBOTICS_LOGO, NEWTONBOTICS_LOGO_WIDTH, NEWTONBOTICS_LOGO_HEIGHT } from "@/lib/branding";
import FooterRobot from "./FooterRobot";

const Footer = () => {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="relative z-10 bg-black/95 text-white">
      <div className="absolute inset-0 bg-black/70 pointer-events-none" aria-hidden="true" />
      <div className="relative z-10 max-w-7xl mx-auto px-4 py-12 flex flex-col md:flex-row md:items-start gap-8 md:gap-6 lg:gap-8">
        {/* Club Overview */}
        <div className="md:flex-1 md:min-w-0">
          <div className="flex items-center mb-2">
            <Image
              src={NEWTONBOTICS_LOGO}
              alt="NewtonBotics"
              width={NEWTONBOTICS_LOGO_WIDTH}
              height={NEWTONBOTICS_LOGO_HEIGHT}
              className="w-44 h-auto object-contain"
            />
          </div>
          <p className="text-gray-400 text-xs mb-2 font-medium">
            Rishihood University
          </p>
          <p className="text-gray-300 text-sm">
            Innovating at the intersection of technology and creativity, pushing
            the boundaries of robotics and artificial intelligence.
          </p>
          <div className="flex space-x-4 mt-4">
            <a
              href={`https://instagram.com/${clubData?.contactInfo?.socialMedia?.instagram.replace(
                "@",
                ""
              )}`}
              target="_blank"
              rel="noopener noreferrer"
              className="text-pink-400 hover:text-pink-300"
            >
              <Instagram />
            </a>
            <a
              href={`https://linkedin.com/company/${clubData?.contactInfo?.socialMedia?.linkedin}`}
              target="_blank"
              rel="noopener noreferrer"
              className="text-blue-400 hover:text-blue-300"
            >
              <Linkedin />
            </a>
          </div>
        </div>

        {/* Quick Links */}
        <div className="md:w-auto md:shrink-0">
          <h4 className="font-semibold mb-4 text-indigo-300">Quick Links</h4>
          <ul className="space-y-2">
            <li>
              <Link
                href="/"
                className="text-gray-300 hover:text-white transition"
              >
                Home
              </Link>
            </li>
            <li>
              <Link
                href="/projects"
                className="text-gray-300 hover:text-white transition"
              >
                Projects
              </Link>
            </li>
            <li>
              <Link
                href="/workshops"
                className="text-gray-300 hover:text-white transition"
              >
                Workshops
              </Link>
            </li>
            <li>
              <Link
                href="/contact"
                className="text-gray-300 hover:text-white transition"
              >
                Contact
              </Link>
            </li>
          </ul>
        </div>

        {/* Decorative figure — only as wide as the image */}
        <FooterRobot />

        {/* Recent Achievements */}
        <div className="md:flex-1 md:min-w-0">
          <h4 className="font-semibold mb-4 text-indigo-300">
            Recent Achievements
          </h4>
          <ul className="space-y-2">
            {clubData?.achievements?.map((achievement, index) => (
              <li
                key={index}
                className="text-gray-300 text-sm flex items-center"
              >
                <span className="mr-2 text-green-400">●</span>
                {achievement}
              </li>
            )) || <li className="text-gray-400">No achievements available</li>}
          </ul>
        </div>

        {/* Contact Information */}
        <div className="md:flex-1 md:min-w-0">
          <h4 className="font-semibold mb-4 text-indigo-300">Contact Us</h4>
          <div className="space-y-3">
            <div className="flex items-center">
              <MapPin className="h-5 w-5 mr-3 text-indigo-400 shrink-0" />
              <span className="text-gray-300">
                Academic Block, Room 407,<br />
                Rishihood University
              </span>
            </div>
            <div className="flex items-center">
              <Mail className="h-5 w-5 mr-3 text-indigo-400 shrink-0" />
              <span className="text-gray-300">
                newtonbotics.club@rishihood.edu.in
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Copyright and Founding Information */}
      <div className="relative z-10 bg-black/90 border-t border-white/10 py-4">
        <div className="max-w-7xl mx-auto px-4 flex flex-col md:flex-row justify-between items-center">
          <p className="text-gray-400 text-sm">
            © {currentYear} NewtonBotics, Rishihood University. All rights reserved.
          </p>
          <p className="text-gray-400 text-sm">
            Developed by{" "}
            <span 
              onClick={() => window.open("https://monurajj.monadnocks.in/", "_blank")} 
              className="text-red-400 font-semibold cursor-pointer hover:text-red-300 hover:font-bold transition-colors"
              title="Visit Monu's Portfolio"
            >
              Monu
            </span>{" "}
            under{" "}
            <span 
              onClick={() => window.open("https://monadnocks.in", "_blank")} 
              className="text-red-400 cursor-pointer hover:text-red-300 hover:font-bold transition-colors"
              title="Visit Monadnocks"
            >
              Monadnocks
            </span>
          </p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
