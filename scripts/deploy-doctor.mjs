import fs from "node:fs";
import path from "node:path";

import {
  getWebWranglerConfig,
  projectConfigPath,
  readProjectConfig,
  repoRoot,
} from "./_project-config.mjs";

function fail(message) {
  console.error(`ERROR: ${message}`);
  process.exitCode = 1;
}

function warn(message) {
  console.warn(`WARN: ${message}`);
}

function checkRequiredEnv(names, source, label) {
  for (const name of names) {
    if (!source[name]) {
      fail(`Missing ${label} env var: ${name}`);
    }
  }
}

const projectConfig = readProjectConfig();
const wranglerPath = path.join(repoRoot, "apps/web/wrangler.jsonc");
const wranglerConfig = JSON.parse(fs.readFileSync(wranglerPath, "utf8"));
const expectedWranglerConfig = getWebWranglerConfig(projectConfig);

if (wranglerConfig.name !== expectedWranglerConfig.name) {
  fail(
    `apps/web/wrangler.jsonc name does not match project.config.json (${wranglerConfig.name} !== ${expectedWranglerConfig.name})`,
  );
}

if (wranglerConfig.main !== expectedWranglerConfig.main) {
  fail(`apps/web/wrangler.jsonc main should be ${expectedWranglerConfig.main}`);
}

if (wranglerConfig.compatibility_date !== expectedWranglerConfig.compatibility_date) {
  fail("apps/web/wrangler.jsonc compatibility_date is out of sync with project.config.json");
}

const frontendEnv = Object.fromEntries(
  projectConfig.env.frontend.map((name) => [name, process.env[name]]),
);
checkRequiredEnv(projectConfig.env.frontend, frontendEnv, "frontend");

const ciSecrets = ["CONVEX_DEPLOY_KEY", "CLOUDFLARE_API_TOKEN", "CLOUDFLARE_ACCOUNT_ID"];
if (process.env.GITHUB_ACTIONS === "true") {
  checkRequiredEnv(ciSecrets, process.env, "CI");
} else {
  for (const name of ciSecrets) {
    if (!process.env[name]) {
      warn(`Missing CI env var outside GitHub Actions: ${name}`);
    }
  }
}

console.log(`Deploy doctor passed for ${projectConfig.projectName}`);
console.log(`Project config: ${path.relative(repoRoot, projectConfigPath)}`);
console.log(`Worker config: ${path.relative(repoRoot, wranglerPath)}`);

if (process.exitCode) {
  process.exit(process.exitCode);
}
