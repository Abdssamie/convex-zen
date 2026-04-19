import { execSync } from "node:child_process";
import { readProjectConfig } from "./_project-config.mjs";

const config = readProjectConfig();
const workerName = config.workerName;

const CLOUDFLARE_SECRETS = ["SITE_URL", "VITE_CONVEX_URL"];

const CONVEX_SECRETS = [
  "SITE_URL",
  "AUTH_TRUSTED_ORIGINS",
  "BETTER_AUTH_SECRET",
  "ADMIN_EMAIL",
  "BREVO_API_KEY",
  "BREVO_WEBHOOK_TOKEN",
  "BREVO_APP_NAME",
  "BREVO_SENDER_EMAIL",
  "BREVO_SENDER_NAME",
  "BREVO_REPLY_TO_EMAIL",
  "BREVO_REPLY_TO_NAME",
  "R2_TOKEN",
  "R2_ACCESS_KEY_ID",
  "R2_SECRET_ACCESS_KEY",
  "R2_ENDPOINT",
  "R2_BUCKET",
  "POLAR_ORGANIZATION_TOKEN",
  "POLAR_WEBHOOK_SECRET",
  "POLAR_SERVER",
];

function syncCloudflare() {
  console.log(`🚀 Syncing secrets to Cloudflare Worker: ${workerName}`);
  for (const name of CLOUDFLARE_SECRETS) {
    const value = process.env[name];
    if (!value) {
      console.warn(`  ⚠️  Skipping ${name}: No value provided in environment.`);
      continue;
    }

    try {
      console.log(`  - Pushing ${name} to Worker...`);
      // Strictly using Workers secret command (double diamonds)
      execSync(`echo "${value}" | npx --yes wrangler secret put ${name} --name ${workerName}`, {
        stdio: "inherit",
      });
    } catch (error) {
      console.error(`\n❌ CRITICAL FAILURE: Failed to sync ${name} to Cloudflare Worker.`);
      console.error(error.message);
      process.exit(1);
    }
  }
}

function syncConvex() {
  console.log("🚀 Syncing secrets to Convex");
  for (const name of CONVEX_SECRETS) {
    const value = process.env[name];
    if (!value) {
      console.warn(`  ⚠️  Skipping ${name}: No value provided in environment.`);
      continue;
    }

    try {
      console.log(`  - Pushing ${name}...`);
      execSync(`npx convex env set ${name} "${value}"`, {
        cwd: "./packages/backend",
        stdio: "inherit",
      });
    } catch (error) {
      console.error(`\n❌ CRITICAL FAILURE: Failed to sync ${name} to Convex.`);
      console.error(error.message);
      process.exit(1);
    }
  }
}

const target = process.argv[2];

if (target === "cloudflare") {
  syncCloudflare();
} else if (target === "convex") {
  syncConvex();
} else {
  syncConvex();
  syncCloudflare();
}
