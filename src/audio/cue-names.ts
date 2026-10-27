/** Every sound cue by name. Kept apart from the recipes so validators (also run on the server) need no Web Audio code. */
export const CUES = [
  "key_blip",
  "terminal_line",
  "run",
  "scan_pass",
  "scan_reject",
  "locked_blocked",
  "alarm",
  "siren",
  "gate_open",
  "gate_close_far",
  "star",
  "echo_voice",
  "teletype",
  "objective_lock",
  "pulse",
  "glitch",
] as const;
export type Cue = (typeof CUES)[number];
