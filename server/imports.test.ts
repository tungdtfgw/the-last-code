import { readdirSync, readFileSync, statSync } from "node:fs";
import { join, relative } from "node:path";
import { fileURLToPath } from "node:url";
import { expect, test } from "vitest";

const root = fileURLToPath(new URL("..", import.meta.url));

/** `src/` files the server imports at runtime. They must stay free of other runtime imports. */
const SHARED_SRC = ["src/storage/progress-repository.ts", "src/shell/route-id.ts", "src/account/account-rules.ts"];

function walk(dir: string, out: string[] = []) {
  for (const name of readdirSync(dir)) {
    const full = join(dir, name);
    if (statSync(full).isDirectory()) walk(full, out);
    else if (/\.ts$/.test(name) && !/\.test\.ts$/.test(name)) out.push(full);
  }
  return out;
}

const importSpecs = (text: string) =>
  [...text.matchAll(/(?:^|\s)(?:import|export)\s(?:type\s)?[^;'"]*?from\s+["']([^"']+)["']|import\(\s*["']([^"']+)["']\s*\)/g)].map(
    (m) => ({ spec: m[1] ?? m[2], typeOnly: /^\s*(?:import|export)\s+type\s/.test(m[0]) }),
  );

// Vercel compiles each server file on its own and does not add extensions, so a
// relative import without `.js` works locally but fails with ERR_MODULE_NOT_FOUND once deployed.
test("server-side relative imports carry a .js extension", () => {
  const files = [...walk(join(root, "server")), ...walk(join(root, "api")), ...SHARED_SRC.map((f) => join(root, f))];
  const offenders: string[] = [];
  for (const file of files) {
    for (const { spec, typeOnly } of importSpecs(readFileSync(file, "utf8"))) {
      if (spec.startsWith(".") && !typeOnly && !spec.endsWith(".js")) offenders.push(`${relative(root, file)}: ${spec}`);
    }
  }
  expect(offenders).toEqual([]);
});

test("shared src files have no runtime imports", () => {
  for (const file of SHARED_SRC) {
    const runtime = importSpecs(readFileSync(join(root, file), "utf8")).filter((i) => !i.typeOnly);
    expect(runtime, file).toEqual([]);
  }
});
