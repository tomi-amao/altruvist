import fs from "fs";
import path from "path";

/**
 * Checks that all environment variables listed in .env.example are set in process.env.
 * Throws an error and exits the process if any are missing.
 */
export function checkEnvVars() {
  const envExamplePath = path.resolve(process.cwd(), ".env.example");
  if (!fs.existsSync(envExamplePath)) {
    console.warn(".env.example file not found. Skipping env check.");
    return;
  }
  const example = fs.readFileSync(envExamplePath, "utf-8");
  const requiredVars = example
    .split("\n")
    .map((line) => line.trim())
    .filter((line) => line && !line.startsWith("#") && line.includes("="))
    .map((line) => line.split("=")[0]);

  const missing = requiredVars.filter((key) => !(key in process.env));
  if (missing.length > 0) {
    console.error(
      `Missing required environment variables: ${missing.join(", ")}`,
    );
    process.exit(1);
  }
}
