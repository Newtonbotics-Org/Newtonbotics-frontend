"use client";
import { useState, useEffect, lazy, Suspense } from "react";
import { Box, Brain, Layout, ArrowRight, Cpu, Wifi, Camera, Shield } from "lucide-react";
import Link from "next/link";
import Image from "next/image";
import NewsTicker from "../components/NewsTicker";
import HomeBgVideo from "../components/HomeBgVideo";
import { useAuth } from "../../contexts/AuthContext";
import { subscribeToNewsletter } from "../../lib/newsletter";
import { API_BASE_URL } from "@/lib/api";
import { NEWTONBOTICS_LOGO, NEWTONBOTICS_LOGO_WIDTH, NEWTONBOTICS_LOGO_HEIGHT } from "@/lib/branding";
import HeroRobot from "../components/HeroRobot";
import LazyLoader, { LazySkeleton } from "../components/LazyLoader";

// Lazy load below-the-fold components for better initial page load
const RawGallery = lazy(() => import("../components/RawGallery"));
const UpcomingEvents = lazy(() => import("../components/UpcomingEvents"));
const ImpactSection = lazy(() => import("../components/ImpactSection"));

const HomePage = () => {
  const { user, isAuthenticated } = useAuth();
  const [roleNotice, setRoleNotice] = useState(null);
  const [hasScrolled, setHasScrolled] = useState(false);
  const [researchAreas, setResearchAreas] = useState([]);
  const [loadingResearchAreas, setLoadingResearchAreas] = useState(false);
  
  // Newsletter subscription state
  const [newsletterEmail, setNewsletterEmail] = useState("");
  const [newsletterFirstName, setNewsletterFirstName] = useState("");
  const [newsletterLastName, setNewsletterLastName] = useState("");
  const [isNewsletterSubmitting, setIsNewsletterSubmitting] = useState(false);
  const [newsletterMessage, setNewsletterMessage] = useState("");
  const [newsletterMessageType, setNewsletterMessageType] = useState("");
  const [newsletterStep, setNewsletterStep] = useState(1);

  // Hide the scroll indicator once the user starts scrolling
  useEffect(() => {
    const onScroll = () => setHasScrolled(window.scrollY > 40);
    window.addEventListener('scroll', onScroll, { passive: true });
    onScroll();
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  useEffect(() => {
    try {
      const raw = localStorage.getItem('nb_role_notice');
      if (raw) {
        setRoleNotice(JSON.parse(raw));
        localStorage.removeItem('nb_role_notice');
      }
    } catch (_) {}
  }, []);

  // Auto-dismiss role notice after 5 seconds
  useEffect(() => {
    if (!roleNotice) return;
    const timeoutId = setTimeout(() => setRoleNotice(null), 5000);
    return () => clearTimeout(timeoutId);
  }, [roleNotice]);

  // Fetch research areas
  useEffect(() => {
    let isMounted = true;
    const fetchResearchAreas = async () => {
      try {
        setLoadingResearchAreas(true);
        const res = await fetch(`${API_BASE_URL}/research-areas?isActive=true&isFeatured=true&limit=4`, { cache: 'no-store' });
        if (!res.ok) throw new Error('Failed to fetch research areas');
        const data = await res.json();
        if (isMounted && data.success) {
          setResearchAreas(data.data.items || []);
        }
      } catch (_) {
        // Silently ignore; fallback values will be used
      } finally {
        if (isMounted) setLoadingResearchAreas(false);
      }
    };
    fetchResearchAreas();
    return () => { isMounted = false; };
  }, []);

  // Newsletter step handlers
  const handleEmailContinue = (e) => {
    e.preventDefault();
    if (!newsletterEmail.trim()) {
      setNewsletterMessage("Please enter your email address");
      setNewsletterMessageType("error");
      return;
    }
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(newsletterEmail.trim())) {
      setNewsletterMessage("Please enter a valid email address");
      setNewsletterMessageType("error");
      return;
    }
    setNewsletterMessage("");
    setNewsletterStep(2);
  };

  const handleNewsletterSubmit = async (e) => {
    e.preventDefault();
    setIsNewsletterSubmitting(true);
    setNewsletterMessage("");
    try {
      const subscriptionData = {
        email: newsletterEmail.trim(),
        ...(newsletterFirstName.trim() && { firstName: newsletterFirstName.trim() }),
        ...(newsletterLastName.trim() && { lastName: newsletterLastName.trim() })
      };
      await subscribeToNewsletter(subscriptionData);
      setNewsletterStep(3);
      setNewsletterMessage("Successfully subscribed to our newsletter!");
      setNewsletterMessageType("success");
      setTimeout(() => {
        setNewsletterEmail("");
        setNewsletterFirstName("");
        setNewsletterLastName("");
        setNewsletterStep(1);
        setNewsletterMessage("");
      }, 3000);
    } catch (error) {
      setNewsletterMessage(error.message || "Failed to subscribe. Please try again.");
      setNewsletterMessageType("error");
    } finally {
      setIsNewsletterSubmitting(false);
    }
  };

  const handleBackToEmail = () => {
    setNewsletterStep(1);
    setNewsletterMessage("");
  };

  const features = [
    {
      icon: <Cpu className="w-10 h-10 sm:w-12 sm:h-12" />,
      title: "Advanced AI Integration",
      description: "State-of-the-art machine learning algorithms powering our robotic systems"
    },
    {
      icon: <Camera className="w-10 h-10 sm:w-12 sm:h-12" />,
      title: "Computer Vision",
      description: "Real-time image processing and object recognition capabilities"
    },
    {
      icon: <Wifi className="w-10 h-10 sm:w-12 sm:h-12" />,
      title: "IoT Connectivity",
      description: "Seamless integration with IoT devices and cloud platforms"
    },
    {
      icon: <Shield className="w-10 h-10 sm:w-12 sm:h-12" />,
      title: "Safety Systems",
      description: "Advanced safety protocols and fail-safe mechanisms"
    }
  ];

  const fallbackResearchAreas = [
    { icon: <Box className="w-8 h-8 sm:w-10 sm:h-10 text-white" />, title: "Humanoid Robotics", description: "Development of human-like robots for complex interactions" },
    { icon: <Brain className="w-8 h-8 sm:w-10 sm:h-10 text-white" />, title: "Neural Networks", description: "Advanced AI algorithms for robotic decision making" },
    { icon: <Box className="w-8 h-8 sm:w-10 sm:h-10 text-white" />, title: "Swarm Robotics", description: "Multi-robot systems for collaborative tasks" },
    { icon: <Layout className="w-8 h-8 sm:w-10 sm:h-10 text-white" />, title: "Computer Vision", description: "Visual perception systems for autonomous navigation" },
  ];

  return (
    <main className="relative min-h-screen bg-black text-white font-sans" itemScope itemType="https://schema.org/WebPage">
      <HomeBgVideo />

      {/* Role notice toast */}
      {roleNotice && (
        <div className="fixed top-24 left-1/2 -translate-x-1/2 z-50 max-w-xl w-[92%] md:w-auto bg-white/10 border border-white/15 backdrop-blur-xl rounded-2xl px-4 py-3 fade-in">
          <button
            onClick={() => setRoleNotice(null)}
            aria-label="Dismiss notification"
            className="absolute top-2 right-2 inline-flex items-center justify-center rounded-md p-1 text-white/70 hover:text-white hover:bg-white/10 transition"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
          </button>
          <div className="text-sm text-white/90 pr-6">
            {roleNotice.message || (
              <>
                Your requested role <span className="text-red-300">{roleNotice.requestedRole}</span> is not pre-approved. You have been registered as <span className="text-red-300">{roleNotice.assignedRole}</span>.
              </>
            )}
          </div>
        </div>
      )}

      {/* ===== HERO SECTION ===== */}
      <section className="relative min-h-screen flex items-center z-10" itemScope itemType="https://schema.org/Organization">
        {/* Latest news ticker overlaid at the top of the hero */}
        <div className="absolute top-0 left-0 w-full z-20">
          <NewsTicker />
        </div>

        <div className="relative z-10 container mx-auto px-4 sm:px-6 lg:px-20 py-20 lg:py-0">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-12 items-center min-h-[calc(100vh-6rem)]">
            <div className="max-w-3xl mx-auto lg:mx-0 text-center lg:text-left">
              <div className="flex items-center justify-center lg:justify-start gap-2 mb-4">
                <div className="w-3 h-3 bg-red-500 rounded-full"></div>
                <span className="text-white/80 font-medium text-sm sm:text-base">Innovation Hub at Rishihood University</span>
              </div>

              <Image
                src={NEWTONBOTICS_LOGO}
                alt="NewtonBotics"
                width={NEWTONBOTICS_LOGO_WIDTH}
                height={NEWTONBOTICS_LOGO_HEIGHT}
                className="w-72 sm:w-96 md:w-[28rem] h-auto object-contain mx-auto lg:mx-0 mb-6"
                priority
              />
              
              <h1 className="sr-only" itemProp="name">NewtonBotics</h1>
              
              <p className="text-sm sm:text-base md:text-lg text-white/70 mt-3 mb-4">
                <span className="text-white/90 font-medium">at Rishihood University</span>
              </p>
              
              <p className="text-lg sm:text-xl md:text-2xl text-white/80 mt-4 mb-8 leading-relaxed max-w-lg mx-auto lg:mx-0" itemProp="description">
                Where Innovation Meets Precision in Robotics Excellence.{" "}
                <span className="text-red-400 font-semibold">Building the future, one robot at a time.</span>
              </p>

              <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 justify-center lg:justify-start">
                <Link href="/Projects" className="inline-block">
                  <div className="nb-cta nb-chamfer-lg bg-gradient-to-r from-red-500 to-red-600 text-white px-8 py-4 text-lg font-semibold hover:scale-[1.03] active:scale-[0.97] transition-all duration-200 flex items-center justify-center gap-2 group">
                    Discover Our Innovations
                    <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                  </div>
                </Link>
              </div>
            </div>

            <HeroRobot />
          </div>
        </div>

        {/* Scroll indicator — hides once scrolling starts */}
        <div className={`absolute bottom-28 left-1/2 -translate-x-1/2 hidden sm:flex flex-col items-center gap-2 z-20 transition-opacity duration-500 ${hasScrolled ? 'opacity-0 pointer-events-none' : 'opacity-100'}`}>
          <div className="css-bounce">
            <svg className="w-6 h-6 text-white/60" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" /></svg>
          </div>
          <span className="text-xs text-white/50 select-none">Scroll to explore</span>
        </div>
      </section>

      {/* ===== FEATURES SECTION ===== */}
      <section id="features" className="py-16 md:py-24 relative z-10" aria-label="Cutting-Edge Technology Features">
        <div className="container mx-auto px-4 sm:px-6">
          <div className="text-center mb-12 sm:mb-16 section-fade-in">
            <h2 className="text-3xl sm:text-4xl md:text-5xl font-extrabold mb-4 sm:mb-6 bg-clip-text text-transparent bg-gradient-to-r from-white via-red-400 to-white pb-4">
              Cutting-Edge Technology
            </h2>
            <p className="text-base sm:text-lg md:text-xl text-white/80 max-w-3xl mx-auto px-4">
              Our lab is equipped with the latest robotics technology and AI systems, 
              enabling students to work on groundbreaking projects.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6 lg:gap-8">
            {features.map((feature, index) => (
              <div
                key={index}
                className="bg-white/5 rounded-2xl p-6 lg:p-8 border border-white/10 hover:border-red-500/20 hover:bg-white/[0.08] transition-all duration-300 group section-fade-in"
                style={{ animationDelay: `${index * 80}ms` }}
              >
                <div className="bg-gradient-to-br from-white/10 to-red-500/10 p-3 sm:p-4 rounded-xl w-fit mb-4 sm:mb-6 group-hover:shadow-lg transition-shadow duration-300">
                  {feature.icon}
                </div>
                <h3 className="text-lg sm:text-xl lg:text-2xl font-bold mb-3 sm:mb-4 text-white group-hover:text-red-400 transition-colors duration-300">
                  {feature.title}
                </h3>
                <p className="text-sm sm:text-base text-white/70 leading-relaxed">
                  {feature.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ===== RESEARCH AREAS SECTION ===== */}
      <section className="py-16 md:py-24 relative z-10" aria-label="Research Areas">
        <div className="container mx-auto px-4 sm:px-6">
          <div className="grid grid-cols-1 lg:grid-cols-4 gap-8 lg:gap-10 items-center">
            {/* Left — 1/4: research figure */}
            <div className="relative flex justify-center lg:justify-start pointer-events-none select-none order-1">
              <Image
                src="/reaserch area image.png"
                alt="NewtonBotics research robotics figure"
                width={480}
                height={720}
                className="w-48 sm:w-56 lg:w-full max-w-[16rem] lg:max-w-none h-auto object-contain drop-shadow-[0_0_40px_rgba(0,180,255,0.12)]"
              />
            </div>

            {/* Right — 3/4: heading + research information */}
            <div className="lg:col-span-3 order-2">
              <div className="text-center lg:text-left mb-8 sm:mb-10 section-fade-in">
                <h2 className="text-3xl sm:text-4xl md:text-5xl font-extrabold mb-3 sm:mb-4 bg-clip-text text-transparent bg-gradient-to-r from-white via-red-400 to-white">
                  Research Areas
                </h2>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-5">
                {loadingResearchAreas ? (
                  Array.from({ length: 4 }).map((_, index) => (
                    <div
                      key={`loading-${index}`}
                      className="bg-white/5 rounded-xl p-4 lg:p-5 border border-white/10"
                    >
                      <div className="animate-pulse">
                        <div className="bg-white/10 rounded-lg p-3 w-fit mb-3 h-8"></div>
                        <div className="bg-white/10 rounded h-5 mb-2 w-3/4"></div>
                        <div className="bg-white/10 rounded h-3 mb-2 w-full"></div>
                        <div className="bg-white/10 rounded h-3 w-1/2"></div>
                      </div>
                    </div>
                  ))
                ) : researchAreas.length > 0 ? (
                  researchAreas.map((area, index) => (
                    <Link key={area._id || index} href={`/research-areas/${area._id}`}>
                      <div
                        className="bg-white/5 rounded-xl p-4 lg:p-5 hover:bg-white/10 transition-all duration-300 border border-white/10 hover:border-red-500/20 group cursor-pointer section-fade-in h-full"
                        style={{ animationDelay: `${index * 100}ms` }}
                      >
                        <div className="bg-gradient-to-br from-white/10 to-red-500/10 p-2.5 rounded-lg w-fit mb-3 group-hover:shadow-lg transition-shadow duration-300">
                          {area.category === 'AI/ML' ? <Brain className="w-6 h-6 sm:w-7 sm:h-7 text-white" /> :
                           area.category === 'Mechanics' ? <Box className="w-6 h-6 sm:w-7 sm:h-7 text-white" /> :
                           <Layout className="w-6 h-6 sm:w-7 sm:h-7 text-white" />}
                        </div>
                        <h3 className="text-base sm:text-lg lg:text-xl font-bold mb-2 text-white group-hover:text-red-400 transition-colors duration-300">
                          {area.name}
                        </h3>
                        <p className="text-xs sm:text-sm text-white/70 leading-relaxed">
                          {area.description}
                        </p>
                      </div>
                    </Link>
                  ))
                ) : (
                  fallbackResearchAreas.map((area, index) => (
                    <div
                      key={index}
                      className="bg-white/5 rounded-xl p-4 lg:p-5 hover:bg-white/10 transition-all duration-300 border border-white/10 hover:border-red-500/20 group section-fade-in"
                      style={{ animationDelay: `${index * 100}ms` }}
                    >
                      <div className="bg-gradient-to-br from-white/10 to-red-500/10 p-2.5 rounded-lg w-fit mb-3 group-hover:shadow-lg transition-shadow duration-300 [&>svg]:w-6 [&>svg]:h-6 sm:[&>svg]:w-7 sm:[&>svg]:h-7">
                        {area.icon}
                      </div>
                      <h3 className="text-base sm:text-lg lg:text-xl font-bold mb-2 text-white group-hover:text-red-400 transition-colors duration-300">
                        {area.title}
                      </h3>
                      <p className="text-xs sm:text-sm text-white/70 leading-relaxed">
                        {area.description}
                      </p>
                    </div>
                  ))
                )}
              </div>

              <div className="mt-8 flex justify-end section-fade-in">
                <Link href="/research-areas">
                  <button className="bg-white/10 hover:bg-white/20 text-white px-5 py-2.5 rounded-lg border border-white/20 transition-all duration-200 flex items-center gap-2 group text-sm">
                    Explore more
                    <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                  </button>
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ===== IMPACT SECTION ===== */}
      <Suspense fallback={<LazyLoader label="Loading impact" />}>
        <ImpactSection />
      </Suspense>

      {/* ===== UPCOMING EVENTS ===== */}
      <Suspense fallback={<LazySkeleton cards={3} />}>
        <UpcomingEvents />
      </Suspense>

      {/* ===== GALLERY SECTION ===== */}
      <section className="py-16 md:py-24 relative z-10 bg-black/20 backdrop-blur-[1px]" aria-label="Gallery">
        <Suspense fallback={<LazySkeleton cards={4} />}>
          <RawGallery />
        </Suspense>
      </section>

      {/* ===== NEWSLETTER SECTION ===== */}
      <section className="py-16 md:py-24 relative z-10 bg-black/20 backdrop-blur-[1px]" aria-label="Newsletter Subscription">
        <div className="container mx-auto px-4 sm:px-6">
          <div className="bg-white/5 rounded-2xl sm:rounded-3xl p-6 sm:p-8 lg:p-12 text-center border border-white/10 relative overflow-hidden section-fade-in">
            {/* Static background decoration */}
            <div className="absolute top-0 left-0 w-full h-full pointer-events-none">
              <div className="absolute top-10 left-10 w-32 h-32 bg-white/5 rounded-full blur-2xl"></div>
              <div className="absolute bottom-10 right-10 w-40 h-40 bg-white/5 rounded-full blur-xl"></div>
              <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-24 h-24 bg-red-500/5 rounded-full blur-xl"></div>
            </div>
            
            <div className="relative z-10">
              <h2 className="text-3xl sm:text-4xl md:text-5xl font-extrabold mb-4 sm:mb-6 bg-clip-text text-transparent bg-gradient-to-r from-white via-red-400 to-white">
                Stay Connected
              </h2>
              <p className="text-base sm:text-lg md:text-xl text-white/80 mb-6 sm:mb-8 max-w-2xl mx-auto leading-relaxed px-4">
                Join our newsletter to receive updates on breakthrough research,
                upcoming events, and innovations in robotics. Be the first to know about our latest projects!
              </p>
              <div className="max-w-lg mx-auto px-4">
                {/* Step 1: Email Input */}
                {newsletterStep === 1 && (
                  <form onSubmit={handleEmailContinue}>
                    <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 mb-4">
                      <input
                        type="email"
                        placeholder="Enter your email address"
                        value={newsletterEmail}
                        onChange={(e) => setNewsletterEmail(e.target.value)}
                        className="flex-1 px-4 sm:px-6 py-3 sm:py-4 rounded-lg sm:rounded-xl bg-white/10 border border-white/20 focus:outline-none focus:ring-2 focus:ring-red-500/50 text-white placeholder-white/50 text-sm sm:text-base"
                        required
                      />
                      <button
                        type="submit"
                        className="px-6 sm:px-8 py-3 sm:py-4 bg-gradient-to-r from-red-500 to-red-600 text-white rounded-lg sm:rounded-xl font-semibold shadow-lg shadow-red-500/30 hover:shadow-red-500/50 hover:scale-[1.03] active:scale-[0.97] transition-all duration-200 flex items-center justify-center gap-2 group text-sm sm:text-base"
                      >
                        Continue
                        <ArrowRight className="w-4 h-4 sm:w-5 sm:h-5 group-hover:translate-x-1 transition-transform" />
                      </button>
                    </div>
                  </form>
                )}

                {/* Step 2: Name Fields */}
                {newsletterStep === 2 && (
                  <form onSubmit={handleNewsletterSubmit}>
                    <div className="mb-4">
                      <p className="text-white/70 text-sm mb-4">
                        Great! We have your email: <span className="text-red-400 font-medium">{newsletterEmail}</span>
                      </p>
                      <p className="text-white/60 text-sm mb-4">
                        Add your name (optional) to personalize your newsletter experience.
                      </p>
                      
                      <div className="grid grid-cols-2 gap-3 mb-4">
                        <input
                          type="text"
                          placeholder="First name (optional)"
                          value={newsletterFirstName}
                          onChange={(e) => setNewsletterFirstName(e.target.value)}
                          className="px-4 py-3 rounded-lg bg-white/10 border border-white/20 focus:outline-none focus:ring-2 focus:ring-red-500/50 text-white placeholder-white/50 text-sm"
                        />
                        <input
                          type="text"
                          placeholder="Last name (optional)"
                          value={newsletterLastName}
                          onChange={(e) => setNewsletterLastName(e.target.value)}
                          className="px-4 py-3 rounded-lg bg-white/10 border border-white/20 focus:outline-none focus:ring-2 focus:ring-red-500/50 text-white placeholder-white/50 text-sm"
                        />
                      </div>
                      
                      <div className="flex gap-3">
                        <button
                          type="button"
                          onClick={handleBackToEmail}
                          className="px-6 py-3 bg-white/10 hover:bg-white/20 text-white rounded-lg font-medium transition-all duration-200 flex items-center gap-2"
                        >
                          ← Back
                        </button>
                        <button
                          type="submit"
                          disabled={isNewsletterSubmitting}
                          className="flex-1 px-6 py-3 bg-gradient-to-r from-red-500 to-red-600 disabled:from-red-800 disabled:to-red-900 disabled:cursor-not-allowed text-white rounded-lg font-semibold shadow-lg shadow-red-500/30 hover:shadow-red-500/50 hover:scale-[1.03] active:scale-[0.97] transition-all duration-200 flex items-center justify-center gap-2 group"
                        >
                          {isNewsletterSubmitting ? (
                            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                          ) : (
                            <>
                              Subscribe
                              <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                            </>
                          )}
                        </button>
                      </div>
                    </div>
                  </form>
                )}

                {/* Step 3: Success Message */}
                {newsletterStep === 3 && (
                  <div className="text-center">
                    <div className="mb-4">
                      <div className="w-16 h-16 mx-auto mb-4 bg-green-500/20 rounded-full flex items-center justify-center">
                        <svg className="w-8 h-8 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                        </svg>
                      </div>
                      <h3 className="text-xl font-semibold text-green-400 mb-2">Welcome to our newsletter!</h3>
                      <p className="text-white/80">
                        You're all set! We'll keep you updated with our latest projects and innovations.
                      </p>
                    </div>
                  </div>
                )}
                
                {/* Error Message */}
                {newsletterMessage && newsletterMessageType === "error" && (
                  <div className="mb-4 p-3 rounded-lg text-sm bg-red-900/50 text-red-300 border border-red-700/50">
                    {newsletterMessage}
                  </div>
                )}
              </div>
              <p className="text-xs sm:text-sm text-white/50 mt-4">
                🔒 We respect your privacy. Unsubscribe at any time.
              </p>
            </div>
          </div>
        </div>
      </section>

    </main>
  );
};

export default HomePage;
