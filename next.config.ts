import path from "node:path";
import { fileURLToPath } from "node:url";
import type { NextConfig } from "next";
import { withSentryConfig } from "@sentry/nextjs";

// Pin Turbopack to the app root so it does not mis-infer `src/app` as the workspace
// (seen as "Next.js package not found" after dependency installs while `pnpm dev` runs).
const projectRoot = path.dirname(fileURLToPath(import.meta.url));

const nextConfig: NextConfig = {
  poweredByHeader: false,
  reactStrictMode: true,
  allowedDevOrigins: ["127.0.0.1"],
  turbopack: {
    root: projectRoot,
  },
};

export default withSentryConfig(nextConfig, {
  silent: true,
  widenClientFileUpload: false,
  disableLogger: true,
  sourcemaps: {
    disable: !process.env.SENTRY_AUTH_TOKEN,
  },
});
