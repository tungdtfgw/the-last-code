import { existsSync, readdirSync, readFileSync, statSync } from "node:fs";
import { join } from "node:path";
import { fileURLToPath } from "node:url";
import { expect, test } from "vitest";

const buildDir = fileURLToPath(new URL("../dist", import.meta.url));

// Meaningful after `npm run build`: the server code must never reach the browser bundle.
test.skipIf(!existsSync(buildDir))("the client build carries no server code", () => {
  const files: string[] = [];
  const walk = (dir: string) => {
    for (const name of readdirSync(dir)) {
      const full = join(dir, name);
      if (statSync(full).isDirectory()) walk(full);
      else if (/\.(js|mjs|html)$/.test(name)) files.push(full);
    }
  };
  walk(buildDir);
  const leaks = files.filter((f) => /nodemailer|node:sqlite|password_md5/.test(readFileSync(f, "utf8")));
  expect(leaks).toEqual([]);
});
