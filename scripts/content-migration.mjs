// Writes the migration that gives a new level (or chapter) its first text in D1:
//   npm run content:migration -- <text-document.json> [--doc level:1.5]
// The server code is TypeScript with `.js` imports, so it is loaded through Vite's module runner.
import { fileURLToPath } from "node:url";
import { runnerImport } from "vite";

const cli = fileURLToPath(new URL("../server/content/content-migration-cli.ts", import.meta.url));
const { module } = await runnerImport(cli);
process.exitCode = module.runCli(process.argv.slice(2));
