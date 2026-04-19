import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import dotenv from "dotenv";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const secretsPath = path.resolve(__dirname, "../.env.secrets");

if (!fs.existsSync(secretsPath)) {
  console.error("ERROR: .env.secrets file not found!");
  console.log("Please create it from .env.secrets.example");
  process.exit(1);
}

const env = dotenv.parse(fs.readFileSync(secretsPath));

const CRITICAL_VARS = [
  "CONVEX_DEPLOY_KEY",
  "CLOUDFLARE_API_TOKEN",
  "CLOUDFLARE_ACCOUNT_ID",
  "SITE_URL",
  "VITE_CONVEX_URL",
];

const SERVICE_VARS = [
  "BETTER_AUTH_SECRET",
  "BREVO_API_KEY",
  "ADMIN_EMAIL",
  "R2_TOKEN",
  "POLAR_ORGANIZATION_TOKEN",
];

let failed = false;

console.log("🔍 Verifying deployment secrets...");

for (const key of CRITICAL_VARS) {
  if (!env[key]) {
    console.error(`❌ MISSING CRITICAL: ${key}`);
    failed = true;
  }
}

for (const key of SERVICE_VARS) {
  if (!env[key]) {
    console.warn(`⚠️  WARNING (Missing Service Key): ${key}`);
  }
}

if (failed) {
  console.error("\n🛑 Secrets verification failed. Fix critical missing vars before pushing.");
  process.exit(1);
}

console.log("\n✅ Secrets verified! You are ready to push to GitHub.");
