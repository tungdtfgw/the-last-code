import { readdirSync, readFileSync, statSync } from "node:fs";
import { dirname, join, relative, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { expect, test } from "vitest";

const root = fileURLToPath(new URL("..", import.meta.url));

/** `src/` files the server imports at runtime. Their runtime imports may only reach each other. */
const SHARED_SRC = [
  "src/storage/progress-repository.ts",
  "src/shell/route-id.ts",
  "src/account/account-rules.ts",
  "src/audio/cue-names.ts",
  "src/game/level-types.ts",
  "src/game/echo-leaks.ts",
  "src/game/echo-line-check.ts",
  "src/game/validate-level.ts",
  "src/story/story-types.ts",
  "src/story/validate-beats.ts",
  "src/story/validate-chapter.ts",
  "src/content/text-fields.ts",
  "src/content/validate-text.ts",
];

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

test("shared src files import only each other at runtime and use no browser or Vite API", () => {
  const shared = new Set(SHARED_SRC.map((f) => join(root, f)));
  for (const file of SHARED_SRC) {
    const full = join(root, file);
    const text = readFileSync(full, "utf8");
    const runtime = importSpecs(text)
      .filter((i) => !i.typeOnly)
      .filter((i) => !(i.spec.startsWith(".") && shared.has(resolve(dirname(full), i.spec.replace(/\.js$/, ".ts")))));
    expect(runtime, file).toEqual([]);
    expect(text, file).not.toMatch(/import\.meta\.glob|\bwindow\.|\bdocument\./);
  }
});
