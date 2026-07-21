/**
 * Canonical production site URL for SEO, sitemap, and structured data.
 * Live site redirects newtonbotics.in → www.newtonbotics.in
 */
export const SITE_URL = (
  process.env.NEXT_PUBLIC_SITE_URL?.trim() || "https://www.newtonbotics.in"
).replace(/\/$/, "");

export const SITE_NAME = "NewtonBotics Robotics Lab";
export const SITE_TAGLINE = "Building the future, one robot at a time.";
export const DEFAULT_OG_IMAGE = `${SITE_URL}/og-image.jpg`;
