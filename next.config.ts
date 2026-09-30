import type { NextConfig } from "next";

const isDev = process.env.NODE_ENV !== "production";

/*
 * Content Security Policy. Next.js inlines small bootstrap scripts, so scripts allow 'unsafe-inline'
 * (a nonce would force every page to render dynamically); everything else is locked to this site.
 * Map tiles are images from an outside tile server, so img-src allows https:.
 */
const CSP = [
  "default-src 'self'",
  `script-src 'self' 'unsafe-inline'${isDev ? " 'unsafe-eval'" : ""}`,
  "style-src 'self' 'unsafe-inline'",
  "img-src 'self' data: blob: https:",
  "font-src 'self' data:",
  `connect-src 'self'${isDev ? " ws:" : ""}`,
  "object-src 'none'",
  "base-uri 'self'",
  "form-action 'self'",
  "frame-ancestors 'none'",
].join("; ");

const SECURITY_HEADERS = [
  { key: "Content-Security-Policy", value: CSP },
  { key: "X-Content-Type-Options", value: "nosniff" },
  { key: "X-Frame-Options", value: "DENY" },
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  // Location is used for pickup pins and opt-in live sharing; nothing else is needed.
  { key: "Permissions-Policy", value: "geolocation=(self), camera=(), microphone=(), payment=(), usb=(), interest-cohort=()" },
  { key: "Cross-Origin-Opener-Policy", value: "same-origin" },
  ...(isDev ? [] : [{ key: "Strict-Transport-Security", value: "max-age=31536000; includeSubDomains" }]),
];

const nextConfig: NextConfig = {
  // PGlite ships a WASM Postgres build; load it from node_modules instead of bundling it.
  serverExternalPackages: ["@electric-sql/pglite"],
  poweredByHeader: false,
  experimental: {
    serverActions: {
      // Room for one optional food photo (validated to 2 MB) plus form fields.
      bodySizeLimit: "3mb",
    },
  },
  async headers() {
    return [{ source: "/:path*", headers: SECURITY_HEADERS }];
  },
};

export default nextConfig;
