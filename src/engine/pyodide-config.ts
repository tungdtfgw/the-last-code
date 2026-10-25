/** Pinned Pyodide release (Python 3.14). Verified on jsDelivr 2026-10-24. */
export const PYODIDE_VERSION = "314.0.7";
export const PYODIDE_INDEX_URL = `https://cdn.jsdelivr.net/pyodide/v${PYODIDE_VERSION}/full/`;
export const PYODIDE_MODULE_URL = `${PYODIDE_INDEX_URL}pyodide.mjs`;
/** First load downloads ~10 MB; give slow networks a full minute. */
export const LOAD_TIMEOUT_MS = 60_000;
/** Wall-clock budget for one run (catches hangs inside C code, e.g. 10**10**8). */
export const RUN_TIMEOUT_MS = 5_000;
