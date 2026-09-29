import type { NextConfig } from "next";
import { config } from "dotenv";
import path from "path";

import fs from "fs";

// Load the root .env file if it exists (local dev)
const envPath = path.resolve(process.cwd(), '../.env');
if (fs.existsSync(envPath)) {
  config({ path: envPath });
}

const nextConfig: NextConfig = {
  output: process.env.BUILD_STANDALONE === "true" ? "standalone" : undefined,
  env: {
    NEXT_MAPBOX_TOKEN: process.env.NEXT_MAPBOX_TOKEN || process.env.NEXT_PUBLIC_MAPBOX_TOKEN,
    NEXT_API_URL: process.env.NEXT_API_URL || process.env.NEXT_PUBLIC_API_URL,
    NEXT_PUBLIC_MAPBOX_TOKEN: process.env.NEXT_MAPBOX_TOKEN || process.env.NEXT_PUBLIC_MAPBOX_TOKEN,
    NEXT_PUBLIC_API_URL: process.env.NEXT_API_URL || process.env.NEXT_PUBLIC_API_URL,
  },
};

export default nextConfig;
