import type { NextConfig } from "next";
import { config } from "dotenv";
import path from "path";

import fs from "fs";

// Load the root .env file if it exists (local dev)
const envPath = path.resolve(process.cwd(), '../.env');
if (fs.existsSync(envPath)) {
  config({ path: envPath });
}

const sanitizeUrl = (val?: string) => {
  if (!val) return val;
  let s = val.trim();
  if (s && !s.startsWith('http://') && !s.startsWith('https://')) {
    s = `https://${s}`;
  }
  return s.replace(/\/+$/, '');
};

const defaultApiUrl = process.env.NODE_ENV === 'production' || process.env.VERCEL
  ? 'https://vajra-production-aad1.up.railway.app'
  : 'http://localhost:8000';

const rawApiUrl = sanitizeUrl(process.env.NEXT_API_URL || process.env.NEXT_PUBLIC_API_URL) || defaultApiUrl;
const rawMapboxToken = (process.env.NEXT_MAPBOX_TOKEN || process.env.NEXT_PUBLIC_MAPBOX_TOKEN || '').trim();

const nextConfig: NextConfig = {
  output: process.env.BUILD_STANDALONE === "true" ? "standalone" : undefined,
  env: {
    NEXT_MAPBOX_TOKEN: rawMapboxToken,
    NEXT_API_URL: rawApiUrl,
    NEXT_PUBLIC_MAPBOX_TOKEN: rawMapboxToken,
    NEXT_PUBLIC_API_URL: rawApiUrl,
  },
};

export default nextConfig;
