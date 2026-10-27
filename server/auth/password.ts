import { createHash, randomBytes, timingSafeEqual } from "node:crypto";

// md5(salt + password), chosen by the project owner with the risk on record
// (docs/quyet-dinh-ky-thuat.md, QĐ-07). Kept in this one file so a stronger
// algorithm only has to replace these functions.

export const newSalt = () => randomBytes(16).toString("hex");

export const hashPassword = (password: string, salt: string) =>
  createHash("md5").update(salt + password, "utf8").digest("hex");

export function verifyPassword(password: string, salt: string, expectedHex: string): boolean {
  const actual = Buffer.from(hashPassword(password, salt), "hex");
  const expected = Buffer.from(expectedHex, "hex");
  return actual.length === expected.length && timingSafeEqual(actual, expected);
}
