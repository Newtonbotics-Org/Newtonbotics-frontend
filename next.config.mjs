/** @type {import('next').NextConfig} */
function getApiOrigin(raw) {
  if (!raw) return undefined;

  try {
    const value = /^[a-z][a-z\d+.-]*:\/\//i.test(raw) ? raw : `https://${raw}`;
    const url = new URL(value);
    return url.protocol === "http:" || url.protocol === "https:" ? url.origin : undefined;
  } catch {
    return undefined;
  }
}

const apiOrigin = getApiOrigin(process.env.NEXT_PUBLIC_API_URL);
const connectSources = [
  "'self'",
  apiOrigin,
  "https://api.cloudinary.com",
  "https://res.cloudinary.com",
  "https://upload-widget.cloudinary.com",
].filter(Boolean).join(" ");

const contentSecurityPolicyReportOnly = [
  "default-src 'self'",
  "base-uri 'self'",
  "object-src 'none'",
  "form-action 'self'",
  "script-src 'self' https://upload-widget.cloudinary.com",
  "style-src 'self'",
  "img-src 'self' data: blob: https://res.cloudinary.com https://images.unsplash.com https://media.licdn.com https://assets.robotsguide.com https://images-cdn.ubuy.co.in https://www.unmannedsystemstechnology.com https://tihan.iith.ac.in https://www.boxfishrobotics.com https://*.cloudfront.net",
  "font-src 'self' data:",
  `connect-src ${connectSources}`,
  "frame-src 'self' https://www.google.com https://upload-widget.cloudinary.com https://widget.cloudinary.com",
  "media-src 'self' blob: data: https://res.cloudinary.com",
  "frame-ancestors 'self'",
].join("; ");

const nextConfig = {
  eslint: {
    // Temporarily ignore ESLint during builds to avoid serialization errors
    // ESLint will still run during development and via 'npm run lint'
    ignoreDuringBuilds: true,
  },
  typescript: {
    // Warning: This allows production builds to successfully complete even if
    // your project has type errors.
    ignoreBuildErrors: false,
  },
  async redirects() {
    return [
      {
        source: "/",
        destination: "/DashBoard",
        permanent: true,
      },
    ];
  },
  async headers() {
    return [
      {
        source: "/:path*",
        headers: [
          { key: "X-Content-Type-Options", value: "nosniff" },
          { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
          { key: "X-Frame-Options", value: "SAMEORIGIN" },
          { key: "Content-Security-Policy", value: "frame-ancestors 'self'" },
          { key: "Content-Security-Policy-Report-Only", value: contentSecurityPolicyReportOnly },
        ],
      },
    ];
  },
  images: {
    formats: ["image/avif", "image/webp"],
    deviceSizes: [640, 750, 828, 1080, 1200, 1920],
    imageSizes: [16, 32, 48, 64, 96, 128, 256, 384],
    minimumCacheTTL: 60 * 60 * 24 * 30,
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'res.cloudinary.com',
        port: '',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: 'via.placeholder.com',
        port: '',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: 'images.unsplash.com',
        port: '',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: 'picsum.photos',
        port: '',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: 'example.com',
        port: '',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: 'assets.robotsguide.com',
        port: '',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: 'images-cdn.ubuy.co.in',
        port: '',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: 'media.licdn.com',
        port: '',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: 'www.unmannedsystemstechnology.com',
        port: '',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: 'tihan.iith.ac.in',
        port: '',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: 'www.boxfishrobotics.com',
        port: '',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: '*.cloudfront.net',
        port: '',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: 'd2t1xqejof9utc.cloudfront.net',
        port: '',
        pathname: '/**',
      },
    ],
  },
};

export default nextConfig;
