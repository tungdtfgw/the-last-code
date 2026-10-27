import { handle } from "../server/router.js";

/** Vercel Function: every `/api/*` request goes to the one router. */
export default { fetch: handle };
