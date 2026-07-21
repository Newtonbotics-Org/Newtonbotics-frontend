import { Orbitron } from "next/font/google";
import "./globals.css";
import Navbar from "./components/navbar";
import Footer from "./components/footer";
import CustomCursor from "./components/CustomCursor";
import { AuthProvider } from "../contexts/AuthContext";
import {
  SITE_URL,
  SITE_NAME,
  SITE_TAGLINE,
  DEFAULT_OG_IMAGE,
} from "../lib/site";

const orbitron = Orbitron({
  variable: "--font-orbitron",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700", "800", "900"],
  display: "swap",
});

export const metadata = {
  metadataBase: new URL(SITE_URL),
  title: {
    default: `${SITE_NAME} - Advancing Robotics & AI Research | Rishihood University`,
    template: "%s | NewtonBotics",
  },
  description:
    "Join NewtonBotics Robotics Lab at Rishihood University - where innovation meets precision in robotics excellence. Explore cutting-edge projects, research areas, events, and join our community of researchers, students, and mentors dedicated to advancing robotics and AI technology.",
  keywords: [
    "NewtonBotics",
    "newtonbotics.in",
    "robotics lab",
    "Rishihood University",
    "artificial intelligence",
    "robotics research",
    "humanoid robots",
    "drones",
    "automation",
    "AI projects",
    "Sonipat robotics",
  ],
  authors: [{ name: "NewtonBotics Team" }],
  creator: SITE_NAME,
  publisher: "NewtonBotics",
  applicationName: "NewtonBotics",
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-video-preview": -1,
      "max-image-preview": "large",
      "max-snippet": -1,
    },
  },
  alternates: {
    canonical: "/",
  },
  openGraph: {
    title: `${SITE_NAME} - Advancing Robotics & AI Research`,
    description: `${SITE_TAGLINE} Explore projects, research, events, and the robotics community at Rishihood University.`,
    type: "website",
    locale: "en_IN",
    siteName: SITE_NAME,
    url: SITE_URL,
    images: [
      {
        url: DEFAULT_OG_IMAGE,
        width: 1200,
        height: 630,
        alt: `${SITE_NAME} - Innovation Hub`,
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: `${SITE_NAME} - Advancing Robotics & AI Research`,
    description: SITE_TAGLINE,
    images: [DEFAULT_OG_IMAGE],
  },
  category: "Education",
  icons: {
    icon: [
      { url: "/favicon.ico", sizes: "any" },
      { url: "/favicon-32x32.png", sizes: "32x32", type: "image/png" },
      { url: "/favicon-16x16.png", sizes: "16x16", type: "image/png" },
    ],
    apple: [{ url: "/apple-icon.png", sizes: "180x180", type: "image/png" }],
  },
};

export const viewport = {
  width: "device-width",
  initialScale: 1,
  themeColor: "#000000",
};

export default function RootLayout({ children }) {
  const organizationSchema = {
    "@context": "https://schema.org",
    "@type": "Organization",
    name: SITE_NAME,
    alternateName: ["NewtonBotics", "Newton Botics"],
    url: SITE_URL,
    logo: `${SITE_URL}/white-logo.webp`,
    image: DEFAULT_OG_IMAGE,
    description:
      "NewtonBotics Robotics Lab at Rishihood University - Advancing robotics and AI research through innovation, collaboration, and hands-on learning.",
    address: {
      "@type": "PostalAddress",
      streetAddress: "Academic Block, Room 407",
      addressLocality: "Sonipat",
      addressRegion: "Haryana",
      postalCode: "131021",
      addressCountry: "IN",
    },
    contactPoint: {
      "@type": "ContactPoint",
      contactType: "General Inquiry",
      email: "newtonbotics.club@rishihood.edu.in",
      availableLanguage: ["English", "Hindi"],
    },
    sameAs: [
      "https://www.instagram.com/newtonbotics",
      "https://www.linkedin.com/company/newtonbotics",
    ],
    memberOf: {
      "@type": "EducationalOrganization",
      name: "Rishihood University",
      url: "https://rishihood.edu.in",
    },
  };

  const websiteSchema = {
    "@context": "https://schema.org",
    "@type": "WebSite",
    name: SITE_NAME,
    alternateName: "NewtonBotics",
    url: SITE_URL,
    description:
      "Official website of NewtonBotics Robotics Lab - A hub for robotics innovation, research, and education.",
    publisher: {
      "@type": "Organization",
      name: SITE_NAME,
      logo: {
        "@type": "ImageObject",
        url: `${SITE_URL}/white-logo.webp`,
      },
    },
    inLanguage: "en-IN",
  };

  const educationalOrgSchema = {
    "@context": "https://schema.org",
    "@type": "EducationalOrganization",
    name: SITE_NAME,
    url: SITE_URL,
    description:
      "Student-led robotics and AI research lab at Rishihood University.",
    parentOrganization: {
      "@type": "CollegeOrUniversity",
      name: "Rishihood University",
    },
    address: {
      "@type": "PostalAddress",
      streetAddress: "Academic Block, Room 407",
      addressLocality: "Sonipat",
      addressRegion: "Haryana",
      addressCountry: "IN",
    },
  };

  return (
    <html lang="en">
      <head>
        <link rel="preconnect" href="https://fonts.cdnfonts.com" crossOrigin="anonymous" />
        <link
          rel="preload"
          as="image"
          href="/heropagebg.webp"
          type="image/webp"
          imageSrcSet="/heropagebg-mobile.webp 560w, /heropagebg.webp 960w"
          imageSizes="(max-width: 768px) 18rem, 30rem"
          fetchPriority="high"
        />
        <link
          rel="preload"
          as="image"
          href="/white-logo.webp"
          type="image/webp"
        />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(organizationSchema) }}
        />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(websiteSchema) }}
        />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(educationalOrgSchema) }}
        />
      </head>
      <body className={`${orbitron.variable} font-sans antialiased`}>
        <AuthProvider>
          <CustomCursor />
          <Navbar />
          {children}
          <Footer />
        </AuthProvider>
      </body>
    </html>
  );
}
