#!/usr/bin/env node
// Real-Safari smoke test through safaridriver (W3C WebDriver), for machines where Playwright's
// WebKit build cannot launch (it segfaults on macOS 26.0). Needs Safari's
// "Develop > Allow Remote Automation" (or once: `sudo safaridriver --enable`).
//
// Starts `vite preview` on 4173 (after `npm run build`) and safaridriver on 4444, runs the
// checks, and always stops both processes.
//
// Checks: Pyodide boots in a module worker; original code → scanner rejection without a
// traceback; a locked line cannot be typed into; 6.7 → 3 stars; first click unlocks Web Audio
// (AudioContext "running", ambient + cues recorded); the counter-attack siren and star cues fire.

import { spawn } from "node:child_process";
import { setTimeout as sleep } from "node:timers/promises";

const APP = "http://localhost:4173/#/level/1.4";
const WD = "http://localhost:4444";
const children = [];
let session = null;

function start(cmd, args) {
  const child = spawn(cmd, args, { stdio: "ignore" });
  children.push(child);
  return child;
}

async function wd(method, path, body) {
  const res = await fetch(`${WD}${path}`, {
    method,
    headers: { "Content-Type": "application/json" },
    body: body ? JSON.stringify(body) : undefined,
  });
  const json = await res.json();
  if (json.value && json.value.error) throw new Error(`${json.value.error}: ${json.value.message}`);
  return json.value;
}

const exec = (script, args = []) => wd("POST", `/session/${session}/execute/sync`, { script, args });
const find = async (css) => (await wd("POST", `/session/${session}/element`, { using: "css selector", value: css }))["element-6066-11e4-a92e-4f6c5c4e2b84"];
const click = async (css) => wd("POST", `/session/${session}/element/${await find(css)}/click`, {});
const keys = async (css, text) => wd("POST", `/session/${session}/element/${await find(css)}/value`, { text });

async function waitFor(desc, fn, timeoutMs = 120_000) {
  const end = Date.now() + timeoutMs;
  for (;;) {
    const v = await fn().catch(() => null);
    if (v) return v;
    if (Date.now() > end) throw new Error(`timeout waiting for ${desc}`);
    await sleep(250);
  }
}

async function waitUp(url) {
  await waitFor(url, async () => (await fetch(url)).ok || true, 30_000);
}

const runReady = () => exec(`const b=document.querySelector('[data-testid="run-button"]');return b&&b.getAttribute('aria-disabled')!=='true'&&b.querySelector('span').textContent==='CHẠY';`);
const terminal = () => exec(`return document.querySelector('.terminal-scroll').innerText;`);
const lockedLines = () => exec(`return [...document.querySelectorAll('.cm-content .cm-line')].slice(1,4).map(l=>l.textContent);`);
const probe = () => exec(`return (window.__TLC_AUDIO_PROBE__||[]).map(e=>e.event);`);

const KEY = { end: "", home: "", shift: "", meta: "", nul: "", enter: "", backspace: "" };

async function main() {
  start("npx", ["vite", "preview", "--port", "4173", "--strictPort"]);
  start("safaridriver", ["-p", "4444"]);
  await waitUp(APP);
  await waitUp(`${WD}/status`);
  session = (await wd("POST", "/session", { capabilities: { alwaysMatch: { browserName: "safari" } } })).sessionId;
  await wd("POST", `/session/${session}/url`, { url: APP });
  // Instrument audio before the first gesture (the probe is read by the engine at call time).
  await exec(`window.__TLC_AUDIO_PROBE__=[];`);
  await waitFor("Python ready", runReady);
  console.log("ok  Pyodide booted in a module worker");

  await click('[data-testid="run-button"]');
  await waitFor("first run", async () => (await terminal()).includes("CỔNG: ĐÓNG"), 30_000);
  const t1 = await terminal();
  if (!t1.includes("MÁY QUÉT TỪ CHỐI") || t1.includes("TRUY VẾT")) throw new Error("original code result wrong");
  console.log("ok  original code → scanner rejection, no traceback");

  const audio = await exec(`return window.__TLC_AUDIO_PROBE__.map(e=>e.event);`);
  if (!audio.includes("unlock") || !audio.includes("ambient") || !audio.includes("run")) throw new Error(`audio not unlocked: ${audio}`);
  console.log("ok  first click unlocked Web Audio (ambient + run cue)");

  const before = await lockedLines();
  await click(".cm-content .cm-line:nth-child(3)");
  await keys(".cm-content", "xyz" + KEY.backspace);
  const after = await lockedLines();
  if (JSON.stringify(before) !== JSON.stringify(after)) throw new Error(`locked line changed: ${after}`);
  console.log("ok  locked line refused typing");

  // Replace line 7 with the 3-star solution, line 10 and 12 with their fixes.
  const setLine = async (n, text) => {
    await click(`.cm-content .cm-line:nth-child(${n})`);
    await keys(".cm-content", KEY.end + KEY.shift + KEY.home + KEY.nul + KEY.backspace + text);
  };
  await setLine(7, "ma_xac_thuc = int(float(tuoi)) * 100 + int(float(cap_do))");
  await setLine(10, "chi_so = round(float(chieu_cao) * 2, 2)");
  await setLine(12, "hop_le = True");
  await waitFor("ready", runReady, 30_000);
  await click('[data-testid="run-button"]');
  await waitFor("3-star dialog", () => exec(`const d=document.querySelector('dialog[open]');return d&&d.innerText.includes('Cổng mở hoàn toàn');`), 30_000);
  console.log("ok  6.7 → 3 stars in Safari");
  const cues = await probe();
  for (const c of ["scan_pass", "siren", "gate_open", "star"]) if (!cues.includes(c)) throw new Error(`missing cue ${c}: ${cues}`);
  console.log("ok  scan_pass, siren, gate_open and star cues fired");
  console.log("Safari smoke: all checks passed");
}

main()
  .catch((err) => {
    console.error(`FAIL ${err.message}`);
    process.exitCode = 1;
  })
  .finally(async () => {
    if (session) await wd("DELETE", `/session/${session}`).catch(() => {});
    for (const c of children) c.kill("SIGTERM");
  });
