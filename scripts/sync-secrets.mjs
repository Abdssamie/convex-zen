import { execSync } from "node:child_process";
import fs from "node:fs";
import path from "node:path";
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
      execSync(`echo "${value}" | npx --yes wrangler secret put ${name} --name ${workerName}`, {
        stdio: "inherit",
      });
    } catch (error) {
      console.error(`\n❌ CRITICAL FAILURE: Failed to sync ${name} to Cloudflare Worker.`);
      console.error(
        "Check if this variable already exists as a PLAIN TEXT variable in the dashboard.",
      );
      console.error(error.message);
      process.exit(1);
    }
  }
}

function syncConvex() {
  console.log("🚀 Batch syncing secrets to Convex");
  const lines = [];

  for (const name of CONVEX_SECRETS) {
    const value = process.env[name];
    if (value) {
      lines.push(`${name}="${value.replace(/"/g, '\\"')}"`);
    } else {
      console.warn(`  ⚠️  Secret ${name} not found in environment, skipping.`);
    }
  }

  if (lines.length === 0) {
    console.log("  ∅ No secrets to sync to Convex.");
    return;
  }

  const tempPath = path.resolve("./packages/backend/.env.sync.temp");
  try {
    fs.writeFileSync(tempPath, lines.join("\n"));
    console.log(`  - Pushing ${lines.length} secrets in one batch...`);

    execSync(`npx convex env set --from-file .env.sync.temp --force`, {
      cwd: "./packages/backend",
      stdio: "inherit",
    });
  } catch (error) {
    console.error(`\n❌ CRITICAL FAILURE: Failed to batch sync secrets to Convex.`);
    console.error(error.message);
    process.exit(1);
  } finally {
    if (fs.existsSync(tempPath)) {
      fs.unlinkSync(tempPath);
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
