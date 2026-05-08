import { execSync } from "node:child_process";

if (process.env.CI !== "true") {
	execSync("npx lefthook install", { stdio: "inherit" });
} else {
	console.log("Skipping Lefthook installation in CI");
}
