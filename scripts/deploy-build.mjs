import { spawnSync } from "node:child_process";

const npmCommand = process.platform === "win32" ? "npm.cmd" : "npm";
const migrationUrl = process.env.DATABASE_URL_UNPOOLED ?? process.env.DIRECT_URL ?? process.env.DATABASE_URL;
const migrationSource = process.env.DATABASE_URL_UNPOOLED
  ? "DATABASE_URL_UNPOOLED"
  : process.env.DIRECT_URL
    ? "DIRECT_URL"
    : "DATABASE_URL";

if (!migrationUrl) {
  console.error("Missing DATABASE_URL. Neon must be connected before building.");
  process.exit(1);
}

function run(script, env = process.env) {
  const result = spawnSync(npmCommand, ["run", script], { env, stdio: "inherit" });
  if (result.error) throw result.error;
  if (result.status !== 0) process.exit(result.status ?? 1);
}

console.log(`Running database migrations with ${migrationSource}.`);
run("db:migrate", { ...process.env, DATABASE_URL: migrationUrl });
run("db:seed", { ...process.env, DATABASE_URL: migrationUrl });
run("build:app");
