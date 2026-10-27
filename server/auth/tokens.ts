import { createHash, randomBytes } from "node:crypto";

/** 32 random bytes as base64url: 43 chars, fits `ROUTE_ID`, safe in a URL hash. */
export const newToken = () => randomBytes(32).toString("base64url");

/** The database only ever stores this digest of a token or session id. */
export const sha256 = (value: string) => createHash("sha256").update(value, "utf8").digest("hex");
