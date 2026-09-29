import type { NextConfig } from "next";
import { config } from "dotenv";
import path from "path";

// Load the root .env file
const envPath = path.resolve(process.cwd(), '../.env');
config({ path: envPath });

const nextConfig: NextConfig = {
  env: {
    NEXT_PUBLIC_MAPBOX_TOKEN: process.env.NEXT_PUBLIC_MAPBOX_TOKEN,
  },
};

export default nextConfig;
