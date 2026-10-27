import { handleGateway, type Env } from "./gateway";

// workerd accepts only handlers as exports of the entry module, so the logic and its constants live in gateway.ts.
export default {
  fetch: (request: Request, env: Env) => handleGateway(request, env),
};
